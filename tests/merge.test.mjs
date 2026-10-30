import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeState, aggregateLog, sumDevices, liveKeys, fingerprint } from '../js/merge.js';
import { _migrate } from '../js/store.js';

const base = () => ({ version: 2, lessons: {}, cards: {}, prog: {}, devlog: {}, devstat: {}, settings: { reviewCap: 20 }, settingsT: 0 });

test('per drill, the most recent answer wins, in either order', () => {
  const pc = { ...base(), cards: { a: { box: 3, t: 100 }, b: { box: 1, t: 500 } } };
  const phone = { ...base(), cards: { a: { box: 4, t: 200 }, c: { box: 2, t: 50 } } };
  const m = mergeState(pc, phone);
  assert.deepEqual([m.cards.a.box, m.cards.b.box, m.cards.c.box], [4, 1, 2]);
  assert.deepEqual(mergeState(phone, pc).cards, m.cards);
});

test('a problem in progress resumes from the device that answered last', () => {
  const pc = { ...base(), prog: { 'ex/tvm-grow': { steps: [{ done: true }], t: 100 } } };
  const phone = { ...base(), prog: { 'ex/tvm-grow': { steps: [{ done: true }, { done: true }], t: 300 } } };
  assert.equal(mergeState(pc, phone).prog['ex/tvm-grow'].steps.length, 2);
});

test('daily counts and lesson accuracy add up across devices and never double count', () => {
  const pc = { ...base(), devlog: { d: { pc: { solved: 2, steps: 6, first: 5, t: 10 } } }, devstat: { L: { pc: { steps: 6, first: 5, t: 10 } } } };
  const phone = { ...base(), devlog: { d: { ph: { solved: 1, steps: 3, first: 1, t: 20 } } }, devstat: { L: { ph: { steps: 3, first: 1, t: 20 } } } };
  let m = mergeState(pc, phone);
  m = mergeState(mergeState(m, phone), pc);
  assert.equal(aggregateLog(m.devlog).d.steps, 9);
  assert.deepEqual([sumDevices(m.devstat).L.steps, sumDevices(m.devstat).L.first], [9, 6]);
  const phone2 = { ...base(), devlog: { d: { ph: { solved: 2, steps: 7, first: 4, t: 30 } } } };
  assert.equal(mergeState(m, phone2).log.d.steps, 13);
});

test('un-marking a lesson leaves a tombstone the other device cannot undo', () => {
  const pc = { ...base(), lessons: { a: { at: '2026-10-30', t: 100 }, b: { at: '2026-10-30', t: 100 } } };
  const phone = { ...base(), lessons: { a: { del: true, t: 200 } } };
  assert.deepEqual(liveKeys(mergeState(pc, phone).lessons), ['b']);
  assert.deepEqual(liveKeys(mergeState(phone, pc).lessons), ['b']);
});

test('latest settings win; a reset clears older progress everywhere', () => {
  const pc = { ...base(), settings: { reviewCap: 10 }, settingsT: 100, resetAt: 1000 };
  const phone = { ...base(), settings: { reviewCap: 30 }, settingsT: 200, cards: { a: { t: 500 }, b: { t: 1500 } } };
  const m = mergeState(pc, phone);
  assert.equal(m.settings.reviewCap, 30);
  assert.deepEqual(Object.keys(m.cards), ['b']);
});

test('fingerprint ignores key order and derived fields', () => {
  const a = { ...base(), cards: { a: { box: 1, t: 1 }, b: { box: 2, t: 2 } }, log: { x: 1 } };
  const b = { ...base(), cards: { b: { t: 2, box: 2 }, a: { t: 1, box: 1 } } };
  assert.equal(fingerprint(a), fingerprint(b));
});

test('progress saved by the first version is upgraded, not lost', () => {
  globalThis.localStorage = { getItem: () => 'dev1', setItem() {} };
  const old = { version: 1, lessons: { 'tvm-grow': '2026-10-30' }, cards: { x: { box: 1, last: '2026-10-30' } }, log: { '2026-10-30': { solved: 4, clean: 0, lessons: 1 } } };
  const m = _migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(m.lessons['tvm-grow'].at, '2026-10-30');
  assert.ok(m.cards.x.t > 0);
  assert.equal(m.devlog['2026-10-30'].dev1.solved, 4);
});
