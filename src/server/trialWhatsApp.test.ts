import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { OAuth2Client } from 'google-auth-library';
const cwd = process.cwd(), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ov-wa-'));
process.chdir(temp);
process.env.ADMIN_EMAILS = 'admin@example.test';
process.env.SESSION_SECRET = 'test-only-session-secret-more-than-32-characters';
process.env.GOOGLE_CLIENT_ID = 'test-google-client';
delete process.env.OPENVOLEY_PERSISTENCE;
delete process.env.WHATSAPP_TRIAL_ALERTS_ENABLED;
const { loadAccounts, saveAccounts } = await import('./accountStore');
const { dispatchTrialWhatsApp, newTrialAlert, trialWhatsAppStatus, processPendingTrialWhatsApp } = await import('./trialWhatsApp');
const { authMeRouter } = await import('./authMeRouter');
const { commercialRouter } = await import('./commercialRouter');
const { createSessionToken } = await import('./sessionSecurity');
const originalFetch = globalThis.fetch, originalVerify = OAuth2Client.prototype.verifyIdToken;
const now = new Date().toISOString();
const account = (id: string) => ({ id, email: `${id}@example.test`, name: id, firstLoginDate: now, trialDurationDays: 7, trialWhatsAppAlert: newTrialAlert(now), payments: [{ id: 'keep-payment' }] });
const res = () => ({ code: 200, headers: {} as any, locals: {} as any, data: null as any, status(n: number) { this.code = n; return this; }, json(d: any) { this.data = d; return this; }, setHeader(k: string, v: any) { this.headers[k] = v; return this; }, redirect(n: number) { this.code = n; return this; } });
let sends = 0;
try {
  // Registration queues exactly once even before configuration, existing/admin/invalid users don't.
  let email = 'new@example.test', valid = true;
  OAuth2Client.prototype.verifyIdToken = (async () => ({ getPayload: () => valid ? { email, sub: email, email_verified: true, name: 'Coach' } : null })) as any;
  const login = (redirect = false) => (authMeRouter as any).stack.find((l: any) => l.route?.path === (redirect ? '/google/redirect' : '/google')).route.stack[0].handle;
  const invoke = async (redirect = false) => { const r = res(); await login(redirect)({ body: { credential: 'test', g_csrf_token: 'csrf' }, headers: { cookie: 'g_csrf_token=csrf' } }, r, () => {}); return r; };
  assert.equal((await invoke()).code, 200);
  const first = (await loadAccounts())[0]; assert.equal(first.trialWhatsAppAlert.state, 'pending');
  const alert = JSON.stringify(first.trialWhatsAppAlert); await invoke(true); assert.equal(JSON.stringify((await loadAccounts())[0].trialWhatsAppAlert), alert);
  email = 'admin@example.test'; await invoke(); assert.equal((await loadAccounts()).find(a => a.email === email).trialWhatsAppAlert, undefined);
  await saveAccounts([...(await loadAccounts()), { ...account('old'), trialWhatsAppAlert: undefined }]);
  email = 'old@example.test'; await invoke(); assert.equal((await loadAccounts()).find(a => a.email === email).trialWhatsAppAlert, undefined);
  valid = false; email = 'invalid@example.test'; assert.equal((await invoke()).code, 401); assert.ok(!(await loadAccounts()).some(a => a.email === email));

  process.env.WHATSAPP_TRIAL_ALERTS_ENABLED = 'true';
  assert.equal((await trialWhatsAppStatus()).ready, false);
  process.env.WHATSAPP_ACCESS_TOKEN = 'test-only-private-token'; process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  process.env.WHATSAPP_ADMIN_TO = '542230000000'; process.env.WHATSAPP_TRIAL_TEMPLATE = 'new_trial';
  globalThis.fetch = (async (url: any, init: any) => {
    sends++; assert.equal(url, 'https://graph.facebook.com/v25.0/123456789/messages');
    assert.equal(init.headers.Authorization, 'Bearer test-only-private-token'); assert.equal(init.redirect, 'error');
    const body = JSON.parse(init.body); assert.equal(body.to, '542230000000'); assert.equal(body.type, 'template');
    assert.equal(body.template.components[0].parameters.length, 3);
    return new Response(JSON.stringify({ messages: [{ id: 'wamid.test' }] }), { status: 200 });
  }) as any;
  const baseline = [account('one'), account('two'), { ...account('admin'), email: 'admin@example.test' }, { ...account('blocked'), isBlocked: true }];
  await saveAccounts(baseline);
  fs.writeFileSync('teams-preserved.json', '{"teams":[1,2]}');
  await Promise.all([dispatchTrialWhatsApp('one'), dispatchTrialWhatsApp('one')]);
  assert.equal(sends, 1); await dispatchTrialWhatsApp('one'); assert.equal(sends, 1);
  let accounts = await loadAccounts(); const accepted = accounts.find(a => a.id === 'one'); assert.equal(accepted.trialWhatsAppAlert.state, 'accepted');
  assert.deepEqual({ ...accepted, trialWhatsAppAlert: undefined }, { ...baseline[0], trialWhatsAppAlert: undefined });
  await dispatchTrialWhatsApp('admin'); await dispatchTrialWhatsApp('blocked'); assert.equal(sends, 1);
  assert.equal(fs.readFileSync('teams-preserved.json', 'utf8'), '{"teams":[1,2]}');
  assert.ok(!JSON.stringify(await trialWhatsAppStatus()).includes('test-only-private-token'));
  globalThis.fetch = (async () => { sends++; throw Error('network uncertainty with private response'); }) as any;
  await dispatchTrialWhatsApp('two'); await dispatchTrialWhatsApp('two'); assert.equal(sends, 2);
  assert.equal((await loadAccounts()).find(a => a.id === 'two').trialWhatsAppAlert.state, 'uncertain');
  await saveAccounts([account('rate'), account('bad')]);
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { code: 4 } }), { status: 429 })) as any;
  await dispatchTrialWhatsApp('rate'); assert.equal((await loadAccounts())[0].trialWhatsAppAlert.state, 'pending');
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { code: 190 } }), { status: 401 })) as any;
  await dispatchTrialWhatsApp('bad'); assert.equal((await loadAccounts())[1].trialWhatsAppAlert.errorCode, 'META_190');
  // Admin-only endpoint: exercise mounted auth middleware and route.
  const admin = { ...account('admin'), email: 'admin@example.test' }; await saveAccounts([admin, account('coach')]);
  const guard = (commercialRouter as any).stack.find((l: any) => !l.route && l.regexp.test('/api/commercial/whatsapp')).handle;
  const anonymous = res(); await guard({ headers: {} }, anonymous, () => assert.fail('anonymous admin access')); assert.equal(anonymous.code, 401);
  const userToken = await createSessionToken({ userId: 'coach', email: 'coach@example.test' });
  const forbidden = res(); await guard({ headers: { authorization: `Bearer ${userToken}` } }, forbidden, () => assert.fail('non-admin access')); assert.equal(forbidden.code, 403);
  const adminToken = await createSessionToken({ userId: 'admin', email: admin.email }); let allowed = false;
  await guard({ headers: { authorization: `Bearer ${adminToken}` } }, res(), () => { allowed = true; }); assert.equal(allowed, true);
  // Durable storage CAS: concurrent instance claims first; local attempt must not send.
  process.env.OPENVOLEY_PERSISTENCE = 'supabase'; process.env.SUPABASE_URL = 'https://unit-test.supabase.co'; process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
  let cloud: any = { key: 'cloud', value: account('cloud'), revision: 1, updatedAt: now }, commits = 0;
  globalThis.fetch = (async (url: any, init: any) => {
    if (String(url).startsWith('https://graph.facebook.com')) { sends++; return new Response(JSON.stringify({ messages: [{ id: 'cloud-wamid' }] })); }
    const body = JSON.parse(init.body);
    if (String(url).endsWith('ov_read_records')) return new Response(JSON.stringify([cloud]));
    assert.ok(String(url).endsWith('ov_commit_records')); commits++;
    if (commits === 1) { cloud = { ...cloud, revision: 2, value: { ...cloud.value, trialWhatsAppAlert: { ...newTrialAlert(now), state: 'sending', attemptId: 'other-instance' } } }; return new Response(JSON.stringify({ code: '40001' }), { status: 409 }); }
    assert.equal(body.p_writes[0].baseRevision, cloud.revision); cloud = { ...cloud, revision: cloud.revision + 1, value: body.p_writes[0].value }; return new Response(JSON.stringify([cloud]));
  }) as any;
  const before = sends; await dispatchTrialWhatsApp('cloud'); assert.equal(sends, before);
  cloud.value.trialWhatsAppAlert = newTrialAlert(now); await dispatchTrialWhatsApp('cloud'); assert.equal(sends, before + 1); assert.equal(cloud.value.trialWhatsAppAlert.state, 'accepted');
  assert.deepEqual(cloud.value.payments, [{ id: 'keep-payment' }]);
  delete process.env.OPENVOLEY_PERSISTENCE;
  console.log('WhatsApp trial alerts: verified registration, existing/admin exclusion, durable claims, dedup, uncertainty, config, privacy, authorization and preservation OK');
} finally {
  globalThis.fetch = originalFetch; OAuth2Client.prototype.verifyIdToken = originalVerify;
  process.chdir(cwd); fs.rmSync(temp, { recursive: true, force: true });
}
