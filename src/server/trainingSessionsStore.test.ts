import assert from 'node:assert/strict';
import { TrainingSession } from '../types';
import {
  UserTrainingRecord,
  deleteUserTrainingSession,
  getUserTrainingSessions,
  upsertUserTrainingSession,
} from './trainingSessionsStore';

function session(id: string, title: string): TrainingSession {
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

let records: UserTrainingRecord[] = [];
records = upsertUserTrainingSession(records, 'user-a', session('same-id', 'Sesión A'));
records = upsertUserTrainingSession(records, 'user-b', session('same-id', 'Sesión B'));

assert.equal(getUserTrainingSessions(records, 'user-a').length, 1);
assert.equal(getUserTrainingSessions(records, 'user-b').length, 1);
assert.equal(getUserTrainingSessions(records, 'user-a')[0].title, 'Sesión A');
assert.equal(getUserTrainingSessions(records, 'user-b')[0].title, 'Sesión B');

records = upsertUserTrainingSession(records, 'user-a', {
  ...session('same-id', 'Sesión A actualizada'),
  completed: true,
  status: 'completed',
});
assert.equal(getUserTrainingSessions(records, 'user-a')[0].title, 'Sesión A actualizada');
assert.equal(getUserTrainingSessions(records, 'user-a')[0].completed, true);
assert.equal(getUserTrainingSessions(records, 'user-b')[0].title, 'Sesión B');

records = deleteUserTrainingSession(records, 'user-a', 'same-id');
assert.equal(getUserTrainingSessions(records, 'user-a').length, 0);
assert.equal(getUserTrainingSessions(records, 'user-b').length, 1);

records = upsertUserTrainingSession(records, 'user-a', session('a1', 'A1'));
records = upsertUserTrainingSession(records, 'user-a', session('a2', 'A2'), 1);
assert.equal(getUserTrainingSessions(records, 'user-a').length, 1);
assert.equal(getUserTrainingSessions(records, 'user-a')[0].id, 'a2');
assert.equal(getUserTrainingSessions(records, 'user-b').length, 1);

console.log('Training backend isolation tests passed');
