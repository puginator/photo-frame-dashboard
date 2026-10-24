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
    return env.ASSETS.fetch(req);
  },
};
