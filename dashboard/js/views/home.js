// Home / Today: the glanceable overview. Never scrolls.
import { custody } from '../custody.js';
import { CUSTODY } from '../config.js';

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
      '<span class="h-wx-meta"><b>' + w.label + '</b><span>H ' + w.hi + '°  L ' + w.lo + '°</span></span>' +
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

  // ponytail: placeholder until each ticket lands; replace the slot's renderer, not the grid.
  function todo(title, issue) {
    return '<div class="label">' + title + '</div><div class="h-todo serif"><i>Coming in #' + issue + '</i></div>';
  }

  function paint() {
    var el = V.el;
    el.querySelector('.h-clock').innerHTML = clock();
    el.querySelector('.h-weather').innerHTML = weather();
    el.querySelector('.h-count').innerHTML = todo('Countdowns', 7);
    el.querySelector('.h-custody').innerHTML = custodyTile();
    el.querySelector('.h-lunch').innerHTML = todo('School lunch', 3);
    el.querySelector('.h-wyr').innerHTML = todo('Would you rather', 6);
    el.querySelector('.h-fact').innerHTML = todo('Animal fact', 5);
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
          var g = e.target.closest('[data-go]');
          if (g) App.go(g.dataset.go);
        });
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
    if (n.getMinutes() % 30 === 0) V.el.querySelector('.h-custody').innerHTML = custodyTile();
    if (n.getMinutes() === 0) V.el.querySelector('.h-weather').innerHTML = weather();
  });
  App.on('data', function () { if (App.current === 'home') paint(); });
})();
