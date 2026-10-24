// AI tab: today's AI headlines from Hacker News. Display-only.
(function () {
  'use strict';
  var V = { el: null };

  function age(at, now) {
    var h = Math.max(0, Math.round((now - at) / 36e5));
    if (h < 1) return 'just now';
    if (h < 24) return h + 'h ago';
    return Math.round(h / 24) + 'd ago';
  }

  function row(s, now) {
    return '<div class="n-row">' +
      '<div class="n-points num">' + s.points + '</div>' +
      '<div class="n-main"><b>' + App.esc(s.title) + '</b>' +
      '<span>' + App.esc(s.host || 'news.ycombinator.com') + ' · ' + s.comments + ' comments · ' + age(s.at, now) + '</span></div>' +
      '</div>';
  }

  function stories() { return window.DATA.newsAi || []; }

  function render() {
    var now = Date.now(), list = stories();
    V.el.innerHTML = '<div class="ain">' +
      '<header class="n-top"><div><div class="label">From Hacker News</div><h1 class="serif">AI today</h1></div>' +
      '<div class="label">' + App.fmt.day(App.now()) + '</div></header>' +
      (list.length
        ? '<div class="n-list">' + list.map(function (s) { return row(s, now); }).join('') + '</div>'
        : '<div class="s-empty serif">Quiet in AI.<br><i>Check back later.</i></div>') +
      '</div>';
  }

  App.register('news', {
    show: function (el) {
      if (!V.el) {
        V.el = el;
        App.on('data', function () { if (App.current === 'news') render(); });
        App.on('minute', function () { if (App.current === 'news') render(); });
      }
      render();
    }
  });
})();
