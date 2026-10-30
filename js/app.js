import { TOPICS, LESSONS, DRILLS } from '../data/syllabus.js';
import { rng } from '../data/kit.js';
import { read, sameValue, money, toTex } from './expr.js';
import { timeline, drawPicks } from './timeline.js';
import { growthPlate, mountGrowth } from './growth.js';
import { makeStage, defaultFinish } from './stage.js';
import { heroPlate, tickMark, crossMark, monthSketch, startBirds } from './art.js';
import { dayKey, addDays, grade, dueToday, streak, isLearned, LEARNED_BOX, MAX_BOX } from './srs.js';
import { studyPlan, REVIEW_DAYS } from './plan.js';
import * as store from './store.js';
import { aggregateLog, sumDevices } from './merge.js';
import * as sync from './sync.js';
import { initPwa, installState, promptInstall } from './pwa.js';

/* ---------------------------------------------------------------- state */

let S = store.load();
const DEV = store.deviceId();
// Every change is saved here at once and synced to other devices a few seconds later.
const persist = () => {
  S.log = aggregateLog(S.devlog);
  store.save(S);
  sync.schedule();
};
const app = document.getElementById('app');
const lessonById = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const drillById = Object.fromEntries(DRILLS.map(d => [d.id, d]));
const topicById = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const today = () => dayKey();
/* This device's counters for today and for a lesson; counters only grow (see merge.js). */
const COUNT0 = { solved: 0, clean: 0, lessons: 0, steps: 0, first: 0 };
const bump = (map, key, add) => {
  map[key] = map[key] || {};
  const e = { ...COUNT0, ...(map[key][DEV] || {}) };
  for (const [k, v] of Object.entries(add)) e[k] = k === 'done' ? v : (e[k] || 0) + v;
  e.t = Date.now();
  map[key][DEV] = e;
};
const logToday = add => bump(S.devlog, today(), add);
const isLearned_ = id => !!(S.lessons[id] && !S.lessons[id].del);
const learnedOn = id => (isLearned_(id) ? S.lessons[id].at : null);
const lessonStats = id => sumDevices({ x: (S.devstat || {})[id] || {} }).x;
const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);

/* A problem's saved progress (steps answered so far), keyed by where it is played. */
const saveProg = (key, data) => {
  S.prog[key] = { ...(S.prog[key] || {}), ...data, t: Date.now() };
  persist();
};
/* Called after every attempt in any problem. */
function progressHandler(key, lessonId, extra = {}) {
  return (steps, ev) => {
    saveProg(key, { ...extra, steps, done: steps.every(x => x.done) });
    if (ev.finished) {
      const add = { steps: 1, first: ev.first ? 1 : 0 };
      logToday(add);
      bump(S.devstat, lessonId, add);
      persist();
    }
  };
}

/* ---------------------------------------------------------------- text */

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const K = (tex, display = false) => {
  try {
    return window.katex.renderToString(tex.replace(/\\angl\{\\infty\}/g, '\\angl{∞}'), { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
  } catch (e) {
    return `<code>${esc(tex)}</code>`;
  }
};
/* Prose with $inline maths$ and **bold**. */
const rich = s =>
  String(s)
    .split(/(\$[^$]+\$)/g)
    .map(p => (p.length > 2 && p[0] === '$' && p.endsWith('$') ? K(p.slice(1, -1)) : esc(p).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')))
    .join('');
const plain = s => String(s).replace(/\$([^$]+)\$/g, (m, t) => t.replace(/\\[a-z]+|[{}^_\\]/g, '')).replace(/\*\*/g, '');
const two = n => String(n).padStart(2, '0');
const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || n;

const fmt = (x, unit) => {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
  if (unit === 'rate') return `${(x * 100).toFixed(4).replace(/\.?0+$/, '')}%`;
  if (unit === 'number') return String(Math.round(x * 10000) / 10000);
  return money(x);
};

/* ---------------------------------------------------------------- shell */

function setView(name, title) {
  document.body.dataset.view = name;
  document.title = title ? `${plain(title)} · FM Notebook` : 'FM Notebook · Exam FM, one timeline at a time';
  window.scrollTo(0, 0);
}
function inkIn(root = app) {
  requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll('.plate, .draw').forEach(el => el.classList.add('on'))));
}
function observeDraw() {
  const els = app.querySelectorAll('.draw:not(.on)');
  if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('on'));
  const io = new IntersectionObserver(
    es =>
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.15 },
  );
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      els.forEach(el => {
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.classList.remove('on');
          io.observe(el);
        }
      }),
    ),
  );
}

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [view, arg] = h.split('/');
  if (view === 'lesson' && lessonById[arg]) return renderLesson(lessonById[arg]);
  if (view === 'drill' && drillById[arg]) return renderDrill(drillById[arg]);
  if (view === 'practice') return renderPractice();
  if (view === 'formulas') return renderFormulas();
  if (view === 'help') return renderHelp();
  if (view === 'settings') return renderSettings();
  return renderHome();
}
window.addEventListener('hashchange', route);

/* ---------------------------------------------------------------- numbers for the home page */

const allDrillIds = () => DRILLS.filter(d => isLearned_(d.lesson)).map(d => d.id);
const learnedMap = () => Object.fromEntries(LESSONS.filter(l => isLearned_(l.id)).map(l => [l.id, learnedOn(l.id)]));
const plan = () => studyPlan({ lessonIds: LESSONS.map(l => l.id), learned: learnedMap(), today: today(), examDate: S.settings.examDate });
const dueIds = () => dueToday(allDrillIds(), S.cards, { cap: S.settings.reviewCap, today: today() });

function last30() {
  const out = [];
  for (let k = 29; k >= 0; k--) {
    const key = addDays(today(), -k);
    const l = S.log[key];
    out.push({ key, count: l ? l.solved + l.steps / 3 + 3 * (l.lessons || 0) : 0, done: !!(l && l.done), today: k === 0 });
  }
  return out;
}

function examLabel() {
  const d = new Date(`${S.settings.examDate}T12:00:00`);
  return d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
}

/* ---------------------------------------------------------------- home */

function renderHome() {
  setView('home');
  const p = plan();
  const due = dueIds();
  const sk = streak(S.log, today());
  const acc = sumDevices({ all: Object.assign({}, ...Object.entries(S.devstat || {}).flatMap(([l, devs]) => Object.entries(devs).map(([dv, e]) => ({ [`${l}:${dv}`]: e })))) }).all;
  const next = p.next ? lessonById[p.next] : null;
  const learnedDrills = DRILLS.filter(d => isLearned(S.cards[d.id])).length;
  const boxes = Array.from({ length: MAX_BOX + 1 }, (_, b) => DRILLS.filter(d => S.cards[d.id] && S.cards[d.id].box === b).length);
  const boxMax = Math.max(1, ...boxes);
  const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  app.innerHTML = `
  <section class="hero">
    <div class="copy">
      <p class="eyebrow">SOA Exam FM · 金融数学</p>
      <h1 class="big-heading">Money on a line,<br><em class="accent">one date at a time.</em></h1>

      <div class="today card">
        <p class="kicker">Today · ${esc(dateStr)}</p>
        <div class="nums">
          <div><span class="big">${due.length}</span><span class="lab">to review<br><i>待复习</i></span></div>
          <div><span class="big">${p.done}<small>/${LESSONS.length}</small></span><span class="lab">lessons<br><i>已学课</i></span></div>
          <div><span class="big">${p.weeksLeft}</span><span class="lab">weeks left<br><i>距考试周数</i></span></div>
        </div>
        ${resumeLine()}
        ${next ? `<p class="next-line"><span class="kicker">Next lesson</span><a href="#/lesson/${next.id}">${rich(next.zh)}</a></p>` : `<p class="done-line"><span class="hand">All learned!</span> 全部课程学完了，接下来以复习为主。</p>`}
        <div class="actions">
          ${next ? `<a class="btn" href="#/lesson/${next.id}">学下一课 <span aria-hidden="true">→</span></a>` : ''}
          <a class="btn ${next ? 'ghost' : ''}" href="#/practice">${due.length ? `复习 ${due.length} 题` : '随手练几题'}</a>
        </div>
        <p class="note">${paceNote(p, sk)}</p>
      </div>
    </div>
    <figure class="plate-wrap">
      <div class="plate">${heroPlate({ lessons: LESSONS.length, topics: TOPICS.length, exam: examLabel() })}</div>
      <figcaption>Pl. I — the timeline <span>FM</span></figcaption>
    </figure>
  </section>

  <section id="syllabus">
    <h2 class="numbered-heading draw">The syllabus</h2>
    <p class="chapter-lede">按 SOA 考纲的五个部分，橙色是考试比重。</p>
    <div class="topics">
      ${TOPICS.map(t => topicCard(t)).join('')}
    </div>
  </section>

  <section id="progress">
    <h2 class="numbered-heading draw">Progress</h2>
    <p class="chapter-lede">一次做对就升一格，看了答案就明天再来。</p>
    <div class="progress-grid">
      <div class="engraved">
        <div><span class="big">${p.done}</span><span class="lab">lessons · 已学课</span></div>
        <div><span class="big">${learnedDrills}<small>/${DRILLS.length}</small></span><span class="lab">mastered · 掌握的题型</span></div>
        <div><span class="big">${acc.steps ? `${pct(acc.first, acc.steps)}<small>%</small>` : '—'}</span><span class="lab">first-try accuracy · 一次答对</span></div>
      </div>
      <figure class="month-wrap draw">
        ${monthSketch(last30())}
        <figcaption>The last 30 days — 斜线越密练得越多，打勾表示当天的复习清空了。</figcaption>
      </figure>
      <figure class="boxes draw" aria-label="Drills per review box">
        ${boxes.map((n, b) => `<div class="box ${b >= LEARNED_BOX ? 'warm' : ''}" style="--i:${b}"><span class="bar" style="--h:${((n / boxMax) * 100).toFixed(1)}%"></span><span class="n">${n}</span><span class="b">${b}</span></div>`).join('')}
        <figcaption>Leitner boxes · 每个盒子里的题型数</figcaption>
      </figure>
    </div>
  </section>

  <section id="method">
    <h2 class="numbered-heading draw">The method</h2>
    <ol class="method">
      <li><span class="step">I</span><h3>Draw</h3><p>把文字画成时间轴：每笔钱在哪一刻、往哪个方向。</p><span class="hand">t = 0, 1, 2 …</span></li>
      <li><span class="step">II</span><h3>Move</h3><p>${rich('选一个比较日，判断每笔钱往后乘 $(1+i)^k$ 还是往前乘 $v^k$。')}</p><span class="hand">× v³</span></li>
      <li><span class="step">III</span><h3>Write</h3><p>把式子写出来，比如 <code>250a(10)v^3</code>。页面替你算数，你只管思路。</p><span class="hand">no calculator</span></li>
      <li><span class="step">IV</span><h3>Return</h3><p>同一个题型换新数字，隔几天再出现，直到不用提示也能写对。</p><span class="hand">1, 2, 4, 7 …</span></li>
    </ol>
    <p class="more"><a class="link" href="#/help">式子怎么写 · 符号表</a> · <a class="link" href="#/formulas">公式本</a></p>
  </section>`;
  inkIn();
  observeDraw();
}

/* "Pick up where you left off": the most recent unfinished example or drill. */
function resumeLine() {
  const open = Object.entries(S.prog || {})
    .filter(([k, v]) => k !== 'session' && v && !v.done && v.steps && v.steps.some(x => x.done))
    .sort((a, b) => b[1].t - a[1].t)[0];
  if (!open) return '';
  const [key, v] = open;
  const [kind, id] = key.split('/');
  const item = kind === 'ex' ? lessonById[id] : drillById[id];
  if (!item) return '';
  const k = v.steps.filter(x => x.done).length;
  const href = kind === 'ex' ? `#/lesson/${id}` : `#/drill/${id}`;
  return `<p class="next-line resume"><span class="kicker">Continue · 接着做</span><a href="${href}">${rich(item.zh)} <i>${kind === 'ex' ? '例题' : '练习'}第 ${k + 1} 步</i></a></p>`;
}

function paceNote(p, sk) {
  if (!p.left) return '全部学完 · 每天清空复习';
  if (p.inReview) return `考前复习期 · 还有 ${p.left} 课没学`;
  return `每周 ${p.perWeek} 课 · 本周已学 ${p.thisWeek} 课${sk ? ` · 连续 ${sk} 天` : ''}`;
}

/* "例题 2/3 · 正确率 83%" under a lesson in the syllabus. */
function lessonMeta(l) {
  const parts = [];
  const ex = S.prog[`ex/${l.id}`];
  const n = l.example(rng(7)).steps.length;
  if (ex && ex.steps) {
    const k = ex.steps.filter(x => x.done).length;
    if (k) parts.push(k >= n ? '例题完成' : `例题 ${k}/${n} 步`);
  }
  const st = lessonStats(l.id);
  if (st.steps) parts.push(`正确率 ${pct(st.first, st.steps)}% · ${st.steps} 步`);
  if (isLearned_(l.id)) parts.unshift(`学于 ${learnedOn(l.id).slice(5).replace('-', '/')}`);
  return parts.length ? `<em class="lmeta">${parts.join(' · ')}</em>` : '';
}

function topicCard(t) {
  const ls = t.lessons;
  const learned = ls.filter(l => isLearned_(l.id)).length;
  const nextId = plan().next;
  return `<article class="topic draw">
    <header>
      <span class="tno">${roman(t.no)}</span>
      <div>
        <h3>${esc(t.en)}</h3>
        <p class="tsub">${esc(t.zh)} · <span class="weight">${esc(t.weight)}</span></p>
      </div>
      <span class="tcount">${learned} / ${ls.length || '—'}</span>
    </header>
    ${t.blurb ? `<p class="tblurb">${rich(t.blurb)}</p>` : ''}
    ${
      ls.length
        ? `<ol class="lessons">${ls
            .map(
              (l, k) => {
                const done = isLearned_(l.id);
                return `<li class="${done ? 'learned' : ''} ${l.id === nextId ? 'is-next' : ''}">
          <a href="#/lesson/${l.id}"><span class="lno">${t.no}.${k + 1}</span><span class="lname">${rich(l.zh)}<i>${esc(l.en)}</i>${lessonMeta(l)}</span>
          <span class="lmark" aria-label="${done ? 'learned' : ''}">${done ? tickMark() : l.id === nextId ? '<span class="hand">next</span>' : ''}</span></a></li>`;
              },
            )
            .join('')}</ol>`
        : `<p class="note">这一部分的课程还在写。</p>`
    }
  </article>`;
}

/* ---------------------------------------------------------------- lesson */

function renderBlock(b) {
  switch (b.type) {
    case 'p':
      return `<p>${rich(b.text)}</p>`;
    case 'math':
      return `<figure class="formula">${K(b.tex, true)}${b.note ? `<figcaption>${rich(b.note)}</figcaption>` : ''}</figure>`;
    case 'timeline':
      return `<figure class="tl-wrap plate">${timeline(b.spec)}${b.caption ? `<figcaption>${rich(b.caption)}</figcaption>` : ''}</figure>`;
    case 'growth':
      return growthPlate({ ...b.spec, caption: plain(b.caption || ''), captionHtml: b.caption ? rich(b.caption) : '' });
    case 'terms':
      return `<dl class="terms">${b.rows.map(([en, zh, def]) => `<div><dt>${rich(en)}</dt><dd><b>${rich(zh)}</b>${def ? ` — ${rich(def)}` : ''}</dd></div>`).join('')}</dl>`;
    case 'tip':
      return `<aside class="tip"><span class="hand">note</span><p>${rich(b.text)}</p></aside>`;
    case 'table':
      return `<div class="table-wrap"><table><thead><tr>${b.head.map(h => `<th>${rich(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table></div>`;
    case 'recipe':
      return `<div class="recipe"><p class="kicker">${rich(b.title)}</p><ol>${b.items.map(x => `<li>${rich(x)}</li>`).join('')}</ol></div>`;
  }
  return '';
}

function renderLesson(l) {
  const t = topicById[l.topic];
  const k = t.lessons.findIndex(x => x.id === l.id);
  setView('lesson', l.zh);
  const flat = LESSONS.findIndex(x => x.id === l.id);
  const prev = LESSONS[flat - 1];
  const nxt = LESSONS[flat + 1];
  const learned = isLearned_(l.id);
  app.innerHTML = `
  <article class="lesson">
    <a class="back" href="#/">← Syllabus</a>
    <header class="lesson-head">
      <p class="eyebrow">${roman(t.no)} · ${esc(t.en)} · Lesson ${t.no}.${k + 1}</p>
      <h1 class="medium-heading">${rich(l.zh)}</h1>
      <p class="sub">${esc(l.en)} <span class="obj">SOA ${esc(l.outcome)}</span></p>
    </header>

    <div class="learn">${l.learn.map(renderBlock).join('')}</div>

    <section class="follow">
      <h2 class="small-heading"><span class="hand">follow along</span> 跟着做一道</h2>
      <div class="card sheet" id="example"></div>
    </section>

    <section class="drills">
      <h2 class="small-heading"><span class="hand">your turn</span> 自己练</h2>
      <p class="note">每次点开都是新数字。学完这一课，这些题型会进入复习。</p>
      <ul class="drill-list">
        ${l.drills.map(d => `<li><a href="#/drill/${d.id}"><span class="dname">${rich(d.zh)}</span>${pips(S.cards[d.id])}<span class="go">练一题 →</span></a></li>`).join('')}
      </ul>
      <div class="actions">
        ${learned ? `<p class="done-line">${tickMark()}<span>这一课学过了（${esc(learnedOn(l.id))}）。</span><button class="link" data-act="unlearn">标记为未学</button></p>` : `<button class="btn" data-act="learned">这一课学完了 ✓</button>`}
        <a class="btn ghost" href="#/practice">去复习</a>
      </div>
    </section>

    <nav class="pager">
      ${prev ? `<a href="#/lesson/${prev.id}">← ${rich(prev.zh)}</a>` : '<span></span>'}
      ${nxt ? `<a href="#/lesson/${nxt.id}">${rich(nxt.zh)} →</a>` : '<span></span>'}
    </nav>
  </article>`;
  inkIn();
  observeDraw();
  mountGrowth(app);
  const exKey = `ex/${l.id}`;
  const exEl = app.querySelector('#example');
  const playExample = saved =>
    mountProblem(exEl, l.example(rng(7)), {
      label: 'Example',
      saved,
      onProgress: progressHandler(exKey, l.id),
      onDone: (res, el) => {
        el.insertAdjacentHTML('beforeend', `<div class="actions"><button class="link" data-redo>重新做一遍例题</button></div>`);
        el.querySelector('[data-redo]').addEventListener('click', () => {
          saveProg(exKey, { steps: [], done: false });
          playExample(null);
        });
      },
    });
  playExample(S.prog[exKey] && S.prog[exKey].steps && S.prog[exKey].steps.length ? S.prog[exKey].steps : null);
  const un = app.querySelector('[data-act="unlearn"]');
  if (un)
    un.addEventListener('click', () => {
      S.lessons[l.id] = { del: true, t: Date.now() };
      persist();
      renderLesson(l);
    });
  const btn = app.querySelector('[data-act="learned"]');
  if (btn)
    btn.addEventListener('click', () => {
      S.lessons[l.id] = { at: today(), t: Date.now() };
      for (const d of l.drills) if (!S.cards[d.id]) S.cards[d.id] = { box: 0, due: today(), right: 0, wrong: 0, last: null, t: Date.now() };
      logToday({ lessons: 1 });
      persist();
      renderLesson(l);
      app.querySelector('.drills').scrollIntoView({ block: 'start' });
    });
}

const pips = c => `<span class="pips" aria-label="box ${c ? c.box : 0}">${Array.from({ length: MAX_BOX }, (_, k) => `<i class="${c && c.box > k ? (k + 1 >= LEARNED_BOX ? 'w' : 'f') : ''}"></i>`).join('')}</span>`;

/* ---------------------------------------------------------------- the problem player */

const KEYS = ['v', 'i', '^', '(', ')', '×', '÷', '+', '−', 'a(', 'ä(', 's(', 'ln(', '←'];

/*
 * Plays one problem step by step. The timeline is a stage: each right answer makes the money
 * on it move the way the step describes (step.anim, see js/stage.js); a wrong answer draws
 * that part in grey, shakes it and opens the hint.
 *
 * Progress is reported after every attempt (opts.onProgress), so the page can save it at
 * once; opts.saved restores a problem where it was left, finished steps shown as answered.
 */
function mountProblem(root, prob, { onDone, onProgress, saved = null, label = '' } = {}) {
  const vars = prob.vars || {};
  const steps = prob.steps;
  const st = steps.map((_, k) => ({ wrong: 0, revealed: false, done: false, ...((saved && saved[k]) || {}) }));
  const hasFocal = prob.timeline && prob.timeline.focal !== undefined && prob.timeline.focal !== null;
  const annotated = steps.some(s => s.anim && s.anim.length);
  const lastExpr = [...steps].reverse().find(s => s.kind === 'expr');
  let restoring = false;

  // What the timeline does when step k is answered.
  const animFor = k => {
    const s = steps[k];
    let a = s.anim ? [...s.anim] : [];
    if (k === steps.length - 1 && hasFocal && lastExpr) {
      if (!annotated) a = defaultFinish(prob, lastExpr.target, lastExpr.unit);
      else if (!steps.some(x => (x.anim || []).some(y => y.do === 'answer'))) a.push({ do: 'answer', t: prob.timeline.focal, value: lastExpr.target, unit: lastExpr.unit });
    }
    return a;
  };

  root.innerHTML = `
    ${label ? `<p class="kicker">${esc(label)}</p>` : ''}
    <p class="ptext">${rich(prob.text)}</p>
    ${varsLine(vars)}
    ${prob.timeline ? `<figure class="tl-wrap plate stage-wrap">${timeline(prob.timeline, { stage: true })}</figure>` : ''}
    <ol class="steps"></ol>
    <div class="pdone"></div>`;
  const list = root.querySelector('.steps');
  const stage = prob.timeline ? makeStage(root.querySelector('.stage-wrap svg')) : null;
  inkIn(root);

  const report = (k, finished) => {
    if (onProgress) onProgress(st.map(x => ({ ...x })), { step: k, finished, first: finished && !st[k].wrong && !st[k].revealed });
  };
  const play = (k, opts) => stage && stage.run(animFor(k), opts);
  const oops = (k, li) => {
    if (stage) stage.wrong(animFor(k));
    const hb = li.querySelector('[data-hint]');
    if (hb && !hb.hidden) hb.click();
  };

  const showStep = k => {
    const s = steps[k];
    const li = document.createElement('li');
    li.className = `step step-${s.kind}`;
    li.innerHTML = `<p class="ask"><span class="sno">${k + 1}</span>${rich(s.ask)}</p><div class="body"></div><div class="fb" aria-live="polite"></div>`;
    list.append(li);
    const body = li.querySelector('.body');
    const fb = li.querySelector('.fb');
    const finish = () => {
      st[k].done = true;
      li.classList.add('is-done');
      if (s.why) fb.insertAdjacentHTML('beforeend', `<p class="why">${rich(s.why)}</p>`);
      if (!restoring) {
        report(k, true);
        play(k);
      }
      const nextK = k + 1;
      if (nextK < steps.length) {
        if (restoring && st[nextK].done) showStep(nextK);
        else setTimeout(() => showStep(nextK), restoring ? 0 : 260);
      } else complete();
    };
    const tried = () => {
      st[k].wrong++;
      report(k, false);
      oops(k, li);
    };

    if (s.kind === 'choice') {
      const order = s.options.map((o, j) => j).sort((a, b) => hash(s.ask + s.options[a].text) - hash(s.ask + s.options[b].text));
      body.innerHTML = `<div class="options">${order.map((j, n) => `<button class="opt" data-j="${j}"><b>${'ABCDE'[n]}</b><span>${rich(s.options[j].text)}</span></button>`).join('')}</div>${hintBtn(s)}`;
      const right = () => [...body.querySelectorAll('.opt')].find(x => s.options[+x.dataset.j].ok);
      const lock = () => body.querySelectorAll('.opt').forEach(x => (x.disabled = true));
      if (st[k].done) {
        right().classList.add('right');
        lock();
        fb.innerHTML = st[k].revealed ? `<p class="why">正确的是：${rich(s.options.find(o => o.ok).text)}</p>` : verdict(true, '对。');
        return finish();
      }
      body.querySelectorAll('.opt').forEach(b =>
        b.addEventListener('click', () => {
          if (st[k].done) return;
          const o = s.options[+b.dataset.j];
          if (o.ok) {
            b.classList.add('right');
            lock();
            fb.innerHTML = verdict(true, st[k].wrong ? '这次对了。' : '对。');
            finish();
          } else {
            b.classList.add('wrong');
            b.disabled = true;
            fb.innerHTML = verdict(false, o.why ? rich(o.why) : '再想想。');
            tried();
            if (st[k].wrong >= 2) {
              st[k].revealed = true;
              right().classList.add('right');
              lock();
              fb.insertAdjacentHTML('beforeend', `<p class="why">正确的是：${rich(s.options.find(o2 => o2.ok).text)}</p>`);
              finish();
            }
          }
        }),
      );
    }

    if (s.kind === 'expr') {
      body.innerHTML = `
        <div class="expr">
          <input class="answer" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="你的式子" placeholder="${esc(placeholderFor(s))}">
          <div class="preview" aria-live="polite"></div>
          <div class="keys">${KEYS.map(c => `<button type="button" data-k="${esc(c)}">${c === '←' ? '⌫' : esc(c)}</button>`).join('')}</div>
          <div class="actions"><button class="btn" data-check>检查 <span aria-hidden="true">↵</span></button>${hintBtn(s)}<button class="link" data-show hidden>看思路</button></div>
        </div>`;
      const inp = body.querySelector('.answer');
      const pre = body.querySelector('.preview');
      const show = body.querySelector('[data-show]');
      const update = () => {
        const r = read(inp.value, { ...vars, ...(s.vars || {}) });
        if (r.empty) pre.innerHTML = '';
        else if (r.ok) pre.innerHTML = `${r.tex ? K(r.tex) : ''}<span class="eq">= ${esc(fmt(r.value, s.unit))}</span>`;
        else pre.innerHTML = `<span class="err">${esc(r.error)}</span>`;
      };
      const close = () => {
        inp.disabled = true;
        body.querySelector('.keys').remove();
        body.querySelector('.expr .actions').remove();
      };
      if (st[k].done) {
        inp.value = st[k].typed || s.model;
        update();
        close();
        fb.innerHTML = st[k].revealed ? modelLine(s, '思路') : verdict(true, `= ${esc(fmt(s.target, s.unit))}`) + modelLine(s, '一种标准写法');
        return finish();
      }
      if (st[k].typed) {
        inp.value = st[k].typed;
        update();
      }
      if (st[k].wrong >= S.settings.revealAfter) show.hidden = false;
      inp.addEventListener('input', update);
      body.querySelectorAll('.keys button').forEach(b =>
        b.addEventListener('click', () => {
          const c = b.dataset.k;
          const p0 = inp.selectionStart ?? inp.value.length;
          const p1 = inp.selectionEnd ?? p0;
          if (c === '←') {
            const a0 = p0 === p1 ? Math.max(0, p0 - 1) : p0;
            inp.value = inp.value.slice(0, a0) + inp.value.slice(p1);
            inp.setSelectionRange(a0, a0);
          } else {
            const ins = { '×': '*', '÷': '/', '−': '-' }[c] || c;
            inp.value = inp.value.slice(0, p0) + ins + inp.value.slice(p1);
            inp.setSelectionRange(p0 + ins.length, p0 + ins.length);
          }
          inp.focus({ preventScroll: true });
          update();
        }),
      );
      const check = () => {
        if (st[k].done) return;
        const r = read(inp.value, { ...vars, ...(s.vars || {}) });
        if (r.empty) return inp.focus();
        if (!r.ok) {
          fb.innerHTML = verdict(false, esc(r.error));
          return;
        }
        st[k].typed = inp.value;
        let ok = sameValue(r.value, s.target);
        let extra = '';
        if (!ok && s.unit === 'rate' && sameValue(r.value / 100, s.target)) {
          ok = true;
          extra = '（利率记得写成 0.05 或 5%。）';
        }
        if (ok) {
          close();
          fb.innerHTML = verdict(true, `= ${esc(fmt(s.target, s.unit))}${extra}`) + modelLine(s, '一种标准写法');
          finish();
        } else {
          fb.innerHTML = verdict(false, `你的式子等于 ${esc(fmt(r.value, s.unit))}，还不对。`);
          tried();
          if (st[k].wrong >= S.settings.revealAfter) show.hidden = false;
        }
      };
      body.querySelector('[data-check]').addEventListener('click', check);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          check();
        }
      });
      show.addEventListener('click', () => {
        st[k].revealed = true;
        inp.value = s.model;
        update();
        close();
        fb.innerHTML = `<div class="verdict"><p class="v-main">思路是这样：</p></div>` + modelLine(s, '');
        finish();
      });
      if (!restoring) setTimeout(() => inp.focus({ preventScroll: true }), 50);
    }

    if (s.kind === 'place') {
      const n = s.n - 1;
      body.innerHTML = `<figure class="tl-wrap plate placing">${timeline({ n, flows: [] }, { place: true, stage: true })}</figure><p class="note">点时间轴上的刻度放上付款，再点一下取消。</p><div class="actions"><button class="btn" data-check>检查</button>${hintBtn(s)}</div>`;
      const svg = body.querySelector('svg');
      const pstage = makeStage(svg);
      const picks = new Set();
      const want = [...new Set(s.answer)].sort((a, b) => a - b);
      inkIn(body);
      const land = instant => {
        drawPicks(svg, new Set(), n);
        body.querySelector('.actions').remove();
        body.querySelector('.note').remove();
        pstage.run(want.map(t => ({ do: 'drop', t, ms: 300 })), { instant });
      };
      if (st[k].done) {
        land(true);
        fb.innerHTML = verdict(true, `付款在 t = ${want.join(', ')}。`);
        return finish();
      }
      svg.querySelectorAll('.tl-hit').forEach(h =>
        h.addEventListener('click', () => {
          if (st[k].done) return;
          const t = +h.dataset.t;
          picks.has(t) ? picks.delete(t) : picks.add(t);
          drawPicks(svg, picks, n);
        }),
      );
      body.querySelector('[data-check]').addEventListener('click', () => {
        if (st[k].done) return;
        const ok = picks.size === want.length && want.every(t => picks.has(t));
        if (ok) {
          land(false);
          fb.innerHTML = verdict(true, `付款在 t = ${want.join(', ')}。`);
          finish();
        } else {
          fb.innerHTML = verdict(false, `还不对。${st[k].wrong >= 1 ? `应该是 t = ${want.join(', ')}。` : '再读一遍题目里的“年初/年末”。'}`);
          tried();
          pstage.wrong([]);
          if (st[k].wrong >= 2) {
            st[k].revealed = true;
            land(false);
            finish();
          }
        }
      });
    }

    const hb = li.querySelector('[data-hint]');
    if (hb)
      hb.addEventListener('click', () => {
        hb.hidden = true;
        fb.insertAdjacentHTML('afterbegin', `<p class="hint"><span class="hand">hint</span> ${rich(s.hint)}</p>`);
      });
    if (!restoring) li.scrollIntoView({ block: 'nearest', behavior: k ? 'smooth' : 'auto' });
  };

  const complete = () => {
    const clean = st.every(x => !x.revealed);
    const wrongs = st.reduce((a, x) => a + x.wrong, 0);
    root.querySelector('.pdone').innerHTML = `<div class="summary-line ${clean ? 'is-right' : ''}">${clean ? tickMark() : crossMark()}<p>${clean ? (wrongs ? '做出来了，中间想错了一下，没关系。' : '一次就对。') : '这次看了答案。这个题型明天会再出现。'}</p></div>`;
    if (onDone) onDone({ clean, wrongs, restored: restoring }, root.querySelector('.pdone'));
  };

  // Replay finished steps instantly (state and timeline), then continue live.
  if (st[0].done) {
    restoring = true;
    showStep(0);
    restoring = false;
    if (stage) for (let k = 0; k < steps.length && st[k].done; k++) stage.run(animFor(k), { instant: true });
  } else showStep(0);
}

const hash = s => {
  let h = 2166136261;
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619);
  return h >>> 0;
};

/* The quantities a learner may type in this problem, e.g. "i = 5%   P = 1,295.05". */
const RATE_NAMES = /^(i|j|k|g|d|r|f|delta|s\d+|f\d+)$/;
function varsLine(vars) {
  const names = Object.keys(vars).filter(n => Number.isFinite(vars[n]));
  if (!names.length) return '';
  const show = n => {
    const x = vars[n];
    const val = RATE_NAMES.test(n) && Math.abs(x) < 1 ? fmt(x, 'rate') : Math.abs(x) >= 100 ? money(x) : String(Math.round(x * 1e6) / 1e6);
    return `<span><code>${esc(n)}</code> = ${esc(val)}</span>`;
  };
  const extra = 'i' in vars ? '<span class="also">也可以用 <code>v</code>、<code>d</code>、<code>delta</code></span>' : '';
  return `<p class="vars"><span class="kicker">可直接写进式子</span>${names.map(show).join('')}${extra}</p>`;
}

const hintBtn = s => (s.hint ? `<button class="link" data-hint>提示</button>` : '');
const verdict = (ok, html) => `<div class="verdict ${ok ? 'is-right' : ''}">${ok ? tickMark() : crossMark()}<p class="v-main">${html}</p></div>`;
const modelLine = (s, lab) => {
  let tex = '';
  try {
    tex = toTex(s.model);
  } catch (e) {
    /* show the raw text instead */
  }
  return `<p class="model">${lab ? `<span class="kicker">${esc(lab)}</span>` : ''}${tex ? K(tex) : ''} <code class="typed">${esc(s.model)}</code></p>`;
};
const placeholderFor = s => (s.unit === 'rate' ? '例如 (1+0.08/4)^4 - 1' : s.unit === 'number' ? '写成式子或数字' : '例如 200(1+i) + 300v^2');

/* ---------------------------------------------------------------- one drill */

function renderDrill(d) {
  const l = lessonById[d.lesson];
  setView('drill', d.zh);
  app.innerHTML = `
  <section class="drill-page">
    <a class="back" href="#/lesson/${l.id}">← ${rich(l.zh)}</a>
    <header class="drill-head"><p class="eyebrow">Drill · ${esc(topicById[d.topic].en)}</p><h1 class="medium-heading">${rich(d.zh)}</h1>${pips(S.cards[d.id])}</header>
    <div class="card sheet" id="drill"></div>
  </section>`;
  const key = `dr/${d.id}`;
  const play = fresh => {
    const p = S.prog[key];
    const resume = !fresh && p && !p.done && p.seed;
    const seed = resume ? p.seed : (Math.random() * 2 ** 31) | 0;
    if (!resume) saveProg(key, { seed, steps: [], done: false });
    mountProblem(app.querySelector('#drill'), d.gen(rng(seed)), {
      saved: resume ? p.steps : null,
      onProgress: progressHandler(key, d.lesson, { seed }),
      onDone: (res, el) => {
        if (!res.restored) record(d, res);
        el.insertAdjacentHTML('beforeend', `<div class="actions"><button class="btn" data-again>再来一题 →</button><a class="btn ghost" href="#/lesson/${l.id}">回到课文</a></div>`);
        el.querySelector('[data-again]').addEventListener('click', () => {
          play(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      },
    });
  };
  play(false);
}

/* Grade a drill only when its lesson has been learned (free play before that is just practice). */
function record(d, { clean }) {
  logToday({ solved: 1, clean: clean ? 1 : 0 });
  if (isLearned_(d.lesson)) S.cards[d.id] = grade(S.cards[d.id], clean, today());
  if (!dueIds().length && isLearned_(d.lesson)) logToday({ done: true });
  persist();
}

/* ---------------------------------------------------------------- daily practice */

let queue = null;

/* Today's review keeps its place: leave mid-way (or close the tab) and it resumes here. */
async function renderPractice(fresh = false) {
  setView('practice', 'Review');
  const saved = S.prog.session;
  if (!fresh && saved && saved.day === today() && saved.k < saved.ids.length && saved.ids.every(id => drillById[id])) {
    queue = saved;
    return nextInQueue();
  }
  await syncFirst();
  let ids = dueIds();
  let mode = 'due';
  if (!ids.length) {
    const learned = allDrillIds();
    mode = learned.length ? 'free' : 'none';
    ids = learned.sort(() => Math.random() - 0.5).slice(0, 5);
  }
  if (mode === 'none') {
    const p = plan();
    app.innerHTML = `<section class="session"><div class="card sheet"><p class="kicker">Review</p><h1 class="medium-heading">还没有要复习的题</h1><p>先学一课：学完以后，它的题型就会出现在这里。</p><div class="actions">${p.next ? `<a class="btn" href="#/lesson/${p.next}">去学 ${rich(lessonById[p.next].zh)} →</a>` : ''}</div></div></section>`;
    return;
  }
  queue = { day: today(), ids, k: 0, clean: 0, mode, seed: 0, steps: [] };
  nextInQueue();
}

const saveQueue = () => {
  S.prog.session = { ...queue, t: Date.now() };
  persist();
};

function nextInQueue() {
  const q = queue;
  if (q.k >= q.ids.length) {
    saveQueue();
    return renderSummary();
  }
  const d = drillById[q.ids[q.k]];
  const l = lessonById[d.lesson];
  const resume = q.seed && q.steps && q.steps.some(x => x.done);
  if (!q.seed) {
    q.seed = (Math.random() * 2 ** 31) | 0;
    q.steps = [];
  }
  saveQueue();
  app.innerHTML = `
  <section class="session">
    <div class="topline">
      <a class="quit" href="#/" aria-label="退出">× <span>quit</span></a>
      <div class="track"><span style="width:${((q.k / q.ids.length) * 100).toFixed(1)}%"></span></div>
      <span class="count">${q.k + 1}<i>/</i>${q.ids.length}</span>
    </div>
    <p class="kicker">${q.mode === 'due' ? 'Review' : 'Free practice'} · <a href="#/lesson/${l.id}">${rich(l.zh)}</a></p>
    <h2 class="small-heading">${rich(d.zh)} ${pips(S.cards[d.id])}</h2>
    <div class="card sheet" id="item"></div>
  </section>`;
  mountProblem(app.querySelector('#item'), d.gen(rng(q.seed)), {
    saved: resume ? q.steps : null,
    onProgress: (steps, ev) => {
      q.steps = steps;
      saveQueue();
      if (ev.finished) {
        const add = { steps: 1, first: ev.first ? 1 : 0 };
        logToday(add);
        bump(S.devstat, d.lesson, add);
        persist();
      }
    },
    onDone: (res, el) => {
      if (!q.graded) {
        record(d, res);
        if (res.clean) q.clean++;
        q.graded = true;
        saveQueue();
      }
      el.insertAdjacentHTML('beforeend', `<div class="actions"><button class="btn" data-next>${q.k + 1 < q.ids.length ? '下一题 →' : '看小结'}</button></div>`);
      const b = el.querySelector('[data-next]');
      b.addEventListener('click', () => {
        q.k++;
        q.seed = 0;
        q.steps = [];
        q.graded = false;
        nextInQueue();
      });
      b.focus({ preventScroll: true });
    },
  });
}

function renderSummary() {
  const q = queue;
  const p = plan();
  setView('summary', 'Done');
  app.innerHTML = `
  <section class="summary">
    <div class="card sheet">
      <p class="kicker">Done · ${esc(new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }))}</p>
      <h1 class="medium-heading">${q.clean === q.ids.length ? 'Clean sheet.' : 'Done for now.'}</h1>
      <div class="nums">
        <div><span class="big">${q.ids.length}</span><span class="lab">solved<br><i>做了</i></span></div>
        <div><span class="big">${q.clean}</span><span class="lab">without help<br><i>没看答案</i></span></div>
        <div><span class="big">${streak(S.log, today())}</span><span class="lab">days in a row<br><i>连续天数</i></span></div>
      </div>
      <figure class="month-wrap draw">${monthSketch(last30())}</figure>
      <p class="sign hand">see you tomorrow</p>
      <div class="actions">
        ${p.next ? `<a class="btn" href="#/lesson/${p.next}">学下一课 →</a>` : ''}
        <a class="btn ghost" href="#/">回到首页</a>
        <button class="link" data-more>再练 5 题</button>
      </div>
    </div>
  </section>`;
  inkIn();
  app.querySelector('[data-more]').addEventListener('click', () => renderPractice(true));
}

/* ---------------------------------------------------------------- formulas */

function renderFormulas() {
  setView('formulas', '公式本');
  app.innerHTML = `
  <section class="formulas">
    <a class="back" href="#/">← Home</a>
    <p class="eyebrow">Formula notebook</p>
    <h1 class="medium-heading">公式本</h1>
    <p class="lede">每一课的公式按顺序收在这里，学过的课是实线，没学的是浅色。考前翻一遍：每个公式都能说出“它在时间轴上是什么意思”，才算真的记住了。</p>
    ${TOPICS.filter(t => t.lessons.length)
      .map(
        t => `<h2 class="numbered-heading draw">${esc(t.en)}</h2>
      ${t.lessons
        .map(l => {
          const ms = l.learn.filter(b => b.type === 'math');
          if (!ms.length) return '';
          return `<div class="fbook ${isLearned_(l.id) ? '' : 'unlearned'}"><a class="fhead" href="#/lesson/${l.id}">${rich(l.zh)}</a>${ms.map(renderBlock).join('')}</div>`;
        })
        .join('')}`,
      )
      .join('')}
  </section>`;
  inkIn();
  observeDraw();
}

/* ---------------------------------------------------------------- help */

function renderHelp() {
  setView('help', '式子怎么写');
  const rows = [
    ['100v^3', '100 往前搬 3 期'],
    ['100(1+i)^3', '100 往后搬 3 期（括号前的乘号可以省）'],
    ['250a(10)', '每期末付 250，共 10 期的现值：$250\\,a_{\\angl{10}}$'],
    ['250ad(10)  或  250ä(10)', '期初付款：$250\\,\\ddot a_{\\angl{10}}$'],
    ['s(10)、sd(10)', '终值 $s_{\\angl{10}}$、$\\ddot s_{\\angl{10}}$'],
    ['a(inf)、ad(inf)', '永续年金 $1/i$、$1/d$'],
    ['Ia(5)、Da(5)', '递增 1,2,…,5 / 递减 5,4,…,1'],
    ['abar(5)', '连续年金 $\\bar a_{\\angl{5}}$'],
    ['a(12, 0.01)', '用另一个利率（这里每期 1%）'],
    ['(1+0.08/4)^4 - 1', '利率可以写小数或百分数，例如 8%'],
    ['ln(1.05)、exp(0.25)', '对数、指数'],
  ];
  app.innerHTML = `
  <section class="help">
    <a class="back" href="#/">← Home</a>
    <p class="eyebrow">How to write a set-up</p>
    <h1 class="medium-heading">式子怎么写</h1>
    <p class="lede">你只需要写出“怎么算”，页面会马上算出数值。题目里的利率就是 <code>i</code>，<code>v</code>、<code>d</code>、<code>delta</code> 也可以直接用。乘号可以省略，<code>^</code> 是乘方。</p>
    <div class="table-wrap"><table class="syntax"><thead><tr><th>写法</th><th>意思</th></tr></thead><tbody>
      ${rows.map(([a, b]) => `<tr><td><code>${esc(a)}</code></td><td>${rich(b)}</td></tr>`).join('')}
    </tbody></table></div>
    <h2 class="small-heading">做错了怎么办</h2>
    <p>每一步都可以先点“提示”。同一步错两次，会出现“看思路”，它会把一种标准写法填进去并说明为什么。看了思路的题型会算作“这次没做出来”，明天再出一次，直到你自己能写出来。</p>
  </section>`;
}

/* ---------------------------------------------------------------- settings */

function renderSettings() {
  setView('settings', 'Settings');
  const s = S.settings;
  app.innerHTML = `
  <section class="settings">
    <a class="back" href="#/">← Home</a>
    <p class="eyebrow">Settings</p>
    <h1 class="medium-heading">设置</h1>
    <div class="card form prefs">
      <label class="row"><span>考试日期<br><small class="tsub">用来排每周进度；最后 ${REVIEW_DAYS} 天留给总复习</small></span><input type="date" name="examDate" value="${esc(s.examDate)}"></label>
      <label class="row"><span>每天最多复习几题</span><select name="reviewCap">${[10, 15, 20, 30, 50].map(n => `<option ${n === s.reviewCap ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="row"><span>错几次后出现“看思路”</span><select name="revealAfter">${[1, 2, 3].map(n => `<option ${n === s.revealAfter ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <p class="saved hand" hidden>saved</p>
    </div>
    ${syncCard()}
    ${installCard()}
    <div class="card form">
      <p class="kicker">Your progress · 备份</p>
      <p>${sync.config() ? '进度保存在这台设备上，并同步到你的私密 Gist。导出的文件可以留作备份。' : '没有连接同步时，进度只保存在这台设备的浏览器里：每答一步都会自动保存，刷新或关掉浏览器都不会丢。也可以导出文件，再在另一台设备导入。'}</p>
      <div class="actions">
        <button class="btn ghost" data-act="export">导出进度</button>
        <label class="btn ghost file">导入进度<input type="file" accept="application/json" hidden></label>
        <button class="btn ghost danger" data-act="reset">清空进度</button>
      </div>
    </div>
  </section>`;
  const saved = app.querySelector('.saved');
  app.querySelectorAll('.prefs input[name], .prefs select[name]').forEach(el =>
    el.addEventListener('change', () => {
      const v = el.name === 'examDate' ? el.value : +el.value;
      if (el.name === 'examDate' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
      S.settings[el.name] = v;
      S.settingsT = Date.now();
      persist();
      saved.hidden = false;
      setTimeout(() => (saved.hidden = true), 1400);
    }),
  );
  app.querySelector('[data-act="export"]').addEventListener('click', () => store.exportFile(S));
  app.querySelector('input[type="file"]').addEventListener('change', async e => {
    try {
      S = await store.importFile(e.target.files[0]);
      persist();
      location.hash = '#/';
    } catch (err) {
      alert('这个文件不是 FM Notebook 的进度文件。');
    }
  });
  app.querySelector('[data-act="reset"]').addEventListener('click', () => {
    if (confirm(sync.config() ? '清空全部进度？已连接同步，所有设备上的进度都会被清空，无法撤销。' : '清空全部进度？此操作无法撤销。')) {
      S = store.reset();
      persist();
      location.hash = '#/';
    }
  });
  const now = app.querySelector('[data-act="sync-now"]');
  if (now) now.addEventListener('click', () => sync.syncNow());
  const off = app.querySelector('[data-act="sync-off"]');
  if (off)
    off.addEventListener('click', () => {
      if (confirm('断开这台设备的同步？已同步的进度会保留在这台设备和你的 Gist 里。')) {
        sync.disconnect();
        renderSettings();
      }
    });
  const inst = app.querySelector('[data-act="install"]');
  if (inst) inst.addEventListener('click', () => promptInstall().then(renderSettings));
  const form = app.querySelector('#token-form');
  if (form)
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const tok = form.token.value.trim();
      const msg = app.querySelector('#token-msg');
      if (!tok) return;
      msg.textContent = '正在连接…';
      try {
        await sync.connect(tok);
        renderSettings();
      } catch (err) {
        msg.textContent = `连接失败：${err.message}。请检查令牌的 Gists 权限是否为 Read and write。`;
        msg.classList.add('warn');
      }
    });
}

/* ---------------------------------------------------------------- sync & install */

const fmtTime = t => (t ? new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '');

function syncLabel(st = sync.getStatus()) {
  return { off: '', syncing: '同步中…', ok: `已同步 ${fmtTime(st.at)}`, offline: '离线 · 联网后自动同步', auth: '同步失败：令牌失效', error: '同步出错，稍后重试' }[st.state];
}

function paintSyncStatus(st = sync.getStatus()) {
  const el = document.getElementById('syncstate');
  if (el) {
    el.textContent = syncLabel(st);
    el.dataset.state = st.state;
    el.hidden = st.state === 'off';
  }
  const box = document.getElementById('syncbox-state');
  if (box) box.textContent = syncLabel(st) || '未连接';
}

function syncCard() {
  if (sync.config()) {
    return `<div class="card form sync-card">
      <p class="kicker">Sync · 多设备同步</p>
      <p class="sync-on"><span class="dot"></span> 已连接。电脑、手机网页、手机 App 用同一个令牌连接后，进度会自动合并。</p>
      <p class="sub">状态：<b id="syncbox-state">${esc(syncLabel() || '…')}</b></p>
      <div class="actions"><button class="btn ghost" data-act="sync-now">立即同步</button><button class="btn ghost" data-act="sync-off">断开这台设备</button></div>
      <p class="fine">打开时、切回页面时、每次答题后几秒、切到后台时都会同步（先拉取、合并、再上传）。两台设备同时学也不会互相覆盖：每道题以最近一次作答为准，每天的练习量按设备分别记录再相加，取消“已学”会留下时间戳，不会被另一台设备改回来。</p>
    </div>`;
  }
  return `<div class="card form sync-card">
    <p class="kicker">Sync · 多设备同步（可选）</p>
    <p>不用注册账号。想在电脑和手机上接着学，就在每台设备上用同一个 GitHub 令牌连接一次：进度存进你自己 GitHub 账号里的一个私密 Gist，没有任何第三方服务器。</p>
    <ol class="sync-steps">
      <li>打开 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → 新建 fine-grained token</a>。</li>
      <li>名称写 FM Notebook，有效期选最长；<b>Account permissions → Gists</b> 选 <b>Read and write</b>，其他都不用勾。</li>
      <li>复制令牌，粘贴到下面点「连接」。其他设备粘贴同一个令牌。</li>
    </ol>
    <form class="token-form" id="token-form" autocomplete="off">
      <input type="password" name="token" placeholder="github_pat_…" aria-label="GitHub 令牌" spellcheck="false" autocapitalize="off">
      <button class="btn" type="submit">连接</button>
    </form>
    <p class="fine" id="token-msg">令牌只保存在这台设备上，只能读写 Gist，不能访问你的仓库，随时可以在 GitHub 上撤销。它只用于同步，不代表任何身份或权限。</p>
  </div>`;
}

function installCard() {
  const st = installState();
  if (st.standalone) return `<div class="card form"><p class="kicker">App · 手机 App</p><p>你正在使用已安装的 FM Notebook。${sync.config() ? '' : '<b>记得在这里也连接一次同步</b>：主屏幕上的 App 和浏览器里的网页，存储是分开的。'}</p></div>`;
  return `<div class="card form install-card">
    <p class="kicker">App · 装到手机</p>
    <p>FM Notebook 可以像 App 一样装到手机主屏幕：全屏打开、有图标，没网也能学（同步会在联网后补上）。</p>
    ${st.canPrompt ? '<div class="actions"><button class="btn" data-act="install">安装 FM Notebook</button></div>' : ''}
    <ul class="sync-steps">
      <li><b>iPhone / iPad：</b>用 Safari 打开 → 底部「分享」 → 「添加到主屏幕」。</li>
      <li><b>Android：</b>用 Chrome 打开 → 右上角菜单 → 「安装应用」。</li>
      <li><b>电脑：</b>Chrome / Edge 地址栏右侧的安装图标。</li>
    </ul>
  </div>`;
}

/* Before a review is built, pull what other devices did (at most 3 s; offline it just starts). */
async function syncFirst() {
  const st = sync.getStatus();
  if (!sync.config() || (st.state === 'ok' && Date.now() - st.at < 20000)) return;
  app.innerHTML = '<section class="session"><p class="loading hand">one moment…</p><p class="loading-sub">正在同步其他设备的进度</p></section>';
  await Promise.race([sync.syncNow(), new Promise(r => setTimeout(r, 3000))]);
}

/* Merged progress from another device arrived: use it, and redraw the page unless the
   learner is in the middle of typing an answer. */
function applyRemote(merged) {
  S = { ...merged, log: aggregateLog(merged.devlog) };
  store.save(S);
  const busy = document.activeElement && document.activeElement.matches && document.activeElement.matches('input.answer');
  const view = document.body.dataset.view;
  if (!busy && ['home', 'settings', 'formulas'].includes(view)) route();
}

/* ---------------------------------------------------------------- go */

route();
startBirds();
initPwa({ onChange: () => document.body.dataset.view === 'settings' && renderSettings() });
sync.initSync({ state: () => S, apply: applyRemote, onStatus: paintSyncStatus });
