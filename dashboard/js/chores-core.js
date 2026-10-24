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

// Outbox of unsynced entries: { <day>: { <key>: entry } }. A change replaces any queued entry for
// the same key; a successful POST acks only entries that haven't changed since they were sent.
export function queue(outbox, day, key, entry) {
  var out = Object.assign({}, outbox);
  out[day] = Object.assign({}, out[day]);
  out[day][key] = entry;
  return out;
}

export function ack(outbox, day, sent) {
  var out = Object.assign({}, outbox), left = Object.assign({}, out[day]);
  Object.keys(sent).forEach(function (k) { if (left[k] && left[k].at === sent[k].at) delete left[k]; });
  if (Object.keys(left).length) out[day] = left; else delete out[day];
  return out;
}

// true/false: did `kid` finish all her chores on date d? null when she had none (skipped, like a Mom night).
function finished(list, kid, d, done) {
  var mine = choresFor(list, d)[kid] || [];
  if (!mine.length) return null;
  return mine.every(function (x) { return isDone(done, x.key); });
}

// Consecutive Dad nights on which `kid` finished everything, counting back from tonight (which
// counts once it's complete, but doesn't break the streak while still in progress). Nights at Mom's
// are skipped, not misses. history: { 'YYYY-MM-DD': { done } }; atDad(date) -> boolean.
export function streak(kid, now, list, history, tonight, atDad) {
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), n = 0;
  if (atDad(today) && finished(list, kid, today, tonight) === true) n++;
  for (var i = 1; i <= 60; i++) {
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    if (!atDad(d)) continue;
    var f = finished(list, kid, d, (history[ymd(d)] || {}).done);
    if (f === null) continue;
    if (!f) break;
    n++;
  }
  return n;
}
