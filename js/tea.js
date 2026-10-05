// Shared parts for TeaClear: the chemistry of turning a green leaf into tea and tea into a cup
// (mass balance of withering and firing, oxidation as a rate process, extraction of caffeine and
// tannins as first-order infusion), colours, chart boards, glowing dots, and the cups, leaves and
// pan that several chapters reuse. Scenes are built in "scene units": +x to the right, +y up.
// Boards, dots, puffs, the thermometer and the layout helpers are the ones GheeClear and CurdClear
// use, so the food-chemistry boxes look alike.
import { THREE, M, box, beam, sphere, arrow, clamp, lerp } from './kit.js';

// ---------------------------------------------------------------- constants
export const TAU = Math.PI * 2;
export const R_GAS = 8.314462618;   // J/(mol·K)
export const K0 = 273.15;
export const C_WATER = 4186;        // J/(kg·K), liquid water
export const C_MILK = 3930;         // J/(kg·K), whole milk (typical 3.9–3.95)
export const L_VAP = 2.257e6;       // J/kg, water boiling at 100 °C (the figure BoilClear and GheeClear use)
export const STOVE_ETA = 0.5;       // share of an LPG flame's heat that reaches a small pan (GheeClear's estimate)
export const AMB = 30;              // °C, an Indian kitchen (as in GheeClear)
// Arrhenius factor: how many times faster at T °C than at Tref °C, for an activation energy Ea kJ/mol.
// The same equation as RateClear: k = A e^(−Ea/RT).
export const arr = (EaKJ, T, Tref) => Math.exp(((EaKJ * 1000) / R_GAS) * (1 / (Tref + K0) - 1 / (T + K0)));

// ---------------------------------------------------------------- the leaf
// A fresh tea shoot is about 75–80% water (77% used here; Tocklai and withering reviews give 70–80%).
// Of the dry matter: catechins 10–25% (Deka et al., RSC Advances 2021, eight Tocklai cultivars),
// caffeine about 3–4% (Wikipedia, Tea and Camellia sinensis), theanine 1–2% (Wikipedia, Theanine).
// The two varieties differ: the Assam plant has bigger leaves and more catechins (typical values).
export const VARIETY = {
  assamica: { n: 'Assam plant', latin: 'var. assamica', cat: 22, caf: 4.0, the: 1.5, leaf: 1.25, note: 'big leaves, strong and malty: Assam, Dooars, most CTC' },
  sinensis: { n: 'China plant', latin: 'var. sinensis', cat: 15, caf: 3.0, the: 1.8, leaf: 0.8, note: 'small leaves, hardy in the cold: Darjeeling, Kangra, China, Japan' },
};
export const W_FRESH = 0.77;
// Moisture on a wet basis (w) and on a dry basis (X = kg water per kg dry matter).
export const toX = (w) => w / (1 - w), toW = (X) => X / (1 + X);

// ---------------------------------------------------------------- withering
// Leaf is spread on troughs and air is blown through it for 12–18 hours. Moisture falls from about
// 77% to 68–72% for CTC (a light wither) or to about 55–65% for orthodox rolling (a hard wither).
// Model: a simple drying curve, X(t) = Xe + (X0 − Xe) e^(−t/τ), with τ fitted to that practice:
// 34 h in plain air (77% → 70% in 14 h), 17 h with warmed air (77% → about 62% in 14 h).
export const X_EQ = 0.3;
export function wither(hours, warm) {
  const tau = warm ? 17 : 34, X = X_EQ + (toX(W_FRESH) - X_EQ) * Math.exp(-hours / tau);
  return toW(X);
}
// ---------------------------------------------------------------- oxidation ("fermentation")
// Once the cells are broken, polyphenol oxidase joins catechins with oxygen. Catechins fall, the
// orange theaflavins (TF) rise and then fall as they are built on into red-brown thearubigins (TR).
// Teaching model, two steps in a row:   catechins --k--> (16% as TF, the rest straight to TR),
//                                       TF --k2--> TR.
//   k  = 0.030 per min at 25 °C for CTC leaf, activation energy 58 kJ/mol (one reported value for tea
//        polyphenol oxidase);
//   k2 = 0.012 per min at 25 °C, with a higher hill of 80 kJ/mol (an assumption that reproduces the
//        well-known finding that cooler floors give more theaflavin and a brighter cup);
//   rolled orthodox leaf has fewer cells broken, so both steps run 0.4 times as fast.
// This puts the TF peak at about 80 min at 20 °C, 50 min at 25 °C and 33 min at 30 °C for CTC
// (factory practice: 55–110 min for CTC, 2–4 h for orthodox; studies report the TF peak at 90 min
// at 20 °C and, in a Tocklai study at 30 °C, by 20–40 min). It is a model, not a measurement.
export const OX = { k25: 0.030, Ea: 58, k2_25: 0.012, Ea2: 80, f: 0.16, orth: 0.4 };
export function oxRates(T, method = 'ctc') {
  const m = method === 'ctc' ? 1 : OX.orth;
  return { k: OX.k25 * arr(OX.Ea, T, 25) * m, k2: OX.k2_25 * arr(OX.Ea2, T, 25) * m };
}
// After t minutes at T °C: catechins, TF and TR as shares of the catechins the leaf started with.
export function oxidise(t, T, method = 'ctc') {
  const { k, k2 } = oxRates(T, method), c = Math.exp(-k * t);
  const tf = Math.abs(k2 - k) < 1e-9 ? OX.f * k * t * c : ((OX.f * k) / (k2 - k)) * (c - Math.exp(-k2 * t));
  return { c, tf, tr: Math.max(0, 1 - c - tf), x: 1 - c };
}
export function tfPeak(T, method = 'ctc') {
  const { k, k2 } = oxRates(T, method), t = Math.log(k / k2) / (k - k2);
  return { t, tf: oxidise(t, T, method).tf };
}
// The same chemistry read by how far the catechins have gone (x = 0…1), at 25 °C: used where the
// dial is "how oxidised", not minutes.
export function oxAt(x, T = 25) { const { k } = oxRates(T, 'ctc'); return oxidise(-Math.log(1 - clamp(x, 0, 0.985)) / k, T, 'ctc'); }

// ---------------------------------------------------------------- firing (drying)
// Hot air (about 90–120 °C at the inlet of a fluid-bed dryer) takes the leaf to about 3% moisture in
// roughly 20 minutes and kills the enzyme. Model: X(t) = Xe + (X0 − Xe) e^(−t/τ) with
// τ = 3.7 min × 70 ÷ (inlet − 40), fitted so 110 °C air takes 70% leaf to 3% in 20 min.
// Leaf temperature: near the air's wet-bulb temperature (about 45 °C) while wet, climbing towards the
// inlet temperature as it dries. Polyphenol oxidase is taken as dead above about 65 °C (typical).
export const X_DRY_EQ = 0.02, T_KILL = 65;
export function fire(min, inlet, w0) {
  const tau = (3.7 * 70) / Math.max(20, inlet - 40), X0 = toX(w0), X = X_DRY_EQ + (X0 - X_DRY_EQ) * Math.exp(-min / tau);
  const dry = 1 - clamp((X - X_DRY_EQ) / (X0 - X_DRY_EQ), 0, 1);
  return { w: toW(X), T: 45 + (inlet - 45) * dry * dry, tau };
}
export function fireTimes(inlet, w0) {
  const tau = (3.7 * 70) / Math.max(20, inlet - 40), X0 = toX(w0);
  const to3 = tau * Math.log((X0 - X_DRY_EQ) / (toX(0.03) - X_DRY_EQ));
  const dryK = Math.sqrt(clamp((T_KILL - 45) / Math.max(1, inlet - 45), 0, 1));     // dry share at which the leaf passes 65 °C
  const kill = dryK >= 1 ? Infinity : -tau * Math.log(1 - dryK);
  return { to3, kill };
}
// Grades off the sorting sieves (illustrative shares; real ones depend on the garden and the season).
// Sizes are typical sieve cuts. "Orange pekoe" is a leaf-size grade, not a flavour and not a quality mark.
export const GRADES = {
  orthodox: [{ n: 'Whole leaf (OP, FOP)', mm: 2.4, share: 0.15 }, { n: 'Brokens (BOP)', mm: 1.4, share: 0.5 }, { n: 'Fannings (BOPF)', mm: 0.7, share: 0.25 }, { n: 'Dust (D)', mm: 0.35, share: 0.1 }],
  ctc: [{ n: 'Whole leaf', mm: 2.4, share: 0 }, { n: 'Brokens (BP, BOP)', mm: 1.4, share: 0.55 }, { n: 'Fannings (PF, OF)', mm: 0.7, share: 0.3 }, { n: 'Dust (PD, D)', mm: 0.35, share: 0.15 }],
};

// ---------------------------------------------------------------- the brew
// Spiro and co-workers at Imperial College measured how fast caffeine leaves tea leaf: a first-order
// approach to equilibrium, c = c∞ (1 − e^(−kt)), limited by diffusion inside the swollen leaf.
//   Black orthodox Assam (Bukial FBOP, 1.70–2.00 mm leaf): k = 0.29, 0.414, 0.632 per min at 70, 80,
//   90 °C; activation energy 40 kJ/mol. Green Chun Mee: 0.56 per min at 80 °C, 62 kJ/mol.
//   (Spiro, Jaganyi & Broom, Food Chemistry 45, 333, 1992.)
//   Smaller leaf is faster: k rose 2.2 times from 850–1000 µm to 500–600 µm, and CTC teas were about
//   twice as fast again as orthodox leaf of the same size; caffeine always came out before theaflavin
//   (Price & Spiro, J. Sci. Food Agric. 36, 1309, 1985, from the abstract). A 2.2-fold rise for that
//   size step is k ∝ size^−1.5, which is used here from 1.85 mm down to 0.3 mm (an extrapolation
//   below 0.5 mm).
// Tannins (theaflavins, thearubigins and other polyphenols) are bigger molecules. They are given half
// caffeine's rate: an assumed ratio, in the measured order. Aroma is a sketch: it comes out fast and
// then leaves with the steam.
export const TEAS = {
  black: { n: 'Black, orthodox leaf', k80: 0.414, Ea: 40, caf: 25, ctc: 1, leaf: 0x3a2416, liq: 0xb24a12 },
  ctc: { n: 'Black, CTC', k80: 0.414, Ea: 40, caf: 30, ctc: 2, leaf: 0x2e1c12, liq: 0x9a3508 },
  green: { n: 'Green', k80: 0.56, Ea: 62, caf: 15, ctc: 1, leaf: 0x55702e, liq: 0xcfd66a },
};
// mg of caffeine per gram of dry tea: black 22–28, green 11–20 (Wikipedia, Tea); about 3% for Assam CTC.
export const SIZES = [{ v: 1.85, label: 'Whole leaf' }, { v: 1.2, label: 'Brokens' }, { v: 0.7, label: 'Fannings' }, { v: 0.35, label: 'Dust' }];
export const kCaf = (tea, T, mm) => { const t = TEAS[tea] || TEAS.black; return t.k80 * arr(t.Ea, T, 80) * Math.pow(1.85 / clamp(mm, 0.3, 1.85), 1.5) * t.ctc; };
export const TAN_RATIO = 0.5;
export const out = (k, min) => 1 - Math.exp(-k * Math.max(0, min));
// Wet leaves hold back some of the liquor: about 4 g of water for every gram of leaf (typical).
export const HOLD = 4;
export const sizeName = (mm) => SIZES.reduce((a, s) => (Math.abs(s.v - mm) < Math.abs(a.v - mm) ? s : a), SIZES[0]).label;

// ---------------------------------------------------------------- official guidance
// ICMR-NIN, Dietary Guidelines for Indians (2024): a 150 ml cup of tea has 30–65 mg of caffeine
// (brewed coffee 80–120 mg, instant coffee 50–65 mg); keep caffeine within 300 mg a day; avoid tea
// and coffee for at least an hour before and after meals, because tannins hinder iron absorption.
// EFSA (2015): up to 400 mg a day and 200 mg at once raise no safety concern for adults; 200 mg a
// day in pregnancy and while breastfeeding. IARC (2016, Monographs vol. 116): drinking very hot
// beverages, above 65 °C, is "probably carcinogenic to humans" (Group 2A); it is the temperature,
// not the drink.
export const GUIDE = { icmr: 300, efsa: 400, preg: 200, single: 200, hot: 65, mealGap: 60, cup: 150, sugar: 25 };

// ---------------------------------------------------------------- colours
const cA = new THREE.Color(), cB = new THREE.Color();
export function ramp(stops, k, out = new THREE.Color()) { // stops: [[k, hex], …]
  for (let i = 1; i < stops.length; i++) if (k <= stops[i][0] || i === stops.length - 1) {
    const [a, b] = [stops[i - 1], stops[i]];
    return out.copy(cA.set(a[1])).lerp(cB.set(b[1]), clamp((k - a[0]) / (b[0] - a[0]), 0, 1));
  }
  return out;
}
// The wet leaf on the fermenting floor, by how far its catechins have gone (0…1): green to copper.
export const leafColor = (x, o) => ramp([[0, 0x4f9a35], [0.3, 0x7d8f2c], [0.6, 0xa9772a], [0.85, 0xb5651d], [1, 0x7a3f18]], x, o);
// The same leaf after firing: dry and dark.
export const madeColor = (x, o) => ramp([[0, 0x5d7a36], [0.35, 0x6d6a2c], [0.7, 0x53321a], [1, 0x2b1a10]], x, o);
// The liquor in the cup: pale yellow-green, through amber, to bright red-brown. Strength 0…1 thins it
// towards a pale straw colour (a weak brew is mostly more see-through, which the cup's opacity shows).
const cW = new THREE.Color(0xf3ead2), cThin = new THREE.Color(0xe6bd6a);
export const liquorColor = (x, strength = 1, o = new THREE.Color()) => ramp([[0, 0xd6dd7a], [0.25, 0xe2c455], [0.55, 0xd98a22], [0.85, 0xb84a10], [1, 0x8a3008]], x, o).lerp(cThin, 0.6 * (1 - clamp(strength, 0, 1)));
export const css = (c) => '#' + c.getHexString();
export const COL = {
  hot: '#ff7a59', cold: '#6fb6ff', heat: '#ffb547', water: '#6fb6ff', steam: '#8ef0ff', ok: '#5ce1a9', latent: '#c49bff', text: '#e8eef8', bad: '#ff5d5d',
  leaf: '#7ed957', cat: '#c8e86b', tf: '#ffb23e', tr: '#d2603a', caf: '#f4f1e8', tan: '#e08a3c', aroma: '#c49bff', enz: '#6fb6ff', milk: '#fbf6ea', soft: 'rgba(255,255,255,.6)',
};
export const hex = (c) => new THREE.Color(c).getHex();
export function fmtW(W) { const a = Math.abs(W); return a >= 1000 ? (W / 1000).toFixed(1) + ' kW' : Math.round(a < 0.5 ? 0 : W) + ' W'; }
export const fmtT = (t) => (t >= 86400 ? `${(t / 86400).toFixed(1)} days` : t >= 3600 ? `${Math.floor(t / 3600)} h ${String(Math.floor((t % 3600) / 60)).padStart(2, '0')} min` : t >= 60 ? `${Math.floor(t / 60)} min ${String(Math.floor(t % 60)).padStart(2, '0')} s` : `${Math.round(t)} s`);
export const fmtG = (kg) => (kg >= 1 ? kg.toFixed(2) + ' kg' : Math.round(kg * 1000) + ' g');

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '' }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function legend(g, items, x = 24, y = 50, font = 18) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 16, 16); g.fillStyle = COL.text; g.fillText(n, x + 22, y + 15); x += 36 + g.measureText(n).width; }
}
export function dashH(g, X0, X1, y, text = '', col = 'rgba(255,255,255,.5)') {
  g.strokeStyle = col; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X0, y); g.lineTo(X1, y); g.stroke(); g.setLineDash([]);
  if (text) { g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(text, X1 - g.measureText(text).width - 4, y - 8); }
}
// Horizontal bars with labels: rows [{ label, value, color, text }].
export function bars(g, rows, { x = 20, y = 64, w = 600, rowH = 52, labelW = 230, unit = (v) => v, max = null, font = 19 } = {}) {
  const mx = max ?? Math.max(1e-9, ...rows.map((r) => Math.abs(r.value))) * 1.15, span = w - labelW - 20;
  rows.forEach((r, i) => {
    const yy = y + i * rowH, L = clamp(Math.abs(r.value) / mx, 0, 1) * span;
    g.font = `bold ${font}px sans-serif`; g.fillStyle = r.lcol || r.color; g.fillText(r.label, x, yy + 24);
    g.globalAlpha = 0.9; g.fillStyle = r.color; g.fillRect(x + labelW, yy + 6, Math.max(2, L), rowH - 18); g.globalAlpha = 1;
    g.font = `${font - 1}px sans-serif`; g.fillStyle = '#fff'; const t = r.text ?? unit(r.value), tw = g.measureText(t).width;
    const inside = x + labelW + L + 8 + tw > w; if (inside) g.fillStyle = r.dark ? '#111' : '#fff';
    g.fillText(t, inside ? x + labelW + L - tw - 8 : x + labelW + L + 8, yy + 25);
  });
}
export function wrap(g, text, x, y, maxW, lh) {
  let ln = '';
  for (const wd of text.split(' ')) { if (g.measureText(ln + wd).width > maxW && ln) { g.fillText(ln.trim(), x, y); y += lh; ln = ''; } ln += wd + ' '; }
  if (ln.trim()) { g.fillText(ln.trim(), x, y); y += lh; }
  return y;
}

// ---------------------------------------------------------------- statistics
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- 3D pieces
// Dots, one instanced mesh, each with its own colour. lit = true gives shaded balls.
export function dots(n, r, color = 0xffffff, seg = 8, lit = false) {
  const mat = lit ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }) : new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, col); o.position.set(0, -99, 0); o.scale.setScalar(0.0001); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// Little puffs that drift from a source: step(dt, rate, at, vel, life).
export function puffs(parent, n, r, color, rnd) {
  const d = dots(n, r, color); parent.add(d);
  const P = Array.from({ length: n }, () => ({ life: 0, max: 1, p: [0, -99, 0], v: [0, 0, 0] }));
  let acc = 0;
  return {
    mesh: d,
    step(dt, rate, at, vel, life = 1.2) {
      acc += rate * dt;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (q.life <= 0 && acc >= 1) { acc -= 1; q.life = q.max = life * (0.75 + 0.5 * rnd()); q.p = at(); q.v = vel(q.p); }
        if (q.life > 0) { q.life -= dt; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; }
        const k = q.life / q.max;
        d.place(i, q.p[0], q.p[1], q.p[2], q.life > 0 ? 0.35 + 0.65 * Math.sin(Math.PI * clamp(k, 0, 1)) : 0.0001);
      }
      if (acc > 20) acc = 20;
      d.done();
    },
    clear() { P.forEach((q) => { q.life = 0; }); acc = 0; },
  };
}
// A see-through glass box from (x0,y0) to (x1,y1), depth d, with bright edges.
export function chamber(parent, x0, x1, y0, y1, d, { color = 0xcfe8ff, opacity = 0.08, edge = 0x9fb4c8 } = {}) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, d), M.clear(color, opacity)); glass.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); g.add(glass);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: 0.7 }));
  e.position.copy(glass.position); g.add(e);
  parent.add(g); g.glass = glass; g.edges = e;
  return g;
}
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}
// The shared camera and board layout. The readout covers the upper left of the stage, so models stay
// low on the left and the two chart boards stack on the right.
export const VIEW = { pos: [2.2, 5.0, 11.6], target: [2.2, 4.2, 0] };
// Square and 16:9 recordings have no readout to dodge, so they frame the model and boards centrally.
export const REEL_VIEW = { pos: [1.9, 3.9, 12.4], target: [1.9, 3.4, 0] };
export const BW = 4.6, BH = 2.65, B1 = [6.1, 5.9, 0], B2 = [6.1, 2.9, 0];
// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// True while the Glassbox studio records the reel: scenes then choose their own camera views.
export const inReel = () => document.body.classList.contains('gb-reel');
// Chart boards sit to the right of the model on screen. In a tall (portrait) reel they stack above
// the model instead. Square and 16:9 recordings keep the chapter's own side-by-side view.
export function reelBoards(boards, x = 0, stage = null, view = null) {
  const r = inReel(), wide = r && stage && stage.camera.aspect > 0.9, phone = !r && stage && stage.host.clientWidth < 560;
  boards.forEach((b, i) => {
    if (!b.home) b.home = b.mesh.position.clone();
    if (r && !wide) { b.mesh.position.set(x, 10.9 - i * 4.05, 0); b.mesh.scale.setScalar(1.5); }
    else if (phone) { b.mesh.position.set(b.home.x - 0.3, b.home.y - 0.5, 0); b.mesh.scale.setScalar(1); }
    else { b.mesh.position.copy(b.home); b.mesh.scale.setScalar(1); }
  });
  if (wide && view) { stage.controls.autoRotate = false; if (stage.home?.pos !== REEL_VIEW.pos) stage.setView(REEL_VIEW.pos, REEL_VIEW.target, 0.01); }
}

// A thermometer standing beside the model: a glass tube whose red column follows T between lo and hi.
export function makeThermo(parent, stage, { x = 0, y = 0.4, h = 4, lo = 0, hi = 160, ticks = [0, 40, 100, 120, 160] } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, 0); parent.add(g);
  const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, h, 20), M.clear(0xdff2ff, 0.22)); tubeM.position.y = h / 2; g.add(tubeM);
  const bulb = sphere(0.19, M.glow(0xff5a3c)); bulb.castShadow = false; g.add(bulb);
  const geo = new THREE.CylinderGeometry(0.055, 0.055, 1, 12); geo.translate(0, 0.5, 0);
  const colm = new THREE.Mesh(geo, M.glow(0xff5a3c)); g.add(colm);
  const yOf = (T) => (clamp((T - lo) / (hi - lo), 0, 1)) * h;
  const lbls = ticks.map((t) => { const m = box(0.3, 0.025, 0.025, M.glow(0xb9c4d6)); m.castShadow = false; m.position.set(0.2, yOf(t), 0); g.add(m); return stage.label(`${t}°`, [0.62, yOf(t), 0], g); });
  const band = box(0.1, 0.01, 0.3, M.glow(0x5ce1a9)); band.castShadow = false; g.add(band);
  return {
    g, yOf, lbls,
    band(a, b) { band.scale.y = Math.max(1, (yOf(b) - yOf(a)) / 0.01); band.position.set(-0.2, (yOf(a) + yOf(b)) / 2, 0); band.visible = b > a; },
    set(T) { colm.scale.y = Math.max(0.01, yOf(T)); },
  };
}

export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;
export { clamp, lerp, beam, box, sphere };

// ---------------------------------------------------------------- tea pieces
// A tea leaf: a flat pointed blade with a fine saw edge, gently folded along the midrib. It lies in
// the x–y plane with its stalk end at the origin and its tip at +x.
export function leafMesh(len = 1.6, wid = 0.6, color = 0x4f9a35, fold = 0.35) {
  const sh = new THREE.Shape(), N = 28, w = (t) => (wid / 2) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.85) * (1 + 0.05 * Math.sin(t * 60));
  sh.moveTo(0, 0);
  for (let i = 1; i <= N; i++) { const t = i / N; sh.lineTo(t * len, w(t)); }
  for (let i = N - 1; i >= 0; i--) { const t = i / N; sh.lineTo(t * len, -w(t)); }
  const g = new THREE.ShapeGeometry(sh, 4), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, fold * Math.abs(y) + 0.12 * len * Math.pow(x / len, 2) * -1); }
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, mat); m.castShadow = true;
  const rib = beam([0, 0, 0.005], [len * 0.96, 0, -0.1 * len], 0.012 * len, new THREE.MeshStandardMaterial({ color: 0xcfe39a, roughness: 0.6 }), 6); rib.castShadow = false; m.add(rib);
  m.userData.mat = mat;
  return m;
}
// A plain glass tumbler with tea in it. set(level 0…1, colour, opacity).
export function makeCup(parent, { x = 0, y = 0, z = 0, r = 0.5, h = 1.1, taper = 0.78, saucer = true, glass = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const rb = r * taper, wall = new THREE.Mesh(new THREE.CylinderGeometry(r, rb, h, 40, 1, true), glass ? M.clear(0xdff2ff, 0.12) : new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.35, side: THREE.DoubleSide }));
  wall.position.y = h / 2 + 0.05; wall.renderOrder = 5; g.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(rb, rb, 0.05, 40), glass ? M.clear(0xdff2ff, 0.35) : new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.35 })); base.position.y = 0.045; g.add(base);
  if (saucer) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.2, 0.04, 40), new THREE.MeshStandardMaterial({ color: 0xe9e4d6, roughness: 0.4 })); sc.position.y = 0.02; sc.receiveShadow = true; g.add(sc); }
  const lm = new THREE.MeshStandardMaterial({ color: 0xb24a12, roughness: 0.55, envMapIntensity: 0.3, transparent: true, opacity: 0.92, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.BufferGeometry(), lm); liq.renderOrder = 2; g.add(liq);
  let lv = -1;
  const api = {
    g, r, h, mat: lm, topY: () => 0.07 + Math.max(0, lv) * (h - 0.12),
    set(level, color, opacity = 0.92) {
      level = clamp(level, 0, 1);
      if (Math.abs(level - lv) > 0.015) {
        lv = level; const hh = Math.max(0.01, level * (h - 0.12)), rt = lerp(rb, r, (hh + 0.02) / h) * 0.95;
        liq.geometry.dispose(); liq.geometry = new THREE.CylinderGeometry(rt, rb * 0.95, hh, 36); liq.position.y = 0.07 + hh / 2; liq.visible = level > 0.01;
      }
      if (color) { lm.color.copy(color).multiplyScalar(0.45); lm.emissive.copy(color).multiplyScalar(0.55); } lm.opacity = opacity;
      return api;
    },
  };
  api.set(0.85, null);
  return api;
}
// A steel saucepan, cut open towards you, on one burner of a gas stove: what most Indian homes make
// chai in. set({ level 0…1.3 (1 = the liquid as poured), color, flame 0…1, boil 0…1, froth 0…1,
// steam 0…1, grains 0…1 }) then step(dt).
export function makePan(parent, { x = 0, seed = 3 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); parent.add(g);
  const rnd = rng(seed), by = 0.98, RP = 1.25, HP = 1.7, flames = [];
  const body = box(4.0, 0.2, 3.6, M.metal(0x7d8591, { roughness: 0.45 })); body.position.y = 0.1; g.add(body);
  const cupB = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.3, 32), M.metal(0xc9a45a, { roughness: 0.4 })); cupB.position.y = 0.35; g.add(cupB);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 32), M.matte(0x22252b)); cap.position.y = 0.54; g.add(cap);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.785, c = Math.cos(a), s = Math.sin(a); g.add(beam([c * 2.0, 0.2, s * 1.7], [c * 1.5, by - 0.03, s * 1.5], 0.05, M.matte(0x1c1f25))); g.add(beam([c * 1.5, by - 0.03, s * 1.5], [c * 0.6, by - 0.03, s * 0.6], 0.05, M.matte(0x1c1f25))); }
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x4f9dff, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
  for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, f = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.42, 8), flameMat); f.geometry.translate(0, 0.21, 0); f.position.set(Math.cos(a) * 0.66, 0.5, Math.sin(a) * 0.66); f.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(f); flames.push(f); }
  const steel = M.metal(0xc3c9d3, { roughness: 0.32, side: THREE.DoubleSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(RP, RP, HP, 56, 1, true, Math.PI * 0.32, Math.PI * 1.36), steel); wall.position.y = by + HP / 2; wall.castShadow = true; g.add(wall);
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(RP, RP, 0.06, 56), M.metal(0x9aa1ac, { roughness: 0.4 })); bot.position.y = by + 0.03; g.add(bot);
  const hd = beam([-RP, by + HP - 0.25, 0], [-RP - 1.0, by + HP - 0.05, 0], 0.09, M.matte(0x1c1f25)); g.add(hd);
  const lm = new THREE.MeshStandardMaterial({ color: 0x9fc4e8, roughness: 0.25, transparent: true, opacity: 0.9, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(RP - 0.04, RP - 0.04, 1, 48), lm); liq.renderOrder = 2; g.add(liq);
  const NG = 120, grains = dots(NG, 0.045, 0x2e1c12, 6, true); grains.renderOrder = 3; g.add(grains);
  const G = Array.from({ length: NG }, () => ({ r: Math.sqrt(rnd()), a: rnd() * TAU, j: rnd() }));
  const NB = 80, bub = dots(NB, 0.06, 0xfdfbf0); bub.renderOrder = 3; g.add(bub);
  const B = Array.from({ length: NB }, () => ({ k: 0, r: 0, a: 0, y: 0, v: 1, j: rnd() }));
  const NF = 220, froth = dots(NF, 0.08, 0xfff6e0, 6, true); froth.renderOrder = 4; g.add(froth);
  const F = Array.from({ length: NF }, () => ({ r: Math.sqrt(rnd()), a: rnd() * TAU, j: rnd() }));
  const steam = puffs(g, 60, 0.085, 0xdfe8f5, rnd);
  const st = { level: 0.5, color: null, flame: 0, boil: 0, froth: 0, steam: 0, grains: 0, opacity: 0.9 };
  let acc = 0, tt = 0;
  const col = new THREE.Color();
  const api = {
    g, by, RP, HP, st,
    surfaceY: () => by + 0.06 + clamp(st.level, 0.02, 1.25) * 1.0,
    set(o) { Object.assign(st, o); return api; },
    step(dt) {
      tt += dt;
      const d = clamp(st.level, 0.02, 1.25) * 1.0, wy = by + 0.06 + d;
      flames.forEach((f, i) => { f.visible = st.flame > 0.02; f.scale.set(1, (0.3 + 1.2 * st.flame) * (0.85 + 0.3 * Math.sin(tt * 23 + i * 1.7)), 1); });
      liq.scale.y = d; liq.position.y = by + 0.06 + d / 2; if (st.color) lm.color.copy(st.color); lm.opacity = st.opacity;
      const stir = clamp(0.15 + st.boil, 0, 1);
      G.forEach((p, i) => {
        const r = p.r * (RP - 0.15), yb = by + 0.12, y = yb + stir * (d - 0.12) * (0.5 + 0.5 * Math.sin(tt * (1.2 + 2.5 * p.j) + i));
        grains.place(i, r * Math.cos(p.a + tt * 0.5 * stir), y, r * Math.sin(p.a + tt * 0.5 * stir), i < NG * st.grains ? 0.8 + 0.8 * p.j : 0.0001);
      });
      grains.done();
      acc += dt * st.boil * 90;
      B.forEach((b, i) => {
        if (b.k === 0 && acc >= 1) { acc -= 1; b.k = 1; b.r = (RP - 0.15) * Math.sqrt(rnd()); b.a = rnd() * TAU; b.y = by + 0.1; b.v = 1.4 + 1.6 * rnd(); }
        if (b.k) { b.y += dt * b.v; if (b.y > wy) b.k = 0; }
        bub.place(i, b.r * Math.cos(b.a), b.y, b.r * Math.sin(b.a), b.k ? 0.6 + 1.1 * b.j : 0.0001);
      });
      if (acc > 30) acc = 30;
      bub.done();
      const nF = Math.round(NF * clamp(st.froth, 0, 1));
      if (st.color) col.copy(st.color).lerp(cW, 0.6); else col.set(0xfff6e0);
      F.forEach((p, i) => { const r = p.r * (RP - 0.1); froth.place(i, r * Math.cos(p.a), wy + 0.03 + 0.25 * st.froth * p.j + 0.02 * Math.sin(tt * (4 + 6 * p.j) + i), r * Math.sin(p.a), i < nF ? 0.8 + 0.9 * p.j : 0.0001); froth.tint(i, col); });
      froth.done();
      steam.step(dt, st.steam * 40, () => { const a = rnd() * TAU, r = (RP - 0.2) * Math.sqrt(rnd()); return [r * Math.cos(a), wy + 0.15, r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.3, 0.7 + rnd() * 0.6, (rnd() - 0.5) * 0.3], 1.8);
    },
  };
  return api;
}

// On a phone the readout spans the whole stage, so it is cut to its headline and first three rows:
// the model and the chart boards then sit clear below it.
export function slim(html) {
  if (typeof window === 'undefined' || window.innerWidth >= 560 || !html) return html;
  let n = 0;
  return html.replace(/<small[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++n <= 3 ? m : ''));
}
export function withSlim(chapter) {
  const build = chapter.build;
  chapter.build = (ctx) => { const inst = build(ctx) || {}, r = inst.readout; if (r) inst.readout = (s) => slim(r(s)); return inst; };
  return chapter;
}
