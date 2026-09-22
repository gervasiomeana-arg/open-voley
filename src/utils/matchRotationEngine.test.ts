import assert from 'node:assert/strict';
import { applyRallyWinner, pointWinnerFromAction, rotateClockwise } from './matchRotationEngine';

const base = {
  homeRotation: [3, 13, 1, 7, 4, 14],
  awayRotation: [8, 5, 12, 4, 10, 2],
  server: { team: 'away' as const, playerNum: 8 },
};

assert.deepEqual(rotateClockwise(base.homeRotation), [13, 1, 7, 4, 14, 3]);

const sideout = applyRallyWinner(base, 'home');
assert.deepEqual(sideout.homeRotation, [13, 1, 7, 4, 14, 3]);
assert.deepEqual(sideout.awayRotation, base.awayRotation);
assert.deepEqual(sideout.server, { team: 'home', playerNum: 13 });

const servingPoint = applyRallyWinner(sideout, 'home');
assert.deepEqual(servingPoint.homeRotation, sideout.homeRotation);
assert.deepEqual(servingPoint.server, { team: 'home', playerNum: 13 });

assert.equal(pointWinnerFromAction('home', 'A', '#'), 'home');
assert.equal(pointWinnerFromAction('home', 'S', '#'), 'home');
assert.equal(pointWinnerFromAction('home', 'B', '#'), 'home');
assert.equal(pointWinnerFromAction('home', 'R', '#'), null);
assert.equal(pointWinnerFromAction('home', 'E', '#'), null);
assert.equal(pointWinnerFromAction('home', 'R', '='), 'away');
assert.equal(pointWinnerFromAction('away', 'A', '/'), 'home');
assert.equal(pointWinnerFromAction('away', 'R', '/'), null);
assert.equal(pointWinnerFromAction('away', 'A', '+'), null);

console.log('Match rotation engine tests passed.');
