# Family calendar

The Calendar tab and the home screen show your real Google Calendar once the secret feed is
linked. Until then (or if the feed goes empty), the frame keeps showing the demo events.

## Link the feed (once)

On the web, at calendar.google.com:

1. Hover the family calendar → ⋮ → **Settings**.
2. Under **Integrate calendar**, copy the **Secret address in iCal format**.
3. Store it on the Worker (from `dashboard/`):
   ```sh
   npx wrangler secret put ICAL_URL
   ```
   Paste the URL when asked. For a second calendar, store both comma-separated.

No deploy needed for this step: secrets apply immediately. New events show on the frame
within ~15 minutes (the Worker caches the feed that long), sooner on reload.

## How it works

- `GET /api/events` (behind the frame key) fetches the feed(s), expands repeats into a
  window of the past 7 days / next 60 days, and caches the JSON in KV (`calendar:events`).
- Parsing lives in `js/ical.js`: timed and all-day events, `America/Los_Angeles` floating
  times, `DAILY`/`WEEKLY` repeats with `INTERVAL`/`COUNT`/`UNTIL`/`BYDAY`, `EXDATE`.
  Cancelled events, per-occurrence edits (`RECURRENCE-ID`) and non-LA time zones are skipped.
- If a fetch fails, the Worker serves the last good list instead of an empty calendar.
- `js/calendar-sync.js` swaps the live events into `DATA.events` (cached in `localStorage`,
  refreshed hourly). Synced events appear for the whole family — the feed has no per-girl
  mapping yet.

## Remove it

```sh
npx wrangler secret delete ICAL_URL
```

The frame falls back to demo events within the hour (clear the `liveEvents` site data to
see them immediately).
