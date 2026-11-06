import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatchData, ScoutCodeAction } from '../types';
import { matchRecordingStatus } from './matchRecording';
import { MatchCenter } from '../components/MatchCenter';
import { OpenAiCenter, countMatchAttacks } from '../components/OpenAiCenter';
import { EliteAnalyticsHub } from '../components/EliteAnalyticsHub';
import { buildOpenAiConversationContext } from './openAiConversationContext';

const action = (id: string, team: 'home' | 'away', evaluation: '#' | '='): ScoutCodeAction => ({
 id, team, evaluation, playerNum: 1, skill: 'A', rawCode: '', timestamp: 0, setNumber: 1,
 scoreHome: 0, scoreAway: 0, rotationHome: [], rotationAway: [], description: '',
});
const match: MatchData = {
 id: 'coach-review', title: 'Registro parcial', competition: 'Prueba', date: '2026-10-16',
 homeTeamName: 'Club Local', awayTeamName: 'Club Rival', currentSet: 1,
 sets: [{setNumber: 1, scoreHome: 25, scoreAway: 15, winner: 'home'}],
 homePlayers: [{id:'h1', number:1, name:'Local Uno', team:'home', position:'OH', starter:true}],
 awayPlayers: [{id:'a1', number:1, name:'Rival Uno', team:'away', position:'OH', starter:true}],
 homeRotation: [], awayRotation: [], server:{team:'home',playerNum:1}, isFinished:true,
 actions:[action('h1','home','#'),action('h2','home','#'),action('a1','away','#'),action('a2','away','#'),action('a3','away','=')],
};
assert.deepEqual(countMatchAttacks(match), {totalAttacks:2,attackPoints:2,attackErrors:0});
assert.deepEqual(countMatchAttacks(match,'away'), {totalAttacks:3,attackPoints:2,attackErrors:1});
assert.equal(matchRecordingStatus(match).definitelyPartial,true);
// A high contact count cannot certify that every rally was recorded.
assert.equal(matchRecordingStatus({...match,actions:Array.from({length:50},(_,i)=>action(String(i),'home','#'))}).definitelyPartial,false);
assert.match(matchRecordingStatus({...match,sets:[]}).message,/no certifican/);
const center=renderToStaticMarkup(React.createElement(MatchCenter,{
 match,onNavigateTo:()=>{},onOpenNewMatch:()=>{},onOpenSavedMatches:()=>{},onSaveMatch:()=>{},
}));
assert.match(center,/Resumen · Club Local/);
assert.match(center,/100%/);
assert.doesNotMatch(center,/80%|INFORME LISTO/);
assert.match(center,/2\/2 ataques/);
assert.match(center,/Registro parcial/);
// Same jersey on each side must not merge scorer attribution.
assert.doesNotMatch(center,/Rival Uno/);
const ai=renderToStaticMarkup(React.createElement(OpenAiCenter,{match}));
assert.match(ai,/Se registraron 2 ataques: 2 terminaron en punto y 0 en error/);
assert.doesNotMatch(ai,/Trabajar definición|Área prioritaria|Crear Sesión de Entrenamiento|Motor FIVB/);
assert.match(ai,/Club Local/);
const ctx=buildOpenAiConversationContext(match,[]);
assert.equal(ctx.recording.definitelyPartial,true);
assert.match(ctx.interpretation,/Separar equipos/);
// Rival actions must not unlock an advanced report for the other side.
const unbalanced={...match, actions:[...Array.from({length:25},(_,i)=>action(`h${i}`,'home','#')),action('a','away','=')]};
const report=renderToStaticMarkup(React.createElement(EliteAnalyticsHub,{match:unbalanced}));
assert.match(report,/Datos insuficientes para abrir este informe/);
assert.match(report,/Club Rival tiene 1 acciones/);
assert.doesNotMatch(report,/Datearte 2.0 Standard|Método Hernán Ferraro/);
console.log('Coach review: team isolation, partial coverage, evidence-only advice and report gating OK');
