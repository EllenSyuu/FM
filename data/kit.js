/*
 * Helpers for writing lessons and drills. Every lesson file in data/ uses only these, so the
 * content stays plain data plus small generator functions that the tests can run many times.
 *
 * A drill generator takes an rng and returns a problem:
 *   { text, timeline?, vars, steps: [step, …] }
 * Step kinds:
 *   choice(ask, options, {hint, why})   options: [[text, isRight, whyIfPicked?], …]
 *   expr(ask, {target, model, vars?, hint, why, unit})
 *       target: the number the answer must equal; model: a written set-up that gives it
 *       (the tests check model → target, so the shown solution can never drift from the key)
 *   place(ask, {n, answer:[t…], hint, why})   tap the dates on a timeline
 * Text may contain $…$ for inline maths (KaTeX) and **bold**.
 */

export function rng(seed = Date.now()) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export const shuffled = (r, arr) => {
  const b = [...arr];
  for (let k = b.length - 1; k > 0; k--) {
    const j = Math.floor(r() * (k + 1));
    [b[k], b[j]] = [b[j], b[k]];
  }
  return b;
};

/* Rates that read cleanly as percentages. */
export const RATES = [0.03, 0.04, 0.05, 0.06, 0.08, 0.1];
export const pct = x => `${+(x * 100).toFixed(4)}%`;
export const money = (x, dp = 2) =>
  Number.isFinite(x) ? x.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) : '∞';
export const round = (x, dp = 2) => Math.round(x * 10 ** dp) / 10 ** dp;

export const choice = (ask, options, extra = {}) => ({ kind: 'choice', ask, options: options.map(([text, ok, why]) => ({ text, ok: !!ok, why })), ...extra });
export const expr = (ask, o) => ({ kind: 'expr', unit: 'money', ...o, ask });
export const place = (ask, o) => ({ kind: 'place', ...o, ask });

/* Timeline spec for drawing: n ticks, flows [{t, amt}], focal date with a "?". */
export const tl = (n, flows, o = {}) => ({ n, flows, ...o });
export const flowsEvery = (from, to, amt, step = 1) => {
  const f = [];
  for (let t = from; t <= to + 1e-9; t += step) f.push({ t: +t.toFixed(4), amt });
  return f;
};

/* Plain closed forms, used to compute targets independently of the expression engine. */
export const v = i => 1 / (1 + i);
export const an = (n, i) => (1 - (1 + i) ** -n) / i;
export const sn = (n, i) => ((1 + i) ** n - 1) / i;
export const adn = (n, i) => an(n, i) * (1 + i);
export const sdn = (n, i) => sn(n, i) * (1 + i);
export const sumPV = (flows, i, at = 0) => flows.reduce((acc, f) => acc + f.amt * (1 + i) ** (at - f.t), 0);

/* Lesson-page blocks. Text may contain $…$ (inline maths) and **bold**. */
export const P = text => ({ type: 'p', text });
export const M = (tex, note) => ({ type: 'math', tex, note }); // display formula + 读法 / meaning
export const T = (spec, caption) => ({ type: 'timeline', spec, caption });
export const TERMS = rows => ({ type: 'terms', rows }); // [[english, 中文, one-line meaning], …]
export const TIP = text => ({ type: 'tip', text }); // margin note in the hand
export const TABLE = (head, rows) => ({ type: 'table', head, rows });
export const RECIPE = (title, items) => ({ type: 'recipe', title, items }); // numbered method
export const G = (spec, caption) => ({ type: 'growth', spec, caption }); // animated growth curves with a time slider
