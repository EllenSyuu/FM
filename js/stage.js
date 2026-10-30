/*
 * The timeline as a stage: when a reasoning step is answered, the money on the timeline moves
 * the way that step says it should.
 *
 *   grow     year by year forward:  1,000 → ×1.06 → 1,060 → ×1.06 → 1,123.60 …
 *   discount year by year backward: an arrow slides left under the axis, labelled ×v
 *   move     one payment carried to another date in a single arc (×(1+i)³, ×v²)
 *   drop     a payment arrow falls onto the axis
 *   stack    payments carried one by one to a date, with the running total there
 *   balance  a loan balance drawn as a line that falls at every payment
 *   answer   the circled date fills in with the answer and a tick
 *   note     a hand-lettered remark at a date (t may be fractional)
 *
 * A wrong answer draws the part of the timeline that step is about in grey and shakes it.
 * Every action is plain data on a step (step.anim); see docs/content-guide.md.
 */

const NS = 'http://www.w3.org/2000/svg';
const ORANGE = '#cf602b';
const INK = '#22314a';
const GREY = '#b4bcc7';

const money = x =>
  !Number.isFinite(x) ? '∞' : Math.abs(x) >= 100 || Number.isInteger(x) ? x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(Math.round(x * 10000) / 10000);
const fmtVal = (x, unit) => (unit === 'rate' ? `${+(x * 100).toFixed(4)}%` : unit === 'number' ? String(Math.round(x * 10000) / 10000) : money(x));
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
}

export function makeStage(svg) {
  if (!svg) return null;
  const layer = svg.querySelector('.tl-stage');
  if (!layer) return null;
  const x0 = +svg.dataset.x0;
  const dx = +svg.dataset.dx;
  const axis = +svg.dataset.axis;
  const band = +svg.dataset.band;
  const x = t => x0 + t * dx;
  const motion = reduced();
  let fast = motion;
  const labels = new Map(); // running amount label per date

  const ink = (path, ms) => {
    const len = path.getTotalLength ? path.getTotalLength() : 100;
    path.style.strokeDasharray = `${len} ${len}`;
    if (fast) return Promise.resolve();
    return path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(0.55,0.05,0.25,1)', fill: 'both' }).finished.catch(() => {});
  };
  const fadeIn = (node, ms = 400) => (fast ? Promise.resolve() : node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: 'both' }).finished.catch(() => {}));
  const travel = (path, ms, color) => {
    if (fast) return Promise.resolve();
    const dot = el('circle', { r: 4.5, fill: color, class: 'st-coin' }, layer);
    const len = path.getTotalLength();
    const t0 = performance.now();
    return new Promise(res => {
      const step = now => {
        const u = Math.min(1, (now - t0) / ms);
        const p = path.getPointAtLength(len * (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2));
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
        if (u < 1) requestAnimationFrame(step);
        else {
          dot.remove();
          res();
        }
      };
      requestAnimationFrame(step);
    });
  };

  /* An arc under the axis from date a to date b, with its factor written at the bottom. */
  const arc = (g, a, b, label, color, depth) => {
    const ya = band;
    const xa = x(a);
    const xb = x(b);
    const lift = depth ?? Math.min(70, 26 + Math.abs(xb - xa) * 0.18);
    const p = el('path', { d: `M${xa} ${ya} Q${(xa + xb) / 2} ${ya + lift * 2} ${xb} ${ya}`, fill: 'none', stroke: color, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
    const head = el('path', { d: arrowHead(xb, ya, xa < xb ? 1 : -1), fill: 'none', stroke: color, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, g);
    let t = null;
    if (label) {
      t = el('text', { x: (xa + xb) / 2, y: ya + lift + 20, 'text-anchor': 'middle', class: 'st-factor', fill: color }, g);
      t.textContent = label;
      t.style.opacity = 0;
    }
    return { p, head, t };
  };
  const arrowHead = (X, Y, dir) => `M${X - 9 * dir} ${Y + 4} L${X} ${Y} L${X - 4 * dir} ${Y + 9}`;

  /* The amount standing at date t, written above the axis; older values fade to pencil. */
  const amount = (t, value, unit, g) => {
    const prev = labels.get(t);
    if (prev) prev.remove();
    for (const [k, node] of labels) if (k !== t) node.classList.add('st-old');
    const txt = el('text', { x: x(t), y: axis - 16, 'text-anchor': 'middle', class: 'st-amount', fill: ORANGE }, g);
    txt.textContent = typeof value === 'string' ? value : fmtVal(value, unit);
    labels.set(t, txt);
    return fadeIn(txt, 350);
  };

  const shown = async (parts, ms) => {
    await ink(parts.p, ms);
    parts.head.setAttribute('opacity', 1);
    if (parts.t) fadeIn(parts.t, 300);
  };

  async function act(a, ghost) {
    const g = el('g', { class: ghost ? 'st-ghost' : 'st-act' }, layer);
    const color = ghost ? GREY : a.tone === 'ink' ? INK : ORANGE;
    const hop = fast ? 0 : a.ms || 650;
    switch (a.do) {
      case 'grow':
      case 'discount': {
        const dir = a.do === 'grow' ? 1 : -1;
        const steps = Math.abs(a.to - a.from);
        let v = a.start;
        for (let k = 0; k < steps; k++) {
          const s = a.from + dir * k;
          const parts = arc(g, s, s + dir, a.label, a.do === 'discount' && !ghost ? INK : color, 22);
          if (ghost) {
            parts.head.setAttribute('opacity', 1);
            if (parts.t) parts.t.remove(); // grey shape only: never give the answer away
            break; // and only the first period
          }
          await Promise.all([shown(parts, hop), travel(parts.p, hop, a.do === 'discount' ? INK : ORANGE)]);
          v *= a.mult;
          if (a.start !== undefined) await amount(s + dir, v, a.unit, g);
          if (!fast) await wait(120);
        }
        return;
      }
      case 'move': {
        const parts = arc(g, a.from, a.to, a.label, color);
        if (ghost) {
          parts.head.setAttribute('opacity', 1);
          if (parts.t) parts.t.remove();
          return;
        }
        await Promise.all([shown(parts, hop * 1.3), travel(parts.p, hop * 1.3, color)]);
        if (a.result !== undefined) await amount(a.to, a.result, a.unit, g);
        else if (a.resultText) await amount(a.to, a.resultText, null, g);
        return;
      }
      case 'drop': {
        const X = x(a.t);
        const up = a.side !== 'down';
        const y1 = up ? axis - 12 : axis + 12;
        const y2 = up ? axis - 58 : axis + 58;
        const arrow = el('g', {}, g);
        el('path', { d: `M${X} ${y1} V${y2} M${X - 4.5} ${y2 + (up ? 8 : -8)} L${X} ${y2} L${X + 4.5} ${y2 + (up ? 8 : -8)}`, stroke: color, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, arrow);
        if (a.amt !== undefined && !ghost) {
          const t = el('text', { x: X, y: up ? y2 - 8 : y2 + 18, 'text-anchor': 'middle', class: 'st-amount', fill: color }, arrow);
          t.textContent = a.amt;
        }
        if (!fast && !ghost) await arrow.animate([{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'translateY(4px)', opacity: 1, offset: 0.8 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' }).finished.catch(() => {});
        return;
      }
      case 'stack': {
        let total = 0;
        const ts = a.ts.slice(0, ghost ? 1 : a.ts.length);
        for (const t of ts) {
          if (t !== a.to) {
            const parts = arc(g, t, a.to, null, color, Math.min(60, 14 + Math.abs(a.to - t) * 6));
            if (ghost) {
              parts.head.setAttribute('opacity', 1);
              return;
            }
            const ms = Math.max(260, hop * (ts.length > 6 ? 0.55 : 0.85));
            await Promise.all([shown(parts, ms), travel(parts.p, ms, color)]);
          }
          total += a.amt * (1 + a.i) ** (a.to - t);
          await amount(a.to, total, a.unit, g);
        }
        return;
      }
      case 'balance': {
        const top = band + 6;
        const bot = band + 84;
        const max = a.max || Math.max(...a.points.map(p => p[1]));
        const y = B => top + (bot - top) * (1 - B / max);
        const pts = a.points.slice(0, ghost ? 2 : a.points.length);
        let d = `M${x(pts[0][0])} ${y(pts[0][1])}`;
        for (let k = 1; k < pts.length; k++) d += ` H${x(pts[k][0])} V${y(pts[k][1])}`;
        const p = el('path', { d, fill: 'none', stroke: color, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
        if (ghost) return;
        el('path', { d: `M${x(0)} ${bot} H${x(pts[pts.length - 1][0])}`, stroke: GREY, 'stroke-width': 0.6, 'stroke-dasharray': '2 3' }, g);
        await ink(p, Math.min(2600, 380 * pts.length));
        const every = pts.length > 8 ? 2 : 1;
        pts.forEach(([t, B], k) => {
          if (k % every && k !== pts.length - 1) return;
          const lab = el('text', { x: x(t) + 4, y: y(B) - 5, class: 'st-small', fill: color }, g);
          lab.textContent = money(B);
          fadeIn(lab, 300);
        });
        return;
      }
      case 'answer': {
        if (ghost) return;
        const X = x(a.t);
        svg.querySelectorAll('.tl-q').forEach(q => (q.style.opacity = 0));
        const ring = el('circle', { cx: X, cy: axis, r: 11, fill: '#fbf8f1', stroke: ORANGE, 'stroke-width': 1.8 }, g);
        const tick = el('path', { d: `M${X - 5} ${axis} l3.6 4 l7 -9`, fill: 'none', stroke: ORANGE, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        for (const [k, node] of labels) if (k === a.t) node.remove();
        const box = el('g', {}, g);
        const W = +svg.getAttribute('viewBox').split(' ')[2];
        // Beside the circle (never on top of a payment arrow standing at that date).
        const right = X < W / 2;
        const txt = el('text', { x: right ? X + 18 : X - 18, y: axis - 12, 'text-anchor': right ? 'start' : 'end', class: 'st-answer' }, box);
        txt.textContent = fmtVal(a.value, a.unit);
        await fadeIn(ring, 250);
        await ink(tick, 420);
        if (!fast) box.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 450, fill: 'both', easing: 'ease-out' });
        return;
      }
      case 'note': {
        const t = el('text', { x: x(a.t), y: a.y ?? band + 66, 'text-anchor': 'middle', class: 'st-note', fill: color }, g);
        t.textContent = a.text;
        await fadeIn(t, 400);
        return;
      }
    }
  }

  let queue = Promise.resolve();
  return {
    /* Play actions in order (calls queue up so steps never overlap). */
    run(actions = [], { instant = false } = {}) {
      layer.querySelectorAll('.st-ghost').forEach(g => g.remove());
      queue = queue.then(async () => {
        fast = motion || instant;
        for (const a of actions) await act(a, false);
        fast = motion;
      });
      return queue;
    },
    /* A wrong answer: draw what this step is about in grey and give it a shake. */
    wrong(actions = []) {
      layer.querySelectorAll('.st-ghost').forEach(g => g.remove());
      const first = actions.find(a => a.do !== 'answer' && a.do !== 'note');
      if (first) act(first, true);
      if (!fast) svg.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-in-out' });
    },
    clear() {
      layer.innerHTML = '';
      labels.clear();
      svg.querySelectorAll('.tl-q').forEach(q => (q.style.opacity = ''));
    },
  };
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = k => (k === 1 ? '' : String(k).split('').map(c => SUP[+c] || c).join(''));

/*
 * Default animation for a problem whose steps carry none: on the last step, every payment
 * travels to the asked date with its factor, then the answer fills the circle.
 */
export function defaultFinish(prob, target, unit) {
  const tl = prob.timeline;
  if (!tl || tl.focal === undefined || tl.focal === null) return [];
  const f = tl.focal;
  const moves = tl.flows
    .filter(x => x.t !== f && x.side !== 'down')
    .slice(0, 10)
    .map(x => ({ do: 'move', from: x.t, to: f, label: x.t < f ? `×(1+i)${sup(f - x.t)}` : `×v${sup(x.t - f)}`, ms: tl.flows.length > 5 ? 380 : 600 }));
  return [...moves, { do: 'answer', t: f, value: target, unit }];
}
