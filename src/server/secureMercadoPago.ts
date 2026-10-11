import {reconcilePayment} from './paymentProcessing';
import {validPaymentWebhookSignature} from './paymentWebhookSignature';
import { randomUUID } from 'node:crypto';
import { loadAccounts } from './accountStore';
import { DEFAULT_PRICES, getPrices, saveQuote } from './commercialStore';
import type { Request, Response, NextFunction } from 'express';
import { getSessionFromRequest } from './sessionSecurity';

const PLAN_CATALOG = DEFAULT_PRICES;

type PlanId = keyof typeof PLAN_CATALOG;
type BillingCycle = 'monthly' | 'annual';
type Currency = 'ARS' | 'USD';

const loadClients = loadAccounts;

function accessToken(): string {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || '';
}

function baseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.trim().replace(/\/$/, '');
  const host = req.get('host');
  if (!host) return '';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
  return `${protocol}://${host}`;
}

function paymentPlanName(planId: PlanId, billing: BillingCycle) {
  return `${PLAN_CATALOG[planId].name} (${billing === 'annual' ? 'Anual' : 'Mensual'})`;
}

export async function secureMercadoPago(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' && req.path === '/api/mercadopago/config') {
    return res.status(200).json({
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || '',
      isConfigured: Boolean(accessToken()),
      currency: 'ARS',
    });
  }

  if (req.method === 'POST' && req.path === '/api/mercadopago/save-credentials') {
    return res.status(410).json({
      error: 'Runtime credential storage disabled',
      message: 'Configure Mercado Pago credentials using deployment secrets.',
    });
  }

  if (req.method === 'POST' && req.path === '/api/mercadopago/create-preference') {
    const session = getSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Authentication required' });

    const token = accessToken();
    if (!token) return res.status(503).json({ error: 'Mercado Pago is not configured' });

    const planId = String(req.body?.planId || '') as PlanId;
    const billing = String(req.body?.billingCycle || '') as BillingCycle;
    const currency = String(req.body?.currency || 'ARS') as Currency;
    if (!Object.prototype.hasOwnProperty.call(PLAN_CATALOG,planId) || billing !== 'monthly' || !['ARS', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid plan selection' });
    }

    const clients = loadClients();
    const client = clients.find(
      (candidate) => candidate.id === session.userId && candidate.email.toLowerCase().trim() === session.email,
    );
    if (!client || client.isBlocked) return res.status(403).json({ error: 'Account unavailable' });

    const appUrl = baseUrl(req);
    if (!appUrl) return res.status(500).json({ error: 'APP_URL is not configured' });

    const price = getPrices()[planId][billing][currency];
    const reference = `openvoley:${client.id}:${planId}:${billing}:${randomUUID()}`;

    saveQuote(reference, {userId:client.id,planId,billing,currency,amount:price});
    try {
      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: planId,
            title: `OPEN VOLEY - ${paymentPlanName(planId, billing)}`,
            quantity: 1,
            currency_id: currency,
            unit_price: price,
          }],
          payer: { email: client.email, name: client.name },
          back_urls: {
            success: `${appUrl}/?payment_status=approved`,
            failure: `${appUrl}/?payment_status=failure`,
            pending: `${appUrl}/?payment_status=pending`,
          },
          auto_return: 'approved',
          external_reference: reference,
          notification_url: `${appUrl}/api/mercadopago/webhook`,
          statement_descriptor: 'OPEN VOLEY',
          payment_methods: { excluded_payment_types: [], installments: 12 },
        }),
      });

      if (!mpResponse.ok) {
        console.error('Mercado Pago preference rejected:', await mpResponse.text());
        return res.status(502).json({ error: 'Mercado Pago rejected the checkout request' });
      }

      const preference: any = await mpResponse.json();
      return res.status(200).json({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        isRealMode: true,
      });
    } catch (error) {
      console.error('Mercado Pago preference error:', error);
      return res.status(502).json({ error: 'Could not create Mercado Pago checkout' });
    }
  }

  if (req.method === 'POST' && req.path === '/api/mercadopago/webhook') {
    // The webhook payload is never trusted. Payment ID is used only to re-query Mercado Pago.
    const paymentId = String(req.query['data.id'] || req.query.id || req.body?.data?.id || '').trim();
    if (!/^[0-9]{1,30}$/.test(paymentId)) return res.status(400).send('Invalid payment id');
    const secret=process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
    if(!secret)return res.status(503).send('Webhook signature secret not configured');
    if(!validPaymentWebhookSignature(paymentId,String(req.headers['x-request-id']||''),String(req.headers['x-signature']||''),secret))return res.status(401).send('Invalid webhook signature');
    try {
      await reconcilePayment(paymentId,'webhook');
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Secure Mercado Pago webhook processing failed:', error);
      return res.status(502).send('Payment verification or processing unavailable');
    }
    return;
  }

  return next();
}
