import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TrainingSession } from '../types';
import { SqliteTrainingRepository } from './trainingSqliteRepository';

function session(id: string, title: string, date = '2026-09-18'): TrainingSession {
  return {
    id,
    title,
    date,
    time: '19:00',
    durationMin: 60,
    playersCount: 12,
    focusProblem: title,
    exercises: [],
    status: 'planned',
    completed: false,
  };
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openvoley-sqlite-'));
const dbPath = path.join(dir, 'openvoley-test.db');
const legacyPath = path.join(dir, 'training_sessions_db.json');

fs.writeFileSync(
  legacyPath,
  JSON.stringify([
    { userId: 'user-a', sessions: [session('legacy-a', 'Legacy A')] },
    { userId: 'user-b', sessions: [session('legacy-b', 'Legacy B')] },
  ]),
  'utf-8',
);

const repo = new SqliteTrainingRepository(dbPath, legacyPath);

assert.deepEqual((await repo.list('user-a')).map((item) => item.id), ['legacy-a']);
assert.deepEqual((await repo.list('user-b')).map((item) => item.id), ['legacy-b']);

await repo.upsert('user-a', session('same-id', 'A private'));
await repo.upsert('user-b', session('same-id', 'B private'));
assert.equal((await repo.list('user-a')).find((item) => item.id === 'same-id')?.title, 'A private');
assert.equal((await repo.list('user-b')).find((item) => item.id === 'same-id')?.title, 'B private');

await repo.upsert('user-a', { ...session('same-id', 'A updated'), completed: true, status: 'completed' });
assert.equal((await repo.list('user-a')).find((item) => item.id === 'same-id')?.title, 'A updated');
assert.equal((await repo.list('user-b')).find((item) => item.id === 'same-id')?.title, 'B private');

await repo.delete('user-a', 'same-id');
assert.equal((await repo.list('user-a')).some((item) => item.id === 'same-id'), false);
assert.equal((await repo.list('user-b')).some((item) => item.id === 'same-id'), true);

repo.close();

// Migration must be one-time. Changing legacy JSON after first application must not import new rows.
fs.writeFileSync(
  legacyPath,
  JSON.stringify([
    { userId: 'user-a', sessions: [session('should-not-import', 'Late legacy row')] },
  ]),
  'utf-8',
);

const reopened = new SqliteTrainingRepository(dbPath, legacyPath);
assert.equal((await reopened.list('user-a')).some((item) => item.id === 'should-not-import'), false);
assert.equal((await reopened.list('user-a')).some((item) => item.id === 'legacy-a'), true);
reopened.close();

fs.rmSync(dir, { recursive: true, force: true });

console.log('SQLite training repository tests passed');
