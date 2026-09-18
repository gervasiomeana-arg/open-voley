import assert from 'node:assert/strict';
import {
  MatchData,
  Player,
  ScoutCodeAction,
  TrainingPerformanceTarget,
} from '../types';
import {
  buildPerformanceTargetFromMatch,
  evaluatePerformanceFollowUp,
  PERFORMANCE_FOLLOW_UP_MIN_SAMPLE,
} from './performanceFollowUp';

const homePlayers: Player[] = [
  { id: 's', number: 1, name: 'Setter', position: 'S', team: 'home', starter: true },
  { id: 'oh', number: 2, name: 'Outside', position: 'OH', team: 'home', starter: true },
];

const awayPlayers: Player[] = [
  { id: 'as', number: 7, name: 'Away Setter', position: 'S', team: 'away', starter: true },
  { id: 'sv', number: 8, name: 'Server', position: 'OH', team: 'away', starter: true },
];

function baseMatch(id: string, actions: ScoutCodeAction[]): MatchData {
  return {
    id,
    title: id,
    date: '2026-09-18',
    competition: 'Test',
    homeTeamName: 'Home',
    awayTeamName: 'Away',
    currentSet: 1,
    sets: [{ setNumber: 1, scoreHome: 0, scoreAway: 0 }],
    homePlayers,
    awayPlayers,
    actions,
    homeRotation: [1, 2, 0, 0, 0, 0],
    awayRotation: [7, 8, 0, 0, 0, 0],
    server: { team: 'away', playerNum: 8 },
  };
}

function action(
  id: string,
  team: 'home' | 'away',
  skill: ScoutCodeAction['skill'],
  evaluation: ScoutCodeAction['evaluation'],
  rallyId: string,
  extra: Partial<ScoutCodeAction> = {},
): ScoutCodeAction {
  return {
    id,
    rawCode: '',
    team,
    playerNum: team === 'home' ? 2 : 8,
    playerName: team === 'home' ? 'Outside' : 'Server',
    skill,
    evaluation,
    timestamp: Number(id.replace(/\D/g, '')) || 1,
    setNumber: 1,
    scoreHome: 0,
    scoreAway: 0,
    rotationHome: [1, 2, 0, 0, 0, 0],
    rotationAway: [7, 8, 0, 0, 0, 0],
    description: '',
    rallyId,
    ...extra,
  };
}

const sourceReception = baseMatch('source-reception', [
  action('s1', 'away', 'S', '+', 'r1', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r1', 'home', 'R', '-', 'r1', { receptionContext: 'negative', phase: 'K1' }),
  action('s2', 'away', 'S', '+', 'r2', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r2', 'home', 'R', '!', 'r2', { receptionContext: 'negative', phase: 'K1' }),
  action('s3', 'away', 'S', '+', 'r3', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r3', 'home', 'R', '=', 'r3', { receptionContext: 'negative', phase: 'K1' }),
  action('s4', 'away', 'S', '+', 'r4', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r4', 'home', 'R', '+', 'r4', { receptionContext: 'positive', phase: 'K1' }),
  action('s5', 'away', 'S', '+', 'r5', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r5', 'home', 'R', '+', 'r5', { receptionContext: 'positive', phase: 'K1' }),
]);

const receptionTarget = buildPerformanceTargetFromMatch(sourceReception, {
  metric: 'reception_negative_pct',
  label: 'Recepción negativa vs potencia a Z5',
  teamSide: 'home',
  serveType: 'jump_spin',
  zoneRef: 5,
});

assert.equal(receptionTarget.baselineSample, 5);
assert.equal(receptionTarget.baselineValue, 60);

const improvedReception = { ...baseMatch('next-reception', [
  action('s11', 'away', 'S', '+', 'n1', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r11', 'home', 'R', '-', 'n1', { receptionContext: 'negative', phase: 'K1' }),
  action('s12', 'away', 'S', '+', 'n2', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r12', 'home', 'R', '+', 'n2', { receptionContext: 'positive', phase: 'K1' }),
  action('s13', 'away', 'S', '+', 'n3', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r13', 'home', 'R', '+', 'n3', { receptionContext: 'positive', phase: 'K1' }),
  action('s14', 'away', 'S', '+', 'n4', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r14', 'home', 'R', '!', 'n4', { receptionContext: 'negative', phase: 'K1' }),
  action('s15', 'away', 'S', '+', 'n5', { serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action('r15', 'home', 'R', '+', 'n5', { receptionContext: 'positive', phase: 'K1' }),
]), date: '2026-09-19' };

const receptionResult = evaluatePerformanceFollowUp(receptionTarget, improvedReception);
assert.equal(receptionResult.status, 'improved');
assert.equal(receptionResult.currentValue, 40);
assert.equal(receptionResult.delta, -20);
assert.match(receptionResult.message, /60% → 40% \(-20 pp\); mejora observada/i);

const insufficientReception = baseMatch('small-sample', [
  action('s21', 'away', 'S', '+', 'm1', { serveType: 'jump_spin', endZone: 5 }),
  action('r21', 'home', 'R', '+', 'm1', { receptionContext: 'positive' }),
  action('s22', 'away', 'S', '+', 'm2', { serveType: 'jump_spin', endZone: 5 }),
  action('r22', 'home', 'R', '-', 'm2', { receptionContext: 'negative' }),
  action('s23', 'away', 'S', '+', 'm3', { serveType: 'jump_spin', endZone: 5 }),
  action('r23', 'home', 'R', '+', 'm3', { receptionContext: 'positive' }),
]);

const smallResult = evaluatePerformanceFollowUp(receptionTarget, insufficientReception);
assert.equal(PERFORMANCE_FOLLOW_UP_MIN_SAMPLE, 4);
assert.equal(smallResult.status, 'insufficient_data');
assert.equal(smallResult.currentSample, 3);

const sourceSideout = baseMatch('source-sideout', [
  action('r31', 'home', 'R', '+', 'sr1', { phase: 'K1' }),
  action('a31', 'home', 'A', '#', 'sr1', { phase: 'K1' }),
  action('r32', 'home', 'R', '+', 'sr2', { phase: 'K1' }),
  action('a32', 'home', 'A', '#', 'sr2', { phase: 'K1' }),
  action('r33', 'home', 'R', '+', 'sr3', { phase: 'K1' }),
  action('r34', 'home', 'R', '+', 'sr4', { phase: 'K1' }),
]);

const sideoutTarget = buildPerformanceTargetFromMatch(sourceSideout, {
  metric: 'sideout_pct',
  label: 'R1 Side-out',
  teamSide: 'home',
  rotationRef: 1,
});

assert.equal(sideoutTarget.baselineSample, 4);
assert.equal(sideoutTarget.baselineValue, 50);

const nextSideout = { ...baseMatch('next-sideout', [
  action('r41', 'home', 'R', '+', 'nr1', { phase: 'K1' }),
  action('a41', 'home', 'A', '#', 'nr1', { phase: 'K1' }),
  action('r42', 'home', 'R', '+', 'nr2', { phase: 'K1' }),
  action('a42', 'home', 'A', '#', 'nr2', { phase: 'K1' }),
  action('r43', 'home', 'R', '+', 'nr3', { phase: 'K1' }),
  action('a43', 'home', 'A', '#', 'nr3', { phase: 'K1' }),
  action('r44', 'home', 'R', '+', 'nr4', { phase: 'K1' }),
]), date: '2026-09-19' };

const sideoutResult = evaluatePerformanceFollowUp(sideoutTarget, nextSideout);
assert.equal(sideoutResult.status, 'improved');
assert.equal(sideoutResult.currentValue, 75);
assert.equal(sideoutResult.delta, 25);

const sameMatchResult = evaluatePerformanceFollowUp(sideoutTarget, sourceSideout);
assert.equal(sameMatchResult.status, 'not_comparable');
assert.match(sameMatchResult.message, /partido de origen/i);

const olderMatch = { ...nextSideout, id: 'older-sideout', date: '2026-09-17' };
const olderMatchResult = evaluatePerformanceFollowUp(sideoutTarget, olderMatch);
assert.equal(olderMatchResult.status, 'not_comparable');
assert.match(olderMatchResult.message, /no es posterior/i);

const otherTeamMatch = {
  ...nextSideout,
  id: 'other-team-sideout',
  date: '2026-09-19',
  homeTeamName: 'Another Team',
};
const otherTeamResult = evaluatePerformanceFollowUp(sideoutTarget, otherTeamMatch);
assert.equal(otherTeamResult.status, 'not_comparable');
assert.match(otherTeamResult.message, /este objetivo pertenece/i);

const manualTarget: TrainingPerformanceTarget = {
  metric: 'manual',
  label: 'Objetivo manual',
  teamSide: 'home',
};
const manualResult = evaluatePerformanceFollowUp(manualTarget, nextSideout);
assert.equal(manualResult.status, 'not_comparable');

console.log('Performance follow-up tests passed');
