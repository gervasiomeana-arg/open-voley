import assert from 'node:assert/strict';
import { buildPlayer360RealProfile } from './player360Analytics';
import { MatchData, Player } from '../types';

const player:Player={id:'p7',number:7,name:'Ana',position:'OH',team:'home',starter:true};
const base=(id:string,date:string,evals:Array<['S'|'R'|'A'|'B'|'D','#'|'+'|'='|'/']>):MatchData=>({
 id,title:id,date,competition:'Liga',homeTeamName:'Club',awayTeamName:'Rival',currentSet:1,sets:[],
 homePlayers:[player],awayPlayers:[],homeRotation:[],awayRotation:[],server:{team:'home',playerNum:7},
 actions:evals.map(([skill,evaluation],i)=>({id:`${id}-${i}`,rawCode:'',team:'home',playerNum:7,skill,evaluation,timestamp:i,setNumber:1,scoreHome:0,scoreAway:0,rotationHome:[],rotationAway:[],description:''}))
});
const old=base('old','2026-09-01',[['A','#'],['A','='],['R','#'],['S','#']]);
const current=base('current','2026-09-10',[['A','#'],['A','#'],['R','+'],['S','='],['B','#'],['D','+']]);
const profile=buildPlayer360RealProfile(player,current,[old]);
assert.equal(profile.current.attEffPct,100);
assert.equal(profile.current.recPosPct,100);
assert.equal(profile.serveEfficiencyPct,-100);
assert.equal(profile.current.blockPts,1);
assert.equal(profile.current.digTotal,1);
assert.equal(profile.history.length,2);
assert.equal(profile.history[0].matchId,'old');
assert.equal(profile.history[1].points,3);
console.log('Player 360 analytics tests: OK');
