import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studyPlan, REVIEW_DAYS } from '../js/plan.js';
import { grade, dueToday } from '../js/srs.js';

test('pace leaves the last weeks for review', () => {
  const ids = Array.from({ length: 30 }, (_, k) => `l${k}`);
  const p = studyPlan({ lessonIds: ids, learned: {}, today: '2026-10-30', examDate: '2027-02-15' });
  assert.equal(p.left, 30);
  assert.equal(p.next, 'l0');
  const studyWeeks = (p.daysLeft - REVIEW_DAYS) / 7;
  assert.ok(p.perWeek * studyWeeks >= 30, 'pace finishes before the review period');
});

test('a clean solve moves a drill up; a revealed one goes back to box 1', () => {
  let c = grade(undefined, true, '2026-10-30');
  assert.equal(c.box, 1);
  assert.equal(c.due, '2026-10-31');
  c = grade(c, true, '2026-10-31');
  assert.equal(c.due, '2026-11-02');
  c = grade(c, false, '2026-11-02');
  assert.equal(c.box, 1);
  assert.deepEqual(dueToday(['a'], { a: c }, { today: '2026-11-03' }), ['a']);
});

import { streak } from '../js/srs.js';
test('streak counts days with a solved drill or a learned lesson', () => {
  const log = { '2026-10-28': { solved: 3 }, '2026-10-29': { solved: 0, lessons: 1 }, '2026-10-30': { solved: 2 } };
  assert.equal(streak(log, '2026-10-30'), 3);
  assert.equal(streak(log, '2026-10-31'), 3);
  assert.equal(streak({}, '2026-10-30'), 0);
});
