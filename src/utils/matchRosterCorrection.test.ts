import assert from 'node:assert/strict';
import { sampleMatchData } from '../data/sampleMatch';
import { correctMatchRoster } from './matchRosterCorrection';

const original = structuredClone(sampleMatchData);
const player = original.homePlayers.find((p) => original.homeRotation.includes(p.number))!;
const oldNumber = player.number;
const newNumber = 98;
original.server = { team: 'home', playerNum: oldNumber };
original.actions = [{
  id: 'act1', rawCode: `*${oldNumber}A#`, team: 'home', playerNum: oldNumber,
  playerName: player.name, skill: 'A', evaluation: '#', timestamp: 20,
  setNumber: 1, scoreHome: 1, scoreAway: 0,
  rotationHome: [...original.homeRotation], rotationAway: [...original.awayRotation],
  description: `Local #${oldNumber} (${player.name}) - Ataque [#]`,
  servingTeam: 'home', serverNum: oldNumber,
}];

const revised = correctMatchRoster(original, 'home', original.homePlayers.map((p) =>
  p.id === player.id ? { ...p, number: newNumber } : p
));
assert.equal(revised.homePlayers.find((p) => p.id === player.id)?.number, newNumber);
assert.equal(revised.homeRotation.includes(newNumber), true);
assert.equal(revised.server.playerNum, newNumber);
assert.equal(revised.actions[0].playerNum, newNumber);
assert.equal(revised.actions[0].rotationHome.includes(newNumber), true);
assert.equal(revised.actions[0].serverNum, newNumber);
assert.equal(revised.actions[0].rawCode, original.actions[0].rawCode);
assert.deepEqual(revised.awayPlayers, original.awayPlayers);

const extra = { ...original.awayPlayers[0], id: 'late-arrival', number: 99, name: 'Nueva jugadora' };
const added = correctMatchRoster(original, 'away', [...original.awayPlayers, extra]);
assert.equal(added.awayPlayers.at(-1)?.name, 'Nueva jugadora');
assert.deepEqual(added.actions, original.actions);
assert.deepEqual(added.homeRotation, original.homeRotation);

console.log('Match roster correction: OK');
