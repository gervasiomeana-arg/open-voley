import { Router } from 'express';
import { SmartSportsMontage } from '../types';
import { getSessionFromRequest } from './sessionSecurity';
import { getSmartSportsMontageRepository } from './smartSportsMontageRepository';

const router = Router();

function isMontage(value: unknown): value is SmartSportsMontage {
  if (!value || typeof value !== 'object') return false;
  const montage = value as Partial<SmartSportsMontage>;
  return Boolean(
    typeof montage.id === 'string' && montage.id.length <= 120 &&
    typeof montage.name === 'string' && montage.name.length <= 300 &&
    typeof montage.matchId === 'string' && montage.matchId.length <= 120 &&
    typeof montage.matchTitle === 'string' && montage.matchTitle.length <= 300 &&
    typeof montage.createdAt === 'string' &&
    typeof montage.updatedAt === 'string' &&
    typeof montage.preRoll === 'number' && montage.preRoll >= 0 && montage.preRoll <= 30 &&
    typeof montage.postRoll === 'number' && montage.postRoll >= 0 && montage.postRoll <= 30 &&
    Array.isArray(montage.actionIds) && montage.actionIds.length <= 500 &&
    montage.actionIds.every((id) => typeof id === 'string' && id.length <= 120) &&
    (montage.recipientEmail === undefined ||
      (typeof montage.recipientEmail === 'string' &&
       montage.recipientEmail.length <= 320 &&
       /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(montage.recipientEmail))) &&
    (montage.publishedAt === undefined || typeof montage.publishedAt === 'string')
  );
}

router.use((req, res, next) => {
  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Authentication required' });
  res.locals.sessionUserId = session.userId;
  res.locals.sessionEmail = session.email;
  return next();
});

router.get('/', async (_req, res) => {
  const userId = String(res.locals.sessionUserId);
  return res.json({ montages: await getSmartSportsMontageRepository().list(userId) });
});

router.get('/inbox', async (_req, res) => {
  const email = String(res.locals.sessionEmail || '').toLowerCase().trim();
  return res.json({ montages: await getSmartSportsMontageRepository().listInbox(email) });
});

router.put('/:id', async (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const id = String(req.params.id || '').slice(0, 120);
  if (!isMontage(req.body) || req.body.id !== id) {
    return res.status(400).json({ error: 'Invalid montage' });
  }
  await getSmartSportsMontageRepository().upsert(userId, req.body);
  return res.json({ success: true, montage: req.body });
});

router.delete('/:id', async (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const id = String(req.params.id || '').slice(0, 120);
  await getSmartSportsMontageRepository().delete(userId, id);
  return res.json({ success: true });
});

export const smartSportsMontageRouter = router;
