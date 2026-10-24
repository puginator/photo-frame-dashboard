import assert from 'node:assert/strict';
import { tally, addVote, label } from './votes.js';

var s = null;
assert.deepEqual(tally(s, '2026-10-24'), { a: 0, b: 0 });
assert.equal(label(tally(s, '2026-10-24'), 'a'), 'Tap to vote');
s = addVote(s, '2026-10-24', 'a');
s = addVote(s, '2026-10-24', 'a');
s = addVote(s, '2026-10-24', 'b');
assert.deepEqual(tally(s, '2026-10-24'), { a: 2, b: 1 });
assert.equal(label(tally(s, '2026-10-24'), 'a'), '2 votes · 67%');
assert.equal(label(tally(s, '2026-10-24'), 'b'), '1 vote · 33%');
// A new day starts over.
assert.deepEqual(tally(s, '2026-10-25'), { a: 0, b: 0 });
assert.deepEqual(addVote(s, '2026-10-25', 'b'), { day: '2026-10-25', a: 0, b: 1 });
console.log('votes: all checks pass');
