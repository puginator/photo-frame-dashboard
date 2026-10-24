// Would You Rather votes: today's tally, kept on the frame (localStorage). Only the frame votes,
// so there is nothing to sync; a new day starts from zero.
// ponytail: frame-only; move to Worker + KV if phones should vote or see the tally too.

// saved: { day: 'YYYY-MM-DD', a, b } or null. Returns today's { a, b }.
export function tally(saved, day) {
  return saved && saved.day === day ? { a: saved.a, b: saved.b } : { a: 0, b: 0 };
}

export function addVote(saved, day, side) {
  var t = tally(saved, day);
  t[side]++;
  return { day: day, a: t.a, b: t.b };
}

// "3 votes · 60%"; "Tap to vote" before anyone has.
export function label(t, side) {
  var total = t.a + t.b, n = t[side];
  if (!total) return 'Tap to vote';
  return n + (n === 1 ? ' vote' : ' votes') + ' · ' + Math.round(n / total * 100) + '%';
}
