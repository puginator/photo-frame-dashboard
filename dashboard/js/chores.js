// Chore state on the frame: local-first, synced to the Worker (docs/chores.md).
// A tap updates localStorage and the screen at once, then goes out through an outbox that retries
// every minute and when Wi-Fi comes back. Loading a day merges in whatever KV has, so check-offs
// survive the kiosk's data being cleared.
import { merge, isDone, queue, ack, ymd } from './chores-core.js';
import SEED from '../chores-list.json';

var S = { list: read('chores-list') || SEED, day: null, done: {}, outbox: read('chores-outbox') || {}, history: read('chores-history') || {}, busy: false, cb: function () {} };

function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function get(path) {
  return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
}

function today() { return ymd(window.App.now()); }

// Switch to today's doc when the date rolls over (local copy first, then KV).
function ensureDay() {
  var d = today();
  if (S.day === d) return;
  S.day = d;
  S.done = (read('chores:' + d) || {}).done || {};
  get('/api/chores/' + d).then(function (doc) {
    if (S.day !== d) return;
    S.done = merge(S.done, doc.done);
    write('chores:' + d, { done: S.done });
    S.cb();
  }).catch(function () {});
}

// Each POST carries the frame's whole day doc, not just the changes: KV reads can be up to 60 s
// stale, so the Worker's read-merge-write could otherwise drop a check-off made a moment earlier.
// The frame is the only writer and always holds the full day, so sending all of it is self-healing.
function flush() {
  if (S.busy) return;
  var days = Object.keys(S.outbox);
  if (!days.length) return;
  S.busy = true;
  var d = days[0], sent = S.outbox[d];
  var local = d === S.day ? S.done : ((read('chores:' + d) || {}).done || {});
  fetch('/api/chores/' + d, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: merge(local, sent) }) })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (doc) {
      S.outbox = ack(S.outbox, d, sent);
      write('chores-outbox', S.outbox);
      if (d === S.day) { S.done = merge(S.done, doc.done); write('chores:' + d, { done: S.done }); }
      S.history[d] = { done: d === S.day ? S.done : doc.done };
      S.busy = false;
      S.cb();
      flush(); // next day in the outbox, if any
    })
    .catch(function () { S.busy = false; }); // stays queued; the minute timer retries
}

function loadList() {
  get('/api/chores/list').then(function (list) { S.list = list; write('chores-list', list); S.cb(); }).catch(function () {});
}
function loadHistory() {
  get('/api/chores/history').then(function (h) { S.history = h; write('chores-history', h); S.cb(); }).catch(function () {});
}

// Call once at startup; onChange runs whenever anything the board shows changes.
export function initChores(onChange) {
  S.cb = onChange;
  ensureDay();
  loadList();
  loadHistory();
  flush();
  setInterval(function () { ensureDay(); flush(); }, 60000);
  setInterval(function () { loadList(); loadHistory(); }, 3600000);
  window.addEventListener('online', flush);
  // Local day copies older than a week are just clutter; KV keeps 60 days.
  var cutoff = ymd(new Date(Date.now() - 7 * 86400000));
  Object.keys(localStorage).forEach(function (k) { if (/^chores:\d{4}-/.test(k) && k.slice(7) < cutoff) localStorage.removeItem(k); });
}

export function choreState() {
  ensureDay();
  return { list: S.list, day: S.day, done: S.done, history: S.history };
}

// Check (by = who did it) or un-check `key` for today.
export function toggle(key, by) {
  ensureDay();
  var entry = isDone(S.done, key) ? { at: Date.now(), undone: true } : { at: Date.now(), by: by };
  S.done = Object.assign({}, S.done);
  S.done[key] = entry;
  write('chores:' + S.day, { done: S.done });
  S.outbox = queue(S.outbox, S.day, key, entry);
  write('chores-outbox', S.outbox);
  S.cb();
  clearTimeout(S.soon);
  S.soon = setTimeout(flush, 1500); // a burst of taps goes out as one write (KV: 1 write/s per key)
}
