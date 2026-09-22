import assert from 'node:assert/strict';
import { TeamSide, VolleySkill, EvaluationSymbol } from '../types';
import { applyRallyWinner, pointWinnerFromAction } from './matchRotationEngine';
import { isTerminalScoutAction, nextScoutStep } from './scoutRallyAssist';

type RallyState = {
  homeRotation:number[];
  awayRotation:number[];
  server:{team:TeamSide;playerNum:number};
  scoreHome:number;
  scoreAway:number;
};

let state:RallyState={
  homeRotation:[1,2,3,4,5,6],
  awayRotation:[11,12,13,14,15,16],
  server:{team:'home',playerNum:1},
  scoreHome:0,
  scoreAway:0,
};

function record(team:TeamSide, skill:VolleySkill, evaluation:EvaluationSymbol){
  const winner=pointWinnerFromAction(team,skill,evaluation);
  if(winner){
    state = {
      ...state,
      scoreHome: state.scoreHome + (winner==='home'?1:0),
      scoreAway: state.scoreAway + (winner==='away'?1:0),
      ...applyRallyWinner({
        homeRotation:state.homeRotation,
        awayRotation:state.awayRotation,
        server:state.server,
      },winner),
    };
  }
  return {winner,next:nextScoutStep(team,skill,evaluation),terminal:isTerminalScoutAction(skill,evaluation)};
}

// Rally 1: Home serves, away receives perfectly, sets perfectly, attacks for point.
// Only the attack may change score.
assert.deepEqual(record('home','S','+'),{
  winner:null,next:{team:'away',skill:'R'},terminal:false
});
assert.deepEqual(record('away','R','#'),{
  winner:null,next:{team:'away',skill:'E'},terminal:false
});
assert.deepEqual(record('away','E','#'),{
  winner:null,next:{team:'away',skill:'A'},terminal:false
});
const attackPoint=record('away','A','#');
assert.equal(attackPoint.winner,'away');
assert.equal(attackPoint.terminal,true);
assert.equal(attackPoint.next,null);
assert.equal(state.scoreHome,0);
assert.equal(state.scoreAway,1);
assert.deepEqual(state.awayRotation,[12,13,14,15,16,11]);
assert.deepEqual(state.server,{team:'away',playerNum:12});

// Rally 2: Away serving ace. Serving team scores, so no rotation.
const serveAce=record('away','S','#');
assert.equal(serveAce.winner,'away');
assert.equal(state.scoreAway,2);
assert.deepEqual(state.awayRotation,[12,13,14,15,16,11]);
assert.deepEqual(state.server,{team:'away',playerNum:12});

// Rally 3: Away service error gives home side-out; home rotates once.
const serveError=record('away','S','=');
assert.equal(serveError.winner,'home');
assert.equal(state.scoreHome,1);
assert.deepEqual(state.homeRotation,[2,3,4,5,6,1]);
assert.deepEqual(state.server,{team:'home',playerNum:2});

// Rally 4: Home attack is blocked terminally; point to away, side-out rotates away.
const blocked=record('home','A','/');
assert.equal(blocked.winner,'away');
assert.equal(state.scoreAway,3);
assert.deepEqual(state.awayRotation,[13,14,15,16,11,12]);
assert.deepEqual(state.server,{team:'away',playerNum:13});

// Rally 5: Reception slash is not terminal in our vocabulary.
const receptionSlash=record('home','R','/');
assert.equal(receptionSlash.winner,null);
assert.equal(receptionSlash.terminal,false);
assert.equal(state.scoreHome,1);
assert.equal(state.scoreAway,3);

// Block point is terminal for the blocking team.
const blockPoint=record('home','B','#');
assert.equal(blockPoint.winner,'home');
assert.equal(state.scoreHome,2);
assert.deepEqual(state.homeRotation,[3,4,5,6,1,2]);
assert.deepEqual(state.server,{team:'home',playerNum:3});

console.log('Rally Simulation V2 passed: skill semantics, score, rotation, service and next-step flow are coherent.');
