import assert from 'node:assert/strict';
import { estimateVideoRenderDuration, normalizeVideoRenderClips } from './videoRenderPlan';

const valid = normalizeVideoRenderClips([
  { startSec: -3, endSec: 5 },
  { startSec: 10, endSec: 14.5 },
]);
assert.ok(valid);
assert.deepEqual(valid, [
  { startSec: 0, endSec: 5 },
  { startSec: 10, endSec: 14.5 },
]);
assert.equal(estimateVideoRenderDuration(valid), 9.5);

assert.equal(normalizeVideoRenderClips([]), null);
assert.equal(normalizeVideoRenderClips([{ startSec: 5, endSec: 5 }]), null);
assert.equal(normalizeVideoRenderClips([{ startSec: 9, endSec: 4 }]), null);
assert.equal(normalizeVideoRenderClips([{ startSec: 0, endSec: 121 }]), null);
assert.equal(normalizeVideoRenderClips([{ startSec: 'x', endSec: 2 }]), null);
assert.equal(normalizeVideoRenderClips(Array.from({ length: 501 }, (_, i) => ({ startSec: i, endSec: i + 1 }))), null);

console.log('Video render plan tests: OK');
