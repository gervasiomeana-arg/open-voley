import assert from 'node:assert/strict';
import { MatchData, Player, ScoutCodeAction } from '../types';
import { calculateTeamDataVolleySummary } from './dataVolleyAnalytics';

const homePlayers: Player[] = [
  { id: 's', number: 1, name: 'Setter', position: 'S', team: 'home', starter: true },
  { id: 'oh', number: 2, name: 'Outside', position: 'OH', team: 'home', starter: true },
];

const awayPlayers: Player[] = [
  { id: 'as', number: 7, name: 'Away Setter', position: 'S', team: 'away', starter: true },
];

const base = {
  setNumber: 1,
  scoreHome: 0,
  scoreAway: 0,
  rotationHome: [1, 2, 0, 0, 0, 0],
  rotationAway: [7, 0, 0, 0, 0, 0],
};

const actions: ScoutCodeAction[] = [
  {
    id: 'r1',
    rawCode: '*02R#',
    team: 'home',
    playerNum: 2,
    playerName: 'Outside',
    skill: 'R',
    evaluation: '#',
    timestamp: 1,
    description: 'Perfect reception',
    ...base,
  },
  {
    id: 'a1',
    rawCode: '*02A#',
    team: 'home',
    playerNum: 2,
    playerName: 'Outside',
    skill: 'A',
    evaluation: '#',
    timestamp: 3,
    description: 'Kill',
    ...base,
  },
  {
    id: 's1',
    rawCode: '*02S+',
    team: 'home',
    playerNum: 2,
    playerName: 'Outside',
    skill: 'S',
    evaluation: '+',
    timestamp: 10,
    description: 'Serve in',
    ...base,
  },
  {
    id: 'b1',
    rawCode: '*02B#',
    team: 'home',
    playerNum: 2,
    playerName: 'Outside',
    skill: 'B',
    evaluation: '#',
    timestamp: 13,
    description: 'Block point',
    ...base,
  },
  {
    id: 's2',
    rawCode: '*02S=',
    team: 'home',
    playerNum: 2,
    playerName: 'Outside',
    skill: 'S',
    evaluation: '=',
    timestamp: 20,
    description: 'Serve error',
    ...base,
  },
];

const match: MatchData = {
  id: 'test',
  title: 'Analytics test',
  date: '2026-09-17',
  competition: 'Test',
  homeTeamName: 'Home',
  awayTeamName: 'Away',
  currentSet: 1,
  sets: [{ setNumber: 1, scoreHome: 0, scoreAway: 0 }],
  homePlayers,
  awayPlayers,
  actions,
  homeRotation: [1, 2, 0, 0, 0, 0],
  awayRotation: [7, 0, 0, 0, 0, 0],
  server: { team: 'home', playerNum: 2 },
};

const summary = calculateTeamDataVolleySummary(match, 'home');

assert.equal(summary.sampleSize, 5);
assert.equal(summary.reception.total, 1);
assert.equal(summary.reception.positivePct, 100);
assert.equal(summary.reception.perfectPct, 100);
assert.equal(summary.attack.total, 1);
assert.equal(summary.attack.points, 1);
assert.equal(summary.attack.efficiencyPct, 100);
assert.equal(summary.serve.total, 2);
assert.equal(summary.serve.errors, 1);
assert.equal(summary.blockPoints, 1);
assert.equal(summary.directPoints, 2);
assert.equal(summary.directErrors, 1);
assert.equal(summary.gainLoss, 1);

const r1 = summary.rotations.find((row) => row.rotation === 1);
assert.ok(r1);
assert.equal(r1.sideoutOpportunities, 1);
assert.equal(r1.sideoutWon, 1);
assert.equal(r1.sideoutPct, 100);
assert.equal(r1.breakPointOpportunities, 2);
assert.equal(r1.breakPointWon, 1);
assert.equal(r1.breakPointPct, 50);

const empty = calculateTeamDataVolleySummary({ ...match, actions: [] }, 'home');
assert.equal(empty.sampleSize, 0);
assert.equal(empty.strongestRotation, undefined);
assert.equal(empty.weakestRotation, undefined);
assert.equal(empty.reception.positivePct, 0);
assert.equal(empty.attack.efficiencyPct, 0);

console.log('DataVolley analytics tests passed');
