import { MatchSet, TeamSide } from '../types';

export interface SetCompletion {
  isComplete: boolean;
  winner?: TeamSide;
}

export function evaluateSetCompletion(setNumber:number, home:number, away:number):SetCompletion {
  const target=setNumber===5?15:25;
  const leader:TeamSide=home>away?'home':'away';
  const max=Math.max(home,away);
  const diff=Math.abs(home-away);
  if(max>=target && diff>=2) return {isComplete:true,winner:leader};
  return {isComplete:false};
}

export function setsWon(sets:MatchSet[],team:TeamSide):number {
  return sets.filter(set=>set.winner===team).length;
}

export function matchWinnerFromSets(sets:MatchSet[]):TeamSide|null {
  if(setsWon(sets,'home')>=3) return 'home';
  if(setsWon(sets,'away')>=3) return 'away';
  return null;
}
