/*
 * The timeline, drawn as an engineering plate: an inked axis, one tick per period, each
 * payment an arrow with its amount lettered by hand, and the date being asked about marked
 * in orange with a "?". After a problem is solved the payments can be shown travelling to
 * that date, each arc labelled with the factor it picks up — (1+i)^k forwards, v^k back.
 *
 * spec: { n, flows: [{t, amt, side?: 'up'|'down'}], focal?, rate?, unit? }
 */

const INK = '#22314a';
const GRAPH = '#6f7b8c';
const FAINT = '#b4bcc7';
const ORANGE = '#cf602b';

const UNIT = { year: '年', quarter: '季', month: '月', half: '半年', period: '期' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let uid = 0;

export function timeline(spec, opts = {}) {
  const { n, flows = [], focal = null, rate = '', unit = 'year' } = spec;
  const W = opts.width || (typeof window !== 'undefined' && window.innerWidth < 620 ? 440 : 680);
  const padL = 46;
  const padR = 40;
  const axisY = 132;
  const hasDown = flows.some(f => f.side === 'down');
  const band = axisY + (hasDown ? 84 : 40); // top of the space under the axis used by animations
  const H = (hasDown ? 252 : 214) + (opts.moves ? 34 + (hasDown ? 40 : 0) : 0) + (opts.stage ? 76 : 0);
  const step = (W - padL - padR) / n;
  const x = t => padL + t * step;
  const id = `tl${++uid}`;
  const labelEvery = step >= 26 ? 1 : step >= 13 ? 2 : 5;
  const d = k => `style="transition-delay:${k.toFixed(2)}s"`;

  const ticks = [];
  for (let t = 0; t <= n; t++) {
    const major = t % labelEvery === 0 || t === n;
    ticks.push(`<path d="M${x(t)} ${axisY - (major ? 7 : 4)} V${axisY + (major ? 7 : 4)}" stroke="${INK}" stroke-width="${major ? 1 : 0.7}"/>`);
    if (major) ticks.push(`<text x="${x(t)}" y="${axisY + 26}" text-anchor="middle" class="tl-num">${t}</text>`);
  }

  const amtSize = step >= 70 ? 18 : step >= 44 ? 16 : 15;
  const arrows = flows.map((f, k) => {
    const up = f.side !== 'down';
    const X = x(f.t);
    const y1 = up ? axisY - 12 : axisY + 34;
    const y2 = up ? axisY - 62 : axisY + 76;
    const head = up ? `M${X - 4.5} ${y2 + 8} L${X} ${y2} L${X + 4.5} ${y2 + 8}` : `M${X - 4.5} ${y2 - 8} L${X} ${y2} L${X + 4.5} ${y2 - 8}`;
    const ty = up ? y2 - 10 : y2 + 20;
    const crowded = step < 40 && flows.length > 3;
    const show = !crowded || k === 0 || k === flows.length - 1;
    const dots = crowded && k === 1 ? `<text x="${X}" y="${ty}" text-anchor="middle" class="tl-hand" font-size="${amtSize}">…</text>` : '';
    return `<g class="tl-flow">
      <path class="ink" pathLength="1" ${d(0.25 + k * 0.05)} d="M${X} ${y1} V${y2}" stroke="${up ? INK : GRAPH}" stroke-width="1.3"/>
      <path class="ink" pathLength="1" ${d(0.45 + k * 0.05)} d="${head}" stroke="${up ? INK : GRAPH}" stroke-width="1.3" fill="none"/>
      ${show ? `<text class="write ${/[A-Za-z]/.test(String(f.amt)) ? 'tl-sym' : 'tl-hand'}" ${d(0.6 + k * 0.05)} x="${X}" y="${ty}" text-anchor="middle" font-size="${amtSize + (/[A-Za-z]/.test(String(f.amt)) ? 3 : 0)}" fill="${up ? INK : GRAPH}">${esc(f.amt)}</text>` : dots}
    </g>`;
  });

  let focalMark = '';
  if (focal !== null && focal !== undefined) {
    const X = x(focal);
    focalMark = `<g>
      <path class="fade" ${d(0.9)} d="M${X} 34 V${axisY + 16}" stroke="${ORANGE}" stroke-width="0.9" stroke-dasharray="3 3"/>
      <circle class="fade tl-focal" ${d(1)} cx="${X}" cy="${axisY}" r="6.5" fill="none" stroke="${ORANGE}" stroke-width="1.4"/>
      <text class="write tl-hand tl-q" ${d(1.1)} x="${X + 6}" y="${axisY + 56}" fill="${ORANGE}" font-size="24">?</text>
    </g>`;
  }

  // Arcs: each payment carried to the focal date, labelled with its factor.
  let moves = '';
  if (opts.moves && focal !== null && focal !== undefined) {
    const shown = flows.filter(f => f.t !== focal).slice(0, 8);
    moves = shown
      .map((f, k) => {
        const a = x(f.t);
        const b = x(focal);
        const dt = focal - f.t;
        const lift = 26 + Math.min(70, Math.abs(b - a) * 0.22) + (k % 2) * 8;
        const y0 = axisY + (hasDown ? 84 : 40);
        const mid = (a + b) / 2;
        const fwd = dt > 0;
        const k1 = Math.abs(dt);
        const lab = fwd ? `×(1+i)${sup(k1)}` : `×v${sup(k1)}`;
        return `<g class="tl-move">
          <path class="ink" pathLength="1" ${d(0.2 + k * 0.25)} d="M${a} ${y0} Q${mid} ${y0 + lift} ${b} ${y0 + 4}" stroke="${ORANGE}" stroke-width="1.1" fill="none" marker-end="url(#${id}-ah)"/>
          <text class="write tl-factor" ${d(0.5 + k * 0.25)} x="${mid}" y="${y0 + lift / 2 + 20}" text-anchor="middle" fill="${ORANGE}" font-size="19">${lab}</text>
        </g>`;
      })
      .join('');
  }

  const interactive = opts.place
    ? Array.from({ length: n + 1 }, (_, t) => `<rect class="tl-hit" data-t="${t}" x="${x(t) - step / 2}" y="20" width="${step}" height="${axisY + 14}" fill="transparent"/>`).join('')
    : '';

  return `<svg class="timeline" viewBox="0 0 ${W} ${H}" data-x0="${padL}" data-dx="${step}" data-axis="${axisY}" data-band="${band}" data-n="${n}" role="img" aria-label="${esc(timelineLabel(spec))}">
  <defs>
    <marker id="${id}-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M1 1 L9 5 L1 9" fill="none" stroke="${ORANGE}" stroke-width="1.4"/>
    </marker>
  </defs>
  <g class="fade" ${d(0)} stroke="${FAINT}" stroke-width="0.6" fill="none">
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}"/>
    <path d="M14 ${axisY} H24 M${W - 24} ${axisY} H${W - 14}"/>
  </g>
  ${rate ? `<text class="fade tl-plate" ${d(0.1)} x="18" y="28">${esc(rate)}</text>` : ''}
  <text class="fade tl-plate" ${d(0.1)} x="${W - 18}" y="28" text-anchor="end">t · ${UNIT[unit] || unit}</text>
  <path class="ink" pathLength="1" ${d(0.05)} d="M${padL - 14} ${axisY} H${W - padR + 16}" stroke="${INK}" stroke-width="1.2"/>
  <path class="ink" pathLength="1" ${d(0.3)} d="M${W - padR + 8} ${axisY - 4} L${W - padR + 16} ${axisY} L${W - padR + 8} ${axisY + 4}" stroke="${INK}" stroke-width="1.2" fill="none"/>
  <g class="fade" ${d(0.2)}>${ticks.join('')}</g>
  ${focalMark}
  ${arrows.join('')}
  ${moves}
  <g class="tl-picks"></g>
  ${opts.stage ? '<g class="tl-stage"></g>' : ''}
  ${interactive}
</svg>`;
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = k => (k === 1 ? '' : String(k).split('').map(c => SUP[+c] || c).join(''));

export function timelineLabel({ n, flows = [], focal }) {
  const f = flows.map(x => `${x.amt} at t=${x.t}`).join(', ');
  return `Timeline from 0 to ${n}${f ? `: ${f}` : ''}${focal != null ? `; value asked at t=${focal}` : ''}`;
}

/* Arrows the learner has placed in a "place" step. */
export function drawPicks(svg, picks, n) {
  const W = +svg.getAttribute('viewBox').split(' ')[2];
  const step = (W - 46 - 40) / n;
  const g = svg.querySelector('.tl-picks');
  g.innerHTML = [...picks]
    .map(t => {
      const X = 46 + t * step;
      return `<path d="M${X} 120 V72 M${X - 4.5} 80 L${X} 72 L${X + 4.5} 80" stroke="${ORANGE}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    })
    .join('');
}
