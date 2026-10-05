// Chapter 2: the factory. One batch of 100 kg of plucked leaf followed through the five steps of
// black tea manufacture, one machine at a time (1 scene unit ≈ 40 cm).
// 1. Withering: leaf lies 12–18 h on a trough while a fan blows air up through it. Moisture falls
//    from about 77% to 68–72% for CTC (light wither) or about 55–65% for orthodox rolling (hard
//    wither). Curve: X = Xe + (X0 − Xe) e^(−t/τ), τ = 34 h in plain air, 17 h in warmed air (fitted
//    to that practice; see tea.js).
// 2. Breaking the cells. Orthodox: a rolling table twists the leaf under pressure. CTC (crush, tear,
//    curl): two toothed steel rollers turning towards each other at different speeds, one roughly ten
//    times faster than the other (typical), shred the leaf into granules. First used in 1930 at
//    Amgoorie tea garden, Assam, under William McKercher. Over 80% of India's tea is now CTC.
// 3. Oxidation ("fermentation"): the model of tea.js. CTC 55–110 min, orthodox 2–4 h, on cool humid
//    floors at about 20–30 °C.
// 4. Firing: hot air, about 90–120 °C at the dryer inlet, takes the leaf to about 3% moisture in
//    roughly 20 min and kills the enzyme (taken as dead once the leaf passes about 65 °C).
// 5. Sorting: vibrating sieves split the made tea by size into leaf, brokens, fannings and dust.
//    Grade shares shown are illustrative.
// Mass balance: 100 kg of leaf at 77% water holds 23 kg of dry matter, so it makes 23 ÷ 0.97 = 23.7 kg
// of tea at 3% moisture: about 4.2 kg of leaf for each kg of tea (the trade's round figure is 4.5).
import { THREE, M, swarm } from '../kit.js';
import {
  W_FRESH, wither, oxidise, tfPeak, fire, fireTimes, GRADES, T_KILL, leafColor, madeColor, css, COL, leafMesh, dots, puffs, chamber, flowArrow, makeThermo, rng, hex,
  board, panelBg, axes, title, line, dot, bars, legend, dashH, fitNarrow, reelBoards, clamp, lerp, box, beam, link, TAU, VIEW, BW, BH, B1, B2,
} from '../tea.js';

const STEPS = ['Wither', 'Cut or roll', 'Oxidise', 'Fire', 'Sort'];
const tmp = new THREE.Color(), tmp2 = new THREE.Color();
const RV = { pos: [-0.7, 5.8, 8.4], target: [-0.7, 5.4, 0] };
const DRY = 100 * (1 - W_FRESH);
function batch(s) {
  const w1 = wither(s.hours, s.warm), ox = oxidise(s.oxMin, s.oxT, s.method), pk = tfPeak(s.oxT, s.method), ft = fireTimes(s.inlet, w1);
  const rel = ox.tf / pk.tf, cup = s.oxMin < pk.t ? (rel < 0.85 ? 0 : 1) : rel < 0.8 ? 2 : 1;
  const want = s.method === 'ctc' ? [0.68, 0.72] : [0.55, 0.65];
  return { w1, ox, pk, ft, cup, want, mW: DRY / (1 - w1), made: DRY / 0.97 };
}
const CUPS = [{ n: 'Under-oxidised: raw, greenish, harsh', c: COL.leaf }, { n: 'Bright and brisk: stop here', c: COL.ok }, { n: 'Over-oxidised: soft, dull, flat', c: COL.tr }];

export default {
  id: 'factory',
  short: 'The factory',
  title: 'Leaf to black tea in a day',
  subtitle: 'Wither, cut, oxidise, fire, sort. Five steps, and the third one is a race against the clock.',
  view: VIEW,
  learn: `<p>Leaf plucked in the morning is black tea by the next day. The factory does five things to it.</p>
    <p><b>1. Wither.</b> The leaf is spread on a long trough and air is blown through it for 12 to 18 hours. It loses water, from about 77% down to about 70%, and goes limp like a day-old salad leaf. Now it can be worked without shattering.</p>
    <p><b>2. Break the cells.</b> The old way, <b>orthodox</b>, rolls and twists the leaf on a table. The Indian way is <b>CTC</b>: crush, tear, curl. Two steel rollers with sharp teeth, one spinning much faster than the other, shred the leaf into tiny granules. CTC was first used at Amgoorie garden in Assam in 1930. Today more than 80% of India's tea is made this way.</p>
    <p><b>3. Oxidise.</b> This is the heart of it. The torn leaf lies in cool, damp air and the enzyme goes to work (the story of the last chapter). Catechins fall. Orange <b>theaflavins</b> rise, giving brightness and briskness, then fall again as they are built on into red-brown <b>thearubigins</b>, which give colour and body. The tea maker must stop at the right moment. Warmth speeds everything up, as ${link('rateclear', 'RateClear')} explains, so a hot day shortens the window.</p>
    <p><b>4. Fire.</b> Hot air, about 100 °C, dries the leaf to about <b>3% water</b> in twenty minutes. The heat destroys the enzyme, which stops oxidation for good, and the leaf turns black.</p>
    <p><b>5. Sort.</b> Shaking sieves split the tea by size: whole leaf, brokens, fannings, dust. <b>Orange pekoe</b> is just one of these size grades. It has nothing to do with oranges.</p>
    <p><b>Safety:</b> CTC rollers and dryers are powerful machines. Workers have been badly hurt when loose clothing was caught, which is why guards and training matter.</p>
    <p class="tip"><b>Try it:</b> go to "Oxidise" and slide the minutes. Find the peak of the orange line, then raise the room temperature and see how much sooner it comes. Switch to orthodox and it takes hours.</p>`,
  terms: [
    { t: 'Withering', d: 'Letting plucked leaf lose water in moving air for 12 to 18 hours so it goes limp and its chemistry begins to change.' },
    { t: 'CTC', d: 'Crush, tear, curl: toothed rollers that shred withered leaf into small granules. They brew fast and strong, which suits chai.' },
    { t: 'Orthodox', d: 'The older method: the leaf is rolled and twisted, staying in larger pieces. Darjeeling and most fine teas are orthodox.' },
    { t: 'Oxidation', d: 'The enzyme-driven browning of crushed leaf in air. The trade calls it fermentation, but no microbes do the work.' },
    { t: 'Theaflavins', d: 'Orange-red molecules made early in oxidation. They give black tea its brightness and brisk bite.' },
    { t: 'Thearubigins', d: 'Red-brown molecules made later. They give black tea its colour and body.' },
    { t: 'Firing', d: 'Drying the leaf with hot air to about 3% moisture, which destroys the enzyme and makes the tea keep.' },
  ],
  defaults: { step: 2, hours: 14, warm: false, method: 'ctc', oxT: 25, oxMin: 50, inlet: 105 },
  controls: [
    { key: 'step', type: 'seg', label: 'Which step', options: STEPS.map((label, v) => ({ v, label })) },
    { key: 'method', type: 'seg', label: 'How the cells are broken', options: [{ v: 'ctc', label: 'CTC' }, { v: 'orthodox', label: 'Orthodox rolling' }] },
    { key: 'hours', type: 'range', label: 'Withering time', min: 0, max: 20, step: 0.5, ends: ['0 h', '20 h'], fmt: (v, s) => `${v} h · ${Math.round(wither(v, s.warm) * 100)}% water` },
    { key: 'warm', type: 'toggle', label: 'Warm the withering air', hint: 'Used in cold or wet weather, and for the harder wither that orthodox rolling needs.' },
    { key: 'oxT', type: 'range', label: 'Oxidation room temperature', min: 15, max: 38, step: 1, ends: ['15 °C', '38 °C'], fmt: (v) => v + ' °C' },
    { key: 'oxMin', type: 'range', label: 'Oxidation time', min: 0, max: 240, step: 1, ends: ['0', '4 h'], fmt: (v) => (v < 60 ? v + ' min' : `${Math.floor(v / 60)} h ${String(v % 60).padStart(2, '0')}`) },
    { key: 'inlet', type: 'range', label: 'Dryer air temperature', min: 80, max: 130, step: 1, ends: ['80 °C', '130 °C'], fmt: (v) => v + ' °C' },
  ],
  quiz: [
    { q: 'What does CTC stand for?', options: ['Cut, toast, cool', 'Crush, tear, curl', 'Clean, treat, colour', 'Chai tea company'], answer: 1, why: 'Two toothed rollers crush, tear and curl the leaf into granules. It was first used in Assam in 1930.' },
    { q: 'Why must the tea maker stop oxidation at the right moment?', options: ['The leaf would catch fire', 'Theaflavins, which make the cup bright and brisk, peak and then fall', 'The caffeine runs out', 'The leaf turns green again'], answer: 1, why: 'Theaflavins are made first, then turned into thearubigins. Stop too early and the tea is raw. Too late and it is soft and dull.' },
    { q: 'How does firing stop the oxidation?', options: ['It adds sugar', 'It removes the oxygen', 'Heat destroys the enzyme, and drying leaves it no water to work in', 'It freezes the leaf'], answer: 2, why: 'Polyphenol oxidase is a protein. Heat above about 65 °C wrecks it, and at 3% moisture nothing can react anyway.' },
  ],
  reel: [
    { ms: 5400, caption: 'In the factory, withered leaf meets CTC rollers: crush, tear, curl. Invented in Assam in 1930, they make most of India\'s tea.', set: { step: 1, method: 'ctc', hours: 14, warm: false, oxT: 25, oxMin: 50, inlet: 105 }, view: RV, spin: 0.1 },
    { ms: 5800, caption: 'Then the torn leaf oxidises: green turns copper. Stop too early and the tea is raw, too late and it is dull.', set: { step: 2, method: 'ctc', hours: 14, warm: false, oxT: 25, inlet: 105 }, anim: { oxMin: [0, 90] }, view: RV, spin: 0.08 },
  ],

  build({ stage, s: s0 }) {
    const top = new THREE.Group(); stage.root.add(top);
    const root = new THREE.Group(); root.position.x = -0.7; root.scale.setScalar(0.86); stage.root.add(root);
    const rnd = rng(17);
    let S = s0, key = '', tt = 0, fp = 0;
    const G = STEPS.map(() => { const g = new THREE.Group(); root.add(g); return g; }), L = STEPS.map(() => []);
    const lab = (i, html, pos, cls = '') => { const l = stage.label(html, pos, G[i], cls); L[i].push(l); return l; };
    const steel = () => M.metal(0x9aa3b0, { roughness: 0.4 });

    // ---- 0: the withering trough
    const trough = box(5.6, 0.9, 2.0, steel()); trough.position.set(0, 0.55, 0); G[0].add(trough);
    const mesh0 = box(5.5, 0.04, 1.9, M.matte(0x30343c)); mesh0.position.set(0, 1.02, 0); G[0].add(mesh0);
    const fanH = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.5, 28), steel()); fanH.rotation.z = Math.PI / 2; fanH.position.set(-3.1, 0.6, 0); G[0].add(fanH);
    const fan = new THREE.Group(); fan.position.set(-3.38, 0.6, 0); G[0].add(fan);
    for (let i = 0; i < 4; i++) { const b = box(0.04, 0.5, 0.16, M.matte(0x22252b)); b.position.y = 0.27; const h = new THREE.Group(); h.rotation.x = (i / 4) * TAU; h.add(b); fan.add(h); }
    const lg = leafMesh(0.62, 0.26, 0xffffff, 0.3).geometry, leafMat0 = new THREE.MeshStandardMaterial({ color: 0x4f9a35, roughness: 0.6, side: THREE.DoubleSide });
    const NL0 = 150, bed = swarm(NL0, lg, leafMat0); G[0].add(bed);
    const LV = Array.from({ length: NL0 }, () => ({ x: (rnd() - 0.5) * 5.1, z: (rnd() - 0.5) * 1.6, y: rnd(), a: rnd() * TAU, b: (rnd() - 0.5) }));
    const air0 = Array.from({ length: 5 }, (_, i) => { const a = flowArrow(hex(COL.cold), 0.04, 0.2); a.userData.x = -2.1 + i * 1.05; G[0].add(a); return a; });
    const vap0 = puffs(G[0], 50, 0.07, 0xbfe6ff, rnd);
    lab(0, 'fan', [-3.2, 1.5, 0]); const l0 = lab(0, '', [0, 2.6, 0], 'hot'); lab(0, 'withering trough: air blows up through the leaf', [0, 0.1, 1.2]);
    // ---- 1: CTC rollers, or the orthodox rolling table
    const ctc = new THREE.Group(), ort = new THREE.Group(); G[1].add(ctc, ort);
    const rollers = [-0.74, 0.74].map((x, k) => {
      const r = new THREE.Group(); r.position.set(x, 2.3, 0); ctc.add(r);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 1.9, 40), M.metal(k ? 0xb9c0cc : 0x8d96a3, { roughness: 0.35 })); c.rotation.x = Math.PI / 2; c.castShadow = true; r.add(c);
      for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, t = box(0.09, 0.1, 1.9, M.metal(0xdfe4ea, { roughness: 0.3 })); t.position.set(0.7 * Math.cos(a), 0.7 * Math.sin(a), 0); t.rotation.z = a + 0.5 * (k ? -1 : 1); r.add(t); }
      return r;
    });
    const frame = [box(0.12, 2.3, 0.12, steel()), box(0.12, 2.3, 0.12, steel())]; frame[0].position.set(-0.74, 1.15, -1.05); frame[1].position.set(0.74, 1.15, -1.05); ctc.add(...frame);
    const chute = box(1.5, 0.06, 1.6, steel()); chute.position.set(-1.35, 3.75, 0); chute.rotation.z = -0.5; ctc.add(chute);
    const tray = box(2.6, 0.1, 1.9, steel()); tray.position.set(0, 0.45, 0); G[1].add(tray);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.16, 48), M.metal(0xb38b52, { roughness: 0.5 })); table.position.y = 1.5; ort.add(table);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, b = box(1.3, 0.07, 0.09, M.metal(0x8a6a3c, { roughness: 0.5 })); b.position.set(0.85 * Math.cos(a), 1.6, 0.85 * Math.sin(a)); b.rotation.y = -a + 0.5; ort.add(b); }
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 36, 1, true), M.metal(0xc3c9d3, { roughness: 0.35, side: THREE.DoubleSide })); ort.add(hopper);
    const arm = box(2.2, 0.1, 0.1, steel()); ort.add(arm);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; ort.add(beam([1.5 * Math.cos(a), 0, 1.5 * Math.sin(a)], [1.5 * Math.cos(a), 1.5, 1.5 * Math.sin(a)], 0.07, steel())); }
    const feed = dots(60, 0.07, 0x4f9a35, 6, true), gran = dots(160, 0.05, 0x5f8a2c, 6, true); G[1].add(feed, gran);
    const FD = Array.from({ length: 60 }, () => ({ ph: rnd(), z: (rnd() - 0.5) * 1.4, j: rnd() })), GR = Array.from({ length: 160 }, () => ({ ph: rnd(), z: (rnd() - 0.5) * 1.5, x: (rnd() - 0.5), j: rnd() }));
    const l1 = lab(1, '', [0, 4.45, 0], 'hot'); const l1a = lab(1, 'slow roller', [-1.75, 2.3, 1.0]), l1b = lab(1, 'fast roller', [1.75, 2.3, 1.0]); lab(1, 'torn leaf', [0, 0.1, 1.2]);
    // ---- 2: the oxidation floor
    const floor2 = box(5.4, 0.25, 2.3, steel()); floor2.position.set(0, 0.6, 0); G[2].add(floor2);
    [-2.4, 2.4].forEach((x) => { const l = box(0.12, 0.5, 2.2, steel()); l.position.set(x, 0.25, 0); G[2].add(l); });
    const NG2 = 420, bed2 = dots(NG2, 0.075, 0x4f9a35, 6, true); G[2].add(bed2);
    const B2P = Array.from({ length: NG2 }, () => ({ x: (rnd() - 0.5) * 5.0, z: (rnd() - 0.5) * 1.95, y: rnd(), j: rnd() }));
    const mist = puffs(G[2], 40, 0.06, 0xbfe6ff, rnd);
    const hum = box(0.5, 0.5, 0.5, M.matte(0x3b4250)); hum.position.set(-2.3, 2.9, -0.8); G[2].add(hum);
    const th2 = makeThermo(G[2], stage, { x: 3.0, y: 0.5, h: 2.6, lo: 10, hi: 40, ticks: [15, 25, 35] }); L[2].push(...th2.lbls);
    const l2 = lab(2, '', [0, 2.25, 0], 'hot'), l2t = lab(2, '', [3.0, 3.45, 0], 'hot'); lab(2, 'cool, damp air: the leaf must not dry out yet', [-0.6, 3.5, -0.8]); l2t.element.style.setProperty('--c', COL.hot);
    // ---- 3: the dryer
    const dry = chamber(G[3], -2.0, 2.0, 1.0, 3.9, 1.9, { color: 0xffb547, opacity: 0.07, edge: 0xc9a45a });
    const plen = box(4.0, 0.7, 1.9, steel()); plen.position.set(0, 0.6, 0); G[3].add(plen);
    const plate3 = box(3.96, 0.04, 1.86, M.matte(0x30343c)); plate3.position.set(0, 1.0, 0); G[3].add(plate3);
    const heater = box(1.0, 1.0, 1.2, M.metal(0x7a5a3a, { roughness: 0.5 })); heater.position.set(-2.9, 0.6, 0); G[3].add(heater);
    const hGlow = box(0.7, 0.5, 0.9, M.glow(0xff7a3a)); hGlow.position.set(-2.9, 0.7, 0.2); hGlow.castShadow = false; G[3].add(hGlow);
    const NG3 = 300, bed3 = dots(NG3, 0.07, 0xb5651d, 6, true); G[3].add(bed3);
    const B3P = Array.from({ length: NG3 }, () => ({ x: (rnd() - 0.5) * 3.7, z: (rnd() - 0.5) * 1.6, y: rnd(), j: rnd(), ph: rnd() * TAU }));
    const air3 = Array.from({ length: 5 }, (_, i) => { const a = flowArrow(hex(COL.hot), 0.04, 0.2); a.userData.x = -1.6 + i * 0.8; G[3].add(a); return a; });
    const vap3 = puffs(G[3], 60, 0.08, 0xdfe8f5, rnd);
    const l3 = lab(3, '', [0, 4.35, 0], 'hot'); lab(3, 'air heater', [-2.9, 1.45, 0]); lab(3, 'hot air lifts and dries the leaf', [0, 0.1, 1.2]);
    // ---- 4: the sorter
    const sieves = [0, 1, 2].map((i) => { const s = box(3.4, 0.05, 1.6, M.metal([0xc3c9d3, 0xa9b1bd, 0x8d96a3][i], { roughness: 0.45 })); s.rotation.z = -0.14; G[4].add(s); return s; });
    const bins = [0, 1, 2, 3].map((i) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.44, 0.4, 24, 1, true), M.metal(0x8d96a3, { roughness: 0.5, side: THREE.DoubleSide })); b.position.set(-2.4 + i * 1.6, 0.2, 1.3); G[4].add(b); return b; });
    const NG4 = 320, bed4 = dots(NG4, 0.075, 0x2b1a10, 6, true); G[4].add(bed4);
    const B4P = Array.from({ length: NG4 }, (_, i) => ({ u: (i + 0.5) / NG4, a: rnd() * TAU, r: Math.sqrt(rnd()), j: rnd(), ph: rnd() }));
    const l4 = [0, 1, 2, 3].map((i) => lab(4, '', [-2.4 + i * 1.6, 1.0 + (i % 2) * 0.42, 1.3])); const l4t = lab(4, 'vibrating sieves: coarse on top, fine below', [0, 4.2, 0], 'hot');

    const bA = board(top, BW, BH, 632, 364, (g, w, h) => {
      const b = batch(S); panelBg(g, w, h);
      if (S.step === 0) {
        title(g, 'Water in the leaf while it withers'); legend(g, [['plain air', COL.cold], ['warmed air', COL.heat]], 24, 48, 17);
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 86, y0: h - 46, xMax: 20, yMin: 50, yMax: 80, xTicks: [0, 5, 10, 15, 20], yTicks: [50, 60, 70, 80], xFmt: (v) => v + ' h', yFmt: (v) => v + '%' });
        g.fillStyle = 'rgba(92,225,169,.18)'; g.fillRect(X(0), Y(b.want[1] * 100), X(20) - X(0), Y(b.want[0] * 100) - Y(b.want[1] * 100));
        g.font = '16px sans-serif'; g.fillStyle = COL.ok; g.fillText(`right for ${S.method === 'ctc' ? 'CTC' : 'orthodox rolling'}`, X(0) + 8, Y(b.want[1] * 100) + 18);
        for (const wm of [false, true]) { const p = []; for (let t = 0; t <= 20; t += 0.5) p.push([t, wither(t, wm) * 100]); line(g, p, X, Y, wm ? COL.heat : COL.cold, wm === !!S.warm ? 5 : 2.5); }
        dot(g, X(S.hours), Y(b.w1 * 100), S.warm ? COL.heat : COL.cold, 9);
      } else if (S.step === 1) {
        title(g, 'Why the cut matters', 'time to the theaflavin peak');
        const T = S.oxT, c = tfPeak(T, 'ctc').t, o = tfPeak(T, 'orthodox').t;
        bars(g, [{ label: 'CTC granules', value: c, color: S.method === 'ctc' ? COL.tf : '#8a94a6', text: `${Math.round(c)} min at ${T} °C`, dark: S.method === 'ctc' }, { label: 'Rolled orthodox leaf', value: o, color: S.method === 'ctc' ? '#8a94a6' : COL.tf, text: `${Math.round(o)} min at ${T} °C`, dark: S.method !== 'ctc' }], { y: 78, w: 612, rowH: 70, labelW: 210, max: 420 });
        g.font = '18px sans-serif'; g.fillStyle = COL.soft;
        ['CTC tears nearly every cell open, so the enzyme', 'reaches the catechins everywhere at once.', 'Rolling breaks fewer cells: slower, gentler, and', 'the leaf stays in bigger pieces.'].forEach((t, i) => g.fillText(t, 20, 250 + i * 26));
      } else if (S.step === 2) {
        title(g, 'Oxidation', `${S.method === 'ctc' ? 'CTC' : 'orthodox'}, ${S.oxT} °C, model`); legend(g, [['catechins', COL.cat], ['theaflavins ×4', COL.tf], ['thearubigins', COL.tr]], 24, 48, 17);
        const tMax = S.method === 'ctc' ? 150 : 300, st = tMax / 5, xt = [0, 1, 2, 3, 4, 5].map((i) => i * st);
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 86, y0: h - 46, xMax: tMax, yMax: 100, xTicks: xt, yTicks: [0, 50, 100], xFmt: (v) => v + ' min', yFmt: (v) => v + '%' });
        g.fillStyle = 'rgba(92,225,169,.16)'; const pkT = b.pk.t; g.fillRect(X(pkT * 0.72), Y(100), X(Math.min(tMax, pkT * 1.45)) - X(pkT * 0.72), Y(0) - Y(100));
        const a = [], f = [], r = [];
        for (let m = 0; m <= tMax; m += tMax / 75) { const o = oxidise(m, S.oxT, S.method); a.push([m, o.c * 100]); f.push([m, Math.min(100, o.tf * 400)]); r.push([m, o.tr * 100]); }
        line(g, a, X, Y, COL.cat, 4); line(g, r, X, Y, COL.tr, 4); line(g, f, X, Y, COL.tf, 5);
        const tm = Math.min(tMax, S.oxMin), o = oxidise(tm, S.oxT, S.method);
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(tm), Y(0)); g.lineTo(X(tm), Y(100)); g.stroke();
        dot(g, X(tm), Y(Math.min(100, o.tf * 400)), COL.tf, 9);
        g.font = '16px sans-serif'; g.fillStyle = COL.ok; g.fillText('bright and brisk', Math.min(X(pkT * 0.72) + 6, w - 150), Y(100) + 18);
      } else if (S.step === 3) {
        title(g, 'In the dryer', `air in at ${S.inlet} °C`); legend(g, [['water in the leaf, %', COL.water], ['leaf temperature, °C', COL.hot]], 24, 48, 17);
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 86, y0: h - 46, xMax: 40, yMax: 130, xTicks: [0, 10, 20, 30, 40], yTicks: [0, 30, 65, 100, 130], xFmt: (v) => v + ' min', yFmt: (v) => v });
        dashH(g, X(0), X(40), Y(T_KILL), 'enzyme destroyed above about 65 °C', 'rgba(92,225,169,.8)');
        const m1 = [], m2 = []; for (let t = 0; t <= 40; t += 0.5) { const f = fire(t, S.inlet, b.w1); m1.push([t, f.w * 100]); m2.push([t, f.T]); }
        line(g, m1, X, Y, COL.water, 5); line(g, m2, X, Y, COL.hot, 4);
        const f = fire(fp, S.inlet, b.w1); dot(g, X(Math.min(40, fp)), Y(f.w * 100), COL.water, 8); dot(g, X(Math.min(40, fp)), Y(f.T), COL.hot, 8);
        if (b.ft.to3 <= 40) { g.strokeStyle = COL.ok; g.lineWidth = 2; g.beginPath(); g.moveTo(X(b.ft.to3), Y(0)); g.lineTo(X(b.ft.to3), Y(22)); g.stroke(); g.font = '16px sans-serif'; g.fillStyle = COL.ok; g.fillText('3%', X(b.ft.to3) + 6, Y(12)); }
      } else {
        const gr = GRADES[S.method]; title(g, 'Off the sieves', 'illustrative shares');
        bars(g, gr.map((q, i) => ({ label: q.n, value: q.share * 100, color: ['#c9a45a', COL.tf, COL.tr, '#8a94a6'][i], text: q.share ? `${Math.round(q.share * 100)}% · ${(b.made * q.share).toFixed(1)} kg · about ${q.mm} mm` : 'none: CTC leaves no whole leaf' })), { y: 62, w: 612, rowH: 58, labelW: 210, max: 150, font: 18 });
        g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText('"Orange pekoe" is a size grade of whole leaf, not a flavour.', 20, h - 18);
      }
    }, B1);
    const bB = board(top, BW, BH, 632, 364, (g, w, h) => {
      const b = batch(S), fw = fire(1e3, S.inlet, b.w1).w; panelBg(g, w, h); title(g, 'The batch', '100 kg of plucked leaf');
      const rows = [['Plucked', 100, W_FRESH], ['Withered', b.mW, b.w1], ['Cut or rolled', b.mW, b.w1], ['Oxidised', b.mW, b.w1], ['Fired', b.made, 0.03]];
      rows.forEach(([n, kg, wv], i) => {
        const row = Math.min(4, S.step + 1), y = 58 + i * 50, on = i <= row, cur = i === row, bw = (kg / 100) * 330;
        g.font = `${cur ? 'bold ' : ''}18px sans-serif`; g.fillStyle = on ? COL.text : 'rgba(255,255,255,.35)'; g.fillText(`${i + 1}. ${n}`, 20, y + 24);
        g.globalAlpha = on ? 1 : 0.3; g.fillStyle = COL.water; g.fillRect(180, y + 6, bw * wv, 28); g.fillStyle = i < 3 ? COL.leaf : i === 3 ? css(leafColor(b.ox.x, tmp)) : '#6b4a32'; g.fillRect(180 + bw * wv, y + 6, bw * (1 - wv), 28); g.globalAlpha = 1;
        if (cur) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(179, y + 5, bw + 2, 30); }
        g.font = '17px sans-serif'; g.fillStyle = on ? COL.text : 'rgba(255,255,255,.35)'; g.fillText(`${kg.toFixed(1)} kg · ${Math.round(wv * 100)}% water`, 180 + bw + 10, y + 26);
      });
      g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText(`blue: water · the dry leaf stays ${DRY.toFixed(0)} kg throughout`, 20, h - 42);
      g.font = 'bold 18px sans-serif'; g.fillStyle = CUPS[b.cup].c; g.fillText(`In the cup: ${CUPS[b.cup].n}`, 20, h - 16);
    }, B2);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s; tt += dt;
        const narrow = fitNarrow(stage, []); reelBoards([bA, bB], -0.7, stage, VIEW);
        const b = batch(s), step = clamp(Math.round(s.step), 0, 4);
        G.forEach((g, i) => { g.visible = i === step; L[i].forEach((l) => { l.visible = i === step; }); });
        if (narrow) [l1a, l1b, ...th2.lbls].forEach((l) => { l.visible = false; });
        if (step === 0) {
          fan.rotation.x += dt * 14;
          const k = clamp((W_FRESH - b.w1) / 0.2, 0, 1); leafMat0.color.set(0x4f9a35).lerp(tmp.set(0x5d7f2e), k);
          LV.forEach((p, i) => bed.place(i, [p.x, 1.08 + p.y * (0.42 - 0.22 * k), p.z], [-1.2 + p.b * (0.9 - 0.7 * k), p.a, p.b * (0.8 - 0.6 * k)], 1 - 0.18 * k)); bed.done();
          air0.forEach((a, i) => { a.aim([a.userData.x, 1.5, 0.3 * Math.sin(i * 2)], [0, 1, 0], 0.55 + 0.12 * Math.sin(time * 4 + i)); a.traverse((o) => { if (o.material) o.material.color.set(s.warm ? COL.heat : COL.cold); }); });
          vap0.step(dt, s.hours > 0.2 ? 16 : 0, () => [(rnd() - 0.5) * 5, 1.5, (rnd() - 0.5) * 1.5], () => [0.2, 0.6 + rnd() * 0.4, 0], 1.6);
          const ok = b.w1 <= b.want[1] && b.w1 >= b.want[0];
          l0.element.style.setProperty('--c', ok ? COL.ok : COL.heat); l0.element.innerHTML = `<b>${Math.round(b.w1 * 100)}% water after ${s.hours} h: ${b.w1 > b.want[1] ? 'still too wet' : ok ? `right for ${s.method === 'ctc' ? 'CTC' : 'rolling'}` : 'too dry: it will crumble'}</b>`;
        } else if (step === 1) {
          const isC = s.method === 'ctc'; ctc.visible = isC; ort.visible = !isC; l1a.visible = l1a.visible && isC; l1b.visible = l1b.visible && isC;
          rollers[0].rotation.z -= dt * 1.2; rollers[1].rotation.z += dt * 12;
          const ox = 0.42 * Math.cos(tt * 2.4), oz = 0.42 * Math.sin(tt * 2.4); hopper.position.set(ox, 2.3, oz); arm.position.set(ox + 1.1, 2.6, oz);
          FD.forEach((p, i) => {
            const k = (tt * 0.5 + p.ph) % 1;
            if (isC) feed.place(i, lerp(-1.9, 0, Math.min(1, k * 1.6)), k < 0.62 ? lerp(4.15, 3.25, k / 0.62) : lerp(3.25, 2.7, (k - 0.62) / 0.38), p.z, k < 0.98 ? 1 : 0.0001);
            else feed.place(i, ox + 0.6 * p.j * Math.cos(p.ph * TAU + tt), 1.72 + 0.5 * ((p.ph * 7) % 1), oz + 0.6 * p.j * Math.sin(p.ph * TAU + tt), 1);
          });
          feed.done();
          GR.forEach((p, i) => {
            const k = (tt * 0.6 + p.ph) % 1;
            if (isC) gran.place(i, p.x * (0.25 + 1.6 * k), k < 0.5 ? lerp(1.75, 0.6, k / 0.5) : 0.55 + 0.1 * p.j, p.z, 0.8);
            else gran.place(i, 1.5 * p.j * Math.cos(p.ph * TAU + tt * 0.4), 1.62, 1.5 * p.j * Math.sin(p.ph * TAU + tt * 0.4), 1.3);
            gran.tint(i, tmp.set(0x5f8a2c));
          });
          gran.done(); tray.visible = isC;
          l1.element.style.setProperty('--c', COL.leaf); l1.element.innerHTML = isC ? '<b>CTC: crush, tear, curl</b>' : '<b>Orthodox: the rolling table twists the leaf</b>';
        } else if (step === 2) {
          leafColor(b.ox.x, tmp);
          B2P.forEach((p, i) => { bed2.place(i, p.x, 0.78 + p.y * 0.22, p.z, 0.8 + 0.6 * p.j); bed2.tint(i, tmp2.copy(tmp).offsetHSL(0, 0, (p.j - 0.5) * 0.08)); }); bed2.done();
          mist.step(dt, 10, () => [-2.3, 2.7, -0.8], () => [0.5 + rnd() * 0.9, -0.15 - rnd() * 0.3, (rnd() - 0.3) * 0.6], 2.2);
          th2.set(s.oxT); l2t.element.innerHTML = `<b>${s.oxT} °C</b>`;
          l2.element.style.setProperty('--c', CUPS[b.cup].c); l2.element.innerHTML = `<b>${s.oxMin} min: ${CUPS[b.cup].n.split(':')[0].toLowerCase()}</b>`;
        } else if (step === 3) {
          fp += dt * 2.6; if (fp > Math.min(40, b.ft.to3 + 6)) fp = 0;
          const f = fire(fp, s.inlet, b.w1), d = clamp((b.w1 - f.w) / (b.w1 - 0.03), 0, 1);
          leafColor(b.ox.x, tmp).lerp(madeColor(b.ox.x, tmp2), d);
          B3P.forEach((p, i) => { bed3.place(i, p.x, 1.1 + (0.25 + 0.9 * d) * p.y * (0.6 + 0.4 * Math.sin(time * (3 + 4 * p.j) + p.ph)) + 0.15 * p.y, p.z, 0.75 + 0.5 * p.j - 0.2 * d); bed3.tint(i, tmp); }); bed3.done();
          air3.forEach((a, i) => a.aim([a.userData.x, 1.15, 0.3 * Math.sin(i * 2)], [0, 1, 0], 0.6 + 0.15 * Math.sin(time * 5 + i)));
          vap3.step(dt, 30 * (1 - d), () => [(rnd() - 0.5) * 3.4, 3.9, (rnd() - 0.5) * 1.4], () => [0.1, 0.6 + rnd() * 0.5, 0], 1.6);
          hGlow.material.color.set(0xff7a3a).multiplyScalar(0.5 + (s.inlet - 80) / 100);
          l3.element.style.setProperty('--c', f.T >= T_KILL ? COL.ok : COL.hot); l3.element.innerHTML = `<b>${fp.toFixed(0)} min · leaf ${Math.round(f.T)} °C · ${Math.round(f.w * 100)}% water${f.T >= T_KILL ? ' · enzyme destroyed' : ''}</b>`;
          bA.redraw();
        } else {
          const gr = GRADES[s.method], cum = []; gr.reduce((a, q, i) => (cum[i] = a + q.share), 0);
          madeColor(b.ox.x, tmp);
          sieves.forEach((sv, i) => sv.position.set(0.04 * Math.sin(time * 30 + i), 3.5 - i * 0.75 + 0.02 * Math.sin(time * 37 + i * 2), -0.2));
          B4P.forEach((p, i) => {
            const gi = cum.findIndex((c) => p.u < c), k = (time * 0.25 + p.ph) % 1, q = gr[Math.max(0, gi)], sc = 0.6 + q.mm * 0.75;
            if (k < 0.3) { const lv = Math.min(gi, 2), kk = k / 0.3; bed4.place(i, lerp(-1.5, 1.5, kk), 3.58 - lv * 0.75 * Math.min(1, kk * 2.5) - 0.14 * 3.0 * (kk - 0.5) * 0.3 + 0.03 * Math.abs(Math.sin(time * 30 + i)), -0.2 + (p.j - 0.5) * 1.3, sc); }
            else { const bx = -2.4 + gi * 1.6; bed4.place(i, bx + 0.4 * p.r * Math.cos(p.a), 0.2 + 0.45 * p.j * (1 - p.r), 1.3 + 0.4 * p.r * Math.sin(p.a), sc); }
            bed4.tint(i, tmp);
          });
          bed4.done();
          l4.forEach((l, i) => { l.element.innerHTML = gr[i].share ? `${gr[i].n.split(' (')[0]} · ${Math.round(gr[i].share * 100)}%` : 'no whole leaf'; });
        }
        const k = `${step}|${s.method}|${s.hours}|${s.warm}|${s.oxT}|${s.oxMin}|${s.inlet}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const b = batch(s), step = clamp(Math.round(s.step), 0, 4), fmin = (m) => (isFinite(m) ? (m < 1 ? Math.round(m * 60) + ' s' : m.toFixed(0) + ' min') : 'never');
        return `<div class="big" style="color:${[COL.leaf, COL.leaf, css(leafColor(b.ox.x, tmp).lerp(tmp2.set(0xffffff), 0.25)), COL.hot, '#c9a45a'][step]}">${step + 1}. ${STEPS[step]}</div>
          <div class="row"><span>After withering ${s.hours} h</span><b style="color:${COL.water}">${Math.round(b.w1 * 100)}% water · ${b.mW.toFixed(0)} kg</b></div>
          <div class="row"><span>Cells broken by</span><b>${s.method === 'ctc' ? 'CTC rollers' : 'orthodox rolling'}</b></div>
          <div class="row"><span>Oxidised ${s.oxMin} min at ${s.oxT} °C</span><b style="color:${COL.cat}">${Math.round(b.ox.c * 100)}% catechins left</b></div>
          <div class="row"><span>Theaflavins · peak comes at</span><b style="color:${COL.tf}">${Math.round((b.ox.tf / b.pk.tf) * 100)}% of peak · ${Math.round(b.pk.t)} min</b></div>
          <div class="row"><span>Dryer: enzyme dead · down to 3%</span><b>${fmin(b.ft.kill)} · ${fmin(b.ft.to3)}</b></div>
          <div class="row"><span>Made tea from 100 kg of leaf</span><b>${b.made.toFixed(1)} kg</b></div>
          <small style="color:${CUPS[b.cup].c}">${CUPS[b.cup].n}.</small> <small>The oxidation curves are a teaching model set to factory practice, not measurements.</small>`;
      },
    };
  },
};
