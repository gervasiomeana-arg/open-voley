import assert from 'node:assert/strict';
import { buildOpenAiConversationContext } from './openAiConversationContext';
import { MatchData } from '../types';
const match:MatchData={id:'m',title:'Club vs Rival',date:'2026-09-18',competition:'Liga',homeTeamName:'Club',awayTeamName:'Rival',currentSet:1,sets:[],homePlayers:[{id:'p7',number:7,name:'Ana',position:'OH',team:'home',starter:true}],awayPlayers:[],homeRotation:[],awayRotation:[],server:{team:'home',playerNum:7},actions:[
{id:'1',rawCode:'',team:'home',playerNum:7,skill:'A',evaluation:'#',timestamp:1,setNumber:1,scoreHome:1,scoreAway:0,rotationHome:[],rotationAway:[],description:''},
{id:'2',rawCode:'',team:'home',playerNum:7,skill:'R',evaluation:'+',timestamp:2,setNumber:1,scoreHome:1,scoreAway:0,rotationHome:[],rotationAway:[],description:''}
]};
const ctx=buildOpenAiConversationContext(match,[]);
assert.equal(ctx.current.home.attack.efficiencyPct,100);
assert.equal(ctx.current.home.reception.positivePct,100);
assert.equal(ctx.players[0].points,1);
assert.equal(ctx.history.length,0);
console.log('OPEN AI conversation context tests: OK');
