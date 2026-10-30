/*
 * Progress lives only in this browser (localStorage). Nothing is sent anywhere.
 * Export / import gives a JSON file to move progress between devices.
 */

const KEY = 'fm-notebook:v1';

export const DEFAULT_SETTINGS = {
  examDate: '2027-02-15', // an approximate date in the February 2027 sitting; editable
  reviewCap: 20,
  revealAfter: 2, // wrong tries on a step before "show me" appears
};

const empty = () => ({ version: 1, lessons: {}, cards: {}, log: {}, settings: { ...DEFAULT_SETTINGS } });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    return { ...empty(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
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
  return { ...empty(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
}

export const reset = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
  return empty();
};
