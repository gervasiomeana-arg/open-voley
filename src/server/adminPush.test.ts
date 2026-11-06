import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createECDH, randomBytes } from 'node:crypto';
import vm from 'node:vm';
import webpush from 'web-push';
const cwd = process.cwd(), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ov-push-'));
const workerSource = fs.readFileSync(path.join(cwd, 'public/admin-push-sw.js'), 'utf8');
process.chdir(temp);
delete process.env.OPENVOLEY_PERSISTENCE;
process.env.ADMIN_EMAILS = 'admin@example.test';
process.env.SESSION_SECRET = 'test-only-secret-more-than-32-characters';
process.env.GOOGLE_CLIENT_ID = 'test-google-client';
const push = await import('./adminPush');
const { loadAccounts, saveAccounts } = await import('./accountStore');
const { commercialRouter } = await import('./commercialRouter');
const { createSessionToken } = await import('./sessionSecurity');
const { securityMiddleware } = await import('./securityMiddleware');
const { OAuth2Client } = await import('google-auth-library');
const { authMeRouter } = await import('./authMeRouter');
const oldSend = webpush.sendNotification, oldFetch = globalThis.fetch, oldVerify = OAuth2Client.prototype.verifyIdToken;
const ecdh = createECDH('prime256v1'); ecdh.generateKeys();
const sub = (suffix: string) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${suffix}`, keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: randomBytes(16).toString('base64url') } });
const response = () => ({ code: 200, data: null as any, locals: {} as any, headers: {} as any, status(n: number) { this.code = n; return this; }, json(data: any) { this.data = data; return this; }, setHeader(k: string, v: any) { this.headers[k] = v; return this; } });
const admin = { id: 'admin', email: 'admin@example.test' };
const customer = (id: string, date = new Date().toISOString()) => ({ id, email: `${id}@example.test`, firstLoginDate: date, trialDurationDays: 7, payments: [{ id: 'keep' }], trialPushAlert: { createdAt: date, deliveries: {} } });
let sends: any[] = [], fail = 0;
try {
  await saveAccounts([admin]);
  const subscription = sub('one'); assert.equal(push.validPushSubscription(subscription), true);
  for (const endpoint of ['http://fcm.googleapis.com/fcm/send/x', 'https://127.0.0.1/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://fcm.googleapis.com:444/x', 'https://user@fcm.googleapis.com/x', 'https://fcm.googleapis.com/x?secret=x']) assert.equal(push.validPushSubscription({ ...subscription, endpoint }), false);
  assert.equal(push.validPushSubscription({ ...subscription, keys: { ...subscription.keys, p256dh: 'x'.repeat(87) } }), false);
  const registered = await push.registerPushDevice('admin', subscription);
  const config = await push.pushConfiguration('admin'); assert.equal(config.devices.length, 1); assert.ok(config.publicKey);
  const privateKey = JSON.parse(fs.readFileSync('.openvoley-push.json', 'utf8'))['signing-key'].value.privateKey;
  assert.ok(!JSON.stringify(config).includes(privateKey)); assert.ok(!JSON.stringify(config).includes(subscription.endpoint));
  assert.equal((await push.pushConfiguration('admin')).publicKey, config.publicKey, 'signing keys persist across reads');
  webpush.sendNotification = (async (subscription: any, payload: any, options: any) => {
    sends.push({ subscription, payload, options });
    if (fail) throw Object.assign(Error('provider failure'), { statusCode: fail });
    return { statusCode: 201 };
  }) as any;
  const first = customer('first'); await saveAccounts([admin, first]);
  await Promise.all([push.dispatchTrialPush('first'), push.dispatchTrialPush('first')]); await push.dispatchTrialPush('first');
  assert.equal(sends.length, 1); assert.equal(JSON.parse(sends[0].payload).body, push.PUSH_BODY);
  assert.ok(!sends[0].payload.includes(first.email)); assert.equal(sends[0].options.vapidDetails.privateKey, privateKey);
  assert.deepEqual((await loadAccounts()).find(a => a.id === 'first').payments, [{ id: 'keep' }]);
  await push.dispatchTrialPush('admin'); assert.equal(sends.length, 1);
  const old = customer('old', '2020-01-01T00:00:00.000Z'); await saveAccounts([admin, old]); await push.dispatchTrialPush('old'); assert.equal(sends.length, 1, 'new device gets no historical flood');
  assert.deepEqual(await push.testPushDevice('another-admin', registered.id), { accepted: false, expired: false }); assert.equal(sends.length, 1);
  assert.equal((await push.testPushDevice('admin', registered.id)).accepted, true); assert.equal(sends.length, 2);
  // Expired device is removed without deleting accounts or other device subscriptions.
  fail = 410; await push.testPushDevice('admin', registered.id); assert.equal((await push.pushConfiguration('admin')).devices.length, 0);
  fail = 0; await push.registerPushDevice('admin', subscription);
  const uncertain = customer('uncertain'); await saveAccounts([admin, uncertain]); fail = 503;
  await push.dispatchTrialPush('uncertain'); const count = sends.length; await push.dispatchTrialPush('uncertain'); assert.equal(sends.length, count);
  assert.equal((await loadAccounts()).find(a => a.id === 'uncertain').trialPushAlert.deliveries[registered.id].state, 'uncertain');
  await saveAccounts([{ ...admin, isBlocked: true }, customer('blocked-owner')]); fail = 0; await push.dispatchTrialPush('blocked-owner'); assert.equal(sends.length, count);
  // Registration event runs through the Google handler; old/admin accounts are excluded.
  await saveAccounts([admin]); let email = 'new-client@example.test';
  OAuth2Client.prototype.verifyIdToken = (async () => ({ getPayload: () => ({ email, email_verified: true, sub: email, name: 'Client' }) })) as any;
  const login = (authMeRouter as any).stack.find((l: any) => l.route?.path === '/google').route.stack[0].handle;
  const r = response(); await login({ body: { credential: 'test' }, headers: {} }, r, () => {}); assert.equal(r.code, 200);
  const created = (await loadAccounts()).find(a => a.email === email); assert.ok(created.trialPushAlert); const newCount = sends.length;
  await login({ body: { credential: 'test' }, headers: {} }, response(), () => {}); assert.equal(sends.length, newCount);
  assert.equal((await loadAccounts()).find(a => a.id === 'admin').trialPushAlert, undefined);
  // All push routes sit AFTER the commercial administrator guard.
  const stack = (commercialRouter as any).stack, guardIndex = stack.findIndex((l: any) => !l.route && l.regexp.test('/api/commercial/push/config'));
  assert.ok(stack.findIndex((l: any) => l.route?.path === '/api/commercial/push/config') > guardIndex);
  const guard = stack[guardIndex].handle;
  const anon = response(); await guard({ headers: {} }, anon, () => assert.fail('anonymous access')); assert.equal(anon.code, 401);
  const token = await createSessionToken({ userId: created.id, email: created.email }); const denied = response();
  await guard({ headers: { authorization: `Bearer ${token}` } }, denied, () => assert.fail('non-admin access')); assert.equal(denied.code, 403);
  const evil = response(); await securityMiddleware({ method: 'POST', path: '/api/commercial/push/subscribe', headers: { host: 'app.example', origin: 'https://evil.example' } } as any, evil as any, () => assert.fail('cross-site subscribe')); assert.equal(evil.code, 403);
  // Worker produces a generic visible notice and only opens the app origin.
  const events: any = {}, notices: any[] = [], opened: any[] = [];
  const self = { addEventListener(name: string, cb: any) { events[name] = cb; }, registration: { async showNotification(...args: any[]) { notices.push(args); } }, clients: { async matchAll() { return []; }, async openWindow(url: string) { opened.push(url); } } };
  vm.runInNewContext(workerSource, { self, URL }); let done: Promise<any>;
  events.push({ data: { json: () => ({ body: 'private client email', url: 'https://evil.example' }) }, waitUntil(p: Promise<any>) { done = p; } }); await done!;
  assert.equal(notices[0][1].body, push.PUSH_BODY);
  events.notificationclick({ notification: { close() {} }, waitUntil(p: Promise<any>) { done = p; } }); await done!; assert.deepEqual(opened, ['/']);
  // Real RPC adapter with CAS conflict: another instance claimed the event first.
  process.env.OPENVOLEY_PERSISTENCE = 'supabase'; process.env.SUPABASE_URL = 'https://test.supabase.co'; process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
  const persisted = JSON.parse(fs.readFileSync('.openvoley-push.json', 'utf8'));
  const cloud = new Map<string, any>(); const ck = (n: string, o: string, k: string) => `${n}:${o}:${k}`;
  for (const a of [admin, customer('cloud')]) cloud.set(ck('accounts', 'system', a.id), { key: a.id, value: a, revision: 1 });
  for (const [key, row] of Object.entries(persisted)) cloud.set(ck('commercial', 'admin-push', key), row);
  let conflict = true;
  globalThis.fetch = (async (url: any, init: any) => {
    const args = JSON.parse(init.body);
    if (String(url).endsWith('ov_read_records')) return new Response(JSON.stringify([...cloud.entries()].filter(([key, row]) => key.startsWith(`${args.p_namespace}:${args.p_owner}:`) && (!args.p_key || row.key === args.p_key)).map(([, row]) => row)));
    const writes = args.p_writes, write = writes[0], key = ck(write.namespace, write.owner, write.key), prior = cloud.get(key);
    if (write.namespace === 'accounts' && conflict) {
      conflict = false; prior.revision++; prior.value.trialPushAlert.deliveries[registered.id] = { state: 'sending', attemptId: 'other-server' };
      return new Response(JSON.stringify({ code: '40001' }), { status: 409 });
    }
    if ((prior?.revision || 0) !== write.baseRevision) return new Response(JSON.stringify({ code: '40001' }), { status: 409 });
    const fresh = { key: write.key, value: write.value, revision: write.baseRevision + 1 }; cloud.set(key, fresh); return new Response(JSON.stringify([fresh]));
  }) as any;
  const beforeCloud = sends.length; await push.dispatchTrialPush('cloud'); assert.equal(sends.length, beforeCloud, 'other server owns this delivery');
  console.log('Admin push: Google event, persistence/CAS, private keys, SSRF, admin-only, generic worker, duplicates, expired devices and preservation OK');
} finally {
  webpush.sendNotification = oldSend; globalThis.fetch = oldFetch; OAuth2Client.prototype.verifyIdToken = oldVerify;
  delete process.env.OPENVOLEY_PERSISTENCE; process.chdir(cwd); fs.rmSync(temp, { recursive: true, force: true });
}
