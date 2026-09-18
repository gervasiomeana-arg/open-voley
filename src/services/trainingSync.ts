import { TrainingSession } from '../types';
import {
  getSavedTrainingSessions,
  replaceSavedTrainingSessions,
  saveTrainingSession,
} from './trainingStorage';

export interface TrainingSyncResult {
  status: 'synced' | 'unauthenticated' | 'unavailable';
  sessions: TrainingSession[];
}

function mergeSessions(
  remote: TrainingSession[],
  local: TrainingSession[],
): TrainingSession[] {
  const byId = new Map<string, TrainingSession>();

  // Remote first, then local. Local wins on the same id so unsynced edits are not lost.
  remote.forEach((session) => byId.set(session.id, session));
  local.forEach((session) => byId.set(session.id, session));

  return [...byId.values()].sort((a, b) => {
    const dateOrder = String(b.date || '').localeCompare(String(a.date || ''));
    return dateOrder !== 0 ? dateOrder : String(b.id).localeCompare(String(a.id));
  });
}

export async function fetchServerTrainingSessions(): Promise<TrainingSyncResult> {
  try {
    const response = await fetch('/api/training-sessions', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (response.status === 401) {
      return { status: 'unauthenticated', sessions: [] };
    }
    if (!response.ok) {
      return { status: 'unavailable', sessions: [] };
    }

    const data = await response.json();
    return {
      status: 'synced',
      sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    };
  } catch (error) {
    console.warn('Training server read unavailable:', error);
    return { status: 'unavailable', sessions: [] };
  }
}

export async function pushTrainingSessionToServer(
  session: TrainingSession,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/training-sessions/${encodeURIComponent(session.id)}`,
      {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      },
    );
    return response.ok;
  } catch (error) {
    console.warn('Training server write unavailable:', error);
    return false;
  }
}

export async function deleteTrainingSessionFromServer(
  id: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/training-sessions/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      },
    );
    return response.ok;
  } catch (error) {
    console.warn('Training server delete unavailable:', error);
    return false;
  }
}

export async function syncTrainingSessions(): Promise<TrainingSyncResult> {
  const local = getSavedTrainingSessions();
  const remoteResult = await fetchServerTrainingSessions();

  if (remoteResult.status !== 'synced') {
    return { status: remoteResult.status, sessions: local };
  }

  const merged = mergeSessions(remoteResult.sessions, local);

  // Migrate local-only or locally edited sessions into the authenticated server store.
  const remoteById = new Map(remoteResult.sessions.map((session) => [session.id, session]));
  await Promise.all(
    local.map(async (session) => {
      const remote = remoteById.get(session.id);
      if (!remote || JSON.stringify(remote) !== JSON.stringify(session)) {
        await pushTrainingSessionToServer(session);
      }
    }),
  );

  replaceSavedTrainingSessions(merged);
  return { status: 'synced', sessions: merged };
}

export function saveTrainingSessionLocallyFirst(session: TrainingSession): TrainingSession[] {
  const updated = saveTrainingSession(session);
  void pushTrainingSessionToServer(session);
  return updated;
}
