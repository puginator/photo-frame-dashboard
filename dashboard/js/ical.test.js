import assert from 'node:assert/strict';
import { parseICS, LA_OFFSET_MIN } from './ical.js';

const W0 = Date.UTC(2026, 9, 1); // Oct 1 2026
const W1 = Date.UTC(2026, 11, 1); // Dec 1 2026

// LA offset: PDT in July, PST in December
assert.equal(LA_OFFSET_MIN(Date.UTC(2026, 6, 15)), 420);
assert.equal(LA_OFFSET_MIN(Date.UTC(2026, 11, 15)), 480);

// single timed event, UTC
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:a\r\nDTSTART:20261020T150000Z\r\nDTEND:20261020T160000Z\r\nSUMMARY:Dentist\r\nLOCATION:Bright Smiles\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.equal(out.length, 1);
  assert.equal(out[0].start, '2026-10-20T15:00:00.000Z');
  assert.equal(out[0].end, '2026-10-20T16:00:00.000Z');
  assert.equal(out[0].allDay, false);
  assert.equal(out[0].loc, 'Bright Smiles');
}

// all-day event spans into a same-day record
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:b\r\nDTSTART;VALUE=DATE:20261024\r\nDTEND;VALUE=DATE:20261025\r\nSUMMARY:Pajama Day\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.equal(out.length, 1);
  assert.equal(out[0].allDay, true);
  assert.equal(out[0].start, '2026-10-24T00:00:00.000Z');
}

// floating time = America/Los_Angeles (PDT in Oct: UTC-7)
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:c\r\nDTSTART:20261020T090000\r\nDTEND:20261020T100000\r\nSUMMARY:Gym\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.equal(out[0].start, '2026-10-20T16:00:00.000Z');
}

// TZID time: 9am PST in December = 17:00 UTC
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:d\r\nDTSTART;TZID=America/Los_Angeles:20261205T090000\r\nDTEND;TZID=America/Los_Angeles:20261205T100000\r\nSUMMARY:Swim\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, Date.UTC(2027, 0, 15));
  assert.equal(out[0].start, '2026-12-05T17:00:00.000Z');
}

// weekly recurrence with COUNT + EXDATE
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:e\r\nDTSTART:20261005T230000Z\r\nDTEND:20261006T003000Z\r\nRRULE:FREQ=WEEKLY;COUNT=4\r\nEXDATE:20261012T230000Z\r\nSUMMARY:Soccer\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.deepEqual(out.map((o) => o.start.slice(0, 10)), ['2026-10-05', '2026-10-19', '2026-10-26']);
}

// weekly BYDAY across two days
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:f\r\nDTSTART:20261005T140000Z\r\nDTEND:20261005T150000Z\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261014T140000Z\r\nSUMMARY:Piano\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.deepEqual(out.map((o) => o.start.slice(0, 10)), ['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14']);
}

// daily INTERVAL=2 with COUNT
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:g\r\nDTSTART;VALUE=DATE:20261020\r\nDTEND;VALUE=DATE:20261021\r\nRRULE:FREQ=DAILY;INTERVAL=2;COUNT=3\r\nSUMMARY:Med\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.deepEqual(out.map((o) => o.start.slice(0, 10)), ['2026-10-20', '2026-10-22', '2026-10-24']);
}

// cancelled + recurrence overrides + unknown TZID are skipped
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:h\r\nDTSTART:20261020T150000Z\r\nDTEND:20261020T160000Z\r\nSTATUS:CANCELLED\r\nSUMMARY:Gone\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:i\r\nDTSTART:20261020T150000Z\r\nDTEND:20261020T160000Z\r\nRECURRENCE-ID:20261020T150000Z\r\nSUMMARY:Override\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:j\r\nDTSTART;TZID=Europe/Paris:20261020T150000\r\nDTEND;TZID=Europe/Paris:20261020T160000\r\nSUMMARY:Paris\r\nEND:VEVENT\r\nEND:VCALENDAR';
  assert.equal(parseICS(ics, W0, W1).length, 0);
}

// folded lines + escaped commas
{
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:k\r\nDTSTART:20261020T150000Z\r\nDTEND:20261020T160000Z\r\nSUMMARY:Dinner at Nonna\\, bring cake\r\nDESCRIPTION:line one\r\n line two\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const out = parseICS(ics, W0, W1);
  assert.equal(out[0].title, 'Dinner at Nonna, bring cake');
}

console.log('ical: all checks pass');
