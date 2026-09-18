import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getSessionFromRequest, isSameOriginMutation } from './sessionSecurity';

const CLIENTS_FILE = path.join(process.cwd(), 'clients_db.json');

const protectedAdminRoutes = new Set([
  'GET /api/clients',
  'POST /api/clients/create',
  'POST /api/clients/extend',
  'POST /api/clients/delete',
  'GET /api/visitors',
  'POST /api/visitors/clear',
  'GET /api/mercadopago/admin-credentials',
  'POST /api/mercadopago/save-credentials',
  'POST /api/mercadopago/test-credentials',
]);

function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function hasActiveAdminAccount(userId: string, email: string): boolean {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) return false;
    const parsed = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf-8'));
    if (!Array.isArray(parsed)) return false;

    const account = parsed.find(
      (candidate: any) =>
        candidate?.id === userId &&
        String(candidate?.email || '').toLowerCase().trim() === email,
    );

    return Boolean(account && !account.isBlocked);
  } catch (error) {
    console.error('Admin account validation failed:', error);
    return false;
  }
}

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Mercado Pago is an external server-to-server callback. Its payload is not trusted;
  // the payment handler re-fetches the payment from Mercado Pago before applying it.
  const isPaymentWebhook = req.method === 'POST' && req.path === '/api/mercadopago/webhook';
  if (!isPaymentWebhook && !isSameOriginMutation(req)) {
    return res.status(403).json({ error: 'Cross-origin request rejected' });
  }

  if (req.method === 'POST' && req.path === '/api/clients/login') {
    return res.status(410).json({
      error: 'Legacy login disabled',
      message: 'Use Google Sign-In via /api/auth/google.',
    });
  }

  const routeKey = `${req.method} ${req.path}`;
  if (!protectedAdminRoutes.has(routeKey)) return next();

  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) {
    return res.status(503).json({ error: 'Admin access is not configured' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!adminEmails.has(session.email) || !hasActiveAdminAccount(session.userId, session.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
}
