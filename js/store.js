/*
 * Progress is saved in this browser (localStorage) after every step, so a refresh or a
 * closed tab never loses anything. Optional sync to a private Gist lives in sync.js; the
 * merge rules are in merge.js. Export / import gives a JSON backup file.
 *
 *   lessons  { id: { at: 'YYYY-MM-DD', t } }        learned (or { del: true, t } when un-marked)
 *   cards    { drillId: { box, due, right, wrong, last, t } }   spaced-repetition schedule
 *   prog     { key: { seed?, steps: [...], done, t } }           problems in progress
 *   devlog   { day: { device: { solved, clean, lessons, steps, first, t } } }
 *   devstat  { lessonId: { device: { steps, first, t } } }       per-lesson accuracy
 */
import { aggregateLog } from './merge.js';

const KEY = 'fm-notebook:v1';
const VERSION = 2;

export const DEFAULT_SETTINGS = {
  examDate: '2027-02-15', // an approximate date in the February 2027 sitting; editable
  reviewCap: 20,
  revealAfter: 2, // wrong tries on a step before "show me" appears
};

const empty = () => ({ version: VERSION, lessons: {}, cards: {}, prog: {}, devlog: {}, devstat: {}, log: {}, settings: { ...DEFAULT_SETTINGS }, settingsT: 0, resetAt: 0 });

/* Each browser / installed app gets its own id, so counts can be kept per device. */
export function deviceId() {
  try {
    let id = localStorage.getItem('fm-notebook:device');
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem('fm-notebook:device', id);
    }
    return id;
  } catch (e) {
    return 'local';
  }
}

const noon = d => (d ? Date.parse(`${d}T12:00:00`) || 0 : 0);

/* v1 kept lessons as dates and one daily log per browser; add timestamps and devices. */
function migrate(data) {
  if ((data.version || 1) < 2) {
    const dev = deviceId();
    const lessons = {};
    for (const [id, v] of Object.entries(data.lessons || {})) lessons[id] = typeof v === 'string' ? { at: v, t: noon(v) } : v;
    data.lessons = lessons;
    data.devlog = {};
    for (const [day, e] of Object.entries(data.log || {})) data.devlog[day] = { [dev]: { solved: 0, clean: 0, lessons: 0, ...e, t: noon(day) } };
    for (const c of Object.values(data.cards || {})) c.t = c.t || noon(c.last);
    data.settingsT = data.settings ? 1 : 0;
  }
  data.version = VERSION;
  return data;
}

function complete(data) {
  const s = { ...empty(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
  s.log = aggregateLog(s.devlog);
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return complete(migrate(JSON.parse(raw)));
  } catch (e) {
    return empty();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fm-notebook-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importFile(file) {
  const data = JSON.parse(await file.text());
  if (!data || typeof data !== 'object' || !data.lessons || !data.cards) throw new Error('Not an FM Notebook progress file');
  return complete(migrate(data));
}

/* Clearing keeps a reset time, so a connected sync clears the other devices too. */
export const reset = () => ({ ...empty(), resetAt: Date.now() });

export { migrate as _migrate, empty as _empty };
