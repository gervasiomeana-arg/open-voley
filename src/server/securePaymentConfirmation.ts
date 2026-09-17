import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

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

interface SessionPayload {
  userId: string;
  email: string;
}

const CLIENTS_FILE = path.join(process.cwd(), 'clients_db.json');
const MP_CREDENTIALS_FILE = path.join(process.cwd(), 'mp_credentials.json');

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

function getMPAccessToken(): string {
  const envToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (envToken) return envToken;

  try {
    if (fs.existsSync(MP_CREDENTIALS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MP_CREDENTIALS_FILE, 'utf-8'));
      if (typeof parsed?.accessToken === 'string' && parsed.accessToken.trim()) {
        return parsed.accessToken.trim();
      }
    }
  } catch (error) {
    console.error('Error loading Mercado Pago credentials:', error);
  }

  return '';
}

function verifySession(req: Request): SessionPayload | null {
  const secret = process.env.SESSION_SECRET;
  const authorization = req.headers.authorization;
  if (!secret || !authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (
      !decoded ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string'
    ) {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email.toLowerCase().trim() };
  } catch {
    return null;
  }
}

function derivePlan(paymentData: any) {
  const item = paymentData?.additional_info?.items?.[0] || {};
  const itemId = String(item.id || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  const extRef = String(paymentData?.external_reference || '').toLowerCase();
  const annual = /annual|anual|year/.test(`${itemId} ${title} ${extRef}`);

  return annual
    ? { days: 365, planId: 'anual', planName: 'Plan Anual OPEN VOLEY', plan: 'Anual Pro' }
    : { days: 30, planId: 'mensual', planName: 'Plan Mensual OPEN VOLEY', plan: 'Mensual Pro' };
}

export async function securePaymentConfirmation(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' || req.path !== '/api/mercadopago/confirm-payment') {
    return next();
  }

  const session = verifySession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const paymentId = String(req.body?.paymentId || '').trim();
  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  const accessToken = getMPAccessToken();
  if (!accessToken) {
    return res.status(503).json({ error: 'Mercado Pago is not configured' });
  }

  try {
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

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

    const payerEmail = String(paymentData?.payer?.email || '').toLowerCase().trim();
    if (!payerEmail || payerEmail !== session.email) {
      return res.status(403).json({ error: 'Payment owner does not match authenticated user' });
    }

    const clients = loadClients();
    const client = clients.find(
      (candidate) =>
        candidate.id === session.userId &&
        candidate.email.toLowerCase().trim() === session.email,
    );

    if (!client) {
      return res.status(404).json({ error: 'Authenticated client not found' });
    }

    if (client.isBlocked) {
      return res.status(403).json({ error: 'Account blocked' });
    }

    if (!client.payments) client.payments = [];
    const existing = client.payments.find((payment) => String(payment.paymentId) === paymentId);
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        plan: client.plan || null,
      });
    }

    const plan = derivePlan(paymentData);
    client.customGrantedDays = (client.customGrantedDays || 0) + plan.days;
    client.isBlocked = false;
    client.plan = plan.plan;
    client.payments.unshift({
      id: `pay-${Date.now()}`,
      paymentId,
      planId: plan.planId,
      planName: plan.planName,
      amount: Number(paymentData?.transaction_amount) || 0,
      currency: String(paymentData?.currency_id || 'ARS'),
      status: 'approved',
      date: new Date().toISOString(),
      paymentMethod: String(paymentData?.payment_method_id || 'mercadopago'),
    });

    saveClients(clients);

    return res.status(200).json({
      success: true,
      alreadyProcessed: false,
      plan: client.plan,
      grantedDays: plan.days,
      paymentId,
    });
  } catch (error) {
    console.error('Secure payment confirmation failed:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}
