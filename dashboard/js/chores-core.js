// Chore logic shared by the frame (js/chores.js, views/tasks.js) and the Worker (worker.js). No DOM.
//
// List (KV chores:list, seed in chores-list.json):
//   { kids: [{ id, name, color, rgb, ink }], chores: [{ id, title, emoji, who: 'each'|'any'|<kid id>, days?: [0-6], stars? }] }
// Day doc (KV chores:<YYYY-MM-DD>): { done: { '<kid|any>:<chore id>': { at, by } | { at, undone: true } } }

// Merge entries per key; the newer `at` wins, so replays and out-of-order syncs are harmless.
export function merge(a, b) {
  var out = Object.assign({}, a);
  Object.keys(b || {}).forEach(function (k) { if (!out[k] || b[k].at > out[k].at) out[k] = b[k]; });
  return out;
}

export function isDone(done, key) { return !!(done && done[key] && !done[key].undone); }

// Tonight's chores for date d, by lane: { <kid id>: [{ key, chore }], any: [...] }.
export function choresFor(list, d) {
  var lanes = { any: [] };
  list.kids.forEach(function (k) { lanes[k.id] = []; });
  list.chores.forEach(function (c) {
    if (c.days && c.days.indexOf(d.getDay()) < 0) return;
    if (c.who === 'each') list.kids.forEach(function (k) { lanes[k.id].push({ key: k.id + ':' + c.id, chore: c }); });
    else if (lanes[c.who]) lanes[c.who].push({ key: c.who + ':' + c.id, chore: c });
  });
  return lanes;
}

// Validate a POSTed entries object (trust boundary: the Worker stores whatever passes).
export function validEntries(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
  var keys = Object.keys(e);
  return keys.length > 0 && keys.length <= 200 && keys.every(function (k) {
    var v = e[k];
    return /^[a-z0-9-]{1,40}:[a-z0-9-]{1,40}$/.test(k) && v && typeof v.at === 'number' &&
      (v.undone === true ? Object.keys(v).length === 2 : typeof v.by === 'string' && v.by.length <= 40 && Object.keys(v).length === 2);
  });
}

export function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
