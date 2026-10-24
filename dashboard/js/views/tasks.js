// Chores: tonight's chores, one lane per girl plus "Anyone", only on nights the girls are at Dad's.
// State lives in js/chores.js (local-first, synced to KV); the list is edited in KV (docs/chores.md).
import { choreState, toggle, initChores } from '../chores.js';
import { choresFor, isDone, streak } from '../chores-core.js';
import { nightOf, nextNightWith } from '../custody.js';
import { CUSTODY } from '../config.js';

(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null, pending: {} };

  function kid(id, list) { return list.kids.filter(function (k) { return k.id === id; })[0]; }
  function person(id, list) { return id === 'any' ? D.family : kid(id, list) || D.family; }

  // Stars each girl earned tonight: her own chores plus the "Anyone" chores she did. Just for fun.
  function stars(id, lanes, done) {
    var n = 0;
    lanes[id].concat(lanes.any).forEach(function (x) {
      var e = done[x.key];
      if (isDone(done, x.key) && (x.key.indexOf(id + ':') === 0 || e.by === id)) n += x.chore.stars || 0;
    });
    return n;
  }

  // Streak: Dad nights in a row with everything done (Mom nights don't break it).
  function fire(id, s) {
    var n = streak(id, App.now(), s.list, s.history, s.done, function (d) { return nightOf(d, CUSTODY) === 'dad'; });
    return n ? '<span class="ch-fire">\ud83d\udd25<span class="num">' + n + '</span></span>' : '';
  }

  function row(x, done, list) {
    var on = isDone(done, x.key), c = x.chore, by = on && x.key.indexOf('any:') === 0 ? kid(done[x.key].by, list) : null;
    return '<button class="ch' + (on ? ' is-done' : '') + (V.pending[x.key] ? ' is-checking' : '') + '" data-ch="' + x.key + '">' +
      '<span class="ch-emoji">' + c.emoji + '<span class="ch-check"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span></span>' +
      '<span class="ch-text"><b>' + App.esc(c.title) + '</b>' +
      (c.stars || by ? '<small>' + (c.stars ? App.icon('star', 14, 'i--fill') + c.stars : '') + (by ? (c.stars ? ' · ' : 'by ') + App.esc(by.name) : '') + '</small>' : '') +
      '</span></button>';
  }

  function lane(id, lanes, s) {
    var p = person(id, s.list), list = lanes[id];
    var n = list.filter(function (x) { return isDone(s.done, x.key); }).length, all = list.length && n === list.length;
    return '<section class="ch-lane' + (all ? ' is-complete' : '') + '" style="' + App.pstyle(p) + '">' +
      '<header class="ch-head">' + App.avatar(p, 42) +
      '<div><b>' + (id === 'any' ? 'Anyone' : App.esc(p.name)) + '</b>' +
      (id === 'any' ? '<span class="ch-sub">Up for grabs</span>' : '<span class="ch-stars">' + App.icon('star', 18, 'i--fill') + '<span class="num">' + stars(id, lanes, s.done) + '</span>' + fire(id, s) + '</span>') + '</div>' +
      '<div class="ch-ring">' + App.ring(n, list.length || 1, 46) + '<span class="num">' + (all ? '✓' : list.length ? n + '/' + list.length : '–') + '</span></div>' +
      '</header>' +
      '<div class="ch-list">' + (list.length ? list.map(function (x) { return row(x, s.done, s.list); }).join('') : '<div class="ch-none serif"><i>Nothing tonight</i></div>') +
      (all ? '<div class="ch-alldone serif">All done<i>!</i></div>' : '') + '</div>' +
      '</section>';
  }

  // On nights the girls are at Mom's there is nothing to do here.
  function away(now) {
    var back = nextNightWith('dad', now, CUSTODY);
    var when = !back ? 'soon' : back - App.dayStart(now) === 86400000 ? 'tomorrow' : App.fmt.day(back);
    return '<div class="tasks tasks--away"><div class="label">Chores</div>' +
      '<h1 class="serif">The girls are at ' + CUSTODY.names.mom + '’s tonight.</h1>' +
      '<p>Chores are back ' + (when === 'tomorrow' || when === 'soon' ? when : 'on ' + when) + ' night.</p></div>';
  }

  function render() {
    var now = App.now();
    if (nightOf(now, CUSTODY) !== 'dad') { V.el.innerHTML = away(now); return; }
    var s = choreState(), lanes = choresFor(s.list, now);
    var ids = s.list.kids.map(function (k) { return k.id; }).concat(lanes.any.length ? ['any'] : []);
    var all = ids.reduce(function (a, id) { return a.concat(lanes[id]); }, []);
    var n = all.filter(function (x) { return isDone(s.done, x.key); }).length;
    V.el.innerHTML = '<div class="tasks">' +
      '<header class="t-head">' +
      '<div class="t-title"><div class="label">' + App.fmt.day(now) + ' night</div><h1 class="serif">Tonight’s chores</h1></div>' +
      '<div class="t-progress"><span class="num">' + n + '<small>/' + all.length + '</small></span><div class="t-bar"><i style="width:' + (all.length ? n / all.length * 100 : 0) + '%"></i></div><span class="label">done</span></div>' +
      '</header>' +
      '<div class="ch-lanes" style="grid-template-columns:repeat(' + ids.length + ',1fr)">' + ids.map(function (id) { return lane(id, lanes, s); }).join('') + '</div>' +
      '</div>';
  }

  function find(key) {
    var s = choreState(), lanes = choresFor(s.list, App.now()), hit = null;
    Object.keys(lanes).forEach(function (id) { lanes[id].forEach(function (x) { if (x.key === key) hit = x; }); });
    return hit;
  }

  function complete(x, btn, by) {
    V.pending[x.key] = true;
    btn.classList.add('is-checking');
    setTimeout(function () {
      delete V.pending[x.key];
      toggle(x.key, by);
      var p = kid(by, choreState().list);
      App.toast('<b>' + App.esc(x.chore.title) + '</b> done' + (x.chore.stars && p ? ' · +' + x.chore.stars + '★ ' + App.esc(p.name) : ''), {
        icon: 'check',
        undo: function () { toggle(x.key); }
      });
    }, 350);
  }

  // "Anyone" chores ask who did it, so the star goes to the right girl.
  function whoDidIt(x, btn) {
    var list = choreState().list;
    App.sheet('<div class="sheet-pad"><div class="label">' + x.chore.emoji + ' ' + App.esc(x.chore.title) + '</div><h2 class="serif sheet-h">Who did it?</h2>' +
      '<div class="add-who add-who--big">' + list.kids.map(function (p) {
        return '<button class="who-btn" data-by="' + p.id + '" style="' + App.pstyle(p) + '">' + App.avatar(p, 88) + '<span>' + App.esc(p.name) + '</span></button>';
      }).join('') + '</div></div>', {
      onMount: function (s, close) {
        s.addEventListener('click', function (e) {
          var b = e.target.closest('[data-by]');
          if (!b) return;
          close();
          complete(x, V.el.querySelector('[data-ch="' + x.key + '"]') || btn, b.dataset.by);
        });
      }
    });
  }

  function onClick(e) {
    var t = e.target.closest('[data-ch]');
    if (!t || V.pending[t.dataset.ch]) return;
    var x = find(t.dataset.ch);
    if (!x) return;
    if (isDone(choreState().done, x.key)) return toggle(x.key); // tap again to un-check
    var owner = x.key.split(':')[0];
    if (owner === 'any') return whoDidIt(x, t);
    complete(x, t, owner);
  }

  function refresh() { if (V.el && App.current === 'tasks') render(); App.emit('chores'); }
  initChores(refresh);

  App.register('tasks', {
    show: function (el) {
      if (!V.el) { V.el = el; el.addEventListener('click', onClick); }
      render();
    }
  });
  // Handoffs happen on the half hour at most; the board flips to/from "at Mom's" with them.
  App.on('minute', function (n) { if (n.getMinutes() % 30 === 0) refresh(); });
})();
