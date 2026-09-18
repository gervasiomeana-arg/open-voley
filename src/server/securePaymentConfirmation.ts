import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getSessionFromRequest } from './sessionSecurity';

interface PaymentRecord {
  id: string;
  paymentId?: string;
  preferenceId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  paymentMethod?: string;
}

interface ClientRecord {
  id: string;
  email: string;
  name: string;
  picture?: string;
  firstLoginDate: string;
  lastLoginDate: string;
  trialDurationDays: number;
  customGrantedDays?: number;
  isBlocked?: boolean;
  plan?: string;
  club?: string;
  role?: string;
  phone?: string;
  notes?: string;
  payments?: PaymentRecord[];
}

const CLIENTS_FILE = path.join(process.cwd(), 'clients_db.json');

const PLAN_CATALOG = {
  'plan-dt': {
    name: 'Plan DT / Entrenador',
    monthly: { ARS: 18000, USD: 19 },
    annual: { ARS: 160000, USD: 169 },
  },
  'plan-club-pro': {
    name: 'Plan Club Pro & Liga',
    monthly: { ARS: 35000, USD: 35 },
    annual: { ARS: 320000, USD: 315 },
  },
  'plan-federacion': {
    name: 'Plan Federación / Torneo',
    monthly: { ARS: 95000, USD: 99 },
    annual: { ARS: 850000, USD: 890 },
  },
} as const;

type PlanId = keyof typeof PLAN_CATALOG;
type BillingCycle = 'monthly' | 'annual';
type Currency = 'ARS' | 'USD';

function loadClients(): ClientRecord[] {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading clients for payment confirmation:', error);
    return [];
  }
}

function saveClients(clients: ClientRecord[]) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf-8');
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

function planName(planId: PlanId, billing: BillingCycle): string {
  return `${PLAN_CATALOG[planId].name} (${billing === 'annual' ? 'Anual' : 'Mensual'})`;
}

export async function securePaymentConfirmation(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' || req.path !== '/api/mercadopago/confirm-payment') {
    return next();
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const paymentId = String(req.body?.paymentId || '').trim();
  if (!/^[0-9]+$/.test(paymentId)) {
    return res.status(400).json({ error: 'A valid paymentId is required' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || '';
  if (!accessToken) {
    return res.status(503).json({ error: 'Mercado Pago is not configured' });
  }

  try {
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!paymentResponse.ok) {
      return res.status(502).json({ error: 'Could not verify payment with Mercado Pago' });
    }

    const paymentData: any = await paymentResponse.json();
    if (paymentData?.status !== 'approved') {
      return res.status(409).json({
        error: 'Payment is not approved',
        status: paymentData?.status || 'unknown',
      });
    }

    const reference = parseReference(paymentData?.external_reference);
    if (!reference || reference.userId !== session.userId) {
      return res.status(403).json({ error: 'Payment reference does not match authenticated user' });
    }

    const payerEmail = String(paymentData?.payer?.email || '').toLowerCase().trim();
    if (!payerEmail || payerEmail !== session.email) {
      return res.status(403).json({ error: 'Payment owner does not match authenticated user' });
    }

    const currency = String(paymentData?.currency_id || '') as Currency;
    if (!['ARS', 'USD'].includes(currency)) {
      return res.status(409).json({ error: 'Unexpected payment currency' });
    }

    const expectedAmount = PLAN_CATALOG[reference.planId][reference.billing][currency];
    const paidAmount = Number(paymentData?.transaction_amount);
    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
      return res.status(409).json({ error: 'Payment amount does not match selected plan' });
    }

    const clients = loadClients();
    const client = clients.find(
      (candidate) =>
        candidate.id === session.userId &&
        candidate.email.toLowerCase().trim() === session.email,
    );

    if (!client) return res.status(404).json({ error: 'Authenticated client not found' });
    if (client.isBlocked) return res.status(403).json({ error: 'Account blocked' });

    if (!client.payments) client.payments = [];
    const existing = client.payments.find((payment) => String(payment.paymentId) === paymentId);
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        plan: client.plan || null,
      });
    }

    const days = reference.billing === 'annual' ? 365 : 30;
    client.customGrantedDays = (client.customGrantedDays || 0) + days;
    client.isBlocked = false;
    client.plan = reference.billing === 'annual' ? 'Anual Pro' : 'Mensual Pro';
    client.payments.unshift({
      id: `pay-${Date.now()}`,
      paymentId,
      planId: reference.planId,
      planName: planName(reference.planId, reference.billing),
      amount: paidAmount,
      currency,
      status: 'approved',
      date: new Date().toISOString(),
      paymentMethod: String(paymentData?.payment_method_id || 'mercadopago'),
    });

    saveClients(clients);

    return res.status(200).json({
      success: true,
      alreadyProcessed: false,
      plan: client.plan,
      grantedDays: days,
      paymentId,
    });
  } catch (error) {
    console.error('Secure payment confirmation failed:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}
