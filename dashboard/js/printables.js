// Printables (docs: docs/printables.md). Pure helpers shared by worker.js, the Print tab and tests.
// One Wonder Desk pack a day, read straight from the wonder-desk R2 bucket
// (packs/cozy-v1/<topic>-<band>.pdf).
export var PACK_PREFIX = 'packs/cozy-v1/';
export var READING_PREFIX = 'reading/cozy-v1/'; // <topic>.json: { early, middle, teen } lesson text
export var BANDS = { early: 'Ages 7–9', middle: 'Ages 10–12', teen: 'Ages 13–15' };

// Bucket keys -> sorted topic ids. Every topic has an -early pack, so that is the index.
export function topicsFromKeys(keys) {
  return keys
    .filter((k) => k.startsWith(PACK_PREFIX) && k.endsWith('-early.pdf'))
    .map((k) => k.slice(PACK_PREFIX.length, -'-early.pdf'.length))
    .sort();
}

// Same topic for everyone all day; walks the catalog one topic per day.
export function topicOfDay(topics, day) {
  if (!topics.length) return null;
  const n = Math.floor(Date.parse(day + 'T00:00:00Z') / 864e5);
  return topics[((n % topics.length) + topics.length) % topics.length];
}

export function titleOf(topic) {
  return topic.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Wonder Desk reading bands: 7-9 early, 10-12 middle, 13+ teen. Younger kids get early.
export function bandFor(age) {
  if (!(age > 0)) return 'early';
  return age <= 9 ? 'early' : age <= 12 ? 'middle' : 'teen';
}
