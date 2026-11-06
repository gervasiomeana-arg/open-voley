import { MatchData, TeamSide } from '../types';

export interface SubstitutionResult {
  rotation: number[];
  server: MatchData['server'];
  zone: number;
}

export function applySubstitution(
  match: MatchData,
  team: TeamSide,
  playerOut: number,
  playerIn: number,
): SubstitutionResult | null {
  const rotation = [...(team === 'home' ? match.homeRotation : match.awayRotation)];
  const zoneIndex = rotation.indexOf(playerOut);
  if (zoneIndex < 0) return null;
  if (rotation.includes(playerIn)) return null;

  rotation[zoneIndex] = playerIn;
  const server =
    match.server.team === team && zoneIndex === 0
      ? { team, playerNum: playerIn }
      : { ...match.server };

  return { rotation, server, zone: zoneIndex + 1 };
}
