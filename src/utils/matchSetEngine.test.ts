import assert from 'node:assert/strict';
import { evaluateSetCompletion, matchWinnerFromSets } from './matchSetEngine';

assert.deepEqual(evaluateSetCompletion(1,25,20),{isComplete:true,winner:'home'});
assert.deepEqual(evaluateSetCompletion(1,24,23),{isComplete:false});
assert.deepEqual(evaluateSetCompletion(1,26,24),{isComplete:true,winner:'home'});
assert.deepEqual(evaluateSetCompletion(5,15,13),{isComplete:true,winner:'home'});
assert.deepEqual(evaluateSetCompletion(5,14,14),{isComplete:false});
assert.equal(matchWinnerFromSets([
 {setNumber:1,scoreHome:25,scoreAway:20,winner:'home'},
 {setNumber:2,scoreHome:20,scoreAway:25,winner:'away'},
 {setNumber:3,scoreHome:25,scoreAway:18,winner:'home'},
 {setNumber:4,scoreHome:25,scoreAway:22,winner:'home'},
]),'home');
console.log('Match set engine tests passed.');
