import { pick, int, RATES, pct, money, round, choice, expr, place, tl, P, M, T, TERMS, TIP, TABLE, RECIPE, G } from './kit.js';

/* Topic 1 — Time value of money (SOA FM learning objectives 1a–1d). */

const lessons = [
  {
    id: 'tvm-grow',
    en: 'Interest and accumulation',
    zh: '钱会长大：单利与复利',
    outcome: '1a · 1b',
    learn: [
      P('今天的 100 元和一年以后的 100 元**不是同一笔钱**：今天的 100 元可以先存进去，一年后会变多。利息（interest）就是“借用这笔钱一段时间”付的租金。整门 FM 都在回答一个问题：**同一笔钱放在不同的时刻，各值多少？**'),
      TERMS([
        ['principal', '本金', '一开始投入的钱'],
        ['accumulation function $a(t)$', '积累函数', '时刻 0 的 1 元，到时刻 $t$ 长成多少；$a(0)=1$'],
        ['amount function $A(t)$', '金额函数', '本金 $K$ 到时刻 $t$ 长成多少：$A(t)=K\\,a(t)$'],
        ['effective rate of interest', '有效利率', '一段时间里赚到的利息 ÷ 期初的钱'],
      ]),
      P('两种“长大”的方式：'),
      M('\\text{simple 单利: } a(t) = 1 + i\\,t \\qquad \\text{compound 复利: } a(t) = (1+i)^t', '单利只给本金算利息；复利连上一期的利息也一起算利息（利滚利）。'),
      T(tl(3, [{ t: 0, amt: '100' }], { focal: 3, rate: 'i = 5%' }), '时刻 0 存 100，问时刻 3 值多少：复利就是 100 × 1.05 × 1.05 × 1.05。'),
      G({ n: 10, curves: [{ label: '复利', f: t => 100 * 1.1 ** t, tone: 'orange' }, { label: '单利', f: t => 100 * (1 + 0.1 * t), tone: 'ink' }] }, '同样是 100 元、i = 10%。拖动时间看两种增长：t < 1 时单利略高，过了 t = 1 复利一路甩开。'),
      TABLE(
        ['时间 t', '单利 1 + it', '复利 (1+i)^t', '谁大'],
        [
          ['t < 1', '更大', '更小', '单利'],
          ['t = 1', '1 + i', '1 + i', '一样'],
          ['t > 1', '更小', '更大', '复利'],
        ],
      ),
      TIP('题目没说，就默认复利。'),
      P('第 $n$ 期的有效利率 $i_n = \\dfrac{A(n)-A(n-1)}{A(n-1)}$。复利下每期都是 $i$；单利下利息每期一样多，但期初的钱越来越多，所以 $i_n = \\dfrac{i}{1+i(n-1)}$ 越来越小。'),
    ],
    example: r => {
      const i = 0.06;
      return {
        text: '你今天存入 1,000，年利率 6%，复利。到第 4 年末账户里有多少钱？',
        timeline: tl(4, [{ t: 0, amt: '1,000' }], { focal: 4, rate: 'i = 6%' }),
        vars: { i },
        steps: [
          choice('第一步：钱每过一年会怎样变？', [
            ['乘以 $(1+i) = 1.06$', true],
            ['加上 $1000 \\times 0.06 = 60$，每年都一样', false, '那是单利。复利下第二年的利息是在 1,060 上算的。'],
            ['乘以 $v = 1/1.06$', false, '乘 $v$ 是把钱往**过去**搬；这里是往未来搬。'],
          ], { hint: '复利 = 利滚利，每年整体放大同一个倍数。' }),
          expr('第二步：写出第 4 年末的金额（可以用 i）。', {
            target: 1000 * 1.06 ** 4,
            model: '1000(1+i)^4',
            hint: '1,000 往后搬 4 年，乘 4 次 $(1+i)$。',
            why: '$1000(1.06)^4 = 1262.48$。',
          }),
        ],
      };
    },
    drills: [
      {
        id: 'tvm-grow-fv',
        zh: '复利累积',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 2, 12), K = pick(r, [500, 800, 1000, 2000, 2500, 5000]);
          return {
            text: `今天投入 ${money(K, 0)}，年有效利率 ${pct(i)}（复利）。第 ${n} 年末值多少？`,
            timeline: tl(n, [{ t: 0, amt: money(K, 0) }], { focal: n, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [expr('写出第 ' + n + ' 年末的金额。', { target: K * (1 + i) ** n, model: `${K}(1+i)^${n}`, hint: `往后搬 ${n} 年，乘 $(1+i)^{${n}}$。` })],
          };
        },
      },
      {
        id: 'tvm-grow-simple',
        zh: '单利 vs 复利',
        gen: r => {
          const i = pick(r, [0.04, 0.05, 0.06, 0.08]), n = int(r, 2, 8), K = pick(r, [1000, 2000, 5000]);
          const s = K * (1 + i * n), c = K * (1 + i) ** n;
          return {
            text: `${money(K, 0)} 存 ${n} 年，年利率 ${pct(i)}。分别按单利和复利计算，最后差多少？`,
            vars: { i },
            steps: [
              expr('单利下第 ' + n + ' 年末的金额：', { target: s, model: `${K}(1+${n}i)`, hint: '单利：$K(1+it)$，利息每年都是 $K i$。' }),
              expr('复利下第 ' + n + ' 年末的金额：', { target: c, model: `${K}(1+i)^${n}` }),
              expr('复利比单利多多少？', { target: c - s, model: `${K}(1+i)^${n} - ${K}(1+${n}i)`, why: `t > 1 时复利更大：多出来的是“利息的利息”。` }),
            ],
          };
        },
      },
      {
        id: 'tvm-grow-in',
        zh: '单利下第 n 年的有效利率',
        gen: r => {
          const i = pick(r, [0.04, 0.05, 0.08, 0.1]), n = int(r, 2, 10);
          return {
            text: `单利，年利率 ${pct(i)}。第 ${n} 年的**有效利率** $i_{${n}}$ 是多少？`,
            vars: { i },
            steps: [
              choice('第 ' + n + ' 年里赚到的利息是多少（本金记作 1）？', [
                ['$i$，每年一样', true],
                [`$(1+i)^{${n}} - (1+i)^{${n - 1}}$`, false, '那是复利的情形。'],
                [`$${n}i$`, false, `那是 ${n} 年**累计**的利息。`],
              ]),
              expr(`第 ${n} 年初账户里有多少（本金 1）？`, { target: 1 + i * (n - 1), model: `1+${n - 1}i`, unit: 'number', hint: `已经过了 ${n - 1} 年。` }),
              expr(`所以 $i_{${n}}$ = 利息 ÷ 期初金额 =`, { target: i / (1 + i * (n - 1)), model: `i/(1+${n - 1}i)`, unit: 'rate', why: '单利下有效利率逐年下降。' }),
            ],
          };
        },
      },
      {
        id: 'tvm-grow-rate',
        zh: '由两笔金额反推利率',
        gen: r => {
          const i = pick(r, [0.03, 0.04, 0.05, 0.06, 0.07, 0.08]), n = int(r, 2, 10), K = pick(r, [1000, 2000, 4000]);
          const A = round(K * (1 + i) ** n, 2);
          return {
            text: `${money(K, 0)} 复利存 ${n} 年后变成 ${money(A)}。年有效利率是多少？`,
            timeline: tl(n, [{ t: 0, amt: money(K, 0) }, { t: n, amt: money(A) }], { rate: 'i = ?' }),
            vars: {},
            steps: [
              choice('先列方程：', [
                [`$${K}(1+i)^{${n}} = ${A}$`, true],
                [`$${K}(1+${n}i) = ${A}$`, false, '题目说的是复利。'],
                [`$${A}(1+i)^{${n}} = ${K}$`, false, '方向反了：小的钱往后长大。'],
              ]),
              expr('解出 i（写成式子即可，比如 (A/K)^(1/n) - 1）：', { target: (A / K) ** (1 / n) - 1, model: `(${A}/${K})^(1/${n}) - 1`, unit: 'rate', hint: `两边除以 ${K}，再开 ${n} 次方。` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'tvm-move',
    en: 'Present value and equations of value',
    zh: '把钱搬到同一时刻：现值与价值方程',
    outcome: '1a · 1d',
    learn: [
      P('想比较两笔钱，必须先把它们**搬到同一个时刻**。这个时刻叫比较日（comparison date / focal date）。'),
      M('\\text{往后搬 } k \\text{ 期：}\\times (1+i)^k \\qquad \\text{往前搬 } k \\text{ 期：}\\times v^k,\\quad v=\\frac{1}{1+i}', '$v$ 叫折现因子（discount factor）：一期以后的 1 元，今天值 $v$ 元。'),
      T(tl(5, [{ t: 1, amt: '200' }, { t: 4, amt: '300' }], { focal: 2, rate: 'i' }), '要问时刻 2 的价值：t=1 的 200 往后搬 1 期 → $200(1+i)$；t=4 的 300 往前搬 2 期 → $300v^2$。'),
      G({ n: 8, curves: [{ label: '那 1,000 的价值', f: t => 1000 * 1.06 ** (t - 5), tone: 'orange' }] }, '同一笔 t = 5 到账的 1,000（i = 6%），站在不同时刻看它值多少：越早看越少，t = 5 正好 1,000，之后接着长大。'),
      TERMS([
        ['present value (PV)', '现值', '搬到时刻 0 的价值'],
        ['accumulated / future value', '终值', '搬到最后时刻的价值'],
        ['current value at t', '时刻 t 的价值', '搬到任意时刻 t 的价值'],
        ['equation of value', '价值方程', '在同一时刻：流入的价值 = 流出的价值'],
        ['net present value (NPV)', '净现值', '流入现值 − 流出现值'],
      ]),
      RECIPE('做题三步', ['画时间轴，把每一笔钱写在它发生的时刻', '选一个比较日（哪个方便选哪个）', '每笔钱数一数离比较日几期，往后乘 $(1+i)^k$、往前乘 $v^k$，加起来']),
      TIP('复利下，比较日选哪天答案都一样：两边同乘一个 $(1+i)^k$ 而已。'),
    ],
    example: r => ({
      text: '利率 i = 5%。时刻 1 收到 200，时刻 4 收到 300。这两笔钱在**时刻 2** 一共值多少？',
      timeline: tl(5, [{ t: 1, amt: '200' }, { t: 4, amt: '300' }], { focal: 2, rate: 'i = 5%' }),
      vars: { i: 0.05 },
      steps: [
        choice('t = 1 的 200 搬到 t = 2，要乘什么？', [
          ['$(1+i)$', true],
          ['$v$', false, '200 在比较日之前，要往后（未来）搬，钱会变多。'],
          ['$(1+i)^2$', false, '只差 1 期。'],
        ]),
        choice('t = 4 的 300 搬到 t = 2，要乘什么？', [
          ['$v^2$', true],
          ['$(1+i)^2$', false, '300 在比较日之后，要往前搬，钱变少。'],
          ['$v^4$', false, '那是搬到 t = 0。'],
        ]),
        expr('合起来，时刻 2 的价值是：', { target: 200 * 1.05 + 300 / 1.05 ** 2, model: '200(1+i) + 300v^2', why: '$210 + 272.11 = 482.11$。' }),
      ],
    }),
    drills: [
      {
        id: 'tvm-move-pv',
        zh: '一笔钱的现值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 2, 15), X = pick(r, [1000, 2000, 5000, 10000]);
          return {
            text: `${n} 年后要收到 ${money(X, 0)}。利率 ${pct(i)}，它今天值多少？`,
            timeline: tl(n, [{ t: n, amt: money(X, 0) }], { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [expr('现值 =', { target: X / (1 + i) ** n, model: `${X}v^${n}`, hint: `往前搬 ${n} 期，乘 $v^{${n}}$。` })],
          };
        },
      },
      {
        id: 'tvm-move-at',
        zh: '几笔钱在某一刻值多少',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 8);
          const ts = [int(r, 0, 2), int(r, 3, n)];
          const f = [{ t: ts[0], amt: pick(r, [100, 200, 300, 500]) }, { t: ts[1], amt: pick(r, [400, 600, 800, 1000]) }];
          if (r() < 0.6) f.push({ t: Math.min(n, ts[1] + int(r, 1, 2)), amt: pick(r, [150, 250, 350]) });
          const flows = f.filter((x, k, a) => a.findIndex(y => y.t === x.t) === k);
          const at = int(r, 1, n - 1);
          const target = flows.reduce((s, x) => s + x.amt * (1 + i) ** (at - x.t), 0);
          const term = x => (x.t === at ? `${x.amt}` : x.t < at ? `${x.amt}(1+i)^${at - x.t}` : `${x.amt}v^${x.t - at}`);
          const first = flows[0];
          const d = at - first.t;
          return {
            text: `利率 ${pct(i)}。下面这几笔钱，在**时刻 ${at}** 一共值多少？`,
            timeline: tl(n, flows.map(x => ({ t: x.t, amt: String(x.amt) })), { focal: at, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(
                `t = ${first.t} 的 ${first.amt}，到 t = ${at} 要乘什么？`,
                d === 0
                  ? [['不用乘（就在比较日）', true], ['$(1+i)$', false, '它就发生在比较日。'], ['$v$', false, '它就发生在比较日。']]
                  : [
                      [`$(1+i)^{${d}}$`, true],
                      [`$v^{${d}}$`, false, '比较日在它之后，往未来搬，钱变多。'],
                      [`$(1+i)^{${d + 1}}$`, false, `数一数：从 t = ${first.t} 到 t = ${at} 是 ${d} 期。`],
                    ],
              ),
              expr(`时刻 ${at} 的总价值：`, { target, model: flows.map(term).join(' + '), hint: '每一笔：在比较日之前的乘 $(1+i)^k$，之后的乘 $v^k$。' }),
            ],
          };
        },
      },
      {
        id: 'tvm-move-eov',
        zh: '价值方程求未知付款',
        gen: r => {
          const i = pick(r, RATES), a = pick(r, [100, 200, 300]), b = pick(r, [1000, 1200, 1500]);
          const t1 = int(r, 2, 4), t2 = t1 + int(r, 1, 3);
          const X = (b / (1 + i) ** t2 - a) * (1 + i) ** t1;
          return {
            text: `利率 ${pct(i)}。“现在付 ${a}，第 ${t1} 年末再付 X” 和 “第 ${t2} 年末一次付 ${b}” 价值相等。求 X。`,
            timeline: tl(t2, [{ t: 0, amt: String(a) }, { t: t1, amt: 'X' }, { t: t2, amt: String(b), side: 'down' }], { rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('选比较日 0，价值方程是：', [
                [`$${a} + X v^{${t1}} = ${b} v^{${t2}}$`, true],
                [`$${a} + X = ${b}$`, false, '不同时刻的钱不能直接相加。'],
                [`$${a}(1+i)^{${t1}} + X = ${b}$`, false, `${b} 在第 ${t2} 年，也要搬过来。`],
              ]),
              expr('解出 X：', { target: X, model: `(${b}v^${t2} - ${a})(1+i)^${t1}`, hint: `先移项得 $Xv^{${t1}} = ${b}v^{${t2}} - ${a}$，再除以 $v^{${t1}}$（即乘 $(1+i)^{${t1}}$）。` }),
            ],
          };
        },
      },
      {
        id: 'tvm-move-place',
        zh: '把文字画成时间轴',
        gen: r => {
          const a = int(r, 1, 2), b = a + int(r, 2, 3), n = b + 1;
          return {
            text: `一份合同：第 ${a} 年末付 500，第 ${b} 年末付 800，第 ${n} 年末再付 300。`,
            vars: {},
            steps: [
              place('在时间轴上点出所有付款发生的时刻。', { n: n + 1, answer: [a, b, n], hint: '“第 k 年末” 就是时刻 k。' }),
              choice('“第 1 年初” 在时间轴上是哪一刻？', [
                ['t = 0', true],
                ['t = 1', false, '第 1 年**末**才是 t = 1。'],
              ]),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'tvm-nominal',
    en: 'Nominal rates convertible m-thly',
    zh: '名义利率 $i^{(m)}$：一年结几次息',
    outcome: '1a · 1c',
    learn: [
      P('银行常说“年利率 12%，按月复利”。这个 12% 是**名义利率**（nominal rate），记作 $i^{(12)} = 12\\%$。它的意思是：每个月给 $12\\%/12 = 1\\%$ 的利息。'),
      M('1 + i = \\left(1 + \\frac{i^{(m)}}{m}\\right)^{m}', '一年结 m 次，每次 $i^{(m)}/m$；一年下来真正长了多少，就是有效年利率 $i$。'),
      T(tl(4, [{ t: 0, amt: '1' }], { focal: 4, unit: 'quarter', rate: 'i⁽⁴⁾/4 per quarter' }), '按季复利：一年 4 段，每段乘 $(1 + i^{(4)}/4)$。'),
      G({ n: 3, jumps: 1 / 12, yMin: 950, curves: [{ label: '按月', f: t => 1000 * 1.01 ** Math.floor(12 * t + 1e-9), tone: 'orange' }, { label: '按季', f: t => 1000 * 1.03 ** Math.floor(4 * t + 1e-9), tone: 'ink' }, { label: '按年', f: t => 1000 * 1.12 ** Math.floor(t + 1e-9), tone: 'graph' }] }, '名义利率都是 12%，1,000 存 3 年：利息只在结息那一刻入账，所以余额是台阶。结得越勤，台阶越密，最后越高。'),
      TABLE(['名义 12%', '每期利率', '有效年利率 i'], [['按年 m = 1', '12%', '12%'], ['按季 m = 4', '3%', '12.551%'], ['按月 m = 12', '1%', '12.683%'], ['连续', '—', '12.750%']]),
      TIP('名义利率只是“报价”；算钱永远先换成每期利率。'),
      RECIPE('换算口诀', ['名义 → 每期：$j = i^{(m)}/m$', '每期 → 有效年：$1 + i = (1+j)^m$', '有效年 → 每期：$j = (1+i)^{1/m} - 1$，再乘 m 得名义']),
    ],
    example: r => ({
      text: '名义年利率 8%，按季度复利。有效年利率是多少？',
      vars: {},
      steps: [
        expr('每个季度的利率是：', { target: 0.02, model: '0.08/4', unit: 'rate' }),
        expr('一年 4 个季度，有效年利率 i =', { target: 1.02 ** 4 - 1, model: '(1+0.08/4)^4 - 1', unit: 'rate', why: '$1.02^4 - 1 = 8.243\\%$，比 8% 略大。' }),
      ],
    }),
    drills: [
      {
        id: 'tvm-nominal-eff',
        zh: '名义 → 有效',
        gen: r => {
          const m = pick(r, [2, 4, 12]), j = pick(r, [0.06, 0.08, 0.1, 0.12]);
          const name = { 2: '半年', 4: '季度', 12: '月' }[m];
          return {
            text: `名义年利率 ${pct(j)}，按${name}复利（$i^{(${m})} = ${pct(j)}$）。有效年利率是多少？`,
            vars: {},
            steps: [
              expr(`每${name}的利率：`, { target: j / m, model: `${j}/${m}`, unit: 'rate' }),
              expr('有效年利率 i =', { target: (1 + j / m) ** m - 1, model: `(1+${j}/${m})^${m} - 1`, unit: 'rate' }),
            ],
          };
        },
      },
      {
        id: 'tvm-nominal-back',
        zh: '有效 → 名义',
        gen: r => {
          const i = pick(r, [0.05, 0.06, 0.08, 0.1]), m = pick(r, [2, 4, 12]);
          return {
            text: `有效年利率 ${pct(i)}。等价的 $i^{(${m})}$ 是多少？`,
            vars: { i },
            steps: [
              expr('先求每期（1/' + m + ' 年）的有效利率：', { target: (1 + i) ** (1 / m) - 1, model: `(1+i)^(1/${m}) - 1`, unit: 'rate', hint: '一年长成 $1+i$，一期就是开 m 次方。' }),
              expr(`$i^{(${m})}$ = 每期利率 × ${m} =`, { target: m * ((1 + i) ** (1 / m) - 1), model: `${m}((1+i)^(1/${m}) - 1)`, unit: 'rate' }),
            ],
          };
        },
      },
      {
        id: 'tvm-nominal-compare',
        zh: '哪个报价更划算',
        gen: r => {
          const a = pick(r, [0.06, 0.08]), b = round(a + pick(r, [-0.002, 0.001, 0.002]), 4);
          const effA = (1 + a / 12) ** 12 - 1, effB = (1 + b / 2) ** 2 - 1;
          const better = effA > effB ? 'A' : 'B';
          return {
            text: `存款：A 银行 名义 ${pct(a)} 按月复利；B 银行 名义 ${pct(b)} 按半年复利。存钱选哪家？`,
            vars: {},
            steps: [
              expr('A 的有效年利率：', { target: effA, model: `(1+${a}/12)^12 - 1`, unit: 'rate' }),
              expr('B 的有效年利率：', { target: effB, model: `(1+${b}/2)^2 - 1`, unit: 'rate' }),
              choice('选哪家？', [['A', better === 'A'], ['B', better === 'B']], { why: '比较必须用**有效**利率。' }),
            ],
          };
        },
      },
      {
        id: 'tvm-nominal-fv',
        zh: '按月复利存几年',
        gen: r => {
          const j = pick(r, [0.06, 0.09, 0.12]), y = int(r, 2, 6), K = pick(r, [1000, 5000, 10000]);
          return {
            text: `${money(K, 0)} 存 ${y} 年，$i^{(12)} = ${pct(j)}$。到期多少钱？`,
            timeline: tl(y, [{ t: 0, amt: money(K, 0) }], { focal: y, rate: `i⁽¹²⁾ = ${pct(j)}` }),
            vars: {},
            steps: [
              choice('一共复利多少次？', [[`${12 * y} 次，每次 ${pct(j / 12)}`, true], [`${y} 次，每次 ${pct(j)}`, false, '名义利率不能直接当年利率用。']]),
              expr('到期金额：', { target: K * (1 + j / 12) ** (12 * y), model: `${K}(1+${j}/12)^${12 * y}` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'tvm-discount',
    en: 'Rates of discount',
    zh: '贴现率 $d$：利息提前收',
    outcome: '1a · 1c',
    learn: [
      P('利率 $i$ 是期末付利息；**贴现率** $d$（rate of discount）是期初就把利息扣掉。比如借 1,000、贴现率 4%：当场只拿到 960，到期还 1,000。'),
      M('d = \\frac{i}{1+i} = i\\,v \\qquad v = 1 - d \\qquad i = \\frac{d}{1-d}', '$d$ 就是“期末的利息 $i$ 折现到期初”。'),
      T(tl(1, [{ t: 0, amt: '960' }, { t: 1, amt: '1,000', side: 'down' }], { rate: 'd = 4%' }), '960 长成 1,000：利息 40。$d = 40/1000$（除以期末），$i = 40/960$（除以期初）。'),
      M('1 - d = \\left(1 - \\frac{d^{(m)}}{m}\\right)^{m} = v', '名义贴现率 $d^{(m)}$：每 1/m 年先扣 $d^{(m)}/m$。'),
      TIP('i 除以期初，d 除以期末。'),
      TERMS([['rate of discount d', '贴现率', '利息 ÷ 期末金额'], ['nominal rate of discount d⁽ᵐ⁾', '名义贴现率', '一年扣 m 次，每次 d⁽ᵐ⁾/m']]),
    ],
    example: r => ({
      text: '买一张 1 年后兑付 1,000 的票据，今天付 950。求 d 和 i。',
      timeline: tl(1, [{ t: 0, amt: '950', side: 'down' }, { t: 1, amt: '1,000' }], {}),
      vars: {},
      steps: [
        expr('利息是多少？', { target: 50, model: '1000 - 950' }),
        expr('d = 利息 ÷ 期末金额 =', { target: 0.05, model: '50/1000', unit: 'rate' }),
        expr('i = 利息 ÷ 期初金额 =', { target: 50 / 950, model: '50/950', unit: 'rate', why: '也可以用 $i = d/(1-d) = 0.05/0.95$。' }),
      ],
    }),
    drills: [
      {
        id: 'tvm-discount-i2d',
        zh: 'i ↔ d',
        gen: r => {
          const i = pick(r, RATES);
          const flip = r() < 0.5;
          const d = i / (1 + i);
          return flip
            ? { text: `贴现率 d = ${pct(round(d, 6))}。等价的利率 i 是多少？`, vars: {}, steps: [expr('i = d/(1−d) =', { target: round(d, 6) / (1 - round(d, 6)), model: `${round(d, 6)}/(1-${round(d, 6)})`, unit: 'rate' })] }
            : { text: `利率 i = ${pct(i)}。等价的贴现率 d 是多少？`, vars: { i }, steps: [expr('d = i/(1+i) =', { target: d, model: 'i/(1+i)', unit: 'rate', hint: '也可以写成 $iv$ 或 $1-v$。' })] };
        },
      },
      {
        id: 'tvm-discount-dm',
        zh: '名义贴现率 d⁽ᵐ⁾ → i',
        gen: r => {
          const m = pick(r, [2, 4, 12]), dm = pick(r, [0.04, 0.06, 0.08]);
          const vv = (1 - dm / m) ** m;
          return {
            text: `$d^{(${m})} = ${pct(dm)}$。求有效年利率 i。`,
            vars: {},
            steps: [
              expr('一年的折现因子 v =', { target: vv, model: `(1-${dm}/${m})^${m}`, unit: 'number' }),
              expr('i = 1/v − 1 =', { target: 1 / vv - 1, model: `(1-${dm}/${m})^-${m} - 1`, unit: 'rate' }),
            ],
          };
        },
      },
      {
        id: 'tvm-discount-pv',
        zh: '用 d 求现值',
        gen: r => {
          const d = pick(r, [0.04, 0.05, 0.06]), n = int(r, 2, 8), X = pick(r, [1000, 2000, 5000]);
          return {
            text: `年贴现率 d = ${pct(d)}。${n} 年后的 ${money(X, 0)} 今天值多少？`,
            timeline: tl(n, [{ t: n, amt: money(X, 0) }], { focal: 0, rate: `d = ${pct(d)}` }),
            vars: { d },
            steps: [
              choice('一年的折现因子 v 等于：', [['$1-d$', true], ['$1/(1+d)$', false, '这是把 d 当成 i 用了。'], ['$1+d$', false]]),
              expr('现值 =', { target: X * (1 - d) ** n, model: `${X}(1-d)^${n}` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'tvm-force',
    en: 'Force of interest',
    zh: '利息力 $\\delta$：每一瞬间的增长速度',
    outcome: '1a · 1b · 1c',
    learn: [
      P('把结息次数 m 一直加大，名义利率趋向一个极限，叫**利息力**（force of interest）$\\delta$。它是“此刻的瞬时增长率”。'),
      M('\\delta = \\ln(1+i) \\qquad a(t) = e^{\\delta t} \\qquad i = e^{\\delta} - 1', '利息力不变时，积累函数就是指数函数。'),
      G({ n: 8, curves: [{ label: 'δ = 0.05', f: t => Math.exp(0.05 * t), tone: 'ink' }, { label: 'δₜ = 0.01t', f: t => Math.exp(0.01 * t * t), tone: 'orange' }] }, '两种利息力下 1 元的增长：常数 δ 是平稳的指数曲线；δₜ = 0.01t 开始慢、后来越来越快，在 t = 5 两条线正好相交（积分都是 0.25）。'),
      M('a(t) = \\exp\\!\\left(\\int_0^t \\delta_s\\,ds\\right)', '利息力随时间变化：先把 $\\delta_s$ 从 0 积到 t，再取指数。'),
      TABLE(['$\\delta_t$', '$\\int_0^t \\delta_s ds$', 'a(t)'], [['常数 δ', 'δt', '$e^{\\delta t}$'], ['$\\frac{1}{1+t}$', 'ln(1+t)', '1 + t（就是单利！）'], ['$kt$', '$kt^2/2$', '$e^{kt^2/2}$']]),
      M('d < d^{(m)} < \\delta < i^{(m)} < i \\quad (m>1)', '同一个有效利率下的大小顺序：贴现率最小，利率最大，利息力在正中间。'),
      TIP('δ 夹在中间：比所有 d 大，比所有 i 小。'),
    ],
    example: r => ({
      text: '利息力 $\\delta_t = 0.02t$。时刻 0 存 100，时刻 5 值多少？',
      vars: {},
      steps: [
        expr('先积分：$\\int_0^5 0.02s\\,ds$ =', { target: 0.25, model: '0.02*5^2/2', unit: 'number', hint: '$\\int_0^t ks\\,ds = kt^2/2$。' }),
        expr('时刻 5 的金额 =', { target: 100 * Math.exp(0.25), model: '100 exp(0.25)', why: '$100e^{0.25} = 128.40$。' }),
      ],
    }),
    drills: [
      {
        id: 'tvm-force-conv',
        zh: 'i ↔ δ',
        gen: r => {
          const i = pick(r, RATES);
          return r() < 0.5
            ? { text: `i = ${pct(i)}，求 δ。`, vars: { i }, steps: [expr('δ =', { target: Math.log(1 + i), model: 'ln(1+i)', unit: 'rate' })] }
            : { text: `δ = ${pct(i)}，求有效年利率 i。`, vars: {}, steps: [expr('i =', { target: Math.exp(i) - 1, model: `exp(${i}) - 1`, unit: 'rate' })] };
        },
      },
      {
        id: 'tvm-force-var',
        zh: '变化的利息力',
        gen: r => {
          const k = pick(r, [0.01, 0.02, 0.04]), t = int(r, 2, 6), K = pick(r, [100, 1000]);
          return {
            text: `$\\delta_t = ${k}t$。时刻 0 的 ${K}，到时刻 ${t} 值多少？`,
            vars: {},
            steps: [
              expr(`$\\int_0^{${t}} ${k}s\\,ds$ =`, { target: (k * t * t) / 2, model: `${k}*${t}^2/2`, unit: 'number' }),
              expr('金额 =', { target: K * Math.exp((k * t * t) / 2), model: `${K} exp(${k}*${t}^2/2)` }),
            ],
          };
        },
      },
      {
        id: 'tvm-force-order',
        zh: 'd、δ、i 的大小顺序',
        gen: r => {
          const i = pick(r, [0.05, 0.08, 0.1]);
          return {
            text: `有效年利率 ${pct(i)}。下面四个量按从小到大排，哪一个排法对？`,
            vars: { i },
            steps: [
              choice('从小到大：', [
                ['$d < d^{(12)} < \\delta < i^{(12)} < i$', true],
                ['$\\delta < d < i < i^{(12)}$', false, '$i^{(12)} < i$：一年结 12 次，报价可以低一点就达到同样的有效利率。'],
                ['$d^{(12)} < d < \\delta < i < i^{(12)}$', false],
              ], { hint: 'δ 是 m → ∞ 的共同极限，i⁽ᵐ⁾ 从上面、d⁽ᵐ⁾ 从下面靠近它。' }),
              expr('验证一下：δ 的值', { target: Math.log(1 + i), model: 'ln(1+i)', unit: 'rate' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'tvm-solve',
    en: 'Inflation, real rates and solving for time',
    zh: '通胀、实际利率与求时间',
    outcome: '1a · 1b',
    learn: [
      P('名义上赚了 6%，但物价涨了 2%，你真正多买到的东西只多了大约 4%。准确地说：'),
      M('1 + r = \\frac{1+i}{1+f} \\quad\\Longrightarrow\\quad r = \\frac{i - f}{1+f}', '$i$：利率；$f$：通胀率（inflation）；$r$：实际利率（real rate）。'),
      P('已知利率、现值和终值，求时间：'),
      M('K(1+i)^n = A \\;\\Longrightarrow\\; n = \\frac{\\ln(A/K)}{\\ln(1+i)}'),
      TIP('72 法则：翻倍大约要 72 ÷ (利率×100) 年。'),
      P('72 法则是心算估计：$\\ln 2 \\approx 0.693$，而 $\\ln(1+i) \\approx i$，所以翻倍时间约 $0.69/i$；用 72 是因为它好除，并且在 8% 附近更准。'),
    ],
    example: r => ({
      text: '利率 6%，通胀 2%。实际利率是多少？',
      vars: {},
      steps: [
        choice('哪个式子对？', [['$(1.06/1.02) - 1$', true], ['$0.06 - 0.02$', false, '这是近似值，考试要精确值。'], ['$1.06 \\times 1.02 - 1$', false]]),
        expr('r =', { target: 1.06 / 1.02 - 1, model: '1.06/1.02 - 1', unit: 'rate', why: '3.92%，比 4% 略小。' }),
      ],
    }),
    drills: [
      {
        id: 'tvm-solve-real',
        zh: '实际利率',
        gen: r => {
          const i = pick(r, [0.05, 0.06, 0.08, 0.1]), f = pick(r, [0.02, 0.03, 0.04]);
          return { text: `利率 ${pct(i)}，通胀率 ${pct(f)}。实际利率 r？`, vars: {}, steps: [expr('r =', { target: (1 + i) / (1 + f) - 1, model: `(1+${i})/(1+${f}) - 1`, unit: 'rate' })] };
        },
      },
      {
        id: 'tvm-solve-n',
        zh: '多久能长到目标',
        gen: r => {
          const i = pick(r, RATES), mult = pick(r, [2, 3, 1.5]), K = 1000;
          return {
            text: `利率 ${pct(i)}。${money(K, 0)} 要多少年才能变成 ${money(K * mult, 0)}？`,
            vars: { i },
            steps: [
              choice('先估一下（72 法则 / 心算）：', [
                [`大约 ${mult === 2 ? Math.round(72 / (i * 100)) : mult === 3 ? Math.round(110 / (i * 100)) : Math.round(41 / (i * 100))} 年`, true],
                [`大约 ${Math.round((mult - 1) / i)} 年`, false, '这是单利的算法，复利更快。'],
                [`大约 ${Math.round((2 * (mult - 1)) / i)} 年`, false],
              ], { hint: '翻倍 ≈ 72/(100i) 年；翻三倍 ≈ 110/(100i)；1.5 倍 ≈ 41/(100i)。' }),
              expr('精确地，n =', { target: Math.log(mult) / Math.log(1 + i), model: `ln(${mult})/ln(1+i)`, unit: 'number' }),
            ],
          };
        },
      },
    ],
  },
];

export default {
  id: 'tvm',
  no: 1,
  en: 'Time Value of Money',
  zh: '货币的时间价值',
  weight: '5–15%',
  blurb: '利率、折现、名义利率、贴现率、利息力：整门课的地基。',
  lessons,
};
