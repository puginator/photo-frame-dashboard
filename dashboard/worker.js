import { merge, validEntries } from './js/chores-core.js';
import { parseICS } from './js/ical.js';
import SEED_LIST from './chores-list.json' with { type: 'json' };

// Private-by-default gate: the dashboard shows family details (custody, school), so the site 404s
// unless the request carries the frame key. Open https://<host>/?key=<FRAME_KEY> once; the key is
// swapped for a year-long cookie. The kiosk's saved URL includes ?key=, so the frame re-auths on
// every launch even if WebView drops cookies.
// ponytail: one shared secret, swap for Cloudflare Access if more people or devices need entry.
export default {
  async fetch(req, env) {
    const key = env.FRAME_KEY;
    if (!key) return new Response('FRAME_KEY not set', { status: 500 });
    const url = new URL(req.url);
    if (url.searchParams.get('key') === key) {
      url.searchParams.delete('key');
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname + url.search,
          'Set-Cookie': 'k=' + key + '; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax',
        },
      });
    }
    const cookies = (req.headers.get('Cookie') || '').split(/;\s*/);
    if (!cookies.includes('k=' + key)) return new Response('Not found', { status: 404 });
    if (url.pathname === '/manifest.json') return manifest(env);
    if (url.pathname === '/api/events') return events(req, env);
    if (url.pathname.startsWith('/api/chores/')) return chores(req, env, url.pathname.slice('/api/chores/'.length));
    const m = url.pathname.match(/^\/(photo|thumb)\/(.+\.jpg)$/);
    if (m) return photo(env, (m[1] === 'photo' ? 'photos/' : 'thumbs/') + decodeURIComponent(m[2]));
    return env.ASSETS.fetch(req);
  },
};

// Photos live in the private R2 bucket (binding PHOTOS) as photos/<name>.jpg (1280 px long edge) and
// thumbs/<name>.jpg (400 px), both made by scripts/add-photos.sh. The name carries the metadata:
// <YYYY-MM-DD>_<l|p>_<hash>[_<place>], so listing the bucket is the whole database.
export function toRecord(key) {
  const name = key.slice('photos/'.length, -'.jpg'.length);
  const parts = name.split('_');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parts[0]) || !/^[lp]$/.test(parts[1])) return null;
  const file = encodeURIComponent(name) + '.jpg';
  const rec = { url: '/photo/' + file, thumb: '/thumb/' + file, date: parts[0], orientation: parts[1] === 'p' ? 'portrait' : 'landscape' };
  if (parts.length > 3) rec.place = parts.slice(3).join('_');
  return rec;
}

// ponytail: lists the bucket on every request, uncached, so uploads and deletions show on the next
// hourly check. One frame is ~720 list calls a month (free tier: 1M). Cache it if traffic grows.
async function manifest(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.PHOTOS.list({ prefix: 'photos/', cursor });
    page.objects.forEach((o) => { const r = toRecord(o.key); if (r) out.push(r); });
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return Response.json(out, { headers: { 'Cache-Control': 'no-cache' } });
}

async function photo(env, key) {
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  // Names include a content hash, so a given URL never changes.
  return new Response(obj.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable', ETag: obj.httpEtag } });
}

// Family calendar (docs: docs/calendar.md). The Worker fetches the Google secret iCal feed(s),
// expands them into a 7-past/60-future-day window, and caches the JSON in KV for 15 minutes.
// The feed URLs are bearer credentials: wrangler secret put ICAL_URL (comma-separated for more).
const EVENTS_TTL = 900; // 15 minutes; Google rate-limits anonymous .ics fetches
const ICS_MAX_BYTES = 2 * 1024 * 1024;

async function events(req, env) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const cached = await env.CHORES.get('calendar:events', 'json');
  if (cached && Date.now() - cached.fetchedAt < EVENTS_TTL * 1000) {
    return Response.json(cached.events, { headers: noStore });
  }
  const urls = (env.ICAL_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!urls.length) return Response.json(cached ? cached.events : [], { headers: noStore });
  try {
    const parts = await Promise.all(urls.map(async (u) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const r = await fetch(u, { signal: ctrl.signal });
        if (!r.ok) throw new Error('feed ' + r.status);
        const len = +(r.headers.get('content-length') || 0);
        if (len > ICS_MAX_BYTES) throw new Error('feed too large');
        const text = await r.text();
        if (text.length > ICS_MAX_BYTES) throw new Error('feed too large');
        return text;
      } finally {
        clearTimeout(timer);
      }
    }));
    const now = Date.now();
    const merged = [].concat(...parts.map((text) => parseICS(text, now - 7 * 864e5, now + 60 * 864e5)));
    merged.sort((a, b) => (a.start < b.start ? -1 : 1));
    await env.CHORES.put('calendar:events', JSON.stringify({ fetchedAt: now, events: merged }), { expirationTtl: 86400 });
    return Response.json(merged, { headers: noStore });
  } catch (e) {
    // Feed unreachable: serve the last good list (even past TTL) rather than an empty calendar.
    return Response.json(cached ? cached.events : [], { headers: noStore });
  }
}

// Chores (docs: docs/chores.md). The frame is the only writer and POSTs its whole day doc, so the
// read-merge-write here is safe even though KV reads can be ~60 s stale; the per-entry merge makes
// retries and replays harmless.
// ponytail: KV has no transactions; move day docs to a Durable Object if a second writer appears.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const KEEP = 60 * 86400; // day docs expire after 60 days (streaks look back that far)
const noStore = { 'Cache-Control': 'no-store' };

async function chores(req, env, rest) {
  if (rest === 'list' && req.method === 'GET') {
    return Response.json((await env.CHORES.get('chores:list', 'json')) || SEED_LIST, { headers: noStore });
  }
  if (rest === 'history' && req.method === 'GET') {
    const keys = (await env.CHORES.list({ prefix: 'chores:2' })).keys.map((k) => k.name).sort().slice(-KEEP / 86400);
    const docs = await Promise.all(keys.map((k) => env.CHORES.get(k, 'json')));
    const out = {};
    keys.forEach((k, i) => { out[k.slice('chores:'.length)] = docs[i]; });
    return Response.json(out, { headers: noStore });
  }
  if (!DAY.test(rest)) return new Response('Not found', { status: 404 });
  const key = 'chores:' + rest;
  if (req.method === 'GET') return Response.json((await env.CHORES.get(key, 'json')) || { done: {} }, { headers: noStore });
  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch (e) { return new Response('Bad JSON', { status: 400 }); }
    if (!validEntries(body && body.entries)) return new Response('Bad entries', { status: 400 });
    const doc = (await env.CHORES.get(key, 'json')) || { done: {} };
    doc.done = merge(doc.done, body.entries);
    await env.CHORES.put(key, JSON.stringify(doc), { expirationTtl: KEEP });
    return Response.json(doc, { headers: noStore });
  }
  return new Response('Method not allowed', { status: 405 });
}
