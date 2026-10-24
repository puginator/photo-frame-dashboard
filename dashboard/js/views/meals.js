// Meals: tonight's dinner hero + the rest of the week. Edit the plan in js/data.js.
(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null };

  function byDay(day) {
    return D.meals.filter(function (m) { return m.day === day; })[0] || { name: '—', side: '', cook: '' };
  }
  function order() {
    var today = App.now().getDay(), out = [];
    for (var i = 0; i < 7; i++) out.push((today + i) % 7);
    return out;
  }
  function dayName(day, i) {
    if (i === 0) return 'Tonight';
    if (i === 1) return 'Tomorrow';
    return App.fmt.day(new Date(2026, 5, 7 + day)); // 2026-06-07 was a Sunday; weekday only
  }

  function hero(m) {
    return '<section class="m-hero">' +
      '<div class="label">Tonight · ' + App.esc(m.cook) + ' cooks</div>' +
      '<h2 class="serif">' + App.esc(m.name) + '</h2>' +
      (m.side ? '<p>' + App.esc(m.side) + '</p>' : '') +
      '</section>';
  }
  function dayCard(day, i) {
    var m = byDay(day);
    return '<div class="m-day' + (i === 0 ? ' is-today' : '') + '">' +
      '<span class="label">' + dayName(day, i) + '</span>' +
      '<b>' + App.esc(m.name) + '</b>' +
      '<small>' + App.esc(m.cook) + '</small>' +
      '</div>';
  }

  function render() {
    var days = order();
    V.el.innerHTML = '<div class="meals">' +
      '<header class="m-top"><div><div class="label">Dinner plan</div><h1 class="serif">Meals</h1></div></header>' +
      hero(byDay(days[0])) +
      '<div class="m-grid">' + days.slice(1).map(function (d, i) { return dayCard(d, i + 1); }).join('') + '</div>' +
      '</div>';
  }

  App.register('meals', {
    show: function (el) {
      if (!V.el) V.el = el;
      render();
    }
  });
  App.on('time', function () { if (V.el && App.current === 'meals') render(); });
})();
