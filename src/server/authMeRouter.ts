import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { clearSessionCookieHeader, getSessionFromRequest } from './sessionSecurity';

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
}

const CLIENTS_FILE = path.join(process.cwd(), 'clients_db.json');

function loadClients(): ClientRecord[] {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) return [];
    const raw = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading clients for session validation:', error);
    return [];
  }
}

function getTrialInfo(client: ClientRecord) {
  const firstLoginMs = new Date(client.firstLoginDate).getTime();
  const totalAllowedDays = client.trialDurationDays + (client.customGrantedDays || 0);
  const elapsedMs = Math.max(0, Date.now() - firstLoginMs);
  const remainingMs = totalAllowedDays * 24 * 60 * 60 * 1000 - elapsedMs;

  return {
    daysRemaining: Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000))),
    isExpired: remainingMs <= 0 || !!client.isBlocked,
    firstLoginDate: client.firstLoginDate,
    totalAllowedDays,
    elapsedDays: Math.floor(elapsedMs / (24 * 60 * 60 * 1000)),
  };
}

export const authMeRouter = Router();

authMeRouter.get('/me', (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ authenticated: false, error: 'Authentication required' });
  }

  const clients = loadClients();
  const client = clients.find(
    (candidate) =>
      candidate.id === session.userId &&
      candidate.email.toLowerCase().trim() === session.email,
  );

  if (!client || client.isBlocked) {
    return res.status(401).json({
      authenticated: false,
      error: client?.isBlocked ? 'Account blocked' : 'User not found',
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id: client.id,
      email: client.email,
      name: client.name,
      picture: client.picture || '',
      role: client.role || session.role || 'Entrenador',
      plan: client.plan || null,
      club: client.club || null,
    },
    trial: getTrialInfo(client),
  });
});

authMeRouter.post('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookieHeader());
  return res.status(200).json({ success: true });
});
