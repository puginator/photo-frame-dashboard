// Countdowns: the next few dates from COUNTDOWNS plus the next weekend at Dad's (from custody.js).
import { nextDadWeekend } from './custody.js';

function dayNum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }

// Next occurrence on or after today: 'YYYY-MM-DD' as is, 'MM-DD' this year or next.
function occurrence(s, today) {
  var p = s.split('-');
  if (p.length === 3) return new Date(+p[0], p[1] - 1, +p[2]);
  var d = new Date(today.getFullYear(), p[0] - 1, +p[1]);
  return d < today ? new Date(today.getFullYear() + 1, p[0] - 1, +p[1]) : d;
}

export function when(days) { return days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days'; }

// [{ label, emoji, days }] sorted soonest first, past dates dropped, at most `count`.
export function upcoming(now, list, custody, count) {
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var all = list.map(function (c) {
    var on = occurrence(c.date, today);
    return { label: c.born ? c.label.replace('{age}', on.getFullYear() - c.born) : c.label, emoji: c.emoji || '', days: dayNum(on) - dayNum(today) };
  });
  if (custody) all.push({ label: 'Weekend at ' + custody.names.dad + '’s', emoji: '🏡', days: dayNum(nextDadWeekend(today, custody)) - dayNum(today) });
  return all.filter(function (c) { return c.days >= 0; })
    .sort(function (a, b) { return a.days - b.days; })
    .slice(0, count || 3);
}
