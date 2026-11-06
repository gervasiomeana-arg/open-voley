import assert from 'node:assert/strict';
import { MatchData, MatchSet, Player, TeamSide } from '../types';
import { applyRallyWinner } from './matchRotationEngine';
import { applySubstitution } from './matchSubstitutionEngine';
import { applyLiberoReplacement, normalizeLiberoReplacements, physicalPlayerNumber } from './liberoEngine';
import { evaluateSetCompletion, matchWinnerFromSets } from './matchSetEngine';

const homePlayers:Player[]=[
  {id:'h1',number:1,name:'H1',position:'S',team:'home',starter:true},
  {id:'h2',number:2,name:'H2',position:'OH',team:'home',starter:true},
  {id:'h3',number:3,name:'H3',position:'MB',team:'home',starter:true},
  {id:'h4',number:4,name:'H4',position:'OPP',team:'home',starter:true},
  {id:'h5',number:5,name:'H5',position:'OH',team:'home',starter:true},
  {id:'h6',number:6,name:'H6',position:'MB',team:'home',starter:true},
  {id:'h9',number:9,name:'H9',position:'OH',team:'home',starter:false},
  {id:'h20',number:20,name:'HL',position:'L',team:'home',starter:false},
];
const awayPlayers:Player[]=[
  {id:'a11',number:11,name:'A11',position:'S',team:'away',starter:true},
  {id:'a12',number:12,name:'A12',position:'OH',team:'away',starter:true},
  {id:'a13',number:13,name:'A13',position:'MB',team:'away',starter:true},
  {id:'a14',number:14,name:'A14',position:'OPP',team:'away',starter:true},
  {id:'a15',number:15,name:'A15',position:'OH',team:'away',starter:true},
  {id:'a16',number:16,name:'A16',position:'MB',team:'away',starter:true},
  {id:'a19',number:19,name:'A19',position:'OH',team:'away',starter:false},
  {id:'a30',number:30,name:'AL',position:'L',team:'away',starter:false},
];

let match:MatchData={
  id:'sim',title:'Home vs Away',date:'2026-09-22',competition:'Test',
  homeTeamName:'Home',awayTeamName:'Away',currentSet:1,
  sets:[{setNumber:1,scoreHome:0,scoreAway:0}],
  homePlayers,awayPlayers,actions:[],
  homeRotation:[1,2,3,4,5,6],
  awayRotation:[11,12,13,14,15,16],
  server:{team:'home',playerNum:1},
  isPrepared:true,status:'in_progress'
};

function winRally(winner:TeamSide){
  const state=applyRallyWinner({
    homeRotation:match.homeRotation,
    awayRotation:match.awayRotation,
    server:match.server,
  },winner);
  match={...match,homeRotation:state.homeRotation,awayRotation:state.awayRotation,server:state.server};
  match={...match,liberoReplacements:normalizeLiberoReplacements(match)};
}

function closeSet(home:number,away:number){
  const idx=match.currentSet-1;
  const sets=[...match.sets];
  const result=evaluateSetCompletion(match.currentSet,home,away);
  assert.equal(result.isComplete,true);
  sets[idx]={setNumber:match.currentSet,scoreHome:home,scoreAway:away,winner:result.winner};
  const winner=matchWinnerFromSets(sets);
  if(winner){
    match={...match,sets,winner,isFinished:true,status:'finished',liberoReplacements:{}};
    return;
  }
  const nextSet=match.currentSet+1;
  sets.push({setNumber:nextSet,scoreHome:0,scoreAway:0});
  match={...match,sets,currentSet:nextSet,isPrepared:false,status:'prepared',liberoReplacements:{}};
}

// Set 1: serving team scores -> no rotation.
winRally('home');
assert.deepEqual(match.homeRotation,[1,2,3,4,5,6]);
assert.deepEqual(match.server,{team:'home',playerNum:1});

// Away side-out -> rotates once and gets service.
winRally('away');
assert.deepEqual(match.awayRotation,[12,13,14,15,16,11]);
assert.deepEqual(match.server,{team:'away',playerNum:12});

// Home side-out -> rotates and gets service.
winRally('home');
assert.deepEqual(match.homeRotation,[2,3,4,5,6,1]);
assert.deepEqual(match.server,{team:'home',playerNum:2});

// Normal substitution in P4, same rotational slot.
const sub=applySubstitution(match,'home',5,9);
assert.ok(sub);
match={...match,homeRotation:sub.rotation,server:sub.server};
assert.deepEqual(match.homeRotation,[2,3,4,9,6,1]);

// Libero replaces back-row #1 in P6.
const libero=applyLiberoReplacement(match,'home',20,1);
assert.ok(libero);
match={...match,liberoReplacements:libero};
assert.equal(physicalPlayerNumber(match,'home',1),20);

// Home keeps serving: libero remains.
winRally('home');
assert.ok(match.liberoReplacements?.home);

// Away side-out rotates away only; home libero state still valid.
winRally('away');
assert.ok(match.liberoReplacements?.home);

// Home later rotates on side-out: #1 moves from P6 to P5, still legal.
winRally('home');
assert.ok(match.liberoReplacements?.home);

// Another full home rotation event: #1 will eventually reach front row and libero must exit.
winRally('away');
winRally('home');
winRally('away');
winRally('home');
assert.equal(match.liberoReplacements?.home,undefined);

// Set transitions clear libero and require preparation.
closeSet(25,23);
assert.equal(match.currentSet,2);
assert.equal(match.isPrepared,false);
assert.deepEqual(match.liberoReplacements,{});

// Prepare set 2 with a new legal lineup.
match={...match,homeRotation:[9,3,4,5,6,1],awayRotation:[12,13,14,15,16,11],server:{team:'away',playerNum:12},isPrepared:true,status:'in_progress'};
closeSet(20,25);
assert.equal(match.currentSet,3);

match={...match,homeRotation:[1,2,3,4,5,6],awayRotation:[11,12,13,14,15,16],server:{team:'home',playerNum:1},isPrepared:true,status:'in_progress'};
closeSet(25,18);
assert.equal(match.currentSet,4);

match={...match,homeRotation:[1,2,3,4,5,6],awayRotation:[11,12,13,14,15,16],server:{team:'away',playerNum:11},isPrepared:true,status:'in_progress'};
closeSet(22,25);
assert.equal(match.currentSet,5);

// Fifth set uses 15 target.
assert.deepEqual(evaluateSetCompletion(5,14,14),{isComplete:false});
assert.deepEqual(evaluateSetCompletion(5,16,14),{isComplete:true,winner:'home'});
match={...match,homeRotation:[1,2,3,4,5,6],awayRotation:[11,12,13,14,15,16],server:{team:'home',playerNum:1},isPrepared:true,status:'in_progress'};
closeSet(16,14);
assert.equal(match.winner,'home');
assert.equal(match.isFinished,true);
assert.equal(matchWinnerFromSets(match.sets),'home');

console.log('Real match simulation V1 passed: rotations, substitutions, libero, set transitions and fifth set are coherent.');
