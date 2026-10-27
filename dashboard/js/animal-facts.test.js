import assert from 'node:assert/strict';
import { summaryUrl } from './animal-photo.js';
import facts from './animal-facts.js';
import { pickDaily } from './daily.js';

assert.ok(facts.length >= 120, 'at least 120 facts');
facts.forEach(function (f, i) {
  assert.ok(f.name && f.emoji && f.fact, 'fact ' + i + ' is complete');
  assert.ok(f.fact.length <= 120, 'fact ' + i + ' fits the tile');
});
// Same all day, new at midnight.
assert.equal(pickDaily(facts, new Date(2026, 9, 24, 0, 1)), pickDaily(facts, new Date(2026, 9, 24, 23, 59)));
// Two years of days: never the same animal two days running (across New Year's too), and every fact shows.
var seen = new Set(), prev = null;
for (var i = 0; i < 730; i++) {
  var f = pickDaily(facts, new Date(2026, 0, 1 + i));
  assert.notEqual(f.name, prev && prev.name, 'repeat on day ' + i);
  seen.add(f); prev = f;
}
assert.equal(seen.size, facts.length);
// Photo lookup: the page title is the name, or `wiki` when set.
assert.equal(summaryUrl({ name: 'Sea otter' }), 'https://en.wikipedia.org/api/rest_v1/page/summary/Sea%20otter');
assert.equal(summaryUrl({ name: 'Leafcutter ant', wiki: 'Atta cephalotes' }), 'https://en.wikipedia.org/api/rest_v1/page/summary/Atta%20cephalotes');

console.log('animal facts: all checks pass');
