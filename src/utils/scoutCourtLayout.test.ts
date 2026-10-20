import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatchData, Player } from '../types';
import { playersByRole, defaultScoutPreset, resolveScoutPreset, moveScoutSlot, saveScoutPreset, scoutRotationKey, rotationWithSetterAt, setterPosition } from './scoutCourtLayout';
import { ScoutLayoutEditor } from '../components/ScoutLayoutEditor';
import { saveCurrentMatch, getCurrentMatch } from '../services/teamStorage';
import { setStorageUser } from '../services/userStorage';
import { rotateClockwise } from './matchRotationEngine';
import { CourtRotationView, courtPositionOrder } from '../components/CourtRotationView';
import { CompactScoutPanel } from '../components/CompactScoutPanel';
import { assignSetPosition, MatchPreparationModal } from '../components/MatchPreparationModal';

const roles: Player['position'][] = ['S','OH','MB','OPP','OH','MB','L','L','OH'];
const roster: Player[] = roles.map((position,i)=>({id:`h${i+1}`,number:i+1,name:`Jugador ${i+1}`,position,team:'home',starter:i<6}));
const initial=[1,2,3,4,5,6];
let rotation=[...initial];
for(let i=0;i<6;i++) {
  const before=JSON.stringify({roster,rotation});
  const slots=playersByRole(roster,rotation);
  assert.equal(slots.size,6);
  assert.deepEqual([...slots.values()].map(p=>p.number).sort((a,b)=>a-b),initial);
  assert.equal(slots.get(4)?.position,'OH');
  assert.equal(slots.get(3)?.position,'MB');
  assert.equal(slots.get(6)?.position,'OH');
  assert.equal(slots.get(5)?.position,'MB');
  for(const zone of [4,3,2]) assert.ok([2,3,4].includes(rotation.indexOf(slots.get(zone)!.number)+1));
  for(const zone of [5,6,1]) assert.ok([1,5,6].includes(rotation.indexOf(slots.get(zone)!.number)+1));
  assert.ok(['S','OPP'].includes(slots.get(1)!.position));
  assert.ok(['S','OPP'].includes(slots.get(2)!.position));
  assert.equal(JSON.stringify({roster,rotation}),before,'layout cannot mutate the match');
  rotation=rotateClockwise(rotation);
}
// No conventional 5-1 formation: still expose every rotational player once.
const unusual=roster.map(p=>({...p,position:'OH' as const}));
assert.deepEqual([...playersByRole(unusual,initial).values()].map(p=>p.number).sort((a,b)=>a-b),initial);
assert.equal(playersByRole(roster,[1,2,99,0,7,3]).size,3,'never invent absent players or put a libero in the six');
assert.equal(playersByRole([],[]).size,0);
const match: MatchData={id:'layout-qa',title:'Prueba',competition:'QA',date:'2026-10-20',homeTeamName:'Local',awayTeamName:'Rival',homePlayers:roster,awayPlayers:roster.map(p=>({...p,id:`a${p.number}`,team:'away'})),homeRotation:initial,awayRotation:[...initial],server:{team:'away',playerNum:1},sets:[{setNumber:1,scoreHome:1,scoreAway:3}],currentSet:1,actions:[]};
const before=JSON.stringify(match);
for (const view of ['back','side'] as const) for (const swapped of [false,true]) {
  const html=renderToStaticMarkup(React.createElement(CourtRotationView,{match,activeTeam:'away',selectedPlayer:match.awayPlayers[6],onPlayer:()=>{},view,swapped,layout:'roles'}));
  assert.match(html,/data-court-layout="roles"/);
  assert.equal((html.match(/Seleccionar líbero /g)||[]).length,4,'both liberos on each team always accessible');
  assert.equal((html.match(/bg-lime-300/g)||[]).length,4);
  assert.match(html,/Seleccionar líbero Rival #7" aria-pressed="true"/);
  assert.equal((html.match(/acceso en zona 5/g)||[]).length,2);
  assert.match(html,/Rival P1 #1, Armador/,'service/rotation label refers to actual P1, not selection zone');
  for (const half of [0,1]) {
    const order=courtPositionOrder(view,half);
    const nearNet=view==='back'?(half===0?order.slice(3):order.slice(0,3)):(half===0?[order[1],order[3],order[5]]:[order[0],order[2],order[4]]);
    assert.deepEqual([...nearNet].sort(),[2,3,4]);
  }
}
const rotational=renderToStaticMarkup(React.createElement(CourtRotationView,{match,activeTeam:'home',selectedPlayer:null,onPlayer:()=>{},view:'back',swapped:false}));
assert.match(rotational,/first-outer-baseline/);assert.match(rotational,/second-outer-baseline/);
assert.doesNotMatch(rotational,/acceso en zona 5/);
assert.equal(JSON.stringify(match),before);
const panel=renderToStaticMarkup(React.createElement(CompactScoutPanel,{match,activeTeam:'home',selectedPlayer:null,skill:'A',outcomes:[],onPlayer:()=>{},onSkill:()=>{},onEvaluate:()=>{},onUndo:()=>{},onClose:()=>{},confirmation:null,view:'back',swapped:false,onView:()=>{},onSwap:()=>{},onFormation:()=>{}}));
assert.match(panel,/>Formación<\/button>/);assert.match(panel,/data-court-layout="roles"/);assert.match(panel,/Por función/);assert.match(panel,/Rotación/);
assert.deepEqual(assignSetPosition(initial,0,4),[4,2,3,1,5,6]);assert.deepEqual(initial,[1,2,3,4,5,6]);
const formation=renderToStaticMarkup(React.createElement(MatchPreparationModal,{match,isOpen:true,onClose:()=>{},onSavePreparation:()=>{}}));
assert.match(formation,/z-\[110\]/,'formation dialog must be above fullscreen scout');
assert.equal((formation.match(/<select /g)||[]).length,12,'direct choice for both formations');
assert.match(formation,/Guardar formación/);
console.log('Scout court: all six rotations, mirrored net, role selection, libero accessibility and formation controls OK');

// The coach's P1 receive exception is phase-specific, not a lineup mutation.
assert.equal(playersByRole(roster,initial,true).get(2)?.position,'OH');
assert.equal(playersByRole(roster,initial,true).get(4)?.position,'OPP');
assert.equal(playersByRole(roster,initial,false).get(4)?.position,'OH');
assert.equal(playersByRole(roster,initial,false).get(2)?.position,'OPP');
let configured: MatchData=JSON.parse(JSON.stringify(match));
for(let position=1;position<=6;position++) {
  const six=rotationWithSetterAt(roster,initial,position);
  assert.equal(setterPosition(roster,six),position);
  for(const receiving of [false,true]) {
    const key=scoutRotationKey(roster,six,receiving);
    const standard=defaultScoutPreset(roster,six,receiving);
    const custom=moveScoutSlot(moveScoutSlot(standard,4,2),'libero',6);
    assert.deepEqual([...custom.positions].sort(),[1,2,3,4,5,6]);
    configured=saveScoutPreset(configured,'home',key,custom);
    assert.deepEqual(resolveScoutPreset(configured,'home',six,receiving),custom);
    assert.deepEqual(resolveScoutPreset(configured,'away',six,receiving),defaultScoutPreset(configured.awayPlayers,six,receiving));
  }
}
assert.equal(Object.keys(configured.scoutLayouts!.home!).length,12,'six rotations, separate serve and receive');
assert.deepEqual(configured.actions,match.actions);assert.deepEqual(configured.sets,match.sets);assert.deepEqual(configured.server,match.server);assert.deepEqual(configured.homeRotation,match.homeRotation);
const receiveKey=scoutRotationKey(roster,initial,true);
const restored=saveScoutPreset(configured,'home',receiveKey,null);
assert.deepEqual(resolveScoutPreset(restored,'home',initial,true),defaultScoutPreset(roster,initial,true));
assert.ok(restored.scoutLayouts?.home?.[scoutRotationKey(roster,initial,false)],'reset one phase must preserve the other');
assert.equal(saveScoutPreset(match,'home',receiveKey,{positions:[1,1,3,4,5,6],liberoZone:5}),match);
const malformed={...match,scoutLayouts:{home:{[receiveKey]:{positions:[1,1,3,4,5,6],liberoZone:99}}}};
assert.deepEqual(resolveScoutPreset(malformed,'home',initial,true),defaultScoutPreset(roster,initial,true));
// Replacing a jersey retains the intended slot: presets use rotational positions.
const replacement={...roster[1],id:'sub',number:21};
const substituted={...configured,homePlayers:[...roster.filter(p=>p.id!==roster[1].id),replacement],homeRotation:initial.map(n=>n===2?21:n)};
assert.deepEqual(resolveScoutPreset(substituted,'home'),resolveScoutPreset(configured,'home'));
const edit=renderToStaticMarkup(React.createElement(ScoutLayoutEditor,{match,initialTeam:'home',onClose:()=>{},onSave:()=>{}}));
assert.equal((edit.match(/data-edit-zone=/g)||[]).length,6);assert.match(edit,/Restablecer estándar/);assert.match(edit,/Mover acceso de líberos/);assert.match(edit,/Recibe/);assert.match(edit,/Saca/);
// Round-trip through the existing account-owned current-match persistence.
const values=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)}});
setStorageUser('layout-owner');saveCurrentMatch(configured);
assert.deepEqual(getCurrentMatch()?.scoutLayouts,configured.scoutLayouts);
setStorageUser('another-coach');assert.equal(getCurrentMatch(),null);setStorageUser(null);
console.log('Tactical presets: 12 phase/rotation layouts, P1 receive exception, swaps, libero movement, substitutions and account persistence OK');
