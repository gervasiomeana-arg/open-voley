import { TrainingSession } from '../types';

export const STORAGE_TRAINING_SESSIONS_KEY = 'openvoley_training_sessions_v1';

function isTrainingSession(value: unknown): value is TrainingSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<TrainingSession>;
  return Boolean(
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    typeof session.date === 'string' &&
    typeof session.focusProblem === 'string' &&
    Array.isArray(session.exercises)
  );
}

export function getSavedTrainingSessions(): TrainingSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_TRAINING_SESSIONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTrainingSession);
  } catch (err) {
    console.warn('Error reading training sessions:', err);
    return [];
  }
}

export function saveTrainingSession(session: TrainingSession): TrainingSession[] {
  const current = getSavedTrainingSessions();
  const index = current.findIndex((item) => item.id === session.id);
  const updated =
    index >= 0
      ? current.map((item) => (item.id === session.id ? session : item))
      : [session, ...current];

  try {
    localStorage.setItem(STORAGE_TRAINING_SESSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving training session:', err);
  }
  return updated;
}

export function deleteTrainingSession(id: string): TrainingSession[] {
  const updated = getSavedTrainingSessions().filter((session) => session.id !== id);
  try {
    localStorage.setItem(STORAGE_TRAINING_SESSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting training session:', err);
  }
  return updated;
}

export function replaceSavedTrainingSessions(sessions: TrainingSession[]): void {
  try {
    localStorage.setItem(
      STORAGE_TRAINING_SESSIONS_KEY,
      JSON.stringify(sessions.filter(isTrainingSession)),
    );
  } catch (err) {
    console.error('Error replacing training sessions:', err);
  }
}
