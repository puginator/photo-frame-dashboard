// Chores: tonight's chores, one lane per girl plus "Anyone", only on nights the girls are at Dad's.
// State lives in js/chores.js (local-first, synced to KV); the list is edited in KV (docs/chores.md).
import { choreState, toggle, initChores, saveChores } from '../chores.js';
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
      '<span class="ch-text">' + (c.period === 'morning' ? '<small>Morning</small>' : '') + '<b>' + App.esc(c.title) + '</b>' +
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

  // Away nights preserve each girl's streak until her next Dad night.
  function away(now) {
    var back = nextNightWith('dad', now, CUSTODY), s = choreState();
    var when = !back ? 'soon' : back - App.dayStart(now) === 86400000 ? 'tomorrow' : App.fmt.day(back);
    return '<div class="tasks tasks--away"><button class="btn btn--ghost" data-edit-chores>Edit chores</button><div class="label">Chores</div>' +
      '<h1 class="serif">The girls are at ' + CUSTODY.names.mom + '’s tonight.</h1>' +
      '<p>Chores are back ' + (when === 'tomorrow' || when === 'soon' ? when : 'on ' + when) + ' night. Streaks are paused until you’re back at Dad’s.</p>' +
      '<div class="ch-lanes" style="grid-template-columns:repeat(' + s.list.kids.length + ',1fr)">' + s.list.kids.map(function (p) {
        return '<section class="ch-lane" style="' + App.pstyle(p) + '"><header class="ch-head">' + App.avatar(p, 42) +
          '<div><b>' + App.esc(p.name) + '</b><span class="ch-sub">Paused' + fire(p.id, s) + '</span></div></header></section>';
      }).join('') + '</div></div>';
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
      '<button class="btn btn--ghost" data-edit-chores>Edit chores</button><div class="t-progress"><span class="num">' + n + '<small>/' + all.length + '</small></span><div class="t-bar"><i style="width:' + (all.length ? n / all.length * 100 : 0) + '%"></i></div><span class="label">done</span></div>' +
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

  function editChores() {
    var list = choreState().list, draft = JSON.parse(JSON.stringify(list.chores));
    function fields(c, i) {
      return '<div class="ch-editor-row" data-edit-row="' + i + '">' +
        '<label>Emoji<input data-field="emoji" list="chore-emojis" aria-label="Emoji" maxlength="20" value="' + App.esc(c.emoji) + '"></label>' +
        '<label>Chore<input data-field="title" aria-label="Chore name" maxlength="100" value="' + App.esc(c.title) + '"></label>' +
        '<label>Who<select data-field="who">' + [{ id: 'each', name: 'Each girl' }, { id: 'any', name: 'Anyone' }].concat(list.kids).map(function (k) { return '<option value="' + k.id + '"' + (k.id === c.who ? ' selected' : '') + '>' + App.esc(k.name) + '</option>'; }).join('') + '</select></label>' +
        '<label>When<select data-field="days">' + [
          ['all', 'Every night', c.period !== 'morning' && !c.days],
          ['school', 'School nights', c.period !== 'morning' && c.days && c.days.join(',') === '0,1,2,3,4'],
          ['morning', 'Every morning', c.period === 'morning' && !c.days],
          ['school-morning', 'School mornings', c.period === 'morning' && c.days && c.days.join(',') === '1,2,3,4,5']
        ].map(function (option) { return '<option value="' + option[0] + '"' + (option[2] ? ' selected' : '') + '>' + option[1] + '</option>'; }).join('') +
        (c.days && !((c.period === 'morning' ? '1,2,3,4,5' : '0,1,2,3,4') === c.days.join(',')) ? '<option value="custom" selected>Custom days</option>' : '') + '</select></label>' +
        '<button class="btn btn--ghost" data-remove-row="' + i + '" aria-label="Remove chore">Remove</button></div>';
    }
    App.sheet('<div class="sheet-pad"><div class="label">Your family’s list</div><h2 class="serif sheet-h">Edit chores</h2><p>Choose an emoji, a chore and who does it. Changes also apply when calculating streaks.</p><datalist id="chore-emojis"><option value="🌙"><option value="⭐"><option value="🛏️"><option value="😁"><option value="👕"><option value="🎒"><option value="🍽️"><option value="📚"><option value="🐕"><option value="🧹"></datalist><div data-edit-list>' + draft.map(fields).join('') + '</div><div class="sheet-actions"><button class="btn btn--ghost" data-new-chore>Add chore</button><button class="btn btn--ghost" data-night-chore>Add nighttime chores</button><button class="btn btn--solid" data-save-chores>Save changes</button></div><p data-edit-status role="status"></p></div>', {
      cls: 'sheet--wide', onMount: function (sheet, close) {
        var busy = false;
        function collect() {
          App.$$('[data-edit-row]', sheet).forEach(function (row) {
            var c = draft[+row.dataset.editRow];
            c.title = row.querySelector('[data-field="title"]').value.trim();
            c.emoji = row.querySelector('[data-field="emoji"]').value.trim();
            c.who = row.querySelector('[data-field="who"]').value;
            var days = row.querySelector('[data-field="days"]').value;
            if (days !== 'custom') c.period = days === 'morning' || days === 'school-morning' ? 'morning' : 'night';
            if (days === 'all' || days === 'morning') delete c.days;
            if (days === 'school-morning') c.days = [1, 2, 3, 4, 5];
            if (days === 'school') c.days = [0, 1, 2, 3, 4];
          });
        }
        sheet.addEventListener('click', function (ev) {
          var b = ev.target.closest('button');
          if (!b || busy) return;
          collect();
          if (b.hasAttribute('data-new-chore') || b.hasAttribute('data-night-chore')) {
            if (draft.length >= 50) return;
            draft.push({ id: 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7), title: b.hasAttribute('data-night-chore') ? 'Nighttime chores' : '', emoji: b.hasAttribute('data-night-chore') ? '🌙' : '⭐', who: 'each', stars: 1 });
          } else if (b.hasAttribute('data-remove-row')) draft.splice(+b.dataset.removeRow, 1);
          else if (b.hasAttribute('data-save-chores')) {
            var status = sheet.querySelector('[data-edit-status]');
            if (draft.some(function (c) { return !c.title || !c.emoji; })) { status.textContent = 'Give every chore a name and emoji.'; return; }
            busy = true; b.disabled = true; status.textContent = 'Saving…';
            saveChores(draft).then(function () { close(); App.toast('Chore list saved'); }).catch(function () { busy = false; b.disabled = false; status.textContent = 'Could not save. Check Wi-Fi and try again.'; });
            return;
          } else return;
          sheet.querySelector('[data-edit-list]').innerHTML = draft.map(fields).join('');
        });
      }
    });
  }

  function onClick(e) {
    if (e.target.closest('[data-edit-chores]')) return editChores();
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
