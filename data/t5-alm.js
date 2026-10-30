import { pick, int, RATES, pct, money, round, choice, expr, tl, P, M, T, TERMS, TIP, TABLE, RECIPE, G } from './kit.js';

/* Topic 5 — General cash flows, portfolios and asset–liability management
   (SOA FM learning objectives 5a–5c; reading FM-24-17 §1–4 on duration / convexity approximations). */

/* Plain loops used to compute answer keys independently of the expression engine. */
const pv = (flows, i) => flows.reduce((s, f) => s + f.amt * (1 + i) ** -f.t, 0);
const macD = (flows, i) => flows.reduce((s, f) => s + f.t * f.amt * (1 + i) ** -f.t, 0) / pv(flows, i);
const macC = (flows, i) => flows.reduce((s, f) => s + f.t * f.t * f.amt * (1 + i) ** -f.t, 0) / pv(flows, i);
const modD = (flows, i) => flows.reduce((s, f) => s + f.t * f.amt * (1 + i) ** -(f.t + 1), 0) / pv(flows, i);
const modC = (flows, i) => flows.reduce((s, f) => s + f.t * (f.t + 1) * f.amt * (1 + i) ** -(f.t + 2), 0) / pv(flows, i);

/* Set-up strings in the expression language. */
const vpow = t => (t === 1 ? 'v' : `v^${t}`);
const pvModel = flows => flows.map(f => `${f.amt}${vpow(f.t)}`).join(' + ');
const durModel = flows => `(${flows.map(f => `${f.t}*${f.amt}${vpow(f.t)}`).join(' + ')})/(${pvModel(flows)})`;
const tlFlows = flows => flows.map(f => ({ t: f.t, amt: money(f.amt, 0) }));

const lessons = [
  {
    id: 'alm-npv',
    en: 'Net present value and yield rate',
    zh: '一个项目值不值得做：NPV 与收益率',
    outcome: '5a',
    learn: [
      P('一个投资项目就是一串现金流：有时你掏钱（流出，outflow），有时你收钱（流入，inflow）。判断它划不划算，就把**所有现金流都搬到时刻 0**，流入记正、流出记负，加起来。'),
      TERMS([
        ['cash flow $C_t$', '现金流', '时刻 t 的净流入；掏钱时为负'],
        ['net present value NPV(i)', '净现值', '在利率 i 下，所有现金流现值的和'],
        ['yield rate / IRR', '收益率 / 内部收益率', '让 NPV = 0 的那个利率'],
        ['hurdle rate / cost of capital', '要求回报率', '用来折现、判断接不接受项目的利率'],
      ]),
      M('\\mathrm{NPV}(i) = \\sum_{t} C_t\\, v^t = C_0 + C_1 v + C_2 v^2 + \\cdots', '$C_0$ 通常是负的（一开始投入）。NPV > 0：在利率 i 下这个项目赚钱，接受；NPV < 0：拒绝。'),
      T(tl(2, [{ t: 0, amt: '1,000', side: 'down' }, { t: 1, amt: '550' }, { t: 2, amt: '605' }], { focal: 0, rate: 'i = ?' }), '投入 1,000，之后收 550、605。收益率就是让“两笔流入的现值 = 1,000”的那个 i。'),
      P('**收益率（yield rate）** 是一个“自己算出来”的利率：$\\mathrm{NPV}(i) = 0$ 的解。它回答的是：“这个项目相当于一个利率为多少的存款？”'),
      M('\\text{一进一出：}\\; K(1+i)^n = A \\;\\Rightarrow\\; i = (A/K)^{1/n} - 1 \\qquad \\text{两期：}\\; C_2 x^2 + C_1 x - K = 0,\\; x = v', '一般情形要用计算器试错；但这两种结构有公式：一进一出直接开方；两期是关于 $x=v$ 的一元二次方程，取正根。'),
      TABLE(['NPV 在不同利率下', '意思'], [['NPV(i) > 0', '收益率 > i'], ['NPV(i) = 0', '收益率 = i'], ['NPV(i) < 0', '收益率 < i']]),
      TIP('先投入、后收回的项目：利率越高，未来流入折得越狠，NPV 越小。所以 NPV 从正变负的地方就是收益率。'),
      P('注意：如果现金流的正负号变了不止一次（比如中途又追加投入），收益率可能不唯一。考试里通常会保证只变号一次。'),
    ],
    example: r => ({
      text: '今天投入 1,000，第 1 年末收到 550，第 2 年末收到 605。求这个项目的收益率。',
      timeline: tl(2, [{ t: 0, amt: '1,000', side: 'down' }, { t: 1, amt: '550' }, { t: 2, amt: '605' }], { focal: 0, rate: 'i = ?' }),
      vars: {},
      steps: [
        choice('第一步：收益率满足哪个方程？', [
          ['$550v + 605v^2 = 1000$', true],
          ['$550 + 605 = 1000(1+i)^2$', false, '550 在第 1 年就到手，可以再生 1 年利息，不能和 605 直接相加。'],
          ['$550(1+i) + 605(1+i)^2 = 1000$', false, '流入在未来，要往时刻 0 搬，乘的是 $v$ 不是 $(1+i)$。'],
        ], { hint: 'NPV = 0：流入的现值 = 流出的现值。', anim: [{ do: 'move', from: 1, to: 0, label: '×v' }, { do: 'move', from: 2, to: 0, label: '×v²' }, { do: 'note', t: 0.5, y: 92, text: '= 1,000' }] }),
        expr('第二步：令 $x = v$，方程是 $605x^2 + 550x - 1000 = 0$。用求根公式写出正根 x：', {
          target: (-550 + Math.sqrt(550 * 550 + 4 * 605 * 1000)) / (2 * 605),
          model: '(-550 + sqrt(550^2 + 4*605*1000))/(2*605)',
          unit: 'number',
          hint: '$x = \\dfrac{-b + \\sqrt{b^2 - 4ac}}{2a}$，这里 $a = 605,\\ b = 550,\\ c = -1000$。',
          why: '$\\sqrt{2722500} = 1650$，所以 $x = 1100/1210 = 0.90909$。',
          anim: [{ do: 'note', t: 1.5, y: 92, text: 'v = 0.90909' }],
        }),
        expr('第三步：$i = 1/x - 1$ =', {
          target: (2 * 605) / (-550 + Math.sqrt(550 * 550 + 4 * 605 * 1000)) - 1,
          model: '(2*605)/(-550 + sqrt(550^2 + 4*605*1000)) - 1',
          unit: 'rate',
          why: '$1/0.90909 - 1 = 10\\%$。验算：$550/1.1 = 500$，$605/1.21 = 500$，合计正好 1,000。',
          anim: [{ do: 'note', t: 1, y: 190, text: '÷1.1 → 500' }, { do: 'note', t: 1.75, y: 190, text: '÷1.21 → 500' }],
        }),
      ],
    }),
    drills: [
      {
        id: 'alm-npv-value',
        zh: '算 NPV，决定接不接受',
        gen: r => {
          const i = pick(r, RATES), K = pick(r, [1000, 2000, 3000, 5000]);
          const n = int(r, 2, 4);
          const flows = [];
          for (let t = 1; t <= n; t++) flows.push({ t, amt: Math.round((K / n) * pick(r, [0.9, 1, 1.1, 1.2, 1.3]) / 10) * 10 });
          const npv = pv(flows, i) - K;
          return {
            text: `一个项目今天需要投入 ${money(K, 0)}，之后每年末的流入如时间轴所示。要求回报率 ${pct(i)}。`,
            timeline: tl(n, [{ t: 0, amt: money(K, 0), side: 'down' }, ...tlFlows(flows)], { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr('写出 NPV（流出记负）：', { target: npv, model: `-${K} + ${pvModel(flows)}`, hint: '每笔流入乘 $v^t$，再减去今天的投入。' }),
              choice('按 NPV 规则：', [
                ['接受：NPV > 0，收益率高于要求回报率', npv > 0],
                ['拒绝：NPV < 0，收益率低于要求回报率', npv < 0],
              ], { why: 'NPV 的正负，等价于“收益率比折现用的利率高还是低”。' }),
            ],
          };
        },
      },
      {
        id: 'alm-npv-single',
        zh: '一进一出的收益率',
        gen: r => {
          const j = pick(r, [0.03, 0.04, 0.05, 0.06, 0.07, 0.08]), n = int(r, 2, 10), K = pick(r, [1000, 2000, 5000, 8000]);
          const A = round(K * (1 + j) ** n, 2);
          return {
            text: `今天投入 ${money(K, 0)}，第 ${n} 年末一次收回 ${money(A)}，中间没有别的现金流。收益率是多少？`,
            timeline: tl(n, [{ t: 0, amt: money(K, 0), side: 'down' }, { t: n, amt: money(A) }], { rate: 'i = ?' }),
            vars: {},
            steps: [
              choice('NPV = 0 的方程：', [
                [`$${K} = ${A}\\,v^{${n}}$`, true],
                [`$${K} = ${A}\\,v$`, false, `${A} 在第 ${n} 年才收到，要折 ${n} 期。`],
                [`$${A} = ${K}\\,v^{${n}}$`, false, '方向反了：未来的大钱折回今天，应等于今天的投入。'],
              ]),
              expr('解出收益率 i：', { target: (A / K) ** (1 / n) - 1, model: `(${A}/${K})^(1/${n}) - 1`, unit: 'rate', hint: `$(1+i)^{${n}} = ${A}/${K}$，开 ${n} 次方。` }),
            ],
          };
        },
      },
      {
        id: 'alm-npv-quad',
        zh: '两期项目：解一元二次方程',
        gen: r => {
          const j = pick(r, [0.05, 0.1, 0.2]);
          const a = 100 * int(r, 3, 9);
          const b = (j === 0.05 ? 400 * int(r, 1, 3) : 100 * int(r, 3, 9));
          const C1 = Math.round(a * (1 + j)), C2 = Math.round(b * (1 + j) ** 2), K = a + b;
          const x = (-C1 + Math.sqrt(C1 * C1 + 4 * C2 * K)) / (2 * C2);
          const root = `sqrt(${C1}^2 + 4*${C2}*${K})`;
          return {
            text: `投入 ${money(K, 0)}，第 1 年末收 ${money(C1, 0)}，第 2 年末收 ${money(C2, 0)}。求收益率。`,
            timeline: tl(2, [{ t: 0, amt: money(K, 0), side: 'down' }, { t: 1, amt: money(C1, 0) }, { t: 2, amt: money(C2, 0) }], { rate: 'i = ?' }),
            vars: {},
            steps: [
              choice('令 $x = v$，方程是：', [
                [`$${C2}x^2 + ${C1}x - ${K} = 0$`, true],
                [`$${C1}x^2 + ${C2}x - ${K} = 0$`, false, `第 2 年的 ${C2} 要折 2 期，配 $x^2$。`],
                [`$${C2}x^2 + ${C1}x + ${K} = 0$`, false, '投入要移到同一边变成负号，否则没有正根。'],
              ]),
              expr('正根 x =', { target: x, model: `(-${C1} + ${root})/(2*${C2})`, unit: 'number', hint: '求根公式取“+”号那一个。' }),
              expr('收益率 i = 1/x − 1 =', { target: 1 / x - 1, model: `(2*${C2})/(-${C1} + ${root}) - 1`, unit: 'rate', why: `答案是 ${pct(j)}：验算两笔流入的现值正好是 ${a} + ${b} = ${K}。` }),
            ],
          };
        },
      },
      {
        id: 'alm-npv-pick',
        zh: '哪个利率让 NPV ≈ 0',
        gen: r => {
          const j = pick(r, [0.04, 0.05, 0.06, 0.07, 0.08]), n = int(r, 3, 8), R = pick(r, [500, 1000, 2000]);
          const K = Math.round(R * (1 - (1 + j) ** -n) / j);
          const lo = round(j - 0.02, 4), hi = round(j + 0.02, 4);
          const npvAt = x => R * (1 - (1 + x) ** -n) / x - K;
          return {
            text: `投入 ${money(K, 0)}，之后 ${n} 年每年末收到 ${money(R, 0)}。收益率是 ${pct(lo)}、${pct(j)}、${pct(hi)} 中的哪一个？`,
            timeline: tl(n, [{ t: 0, amt: money(K, 0), side: 'down' }, ...Array.from({ length: n }, (_, k) => ({ t: k + 1, amt: money(R, 0) }))], { rate: 'i = ?' }),
            vars: {},
            steps: [
              expr(`在 ${pct(lo)} 下的 NPV（用 a(n, 利率)）：`, { target: npvAt(lo), model: `${R}a(${n}, ${lo}) - ${K}`, hint: `流入是 ${n} 年的年金：$${R}\\,a_{\\angl{${n}}}$。` }),
              expr(`在 ${pct(j)} 下的 NPV：`, { target: npvAt(j), model: `${R}a(${n}, ${j}) - ${K}` }),
              choice('所以收益率是：', [
                [pct(j), true],
                [pct(lo), false, `在 ${pct(lo)} 下 NPV 明显为正，说明收益率比它高。`],
                [pct(hi), false, '利率越高 NPV 越小；在更低的利率下 NPV 已经接近 0 了。'],
              ], { why: 'NPV 几乎为 0（只差取整误差）的那个利率就是收益率。' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'alm-spot',
    en: 'Spot rates, forward rates and the yield curve',
    zh: '每个期限一个利率：即期利率与远期利率',
    outcome: '5a',
    learn: [
      P('到目前为止，所有现金流都用同一个 i 折现。现实里，借 1 年和借 5 年的利率不一样。**即期利率** $s_t$（spot rate）就是“今天借钱、借 t 年、到期一次还”的年有效利率。把 $s_1, s_2, s_3, \\dots$ 按期限画出来，就是**收益率曲线**（yield curve）。'),
      TERMS([
        ['spot rate $s_t$', '即期利率', '今天起、为期 t 年的零息利率（年有效）'],
        ['yield curve / term structure', '收益率曲线 / 利率期限结构', '$s_t$ 随 t 变化的图像'],
        ['forward rate $f_{m,n}$', '远期利率', '今天锁定的、从时刻 m 到 n 的年有效利率'],
        ['zero-coupon bond', '零息债券', '只在到期日付一笔钱'],
      ]),
      M('PV = \\sum_t \\frac{C_t}{(1+s_t)^t}', '每笔现金流用**它自己期限**的即期利率折现：第 2 年的钱用 $s_2$，折 2 次。'),
      T(tl(3, [{ t: 1, amt: '6' }, { t: 2, amt: '6' }, { t: 3, amt: '106' }], { focal: 0, rate: 's₁, s₂, s₃' }), '3 年期、票息 6 的债券：$6/(1+s_1) + 6/(1+s_2)^2 + 106/(1+s_3)^3$。'),
      P('**远期利率**：两年期投资有两条等价的路——直接按 $s_2$ 存 2 年，或者先按 $s_1$ 存 1 年，再按“今天约定好的”第 2 年利率 $f_{1,2}$ 存 1 年。没有套利，两条路结果相等：'),
      M('(1+s_2)^2 = (1+s_1)(1+f_{1,2}) \\qquad (1+s_n)^n = (1+s_m)^m (1+f_{m,n})^{n-m}', '所以 $f_{m,n} = \\left[\\dfrac{(1+s_n)^n}{(1+s_m)^m}\\right]^{1/(n-m)} - 1$。反过来，即期是一串一年期远期的“几何平均”：$(1+s_3)^3 = (1+s_1)(1+f_{1,2})(1+f_{2,3})$。'),
      TIP('收益率曲线向上（s 随 t 变大）时，远期利率比即期利率还高：后面那段要“补上”更多。'),
      RECIPE('做题顺序', ['把每笔现金流写在它的时刻上', '时刻 t 的钱配 $(1+s_t)^t$，不要全用同一个利率', '要远期：写出“两条路相等”的方程，再解']),
    ],
    example: r => {
      const vars = { s1: 0.04, s2: 0.05 };
      return {
        text: '$s_1 = 4\\%$，$s_2 = 5\\%$。一张 2 年期债券面值 100，年票息 6。求它的价格，以及远期利率 $f_{1,2}$。',
        timeline: tl(2, [{ t: 1, amt: '6' }, { t: 2, amt: '106' }], { focal: 0, rate: 's₁ = 4%, s₂ = 5%' }),
        vars,
        steps: [
          choice('第 2 年末那笔 106 应该怎样折现？', [
            ['$106/(1+s_2)^2$', true],
            ['$106/(1+s_2)$', false, '$s_2$ 是年利率，2 年要折 2 次。'],
            ['$106/((1+s_1)(1+s_2))$', false, '$s_2$ 已经是 0 到 2 年整段的年利率，不用再乘 $1+s_1$。'],
          ], { anim: [{ do: 'move', from: 2, to: 0, label: '÷1.05²', result: 106 / 1.05 ** 2 }] }),
          expr('价格 =（可以直接用 s1、s2）', { target: 6 / 1.04 + 106 / 1.05 ** 2, model: '6/(1+s1) + 106/(1+s2)^2', anim: [{ do: 'move', from: 1, to: 0, label: '÷1.04', result: 6 / 1.04 + 106 / 1.05 ** 2 }, { do: 'answer', t: 0, value: 6 / 1.04 + 106 / 1.05 ** 2 }], why: '$5.769 + 96.145 = 101.91$。' }),
          expr('$f_{1,2}$ =', { target: 1.05 ** 2 / 1.04 - 1, model: '(1+s2)^2/(1+s1) - 1', unit: 'rate', anim: [{ do: 'note', t: 0.5, y: 92, text: 's₁ = 4%' }, { do: 'note', t: 1.5, y: 92, text: 'f₁,₂ ≈ 6.01%' }], why: '约 6.01%：比 $s_2$ 还高，因为第 1 年只拿 4%，第 2 年要补回来。' }),
        ],
      };
    },
    drills: [
      {
        id: 'alm-spot-price',
        zh: '用即期利率给债券定价',
        gen: r => {
          const s1 = pick(r, [0.02, 0.03, 0.04]), s2 = round(s1 + pick(r, [0.005, 0.01]), 4), s3 = round(s2 + pick(r, [0.005, 0.01]), 4);
          const F = pick(r, [100, 1000]), c = pick(r, [0.04, 0.05, 0.06, 0.08]);
          const C = round(F * c, 2);
          const price = C / (1 + s1) + C / (1 + s2) ** 2 + (C + F) / (1 + s3) ** 3;
          return {
            text: `即期利率 $s_1 = ${pct(s1)}$，$s_2 = ${pct(s2)}$，$s_3 = ${pct(s3)}$。一张 3 年期债券面值 ${money(F, 0)}，年票息率 ${pct(c)}。求价格。`,
            timeline: tl(3, [{ t: 1, amt: money(C, 0) }, { t: 2, amt: money(C, 0) }, { t: 3, amt: money(C + F, 0) }], { focal: 0, rate: 's₁, s₂, s₃' }),
            vars: { s1, s2, s3 },
            steps: [
              choice('第 2 年末的票息用哪个因子折现？', [
                ['$(1+s_2)^{-2}$', true],
                ['$(1+s_3)^{-2}$', false, '第 2 年的钱用 2 年期利率。'],
                ['$(1+s_2)^{-1}$', false, '要折 2 年。'],
              ]),
              expr('价格 =（用 s1、s2、s3）', { target: price, model: `${C}/(1+s1) + ${C}/(1+s2)^2 + ${C + F}/(1+s3)^3`, hint: '最后一年是票息 + 面值。' }),
            ],
          };
        },
      },
      {
        id: 'alm-spot-fwd',
        zh: '由两个即期利率求远期利率',
        gen: r => {
          const [m, n] = pick(r, [[1, 2], [1, 3], [2, 3], [2, 4], [1, 4]]);
          const sm = pick(r, [0.02, 0.03, 0.04]), sn = round(sm + pick(r, [0.005, 0.01, 0.015]), 4);
          const k = n - m;
          const f = ((1 + sn) ** n / (1 + sm) ** m) ** (1 / k) - 1;
          const vars = { [`s${m}`]: sm, [`s${n}`]: sn };
          const pm = m === 1 ? `(1+s${m})` : `(1+s${m})^${m}`;
          return {
            text: `$s_{${m}} = ${pct(sm)}$，$s_{${n}} = ${pct(sn)}$。求时刻 ${m} 到 ${n} 的远期年利率 $f_{${m},${n}}$。`,
            timeline: tl(n, [{ t: 0, amt: '1' }, { t: n, amt: '?' }], { rate: `s${m}, s${n}` }),
            vars,
            steps: [
              choice('“两条路相等”的方程：', [
                [`$(1+s_{${n}})^{${n}} = (1+s_{${m}})^{${m}}(1+f)^{${k}}$`, true],
                [`$(1+s_{${n}})^{${n}} = (1+s_{${m}})^{${m}}(1+f)^{${n}}$`, false, `远期这一段只有 ${n} − ${m} = ${k} 年。`],
                [`$(1+s_{${n}}) = (1+s_{${m}})(1+f)$`, false, '利率都是年利率，要配上年数的幂。'],
              ]),
              expr(`$f_{${m},${n}}$ =（用 s${m}、s${n}）`, { target: f, model: k === 1 ? `(1+s${n})^${n}/${pm} - 1` : `((1+s${n})^${n}/${pm})^(1/${k}) - 1`, unit: 'rate', hint: k === 1 ? '除过去，再减 1。' : `除过去后开 ${k} 次方。` }),
            ],
          };
        },
      },
      {
        id: 'alm-spot-from-fwd',
        zh: '由远期利率求即期利率',
        gen: r => {
          const s1 = pick(r, [0.02, 0.03, 0.04]), f12 = round(s1 + pick(r, [0.005, 0.01, 0.02]), 4), f23 = round(f12 + pick(r, [-0.005, 0.005, 0.01]), 4);
          return {
            text: `一年期即期利率 $s_1 = ${pct(s1)}$，一年期远期利率 $f_{1,2} = ${pct(f12)}$，$f_{2,3} = ${pct(f23)}$。求 $s_2$ 和 $s_3$。`,
            vars: { s1, f12, f23 },
            steps: [
              choice('$(1+s_3)^3$ 等于：', [
                ['$(1+s_1)(1+f_{1,2})(1+f_{2,3})$', true],
                ['$(1+s_1)+(1+f_{1,2})+(1+f_{2,3})$', false, '每一年是“乘”上去的，不是加。'],
                ['$(1+f_{2,3})^3$', false, '前两年的利率不一样，不能只用最后一年。'],
              ]),
              expr('$s_2$ =（用 s1、f12）', { target: Math.sqrt((1 + s1) * (1 + f12)) - 1, model: 'sqrt((1+s1)(1+f12)) - 1', unit: 'rate' }),
              expr('$s_3$ =', { target: ((1 + s1) * (1 + f12) * (1 + f23)) ** (1 / 3) - 1, model: '((1+s1)(1+f12)(1+f23))^(1/3) - 1', unit: 'rate', hint: '三个一年期的增长因子相乘，开 3 次方。' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'alm-duration',
    en: 'Macaulay and modified duration',
    zh: '久期：现金流的“平均到达时间”',
    outcome: '5b',
    learn: [
      P('一串现金流对利率有多敏感？直觉：钱来得越晚，利率一变它的现值变得越多。**Macaulay 久期**就是“用现值做权重的平均付款时间”。'),
      M('D_{mac} = \\frac{\\sum_t t\\, C_t v^t}{\\sum_t C_t v^t} = \\sum_t t \\cdot w_t, \\qquad w_t = \\frac{C_t v^t}{P}', '读法：每个付款时刻 t，按它占总现值的比例 $w_t$ 加权平均。单位是“年”。'),
      T(tl(4, [{ t: 1, amt: '100' }, { t: 4, amt: '1,000' }], { focal: 0, rate: 'i' }), '1 年后的 100 和 4 年后的 1,000：大部分现值在 t = 4，所以久期接近 4，但被 t = 1 往前拉了一点。'),
      M('D_{mod} = -\\frac{P\'(i)}{P(i)} = \\frac{D_{mac}}{1+i} = v\\,D_{mac}', '修正久期（modified duration）：利率每上升 1 个单位，价格大约下降的**比例**。对 $P = \\sum C_t (1+i)^{-t}$ 求导，每一项多出 $-t\\,v$，就得到这个关系。'),
      TABLE(['现金流', '$D_{mac}$', '说明'], [
        ['零息债券，n 年到期', '$n$', '只有一个付款时刻'],
        ['n 年期等额年金（期末）', '$(Ia)_{\\angl{n}} / a_{\\angl{n}}$', '比 n 小，大约在中间偏前'],
        ['永续年金（期末）', '$(1+i)/i = 1/d$', '没有到期日，久期却有限'],
        ['附息债券', '介于 0 和到期日之间', '票息越高，久期越短'],
      ]),
      TERMS([
        ['Macaulay duration', 'Macaulay 久期', '现值加权的平均付款时间'],
        ['modified duration / volatility', '修正久期 / 波动率', '$-P\'/P$，价格对利率的相对敏感度'],
      ]),
      TIP('Macaulay 久期一定落在第一笔和最后一笔付款时间之间；零息债券久期 = 到期时间。'),
      RECIPE('算久期三步', ['每笔现金流的现值 $C_t v^t$', '分子：每个现值乘上它的时刻 t，再加起来', '除以总现值；要修正久期再乘 $v$']),
    ],
    example: r => ({
      text: '利率 5%。第 1 年末收 100，第 2 年末收 200。求 Macaulay 久期和修正久期。',
      timeline: tl(2, [{ t: 1, amt: '100' }, { t: 2, amt: '200' }], { focal: 0, rate: 'i = 5%' }),
      vars: { i: 0.05 },
      steps: [
        choice('平均付款时间用什么做权重？', [
          ['每笔钱的现值 $C_t v^t$', true],
          ['每笔钱的面额 $C_t$', false, '那样没有考虑时间价值；Macaulay 久期用现值加权。'],
          ['每笔一样的权重', false, '200 比 100 重要得多，权重应该不同。'],
        ], { anim: [{ do: 'move', from: 1, to: 0, label: '×v', result: 100 / 1.05 }, { do: 'move', from: 2, to: 0, label: '×v²', result: 100 / 1.05 + 200 / 1.05 ** 2 }] }),
        expr('$D_{mac}$ =', { target: (1 * 100 / 1.05 + 2 * 200 / 1.05 ** 2) / (100 / 1.05 + 200 / 1.05 ** 2), model: '(1*100v + 2*200v^2)/(100v + 200v^2)', unit: 'number', anim: [{ do: 'note', t: 1.45, y: 100, text: '重心 D' }, { do: 'answer', t: 1.6557, value: (1 * 100 / 1.05 + 2 * 200 / 1.05 ** 2) / (100 / 1.05 + 200 / 1.05 ** 2), unit: 'number' }], why: '约 1.656 年：在 1 和 2 之间，靠近 2，因为 200 那笔现值大。' }),
        expr('$D_{mod}$ = $D_{mac}/(1+i)$ =', { target: (1 * 100 / 1.05 + 2 * 200 / 1.05 ** 2) / (100 / 1.05 + 200 / 1.05 ** 2) / 1.05, model: '(1*100v + 2*200v^2)/(100v + 200v^2)/(1+i)', unit: 'number', anim: [{ do: 'note', t: 0.6, y: 52, text: 'D/1.05 = 1.577' }], why: '约 1.577：利率升 1%，价格大约跌 1.6%。' }),
      ],
    }),
    drills: [
      {
        id: 'alm-dur-flows',
        zh: '几笔现金流的久期',
        gen: r => {
          const i = pick(r, RATES);
          const k = int(r, 2, 3);
          const times = [];
          while (times.length < k) {
            const t = int(r, 1, 8);
            if (!times.includes(t)) times.push(t);
          }
          times.sort((a, b) => a - b);
          const flows = times.map(t => ({ t, amt: pick(r, [100, 200, 300, 500, 1000]) }));
          return {
            text: `利率 ${pct(i)}。求下面这串现金流的 Macaulay 久期。`,
            timeline: tl(times[k - 1], tlFlows(flows), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr('先写总现值 P：', { target: pv(flows, i), model: pvModel(flows) }),
              expr('$D_{mac}$ =', { target: macD(flows, i), model: durModel(flows), unit: 'number', hint: '分子：每笔现值再乘它的时刻 t。' }),
              choice('检查一下：答案应该落在哪里？', [
                [`${times[0]} 和 ${times[k - 1]} 之间`, true],
                [`比 ${times[k - 1]} 还大`, false, '加权平均不会超出最大值。'],
                ['恰好等于各时刻的简单平均', false, '权重是现值，不是平均分。'],
              ]),
            ],
          };
        },
      },
      {
        id: 'alm-dur-mod',
        zh: 'Macaulay ↔ 修正久期',
        gen: r => {
          const i = pick(r, RATES);
          const kind = pick(r, ['mac2mod', 'mod2mac', 'deriv']);
          if (kind === 'mac2mod') {
            const D = round(int(r, 20, 120) / 10, 1);
            return {
              text: `某债券在利率 ${pct(i)} 下的 Macaulay 久期是 ${D}。求修正久期。`,
              vars: { i },
              steps: [expr('$D_{mod}$ =', { target: D / (1 + i), model: `${D}/(1+i)`, unit: 'number', hint: '修正久期 = Macaulay 久期 × v。' })],
            };
          }
          if (kind === 'mod2mac') {
            const Dm = round(int(r, 20, 120) / 10, 1);
            return {
              text: `某组合在利率 ${pct(i)} 下的修正久期是 ${Dm}。求 Macaulay 久期。`,
              vars: { i },
              steps: [
                choice('哪个更大？', [['Macaulay 久期', true], ['修正久期', false, '$D_{mod} = D_{mac}/(1+i)$，除以大于 1 的数会变小。']]),
                expr('$D_{mac}$ =', { target: Dm * (1 + i), model: `${Dm}(1+i)`, unit: 'number' }),
              ],
            };
          }
          const Pr = pick(r, [800, 950, 1000, 1200]), Dm = round(int(r, 20, 90) / 10, 1);
          const dP = round(-Pr * Dm, 2);
          return {
            text: `在利率 ${pct(i)} 下，某资产价格 $P = ${Pr}$，价格对利率的导数 $P'(i) = ${dP}$。求修正久期和 Macaulay 久期。`,
            vars: { i },
            steps: [
              expr('$D_{mod} = -P\'/P$ =', { target: -dP / Pr, model: `${-dP}/${Pr}`, unit: 'number', hint: '导数是负的，前面的负号把它变正。' }),
              expr('$D_{mac}$ =', { target: (-dP / Pr) * (1 + i), model: `${-dP}/${Pr}*(1+i)`, unit: 'number' }),
            ],
          };
        },
      },
      {
        id: 'alm-dur-zero',
        zh: '零息债券的久期',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 2, 20), F = pick(r, [1000, 5000, 10000]);
          return {
            text: `一张 ${n} 年期零息债券，到期付 ${money(F, 0)}，利率 ${pct(i)}。`,
            timeline: tl(n, [{ t: n, amt: money(F, 0) }], { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('它的 Macaulay 久期是：', [
                [`$${n}$`, true],
                [`$${n}v$`, false, '那是修正久期。'],
                [`$${F}v^{${n}}$`, false, '那是价格，不是时间。'],
              ], { why: '只有一个付款时刻，权重 100% 在 t = ' + n + '。' }),
              expr('修正久期 =', { target: n / (1 + i), model: `${n}/(1+i)`, unit: 'number' }),
            ],
          };
        },
      },
      {
        id: 'alm-dur-annuity',
        zh: '等额年金的久期',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 3, 20), R = pick(r, [100, 500, 1000]);
          let num = 0, den = 0;
          for (let t = 1; t <= n; t++) { num += t * (1 + i) ** -t; den += (1 + i) ** -t; }
          return {
            text: `每年末付 ${money(R, 0)}，共 ${n} 年，利率 ${pct(i)}。求 Macaulay 久期。`,
            timeline: tl(n, Array.from({ length: n }, (_, k) => ({ t: k + 1, amt: money(R, 0) })), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              choice('分子 $\\sum t\\cdot R v^t$ 可以写成：', [
                [`$${R}\\,(Ia)_{\\angl{${n}}}$`, true],
                [`$${R}\\,a_{\\angl{${n}}}$`, false, '那是分母（总现值）。'],
                [`$${R}\\,(Da)_{\\angl{${n}}}$`, false, '$(Da)$ 是 n, n−1, …, 1 递减；这里第 t 年的权重是 t，递增。'],
              ]),
              expr('$D_{mac}$ =（R 会约掉）', { target: num / den, model: `Ia(${n})/a(${n})`, unit: 'number', hint: '用 Ia(n) 和 a(n)。' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'alm-approx',
    en: 'Approximating price changes with duration and convexity',
    zh: '用久期和凸性估算价格变化',
    outcome: '5b',
    learn: [
      P('利率从 $i$ 变到 $i + \\Delta$，价格怎么变？精确做法是重新折现；但如果只知道 P、久期和凸性，可以用**泰勒展开**快速估计。这是 SOA 阅读材料 FM-24-17 的核心内容。'),
      M('P(i+\\Delta) \\approx P(i)\\bigl(1 - D_{mod}\\,\\Delta\\bigr)', '一阶（first-order modified）近似：用切线代替价格曲线。利率升 Δ，价格约跌 $D_{mod}\\Delta$ 的比例。'),
      M('P(i\') \\approx P(i)\\left(\\frac{1+i}{1+i\'}\\right)^{D_{mac}}', '一阶 Macaulay 近似：把整串现金流当作“在时刻 $D_{mac}$ 付一笔钱的零息债券”。对真正的零息债券，它是**精确**的。'),
      M('C = \\frac{P\'\'(i)}{P(i)}, \\qquad P(i+\\Delta) \\approx P(i)\\Bigl(1 - D_{mod}\\Delta + \\frac{C}{2}\\Delta^2\\Bigr)', '二阶近似：加上凸性（convexity）一项。$\\Delta^2 \\ge 0$，凸性又是正的，所以这一项总是往上修正。'),
      T(tl(10, [{ t: 10, amt: '1,000' }], { focal: 0, rate: 'i = 5% → 6%' }), '10 年零息债券：价格曲线是凸的（向上弯），切线永远在曲线下面。'),
      G({ n: 12, unit: '收益率 (%)', yMin: 400, curves: [{ label: '真实价格', f: y => { const j = y / 100; return 60 * (j ? (1 - (1 + j) ** -10) / j : 10) + 1000 * (1 + j) ** -10; }, tone: 'orange' }, { label: '一阶近似（切线）', f: y => 1000 * (1 - 7.3601 * (y / 100 - 0.06)), tone: 'ink', dash: true }] }, '10 年期、息票 6% 的债券，横轴是收益率。在 6% 处价格 1,000、修正久期约 7.36，切线就是一阶近似。拖动看看：离 6% 越远，切线越低于真实价格——这个差就是凸性补回来的部分。'),
      TABLE(['方法', '要用到', '误差'], [
        ['精确重算', '所有现金流', '无'],
        ['一阶 modified', '$P, D_{mod}$', '总是**低估**（切线在凸曲线下方）'],
        ['一阶 Macaulay', '$P, D_{mac}$', '通常比上一个准；零息债券完全准确'],
        ['二阶', '$P, D_{mod}, C$', '误差最小'],
      ]),
      TIP('Δ 要用小数：利率涨 50 个基点（basis points）是 Δ = 0.005。'),
    ],
    example: r => {
      const P0 = 1000 / 1.05 ** 10;
      return {
        text: '10 年期零息债券到期付 1,000，利率从 5% 升到 6%。比较两种一阶近似和精确值。',
        timeline: tl(10, [{ t: 10, amt: '1,000' }], { focal: 0, rate: 'i = 5% → 6%' }),
        vars: { i: 0.05 },
        steps: [
          expr('现在（5%）的价格 P =', { target: P0, model: '1000v^10', anim: [{ do: 'move', from: 10, to: 0, label: '×1.05⁻¹⁰', result: P0 }] }),
          expr('一阶 modified 近似：$P(1 - D_{mod}\\Delta)$，$D_{mod} = 10/1.05$，$\\Delta = 0.01$', { target: P0 * (1 - (10 / 1.05) * 0.01), model: '1000v^10(1 - 10/(1+i)*0.01)', anim: [{ do: 'note', t: 3, y: 64, text: `切线 ${money(P0 * (1 - (10 / 1.05) * 0.01))}` }], why: '约 555.45。' }),
          expr('一阶 Macaulay 近似：$P\\,(1.05/1.06)^{10}$ =', { target: P0 * (1.05 / 1.06) ** 10, model: '1000v^10(1.05/1.06)^10', anim: [{ do: 'note', t: 3, y: 100, text: `Mac ${money(P0 * (1.05 / 1.06) ** 10)}` }], why: '约 558.39，正好等于 $1000/1.06^{10}$。' }),
          choice('哪一个和精确值完全一样？', [
            ['Macaulay 近似', true],
            ['modified 近似', false, '切线近似总有误差，而且偏低。'],
            ['两个都不一样', false, '把 $1000v^{10}$ 乘 $(1.05/1.06)^{10}$，正好变成 $1000/1.06^{10}$。'],
          ], { anim: [{ do: 'note', t: 6.5, y: 100, text: '精确 = Mac ✓' }] }),
        ],
      };
    },
    drills: [
      {
        id: 'alm-approx-first',
        zh: '一阶近似：modified 与 Macaulay',
        gen: r => {
          const i = pick(r, [0.04, 0.05, 0.06, 0.08]), D = round(int(r, 30, 120) / 10, 1);
          const Pr = pick(r, [850, 920, 1000, 1050, 1100]);
          const dl = pick(r, [-0.01, -0.005, 0.005, 0.01]);
          const ip = round(i + dl, 4);
          return {
            text: `在利率 ${pct(i)} 下，某债券价格 ${money(Pr, 0)}，Macaulay 久期 ${D}。利率变成 ${pct(ip)}，估计新价格。`,
            vars: { i },
            steps: [
              choice('价格会怎样变？', ip > i
                ? [['下跌', true], ['上涨', false, '利率上升，未来现金流折得更狠，价格下跌。'], ['不变', false]]
                : [['上涨', true], ['下跌', false, '利率下降，未来现金流的现值变大。'], ['不变', false]]),
              expr('一阶 modified 近似：', { target: Pr * (1 - (D / (1 + i)) * (ip - i)), model: `${Pr}(1 - ${D}/(1+i)*(${ip} - i))`, hint: '$D_{mod} = D_{mac}/(1+i)$，$\\Delta = i\' - i$。' }),
              expr('一阶 Macaulay 近似：', { target: Pr * ((1 + i) / (1 + ip)) ** D, model: `${Pr}((1+i)/(1+${ip}))^${D}`, hint: '$P\\,\\bigl((1+i)/(1+i\')\\bigr)^{D_{mac}}$。' }),
            ],
          };
        },
      },
      {
        id: 'alm-approx-second',
        zh: '加上凸性的二阶近似',
        gen: r => {
          const Pr = pick(r, [1000, 2000, 5000]), Dm = round(int(r, 30, 100) / 10, 1);
          const C = round(Dm * Dm + int(r, 5, 40), 1);
          const dl = pick(r, [-0.02, -0.01, 0.01, 0.02]);
          const first = Pr * (1 - Dm * dl), second = Pr * (1 - Dm * dl + (C / 2) * dl * dl);
          return {
            text: `组合价值 ${money(Pr, 0)}，修正久期 ${Dm}，凸性 ${C}。利率${dl > 0 ? '上升' : '下降'} ${pct(Math.abs(dl))}。`,
            vars: {},
            steps: [
              expr('只用久期的一阶近似：', { target: first, model: `${Pr}(1 - ${Dm}*(${dl}))` }),
              expr('加上凸性的二阶近似：', { target: second, model: `${Pr}(1 - ${Dm}*(${dl}) + ${C}/2*(${dl})^2)`, hint: '多出一项 $\\tfrac{C}{2}\\Delta^2$，注意 $\\Delta$ 要用小数。' }),
              choice('凸性项把估计值往哪边修？', [
                ['往上（无论利率涨还是跌）', true],
                ['利率涨时往下，跌时往上', false, '$\\Delta^2$ 永远非负，正凸性让修正永远向上。'],
                ['往下（无论利率涨还是跌）', false, '凸性为正、$\\Delta^2 \\ge 0$，这一项是加上去的。'],
              ]),
            ],
          };
        },
      },
      {
        id: 'alm-approx-compare',
        zh: '近似值和精确值比一比',
        gen: r => {
          const i = pick(r, [0.04, 0.05, 0.06, 0.08]);
          const t1 = int(r, 1, 3), t2 = t1 + int(r, 2, 5);
          const flows = [{ t: t1, amt: pick(r, [500, 1000, 2000]) }, { t: t2, amt: pick(r, [1000, 2000, 3000]) }];
          const dl = pick(r, [-0.01, 0.01, 0.02]);
          const ip = round(i + dl, 4), g = round(1 + ip, 4);
          const P0 = pv(flows, i), Dm = modD(flows, i), exact = pv(flows, ip);
          const approx = P0 * (1 - Dm * dl);
          const [a, b] = flows;
          return {
            text: `利率 ${pct(i)}。第 ${t1} 年末收 ${money(a.amt, 0)}，第 ${t2} 年末收 ${money(b.amt, 0)}。利率变成 ${pct(ip)}。`,
            timeline: tl(t2, tlFlows(flows), { focal: 0, rate: `i = ${pct(i)} → ${pct(ip)}` }),
            vars: { i },
            steps: [
              expr('修正久期 $D_{mod} = \\sum t\\,C_t v^{t+1} / P$ =', { target: Dm, model: `(${t1}*${a.amt}v^${t1 + 1} + ${t2}*${b.amt}v^${t2 + 1})/(${pvModel(flows)})`, unit: 'number', hint: '也可以先算 Macaulay 久期再乘 v。' }),
              expr(`新利率下的精确价格（直接用 ${g} 折现）：`, { target: exact, model: `${a.amt}/${g}^${t1} + ${b.amt}/${g}^${t2}` }),
              choice('一阶 modified 近似 $P(1 - D_{mod}\\Delta)$ 和精确值相比：', [
                ['偏低（低估了新价格）', approx < exact],
                ['偏高（高估了新价格）', approx > exact, '价格曲线向上弯，切线在它下面。'],
                ['完全相等', false, '只有一阶的近似会忽略曲线的弯曲。'],
              ], { why: '正的现金流，价格–利率曲线是凸的；不管利率往哪边动，切线都在曲线下方。' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'alm-convexity',
    en: 'Convexity',
    zh: '凸性：付款时间有多“散”',
    outcome: '5b',
    learn: [
      P('久期是价格曲线的斜率（相对），**凸性**是它的弯曲程度。两串现金流久期相同，凸性大的那一串：利率跌时涨得更多，利率涨时跌得更少。'),
      M('C = \\frac{P\'\'(i)}{P(i)} = \\frac{\\sum_t t(t+1)\\, C_t\\, v^{t+2}}{\\sum_t C_t v^t}', '对 $C_t(1+i)^{-t}$ 求两次导：$t(t+1)C_t(1+i)^{-t-2}$。这是二阶近似里用的“修正凸性”。'),
      M('C_{mac} = \\frac{\\sum_t t^2\\, C_t v^t}{\\sum_t C_t v^t}, \\qquad C = \\frac{C_{mac} + D_{mac}}{(1+i)^2}', 'Macaulay 凸性：付款时间平方的现值加权平均。两种凸性可以互相换算。'),
      M('C_{mac} - D_{mac}^2 = \\sum_t w_t\\,(t - D_{mac})^2 \\;\\ge\\; 0', '统计里的方差！把 $w_t$ 当成概率，$D_{mac}$ 是付款时间的均值，$C_{mac}$ 是二阶矩。付款越分散，方差越大，凸性越大。'),
      T(tl(10, [{ t: 2, amt: 'A' }, { t: 5, amt: 'B' }, { t: 8, amt: 'A' }], { focal: 0 }), '久期都是 5：只在 t = 5 付钱（集中，bullet）凸性最小；分到 t = 2 和 t = 8（分散，barbell）凸性更大。'),
      TABLE(['现金流', '$C_{mac}$', '$C$（修正）'], [['零息，n 年', '$n^2$', '$n(n+1)v^2$'], ['两笔、现值各占一半，在 $T\\pm k$', '$T^2 + k^2$', '—']]),
      TIP('零息债券的 Macaulay 凸性 = 久期²：方差为 0。同样久期下，它的凸性最小。'),
    ],
    example: r => ({
      text: '利率 5%。第 1 年末和第 3 年末各收 100。求 Macaulay 久期、Macaulay 凸性，并和久期² 比较。',
      timeline: tl(3, [{ t: 1, amt: '100' }, { t: 3, amt: '100' }], { focal: 0, rate: 'i = 5%' }),
      vars: { i: 0.05 },
      steps: [
        expr('$D_{mac}$ =', { target: (100 / 1.05 + 300 / 1.05 ** 3) / (100 / 1.05 + 100 / 1.05 ** 3), model: '(1*100v + 3*100v^3)/(100v + 100v^3)', unit: 'number', anim: [{ do: 'move', from: 1, to: 0, label: '×v' }, { do: 'move', from: 3, to: 0, label: '×v³' }, { do: 'note', t: 1.9512, y: 126, text: '▼' }, { do: 'note', t: 1.9512, y: 100, text: 'D ≈ 1.95' }] }),
        expr('$C_{mac}$ =（时刻换成时刻的平方）', { target: (100 / 1.05 + 900 / 1.05 ** 3) / (100 / 1.05 + 100 / 1.05 ** 3), model: '(1*100v + 9*100v^3)/(100v + 100v^3)', unit: 'number', anim: [{ do: 'note', t: 1.3, y: 70, text: '1² = 1' }, { do: 'note', t: 2.65, y: 70, text: '3² = 9' }], why: '约 4.81。' }),
        choice('$C_{mac}$ 和 $D_{mac}^2$（约 3.81）哪个大？', [
          ['$C_{mac}$ 更大，差的是付款时间的方差', true],
          ['一样大', false, '只有单笔付款时才相等。'],
          ['$D_{mac}^2$ 更大', false, '二阶矩 ≥ 均值²，方差不会是负的。'],
        ], { anim: [{ do: 'note', t: 2, y: 36, text: '差 = 方差' }] }),
      ],
    }),
    drills: [
      {
        id: 'alm-conv-zero',
        zh: '零息债券的凸性',
        gen: r => {
          const i = pick(r, RATES), n = int(r, 2, 20);
          return {
            text: `一张 ${n} 年期零息债券，利率 ${pct(i)}。`,
            timeline: tl(n, [{ t: n, amt: 'F' }], { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr('Macaulay 凸性 $C_{mac}$ =', { target: n * n, model: `${n}^2`, unit: 'number', hint: '只有一个时刻 t = ' + n + '，权重 100%。' }),
              expr('修正凸性 $C = P\'\'/P$ =', { target: n * (n + 1) / (1 + i) ** 2, model: `${n}(${n}+1)v^2`, unit: 'number', hint: '$P = Fv^n$，求两次导得 $n(n+1)Fv^{n+2}$。' }),
            ],
          };
        },
      },
      {
        id: 'alm-conv-flows',
        zh: '两笔现金流的凸性',
        gen: r => {
          const i = pick(r, RATES);
          const t1 = int(r, 1, 3), t2 = t1 + int(r, 1, 5);
          const flows = [{ t: t1, amt: pick(r, [100, 200, 500]) }, { t: t2, amt: pick(r, [100, 300, 1000]) }];
          const [a, b] = flows;
          return {
            text: `利率 ${pct(i)}。第 ${t1} 年末收 ${a.amt}，第 ${t2} 年末收 ${b.amt}。`,
            timeline: tl(t2, tlFlows(flows), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr('Macaulay 凸性 $C_{mac}$ =', { target: macC(flows, i), model: `(${t1 * t1}*${a.amt}${vpow(t1)} + ${t2 * t2}*${b.amt}${vpow(t2)})/(${pvModel(flows)})`, unit: 'number', hint: '和久期一样，只是 t 换成 $t^2$。' }),
              expr('修正凸性 $C$ =', { target: modC(flows, i), model: `(${t1 * (t1 + 1)}*${a.amt}v^${t1 + 2} + ${t2 * (t2 + 1)}*${b.amt}v^${t2 + 2})/(${pvModel(flows)})`, unit: 'number', hint: '分子每项是 $t(t+1)C_t v^{t+2}$。' }),
            ],
          };
        },
      },
      {
        id: 'alm-conv-spread',
        zh: '同样久期，谁的凸性大',
        gen: r => {
          const T0 = int(r, 4, 12), k = int(r, 1, Math.min(4, T0 - 1));
          return {
            text: `组合 A：只在第 ${T0} 年末付一笔。组合 B：在第 ${T0 - k} 年末和第 ${T0 + k} 年末各付一笔，两笔的**现值各占一半**。两者的 Macaulay 久期都是 ${T0}。`,
            timeline: tl(T0 + k, [{ t: T0 - k, amt: 'B' }, { t: T0, amt: 'A' }, { t: T0 + k, amt: 'B' }], { focal: 0 }),
            vars: {},
            steps: [
              expr('B 的 Macaulay 凸性 =（权重各 1/2）', { target: ((T0 - k) ** 2 + (T0 + k) ** 2) / 2, model: `((${T0 - k})^2 + (${T0 + k})^2)/2`, unit: 'number', hint: '$\\sum w_t t^2$。' }),
              choice('哪个组合凸性更大？', [
                ['B：付款更分散', true],
                ['A：付款集中', false, `A 的 $C_{mac} = ${T0}^2 = ${T0 * T0}$，方差为 0，是同久期里最小的。`],
                ['一样大，因为久期一样', false, '久期一样只说明均值一样；凸性还看方差。'],
              ], { why: `B 比 A 多出的正好是方差 $k^2 = ${k * k}$。` }),
            ],
          };
        },
      },
      {
        id: 'alm-conv-rel',
        zh: 'Macaulay 凸性 → 修正凸性',
        gen: r => {
          const i = pick(r, RATES), D = int(r, 3, 9), Cm = D * D + int(r, 1, 12);
          return {
            text: `利率 ${pct(i)} 下，某组合 $D_{mac} = ${D}$，$C_{mac} = ${Cm}$。求修正凸性 $C = P''/P$。`,
            vars: { i },
            steps: [
              choice('用哪个关系？', [
                ['$C = (C_{mac} + D_{mac})/(1+i)^2$', true],
                ['$C = C_{mac}/(1+i)$', false, '求两次导，会出现 $v^2$，而且 $t(t+1) = t^2 + t$ 多出一个 $D_{mac}$。'],
                ['$C = C_{mac} - D_{mac}^2$', false, '那是付款时间的方差。'],
              ]),
              expr('C =', { target: (Cm + D) / (1 + i) ** 2, model: `(${Cm} + ${D})/(1+i)^2`, unit: 'number' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'alm-redington',
    en: 'Redington and full immunization',
    zh: '免疫：让资产跟着负债一起变',
    outcome: '5c',
    learn: [
      P('保险公司或养老金手里有未来要付的**负债**（liabilities），用今天买的**资产**（assets）来对付。利率一变，两边的现值都会变；**免疫**（immunization）就是安排资产，让利率小幅变动时，盈余 $S(i) = PV_A(i) - PV_L(i)$ 不会变成负数。'),
      M('\\text{Redington:}\\quad PV_A = PV_L,\\qquad D_A = D_L \\;(\\Leftrightarrow PV_A\' = PV_L\'),\\qquad C_A > C_L', '三个条件：现值相等（S = 0）；久期相等（S 的斜率 = 0）；资产凸性更大（S 向上弯）。于是在当前利率附近 S 是一个最小值 0，利率小幅变动 S ≥ 0。'),
      T(tl(8, [{ t: 3, amt: 'A' }, { t: 5, amt: 'L', side: 'down' }, { t: 8, amt: 'B' }], { focal: 0, rate: 'i' }), '负债在 t = 5；资产一笔放在之前（t = 3），一笔放在之后（t = 8）：这就是 full immunization 的标准结构。'),
      M('\\text{Full immunization（单笔负债 L 在 T）：}\\; PV_A = PV_L,\\; D_A = D_L,\\; \\text{资产一笔在 } T-a,\\ \\text{一笔在 } T+b', '满足这三条时，**无论利率怎样变**（一次性平移），盈余都 ≥ 0，比 Redington 的“小幅变动”更强。'),
      M('A\\,v^{T-a} = \\frac{b}{a+b}\\,L v^T,\\qquad B\\,v^{T+b} = \\frac{a}{a+b}\\,L v^T', '两条方程：$X + Y = Lv^T$（现值），$(T-a)X + (T+b)Y = T\\cdot Lv^T$（久期）。解出：离负债**远**的那一笔分到的现值**少**，像跷跷板一样平衡在 T。'),
      TERMS([
        ['surplus', '盈余', '$PV_A - PV_L$'],
        ['Redington immunization', 'Redington 免疫', '对小幅利率变化保护'],
        ['full immunization', '完全免疫', '单笔负债，对任意平移保护'],
      ]),
      RECIPE('解免疫题', ['写出负债现值 $Lv^T$ 和久期 T', '设资产在两侧，按“跷跷板”分配现值：$X = \\frac{b}{a+b}Lv^T$，$Y = \\frac{a}{a+b}Lv^T$', '把现值换回面额：X 往后搬 T−a 年，Y 往后搬 T+b 年', '检查凸性：资产分在两侧，凸性自动大于负债']),
      TIP('只用一张在 T 到期的零息债券也能做到现值和久期相等，但凸性一样大，不满足 Redington 的严格不等式；而且那其实就是完全匹配。'),
    ],
    example: r => {
      const i = 0.05, L = 10000;
      return {
        text: '利率 5%。第 6 年末要付 10,000。用两张零息债券免疫：一张第 4 年末到期（面额 A），一张第 9 年末到期（面额 B）。',
        timeline: tl(9, [{ t: 4, amt: 'A' }, { t: 6, amt: '10,000', side: 'down' }, { t: 9, amt: 'B' }], { focal: 0, rate: 'i = 5%' }),
        vars: { i },
        steps: [
          choice('A 在负债前 2 年，B 在负债后 3 年。谁分到的**现值**更多？', [
            ['A，占 3/5', true],
            ['B，占 3/5', false, '跷跷板：离支点远的一边要轻一些。B 更远，所以 B 占 2/5。'],
            ['一样多', false, '两边距离不同，一样多的话平均时间会偏离 6。'],
          ], { hint: '要求 $-2X + 3Y = 0$。', anim: [{ do: 'note', t: 5, y: 186, text: '← 2 年' }, { do: 'note', t: 7.5, y: 186, text: '3 年 →' }, { do: 'note', t: 2.3, y: 92, text: 'A 占 3/5' }] }),
          expr('A =（A 的现值 = (3/5)·10000v⁶，再往后搬 4 年）', { target: L * 0.6 / (1 + i) ** 2, model: '10000*3/5*v^2', anim: [{ do: 'move', from: 6, to: 4, label: '×v²', tone: 'ink', result: L * 0.6 / (1 + i) ** 2 }], hint: '$A v^4 = \\tfrac35 \\cdot 10000 v^6$，所以 $A = 6000v^2$。' }),
          expr('B =', { target: L * 0.4 * (1 + i) ** 3, model: '10000*2/5*(1+i)^3', anim: [{ do: 'move', from: 6, to: 9, label: '×1.05³', tone: 'ink', result: L * 0.4 * (1 + i) ** 3 }, { do: 'answer', t: 9, value: L * 0.4 * (1 + i) ** 3 }], hint: '$B v^9 = \\tfrac25 \\cdot 10000 v^6$，所以 $B = 4000(1+i)^3$。' }),
          choice('凸性条件满足吗？', [
            ['满足：资产在负债两侧，比负债更分散', true],
            ['不满足：还要另外调整', false, '负债是单笔，Macaulay 凸性 = 36；资产的是 36 + 方差 > 36。'],
          ], { anim: [{ do: 'note', t: 6, y: 52, text: '两侧分散 ✓' }] }),
        ],
      };
    },
    drills: [
      {
        id: 'alm-red-full',
        zh: '用两张零息债券完全免疫',
        gen: r => {
          const i = pick(r, RATES), L = pick(r, [10000, 20000, 50000]), T0 = int(r, 4, 10);
          const a = int(r, 1, 3), b = int(r, 1, 3);
          const A = L * b / (a + b) / (1 + i) ** a, B = L * a / (a + b) * (1 + i) ** b;
          return {
            text: `利率 ${pct(i)}。第 ${T0} 年末要付 ${money(L, 0)}。买第 ${T0 - a} 年末到期的零息债券（面额 A）和第 ${T0 + b} 年末到期的零息债券（面额 B）来完全免疫。`,
            timeline: tl(T0 + b, [{ t: T0 - a, amt: 'A' }, { t: T0, amt: money(L, 0), side: 'down' }, { t: T0 + b, amt: 'B' }], { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr('负债的现值：', { target: L / (1 + i) ** T0, model: `${L}v^${T0}` }),
              choice('A 的现值占负债现值的比例：', a === b
                ? [['$1/2$', true], ['$1/3$', false, '两边距离一样，应该各占一半。'], ['$2/3$', false, '两边距离一样，应该各占一半。']]
                : [
                    [`$${b}/${a + b}$`, true],
                    [`$${a}/${a + b}$`, false, '反了：离负债近的那张分到更多。'],
                    ['$1/2$', false, '只有两边距离相等时才各占一半。'],
                  ], { hint: `久期条件：$-${a}X + ${b}Y = 0$。` }),
              expr('A =', { target: A, model: `${L}*${b}/${a + b}*v^${a}`, hint: `$A v^{${T0 - a}} = \\tfrac{${b}}{${a + b}}\\,${L} v^{${T0}}$。` }),
              expr('B =', { target: B, model: `${L}*${a}/${a + b}*(1+i)^${b}`, hint: `$B v^{${T0 + b}} = \\tfrac{${a}}{${a + b}}\\,${L} v^{${T0}}$。` }),
            ],
          };
        },
      },
      {
        id: 'alm-red-check',
        zh: '这个组合免疫了吗',
        gen: r => {
          const T0 = int(r, 5, 10), a = int(r, 1, 3), b = int(r, 1, 3) + (a === 1 ? 1 : 0);
          const n = a + b, m = pick(r, [1, 2, 5]);
          const tot = 100 * n * m;
          const good = r() < 0.5;
          let k = b;
          if (!good) { const ks = []; for (let q = 1; q < n; q++) if (q !== b) ks.push(q); k = pick(r, ks); }
          const X = (tot / n) * k, Y = tot - X;
          const DA = ((T0 - a) * X + (T0 + b) * Y) / tot;
          const rel = DA > T0 + 1e-9 ? 'long' : DA < T0 - 1e-9 ? 'short' : 'eq';
          return {
            text: `负债：第 ${T0} 年末一笔，现值 ${money(tot, 0)}。资产：第 ${T0 - a} 年末到期的零息债券现值 ${money(X, 0)}，第 ${T0 + b} 年末到期的零息债券现值 ${money(Y, 0)}。`,
            timeline: tl(T0 + b, [{ t: T0 - a, amt: `PV ${X}` }, { t: T0, amt: `PV ${tot}`, side: 'down' }, { t: T0 + b, amt: `PV ${Y}` }], { focal: 0 }),
            vars: {},
            steps: [
              expr('资产的 Macaulay 久期 $D_A$ =', { target: DA, model: `(${T0 - a}*${X} + ${T0 + b}*${Y})/(${X} + ${Y})`, unit: 'number', hint: '用给出的现值做权重。' }),
              choice(`和负债久期 ${T0} 相比：`, [
                ['相等', rel === 'eq'],
                ['资产久期更长', rel === 'long'],
                ['资产久期更短', rel === 'short'],
              ]),
              choice('Redington 免疫成立吗？', [
                ['成立（而且是 full immunization）', good],
                ['不成立：久期不匹配', !good, '现值相等、资产也在两侧，但久期必须相等。'],
                ['不成立：现值不相等', false, `${X} + ${Y} = ${tot}，现值是相等的。`],
              ]),
            ],
          };
        },
      },
      {
        id: 'alm-red-dl',
        zh: '两笔负债：一张零息债券够不够',
        gen: r => {
          const i = pick(r, RATES), t1 = int(r, 1, 4), t2 = t1 + int(r, 2, 6);
          const flows = [{ t: t1, amt: pick(r, [1000, 2000, 5000]) }, { t: t2, amt: pick(r, [1000, 3000, 5000]) }];
          return {
            text: `利率 ${pct(i)}。负债：第 ${t1} 年末付 ${money(flows[0].amt, 0)}，第 ${t2} 年末付 ${money(flows[1].amt, 0)}。`,
            timeline: tl(t2, flows.map(f => ({ t: f.t, amt: money(f.amt, 0), side: 'down' })), { focal: 0, rate: `i = ${pct(i)}` }),
            vars: { i },
            steps: [
              expr('负债现值 $PV_L$ =', { target: pv(flows, i), model: pvModel(flows) }),
              expr('负债久期 $D_L$ =', { target: macD(flows, i), model: durModel(flows), unit: 'number' }),
              choice(`只买一张在时刻 $D_L$ 到期、现值等于 $PV_L$ 的零息债券。Redington 条件：`, [
                ['不满足：资产凸性小于负债凸性', true],
                ['满足：三个条件都成立', false, `零息债券的 $C_{mac} = D_L^2$，而负债分散在 ${t1} 和 ${t2}，$C_{mac} > D_L^2$。`],
                ['不满足：久期不匹配', false, '它就放在 $D_L$ 处，久期正好相等。'],
              ], { why: '资产必须比负债“更分散”。一张零息债券是最集中的，所以凸性条件失败。' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'alm-match',
    en: 'Exact (cash-flow) matching',
    zh: '完全匹配：每一笔负债都由到期的钱付',
    outcome: '5c',
    learn: [
      P('免疫是“现值和久期对上”；**完全匹配**（exact matching / cash-flow matching / dedication）更直接：买一批债券，使得**每个付款日**收到的钱正好等于当天要付的钱。这样无论利率怎样变，都不需要再投资或卖出。'),
      TERMS([
        ['exact matching', '完全匹配', '每期资产现金流 = 负债现金流'],
        ['coupon bond', '附息债券', '每年付票息，到期付面值 + 最后一次票息'],
        ['cost of the portfolio', '组合成本', '买入所有债券的价格之和'],
      ]),
      M('x_n = \\frac{L_n}{F + c_n}, \\qquad x_{t} = \\frac{L_t - (\\text{更长债券在 } t \\text{ 付的票息})}{F + c_t}', '从**最后一笔**负债往前倒推：最长的债券只有它能在最后那天付钱，先定它的数量；它在前面每年的票息会帮忙付前面的负债。'),
      T(tl(2, [{ t: 1, amt: '5,000', side: 'down' }, { t: 2, amt: '10,600', side: 'down' }], { focal: 0 }), '第 2 年末要 10,600：买 2 年期 6% 债券（每 100 面值到期付 106），买 100 份。它第 1 年还付 600 票息，剩下 4,400 用 1 年期零息债券补上。'),
      RECIPE('倒推法', ['最后一年：用最长的债券，份数 = 负债 ÷ 每份到期付的钱', '往前一年：扣掉已买债券当年的票息，剩下的用次长的债券补', '一直推到第 1 年', '成本 = 每种债券份数 × 每份价格，加起来']),
      TABLE(['', '完全匹配', '免疫'], [['利率变化', '完全不怕', '小幅（或单笔负债时任意平移）'], ['再平衡', '不需要', '需要定期调整'], ['成本', '通常更贵', '更灵活、更便宜']]),
      TIP('债券份数可以是小数：题目一般允许买“部分”债券。'),
    ],
    example: r => ({
      text: '负债：第 1 年末 5,000，第 2 年末 10,600。市场上有：2 年期债券，面值 100、年票息 6，价格 101.50；1 年期零息债券，面值 100，价格 96.00。求完全匹配的成本。',
      timeline: tl(2, [{ t: 1, amt: '5,000', side: 'down' }, { t: 2, amt: '10,600', side: 'down' }], { focal: 0 }),
      vars: {},
      steps: [
        choice('先定哪种债券的数量？', [
          ['2 年期附息债券：只有它能付第 2 年', true],
          ['1 年期零息债券：先满足近的负债', false, '1 年期的钱到不了第 2 年。必须从最后一笔倒推。'],
        ], { anim: [{ do: 'note', t: 1.75, text: '先定这里' }] }),
        expr('2 年期债券买几份？', { target: 100, model: '10600/106', unit: 'number', anim: [{ do: 'note', t: 1.72, y: 186, text: '100 份' }], hint: '每份第 2 年末付 100 + 6 = 106。' }),
        expr('第 1 年还缺多少，要用零息债券补（面值）？', { target: 4400, model: '5000 - 100*6', anim: [{ do: 'drop', t: 1, amt: '票息 600' }, { do: 'note', t: 1.3, y: 100, text: '缺 4,400' }], hint: '100 份 × 每份票息 6 = 600 已经到手。' }),
        expr('总成本 =', { target: 100 * 101.5 + 44 * 96, model: '100*101.5 + 4400/100*96', anim: [{ do: 'move', from: 2, to: 0, label: '10,150', resultText: '10,150' }, { do: 'move', from: 1, to: 0, label: '4,224', resultText: '10,150 + 4,224' }], why: '$10150 + 4224 = 14374$。' }),
      ],
    }),
    drills: [
      {
        id: 'alm-match-two',
        zh: '两年负债的完全匹配',
        gen: r => {
          const c2 = pick(r, [4, 5, 6, 8]), x2 = pick(r, [50, 100, 200]), z = 100 * int(r, 10, 60);
          const L2 = x2 * (100 + c2), L1 = x2 * c2 + z;
          const P2 = pick(r, [98.4, 99.6, 101.2, 102.5, 103.8]), P1 = pick(r, [94.3, 95.2, 96.1, 97.0]);
          return {
            text: `负债：第 1 年末 ${money(L1, 0)}，第 2 年末 ${money(L2, 0)}。2 年期债券面值 100、年票息 ${c2}，价格 ${P2}；1 年期零息债券面值 100，价格 ${P1}。`,
            timeline: tl(2, [{ t: 1, amt: money(L1, 0), side: 'down' }, { t: 2, amt: money(L2, 0), side: 'down' }], { focal: 0 }),
            vars: {},
            steps: [
              expr('2 年期债券的份数：', { target: x2, model: `${L2}/${100 + c2}`, unit: 'number', hint: `每份到期付 100 + ${c2}。` }),
              expr('需要多少面值的 1 年期零息债券？', { target: z, model: `${L1} - ${x2}*${c2}` }),
              expr('总成本：', { target: x2 * P2 + (z / 100) * P1, model: `${x2}*${P2} + ${z}/100*${P1}`, hint: '零息债券价格是“每 100 面值”的。' }),
            ],
          };
        },
      },
      {
        id: 'alm-match-three',
        zh: '三年负债：一路倒推',
        gen: r => {
          const c3 = pick(r, [5, 6, 8]), c2 = pick(r, [4, 5, 7]);
          const x3 = pick(r, [50, 100, 200]), x2 = pick(r, [50, 100, 150]), z = 100 * int(r, 5, 40);
          const L3 = x3 * (100 + c3), L2 = x3 * c3 + x2 * (100 + c2), L1 = x3 * c3 + x2 * c2 + z;
          const P3 = pick(r, [99.1, 101.7, 104.2]), P2 = pick(r, [98.6, 100.4, 102.3]), P1 = pick(r, [95.0, 96.2, 97.1]);
          return {
            text: `负债：第 1、2、3 年末分别 ${money(L1, 0)}、${money(L2, 0)}、${money(L3, 0)}。可用：3 年期债券（年票息 ${c3}，价格 ${P3}）、2 年期债券（年票息 ${c2}，价格 ${P2}）、1 年期零息债券（价格 ${P1}），面值都是 100。`,
            timeline: tl(3, [{ t: 1, amt: money(L1, 0), side: 'down' }, { t: 2, amt: money(L2, 0), side: 'down' }, { t: 3, amt: money(L3, 0), side: 'down' }], { focal: 0 }),
            vars: {},
            steps: [
              expr('3 年期债券份数：', { target: x3, model: `${L3}/${100 + c3}`, unit: 'number' }),
              expr('2 年期债券份数：', { target: x2, model: `(${L2} - ${x3}*${c3})/${100 + c2}`, unit: 'number', hint: '第 2 年先扣掉 3 年期债券的票息。' }),
              expr('1 年期零息债券面值：', { target: z, model: `${L1} - ${x3}*${c3} - ${x2}*${c2}`, hint: '第 1 年，两种附息债券都在付票息。' }),
              expr('总成本：', { target: x3 * P3 + x2 * P2 + (z / 100) * P1, model: `${x3}*${P3} + ${x2}*${P2} + ${z}/100*${P1}` }),
            ],
          };
        },
      },
      {
        id: 'alm-match-zeros',
        zh: '用零息债券匹配：成本就是按即期利率折现',
        gen: r => {
          const s1 = pick(r, [0.02, 0.03, 0.04]), s2 = round(s1 + pick(r, [0.005, 0.01]), 4), s3 = round(s2 + pick(r, [0, 0.005, 0.01]), 4);
          const L = [pick(r, [1000, 2000, 3000]), pick(r, [2000, 4000, 5000]), pick(r, [5000, 8000, 10000])];
          const cost = L[0] / (1 + s1) + L[1] / (1 + s2) ** 2 + L[2] / (1 + s3) ** 3;
          return {
            text: `负债：第 1、2、3 年末分别 ${money(L[0], 0)}、${money(L[1], 0)}、${money(L[2], 0)}。市场上 t 年期零息债券的价格由即期利率 $s_1 = ${pct(s1)}$、$s_2 = ${pct(s2)}$、$s_3 = ${pct(s3)}$ 决定。用零息债券完全匹配。`,
            timeline: tl(3, L.map((x, k) => ({ t: k + 1, amt: money(x, 0), side: 'down' })), { focal: 0, rate: 's₁, s₂, s₃' }),
            vars: { s1, s2, s3 },
            steps: [
              choice('第 2 年末的负债用什么付？', [
                [`面值 ${money(L[1], 0)} 的 2 年期零息债券`, true],
                ['1 年期零息债券到期后再投资 1 年', false, '那要承担再投资利率的风险，不是完全匹配。'],
                [`面值 ${money(L[2], 0)} 的 3 年期零息债券`, false, '它在第 3 年才付钱。'],
              ]),
              expr('总成本 =（用 s1、s2、s3）', { target: cost, model: `${L[0]}/(1+s1) + ${L[1]}/(1+s2)^2 + ${L[2]}/(1+s3)^3`, why: '用零息债券完全匹配的成本，就是负债按收益率曲线算出的现值。' }),
            ],
          };
        },
      },
    ],
  },
];

export default {
  id: 'alm',
  no: 5,
  en: 'General Cash Flows, Portfolios and Asset–Liability Management',
  zh: '现金流、组合与资产负债管理',
  weight: '20–30%',
  blurb: 'NPV 与收益率、收益率曲线、久期与凸性、免疫与完全匹配：让资产跟着负债走。',
  lessons,
};
