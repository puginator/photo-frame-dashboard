// Live family calendar: replaces the demo events in DATA with the Worker's /api/events
// (Google secret iCal feed, see docs/calendar.md). Same pattern as photos.js: cached list
// first, hourly refresh, demo data stays until the first successful fetch.
export function toEvent(r, i, all) {
  return {
    id: 'live' + i,
    start: new Date(r.start), end: new Date(r.end),
    title: r.title, people: all, live: true,
    allDay: r.allDay || undefined, loc: r.loc || undefined,
  };
}

export function loadLiveEvents(D, cb) {
  function use(list) { cb((list || []).map((r, i) => toEvent(r, i, D.ALL))); }
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('liveEvents') || 'null'); } catch (e) {}
  if (cached && cached.length) use(cached);
  function refresh() {
    fetch('/api/events', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return; // feed unset or empty: keep demo/cached
        try { localStorage.setItem('liveEvents', JSON.stringify(list)); } catch (e) {}
        use(list);
      })
      .catch(() => {});
  }
  refresh();
  setInterval(refresh, 3600000); // hourly: new events show up within the hour
}
