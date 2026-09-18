import { Router } from 'express';
import { getSessionFromRequest } from './sessionSecurity';
import { getTrainingRepositoryStatus } from './trainingRepository';

const router = Router();

router.get('/', (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const storage = getTrainingRepositoryStatus();
  return res.status(storage.healthy ? 200 : 503).json({
    status: storage.healthy ? 'ok' : 'degraded',
    storage,
  });
});

export const storageHealthRouter = router;
