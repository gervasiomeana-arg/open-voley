import assert from 'node:assert/strict';
import { evaluateSetCompletion } from './matchSetEngine';

const completion=evaluateSetCompletion(1,25,20);
assert.equal(completion.isComplete,true);

const priorLibero={home:{liberoNum:20,replacedPlayerNum:14}};
const shouldPrepareNextSet=completion.isComplete;
const nextLibero=shouldPrepareNextSet?{}:priorLibero;
assert.deepEqual(nextLibero,{});

console.log('Set transition integrity tests passed.');
