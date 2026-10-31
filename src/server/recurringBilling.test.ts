import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { once } from 'node:events';
import { createHmac } from 'node:crypto';
const cwd = process.cwd(), root = fs.mkdtempSync(path.join(os.tmpdir(), 'ov-recurring-')), realFetch = globalThis.fetch;
process.chdir(root);
Object.assign(process.env, { OPENVOLEY_DB_PATH: path.join(root, 'test.db'), OPENVOLEY_PERSISTENCE: '',
  SESSION_SECRET: 'test-recurring-secret-with-at-least-32-characters', MERCADOPAGO_ACCESS_TOKEN: 'test-not-real',
  MERCADOPAGO_WEBHOOK_SECRET: 'test-webhook', MERCADOPAGO_SUBSCRIPTIONS_ENABLED: 'true', APP_URL: 'https://test.invalid' });
const { saveAccounts, loadAccounts, accountTrial } = await import('./accountStore');
const billing = await import('./recurringBilling');
const { recurringBillingRouter } = await import('./recurringBillingRouter');
const { secureMercadoPago } = await import('./secureMercadoPago');
const { securityMiddleware } = await import('./securityMiddleware');
const { requestProtection } = await import('./requestProtection');
const { asyncHandler } = await import('./asyncHandler');
const { createSessionToken } = await import('./sessionSecurity');
const { savePrices, DEFAULT_PRICES } = await import('./commercialStore');
await saveAccounts(['a', 'b', 'c', 'd'].map(id => ({ id, email: `${id}@example.test`, name: id, firstLoginDate: '2026-01-01T00:00:00Z', trialDurationDays: 7, customGrantedDays: 0, untouched: { teams: 'preserved' } })));
let count = 0, failCreate = false, failVerify = false;
const subs = new Map<string, any>(), invoices = new Map<string, any>(), payments = new Map<string, any>();
globalThis.fetch = (async (url: any, options: any = {}) => {
  const u = new URL(String(url));
  if (u.origin !== 'https://api.mercadopago.com') return realFetch(url, options);
  assert.equal(options.headers.Authorization, 'Bearer test-not-real'); assert.ok(options.signal);
  let data: any;
  if (u.pathname === '/preapproval' && options.method === 'POST') {
    count++; const body = JSON.parse(options.body), id = `sub${count}`;
    data = { ...body, id, collector_id: 20, payer_id: 40, init_point: `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=${id}` };
    subs.set(id, data); if (failCreate) throw new Error('ambiguous network failure');
  } else if (u.pathname === '/preapproval/search') data = { results: [...subs.values()].filter(s => s.external_reference === u.searchParams.get('external_reference')) };
  else if (u.pathname.startsWith('/preapproval/')) {
    data = subs.get(u.pathname.split('/').at(-1)!);
    if (options.method === 'PUT') data.status = JSON.parse(options.body).status;
  } else if (u.pathname === '/authorized_payments/search') {
    const rows = [...invoices.values()].filter(i => u.searchParams.has('payment_id') ? String(i.payment?.id) === u.searchParams.get('payment_id') : i.preapproval_id === u.searchParams.get('preapproval_id'));
    data = { results: rows, paging: { total: rows.length } };
  } else if (u.pathname.startsWith('/authorized_payments/')) data = invoices.get(u.pathname.split('/').at(-1)!);
  else if (u.pathname.startsWith('/v1/payments/')) { if (failVerify) return new Response('{}', { status: 503 }); data = payments.get(u.pathname.split('/').at(-1)!); }
  if (!data) return new Response('{}', { status: 404 });
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as any;
const app = express(); app.use(express.json(), asyncHandler(securityMiddleware), asyncHandler(requestProtection), recurringBillingRouter, asyncHandler(secureMercadoPago));
app.use((e: any, _req: any, res: any, _next: any) => res.status(e.status || 500).json({ error: 'Storage unavailable' }));
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const tokenA = await createSessionToken({ userId: 'a', email: 'a@example.test' }), tokenB = await createSessionToken({ userId: 'b', email: 'b@example.test' });
const request = (p: string, body?: object, token = tokenA, origin?: string) => realFetch(base + p, {
  method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Origin: origin || base, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
});
const account = async (id = 'a') => (await loadAccounts()).find(a => a.id === id);
const create = (planId = 'plan-dt', extra = {}) => ({ planId, currency: 'ARS', consent: true, ...extra });
const invoice = (id: string, start: string, sub = 'sub1') => {
  const s = subs.get(sub); invoices.set(id, { id, preapproval_id: sub, currency_id: 'ARS', transaction_amount: s.auto_recurring.transaction_amount, debit_date: start, payment: { id, status: 'approved' } });
  payments.set(id, { id, status: 'approved', collector_id: 20, payer: { id: 40, email: 'different-from-google@example.test' }, external_reference: s.external_reference, currency_id: 'ARS', transaction_amount: s.auto_recurring.transaction_amount });
};
const webhook = async (topic: string, id: string, signed = true) => {
  const signature = createHmac('sha256', 'test-webhook').update(`id:${id.toLowerCase()};request-id:request;ts:1234;`).digest('hex');
  return realFetch(`${base}/api/mercadopago/webhook?data.id=${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-request-id': 'request', 'x-signature': `ts=1234,v1=${signed ? signature : '0'.repeat(64)}` }, body: JSON.stringify({ type: topic, data: { id } }) });
};
try {
  assert.equal((await request('/api/mercadopago/subscription/create', create(), '')).status, 401);
  assert.equal((await request('/api/mercadopago/subscription/create', create(), tokenA, 'https://evil.test')).status, 403);
  assert.equal((await request('/api/mercadopago/subscription/create', create('__proto__'))).status, 400);
  assert.equal((await request('/api/mercadopago/subscription/create', create('plan-dt', { consent: false }))).status, 400);
  assert.equal((await request('/api/mercadopago/subscription/create', create('plan-dt', { currency: 'USD' }))).status, 400);
  process.env.MERCADOPAGO_SUBSCRIPTIONS_ENABLED = 'false';
  assert.equal((await request('/api/mercadopago/subscription/create', create())).status, 503);
  process.env.MERCADOPAGO_SUBSCRIPTIONS_ENABLED = 'true';
  const price = structuredClone(DEFAULT_PRICES); price['plan-dt'].monthly.ARS = 22000; await savePrices(price, 'test');
  const results = await Promise.all([request('/api/mercadopago/subscription/create', create()), request('/api/mercadopago/subscription/create', create())]);
  assert.ok(results.some(r => r.status === 200)); assert.equal(count, 1);
  assert.equal(subs.get('sub1').auto_recurring.transaction_amount, 22000);
  assert.equal(accountTrial(await account()).isExpired, true); // Authorization never grants access.
  assert.equal((await request('/api/mercadopago/subscription/create', create())).status, 200); assert.equal(count, 1);
  assert.equal((await request('/api/mercadopago/subscription/cancel', { id: 'sub1' }, tokenB)).status, 409); // Body cannot choose another user's agreement.
  assert.equal((await (await request('/api/mercadopago/subscription', undefined, tokenB)).json()).subscription, null);
  subs.get('sub1').status = 'authorized';
  assert.equal((await webhook('subscription_preapproval', 'sub1', false)).status, 401);
  assert.equal((await webhook('subscription_preapproval', 'sub1')).status, 200);
  assert.equal(accountTrial(await account()).isExpired, true);
  const start = new Date(Date.now() - 86400000).toISOString(); invoice('101', start);
  await Promise.all([webhook('subscription_authorized_payment', '101'), webhook('subscription_authorized_payment', '101')]);
  assert.equal((await account()).payments.length, 1); assert.equal(accountTrial(await account()).isExpired, false);
  const active = accountTrial(await account());
  assert.ok(Date.parse(active.firstLoginDate) + active.totalAllowedDays * 86400000 > Date.now()); // Client expiry timer uses this exact deadline.
  assert.equal((await account()).customGrantedDays, 0); assert.deepEqual((await account()).untouched, { teams: 'preserved' });
  assert.equal((await account('b')).payments, undefined);
  const paidUntil = billing.recurringPaidUntil(await account());
  // Simulate a later monthly invoice: access follows its calendar period, not 30 additive days.
  const earlier = new Date(start); earlier.setUTCMonth(earlier.getUTCMonth() - 1);
  invoice('100', earlier.toISOString()); await billing.reconcileInvoice('100');
  assert.equal(billing.recurringPaidUntil(await account()), paidUntil);
  assert.equal((await webhook('payment', '101')).status, 200); assert.equal(billing.recurringPaidUntil(await account()), paidUntil);
  price['plan-dt'].monthly.ARS = 26000; await savePrices(price, 'test');
  assert.equal((await request('/api/mercadopago/subscription/recheck', {})).status, 200); // Locked price survives catalog changes.
  invoice('102', start); payments.get('102').status = 'rejected';
  await billing.reconcileInvoice('102'); assert.equal((await account()).payments.length, 2);
  payments.get('102').status = 'approved'; payments.get('102').transaction_amount = 1;
  await assert.rejects(() => billing.reconcileInvoice('102')); assert.equal((await account()).payments.length, 2);
  payments.get('102').transaction_amount = 22000; payments.get('102').collector_id = 99;
  await assert.rejects(() => billing.reconcileInvoice('102'));
  payments.get('102').collector_id = 20; payments.get('102').payer.id = 99;
  await assert.rejects(() => billing.reconcileInvoice('102'));
  payments.get('102').payer.id = 40; payments.get('102').transaction_amount_refunded = 10;
  await assert.rejects(() => billing.reconcileInvoice('102'));
  payments.get('101').status = 'refunded';
  assert.equal((await webhook('payment', '101')).status, 200); assert.equal(accountTrial(await account()).isExpired, true);
  payments.get('101').status = 'approved'; await billing.reconcileInvoice('101'); assert.equal(accountTrial(await account()).isExpired, true); // Reversal terminal.
  delete payments.get('102').transaction_amount_refunded;
  await billing.reconcileInvoice('102'); assert.equal(accountTrial(await account()).isExpired, false);
  const cancel = await request('/api/mercadopago/subscription/cancel', {}); assert.equal(cancel.status, 200);
  assert.equal((await cancel.json()).subscription.status, 'cancelled'); assert.equal(accountTrial(await account()).isExpired, false);
  // A late earlier resource state cannot undo local cancellation.
  subs.get('sub1').status = 'authorized'; await billing.syncSubscription('sub1');
  assert.equal((await billing.billingSummary('a')).subscription.status, 'cancelled');
  const blocked = await loadAccounts(); blocked.find(a => a.id === 'a').isBlocked = true; await saveAccounts(blocked);
  invoice('103', start); await billing.reconcileInvoice('103'); assert.equal((await account()).payments.length, 3);
  payments.get('102').status = 'charged_back'; await billing.reconcileInvoice('102'); assert.equal((await account()).payments.find((p: any) => p.paymentId === '102').status, 'charged_back');
  failCreate = true;
  assert.equal((await request('/api/mercadopago/subscription/create', create(), tokenB)).status, 502); assert.equal(count, 2);
  assert.equal((await request('/api/mercadopago/subscription/create', create(), tokenB)).status, 409); assert.equal(count, 2);
  failCreate = false; assert.equal((await request('/api/mercadopago/subscription/recheck', {}, tokenB)).status, 200);
  assert.equal((await billing.billingSummary('b')).subscription.id, 'sub2');
  invoice('104', start, 'sub2'); failVerify = true;
  assert.equal((await webhook('subscription_authorized_payment', '104')).status, 502);
  assert.equal((await account('b')).payments, undefined); failVerify = false;
  assert.equal((await webhook('subscription_authorized_payment', '104')).status, 200);
  assert.equal((await account('b')).payments.length, 1);
  assert.equal(billing.nextCalendarMonth('2026-01-31T14:00:00Z'), '2026-02-28T14:00:00.000Z');
  assert.equal(billing.nextCalendarMonth('2028-01-31T14:00:00Z'), '2028-02-29T14:00:00.000Z');
  assert.equal(billing.safeCheckout('https://www.mercadopago.com.ar.evil.test/a'), null);
  assert.equal(billing.safeCheckout('javascript:alert(1)'), null);
  const summary = JSON.stringify(await billing.billingSummary('b')); assert.ok(!summary.includes('test-not-real')); assert.ok(!summary.includes('payerId'));
  console.log('Recurring billing passed: consent, ARS, configured gate, isolation/CSRF, immutable server price, duplicate creation/callbacks, calendar entitlement, rejected/foreign/partial payments, refund/chargeback, cancellation, recovery after timeout, retry after provider failure and data preservation.');
} finally {
  await new Promise<void>(resolve => server.close(() => resolve())); globalThis.fetch = realFetch; process.chdir(cwd); fs.rmSync(root, { recursive: true, force: true });
}
