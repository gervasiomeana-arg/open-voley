import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
const oldCwd = process.cwd(), root = fs.mkdtempSync(path.join(os.tmpdir(), 'ov-payments-')), realFetch = globalThis.fetch;
process.chdir(root);
process.env.OPENVOLEY_DB_PATH = path.join(root, 'test.db');
process.env.SESSION_SECRET = 'test-payment-secret-with-more-than-32-characters';
process.env.ADMIN_EMAILS = 'admin@example.test';
process.env.MERCADOPAGO_ACCESS_TOKEN = 'test-token';
process.env.APP_URL = 'https://test.invalid';
const { loadAccounts, saveAccounts } = await import('./accountStore');
const store = await import('./commercialStore');
const processing = await import('./paymentProcessing');
const { createSessionToken, verifySessionToken } = await import('./sessionSecurity');
const { commercialRouter } = await import('./commercialRouter');
const { securityMiddleware } = await import('./securityMiddleware');
const { requestProtection } = await import('./requestProtection');
const { securePaymentConfirmation } = await import('./securePaymentConfirmation');
const accounts = [{ id: 'a', email: 'a@example.test' }, { id: 'b', email: 'b@example.test' }, { id: 'admin', email: 'admin@example.test' }].map(a => ({ ...a, name: a.id, firstLoginDate: new Date(Date.now() - 86400000).toISOString(), trialDurationDays: 7, customGrantedDays: 0 }));
await saveAccounts(accounts);
const payment = (id: string, userId = 'a', billing = 'monthly') => ({ id, status: 'approved', external_reference: `openvoley:${userId}:plan-dt:${billing}:test-${id}`, payer: { email: `${userId}@example.test` }, currency_id: 'ARS', transaction_amount: billing === 'annual' ? 160000 : 18000 });
let response: any = payment('1'), fail = false, calls = 0;
globalThis.fetch = (async (url: any, options: any) => { if (String(url).startsWith('https://api.mercadopago.com/v1/payments/')) {
    calls++;
    assert.ok(options.signal);
    if (fail)
        return { ok: false };
    return { ok: true, json: async () => structuredClone(response) };
} return realFetch(url, options); }) as any;
const app = express();
app.use(express.json(), securityMiddleware, requestProtection, securePaymentConfirmation, commercialRouter);
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const tokenA = await createSessionToken({ userId: 'a', email: 'a@example.test' }), adminToken = await createSessionToken({ userId: 'admin', email: 'admin@example.test' });
const request = async (url: string, token = '', method = 'GET') => realFetch(base + url, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
try {
    assert.equal((await request('/api/commercial/payments')).status, 401);
    assert.equal((await request('/api/commercial/payments', tokenA)).status, 403);
    assert.equal((await request('/api/commercial/payments/1/recheck', tokenA, 'POST')).status, 403);
    assert.equal(calls, 0);
    assert.equal((await request('/api/commercial/payments/no/recheck', adminToken, 'POST')).status, 400);
    // A provider failure survives restart and remains available to the administrator.
    fail = true;
    assert.equal((await request('/api/commercial/payments/1/recheck', adminToken, 'POST')).status, 502);
    assert.equal((await store.getReconciliation('1')).state, 'retry');
    assert.equal((await loadAccounts())[0].customGrantedDays, 0);
    const moduleUrl = new URL('./commercialStore.ts', import.meta.url).href;
    const script = `import {getReconciliation} from ${JSON.stringify(moduleUrl)};if((await getReconciliation('1')).state!=='retry')process.exit(1);`;
    execFileSync(process.execPath, ['--import', import.meta.resolve('tsx'), '--input-type=module', '-e', script], { env: process.env, cwd: root, stdio: 'pipe' });
    fail = false;
    const first = await request('/api/commercial/payments/1/recheck', adminToken, 'POST');
    assert.equal(first.status, 200);
    assert.equal((await first.json()).result.grantedDays, 30);
    const days = (await loadAccounts())[0].customGrantedDays;
    assert.equal((await loadAccounts())[1].customGrantedDays, 0);
    await request('/api/commercial/payments/1/recheck', adminToken, 'POST');
    assert.equal((await loadAccounts())[0].customGrantedDays, days);
    assert.equal((await store.getReconciliation('1')).attempts, 3);
    // Do not let a partially refunded payment grant a full new period.
    response = { ...payment('2'), transaction_amount_refunded: 100, status_detail: 'partially_refunded' };
    await processing.reconcilePayment('2', 'test');
    assert.equal((await store.getReconciliation('2')).state, 'review');
    assert.equal((await loadAccounts())[0].customGrantedDays, days);
    response = { ...payment('1'), transaction_amount_refunded: 100 };
    await processing.reconcilePayment('1', 'test');
    assert.equal((await store.getReconciliation('1')).state, 'review');
    assert.equal((await loadAccounts())[0].customGrantedDays, days);
    // Reject payer, price, reference and returned-ID mismatches.
    response = { ...payment('3'), payer: { email: 'b@example.test' } };
    assert.equal((await processing.reconcilePayment('3', 'test')).state, 'review');
    response = { ...payment('4'), transaction_amount: 17999 };
    assert.equal((await processing.reconcilePayment('4', 'test')).state, 'review');
    response = { ...payment('5'), external_reference: 'unrelated' };
    assert.equal((await processing.reconcilePayment('5', 'test')).state, 'review');
    response = payment('99');
    await assert.rejects(processing.reconcilePayment('6', 'test'), /coincide/);
    assert.equal((await store.getReconciliation('6')).state, 'retry');
    // Respect a locked price even after the administrator changes the price.
    response = payment('7');
    await store.saveQuote(response.external_reference, { userId: 'a', planId: 'plan-dt', billing: 'monthly', currency: 'ARS', amount: 18000 });
    const prices = await store.getPrices();
    prices['plan-dt'].monthly.ARS = 23000;
    await store.savePrices(prices, 'admin@example.test');
    assert.equal((await processing.reconcilePayment('7', 'test')).action, 'access-granted');
    // Confirmation uses the same checks, without exposing another account's payment.
    response = payment('13', 'b');
    const foreign = await realFetch(base + '/api/mercadopago/confirm-payment', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: '13' }) });
    assert.equal(foreign.status, 403);
    assert.equal(await store.getReconciliation('13'), null);
    response = { ...payment('14'), status_detail: 'partially_refunded', transaction_amount_refunded: 100 };
    await store.saveQuote(response.external_reference, { userId: 'a', planId: 'plan-dt', billing: 'monthly', currency: 'ARS', amount: 18000 });
    const beforePartial = (await loadAccounts())[0].customGrantedDays;
    const partial = await realFetch(base + '/api/mercadopago/confirm-payment', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: '14' }) });
    assert.equal(partial.status, 409);
    assert.equal((await loadAccounts())[0].customGrantedDays, beforePartial);
    assert.equal((await store.getReconciliation('14')).state, 'review');
    // Account blocking never prevents reversal of an already applied payment.
    const blocked = await loadAccounts();
    blocked[0].isBlocked = true;
    await saveAccounts(blocked);
    const before = (await loadAccounts())[0].customGrantedDays;
    response = { ...payment('1'), status: 'refunded', transaction_amount_refunded: 18000 };
    assert.equal((await processing.reconcilePayment('1', 'test')).action, 'access-revoked');
    assert.equal((await loadAccounts())[0].customGrantedDays, before - 30);
    assert.equal((await loadAccounts())[0].isBlocked, true);
    assert.equal(await verifySessionToken(tokenA), null);
    await processing.reconcilePayment('1', 'test');
    assert.equal((await loadAccounts())[0].customGrantedDays, before - 30);
    response = payment('8');
    assert.equal((await processing.reconcilePayment('8', 'test')).state, 'review');
    assert.equal((await loadAccounts())[0].isBlocked, true);
    // A reversal received first cannot later credit stale approval data.
    const unblocked = await loadAccounts();
    unblocked[0].isBlocked = false;
    await saveAccounts(unblocked);
    response = { ...payment('9'), status: 'refunded' };
    await processing.reconcilePayment('9', 'test');
    response = payment('9');
    assert.equal((await processing.reconcilePayment('9', 'test')).state, 'review');
    // Annual chargeback removes the actual granted period once.
    response = payment('10', 'b', 'annual');
    await processing.reconcilePayment('10', 'test');
    assert.equal((await loadAccounts())[1].customGrantedDays, 365);
    response = { ...response, status: 'charged_back' };
    await processing.reconcilePayment('10', 'test');
    await processing.reconcilePayment('10', 'test');
    assert.equal((await loadAccounts())[1].customGrantedDays, 0);
    response = { ...payment('11'), status: 'pending' };
    assert.equal((await processing.reconcilePayment('11', 'test')).state, 'pending');
    // Full refunded amount with an approved status is still treated as a reversal.
    response = { ...payment('7'), transaction_amount_refunded: 18000 };
    assert.equal((await processing.reconcilePayment('7', 'test')).status, 'refunded');
    response = payment('12');
    const callsBefore = calls;
    const daysBefore = (await loadAccounts())[0].customGrantedDays;
    await Promise.all([processing.reconcilePayment('12', 'test'), processing.reconcilePayment('12', 'test')]);
    assert.equal(calls, callsBefore + 1);
    assert.equal((await loadAccounts())[0].customGrantedDays, daysBefore + 30);
    const listing = await (await request('/api/commercial/payments', adminToken)).json();
    assert.ok(listing.payments.some((p: any) => p.paymentId === '2' && p.state === 'review'));
    assert.ok(listing.audit.some((e: any) => e.admin === 'admin@example.test'));
    assert.equal(JSON.stringify(listing).includes('test-token'), false);
    const persisted = new DatabaseSync(process.env.OPENVOLEY_DB_PATH, { readOnly: true });
    assert.ok((persisted.prepare('SELECT COUNT(*) AS total FROM payment_audit').get() as any).total > 10);
    persisted.close();
    console.log('Payment review tests passed: admin access, persisted retry, duplicate/price/owner checks, partial refunds, blocked-account reversal and annual chargebacks.');
}
finally {
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    globalThis.fetch = realFetch;
    process.chdir(oldCwd);
    fs.rmSync(root, { recursive: true, force: true });
}
