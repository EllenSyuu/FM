import { pick, int, pct, money, round, choice, expr, place, tl, flowsEvery, an, sn, P, M, T, TERMS, TIP, TABLE, RECIPE, G } from './kit.js';

/* Topic 4 — Bonds (SOA FM learning objectives 4a–4c). Valuation between coupon dates is
   not in the syllabus, so every date here is a coupon date. */

const FACES = [100, 1000, 5000, 10000];
const CPN = [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1];
const YLD = [0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1];

/* Coupon rate and yield that differ (so a bond is clearly at a premium or a discount). */
const rateAndYield = (r, prem) => {
  const want = prem === undefined ? r() < 0.5 : prem;
  const c = pick(r, CPN.filter(x => YLD.some(y => (want ? y < x : y > x))));
  return { c, j: pick(r, YLD.filter(y => (want ? y < c : y > c))) };
};

const bondFlows = (n, cpn, red) => [...flowsEvery(1, n, cpn), { t: n, amt: red, side: 'down' }];

/* Price at yield j of n coupons Fr then redemption C, by summing each payment. */
const price = (Fr, C, n, j) => {
  let s = 0;
  for (let t = 1; t <= n; t++) s += Fr / (1 + j) ** t;
  return s + C / (1 + j) ** n;
};

const lessons = [
  {
    id: 'bond-price',
    en: 'Bond vocabulary and price',
    zh: '债券：一串息票 + 一笔赎回',
    outcome: '4a · 4b',
    learn: [
      P('债券（bond）是一张借条：你今天付价格 P 买下它，发行人以后每期付你一笔**息票**（coupon），到期再还你一笔**赎回值**（redemption value）。对买家来说，它就是“一个年金 + 一笔到期付款”。'),
      TERMS([
        ['face / par value $F$', '面值', '写在债券上的金额，只用来算息票'],
        ['coupon rate $r$', '息票率', '每期息票 = $F \\times r$'],
        ['coupon $Fr$', '息票', '每期期末付给持有人的钱'],
        ['redemption value $C$', '赎回值', '到期时还的钱；没说就等于 F（redeemable at par）'],
        ['yield rate $j$', '收益率', '买家用来折现的利率，也就是买家实际赚到的利率'],
        ['term $n$', '期数', '还有几次息票'],
        ['price $P$', '价格', '按收益率折现的全部未来现金流'],
      ]),
      M('P = Fr\\,a_{\\angl{n}} + C\\,v^{n} \\qquad (\\text{at the yield } j)', '价格 = 息票年金的现值 + 赎回值的现值。所有 a 和 v 都按**收益率** j 算，不是息票率。'),
      T(tl(6, bondFlows(6, 'Fr', 'C'), { focal: 0, rate: 'j' }), '上面一排是 6 次息票 Fr，最后一期下面再多一笔赎回值 C。全部折回时刻 0 就是价格。'),
      TIP('息票率 r 只用来算息票的大小；折现永远用收益率 j。这是最常见的错误。'),
      P('**半年付息**（semiannual coupons）：美国债券通常半年付一次息。报价“息票率 8%，半年付息”的意思是每半年付 $F \\times 4\\%$；“收益率 6%（按半年复利）”就是每半年 3%。所以：期数乘 2，两个利率都除以 2。'),
      TABLE(
        ['报价', '每期息票', '每期收益率', '期数'],
        [
          ['年付息，r = 8%，j = 6%，10 年', '$0.08F$', '6%', '10'],
          ['半年付息，r = 8%，$j^{(2)}$ = 6%，10 年', '$0.04F$', '3%', '20'],
        ],
      ),
      RECIPE('求价格三步', ['每期息票 Fr（半年付息就用半年的息票率）', '每期收益率 j 和期数 n', '$P = Fr\\,a_{\\angl{n}} + C v^n$，全按 j 折现']),
    ],
    example: r => {
      const j = 0.06, F = 1000, rr = 0.08, n = 5;
      return {
        text: '面值 1,000 的 5 年期债券，息票率 8%（每年末付息），按面值赎回。收益率 6% 时价格是多少？',
        timeline: tl(5, bondFlows(5, '80', '1,000'), { focal: 0, rate: 'j = 6%' }),
        vars: { i: j },
        steps: [
          expr('第一步：每年的息票 Fr =', { target: F * rr, model: '1000*0.08', hint: '面值 × 息票率。' }),
          choice('第二步：折现用哪个利率？', [
            ['收益率 6%', true],
            ['息票率 8%', false, '息票率只决定每年付多少；买家按自己要求的收益率折现。'],
            ['两者的平均 7%', false, '没有这种做法。'],
          ]),
          expr('第三步：价格 P =（这里的 i 就是收益率 6%）', { target: price(80, 1000, 5, j), model: '80a(5) + 1000v^5', why: `$P = ${money(price(80, 1000, 5, j))}$，高于面值：息票给得比市场要求的多，买家愿意多付。` }),
        ],
      };
    },
    drills: [
      {
        id: 'bond-price-annual',
        zh: '年付息债券的价格',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r), n = int(r, 3, 20);
          const Fr = round(F * c, 2);
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}，每年末付息，${n} 年后按面值赎回。收益率 ${pct(j)}，价格是多少？`,
            timeline: tl(n, bondFlows(n, money(Fr, 0), money(F, 0)), { focal: 0, rate: `j = ${pct(j)}` }),
            vars: { i: j },
            steps: [
              expr('每年息票 Fr =', { target: Fr, model: `${F}*${c}` }),
              choice('价格的结构是：', [
                [`$${Fr}\\,a_{\\angl{${n}}} + ${F}v^{${n}}$，按 ${pct(j)}`, true],
                [`$${Fr}\\,a_{\\angl{${n}}} + ${F}v^{${n}}$，按 ${pct(c)}`, false, '用息票率折现，价格永远等于面值——那就不用算了。折现要用收益率。'],
                [`$${Fr}\\,a_{\\angl{${n}}}$，按 ${pct(j)}`, false, '漏了到期还的面值。'],
              ]),
              expr('价格 P =', { target: price(Fr, F, n, j), model: `${Fr}a(${n}) + ${F}v^${n}` }),
            ],
          };
        },
      },
      {
        id: 'bond-price-coupon',
        zh: '读懂报价：息票有多少',
        gen: r => {
          const F = pick(r, FACES), c = pick(r, CPN), semi = r() < 0.5;
          const cpn = semi ? (F * c) / 2 : F * c;
          const wrong = semi ? F * c : (F * c) / 2;
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}，${semi ? '每半年' : '每年'}付息一次。每次付多少息票？`,
            vars: {},
            steps: [
              choice('每次息票 =', [
                [`${money(cpn)}`, true],
                [`${money(wrong)}`, false, semi ? '半年付息时，报价的息票率是年率；每次只付一半。' : '每年只付一次，就是全年的息票。'],
                [`${money(F * c * 12)}`, false, '息票率是年率，不是月率。'],
              ]),
              expr('写出式子：', { target: cpn, model: semi ? `${F}*${c}/2` : `${F}*${c}` }),
            ],
          };
        },
      },
      {
        id: 'bond-price-semi',
        zh: '半年付息债券的价格',
        gen: r => {
          const F = pick(r, [1000, 5000, 10000]), c = pick(r, [0.04, 0.06, 0.08, 0.1]);
          const y = pick(r, [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1].filter(x => x !== c));
          const yrs = int(r, 3, 12), n = 2 * yrs, j = y / 2, Fr = (F * c) / 2;
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（半年付息），${yrs} 年到期，按面值赎回。收益率 ${pct(y)}（按半年复利）。价格是多少？`,
            timeline: n <= 30 ? tl(n, bondFlows(n, money(Fr, 0), money(F, 0)), { focal: 0, unit: 'half', rate: `j = ${pct(j)} / 半年` }) : undefined,
            vars: { i: j },
            steps: [
              choice('一共几期，每期收益率多少？', [
                [`${n} 期，每期 ${pct(j)}`, true],
                [`${yrs} 期，每期 ${pct(y)}`, false, '半年付息：期数要按半年数。'],
                [`${n} 期，每期 ${pct(y)}`, false, '收益率是按半年复利的名义年率，每期要除以 2。'],
              ]),
              expr('每期息票 =', { target: Fr, model: `${F}*${c}/2` }),
              expr(`价格 P =（这里 i 已经是每半年的 ${pct(j)}）`, { target: price(Fr, F, n, j), model: `${Fr}a(${n}) + ${F}v^${n}` }),
            ],
          };
        },
      },
      {
        id: 'bond-price-red',
        zh: '赎回值不等于面值',
        gen: r => {
          const F = 1000, C = pick(r, [1050, 1100, 1200]), c = pick(r, CPN), j = pick(r, YLD), n = int(r, 4, 15);
          const Fr = F * c;
          return {
            text: `面值 1,000，息票率 ${pct(c)}（每年付息），${n} 年后按 ${money(C, 0)} 赎回。收益率 ${pct(j)}，价格是多少？`,
            timeline: tl(n, bondFlows(n, money(Fr, 0), money(C, 0)), { focal: 0, rate: `j = ${pct(j)}` }),
            vars: { i: j },
            steps: [
              choice('息票按什么算？', [
                [`面值：$1000 \\times ${c}$`, true],
                [`赎回值：$${C} \\times ${c}$`, false, '息票永远是面值 × 息票率；赎回值只在到期时付一次。'],
              ]),
              expr('价格 P =', { target: price(Fr, C, n, j), model: `${Fr}a(${n}) + ${C}v^${n}` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'bond-premium',
    en: 'Premium and discount',
    zh: '溢价还是折价：息票和收益率谁大',
    outcome: '4b',
    learn: [
      P('把价格公式里的 $v^n$ 换成 $1 - j\\,a_{\\angl{n}}$（因为 $j\\,a_{\\angl{n}} = 1 - v^n$），就得到另一个非常有用的形式：'),
      M('P = C + (Fr - Cj)\\,a_{\\angl{n}}', '价格 = 赎回值 + “每期多给的息票”的现值。$Fr$ 是实际付的息票，$Cj$ 是“按收益率，C 本该带来的利息”，两者之差每期都有，共 n 期。'),
      TABLE(
        ['比较（C = F 时）', '$Fr - Cj$', '价格', '叫法'],
        [
          ['息票率 r > 收益率 j', '> 0', 'P > C', 'premium 溢价'],
          ['息票率 r = 收益率 j', '= 0', 'P = C', 'at par 平价'],
          ['息票率 r < 收益率 j', '< 0', 'P < C', 'discount 折价'],
        ],
      ),
      T(tl(5, bondFlows(5, 'Fr', 'C'), { focal: 0, rate: 'j' }), '把每期息票拆成两块：Cj（正好是 C 的“应得利息”）+ (Fr − Cj)（多出来或少给的部分）。C 加上 Cj 的年金，现值正好是 C。'),
      TERMS([
        ['premium', '溢价', '价格超过赎回值的部分 $P - C$'],
        ['discount', '折价', '赎回值超过价格的部分 $C - P$'],
        ['modified coupon rate $g = Fr/C$', '修正息票率', '按赎回值算的息票率；比较 g 和 j 即可判断'],
      ]),
      M('\\text{premium} = P - C = C(g - j)\\,a_{\\angl{n}} \\qquad g = \\frac{Fr}{C}', 'C ≠ F 时，判断标准是 g 和 j 谁大，而不是 r 和 j。'),
      TIP('息票给得比市场多 → 买家愿意多付 → 溢价。'),
    ],
    example: r => {
      const j = 0.05;
      return {
        text: '面值 1,000，息票率 7%（年付），10 年后按面值赎回，收益率 5%。用溢价公式求价格。',
        timeline: tl(10, bondFlows(10, '70', '1,000'), { focal: 0, rate: 'j = 5%' }),
        vars: { i: j },
        steps: [
          choice('这张债券是：', [
            ['溢价（premium）', true],
            ['折价（discount）', false, '息票率 7% > 收益率 5%，息票给得多，价格会高于面值。'],
            ['平价（par）', false, '只有息票率 = 收益率才平价。'],
          ]),
          expr('每期“多给”的息票 $Fr - Cj$ =', { target: 70 - 50, model: '70 - 1000i' }),
          expr('价格 P = C + (Fr − Cj)a_n =', { target: 1000 + 20 * an(10, j), model: '1000 + (70 - 1000i)a(10)', why: `溢价 ${money(20 * an(10, j))}，价格 ${money(1000 + 20 * an(10, j))}。` }),
        ],
      };
    },
    drills: [
      {
        id: 'bond-premium-classify',
        zh: '判断溢价 / 折价',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r), n = int(r, 3, 20);
          const prem = c > j;
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年后按面值赎回，收益率 ${pct(j)}。`,
            vars: { i: j },
            steps: [
              choice('这张债券以什么价格出售？', [
                ['溢价：价格 > 面值', prem, prem ? undefined : `息票率 ${pct(c)} < 收益率 ${pct(j)}：息票给得少，买家只肯少付。`],
                ['折价：价格 < 面值', !prem, prem ? `息票率 ${pct(c)} > 收益率 ${pct(j)}：息票给得多，买家愿意多付。` : undefined],
                ['平价：价格 = 面值', false, '息票率和收益率不相等，不会平价。'],
              ], { hint: '比较息票率和收益率。' }),
              expr(`${prem ? '溢价' : '折价'}金额 =`, {
                target: Math.abs(F * c - F * j) * an(n, j),
                model: prem ? `(${F * c} - ${F}i)a(${n})` : `(${F}i - ${round(F * c, 2)})a(${n})`,
                hint: prem ? '溢价 = $(Fr - Cj)\\,a_{\\angl{n}}$。' : '折价 = $(Cj - Fr)\\,a_{\\angl{n}}$。',
              }),
            ],
          };
        },
      },
      {
        id: 'bond-premium-both',
        zh: '两个公式算同一个价格',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r), n = int(r, 4, 20);
          const Fr = round(F * c, 2);
          const Pr = price(Fr, F, n, j);
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年，按面值赎回，收益率 ${pct(j)}。用两个公式各算一次价格。`,
            vars: { i: j },
            steps: [
              expr('基本公式 $Fr\\,a_{\\angl{n}} + Cv^n$：', { target: Pr, model: `${Fr}a(${n}) + ${F}v^${n}` }),
              expr('溢价公式 $C + (Fr - Cj)\\,a_{\\angl{n}}$：', { target: F + (Fr - F * j) * an(n, j), model: `${F} + (${Fr} - ${F}i)a(${n})` }),
              choice('为什么一样？', [
                ['因为 $v^n = 1 - j\\,a_{\\angl{n}}$', true],
                ['因为 $v^n = j\\,a_{\\angl{n}}$', false, '$j\\,a_{\\angl{n}} = 1 - v^n$，不是 $v^n$。'],
                ['数字凑巧', false, '这是恒等式，任何债券都成立。'],
              ], { why: `都是 ${money(Pr)}。` }),
            ],
          };
        },
      },
      {
        id: 'bond-premium-g',
        zh: '赎回值 ≠ 面值时怎么判断',
        gen: r => {
          const F = 1000, C = pick(r, [1100, 1200, 1250]), c = pick(r, [0.06, 0.07, 0.08, 0.09]);
          const g = (F * c) / C;
          const j = pick(r, [0.05, 0.06, 0.07, 0.08].filter(y => Math.abs(y - g) > 0.003 && y !== c));
          const n = int(r, 5, 15);
          const prem = g > j;
          return {
            text: `面值 1,000，息票率 ${pct(c)}（年付），${n} 年后按 ${money(C, 0)} 赎回，收益率 ${pct(j)}。它是溢价还是折价（相对赎回值 ${money(C, 0)}）？`,
            vars: { i: j },
            steps: [
              expr('修正息票率 g = Fr / C =', { target: g, model: `${F * c}/${C}`, unit: 'rate' }),
              choice('结论：', [
                [`溢价：$P > ${C}$`, prem, prem ? undefined : `g ≈ ${pct(round(g, 4))} < j，是折价。`],
                [`折价：$P < ${C}$`, !prem, prem ? `g ≈ ${pct(round(g, 4))} > j，是溢价。` : undefined],
              ], { hint: '比较 g 和 j；不是比较息票率和 j。' }),
              expr('P − C =', { target: (F * c - C * j) * an(n, j), model: `(${F * c} - ${C}i)a(${n})`, why: '正数是溢价，负数是折价。' }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'bond-book',
    en: 'Book value and amortization of premium',
    zh: '账面价值：溢价一点点摊掉',
    outcome: '4b · 4c',
    learn: [
      P('溢价买的债券，到期只还 C，多付的 $P - C$ 不会回来。会计上把这部分在持有期内**慢慢摊掉**：每付一次息票，账面上的价值就往 C 靠近一点。'),
      M('BV_k = Fr\\,a_{\\angl{n-k}} + C\\,v^{\\,n-k}', '**账面价值**（book value）：第 k 次息票刚付完时，剩下的息票和赎回值按原收益率 j 折到时刻 k。和贷款的 prospective 余额一模一样。'),
      T(tl(8, bondFlows(8, 'Fr', 'C'), { focal: 3, rate: 'j' }), '站在 t = 3：右边还剩 5 次息票和赎回值，折回 t = 3 就是 $BV_3$。'),
      G({ n: 10, yMin: 700, curves: [{ label: '溢价债（息 8%）', f: t => { const bv = k => 80 * ((1 - 1.06 ** -(10 - k)) / 0.06) + 1000 * 1.06 ** -(10 - k); const k = Math.min(9, Math.floor(t)); return bv(k) + (bv(k + 1) - bv(k)) * (t - k); }, tone: 'orange' }, { label: '折价债（息 4%）', f: t => { const bv = k => 40 * ((1 - 1.06 ** -(10 - k)) / 0.06) + 1000 * 1.06 ** -(10 - k); const k = Math.min(9, Math.floor(t)); return bv(k) + (bv(k + 1) - bv(k)) * (t - k); }, tone: 'ink' }] }, '面值 1,000、10 年、收益率 6% 的两张债券，每次付息后的账面价值：溢价债一路往下摊，折价债一路往上积，到期都正好收在 1,000。'),
      M('I_k = j\\,BV_{k-1} \\qquad \\text{amortization}_k = Fr - j\\,BV_{k-1} = (Fr - Cj)\\,v^{\\,n-k+1}', '每次息票里，$j\\,BV_{k-1}$ 是买家真正赚到的利息；剩下的 $Fr - I_k$ 是在“还”你多付的溢价。'),
      TABLE(
        ['k', '息票', '利息 $j\\,BV_{k-1}$', '溢价摊销', '账面价值'],
        [
          ['0', '—', '—', '—', '$P$'],
          ['1', '$Fr$', '$jP$', '$Fr - jP$', '$P - (Fr - jP)$'],
          ['…', '…', '…', '…', '…'],
          ['n', '$Fr$', '', '', '$C$'],
        ],
      ),
      P('折价债券反过来：$Fr - Cj < 0$，每期利息比息票多，多出来的部分加进账面价值，叫**折价累积**（accumulation of discount）。账面价值从 P 一路**升**到 C。'),
      TIP('所有摊销加起来 = P − C（溢价全部摊完）；这和“贷款所有本金部分加起来 = L”是同一个道理。'),
    ],
    example: r => {
      const j = 0.06, Fr = 80, C = 1000, n = 6;
      const P0 = price(Fr, C, n, j), am1 = Fr - j * P0;
      return {
        text: '面值 1,000，息票 80（年付），6 年，按面值赎回，收益率 6%。造出第 1 年的摊销，并求第 2 次息票后的账面价值。',
        timeline: tl(6, bondFlows(6, '80', '1,000'), { focal: 2, rate: 'j = 6%' }),
        vars: { i: j },
        steps: [
          expr('价格 = 时刻 0 的账面价值 =', { target: P0, model: '80a(6) + 1000v^6' }),
          expr('第 1 年真正赚的利息 = j × BV₀ =', { target: j * P0, model: 'i(80a(6) + 1000v^6)' }),
          expr('第 1 年的溢价摊销 =', { target: am1, model: '(80 - 1000i)v^6', hint: '捷径：$(Fr - Cj)v^{n-k+1}$，这里 k = 1。', why: `也等于 $80 - ${money(j * P0)} = ${money(am1)}$。` }),
          expr('第 2 次息票后的账面价值 $BV_2$ =', { target: price(Fr, C, 4, j), model: '80a(4) + 1000v^4', why: '还剩 4 次息票和赎回值。' }),
        ],
      };
    },
    drills: [
      {
        id: 'bond-book-bv',
        zh: '第 k 次息票后的账面价值',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r), n = int(r, 6, 20);
          const k = pick(r, Array.from({ length: n - 3 }, (_, t) => t + 2).filter(t => 2 * t !== n && 2 * t !== n + 1));
          const Fr = round(F * c, 2);
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年，按面值赎回，以收益率 ${pct(j)} 买入。第 ${k} 次息票刚付完时，账面价值是多少？`,
            timeline: tl(n, bondFlows(n, money(Fr, 0), money(F, 0)), { focal: k, rate: `j = ${pct(j)}` }),
            vars: { i: j },
            steps: [
              choice('还剩几次息票？', [
                [`${n - k} 次`, true],
                [`${n - k + 1} 次`, false, `第 ${k} 次已经付了。`],
                [`${k} 次`, false, `${k} 是已经付掉的次数。`],
              ]),
              expr(`$BV_{${k}}$ =`, { target: price(Fr, F, n - k, j), model: `${Fr}a(${n - k}) + ${F}v^${n - k}` }),
            ],
          };
        },
      },
      {
        id: 'bond-book-amort',
        zh: '第 k 次息票里的溢价摊销',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r, true), n = int(r, 5, 20);
          const k = pick(r, Array.from({ length: n }, (_, t) => t + 1).filter(t => 2 * t !== n && 2 * t !== n + 1));
          const Fr = round(F * c, 2), e = n - k + 1;
          const BVprev = price(Fr, F, e, j);
          const am = Fr - j * BVprev;
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年，按面值赎回，收益率 ${pct(j)}（溢价债券）。第 ${k} 次息票里摊销了多少溢价？`,
            vars: { i: j },
            steps: [
              choice('捷径公式里 v 的指数是：', [
                [`${e}`, true],
                [`${n - k}`, false, `少数了一次：从第 ${k} 次到第 ${n} 次（含两端）是 ${e} 次。`],
                [`${k}`, false, '和贷款一样，要从最后一次往回数。'],
              ]),
              expr(`摊销 = $(Fr - Cj)v^{${e}}$ =`, { target: am, model: `(${Fr} - ${F}i)v^${e}` }),
              expr(`第 ${k} 次息票里的利息部分 =`, { target: j * BVprev, model: `${Fr} - (${Fr} - ${F}i)v^${e}`, why: '息票 = 利息 + 摊销。' }),
            ],
          };
        },
      },
      {
        id: 'bond-book-total',
        zh: '摊销总额 = 溢价',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r, true), n = int(r, 5, 15);
          const Fr = round(F * c, 2);
          const Pr = price(Fr, F, n, j);
          let tot = 0;
          for (let k = 1; k <= n; k++) tot += Fr - j * price(Fr, F, n - k + 1, j);
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年，按面值赎回，收益率 ${pct(j)}。整个持有期内，溢价摊销一共是多少？`,
            vars: { i: j },
            steps: [
              choice('所有摊销加起来等于：', [
                ['价格 − 赎回值', true],
                ['所有息票之和', false, '息票里还有利息部分。'],
                ['0', false, '每期摊销都是正的（溢价债券），加起来不会是 0。'],
              ], { hint: '账面价值从 P 走到 C，每一步减少的就是那一期的摊销。' }),
              expr('摊销总额 =', { target: tot, model: `(${Fr} - ${F}i)a(${n})`, why: `等于溢价 $P - C = ${money(Pr - F)}$。因为 $\\sum v^{n-k+1} = a_{\\angl{n}}$。` }),
            ],
          };
        },
      },
      {
        id: 'bond-book-discount',
        zh: '折价债券：账面价值往上走',
        gen: r => {
          const F = pick(r, FACES), { c, j } = rateAndYield(r, false), n = int(r, 5, 15);
          const k = int(r, 1, n);
          const Fr = round(F * c, 2), e = n - k + 1;
          const acc = j * price(Fr, F, e, j) - Fr;
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年，按面值赎回，收益率 ${pct(j)}。第 ${k} 次息票时，账面价值增加了多少（折价累积）？`,
            vars: { i: j },
            steps: [
              choice('这张债券是折价。每期账面价值怎么变？', [
                ['往上走，最后到面值', true],
                ['往下走，最后到面值', false, '折价买入时 P < C，账面价值要升到 C。'],
                ['不变', false, '只有平价债券才不变。'],
              ]),
              expr('折价累积 = $(Cj - Fr)v^{n-k+1}$ =', { target: acc, model: `(${F}i - ${Fr})v^${e}` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'bond-callable',
    en: 'Callable bonds',
    zh: '可赎回债券：发行人可以提前还',
    outcome: '4b',
    learn: [
      P('**可赎回债券**（callable bond）允许发行人在几个指定的日期提前还钱（call）。买家不知道哪天会被赎回，所以要找一个价格：**无论哪天被赎回，收益率都至少有 j**。'),
      TERMS([
        ['call date', '赎回日', '发行人可以提前还钱的日期'],
        ['call price / call premium', '赎回价 / 赎回溢价', '提前赎回时付的金额；常比面值多一点'],
        ['yield to call', '赎回收益率', '假设在某个赎回日被赎回时的收益率'],
      ]),
      M('P = \\min_{\\text{call dates } t}\\Big( Fr\\,a_{\\angl{t}} + C_t\\,v^{t} \\Big)', '对每个可能的赎回日都算一次价格，取**最小**的那个。付这个价格，最坏情况下收益率也有 j；其他情况只会更好。'),
      T(tl(10, [...flowsEvery(1, 10, 'Fr'), { t: 6, amt: 'C₆', side: 'down' }, { t: 8, amt: 'C₈', side: 'down' }, { t: 10, amt: 'C', side: 'down' }], { rate: 'j' }), '可以在第 6、8 年末赎回，或者到第 10 年末正常到期。每种情况是一个不同长度的债券。'),
      TABLE(
        ['债券类型（赎回值相同时）', '对买家最坏的赎回日', '原因'],
        [
          ['溢价（r > j）', '**最早**的赎回日', '溢价是靠息票慢慢赚回来的；越早被赎回，越来不及赚回'],
          ['折价（r < j）', '**最晚**（到期日）', '折价的收益是到期时拿到 C 才实现的；越晚越亏'],
        ],
      ),
      TIP('溢价 → 最早；折价 → 最晚。赎回值不同（有 call premium）时，规则不保证成立，要逐个算。'),
      P('为什么取最小值？如果你付了一个较高的价格，而发行人恰好选了对你最不利的日期，你的收益率就会低于 j。发行人会在对**他**最有利（对你最不利）时赎回。'),
    ],
    example: r => {
      const j = 0.05;
      const p8 = price(70, 1000, 8, j), p10 = price(70, 1000, 10, j), p12 = price(70, 1000, 12, j);
      return {
        text: '面值 1,000，息票率 7%（年付），12 年到期；发行人可以在第 8 年末或第 10 年末按面值提前赎回。要保证收益率至少 5%，最多付多少？',
        timeline: tl(12, [...flowsEvery(1, 12, '70'), { t: 8, amt: '1,000', side: 'down' }, { t: 10, amt: '1,000', side: 'down' }, { t: 12, amt: '1,000', side: 'down' }], { rate: 'j = 5%' }),
        vars: { i: j },
        steps: [
          expr('假设第 8 年末被赎回，价格 =', { target: p8, model: '70a(8) + 1000v^8' }),
          expr('假设第 10 年末被赎回：', { target: p10, model: '70a(10) + 1000v^10' }),
          expr('假设到第 12 年末才还：', { target: p12, model: '70a(12) + 1000v^12' }),
          choice('应付哪个价格？', [
            ['最小的那个：第 8 年', true],
            ['最大的那个：第 12 年', false, '付最高价时，若第 8 年就被赎回，收益率会低于 5%。'],
            ['三个的平均', false, '要的是“最坏情况也有 5%”，取最小值。'],
          ], { why: `溢价债券（7% > 5%），所以最早的赎回日最不利，${money(p8)}。` }),
        ],
      };
    },
    drills: [
      {
        id: 'bond-callable-premium',
        zh: '溢价债券：三个赎回日',
        gen: r => {
          const F = pick(r, [1000, 5000]), { c, j } = rateAndYield(r, true);
          const t1 = int(r, 5, 9), t2 = t1 + int(r, 2, 4), t3 = t2 + int(r, 2, 5);
          const Fr = F * c;
          const ps = [t1, t2, t3].map(t => price(Fr, F, t, j));
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${t3} 年到期；可在第 ${t1} 年末或第 ${t2} 年末按面值提前赎回。要保证收益率至少 ${pct(j)}，价格是多少？`,
            vars: { i: j },
            steps: [
              expr(`第 ${t1} 年末赎回时的价格：`, { target: ps[0], model: `${Fr}a(${t1}) + ${F}v^${t1}` }),
              expr(`第 ${t2} 年末赎回时的价格：`, { target: ps[1], model: `${Fr}a(${t2}) + ${F}v^${t2}` }),
              expr(`第 ${t3} 年末到期时的价格：`, { target: ps[2], model: `${Fr}a(${t3}) + ${F}v^${t3}` }),
              choice('应付：', [
                [`第 ${t1} 年的价格（最小）`, true],
                [`第 ${t3} 年的价格（最大）`, false, '付最高价时，一旦提前赎回，收益率就不到 j。'],
                [`第 ${t2} 年的价格`, false, '不是最小的那个。'],
              ], { hint: '溢价债券：最早的赎回日最不利。', why: `溢价 = $(Fr - Fj)a_{\\angl{t}}$，t 越小溢价越小。` }),
            ],
          };
        },
      },
      {
        id: 'bond-callable-discount',
        zh: '折价债券：哪天最不利',
        gen: r => {
          const F = pick(r, [1000, 5000]), { c, j } = rateAndYield(r, false);
          const t1 = int(r, 5, 9), t2 = t1 + int(r, 3, 6);
          const Fr = F * c;
          const p1 = price(Fr, F, t1, j), p2 = price(Fr, F, t2, j);
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${t2} 年到期；发行人可在第 ${t1} 年末按面值提前赎回。收益率要求 ${pct(j)}。`,
            vars: { i: j },
            steps: [
              choice('这张债券是溢价还是折价？哪天对买家最不利？', [
                ['折价；到期日最不利', true],
                ['折价；最早赎回日最不利', false, '折价的收益在到期拿 C 时才实现：越早拿到 C 越好，越晚越不利。'],
                ['溢价；最早赎回日最不利', false, `息票率 ${pct(c)} < 收益率 ${pct(j)}，这是折价。`],
              ]),
              expr(`第 ${t1} 年赎回的价格：`, { target: p1, model: `${Fr}a(${t1}) + ${F}v^${t1}` }),
              expr(`第 ${t2} 年到期的价格：`, { target: p2, model: `${Fr}a(${t2}) + ${F}v^${t2}` }),
              choice('应付的价格：', [
                [`第 ${t2} 年的那个`, true],
                [`第 ${t1} 年的那个`, false, '它更高；取较小的。'],
              ], { why: `${money(p2)} < ${money(p1)}。` }),
            ],
          };
        },
      },
      {
        id: 'bond-callable-cprem',
        zh: '带赎回溢价：要逐个算',
        gen: r => {
          const F = 1000, c = pick(r, [0.06, 0.07, 0.08]), j = pick(r, [0.04, 0.05].filter(y => y < c));
          const t1 = int(r, 4, 6), t2 = t1 + int(r, 3, 5);
          const C1 = pick(r, [1100, 1150, 1200]);
          const Fr = F * c;
          const p1 = price(Fr, C1, t1, j), p2 = price(Fr, F, t2, j);
          const lo = p1 < p2 ? 1 : 2;
          return {
            text: `面值 1,000，息票率 ${pct(c)}（年付），${t2} 年到期按面值还；发行人可在第 ${t1} 年末以 ${money(C1, 0)} 提前赎回。保证收益率至少 ${pct(j)} 的价格是多少？`,
            timeline: tl(t2, [...flowsEvery(1, t2, String(Fr)), { t: t1, amt: money(C1, 0), side: 'down' }, { t: t2, amt: '1,000', side: 'down' }], { rate: `j = ${pct(j)}` }),
            vars: { i: j },
            steps: [
              expr(`第 ${t1} 年赎回（赎回值 ${C1}）的价格：`, { target: p1, model: `${Fr}a(${t1}) + ${C1}v^${t1}`, hint: '提前赎回时，到期那笔换成赎回价。' }),
              expr(`第 ${t2} 年到期的价格：`, { target: p2, model: `${Fr}a(${t2}) + 1000v^${t2}` }),
              choice('应付：', [
                [`第 ${t1} 年那个`, lo === 1, lo === 1 ? undefined : '它更高。有赎回溢价时，“溢价 → 最早”不一定成立；要取算出来较小的。'],
                [`第 ${t2} 年那个`, lo === 2, lo === 2 ? undefined : '它更高；取较小的。'],
              ], { why: `两个价格 ${money(p1)} 和 ${money(p2)}，取小的。` }),
            ],
          };
        },
      },
    ],
  },

  {
    id: 'bond-reinvest',
    en: 'Reinvesting coupons and realized yield',
    zh: '息票再投资：实际赚了多少',
    outcome: '4b · 4c',
    learn: [
      P('收益率 j 有一个隐含假设：收到的息票都能按 j 再投资。现实中，息票可能只能按另一个利率 k 存起来。这时持有到期真正赚到的利率（**realized yield**）就不是 j 了。'),
      M('AV_n = Fr\\,s_{\\angl{n}}\\,@\\,k + C', '持有到期的终值 = 所有息票按再投资利率 k 累积到第 n 年 + 赎回值。在式子里写成 s(n, k)。'),
      T(tl(6, bondFlows(6, 'Fr', 'C'), { focal: 6, rate: 'k（再投资）' }), '这次比较日在最后：每笔息票按 k 往后长，加上到期的 C。'),
      M('P(1+j^{*})^n = AV_n \\quad\\Longrightarrow\\quad j^{*} = \\left(\\frac{AV_n}{P}\\right)^{1/n} - 1', '实际年收益率：今天付 P，n 年后手上有 $AV_n$，平均每年长了多少。'),
      TABLE(
        ['再投资利率 k', '实际收益率 $j^*$'],
        [
          ['k = j', '$j^* = j$'],
          ['k < j', '$j^* < j$'],
          ['k > j', '$j^* > j$'],
        ],
      ),
      TIP('价格用 j 算，终值用 k 算，最后用 (AV/P)^(1/n) − 1 求实际收益率。三个利率别混。'),
      RECIPE('三步', ['价格 P（按购买时的收益率）', '终值 $AV_n = Fr\\,s_{\\angl{n}}@k + C$', '$j^* = (AV_n/P)^{1/n} - 1$']),
    ],
    example: r => {
      const j = 0.06, k = 0.04, n = 5;
      const Pr = price(70, 1000, n, j), AV = 70 * sn(n, k) + 1000;
      return {
        text: '以收益率 6% 买入面值 1,000、息票率 7%（年付）、5 年期、按面值赎回的债券。息票只能按 4% 再投资。持有到期的实际年收益率是多少？',
        timeline: tl(5, bondFlows(5, '70', '1,000'), { focal: 5, rate: 'k = 4%' }),
        vars: { i: j },
        steps: [
          expr('价格 P（按 6%）=', { target: Pr, model: '70a(5) + 1000v^5' }),
          expr('第 5 年末的终值（息票按 4% 累积）=', { target: AV, model: '70s(5, 0.04) + 1000', hint: '另一个利率写成 s(n, k)。' }),
          expr('实际年收益率 =', { target: (AV / Pr) ** (1 / n) - 1, model: '((70s(5, 0.04) + 1000)/(70a(5) + 1000v^5))^(1/5) - 1', unit: 'rate', why: `约 ${pct(round((AV / Pr) ** (1 / n) - 1, 5))}，低于 6%：息票再投资只赚 4%。` }),
        ],
      };
    },
    drills: [
      {
        id: 'bond-reinvest-av',
        zh: '息票再投资的终值',
        gen: r => {
          const F = pick(r, FACES), c = pick(r, CPN), k = pick(r, [0.02, 0.03, 0.04, 0.05]), n = int(r, 3, 20);
          const Fr = round(F * c, 2);
          let av = F;
          for (let t = 1; t <= n; t++) av += Fr * (1 + k) ** (n - t);
          return {
            text: `面值 ${money(F, 0)}，息票率 ${pct(c)}（年付），${n} 年，按面值赎回。息票按 ${pct(k)} 再投资。持有到期时一共有多少钱？`,
            timeline: tl(n, bondFlows(n, money(Fr, 0), money(F, 0)), { focal: n, rate: `k = ${pct(k)}` }),
            vars: { i: k },
            steps: [
              choice('终值的结构：', [
                [`$${Fr}\\,s_{\\angl{${n}}} + ${F}$`, true],
                [`$${Fr}\\,s_{\\angl{${n}}} + ${F}(1+k)^{${n}}$`, false, '赎回值在第 n 年末才收到，不用再累积。'],
                [`$${n} \\times ${Fr} + ${F}$`, false, '息票再投资会长利息。'],
              ]),
              expr('终值 =（这里 i 就是再投资利率）', { target: av, model: `${Fr}s(${n}) + ${F}` }),
            ],
          };
        },
      },
      {
        id: 'bond-reinvest-yield',
        zh: '实际年收益率',
        gen: r => {
          const F = 1000, c = pick(r, [0.05, 0.06, 0.07, 0.08]), j = pick(r, [0.05, 0.06, 0.07]);
          const k = pick(r, [0.02, 0.03, 0.04]), n = int(r, 4, 15);
          const Fr = F * c;
          const Pr = price(Fr, F, n, j);
          let av = F;
          for (let t = 1; t <= n; t++) av += Fr * (1 + k) ** (n - t);
          const js = (av / Pr) ** (1 / n) - 1;
          return {
            text: `以收益率 ${pct(j)} 买入面值 1,000、息票率 ${pct(c)}（年付）、${n} 年期、按面值赎回的债券。息票只能按 ${pct(k)} 再投资。实际年收益率是多少？`,
            vars: { i: j },
            steps: [
              expr(`价格 P（按 ${pct(j)}）=`, { target: Pr, model: `${Fr}a(${n}) + 1000v^${n}` }),
              expr(`终值（息票按 ${pct(k)}）=`, { target: av, model: `${Fr}s(${n}, ${k}) + 1000`, hint: '另一个利率写成 s(n, k)。' }),
              expr('实际年收益率 =', { target: js, model: `((${Fr}s(${n}, ${k}) + 1000)/(${Fr}a(${n}) + 1000v^${n}))^(1/${n}) - 1`, unit: 'rate' }),
              choice('和购买收益率比：', [
                [`低于 ${pct(j)}`, true],
                [`高于 ${pct(j)}`, false, `再投资利率 ${pct(k)} 比 ${pct(j)} 低，息票长得慢，实际收益率被拉低。`],
                [`正好等于 ${pct(j)}`, false, `只有再投资利率也是 ${pct(j)} 才相等。`],
              ], { why: `约 ${pct(round(js, 5))}。` }),
            ],
          };
        },
      },
      {
        id: 'bond-reinvest-same',
        zh: '再投资利率 = 收益率时',
        gen: r => {
          const F = 1000, { c, j } = rateAndYield(r), n = int(r, 4, 12);
          const Fr = F * c, Pr = price(Fr, F, n, j);
          let av = F;
          for (let t = 1; t <= n; t++) av += Fr * (1 + j) ** (n - t);
          return {
            text: `以收益率 ${pct(j)} 买入面值 1,000、息票率 ${pct(c)}（年付）、${n} 年期的债券（按面值赎回），息票也按 ${pct(j)} 再投资。`,
            vars: { i: j },
            steps: [
              expr('第 n 年末的终值 =', { target: av, model: `${Fr}s(${n}) + 1000` }),
              expr('把价格 P 往后累积 n 年 =', { target: Pr * (1 + j) ** n, model: `(${Fr}a(${n}) + 1000v^${n})(1+i)^${n}` }),
              choice('两者比较，说明什么？', [
                [`相等，所以实际收益率就是 ${pct(j)}`, true],
                ['终值更大，实际收益率更高', false, '两者恰好相等：$a_{\\angl{n}}(1+j)^n = s_{\\angl{n}}$。'],
                ['终值更小，实际收益率更低', false, '两者恰好相等：$a_{\\angl{n}}(1+j)^n = s_{\\angl{n}}$。'],
              ], { why: '收益率 j 本身就隐含了“息票按 j 再投资”的假设。' }),
            ],
          };
        },
      },
    ],
  },
];

export default {
  id: 'bond',
  no: 4,
  en: 'Bonds',
  zh: '债券',
  weight: '15–25%',
  blurb: '价格、溢价与折价、账面价值与摊销、可赎回债券、息票再投资：债券就是一个年金加一笔到期付款。',
  lessons,
};
