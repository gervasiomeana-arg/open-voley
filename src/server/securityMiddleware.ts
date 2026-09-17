import type { Request, Response, NextFunction } from 'express';
import { getSessionFromRequest, isSameOriginMutation } from './sessionSecurity';

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

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (!isSameOriginMutation(req)) {
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

  if (!adminEmails.has(session.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
}
