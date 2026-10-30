/*
 * The "no calculator" engine. You write the set-up — 100·v^3, 250·a(10), 1000·(1+i)^2 —
 * and the page does the arithmetic. One small parser serves three jobs:
 *   evaluate(src, vars)  → a number, so an answer can be checked by value
 *   toTex(src)           → KaTeX source, so what you typed is shown as written on paper
 *   sameValue(a, b)      → the tolerance used everywhere a number is compared
 *
 * Accepted: numbers (1.05, 5%, 1,000), + − × ÷ ^ ( ), implicit multiplication (100v^3,
 * 2(1+i)), variables bound by the problem (i, v, d, δ, n …), and the actuarial functions
 * below, which use the problem's rate i unless a second argument gives another rate:
 *   a(n) s(n)          annuity-immediate: present / accumulated value of 1 per period
 *   ad(n) sd(n)        annuity-due (also written ä(n), s̈(n))
 *   abar(n) sbar(n)    continuous annuity
 *   Ia(n) Is(n)        increasing annuity-immediate 1, 2, …, n
 *   Da(n) Ds(n)        decreasing annuity-immediate n, n−1, …, 1
 *   a(inf), ad(inf)    perpetuities 1/i and 1/d
 * plus exp, ln, sqrt.
 */

const FUNCS = new Set(['a', 's', 'ad', 'sd', 'abar', 'sbar', 'Ia', 'Is', 'Da', 'Ds', 'Iad', 'exp', 'ln', 'sqrt']);
const ALIAS = { 'ä': 'ad', 's̈': 'sd', 'ā': 'abar', 's̄': 'sbar', 'δ': 'delta', 'π': 'pi', 'log': 'ln', 'Ïa': 'Iad' };

export class ExprError extends Error {}

function normalise(src) {
  return String(src)
    .replace(/[ \s]+/g, ' ')
    .replace(/[×·∙*]{1,2}/g, m => (m === '**' ? '^' : '*'))
    .replace(/÷/g, '/')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => '^(' + [...m].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'.indexOf(c)).map(k => (k === 10 ? '-' : k)).join('') + ')')
    .replace(/[−–—]/g, '-')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/，/g, ',')
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // 1,000 → 1000 (but a(10,0.05) keeps its comma)
    .replace(/s̈/g, 's̈')
    .replace(/ä/g, 'ä')
    .trim();
}

function tokenize(src) {
  const s = normalise(src);
  const out = [];
  let k = 0;
  while (k < s.length) {
    const c = s[k];
    if (c === ' ') { k++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(%?)/i.exec(s.slice(k));
    if (num) {
      let v = parseFloat(num[1] + (num[2] || ''));
      if (num[3]) v /= 100;
      out.push({ t: 'num', v, raw: num[0] });
      k += num[0].length;
      continue;
    }
    const id = /^(s̈|[A-Za-zäāδπÏ][A-Za-z0-9_äāδ]*)/.exec(s.slice(k));
    if (id) {
      let name = id[1];
      name = ALIAS[name] || name;
      out.push({ t: 'id', v: name });
      k += id[1].length;
      continue;
    }
    if ('+-*/^(),'.includes(c)) { out.push({ t: c }); k++; continue; }
    throw new ExprError(`看不懂这个符号：“${c}”`);
  }
  // Implicit multiplication: 2v, 2(…), )(…), )v, v(… when v is not a function, 3 a(10)
  const res = [];
  for (let j = 0; j < out.length; j++) {
    const a = res[res.length - 1];
    const b = out[j];
    if (a && (a.t === 'num' || a.t === ')' || (a.t === 'id' && !FUNCS.has(a.v))) && (b.t === 'num' || b.t === 'id' || b.t === '(')) {
      if (!(a.t === 'num' && b.t === 'num')) res.push({ t: '*', implicit: true });
    }
    res.push(b);
  }
  return res;
}

/* Pratt parser → AST nodes: {k:'num',v} {k:'var',name} {k:'neg',a} {k:'bin',op,a,b} {k:'call',name,args} */
function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expect = t => {
    const x = next();
    if (!x || x.t !== t) throw new ExprError(t === ')' ? '括号没有配对' : `这里少了 “${t}”`);
  };
  const bp = { '+': 10, '-': 10, '*': 20, '/': 20, '^': 30 };

  function prefix() {
    const x = next();
    if (!x) throw new ExprError('式子还没写完');
    if (x.t === 'num') return { k: 'num', v: x.v, raw: x.raw };
    if (x.t === '-') return { k: 'neg', a: expr(25) };
    if (x.t === '+') return expr(25);
    if (x.t === '(') {
      const e = expr(0);
      expect(')');
      return { k: 'paren', a: e };
    }
    if (x.t === 'id') {
      if (FUNCS.has(x.v) && peek() && peek().t === '(') {
        next();
        const args = [expr(0)];
        while (peek() && peek().t === ',') { next(); args.push(expr(0)); }
        expect(')');
        return { k: 'call', name: x.v, args };
      }
      return { k: 'var', name: x.v };
    }
    throw new ExprError(`这里不应该出现 “${x.t}”`);
  }
  function expr(rbp) {
    let left = prefix();
    for (;;) {
      const op = peek();
      if (!op || !(op.t in bp)) break;
      const lbp = bp[op.t];
      if (lbp <= rbp && !(op.t === '^' && lbp === rbp)) break;
      next();
      // ^ is right-associative; a leading minus binds looser than ^ (−v^2 = −(v^2)).
      const right = expr(op.t === '^' ? lbp - 1 : lbp);
      left = { k: 'bin', op: op.t, a: left, b: right, implicit: !!op.implicit };
    }
    return left;
  }
  if (!toks.length) throw new ExprError('还没有写式子');
  const ast = expr(0);
  if (p < toks.length) throw new ExprError(toks[p].t === ')' ? '括号没有配对' : '式子后面多了东西');
  return ast;
}

/* ---------------------------------------------------------------- evaluation */

export function rateTools(i) {
  const v = 1 / (1 + i);
  const d = i / (1 + i);
  const delta = Math.log(1 + i);
  const isInf = n => n === Infinity;
  const a = n => (isInf(n) ? 1 / i : Math.abs(i) < 1e-12 ? n : (1 - v ** n) / i);
  const s = n => (Math.abs(i) < 1e-12 ? n : ((1 + i) ** n - 1) / i);
  const ad = n => (isInf(n) ? 1 / d : a(n) * (1 + i));
  const sd = n => s(n) * (1 + i);
  const abar = n => (isInf(n) ? 1 / delta : (1 - v ** n) / delta);
  const sbar = n => ((1 + i) ** n - 1) / delta;
  const Ia = n => (isInf(n) ? 1 / i + 1 / (i * i) : (ad(n) - n * v ** n) / i);
  const Iad = n => Ia(n) * (1 + i);
  const Is = n => Ia(n) * (1 + i) ** n;
  const Da = n => (n - a(n)) / i;
  const Ds = n => Da(n) * (1 + i) ** n;
  return { i, v, d, delta, a, s, ad, sd, abar, sbar, Ia, Iad, Is, Da, Ds };
}

const CONST = { pi: Math.PI, e: Math.E, inf: Infinity };

function evalAst(n, vars) {
  switch (n.k) {
    case 'num': return n.v;
    case 'paren': return evalAst(n.a, vars);
    case 'neg': return -evalAst(n.a, vars);
    case 'var': {
      if (n.name in vars) return vars[n.name];
      const r = 'i' in vars ? rateTools(vars.i) : null;
      if (r && ['v', 'd', 'delta'].includes(n.name)) return r[n.name];
      if (n.name in CONST) return CONST[n.name];
      throw new ExprError(`这道题里没有 “${n.name}” 这个量`);
    }
    case 'bin': {
      const a = evalAst(n.a, vars);
      const b = evalAst(n.b, vars);
      if (n.op === '+') return a + b;
      if (n.op === '-') return a - b;
      if (n.op === '*') return a * b;
      if (n.op === '/') return a / b;
      return a ** b;
    }
    case 'call': {
      const args = n.args.map(x => evalAst(x, vars));
      if (n.name === 'exp') return Math.exp(args[0]);
      if (n.name === 'ln') return Math.log(args[0]);
      if (n.name === 'sqrt') return Math.sqrt(args[0]);
      const rate = args.length > 1 ? args[1] : vars.i;
      if (rate === undefined) throw new ExprError('这道题没有给利率 i，年金符号要写成 a(n, 利率)');
      return rateTools(rate)[n.name](args[0]);
    }
  }
  throw new ExprError('式子有问题');
}

export function evaluate(src, vars = {}) {
  const val = evalAst(parse(src), vars);
  if (typeof val !== 'number' || Number.isNaN(val)) throw new ExprError('这个式子算不出一个数');
  return val;
}

export function sameValue(x, y, rel = 5e-5) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return x === y;
  return Math.abs(x - y) <= Math.max(1e-6, rel * Math.max(Math.abs(x), Math.abs(y)));
}

/* ---------------------------------------------------------------- TeX */

const ANGLE = { a: 'a', s: 's', ad: '\\ddot a', sd: '\\ddot s', abar: '\\bar a', sbar: '\\bar s', Ia: '(Ia)', Is: '(Is)', Da: '(Da)', Ds: '(Ds)', Iad: '(I\\ddot a)' };
const VARTEX = { delta: '\\delta', pi: '\\pi', inf: '\\infty', i_m: 'i^{(m)}', d_m: 'd^{(m)}' };

function texAst(n, parent = 0) {
  switch (n.k) {
    case 'num': return n.raw && n.raw.endsWith('%') ? n.raw.replace('%', '\\%') : fmtNum(n.v);
    case 'paren': return `\\left(${texAst(n.a)}\\right)`;
    case 'neg': return `-${texAst(n.a, 25)}`;
    case 'var': {
      if (VARTEX[n.name]) return VARTEX[n.name];
      const m = /^([A-Za-z]+)_?(\d+)$/.exec(n.name);
      if (m) return `${m[1]}_{${m[2]}}`;
      return n.name.length > 1 ? `\\mathrm{${n.name}}` : n.name;
    }
    case 'bin': {
      const pr = { '+': 10, '-': 10, '*': 20, '/': 20, '^': 30 }[n.op];
      let s;
      if (n.op === '/') s = `\\dfrac{${texAst(n.a)}}{${texAst(n.b)}}`;
      else if (n.op === '^') s = `{${texAst(n.a, 31)}}^{${texAst(n.b)}}`;
      else if (n.op === '*') {
        const a = texAst(n.a, 20);
        const b = texAst(n.b, 21);
        const tight = n.b.k !== 'num' && !(n.b.k === 'bin' && n.b.a && n.b.a.k === 'num');
        s = tight ? `${a}\\,${b}` : `${a}\\times ${b}`;
      } else s = `${texAst(n.a, pr)} ${n.op} ${texAst(n.b, pr + 1)}`;
      return pr < parent && n.op !== '/' ? `\\left(${s}\\right)` : s;
    }
    case 'call': {
      if (ANGLE[n.name]) {
        const term = n.args[0].k === 'var' && n.args[0].name === 'inf' ? '∞' : texAst(n.args[0]);
        const sub = `_{\\angl{${term}}`;
        const at = n.args[1] ? `\\,@\\,${texAst(n.args[1])}` : '';
        return `${ANGLE[n.name]}${sub}}${at}`;
      }
      if (n.name === 'sqrt') return `\\sqrt{${texAst(n.args[0])}}`;
      if (n.name === 'exp') return `e^{${texAst(n.args[0])}}`;
      return `\\ln\\left(${texAst(n.args[0])}\\right)`;
    }
  }
  return '';
}

export function toTex(src) {
  return texAst(parse(src));
}

export function fmtNum(x, dp = 4) {
  if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const r = Math.round(x * 10 ** dp) / 10 ** dp;
  return String(r);
}

/* Money as it would be written on an exam: 1,234.57 */
export function money(x, dp = 2) {
  if (!Number.isFinite(x)) return '∞';
  return x.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/* Try to read a typed answer; returns {ok, value, tex, error}. Never throws. */
export function read(src, vars = {}) {
  if (!String(src).trim()) return { ok: false, empty: true };
  try {
    const value = evaluate(src, vars);
    let tex = '';
    try { tex = toTex(src); } catch (e) { /* display only */ }
    return { ok: true, value, tex };
  } catch (e) {
    return { ok: false, error: e instanceof ExprError ? e.message : '式子有问题' };
  }
}
