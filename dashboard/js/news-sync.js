// AI headlines: Worker's /api/news (Hacker News via Algolia, see docs/ai-news.md).
// Display-only: title + points + comments + age. Cached list, hourly refresh.
export function loadNews(D, cb) {
  function use(list) { cb(Array.isArray(list) ? list : []); }
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('aiNews') || 'null'); } catch (e) {}
  if (cached && cached.length) use(cached);
  function refresh() {
    fetch('/api/news', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return; // keep cached/empty state
        try { localStorage.setItem('aiNews', JSON.stringify(list)); } catch (e) {}
        use(list);
      })
      .catch(() => {});
  }
  refresh();
  setInterval(refresh, 3600000); // hourly: fresh headlines within the hour
}
