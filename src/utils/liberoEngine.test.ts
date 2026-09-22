import assert from 'node:assert/strict';
import { applyLiberoReplacement, canLiberoReplace, normalizeLiberoReplacements, physicalPlayerNumber } from './liberoEngine';
import { MatchData } from '../types';

const match={
 homeRotation:[3,13,1,7,4,14],
 awayRotation:[8,5,12,4,10,2],
 server:{team:'away',playerNum:8},
 homePlayers:[
  {id:'3',number:3,name:'MB',position:'MB',team:'home',starter:true},
  {id:'20',number:20,name:'Libero',position:'L',team:'home',starter:false},
 ],
 awayPlayers:[],
} as MatchData;

assert.equal(canLiberoReplace(match,'home',3),true); // P1 but receiving
assert.equal(canLiberoReplace(match,'home',14),true); // P6
assert.equal(canLiberoReplace(match,'home',7),false); // P4
const repl=applyLiberoReplacement(match,'home',20,14);
assert.ok(repl);
const active={...match,liberoReplacements:repl};
assert.equal(physicalPlayerNumber(active,'home',14),20);

const rotated={...active,homeRotation:[13,1,7,4,14,3]}; // replaced #14 is now P5, remains legal
assert.ok(normalizeLiberoReplacements(rotated)?.home);
const front={...active,homeRotation:[13,1,14,7,4,3]}; // #14 P3
assert.equal(normalizeLiberoReplacements(front)?.home,undefined);

console.log('Libero engine tests passed.');
