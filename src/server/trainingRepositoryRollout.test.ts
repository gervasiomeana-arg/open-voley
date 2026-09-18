import assert from 'node:assert/strict';
import { TrainingSession } from '../types';
import {
  JsonTrainingRepository,
  TrainingRepository,
  createTrainingRepositoryForDriver,
  resolveTrainingStorageDriver,
} from './trainingRepository';

assert.equal(resolveTrainingStorageDriver(undefined), 'sqlite');
assert.equal(resolveTrainingStorageDriver(''), 'sqlite');
assert.equal(resolveTrainingStorageDriver('sqlite'), 'sqlite');
assert.equal(resolveTrainingStorageDriver('SQLITE'), 'sqlite');
assert.equal(resolveTrainingStorageDriver('json'), 'json');
assert.equal(resolveTrainingStorageDriver(' JSON '), 'json');
assert.equal(resolveTrainingStorageDriver('unexpected'), 'sqlite');

class FakeSqliteRepository implements TrainingRepository {
  async list(_userId: string): Promise<TrainingSession[]> {
    return [];
  }
  async upsert(_userId: string, _session: TrainingSession): Promise<void> {}
  async delete(_userId: string, _sessionId: string): Promise<void> {}
}

const json = createTrainingRepositoryForDriver('json');
assert.equal(json.status.requestedDriver, 'json');
assert.equal(json.status.activeDriver, 'json');
assert.equal(json.status.fallbackActive, false);
assert.equal(json.status.healthy, true);
assert.ok(json.repository instanceof JsonTrainingRepository);

const sqlite = createTrainingRepositoryForDriver(
  'sqlite',
  () => new FakeSqliteRepository(),
);
assert.equal(sqlite.status.requestedDriver, 'sqlite');
assert.equal(sqlite.status.activeDriver, 'sqlite');
assert.equal(sqlite.status.fallbackActive, false);
assert.equal(sqlite.status.healthy, true);
assert.ok(sqlite.repository instanceof FakeSqliteRepository);

const originalError = console.error;
console.error = () => {};
let fallback;
try {
  fallback = createTrainingRepositoryForDriver('sqlite', () => {
    throw new Error('simulated SQLite startup failure');
  });
} finally {
  console.error = originalError;
}

assert.equal(fallback.status.requestedDriver, 'sqlite');
assert.equal(fallback.status.activeDriver, 'json');
assert.equal(fallback.status.fallbackActive, true);
assert.equal(fallback.status.healthy, false);
assert.match(fallback.status.message, /fallback active/i);
assert.ok(fallback.repository instanceof JsonTrainingRepository);

console.log('SQLite rollout tests passed');
