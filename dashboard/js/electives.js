// School electives for a day, from ELECTIVES in config.js. Shared by the Today tab and tests.

// Day count from local y/m/d (no DST drift), and the Monday that starts that week.
function dayNum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
function monday(n) { return n - ((new Date(n * 864e5).getUTCDay() + 6) % 7); }

// [{ kids: [...ids], name }] for each group with an elective that day.
export function electivesFor(groups, date) {
  var out = [];
  groups.forEach(function (g) {
    var e = g.days[date.getDay()];
    if (Array.isArray(e)) {
      var p = g.anchor.split('-');
      var weeks = (monday(dayNum(date)) - monday(dayNum(new Date(+p[0], p[1] - 1, +p[2])))) / 7;
      e = e[((weeks % e.length) + e.length) % e.length];
    }
    if (e) out.push({ kids: g.kids, name: e });
  });
  return out;
}
