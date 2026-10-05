// Chapter 4: the brew. One 150 ml glass (the cup size ICMR-NIN uses) drawn large, with leaf at the
// bottom and hot water on it. White dots are caffeine, orange dots are tannins (theaflavins,
// thearubigins and other polyphenols), lilac puffs are aroma leaving with the steam.
// Extraction is a first-order approach to equilibrium, c = c∞ (1 − e^(−kt)), limited by diffusion
// inside the swollen leaf (Spiro and co-workers, Imperial College):
//   caffeine from black orthodox Assam leaf of 1.70–2.00 mm: k = 0.29, 0.414, 0.632 per min at 70, 80
//   and 90 °C, activation energy 40 kJ/mol; green Chun Mee: 0.56 per min at 80 °C, 62 kJ/mol
//   (Spiro, Jaganyi & Broom, Food Chemistry 45, 333, 1992);
//   smaller leaf is faster, k ∝ size^−1.5 (2.2 times from 850–1000 µm to 500–600 µm), and CTC is about
//   twice as fast as orthodox leaf of the same size; caffeine comes out before theaflavin
//   (Price & Spiro, J. Sci. Food Agric. 36, 1309, 1985).
// Tannins are given half the rate of caffeine: an assumed ratio, in the measured order. The water is
// held at the chosen temperature (a real cup cools, which slows the end of the brew a little).
// Aroma is a sketch: out twice as fast as caffeine, then lost to the air with a time constant of
// 8 min (24 min under a lid). Caffeine per gram: black 22–28 mg, green 11–20 mg (Wikipedia, Tea).
// Wet leaf holds back about 4 g of liquor per gram.
// Taste words are set on "tannins in the cup, against a 2 g, 150 ml cup brewed to the end": a guide,
// not a measurement.
import { THREE, M } from '../kit.js';
import {
  TEAS, SIZES, kCaf, out, TAN_RATIO, HOLD, GUIDE, sizeName, liquorColor, css, COL, makeCup, makeThermo, dots, puffs, rng, board, panelBg, axes, title, line, dot, bars, legend,
  fitNarrow, reelBoards, clamp, lerp, link, TAU, VIEW, BW, BH, B1, B2,
} from '../tea.js';

const NM = 80, NLF = 90, ML = GUIDE.cup;
const tmp = new THREE.Color(), cLeaf = new THREE.Color();
const RV = { pos: [-0.5, 5.8, 8.4], target: [-0.5, 5.4, 0] };
const OXOF = { black: 0.9, ctc: 0.97, green: 0.03 };
function cup(s, t) {
  const tea = TEAS[s.tea] || TEAS.black, k = kCaf(s.tea, s.temp, s.size), kt = k * TAN_RATIO, fc = out(k, t), ft = out(kt, t);
  const tauA = s.lid ? 24 : 8, fa = out(2 * k, t) * Math.exp(-t / tauA), keep = 1 - (HOLD * s.dose) / ML;
  const idx = ft * (s.dose / 2), word = idx < 0.3 ? 0 : idx < 0.62 ? 1 : idx < 0.82 ? 2 : 3;
  return { tea, k, kt, fc, ft, fa, mg: s.dose * tea.caf * fc * keep, mgMax: s.dose * tea.caf * keep, idx, word };
}
const WORDS = [{ n: 'Thin: mostly hot water so far', c: COL.water }, { n: 'Balanced: bright, with some bite', c: COL.ok }, { n: 'Strong: full and astringent', c: COL.heat }, { n: 'Stewed: bitter and mouth-drying', c: COL.bad }];
const fmtMin = (m) => (m < 1 ? Math.round(m * 60) + ' s' : `${Math.floor(m)} min ${String(Math.round((m % 1) * 60) % 60).padStart(2, '0')} s`);

export default {
  id: 'brew',
  short: 'The brew',
  title: 'What comes out, and when',
  subtitle: 'Caffeine leaves the leaf fast. Tannins follow more slowly and keep coming. Time, temperature and leaf size decide the cup.',
  view: VIEW,
  learn: `<p>Brewing is <b>extraction</b>. Hot water soaks into the dry leaf, the leaf swells, and the molecules inside it wander out into the cup. They do not all leave at the same speed.</p>
    <p><b>Caffeine</b> is small and comes out quickly. From whole black leaf in water at 80 °C, half of it is out in under two minutes. That was measured, sample by sample, by chemists at Imperial College London.</p>
    <p><b>Tannins</b>, the theaflavins and thearubigins that give colour, body and that dry feeling in your mouth, are bigger molecules. They come out more slowly and <b>keep coming</b>. So a long brew does not add much more caffeine. It adds bitterness and <b>astringency</b>.</p>
    <p>Three dials change the speed. <b>Temperature</b>: hotter water makes everything faster, by the same law as any reaction (see ${link('rateclear', 'RateClear')}). Green tea is often brewed at 70 to 80 °C to keep it gentle. <b>Leaf size</b>: a small particle has a short path to its surface, so dust and fannings give up their goods in seconds. That is why a tea bag is quick. <b>Time</b>: you decide when to stop.</p>
    <p><b>Aroma</b> molecules escape first and leave with the steam. A lid on the pot keeps more of them in.</p>
    <p><b>Safety:</b> water just off the boil scalds. Pour away from yourself and keep the kettle out of a child's reach.</p>
    <p class="tip"><b>Try it:</b> brew whole leaf and watch the white dots outrun the orange ones. Start again with dust: both are out in seconds. Then drop the water to 70 °C.</p>`,
  terms: [
    { t: 'Extraction', d: 'Moving molecules out of a solid into a liquid. In a teacup, out of the swollen leaf into the water.' },
    { t: 'Tannins', d: 'The everyday word for tea\'s polyphenols: catechins, theaflavins and thearubigins. They give colour, body and astringency.' },
    { t: 'Astringency', d: 'The dry, puckering feeling when tannins grip the proteins in your saliva.' },
    { t: 'First-order process', d: 'One whose speed is in step with how much is left to go. Each minute removes the same share of what remains.' },
    { t: 'Half-time', d: 'How long it takes for half of what can come out to come out.' },
    { t: 'Fannings and dust', d: 'The smallest grades of tea. They brew very fast and fill most tea bags.' },
  ],
  defaults: { tea: 'black', size: 1.85, temp: 95, dose: 2, lid: false, fast: 10 },
  controls: [
    { key: 'tea', type: 'seg', label: 'Tea', options: Object.entries(TEAS).map(([v, t]) => ({ v, label: t.n })) },
    { key: 'size', type: 'seg', label: 'Leaf size', options: SIZES.map((z) => ({ v: z.v, label: z.label })), fmt: (v) => `about ${v} mm` },
    { key: 'temp', type: 'range', label: 'Water temperature', min: 60, max: 100, step: 1, ends: ['60 °C', '100 °C'], fmt: (v) => v + ' °C' },
    { key: 'dose', type: 'range', label: 'Leaf in the 150 ml cup', min: 1, max: 5, step: 0.5, ends: ['1 g', '5 g'], fmt: (v) => v + ' g', hint: 'A level teaspoon of leaf, or one tea bag, is about 2 g.' },
    { key: 'lid', type: 'toggle', label: 'Lid on', hint: 'Keeps more of the aroma from leaving with the steam.' },
    { key: 'fast', type: 'seg', label: 'Time', options: [{ v: 1, label: 'Real time' }, { v: 10, label: '×10' }, { v: 30, label: '×30' }] },
    { key: 'go', type: 'buttons', label: 'Your move', items: [{ label: 'Fresh leaf, fresh water', act: (s, inst) => inst.reset() }] },
  ],
  onChange(s, key) { if (s.tea === 'ctc' && s.size > 1.3) s.size = 1.2; if (key === 'tea' && s.tea === 'green' && s.temp > 85) s.temp = 80; },
  quiz: [
    { q: 'You leave a tea bag in for ten minutes. What mostly increases after the first two?', options: ['Caffeine', 'Tannins, so it turns bitter and astringent', 'Sugar', 'Aroma'], answer: 1, why: 'Caffeine is nearly all out early. The bigger tannin molecules keep coming, and they taste bitter and dry.' },
    { q: 'Why does tea dust brew faster than whole leaf?', options: ['Dust has more caffeine', 'Dust is older', 'Each particle is tiny, so molecules have a short path out', 'Dust floats'], answer: 2, why: 'Extraction is limited by how far molecules must travel inside the leaf. Small particles have short paths and far more surface.' },
    { q: 'Why is green tea often brewed with cooler water?', options: ['Hot water destroys caffeine', 'Cooler water slows extraction, keeping bitter catechins down', 'Green tea melts', 'It is a rule of the tea ceremony only'], answer: 1, why: 'Lower temperature slows everything, and the slow, bitter molecules are held back most in a short brew.' },
  ],
  reel: [
    { ms: 5600, caption: 'In the cup, caffeine rushes out of the leaf first. The bitter tannins follow slowly, and they keep coming.', set: { tea: 'black', size: 1.85, temp: 95, dose: 2, lid: false, fast: 36 }, act: (s, inst) => inst.reset(), view: RV, spin: 0.08 },
    { ms: 5200, caption: 'Smaller leaf, faster brew. Tea dust gives up in seconds what whole leaf takes minutes to release.', set: { tea: 'ctc', size: 0.35, temp: 95, dose: 2, lid: false, fast: 5 }, act: (s, inst) => inst.reset(), view: RV, spin: 0.08 },
  ],

  build({ stage, s: s0 }) {
    const top = new THREE.Group(); stage.root.add(top);
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(23);
    let S = s0, t = 0, key = '';
    const CXc = -1.3, R = 1.2, H = 2.5;
    const glass = makeCup(root, { x: CXc, y: 0.25, r: R, h: H, taper: 0.8 });
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.12, 48), new THREE.MeshStandardMaterial({ color: 0x5a4332, roughness: 0.7 })); tbl.position.set(CXc, 0.19, 0); tbl.receiveShadow = true; root.add(tbl);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, 0.06, 40), M.metal(0xc3c9d3, { roughness: 0.3 })); lid.position.set(CXc, 0.25 + H + 0.12, 0); root.add(lid);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), M.matte(0x22252b)); knob.position.y = 0.12; lid.add(knob);
    const rAt = (y) => lerp(R * 0.8, R, clamp(y / H, 0, 1)) * 0.9;
    const leaves = dots(NLF, 0.11, 0x3a2416, 7, true); leaves.renderOrder = 3; glass.g.add(leaves);
    const LF = Array.from({ length: NLF }, () => ({ a: rnd() * TAU, r: Math.sqrt(rnd()), y: rnd(), j: rnd() }));
    const mk = (col) => { const d = dots(NM, 0.055, col, 7); d.renderOrder = 4; glass.g.add(d); return d; };
    const caf = mk(0xffffff), tan = mk(0xe08a3c);
    const MP = () => Array.from({ length: NM }, (_, i) => ({ u: (i + 0.5) / NM, a: rnd() * TAU, r: Math.sqrt(rnd()), y: rnd(), ph: rnd() * TAU, k: 0, a0: rnd() * TAU, r0: Math.sqrt(rnd()) }));
    const CP = MP(), TP = MP();
    const aroma = puffs(root, 50, 0.07, 0xc49bff, rnd), steam = puffs(root, 40, 0.09, 0xdfe8f5, rnd);
    const th = makeThermo(root, stage, { x: 0.85, y: 0.45, h: 2.5, lo: 40, hi: 100, ticks: [60, 80, 100] });

    const bA = board(top, BW, BH, 632, 364, (g, w, h) => {
      const c = cup(S, t), tMax = t > 6 ? 12 : 6; panelBg(g, w, h); title(g, 'Out of the leaf', `${sizeName(S.size).toLowerCase()}, ${S.temp} °C`);
      legend(g, [['caffeine', COL.caf], ['tannins', COL.tan], ['aroma in the cup', COL.aroma]], 24, 48, 17);
      const { X, Y } = axes(g, w, h, { x0: 70, y1: 86, y0: h - 46, xMax: tMax, yMax: 100, xTicks: tMax > 6 ? [0, 3, 6, 9, 12] : [0, 1, 2, 3, 4, 5, 6], yTicks: [0, 50, 100], xFmt: (v) => v + ' min', yFmt: (v) => v + '%' });
      const a = [], b = [], d = [];
      for (let m = 0; m <= tMax + 1e-6; m += tMax / 90) { const q = cup(S, m); a.push([m, q.fc * 100]); b.push([m, q.ft * 100]); d.push([m, q.fa * 100]); }
      line(g, d, X, Y, COL.aroma, 3, [7, 5]); line(g, b, X, Y, COL.tan, 5); line(g, a, X, Y, COL.caf, 5);
      const tm = Math.min(tMax, t); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(tm), Y(0)); g.lineTo(X(tm), Y(100)); g.stroke();
      dot(g, X(tm), Y(c.fc * 100), COL.caf, 8); dot(g, X(tm), Y(c.ft * 100), COL.tan, 8);
    }, B1);
    const bB = board(top, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Same tea, same time, four sizes', `after ${fmtMin(Math.max(t, 0.02))}`);
      const rows = [];
      SIZES.forEach((z) => { if (S.tea === 'ctc' && z.v > 1.3) return; const q = cup({ ...S, size: z.v }, t), on = Math.abs(z.v - S.size) < 0.01; rows.push({ label: `${z.label}, ${z.v} mm`, value: q.fc * 100, color: on ? COL.caf : '#8a94a6', text: `caffeine ${Math.round(q.fc * 100)}% · tannins ${Math.round(q.ft * 100)}%`, dark: true, lcol: on ? COL.text : COL.soft }); });
      bars(g, rows, { y: 62, w: 612, rowH: 58, labelW: 190, max: 100, font: 18 });
      g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText('Bar: share of the leaf\'s caffeine now in the water.', 20, h - 18);
    }, B2);
    const lC = stage.label('caffeine', [CXc - 0.5, 2.6, 1.4], root), lT = stage.label('tannins', [CXc + 0.75, 1.0, 1.4], root, 'hot'); lT.element.style.setProperty('--c', COL.tan);
    const lA = stage.label('aroma leaving with the steam', [CXc, 3.75, 0], root, 'hot'); lA.element.style.setProperty('--c', COL.aroma);
    const lW = stage.label('', [CXc, 0.02, 1.9], root, 'hot'), lTh = stage.label('', [0.85, 3.3, 0], root, 'hot'); lTh.element.style.setProperty('--c', COL.hot);

    return {
      reset() { t = 0; [...CP, ...TP].forEach((p) => { p.k = 0; }); aroma.clear(); },
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lC, lT, ...th.lbls]); reelBoards([bA, bB], -0.5, stage, VIEW);
        t = Math.min(30, t + (dt * Math.max(1, s.fast)) / 60);
        const c = cup(s, t), lvl = 0.86, topY = glass.topY();
        liquorColor(OXOF[s.tea] ?? 0.9, clamp(c.idx * 1.25, 0.04, 1), tmp); glass.set(lvl, tmp, 0.3 + 0.64 * clamp(c.idx * 1.3, 0, 1));
        cLeaf.set(c.tea.leaf);
        const sc = 0.4 + s.size * 0.55, nL = Math.round(NLF * clamp((s.dose / 5) * (1.4 - 0.3 * s.size), 0.2, 1)), swell = 1 + 0.35 * clamp(t / 1.5, 0, 1);
        LF.forEach((p, i) => { const r = p.r * rAt(0.2) * 0.92, y = 0.12 + p.y * (0.18 + 0.1 * s.dose) + 0.03 * Math.sin(time * 1.5 + i) * clamp(1 - t / 2, 0, 1); leaves.place(i, r * Math.cos(p.a), y, r * Math.sin(p.a), i < nL ? sc * swell * (0.8 + 0.4 * p.j) : 0.0001); leaves.tint(i, cLeaf); });
        leaves.done();
        const move = (P, mesh, f) => {
          P.forEach((p, i) => {
            const free = p.u < f; p.k += ((free ? 1 : 0) - p.k) * Math.min(1, dt * 1.6 * Math.max(1, s.fast / 6));
            const y0 = 0.16 + 0.3 * p.y, y1 = lerp(0.3, topY - 0.12, p.y), y = lerp(y0, y1, p.k) + 0.06 * Math.sin(time * 1.4 + p.ph), rr = lerp(p.r0 * rAt(0.2) * 0.85, p.r * rAt(y), p.k), a = lerp(p.a0, p.a, p.k) + 0.25 * Math.sin(time * 0.7 + p.ph);
            mesh.place(i, rr * Math.cos(a), y, rr * Math.sin(a), p.k > 0.03 ? 0.5 + 0.5 * p.k : 0.0001);
          });
          mesh.done();
        };
        move(CP, caf, c.fc); move(TP, tan, c.ft);
        lid.visible = !!s.lid;
        const hot = clamp((s.temp - 50) / 50, 0, 1), k2 = 2 * c.k, rel = k2 * Math.exp(-k2 * t) / Math.max(k2, 1e-6);
        aroma.step(dt, s.lid ? 1.5 : 4 + 26 * clamp(rel, 0, 1), () => { const a = rnd() * TAU, r = R * 0.8 * Math.sqrt(rnd()); return [CXc + r * Math.cos(a), 0.25 + topY + 0.1, r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.3, 0.6 + rnd() * 0.5, (rnd() - 0.5) * 0.3], 2.2);
        steam.step(dt, s.lid ? 0 : 14 * hot, () => { const a = rnd() * TAU, r = R * 0.8 * Math.sqrt(rnd()); return [CXc + r * Math.cos(a), 0.25 + topY + 0.1, r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.3, 0.8 + rnd() * 0.6, (rnd() - 0.5) * 0.3], 1.8);
        th.set(s.temp); lTh.element.innerHTML = `<b>${s.temp} °C</b>`;
        lA.visible = !s.lid && t < 4; lC.visible = lC.visible && c.fc > 0.1; lT.visible = lT.visible && c.ft > 0.1;
        const wd = WORDS[c.word]; lW.element.style.setProperty('--c', wd.c); lW.element.innerHTML = `<b>${fmtMin(t)}: ${wd.n.split(':')[0].toLowerCase()}</b>`;
        const k = `${Math.round(t * 30)}|${s.tea}|${s.size}|${s.temp}|${s.dose}|${s.lid}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const c = cup(s, t), wd = WORDS[c.word];
        return `<div class="big" style="color:${wd.c}">${wd.n.split(':')[0]}</div>
          <div class="row"><span>Brewing for</span><b>${fmtMin(t)} at ${s.temp} °C</b></div>
          <div class="row"><span>Caffeine in the cup</span><b style="color:${COL.caf}">${Math.round(c.mg)} mg · ${Math.round(c.fc * 100)}% of the leaf's</b></div>
          <div class="row"><span>Tannins out</span><b style="color:${COL.tan}">${Math.round(c.ft * 100)}%</b></div>
          <div class="row"><span>Half out: caffeine · tannins</span><b>${fmtMin(Math.LN2 / c.k)} · ${fmtMin(Math.LN2 / c.kt)}</b></div>
          <div class="row"><span>Aroma still in the cup</span><b style="color:${COL.aroma}">${Math.round(c.fa * 100)}% (sketch)</b></div>
          <div class="row"><span>${s.dose} g of ${c.tea.n.toLowerCase()} can give</span><b>${Math.round(c.mgMax)} mg caffeine</b></div>
          <small>${wd.n}. ICMR-NIN counts 30 to 65 mg of caffeine in a 150 ml cup of tea. Caffeine rates are measured ones (Spiro and co-workers); the tannin rate is assumed to be half as fast.</small>`;
      },
    };
  },
};
