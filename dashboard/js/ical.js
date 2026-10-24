// Minimal ICS parser for Google Calendar secret feeds. Shared by worker.js and tests.
// Handles: VEVENT with DTSTART/DTEND (DATE, UTC, floating, America/Los_Angeles TZID),
// SUMMARY, LOCATION, STATUS, RRULE (DAILY/WEEKLY + INTERVAL/COUNT/UNTIL/BYDAY), EXDATE.
// RECURRENCE-ID overrides are ignored (the base series stands). Anything fancier is skipped.
const DAY_MS = 86400000;
const DOW = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };

// US daylight time: 2nd Sunday of March 02:00 local -> 1st Sunday of November 02:00 local.
function nthSunday(year, month, n) {
  const d = new Date(Date.UTC(year, month, 1));
  const first = (7 - d.getUTCDay()) % 7 + 1 + (n - 1) * 7;
  return first;
}
// Offset of America/Los_Angeles behind UTC, in minutes, for a given UTC instant.
function laOffsetMin(utcMs) {
  const d = new Date(utcMs);
  const y = d.getUTCFullYear();
  // DST starts 2nd Sun Mar 10:00 UTC, ends 1st Sun Nov 09:00 UTC.
  const start = Date.UTC(y, 2, nthSunday(y, 2, 2), 10);
  const end = Date.UTC(y, 10, nthSunday(y, 10, 1), 9);
  return utcMs >= start && utcMs < end ? 420 : 480;
}
// "YYYYMMDDTHHMMSS" in America/Los_Angeles -> epoch ms.
function laToUtc(y, mo, d, h, mi, s) {
  let guess = Date.UTC(y, mo - 1, d, h, mi, s);
  for (let i = 0; i < 2; i++) guess = Date.UTC(y, mo - 1, d, h, mi, s) + laOffsetMin(guess) * 60000;
  return guess;
}

function parseDate(value, params) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const Y = +m[1], Mo = +m[2], D = +m[3];
  if (!m[4]) return { ms: Date.UTC(Y, Mo - 1, D), allDay: true };
  const h = +m[4], mi = +m[5], s = +(m[6] || 0);
  if (m[7]) return { ms: Date.UTC(Y, Mo - 1, D, h, mi, s), allDay: false };
  const tz = params.TZID;
  if (!tz || tz === 'America/Los_Angeles') return { ms: laToUtc(Y, Mo, D, h, mi, s), allDay: false };
  return null; // unknown TZID: skip rather than show at the wrong hour
}

function parseParams(left) {
  const params = {};
  left.split(';').slice(1).forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) params[p.slice(0, i)] = p.slice(i + 1);
  });
  return params;
}

function unescapeText(s) {
  return s.replace(/\\([\\;,nN])/g, (m, c) => (c === 'n' || c === 'N' ? '\n' : c));
}

function parseRrule(s) {
  const r = {};
  s.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) r[p.slice(0, i)] = p.slice(i + 1);
  });
  return r;
}

function expandWeekly(startMs, durMs, rrule, exSet, winStart, winEnd) {
  const out = [];
  const interval = Math.max(1, parseInt(rrule.INTERVAL || '1', 10));
  const count = rrule.COUNT ? parseInt(rrule.COUNT, 10) : Infinity;
  const until = rrule.UNTIL ? parseDate(rrule.UNTIL, {}) : null;
  const untilMs = until ? until.ms + (until.allDay ? DAY_MS - 1 : 0) : Infinity;
  let byDays = (rrule.BYDAY || '').split(',').map((d) => DOW[d]).filter((d) => d !== undefined);
  if (!byDays.length) byDays = [new Date(startMs).getDay()];
  // Anchor weeks on the week containing DTSTART (Monday-based).
  const start = new Date(startMs);
  const anchor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const anchorDow = (new Date(anchor).getUTCDay() + 6) % 7;
  const weekMs = 7 * DAY_MS;
  const timeOfDay = startMs - anchor;
  let n = 0;
  for (let w = 0; w < 520 && n < count; w += interval) {
    const weekBase = anchor - anchorDow * DAY_MS + w * weekMs;
    for (const dow of byDays) {
      const occ = weekBase + ((dow + 6) % 7) * DAY_MS + timeOfDay;
      if (occ < startMs) continue;
      if (occ > untilMs) return out;
      if (++n > count) return out;
      if (occ >= winStart && occ < winEnd && !exSet.has(occ)) out.push(occ);
    }
  }
  return out;
}

function expandDaily(startMs, rrule, exSet, winStart, winEnd) {
  const out = [];
  const interval = Math.max(1, parseInt(rrule.INTERVAL || '1', 10));
  const count = rrule.COUNT ? parseInt(rrule.COUNT, 10) : Infinity;
  const until = rrule.UNTIL ? parseDate(rrule.UNTIL, {}) : null;
  const untilMs = until ? until.ms + (until.allDay ? DAY_MS - 1 : 0) : Infinity;
  for (let i = 0, occ = startMs; i < count && occ <= untilMs && occ < winEnd; i++, occ = startMs + i * interval * DAY_MS) {
    if (occ >= winStart && !exSet.has(occ)) out.push(occ);
  }
  return out;
}

// ics text + window (epoch ms) -> [{ uid, title, start, end, allDay, loc }]
export function parseICS(ics, winStart, winEnd) {
  const lines = ics.replace(/\r\n?/g, '\n').split('\n');
  const unfolded = [];
  for (const line of lines) {
    if ((line[0] === ' ' || line[0] === '\t') && unfolded.length) unfolded[unfolded.length - 1] += line.slice(1);
    else unfolded.push(line);
  }
  const events = [];
  let cur = null;
  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') { cur = { exdates: [] }; continue; }
    if (line === 'END:VEVENT') {
      if (cur && cur.start && cur.end) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const ci = line.indexOf(':');
    if (ci < 0) continue;
    const left = line.slice(0, ci), value = line.slice(ci + 1);
    const name = left.split(';')[0], params = parseParams(left);
    if (name === 'UID') cur.uid = value;
    else if (name === 'SUMMARY') cur.title = unescapeText(value);
    else if (name === 'LOCATION') cur.loc = unescapeText(value);
    else if (name === 'STATUS' && value === 'CANCELLED') cur.cancelled = true;
    else if (name === 'RECURRENCE-ID') cur.recurrence = true;
    else if (name === 'DTSTART') { const p = parseDate(value, params); if (p) { cur.start = p.ms; cur.allDay = p.allDay; } }
    else if (name === 'DTEND') { const p = parseDate(value, params); if (p) cur.end = p.ms; }
    else if (name === 'DURATION') cur.duration = value;
    else if (name === 'RRULE') cur.rrule = parseRrule(value);
    else if (name === 'EXDATE') {
      value.split(',').forEach((v) => { const p = parseDate(v, params); if (p) cur.exdates.push(p.ms); });
    }
  }
  const out = [];
  for (const e of events) {
    if (e.cancelled || e.recurrence || !e.title) continue;
    if (e.end == null && e.start != null) e.end = e.start + (e.allDay ? DAY_MS : 3600000);
    const durMs = e.end - e.start;
    const exSet = new Set(e.exdates);
    let occs = [e.start];
    if (e.rrule && (e.rrule.FREQ === 'WEEKLY' || e.rrule.FREQ === 'DAILY')) {
      occs = e.rrule.FREQ === 'WEEKLY'
        ? expandWeekly(e.start, durMs, e.rrule, exSet, winStart, winEnd)
        : expandDaily(e.start, e.rrule, exSet, winStart, winEnd);
    } else if (e.rrule) {
      occs = e.start >= winStart && e.start < winEnd && !exSet.has(e.start) ? [e.start] : [];
    } else if (e.start < winStart || e.start >= winEnd || exSet.has(e.start)) {
      occs = [];
    }
    for (const occ of occs) {
      out.push({ uid: e.uid, title: e.title, start: new Date(occ).toISOString(), end: new Date(occ + durMs).toISOString(), allDay: !!e.allDay, loc: e.loc || '' });
    }
  }
  out.sort((a, b) => (a.start < b.start ? -1 : 1));
  return out;
}

export const LA_OFFSET_MIN = laOffsetMin; // exported for tests
