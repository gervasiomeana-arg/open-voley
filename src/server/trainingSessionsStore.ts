import { TrainingSession } from '../types';

export interface UserTrainingRecord {
  userId: string;
  sessions: TrainingSession[];
}

export function getUserTrainingSessions(
  records: UserTrainingRecord[],
  userId: string,
): TrainingSession[] {
  return records.find((record) => record.userId === userId)?.sessions || [];
}

export function upsertUserTrainingSession(
  records: UserTrainingRecord[],
  userId: string,
  session: TrainingSession,
  maxSessions = 250,
): UserTrainingRecord[] {
  const next = records.map((record) => ({
    ...record,
    sessions: [...record.sessions],
  }));

  let record = next.find((item) => item.userId === userId);
  if (!record) {
    record = { userId, sessions: [] };
    next.push(record);
  }

  const index = record.sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) record.sessions[index] = session;
  else record.sessions.unshift(session);

  record.sessions = record.sessions.slice(0, maxSessions);
  return next;
}

export function deleteUserTrainingSession(
  records: UserTrainingRecord[],
  userId: string,
  sessionId: string,
): UserTrainingRecord[] {
  return records.map((record) =>
    record.userId === userId
      ? {
          ...record,
          sessions: record.sessions.filter((session) => session.id !== sessionId),
        }
      : record,
  );
}
