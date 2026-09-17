import type { Request, Response, NextFunction } from 'express';
import { getSessionFromRequest } from './sessionSecurity';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function consume(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function clientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip;
  return ip || 'unknown';
}

function stringLength(value: unknown): number {
  return typeof value === 'string' ? value.length : 0;
}

export function requestProtection(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const ip = clientKey(req);

  if (req.method === 'POST' && path === '/api/auth/google') {
    if (!consume(`auth:${ip}`, 12, 10 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many authentication attempts' });
    }
  }

  if (req.method === 'POST' && path === '/api/visitors/track') {
    if (!consume(`visitor:${ip}`, 60, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Tracking rate limit exceeded' });
    }

    const body = req.body || {};
    for (const key of ['domain', 'page', 'deviceType', 'action', 'emailHint']) {
      if (stringLength(body[key]) > 300) {
        return res.status(400).json({ error: 'Tracking payload too large' });
      }
    }
  }

  if (req.method === 'POST' && (path === '/api/ai-scout' || path === '/api/generate-prd')) {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!consume(`ai:${session.userId}`, 30, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'AI request limit reached. Try again later.' });
    }

    if (!process.env.GEMINI_API_KEY?.trim()) {
      return res.status(503).json({
        error: 'AI service is not configured',
        reply: 'OPEN AI no puede generar una recomendación verificada en este momento.',
      });
    }

    if (path === '/api/ai-scout') {
      const query = req.body?.query;
      if (typeof query !== 'string' || !query.trim() || query.length > 2000) {
        return res.status(400).json({ error: 'Invalid AI query' });
      }

      const summary = req.body?.matchSummary;
      if (summary && JSON.stringify(summary).length > 15000) {
        return res.status(413).json({ error: 'Match summary is too large' });
      }
    }

    if (path === '/api/generate-prd') {
      const body = req.body || {};
      const totalLength = ['idea', 'targetMarket', 'targetAudience', 'monetizationModel', 'estimatedPrice']
        .reduce((sum, key) => sum + stringLength(body[key]), 0);
      if (totalLength > 12000) {
        return res.status(413).json({ error: 'Request is too large' });
      }
    }
  }

  return next();
}
