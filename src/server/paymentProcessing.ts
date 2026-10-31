import { randomUUID } from 'node:crypto';
import { loadAccounts, saveAccounts, grantAccessDays } from './accountStore';
import { DEFAULT_PRICES, getQuote, recordPaymentEvent, getReconciliation, saveReconciliation } from './commercialStore';
export function parsePaymentReference(value: unknown) {
    const match = /^openvoley:([^:]+):(plan-dt|plan-club-pro|plan-federacion):(monthly|annual):[a-zA-Z0-9-]+$/.exec(String(value || ''));
    return match ? { userId: match[1], planId: match[2] as keyof typeof DEFAULT_PRICES, billing: match[3] as 'monthly' | 'annual' } : null;
}
export async function fetchVerifiedPayment(id: string) {
    if (!/^[0-9]{1,30}$/.test(id))
        throw new Error('Identificador de pago inválido.');
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token)
        throw new Error('Mercado Pago no está configurado.');
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok)
        throw new Error('No se pudo consultar el pago en Mercado Pago.');
    const data = await response.json();
    if (String(data?.id) !== id)
        throw new Error('La respuesta no coincide con el pago consultado.');
    return data;
}
export interface PaymentResult {
    state: 'done' | 'review' | 'pending';
    action: string;
    reason: string;
    status: string;
    userId?: string;
    amount?: number;
    currency?: string;
    grantedDays?: number;
    alreadyProcessed?: boolean;
    plan?: string;
}
export async function applyVerifiedPayment(data: any, id: string): Promise<PaymentResult> {
    const status = String(data?.status || 'unknown');
    const base = { status };
    const review = (reason: string): PaymentResult => ({ ...base, state: 'review', action: 'none', reason });
    if (String(data?.id) !== id)
        return review('La respuesta no coincide con el pago solicitado.');
    if (String(data.external_reference || '').startsWith('ovsub:')) {
        const { reconcileRecurringPayment } = await import('./recurringBilling');
        const result = await reconcileRecurringPayment(id);
        return result ? result as PaymentResult : review('Suscripción ajena a OPEN VOLEY.');
    }
    const ref = parsePaymentReference(data.external_reference);
    if (!ref)
        return review('Referencia ajena a OPEN VOLEY o inválida.');
    const accounts = await loadAccounts(), account = accounts.find(a => a.id === ref.userId);
    if (!account)
        return review('La cuenta indicada no existe.');
    if (String(data?.payer?.email || '').trim().toLowerCase() !== String(account.email).trim().toLowerCase())
        return review('El correo del pagador no coincide con la cuenta.');
    const currency = String(data.currency_id), amount = Number(data.transaction_amount), quote = await getQuote(String(data.external_reference));
    if (!['ARS', 'USD'].includes(currency))
        return review('Moneda no admitida.');
    const expected = quote ? (quote.userId === ref.userId && quote.planId === ref.planId && quote.billing === ref.billing && quote.currency === currency ? quote.amount : NaN) : DEFAULT_PRICES[ref.planId][ref.billing][currency];
    if (!Number.isFinite(amount) || amount <= 0 || amount !== expected)
        return review('El importe no coincide con la cotización del plan.');
    const details = { status, userId: account.id, amount, currency, plan: account.plan };
    const existing = account.payments?.find((p: any) => String(p.paymentId) === id), days = ref.billing === 'annual' ? 365 : 30;
    const refunded = Number(data.transaction_amount_refunded || 0);
    if (!Number.isFinite(refunded) || refunded < 0 || refunded > amount)
        return { ...details, state: 'review', action: 'none', reason: 'Importe reembolsado inválido.' };
    if (data.status_detail === 'partially_refunded' || (refunded > 0 && refunded < amount))
        return { ...details, state: 'review', action: 'none', reason: 'Reembolso parcial: revisar acceso e importe manualmente.' };
    if (status === 'refunded' || status === 'charged_back' || refunded === amount) {
        details.status = status === 'charged_back' ? 'charged_back' : 'refunded';
        if (existing?.status === 'approved') {
            const granted = Number(existing.grantedDays ?? days);
            if (![30, 365].includes(granted))
                return { ...details, state: 'review', action: 'none', reason: 'Días de acceso del pago no válidos.' };
            account.customGrantedDays = (account.customGrantedDays || 0) - granted;
            existing.status = status === 'charged_back' ? 'charged_back' : 'refunded';
            existing.reversedAt = new Date().toISOString();
            account.sessionVersion = (account.sessionVersion || 0) + 1;
            await saveAccounts(accounts);
            return { ...details, state: 'done', action: 'access-revoked', reason: 'Acceso del pago retirado; sesiones revocadas.' };
        }
        // Keep a terminal marker even if a refund arrives before the approval.
        if (!existing) {
            account.payments ??= [];
            account.payments.unshift({ id: randomUUID(), paymentId: id, planId: ref.planId, planName: DEFAULT_PRICES[ref.planId].name, amount, currency, status: status === 'charged_back' ? 'charged_back' : 'refunded', date: new Date().toISOString(), grantedDays: 0 });
            await saveAccounts(accounts);
        }
        return { ...details, state: 'done', action: 'none', alreadyProcessed: true, reason: 'Reversión registrada; no hay acceso pendiente de retirar.' };
    }
    if (status !== 'approved')
        return { ...details, state: ['pending', 'in_process', 'authorized', 'in_mediation'].includes(status) ? 'pending' : 'done', action: 'none', reason: 'El pago no está aprobado; no se otorga acceso.' };
    if (account.isBlocked)
        return { ...details, state: 'review', action: 'none', reason: 'Cuenta bloqueada; el pago no la desbloquea.' };
    if (existing) {
        if (existing.status !== 'approved')
            return { ...details, state: 'review', action: 'none', reason: 'El pago ya tiene una reversión registrada.' };
        return { ...details, state: 'done', action: 'none', alreadyProcessed: true, reason: 'Pago ya aplicado; no se duplican días.' };
    }
    grantAccessDays(account, days);
    account.plan = ref.billing === 'annual' ? 'Anual Pro' : 'Mensual Pro';
    account.payments ??= [];
    account.payments.unshift({ id: randomUUID(), paymentId: id, planId: ref.planId, planName: `${DEFAULT_PRICES[ref.planId].name} (${ref.billing === 'annual' ? 'Anual' : 'Mensual'})`, amount, currency, status: 'approved', date: new Date().toISOString(), paymentMethod: String(data.payment_method_id || 'mercadopago'), grantedDays: days });
    await saveAccounts(accounts);
    return { ...details, state: 'done', action: 'access-granted', reason: 'Pago verificado y acceso aplicado.', grantedDays: days, alreadyProcessed: false, plan: account.plan };
}
export async function rememberPaymentResult(id: string, result: PaymentResult, source: string, admin?: string) {
    await recordPaymentEvent(id, { ...result, source, ...(admin ? { admin } : {}) });
    return await saveReconciliation(id, { ...result, source, lastError: null });
}
const running = new Map<string, Promise<PaymentResult>>();
export async function reconcilePayment(id: string, source: string, admin?: string) {
    const active = running.get(id);
    if (active)
        return active;
    const task = (async () => {
        const previous = await getReconciliation(id);
        await saveReconciliation(id, { state: 'retry', source, attempts: (previous?.attempts || 0) + 1, lastError: null });
        try {
            const result = await applyVerifiedPayment(await fetchVerifiedPayment(id), id);
            await rememberPaymentResult(id, result, source, admin);
            return result;
        }
        catch (error) {
            await saveReconciliation(id, { state: 'retry', lastError: 'No se pudo verificar o guardar el pago. Reintentá la consulta.', source });
            await recordPaymentEvent(id, { state: 'retry', action: 'none', reason: 'Consulta o procesamiento no completado.', source, ...(admin ? { admin } : {}) });
            throw error;
        }
    })();
    running.set(id, task);
    try {
        return await task;
    }
    finally {
        running.delete(id);
    }
}
