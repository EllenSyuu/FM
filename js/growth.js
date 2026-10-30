/*
 * Growth plates: how money changes over time, drawn as curves that ink themselves in, with
 * a marker that sweeps along them and a slider to stop at any moment and read the value —
 * "how much is it worth right now?" answered by dragging instead of computing.
 *
 * spec: { n, curves: [{ label, f: t => value, tone: 'ink'|'orange'|'graph', dash? }],
 *         caption?, unit?, yMin?, start? }
 * Step functions (interest credited monthly, a loan balance dropping at each payment) are
 * drawn with vertical jumps: the curve is sampled just before and after every whole period.
 */

const TONE = { ink: '#22314a', orange: '#cf602b', graph: '#6f7b8c', sage: '#7c8a5c' };
const W = 680;
const H = 330;
const L = 70;
const R = 586;
const T = 34;
const B = 262;
const registry = new Map();
let uid = 0;

const fmt = x =>
  !Number.isFinite(x) ? '—' : Math.abs(x) >= 100 ? x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (Math.round(x * 10000) / 10000).toString();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function niceStep(span) {
  const raw = span / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw);
}

export function samples(spec) {
  const { n } = spec;
  const ts = new Set();
  for (let k = 0; k <= 240; k++) ts.add(+((k * n) / 240).toFixed(6));
  for (let k = 0; k <= n; k++) {
    if (k > 0) ts.add(+(k - 1e-6).toFixed(7));
    ts.add(k);
  }
  const step = spec.jumps || 1;
  if (step < 1) for (let t = step; t < n; t += step) ts.add(+(t - 1e-6).toFixed(7)), ts.add(+t.toFixed(6));
  return [...ts].filter(t => t >= 0 && t <= n).sort((a, b) => a - b);
}

function scales(spec) {
  const ts = samples(spec);
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of spec.curves)
    for (const t of ts) {
      const y = c.f(t);
      if (Number.isFinite(y)) (lo = Math.min(lo, y)), (hi = Math.max(hi, y));
    }
  if (spec.yMin !== undefined) lo = spec.yMin;
  else lo = Math.min(0, lo);
  const st = niceStep(hi - lo || 1);
  lo = Math.floor(lo / st) * st;
  hi = Math.ceil(hi / st) * st;
  return { ts, lo, hi, st, x: t => L + ((R - L) * t) / spec.n, y: v => B - ((B - T) * (v - lo)) / (hi - lo) };
}

export function growthPlate(spec) {
  const id = `g${++uid}`;
  registry.set(id, spec);
  const s = scales(spec);
  const xt = [];
  const every = spec.n <= 12 ? 1 : spec.n <= 24 ? 2 : 5;
  for (let t = 0; t <= spec.n; t += every)
    xt.push(`<path d="M${s.x(t)} ${B} v6" /><text x="${s.x(t)}" y="${B + 24}" text-anchor="middle" class="g-num">${t}</text>`);
  const yt = [];
  for (let v = s.lo; v <= s.hi + 1e-9; v += s.st)
    yt.push(`<path d="M${L - 6} ${s.y(v)} H${R}" class="g-grid"/><text x="${L - 12}" y="${s.y(v) + 5}" text-anchor="end" class="g-num">${fmtTick(v)}</text>`);
  // End labels, nudged apart so curves that finish close together stay readable.
  const ends = spec.curves.map((c, k) => ({ k, y: s.y(c.f(spec.n)) + 5 })).sort((a, b) => a.y - b.y);
  for (let j = 1; j < ends.length; j++) if (ends[j].y - ends[j - 1].y < 19) ends[j].y = ends[j - 1].y + 19;
  const labelY = Object.fromEntries(ends.map(e => [e.k, e.y]));
  const paths = spec.curves
    .map((c, k) => {
      const d = s.ts.map((t, j) => `${j ? 'L' : 'M'}${s.x(t).toFixed(1)} ${s.y(c.f(t)).toFixed(1)}`).join(' ');
      return `<path class="g-curve${c.dash ? ' dashed' : ''}" ${c.dash ? '' : 'pathLength="1"'} style="transition-delay:${(0.3 + k * 0.35).toFixed(2)}s" d="${d}" stroke="${TONE[c.tone] || TONE.ink}" stroke-width="${c.tone === 'orange' ? 2 : 1.6}" fill="none"/>
        <text class="g-label" style="transition-delay:${(1.9 + k * 0.35).toFixed(2)}s" x="${R + 10}" y="${labelY[k]}" fill="${TONE[c.tone] || TONE.ink}">${esc(c.label)}</text>`;
    })
    .join('');
  const dots = spec.curves.map((c, k) => `<circle class="g-dot" data-k="${k}" r="4.5" fill="#fbf8f1" stroke="${TONE[c.tone] || TONE.ink}" stroke-width="1.6"/>`).join('');
  return `<figure class="growth" data-g="${id}">
  <svg viewBox="0 0 ${W + 40} ${H}" role="img" aria-label="${esc(spec.caption || 'Growth over time')}">
    <rect x="6" y="6" width="${W + 28}" height="${H - 12}" fill="none" stroke="#b4bcc7" stroke-width="0.6"/>
    <g class="g-axes">${yt.join('')}${xt.join('')}<path d="M${L} ${T - 8} V${B} H${R + 4}" class="g-axis"/></g>
    <text x="${R}" y="${B + 46}" text-anchor="end" class="g-unit">${esc(spec.unit || 't · 年')}</text>
    ${paths}
    <path class="g-now" d="M0 ${T - 6} V${B}" />
    ${dots}
    <text class="g-read" x="0" y="0"></text>
  </svg>
  <div class="g-controls">
    <button type="button" class="g-play" aria-label="Play">▶</button>
    <input type="range" min="0" max="${spec.n}" step="${spec.n / 200}" value="0" aria-label="时间 t">
    <output class="g-t">t = 0</output>
  </div>
  <div class="g-values">${spec.curves.map((c, k) => `<span><i style="background:${TONE[c.tone] || TONE.ink}"></i>${esc(c.label)} <b data-v="${k}"></b></span>`).join('')}</div>
  ${spec.caption ? `<figcaption>${spec.captionHtml || esc(spec.caption)}</figcaption>` : ''}
</figure>`;
}

function fmtTick(v) {
  if (Math.abs(v) >= 1000) return `${+(v / 1000).toFixed(2)}k`;
  return String(+v.toFixed(3));
}

export function mountGrowth(root) {
  root.querySelectorAll('.growth:not(.mounted)').forEach(fig => {
    fig.classList.add('mounted');
    const spec = registry.get(fig.dataset.g);
    if (!spec) return;
    const s = scales(spec);
    const svg = fig.querySelector('svg');
    const now = svg.querySelector('.g-now');
    const read = svg.querySelector('.g-read');
    const dots = [...svg.querySelectorAll('.g-dot')];
    const range = fig.querySelector('input');
    const out = fig.querySelector('.g-t');
    const vals = [...fig.querySelectorAll('[data-v]')];
    const set = t => {
      now.setAttribute('transform', `translate(${s.x(t)} 0)`);
      spec.curves.forEach((c, k) => {
        const v = c.f(t);
        dots[k].setAttribute('cx', s.x(t));
        dots[k].setAttribute('cy', s.y(v));
        vals[k].textContent = fmt(v);
      });
      const v0 = spec.curves[0].f(t);
      const rx = Math.min(s.x(t) + 10, R - 70);
      read.setAttribute('x', rx);
      read.setAttribute('y', Math.max(T + 14, s.y(v0) - 14));
      read.textContent = fmt(v0);
      out.textContent = `t = ${(+t.toFixed(2)).toString()}`;
      range.value = t;
    };
    let raf = 0;
    const sweep = (to = spec.start ?? spec.n, ms = 2600) => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const step = now2 => {
        const u = Math.min(1, (now2 - t0) / ms);
        const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
        set(to * e);
        if (u < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    set(0);
    range.addEventListener('input', () => {
      cancelAnimationFrame(raf);
      set(+range.value);
    });
    fig.querySelector('.g-play').addEventListener('click', () => sweep(spec.n, 3200));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = () => {
      fig.classList.add('on');
      if (reduce) set(spec.start ?? spec.n);
      else setTimeout(() => sweep(), 500);
    };
    if (!('IntersectionObserver' in window)) return start();
    const io = new IntersectionObserver(
      es => {
        if (es.some(e => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(fig);
  });
}
