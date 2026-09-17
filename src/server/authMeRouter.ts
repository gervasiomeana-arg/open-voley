import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
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

function verifySessionToken(token: string): SessionPayload | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('SESSION_SECRET is not configured');
    return null;
  }

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

export const authMeRouter = Router();

authMeRouter.get('/me', (req, res) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      authenticated: false,
      error: 'Authentication required',
    });
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({
      authenticated: false,
      error: 'Authentication required',
    });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({
      authenticated: false,
      error: 'Invalid or expired session',
    });
  }

  const clients = loadClients();
  const sessionEmail = session.email.toLowerCase().trim();
  const client = clients.find(
    (candidate) =>
      candidate.id === session.userId &&
      candidate.email.toLowerCase().trim() === sessionEmail,
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
      role: client.role || session.role || 'Entrenador',
      plan: client.plan || null,
      club: client.club || null,
    },
  });
});
