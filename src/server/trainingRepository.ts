import fs from 'fs';
import path from 'path';
import { TrainingSession } from '../types';
import { SqliteTrainingRepository } from './trainingSqliteRepository';
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

export interface TrainingRepositoryStatus {
  requestedDriver: 'json' | 'sqlite';
  activeDriver: 'json' | 'sqlite';
  fallbackActive: boolean;
  healthy: boolean;
  message: string;
}

export function createTrainingRepositoryForDriver(
  requestedDriver: 'json' | 'sqlite',
  sqliteFactory: () => TrainingRepository = () => new SqliteTrainingRepository(),
): {
  repository: TrainingRepository;
  status: TrainingRepositoryStatus;
} {
  if (requestedDriver === 'sqlite') {
    try {
      return {
        repository: sqliteFactory(),
        status: {
          requestedDriver: 'sqlite',
          activeDriver: 'sqlite',
          fallbackActive: false,
          healthy: true,
          message: 'SQLite persistence active',
        },
      };
    } catch (error) {
      console.error('SQLite initialization failed; falling back to JSON storage:', error);
      return {
        repository: new JsonTrainingRepository(),
        status: {
          requestedDriver: 'sqlite',
          activeDriver: 'json',
          fallbackActive: true,
          healthy: false,
          message: 'SQLite initialization failed; JSON fallback active',
        },
      };
    }
  }

  return {
    repository: new JsonTrainingRepository(),
    status: {
      requestedDriver: 'json',
      activeDriver: 'json',
      fallbackActive: false,
      healthy: true,
      message: 'JSON persistence active',
    },
  };
}

function createTrainingRepository(): {
  repository: TrainingRepository;
  status: TrainingRepositoryStatus;
} {
  const configuredDriver = process.env.OPENVOLEY_STORAGE_DRIVER?.trim().toLowerCase();
  // SQLite is now the primary driver. Set OPENVOLEY_STORAGE_DRIVER=json only
  // as an explicit operational rollback while the transition is monitored.
  const requestedDriver = configuredDriver === 'json' ? 'json' : 'sqlite';
  return createTrainingRepositoryForDriver(requestedDriver);
}

const created = createTrainingRepository();
let repository: TrainingRepository = created.repository;
let repositoryStatus: TrainingRepositoryStatus = created.status;

export function getTrainingRepository(): TrainingRepository {
  return repository;
}

export function getTrainingRepositoryStatus(): TrainingRepositoryStatus {
  return { ...repositoryStatus };
}

export function setTrainingRepositoryForTests(
  next: TrainingRepository,
  status?: Partial<TrainingRepositoryStatus>,
): void {
  repository = next;
  repositoryStatus = {
    requestedDriver: status?.requestedDriver || 'json',
    activeDriver: status?.activeDriver || 'json',
    fallbackActive: status?.fallbackActive || false,
    healthy: status?.healthy ?? true,
    message: status?.message || 'Test repository active',
  };
}
