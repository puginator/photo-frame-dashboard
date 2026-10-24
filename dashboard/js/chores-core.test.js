import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { merge, isDone, choresFor, validEntries, queue, ack, streak } from './chores-core.js';
import { nightOf } from './custody.js';
import { CUSTODY } from './config.js';

// Merge: newer wins, older replay ignored, tombstones behave like any other entry.
var done = { at: 100, by: 'eliza' }, undo = { at: 200, undone: true }, redo = { at: 300, by: 'junia' };
assert.deepEqual(merge({}, { 'eliza:tidy-room': done }), { 'eliza:tidy-room': done });
assert.deepEqual(merge({ 'eliza:tidy-room': undo }, { 'eliza:tidy-room': done }), { 'eliza:tidy-room': undo }); // older done replayed
assert.deepEqual(merge({ 'eliza:tidy-room': done }, { 'eliza:tidy-room': undo }), { 'eliza:tidy-room': undo }); // newer undo
assert.deepEqual(merge({ 'eliza:tidy-room': undo }, { 'eliza:tidy-room': redo }), { 'eliza:tidy-room': redo }); // newer done beats tombstone
assert.deepEqual(merge({ a: done }, { b: undo }), { a: done, b: undo });
assert.equal(isDone({ k: done }, 'k'), true);
assert.equal(isDone({ k: undo }, 'k'), false);
assert.equal(isDone({}, 'k'), false);

// Lanes from the seed list: three chores every night, five on school nights (Sun–Thu).
var list = JSON.parse(readFileSync(new URL('../chores-list.json', import.meta.url)));
var fri = choresFor(list, new Date(2026, 9, 23)), sun = choresFor(list, new Date(2026, 9, 25));
assert.deepEqual(Object.keys(fri).sort(), ['amelia', 'any', 'eliza', 'junia']);
assert.equal(fri.eliza.length, 3);
assert.equal(sun.eliza.length, 5);
assert.equal(sun.amelia[0].key, 'amelia:clear-table');
var withAny = { kids: list.kids, chores: [{ id: 'feed-dog', title: 'Feed dog', emoji: '🐕', who: 'any' }, { id: 'piano', title: 'Piano', emoji: '🎹', who: 'junia' }] };
var lanes = choresFor(withAny, new Date(2026, 9, 23));
assert.equal(lanes.any[0].key, 'any:feed-dog');
assert.deepEqual(lanes.junia.map(function (x) { return x.key; }), ['junia:piano']);
assert.equal(lanes.amelia.length, 0);

// Validation at the Worker boundary.
assert.ok(validEntries({ 'eliza:tidy-room': { at: 1, by: 'eliza' } }));
assert.ok(validEntries({ 'any:feed-dog': { at: 1, undone: true } }));
assert.ok(!validEntries({}));
assert.ok(!validEntries([]));
assert.ok(!validEntries({ 'Eliza:x': { at: 1, by: 'e' } }));
assert.ok(!validEntries({ 'eliza:x': { at: '1', by: 'e' } }));
assert.ok(!validEntries({ 'eliza:x': { at: 1, by: 'e', extra: true } }));
assert.ok(!validEntries({ 'eliza:x': { at: 1, undone: false } }));
// Outbox: queue replaces per key; ack drops only what was sent unchanged.
var ob = queue({}, '2026-10-28', 'eliza:tidy-room', done);
ob = queue(ob, '2026-10-28', 'junia:tidy-room', done);
var sent = ob['2026-10-28'];
ob = queue(ob, '2026-10-28', 'eliza:tidy-room', undo);          // un-checked while the POST was in flight
ob = ack(ob, '2026-10-28', sent);
assert.deepEqual(ob, { '2026-10-28': { 'eliza:tidy-room': undo } }); // the newer change is still queued
assert.deepEqual(ack(ob, '2026-10-28', { 'eliza:tidy-room': undo }), {});
assert.deepEqual(queue({}, 'd', 'k', done), { d: { k: done } });
// Streaks over the real custody schedule. Dad nights around Halloween 2026: Wed 10/28, Thu 10/29,
// Fri 10/30; Mom Sat 10/31 – Tue 11/3; Dad again Wed 11/4 onward.
function atDad(d) { return nightOf(d, CUSTODY) === 'dad'; }
function allDoneFor(kid, y, m, day) {
  var out = {};
  choresFor(list, new Date(y, m - 1, day))[kid].forEach(function (x) { out[x.key] = { at: 1, by: kid }; });
  return { done: out };
}
var H = { '2026-10-28': allDoneFor('eliza', 2026, 10, 28), '2026-10-29': allDoneFor('eliza', 2026, 10, 29), '2026-10-30': allDoneFor('eliza', 2026, 10, 30) };
var wed = new Date(2026, 10, 4, 19);
// Tonight (11/4) in progress: three Dad nights before the Mom stretch still count.
assert.equal(streak('eliza', wed, list, H, {}, atDad), 3);
// Tonight complete: four.
assert.equal(streak('eliza', wed, list, H, allDoneFor('eliza', 2026, 11, 4).done, atDad), 4);
// A missed Dad night (Thu 10/29 only half done) resets what came before it.
var H2 = Object.assign({}, H, { '2026-10-29': { done: { 'eliza:tidy-room': { at: 1, by: 'eliza' } } } });
assert.equal(streak('eliza', wed, list, H2, {}, atDad), 1);
// Another girl with no history: zero, and an un-check (tombstone) doesn't count as done.
assert.equal(streak('junia', wed, list, H, {}, atDad), 0);
var undone = allDoneFor('eliza', 2026, 10, 30); undone.done['eliza:tidy-room'] = { at: 2, undone: true };
assert.equal(streak('eliza', wed, list, Object.assign({}, H, { '2026-10-30': undone }), {}, atDad), 0);
console.log('chores core: all checks pass');
