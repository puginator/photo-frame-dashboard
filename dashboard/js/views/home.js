// Home / Today: the glanceable overview. Never scrolls.
import { custody } from '../custody.js';
import { CUSTODY, COUNTDOWNS } from '../config.js';
import { upcoming, when } from '../countdown.js';
import FACTS from '../animal-facts.js';
import { pickDaily, wyrOfDay } from '../daily.js';
import WYR from '../would-you-rather.js';
import { tally, addVote, label } from '../votes.js';
import { lunchFor, loadLunch } from '../lunch.js';

(function () {
  'use strict';
  var D = window.DATA, V = {};

  function clock() {
    var n = App.now();
    return '<div class="h-time num">' + App.fmt.time(n, false) + '<span class="h-ampm">' + App.fmt.ampm(n) + '</span></div>' +
      '<div class="h-date"><b>' + App.fmt.day(n) + '</b> ' + App.fmt.month(n) + ' ' + n.getDate() + '</div>';
  }

  function weather() {
    var w = App.weatherNow();
    var hours = App.hourly(7);
    var tmin = Math.min.apply(null, hours.map(function (h) { return h.t; }));
    var tmax = Math.max.apply(null, hours.map(function (h) { return h.t; }));
    return '<div class="h-wx-top">' +
      '<span class="h-wx-icon">' + App.icon(w.cond, 60) + '</span>' +
      '<span class="h-wx-temp num">' + w.temp + '°</span>' +
      '<span class="h-wx-meta"><b>' + w.label + '</b><span>H ' + w.hi + '°  L ' + w.lo + '°</span>' +
      (w.stale ? '<small>' + w.stale + '</small>' : '') + '</span>' +
      w.others.map(function (o) {
        return '<span class="h-wx-other">' + App.icon(o.cond, 22) + '<b class="num">' + o.temp + '°</b><small>' + App.esc(o.name) + '</small></span>';
      }).join('') +
      '</div>' +
      '<div class="h-wx-say"><b>' + w.summary + '.</b> ' + w.advice + '.</div>' +
      '<div class="h-wx-hours">' + hours.map(function (h) {
        var lift = tmax === tmin ? 0 : Math.round((h.t - tmin) / (tmax - tmin) * 8);
        return '<div class="h-hr' + (h.p >= 50 ? ' is-wet' : '') + '"><span class="h-hr-l">' + h.label + '</span>' +
          '<span class="h-hr-i" style="transform:translateY(' + -lift + 'px)">' + App.icon(h.c, 22) + '</span><b>' + h.t + '°</b></div>';
      }).join('') + '</div>';
  }

  function ring(done, total, size) {
    var r = size / 2 - 5, c = 2 * Math.PI * r, f = total ? done / total : 0;
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-fg" stroke-dasharray="' + (c * f) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
  }
  App.ring = ring;

  function custodyTile() {
    var c = custody(App.now(), CUSTODY);
    return '<div class="label">Tonight</div>' +
      '<div class="h-cu-who serif">At ' + CUSTODY.names[c.tonight] + '\u2019s</div>' +
      '<div class="h-cu-detail">' + App.esc(c.detail) + '</div>' +
      '<div class="h-cu-next"><b>Tomorrow</b>' + App.esc(c.tomorrow.detail) + '</div>';
  }

  function lunchTile() {
    var l = lunchFor(V.menu || {}, App.now());
    var e = l.today, n = l.next;
    var nextDay = n && (n.date - App.dayStart(App.now()) === 86400000 ? 'Tomorrow' : App.fmt.day(n.date));
    return '<div class="label">School lunch</div>' +
      (e ? (e.notes ? '<div class="h-lu-note">' + App.esc(e.notes) + '</div>' : '') +
        '<div class="h-lu-main">' + App.esc(e.main) + '</div>' +
        (e.alt ? '<div class="h-lu-alt">or ' + App.esc(e.alt) + '</div>' : '')
        : '<div class="h-todo serif"><i>No school lunch today</i></div>') +
      (n ? '<div class="h-cu-next h-lu-next"><b>' + nextDay + '</b><span>' + App.esc(n.entry.main.split(/:| with | on /)[0]) + '</span></div>' : '');
  }

  function countdowns() {
    var list = upcoming(App.now(), COUNTDOWNS, CUSTODY, 3);
    if (!list.length) return '';
    return '<div class="label">Countdowns</div>' + list.map(function (c) {
      return '<div class="h-cd' + (c.days === 0 ? ' is-today' : '') + '"><span class="h-cd-e">' + c.emoji + '</span>' +
        '<span class="h-cd-l">' + App.esc(c.label) + '</span><b>' + when(c.days) + '</b></div>';
    }).join('');
  }

  function factTile() {
    var f = pickDaily(FACTS, App.now());
    return '<div class="label">Animal fact</div>' +
      '<div class="h-fa"><span class="h-fa-e">' + f.emoji + '</span>' +
      '<div><b>' + App.esc(f.name) + '</b><p>' + App.esc(f.fact) + '</p></div></div>';
  }

  function today() { var n = App.now(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
  function savedVotes() { try { return JSON.parse(localStorage.getItem('wyr-votes')); } catch (e) { return null; } }

  // Tap a card to vote. Today's tally (js/votes.js, resets at midnight) shows only to whoever just
  // voted, for a few seconds, so the next kid votes without seeing which way it's going.
  function wyrTile(reveal) {
    var q = wyrOfDay(WYR, App.now()), t = tally(savedVotes(), today());
    function card(side, text) {
      var lead = reveal && t[side] > t[side === 'a' ? 'b' : 'a'];
      return '<button class="h-wyr-' + side + (lead ? ' is-lead' : '') + '" data-vote="' + side + '">' +
        '<span>' + App.esc(text) + '</span><small>' + (reveal ? label(t, side) : 'Tap to vote') + '</small></button>';
    }
    return '<div class="label">Would you rather\u2026</div>' +
      '<div class="h-wyr-opts">' + card('a', q[0]) + '<span class="h-wyr-or serif">or</span>' + card('b', q[1]) + '</div>';
  }

  function vote(side) {
    var now = Date.now();
    if (now - (V.lastVote || 0) < 1000) return; // ponytail: 1 s guard against double-taps; each kid still gets a vote
    V.lastVote = now;
    try { localStorage.setItem('wyr-votes', JSON.stringify(addVote(savedVotes(), today(), side))); } catch (e) {}
    V.el.querySelector('.h-wyr').innerHTML = wyrTile(true);
    clearTimeout(V.hideVotes);
    V.hideVotes = setTimeout(function () { V.el.querySelector('.h-wyr').innerHTML = wyrTile(); }, 4000);
  }

  function paint() {
    var el = V.el;
    el.querySelector('.h-clock').innerHTML = clock();
    el.querySelector('.h-weather').innerHTML = weather();
    el.querySelector('.h-count').innerHTML = countdowns();
    el.querySelector('.h-custody').innerHTML = custodyTile();
    el.querySelector('.h-lunch').innerHTML = lunchTile();
    el.querySelector('.h-wyr').innerHTML = wyrTile();
    el.querySelector('.h-fact').innerHTML = factTile();
  }

  function photoCaption(s) {
    var m = App.photoMeta(s.photos[0]);
    V.el.querySelector('.h-photo-cap').innerHTML = '<b>' + (m.onThisDay ? 'On this day · ' : '') + m.kicker + '</b><span>' + App.esc(m.place) + '</span>';
  }

  App.register('home', {
    show: function (el) {
      V.el = el;
      if (!el.firstChild) {
        el.innerHTML = '<div class="home">' +
          '<div class="h-clock" data-go="calendar"></div>' +
          '<div class="h-weather"></div>' +
          '<div class="h-count"></div>' +
          '<div class="h-main">' +
          '  <div class="h-top"><div class="h-custody card"></div><div class="h-lunch card"></div></div>' +
          '  <div class="h-wyr card"></div>' +
          '</div>' +
          '<div class="h-side">' +
          '  <button class="h-photo" data-go="photos"><div class="h-photo-stage"></div><div class="h-photo-cap"></div></button>' +
          '  <div class="h-fact card"></div>' +
          '</div></div>';
        el.addEventListener('click', function (e) {
          var v = e.target.closest('[data-vote]');
          if (v) { vote(v.dataset.vote); return; }
          var g = e.target.closest('[data-go]');
          if (g) App.go(g.dataset.go);
        });
        loadLunch(function (menu) { V.menu = menu; el.querySelector('.h-lunch').innerHTML = lunchTile(); });
        V.slides = new App.Slideshow(el.querySelector('.h-photo-stage'), { layout: 'cover', captions: false, interval: 12000, onChange: photoCaption });
      }
      paint();
      V.slides.start();
    },
    resume: function () { V.slides.start(); },
    hide: function () { if (V.slides) V.slides.stop(); }
  });
  // Every minute: just the clock (cheap, even while hidden). Custody on the half hour (handoffs are), weather on the hour.
  App.on('minute', function (n) {
    if (!V.el || !V.el.firstChild) return;
    V.el.querySelector('.h-clock').innerHTML = clock();
    if (n.getMinutes() % 30 === 0) {
      V.el.querySelector('.h-custody').innerHTML = custodyTile();
      V.el.querySelector('.h-count').innerHTML = countdowns(); // the custody countdown flips at handoffs
    }
    if (n.getHours() === 0 && n.getMinutes() === 0) {
      V.el.querySelector('.h-lunch').innerHTML = lunchTile();
      V.el.querySelector('.h-fact').innerHTML = factTile();
      V.el.querySelector('.h-wyr').innerHTML = wyrTile();
    }
    if (n.getMinutes() === 0) V.el.querySelector('.h-weather').innerHTML = weather();
  });
  App.on('data', function () { if (App.current === 'home') paint(); });
})();
