import { EvaluationSymbol, MatchData, TeamSide, VolleySkill } from '../types';

export const rotateClockwise = (rotation: number[]): number[] => {
  if (rotation.length !== 6) return [...rotation];
  const [p1, p2, p3, p4, p5, p6] = rotation;
  return [p2, p3, p4, p5, p6, p1];
};

export const pointWinnerFromAction = (
  actionTeam: TeamSide,
  skill: VolleySkill,
  evaluation: EvaluationSymbol,
): TeamSide | null => {
  if (evaluation === '#') {
    return skill === 'A' || skill === 'S' || skill === 'B' ? actionTeam : null;
  }
  if (evaluation === '/') {
    return skill === 'A' ? (actionTeam === 'home' ? 'away' : 'home') : null;
  }
  if (evaluation === '=') {
    return actionTeam === 'home' ? 'away' : 'home';
  }
  return null;
};

export interface RallyState {
  homeRotation: number[];
  awayRotation: number[];
  server: MatchData['server'];
}

export const applyRallyWinner = (
  state: RallyState,
  winner: TeamSide,
): RallyState => {
  if (winner === state.server.team) {
    const rotation = winner === 'home' ? state.homeRotation : state.awayRotation;
    return {
      homeRotation: [...state.homeRotation],
      awayRotation: [...state.awayRotation],
      server: { team: winner, playerNum: rotation[0] },
    };
  }

  if (winner === 'home') {
    const homeRotation = rotateClockwise(state.homeRotation);
    return {
      homeRotation,
      awayRotation: [...state.awayRotation],
      server: { team: 'home', playerNum: homeRotation[0] },
    };
  }

  const awayRotation = rotateClockwise(state.awayRotation);
  return {
    homeRotation: [...state.homeRotation],
    awayRotation,
    server: { team: 'away', playerNum: awayRotation[0] },
  };
};

export const normalizeServerToP1 = (match: MatchData): MatchData['server'] => {
  const rotation = match.server.team === 'home' ? match.homeRotation : match.awayRotation;
  return { team: match.server.team, playerNum: rotation[0] ?? match.server.playerNum };
};
