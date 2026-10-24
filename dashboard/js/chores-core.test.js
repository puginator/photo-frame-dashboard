import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { merge, isDone, choresFor, validEntries } from './chores-core.js';

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
console.log('chores core: all checks pass');
