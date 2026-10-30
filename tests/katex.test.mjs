// Every piece of maths a learner can see — lesson formulas, inline $…$ in any text, option
// labels, and the TeX of every model answer — must render in KaTeX without an error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LESSONS } from '../data/syllabus.js';
import { rng } from '../data/kit.js';
import { toTex } from '../js/expr.js';

// The vendored browser build is UMD; load it the way a <script> would, without a bundler.
const katex = (() => {
  const module = { exports: {} };
  new Function('module', 'exports', readFileSync(new URL('../vendor/katex/katex.min.js', import.meta.url), 'utf8'))(module, module.exports);
  return module.exports.default || module.exports;
})();
const fix = t => t.replace(/\\angl\{\\infty\}/g, '\\angl{∞}');
const render = (tex, where) => {
  try {
    katex.renderToString(fix(tex), { throwOnError: true, strict: 'ignore' });
  } catch (e) {
    assert.fail(`${where}: ${e.message}\n  ${tex}`);
  }
};
const inline = (s, where) => {
  const parts = String(s ?? '').split(/(\$[^$]+\$)/g);
  const dollars = (String(s ?? '').match(/\$/g) || []).length;
  assert.equal(dollars % 2, 0, `${where}: unbalanced $ in “${s}”`);
  for (const p of parts) if (p.length > 2 && p[0] === '$' && p.endsWith('$')) render(p.slice(1, -1), where);
};
const problem = (p, where) => {
  inline(p.text, where);
  p.steps.forEach((s, k) => {
    const at = `${where} step ${k + 1}`;
    inline(s.ask, at);
    inline(s.hint, at);
    inline(s.why, at);
    if (s.options) s.options.forEach(o => (inline(o.text, at), inline(o.why, at)));
    if (s.model) render(toTex(s.model), `${at} model`);
  });
  if (p.timeline) for (const f of p.timeline.flows) assert.ok(!String(f.amt).includes('$'), `${where}: timeline labels are plain text`);
};

for (const l of LESSONS) {
  test(`maths renders: ${l.id}`, () => {
    inline(l.zh, l.id);
    for (const b of l.learn) {
      if (b.type === 'math') render(b.tex, `${l.id} formula`), inline(b.note, `${l.id} note`);
      if (b.type === 'p' || b.type === 'tip') inline(b.text, l.id);
      if (b.type === 'timeline' || b.type === 'growth') inline(b.caption, l.id);
      if (b.type === 'terms') b.rows.flat().forEach(c => inline(c, l.id));
      if (b.type === 'table') [b.head, ...b.rows].flat().forEach(c => inline(c, l.id));
      if (b.type === 'recipe') [b.title, ...b.items].forEach(c => inline(c, l.id));
    }
    problem(l.example(rng(7)), `${l.id} example`);
    for (const d of l.drills) {
      inline(d.zh, d.id);
      for (let s = 1; s <= 12; s++) problem(d.gen(rng(s)), `${d.id} seed ${s}`);
    }
  });
}
