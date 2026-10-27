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
// Printables: today's topic from the Wonder Desk bucket; print emails the PDF once set up.
{
  const sent = [], store = {};
  const pdf = new Uint8Array([37, 80, 68, 70]).buffer;
  const env = {
    FRAME_KEY: 'k', PRINTER_EMAIL: 'printer@print.test', PRINT_FROM: 'frame@home.test',
    EMAIL: { async send(m) { sent.push(m); return { messageId: 'm' }; } },
    WONDER: {
      async list() { return { objects: [{ key: 'packs/cozy-v1/volcanoes-early.pdf' }, { key: 'packs/cozy-v1/volcanoes-teen.pdf' }] }; },
      async get(k) {
        if (k === 'packs/cozy-v1/volcanoes-teen.pdf') return { arrayBuffer: async () => pdf };
        if (k === 'reading/cozy-v1/volcanoes.json') return { json: async () => ({ early: { title: 'Volcano Friends' } }) };
        return null;
      },
    },
    CHORES: {
      async get(k) { return store[k] ?? null; },
      async put(k, v) { store[k] = v; },
    },
  };
  const call = (path, body) => worker.fetch(new Request('https://x' + path, body ? { method: 'POST', body: JSON.stringify(body), headers: { Cookie: 'k=k' } } : { headers: { Cookie: 'k=k' } }), env);
  assert.deepEqual(await (await call('/api/printables?date=2026-10-26')).json(), { date: '2026-10-26', topic: 'volcanoes', title: 'Volcanoes', ready: true, reading: { early: { title: 'Volcano Friends' } } });
  assert.equal((await call('/api/printables?date=nope')).status, 400);
  const ok = await call('/api/print', { topic: 'volcanoes', band: 'teen' });
  assert.equal(ok.status, 200);
  assert.equal(sent[0].to, 'printer@print.test');
  assert.equal(sent[0].attachments[0].content, pdf);
  assert.equal(sent[0].attachments[0].filename, 'volcanoes-teen.pdf');
  assert.equal((await call('/api/print', { topic: 'volcanoes', band: 'middle' })).status, 404); // no such pack
  assert.equal((await call('/api/print', { topic: '../x', band: 'teen' })).status, 400);
  assert.equal((await call('/api/print', { topic: 'volcanoes', band: 'adult' })).status, 400);
  for (let i = 0; i < 9; i++) await call('/api/print', { topic: 'volcanoes', band: 'teen' });
  assert.equal((await call('/api/print', { topic: 'volcanoes', band: 'teen' })).status, 429); // 10 a day
  assert.equal(sent.length, 10);
  delete env.PRINTER_EMAIL;
  assert.equal((await call('/api/print', { topic: 'volcanoes', band: 'teen' })).status, 503);
}
console.log('worker: all checks pass');
