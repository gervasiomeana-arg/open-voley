import { MatchData, Player, PlayerStats, ScoutCodeAction, TeamSide } from '../types';

export interface PlayerMatchHistoryPoint {
  matchId: string;
  title: string;
  date: string;
  opponent: string;
  actions: number;
  points: number;
  attackEffPct: number | null;
  receptionPosPct: number | null;
  serveEfficiencyPct: number | null;
  aces: number;
  serveErrors: number;
  blockPoints: number;
  digs: number;
}

export interface Player360RealProfile {
  current: PlayerStats;
  currentActions: ScoutCodeAction[];
  serveEfficiencyPct: number | null;
  history: PlayerMatchHistoryPoint[];
}

function playerActions(match: MatchData, player: Player): ScoutCodeAction[] {
  return (match.actions || []).filter((action) => action.team === player.team && action.playerNum === player.number);
}

function statsFromActions(player: Player, actions: ScoutCodeAction[]): PlayerStats {
  const serves=actions.filter(a=>a.skill==='S');
  const rec=actions.filter(a=>a.skill==='R');
  const att=actions.filter(a=>a.skill==='A');
  const blocks=actions.filter(a=>a.skill==='B');
  const digs=actions.filter(a=>a.skill==='D');
  const serveAce=serves.filter(a=>a.evaluation==='#').length;
  const serveErr=serves.filter(a=>a.evaluation==='=').length;
  const recPerfect=rec.filter(a=>a.evaluation==='#').length;
  const recPositive=rec.filter(a=>a.evaluation==='+').length;
  const recErr=rec.filter(a=>a.evaluation==='=').length;
  const attPts=att.filter(a=>a.evaluation==='#').length;
  const attErr=att.filter(a=>a.evaluation==='=').length;
  const attBlocked=att.filter(a=>a.evaluation==='/').length;
  return {
    playerNum:player.number,name:player.name,position:player.position,team:player.team,
    serveTotal:serves.length,serveAce,serveErr,
    recTotal:rec.length,recPerfect,recPositive,recErr,
    recPosPct:rec.length ? Math.round(((recPerfect+recPositive)/rec.length)*100) : 0,
    recPerfPct:rec.length ? Math.round((recPerfect/rec.length)*100) : 0,
    attTotal:att.length,attPts,attErr,attBlocked,
    attEffPct:att.length ? Math.round(((attPts-attErr-attBlocked)/att.length)*100) : 0,
    blockPts:blocks.filter(a=>a.evaluation==='#').length,
    digTotal:digs.length,
  };
}

function serveEfficiency(actions: ScoutCodeAction[]): number | null {
  const serves=actions.filter(a=>a.skill==='S');
  if(!serves.length) return null;
  const aces=serves.filter(a=>a.evaluation==='#').length;
  const errors=serves.filter(a=>a.evaluation==='=').length;
  return Math.round(((aces-errors)/serves.length)*100);
}

function sideForPlayer(match: MatchData, player: Player): TeamSide | null {
  const sidePlayers = player.team === 'home' ? match.homePlayers : match.awayPlayers;
  if(sidePlayers?.some(p=>p.number===player.number && (p.id===player.id || p.name===player.name))) return player.team;
  const other: TeamSide = player.team === 'home' ? 'away' : 'home';
  const otherPlayers = other === 'home' ? match.homePlayers : match.awayPlayers;
  return otherPlayers?.some(p=>p.id===player.id || (p.number===player.number && p.name===player.name)) ? other : null;
}

export function buildPlayer360RealProfile(player: Player, currentMatch: MatchData, historicalMatches: MatchData[]): Player360RealProfile {
  const currentActions=playerActions(currentMatch,player);
  const current=statsFromActions(player,currentActions);
  const unique=new Map<string,MatchData>();
  for(const match of [...historicalMatches,currentMatch]) unique.set(match.id,match);
  const history=[...unique.values()]
    .map(match=>{
      const side=sideForPlayer(match,player);
      if(!side) return null;
      const actions=(match.actions||[]).filter(a=>a.team===side && a.playerNum===player.number);
      if(!actions.length) return null;
      const adapted={...player,team:side};
      const stats=statsFromActions(adapted,actions);
      const opponent=side==='home'?match.awayTeamName:match.homeTeamName;
      return {
        matchId:match.id,title:match.title,date:match.date,opponent,actions:actions.length,
        points:stats.attPts+stats.blockPts+stats.serveAce,
        attackEffPct:stats.attTotal?stats.attEffPct:null,
        receptionPosPct:stats.recTotal?stats.recPosPct:null,
        serveEfficiencyPct:serveEfficiency(actions),
        aces:stats.serveAce,serveErrors:stats.serveErr,blockPoints:stats.blockPts,digs:stats.digTotal,
      } satisfies PlayerMatchHistoryPoint;
    })
    .filter((x):x is PlayerMatchHistoryPoint=>Boolean(x))
    .sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());
  return {current,currentActions,serveEfficiencyPct:serveEfficiency(currentActions),history};
}
