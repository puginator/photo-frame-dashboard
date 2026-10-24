import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lunchFor } from './lunch.js';

var menu = JSON.parse(readFileSync(new URL('../public/lunch.json', import.meta.url)));
function d(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2], 9); }

// School day: today's entry, next is tomorrow.
var tue = lunchFor(menu, d('2026-10-27'));
assert.match(tue.today.main, /^Cheesy breadsticks/);
assert.equal(tue.next.date.getDate(), 28);
// Saturday: no lunch today, next school day is Monday.
var sat = lunchFor(menu, d('2026-10-24'));
assert.equal(sat.today, null);
assert.equal(sat.next.date.getDate(), 26);
// Past the end of the transcribed month: nothing, no error.
assert.deepEqual(lunchFor(menu, d('2026-10-31')), { today: null, next: null });
// Every entry has a main.
Object.keys(menu).filter(function (k) { return k[0] !== '_'; }).forEach(function (k) { assert.ok(menu[k].main, k); });
console.log('lunch: all checks pass');
