import assert from 'node:assert/strict';
import { toStory, pickStories } from './ainews.js';

assert.equal(toStory(null), null);
assert.equal(toStory({ title: 'No id' }), null);

const s = toStory({ objectID: '1', title: 'Hello', url: 'https://www.example.com/x', points: 5, num_comments: 3, created_at_i: 1000 });
assert.deepEqual(s, { id: '1', title: 'Hello', url: 'https://www.example.com/x', points: 5, comments: 3, at: 1000000, host: 'example.com' });

// Ask-HN without URL falls back to the discussion link
const ask = toStory({ objectID: '2', title: 'Ask HN: AI editors?', points: 9, num_comments: 12, created_at_i: 2000 });
assert.equal(ask.url, 'https://news.ycombinator.com/item?id=2');
assert.equal(ask.host, '');

const hits = [
  { objectID: '1', title: 'Show HN: my sourdough starter', points: 400, num_comments: 90, created_at_i: 1000 },
  { objectID: '2', title: 'Claude can now do my taxes', points: 250, num_comments: 180, created_at_i: 1000 },
  { objectID: '2', title: 'Claude can now do my taxes', points: 250, num_comments: 180, created_at_i: 1000 },
  { objectID: '3', title: 'LLM inference on a toaster', points: 90, num_comments: 20, created_at_i: 1000 },
  { objectID: '4', title: 'Anthropic raises prices', points: 310, num_comments: 200, created_at_i: 1000 },
];
const picked = pickStories(hits, 10);
assert.deepEqual(picked.map((p) => p.id), ['4', '2', '3']); // AI only, deduped, by points

console.log('ainews: all checks pass');
