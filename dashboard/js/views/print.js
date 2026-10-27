// Print tab: today's Wonder Desk printable for the girls, emailed to the printer by the Worker
// (docs/printables.md).
import { PRINTABLES } from '../config.js';
import { BANDS, bandFor } from '../printables.js';

(function () {
  'use strict';
  var V = { el: null, pack: null, failed: false, kid: PRINTABLES.kids[0].id, band: null, busy: false };

  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dateLabel() { var n = App.now(); return App.fmt.day(n) + ', ' + App.fmt.month(n) + ' ' + n.getDate(); }
  function defaultBand(id) {
    var k = PRINTABLES.kids.filter(function (x) { return x.id === id; })[0];
    return bandFor(k && k.born ? App.now().getFullYear() - k.born : 0);
  }

  function load() {
    var day = ymd(App.now());
    if (V.pack && V.pack.date === day) return;
    fetch('/api/printables?date=' + day, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (p) { V.pack = p; V.failed = !p; })
      // Also lands here under plain `npm run dev`, which has no Worker: /api answers with index.html.
      .catch(function () { V.failed = true; })
      .then(function () { if (App.current === 'print') render(); });
  }

  function send(body, done) {
    if (V.busy) return;
    V.busy = true;
    render();
    fetch('/api/print', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (r.status === 429) throw new Error('That’s enough printing for today');
        if (r.status === 503) throw new Error('Printer isn’t set up yet');
        if (!r.ok) throw new Error('Couldn’t print (' + r.status + ')');
        App.toast(done, { icon: 'check' });
      })
      .catch(function (e) { App.toast(App.esc(e.message || 'Couldn’t reach the printer'), { tone: 'error' }); })
      .then(function () { setTimeout(function () { V.busy = false; if (App.current === 'print') render(); }, 3000); });
  }

  // The lesson text the girls can read on the frame; null until the reading export is uploaded.
  function lesson(p, band) { return p.reading && p.reading[band]; }

  function readingPane(r) {
    var x = App.esc;
    return '<div class="pr-read">' +
      '<div class="label">' + x(r.kicker) + '</div>' +
      '<h2 class="serif">' + x(r.title) + '</h2>' +
      '<h3>' + x(r.headline) + '</h3>' +
      '<p class="pr-article">' + x(r.body) + '</p>' +
      '<div class="pr-factbox">' + x(r.factBox) + '</div>' +
      '<div class="pr-facts">' + r.facts.map(function (f) {
        return '<div class="pr-fact"><b>' + x(f.title) + '</b><span>' + x(f.body) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="pr-do"><div class="label">Try this</div><p>' + x(r.tryThis) + '</p></div>' +
      '<div class="pr-do"><div class="label">Mission</div><p>' + x(r.mission) + '</p></div>' +
      '<div class="pr-fun"><div class="label">Joke</div><p>' + x(r.joke) + '</p></div>' +
      '<div class="pr-fun"><div class="label">Riddle</div><p>' + x(r.riddle.prompt) + '</p>' +
        '<button class="chip pr-answer" data-answer>Tap for the answer</button>' +
        '<p class="pr-reveal">' + x(r.riddle.answer) + '</p></div>' +
      '</div>';
  }

  function kidsCard() {
    var p = V.pack;
    if (!p) {
      return '<section class="card pr-kids pr-kids--empty"><div class="s-empty serif">' +
        (V.failed ? 'Couldn’t load today’s printable.' : 'Finding today’s printable…') + '</div>' +
        (V.failed ? '<button class="btn pr-go" data-retry>Try again</button>' : '') + '</section>';
    }
    var band = V.band || defaultBand(V.kid), r = lesson(p, band);
    return '<section class="card pr-kids">' +
      '<div class="pr-side">' +
        '<img class="pr-art" alt="" src="' + App.esc(PRINTABLES.wonderUrl + '/art/cozy-v1/' + p.topic + '.png') + '">' +
        '<div class="chips">' + PRINTABLES.kids.map(function (k) {
          var person = App.person(k.id);
          return '<button class="chip' + (k.id === V.kid ? ' is-on' : '') + '" data-kid="' + k.id + '">' + App.esc(person.name) + '</button>';
        }).join('') + '</div>' +
        '<div class="seg">' + Object.keys(BANDS).map(function (b) {
          return '<button class="' + (b === band ? 'is-on' : '') + '" data-band="' + b + '">' + BANDS[b] + '</button>';
        }).join('') + '</div>' +
        (p.ready
          ? '<button class="btn btn--solid pr-go" data-print="kids"' + (V.busy ? ' disabled' : '') + '>' + App.icon('printer', 24) + (V.busy ? 'Sending…' : 'Print it') + '</button>'
          : '<p class="pr-off">Printer isn’t set up yet. See docs/printables.md.</p>') +
      '</div>' +
      (r ? readingPane(r)
        : '<div class="pr-read"><div class="label">The Wonder Desk · today</div><h2 class="serif">' + App.esc(p.title) + '</h2></div>') +
      '</section>';
  }

  function render() {
    V.el.innerHTML = '<div class="pr">' +
      '<header class="n-top"><div><div class="label">The Wonder Desk · today</div><h1 class="serif">Read &amp; print</h1></div>' +
      '<div class="label">' + dateLabel() + '</div></header>' +
      kidsCard() + '</div>';
  }

  function onTap(e) {
    var t = e.target.closest('[data-kid],[data-band],[data-print],[data-retry],[data-answer]');
    if (!t) return;
    // Reveal in place: a re-render would jump the reading pane back to the top.
    if (t.hasAttribute('data-answer')) { t.parentNode.classList.add('is-revealed'); return; }
    if (t.hasAttribute('data-retry')) { V.failed = false; render(); load(); return; }
    if (t.dataset.kid) { V.kid = t.dataset.kid; V.band = null; render(); return; }
    if (t.dataset.band) { V.band = t.dataset.band; render(); return; }
    if (t.dataset.print === 'kids' && V.pack) {
      var band = V.band || defaultBand(V.kid), r = lesson(V.pack, band);
      send({ topic: V.pack.topic, band: band }, 'Sent to the printer! ' + App.esc(r ? r.title : V.pack.title));
    }
  }

  App.register('print', {
    show: function (el) {
      if (!V.el) {
        V.el = el;
        el.addEventListener('click', onTap);
        App.on('data', function () { if (App.current === 'print') render(); });
        App.on('minute', function () { if (App.current === 'print') load(); });
      }
      load();
      render();
    }
  });
})();
