import assert from 'node:assert/strict';
import { MatchData, Player, ScoutCodeAction } from '../types';
import { buildEvidenceInsights, EVIDENCE_INSIGHT_THRESHOLDS } from './evidenceInsights';

const homePlayers: Player[] = [
  { id: 'hs', number: 1, name: 'Home Setter', position: 'S', team: 'home', starter: true },
  { id: 'hr', number: 2, name: 'Home Receiver', position: 'OH', team: 'home', starter: true },
];

const awayPlayers: Player[] = [
  { id: 'as', number: 7, name: 'Away Setter', position: 'S', team: 'away', starter: true },
  { id: 'sv', number: 8, name: 'Away Server', position: 'OH', team: 'away', starter: true },
];

const baseMatch: MatchData = {
  id: 'evidence-test',
  title: 'Evidence test',
  date: '2026-09-18',
  competition: 'Test',
  homeTeamName: 'Home',
  awayTeamName: 'Away',
  currentSet: 1,
  sets: [{ setNumber: 1, scoreHome: 0, scoreAway: 0 }],
  homePlayers,
  awayPlayers,
  actions: [],
  homeRotation: [1, 2, 0, 0, 0, 0],
  awayRotation: [7, 8, 0, 0, 0, 0],
  server: { team: 'away', playerNum: 8 },
};

function action(partial: Partial<ScoutCodeAction> & Pick<ScoutCodeAction, 'id' | 'team' | 'playerNum' | 'skill' | 'evaluation' | 'rallyId'>): ScoutCodeAction {
  return {
    rawCode: '',
    playerName: partial.team === 'home' ? 'Home' : 'Away',
    timestamp: 0,
    setNumber: 1,
    scoreHome: 0,
    scoreAway: 0,
    rotationHome: [1, 2, 0, 0, 0, 0],
    rotationAway: [7, 8, 0, 0, 0, 0],
    description: '',
    ...partial,
  };
}

// Below threshold: no tactical evidence should be emitted.
const insufficientActions: ScoutCodeAction[] = [
  action({ id: 's1', team: 'away', playerNum: 8, skill: 'S', evaluation: '+', rallyId: 'r1', serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action({ id: 'r1', team: 'home', playerNum: 2, skill: 'R', evaluation: '-', rallyId: 'r1', receptionContext: 'negative', phase: 'K1' }),
  action({ id: 's2', team: 'away', playerNum: 8, skill: 'S', evaluation: '+', rallyId: 'r2', serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action({ id: 'r2', team: 'home', playerNum: 2, skill: 'R', evaluation: '+', rallyId: 'r2', receptionContext: 'positive', phase: 'K1' }),
  action({ id: 's3', team: 'away', playerNum: 8, skill: 'S', evaluation: '+', rallyId: 'r3', serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action({ id: 'r3', team: 'home', playerNum: 2, skill: 'R', evaluation: '!', rallyId: 'r3', receptionContext: 'negative', phase: 'K1' }),
];

const insufficientInsights = buildEvidenceInsights(
  { ...baseMatch, actions: insufficientActions },
  'home',
);

assert.equal(EVIDENCE_INSIGHT_THRESHOLDS.minServeTargetSample, 4);
assert.equal(insufficientInsights.some((item) => item.id.startsWith('serve-target-')), false);

// Threshold met: 3 negative out of 4 = 75%.
const sufficientActions: ScoutCodeAction[] = [
  ...insufficientActions,
  action({ id: 's4', team: 'away', playerNum: 8, skill: 'S', evaluation: '+', rallyId: 'r4', serveType: 'jump_spin', endZone: 5, phase: 'K2' }),
  action({ id: 'r4', team: 'home', playerNum: 2, skill: 'R', evaluation: '=', rallyId: 'r4', receptionContext: 'negative', phase: 'K1' }),
];

const sufficientInsights = buildEvidenceInsights(
  { ...baseMatch, actions: sufficientActions },
  'home',
);

const serveInsight = sufficientInsights.find((item) => item.id === 'serve-target-jump_spin-z5');
assert.ok(serveInsight);
assert.equal(serveInsight.evidenceCount, 4);
assert.match(serveInsight.description, /3 recepciones negativas de 4 vinculadas \(75%\)/);
assert.match(serveInsight.description, /1 errores directos de recepción/);

// Rotation evidence also requires 4 receptions in at least two rotations.
const rotationActions: ScoutCodeAction[] = [];
for (let i = 0; i < 4; i += 1) {
  rotationActions.push(
    action({
      id: `rr1-${i}`,
      team: 'home',
      playerNum: 2,
      skill: 'R',
      evaluation: '+',
      rallyId: `rr1-${i}`,
      phase: 'K1',
      rotationHome: [1, 2, 0, 0, 0, 0],
    }),
  );
  if (i < 2) {
    rotationActions.push(
      action({
        id: `ra1-${i}`,
        team: 'home',
        playerNum: 2,
        skill: 'A',
        evaluation: '#',
        rallyId: `rr1-${i}`,
        phase: 'K1',
        rotationHome: [1, 2, 0, 0, 0, 0],
      }),
    );
  }

  rotationActions.push(
    action({
      id: `rr2-${i}`,
      team: 'home',
      playerNum: 2,
      skill: 'R',
      evaluation: '+',
      rallyId: `rr2-${i}`,
      phase: 'K1',
      rotationHome: [2, 1, 0, 0, 0, 0],
    }),
  );
  if (i < 3) {
    rotationActions.push(
      action({
        id: `ra2-${i}`,
        team: 'home',
        playerNum: 2,
        skill: 'A',
        evaluation: '#',
        rallyId: `rr2-${i}`,
        phase: 'K1',
        rotationHome: [2, 1, 0, 0, 0, 0],
      }),
    );
  }
}

const rotationInsights = buildEvidenceInsights(
  { ...baseMatch, actions: rotationActions },
  'home',
);

const weakRotation = rotationInsights.find((item) => item.id === 'rotation-sideout-r1');
assert.ok(weakRotation);
assert.equal(weakRotation.evidenceCount, 4);
assert.match(weakRotation.description, /2 de 4 oportunidades de recepción \(50%\)/);

const contrast = rotationInsights.find((item) => item.id === 'rotation-contrast-r2-r1');
assert.ok(contrast);
assert.match(contrast.description, /75% en R2 frente a 50% en R1/);
assert.match(contrast.description, /25 puntos porcentuales/);

console.log('Evidence insight tests passed');
