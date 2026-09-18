import { Router } from 'express';
import { TrainingSession } from '../types';
import { getSessionFromRequest } from './sessionSecurity';
import { getTrainingRepository } from './trainingRepository';
const router = Router();

function isTrainingSession(value: unknown): value is TrainingSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<TrainingSession>;
  return Boolean(
    typeof session.id === 'string' &&
      session.id.length <= 120 &&
      typeof session.title === 'string' &&
      session.title.length <= 300 &&
      typeof session.date === 'string' &&
      typeof session.focusProblem === 'string' &&
      session.focusProblem.length <= 2000 &&
      Array.isArray(session.exercises) &&
      session.exercises.length <= 30,
  );
}

router.use((req, res, next) => {
  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Authentication required' });
  res.locals.sessionUserId = session.userId;
  return next();
});

router.get('/', async (_req, res) => {
  const userId = String(res.locals.sessionUserId);
  return res.json({ sessions: await getTrainingRepository().list(userId) });
});

router.put('/:id', async (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const id = String(req.params.id || '').slice(0, 120);
  if (!isTrainingSession(req.body) || req.body.id !== id) {
    return res.status(400).json({ error: 'Invalid training session' });
  }

  await getTrainingRepository().upsert(userId, req.body);
  return res.json({ success: true, session: req.body });
});

router.delete('/:id', async (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const id = String(req.params.id || '').slice(0, 120);
  await getTrainingRepository().delete(userId, id);

  return res.json({ success: true });
});

export const trainingSessionsRouter = router;
