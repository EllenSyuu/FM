import { pick, int, RATES, pct, money, round, choice, expr, place, tl, flowsEvery, an, sn, adn, sdn, sumPV, P, M, T, TERMS, TIP, TABLE, RECIPE } from './kit.js';

/* Topic 2 — Annuities and non-contingent cash flows (SOA FM learning objectives 2a–2b). */

// TeX for the annuity symbols, with the angle: a_{\angl{n}} …
const A = n => `a_{\\angl{${n}}}`;
const S = n => `s_{\\angl{${n}}}`;
const AD = n => `\\ddot a_{\\angl{${n}}}`;
const SD = n => `\\ddot s_{\\angl{${n}}}`;

// Numeric flows → timeline labels.
const lvl = (from, to, amt) => flowsEvery(from, to, amt);
const show = fl => fl.map(f => ({ t: f.t, amt: money(f.amt, 0) }));
const geoFlows = (n, Pm, g) => Array.from({ length: n }, (_, k) => ({ t: k + 1, amt: Pm * (1 + g) ** k }));
const arithFlows = (n, Pm, Q) => Array.from({ length: n }, (_, k) => ({ t: k + 1, amt: Pm + Q * k }));

const lessons = [
  /* ------------------------------------------------------------------ 1 */
  {
    id: 'ann-immediate',
    en: 'Annuity-immediate',
    zh: '期末年金 $a_{\\angl{n}}$ 与 $s_{\\angl{n}}$',
    outcome: '2a · 2b',
    learn: [
      P('**年金**（annuity）就是一串**等间隔**的付款：房贷月供、每年的奖学金、每月的定投。最简单的一种：每期**期末**付 1，一共付 $n$ 期，叫 **annuity-immediate**（期末年金）。'),
      T(tl(5, flowsEvery(1, 5, '1'), { focal: 0, rate: 'i' }), '付款在 t = 1, 2, …, 5；问 t = 0 的价值。注意：估值日比第一笔付款**早一期**。'),
      P('用 Topic 1 的方法逐笔往前搬：t = 1 的 1 乘 $v$，t = 2 的 1 乘 $v^2$……加起来是一个等比数列（geometric series）：首项 $v$，公比 $v$，共 $n$ 项。'),
      M('a_{\\angl{n}} = v + v^2 + \\cdots + v^n = v\\,\\frac{1-v^n}{1-v} = \\frac{1-v^n}{i}', '最后一步用了 $1 - v = iv$（也就是 $d$），分子分母的 $v$ 约掉。读作 “a angle n”：期末付 1、共 n 期，在**第一笔之前一期**的价值。'),
      P('另一个读法很好记：今天存进 $1$ 元，每期末取走利息 $i$，第 $n$ 期末再取回本金 $1$。所以 $1 = i\\,a_{\\angl{n}} + v^n$，移项就是上面的公式。'),
      M('s_{\\angl{n}} = (1+i)^{n-1} + \\cdots + (1+i) + 1 = \\frac{(1+i)^n - 1}{i} = a_{\\angl{n}}(1+i)^n', '$s_{\\angl{n}}$（accumulated value）：同一串付款搬到**最后一笔付款那一刻**。从 $a$ 往后搬 $n$ 期就得到 $s$。'),
      TERMS([
        ['annuity-immediate', '期末年金', '每期期末付款；“payable at the end of each year / in arrears”'],
        ['term', '期限', '一共多少期（$n$ = 付款次数）'],
        ['level payment', '等额付款', '每期金额都一样，记作 $P$'],
        ['present value $Pa_{\\angl{n}}$', '现值', '落在第一笔付款前一期'],
        ['accumulated value $Ps_{\\angl{n}}$', '终值', '落在最后一笔付款那一刻'],
      ]),
      RECIPE('期末年金三件事', ['看到 “每期末付 $P$，共 $n$ 期” → 想到 $a_{\\angl{n}}$ / $s_{\\angl{n}}$', '现值 $= P\\,a_{\\angl{n}}$；终值 $= P\\,s_{\\angl{n}}$', '已知现值求每期付款：$P = \\text{PV} / a_{\\angl{n}}$']),
      TIP('a 落在第一笔前一期，s 正好落在最后一笔上。先找“落点”，再谈搬家。'),
    ],
    example: r => {
      const i = 0.05;
      return {
        text: '每年末收到 300，共 8 年，年利率 5%。这串钱在今天（t = 0）值多少？在第 8 年末值多少？',
        timeline: tl(8, flowsEvery(1, 8, '300'), { focal: 0, rate: 'i = 5%' }),
        vars: { i },
        steps: [
          choice('第一步：今天在第一笔付款（t = 1）之前一期。用哪个因子？', [
            [`$300\\,${A(8)}$`, true],
            [`$300\\,${AD(8)}$`, false, '$\\ddot a$ 落在第一笔付款**那一刻**；这里付款在期末，今天比第一笔早一期。'],
            [`$300\\,${S(8)}$`, false, '$s$ 是在最后一笔付款时的价值，不是今天的。'],
          ], { hint: '付款在每年**末**：期末年金。' }),
          expr('写出今天的价值（现值）：', { target: 300 * an(8, i), model: '300a(8)', why: `$300\\,${A(8)} = 300 \\times 6.4632 = 1938.96$。` }),
          expr('写出第 8 年末的价值（终值）：', { target: 300 * sn(8, i), model: '300s(8)', hint: '最后一笔付款就在 t = 8，正是 $s$ 的落点。' }),
          expr('换一条路：把现值往后搬 8 年，也应得到终值。', { target: 300 * an(8, i) * 1.05 ** 8, model: '300a(8)(1+i)^8', why: `$${S(8)} = ${A(8)}(1+i)^8$：同一串钱，只是换了时刻看。` }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-imm-pv',
        zh: '等额期末付款的现值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 25), Pm = pick(r, [100, 200, 250, 400, 500, 1000, 1200]);
          return {
            text: `每年末付 ${money(Pm, 0)}，共 ${n} 年，年利率 ${pct(i)}。今天（t = 0）值多少？`,
            timeline: tl(n, show(lvl(1, n, Pm)), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('用哪个式子？', [
                [`$${Pm}\\,${A(n)}$`, true],
                [`$${Pm}\\,${AD(n)}$`, false, '$\\ddot a$ 是期初付款（第一笔就在今天）。这里第一笔在 t = 1。'],
                [`$${Pm}\\,${S(n)}$`, false, '$s$ 落在最后一笔付款 t = ' + n + '，不是今天。'],
                [`$${n * Pm}\\,v^{${n}}$`, false, '这是把所有付款都当成在最后一年才付，大大低估了现值。'],
              ], { hint: '期末付款，估值日在第一笔前一期。' }),
              expr('写出现值：', { target: sumPV(lvl(1, n, Pm), i, 0), model: `${Pm}a(${n})`, hint: `${money(Pm, 0)} × $${A(n)}$，输入 ${Pm}a(${n})。` }),
            ],
          };
        },
      },
      {
        id: 'ann-imm-av',
        zh: '定期存款的终值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 4, 20), Pm = pick(r, [100, 300, 500, 600, 1000, 2000]);
          return {
            text: `每年末往账户里存 ${money(Pm, 0)}，共存 ${n} 次，年利率 ${pct(i)}。存完最后一笔时，账户里有多少钱？`,
            timeline: tl(n, show(lvl(1, n, Pm)), { focal: n, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`$${S(n)}$ 把这串钱带到哪一刻？`, [
                [`t = ${n}`, true],
                [`t = ${n + 1}`, false, '那是 $\\ddot s$ 的落点（最后一笔之后一期）。'],
                ['t = 0', false, '那是 $a$ 的落点（第一笔前一期）。$s$ 落在最后一笔上。'],
              ]),
              expr('写出终值：', { target: sumPV(lvl(1, n, Pm), i, n), model: `${Pm}s(${n})` }),
              expr('用 $a$ 再写一次（先求现值再往后搬）：', { target: Pm * sn(n, i), model: `${Pm}a(${n})(1+i)^${n}`, why: `$${S(n)} = ${A(n)}\\,(1+i)^{${n}}$。` }),
            ],
          };
        },
      },
      {
        id: 'ann-imm-pmt',
        zh: '已知现值，求每期付款',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 30), L = pick(r, [10000, 20000, 25000, 50000, 80000, 100000]);
          return {
            text: `借 ${money(L, 0)}，年利率 ${pct(i)}，分 ${n} 年还清，每年末还一样多。每年还多少？`,
            timeline: tl(n, [{ t: 0, amt: money(L, 0), side: 'down' }, ...lvl(1, n, 'P')], { rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('在 t = 0 列价值方程：', [
                [`$${L} = P\\,${A(n)}$`, true],
                [`$${L} = P\\,${S(n)}$`, false, `借款在 t = 0，而 $${S(n)}$ 落在 t = ${n}。两边不在同一时刻。`],
                [`$${L} = ${n}P$`, false, '这忽略了利息：不同时刻的钱不能直接相加。'],
              ]),
              expr('解出 P：', { target: L / an(n, i), model: `${L}/a(${n})`, hint: `两边除以 $${A(n)}$。`, why: `$P = ${L} / ${A(n)}$。` }),
            ],
          };
        },
      },
      {
        id: 'ann-imm-date',
        zh: '在最后一笔之后 / 第一笔之前估值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 3, 12), k = int(r, 1, 5), Pm = pick(r, [100, 200, 500, 800, 1000]);
          if (r() < 0.5) {
            const fl = lvl(1, n, Pm), at = n + k;
            return {
              text: `每年末付 ${money(Pm, 0)}，共 ${n} 次（t = 1 到 ${n}），之后钱继续按 ${pct(i)} 生息。在 t = ${at} 这串钱值多少？`,
              timeline: tl(at, show(fl), { focal: at, rate: `i = ${pct(i)}` }),
              vars: { i },
              steps: [
                choice(`$${S(n)}$ 先把这串钱压成一笔，这一笔在哪一刻？`, [
                  [`t = ${n}`, true],
                  [`t = ${at}`, false, '$s$ 只会落在最后一笔付款上，之后的几年还要再搬。'],
                  ['t = 0', false, '那是 $a$ 的落点。'],
                ]),
                expr(`写出 t = ${at} 的价值：`, { target: sumPV(fl, i, at), model: `${Pm}s(${n})(1+i)^${k}`, hint: `从 t = ${n} 再往后搬 ${k} 期。` }),
              ],
            };
          }
          const fl = lvl(k + 1, k + n, Pm);
          return {
            text: `一串付款：每年末 ${money(Pm, 0)}，第一笔在 t = ${k + 1}，共 ${n} 笔。年利率 ${pct(i)}。今天（t = 0）值多少？`,
            timeline: tl(k + n, show(fl), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`$${A(n)}$ 把这串钱压成一笔，这一笔在哪一刻？`, [
                [`t = ${k}`, true],
                [`t = ${k + 1}`, false, '那是第一笔付款本身，是 $\\ddot a$ 的落点。'],
                ['t = 0', false, `$${A(n)}$ 只知道“第一笔前一期”，不知道前面还空着 ${k} 年。`],
              ]),
              expr('写出今天的价值：', { target: sumPV(fl, i, 0), model: `${Pm}a(${n})v^${k}`, hint: `先落到 t = ${k}，再往前搬 ${k} 期。` }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    id: 'ann-due',
    en: 'Annuity-due',
    zh: '期初年金 $\\ddot a_{\\angl{n}}$ 与 $\\ddot s_{\\angl{n}}$',
    outcome: '2a · 2b',
    learn: [
      P('房租、保费、学费，常常是**每期一开始**就要付。每期期初付 1、共 $n$ 期，叫 **annuity-due**（期初年金），符号上加两点：$\\ddot a_{\\angl{n}}$。'),
      T(tl(5, flowsEvery(0, 4, '1'), { focal: 0, rate: 'i' }), '付款在 t = 0, 1, …, 4（5 笔）。估值日 t = 0 就在第一笔付款上。'),
      M('\\ddot a_{\\angl{n}} = 1 + v + \\cdots + v^{n-1} = \\frac{1-v^n}{d} = (1+i)\\,a_{\\angl{n}}', '每一笔都比期末年金**早一期**付，所以每笔多值一个 $(1+i)$；分母从 $i$ 换成 $d$。'),
      M('\\ddot a_{\\angl{n}} = 1 + a_{\\angl{n-1}} \\qquad \\ddot s_{\\angl{n}} = (1+i)\\,s_{\\angl{n}} = s_{\\angl{n+1}} - 1', '左式：今天这一笔是 1，剩下 $n-1$ 笔是一个从今天看的期末年金。右式：$\\ddot s$ 落在最后一笔付款**之后一期**。'),
      TABLE(
        ['', '付款时刻', '$a$ 型落在', '$s$ 型落在'],
        [
          ['immediate 期末', '1, 2, …, n', 't = 0（第一笔前一期）', 't = n（最后一笔上）'],
          ['due 期初', '0, 1, …, n−1', 't = 0（第一笔上）', 't = n（最后一笔后一期）'],
        ],
      ),
      TERMS([
        ['annuity-due', '期初年金', '“at the beginning of each year”，“in advance”'],
        ['annuity-immediate', '期末年金', '“at the end of each year”，“in arrears”'],
      ]),
      TIP('同一串付款，从前一期看是 a，从第一笔看是 ä。名字只是“站在哪儿看”。'),
    ],
    example: r => {
      const i = 0.04;
      return {
        text: '从今天开始，每年年初存 1,000，共存 5 次，年利率 4%。第 5 年末（最后一笔存入后一年）账户里有多少？',
        timeline: tl(5, flowsEvery(0, 4, '1,000'), { focal: 5, rate: 'i = 4%' }),
        vars: { i },
        steps: [
          choice('第一步：这是哪种年金？', [
            ['期初年金（annuity-due）', true],
            ['期末年金（annuity-immediate）', false, '“今天开始、每年年初” = 第一笔在 t = 0，是期初付款。'],
          ]),
          expr('t = 0 的价值（现值）：', { target: 1000 * adn(5, i), model: '1000ad(5)', hint: '$\\ddot a$ 写成 ad。' }),
          expr('t = 5 的价值：', { target: 1000 * sdn(5, i), model: '1000sd(5)', why: '$1000\\,\\ddot s_{\\angl{5}} = 1000(1.04)\\,s_{\\angl{5}} = 5632.98$。' }),
          expr('验证恒等式：用 $s_{\\angl{6}} - 1$ 写同一个值。', { target: 1000 * sdn(5, i), model: '1000(s(6) - 1)', why: '想象 t = 5 也存一笔：那是 6 笔期末年金 $s_{\\angl{6}}$，再减掉这多出来的 1。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-due-place',
        zh: '把“每年年初”画上时间轴',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 3, 8), Pm = pick(r, [200, 500, 1000, 1500]);
          const fl = lvl(0, n - 1, Pm);
          return {
            text: `每年年初付 ${money(Pm, 0)}，共 ${n} 年。年利率 ${pct(i)}。`,
            vars: { i },
            steps: [
              place('在时间轴上点出所有付款发生的时刻。', { n: n + 1, answer: fl.map(f => f.t), hint: '“第 1 年年初” 是 t = 0；“第 k 年年初” 是 t = k − 1。', why: `付款在 t = 0 到 ${n - 1}，共 ${n} 笔。` }),
              choice('在 t = 0 估值，用哪个因子？', [
                [`$${AD(n)}$`, true],
                [`$${A(n)}$`, false, '$a$ 落在第一笔前一期，即 t = −1。这里第一笔就在 t = 0。'],
                [`$${SD(n)}$`, false, `$\\ddot s$ 落在 t = ${n}（最后一笔后一期）。`],
              ]),
              expr('写出现值：', { target: sumPV(fl, i, 0), model: `${Pm}ad(${n})` }),
            ],
          };
        },
      },
      {
        id: 'ann-due-word',
        zh: '从措辞判断期初还是期末',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 4, 20), X = pick(r, [300, 500, 1000, 2400, 3000]);
          const due = r() < 0.5;
          const say = due
            ? pick(r, [`每年年初付 ${money(X, 0)}，共 ${n} 年`, `从今天开始，每年付 ${money(X, 0)}，一共 ${n} 次`, `${n} 年的租金，每年 ${money(X, 0)}，payable **in advance**`, `保费每年 ${money(X, 0)}，第一笔今天交，共交 ${n} 次`])
            : pick(r, [`每年年末付 ${money(X, 0)}，共 ${n} 年`, `一年后开始，每年付 ${money(X, 0)}，一共 ${n} 次`, `${n} 年，每年 ${money(X, 0)}，payable **in arrears**`, `第一笔在一年后，之后每年 ${money(X, 0)}，共 ${n} 次`]);
          const fl = due ? lvl(0, n - 1, X) : lvl(1, n, X);
          return {
            text: `${say}。年利率 ${pct(i)}。今天值多少？`,
            vars: { i },
            steps: [
              choice('这是哪一种？', [
                ['annuity-due（期初付），用 $\\ddot a$', due, '第一笔在一年后（期末付），今天比第一笔早一期，用 $a$。'],
                ['annuity-immediate（期末付），用 $a$', !due, '第一笔就在今天（期初付），今天就是第一笔的时刻，用 $\\ddot a$。'],
              ], { hint: '问自己：第一笔付款是今天，还是一期以后？' }),
              expr('写出今天的价值：', { target: sumPV(fl, i, 0), model: due ? `${X}ad(${n})` : `${X}a(${n})` }),
            ],
          };
        },
      },
      {
        id: 'ann-due-relation',
        zh: '$\\ddot a = 1 + a_{\\angl{n-1}}$ 与期初存款终值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 4, 15), Pm = pick(r, [100, 500, 1000, 2000]);
          return {
            text: `每年年初存 ${money(Pm, 0)}，共 ${n} 次，年利率 ${pct(i)}。`,
            timeline: tl(n, show(lvl(0, n - 1, Pm)), { focal: n, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`$${AD(n)}$ 等于：`, [
                [`$1 + ${A(n - 1)}$`, true],
                [`$1 + ${A(n)}$`, false, `今天那一笔单独算 1 之后，只剩 ${n - 1} 笔了。`],
                [`$${A(n + 1)} - 1$`, false, '这个形状属于 $\\ddot s_{\\angl{n}} = s_{\\angl{n+1}} - 1$，对 $\\ddot a$ 不成立。'],
              ], { hint: '把今天这一笔拿出来单独看。' }),
              expr(`用 a 写出 $${AD(n)}$（每期 1 的值）：`, { target: adn(n, i), model: `1 + a(${n - 1})`, unit: 'number' }),
              expr(`第 ${n} 年末（最后一笔存入后一年）账户里有多少？`, { target: sumPV(lvl(0, n - 1, Pm), i, n), model: `${Pm}sd(${n})`, hint: '$\\ddot s$ 落在最后一笔之后一期。', why: `也可以写成 ${Pm}(s(${n + 1}) − 1)。` }),
            ],
          };
        },
      },
      {
        id: 'ann-due-pmt',
        zh: '月初付租金：求每期付款',
        gen: r => {
          const j = pick(r, [0.005, 0.0075, 0.01]), n = pick(r, [12, 18, 24, 30, 36]), L = pick(r, [12000, 18000, 24000, 30000]);
          return {
            text: `一台设备现价 ${money(L, 0)}，改成租用：租 ${n} 个月，每月**月初**付租金 R，月有效利率 ${pct(j)}。两种方式价值相同，求 R。`,
            ...(n <= 30 ? { timeline: tl(n, lvl(0, n - 1, 'R'), { unit: 'month', rate: `${pct(j)} / 月` }) } : {}),
            vars: { i: j },
            steps: [
              choice('在 t = 0 列价值方程：', [
                [`$${L} = R\\,${AD(n)}$`, true],
                [`$${L} = R\\,${A(n)}$`, false, '月初付款：第一笔租金今天就付，是期初年金。'],
                [`$${L} = R\\,${SD(n)}$`, false, '$\\ddot s$ 落在租期结束时，不是今天。'],
              ]),
              expr('解出 R（这里 i 就是月利率）：', { target: L / adn(n, j), model: `${L}/ad(${n})`, hint: `R = ${L} ÷ $${AD(n)}$。` }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    id: 'ann-perp-defer',
    en: 'Perpetuities and deferred annuities',
    zh: '永续年金与递延年金',
    outcome: '2a',
    learn: [
      P('**永续年金**（perpetuity）：付款永远不停。奖学金基金、优先股股息都是这种。直觉：存进 $1/i$，每年末的利息正好是 $1$，本金永远不动，所以可以一直付下去。'),
      M('a_{\\angl{\\infty}} = v + v^2 + \\cdots = \\frac{1}{i} \\qquad \\ddot a_{\\angl{\\infty}} = \\frac{1}{d} = \\frac{1}{i} + 1', '期末付的永续年金值 $1/i$；期初付的多了今天这一笔 1。'),
      T(tl(8, flowsEvery(1, 8, '1'), { focal: 0, rate: 'i' }), '画不完：每年末付 1，一直付下去（图里只画了前 8 笔）。'),
      P('**递延年金**（deferred annuity）：先空几年，再开始付。关键是找**第一笔付款**：如果第一笔在 t = k + 1，那么 $a_{\\angl{n}}$ 落在 t = k，再往前搬 k 期。'),
      M('{}_{k|}a_{\\angl{n}} = v^k\\,a_{\\angl{n}} = a_{\\angl{k+n}} - a_{\\angl{k}}', '读作 “deferred k years”。右式：付满 $k+n$ 年，减去其实没付的前 $k$ 年。'),
      T(tl(8, flowsEvery(4, 8, '1'), { focal: 0, rate: 'i' }), '第一笔在 t = 4（k = 3）：$a_{\\angl{5}}$ 先落到 t = 3，再乘 $v^3$ 到 t = 0。'),
      M('a_{\\angl{n}} = a_{\\angl{\\infty}} - v^n a_{\\angl{\\infty}} = \\frac{1 - v^n}{i}', '一个从 t = 1 开始的永续年金，减去一个从 t = n + 1 开始的永续年金，剩下的正好是前 n 笔。这就是 $a_{\\angl{n}}$ 公式的另一种来历。'),
      TIP('“first payment at time k+1” ⇒ 递延 k 期，乘 $v^k$，不是 $v^{k+1}$。'),
    ],
    example: r => {
      const i = 0.05;
      return {
        text: '一个永续年金：每年末付 500，第一笔在第 4 年末。年利率 5%。今天值多少？',
        vars: { i },
        steps: [
          choice('$a_{\\angl{\\infty}}$ 把这串钱压成一笔，落在哪一刻？', [
            ['t = 3', true],
            ['t = 4', false, 't = 4 是第一笔付款本身，是 $\\ddot a_{\\angl{\\infty}}$ 的落点。'],
            ['t = 0', false, '$a_{\\angl{\\infty}}$ 落在第一笔前一期，不会自己跳过空着的 3 年。'],
          ]),
          expr('t = 3 的价值：', { target: 500 / i, model: '500a(inf)', hint: '永续年金写成 a(inf)，也可以直接写 500/i。' }),
          expr('今天的价值：', { target: (500 / i) / 1.05 ** 3, model: '500a(inf)v^3', why: '$10000 \\times v^3 = 8638.38$。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-perp-pv',
        zh: '永续年金的现值',
        gen: r => {
          const i = pick(r, RATES), Pm = pick(r, [500, 1000, 2000, 3000, 5000]);
          return {
            text: `设立一个奖学金基金：从明年起每年末发 ${money(Pm, 0)}，永远发下去。年利率 ${pct(i)}。今天需要存多少？`,
            vars: { i },
            steps: [
              choice('需要的金额是：', [
                [`$\\dfrac{${Pm}}{i}$`, true],
                [`$\\dfrac{${Pm}}{d}$`, false, '除以 $d$ 是期初付（今天就发第一笔）。这里第一笔在明年末。'],
                [`$${Pm}\\,i$`, false, '这是一年的利息，不是需要的本金。'],
              ], { hint: '本金 × i = 每年发的钱。' }),
              expr('写出今天需要存的钱：', { target: Pm / i, model: `${Pm}a(inf)`, why: `每年利息 ${money(Pm / i)} × ${pct(i)} = ${money(Pm, 0)}，正好发完，本金不动。` }),
            ],
          };
        },
      },
      {
        id: 'ann-perp-due',
        zh: '期初永续年金',
        gen: r => {
          const i = pick(r, RATES), Pm = pick(r, [100, 400, 600, 1000, 2500]);
          return {
            text: `从今天开始，每年年初付 ${money(Pm, 0)}，永远付下去。年利率 ${pct(i)}。今天值多少？`,
            vars: { i },
            steps: [
              choice('用哪个式子？', [
                [`$\\dfrac{${Pm}}{d}$`, true],
                [`$\\dfrac{${Pm}}{i}$`, false, '那是期末付（第一笔在一年后）。今天这一笔没算进去。'],
                [`$\\dfrac{${Pm}\\,v}{i}$`, false, '那是第一笔在 t = 2 的永续年金，往反方向搬了。'],
              ]),
              expr('写出今天的价值：', { target: (Pm * (1 + i)) / i, model: `${Pm}ad(inf)`, hint: '期初永续年金写成 ad(inf)，也可以写 P/d。' }),
              expr('拆开看：今天这一笔 + 从明年开始的期末永续年金：', { target: Pm + Pm / i, model: `${Pm} + ${Pm}/i`, why: '$\\ddot a_{\\angl{\\infty}} = 1 + a_{\\angl{\\infty}}$，即 $1/d = 1 + 1/i$。' }),
            ],
          };
        },
      },
      {
        id: 'ann-defer-pv',
        zh: '递延年金的现值',
        gen: r => {
          const i = pick(r, RATES), k = int(r, 2, 8), n = int(r, 4, 15), Pm = pick(r, [200, 500, 1000, 2000]);
          const fl = lvl(k + 1, k + n, Pm);
          return {
            text: `一份年金：第一笔付款在第 ${k + 1} 年末，之后每年末付 ${money(Pm, 0)}，共 ${n} 笔。年利率 ${pct(i)}。今天值多少？`,
            timeline: tl(k + n, show(fl), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`$${A(n)}$ 先把它们压成一笔，落在哪一刻？`, [
                [`t = ${k}`, true],
                [`t = ${k + 1}`, false, `t = ${k + 1} 是第一笔本身，那是 $\\ddot a$ 的落点。`],
                ['t = 0', false, `前面空着的 ${k} 年还没算。`],
              ], { hint: 'a 落在第一笔前一期。' }),
              expr(`t = ${k} 的价值：`, { target: sumPV(fl, i, k), model: `${Pm}a(${n})` }),
              expr('今天的价值：', { target: sumPV(fl, i, 0), model: `${Pm}a(${n})v^${k}`, hint: `从 t = ${k} 往前搬 ${k} 期。` }),
              expr(`另一种写法：用 $${A(k + n)} - ${A(k)}$。`, { target: sumPV(fl, i, 0), model: `${Pm}(a(${k + n}) - a(${k}))`, why: `付满 ${k + n} 年，减去其实没付的前 ${k} 年。` }),
            ],
          };
        },
      },
      {
        id: 'ann-perp-split',
        zh: '永续年金拆成“前 n 年 + 之后”',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 20), Pm = pick(r, [100, 500, 1000, 2000]);
          return {
            text: `一个永续年金每年末付 ${money(Pm, 0)}，年利率 ${pct(i)}。把它拆成两段：前 ${n} 年（t = 1 到 ${n}）和之后（t = ${n + 1} 起）。`,
            vars: { i },
            steps: [
              expr('整个永续年金今天值多少？', { target: Pm / i, model: `${Pm}a(inf)` }),
              choice(`“t = ${n + 1} 起的永续年金”，$a_{\\angl{\\infty}}$ 把它落在哪一刻？`, [
                [`t = ${n}`, true],
                [`t = ${n + 1}`, false, '那是它的第一笔付款，$a$ 型落在第一笔前一期。'],
                ['t = 0', false, `它前面空着 ${n} 年，要再往前搬。`],
              ]),
              expr('“之后” 这一段今天值多少？', { target: Pm / i / (1 + i) ** n, model: `${Pm}v^${n}a(inf)`, hint: `先落到 t = ${n}，再乘 $v^{${n}}$。` }),
              expr(`所以前 ${n} 年的现值 = 整个 − 之后：`, { target: Pm * an(n, i), model: `${Pm}(a(inf) - v^${n}a(inf))`, why: `化简就是 $${Pm}\\,\\dfrac{1-v^{${n}}}{i} = ${Pm}\\,${A(n)}$。` }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    id: 'ann-anytime',
    en: 'Value of an annuity at any date',
    zh: '年金在任意时刻值多少钱',
    outcome: '2a · 2b',
    learn: [
      P('考试常问：“这串付款在**某一刻**值多少钱？” 做法永远是两步：先用 $a$ 或 $s$ 把整串付款**压成一笔钱**（它落在一个固定的“锚点”上），再把这一笔像 Topic 1 那样搬到你要的时刻。'),
      TABLE(
        ['比较日在哪', '价值（每期付 1，共 n 笔）'],
        [
          ['第一笔之前 k 期再往前', '$v^k\\,a_{\\angl{n}}$'],
          ['第一笔之前一期', '$a_{\\angl{n}}$'],
          ['第一笔上', '$\\ddot a_{\\angl{n}}$'],
          ['最后一笔上', '$s_{\\angl{n}}$'],
          ['最后一笔之后一期', '$\\ddot s_{\\angl{n}}$'],
          ['最后一笔之后 k 期', '$s_{\\angl{n}}(1+i)^k$'],
        ],
      ),
      T(tl(10, flowsEvery(1, 6, 'P'), { focal: 9, rate: 'i' }), '付款在 t = 1…6，问 t = 9：$s_{\\angl{6}}$ 落在 t = 6，再往后搬 3 期 → $P\\,s_{\\angl{6}}(1+i)^3$。'),
      M('\\text{value at } t = a_{\\angl{n}}(1+i)^{t} = s_{\\angl{n}}\\,v^{\\,n-t}', '付款在 1…n。从 $a$ 的锚点（t = 0）往后搬 t 期，或者从 $s$ 的锚点（t = n）往前搬 n − t 期，结果一样。'),
      M('\\text{value at } t\\ (0<t<n) = s_{\\angl{t}} + a_{\\angl{n-t}}', '比较日在中间：已经付的 t 笔（含 t 时刻那一笔）往后搬 → $s_{\\angl{t}}$；还没付的 n − t 笔往前看 → $a_{\\angl{n-t}}$。'),
      RECIPE('“在某一刻是多少钱”', ['标出第一笔和最后一笔付款的时刻', '选一个锚：$a$（第一笔前一期）或 $s$（最后一笔上）', '数锚点到比较日差几期：往后乘 $(1+i)^k$，往前乘 $v^k$']),
      TIP('别背四种公式。只记两个锚点：a 在第一笔前一期，s 在最后一笔上。'),
    ],
    example: r => {
      const i = 0.05;
      return {
        text: '每年末付 200，从 t = 1 到 t = 6（共 6 笔），年利率 5%。这串钱在 t = 9 值多少？',
        timeline: tl(9, flowsEvery(1, 6, '200'), { focal: 9, rate: 'i = 5%' }),
        vars: { i },
        steps: [
          choice('用 $s_{\\angl{6}}$ 压成一笔，落在哪一刻？', [
            ['t = 6', true],
            ['t = 7', false, 't = 7 是 $\\ddot s_{\\angl{6}}$ 的落点。'],
            ['t = 9', false, '$s$ 只落在最后一笔上，不会自己跑到比较日。'],
          ]),
          choice('从 t = 6 到 t = 9，乘什么？', [
            ['$(1+i)^3$', true],
            ['$v^3$', false, '比较日在后面，往未来搬，钱变多。'],
            ['$(1+i)^4$', false, '从 6 数到 9 是 3 期。'],
          ]),
          expr('写出 t = 9 的价值：', { target: sumPV(lvl(1, 6, 200), i, 9), model: '200s(6)(1+i)^3', why: '$200 \\times 6.8019 \\times 1.1576 = 1574.81$。' }),
          expr('换个锚：从 $a_{\\angl{6}}$（t = 0）出发再写一次。', { target: sumPV(lvl(1, 6, 200), i, 9), model: '200a(6)(1+i)^9', why: '锚不同，搬的期数不同，结果一样。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-any-after',
        zh: '最后一笔之后的某一刻',
        gen: r => {
          const i = pick(r, RATES), f = int(r, 1, 3), n = int(r, 3, 8), k = int(r, 1, 4), Pm = pick(r, [100, 250, 400, 500, 1000]);
          const L = f + n - 1, at = L + k, fl = lvl(f, L, Pm);
          return {
            text: `每年付 ${money(Pm, 0)}，从 t = ${f} 到 t = ${L}（共 ${n} 笔）。年利率 ${pct(i)}。这串钱在 **t = ${at}** 值多少？`,
            timeline: tl(at, show(fl), { focal: at, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`用 $${S(n)}$ 压成一笔，落在哪一刻？`, [
                [`t = ${L}`, true],
                [`t = ${L + 1}`, false, '那是 $\\ddot s$ 的落点（最后一笔后一期）。'],
                [`t = ${f - 1}`, false, '那是 $a$ 的落点（第一笔前一期）。'],
              ]),
              choice(`从 t = ${L} 到 t = ${at}，乘什么？`, [
                [`$(1+i)^{${k}}$`, true],
                [`$v^{${k}}$`, false, '比较日在锚点之后，往未来搬。'],
                [`$(1+i)^{${k + 1}}$`, false, `数一数：从 ${L} 到 ${at} 是 ${k} 期。`],
              ]),
              expr(`写出 t = ${at} 的价值：`, { target: sumPV(fl, i, at), model: `${Pm}s(${n})(1+i)^${k}` }),
            ],
          };
        },
      },
      {
        id: 'ann-any-before',
        zh: '第一笔之前好几期',
        gen: r => {
          const i = pick(r, RATES), f = int(r, 3, 7), n = int(r, 3, 8), Pm = pick(r, [150, 300, 500, 750, 1000]);
          const L = f + n - 1, at = int(r, 0, f - 2), k = f - 1 - at, fl = lvl(f, L, Pm);
          return {
            text: `每年付 ${money(Pm, 0)}，从 t = ${f} 到 t = ${L}（共 ${n} 笔）。年利率 ${pct(i)}。这串钱在 **t = ${at}** 值多少？`,
            timeline: tl(L, show(fl), { focal: at, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`用 $${A(n)}$ 压成一笔，落在哪一刻？`, [
                [`t = ${f - 1}`, true],
                [`t = ${f}`, false, '那是第一笔付款本身，是 $\\ddot a$ 的落点。'],
                [`t = ${at}`, false, '比较日不是锚点。$a$ 永远落在第一笔前一期。'],
              ]),
              choice(`从 t = ${f - 1} 到 t = ${at}，乘什么？`, [
                [`$v^{${k}}$`, true],
                [`$(1+i)^{${k}}$`, false, '比较日在锚点之前，往过去搬，钱变少。'],
                [`$v^{${k + 1}}$`, false, `这是从第一笔 t = ${f} 开始数的，多数了一期。`],
              ]),
              expr(`写出 t = ${at} 的价值：`, { target: sumPV(fl, i, at), model: `${Pm}a(${n})v^${k}` }),
            ],
          };
        },
      },
      {
        id: 'ann-any-between',
        zh: '比较日在付款中间',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 12), t = int(r, 2, n - 2), Pm = pick(r, [100, 200, 500, 800, 1000]);
          const fl = lvl(1, n, Pm);
          return {
            text: `每年末付 ${money(Pm, 0)}，共 ${n} 笔（t = 1 到 ${n}）。年利率 ${pct(i)}。刚付完 t = ${t} 那一笔时，整串付款值多少？`,
            timeline: tl(n, show(fl), { focal: t, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`已经付的 ${t} 笔（t = 1…${t}），在 t = ${t} 值多少？`, [
                [`$${Pm}\\,${S(t)}$`, true],
                [`$${Pm}\\,${SD(t)}$`, false, `$\\ddot s$ 落在最后一笔之后一期，即 t = ${t + 1}。`],
                [`$${Pm}\\,${A(t)}$`, false, '$a$ 是往前看的，落在 t = 0。'],
              ]),
              choice(`还没付的 ${n - t} 笔（t = ${t + 1}…${n}），在 t = ${t} 值多少？`, [
                [`$${Pm}\\,${A(n - t)}$`, true],
                [`$${Pm}\\,${AD(n - t)}$`, false, `下一笔在 t = ${t + 1}，比比较日晚一期，是期末年金。`],
                [`$${Pm}\\,${S(n - t)}$`, false, '$s$ 落在最后一笔上，而这些付款都在比较日之后。'],
              ]),
              expr(`合起来，t = ${t} 的价值：`, { target: sumPV(fl, i, t), model: `${Pm}(s(${t}) + a(${n - t}))` }),
              expr('验证：用一个锚 $a_{\\angl{n}}$ 再写一次。', { target: Pm * an(n, i) * (1 + i) ** t, model: `${Pm}a(${n})(1+i)^${t}`, why: `$${S(t)} + ${A(n - t)} = ${A(n)}(1+i)^{${t}}$。` }),
            ],
          };
        },
      },
      {
        id: 'ann-any-four',
        zh: 'a、ä、s、s̈ 各落在哪',
        gen: r => {
          const i = pick(r, RATES), f = int(r, 2, 4), n = int(r, 4, 8), Pm = pick(r, [100, 300, 500, 1000]);
          const L = f + n - 1, fl = lvl(f, L, Pm);
          const which = pick(r, ['a', 'ad', 's', 'sd']);
          const at = { a: f - 1, ad: f, s: L, sd: L + 1 }[which];
          return {
            text: `每年付 ${money(Pm, 0)}，从 t = ${f} 到 t = ${L}（共 ${n} 笔）。年利率 ${pct(i)}。这串钱在 **t = ${at}** 值多少？`,
            timeline: tl(L + 1, show(fl), { focal: at, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`t = ${at} 正好是哪个符号的落点？`, [
                [`$${Pm}\\,${A(n)}$`, which === 'a', `$a$ 落在第一笔前一期，即 t = ${f - 1}。`],
                [`$${Pm}\\,${AD(n)}$`, which === 'ad', `$\\ddot a$ 落在第一笔上，即 t = ${f}。`],
                [`$${Pm}\\,${S(n)}$`, which === 's', `$s$ 落在最后一笔上，即 t = ${L}。`],
                [`$${Pm}\\,${SD(n)}$`, which === 'sd', `$\\ddot s$ 落在最后一笔后一期，即 t = ${L + 1}。`],
              ], { hint: `第一笔 t = ${f}，最后一笔 t = ${L}。` }),
              expr(`写出 t = ${at} 的价值：`, { target: sumPV(fl, i, at), model: `${Pm}${which}(${n})`, hint: 'ä 写 ad，s̈ 写 sd。' }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    id: 'ann-mismatch',
    en: 'Payment period different from interest period',
    zh: '付款周期 ≠ 利率周期：先换成每期利率 j',
    outcome: '2a',
    learn: [
      P('$a_{\\angl{n}}$ 默认“**一个付款期 = 一个利率期**”。但现实里常常是按月付款、给的却是年利率。做法只有一条：**把利率换成每个付款期的有效利率 $j$**，然后照常用 $a_{\\angl{n}\\,j}$，$n$ 是付款次数。'),
      M('j = (1+i)^{1/12} - 1', '按月付款、给的是有效年利率 $i$：一年长成 $1+i$，一个月就是开 12 次方。'),
      M('j = \\frac{i^{(12)}}{12} \\qquad j_{\\text{年}} = \\left(1 + \\frac{i^{(12)}}{12}\\right)^{12} - 1', '给的是按月复利的名义利率 $i^{(12)}$：按月付款直接除以 12；按年付款要先复利 12 次得到年有效利率。'),
      TABLE(
        ['付款', '给的利率', '每付款期 j'],
        [
          ['每月', '有效年利率 i', '$(1+i)^{1/12} - 1$'],
          ['每季', '有效年利率 i', '$(1+i)^{1/4} - 1$'],
          ['每月', '$i^{(12)}$', '$i^{(12)}/12$'],
          ['每季', '$i^{(12)}$', '$(1 + i^{(12)}/12)^3 - 1$'],
          ['每年', '$i^{(12)}$', '$(1 + i^{(12)}/12)^{12} - 1$'],
        ],
      ),
      T(tl(12, flowsEvery(1, 12, '100'), { focal: 0, unit: 'month', rate: 'j per month' }), '一年 12 笔月供：时间轴的一格是一个月，所以利率也必须是“每月”的 $j$。'),
      RECIPE('付款周期 ≠ 利率周期', ['付款多久一次？那就是“一期”', '把给的利率换成这一期的有效利率 $j$', '$n$ = 付款次数（不是年数）', '价值 $= P\\,a_{\\angl{n}\\,j}$，输入 a(n, j)']),
      TIP('n 永远数付款次数。5 年的月供，n = 60。'),
    ],
    example: r => {
      const i = 0.06, j = 1.06 ** (1 / 12) - 1;
      return {
        text: '每月末付 200，共 2 年，有效年利率 6%。今天值多少？',
        timeline: tl(24, flowsEvery(1, 24, '200'), { focal: 0, unit: 'month', rate: 'i = 6% / 年' }),
        vars: { i },
        steps: [
          choice('每个月的有效利率 j 是：', [
            ['$(1.06)^{1/12} - 1$', true],
            ['$0.06/12$', false, '6% 是**有效**年利率，不是名义利率，不能直接除以 12。'],
            ['$(1.06)^{12} - 1$', false, '方向反了：这是把 6% 当成月利率再算一年。'],
          ]),
          expr('写出 j：', { target: j, model: '(1+i)^(1/12) - 1', unit: 'rate', why: '$j \\approx 0.4868\\%$，比 0.5% 略小。' }),
          expr('写出现值（n = 24 笔，用 a(24, j)）：', { target: 200 * an(24, j), model: '200a(24, j)', vars: { j }, hint: '付款次数 24，每期利率 j。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-mm-monthly',
        zh: '月供 + 有效年利率',
        gen: r => {
          const i = pick(r, RATES), y = pick(r, [2, 3, 4, 5, 10]), Pm = pick(r, [100, 200, 250, 500, 1000]);
          const n = 12 * y, j = (1 + i) ** (1 / 12) - 1;
          return {
            text: `每月末付 ${money(Pm, 0)}，共 ${y} 年，有效年利率 ${pct(i)}。今天值多少？`,
            ...(n <= 30 ? { timeline: tl(n, show(lvl(1, n, Pm)), { focal: 0, unit: 'month', rate: `i = ${pct(i)} / 年` }) } : {}),
            vars: { i },
            steps: [
              choice('每月的有效利率 j：', [
                ['$(1+i)^{1/12} - 1$', true],
                ['$i/12$', false, '只有名义利率 $i^{(12)}$ 才直接除以 12。这里给的是有效年利率。'],
                ['$(1+i)^{12} - 1$', false, '这是把 i 当月利率复利一年，方向反了。'],
              ]),
              choice('$a_{\\angl{n}}$ 里的 n 是：', [
                [`${n}（付款次数）`, true],
                [`${y}（年数）`, false, 'j 是月利率，时间单位是月，n 要数付款次数。'],
              ]),
              expr('写出 j：', { target: j, model: '(1+i)^(1/12) - 1', unit: 'rate' }),
              expr('写出现值（可以用 j）：', { target: Pm * an(n, j), model: `${Pm}a(${n}, j)`, vars: { j } }),
            ],
          };
        },
      },
      {
        id: 'ann-mm-quarterly',
        zh: '按季付款 + 有效年利率',
        gen: r => {
          const i = pick(r, RATES), y = int(r, 2, 7), Pm = pick(r, [250, 500, 1000, 1500]);
          const n = 4 * y, j = (1 + i) ** 0.25 - 1, pv = r() < 0.5;
          const fl = lvl(1, n, Pm);
          return {
            text: `每季度末存 ${money(Pm, 0)}，共 ${y} 年，有效年利率 ${pct(i)}。${pv ? '今天值多少？' : '存完最后一笔时账户里有多少？'}`,
            timeline: tl(n, show(fl), { focal: pv ? 0 : n, unit: 'quarter', rate: `i = ${pct(i)} / 年` }),
            vars: { i },
            steps: [
              expr('每季度的有效利率 j：', { target: j, model: '(1+i)^(1/4) - 1', unit: 'rate', hint: '一年 4 个季度：开 4 次方。' }),
              choice('用哪个符号？', [
                ['$a$：落在第一笔前一期', pv, '问的是最后一笔时的余额，那是 $s$ 的落点。'],
                ['$s$：落在最后一笔上', !pv, '问的是今天（第一笔前一期），那是 $a$ 的落点。'],
              ]),
              expr(`写出${pv ? '现值' : '终值'}（n = ${n} 笔）：`, { target: sumPV(fl, j, pv ? 0 : n), model: pv ? `${Pm}a(${n}, j)` : `${Pm}s(${n}, j)`, vars: { j } }),
            ],
          };
        },
      },
      {
        id: 'ann-mm-nominal',
        zh: '给的是 $i^{(12)}$：按月 / 按季 / 按年付款',
        gen: r => {
          const rr = pick(r, [0.06, 0.09, 0.12]), Pm = pick(r, [100, 500, 1000, 2000]);
          const kind = pick(r, ['m', 'q', 'y']);
          const cfg = {
            m: { per: '每月末', n: 12 * pick(r, [1, 2, 3, 5]), j: rr / 12, model: `${rr}/12`, unit: '月' },
            q: { per: '每季度末', n: 4 * int(r, 2, 6), j: (1 + rr / 12) ** 3 - 1, model: `(1+${rr}/12)^3 - 1`, unit: '季度' },
            y: { per: '每年末', n: int(r, 5, 15), j: (1 + rr / 12) ** 12 - 1, model: `(1+${rr}/12)^12 - 1`, unit: '年' },
          }[kind];
          return {
            text: `${cfg.per}付 ${money(Pm, 0)}，共 ${cfg.n} 笔。利率是 $i^{(12)} = ${pct(rr)}$（名义年利率，按月复利）。今天值多少？`,
            vars: {},
            steps: [
              choice(`每个付款期（一${cfg.unit}）的有效利率 j：`, [
                ['$i^{(12)}/12$', kind === 'm', '这是**每月**的利率，只有按月付款才直接用。'],
                ['$(1 + i^{(12)}/12)^{3} - 1$', kind === 'q', '这是**每季度**（3 个月复利）的利率，只有按季付款才用。'],
                ['$(1 + i^{(12)}/12)^{12} - 1$', kind === 'y', '这是**每年**的有效利率，只有按年付款才用。'],
                ['$(1 + i^{(12)})^{1/12} - 1$', false, '把名义利率当成了有效年利率。$i^{(12)}$ 只是报价，要先除以 12。'],
              ], { hint: '先算每月利率 $i^{(12)}/12$，再看一个付款期有几个月。' }),
              expr('写出 j：', { target: cfg.j, model: cfg.model, unit: 'rate' }),
              expr('写出现值（用 a(n, j)）：', { target: Pm * an(cfg.n, cfg.j), model: `${Pm}a(${cfg.n}, j)`, vars: { j: cfg.j } }),
            ],
          };
        },
      },
      {
        id: 'ann-mm-loan',
        zh: '车贷月供',
        gen: r => {
          const L = pick(r, [15000, 20000, 24000, 30000]), y = pick(r, [3, 4, 5]), rr = pick(r, [0.06, 0.09, 0.12]);
          const n = 12 * y, j = rr / 12, pmt = L / an(n, j);
          return {
            text: `买车贷款 ${money(L, 0)}，${y} 年还清，每月末还一样多。贷款利率 $i^{(12)} = ${pct(rr)}$。每月还多少？一共付了多少利息？`,
            vars: {},
            steps: [
              expr('每月的利率 j：', { target: j, model: `${rr}/12`, unit: 'rate', hint: '名义利率按月复利：直接除以 12。' }),
              expr(`每月还款 = 贷款 ÷ $a_{\\angl{${n}}\\,j}$：`, { target: pmt, model: `${L}/a(${n}, j)`, vars: { j } }),
              expr('一共付的利息 = 所有还款 − 贷款：', { target: n * pmt - L, model: `${n}*${L}/a(${n}, j) - ${L}`, vars: { j }, why: `还了 ${n} 次，每次 ${money(pmt)}。` }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    id: 'ann-arith',
    en: 'Arithmetic increasing and decreasing annuities',
    zh: '等差变额年金 $(Ia)$、$(Da)$',
    outcome: '2a',
    learn: [
      P('付款每期**加一个固定数**：100、110、120……这叫等差（arithmetic）变额年金。最基本的两种：递增 1, 2, …, n，记 $(Ia)_{\\angl{n}}$；递减 n, n−1, …, 1，记 $(Da)_{\\angl{n}}$。'),
      M('(Ia)_{\\angl{n}} = \\frac{\\ddot a_{\\angl{n}} - n\\,v^n}{i} \\qquad (Da)_{\\angl{n}} = \\frac{n - a_{\\angl{n}}}{i}', '付款都在期末（t = 1…n）。记法：分子是“期初年金 − 最后那一层”，或“n − 年金”，再除以 i。'),
      T(tl(5, [{ t: 1, amt: '100' }, { t: 2, amt: '110' }, { t: 3, amt: '120' }, { t: 4, amt: '130' }, { t: 5, amt: '140' }], { focal: 0, rate: 'i' }), '100, 110, …, 140 = 每年 100 的等额年金 + 0, 10, 20, 30, 40 的“台阶”。'),
      M('PV = P\\,a_{\\angl{n}} + Q\\,\\frac{a_{\\angl{n}} - n\\,v^n}{i}', '第一笔 $P$、每期加 $Q$：拆成等额 $P$ 的年金，加上 $0, Q, 2Q, \\ldots, (n-1)Q$ 的台阶。台阶部分 $= Q\\big((Ia)_{\\angl{n}} - a_{\\angl{n}}\\big)$，化简就是上式。'),
      M('(Ia)_{\\angl{\\infty}} = \\frac{1}{i} + \\frac{1}{i^2} \\qquad P, P+Q, P+2Q, \\ldots \\text{ 永续：} \\frac{P}{i} + \\frac{Q}{i^2}', '递增永续年金：把它看成无数个永续年金一层层叠起来（t = 1 起一层、t = 2 起一层……）。'),
      TABLE(['输入', '含义'], [['Ia(n)', '$(Ia)_{\\angl{n}}$：1, 2, …, n'], ['Da(n)', '$(Da)_{\\angl{n}}$：n, n−1, …, 1'], ['Is(n)、Ds(n)', '对应的终值（落在 t = n）'], ['Ia(inf)', '$1/i + 1/i^2$']]),
      TIP('$(Ia)_{\\angl{n}} + (Da)_{\\angl{n}} = (n+1)\\,a_{\\angl{n}}$：两串叠起来每期都是 $n+1$。'),
    ],
    example: r => {
      const i = 0.05, fl = arithFlows(8, 100, 10);
      return {
        text: '每年末付款：100, 110, 120, …, 170（共 8 笔）。年利率 5%。今天值多少？',
        timeline: tl(8, show(fl), { focal: 0, rate: 'i = 5%' }),
        vars: { i },
        steps: [
          choice('拆成 “等额 P + 台阶 0, Q, 2Q, …”：P 和 Q 是多少？', [
            ['P = 100，Q = 10', true],
            ['P = 10，Q = 100', false, 'P 是第一笔的金额（100），Q 是每期增加的量（10），两个放反了。'],
            ['P = 170，Q = −10', false, '那是倒过来看成递减，第一笔是 100 不是 170。'],
          ]),
          expr('等额部分：', { target: 100 * an(8, i), model: '100a(8)' }),
          expr('台阶部分（0, 10, …, 70）：', { target: 10 * (an(8, i) - 8 / 1.05 ** 8) / i, model: '10(a(8) - 8v^8)/i' }),
          expr('合起来：', { target: sumPV(fl, i, 0), model: '100a(8) + 10(a(8) - 8v^8)/i', why: '也可以写成 90a(8) + 10Ia(8)。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-arith-inc',
        zh: '100, 110, 120… 型递增',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 15), Pm = pick(r, [100, 200, 500, 1000]), Q = pick(r, [10, 20, 25, 50]);
          const fl = arithFlows(n, Pm, Q);
          return {
            text: `每年末付款：${Pm}, ${Pm + Q}, ${Pm + 2 * Q}, …，每年多 ${Q}，共 ${n} 笔。年利率 ${pct(i)}。今天值多少？`,
            ...(n <= 12 ? { timeline: tl(n, show(fl), { focal: 0, rate: `i = ${pct(i)}` }) } : {}),
            vars: { i },
            steps: [
              choice('哪个拆法对？', [
                [`$${Pm}\\,${A(n)} + ${Q}\\,\\dfrac{${A(n)} - ${n}v^{${n}}}{i}$`, true],
                [`$${Pm}\\,${A(n)} + ${Q}\\,(Ia)_{\\angl{${n}}}$`, false, `$(Ia)$ 的台阶是 Q, 2Q, …，这样第一笔就成了 ${Pm + Q}。`],
                [`$${Pm}\\,(Ia)_{\\angl{${n}}}$`, false, `那是 ${Pm}, ${2 * Pm}, ${3 * Pm}…，每年加 ${Pm} 而不是 ${Q}。`],
              ], { hint: '等额 P 的年金 + 从 0 开始的台阶。' }),
              expr('写出现值：', { target: sumPV(fl, i, 0), model: `${Pm}a(${n}) + ${Q}(a(${n}) - ${n}v^${n})/i` }),
              expr('另一种拆法：$(P-Q)$ 的等额 + $Q\\,(Ia)$：', { target: sumPV(fl, i, 0), model: `${Pm - Q}a(${n}) + ${Q}Ia(${n})`, why: `${Pm - Q} + ${Q}·k 在 k = 1 时正好是 ${Pm}。` }),
            ],
          };
        },
      },
      {
        id: 'ann-arith-dec',
        zh: '递减 n, n−1, …, 1',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 4, 12), K = pick(r, [50, 100, 200, 500]);
          const fl = Array.from({ length: n }, (_, k) => ({ t: k + 1, amt: K * (n - k) }));
          return {
            text: `每年末付款：${K * n}, ${K * (n - 1)}, …, ${K}，每年少 ${K}，共 ${n} 笔。年利率 ${pct(i)}。今天值多少？`,
            timeline: tl(n, show(fl), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('用哪个？', [
                [`$${K}\\,(Da)_{\\angl{${n}}}$`, true],
                [`$${K}\\,(Ia)_{\\angl{${n}}}$`, false, '方向反了：$(Ia)$ 是越付越多。'],
                [`$${K * n}\\,${A(n)}$`, false, '这是每年都付第一年那么多，没有递减。'],
              ]),
              expr('写出现值（用 $(Da)_{\\angl{n}} = (n - a_{\\angl{n}})/i$）：', { target: sumPV(fl, i, 0), model: `${K}(${n} - a(${n}))/i`, hint: `输入 ${K}(${n} - a(${n}))/i，或 ${K}Da(${n})。` }),
            ],
          };
        },
      },
      {
        id: 'ann-arith-perp',
        zh: '递增永续年金',
        gen: r => {
          const i = pick(r, [0.04, 0.05, 0.06, 0.08, 0.1]), Pm = pick(r, [100, 200, 500, 1000]), Q = pick(r, [10, 20, 25, 50]);
          return {
            text: `一个永续年金：第 1 年末付 ${Pm}，之后每年多付 ${Q}（${Pm}, ${Pm + Q}, ${Pm + 2 * Q}, …），永远付下去。年利率 ${pct(i)}。今天值多少？`,
            vars: { i },
            steps: [
              choice('现值公式：', [
                [`$\\dfrac{${Pm}}{i} + \\dfrac{${Q}}{i^2}$`, true],
                [`$\\dfrac{${Pm}}{i} + \\dfrac{${Q}}{i}$`, false, '台阶 0, Q, 2Q, … 不是一个等额永续年金：它是一层层叠起来的永续年金，再除一次 i。'],
                [`$\\dfrac{${Pm}}{i^2} + \\dfrac{${Q}}{i}$`, false, '两个分母放反了：等额部分是普通永续年金 $1/i$。'],
              ], { hint: '等额 P 的永续年金 + 台阶部分 $Q\\big((Ia)_{\\angl{\\infty}} - a_{\\angl{\\infty}}\\big) = Q/i^2$。' }),
              expr('写出现值：', { target: Pm / i + Q / (i * i), model: `${Pm}/i + ${Q}/i^2` }),
            ],
          };
        },
      },
      {
        id: 'ann-arith-av',
        zh: '递增存款的终值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 4, 12), Pm = pick(r, [500, 1000, 2000]), Q = pick(r, [50, 100, 200]);
          const fl = arithFlows(n, Pm, Q);
          return {
            text: `每年末存款：第一年 ${Pm}，以后每年多存 ${Q}，共存 ${n} 年。年利率 ${pct(i)}。存完最后一笔时账户里有多少？`,
            timeline: tl(n, show(fl), { focal: n, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('等额部分用什么？', [
                [`$${Pm}\\,${S(n)}$`, true],
                [`$${Pm}\\,${A(n)}$`, false, '问的是最后一笔时的余额，用终值 $s$。'],
                [`$${Pm}\\,${SD(n)}$`, false, '$\\ddot s$ 落在最后一笔之后一期。'],
              ]),
              expr('台阶部分 0, Q, …, (n−1)Q 的终值是 $Q\\,(s_{\\angl{n}} - n)/i$。写出总终值：', { target: sumPV(fl, i, n), model: `${Pm}s(${n}) + ${Q}(s(${n}) - ${n})/i`, why: '就是现值的拆法整体乘 $(1+i)^n$：$(a_{\\angl{n}} - nv^n)(1+i)^n = s_{\\angl{n}} - n$。' }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    id: 'ann-geo',
    en: 'Geometric (compound increasing) annuities',
    zh: '等比增长年金',
    outcome: '2a',
    learn: [
      P('工资每年涨 3%、股息每年涨 2%：付款每期**乘一个固定倍数** $(1+g)$。第一笔 1（在 t = 1），之后 $(1+g)$、$(1+g)^2$……这叫等比（geometric）增长年金。'),
      T(tl(5, [{ t: 1, amt: '1' }, { t: 2, amt: '1+g' }, { t: 3, amt: '(1+g)²' }, { t: 4, amt: '(1+g)³' }, { t: 5, amt: '(1+g)⁴' }], { focal: 0, rate: 'i' }), '第 k 笔是 $(1+g)^{k-1}$，在 t = k；现值乘 $v^k$。'),
      M('PV = \\sum_{k=1}^{n} (1+g)^{k-1} v^k = \\frac{1 - \\left(\\frac{1+g}{1+i}\\right)^{n}}{i - g}', '还是等比数列：首项 $v$，公比 $\\frac{1+g}{1+i}$。$g = i$ 时公式分母为零，但每一笔现值都是 $v$，总和就是 $n\\,v$。'),
      M('\\text{永续}(g < i):\\quad PV = \\frac{1}{i - g}', '增长比折现慢，越往后的付款现值越小，加起来有限。股票估值里的 Gordon 公式就是这个：价格 = 下一期股息 ÷ $(i - g)$。'),
      M('j = \\frac{1+i}{1+g} - 1 \\quad\\Longrightarrow\\quad PV = \\frac{a_{\\angl{n}\\,j}}{1+g}', '小技巧：$(1+g)^{k-1}v^k = \\frac{1}{1+g}\\left(\\frac{1+g}{1+i}\\right)^k$，括号里正好是利率 $j$ 下的 $v_j^k$。'),
      TIP('分子分母顺序：$(1+g)/(1+i)$ 小于 1 才对。第一笔是 $P$，不是 $P(1+g)$。'),
    ],
    example: r => {
      const i = 0.08, g = 0.03;
      return {
        text: '一只股票：1 年后发股息 2，之后每年增长 3%。投资者要求 8% 的收益率。(a) 如果股息永远发下去，股价是多少？(b) 如果只看前 10 年的股息呢？',
        vars: { i, g },
        steps: [
          choice('永续增长年金的现值是：', [
            ['$\\dfrac{2}{i - g}$', true],
            ['$\\dfrac{2}{i + g}$', false, '增长让未来的钱**更值钱**，分母应该变小：$i - g$。'],
            ['$\\dfrac{2}{i}$', false, '这忽略了增长，是等额永续年金。'],
          ]),
          expr('(a) 股价：', { target: 2 / (i - g), model: '2/(i - g)', why: '$2 / 0.05 = 40$。' }),
          expr('(b) 前 10 年股息的现值：', { target: sumPV(geoFlows(10, 2, g), i, 0), model: '2(1 - ((1+g)/(1+i))^10)/(i - g)', hint: '在永续公式上乘 $1 - \\left(\\frac{1+g}{1+i}\\right)^{10}$。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-geo-salary',
        zh: '每年涨薪的现值',
        gen: r => {
          const i = pick(r, [0.05, 0.06, 0.07, 0.08]), g = pick(r, [0.02, 0.03, 0.04]), n = int(r, 5, 25), Pm = pick(r, [40000, 50000, 60000, 80000]);
          const fl = geoFlows(n, Pm, g);
          return {
            text: `一份工作第 1 年末发年薪 ${money(Pm, 0)}，之后每年涨 ${pct(g)}，一共做 ${n} 年。按 ${pct(i)} 折现，所有工资今天值多少？`,
            ...(n <= 10 ? { timeline: tl(n, show(fl), { focal: 0, rate: `i = ${pct(i)}` }) } : {}),
            vars: { i, g },
            steps: [
              choice('哪个公式对？', [
                [`$${Pm}\\cdot\\dfrac{1-\\left(\\frac{1+g}{1+i}\\right)^{${n}}}{i-g}$`, true],
                [`$${Pm}\\cdot\\dfrac{1-\\left(\\frac{1+i}{1+g}\\right)^{${n}}}{i-g}$`, false, '比值写反了。公比应是“增长 ÷ 折现” $\\frac{1+g}{1+i} < 1$。'],
                [`$${Pm}(1+g)^{${n}}\\,${A(n)}$`, false, '这把每一笔都当成最后一年那么大，高估了。'],
              ]),
              expr('写出现值：', { target: sumPV(fl, i, 0), model: `${Pm}(1 - ((1+g)/(1+i))^${n})/(i - g)` }),
            ],
          };
        },
      },
      {
        id: 'ann-geo-perp',
        zh: '增长永续年金（股息）',
        gen: r => {
          const i = pick(r, [0.06, 0.07, 0.08, 0.1]), g = pick(r, [0.01, 0.02, 0.03, 0.04]), D = pick(r, [1, 2, 3, 5]);
          const justPaid = r() < 0.5;
          const first = justPaid ? D * (1 + g) : D;
          return {
            text: justPaid
              ? `一只股票**刚刚**发了每股股息 ${D}，之后每年增长 ${pct(g)}，永远发下去。要求收益率 ${pct(i)}。今天股价是多少？`
              : `一只股票 1 年后发每股股息 ${D}，之后每年增长 ${pct(g)}，永远发下去。要求收益率 ${pct(i)}。今天股价是多少？`,
            vars: { i, g },
            steps: [
              choice('第一笔要算进价格的股息（在 t = 1）是多少？', [
                [`$${D}$`, !justPaid, '刚发过的那笔已经不属于新股东了；下一笔在 t = 1，已经涨了一次。'],
                [`$${D}(1+g)$`, justPaid, '这一笔就是 1 年后的股息本身，还没有增长过。'],
              ], { hint: '“刚刚发了” 和 “1 年后发” 差一次增长。' }),
              choice('永续增长年金的分母是：', [
                ['$i - g$', true],
                ['$i + g$', false, '增长让未来的钱更值钱，分母应该变小。'],
                ['$i$', false, '这忽略了增长。'],
              ]),
              expr('写出股价：', { target: first / (i - g), model: justPaid ? `${D}(1+g)/(i - g)` : `${D}/(i - g)` }),
            ],
          };
        },
      },
      {
        id: 'ann-geo-trick',
        zh: '换利率 j 的技巧',
        gen: r => {
          const i = pick(r, [0.06, 0.07, 0.08, 0.09]), g = pick(r, [0.02, 0.03, 0.04, 0.05]), n = int(r, 5, 20), Pm = pick(r, [1000, 2000, 5000]);
          const j = (1 + i) / (1 + g) - 1;
          return {
            text: `每年末付款，第一笔 ${money(Pm, 0)}，之后每年增长 ${pct(g)}，共 ${n} 笔。年利率 ${pct(i)}。用“换利率”的方法求现值。`,
            vars: { i, g },
            steps: [
              expr('先求 j：', { target: j, model: '(1+i)/(1+g) - 1', unit: 'rate', hint: '$1 + j = \\frac{1+i}{1+g}$。' }),
              choice('为什么 $a_{\\angl{n}\\,j}$ 还要除以 $(1+g)$？', [
                ['第 k 笔是 $P(1+g)^{k-1}$：比 $P(1+g)^{k}$ 少一个 $(1+g)$', true],
                ['因为要把价值往前搬一期', false, '没有搬时刻：$a_{\\angl{n}\\,j}$ 本来就落在 t = 0。'],
                ['因为 j 是名义利率', false, 'j 是有效利率，跟名义利率无关。'],
              ]),
              expr('写出现值（可以用 j）：', { target: sumPV(geoFlows(n, Pm, g), i, 0), model: `${Pm}a(${n}, j)/(1+g)`, vars: { j } }),
            ],
          };
        },
      },
      {
        id: 'ann-geo-equal',
        zh: '增长率等于利率',
        gen: r => {
          const i = pick(r, [0.03, 0.04, 0.05, 0.06]), n = int(r, 5, 20), Pm = pick(r, [100, 500, 1000, 2000]);
          const fl = geoFlows(n, Pm, i);
          return {
            text: `每年末付款，第一笔 ${money(Pm, 0)}，之后每年增长 ${pct(i)}，共 ${n} 笔。年利率也是 ${pct(i)}。今天值多少？`,
            vars: { i },
            steps: [
              choice('能直接套 $\\dfrac{1 - \\left(\\frac{1+g}{1+i}\\right)^n}{i - g}$ 吗？', [
                ['不能：$g = i$ 时分子分母都是 0', true],
                ['能，结果是 0', false, '0/0 不是 0，是公式失效了。回到逐笔求和。'],
              ]),
              choice('第 k 笔的现值 $P(1+i)^{k-1}v^k$ 等于：', [
                [`$${Pm}\\,v$`, true],
                [`$${Pm}\\,v^{k}$`, false, '增长的 $(1+i)^{k-1}$ 抵消了 $v^{k-1}$，只剩一个 $v$。'],
                [`$${Pm}$`, false, '还剩一个 $v$：第一笔在 t = 1，本身就要折现一期。'],
              ]),
              expr('所以现值：', { target: sumPV(fl, i, 0), model: `${n}*${Pm}v`, why: `每一笔都值 ${Pm}v，共 ${n} 笔。` }),
            ],
          };
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 8 */
  {
    id: 'ann-cont',
    en: 'Continuous annuities; solving for n and i',
    zh: '连续年金 $\\bar a_{\\angl{n}}$，以及求 n、求 i',
    outcome: '2a · 2b',
    learn: [
      P('把一年切成 m 段，每段付 $1/m$，m 越来越大，最后就是**连续付款**：一年总共付 1，但均匀地“流”出去。工资、租金收入常用它近似。'),
      T(tl(8, flowsEvery(1, 8, '¼'), { focal: 0, unit: 'quarter', rate: 'i' }), '每季度付 ¼（一年共 1）。切得越细，越接近连续年金 $\\bar a$。'),
      M('\\bar a_{\\angl{n}} = \\int_0^n v^t\\,dt = \\frac{1 - v^n}{\\delta} \\qquad \\bar s_{\\angl{n}} = \\frac{(1+i)^n - 1}{\\delta}', '跟 $a_{\\angl{n}}$ 分子一样，分母从 $i$ 换成利息力 $\\delta = \\ln(1+i)$。'),
      M('a_{\\angl{n}} < \\bar a_{\\angl{n}} < \\ddot a_{\\angl{n}}, \\qquad \\bar a_{\\angl{n}} = \\frac{i}{\\delta}\\,a_{\\angl{n}}', '连续付款平均比期末早约半期、比期初晚约半期，所以夹在中间。分母 $d < \\delta < i$ 也是这个顺序反过来。'),
      P('**求 n**：$a_{\\angl{n}} = X$ ⇒ $1 - v^n = iX$ ⇒ $n = -\\ln(1 - iX)/\\ln(1+i)$。**求 i** 没有公式：考场上用计算器；这里你可以写出不同利率下的 set-up 让网页算，然后比大小、夹逼。'),
      TIP('利率越高，a(n) 越小：试出来太大，说明利率该调高。'),
      RECIPE('猜利率（夹逼）', ['写出某个利率下的 $P\\,a_{\\angl{n}}$，看它比价格大还是小', '大了 → 真实利率更高；小了 → 更低', '换一个利率再试，直到夹住']),
    ],
    example: r => {
      const i = 0.05, dl = Math.log(1.05);
      return {
        text: '一份收入以每年 1,000 的速度连续流入，共 10 年。年利率 5%。今天值多少？和每年末付 1,000 比呢？',
        vars: { i },
        steps: [
          choice('$\\bar a_{\\angl{10}}$ 的分母是：', [
            ['$\\delta = \\ln(1.05)$', true],
            ['$i = 0.05$', false, '分母是 $i$ 的是期末年金 $a_{\\angl{10}}$。'],
            ['$d = 0.05/1.05$', false, '分母是 $d$ 的是期初年金 $\\ddot a_{\\angl{10}}$。'],
          ]),
          expr('写出现值：', { target: (1000 * (1 - 1.05 ** -10)) / dl, model: '1000(1 - v^10)/delta', hint: '也可以输入 1000abar(10)。' }),
          expr('用 $\\frac{i}{\\delta}\\,a_{\\angl{10}}$ 再写一次：', { target: 1000 * (i / dl) * an(10, i), model: '1000(i/delta)a(10)', why: '比 $1000\\,a_{\\angl{10}} = 7721.73$ 大一点：7913.21。' }),
        ],
      };
    },
    drills: [
      {
        id: 'ann-cont-pv',
        zh: '连续年金的现值',
        gen: r => {
          const n = int(r, 5, 20), R = pick(r, [1000, 2000, 5000, 12000]);
          if (r() < 0.5) {
            const i = pick(r, RATES);
            return {
              text: `一份收入以每年 ${money(R, 0)} 的速度连续流入，共 ${n} 年。有效年利率 ${pct(i)}。今天值多少？`,
              vars: { i },
              steps: [
                choice('哪个式子对？', [
                  [`$\\dfrac{1-v^{${n}}}{\\delta}$`, true],
                  [`$\\dfrac{1-v^{${n}}}{i}$`, false, '这是期末付款的 $a_{\\angl{n}}$。'],
                  [`$\\dfrac{1-v^{${n}}}{d}$`, false, '这是期初付款的 $\\ddot a_{\\angl{n}}$。'],
                ]),
                expr('写出现值：', { target: (R * (1 - (1 + i) ** -n)) / Math.log(1 + i), model: `${R}(1 - v^${n})/delta`, hint: `也可以输入 ${R}abar(${n})。` }),
              ],
            };
          }
          const dl = pick(r, [0.03, 0.04, 0.05, 0.06]);
          return {
            text: `一份收入以每年 ${money(R, 0)} 的速度连续流入，共 ${n} 年。利息力 δ = ${pct(dl)}。今天值多少？`,
            vars: { delta: dl },
            steps: [
              choice(`$v^{${n}}$ 用 δ 写是：`, [
                [`$e^{-${n}\\delta}$`, true],
                [`$1 - ${n}\\delta$`, false, '这是单利的近似，不是复利的折现因子。'],
                [`$(1+\\delta)^{-${n}}$`, false, 'δ 不是有效年利率；$v = e^{-\\delta}$。'],
              ]),
              expr('写出现值：', { target: (R * (1 - Math.exp(-dl * n))) / dl, model: `${R}(1 - exp(-${n}delta))/delta` }),
            ],
          };
        },
      },
      {
        id: 'ann-cont-order',
        zh: '$a$、$\\bar a$、$\\ddot a$ 谁大',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 25);
          return {
            text: `同样每年付 1、共 ${n} 年、年利率 ${pct(i)}：期末付、连续付、期初付三种方式，现值怎么排？`,
            vars: { i },
            steps: [
              choice('从小到大：', [
                [`$${A(n)} < \\bar a_{\\angl{${n}}} < ${AD(n)}$`, true],
                [`$\\bar a_{\\angl{${n}}} < ${A(n)} < ${AD(n)}$`, false, '连续付款比期末付款平均早半期收到钱，现值更大。'],
                [`$${A(n)} < ${AD(n)} < \\bar a_{\\angl{${n}}}$`, false, '期初付款在每期一开始就付清，比“边过边付”更早。'],
              ], { hint: '钱越早到手，现值越大。' }),
              expr(`写出 $\\bar a_{\\angl{${n}}}$（用 $\\frac{i}{\\delta}\\,a_{\\angl{n}}$）：`, { target: (1 - (1 + i) ** -n) / Math.log(1 + i), model: `(i/delta)a(${n})`, unit: 'number' }),
            ],
          };
        },
      },
      {
        id: 'ann-cont-n',
        zh: '求期数 n',
        gen: r => {
          const i = pick(r, RATES), n0 = int(r, 6, 20), Pm = pick(r, [1000, 2000, 5000]);
          const X = Math.round((Pm * an(n0, i)) / 100) * 100;
          const vn = 1 - (i * X) / Pm;
          return {
            text: `今天有 ${money(X, 0)}，想每年末取 ${money(Pm, 0)}，年利率 ${pct(i)}。可以取多少年（允许非整数）？`,
            vars: { i },
            steps: [
              expr(`由 $${Pm}\\,a_{\\angl{n}} = ${X}$，先求 $v^n = 1 - i\\cdot ${X}/${Pm}$：`, { target: vn, model: `1 - i*${X}/${Pm}`, unit: 'number', hint: '$a_{\\angl{n}} = (1 - v^n)/i$，两边乘 i 再移项。' }),
              expr('两边取对数，n =', { target: -Math.log(vn) / Math.log(1 + i), model: `-ln(1 - i*${X}/${Pm})/ln(1+i)`, unit: 'number', hint: '$v^n = (1+i)^{-n}$，所以 $n = -\\ln(v^n)/\\ln(1+i)$。', why: `大约 ${n0} 年左右。` }),
            ],
          };
        },
      },
      {
        id: 'ann-cont-rate',
        zh: '夹逼求利率',
        gen: r => {
          const start = int(r, 0, 2);
          const cands = [0.03, 0.04, 0.05, 0.06, 0.07, 0.08].slice(start, start + 4);
          const truth = pick(r, cands), n = int(r, 8, 20), Pm = pick(r, [500, 1000, 2000]);
          const X = Math.round(Pm * an(n, truth));
          const tryR = pick(r, cands.filter(c => c !== truth));
          const val = Pm * an(n, tryR);
          const higher = val > X;
          return {
            text: `一份年金每年末付 ${money(Pm, 0)}，共 ${n} 年，售价 ${money(X, 0)}。它的年利率是多少？候选：${cands.map(pct).join('、')}。`,
            vars: {},
            steps: [
              expr(`先试 ${pct(tryR)}：写出这个利率下的价格 ${Pm}·a(${n}, ${tryR})：`, { target: val, model: `${Pm}a(${n}, ${tryR})`, hint: `输入 ${Pm}a(${n}, ${tryR})，让网页算。` }),
              choice(`试出来是 ${money(val)}，售价是 ${money(X, 0)}。真实利率应该：`, [
                [`比 ${pct(tryR)} 高`, higher, '试出来的价格比售价小：利率要更低，价格才会更高。'],
                [`比 ${pct(tryR)} 低`, !higher, '试出来的价格比售价大：利率要更高，价格才会降下来。'],
              ], { hint: '利率越高，a(n) 越小。' }),
              choice('最接近的利率是：', cands.map(c => [pct(c), c === truth, `在 ${pct(c)} 下价格是 ${money(Pm * an(n, c))}，离 ${money(X, 0)} 不够近。`]), { why: `在 ${pct(truth)} 下价格是 ${money(Pm * an(n, truth))}。` }),
            ],
          };
        },
      },
    ],
  },
];

export default {
  id: 'ann',
  no: 2,
  en: 'Annuities and Non-Contingent Cash Flows',
  zh: '年金',
  weight: '20–30%',
  blurb: '一串等间隔的付款怎么估值：a、s、ä、永续、递延、变额、连续，全靠两个锚点和一条时间轴。',
  lessons,
};
