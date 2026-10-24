// Real family photos from the Worker's /manifest.json (R2, see docs/photos.md) into DATA.photos.
// The bundled demo photos stay until the manifest has at least one photo, and the last good
// manifest is cached so a reboot without Wi-Fi still shows family photos.

// Manifest record -> the photo shape slideshow.js uses. Same-day photos share a tag so portrait
// pairs come from the same outing.
export function toPhoto(r) {
  return { url: r.url, thumb: r.thumb, date: r.date, place: r.place || '', o: r.orientation === 'portrait' ? 'p' : 'l', tag: r.date };
}

// cb(photos) with the cached list, then after each fetch; an empty list means "use the demo photos".
export function loadPhotos(cb) {
  function use(list) { cb((list || []).map(toPhoto)); }
  try { var cached = JSON.parse(localStorage.getItem('photos') || 'null'); if (cached) use(cached); } catch (e) {}
  function refresh() {
    fetch('/manifest.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) { localStorage.setItem('photos', JSON.stringify(list)); use(list); })
      .catch(function () {});
  }
  refresh();
  setInterval(refresh, 3600000); // hourly: new photos show up within the hour
}
