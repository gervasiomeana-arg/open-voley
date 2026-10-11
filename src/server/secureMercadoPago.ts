import {validPaymentWebhookSignature} from './paymentWebhookSignature';
import { randomUUID } from 'node:crypto';
import { loadAccounts, saveAccounts, grantAccessDays } from './accountStore';
import { DEFAULT_PRICES, getPrices, getQuote, saveQuote, recordPaymentEvent } from './commercialStore';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getSessionFromRequest } from './sessionSecurity';

interface ClientRecord {
  id: string;
  email: string;
  name: string;
  firstLoginDate: string;
  lastLoginDate: string;
  trialDurationDays: number;
  customGrantedDays?: number;
  isBlocked?: boolean;
  plan?: string;
  payments?: Array<{
    id: string;
    paymentId?: string;
    planId: string;
    planName: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    paymentMethod?: string;
  }>;
}

const CLIENTS_FILE = path.join(process.cwd(), 'clients_db.json');

const PLAN_CATALOG = DEFAULT_PRICES;

type PlanId = keyof typeof PLAN_CATALOG;
type BillingCycle = 'monthly' | 'annual';
type Currency = 'ARS' | 'USD';

const loadClients = loadAccounts;
const saveClients = saveAccounts;

function accessToken(): string {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || '';
}

function baseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.get('host');
  if (!host) return '';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
  return `${protocol}://${host}`;
}

function parseReference(value: unknown): { userId: string; planId: PlanId; billing: BillingCycle } | null {
  const raw = String(value || '');
  const match = /^openvoley:([^:]+):(plan-dt|plan-club-pro|plan-federacion):(monthly|annual):[a-zA-Z0-9-]+$/.exec(raw);
  if (!match) return null;
  return {
    userId: match[1],
    planId: match[2] as PlanId,
    billing: match[3] as BillingCycle,
  };
}

function paymentPlanName(planId: PlanId, billing: BillingCycle) {
  return `${PLAN_CATALOG[planId].name} (${billing === 'annual' ? 'Anual' : 'Mensual'})`;
}

async function fetchVerifiedPayment(paymentId: string) {
  const token = accessToken();
  if (!token) return null;
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json() as Promise<any>;
}

async function processApprovedPayment(paymentData: any) {
  if (!['approved','refunded','charged_back'].includes(paymentData?.status)) return;
  const paymentId = String(paymentData?.id || '').trim();
  const ref = parseReference(paymentData?.external_reference);
  if (!paymentId || !ref) return;

  const clients = loadClients();
  const client = clients.find((candidate) => candidate.id === ref.userId);
  if (!client || client.isBlocked) return;

  const payerEmail = String(paymentData?.payer?.email || '').toLowerCase().trim();
  if (!payerEmail || payerEmail !== client.email.toLowerCase().trim()) return;

  const currency = String(paymentData?.currency_id || '') as Currency;
  if (!['ARS', 'USD'].includes(currency)) return;
  const quote=getQuote(String(paymentData.external_reference));
  const expectedAmount = quote ? (quote.currency===currency && quote.userId===ref.userId ? quote.amount : NaN) : DEFAULT_PRICES[ref.planId][ref.billing][currency];
  const paidAmount = Number(paymentData?.transaction_amount);
  if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) return;

  if (!client.payments) client.payments = [];
  const existing=client.payments.find(p=>String(p.paymentId)===paymentId);
  if(paymentData.status!=='approved') {
    if(existing?.status==='approved') {
      client.customGrantedDays=(client.customGrantedDays || 0)-(ref.billing==='annual'?365:30);
      existing.status=paymentData.status;client.sessionVersion=(client.sessionVersion||0)+1;saveClients(clients);
      recordPaymentEvent(paymentId,{status:paymentData.status,userId:client.id});
    }
    return;
  }
  if (client.payments.some((payment) => String(payment.paymentId) === paymentId)) return;

  const days = ref.billing === 'annual' ? 365 : 30;
  grantAccessDays(client, days);
  client.isBlocked = false;
  client.plan = ref.billing === 'annual' ? 'Anual Pro' : 'Mensual Pro';
  client.payments.unshift({
    id: `pay-${Date.now()}`,
    paymentId,
    planId: ref.planId,
    planName: paymentPlanName(ref.planId, ref.billing),
    amount: paidAmount,
    currency,
    status: 'approved',
    date: new Date().toISOString(),
    paymentMethod: String(paymentData?.payment_method_id || 'mercadopago'),
  });
  saveClients(clients);
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
    if (!Object.prototype.hasOwnProperty.call(PLAN_CATALOG,planId) || !['monthly', 'annual'].includes(billing) || !['ARS', 'USD'].includes(currency)) {
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
    if (!/^[0-9]+$/.test(paymentId)) return res.status(400).send('Invalid payment id');
    const secret=process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
    if(!secret)return res.status(503).send('Webhook signature secret not configured');
    if(!validPaymentWebhookSignature(paymentId,String(req.headers['x-request-id']||''),String(req.headers['x-signature']||''),secret))return res.status(401).send('Invalid webhook signature');
    try {
      const paymentData = await fetchVerifiedPayment(paymentId);
      if (!paymentData) return res.status(502).send('Payment verification unavailable');
      await processApprovedPayment(paymentData);
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Secure Mercado Pago webhook processing failed:', error);
      return res.status(500).send('Payment processing failed');
    }
    return;
  }

  return next();
}
