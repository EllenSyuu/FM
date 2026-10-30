import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, toTex, read, sameValue, rateTools } from '../js/expr.js';

const V = { i: 0.05 };
const near = (a, b) => assert.ok(sameValue(a, b, 1e-9), `${a} ≠ ${b}`);

test('arithmetic, precedence and implicit multiplication', () => {
  near(evaluate('2+3*4^2'), 50);
  near(evaluate('-2^2'), -4);
  near(evaluate('2^3^2'), 512);
  near(evaluate('100v^3', V), 100 / 1.05 ** 3);
  near(evaluate('100(1+i)^-3', V), 100 / 1.05 ** 3);
  near(evaluate('(1+i)(1+i)', V), 1.1025);
  near(evaluate('1,000 × 1.05²'), 1102.5);
  near(evaluate('5%'), 0.05);
});

test('annuity symbols agree with direct sums', () => {
  const i = 0.06;
  const sum = (n, f) => Array.from({ length: n }, (_, k) => f(k + 1)).reduce((a, b) => a + b, 0);
  near(evaluate('a(10)', { i }), sum(10, k => (1 + i) ** -k));
  near(evaluate('ad(10)', { i }), sum(10, k => (1 + i) ** -(k - 1)));
  near(evaluate('ä(10)', { i }), evaluate('ad(10)', { i }));
  near(evaluate('s(10)', { i }), sum(10, k => (1 + i) ** (10 - k)));
  near(evaluate('sd(10)', { i }), sum(10, k => (1 + i) ** (11 - k)));
  near(evaluate('Ia(7)', { i }), sum(7, k => k * (1 + i) ** -k));
  near(evaluate('Da(7)', { i }), sum(7, k => (8 - k) * (1 + i) ** -k));
  near(evaluate('Is(7)', { i }), sum(7, k => k * (1 + i) ** (7 - k)));
  near(evaluate('a(inf)', { i }), 1 / i);
  near(evaluate('ad(inf)', { i }), (1 + i) / i);
  near(evaluate('Ia(inf)', { i }), 1 / i + 1 / i ** 2);
  near(evaluate('a(12, 0.01)', { i }), (1 - 1.01 ** -12) / 0.01);
  const r = rateTools(i);
  near(evaluate('abar(5)', { i }), (1 - r.v ** 5) / r.delta);
});

test('errors are friendly and never throw from read()', () => {
  for (const bad of ['((1', '2+', 'x+1', '3 # 4', '']) {
    const r = read(bad, V);
    assert.equal(r.ok, false);
  }
  assert.match(read('x+1', V).error, /x/);
});

test('TeX shows the actuarial angle', () => {
  assert.match(toTex('250a(10)'), /\\angl\{10\}/);
  assert.match(toTex('ad(n)'), /\\ddot a/);
  assert.match(toTex('100v^3'), /v\}\^\{3\}/);
});
