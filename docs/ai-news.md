# AI news

The AI tab shows the day's top AI headlines from Hacker News. No key or signup:
the Worker uses HN's free Algolia API.

## How it works

- `GET /api/news` (behind the frame key) pulls the HN front page plus an
  "artificial intelligence" search over the last 7 days, keeps AI-matching
  stories (`js/ainews.js`), dedupes, ranks by points, and caches the top 12
  in KV (`news:ai`) for an hour.
- If a fetch fails, the Worker serves the last good list rather than an empty tab.
- `js/news-sync.js` swaps stories into `DATA.newsAi` (cached in `localStorage`,
  refreshed hourly). The tab is display-only: title, points, comment count, age.
  HN has no summaries, so there is nothing to expand into yet.

## Limits

- Keyword filter, not a classifier: some AI stories slip through, some
  borderline ones sneak in. Widen `AI_RE` in `js/ainews.js` if the tab is thin.
- Front page usually carries a few AI stories; on slow days the 7-day search
  backfills.
