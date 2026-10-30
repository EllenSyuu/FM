# Writing lessons

Every lesson in FM Notebook is plain data plus small generator functions, in one file per
syllabus topic (`data/t1-tvm.js` … `data/t5-alm.js`). The format is defined in
[`data/kit.js`](../data/kit.js); `data/t1-tvm.js` is the reference example.

## The teaching idea

The notebook is built for studying **without paper and without a calculator**. So a drill
never asks for a final number worked out by hand. It asks for the *set-up* — which way to
move each payment, which factor, which formula — and the learner types it as an expression:

```text
200(1+i) + 300v^2        250a(10)        1000v^5 + 40a(5)        (A/K)^(1/n) - 1
```

The page evaluates the expression and checks the value. What is being trained is the
reasoning chain, one step at a time:

1. **Choice steps** check the idea (which direction, which formula, which date).
2. **Expression steps** check the set-up, by value, with the problem's rate bound to `i`.
3. **Place steps** check that words become the right timeline ("end of year 3" → t = 3).

Each step can carry a `hint` (shown on request) and a `why` (shown after answering).
Wrong options carry their own explanation of the mistake they represent.

## Lesson shape

```js
{
  id: 'tvm-move',                 // unique, prefixed by topic id
  en: 'Present value and equations of value',
  zh: '把钱搬到同一时刻：现值与价值方程',
  outcome: '1a · 1d',             // SOA learning objectives covered
  learn: [P(…), M(tex, note), T(timeline, caption), TERMS(rows), TIP(…), TABLE(…), RECIPE(…)],
  example: r => problem,          // worked example, shown as "follow along"
  drills: [{ id, zh, gen: r => problem }],   // generators: fresh numbers every time
}
```

A problem is `{ text, timeline?, vars, steps }`. Steps are built with `choice`, `expr` and
`place` from `kit.js`. Every `expr` step gives both a `target` (computed directly in JS)
and a `model` set-up (written in the expression language); the tests check they agree.

## Timeline animation (`anim`)

A step can say what the timeline does when it is answered right. A wrong answer draws the
first action in grey (shape only, no labels) and shakes it, and the hint opens.

```js
choice('钱每过一年会怎样变？', [...], { anim: [{ do: 'grow', from: 0, to: 1, start: 1000, mult: 1.06, label: '×1.06' }] })
```

| Action | Fields | What it shows |
| --- | --- | --- |
| `grow` | `from < to`, `start`, `mult`, `label`, `unit?` | one arc per period under the axis, amount at each date updated (1,000 → 1,060 → …) |
| `discount` | `from > to`, `start`, `mult`, `label` | the same, sliding left (×v) |
| `move` | `from`, `to`, `label`, `result?` / `resultText?`, `tone?` | one payment carried to another date in one arc |
| `drop` | `t`, `amt?`, `side?` | a payment arrow falls onto the axis |
| `stack` | `ts`, `to`, `amt`, `i` | payments carried one by one to a date, running total there |
| `balance` | `points: [[t, B], …]`, `max?` | a loan balance line falling at each payment |
| `answer` | `t`, `value`, `unit?` | the circled date fills with the answer and a tick |
| `note` | `t`, `text` | a short label under the axis |

If the problem has a focal date and its steps carry animations but no `answer`, the last step
adds one with the last expression step's target. Problems with no animations at all get a
default finish: every payment travels to the focal date with its factor, then the answer.

## Expression language

Numbers (`1.05`, `5%`, `1,000`), `+ − × ÷ ^ ( )`, implicit multiplication (`100v^3`),
the problem's variables (`i`, `v`, `d`, `delta`, …) and:

| Write | Means |
| --- | --- |
| `a(n)`, `s(n)` | annuity-immediate PV / AV of 1 per period, at the problem's `i` |
| `ad(n)`, `sd(n)` (or `ä(n)`) | annuity-due |
| `abar(n)`, `sbar(n)` | continuous annuity |
| `Ia(n)`, `Is(n)`, `Iad(n)` | increasing annuity 1, 2, …, n |
| `Da(n)`, `Ds(n)` | decreasing annuity n, n−1, …, 1 |
| `a(n, j)` | any of the above at another rate `j` |
| `a(inf)`, `ad(inf)` | perpetuities |
| `exp`, `ln`, `sqrt` | |

## Rules for content

- **Original writing only.** Explanations, examples and numbers are written for this
  project. Nothing is copied from textbooks, study manuals or commercial question banks.
- Chinese explanation, English terms kept as they appear on the exam.
- Every learning objective in the SOA syllabus is covered by at least one lesson.
- `npm test` must pass: each generator is run with 40 seeds and every step is validated
  (one right option, no duplicate options, model equals target, timelines in range).
