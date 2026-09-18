import { ScoutCodeAction, TeamSide } from '../types';

function isTerminalAction(action: ScoutCodeAction): boolean {
  if (action.evaluation === '=') return true;
  if (action.skill === 'S' && action.evaluation === '#') return true;
  if (action.skill === 'A' && (action.evaluation === '#' || action.evaluation === '/')) return true;
  if (action.skill === 'B' && action.evaluation === '#') return true;
  return false;
}

function inferReceptionContext(action: ScoutCodeAction): ScoutCodeAction['receptionContext'] {
  if (action.skill !== 'R') return action.receptionContext;
  if (action.evaluation === '#' || action.evaluation === '+') return 'positive';
  if (action.evaluation === '!' || action.evaluation === '-' || action.evaluation === '/' || action.evaluation === '=') {
    return 'negative';
  }
  return 'unknown';
}

function servingTeamFromRally(actions: ScoutCodeAction[]): TeamSide | undefined {
  return actions.find((action) => action.skill === 'S')?.team;
}

function inferPhase(action: ScoutCodeAction, servingTeam?: TeamSide): ScoutCodeAction['phase'] {
  if (action.phase && action.phase !== 'unknown') return action.phase;
  if (!servingTeam) return 'unknown';
  return action.team === servingTeam ? 'K2' : 'K1';
}

function buildRallyId(action: ScoutCodeAction): string {
  return `rally_s${action.setNumber}_${action.scoreHome}-${action.scoreAway}_${action.id}`;
}

/**
 * Adds structured rally metadata to new scouting actions without changing old records.
 *
 * Rules:
 * - a serve always starts a new rally;
 * - otherwise an action joins the latest open rally when set/score snapshot match;
 * - a terminal action closes the rally for the next action;
 * - sequence is 1-based inside the rally;
 * - K1/K2 is inferred from the serving team, while explicit phase values are preserved.
 */
export function enrichActionsWithRallyContext(
  existingActions: ScoutCodeAction[] = [],
  incomingActions: ScoutCodeAction[] = [],
): ScoutCodeAction[] {
  const enriched: ScoutCodeAction[] = [];
  const all = [...existingActions];

  for (const incoming of incomingActions) {
    if (incoming.rallyId) {
      const sameRally = [...all, ...enriched].filter((action) => action.rallyId === incoming.rallyId);
      const servingTeam = servingTeamFromRally(sameRally);
      const next = {
        ...incoming,
        rallySequence: incoming.rallySequence ?? sameRally.length + 1,
        phase: inferPhase(incoming, servingTeam),
        receptionContext: inferReceptionContext(incoming),
      };
      enriched.push(next);
      continue;
    }

    const prior = [...all, ...enriched];
    const previous = prior[prior.length - 1];

    const canJoinPrevious =
      incoming.skill !== 'S' &&
      previous &&
      previous.rallyId &&
      previous.setNumber === incoming.setNumber &&
      previous.scoreHome === incoming.scoreHome &&
      previous.scoreAway === incoming.scoreAway &&
      !isTerminalAction(previous);

    const rallyId = canJoinPrevious ? previous.rallyId! : buildRallyId(incoming);
    const sameRally = prior.filter((action) => action.rallyId === rallyId);
    const servingTeam =
      incoming.skill === 'S'
        ? incoming.team
        : servingTeamFromRally(sameRally);

    enriched.push({
      ...incoming,
      rallyId,
      rallySequence: sameRally.length + 1,
      phase: inferPhase(incoming, servingTeam),
      receptionContext: inferReceptionContext(incoming),
    });
  }

  return enriched;
}
