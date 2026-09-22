import { EvaluationSymbol, TeamSide, VolleySkill } from '../types';

export interface ScoutNextStep {
  team: TeamSide;
  skill: VolleySkill;
}

const other = (team: TeamSide): TeamSide => team === 'home' ? 'away' : 'home';

/**
 * Suggests only rule-safe, high-confidence next actions.
 * Terminal evaluations return null because the rally has ended.
 */
export function nextScoutStep(team: TeamSide, skill: VolleySkill, evaluation: EvaluationSymbol): ScoutNextStep | null {
  if (evaluation === '#' || evaluation === '=' || evaluation === '/') return null;
  if (skill === 'S') return { team: other(team), skill: 'R' };
  if (skill === 'R') return { team, skill: 'E' };
  if (skill === 'E') return { team, skill: 'A' };
  if (skill === 'A') return { team: other(team), skill: 'B' };
  return null;
}
