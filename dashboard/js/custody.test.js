// Run: npm test. Hand-checked against Austin's schedule from Oct 23, 2026:
// Dad Sat 24 + Sun 25 (swap), Mom Mon-Tue, Dad Wed-Fri, Mom Sat 31-Tue, Dad Wed-Sat 7, Mom Sun 8-Tue, ...
import assert from 'node:assert/strict';
import { custody, nightOf, nextDadWeekend } from './custody.js';
import { CUSTODY } from './config.js';

function d(s, h) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2], h || 0); }

var expected = {
  '2026-10-23': 'dad', '2026-10-24': 'dad', '2026-10-25': 'dad',
  '2026-10-26': 'mom', '2026-10-27': 'mom',
  '2026-10-28': 'dad', '2026-10-29': 'dad', '2026-10-30': 'dad',
  '2026-10-31': 'mom', '2026-11-01': 'mom', '2026-11-02': 'mom', '2026-11-03': 'mom',
  '2026-11-04': 'dad', '2026-11-05': 'dad', '2026-11-06': 'dad', '2026-11-07': 'dad',
  '2026-11-08': 'mom', '2026-11-09': 'mom', '2026-11-10': 'mom',
  '2026-11-11': 'dad', '2026-11-14': 'mom', '2026-11-21': 'dad',
  '2026-11-26': 'dad' // Thanksgiving exception
};
Object.keys(expected).forEach(function (k) { assert.equal(nightOf(d(k), CUSTODY), expected[k], k); });

// Wednesday handoff by time of day: Mom morning, Dad from the afternoon.
assert.equal(custody(d('2026-10-28', 9), CUSTODY).detail, 'With Mom now. Dad picks you up this afternoon.');
assert.equal(custody(d('2026-10-28', 16), CUSTODY).detail, 'With Dad tomorrow night too.');
// Mom-weekend Saturday: Dad until noon.
assert.equal(custody(d('2026-10-31', 10), CUSTODY).detail, 'With Dad now. Mom picks you up at noon.');
assert.equal(custody(d('2026-10-30', 18), CUSTODY).tomorrow.detail, 'Dad until noon, then Mom');
// Tuesday night: ticket's example copy.
assert.equal(custody(d('2026-10-27', 18), CUSTODY).detail, 'Back with Dad tomorrow afternoon.');
assert.equal(custody(d('2026-10-27', 18), CUSTODY).tomorrow.detail, 'Mom until the afternoon, then Dad');
// Exception note shows on the day and in the preview.
assert.match(custody(d('2026-11-26', 9), CUSTODY).detail, /^Thanksgiving/);
assert.equal(custody(d('2026-11-25', 18), CUSTODY).tomorrow.detail, 'Thanksgiving: split day, Dad at night');

// Next Dad weekend, for countdowns (#7).
assert.equal(nextDadWeekend(d('2026-10-23'), CUSTODY).getDate(), 24);
assert.equal(nextDadWeekend(d('2026-10-25'), CUSTODY).getDate(), 7);
assert.equal(nextDadWeekend(d('2026-11-07'), CUSTODY).getDate(), 7);

// Across the Nov 1 DST change and into next year the alternation holds.
assert.equal(nightOf(d('2027-01-02'), CUSTODY), 'dad');
assert.equal(nightOf(d('2027-01-09'), CUSTODY), 'mom');
console.log('custody: all checks pass');
