// Pick one item per local day, stable all day, changing at midnight. Counting whole days (not day
// of year) keeps it continuous across New Year's; stepping by STRIDE spreads out neighbours in the
// list (e.g. two elephant facts in a row) so they never land on back-to-back days.
var STRIDE = 37; // prime: visits every item once per cycle unless the list length is a multiple of 37

function dayNum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }

export function pickDaily(list, date) {
  return list[(dayNum(date) * STRIDE) % list.length];
}

// Would You Rather (js/would-you-rather.js): the app's dated question on its MM-DD (holidays),
// otherwise a daily rotation through every question, nudged one step if it would repeat a
// neighbouring day's dated question.
function md(d) { return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

export function wyrOfDay(data, date) {
  var dated = data.dated[md(date)];
  if (dated != null) return data.all[dated];
  var n = data.all.length, i = (dayNum(date) * STRIDE) % n;
  var y = data.dated[md(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))];
  var t = data.dated[md(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))];
  if (i === y || i === t) i = (i + 1) % n;
  return data.all[i];
}
