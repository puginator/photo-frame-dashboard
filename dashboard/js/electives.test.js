import assert from 'node:assert/strict';
import { electivesFor } from './electives.js';
import { ELECTIVES } from './config.js';

function on(s) { var p = s.split('-'); return electivesFor(ELECTIVES, new Date(+p[0], p[1] - 1, +p[2], 9)).map((e) => e.kids.join('+') + ':' + e.name).join(' '); }

assert.equal(on('2026-10-26'), 'eliza+junia:Music amelia:PE'); // Monday
assert.equal(on('2026-10-27'), 'eliza+junia:PE amelia:PE'); // Tuesday
assert.equal(on('2026-10-28'), 'amelia:STEAM'); // this Wednesday: STEAM, not PE
assert.equal(on('2026-11-04'), 'amelia:PE'); // next Wednesday: PE
assert.equal(on('2026-11-11'), 'amelia:STEAM');
assert.equal(on('2026-10-21'), 'amelia:PE'); // the Wednesday before
assert.equal(on('2026-10-29'), 'eliza+junia:PE amelia:STEAM'); // Thursday
assert.equal(on('2026-10-30'), 'eliza+junia:Library amelia:STEAM'); // Friday
assert.equal(on('2026-10-31'), ''); // Saturday
assert.equal(on('2027-03-17'), 'amelia:STEAM'); // across the DST change: 20 weeks (even) after Oct 28
console.log('electives: all checks pass');
