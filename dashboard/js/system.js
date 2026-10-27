// Alerts (takeovers, banners, notices) + the hidden demo drawer.
(function () {
  'use strict';
  var D = window.DATA, $ = App.$;

  function img(seed, w, h) { return 'https://picsum.photos/seed/' + seed + '/' + w + '/' + h; }
  App.img = img;

  // ------------------------------------------------------------ full-screen takeovers
  function takeover(html, cls) {
    var el = $('#takeover');
    el.className = 'takeover ' + (cls || '');
    el.innerHTML = html;
    el.classList.add('is-open');
    App.closeSheet();
    if (App.mode !== 'day') App.setMode('day');
    return el;
  }
  function closeTakeover() {
    var el = $('#takeover');
    el.classList.remove('is-open');
    el.innerHTML = '';
  }
  App.closeTakeover = closeTakeover;

  // ------------------------------------------------------------ banners (amber, actionable)
  App.banner = function (opts) {
    var box = $('#banners');
    var b = document.createElement('div');
    b.className = 'banner banner--' + (opts.tone || 'amber');
    b.innerHTML = App.icon(opts.icon || 'bell', 30) + '<div class="banner-text"><b>' + opts.title + '</b><span>' + (opts.sub || '') + '</span></div>' +
      (opts.action ? '<button class="banner-btn banner-btn--solid" data-act>' + opts.action + '</button>' : '') +
      '<button class="banner-btn" data-x>' + (opts.dismiss || 'Dismiss') + '</button>';
    box.appendChild(b);
    b.classList.add('is-in');
    function kill() { b.remove(); }
    b.querySelector('[data-x]').onclick = kill;
    if (opts.action) b.querySelector('[data-act]').onclick = function () { kill(); opts.onAction(); };
    if (opts.ms) setTimeout(kill, opts.ms);
    return kill;
  };

  // ------------------------------------------------------------ demo drawer
  function demoHTML() {
    var t = App.now();
    return '<div class="demo-panel">' +
      '<div class="demo-head"><div><div class="label label--light">Prototype</div><h2 class="serif">Demo controls</h2></div><button class="demo-x" data-demo-close>' + App.icon('x', 28) + '</button></div>' +
      '<div class="demo-sec"><div class="label label--light">Time of day · now ' + App.fmt.time(t) + '</div><div class="demo-grid">' +
      '<button data-time="7:10">7:10 AM</button><button data-time="15:18">3:18 PM</button><button data-time="19:45">7:45 PM</button><button data-time="23:40">11:40 PM</button><button data-time="real">Real time</button></div></div>' +
      '<div class="demo-sec"><div class="label label--light">Modes</div><div class="demo-grid">' +
      '<button data-mode="ambient">Ambient</button><button data-mode="night">Night</button><button data-fastidle>' + (App.idle.home < 60 ? 'Idle: fast ✓' : 'Idle: fast') + '</button></div></div>' +
      '<div class="demo-sec"><div class="label label--light">Calendar data</div><div class="demo-grid">' +
      ['normal', 'empty', 'busy'].map(function (m) {
        return '<button data-cal="' + m + '" class="' + (App.calMode === m ? 'is-on' : '') + '">' + { normal: 'Normal day', empty: 'Empty day', busy: 'Overloaded' }[m] + '</button>';
      }).join('') + '</div></div>' +
      '<p class="demo-note">Keyboard: <b>D</b> demo · <b>A</b> ambient · <b>N</b> night · <b>1–7</b> views</p>' +
      '</div>';
  }
  App.openDemo = function () {
    var el = $('#demo');
    el.innerHTML = demoHTML();
    el.classList.add('is-open');
  };
  function closeDemo() { $('#demo').classList.remove('is-open'); }

  function demoClick(e) {
    var b = e.target.closest('button');
    if (!b) { if (e.target === $('#demo')) closeDemo(); return; }
    if (b.hasAttribute('data-demo-close')) return closeDemo();
    if (b.dataset.time) {
      if (b.dataset.time === 'real') App.setTime(null);
      else { var p = b.dataset.time.split(':'); App.setTime(+p[0], +p[1]); }
      App.openDemo();
      return;
    }
    if (b.dataset.mode) { closeDemo(); App.setMode(b.dataset.mode); return; }
    if (b.hasAttribute('data-fastidle')) {
      var fast = App.idle.home >= 60;
      App.idle.home = fast ? 8 : 60;
      App.idle.ambient = fast ? 15 : 120;
      App.openDemo();
      return;
    }
    if (b.dataset.cal) { App.calMode = b.dataset.cal; App.rerender(); App.openDemo(); }
  }

  App.on('ready', function () {
    $('#demo').addEventListener('click', demoClick);
    App.hold($('#railClock'), 700, { done: App.openDemo });
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') return;
      var k = e.key.toLowerCase();
      if (k === 'd') { $('#demo').classList.contains('is-open') ? closeDemo() : App.openDemo(); }
      if (k === 'a') App.setMode('ambient');
      if (k === 'n') App.setMode('night');
      if (k === 'escape') { closeDemo(); App.closeSheet(); }
      var views = ['home', 'calendar', 'tasks', 'shopping', 'photos', 'meals', 'news', 'print'];
      if (k >= '1' && k <= '7') App.go(views[+k - 1]);
    });
  });
})();
