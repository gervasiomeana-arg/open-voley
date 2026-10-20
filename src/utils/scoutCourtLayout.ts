import { MatchData, Player, ScoutLayoutPreset, TeamSide } from '../types';

export type ScoutCourtLayout = 'roles' | 'rotation';
export const SCOUT_ROLE_LABELS: Record<Player['position'], string> = {
  OH: 'Punta', MB: 'Central', S: 'Armador', OPP: 'Opuesto', L: 'Líbero',
};

/** A selection layout, never a lineup change or a claim of tracked physical location.
 * Pick front/back row specialists from the actual six; unusual systems fall back
 * to their unused rotational player so nobody disappears or appears twice.
 */
export function playersByRole(roster: Player[], rotation: number[], receiving = false): Map<number, Player> {
  const six = rotation.map(n => roster.find(p => p.number === n && p.position !== 'L'));
  const result = new Map<number, Player>();
  const used = new Set<string>();
  const front = (p: Player) => rotation.indexOf(p.number) >= 1 && rotation.indexOf(p.number) <= 3;
  const take = (zone: number, roles: Player['position'][], frontRow: boolean) => {
    const player = six.find(p => p && !used.has(p.id) && roles.includes(p.position) && front(p) === frontRow);
    if (player) { result.set(zone, player); used.add(player.id); }
  };
  take(4, ['OH'], true); take(3, ['MB'], true); take(2, ['S', 'OPP'], true);
  take(6, ['OH'], false); take(5, ['MB'], false); take(1, ['S', 'OPP'], false);
  // Retain all six in incomplete/atypical rosters without inventing roles.
  for (const zone of [4, 3, 2, 5, 6, 1]) {
    if (result.has(zone)) continue;
    const player = six.find(p => p && !used.has(p.id));
    if (player) { result.set(zone, player); used.add(player.id); }
  }
  // Standard receive alignment requested by the coach: setter at P1,
  // front-row opposite at 4 and front-row outside hitter at 2.
  if (receiving && setterPosition(roster,rotation)===1 && result.get(2)?.position==='OPP' && result.get(4)?.position==='OH') {
    const outside=result.get(4)!; result.set(4,result.get(2)!); result.set(2,outside);
  }
  return result;
}

export function setterPosition(roster: Player[], rotation: number[]): number {
  const setter = roster.find(p => p.position === 'S' && rotation.includes(p.number));
  return setter ? rotation.indexOf(setter.number) + 1 : 0;
}

export function rotationWithSetterAt(roster: Player[], rotation: number[], position: number): number[] {
  let next = [...rotation];
  if (!setterPosition(roster, next)) return next;
  for (let i=0;i<6 && setterPosition(roster,next)!==position;i++) next=[...next.slice(1),next[0]];
  return next;
}

export function scoutRotationKey(roster: Player[], rotation: number[], receiving: boolean): string {
  const position=setterPosition(roster,rotation);
  return `${position ? `setter-${position}` : `six-${rotation.join('-')}`}:${receiving?'receive':'serve'}`;
}

export function isScoutLayoutPreset(value: unknown): value is ScoutLayoutPreset {
  const p=value as ScoutLayoutPreset | undefined;
  return !!p && Array.isArray(p.positions) && p.positions.length===6 && new Set(p.positions).size===6 &&
    p.positions.every(n=>Number.isInteger(n)&&n>=1&&n<=6) && Number.isInteger(p.liberoZone) && p.liberoZone>=1 && p.liberoZone<=6;
}

export function defaultScoutPreset(roster: Player[], rotation: number[], receiving: boolean): ScoutLayoutPreset {
  const slots=playersByRole(roster,rotation,receiving);
  const positions=Array.from({length:6},(_,i)=> {
    const player=slots.get(i+1);
    return player ? rotation.indexOf(player.number)+1 : 0;
  });
  return {positions,liberoZone:5};
}

export function resolveScoutPreset(match: MatchData, team: TeamSide, rotation?: number[], receiving=match.server.team!==team): ScoutLayoutPreset {
  const roster=team==='home'?match.homePlayers:match.awayPlayers;
  const six=rotation ?? (team==='home'?match.homeRotation:match.awayRotation);
  const stored=match.scoutLayouts?.[team]?.[scoutRotationKey(roster,six,receiving)];
  return isScoutLayoutPreset(stored) ? {positions:[...stored.positions],liberoZone:stored.liberoZone} : defaultScoutPreset(roster,six,receiving);
}

export function moveScoutSlot(preset: ScoutLayoutPreset, from: number | 'libero', to: number): ScoutLayoutPreset {
  if (!isScoutLayoutPreset(preset) || !Number.isInteger(to) || to<1 || to>6) return preset;
  if (from==='libero') return {...preset,positions:[...preset.positions],liberoZone:to};
  if (!Number.isInteger(from) || from<1 || from>6) return preset;
  const positions=[...preset.positions];
  [positions[from-1],positions[to-1]]=[positions[to-1],positions[from-1]];
  return {...preset,positions};
}

/** Preserve current score, service, lineup and every historical action. */
export function saveScoutPreset(match: MatchData, team: TeamSide, key: string, preset: ScoutLayoutPreset | null): MatchData {
  if (preset && !isScoutLayoutPreset(preset)) return match;
  const layouts={...(match.scoutLayouts?.[team] ?? {})};
  if (preset) layouts[key]={positions:[...preset.positions],liberoZone:preset.liberoZone};
  else delete layouts[key];
  return {...match,scoutLayouts:{...match.scoutLayouts,[team]:layouts}};
}
