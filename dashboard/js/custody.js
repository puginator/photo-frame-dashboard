// Who has the girls: a pure function of the time and CUSTODY (js/config.js). No DOM, so Node can test it.

function day(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
// Whole days since the epoch, immune to DST shifts.
function dayNum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
function parse(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }

function exception(d, cfg) {
  var key = ymd(d);
  return cfg.exceptions.filter(function (x) { return x.date === key; })[0];
}

// true when the Saturday `sat` starts a Dad weekend.
export function isDadWeekend(sat, cfg) {
  var weeks = (dayNum(sat) - dayNum(parse(cfg.dadWeekend))) / 7;
  return Math.abs(weeks) % 2 === 0;
}

// The next Saturday on or after `from` that starts a Dad weekend (used by countdowns, #7).
export function nextDadWeekend(from, cfg) {
  var sat = addDays(day(from), (6 - from.getDay() + 7) % 7);
  return isDadWeekend(sat, cfg) ? sat : addDays(sat, 7);
}

// 'dad' | 'mom' for the night of date d.
export function nightOf(d, cfg) {
  var ex = exception(d, cfg);
  if (ex) return ex.night;
  return d.getDay() === 6 ? (isDadWeekend(d, cfg) ? 'dad' : 'mom') : cfg.nights[d.getDay()];
}

function at(h) { return h === 12 ? 'at noon' : h < 12 ? 'in the morning' : 'in the afternoon'; }

// Given a Date, return { tonight, detail, tomorrow: { tonight, detail } }.
export function custody(now, cfg) {
  var N = cfg.names;
  var today = day(now), tmw = addDays(today, 1);
  var t = nightOf(today, cfg), y = nightOf(addDays(today, -1), cfg), m = nightOf(tmw, cfg);
  var h = cfg.handoffHour[today.getDay()], hm = cfg.handoffHour[tmw.getDay()];
  var exT = exception(today, cfg), exM = exception(tmw, cfg);

  var detail;
  if (y !== t && now.getHours() < h) detail = 'With ' + N[y] + ' now. ' + N[t] + ' picks you up ' + at(h).replace('in the', 'this') + '.';
  else if (m !== t) detail = 'Back with ' + N[m] + ' tomorrow ' + at(hm).replace('in the ', '') + '.';
  else detail = 'With ' + N[t] + ' tomorrow night too.';
  if (exT) detail = exT.note + '. ' + detail;

  var tDetail = m === t ? 'With ' + N[m] + ' all day'
    : N[t] + (hm === 12 ? ' until noon' : hm < 12 ? ' in the morning' : ' until the afternoon') + ', then ' + N[m];
  if (exM) tDetail = exM.note + ', ' + N[m] + ' at night'; // the rule's "all day" may not hold on an exception

  return { tonight: t, detail: detail, tomorrow: { tonight: m, detail: tDetail } };
}
