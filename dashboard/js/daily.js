// Pick one item per local day, stable all day, changing at midnight. Counting whole days (not day
// of year) keeps it continuous across New Year's; stepping by STRIDE spreads out neighbours in the
// list (e.g. two elephant facts in a row) so they never land on back-to-back days.
var STRIDE = 37; // prime: visits every item once per cycle unless the list length is a multiple of 37

function dayNum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }

export function pickDaily(list, date) {
  return list[(dayNum(date) * STRIDE) % list.length];
}
