import { TOPICS, LESSONS, DRILLS } from '../data/syllabus.js';
import { rng } from '../data/kit.js';
import { read, sameValue, money, toTex } from './expr.js';
import { timeline, drawPicks } from './timeline.js';
import { growthPlate, mountGrowth } from './growth.js';
import { heroPlate, tickMark, crossMark, monthSketch, startBirds } from './art.js';
import { dayKey, addDays, grade, dueToday, streak, isLearned, LEARNED_BOX, MAX_BOX } from './srs.js';
import { studyPlan, REVIEW_DAYS } from './plan.js';
import * as store from './store.js';

/* ---------------------------------------------------------------- state */

let S = store.load();
const persist = () => store.save(S);
const app = document.getElementById('app');
const lessonById = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const drillById = Object.fromEntries(DRILLS.map(d => [d.id, d]));
const topicById = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const today = () => dayKey();
const logToday = () => {
  const k = today();
  S.log[k] = S.log[k] || { solved: 0, clean: 0, lessons: 0 };
  return S.log[k];
};

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

const allDrillIds = () => DRILLS.filter(d => S.lessons[d.lesson]).map(d => d.id);
const plan = () => studyPlan({ lessonIds: LESSONS.map(l => l.id), learned: S.lessons, today: today(), examDate: S.settings.examDate });
const dueIds = () => dueToday(allDrillIds(), S.cards, { cap: S.settings.reviewCap, today: today() });

function last30() {
  const out = [];
  for (let k = 29; k >= 0; k--) {
    const key = addDays(today(), -k);
    const l = S.log[key];
    out.push({ key, count: l ? l.solved + 3 * (l.lessons || 0) : 0, done: !!(l && l.done), today: k === 0 });
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
    <p class="chapter-lede">SOA Exam FM 的五个部分，括号里是每部分在考试中所占的比重。每一课都是：先读懂（画时间轴、看公式从哪里来），再跟着做一道，最后自己练。</p>
    <div class="topics">
      ${TOPICS.map(t => topicCard(t)).join('')}
    </div>
  </section>

  <section id="progress">
    <h2 class="numbered-heading draw">Progress</h2>
    <p class="chapter-lede">学完一课，它的题型就进入复习：一次做对（没看答案）就升一格，下次在 1、2、4、7、15、30、60 天后再出；需要看答案就回到 1 号盒子，明天再来。到 5 号盒子算掌握。</p>
    <div class="progress-grid">
      <div class="engraved">
        <div><span class="big">${p.done}</span><span class="lab">lessons · 已学课</span></div>
        <div><span class="big">${learnedDrills}<small>/${DRILLS.length}</small></span><span class="lab">mastered · 掌握的题型</span></div>
        <div><span class="big">${sk}</span><span class="lab">days in a row · 连续天数</span></div>
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

function paceNote(p, sk) {
  if (!p.left) return '全部学完 · 每天清空复习';
  if (p.inReview) return `考前复习期 · 还有 ${p.left} 课没学`;
  return `每周 ${p.perWeek} 课 · 本周已学 ${p.thisWeek} 课${sk ? ` · 连续 ${sk} 天` : ''}`;
}

function topicCard(t) {
  const ls = t.lessons;
  const learned = ls.filter(l => S.lessons[l.id]).length;
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
              (l, k) => `<li class="${S.lessons[l.id] ? 'learned' : ''} ${l.id === nextId ? 'is-next' : ''}">
          <a href="#/lesson/${l.id}"><span class="lno">${t.no}.${k + 1}</span><span class="lname">${rich(l.zh)}<i>${esc(l.en)}</i></span>
          <span class="lmark" aria-label="${S.lessons[l.id] ? 'learned' : ''}">${S.lessons[l.id] ? tickMark() : l.id === nextId ? '<span class="hand">next</span>' : ''}</span></a></li>`,
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
  const learned = !!S.lessons[l.id];
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
        ${learned ? `<p class="done-line">${tickMark()}<span>这一课学过了（${esc(S.lessons[l.id])}）。</span></p>` : `<button class="btn" data-act="learned">这一课学完了 ✓</button>`}
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
  mountProblem(app.querySelector('#example'), l.example(rng(7)), { label: 'Example' });
  const btn = app.querySelector('[data-act="learned"]');
  if (btn)
    btn.addEventListener('click', () => {
      S.lessons[l.id] = today();
      for (const d of l.drills) if (!S.cards[d.id]) S.cards[d.id] = { box: 0, due: today(), right: 0, wrong: 0, last: null };
      logToday().lessons = (logToday().lessons || 0) + 1;
      persist();
      renderLesson(l);
      app.querySelector('.drills').scrollIntoView({ block: 'start' });
    });
}

const pips = c => `<span class="pips" aria-label="box ${c ? c.box : 0}">${Array.from({ length: MAX_BOX }, (_, k) => `<i class="${c && c.box > k ? (k + 1 >= LEARNED_BOX ? 'w' : 'f') : ''}"></i>`).join('')}</span>`;

/* ---------------------------------------------------------------- the problem player */

const KEYS = ['v', 'i', '^', '(', ')', '×', '÷', '+', '−', 'a(', 'ä(', 's(', 'ln(', '←'];

function mountProblem(root, prob, { onDone, label = '' } = {}) {
  const vars = prob.vars || {};
  const steps = prob.steps;
  const st = steps.map(() => ({ wrong: 0, revealed: false, done: false }));
  let at = 0;
  const hasFocal = prob.timeline && prob.timeline.focal !== undefined && prob.timeline.focal !== null;

  root.innerHTML = `
    ${label ? `<p class="kicker">${esc(label)}</p>` : ''}
    <p class="ptext">${rich(prob.text)}</p>
    ${varsLine(vars)}
    ${prob.timeline ? `<figure class="tl-wrap plate">${timeline(prob.timeline)}</figure>` : ''}
    <ol class="steps"></ol>
    <div class="pdone"></div>`;
  const list = root.querySelector('.steps');
  inkIn(root);

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
      at = k + 1;
      if (at < steps.length) setTimeout(() => showStep(at), 260);
      else complete();
    };

    if (s.kind === 'choice') {
      const order = s.options.map((o, j) => j).sort(() => Math.random() - 0.5);
      body.innerHTML = `<div class="options">${order.map((j, n) => `<button class="opt" data-j="${j}"><b>${'ABCDE'[n]}</b><span>${rich(s.options[j].text)}</span></button>`).join('')}</div>${hintBtn(s)}`;
      body.querySelectorAll('.opt').forEach(b =>
        b.addEventListener('click', () => {
          if (st[k].done) return;
          const o = s.options[+b.dataset.j];
          if (o.ok) {
            b.classList.add('right');
            body.querySelectorAll('.opt').forEach(x => (x.disabled = true));
            fb.innerHTML = verdict(true, st[k].wrong ? '这次对了。' : '对。');
            finish();
          } else {
            b.classList.add('wrong');
            b.disabled = true;
            st[k].wrong++;
            fb.innerHTML = verdict(false, o.why ? rich(o.why) : '再想想。');
            if (st[k].wrong >= 2) {
              st[k].revealed = true;
              const r = [...body.querySelectorAll('.opt')].find(x => s.options[+x.dataset.j].ok);
              r.classList.add('right');
              body.querySelectorAll('.opt').forEach(x => (x.disabled = true));
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
        let ok = sameValue(r.value, s.target);
        let extra = '';
        if (!ok && s.unit === 'rate' && sameValue(r.value / 100, s.target)) {
          ok = true;
          extra = '（利率记得写成 0.05 或 5%。）';
        }
        if (ok) {
          inp.disabled = true;
          body.querySelector('.keys').remove();
          body.querySelector('.expr .actions').remove();
          fb.innerHTML = verdict(true, `= ${esc(fmt(s.target, s.unit))}${extra}`) + modelLine(s, '一种标准写法');
          finish();
        } else {
          st[k].wrong++;
          fb.innerHTML = verdict(false, `你的式子等于 ${esc(fmt(r.value, s.unit))}，还不对。${s.hint ? '可以先看看提示。' : '再想想每笔钱离那一刻差几期。'}`);
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
        inp.disabled = true;
        body.querySelector('.keys').remove();
        body.querySelector('.expr .actions').remove();
        fb.innerHTML = `<div class="verdict"><p class="v-main">思路是这样：</p></div>` + modelLine(s, '');
        finish();
      });
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
    }

    if (s.kind === 'place') {
      const n = s.n - 1;
      body.innerHTML = `<figure class="tl-wrap plate placing">${timeline({ n, flows: [] }, { place: true })}</figure><p class="note">点时间轴上的刻度放上付款，再点一下取消。</p><div class="actions"><button class="btn" data-check>检查</button>${hintBtn(s)}</div>`;
      const svg = body.querySelector('svg');
      const picks = new Set();
      inkIn(body);
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
        const want = new Set(s.answer);
        const ok = picks.size === want.size && [...picks].every(t => want.has(t));
        if (ok) {
          body.querySelector('[data-check]').disabled = true;
          fb.innerHTML = verdict(true, `付款在 t = ${[...want].sort((a, b) => a - b).join(', ')}。`);
          finish();
        } else {
          st[k].wrong++;
          fb.innerHTML = verdict(false, `还不对。${st[k].wrong >= 2 ? `应该是 t = ${[...want].sort((a, b) => a - b).join(', ')}。` : '再读一遍题目里的“年初/年末”。'}`);
          if (st[k].wrong >= 2) {
            st[k].revealed = true;
            picks.clear();
            want.forEach(t => picks.add(t));
            drawPicks(svg, picks, n);
            body.querySelector('[data-check]').disabled = true;
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
    li.scrollIntoView({ block: 'nearest', behavior: k ? 'smooth' : 'auto' });
  };

  const complete = () => {
    const clean = st.every(x => !x.revealed);
    const wrongs = st.reduce((a, x) => a + x.wrong, 0);
    if (hasFocal) {
      const fig = root.querySelector('.tl-wrap');
      fig.classList.remove('on');
      fig.innerHTML = timeline(prob.timeline, { moves: true }) + '<figcaption>每一笔钱搬到问号那一刻，乘上它路过的期数。</figcaption>';
      inkIn(root);
    }
    root.querySelector('.pdone').innerHTML = `<div class="summary-line ${clean ? 'is-right' : ''}">${clean ? tickMark() : crossMark()}<p>${clean ? (wrongs ? '做出来了，中间想错了一下，没关系。' : '一次就对。') : '这次看了答案。这个题型明天会再出现。'}</p></div>`;
    if (onDone) onDone({ clean, wrongs }, root.querySelector('.pdone'));
  };

  showStep(0);
}

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
  const play = () =>
    mountProblem(app.querySelector('#drill'), d.gen(rng((Math.random() * 2 ** 31) | 0)), {
      onDone: (res, el) => {
        record(d, res);
        el.insertAdjacentHTML('beforeend', `<div class="actions"><button class="btn" data-again>再来一题 →</button><a class="btn ghost" href="#/lesson/${l.id}">回到课文</a></div>`);
        el.querySelector('[data-again]').addEventListener('click', () => {
          play();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      },
    });
  play();
}

/* Grade a drill only when its lesson has been learned (free play before that is just practice). */
function record(d, { clean }) {
  const lt = logToday();
  lt.solved += 1;
  if (clean) lt.clean += 1;
  if (S.lessons[d.lesson]) S.cards[d.id] = grade(S.cards[d.id], clean, today());
  if (!dueIds().length && S.lessons[d.lesson]) lt.done = true;
  persist();
}

/* ---------------------------------------------------------------- daily practice */

let queue = null;

function renderPractice() {
  setView('practice', 'Review');
  let ids = dueIds();
  let mode = 'due';
  if (!ids.length) {
    const learned = allDrillIds();
    mode = learned.length ? 'free' : 'none';
    ids = learned.sort(() => Math.random() - 0.5).slice(0, 5);
  }
  queue = { ids, k: 0, clean: 0, mode };
  if (mode === 'none') {
    const p = plan();
    app.innerHTML = `<section class="session"><div class="card sheet"><p class="kicker">Review</p><h1 class="medium-heading">还没有要复习的题</h1><p>先学一课：学完以后，它的题型就会出现在这里。</p><div class="actions">${p.next ? `<a class="btn" href="#/lesson/${p.next}">去学 ${rich(lessonById[p.next].zh)} →</a>` : ''}</div></div></section>`;
    return;
  }
  nextInQueue();
}

function nextInQueue() {
  const q = queue;
  if (q.k >= q.ids.length) return renderSummary();
  const d = drillById[q.ids[q.k]];
  const l = lessonById[d.lesson];
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
  mountProblem(app.querySelector('#item'), d.gen(rng((Math.random() * 2 ** 31) | 0)), {
    onDone: (res, el) => {
      record(d, res);
      if (res.clean) q.clean++;
      el.insertAdjacentHTML('beforeend', `<div class="actions"><button class="btn" data-next>${q.k + 1 < q.ids.length ? '下一题 →' : '看小结'}</button></div>`);
      const b = el.querySelector('[data-next]');
      b.addEventListener('click', () => {
        q.k++;
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
  app.querySelector('[data-more]').addEventListener('click', renderPractice);
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
          return `<div class="fbook ${S.lessons[l.id] ? '' : 'unlearned'}"><a class="fhead" href="#/lesson/${l.id}">${rich(l.zh)}</a>${ms.map(renderBlock).join('')}</div>`;
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
    <div class="card form">
      <label class="row"><span>考试日期<br><small class="tsub">用来排每周进度；最后 ${REVIEW_DAYS} 天留给总复习</small></span><input type="date" name="examDate" value="${esc(s.examDate)}"></label>
      <label class="row"><span>每天最多复习几题</span><select name="reviewCap">${[10, 15, 20, 30, 50].map(n => `<option ${n === s.reviewCap ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="row"><span>错几次后出现“看思路”</span><select name="revealAfter">${[1, 2, 3].map(n => `<option ${n === s.revealAfter ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <p class="saved hand" hidden>saved</p>
    </div>
    <div class="card form">
      <p class="kicker">Your progress</p>
      <p>进度只保存在这个浏览器里。换设备时先导出，再在新设备上导入。</p>
      <div class="actions">
        <button class="btn ghost" data-act="export">导出进度</button>
        <label class="btn ghost file">导入进度<input type="file" accept="application/json" hidden></label>
        <button class="btn ghost danger" data-act="reset">清空进度</button>
      </div>
    </div>
  </section>`;
  const saved = app.querySelector('.saved');
  app.querySelectorAll('input[name], select[name]').forEach(el =>
    el.addEventListener('change', () => {
      const v = el.name === 'examDate' ? el.value : +el.value;
      if (el.name === 'examDate' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
      S.settings[el.name] = v;
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
    if (confirm('确定要清空所有进度吗？')) {
      S = store.reset();
      location.hash = '#/';
    }
  });
}

/* ---------------------------------------------------------------- go */

route();
startBirds();
