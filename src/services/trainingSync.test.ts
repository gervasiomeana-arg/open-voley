import assert from 'node:assert/strict';
import { TrainingSession } from '../types';
import {
  STORAGE_TRAINING_SESSIONS_KEY,
  getSavedTrainingSessions,
  replaceSavedTrainingSessions,
} from './trainingStorage';
import { syncTrainingSessions } from './trainingSync';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
});

function training(id: string, title: string): TrainingSession {
  return {
    id,
    title,
    date: '2026-09-18',
    time: '19:00',
    durationMin: 60,
    playersCount: 12,
    focusProblem: title,
    exercises: [],
    status: 'planned',
    completed: false,
  };
}

const localOnly = training('local-1', 'Local');
replaceSavedTrainingSessions([localOnly]);

const writes: TrainingSession[] = [];
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async (input, init) => {
  const url = String(input);
  if (url === '/api/training-sessions' && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify({ sessions: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (url.includes('/api/training-sessions/') && init?.method === 'PUT') {
    writes.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  throw new Error(`Unexpected request: ${url}`);
}) as typeof fetch;

const migrated = await syncTrainingSessions();
assert.equal(migrated.status, 'synced');
assert.equal(migrated.sessions.length, 1);
assert.equal(writes.length, 1);
assert.equal(writes[0].id, 'local-1');
assert.equal(getSavedTrainingSessions()[0].id, 'local-1');

const remoteOnly = training('remote-1', 'Remote');
replaceSavedTrainingSessions([]);
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async (input, init) => {
  const url = String(input);
  if (url === '/api/training-sessions' && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify({ sessions: [remoteOnly] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  throw new Error(`Unexpected request: ${url}`);
}) as typeof fetch;

const downloaded = await syncTrainingSessions();
assert.equal(downloaded.status, 'synced');
assert.equal(downloaded.sessions[0].id, 'remote-1');
assert.equal(getSavedTrainingSessions()[0].id, 'remote-1');

replaceSavedTrainingSessions([localOnly]);
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async () => {
  throw new Error('network down');
}) as typeof fetch;

const offline = await syncTrainingSessions();
assert.equal(offline.status, 'unavailable');
assert.equal(offline.sessions.length, 1);
assert.equal(offline.sessions[0].id, 'local-1');
assert.equal(JSON.parse(localStorage.getItem(STORAGE_TRAINING_SESSIONS_KEY) || '[]').length, 1);

replaceSavedTrainingSessions([localOnly]);
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async () =>
  new Response(JSON.stringify({ error: 'Authentication required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch;

const unauthenticated = await syncTrainingSessions();
assert.equal(unauthenticated.status, 'unauthenticated');
assert.equal(unauthenticated.sessions[0].id, 'local-1');

console.log('Training sync tests passed');
