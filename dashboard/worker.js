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
