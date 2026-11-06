import assert from 'node:assert/strict';
import { MatchData, Player, ScoutCodeAction } from '../types';
import { calculateTeamDataVolleySummary } from './dataVolleyAnalytics';
import { buildEvidenceInsights } from './evidenceInsights';
import { buildEvidenceExercises } from './trainingEvidence';
import { buildPerformanceTargetFromMatch, evaluatePerformanceFollowUp } from './performanceFollowUp';
import { buildPlayer360RealProfile } from './player360Analytics';
import { buildOpenAiConversationContext } from './openAiConversationContext';

const home:Player[]=[
 {id:'s1',number:1,name:'Armadora',position:'S',team:'home',starter:true},
 {id:'oh7',number:7,name:'Punta 7',position:'OH',team:'home',starter:true},
];
const away:Player[]=[{id:'a8',number:8,name:'Sacadora 8',position:'OH',team:'away',starter:true}];
function action(id:string,team:'home'|'away',playerNum:number,skill:ScoutCodeAction['skill'],evaluation:ScoutCodeAction['evaluation'],rallyId:string,timestamp:number,extra:Partial<ScoutCodeAction>={}):ScoutCodeAction{
 return {id,rawCode:'',team,playerNum,skill,evaluation,rallyId,timestamp,setNumber:1,scoreHome:0,scoreAway:0,rotationHome:[1,7,0,0,0,0],rotationAway:[8,0,0,0,0,0],description:'',...extra};
}
function match(id:string,date:string,negative:number):MatchData{
 const actions:ScoutCodeAction[]=[];
 for(let i=0;i<4;i++){
  const rally=`${id}-r${i}`;
  actions.push(action(`${rally}-s`,'away',8,'S','+',rally,i*10,{serveType:'jump_spin',endZone:5,phase:'K2'}));
  const bad=i<negative;
  actions.push(action(`${rally}-r`,'home',7,'R',bad?'-':'+',rally,i*10+1,{receptionContext:bad?'negative':'positive',phase:'K1'}));
  if(!bad) actions.push(action(`${rally}-a`,'home',7,'A','#',rally,i*10+3,{phase:'K1'}));
 }
 actions.push(action(`${id}-ace`,'home',7,'S','#',`${id}-serve`,50,{phase:'K2'}));
 actions.push(action(`${id}-block`,'home',7,'B','#',`${id}-block-r`,60,{phase:'K2'}));
 return {id,title:`OPEN VOLEY ${id}`,date,competition:'Liga',homeTeamName:'OPEN Club',awayTeamName:'Rival',currentSet:1,sets:[{setNumber:1,scoreHome:25,scoreAway:20,winner:'home'}],homePlayers:home,awayPlayers:away,actions,homeRotation:[1,7,0,0,0,0],awayRotation:[8,0,0,0,0,0],server:{team:'home',playerNum:7},winner:'home',isFinished:true,status:'finished'};
}
const source=match('source','2026-09-10',3);
const later=match('later','2026-09-17',1);

// Partido -> Scout -> Estadísticas
assert.ok(source.actions.length>=10);
const summary=calculateTeamDataVolleySummary(source,'home');
assert.equal(summary.reception.total,4);
assert.equal(summary.reception.positivePct,25);

// Análisis -> Evidencia
const insights=buildEvidenceInsights(source,'home');
const pressure=insights.find(i=>i.id==='serve-target-jump_spin-z5');
assert.ok(pressure);
assert.equal(pressure.evidenceCount,4);
assert.equal(pressure.rallyIds?.length,4);

// Evidencia -> Entrenamiento
const evidenceContext={title:pressure.title,description:pressure.description,evidenceSource:pressure.evidenceSource,evidenceCount:pressure.evidenceCount,rallyIds:pressure.rallyIds,category:'serve_reception' as const,metric:'reception_negative_pct' as const,serveType:pressure.serveTypeRef,zoneRef:pressure.zoneRef,teamSide:'home' as const};
const exercises=buildEvidenceExercises(pressure.title,90,evidenceContext,123);
assert.equal(exercises.length,5);
assert.match(exercises[1].description,/tipo de saque y la zona/);

// Entrenamiento -> Evolución posterior
const target=buildPerformanceTargetFromMatch(source,{metric:'reception_negative_pct',label:'Recepción negativa vs potencia Z5',teamSide:'home',serveType:'jump_spin',zoneRef:5});
assert.equal(target.baselineValue,75);
assert.equal(target.baselineSample,4);
const follow=evaluatePerformanceFollowUp(target,later);
assert.equal(follow.status,'improved');
assert.equal(follow.currentValue,25);
assert.equal(follow.delta,-50);

// Player 360 usa los mismos partidos, sin datos simulados
const profile=buildPlayer360RealProfile(home[1],later,[source]);
assert.equal(profile.history.length,2);
assert.equal(profile.history[0].receptionPosPct,25);
assert.equal(profile.history[1].receptionPosPct,75);

// OPEN AI recibe las mismas métricas/evidencias/historial
const ai=buildOpenAiConversationContext(later,[source]);
assert.equal(ai.current.home.reception.positivePct,75);
assert.equal(ai.history.length,1);
assert.equal(ai.history[0].home.reception.positivePct,25);
assert.ok(ai.players.some(p=>p.number===7));
assert.ok(ai.evidence.length>0);

console.log('OPEN VOLEY end-to-end real match flow: OK');
