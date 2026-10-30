import { pick, int, RATES, pct, money, round, choice, expr, place, tl, flowsEvery, an, sn, P, M, T, TERMS, TIP, TABLE, RECIPE } from './kit.js';

/* Topic 3 — Loans (SOA FM learning objectives 3a, 3b). */

/* A k with 1 ≤ k ≤ n−1 such that k, n−k and n−k+1 are three different numbers
   (so options built from them never coincide). */
const pickK = (r, n, lo = 1, hi = n - 1) => {
  const ok = [];
  for (let k = lo; k <= hi; k++) if (2 * k !== n && 2 * k !== n + 1) ok.push(k);
  return pick(r, ok);
};

/* Loans paid by a fixed round payment that do not come out even: L = P·f, with the exact
   term x = −ln(1 − f i)/ln(1+i) safely away from a whole number. */
const UNEVEN = [];
for (const i of RATES) {
  for (let f = 3; f <= 12; f += 0.5) {
    if (f * i >= 0.9) continue;
    const x = -Math.log(1 - f * i) / Math.log(1 + i);
    const frac = x - Math.floor(x);
    if (x < 24 && frac > 0.15 && frac < 0.85) UNEVEN.push({ i, f, x, m: Math.floor(x) });
  }
}

const lessons = [
  {
    id: 'loan-amort',
    en: 'Amortized loans and the schedule',
    zh: '分期摊还：每期还款 = 利息 + 本金',
    outcome: '3a · 3b',
    learn: [
      P('贷款（loan）就是“今天拿到一笔钱 L，以后分期还”。最常见的还法叫**分期摊还**（amortization）：每期期末还一样多的 P，最后一次还完时欠款正好变成 0。整课只靠一句话：**贷款额 = 全部还款按贷款利率折回时刻 0 的现值。**'),
      TERMS([
        ['loan amount $L$', '贷款额（本金）', '时刻 0 借到的钱'],
        ['level payment $P$', '等额还款', '每期期末还的固定金额'],
        ['outstanding balance $B_k$', '未偿余额', '第 k 次还款刚付完后还欠多少'],
        ['interest portion $I_k$', '利息部分', '第 k 次还款里拿去付利息的钱'],
        ['principal portion $PR_k$', '本金部分', '第 k 次还款里真正让欠款变少的钱'],
        ['amortization schedule', '摊还表', '一行一期：还款、利息、本金、余额'],
      ]),
      M('L = P\\,a_{\\angl{n}} \\quad\\Longrightarrow\\quad P = \\frac{L}{a_{\\angl{n}}}', '借到的钱 = n 次还款的现值。所以每次还款 = 贷款额 ÷ 年金现值因子 $a_{\\angl{n}}$。'),
      T(tl(5, [{ t: 0, amt: 'L' }, ...flowsEvery(1, 5, 'P').map(f => ({ ...f, side: 'down' }))], { focal: 0, rate: 'i' }), '时刻 0 你拿到 L（上面），之后每年末还 P（下面）。站在时刻 0：L = 5 次 P 的现值 = $P\\,a_{\\angl{5}}$。'),
      M('I_k = i\\,B_{k-1} \\qquad PR_k = P - I_k \\qquad B_k = B_{k-1} - PR_k', '每次还款先付“这一期的利息”（上期末余额 × i），剩下的才拿去还本金。'),
      RECIPE('造摊还表的一行', ['利息 = $i$ × 上一行的余额', '本金 = $P$ − 利息', '新余额 = 旧余额 − 本金', '下一行重复；最后一行的余额应当是 0']),
      TABLE(
        ['k', '还款', '利息 $I_k$', '本金 $PR_k$', '余额 $B_k$'],
        [
          ['0', '—', '—', '—', '$L$'],
          ['1', '$P$', '$iL$', '$P - iL$', '$L - PR_1$'],
          ['2', '$P$', '$iB_1$', '$P - iB_1$', '$B_1 - PR_2$'],
          ['…', '…', '…', '…', '…'],
          ['n', '$P$', '$iB_{n-1}$', '$B_{n-1}$', '0'],
        ],
      ),
      P('为什么本金部分越来越大？余额在变小，所以利息 $iB_{k-1}$ 越来越少；而 $P$ 不变，剩给本金的就越来越多。事实上 $PR_{k+1} = PR_k(1+i)$，下一课会证明。'),
      TIP('总利息 = 还的总额 − 借的钱 = nP − L。'),
    ],
    example: r => {
      const i = 0.06, L = 10000, n = 5;
      const Pm = L / an(n, i), I1 = L * i, PR1 = Pm - I1;
      return {
        text: '借 10,000，年利率 6%，分 5 年每年末等额还清。求每年还款，并造出摊还表的第一行。',
        timeline: tl(5, [{ t: 0, amt: '10,000' }, ...flowsEvery(1, 5, 'P').map(f => ({ ...f, side: 'down' }))], { focal: 0, rate: 'i = 6%' }),
        vars: { i },
        steps: [
          choice('第一步：P 和 10,000 是什么关系？', [
            ['$10000 = P\\,a_{\\angl{5}}$', true],
            ['$10000 = 5P$', false, '不同时刻的钱不能直接相加：要先折回时刻 0。'],
            ['$10000 = P\\,s_{\\angl{5}}$', false, '$P s_{\\angl{5}}$ 是还款在第 5 年末的终值；10,000 在时刻 0，要和现值比。'],
          ], { hint: '在时刻 0 写价值方程。' }),
          expr('第二步：每年还款 P =', { target: Pm, model: '10000/a(5)', hint: '两边除以 $a_{\\angl{5}}$。', why: `$P = ${money(Pm)}$。` }),
          expr('第三步：第 1 年的利息部分 $I_1$ =', { target: I1, model: '10000i', hint: '利息 = i × 上期末余额，而上期末（时刻 0）余额是 10,000。', why: '$0.06 \\times 10000 = 600$。' }),
          expr('第四步：第 1 年的本金部分 $PR_1$ =（可以接着写 10000/a(5)）', { target: PR1, model: '10000/a(5) - 10000i', why: `$${money(Pm)} - 600 = ${money(PR1)}$。` }),
          expr('第五步：第 1 次还款后的余额 $B_1$ =', { target: L - PR1, model: '10000 - (10000/a(5) - 10000i)', hint: '旧余额 − 本金部分。', why: `$B_1 = ${money(L - PR1)}$。也可以写成 $10000(1+i) - P$：先长一年利息，再减去还款。` }),
        ],
      };
    },
    drills: [
      {
        id: 'loan-amort-pay',
        zh: '由贷款额求每期还款',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 20), L = pick(r, [5000, 10000, 20000, 25000, 50000]);
          return {
            text: `借 ${money(L, 0)}，年利率 ${pct(i)}，${n} 年内每年末等额还清。每年还多少？`,
            timeline: tl(n, [{ t: 0, amt: money(L, 0) }, ...flowsEvery(1, n, 'P').map(f => ({ ...f, side: 'down' }))], { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('先选关系式：', [
                [`$P = ${L}/a_{\\angl{${n}}}$`, true],
                [`$P = ${L}/${n}$`, false, '这样完全没付利息：只是把本金平均分了。'],
                [`$P = ${L}/s_{\\angl{${n}}}$`, false, '$s$ 是把还款累积到第 n 年；贷款 L 在时刻 0，要用现值 $a$。'],
              ], { hint: '贷款额 = 所有还款的现值。' }),
              expr('每年还款 P =', { target: L / an(n, i), model: `${L}/a(${n})` }),
            ],
          };
        },
      },
      {
        id: 'loan-amort-rows',
        zh: '摊还表的前两行',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 4, 10), L = pick(r, [2000, 5000, 8000, 10000, 20000]);
          const Pm = L / an(n, i);
          const I1 = i * L, PR1 = Pm - I1, B1 = L - PR1, I2 = i * B1, PR2 = Pm - I2;
          return {
            text: `借 ${money(L, 0)}，年利率 ${pct(i)}，${n} 年每年末等额还款 P（P = ${money(Pm)}；式子里直接写 **P** 即可）。造出摊还表的前两行。`,
            timeline: tl(n, [{ t: 0, amt: money(L, 0) }, ...flowsEvery(1, n, 'P').map(f => ({ ...f, side: 'down' }))], { focal: 1, rate: `i = ${pct(i)}` }),
            vars: { i, P: Pm },
            steps: [
              expr('第 1 期利息 $I_1$ =', { target: I1, model: `${L}i`, hint: '利息 = i × 上期末余额；时刻 0 的余额就是贷款额。' }),
              expr('第 1 期本金 $PR_1$ =', { target: PR1, model: `P - ${L}i` }),
              expr('第 1 次还款后的余额 $B_1$ =', { target: B1, model: `${L} - (P - ${L}i)`, hint: '旧余额 − 本金部分。等价写法：$L(1+i) - P$。' }),
              expr('第 2 期利息 $I_2$ =', { target: I2, model: `i(${L}(1+i) - P)`, hint: '利息永远按**上一行**的余额 $B_1$ 算。' }),
              choice('第 2 期本金 $PR_2$ 和 $PR_1$ 有什么关系？', [
                ['$PR_2 = PR_1(1+i)$', true],
                ['$PR_2 = PR_1$', false, '余额变小 → 利息变少 → 本金部分变大，不会一样。'],
                ['$PR_2 = PR_1\\,v$', false, '方向反了：本金部分是越来越**大**的。'],
              ], { why: `$PR_2 = P - iB_1 = P - i(L - PR_1) = PR_1 + i\\,PR_1$，因为 $P - iL = PR_1$。` }),
              expr('第 2 期本金 $PR_2$ =', { target: PR2, model: `P - i(${L}(1+i) - P)`, why: `$PR_2 = ${money(PR2)}$，确实等于 $${money(PR1)} \\times ${1 + i}$。` }),
            ],
          };
        },
      },
      {
        id: 'loan-amort-total',
        zh: '一共付了多少利息',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 25), L = pick(r, [5000, 10000, 30000, 50000, 100000]);
          return {
            text: `借 ${money(L, 0)}，年利率 ${pct(i)}，${n} 年每年末等额还清。整个贷款期一共付了多少利息？`,
            vars: { i },
            steps: [
              choice('总利息等于：', [
                [`$${n}P - ${L}$`, true],
                [`$${n}P$`, false, '这是还款总额，里面还包括还回去的本金 L。'],
                [`$${n} \\times ${L}\\,i$`, false, '只有余额一直是 L 时才这样；余额是在一路变小的。'],
              ], { hint: '每次还款 = 利息 + 本金，而所有本金部分加起来正好是 L。' }),
              expr('总利息 =（P 用 L/a(n) 表示）', { target: (n * L) / an(n, i) - L, model: `${n}*${L}/a(${n}) - ${L}` }),
            ],
          };
        },
      },
      {
        id: 'loan-amort-amount',
        zh: '由还款额反推能借多少',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 25), Pm = pick(r, [500, 800, 1000, 1500, 2000, 2500]);
          return {
            text: `你每年末最多能还 ${money(Pm, 0)}，连还 ${n} 年。贷款利率 ${pct(i)}，今天最多能借多少？`,
            timeline: tl(n, flowsEvery(1, n, money(Pm, 0)), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('能借的钱 = ', [
                [`$${Pm}\\,a_{\\angl{${n}}}$`, true],
                [`$${n} \\times ${Pm}$`, false, '没有折现：未来的钱今天不值那么多。'],
                [`$${Pm}\\,s_{\\angl{${n}}}$`, false, '那是第 n 年末的价值。'],
              ]),
              expr('最多借 L =', { target: Pm * an(n, i), model: `${Pm}a(${n})` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'loan-balance',
    en: 'Outstanding balance: prospective and retrospective',
    zh: '还欠多少：往前看与往后看',
    outcome: '3a',
    learn: [
      P('还了 k 期以后，还欠银行多少？这叫**未偿余额**（outstanding balance / loan balance），默认指“第 k 次还款**刚付完**”的那一刻。有两种看法，结果一定相同。'),
      M('B_k = P\\,a_{\\angl{n-k}}', '**往前看**（prospective）：还剩 n − k 次还款没付，把它们折到时刻 k。“欠的 = 以后还要付的钱的现值”。'),
      M('B_k = L(1+i)^k - P\\,s_{\\angl{k}}', '**往后看**（retrospective）：借的钱长到时刻 k，减去已付的 k 次还款长到时刻 k。“欠的 = 借的连本带利 − 已经还的连本带利”。'),
      T(tl(8, flowsEvery(1, 8, 'P'), { focal: 3, rate: 'i' }), '站在 t = 3（第 3 次还款刚付完）：右边 5 次未付的 P 折回来 → $P\\,a_{\\angl{5}}$；左边是已经发生的过去 → retrospective。'),
      P('为什么相等？时刻 0 有 $L = P\\,a_{\\angl{n}}$。把这个等式搬到时刻 k，再把还款分成“已付的 k 次”和“未付的 n − k 次”：$L(1+i)^k = P\\,s_{\\angl{k}} + P\\,a_{\\angl{n-k}}$。移项，两条公式就是同一件事。'),
      TABLE(
        ['方法', '公式', '什么时候好用'],
        [
          ['prospective', '$P\\,a_{\\angl{n-k}}$', '还款都一样、知道还剩几次'],
          ['retrospective', '$L(1+i)^k - P\\,s_{\\angl{k}}$', '不知道总期数，或者后面的还款不规则（比如最后一笔是零头）'],
        ],
      ),
      TIP('“刚付完第 k 次” → 还剩 n − k 次。“第 k 次付之前” → 还要再加上这一笔 P。'),
    ],
    example: r => {
      const i = 0.05, L = 10000, n = 10, k = 4;
      const Pm = L / an(n, i);
      return {
        text: `借 10,000，年利率 5%，10 年每年末等额还款 P（P = ${money(Pm)}，式子里写 P）。第 4 次还款刚付完时还欠多少？`,
        timeline: tl(10, flowsEvery(1, 10, 'P'), { focal: 4, rate: 'i = 5%' }),
        vars: { i, P: Pm },
        steps: [
          choice('第 4 次付完后，还剩几次还款？', [
            ['6 次', true],
            ['7 次', false, '第 4 次已经付了，不算在内。'],
            ['4 次', false, '4 次是已经付掉的。'],
          ]),
          expr('prospective：余额 =', { target: Pm * an(6, i), model: 'P a(6)', hint: '剩下 6 次 P 折到时刻 4。' }),
          expr('retrospective：余额 =', { target: L * (1 + i) ** 4 - Pm * sn(4, i), model: '10000(1+i)^4 - P s(4)', hint: '借的长 4 年，减去已付 4 次的终值。' }),
          choice('两个结果比较：', [
            ['完全相同', true],
            ['prospective 大一点', false, '两者是同一个价值方程移项得到的，必然相等。'],
            ['retrospective 大一点', false, '两者是同一个价值方程移项得到的，必然相等。'],
          ], { why: `都等于 ${money(Pm * an(6, i))}。` }),
        ],
      };
    },
    drills: [
      {
        id: 'loan-balance-pro',
        zh: 'prospective：剩余还款的现值',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 8, 20), Pm = pick(r, [500, 800, 1000, 1200, 2000]);
          const k = pickK(r, n, 2, n - 2);
          return {
            text: `一笔贷款每年末还 ${money(Pm, 0)}，共 ${n} 次，利率 ${pct(i)}。第 ${k} 次还款刚付完时，余额是多少？`,
            timeline: tl(n, flowsEvery(1, n, money(Pm, 0)), { focal: k, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('余额 = ', [
                [`$${Pm}\\,a_{\\angl{${n - k}}}$`, true],
                [`$${Pm}\\,a_{\\angl{${n - k + 1}}}$`, false, `那是第 ${k} 次还款**付之前**的余额（多算了这一笔）。`],
                [`$${Pm}\\,a_{\\angl{${k}}}$`, false, `${k} 是已经付掉的次数；余额看的是还没付的。`],
              ], { hint: `数一数时刻 ${k} 右边还有几个箭头。` }),
              expr(`B_${k} =`, { target: Pm * an(n - k, i), model: `${Pm}a(${n - k})` }),
            ],
          };
        },
      },
      {
        id: 'loan-balance-retro',
        zh: 'retrospective：借的 − 已还的',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 6, 20), L = pick(r, [5000, 10000, 20000, 40000]);
          const k = int(r, 2, n - 2);
          const Pm = L / an(n, i);
          return {
            text: `借 ${money(L, 0)}，利率 ${pct(i)}，${n} 年每年末等额还款 P（P = ${money(Pm)}，式子里写 P）。用 retrospective 方法求第 ${k} 次还款后的余额。`,
            timeline: tl(n, [{ t: 0, amt: money(L, 0) }, ...flowsEvery(1, n, 'P').map(f => ({ ...f, side: 'down' }))], { focal: k, rate: `i = ${pct(i)}` }),
            vars: { i, P: Pm },
            steps: [
              choice('retrospective 的结构是：', [
                [`$${L}(1+i)^{${k}} - P\\,s_{\\angl{${k}}}$`, true],
                [`$${L} - ${k}P$`, false, '没有利息：钱在不同时刻不能直接相减。'],
                [`$${L}(1+i)^{${k}} - P\\,a_{\\angl{${k}}}$`, false, '$a$ 是折到时刻 0；已付的还款要**累积**到时刻 k，用 $s$。'],
              ]),
              expr(`B_${k} =`, { target: L * (1 + i) ** k - Pm * sn(k, i), model: `${L}(1+i)^${k} - P s(${k})` }),
            ],
          };
        },
      },
      {
        id: 'loan-balance-both',
        zh: '两种方法算同一个余额',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 8, 15), L = pick(r, [3000, 6000, 12000, 15000]);
          const k = int(r, 2, n - 2);
          const Pm = L / an(n, i);
          const Bp = Pm * an(n - k, i);
          return {
            text: `借 ${money(L, 0)}，利率 ${pct(i)}，${n} 年每年末等额还款 P（式子里写 P）。第 ${k} 次还款后，余额是多少？两种方法都做一遍。`,
            timeline: tl(n, flowsEvery(1, n, 'P'), { focal: k, rate: `i = ${pct(i)}` }),
            vars: { i, P: Pm },
            steps: [
              expr('prospective：', { target: Bp, model: `P a(${n - k})`, hint: `还剩 ${n - k} 次。` }),
              expr('retrospective：', { target: L * (1 + i) ** k - Pm * sn(k, i), model: `${L}(1+i)^${k} - P s(${k})` }),
              choice('为什么两者相等？', [
                [`因为 $${L}(1+i)^{${k}} = P\\,s_{\\angl{${k}}} + P\\,a_{\\angl{${n - k}}}$`, true],
                ['只是这道题的数字凑巧', false, '任何等额贷款都成立：它是 $L = P a_{\\angl{n}}$ 搬到时刻 k 的结果。'],
                ['因为利率很小，误差可以忽略', false, '两者是**精确**相等，跟利率大小无关。'],
              ], { why: `都等于 ${money(Bp)}。` }),
            ],
          };
        },
      },
      {
        id: 'loan-balance-place',
        zh: '在时间轴上找出还没付的还款',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 5, 9), Pm = pick(r, [400, 600, 1000, 1500]);
          const k = int(r, 2, n - 2);
          const rest = [];
          for (let t = k + 1; t <= n; t++) rest.push(t);
          return {
            text: `贷款每年末还 ${money(Pm, 0)}，共 ${n} 次，利率 ${pct(i)}。现在第 ${k} 次还款刚刚付完。`,
            vars: { i },
            steps: [
              place('在时间轴上点出所有**还没付**的还款。', { n: n + 1, answer: rest, hint: `第 ${k} 次（t = ${k}）已经付了；从下一年开始数。` }),
              choice('余额是在哪一刻的价值？', [
                [`t = ${k}`, true],
                ['t = 0', false, '那是原来的贷款额。'],
                [`t = ${n}`, false, '到期时余额是 0。'],
              ]),
              expr('余额 =', { target: Pm * an(n - k, i), model: `${Pm}a(${n - k})`, why: `剩下 ${n - k} 次，折到时刻 ${k}。` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'loan-split',
    en: 'Interest and principal in the k-th payment',
    zh: '第 k 次还款里，多少是本金？',
    outcome: '3a',
    learn: [
      P('想知道第 k 次还款里本金、利息各多少，不必一行一行造表。有一条捷径，而且只用到上一课的余额公式。'),
      P('第 k 次的利息 $I_k = i\\,B_{k-1}$。第 k − 1 次付完时还剩 $n-k+1$ 次，所以 $B_{k-1} = P\\,a_{\\angl{n-k+1}}$。又因为 $i\\,a_{\\angl{m}} = 1 - v^m$，得到：'),
      M('I_k = P\\left(1 - v^{\\,n-k+1}\\right) \\qquad PR_k = P\\,v^{\\,n-k+1}', '第 k 次还款里的本金 = 这笔还款折现 $n-k+1$ 期。离最后一次越近，指数越小，本金占比越大。'),
      T(tl(6, flowsEvery(1, 6, 'P'), { focal: 0, rate: 'i' }), '最后一次（t = 6）的本金部分是 $Pv$，倒数第二次是 $Pv^2$……第一次是 $Pv^6$。'),
      M('PR_{k+1} = PR_k\\,(1+i) \\qquad PR_m = PR_j\\,(1+i)^{m-j}', '本金部分每期乘 $(1+i)$：知道其中一期，就知道所有期。'),
      TABLE(
        ['k', '本金 $PR_k$', '利息 $I_k$'],
        [
          ['1', '$Pv^{n}$', '$P(1-v^{n})$'],
          ['2', '$Pv^{n-1}$', '$P(1-v^{n-1})$'],
          ['…', '…', '…'],
          ['n', '$Pv$', '$P(1-v)$'],
        ],
      ),
      TIP('指数 n − k + 1 = “从第 k 次到最后一次一共几次”。第 1 次 → n，最后一次 → 1。'),
      P('检验：所有本金部分加起来 $= P(v + v^2 + \\dots + v^n) = P\\,a_{\\angl{n}} = L$，还掉的本金正好是借的钱。'),
    ],
    example: r => {
      const i = 0.05;
      return {
        text: '贷款每年末还 1,000，共 10 次，利率 5%。第 4 次还款里，本金和利息各多少？',
        timeline: tl(10, flowsEvery(1, 10, '1,000'), { focal: 3, rate: 'i = 5%' }),
        vars: { i },
        steps: [
          choice('第 4 次的本金部分是 $1000v^{?}$，指数是：', [
            ['7 = 10 − 4 + 1', true],
            ['6 = 10 − 4', false, '从第 4 次数到第 10 次（含两端）是 7 次。'],
            ['4', false, '这是从开头数；本金部分要从**最后**往回数。'],
          ]),
          expr('本金部分 $PR_4$ =', { target: 1000 / 1.05 ** 7, model: '1000v^7' }),
          expr('利息部分 $I_4$ =', { target: 1000 * (1 - 1 / 1.05 ** 7), model: '1000(1-v^7)', why: '本金 710.68，利息 289.32，加起来正好 1,000。' }),
        ],
      };
    },
    drills: [
      {
        id: 'loan-split-k',
        zh: '第 k 次还款的本金与利息',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 6, 20), Pm = pick(r, [500, 1000, 1500, 2000, 3000]);
          const k = pickK(r, n);
          const e = n - k + 1;
          return {
            text: `贷款每年末还 ${money(Pm, 0)}，共 ${n} 次，利率 ${pct(i)}。第 ${k} 次还款里本金、利息各多少？`,
            timeline: tl(n, flowsEvery(1, n, money(Pm, 0)), { focal: k - 1, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice(`本金部分 $PR_{${k}}$ =`, [
                [`$${Pm}v^{${e}}$`, true],
                [`$${Pm}v^{${n - k}}$`, false, `少数了一次：从第 ${k} 次到第 ${n} 次（含两端）共有 ${e} 次。`],
                [`$${Pm}v^{${k}}$`, false, '这是从开头数；本金部分的指数要从最后一次往回数。'],
              ], { hint: '最后一次还款的本金是 $Pv$；每往前一期多一个 $v$。' }),
              expr(`本金部分 $PR_{${k}}$ =`, { target: Pm / (1 + i) ** e, model: `${Pm}v^${e}` }),
              expr(`利息部分 $I_{${k}}$ =`, { target: Pm * (1 - 1 / (1 + i) ** e), model: `${Pm}(1-v^${e})`, why: '本金 + 利息 = 整笔还款。' }),
            ],
          };
        },
      },
      {
        id: 'loan-split-jm',
        zh: '由一期的本金推另一期',
        gen: r => {
          const i = pick(r, RATES), X = pick(r, [200, 300, 400, 500, 800]);
          const j = int(r, 2, 12);
          let m = int(r, 1, 15);
          if (m === j) m = j + int(r, 1, 3);
          const d = Math.abs(m - j);
          const target = X * (1 + i) ** (m - j);
          return {
            text: `一笔等额分期贷款，利率 ${pct(i)}。第 ${j} 次还款里的本金部分是 ${money(X, 0)}。第 ${m} 次还款里的本金部分是多少？`,
            vars: { i },
            steps: [
              choice(`从第 ${j} 次到第 ${m} 次，本金部分要乘：`, [
                [m > j ? `$(1+i)^{${d}}$` : `$v^{${d}}$`, true],
                [m > j ? `$v^{${d}}$` : `$(1+i)^{${d}}$`, false, '本金部分越往后越**大**：往后乘 $(1+i)$，往前乘 $v$。'],
                ['不变，还是一样多', false, '利息部分越来越少，本金部分就越来越多。'],
              ], { hint: '$PR_{k+1} = PR_k(1+i)$。' }),
              expr(`$PR_{${m}}$ =`, { target, model: m > j ? `${X}(1+i)^${d}` : `${X}v^${d}` }),
            ],
          };
        },
      },
      {
        id: 'loan-split-balance',
        zh: '利息 = i × 上期余额（两条路）',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 6, 20), Pm = pick(r, [600, 1000, 1200, 2500]);
          const k = int(r, 2, n);
          const e = n - k + 1;
          const Ik = i * Pm * an(e, i);
          return {
            text: `贷款每年末还 ${money(Pm, 0)}，共 ${n} 次，利率 ${pct(i)}。用两种方法求第 ${k} 次还款里的利息。`,
            vars: { i },
            steps: [
              choice(`第 ${k} 次的利息按哪个余额算？`, [
                [`$B_{${k - 1}} = ${Pm}\\,a_{\\angl{${e}}}$`, true],
                [`$B_{${k}} = ${Pm}\\,a_{\\angl{${n - k}}}$`, false, `利息是这一期**开始时**的余额产生的，也就是第 ${k - 1} 次付完时。`],
                [`$L = ${Pm}\\,a_{\\angl{${n}}}$`, false, '只有第 1 期才按原贷款额算利息。'],
              ]),
              expr(`方法一：$I_{${k}} = i \\times B_{${k - 1}}$ =`, { target: Ik, model: `i*${Pm}a(${e})` }),
              expr('方法二（捷径）：', { target: Pm * (1 - (1 + i) ** -e), model: `${Pm}(1-v^${e})`, why: '因为 $i\\,a_{\\angl{m}} = 1 - v^m$，两条路是同一个数。' }),
              expr(`于是本金部分 $PR_{${k}}$ =`, { target: Pm - Ik, model: `${Pm} - i*${Pm}a(${e})`, hint: `也就是 $${Pm}v^{${e}}$。` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'loan-nonlevel',
    en: 'Drop and balloon payments; refinancing',
    zh: '最后一笔零头与再融资',
    outcome: '3a · 3b',
    learn: [
      P('现实里还款额常常是整数，比如“每年还 1,000，直到还清”。这时贷款一般不会正好在某个整年还完，最后会剩下一个零头。'),
      M('P\\,a_{\\angl{m}} \\le L < P\\,a_{\\angl{m+1}} \\qquad x = \\frac{\\ln\\big(P/(P - Li)\\big)}{\\ln(1+i)}', '先找能付满的次数 m：解出 $P a_{\\angl{x}} = L$ 的 x，取整数部分就是 m。'),
      T(tl(7, [...flowsEvery(1, 6, '1,000'), { t: 7, amt: 'X' }], { focal: 7, rate: 'i' }), '六次足额的 1,000 之后还差一点：第 7 年末付一笔较小的 X，这就是 drop payment。'),
      M('B_m = L(1+i)^m - P\\,s_{\\angl{m}} \\qquad \\text{drop: } X = B_m(1+i) \\qquad \\text{balloon: } X = P + B_m', '零头要么晚一期单独付（变小的 drop payment），要么并进第 m 次一起付（变大的 balloon payment）。$B_m$ 用 retrospective 算最方便。'),
      TERMS([
        ['drop payment', '最后一笔较小的还款', '在第 m+1 期付，比 P 小'],
        ['balloon payment', '气球式尾款', '在第 m 期付：P 加上剩下的余额'],
        ['refinance', '再融资', '还到一半，按新利率重新借一笔，把旧余额还清'],
      ]),
      M("P' = \\frac{B_k}{a_{\\angl{m}}\\,@\\,j}", '再融资：第 k 次付完时的余额 $B_k$（按**旧**利率算）变成一笔新贷款，在新利率 j 下分 m 期等额还。在式子里写成 a(m, j)。'),
      RECIPE('零头题三步', ['解出 x，取整得足额次数 m', '用 retrospective 算 $B_m$', 'balloon：第 m 期付 $P + B_m$；drop：第 m+1 期付 $B_m(1+i)$']),
      TIP('余额永远按“原合同”的利率算；新利率只用来算新的还款。'),
    ],
    example: r => {
      const i = 0.05, L = 5000, Pm = 1000;
      const x = Math.log(Pm / (Pm - L * i)) / Math.log(1 + i);
      const B5 = L * (1 + i) ** 5 - Pm * sn(5, i);
      return {
        text: '借 5,000，利率 5%，每年末还 1,000，最后一笔还零头（drop payment）。最后一笔是多少？',
        timeline: tl(6, [...flowsEvery(1, 5, '1,000'), { t: 6, amt: 'X' }], { focal: 6, rate: 'i = 5%' }),
        vars: { i },
        steps: [
          expr('先解 $1000\\,a_{\\angl{x}} = 5000$：x =', { target: x, model: 'ln(1000/(1000 - 5000i))/ln(1+i)', unit: 'number', hint: '$v^x = 1 - 5000i/1000$，两边取对数。', why: `x ≈ ${x.toFixed(3)}。` }),
          choice('所以能付满几次 1,000？', [
            ['5 次，第 6 年末付零头', true],
            ['6 次', false, `x ≈ ${x.toFixed(2)} < 6：付满 6 次就多还了。`],
            ['4 次', false, '第 5 次付完时贷款还没还清，所以 5 次都是足额的。'],
          ]),
          expr('第 5 次付完的余额 $B_5$（retrospective）=', { target: B5, model: '5000(1+i)^5 - 1000s(5)' }),
          expr('drop payment（第 6 年末）=', { target: B5 * (1 + i), model: '(5000(1+i)^5 - 1000s(5))(1+i)', why: `余额 ${money(B5)} 再长一年利息：${money(B5 * 1.05)}。` }),
        ],
      };
    },
    drills: [
      {
        id: 'loan-nonlevel-n',
        zh: '能付满几次',
        gen: r => {
          const { i, f, x, m } = pick(r, UNEVEN);
          const Pm = pick(r, [500, 1000, 2000]);
          const L = Pm * f;
          return {
            text: `借 ${money(L, 0)}，利率 ${pct(i)}，每年末还 ${money(Pm, 0)}，直到还清（最后一笔可能是零头）。能付满几次 ${money(Pm, 0)}？`,
            vars: { i },
            steps: [
              choice('先写方程：', [
                [`$${Pm}\\,a_{\\angl{x}} = ${L}$`, true],
                [`$${Pm}\\,x = ${L}$`, false, '没有利息的话才这样；有利息要还得更久。'],
                [`$${Pm}\\,s_{\\angl{x}} = ${L}$`, false, '贷款在时刻 0，要比较现值。'],
              ]),
              expr('解出 x =', { target: x, model: `ln(${Pm}/(${Pm} - ${L}i))/ln(1+i)`, unit: 'number', hint: `$1 - v^x = ${L}i/${Pm}$，所以 $v^x = 1 - ${L}i/${Pm}$。`, why: `x ≈ ${x.toFixed(3)}。` }),
              choice('足额还款的次数 m =', [
                [`${m}`, true],
                [`${m + 1}`, false, `x ≈ ${x.toFixed(2)} 不到 ${m + 1}：第 ${m + 1} 次只需要付零头。`],
                [`${m - 1}`, false, `第 ${m - 1} 次付完还欠不少，下一次仍是足额的。`],
              ], { hint: '取 x 的整数部分。' }),
            ],
          };
        },
      },
      {
        id: 'loan-nonlevel-drop',
        zh: 'drop payment',
        gen: r => {
          const { i, f, m } = pick(r, UNEVEN);
          const Pm = pick(r, [500, 1000, 2000]);
          const L = Pm * f;
          const Bm = L * (1 + i) ** m - Pm * sn(m, i);
          return {
            text: `借 ${money(L, 0)}，利率 ${pct(i)}，每年末还 ${money(Pm, 0)}。可以算出能付满 ${m} 次，第 ${m + 1} 年末再付一笔较小的零头 X。求 X。`,
            timeline: tl(m + 1, [...flowsEvery(1, m, money(Pm, 0)), { t: m + 1, amt: 'X' }], { focal: m + 1, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr(`第 ${m} 次付完后的余额 $B_{${m}}$ =`, { target: Bm, model: `${L}(1+i)^${m} - ${Pm}s(${m})`, hint: '用 retrospective：借的连本带利 − 已还的连本带利。' }),
              choice('X 和这个余额的关系：', [
                [`$X = B_{${m}}(1+i)$`, true],
                [`$X = B_{${m}}$`, false, 'X 晚一年才付，余额这一年还要长利息。'],
                [`$X = ${Pm} + B_{${m}}$`, false, '那是 balloon payment（并进第 m 次一起付）。'],
              ]),
              expr('X =', { target: Bm * (1 + i), model: `(${L}(1+i)^${m} - ${Pm}s(${m}))(1+i)` }),
            ],
          };
        },
      },
      {
        id: 'loan-nonlevel-balloon',
        zh: 'balloon payment',
        gen: r => {
          const { i, f, m } = pick(r, UNEVEN);
          const Pm = pick(r, [500, 1000, 2000]);
          const L = Pm * f;
          const Bm = L * (1 + i) ** m - Pm * sn(m, i);
          return {
            text: `借 ${money(L, 0)}，利率 ${pct(i)}，每年末还 ${money(Pm, 0)}，能付满 ${m} 次。合同约定：零头**并进**第 ${m} 次还款一起付（balloon payment）。第 ${m} 次一共付多少？`,
            timeline: tl(m, [...flowsEvery(1, m - 1, money(Pm, 0)), { t: m, amt: 'X' }], { focal: m, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('balloon payment 发生在：', [
                [`第 ${m} 年末，金额 $${Pm} + B_{${m}}$`, true],
                [`第 ${m + 1} 年末，金额 $B_{${m}}(1+i)$`, false, '那是 drop payment。'],
                [`第 ${m} 年末，金额 $B_{${m}}$`, false, `第 ${m} 次本来就要付 ${Pm}，零头是加在它上面的。`],
              ]),
              expr(`$B_{${m}}$（按 ${m} 次足额还款算）=`, { target: Bm, model: `${L}(1+i)^${m} - ${Pm}s(${m})` }),
              expr('balloon payment =', { target: Pm + Bm, model: `${Pm} + ${L}(1+i)^${m} - ${Pm}s(${m})`, why: `比 drop payment 少了一年利息：${money(Pm + Bm)} 在第 ${m} 年末付。` }),
            ],
          };
        },
      },
      {
        id: 'loan-nonlevel-refi',
        zh: '再融资：新还款与每年省下多少',
        gen: r => {
          const i = pick(r, [0.06, 0.08, 0.1]), j = round(i - pick(r, [0.01, 0.02]), 4);
          const n = int(r, 10, 20), k = int(r, 3, n - 4), Pm = pick(r, [1000, 2000, 2500, 5000]);
          const m = n - k;
          const Bk = Pm * an(m, i), Pn = Bk / an(m, j);
          return {
            text: `一笔贷款原来是利率 ${pct(i)}，每年末还 ${money(Pm, 0)}，共 ${n} 次。第 ${k} 次付完后，借款人按新利率 ${pct(j)} 再融资，剩下的 ${m} 年改为每年末等额还 P′。`,
            timeline: tl(n, flowsEvery(1, n, money(Pm, 0)), { focal: k, rate: `i = ${pct(i)} → j = ${pct(j)}` }),
            vars: { i },
            steps: [
              expr(`第 ${k} 次付完时的旧余额 $B_{${k}}$ =`, { target: Bk, model: `${Pm}a(${m})`, hint: '按**旧**合同、旧利率：剩余还款的现值。' }),
              choice('新还款 P′ 用哪个式子？', [
                [`$B_{${k}} / a_{\\angl{${m}}}$，按新利率 ${pct(j)}`, true],
                [`$B_{${k}} / a_{\\angl{${m}}}$，按旧利率 ${pct(i)}`, false, '那样就和原来的还款一样了；再融资后用新利率。'],
                [`$B_{${k}} / ${m}$`, false, '新贷款也要付利息。'],
              ]),
              expr("P′ =（新利率写成 a(m, j)）", { target: Pn, model: `${Pm}a(${m})/a(${m}, ${j})` }),
              expr('每年省下多少？', { target: Pm - Pn, model: `${Pm} - ${Pm}a(${m})/a(${m}, ${j})`, why: `每年少付 ${money(Pm - Pn)}，共 ${m} 年。` }),
            ],
          };
        },
      },
    ],
  },
];

export default {
  id: 'loan',
  no: 3,
  en: 'Loans',
  zh: '贷款',
  weight: '15–25%',
  blurb: '分期摊还、未偿余额、本金与利息的拆分、零头与再融资：贷款就是一个年金倒过来看。',
  lessons,
};
