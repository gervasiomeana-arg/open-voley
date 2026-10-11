import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { loadAccounts } from './accountStore';

export interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
}

export const SESSION_COOKIE_NAME = 'ov_session';

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, pair) => {
    const index = pair.indexOf('=');
    if (index <= 0) return acc;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!key) return acc;
    try {
      acc[key] = decodeURIComponent(value);
    } catch {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error('SESSION_SECRET must contain at least 32 characters');
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  }
  return secret;
}

export function createSessionToken(user: { userId: string; email: string; role?: string }): string {
  const secret = getSessionSecret();

  return jwt.sign(
    {
      userId: user.userId,
      sessionVersion: Number(loadAccounts().find(c => c.id === user.userId)?.sessionVersion || 0),
      email: user.email.toLowerCase().trim(),
      role: user.role || 'Entrenador',
    },
    secret,
    { expiresIn: '7d', algorithm: 'HS256', issuer: 'openvoley-v2', audience: 'openvoley-app' },
  );
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSessionSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'], issuer: 'openvoley-v2', audience: 'openvoley-app',
    }) as jwt.JwtPayload;

    if (
      !decoded ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string'
    ) {
      return null;
    }

    const account = loadAccounts().find(c => c.id === decoded.userId && String(c.email).toLowerCase().trim() === decoded.email);
    if (!account || account.isBlocked || Number(account.sessionVersion || 0) !== decoded.sessionVersion) return null;
    return {
      userId: decoded.userId,
      email: decoded.email.toLowerCase().trim(),
      role: typeof decoded.role === 'string' ? decoded.role : undefined,
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    const bearer = authorization.slice('Bearer '.length).trim();
    if (bearer) {
      const session = verifySessionToken(bearer);
      if (session) return session;
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  return cookieToken ? verifySessionToken(cookieToken) : null;
}

export function isSameOriginMutation(req: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;
  if (!host) return false;

  const allowedOrigins = new Set<string>();
  allowedOrigins.add(`https://${host}`);
  allowedOrigins.add(`http://${host}`);

  const forwardedHost = req.headers['x-forwarded-host'];
  if (typeof forwardedHost === 'string') {
    const primaryHost = forwardedHost.split(',')[0].trim();
    allowedOrigins.add(`https://${primaryHost}`);
    allowedOrigins.add(`http://${primaryHost}`);
  }

  if (process.env.APP_URL) {
    try {
      allowedOrigins.add(new URL(process.env.APP_URL).origin);
    } catch {
      // Ignore malformed APP_URL and fall back to request host.
    }
  }

  // Development / preview environment allowances
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_IFRAME_PREVIEW === 'true') {
    allowedOrigins.add('https://aistudio.google.com');
  }

  if (origin) {
    if (allowedOrigins.has(origin)) return true;
    try {
      const originHost = new URL(origin).host;
      if (originHost.endsWith('.run.app') || originHost.endsWith('.google.com')) {
        return true;
      }
    } catch {}
    return false;
  }
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.has(refererOrigin)) return true;
      const refererHost = new URL(referer).host;
      if (refererHost.endsWith('.run.app') || refererHost.endsWith('.google.com')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Non-browser clients may omit Origin/Referer. Require bearer auth in that case.
  return Boolean(getSessionFromRequest(req));
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
