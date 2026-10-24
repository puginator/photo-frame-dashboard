// Hand-checked from Sat Oct 24, 2026 (a Dad weekend). While the girls are at Dad's the custody
// countdown is 'Back to Mom's'; at Mom's it is the next weekend at Dad's.
import assert from 'node:assert/strict';
import { upcoming, when } from './countdown.js';
import { COUNTDOWNS, CUSTODY } from './config.js';

function at(s, h) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2], h); }
function d(s) { return at(s, 9); }
function show(xs) { return xs.map(function (x) { return x.label + ' ' + x.days; }); }

// At Dad's Sat and Sun (swap), back to Mom's Monday.
assert.deepEqual(show(upcoming(d('2026-10-24'), COUNTDOWNS, CUSTODY)), ["Back to Mom’s 2", 'Eliza turns 9! 6', 'Halloween 7']);
assert.deepEqual(show(upcoming(d('2026-10-25'), COUNTDOWNS, CUSTODY)), ["Back to Mom’s 1", 'Eliza turns 9! 5', 'Halloween 6']);
// Monday: with Dad until the 8 AM handoff, then at Mom's, so the next Dad weekend (Nov 7).
assert.equal(show(upcoming(at('2026-10-26', 7), COUNTDOWNS, CUSTODY))[0], "Back to Mom’s 0");
assert.deepEqual(show(upcoming(at('2026-10-26', 9), COUNTDOWNS, CUSTODY)), ['Eliza turns 9! 4', 'Halloween 5', "Weekend at Dad’s 12"]);
// Mom-weekend Saturday: Dad until noon.
assert.deepEqual(show(upcoming(at('2026-10-31', 10), COUNTDOWNS, CUSTODY)).slice(0, 2), ['Halloween 0', "Back to Mom’s 0"]); // ties keep config order
assert.match(show(upcoming(at('2026-10-31', 13), COUNTDOWNS, CUSTODY)).join('|'), /Weekend at Dad’s 7/);
// Birthday itself, and the age rolls over the next year.
assert.equal(upcoming(d('2026-10-30'), COUNTDOWNS, null)[0].label, 'Eliza turns 9!');
assert.equal(upcoming(d('2026-10-30'), COUNTDOWNS, null)[0].days, 0);
assert.match(show(upcoming(d('2027-10-01'), COUNTDOWNS, null))[0], /^Eliza turns 10! 29$/);
// After Thanksgiving it rolls off; yearly dates wrap into next year. Fri Nov 27 at Dad's, Mom's Sat.
assert.deepEqual(show(upcoming(d('2026-11-27'), COUNTDOWNS, CUSTODY)), ["Back to Mom’s 1", 'Christmas 28', "New Year's Day 35"]);
assert.deepEqual(show(upcoming(d('2027-01-02'), COUNTDOWNS, null)), ['Eliza turns 10! 301', 'Halloween 302', 'Christmas 357']); // one-off Thanksgiving 2026 is gone
// Empty config and no custody: nothing, so the tile hides.
assert.deepEqual(upcoming(d('2026-10-24'), [], null), []);
assert.equal(when(0), 'Today'); assert.equal(when(1), 'Tomorrow'); assert.equal(when(5), 'In 5 days');
console.log('countdowns: all checks pass');
