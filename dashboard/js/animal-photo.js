// Photo for the animal fact tile: the lead image of the animal's Wikipedia page, via the free
// page-summary API (no key, CORS open). Cached per animal in localStorage, so each photo is looked up
// once; offline or no photo = the emoji stays.
export function summaryUrl(a) {
  return 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(a.wiki || a.name);
}

// Calls cb(url) with the cached photo right away, or after the lookup. Never calls back without one.
export function animalPhoto(a, cb) {
  var key = 'animalPhoto:' + (a.wiki || a.name);
  var cached = localStorage.getItem(key);
  if (cached) return cb(cached);
  fetch(summaryUrl(a))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      var url = d.thumbnail && d.thumbnail.source;
      if (!url) return;
      try { localStorage.setItem(key, url); } catch (e) {}
      cb(url);
    })
    .catch(function () {});
}
