// Family config: edit dates and rules here, not in view code.

// Custody: who the girls are with each night. Weeks start on Sunday.
export var CUSTODY = {
  names: { dad: 'Dad', mom: 'Mom' },
  // Nights by weekday, Sun..Fri. Saturday alternates (dadWeekend below).
  nights: ['mom', 'mom', 'mom', 'dad', 'dad', 'dad'],
  // Any Saturday that is a Dad weekend; every other Saturday after (and before) it is a Mom weekend.
  // On a Mom weekend Dad has Saturday morning and Mom takes over at handoffHour[6].
  dadWeekend: '2026-10-24',
  // Hour (24h, 13.5 = 1:30 PM) the girls change houses on a handoff day, by weekday Sun..Sat.
  // Sun: 1:30 PM back to Mom after a Dad weekend. Wed: Mom morning, Dad afternoon. Sat: midday.
  handoffHour: [13.5, 8, 8, 15, 8, 8, 12],
  // One-off overrides: who has them that night, plus a note shown on the tile.
  exceptions: [
    { date: '2026-10-25', night: 'dad', note: 'Swapped weekend' },
    { date: '2026-11-26', night: 'dad', note: 'Thanksgiving: split day' }
  ]
};
