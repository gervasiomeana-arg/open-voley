import { MatchData, TeamSide } from '../types';
import { buildEvidenceInsights } from './evidenceInsights';

const pct=(n:number,d:number)=>d?Math.round((n/d)*100):null;

function teamMetrics(match:MatchData,team:TeamSide){
 const actions=(match.actions||[]).filter(a=>a.team===team);
 const by=(skill:string)=>actions.filter(a=>a.skill===skill);
 const attacks=by('A'), serves=by('S'), receptions=by('R');
 return {
  actions:actions.length,
  attack:{total:attacks.length,points:attacks.filter(a=>a.evaluation==='#').length,errors:attacks.filter(a=>a.evaluation==='=').length,blocked:attacks.filter(a=>a.evaluation==='/').length,
   efficiencyPct:attacks.length?Math.round(((attacks.filter(a=>a.evaluation==='#').length-attacks.filter(a=>a.evaluation==='=').length-attacks.filter(a=>a.evaluation==='/').length)/attacks.length)*100):null},
  serve:{total:serves.length,aces:serves.filter(a=>a.evaluation==='#').length,errors:serves.filter(a=>a.evaluation==='=').length},
  reception:{total:receptions.length,positive:receptions.filter(a=>a.evaluation==='#'||a.evaluation==='+').length,errors:receptions.filter(a=>a.evaluation==='=').length,positivePct:pct(receptions.filter(a=>a.evaluation==='#'||a.evaluation==='+').length,receptions.length)},
  blockPoints:by('B').filter(a=>a.evaluation==='#').length,digs:by('D').length
 };
}
export function buildOpenAiConversationContext(match:MatchData,history:MatchData[]){
 const playerRows=[...match.homePlayers,...match.awayPlayers].map(player=>{
  const actions=(match.actions||[]).filter(a=>a.team===player.team&&a.playerNum===player.number);
  return {number:player.number,name:player.name,team:player.team,position:player.position,actions:actions.length,points:actions.filter(a=>(a.skill==='A'||a.skill==='B'||a.skill==='S')&&a.evaluation==='#').length};
 }).filter(p=>p.actions>0);
 const evidence=buildEvidenceInsights(match,'home').map(i=>({title:i.title,description:i.description,evidenceCount:i.evidenceCount,rallyIds:i.rallyIds||[]}));
 const previous=[...history].filter(m=>m.id!==match.id).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,8).map(m=>({
  id:m.id,date:m.date,title:m.title,homeTeam:m.homeTeamName,awayTeam:m.awayTeamName,home:teamMetrics(m,'home'),away:teamMetrics(m,'away')
 }));
 return {match:{id:match.id,title:match.title,date:match.date,competition:match.competition,homeTeam:match.homeTeamName,awayTeam:match.awayTeamName,sets:match.sets,currentSet:match.currentSet},current:{home:teamMetrics(match,'home'),away:teamMetrics(match,'away')},players:playerRows,evidence,history:previous};
}
