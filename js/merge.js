/*
 * Merging progress from several devices (computer, phone browser, installed app).
 * Same rules as FRvc, so studying on two devices in any order, with any number of syncs in
 * between, never loses or double-counts anything:
 *
 *   cards     per drill type, the most recent answer wins (card.t).
 *   prog      per problem in progress (worked example, drill, review item), the most
 *             recent step wins (prog.t).
 *   lessons   per lesson, the most recent change wins; "mark as not learned" leaves a
 *             tombstone { del: true, t } so the other device's copy cannot bring it back.
 *   devlog    daily counts kept per device: devlog[day][device] = { solved, clean, lessons,
 *             steps, first, t }. A device only writes its own entry and its counters only
 *             grow, so merging keeps the newer entry per (day, device) and sums devices.
 *   devstat   per lesson accuracy, kept the same way: devstat[lesson][device] = { steps, first, t }.
 *   settings  the most recently saved settings win (settingsT).
 *   resetAt   "clear all progress" on any device removes everything older, everywhere.
 *
 * Pure functions over plain objects: see tests/merge.test.mjs.
 */

const time = e => (e && e.t) || 0;

export const liveKeys = obj => Object.keys(obj || {}).filter(k => obj[k] && !obj[k].del);

const COUNTS = ['solved', 'clean', 'lessons', 'steps', 'first'];

/* Sum per-device entries: { key: { dev: {counts…} } } → { key: {counts…} } */
export function sumDevices(perDev) {
  const out = {};
  for (const [key, devs] of Object.entries(perDev || {})) {
    const d = { solved: 0, clean: 0, lessons: 0, steps: 0, first: 0, done: false };
    for (const e of Object.values(devs || {})) {
      for (const c of COUNTS) d[c] += e[c] || 0;
      d.done = d.done || !!e.done;
    }
    out[key] = d;
  }
  return out;
}
export const aggregateLog = devlog => sumDevices(devlog);

function newer(x, y) {
  if (!x) return y;
  if (!y) return x;
  return time(y) > time(x) ? y : x;
}

function mergeKeyed(a = {}, b = {}, cutoff) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const v = newer(a[k], b[k]);
    if (v && time(v) >= cutoff) out[k] = v;
  }
  return out;
}

function mergeDevices(a = {}, b = {}, cutoff) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const da = a[key] || {};
    const db = b[key] || {};
    const merged = {};
    for (const dev of new Set([...Object.keys(da), ...Object.keys(db)])) {
      const v = newer(da[dev], db[dev]);
      if (v && time(v) >= cutoff) merged[dev] = v;
    }
    if (Object.keys(merged).length) out[key] = merged;
  }
  return out;
}

export function mergeState(a, b) {
  if (!b) return a;
  if (!a) return b;
  const resetAt = Math.max(a.resetAt || 0, b.resetAt || 0);
  const aSet = a.settingsT || 0;
  const bSet = b.settingsT || 0;
  const devlog = mergeDevices(a.devlog, b.devlog, resetAt);
  return {
    ...a,
    version: Math.max(a.version || 0, b.version || 0),
    resetAt,
    cards: mergeKeyed(a.cards, b.cards, resetAt),
    prog: mergeKeyed(a.prog, b.prog, resetAt),
    lessons: mergeKeyed(a.lessons, b.lessons, resetAt),
    devlog,
    devstat: mergeDevices(a.devstat, b.devstat, resetAt),
    log: aggregateLog(devlog),
    settings: bSet > aSet ? b.settings : a.settings,
    settingsT: Math.max(aSet, bSet),
  };
}

/* The part of the state that is synced (everything except derived bits). */
export function syncable(s) {
  return {
    version: s.version,
    resetAt: s.resetAt || 0,
    cards: s.cards || {},
    prog: s.prog || {},
    lessons: s.lessons || {},
    devlog: s.devlog || {},
    devstat: s.devstat || {},
    settings: s.settings,
    settingsT: s.settingsT || 0,
  };
}

/* Order-independent fingerprint, to skip uploads when nothing changed. */
export function fingerprint(s) {
  const sort = v => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v);
  return JSON.stringify(sort(syncable(s)));
}
