import { MatchData, TeamSide } from '../types';

const BACK_ROW = new Set([1, 5, 6]);

export function canLiberoReplace(match: MatchData, team: TeamSide, replacedPlayerNum: number): boolean {
  const rotation = team === 'home' ? match.homeRotation : match.awayRotation;
  const zone = rotation.indexOf(replacedPlayerNum) + 1;
  if (!BACK_ROW.has(zone)) return false;
  // In this first rule-safe version the libero never serves. If P1 owns service,
  // the replacement must be removed before the serve is recorded.
  if (zone === 1 && match.server.team === team) return false;
  return true;
}

export function applyLiberoReplacement(
  match: MatchData,
  team: TeamSide,
  liberoNum: number,
  replacedPlayerNum: number,
): MatchData['liberoReplacements'] | null {
  const players = team === 'home' ? match.homePlayers : match.awayPlayers;
  const libero = players.find(p => p.number === liberoNum);
  if (!libero || libero.position !== 'L') return null;
  if (!canLiberoReplace(match, team, replacedPlayerNum)) return null;
  return {
    ...(match.liberoReplacements || {}),
    [team]: { liberoNum, replacedPlayerNum },
  };
}

export function normalizeLiberoReplacements(match: MatchData): MatchData['liberoReplacements'] {
  const next = { ...(match.liberoReplacements || {}) };
  (['home','away'] as TeamSide[]).forEach(team => {
    const replacement = next[team];
    if (!replacement) return;
    if (!canLiberoReplace(match, team, replacement.replacedPlayerNum)) delete next[team];
  });
  return next;
}

export function physicalPlayerNumber(match: MatchData, team: TeamSide, rotationalPlayerNum: number): number {
  const replacement = match.liberoReplacements?.[team];
  return replacement?.replacedPlayerNum === rotationalPlayerNum
    ? replacement.liberoNum
    : rotationalPlayerNum;
}
