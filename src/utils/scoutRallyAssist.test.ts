import assert from 'node:assert/strict';
import { isTerminalScoutAction, nextScoutStep } from './scoutRallyAssist';

assert.deepEqual(nextScoutStep('home','S','+'),{team:'away',skill:'R'});
assert.deepEqual(nextScoutStep('away','R','+'),{team:'away',skill:'E'});
assert.deepEqual(nextScoutStep('home','E','+'),{team:'home',skill:'A'});
assert.deepEqual(nextScoutStep('home','A','+'),{team:'away',skill:'B'});
assert.equal(nextScoutStep('home','S','#'),null);
assert.equal(nextScoutStep('home','A','='),null);
assert.equal(nextScoutStep('home','A','/'),null);
assert.deepEqual(nextScoutStep('home','R','#'),{team:'home',skill:'E'});
assert.deepEqual(nextScoutStep('home','E','#'),{team:'home',skill:'A'});
assert.equal(isTerminalScoutAction('R','#'),false);
assert.equal(isTerminalScoutAction('A','#'),true);
assert.equal(isTerminalScoutAction('S','#'),true);
assert.equal(isTerminalScoutAction('B','#'),true);
assert.equal(isTerminalScoutAction('R','='),true);
console.log('Scout rally assist tests passed.');
