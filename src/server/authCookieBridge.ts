import type { Request, Response, NextFunction } from 'express';
import { sessionCookieHeader } from './sessionSecurity';

export function authCookieBridge(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' || req.path !== '/api/auth/google') {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = ((body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && body?.sessionToken) {
      res.setHeader('Set-Cookie', sessionCookieHeader(String(body.sessionToken)));
      const { sessionToken: _sessionToken, ...safeBody } = body;
      return originalJson(safeBody);
    }

    return originalJson(body);
  }) as typeof res.json;

  return next();
}
