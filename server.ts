import { loadAccounts, saveAccounts, grantAccessDays } from './src/server/accountStore';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { sessionCookieHeader } from './src/server/sessionSecurity';
import { authMeRouter } from './src/server/authMeRouter';
import { securityMiddleware } from './src/server/securityMiddleware';
import { requestProtection } from './src/server/requestProtection';
import { commercialRouter } from './src/server/commercialRouter';
import { secureMercadoPago } from './src/server/secureMercadoPago';
import { securePaymentConfirmation } from './src/server/securePaymentConfirmation';
import { trainingSessionsRouter } from './src/server/trainingSessionsRouter';
import { storageHealthRouter } from './src/server/storageHealthRouter';
import { smartSportsMontageRouter } from './src/server/smartSportsMontageRouter';
import { videoRenderRouter } from './src/server/videoRenderRouter';

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

interface VisitorRecord {
  id: string;
  timestamp: string;
  domain: string;
  page: string;
  deviceType: string;
  action: string;
  userAgent?: string;
  emailHint?: string;
}

const CLIENTS_FILE = path.join(process.cwd(), 'clients_db.json');
const VISITORS_FILE = path.join(process.cwd(), 'visitors_db.json');

function readArrayFile<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Could not read ${path.basename(filePath)}:`, error);
    return [];
  }
}

function loadClients(): ClientRecord[] {
  return loadAccounts();
}

function saveClients(clients: ClientRecord[]) {
  saveAccounts(clients);
}

function loadVisitors(): VisitorRecord[] {
  return readArrayFile<VisitorRecord>(VISITORS_FILE);
}

function saveVisitors(visitors: VisitorRecord[]) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors.slice(0, 300), null, 2), 'utf-8');
}

function cleanText(value: unknown, max = 300): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function startServer() {
  const app = express();
  // Dev server and container proxy expect the application on port 3000.
  // In container environments, process.env.PORT=8080 is reserved for nginx.
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));
  app.use(securityMiddleware);
  app.use(requestProtection);
  app.use(commercialRouter);
  app.use(secureMercadoPago);
  app.use(securePaymentConfirmation);
  app.use('/api/auth', authMeRouter);
  app.use('/api/training-sessions', trainingSessionsRouter);
  app.use('/api/smart-sports-montages', smartSportsMontageRouter);
  app.use('/api/video-render', videoRenderRouter);
  app.use('/api/storage-health', storageHealthRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'OPEN VOLEY' });
  });

  // Administrative routes. securityMiddleware executes before these handlers.
  app.get('/api/clients', (_req, res) => {
    res.json({ clients: loadClients() });
  });

  app.post('/api/clients/login', (_req, res) => {
    res.status(410).json({ error: 'Legacy login disabled' });
  });

  app.post('/api/clients/extend', (req, res) => {
    const email = cleanText(req.body?.email, 320).toLowerCase();
    const addDays = Number(req.body?.addDays);
    const clients = loadClients();
    const client = clients.find((candidate) => candidate.email.toLowerCase() === email);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    if (Number.isFinite(addDays)) {
      if (addDays < 0 || addDays > 365) {
        return res.status(400).json({ error: 'addDays out of range' });
      }
      grantAccessDays(client, addDays);
    }
    if (typeof req.body?.isBlocked === 'boolean') client.isBlocked = req.body.isBlocked;
    if (req.body?.resetDate === true) {
      client.firstLoginDate = new Date().toISOString();
      client.customGrantedDays = 0;
      client.isBlocked = false;
    }

    saveClients(clients);
    return res.json({ success: true, client });
  });

  app.post('/api/clients/create', (req, res) => {
    const email = cleanText(req.body?.email, 320).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const requestedDays = Number(req.body?.trialDays);
    const trialDurationDays = Number.isFinite(requestedDays)
      ? Math.min(365, Math.max(1, Math.floor(requestedDays)))
      : 30;

    const clients = loadClients();
    const now = new Date().toISOString();
    let client = clients.find((candidate) => candidate.email.toLowerCase() === email);

    if (client) {
      client.name = cleanText(req.body?.name, 150) || client.name;
      client.club = cleanText(req.body?.club, 150) || client.club;
      client.role = cleanText(req.body?.role, 100) || client.role;
      client.phone = cleanText(req.body?.phone, 80) || client.phone;
      client.notes = cleanText(req.body?.notes, 1000) || client.notes;
      client.trialDurationDays = trialDurationDays;
    } else {
      client = {
        id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        email,
        name: cleanText(req.body?.name, 150) || email.split('@')[0],
        firstLoginDate: now,
        lastLoginDate: now,
        trialDurationDays,
        customGrantedDays: 0,
        isBlocked: false,
        club: cleanText(req.body?.club, 150),
        role: cleanText(req.body?.role, 100) || 'Entrenador / DT',
        phone: cleanText(req.body?.phone, 80),
        notes: cleanText(req.body?.notes, 1000),
      };
      clients.unshift(client);
    }

    saveClients(clients);
    return res.json({ success: true, client });
  });

  app.post('/api/clients/delete', (req, res) => {
    const email = cleanText(req.body?.email, 320).toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const clients = loadClients();
    const updated = clients.filter((candidate) => candidate.email.toLowerCase() !== email);
    saveClients(updated);
    return res.json({ success: true, count: updated.length });
  });

  app.post('/api/visitors/track', (req, res) => {
    const visitors = loadVisitors();
    visitors.unshift({
      id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      domain: cleanText(req.body?.domain) || 'openvoley.com',
      page: cleanText(req.body?.page) || '/',
      deviceType: cleanText(req.body?.deviceType) || 'Web',
      action: cleanText(req.body?.action) || 'Visita Landing',
      userAgent: cleanText(req.headers['user-agent'], 500),
      emailHint: cleanText(req.body?.emailHint, 320),
    });
    saveVisitors(visitors);
    return res.json({ success: true });
  });

  app.get('/api/visitors', (_req, res) => {
    res.json({ visitors: loadVisitors() });
  });

  app.post('/api/visitors/clear', (_req, res) => {
    saveVisitors([]);
    res.json({ success: true });
  });

  // These paths are handled earlier by secureMercadoPago / securePaymentConfirmation.
  // Keeping fail-closed handlers prevents accidental exposure if middleware order changes.
  app.get('/api/mercadopago/config', (_req, res) => {
    res.json({
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || '',
      isConfigured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()),
      currency: 'ARS',
    });
  });
  app.get('/api/mercadopago/admin-credentials', (_req, res) =>
    res.status(410).json({ error: 'Runtime credential administration disabled' }),
  );
  app.post('/api/mercadopago/save-credentials', (_req, res) =>
    res.status(410).json({ error: 'Runtime credential storage disabled' }),
  );
  app.post('/api/mercadopago/test-credentials', (_req, res) =>
    res.status(410).json({ error: 'Runtime credential testing disabled' }),
  );
  app.post('/api/mercadopago/create-preference', (_req, res) =>
    res.status(410).json({ error: 'Legacy payment route disabled' }),
  );
  app.post('/api/mercadopago/webhook', (_req, res) =>
    res.status(410).send('Legacy webhook disabled'),
  );
  app.post('/api/mercadopago/confirm-payment', (_req, res) =>
    res.status(410).json({ error: 'Legacy payment confirmation disabled' }),
  );

  app.post('/api/ai-scout', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

      const query = cleanText(req.body?.query, 2000);
      if (!query) return res.status(400).json({ error: 'Query is required' });

      const contextJson = JSON.stringify(req.body?.context || {}).slice(0, 60000);
      const conversationJson = JSON.stringify(Array.isArray(req.body?.conversation) ? req.body.conversation.slice(-6) : []).slice(0, 12000);
      const ai = new GoogleGenAI({ apiKey });
      const prompt = [
        'Escribe en español. Eres OPEN AI, analista táctico profesional de voleibol de OPEN VOLEY.',
        'Responde la consulta de forma concreta y útil para un cuerpo técnico.',
        'REGLA CRÍTICA: usa exclusivamente CONTEXTO_OPEN_VOLEY. No inventes estadísticas, partidos, jugadores, lesiones, causas ni tendencias.',
        'Si una conclusión requiere datos que no existen en el contexto, di exactamente qué dato falta.',
        'Diferencia dato observado de interpretación. Incluye muestras (n) o cantidades cuando sean relevantes.',
        'Puedes comparar el partido actual con HISTORY sólo si allí hay partidos comparables registrados.',
        'EVIDENCE contiene hallazgos ya calculados por OPEN VOLEY con umbrales mínimos; puedes explicarlos, no exagerarlos.',
        'No afirmes significancia estadística.',
        `CONSULTA: ${query}`,
        `CONVERSACION_RECIENTE: ${conversationJson}`,
        `CONTEXTO_OPEN_VOLEY: ${contextJson}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return res.json({
        reply: response.text || 'No hay datos suficientes para generar una recomendación.',
      });
    } catch (error) {
      console.error('AI scout failed:', error);
      return res.status(502).json({ error: 'AI analysis failed' });
    }
  });

  app.post('/api/generate-prd', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

      const idea = cleanText(req.body?.idea, 5000);
      if (!idea) return res.status(400).json({ error: 'Idea is required' });

      const ai = new GoogleGenAI({ apiKey });
      const prompt = [
        'Responde en español y devuelve JSON válido.',
        'Analiza la siguiente idea de producto sin inventar datos externos ni cifras no justificadas.',
        `Idea: ${idea}`,
        `Mercado: ${cleanText(req.body?.targetMarket, 1000)}`,
        `Audiencia: ${cleanText(req.body?.targetAudience, 1000)}`,
        `Monetización: ${cleanText(req.body?.monetizationModel, 1000)}`,
        `Precio estimado: ${cleanText(req.body?.estimatedPrice, 1000)}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.2 },
      });

      if (!response.text) return res.status(502).json({ error: 'Empty AI response' });
      return res.json(JSON.parse(response.text));
    } catch (error) {
      console.error('PRD generation failed:', error);
      return res.status(502).json({ error: 'PRD generation failed' });
    }
  });

  // Any unmatched /api route MUST return JSON 404, never falling through to HTML SPA fallback
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
