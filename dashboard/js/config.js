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

// Weather (Open-Meteo, no key). The first place gets the full tile; the rest show their current temp.
export var WEATHER = {
  places: [
    { name: 'Bellingham', lat: 48.75, lon: -122.48 },
    { name: 'Everson', lat: 48.92, lon: -122.34 }
  ],
  timezone: 'America/Los_Angeles'
};

// Countdowns: { date, label, emoji?, born? }. date is 'YYYY-MM-DD' (one-off) or 'MM-DD' (every
// year, e.g. birthdays). With born (birth year), {age} in the label becomes the age that day. Past one-offs drop off on their own. The next weekend at Dad's is added
// automatically from CUSTODY.
export var COUNTDOWNS = [
  { date: '10-30', label: 'Eliza turns {age}!', emoji: '🎂', born: 2017 },
  { date: '10-31', label: 'Halloween', emoji: '🎃' },
  { date: '2026-11-26', label: 'Thanksgiving', emoji: '🦃' },
  { date: '12-25', label: 'Christmas', emoji: '🎄' },
  { date: '01-01', label: "New Year's Day", emoji: '🎉' }
];
