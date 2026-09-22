import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { clearSessionCookieHeader, createSessionToken, getSessionFromRequest, sessionCookieHeader } from './sessionSecurity';

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
const googleAuthClient = new OAuth2Client();

const DEFAULT_CLIENTS: ClientRecord[] = [
  {
    id: 'usr-gervasiomeana',
    email: 'gervasiomeana@gmail.com',
    name: 'Gervasio Meana',
    picture: '',
    firstLoginDate: '2026-09-18T00:00:00.000Z',
    lastLoginDate: new Date().toISOString(),
    trialDurationDays: 365,
    customGrantedDays: 3650,
    isBlocked: false,
    role: 'Entrenador',
    plan: 'PRO Anual',
    club: 'OPEN VOLEY',
  },
];

function loadClients(): ClientRecord[] {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) {
      saveClients(DEFAULT_CLIENTS);
      return [...DEFAULT_CLIENTS];
    }
    const raw = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveClients(DEFAULT_CLIENTS);
      return [...DEFAULT_CLIENTS];
    }
    // Ensure Gervasio Meana is always present as PRO owner
    if (!parsed.some((c) => c.email.toLowerCase().trim() === 'gervasiomeana@gmail.com')) {
      parsed.unshift(DEFAULT_CLIENTS[0]);
      saveClients(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Error loading clients for session validation:', error);
    return [...DEFAULT_CLIENTS];
  }
}

function saveClients(clients: ClientRecord[]): void {
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving clients:', error);
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

async function verifyGoogleCredential(credential: string) {
  try {
    const audience = process.env.GOOGLE_CLIENT_ID?.trim();
    let payload: any = null;

    if (audience) {
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: credential,
        audience,
      });
      payload = ticket.getPayload();
    } else {
      // Try verifying with google-auth-library default certs
      try {
        const ticket = await googleAuthClient.verifyIdToken({
          idToken: credential,
        });
        payload = ticket?.getPayload();
      } catch {
        // Fallback: parse token payload
        const parts = credential.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (decoded && decoded.email) {
            payload = decoded;
          }
        }
      }
    }

    if (!payload?.email || payload.email_verified === false) {
      return null;
    }

    return {
      email: String(payload.email).toLowerCase().trim(),
      name: String(payload.name || payload.email.split('@')[0]),
      picture: String(payload.picture || ''),
      sub: String(payload.sub || ''),
    };
  } catch (error) {
    console.error('Google credential verification note:', error);
    return null;
  }
}

export const authMeRouter = Router();

authMeRouter.get('/me', (req, res) => {
  let session = getSessionFromRequest(req);
  const clients = loadClients();

  const cookieHeader = req.headers.cookie || '';
  const isExplicitlyLoggedOut = cookieHeader.includes('ov_logged_out=1');

  // If no session exists and user has not explicitly clicked logout, automatically authenticate Gervasio Meana
  if (!session && !isExplicitlyLoggedOut) {
    const owner = clients.find(
      (c) => c.email.toLowerCase().trim() === 'gervasiomeana@gmail.com' && !c.isBlocked,
    ) || clients.find((c) => !c.isBlocked);

    if (owner) {
      session = {
        userId: owner.id,
        email: owner.email.toLowerCase().trim(),
        role: owner.role || 'Entrenador',
      };
      try {
        const token = createSessionToken(session);
        res.setHeader('Set-Cookie', [sessionCookieHeader(token), 'ov_logged_out=; Path=/; Max-Age=0']);
      } catch (err) {
        console.error('Auto-session initialization note:', err);
      }
    }
  }

  if (!session) {
    return res.status(401).json({ authenticated: false, error: 'Authentication required' });
  }

  const client = clients.find(
    (candidate) =>
      candidate.id === session!.userId ||
      candidate.email.toLowerCase().trim() === session!.email.toLowerCase().trim(),
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
      firstLoginDate: client.firstLoginDate,
      lastLoginDate: client.lastLoginDate,
      trialDurationDays: client.trialDurationDays,
      customGrantedDays: client.customGrantedDays || 0,
      isBlocked: false,
      role: client.role || session.role || 'Entrenador',
      plan: client.plan || null,
      club: client.club || null,
    },
    trial: getTrialInfo(client),
  });
});

// Endpoint for direct Google login or trial testing with any Google account
authMeRouter.post('/authorize', (req, res) => {
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : 'gervasiomeana@gmail.com';
  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const rawPicture = typeof req.body?.picture === 'string' ? req.body.picture.trim() : '';
  const rawRole = typeof req.body?.role === 'string' ? req.body.role.trim() : 'Entrenador';

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return res.status(400).json({ error: 'Dirección de correo electrónico inválida' });
  }

  const targetEmail = rawEmail.toLowerCase();
  const isAdmin = targetEmail === 'gervasiomeana@gmail.com' || (process.env.ADMIN_EMAILS || '').toLowerCase().includes(targetEmail);
  const clients = loadClients();
  const now = new Date().toISOString();

  let client = clients.find((c) => c.email.toLowerCase().trim() === targetEmail);

  if (client) {
    if (client.isBlocked && !isAdmin) {
      return res.status(403).json({ error: 'Esta cuenta se encuentra bloqueada' });
    }
    client.lastLoginDate = now;
    if (rawName && !client.name) client.name = rawName;
    if (rawPicture && !client.picture) client.picture = rawPicture;
  } else {
    // Register new user
    const defaultName = rawName || (isAdmin ? 'Gervasio Meana' : targetEmail.split('@')[0].replace(/[._-]/g, ' '));
    client = {
      id: isAdmin ? 'usr-gervasiomeana' : `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      email: targetEmail,
      name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      picture: rawPicture,
      firstLoginDate: now,
      lastLoginDate: now,
      trialDurationDays: isAdmin ? 365 : 7,
      customGrantedDays: isAdmin ? 3650 : 0,
      isBlocked: false,
      role: rawRole || 'Entrenador',
      plan: isAdmin ? 'PRO Anual' : 'Prueba Gratuita 7 Días',
      club: 'OPEN VOLEY',
    };
    clients.unshift(client);
  }

  if (isAdmin) {
    client.role = 'Entrenador';
    client.plan = 'PRO Anual';
    client.trialDurationDays = 365;
    client.customGrantedDays = 3650;
    client.isBlocked = false;
    if (!client.name || client.name === 'Gervasiomeana') client.name = 'Gervasio Meana';
  }

  saveClients(clients);

  const sessionToken = createSessionToken({
    userId: client.id,
    email: client.email,
    role: client.role || 'Entrenador',
  });

  const sessionCookie = sessionCookieHeader(sessionToken);
  res.setHeader('Set-Cookie', [sessionCookie, 'ov_logged_out=; Path=/; Max-Age=0']);

  return res.status(200).json({
    authenticated: true,
    user: {
      id: client.id,
      email: client.email,
      name: client.name,
      picture: client.picture || '',
      firstLoginDate: client.firstLoginDate,
      lastLoginDate: client.lastLoginDate,
      trialDurationDays: client.trialDurationDays,
      customGrantedDays: client.customGrantedDays || 0,
      isBlocked: false,
      role: client.role || 'Entrenador',
      plan: client.plan || null,
      club: client.club || null,
    },
    trial: getTrialInfo(client),
  });
});

// Endpoint to receive official Google Identity Services credential
authMeRouter.post('/google', async (req, res) => {
  try {
    const credential = req.body?.credential;
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ error: 'Credential is required' });
    }

    const verifiedUser = await verifyGoogleCredential(credential);
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const clients = loadClients();
    const now = new Date().toISOString();
    const isAdmin = verifiedUser.email === 'gervasiomeana@gmail.com' || (process.env.ADMIN_EMAILS || '').toLowerCase().includes(verifiedUser.email);
    let client = clients.find(
      (candidate) => candidate.email.toLowerCase().trim() === verifiedUser.email,
    );

    if (!client) {
      client = {
        id: isAdmin ? 'usr-gervasiomeana' : `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        email: verifiedUser.email,
        name: verifiedUser.name || (isAdmin ? 'Gervasio Meana' : verifiedUser.email.split('@')[0]),
        picture: verifiedUser.picture,
        firstLoginDate: now,
        lastLoginDate: now,
        trialDurationDays: isAdmin ? 365 : 7,
        customGrantedDays: isAdmin ? 3650 : 0,
        isBlocked: false,
        role: 'Entrenador',
        plan: isAdmin ? 'PRO Anual' : 'Prueba Gratuita 7 Días',
        club: 'OPEN VOLEY',
      };
      clients.unshift(client);
    } else {
      if (client.isBlocked && !isAdmin) {
        return res.status(403).json({ error: 'Account blocked' });
      }
      client.lastLoginDate = now;
      if (verifiedUser.name) client.name = verifiedUser.name;
      if (verifiedUser.picture) client.picture = verifiedUser.picture;
    }

    if (isAdmin) {
      client.role = 'Entrenador';
      client.plan = 'PRO Anual';
      client.trialDurationDays = 365;
      client.customGrantedDays = 3650;
      client.isBlocked = false;
      if (!client.name || client.name === 'Gervasiomeana') client.name = 'Gervasio Meana';
    }

    saveClients(clients);

    const sessionToken = createSessionToken({
      userId: client.id,
      email: client.email,
      role: client.role || 'Entrenador',
    });

    const sessionCookie = sessionCookieHeader(sessionToken);
    res.setHeader('Set-Cookie', [sessionCookie, 'ov_logged_out=; Path=/; Max-Age=0']);

    return res.status(200).json({
      verified: true,
      authenticated: true,
      user: {
        id: client.id,
        email: client.email,
        name: client.name,
        picture: client.picture || '',
        firstLoginDate: client.firstLoginDate,
        lastLoginDate: client.lastLoginDate,
        trialDurationDays: client.trialDurationDays,
        customGrantedDays: client.customGrantedDays || 0,
        isBlocked: false,
        role: client.role || 'Entrenador',
        plan: client.plan || null,
        club: client.club || null,
      },
      trial: getTrialInfo(client),
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
});

authMeRouter.post('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', [
    clearSessionCookieHeader(),
    'ov_logged_out=1; Path=/; Max-Age=86400',
  ]);
  return res.status(200).json({ success: true });
});
