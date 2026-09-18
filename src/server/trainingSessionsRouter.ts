import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { TrainingSession } from '../types';
import { getSessionFromRequest } from './sessionSecurity';
import {
  UserTrainingRecord,
  deleteUserTrainingSession,
  getUserTrainingSessions,
  upsertUserTrainingSession,
} from './trainingSessionsStore';

const TRAINING_FILE = path.join(process.cwd(), 'training_sessions_db.json');
const router = Router();

function loadRecords(): UserTrainingRecord[] {
  try {
    if (!fs.existsSync(TRAINING_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(TRAINING_FILE, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Training sessions read failed:', error);
    return [];
  }
}

function saveRecords(records: UserTrainingRecord[]): void {
  fs.writeFileSync(TRAINING_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

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

router.get('/', (_req, res) => {
  const userId = String(res.locals.sessionUserId);
  return res.json({ sessions: getUserTrainingSessions(loadRecords(), userId) });
});

router.put('/:id', (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const id = String(req.params.id || '').slice(0, 120);
  if (!isTrainingSession(req.body) || req.body.id !== id) {
    return res.status(400).json({ error: 'Invalid training session' });
  }

  const records = upsertUserTrainingSession(loadRecords(), userId, req.body);
  saveRecords(records);
  return res.json({ success: true, session: req.body });
});

router.delete('/:id', (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const id = String(req.params.id || '').slice(0, 120);
  const records = deleteUserTrainingSession(loadRecords(), userId, id);
  saveRecords(records);

  return res.json({ success: true });
});

export const trainingSessionsRouter = router;
