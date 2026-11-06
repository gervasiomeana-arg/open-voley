import assert from 'node:assert/strict';
import { MatchData, ScoutCodeAction } from '../types';

const liberoState = { home: { liberoNum: 20, replacedPlayerNum: 14 } };
const action = {
  rotationHome:[3,13,1,7,4,14],
  rotationAway:[8,5,12,4,10,2],
  servingTeam:'away',
  serverNum:8,
  liberoReplacements:liberoState,
} as ScoutCodeAction;

const current = {
  homeRotation:[13,1,7,4,14,3],
  awayRotation:[8,5,12,4,10,2],
  server:{team:'away',playerNum:8},
  liberoReplacements:{},
} as MatchData;

const restored = {
  ...current,
  homeRotation:[...action.rotationHome],
  awayRotation:[...action.rotationAway],
  server:{team:action.servingTeam!,playerNum:action.serverNum!},
  liberoReplacements:JSON.parse(JSON.stringify(action.liberoReplacements)),
};
assert.deepEqual(restored.homeRotation,[3,13,1,7,4,14]);
assert.deepEqual(restored.liberoReplacements,liberoState);
assert.deepEqual(restored.server,{team:'away',playerNum:8});
console.log('Match state integrity tests passed.');
