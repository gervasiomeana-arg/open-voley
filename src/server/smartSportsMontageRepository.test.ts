import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SmartSportsMontage } from '../types';
import { DatabaseSync } from 'node:sqlite';

function montage(id: string, name: string): SmartSportsMontage {
  return {
    id,
    name,
    matchId: 'match-1',
    matchTitle: 'A vs B',
    createdAt: '2026-09-18T20:00:00.000Z',
    updatedAt: '2026-09-18T20:00:00.000Z',
    preRoll: 3,
    postRoll: 3,
    actionIds: ['a1', 'a2'],
  };
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openvoley-montage-'));
const dbPath = path.join(dir, 'openvoley-test.db');
process.env.OPENVOLEY_DB_PATH = dbPath;
process.env.OPENVOLEY_STORAGE_DRIVER = 'sqlite';

const { getSmartSportsMontageRepository } = await import('./smartSportsMontageRepository');
const repo = getSmartSportsMontageRepository();

await repo.upsert('user-a', montage('same-id', 'A private'));
await repo.upsert('user-b', montage('same-id', 'B private'));

assert.equal((await repo.list('user-a'))[0]?.name, 'A private');
assert.equal((await repo.list('user-b'))[0]?.name, 'B private');

await repo.upsert('user-a', { ...montage('same-id', 'A updated'), updatedAt: '2026-09-18T21:00:00.000Z' });
assert.equal((await repo.list('user-a'))[0]?.name, 'A updated');
assert.equal((await repo.list('user-b'))[0]?.name, 'B private');

await repo.delete('user-a', 'same-id');
assert.equal((await repo.list('user-a')).length, 0);
assert.equal((await repo.list('user-b')).length, 1);

await repo.upsert('coach-1', {
  ...montage('player-a-video', 'Video para A'),
  recipientEmail: 'player-a@openvoley.test',
  publishedAt: '2026-09-18T22:00:00.000Z',
});
await repo.upsert('coach-1', {
  ...montage('player-b-video', 'Video para B'),
  recipientEmail: 'player-b@openvoley.test',
  publishedAt: '2026-09-18T22:01:00.000Z',
});
await repo.upsert('coach-1', {
  ...montage('draft-video', 'Borrador para A'),
  recipientEmail: 'player-a@openvoley.test',
});

const playerAInbox = await repo.listInbox('PLAYER-A@OPENVOLEY.TEST');
const playerBInbox = await repo.listInbox('player-b@openvoley.test');
const unknownInbox = await repo.listInbox('unknown@openvoley.test');

assert.deepEqual(playerAInbox.map((item) => item.id), ['player-a-video']);
assert.deepEqual(playerBInbox.map((item) => item.id), ['player-b-video']);
assert.equal(unknownInbox.length, 0);
assert.equal(playerAInbox.some((item) => item.id === 'player-b-video'), false);
assert.equal(playerBInbox.some((item) => item.id === 'player-a-video'), false);
assert.equal(playerAInbox.some((item) => item.id === 'draft-video'), false);

const db = new DatabaseSync(dbPath);
const rows = db.prepare('SELECT user_id, montage_id FROM smart_sports_montages ORDER BY user_id').all() as Array<{user_id:string;montage_id:string}>;
assert.equal(rows.length, 1);
assert.equal(rows[0].user_id, 'user-b');
assert.equal(rows[0].montage_id, 'same-id');
db.close();

fs.rmSync(dir, { recursive: true, force: true });
console.log('Smart sports montage repository tests passed');
