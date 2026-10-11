import { Router } from 'express';
import { loadAccounts, saveAccounts, isAdminEmail, accountTrial } from './accountStore';
import { recordLead } from './commercialStore';
import { randomUUID } from 'node:crypto';
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

const loadClients = loadAccounts;
const saveClients = saveAccounts;
const getTrialInfo = (account:any) => {const trial=accountTrial(account);return isAdminEmail(account.email) ? {...trial,isExpired:false,daysRemaining:Math.max(365,trial.daysRemaining)} : trial;};

async function verifyGoogleCredential(credential: string) {
  try {
    const audience = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!audience) return null;
    const ticket = await googleAuthClient.verifyIdToken({idToken: credential, audience});
    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified !== true || !payload.sub) {
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

  if (!session) {
    return res.status(401).json({ authenticated: false, error: 'Authentication required' });
  }

  const client = clients.find(
    (candidate) =>
      candidate.id === session!.userId &&
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
      isAdmin: isAdminEmail(client.email),
    },
    trial: getTrialInfo(client),
  });
});

authMeRouter.post('/authorize', (_req, res) => res.status(410).json({error: 'Usa el acceso verificado con Google.'}));

// Endpoint to receive official Google Identity Services credential
authMeRouter.post('/google', async (req, res) => {
  try {
    const sessionSecret = process.env.SESSION_SECRET?.trim();
    const isSecretConfigured = Boolean(sessionSecret && (process.env.NODE_ENV !== 'production' || sessionSecret.length >= 32));
    if (!process.env.GOOGLE_CLIENT_ID?.trim() || !isSecretConfigured) return res.status(503).json({error: 'El acceso con Google no está configurado.'});
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
    const isAdmin = isAdminEmail(verifiedUser.email);
    let client = clients.find(
      (candidate) => candidate.email.toLowerCase().trim() === verifiedUser.email,
    );

    if (!client) {
      client = {
        id: `usr-${randomUUID()}`,
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
      if (client.isBlocked) {
        return res.status(403).json({ error: 'Account blocked' });
      }
      client.lastLoginDate = now;
      if (verifiedUser.name) client.name = verifiedUser.name;
      if (verifiedUser.picture) client.picture = verifiedUser.picture;
    }

    if (client.googleSub && client.googleSub !== verifiedUser.sub) return res.status(403).json({error:'La cuenta Google no coincide con el registro.'});
    client.googleSub = verifiedUser.sub;
    saveClients(clients);
    recordLead({email: client.email, name: client.name, source: "verified-account", verified: true});

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
      isAdmin: isAdminEmail(client.email),
      },
      trial: getTrialInfo(client),
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
});

authMeRouter.post('/logout', (req, res) => {
  const session = getSessionFromRequest(req);
  if (session) { const accounts = loadClients(); const account = accounts.find(c => c.id === session.userId); if (account) { account.sessionVersion = (account.sessionVersion || 0) + 1; saveClients(accounts); } }
  res.setHeader('Set-Cookie', [
    clearSessionCookieHeader(),
    'ov_logged_out=1; Path=/; Max-Age=86400',
  ]);
  return res.status(200).json({ success: true });
});
