// Hand-checked from Sat Oct 24, 2026 (a Dad weekend).
import assert from 'node:assert/strict';
import { upcoming, when } from './countdown.js';
import { COUNTDOWNS, CUSTODY } from './config.js';

function d(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2], 9); }
function show(xs) { return xs.map(function (x) { return x.label + ' ' + x.days; }); }

assert.deepEqual(show(upcoming(d('2026-10-24'), COUNTDOWNS, CUSTODY)), ["Weekend at Dad’s 0", 'Eliza turns 9! 6', 'Halloween 7']);
// Sunday: next Dad weekend is Nov 7 (13 days).
assert.deepEqual(show(upcoming(d('2026-10-25'), COUNTDOWNS, CUSTODY)), ['Eliza turns 9! 5', 'Halloween 6', "Weekend at Dad’s 13"]);
// Birthday itself, and the age rolls over the next year.
assert.equal(upcoming(d('2026-10-30'), COUNTDOWNS, null)[0].label, 'Eliza turns 9!');
assert.equal(upcoming(d('2026-10-30'), COUNTDOWNS, null)[0].days, 0);
assert.equal(upcoming(d('2026-10-31'), COUNTDOWNS, null).filter(function (x) { return /Eliza/.test(x.label); })[0], undefined);
assert.match(show(upcoming(d('2027-10-01'), COUNTDOWNS, null))[0], /^Eliza turns 10! 29$/);
// After Thanksgiving it rolls off; yearly dates wrap into next year.
assert.deepEqual(show(upcoming(d('2026-11-27'), COUNTDOWNS, CUSTODY)), ["Weekend at Dad’s 8", 'Christmas 28', "New Year's Day 35"]);
assert.deepEqual(show(upcoming(d('2027-01-02'), COUNTDOWNS, null)), ['Eliza turns 10! 301', 'Halloween 302', 'Christmas 357']); // one-off Thanksgiving 2026 is gone
// Empty config and no custody: nothing, so the tile hides.
assert.deepEqual(upcoming(d('2026-10-24'), [], null), []);
assert.equal(when(0), 'Today'); assert.equal(when(1), 'Tomorrow'); assert.equal(when(5), 'In 5 days');
console.log('countdowns: all checks pass');
