import { recurringPaidThrough } from '../shared/accessPeriod';
import { randomUUID } from 'node:crypto';
import { loadAccounts, saveAccounts } from './accountStore';
import { CloudStorageError } from './supabaseStore';
import { DEFAULT_PRICES, getPrices, recordPaymentEvent, saveReconciliation } from './commercialStore';

type PlanId = keyof typeof DEFAULT_PRICES;
export class BillingError extends Error {
  constructor(message: string, public status = 502, public definitive = false) { super(message); }
}
export function recurringConfigured() {
  return process.env.MERCADOPAGO_SUBSCRIPTIONS_ENABLED === 'true' &&
    !!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() && !!process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() && validAppUrl();
}
function validAppUrl() {
  try { const u = new URL(process.env.APP_URL || ''); return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && u.pathname === '/'; } catch { return false; }
}
export async function mpRequest(path: string, method = 'GET', body?: object) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new BillingError('Mercado Pago no está configurado.', 503);
  let r: Response;
  try { r = await fetch(`https://api.mercadopago.com${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
  }); } catch { throw new BillingError('No se pudo confirmar la operación con Mercado Pago. Actualizá el estado antes de reintentar.'); }
  if (!r.ok) throw new BillingError('Mercado Pago no pudo completar la operación. Actualizá el estado o contactá a administración.', 502, r.status >= 400 && r.status < 500 && ![408, 429].includes(r.status));
  return r.json();
}
// Serialize local mutations; Supabase's existing account revision check protects other instances.
let writing: Promise<unknown> = Promise.resolve();
async function changeAccount<T>(userId: string, change: (account: any) => T): Promise<T> {
  const task = writing.then(async () => {
    for (let n = 0; n < 4; n++) {
      const accounts = await loadAccounts(), account = accounts.find(a => a.id === userId);
      if (!account) throw new BillingError('Cuenta no disponible.', 404);
      const result = change(account);
      try { await saveAccounts(accounts); return result; }
      catch (e) { if (!(e instanceof CloudStorageError) || e.status !== 409 || n === 3) throw e; }
    }
    throw new BillingError('Reintentá la actualización.', 409);
  });
  writing = task.catch(() => {});
  return task;
}
function subscriptions(account: any): any[] { return account.billingSubscriptions || []; }
function findSubscription(account: any, id: string) { return subscriptions(account).find(s => s.id === id); }
export function safeCheckout(value: unknown) {
  try { const u = new URL(String(value)); return u.protocol === 'https:' && u.hostname === 'www.mercadopago.com.ar' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
function publicSubscription(s: any) {
  return s ? { id: s.id || null, planId: s.planId, amount: s.amount, currency: 'ARS', status: s.status,
    nextPaymentDate: s.nextPaymentDate || null, checkoutUrl: s.status === 'pending' ? safeCheckout(s.checkoutUrl) : null } : null;
}
export async function billingSummary(userId: string) {
  const a = (await loadAccounts()).find(a => a.id === userId);
  if (!a) throw new BillingError('Cuenta no disponible.', 404);
  return { enabled: recurringConfigured(), subscription: publicSubscription(subscriptions(a).at(-1)), paidUntil: recurringPaidUntil(a) };
}
export function recurringPaidUntil(account: any): string | null {
  const end = recurringPaidThrough(account);
  return Number.isFinite(end) ? new Date(end).toISOString() : null;
}
export function nextCalendarMonth(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) throw new BillingError('Fecha de facturación inválida.');
  const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); return d.toISOString();
}
function verifySubscription(data: any, stored: any) {
  const r = data.auto_recurring;
  if (String(data.id) !== stored.id || data.external_reference !== stored.reference ||
      r?.frequency !== 1 || r?.frequency_type !== 'months' || r?.currency_id !== 'ARS' ||
      Number(r?.transaction_amount) !== stored.amount || !data.collector_id || !['pending', 'authorized', 'paused', 'cancelled'].includes(data.status))
    throw new BillingError('La suscripción no coincide con el plan contratado.', 409);
}
async function locate(id: string) {
  if (!/^[a-zA-Z0-9]{1,64}$/.test(id)) throw new BillingError('Suscripción inválida.', 400);
  const accounts = await loadAccounts(), owner = accounts.find(a => findSubscription(a, id));
  return owner ? { owner, stored: findSubscription(owner, id) } : null;
}
export async function syncSubscription(id: string) {
  const found = await locate(id);
  if (!found) return null; // Other products in the seller account are ignored.
  const data = await mpRequest(`/preapproval/${id}`);
  verifySubscription(data, found.stored);
  await changeAccount(found.owner.id, a => {
    const s = findSubscription(a, id);
    // Cancellation is terminal. A delayed older notification cannot reactivate it.
    if (s.status !== 'cancelled') s.status = data.status;
    s.collectorId = String(data.collector_id); s.payerId = data.payer_id ? String(data.payer_id) : null;
    s.nextPaymentDate = data.next_payment_date || null; s.updatedAt = new Date().toISOString();
  });
  return { userId: found.owner.id, stored: found.stored, data };
}
export async function createSubscription(userId: string, planId: string, consent: boolean, currency: string) {
  if (!recurringConfigured()) throw new BillingError('La suscripción automática todavía no está habilitada.', 503);
  if (consent !== true || currency !== 'ARS' || !Object.hasOwn(DEFAULT_PRICES, planId))
    throw new BillingError('Elegí un plan en pesos y aceptá el cobro mensual automático.', 400);
  const amount = Number((await getPrices())[planId as PlanId].monthly.ARS);
  if (!Number.isFinite(amount) || amount <= 0) throw new BillingError('El precio no está disponible.', 503);
  const reservation = await changeAccount(userId, a => {
    if (a.isBlocked) throw new BillingError('Cuenta bloqueada.', 403);
    const previous = subscriptions(a).at(-1);
    if (previous && !['cancelled', 'failed'].includes(previous.status)) {
      if (previous.planId === planId && previous.status === 'pending' && safeCheckout(previous.checkoutUrl)) return { existing: previous };
      throw new BillingError('Ya tenés una suscripción o una operación pendiente. Actualizá su estado antes de contratar otra.', 409);
    }
    const s = { reference: `ovsub:${randomUUID()}`, planId, amount, currency: 'ARS', status: 'creating',
      consentAt: new Date().toISOString(), consentVersion: 'monthly-ars-v1', createdAt: new Date().toISOString() };
    a.billingSubscriptions = [...subscriptions(a), s]; return { created: s, email: a.email };
  });
  if (reservation.existing) return { initPoint: safeCheckout(reservation.existing.checkoutUrl) };
  const s = reservation.created!;
  // Persist the reservation BEFORE sending. An ambiguous provider response must never create a second charge agreement.
  let data: any;
  try { data = await mpRequest('/preapproval', 'POST', {
    reason: `OPEN VOLEY - ${DEFAULT_PRICES[planId as PlanId].name} mensual`, external_reference: s.reference,
    payer_email: reservation.email, auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: amount, currency_id: 'ARS' },
    back_url: `${process.env.APP_URL!.replace(/\/$/, '')}/?subscription_return=1`, status: 'pending',
  }); } catch (e) {
    if (e instanceof BillingError && e.definitive) await changeAccount(userId, a => {
      subscriptions(a).find(x => x.reference === s.reference).status = 'failed';
    });
    throw e;
  }
  if (!/^[a-zA-Z0-9]{1,64}$/.test(String(data.id)) || !safeCheckout(data.init_point))
    throw new BillingError('La suscripción requiere verificación. Actualizá su estado; no vuelvas a pagar.');
  verifySubscription(data, { ...s, id: String(data.id) });
  await changeAccount(userId, a => {
    const target = subscriptions(a).find(x => x.reference === s.reference);
    Object.assign(target, { id: String(data.id), status: data.status, checkoutUrl: safeCheckout(data.init_point), collectorId: String(data.collector_id) });
  });
  return { initPoint: safeCheckout(data.init_point) };
}
export async function reconcileInvoice(id: string) {
  if (!/^\d{1,30}$/.test(id)) throw new BillingError('Factura inválida.', 400);
  const invoice = await mpRequest(`/authorized_payments/${id}`);
  if (String(invoice.id) !== id) throw new BillingError('La factura no coincide.');
  const found = await syncSubscription(String(invoice.preapproval_id));
  if (!found) return;
  const paymentId = String(invoice.payment?.id || '');
  if (!/^\d{1,30}$/.test(paymentId)) return; // Scheduled/rejected invoices grant nothing.
  const p = await mpRequest(`/v1/payments/${paymentId}`), s = found.stored;
  if (String(p.id) !== paymentId || String(p.collector_id) !== String(found.data.collector_id) ||
      !found.data.payer_id || String(p.payer?.id) !== String(found.data.payer_id) ||
      invoice.currency_id !== 'ARS' || p.currency_id !== 'ARS' ||
      Number(invoice.transaction_amount) !== s.amount || Number(p.transaction_amount) !== s.amount)
    throw new BillingError('El pago no coincide con la factura y la suscripción.', 409);
  const start = new Date(invoice.debit_date).toISOString();
  const next = Date.parse(found.data.next_payment_date);
  const end = next > Date.parse(start) && next - Date.parse(start) <= 35 * 86400000
    ? new Date(next).toISOString() : nextCalendarMonth(start);
  if (Date.parse(start) > Date.now() + 86400000) throw new BillingError('La factura todavía no corresponde a un período vigente.', 409);
  const refunded = Number(p.transaction_amount_refunded || 0);
  if (!Number.isFinite(refunded) || refunded < 0 || refunded > s.amount || (refunded > 0 && refunded < s.amount))
    throw new BillingError('Reembolso parcial o inválido: requiere revisión de administración.', 409);
  const reversed = p.status === 'refunded' || p.status === 'charged_back' || refunded === s.amount;
  const outcome = await changeAccount(found.userId, a => {
    const sub = findSubscription(a, String(invoice.preapproval_id));
    sub.lastPaymentStatus = String(p.status); sub.updatedAt = new Date().toISOString();
    a.payments ??= [];
    const existing = a.payments.find((x: any) => String(x.paymentId) === paymentId);
    if (existing && (!existing.recurring || existing.invoiceId !== id)) throw new BillingError('Pago ya vinculado a otra operación.', 409);
    if (!reversed && (p.status !== 'approved' || a.isBlocked || existing)) return {
      status: String(p.status), state: a.isBlocked ? 'review' : p.status === 'approved' ? 'done' : 'pending',
      action: 'none', alreadyProcessed: !!existing, reason: a.isBlocked ? 'Cuenta bloqueada; no se otorga acceso.' : existing ? 'Pago ya procesado.' : 'El pago no está aprobado.',
    };
    if (reversed && existing) { existing.status = p.status === 'charged_back' ? 'charged_back' : 'refunded'; return { status: existing.status, state: 'done', action: 'access-revoked', reason: 'Período reembolsado retirado.' }; }
    a.payments.unshift({ id: randomUUID(), paymentId, invoiceId: id, subscriptionId: String(invoice.preapproval_id),
      recurring: true, planId: s.planId, planName: DEFAULT_PRICES[s.planId as PlanId].name, amount: s.amount,
      currency: 'ARS', status: reversed ? 'refunded' : 'approved', date: new Date().toISOString(),
      periodStart: start, periodEnd: end, grantedDays: 0, paymentMethod: 'mercadopago-subscription' });
    if (!reversed) a.plan = 'Mensual Pro';
    return { status: reversed ? 'refunded' : 'approved', state: 'done', action: reversed ? 'none' : 'access-granted', reason: reversed ? 'Reversión registrada.' : 'Período mensual acreditado.', alreadyProcessed: false };
  });
  const result = { ...outcome, userId: found.userId, amount: s.amount, currency: 'ARS', periodEnd: end, source: 'subscription' };
  await saveReconciliation(paymentId, result);
  await recordPaymentEvent(paymentId, result);
  return result;
}
export async function reconcileRecurringPayment(id: string) {
  const result = await mpRequest(`/authorized_payments/search?payment_id=${encodeURIComponent(id)}`);
  const invoice = result.results?.find((i: any) => String(i.payment?.id) === id);
  if (!invoice) throw new BillingError('El pago recurrente todavía no tiene una factura verificable.');
  return reconcileInvoice(String(invoice.id));
}
export async function refreshBilling(userId: string) {
  let a = (await loadAccounts()).find(a => a.id === userId), s = subscriptions(a).at(-1);
  if (!s || s.status === 'failed') return billingSummary(userId);
  if (!s.id) {
    const result = await mpRequest(`/preapproval/search?external_reference=${encodeURIComponent(s.reference)}`);
    const matches = result.results?.filter((x: any) => x.external_reference === s.reference) || [];
    if (matches.length !== 1) throw new BillingError('La creación todavía no está confirmada. No generes otra suscripción; contactá a administración.', 409);
    const recovered = matches[0]; verifySubscription(recovered, { ...s, id: String(recovered.id) });
    await changeAccount(userId, account => Object.assign(subscriptions(account).find(x => x.reference === s.reference),
      { id: String(recovered.id), status: recovered.status, checkoutUrl: safeCheckout(recovered.init_point) }));
    s = { ...s, id: String(recovered.id) };
  }
  await syncSubscription(s.id);
  // Paged reconciliation repairs missed callbacks and updates refunds as well as approvals.
  for (let offset = 0; offset < 1000; offset += 100) {
    const page = await mpRequest(`/authorized_payments/search?preapproval_id=${s.id}&limit=100&offset=${offset}`);
    for (const i of page.results || []) if (String(i.preapproval_id) === s.id) await reconcileInvoice(String(i.id));
    if (offset + (page.results?.length || 0) >= Number(page.paging?.total || 0)) break;
  }
  return billingSummary(userId);
}
export async function cancelSubscription(userId: string) {
  const a = (await loadAccounts()).find(a => a.id === userId), s = subscriptions(a).at(-1);
  if (!s?.id) throw new BillingError('Actualizá el estado antes de cancelar.', 409);
  if (s.status !== 'cancelled') {
    await mpRequest(`/preapproval/${s.id}`, 'PUT', { status: 'cancelled' });
    const result = await syncSubscription(s.id);
    if (result?.data.status !== 'cancelled') throw new BillingError('Mercado Pago todavía no confirmó la cancelación.');
  }
  return billingSummary(userId);
}
