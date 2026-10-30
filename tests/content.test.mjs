// Every lesson, worked example and drill is generated many times with different seeds, and
// every shown solution is checked against its answer key — so no lesson can teach a wrong number.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, LESSONS, DRILLS } from '../data/syllabus.js';
import { rng } from '../data/kit.js';
import { evaluate, sameValue, toTex } from '../js/expr.js';

const SEEDS = 40;

function checkProblem(p, where) {
  assert.ok(p && typeof p.text === 'string' && p.text.length > 4, `${where}: needs text`);
  assert.ok(Array.isArray(p.steps) && p.steps.length > 0, `${where}: needs steps`);
  for (const [k, s] of p.steps.entries()) {
    const at = `${where} step ${k + 1}`;
    assert.ok(typeof s.ask === 'string' && s.ask.length, `${at}: needs ask`);
    if (s.kind === 'choice') {
      const right = s.options.filter(o => o.ok).length;
      assert.equal(right, 1, `${at}: exactly one right option`);
      const texts = s.options.map(o => o.text);
      assert.equal(new Set(texts).size, texts.length, `${at}: duplicate options ${texts}`);
    } else if (s.kind === 'expr') {
      assert.ok(Number.isFinite(s.target), `${at}: target must be a finite number (got ${s.target})`);
      const vars = { ...(p.vars || {}), ...(s.vars || {}) };
      const got = evaluate(s.model, vars);
      assert.ok(sameValue(got, s.target, 1e-7), `${at}: model "${s.model}" = ${got}, target ${s.target}`);
      toTex(s.model);
      assert.ok(['money', 'rate', 'number'].includes(s.unit), `${at}: unit`);
    } else if (s.kind === 'place') {
      assert.ok(Number.isInteger(s.n) && s.n > 1, `${at}: n`);
      assert.ok(s.answer.length && s.answer.every(t => t >= 0 && t <= s.n - 1), `${at}: answer within 0..n-1`);
    } else assert.fail(`${at}: unknown kind ${s.kind}`);
  }
  if (p.timeline) {
    const { n, flows } = p.timeline;
    assert.ok(n >= 1 && n <= 40, `${where}: timeline length`);
    for (const f of flows) assert.ok(f.t >= 0 && f.t <= n, `${where}: flow at ${f.t} outside 0..${n}`);
  }
}

test('ids are unique', () => {
  const ids = [...TOPICS.map(t => t.id), ...LESSONS.map(l => l.id), ...DRILLS.map(d => d.id)];
  assert.equal(new Set(ids).size, ids.length);
});

for (const l of LESSONS) {
  test(`lesson ${l.id}`, () => {
    assert.ok(l.learn.length >= 3, 'lesson needs a real explanation');
    for (const b of l.learn.filter(x => x.type === 'growth')) {
      const { n, curves } = b.spec;
      for (let k = 0; k <= 200; k++) for (const c of curves) assert.ok(Number.isFinite(c.f((k * n) / 200)), `${l.id}: growth curve ${c.label} at t=${(k * n) / 200}`);
    }
    assert.ok(l.drills.length >= 2, 'lesson needs at least two drills');
    checkProblem(l.example(rng(7)), `${l.id} example`);
    for (const d of l.drills) for (let s = 1; s <= SEEDS; s++) checkProblem(d.gen(rng(s)), `${d.id} seed ${s}`);
  });
}
