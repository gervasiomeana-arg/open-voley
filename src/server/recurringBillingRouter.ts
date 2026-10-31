import { Router } from 'express';
import { asyncHandler } from './asyncHandler';
import { getSessionFromRequest } from './sessionSecurity';
import { BillingError, billingSummary, cancelSubscription, createSubscription, refreshBilling } from './recurringBilling';
export const recurringBillingRouter = Router();
for (const [method, path, action] of [
  ['get', '/api/mercadopago/subscription', (id: string) => billingSummary(id)],
  ['post', '/api/mercadopago/subscription/create', (id: string, b: any) => createSubscription(id, b?.planId, b?.consent, b?.currency)],
  ['post', '/api/mercadopago/subscription/recheck', (id: string) => refreshBilling(id)],
  ['post', '/api/mercadopago/subscription/cancel', (id: string) => cancelSubscription(id)],
] as const) {
  recurringBillingRouter[method](path, asyncHandler(async (req, res) => {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Ingresá con tu cuenta de Google.' });
    try { res.json(await action(session.userId, req.body)); }
    catch (e) { if (e instanceof BillingError) return res.status(e.status).json({ error: e.message }); throw e; }
  }));
}
