// School lunch: today's menu plus the next school day's, from /lunch.json (public/lunch.json).
// Shape: { 'YYYY-MM-DD': { main, alt?, sides?, notes? } }; a missing date means no school lunch.

function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

// { today: entry|null, next: { date, entry }|null }. Looks up to 4 days ahead so Friday shows Monday.
export function lunchFor(menu, now) {
  var next = null;
  for (var i = 1; i <= 4 && !next; i++) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (menu[ymd(d)]) next = { date: d, entry: menu[ymd(d)] };
  }
  return { today: menu[ymd(now)] || null, next: next };
}

// Calls cb(menu) with the cached copy right away, then again after a fresh fetch. A failed fetch
// keeps the last good menu (Wi-Fi drops when the screen sleeps).
export function loadLunch(cb) {
  try { var cached = JSON.parse(localStorage.getItem('lunch') || 'null'); if (cached) cb(cached); } catch (e) {}
  function refresh() {
    fetch('/lunch.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (menu) { localStorage.setItem('lunch', JSON.stringify(menu)); cb(menu); })
      .catch(function () {});
  }
  refresh();
  setInterval(refresh, 6 * 3600000); // ponytail: menus change monthly; 6h is plenty
}
