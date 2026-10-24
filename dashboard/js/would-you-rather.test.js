import assert from 'node:assert/strict';
import WYR from './would-you-rather.js';
import { wyrOfDay } from './daily.js';

function d(y, m, day, h) { return new Date(y, m - 1, day, h || 9); }

assert.equal(WYR.all.length, 52);
// Holiday questions land on their real date in leap and non-leap years (the app's slots are leap-year).
assert.match(wyrOfDay(WYR, d(2026, 10, 31))[0], /^Trick-or-treat/);
assert.match(wyrOfDay(WYR, d(2028, 10, 31))[0], /^Trick-or-treat/);
assert.match(wyrOfDay(WYR, d(2026, 12, 25))[0], /holiday tree/);
assert.match(wyrOfDay(WYR, d(2027, 2, 14))[0], /heart box/);
assert.match(wyrOfDay(WYR, d(2026, 12, 31))[0], /Times Square/);
// Stable all day; other days rotate so the next day differs.
assert.deepEqual(wyrOfDay(WYR, d(2026, 10, 24, 0)), wyrOfDay(WYR, d(2026, 10, 24, 23)));
for (var i = 0; i < 3 * 366; i++) { // 2026-2028, through a leap year
  assert.notDeepEqual(wyrOfDay(WYR, d(2026, 1, 1 + i)), wyrOfDay(WYR, d(2026, 1, 2 + i)), 'repeat after day ' + i);
}
WYR.all.forEach(function (q, i) { assert.ok(q[0] && q[1] && q[0].length <= 110 && q[1].length <= 110, 'question ' + i); });
console.log('would you rather: all checks pass');
