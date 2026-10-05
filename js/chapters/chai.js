// Chapter 5: chai. A steel saucepan on one burner of an Indian gas stove (1 scene unit ≈ 5 cm),
// making one to four 150 ml cups the way most Indian homes do: boil water, add CTC tea, boil, add
// milk and sugar, bring it up to the boil again, strain.
// Heat: (m_water × 4.186 + m_milk × 3.93 kJ/kg·K + pan 150 J/K) dT/dt = flame × 0.5 − losses.
//   The flame is 1.5 kW while heating and 0.6 kW while the tea boils (a burner turned down); half of
//   the flame's heat reaches the pan (GheeClear's estimate). Losses about 14 W/m²K over 0.06 m².
//   At the boil the spare heat makes steam at 2,257 kJ/kg, so the chai loses water: the readout says
//   how much. Adding cold milk (5 °C from the fridge) drops the temperature by simple mixing.
// Extraction: the first-order rates of the brew chapter, for CTC brokens (1.2 mm) at the pan's
//   temperature. At 100 °C that is about 3.3 per minute for caffeine, so half is out in about 13 s and
//   nearly all in a minute; tannins (assumed half as fast) are nearly all out in two. Boiling a CTC tea
//   therefore takes almost everything the leaf has, which is why chai is strong, and why it wants milk.
// Milk: casein, the main milk protein (2.6% of cow milk, CurdClear's figure), binds tea polyphenols,
//   so fewer are free to grip the proteins of your saliva. The "felt" bar is a sketch of that:
//   share bound = milk share ÷ (milk share + 0.15). It is not a measurement.
// Caffeine: 30 mg per gram for Assam CTC (about 3% of dry weight). Wet leaf keeps back about 4 g of
//   liquor per gram. ICMR-NIN (2024) counts 30–65 mg in a 150 ml cup of tea.
// Sugar: a level teaspoon is about 4 g, 16 kcal. Toned milk is about 60 kcal per 100 ml (typical label).
import { THREE } from '../kit.js';
import {
  kCaf, TAN_RATIO, HOLD, GUIDE, C_WATER, C_MILK, L_VAP, STOVE_ETA, AMB, liquorColor, css, COL, makePan, makeCup, makeThermo, dots, rng, board, panelBg, axes, title, line, bars, dashH,
  fitNarrow, reelBoards, clamp, lerp, fmtT, link, TAU, VIEW, BW, BH, B1, B2,
} from '../tea.js';

const PH = [
  { n: 'Heating the water', d: 'Cold water on a high flame. Small bubbles of dissolved air appear first.', c: COL.water },
  { n: 'Boiling the tea', d: 'CTC granules in boiling water. Almost all the caffeine is out within a minute, and the tannins follow.', c: COL.tf },
  { n: 'Milk in', d: 'Cold milk and sugar go in. The temperature drops, and milk protein starts binding the tannins.', c: COL.milk },
  { n: 'Coming up to the boil', d: 'The chai rises in the pan as milk proteins trap steam in a froth. Watch it: it boils over fast.', c: COL.heat },
  { n: 'Strained and poured', d: 'Off the flame, through the strainer, into the cups. Let it cool a little before you sip.', c: COL.ok },
];
const CAF_CTC = 30, tmp = new THREE.Color(), cMilk = new THREE.Color(0xf6efe0), cWater = new THREE.Color(0x9fc4e8);
const RV = { pos: [-0.7, 5.8, 8.4], target: [-0.7, 5.4, 0] };
function fresh(s) {
  const V = s.cups * GUIDE.cup;
  return { ph: 0, t: 0, tPh: 0, T: AMB, water: (V * (1 - s.milk)) / 1000, milk: 0, milkAdd: (V * s.milk) / 1000, tea: s.cups * s.dose, fc: 0, ft: 0, evap: 0, steamW: 0, rise: 0, gas: 0 };
}
function step(st, s, dt) {
  const flame = st.ph === 0 || st.ph === 2 || st.ph === 3 ? 1500 : st.ph === 1 ? 600 : 0;
  const cap = st.water * C_WATER + st.milk * C_MILK + 150, loss = 14 * 0.06 * Math.max(0, st.T - AMB), net = flame * STOVE_ETA - loss;
  st.steamW = 0;
  if (st.T >= 100 && net > 0) { st.steamW = net; const dm = Math.min(st.water * 0.5, (net * dt) / L_VAP); st.water -= dm; st.evap += dm; st.T = 100; } else st.T = Math.min(100, st.T + (net * dt) / cap);
  if (st.ph >= 1 && st.ph < 4) { const k = kCaf('ctc', st.T, 1.2) / 60; st.fc += (1 - st.fc) * (1 - Math.exp(-k * dt)); st.ft += (1 - st.ft) * (1 - Math.exp(-k * TAN_RATIO * dt)); }
  if (st.ph < 4) st.t += dt; st.tPh += dt; st.gas += (flame * dt) / 46e6;
  if (st.ph === 0 && st.T >= 100) { st.ph = 1; st.tPh = 0; }
  else if (st.ph === 1 && st.tPh >= s.boil * 60) {
    st.ph = s.milk > 0.01 ? 2 : 4; st.tPh = 0;
    if (s.milk > 0.01) { const a = st.water * C_WATER, b = st.milkAdd * C_MILK; st.T = (a * st.T + b * 5) / (a + b); st.milk = st.milkAdd; }
  } else if (st.ph === 2 && st.tPh >= 4) { st.ph = 3; st.tPh = 0; }
  else if (st.ph === 3) { st.rise = st.T < 100 ? 0.5 * clamp((st.T - 90) / 10, 0, 1) : Math.min(1, st.rise + dt * 0.08); if (st.T >= 100 && st.rise >= 0.99) { st.ph = 4; st.tPh = 0; } }
  if (st.ph === 4) st.rise = Math.max(0, st.rise - dt * 0.5);
  return st;
}
function cupOf(st, s) {
  const vol = (st.water + st.milk) * 1000, kept = HOLD * st.tea, pour = Math.max(1, vol - kept), per = pour / s.cups, mshare = (st.milk * 1000) / Math.max(1, vol);
  const bound = mshare / (mshare + 0.15), felt = st.ft * (1 - bound) * (s.dose / 2) * (GUIDE.cup / Math.max(60, per));
  return { per, mg: (st.tea * CAF_CTC * st.fc * (pour / vol)) / s.cups, bound, felt, raw: st.ft * (s.dose / 2) * (GUIDE.cup / Math.max(60, per)), mshare, kcal: s.sugar * 16 + ((st.milk * 1000) / s.cups) * 0.6 };
}

export default {
  id: 'chai',
  short: 'Chai',
  title: 'Chai: boiling it on purpose',
  subtitle: 'Everything a tea taster says not to do, done deliberately: boil the leaf, then tame it with milk and sugar.',
  view: VIEW,
  learn: `<p>A tea taster steeps leaf for a few minutes and never boils it. Indian <b>chai</b> does the opposite, and for good reasons.</p>
    <p>Chai is made with <b>CTC tea</b>. Its tiny granules, in water at a rolling boil, give up almost all their <b>caffeine</b> in under a minute and nearly all their <b>tannins</b> in two. Nothing is held back. On its own that liquor would be harsh and mouth-drying.</p>
    <p>Then the <b>milk</b> goes in. Milk's main protein, <b>casein</b> (the same protein that sets ${link('curdclear', 'curd')}), grabs tannin molecules and holds them. Astringency is the feeling of tannins gripping the proteins in your saliva. With casein in the way, fewer are free to do it, so the chai tastes <b>smooth</b>. <b>Sugar</b> hides the remaining bitterness.</p>
    <p>That is why CTC and chai suit each other. A delicate whole-leaf Darjeeling would be flattened by boiling and drowned by milk. A strong Assam CTC can take both and still taste of tea.</p>
    <p><b>Ginger</b> and <b>cardamom</b> add their own aromas. Many of those molecules dissolve better in fat than in water, so the milk fat helps carry them, the same idea as a ${link('tadkaclear', 'tadka')}.</p>
    <p><b>Watch the pan.</b> As milk nears the boil, its proteins trap steam in a froth and the chai <b>rises</b>. It can boil over in seconds. Turn the flame down, and keep handles turned in: boiling chai scalds badly.</p>
    <p class="tip"><b>Try it:</b> set milk to none and read "astringency felt". Now add milk, a third at a time. Then boil the tea for five minutes instead of one and see what changes: not the caffeine.</p>`,
  terms: [
    { t: 'Chai', d: 'Tea in Hindi and many other languages. In India it usually means CTC tea boiled with water, milk and sugar.' },
    { t: 'Masala chai', d: 'Chai with spices such as ginger, cardamom, clove, cinnamon and pepper.' },
    { t: 'Casein', d: 'The main protein of milk. It binds tea tannins, which softens astringency.' },
    { t: 'Kadak', d: 'Strong: chai boiled long, with plenty of leaf.' },
    { t: 'Cutting chai', d: 'Mumbai\'s half glass of strong chai, a full cup "cut" in two.' },
    { t: 'Kulhad', d: 'An unglazed clay cup, used once. It gives chai an earthy smell.' },
  ],
  defaults: { cups: 2, dose: 2, boil: 1.5, milk: 0.33, sugar: 1, spice: true, fast: 10 },
  controls: [
    { key: 'cups', type: 'seg', label: 'Cups', options: [1, 2, 3, 4].map((v) => ({ v, label: String(v) })) },
    { key: 'dose', type: 'range', label: 'CTC tea for each cup', min: 1, max: 4, step: 0.5, ends: ['1 g', '4 g'], fmt: (v) => v + ' g', hint: 'A level teaspoon is about 2 g.' },
    { key: 'boil', type: 'range', label: 'Boil the tea for', min: 0.5, max: 6, step: 0.5, ends: ['30 s', '6 min'], fmt: (v) => (v < 1 ? '30 s' : v + ' min') },
    { key: 'milk', type: 'range', label: 'Milk', min: 0, max: 0.6, step: 0.01, ends: ['none', 'more than half'], fmt: (v) => (v < 0.01 ? 'none (black tea)' : Math.round(v * 100) + '% of the pan') },
    { key: 'sugar', type: 'range', label: 'Sugar in each cup', min: 0, max: 3, step: 0.5, ends: ['none', '3 tsp'], fmt: (v) => (v ? `${v} tsp · ${v * 4} g` : 'none') },
    { key: 'spice', type: 'toggle', label: 'Ginger and cardamom' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 10, label: '×10' }, { v: 30, label: '×30' }] },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Make it again', act: (s, inst) => inst.reset(s) }] },
  ],
  onChange(s, key) { if (key === 'cups' || key === 'dose' || key === 'milk' || key === 'boil') s._reset = true; },
  quiz: [
    { q: 'Why does milk make strong tea taste smoother?', options: ['It cools the tea', 'Its protein, casein, binds the tannins', 'It removes the caffeine', 'It adds acid'], answer: 1, why: 'Astringency comes from tannins gripping the proteins in your saliva. Casein holds on to many of them first.' },
    { q: 'You boil your chai for five minutes instead of one. What mostly changes?', options: ['Much more caffeine', 'More tannins and less water, so it is stronger and more bitter', 'Less caffeine', 'Nothing at all'], answer: 1, why: 'CTC granules give up nearly all their caffeine in the first minute of boiling. Longer boiling adds tannins and drives off water.' },
    { q: 'Why is CTC tea, not whole leaf, the usual choice for chai?', options: ['It is the only tea grown in India', 'Its small granules brew fast and strong enough to stand up to milk and sugar', 'It has no tannins', 'It does not need boiling water'], answer: 1, why: 'CTC granules extract in seconds and give a dark, strong liquor. Delicate whole-leaf teas are overwhelmed by boiling and milk.' },
  ],
  reel: [
    { ms: 5400, caption: 'Indian chai breaks the taster\'s rule on purpose: CTC tea is boiled, and gives up nearly all its caffeine within a minute.', set: { cups: 2, dose: 2, boil: 1.5, milk: 0.33, sugar: 1, spice: true, fast: 14 }, act: (s, inst) => { inst.reset(s); inst.preRun(s, 62); }, view: RV, spin: 0.08 },
    { ms: 5400, caption: 'Then milk goes in. Its protein, casein, binds the harsh tannins, so strong chai tastes smooth.', set: { cups: 2, dose: 2, boil: 1.5, milk: 0.33, sugar: 1, spice: true, fast: 14 }, act: (s, inst) => inst.preRun(s, 196), view: RV, spin: 0.08 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(41);
    let S = s0, st = fresh(s0), rows = [], marks = [], key = '';
    const pan = makePan(root, { x: -1.1, seed: 13 });
    const th = makeThermo(root, stage, { x: 1.45, y: 0.45, h: 3.0, lo: 0, hi: 100, ticks: [0, 50, 100] });
    const cups = [0, 1, 2, 3].map((i) => makeCup(root, { x: 2.2 + (i % 2) * 0.9, y: 0.02, z: 1.5 + Math.floor(i / 2) * 1.05, r: 0.36, h: 0.8, saucer: false }));
    const sp = dots(14, 0.06, 0xd9b36a, 6, true); sp.renderOrder = 4; pan.g.add(sp);
    const SP = Array.from({ length: 14 }, (_, i) => ({ a: rnd() * TAU, r: Math.sqrt(rnd()), c: i % 3 === 0 ? 0x8fae5a : 0xd9b36a }));
    const reset = (s) => { if (s) S = s; st = fresh(S); rows = []; marks = []; };
    const log = () => { if (!rows.length || st.t - rows[rows.length - 1][0] >= 2) rows.push([st.t, st.T]); };
    const phys = (dt) => { const p = st.ph; step(st, S, dt); if (st.ph !== p) marks.push([st.t, st.ph]); };
    const preRun = (s, secs) => { S = s; if (st.t > secs) reset(s); while (st.t < secs && st.ph < 4) { phys(0.25); log(); } };
    const liquid = (out) => { liquorColor(0.97, clamp(0.15 + st.ft * (S.dose / 2) * 0.9, 0, 1), out); if (st.ph === 0) out.copy(cWater); return out.lerp(cMilk, clamp((st.milk / Math.max(1e-6, st.water + st.milk)) * 1.25, 0, 0.7)); };

    const bA = board(root, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Temperature in the pan', S.fast > 1 ? `time-lapse ×${S.fast}` : 'real time');
      const t1 = Math.max(360, st.t * 1.08), stp = t1 > 900 ? 300 : 120, xt = []; for (let v = 0; v <= t1; v += stp) xt.push(v);
      const { X, Y } = axes(g, w, h, { x0: 70, y1: 58, y0: h - 44, xMax: t1, yMin: 0, yMax: 120, xTicks: xt, yTicks: [0, 20, 40, 60, 80, 100], xFmt: (v) => (v / 60).toFixed(0) + ' min', yFmt: (v) => v + '°' });
      dashH(g, X(0), X(t1), Y(100), 'boils, 100 °C', 'rgba(196,155,255,.8)'); dashH(g, X(0), X(t1), Y(65), 'IARC: sip below 65 °C', 'rgba(92,225,169,.8)');
      marks.forEach(([t, p]) => { g.strokeStyle = PH[p].c; g.lineWidth = 2; g.beginPath(); g.moveTo(X(t), Y(0)); g.lineTo(X(t), Y(108)); g.stroke(); g.font = '15px sans-serif'; g.fillStyle = PH[p].c; g.fillText(['', 'tea in', 'milk in', '', 'poured'][p], Math.min(X(t) + 5, w - 70), Y(108) - 4); });
      line(g, rows, X, Y, COL.hot, 5);
    }, B1);
    const bB = board(root, BW, BH, 632, 364, (g, w, h) => {
      const c = cupOf(st, S); panelBg(g, w, h); title(g, 'Out of the granules', 'and what your mouth feels');
      bars(g, [
        { label: 'Caffeine out', value: st.fc * 100, color: COL.caf, text: `${Math.round(st.fc * 100)}% · ${Math.round(c.mg)} mg a cup`, dark: true },
        { label: 'Tannins out', value: st.ft * 100, color: COL.tan, text: `${Math.round(st.ft * 100)}%`, dark: true },
        { label: 'Bound by milk', value: st.ft * c.bound * 100, color: COL.milk, text: st.milk > 0 ? `${Math.round(c.bound * 100)}% of them (sketch)` : 'no milk yet', dark: true },
        { label: 'Astringency felt', value: clamp(c.felt, 0, 1.3) * 100, color: c.felt > 0.6 ? COL.bad : c.felt > 0.3 ? COL.heat : COL.ok, text: c.felt > 0.6 ? 'harsh' : c.felt > 0.3 ? 'brisk' : st.ft > 0.2 ? 'smooth' : 'none yet', dark: true },
      ], { y: 58, w: 612, rowH: 58, labelW: 180, max: 150, font: 18 });
      g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText('Casein in milk holds tannins, so fewer grip your saliva.', 20, h - 18);
    }, B2);
    const lPh = stage.label('', [-1.1, 3.95, 0], root, 'hot'), lT = stage.label('', [1.45, 3.85, 0], root, 'hot'); lT.element.style.setProperty('--c', COL.hot);
    const lG = stage.label('CTC granules', [-1.1, 1.3, 1.6], root), lF = stage.label('froth: milk protein trapping steam', [-1.1, 3.35, 1.3], root);

    return {
      reset, preRun,
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lG, lF, ...th.lbls]); reelBoards([bA, bB], -0.7, stage, VIEW);
        if (s._reset) { s._reset = false; reset(s); }
        const n = Math.max(1, Math.round(s.fast)); for (let i = 0; i < n; i++) phys(dt);
        log();
        const vol = (st.water + st.milk) * 1000, done = st.ph === 4, c = cupOf(st, s), boil = clamp(st.steamW / 500, 0, 1);
        liquid(tmp);
        pan.set({ level: done ? 0.03 : clamp(vol / 600, 0.12, 1.1) + 0.35 * st.rise, color: tmp, opacity: st.ph === 0 ? 0.55 : 0.95, flame: done ? 0 : st.ph === 1 ? 0.45 : 0.95, boil: done ? 0 : Math.max(boil, st.T > 85 ? 0.15 : 0), froth: st.milk > 0 ? st.rise : boil * 0.15, steam: done ? 0.15 : clamp((st.T - 60) / 40, 0, 1) * (0.3 + 0.7 * boil), grains: st.ph >= 1 && !done ? clamp((s.cups * s.dose) / 10, 0.25, 1) : done ? 0.3 : 0 });
        pan.step(dt);
        const wy = pan.surfaceY();
        SP.forEach((p, i) => { const r = p.r * 1.0; sp.place(i, r * Math.cos(p.a), wy + 0.02, r * Math.sin(p.a), s.spice && st.ph >= 1 && !done ? 1 + (i % 3 === 0 ? 0.6 : 0) : 0.0001); sp.tint(i, tmp.set(p.c)); });
        sp.done(); liquid(tmp);
        cups.forEach((cp, i) => { cp.g.visible = i < s.cups; cp.set(done ? clamp(c.per / 170, 0.2, 0.95) : 0, tmp, 0.96); });
        th.set(st.T); lT.element.innerHTML = `<b>${st.T.toFixed(0)} °C</b>`;
        lPh.element.style.setProperty('--c', PH[st.ph].c); lPh.element.innerHTML = `<b>${PH[st.ph].n}</b>`;
        lG.visible = lG.visible && st.ph === 1; lF.visible = lF.visible && st.rise > 0.3 && !done;
        const k = `${rows.length}|${marks.length}|${Math.round(st.fc * 50)}|${Math.round(st.ft * 50)}|${st.ph}|${s.fast}|${s.sugar}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const c = cupOf(st, s), p = PH[st.ph];
        return `<div class="big" style="color:${p.c}">${p.n}</div>
          <div class="row"><span>Temperature · time on the stove</span><b style="color:${COL.hot}">${st.T.toFixed(0)} °C · ${fmtT(st.t)}</b></div>
          <div class="row"><span>Caffeine out · in each cup</span><b style="color:${COL.caf}">${Math.round(st.fc * 100)}% · ${Math.round(c.mg)} mg</b></div>
          <div class="row"><span>Tannins out · bound by milk</span><b style="color:${COL.tan}">${Math.round(st.ft * 100)}% · ${st.milk > 0 ? Math.round(c.bound * 100) + '%' : 'no milk'}</b></div>
          <div class="row"><span>Boiled away · ${st.ph === 4 ? 'in each cup' : 'in the pan now'}</span><b>${Math.round(st.evap * 1000)} ml · ${Math.round(st.ph === 4 ? c.per : (st.water + st.milk) * 1000)} ml</b></div>
          <div class="row"><span>Sugar · energy in each cup</span><b>${s.sugar * 4} g · about ${Math.round(s.sugar * 16 + GUIDE.cup * s.milk * 0.6)} kcal</b></div>
          <div class="row"><span>LPG burnt</span><b>${(st.gas * 1000).toFixed(1)} g</b></div>
          <small>${p.d} ICMR-NIN counts 30 to 65 mg of caffeine in a 150 ml cup of tea and advises keeping added sugar low. The "bound by milk" share is a sketch.</small>`;
      },
    };
  },
};
