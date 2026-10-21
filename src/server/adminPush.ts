import webpush from 'web-push';
import { createHash, randomUUID, ECDH } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CloudStorageError, durableStorageEnabled, readCloud, writeCloud } from './supabaseStore';
import { isAdminEmail, loadAccounts } from './accountStore';
import { changeAlert } from './trialWhatsApp';
export const PUSH_TITLE = 'OPEN VOLEY';
export const PUSH_BODY = 'Un nuevo cliente activó su prueba.';
type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
type Device = { id: string; owner: string; subscription: Subscription; createdAt: string };
type Delivery = { state: 'sending' | 'accepted' | 'uncertain' | 'expired' | 'pending'; attemptId: string; retryAt?: number };
type PushAlert = { createdAt: string; deliveries: Record<string, Delivery> };
const owner = 'admin-push';
const file = () => path.join(process.cwd(), '.openvoley-push.json');
async function read(key: string) {
  if (durableStorageEnabled()) return (await readCloud('commercial', owner, key))[0];
  return fs.existsSync(file()) ? JSON.parse(fs.readFileSync(file(), 'utf8'))[key] : undefined;
}
async function update(key: string, change: (value: any) => any) {
  for (let i = 0; i < 3; i++) {
    const previous = await read(key), value = change(previous?.value);
    if (previous && JSON.stringify(previous.value) === JSON.stringify(value)) return previous;
    try {
      if (durableStorageEnabled()) return await writeCloud('commercial', owner, key, value, previous?.revision || 0);
      const data = fs.existsSync(file()) ? JSON.parse(fs.readFileSync(file(), 'utf8')) : {};
      data[key] = { key, value, revision: (previous?.revision || 0) + 1 };
      const tmp = `${file()}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 }); fs.renameSync(tmp, file());
      return data[key];
    } catch (e) { if (!(e instanceof CloudStorageError) || e.status !== 409 || i === 2) throw e; }
  }
}
async function vapid() {
  return (await update('signing-key', previous => previous || webpush.generateVAPIDKeys()))!.value;
}
export function validPushSubscription(value: any): value is Subscription {
  if (!value || typeof value.endpoint !== 'string' || value.endpoint.length > 2048) return false;
  try {
    const url = new URL(value.endpoint);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || url.search) return false;
    // Exact push-service origins only; subscriptions cannot become arbitrary HTTP requests.
    const hosts = new Set(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']);
    if (!hosts.has(url.hostname) || url.pathname.length < 5) return false;
    if (!/^[A-Za-z0-9_-]{87}$/.test(value.keys?.p256dh) || !/^[A-Za-z0-9_-]{22}$/.test(value.keys?.auth)) return false;
    const publicKey = Buffer.from(value.keys.p256dh, 'base64url');
    if (publicKey.length !== 65 || publicKey[0] !== 4 || Buffer.from(value.keys.auth, 'base64url').length !== 16) return false;
    ECDH.convertKey(publicKey, 'prime256v1'); return true;
  } catch { return false; }
}
export function pushDeviceId(endpoint: string) { return createHash('sha256').update(endpoint).digest('hex').slice(0, 32); }
async function devices(): Promise<Device[]> { return (await read('devices'))?.value || []; }
export async function pushConfiguration(adminId: string) {
  const keys = await vapid();
  return { publicKey: keys.publicKey, devices: (await devices()).filter(d => d.owner === adminId).map(d => ({ id: d.id, createdAt: d.createdAt })) };
}
export async function registerPushDevice(adminId: string, subscription: any) {
  if (!validPushSubscription(subscription)) throw new Error('Suscripción de notificaciones no válida.');
  await vapid();
  const id = pushDeviceId(subscription.endpoint);
  const clean: Subscription = { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } };
  await update('devices', (previous: Device[] = []) => {
    if (previous.filter(d => d.owner === adminId && d.id !== id).length >= 5) throw new Error('Máximo de cinco dispositivos.');
    if (previous.length >= 100 && !previous.some(d => d.id === id)) throw new Error('Límite de dispositivos alcanzado.');
    const existing = previous.find(d => d.id === id);
    return [...previous.filter(d => d.id !== id), { id, owner: adminId, subscription: clean, createdAt: existing?.owner === adminId ? existing.createdAt : new Date().toISOString() }];
  });
  return { id };
}
export async function removePushDevice(adminId: string, id: string) {
  await update('devices', (previous: Device[] = []) => previous.filter(d => !(d.id === id && d.owner === adminId)));
}
async function send(device: Device, tag: string, test = false) {
  if (!validPushSubscription(device.subscription)) throw new Error('Invalid stored subscription');
  const keys = await vapid();
  return webpush.sendNotification(device.subscription, JSON.stringify({ title: PUSH_TITLE, body: test ? 'Avisos activados en este dispositivo.' : PUSH_BODY, tag }), {
    vapidDetails: { subject: 'https://openvoley.com', publicKey: keys.publicKey, privateKey: keys.privateKey },
    timeout: 4000, TTL: 86400, urgency: 'normal', topic: tag.slice(0, 32),
  });
}
export async function testPushDevice(adminId: string, id: string) {
  const device = (await devices()).find(d => d.id === id && d.owner === adminId);
  if (!device) return { accepted: false, expired: false };
  try { await send(device, 'ov-push-test', true); return { accepted: true, expired: false }; }
  catch (error: any) {
    if ([404, 410].includes(error.statusCode)) { await removePushDevice(adminId, id); return { accepted: false, expired: true }; }
    return { accepted: false, expired: false };
  }
}
const active = new Set<string>();
export async function dispatchTrialPush(accountId: string) {
  if (active.has(accountId)) return;
  active.add(accountId);
  try {
    // Re-check owners on every send: removed/blocked/non-admin accounts get no notices.
    const accounts = await loadAccounts();
    const target = accounts.find(a => a.id === accountId);
    if (!target?.trialPushAlert || target.isBlocked || isAdminEmail(target.email)) return;
    const admins = new Set(accounts.filter(a => !a.isBlocked && isAdminEmail(a.email)).map(a => a.id));
    const recipients = (await devices()).filter(d => admins.has(d.owner) && d.createdAt <= target.trialPushAlert.createdAt);
    const attemptId = randomUUID();
    const claimed = await changeAlert<PushAlert>(accountId, account => {
      const alert: PushAlert = account.trialPushAlert;
      if (!alert) return null;
      const deliveries = { ...alert.deliveries }; let changed = false;
      for (const device of recipients) {
        const current = deliveries[device.id];
        if (!current || (current.state === 'pending' && (current.retryAt || 0) <= Date.now())) {
          deliveries[device.id] = { state: 'sending', attemptId }; changed = true;
        }
      }
      return changed ? { ...alert, deliveries } : null;
    }, 'trialPushAlert');
    if (!claimed) return;
    const results = await Promise.all(recipients.filter(d => claimed.trialPushAlert.deliveries[d.id]?.attemptId === attemptId).map(async device => {
      let state: Delivery['state'] = 'accepted', retryAt: number | undefined;
      try { await send(device, `trial-${createHash('sha256').update(accountId).digest('hex').slice(0, 24)}`); }
      catch (error: any) {
        if ([404, 410].includes(error.statusCode)) { state = 'expired'; await removePushDevice(device.owner, device.id); }
        else if (error.statusCode === 429) { state = 'pending'; retryAt = Date.now() + 60000; }
        else state = 'uncertain';
      }
      return { id: device.id, delivery: { state, attemptId, ...(retryAt ? { retryAt } : {}) } };
    }));
    await changeAlert<PushAlert>(accountId, account => {
      const alert: PushAlert = account.trialPushAlert;
      if (!alert) return null;
      const deliveries = { ...alert.deliveries };
      for (const result of results) if (deliveries[result.id]?.attemptId === attemptId) deliveries[result.id] = result.delivery;
      return { ...alert, deliveries };
    }, 'trialPushAlert');
  } catch { console.warn('Admin push alert pending review; login remains available.'); }
  finally { active.delete(accountId); }
}
