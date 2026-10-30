/*
 * Drawings, in the atelier style of ellensyuu.github.io: blue-black ink and graphite on warm
 * paper, construction lines first, hand-lettered notes, orange kept for the maple leaf and
 * for what matters. Every stroke uses pathLength="1" so the page can ink it in (.ink).
 */

export const INK = '#22314a';
export const GRAPH = '#6f7b8c';
export const FAINT = '#b4bcc7';
export const ORANGE = '#cf602b';
export const AMBER = '#e0a046';

const MAPLE =
  'M0 -22 L4 -12 L11 -15 L9 -5 L18 -7 L14 0 L20 4 L9 6 L11 12 L3 9 L1 20 L-1 20 L-3 9 L-11 12 L-9 6 L-20 4 L-14 0 L-18 -7 L-9 -5 L-11 -15 L-4 -12 Z';

/* Plate I — "the timeline": a drafting rule in oblique projection, a stack of coins at
   today and a taller one later, the same money carried forward by (1+i) and back by v, the
   date being asked about marked in orange. viewBox 0 0 640 520. */
export function heroPlate({ lessons = 0, topics = 5, exam = 'Feb 2027' } = {}) {
  const t = i => `style="transition-delay:${i.toFixed(2)}s"`;
  // The rule: a long band skewed upward to the right, ticks 0..6 along its top edge.
  const X0 = 92, Y0 = 356, X1 = 548, Y1 = 290; // left/right ends of the top edge
  const P = k => [X0 + ((X1 - X0) * k) / 6, Y0 + ((Y1 - Y0) * k) / 6];
  const ticks = [];
  for (let k = 0; k <= 30; k++) {
    const [x, y] = [X0 + ((X1 - X0) * k) / 30, Y0 + ((Y1 - Y0) * k) / 30];
    const major = k % 5 === 0;
    ticks.push(`<path class="ink thin" pathLength="1" ${t(0.9 + k * 0.02)} d="M${x.toFixed(1)} ${y.toFixed(1)} l2 ${major ? 14 : 7}"/>`);
    if (major) ticks.push(`<text class="fade" ${t(1.4 + k * 0.01)} x="${(x + 5).toFixed(1)}" y="${(y + 30).toFixed(1)}" font-size="16" fill="${INK}" font-family="'Cormorant Garamond', Garamond, serif" font-style="italic">${k / 5}</text>`);
  }
  // A stack of coins: n ellipses with hatched sides, centred at (cx, cy).
  const coins = (cx, cy, n, delay) =>
    Array.from({ length: n }, (_, k) => {
      const y = cy - k * 10;
      return `<g ${t(delay + k * 0.12)} class="fade">
        <path d="M${cx - 25} ${y} v7 a25 8 0 0 0 50 0 v-7" fill="url(#hatch)" stroke="${INK}" stroke-width="1"/>
        <ellipse cx="${cx}" cy="${y}" rx="25" ry="8" fill="#fbf8f1" stroke="${INK}" stroke-width="1.1"/>
      </g>`;
    }).join('');
  const [ax, ay] = P(0);
  const [bx, by] = P(6);
  const [fx, fy] = P(4);
  const serif = `font-family="'Cormorant Garamond', Garamond, serif" font-style="italic"`;
  return `
<svg viewBox="0 0 640 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A drafting rule used as a timeline, with money carried forward and back">
  <defs>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="${GRAPH}" stroke-width="0.6"/>
    </pattern>
    <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2"/>
    </filter>
    <marker id="hp-o" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="${ORANGE}" stroke-width="1.3"/></marker>
    <marker id="hp-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="${GRAPH}" stroke-width="1.3"/></marker>
  </defs>

  <g class="fade" ${t(0.1)} stroke="${FAINT}" stroke-width="0.6" fill="none">
    <rect x="18" y="18" width="604" height="484"/>
    <rect x="26" y="26" width="588" height="468" stroke-dasharray="1 5"/>
    <path d="M50 ${Y0 + 48} L600 ${Y1 - 32}" stroke-dasharray="14 4 2 4"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${40 + i * 45} 18 v7 M${40 + i * 45} 502 v-7"/>`).join('')}
  </g>

  <!-- pencil resting in the top right corner -->
  <g transform="translate(420 92) rotate(10)" filter="url(#rough)" fill="none" stroke="${INK}" stroke-width="1.05" stroke-linejoin="round">
    <path class="ink" pathLength="1" ${t(1.2)} d="M0 0 H128 V12 H0 Z"/>
    <path class="ink" pathLength="1" ${t(1.4)} d="M128 0 L154 6 L128 12 M146 4 L154 6 L146 8"/>
    <path class="ink thin" pathLength="1" ${t(1.5)} d="M0 6 H128 M14 0 V12 M20 0 V12"/>
    <path class="fade" ${t(1.7)} d="M128 0 L154 6 L128 12 Z" fill="url(#hatch)" stroke="none"/>
  </g>

  <g filter="url(#rough)" fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
    <path class="fade" ${t(0.5)} d="M${X0 - 8} ${Y0 + 46} L${X1 + 22} ${Y1 + 46} L${X1 + 22} ${Y1 + 56} L${X0 - 8} ${Y0 + 56} Z" fill="url(#hatch)" stroke="none" opacity="0.5"/>
    <path class="ink" pathLength="1" ${t(0.3)} stroke-width="1.3" d="M${X0 - 16} ${Y0} L${X1 + 22} ${Y1} L${X1 + 22} ${Y1 + 42} L${X0 - 16} ${Y0 + 42} Z"/>
    <path class="ink thin" pathLength="1" ${t(0.6)} d="M${X0 - 16} ${Y0 + 42} l-6 6 L${X1 + 16} ${Y1 + 48} l6 -6"/>
  </g>
  <g stroke="${INK}" fill="none">${ticks.join('')}</g>

  ${coins(ax, ay - 16, 3, 1.7)}
  ${coins(bx, by - 16, 5, 2.0)}

  <!-- forward ×(1+i)^6 above the rule; back ×v^6 beneath it -->
  <path class="ink" pathLength="1" ${t(2.6)} d="M${ax + 4} ${ay - 50} C ${ax + 90} ${ay - 230}, ${bx - 120} ${by - 236}, ${bx - 2} ${by - 84}" stroke="${ORANGE}" stroke-width="1.5" fill="none" marker-end="url(#hp-o)"/>
  <text class="write" ${t(3.1)} x="${(ax + bx) / 2 - 64}" y="${Math.min(ay, by) - 168}" fill="${ORANGE}" font-size="30" ${serif}>× (1+i)<tspan dy="-12" font-size="19">6</tspan></text>
  <path class="ink" pathLength="1" ${t(3.0)} d="M${bx - 6} ${by + 66} C ${bx - 110} ${by + 120}, ${ax + 120} ${ay + 104}, ${ax + 6} ${ay + 62}" stroke="${GRAPH}" stroke-width="1.2" fill="none" marker-end="url(#hp-g)"/>
  <text class="write" ${t(3.4)} x="${bx - 128}" y="${by + 132}" fill="${GRAPH}" font-size="28" ${serif}>× v<tspan dy="-11" font-size="18">6</tspan></text>

  <!-- the date being asked about -->
  <path class="fade" ${t(3.6)} d="M${fx} ${fy - 104} V${fy + 76}" stroke="${ORANGE}" stroke-width="0.9" stroke-dasharray="3 3"/>
  <circle class="fade" ${t(3.7)} cx="${fx}" cy="${fy}" r="6.5" fill="none" stroke="${ORANGE}" stroke-width="1.4"/>
  <text class="write hand" ${t(3.9)} x="${fx + 10}" y="${fy - 82}" fill="${ORANGE}" font-size="34">?</text>
  <text class="write hand" ${t(2.2)} x="${ax - 50}" y="${ay + 88}" fill="${INK}" font-size="22" transform="rotate(-8 ${ax - 50} ${ay + 88})">today</text>

  <g class="fade leaf" ${t(4.2)} transform="translate(${fx + 52} ${fy + 100}) rotate(16) scale(1.05)">
    <path d="${MAPLE}" fill="${ORANGE}" opacity="0.85"/>
    <path d="M0 -14 V18 M0 2 L-10 -3 M0 2 L10 -3" stroke="#fffaf2" stroke-width="0.8" fill="none"/>
  </g>

  <g class="fade" ${t(2.4)} stroke="${GRAPH}" stroke-width="0.7" fill="none">
    <path d="M84 466 V484 M556 466 V484 M86 476 H554"/>
    <path d="M86 476 l8 -3 v6 Z M554 476 l-8 -3 v6 Z" fill="${GRAPH}"/>
  </g>
  <g class="fade" ${t(2.6)} fill="${GRAPH}" font-family="'Cormorant Garamond', Garamond, serif">
    <text x="320" y="468" text-anchor="middle" font-size="17" font-style="italic">${lessons} lessons · ${topics} topics · ${exam}</text>
    <text x="44" y="56" font-size="14" letter-spacing="3">PL. I</text>
    <text x="44" y="78" font-size="21" font-style="italic">the timeline</text>
    <text x="604" y="494" text-anchor="end" font-size="13" letter-spacing="2">45°30′N 73°34′W</text>
  </g>
</svg>`;
}

/* A hand-drawn tick or cross, inked in when it appears. */
export const tickMark = (color = ORANGE) =>
  `<svg viewBox="0 0 40 40" class="mark" aria-hidden="true"><path class="ink" pathLength="1" d="M9 21 l8 9 l15 -20" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const crossMark = (color = INK) =>
  `<svg viewBox="0 0 40 40" class="mark" aria-hidden="true"><path class="ink" pathLength="1" d="M11 11 L29 29 M29 11 L11 29" stroke="${color}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;

/* Last-30-days sketch: one square per day, hatched by how much was studied, ticked when the
   day's plan was finished. */
export function monthSketch(days) {
  const cell = 26;
  const gap = 6;
  const cols = 10;
  const w = cols * (cell + gap);
  const rows = Math.ceil(days.length / cols);
  const h = rows * (cell + gap) + 16;
  const parts = days.map((d, i) => {
    const x = (i % cols) * (cell + gap);
    const y = Math.floor(i / cols) * (cell + gap);
    const n = d.count;
    const hatch = n === 0 ? 0 : n < 6 ? 2 : n < 15 ? 4 : 7;
    const lines = Array.from({ length: hatch }, (_, k) => {
      const o = ((k + 1) * cell) / (hatch + 1);
      return `<path d="M${x + o} ${y + cell} L${x} ${y + cell - o}" />`;
    }).join('');
    const tick = d.done
      ? `<path class="ink" pathLength="1" style="transition-delay:${(0.3 + i * 0.03).toFixed(2)}s" d="M${x + 6} ${y + 14} l5 6 l10 -13" stroke="${ORANGE}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : '';
    const today = d.today ? `<rect x="${x - 3}" y="${y - 3}" width="${cell + 6}" height="${cell + 6}" fill="none" stroke="${ORANGE}" stroke-width="0.8" stroke-dasharray="2 2"/>` : '';
    return `<g><title>${d.key}: ${n}</title><rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="${d.count ? INK : FAINT}" stroke-width="0.8"/><g stroke="${GRAPH}" stroke-width="0.7">${lines}</g>${tick}${today}</g>`;
  });
  return `<svg viewBox="-4 -4 ${w + 4} ${h}" class="month" role="img" aria-label="Study activity over the last 30 days">${parts.join('')}</svg>`;
}

/* Now and then a gull or a pigeon crosses the page, as on the personal site. */
export function startBirds() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ns = 'http://www.w3.org/2000/svg';
  const sky = document.createElementNS(ns, 'svg');
  sky.setAttribute('class', 'sky');
  sky.setAttribute('aria-hidden', 'true');
  const g = document.createElementNS(ns, 'g');
  const wing = document.createElementNS(ns, 'path');
  const body = document.createElementNS(ns, 'path');
  wing.setAttribute('fill', 'none');
  wing.setAttribute('stroke', INK);
  wing.setAttribute('stroke-width', '1.3');
  wing.setAttribute('stroke-linecap', 'round');
  body.setAttribute('fill', INK);
  g.append(wing, body);
  g.style.opacity = '0';
  sky.append(g);
  document.body.append(sky);

  const gull = f => {
    const a = 4 + f * 9;
    return `M-17 ${(-a * 0.55).toFixed(1)} Q-9 ${(-a - 4).toFixed(1)} -1 0 M1 0 Q9 ${(-a - 4).toFixed(1)} 17 ${(-a * 0.55).toFixed(1)}`;
  };
  const pigeon = f => {
    const a = 3 + f * 8;
    return `M-3 -1 Q-8 ${(-a - 5).toFixed(1)} -15 ${(-a * 0.7).toFixed(1)} Q-9 ${(-a * 0.2).toFixed(1)} -2 1 M2 -1 Q7 ${(-a - 5).toFixed(1)} 13 ${(-a * 0.7).toFixed(1)} Q8 ${(-a * 0.2).toFixed(1)} 2 1`;
  };
  let n = 0;
  const fly = () => {
    if (document.hidden || document.body.dataset.view === 'session') {
      setTimeout(fly, 15000);
      return;
    }
    const kind = n++ % 3 === 2 ? 'pigeon' : 'gull';
    const W = window.innerWidth;
    const H = window.innerHeight;
    const ltr = Math.random() < 0.6;
    const y0 = H * (0.1 + Math.random() * 0.3);
    const y1 = y0 + (Math.random() - 0.5) * H * 0.16;
    const s = (kind === 'gull' ? 1 : 0.85) * (0.9 + Math.random() * 0.5) * (W < 700 ? 0.75 : 1);
    const dur = (kind === 'gull' ? 13000 : 9500) * (W < 700 ? 0.7 : 1);
    const hz = kind === 'gull' ? 2.2 : 4.4;
    body.setAttribute(
      'd',
      kind === 'gull'
        ? 'M-5 0.5 Q0 -2 6 0 Q8 0.4 9 1 Q2 2.6 -5 0.5 Z'
        : 'M-7 1 Q-2 -4 6 -1 Q9 -0.5 10 0.8 Q4 4 -7 1 Z',
    );
    g.style.opacity = '1';
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const x = ltr ? -60 + (W + 120) * t : W + 60 - (W + 120) * t;
      const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI * 3) * 14;
      const phase = (now - start) / 1000;
      const burst = Math.sin(phase * 0.9) > -0.2;
      const f = burst ? Math.sin(phase * hz * Math.PI * 2) : 0.75;
      wing.setAttribute('d', (kind === 'gull' ? gull : pigeon)(f));
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${ltr ? s : -s} ${s})`);
      if (t < 1) requestAnimationFrame(step);
      else {
        g.style.opacity = '0';
        setTimeout(fly, 60000 + Math.random() * 40000);
      }
    };
    requestAnimationFrame(step);
  };
  setTimeout(fly, 6000);
}
