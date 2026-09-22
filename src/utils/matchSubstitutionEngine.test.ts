import assert from 'node:assert/strict';
import { applySubstitution } from './matchSubstitutionEngine';
import { MatchData } from '../types';

const match = {
  homeRotation:[3,13,1,7,4,14],
  awayRotation:[8,5,12,4,10,2],
  server:{team:'home',playerNum:3},
} as MatchData;

const p1=applySubstitution(match,'home',3,9);
assert.ok(p1);
assert.deepEqual(p1.rotation,[9,13,1,7,4,14]);
assert.deepEqual(p1.server,{team:'home',playerNum:9});
assert.equal(p1.zone,1);

const p4=applySubstitution(match,'home',7,11);
assert.ok(p4);
assert.deepEqual(p4.rotation,[3,13,1,11,4,14]);
assert.deepEqual(p4.server,{team:'home',playerNum:3});
assert.equal(p4.zone,4);

assert.equal(applySubstitution(match,'home',99,11),null);
assert.equal(applySubstitution(match,'home',7,13),null);

console.log('Match substitution engine tests passed.');
