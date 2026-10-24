# Chores

The Chores page shows tonight's chores for Amelia, Eliza and Junia, only on nights the girls are at
Dad's (from the custody schedule). Each girl has a lane, plus an *Anyone* lane for shared chores.
Stars are just for fun, per night.

## Change the chore list

The list lives in Cloudflare KV, key `chores:list` (namespace bound as `CHORES` to `home-dashboard`).
No deploy needed; the frame picks up changes within an hour.

- From a phone or browser: Cloudflare dashboard → Storage & databases → Workers KV → the `CHORES`
  namespace → `chores:list` → edit the value.
- From the Mac: edit `dashboard/chores-list.json`, then
  `cd dashboard && npx wrangler kv key put chores:list --path chores-list.json --binding CHORES --remote`.
  (The file is also the fallback if the KV key is ever missing, so keep the two in step.)

Each chore: `{ "id", "title", "emoji", "who", "days"?, "stars"? }`

- `id`: lowercase letters, digits and dashes (`tidy-room`). Changing it starts that chore fresh.
- `who`: `"each"` (one per girl), `"any"` (shared; the frame asks who did it), or a girl's id (`"eliza"`).
- `days`: optional; which nights it applies, 0 = Sunday … 6 = Saturday. `[0, 1, 2, 3, 4]` = school nights.
- `emoji`: must be from 2017 or earlier (Emoji 5.0). The frame's Android 8.1 shows newer ones as boxes.

## How it's stored

- `chores:<YYYY-MM-DD>` holds that night's check-offs: `{ "done": { "eliza:tidy-room": { "at", "by" } } }`.
  Un-checking writes `{ "at", "undone": true }`. Entries merge by newest `at`, so syncing late or twice is
  harmless. Day keys expire after 60 days.
- The frame saves each tap locally first and syncs in the background, so taps work with Wi-Fi down
  and survive the kiosk's data being cleared.
- Worker routes (behind the frame key): `GET /api/chores/list`, `GET /api/chores/history`,
  `GET|POST /api/chores/<YYYY-MM-DD>`.
