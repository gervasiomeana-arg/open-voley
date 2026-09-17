import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
}

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

function verifySessionToken(token: string): SessionPayload | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (
      !decoded ||
      typeof decoded !== 'object' ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string'
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: typeof decoded.role === 'string' ? decoded.role : undefined,
    };
  } catch {
    return null;
  }
}

function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' && req.path === '/api/clients/login') {
    return res.status(410).json({
      error: 'Legacy login disabled',
      message: 'Use Google Sign-In via /api/auth/google.',
    });
  }

  const routeKey = `${req.method} ${req.path}`;
  if (!protectedAdminRoutes.has(routeKey)) {
    return next();
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) {
    return res.status(503).json({
      error: 'Admin access is not configured',
    });
  }

  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authorization.slice('Bearer '.length).trim();
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (!adminEmails.has(session.email.trim().toLowerCase())) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
}
