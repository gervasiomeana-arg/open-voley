import fs from 'fs';
import path from 'path';
import { TrainingSession } from '../types';
import {
  UserTrainingRecord,
  deleteUserTrainingSession,
  getUserTrainingSessions,
  upsertUserTrainingSession,
} from './trainingSessionsStore';

export interface TrainingRepository {
  list(userId: string): Promise<TrainingSession[]>;
  upsert(userId: string, session: TrainingSession): Promise<void>;
  delete(userId: string, sessionId: string): Promise<void>;
}

const TRAINING_FILE = path.join(process.cwd(), 'training_sessions_db.json');

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

/**
 * Transitional repository used by the current pilot.
 * The HTTP/API layer depends only on TrainingRepository, so a transactional
 * database adapter can replace this implementation without changing clients.
 */
export class JsonTrainingRepository implements TrainingRepository {
  async list(userId: string): Promise<TrainingSession[]> {
    return getUserTrainingSessions(loadRecords(), userId);
  }

  async upsert(userId: string, session: TrainingSession): Promise<void> {
    saveRecords(upsertUserTrainingSession(loadRecords(), userId, session));
  }

  async delete(userId: string, sessionId: string): Promise<void> {
    saveRecords(deleteUserTrainingSession(loadRecords(), userId, sessionId));
  }
}

let repository: TrainingRepository = new JsonTrainingRepository();

export function getTrainingRepository(): TrainingRepository {
  return repository;
}

export function setTrainingRepositoryForTests(next: TrainingRepository): void {
  repository = next;
}
