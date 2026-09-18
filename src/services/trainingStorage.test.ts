import assert from 'node:assert/strict';
import { TrainingSession } from '../types';
import {
  deleteTrainingSession,
  getSavedTrainingSessions,
  replaceSavedTrainingSessions,
  saveTrainingSession,
  STORAGE_TRAINING_SESSIONS_KEY,
} from './trainingStorage';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
});

const session: TrainingSession = {
  id: 'training-persist-1',
  title: 'Side-out R4',
  date: '2026-09-18',
  time: '19:00',
  durationMin: 60,
  playersCount: 12,
  focusProblem: 'Mejorar Side-out en R4',
  linkedMatchId: 'match-source',
  performanceTarget: {
    metric: 'sideout_pct',
    label: 'R4 Side-out',
    teamSide: 'home',
    baselineValue: 50,
    baselineSample: 8,
    rotationRef: 4,
    sourceMatchId: 'match-source',
    sourceInsightId: 'ins-r4',
    sourceRallyIds: ['r1', 'r2', 'r3', 'r4'],
  },
  exercises: [
    {
      id: 'ex-1',
      block: 'Side-out',
      name: 'Trabajo R4',
      durationMin: 60,
      description: 'Ejercicio basado en la evidencia registrada.',
      courtFocus: 'Rotación R4',
      keyObjective: 'Crear nueva muestra comparable',
    },
  ],
  notes: 'Nota inicial',
  status: 'planned',
  completed: false,
};

assert.deepEqual(getSavedTrainingSessions(), []);

const afterCreate = saveTrainingSession(session);
assert.equal(afterCreate.length, 1);
assert.equal(afterCreate[0].performanceTarget?.baselineValue, 50);
assert.deepEqual(afterCreate[0].performanceTarget?.sourceRallyIds, ['r1', 'r2', 'r3', 'r4']);

const completed: TrainingSession = {
  ...session,
  status: 'completed',
  completed: true,
  notes: 'Sesión realizada. Buena respuesta en R4.',
};
const afterUpdate = saveTrainingSession(completed);
assert.equal(afterUpdate.length, 1);
assert.equal(afterUpdate[0].completed, true);
assert.equal(afterUpdate[0].status, 'completed');
assert.equal(afterUpdate[0].notes, 'Sesión realizada. Buena respuesta en R4.');

const second: TrainingSession = {
  ...session,
  id: 'training-persist-2',
  title: 'Recepción',
};
const afterSecond = saveTrainingSession(second);
assert.equal(afterSecond.length, 2);
assert.equal(afterSecond[0].id, 'training-persist-2');

const afterDelete = deleteTrainingSession('training-persist-2');
assert.equal(afterDelete.length, 1);
assert.equal(afterDelete[0].id, 'training-persist-1');

replaceSavedTrainingSessions([second, completed]);
const replaced = getSavedTrainingSessions();
assert.equal(replaced.length, 2);
assert.equal(replaced[0].id, 'training-persist-2');

localStorage.setItem(STORAGE_TRAINING_SESSIONS_KEY, '{invalid json');
assert.deepEqual(getSavedTrainingSessions(), []);

localStorage.setItem(
  STORAGE_TRAINING_SESSIONS_KEY,
  JSON.stringify([{ id: 'invalid' }, session]),
);
const filtered = getSavedTrainingSessions();
assert.equal(filtered.length, 1);
assert.equal(filtered[0].id, session.id);

console.log('Training storage tests passed');
