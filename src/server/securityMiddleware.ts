import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { loadAccounts, isAdminEmail, accountTrial } from './accountStore';
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
export async function securityMiddleware(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', req.path.startsWith('/api/') ? 'no-store' : 'no-cache');
    if (process.env.ALLOW_IFRAME_PREVIEW !== 'true') {
        // AI Studio renders its development preview inside an iframe on this exact origin.
        // Published deployments continue to permit only same-origin embedding.
        const editorOrigin = process.env.NODE_ENV === 'production' ? '' : ' https://aistudio.google.com';
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'" + editorOrigin);
    }
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IFRAME_PREVIEW !== 'true') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Mercado Pago is an external server-to-server callback. Its payload is not trusted;
    // the payment handler re-fetches the payment from Mercado Pago before applying it.
    const isPaymentWebhook = req.method === 'POST' && req.path === '/api/mercadopago/webhook';
    if (!isPaymentWebhook && !await isSameOriginMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin request rejected' });
    }
    if (req.method === 'POST' && req.path === '/api/clients/login') {
        return res.status(410).json({
            error: 'Legacy login disabled',
            message: 'Use Google Sign-In via /api/auth/google.',
        });
    }
    const routeKey = `${req.method} ${req.path}`;
    const isAdminRoute = protectedAdminRoutes.has(routeKey);
    if (!isAdminRoute && req.path.startsWith('/api/') && !req.path.startsWith('/api/auth/') && !req.path.startsWith('/api/mercadopago/') && !req.path.startsWith('/api/commercial/') && !['/api/health', '/api/visitors/track'].includes(req.path)) {
        const session = await getSessionFromRequest(req);
        if (!session)
            return res.status(401).json({ error: 'Authentication required' });
        const account = (await loadAccounts()).find(c => c.id === session.userId);
        if (!isAdminEmail(session.email) && accountTrial(account).isExpired && !(req.method==='GET' && (req.path==='/api/user-data'||req.path.startsWith('/api/user-data/'))))
            return res.status(403).json({ error: 'License expired' });
    }
    if (!isAdminRoute)
        return next();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").filter(v => v.trim());
    if (adminEmails.length === 0) {
        return res.status(503).json({ error: 'Admin access is not configured' });
    }
    const session = await getSessionFromRequest(req);
    if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isAdminEmail(session.email)) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
}
