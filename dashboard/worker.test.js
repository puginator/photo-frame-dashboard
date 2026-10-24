import assert from 'node:assert/strict';
import worker, { toRecord } from './worker.js';

assert.deepEqual(toRecord('photos/2024-05-19_p_a1b2c3d4_Banff, AB.jpg'), {
  url: '/photo/2024-05-19_p_a1b2c3d4_Banff%2C%20AB.jpg', thumb: '/thumb/2024-05-19_p_a1b2c3d4_Banff%2C%20AB.jpg',
  date: '2024-05-19', orientation: 'portrait', place: 'Banff, AB'
});
assert.equal(toRecord('photos/2023-07-02_l_0f0f0f0f.jpg').place, undefined);
assert.equal(toRecord('photos/2023-07-02_l_0f0f0f0f.jpg').orientation, 'landscape');
assert.equal(toRecord('photos/2023-07-02_l_0f0f0f0f_Lake_Padden.jpg').place, 'Lake_Padden'); // underscores in a place survive
assert.equal(toRecord('photos/IMG_1234.jpg'), null); // a stray upload without the naming convention is skipped
// /api/events with no ICAL_URL set: empty list, demo data stays on the frame.
{
  const store = {};
  const env = {
    FRAME_KEY: 'k',
    CHORES: {
      async get(k, type) { return type === 'json' ? (store[k] ?? null) : null; },
      async put(k, v) { store[k] = JSON.parse(v); },
    },
  };
  const req = new Request('https://x/api/events', { headers: { Cookie: 'k=k' } });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
}
// /api/events serves the KV cache untouched when fresh.
{
  const fresh = { fetchedAt: Date.now(), events: [{ uid: 'a', title: 'Gym', start: '2026-10-20T16:00:00.000Z', end: '2026-10-20T17:00:00.000Z', allDay: false, loc: '' }] };
  const env = {
    FRAME_KEY: 'k',
    CHORES: { async get() { return fresh; }, async put() { throw new Error('should not refetch'); } },
  };
  const req = new Request('https://x/api/events', { headers: { Cookie: 'k=k' } });
  const res = await worker.fetch(req, env);
  assert.deepEqual(await res.json(), fresh.events);
}
// /api/news serves the KV cache untouched when fresh (no network in tests).
{
  const fresh = { fetchedAt: Date.now(), stories: [{ id: '1', title: 'LLMs everywhere', url: 'https://x.test', points: 10, comments: 2, at: Date.now(), host: 'x.test' }] };
  const env = {
    FRAME_KEY: 'k',
    CHORES: { async get() { return fresh; }, async put() { throw new Error('should not refetch'); } },
  };
  const req = new Request('https://x/api/news', { headers: { Cookie: 'k=k' } });
  const res = await worker.fetch(req, env);
  assert.deepEqual(await res.json(), fresh.stories);
}
// /api/news with stale cache and unreachable network serves the stale list.
{
  const stale = { fetchedAt: Date.now() - 7200 * 1000, stories: [{ id: '2', title: 'Old AI news', url: 'https://x.test', points: 4, comments: 1, at: 1, host: '' }] };
  const env = {
    FRAME_KEY: 'k',
    CHORES: { async get() { return stale; }, async put() {} },
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error('offline'));
  try {
    const req = new Request('https://x/api/news', { headers: { Cookie: 'k=k' } });
    const res = await worker.fetch(req, env);
    assert.deepEqual(await res.json(), stale.stories);
  } finally {
    globalThis.fetch = realFetch;
  }
}
console.log('worker: all checks pass');
