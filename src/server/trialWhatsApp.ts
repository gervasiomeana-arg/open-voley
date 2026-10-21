import { randomUUID } from 'node:crypto';
import { loadAccounts, saveAccounts, isAdminEmail } from './accountStore';
import { CloudStorageError, durableStorageEnabled, readCloud, writeCloud } from './supabaseStore';

export type TrialAlert = {
  state: 'pending' | 'sending' | 'accepted' | 'rejected' | 'uncertain';
  createdAt: string; attempts: number; attemptId?: string; attemptedAt?: string;
  acceptedAt?: string; messageId?: string; errorCode?: string; retryAt?: number;
};
export function newTrialAlert(now: string): TrialAlert {
  return { state: 'pending', createdAt: now, attempts: 0 };
}
export function trialWhatsAppConfiguration() {
  const enabled = process.env.WHATSAPP_TRIAL_ALERTS_ENABLED === 'true';
  const fields = {
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '',
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '',
    WHATSAPP_ADMIN_TO: process.env.WHATSAPP_ADMIN_TO?.trim() || '',
    WHATSAPP_TRIAL_TEMPLATE: process.env.WHATSAPP_TRIAL_TEMPLATE?.trim() || '',
  };
  const missing = Object.entries(fields).filter(([, value]) => !value).map(([key]) => key);
  const version = process.env.WHATSAPP_GRAPH_VERSION?.trim() || 'v25.0';
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'es_AR';
  if (fields.WHATSAPP_PHONE_NUMBER_ID && !/^\d{5,30}$/.test(fields.WHATSAPP_PHONE_NUMBER_ID)) missing.push('WHATSAPP_PHONE_NUMBER_ID (inválido)');
  if (fields.WHATSAPP_ADMIN_TO && !/^[1-9]\d{7,14}$/.test(fields.WHATSAPP_ADMIN_TO)) missing.push('WHATSAPP_ADMIN_TO (solo dígitos internacionales)');
  if (fields.WHATSAPP_TRIAL_TEMPLATE && !/^[a-z0-9_]{1,512}$/.test(fields.WHATSAPP_TRIAL_TEMPLATE)) missing.push('WHATSAPP_TRIAL_TEMPLATE (inválido)');
  if (!/^v\d+\.0$/.test(version)) missing.push('WHATSAPP_GRAPH_VERSION (inválido)');
  if (!/^[a-z]{2}(?:_[A-Z]{2})?$/.test(language)) missing.push('WHATSAPP_TEMPLATE_LANGUAGE (inválido)');
  return { enabled, ready: enabled && !missing.length, missing, fields, version, language };
}

// Account + pending alert are saved together at registration. This CAS changes only
// the latest account record, preserving concurrent license/profile updates.
async function changeAlert(id: string, change: (account: any) => TrialAlert | null) {
  for (let i = 0; i < 3; i++) {
    const row = durableStorageEnabled() ? (await readCloud('accounts', 'system', id))[0] : null;
    const accounts = row ? null : durableStorageEnabled() ? null : await loadAccounts();
    const account = row?.value ?? accounts?.find(a => a.id === id);
    if (!account || account.isBlocked || isAdminEmail(account.email)) return null;
    const alert = change(account);
    if (!alert) return null;
    const updated = { ...account, trialWhatsAppAlert: alert };
    try {
      if (row) await writeCloud('accounts', 'system', id, updated, row.revision);
      else { accounts![accounts!.findIndex(a => a.id === id)] = updated; await saveAccounts(accounts!); }
      return updated;
    } catch (error) {
      if (!(error instanceof CloudStorageError) || error.status !== 409 || i === 2) throw error;
    }
  }
  return null;
}
const active = new Set<string>();
export async function dispatchTrialWhatsApp(id: string, retryRejected = false): Promise<void> {
  const config = trialWhatsAppConfiguration();
  if (!config.ready || active.has(id)) return;
  active.add(id);
  try {
    const attemptId = randomUUID();
    const account = await changeAlert(id, a => {
      const alert: TrialAlert | undefined = a.trialWhatsAppAlert;
      if (!alert || !(alert.state === 'pending' || (retryRejected && alert.state === 'rejected')) || (alert.retryAt || 0) > Date.now()) return null;
      return { ...alert, state: 'sending', attempts: alert.attempts + 1, attemptId, attemptedAt: new Date().toISOString(), errorCode: undefined };
    });
    if (!account) return;
    const finish = async (patch: Partial<TrialAlert>) => changeAlert(id, a =>
      a.trialWhatsAppAlert?.attemptId === attemptId ? { ...a.trialWhatsAppAlert, ...patch } : null);
    const end = new Date(Date.parse(account.firstLoginDate) + Number(account.trialDurationDays) * 86400000);
    const text = (value: unknown) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').slice(0, 320);
    try {
      const response = await fetch(`https://graph.facebook.com/${config.version}/${config.fields.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${config.fields.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: config.fields.WHATSAPP_ADMIN_TO, type: 'template',
          template: { name: config.fields.WHATSAPP_TRIAL_TEMPLATE, language: { code: config.language },
            components: [{ type: 'body', parameters: [text(account.name), text(account.email), text(end.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }))].map(value => ({ type: 'text', text: value })) }] } }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && typeof data?.messages?.[0]?.id === 'string') {
        await finish({ state: 'accepted', messageId: data.messages[0].id.slice(0, 300), acceptedAt: new Date().toISOString(), retryAt: undefined });
      } else if (response.status >= 400 && response.status < 500) {
        // Only explicit provider rejection may be retried. Network/5xx/ambiguous
        // responses could have sent a message: never resend them automatically.
        await finish({ state: response.status === 429 ? 'pending' : 'rejected', errorCode: `META_${Number(data?.error?.code) || response.status}`, retryAt: Date.now() + 60000 });
      } else await finish({ state: 'uncertain', errorCode: 'DELIVERY_UNKNOWN' });
    } catch {
      await finish({ state: 'uncertain', errorCode: 'DELIVERY_UNKNOWN' });
    }
  } catch {
    // A notification must not lock a client out. No token, provider body or PII in logs.
    console.warn('WhatsApp trial alert pending review; authentication remains available.');
  } finally { active.delete(id); }
}
export async function trialWhatsAppStatus() {
  const config = trialWhatsAppConfiguration();
  const alerts = (await loadAccounts()).filter(a => a.trialWhatsAppAlert).map(a => ({
    accountId: a.id, name: a.name, email: a.email, ...a.trialWhatsAppAlert,
  })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { enabled: config.enabled, ready: config.ready, missing: config.missing,
    recipient: config.fields.WHATSAPP_ADMIN_TO ? `…${config.fields.WHATSAPP_ADMIN_TO.slice(-4)}` : null,
    counts: alerts.reduce((counts, a) => ({ ...counts, [a.state]: (counts[a.state] || 0) + 1 }), {} as Record<string, number>), alerts: alerts.slice(0, 100) };
}
export async function processPendingTrialWhatsApp() {
  const accounts = await loadAccounts();
  const pending = accounts.filter(a => ['pending', 'rejected'].includes(a.trialWhatsAppAlert?.state)).slice(0, 5);
  for (const account of pending) await dispatchTrialWhatsApp(account.id, true);
  return trialWhatsAppStatus();
}
