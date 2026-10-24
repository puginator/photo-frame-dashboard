# Hosting

The dashboard runs on Cloudflare Workers as static assets (`dashboard/wrangler.jsonc`, worker `home-dashboard`).

Live URL: https://home-dashboard.austincodez.workers.dev/

## Access

The site is private: `dashboard/worker.js` returns 404 unless the request has the frame key. Open
`https://home-dashboard.austincodez.workers.dev/?key=<FRAME_KEY>` once in a browser; the key is swapped
for a year-long cookie. The key is the worker secret `FRAME_KEY`; Austin's copy is in
`~/.config/home-dashboard/frame-key` (never commit it).

To change the key (this logs out every browser and the frame):

```sh
openssl rand -hex 24 > ~/.config/home-dashboard/frame-key
npx wrangler secret put FRAME_KEY < ~/.config/home-dashboard/frame-key   # from dashboard/
```

then repoint the frame (below).

## Deploy

```sh
cd dashboard
npm install        # first time only
npm run deploy     # vite build && wrangler deploy
```

Needs `npx wrangler login` once on the machine. The frame picks up a new deploy on its next page load; `index.html` reloads itself if the bundle fails to load.

## Roll back

```sh
cd dashboard
npx wrangler versions list      # find the previous version ID
npx wrangler rollback <version-id>
```

## Point the frame at it

From the repo root, with the frame on USB (or `ADB_SERIAL=<frame-ip>:5555` over Wi-Fi):

```sh
scripts/set-kiosk-url.sh "https://home-dashboard.austincodez.workers.dev/?key=$(cat ~/.config/home-dashboard/frame-key)"
scripts/set-kiosk-url.sh          # prints the saved URL
```

The Home HQ kiosk saves the URL and uses it at every launch, including after a reboot. Because the saved URL carries the key, the frame gets back in even if WebView loses its cookie.
