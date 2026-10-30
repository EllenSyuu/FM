/*
 * Spaced repetition: a Leitner schedule, the method behind paper flash-card boxes,
 * applied to drills: each drill is a kind of problem, asked with fresh numbers every time.
 *
 * Each drill sits in a box 0–7. A clean solve (no answer revealed) moves it up one box and
 * pushes the next review out (1, 2, 4, 7, 15, 30, 60 days); a solve that needed the answer
 * shown sends it back to box 1, due tomorrow. Box 5 and above counts as learned.
 * Pure functions over plain objects so they are easy to test.
 */

export const INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60];
export const LEARNED_BOX = 5;
export const MAX_BOX = INTERVALS.length - 1;

export const dayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

export const daysBetween = (a, b) => {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

export const fresh = () => ({ box: 0, due: null, right: 0, wrong: 0, last: null });

/* Grade one answer. Returns a new card state. */
export function grade(card, ok, today = dayKey()) {
  const c = { ...fresh(), ...card };
  if (ok) {
    c.box = Math.min(MAX_BOX, c.box + 1);
    c.right += 1;
  } else {
    c.box = 1;
    c.wrong += 1;
  }
  c.due = addDays(today, INTERVALS[c.box]);
  c.last = today;
  c.t = Date.now(); // for merging devices: the most recent answer wins
  return c;
}

export const isDue = (card, today = dayKey()) => !!card && !!card.due && card.due <= today;
export const isNew = card => !card || !card.last;
export const isLearned = card => !!card && card.box >= LEARNED_BOX;

/* Every drill that is due today, oldest first, capped. */
export function dueToday(ids, cards, { cap = 30, today = dayKey() } = {}) {
  return ids
    .filter(id => isDue(cards[id], today))
    .sort((a, b) => (cards[a].due < cards[b].due ? -1 : cards[a].due > cards[b].due ? 1 : 0))
    .slice(0, cap);
}

/* Consecutive days with any study (a drill solved or a lesson learned), counting back from today (or yesterday if today is empty). */
export function streak(log, today = dayKey()) {
  let d = log[today] ? today : addDays(today, -1);
  let n = 0;
  while (log[d] && (log[d].solved || 0) + (log[d].lessons || 0) > 0) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}
