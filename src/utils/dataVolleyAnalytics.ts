import { MatchData, Player, ScoutCodeAction, TeamSide } from '../types';

export interface SkillSummary {
  total: number;
  errors: number;
  points: number;
  blocked?: number;
  positivePct?: number;
  perfectPct?: number;
  pointPct?: number;
  efficiencyPct?: number;
}

export interface RotationSummary {
  rotation: number;
  samples: number;
  reception: SkillSummary;
  attack: SkillSummary;
  serve: SkillSummary;
  sideoutOpportunities: number;
  sideoutWon: number;
  sideoutPct: number;
  breakPointOpportunities: number;
  breakPointWon: number;
  breakPointPct: number;
}

export interface TeamDataVolleySummary {
  teamSide: TeamSide;
  teamName: string;
  serve: SkillSummary;
  reception: SkillSummary;
  attack: SkillSummary;
  blockPoints: number;
  directPoints: number;
  directErrors: number;
  gainLoss: number;
  rotations: RotationSummary[];
  strongestRotation?: number;
  weakestRotation?: number;
  sampleSize: number;
}

const pct = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

function teamPlayers(match: MatchData, teamSide: TeamSide): Player[] {
  return teamSide === 'home' ? match.homePlayers : match.awayPlayers;
}

function teamName(match: MatchData, teamSide: TeamSide): string {
  return teamSide === 'home' ? match.homeTeamName : match.awayTeamName;
}

function actionRotation(action: ScoutCodeAction, match: MatchData, teamSide: TeamSide): number {
  const setter = teamPlayers(match, teamSide).find((player) => player.position === 'S' && player.starter)
    ?? teamPlayers(match, teamSide).find((player) => player.position === 'S');
  if (!setter) return 0;

  const rotation = teamSide === 'home' ? action.rotationHome : action.rotationAway;
  if (!Array.isArray(rotation) || rotation.length < 6) return 0;

  const setterIndex = rotation.indexOf(setter.number);
  return setterIndex >= 0 ? setterIndex + 1 : 0;
}

function sameRallyWindow(actions: ScoutCodeAction[], startIndex: number, maxSeconds = 25): ScoutCodeAction[] {
  const start = actions[startIndex];

  // Prefer explicit structured rally membership whenever available.
  if (start.rallyId) {
    return actions
      .filter((action, index) => index !== startIndex && action.rallyId === start.rallyId)
      .sort((a, b) => (a.rallySequence || 0) - (b.rallySequence || 0));
  }

  // Backward-compatible fallback for historical matches without rallyId.
  const result: ScoutCodeAction[] = [];
  for (let i = startIndex + 1; i < actions.length; i += 1) {
    const action = actions[i];
    if (action.setNumber !== start.setNumber) break;
    if (action.timestamp < start.timestamp) continue;
    if (action.timestamp - start.timestamp > maxSeconds) break;

    if (action.skill === 'S') break;
    result.push(action);
  }

  return result;
}

function observedSideout(actions: ScoutCodeAction[], teamSide: TeamSide, rotation: number, match: MatchData) {
  let opportunities = 0;
  let won = 0;

  actions.forEach((action, index) => {
    if (action.team !== teamSide || action.skill !== 'R') return;
    if (actionRotation(action, match, teamSide) !== rotation) return;

    opportunities += 1;
    const window = sameRallyWindow(actions, index);
    const pointWon = window.some((next) =>
      next.team === teamSide &&
      next.evaluation === '#' &&
      (next.phase === 'K1' || (!next.phase && ['A', 'B'].includes(next.skill)))
    );
    if (pointWon) won += 1;
  });

  return { opportunities, won, pct: pct(won, opportunities) };
}

function observedBreakPoint(actions: ScoutCodeAction[], teamSide: TeamSide, rotation: number, match: MatchData) {
  let opportunities = 0;
  let won = 0;

  actions.forEach((action, index) => {
    if (action.team !== teamSide || action.skill !== 'S') return;
    if (actionRotation(action, match, teamSide) !== rotation) return;

    opportunities += 1;
    if (action.evaluation === '#') {
      won += 1;
      return;
    }

    const window = sameRallyWindow(actions, index);
    const pointWon = window.some((next) =>
      next.team === teamSide &&
      next.evaluation === '#' &&
      (next.phase === 'K2' || (!next.phase && ['A', 'B'].includes(next.skill)))
    );
    if (pointWon) won += 1;
  });

  return { opportunities, won, pct: pct(won, opportunities) };
}

function summarizeServe(actions: ScoutCodeAction[]): SkillSummary {
  const serves = actions.filter((action) => action.skill === 'S');
  const points = serves.filter((action) => action.evaluation === '#').length;
  const errors = serves.filter((action) => action.evaluation === '=').length;
  return {
    total: serves.length,
    errors,
    points,
    pointPct: pct(points, serves.length),
    efficiencyPct: pct(points - errors, serves.length),
  };
}

function summarizeReception(actions: ScoutCodeAction[]): SkillSummary {
  const receptions = actions.filter((action) => action.skill === 'R');
  const errors = receptions.filter((action) => action.evaluation === '=').length;
  const perfect = receptions.filter((action) => action.evaluation === '#').length;
  const positive = receptions.filter((action) => action.evaluation === '#' || action.evaluation === '+').length;

  return {
    total: receptions.length,
    errors,
    points: 0,
    positivePct: pct(positive, receptions.length),
    perfectPct: pct(perfect, receptions.length),
  };
}

function summarizeAttack(actions: ScoutCodeAction[]): SkillSummary {
  const attacks = actions.filter((action) => action.skill === 'A');
  const points = attacks.filter((action) => action.evaluation === '#').length;
  const errors = attacks.filter((action) => action.evaluation === '=').length;
  const blocked = attacks.filter((action) => action.evaluation === '/').length;

  return {
    total: attacks.length,
    errors,
    blocked,
    points,
    pointPct: pct(points, attacks.length),
    efficiencyPct: pct(points - errors - blocked, attacks.length),
  };
}

export function calculateRotationSummaries(match: MatchData, teamSide: TeamSide): RotationSummary[] {
  const orderedActions = [...(match.actions || [])].sort((a, b) => {
    if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber;
    return a.timestamp - b.timestamp;
  });

  return [1, 2, 3, 4, 5, 6].map((rotation) => {
    const rotationActions = orderedActions.filter(
      (action) => action.team === teamSide && actionRotation(action, match, teamSide) === rotation,
    );

    const sideout = observedSideout(orderedActions, teamSide, rotation, match);
    const breakPoint = observedBreakPoint(orderedActions, teamSide, rotation, match);

    return {
      rotation,
      samples: rotationActions.length,
      reception: summarizeReception(rotationActions),
      attack: summarizeAttack(rotationActions),
      serve: summarizeServe(rotationActions),
      sideoutOpportunities: sideout.opportunities,
      sideoutWon: sideout.won,
      sideoutPct: sideout.pct,
      breakPointOpportunities: breakPoint.opportunities,
      breakPointWon: breakPoint.won,
      breakPointPct: breakPoint.pct,
    };
  });
}

export function calculateTeamDataVolleySummary(match: MatchData, teamSide: TeamSide): TeamDataVolleySummary {
  const actions = (match.actions || []).filter((action) => action.team === teamSide);
  const serve = summarizeServe(actions);
  const reception = summarizeReception(actions);
  const attack = summarizeAttack(actions);
  const blockPoints = actions.filter((action) => action.skill === 'B' && action.evaluation === '#').length;

  const directPoints = serve.points + attack.points + blockPoints;
  const directErrors =
    serve.errors +
    reception.errors +
    attack.errors +
    (attack.blocked || 0);

  const rotations = calculateRotationSummaries(match, teamSide);
  const comparable = rotations.filter((row) => row.sideoutOpportunities >= 2);

  const strongestRotation = comparable.length
    ? [...comparable].sort((a, b) => b.sideoutPct - a.sideoutPct)[0].rotation
    : undefined;
  const weakestRotation = comparable.length
    ? [...comparable].sort((a, b) => a.sideoutPct - b.sideoutPct)[0].rotation
    : undefined;

  return {
    teamSide,
    teamName: teamName(match, teamSide),
    serve,
    reception,
    attack,
    blockPoints,
    directPoints,
    directErrors,
    gainLoss: directPoints - directErrors,
    rotations,
    strongestRotation,
    weakestRotation,
    sampleSize: actions.length,
  };
}
