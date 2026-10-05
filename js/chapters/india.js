// Chapter 6: tea in India, and tea and your day. Two scenes.
// "map": a stylised outline of India (not a survey map) with a column for each tea region, its height
//   the tea made there in 2024. Figures: Tea Board of India, "State wise/Region wise and Month wise
//   Tea Production for the year 2024 (Jan–Dec)", provisional, million kg, with the split between big
//   gardens (BG) and small growers (SG):
//     Assam Valley 610.52 (300.74 / 309.78), Cachar 39.32 (37.83 / 1.49), Dooars 209.43 (98.65 /
//     110.78), Terai 158.45 (29.47 / 128.98), Darjeeling 5.60 (5.51 / 0.09), other northern states
//     34.66 (11.97 / 22.69), Tamil Nadu 163.92 (55.16 / 108.76), Kerala 58.38 (48.24 / 10.14),
//     Karnataka 4.50 (4.20 / 0.30); all India 1,284.78 (591.77 / 693.01).
//   Darjeeling tea was India's first registered geographical indication (2004); the Tea Board
//   recognises 87 Darjeeling gardens. Heights of gardens are typical figures.
// "day": official guidance only.
//   ICMR-NIN, Dietary Guidelines for Indians (2024): a 150 ml cup of tea holds 30–65 mg of caffeine;
//     keep caffeine within 300 mg a day; avoid tea for at least an hour before and after meals,
//     because its tannins hinder iron absorption.
//   EFSA (2015): up to 400 mg a day, and up to 200 mg at one time, raise no safety concern for healthy
//     adults; up to 200 mg a day in pregnancy and while breastfeeding.
//   IARC (2016, Monographs vol. 116): drinking very hot beverages, above 65 °C, is probably
//     carcinogenic to humans (Group 2A). It is the temperature, not the tea.
//   Cooling: a small open cup poured at 85 °C in a 30 °C room, T = 30 + 55 e^(−t/15 min). The 15 minute
//     time constant is an estimate for a 150 ml cup; a kulhad or a steel glass will differ.
import { THREE, M } from '../kit.js';
import { GUIDE, AMB, COL, css, liquorColor, makeCup, makeThermo, puffs, rng, board, panelBg, axes, title, line, dot, bars, dashH, wrap, fitNarrow, reelBoards, clamp, lerp, box, hex, TAU, VIEW, BW, BH, B1, B2 } from '../tea.js';

const OUTLINE = [[68.2, 23.7], [68.6, 24.3], [70.9, 24.4], [70.0, 25.8], [70.3, 27.9], [72.0, 28.6], [73.4, 29.9], [74.6, 31.1], [75.4, 32.3], [74.1, 33.0], [73.8, 34.4], [73.0, 35.9], [74.6, 37.0], [77.8, 35.5], [80.2, 35.5], [79.2, 32.5], [78.8, 31.2], [81.0, 30.2], [80.1, 28.8], [83.3, 27.4], [85.2, 26.6], [88.1, 26.4], [88.1, 28.0], [88.9, 27.3], [89.8, 26.8], [92.1, 26.9], [91.6, 27.8], [94.2, 29.2], [96.2, 29.4], [97.4, 28.2], [96.2, 27.2], [95.2, 26.0], [94.6, 24.7], [93.4, 24.0], [93.2, 22.1], [92.6, 21.9], [92.3, 23.7], [91.3, 23.1], [91.2, 24.1], [92.2, 25.0], [89.9, 25.3], [89.8, 26.1], [88.4, 26.2], [88.9, 25.2], [88.1, 24.6], [88.7, 23.2], [89.0, 21.7], [87.0, 21.4], [86.5, 20.2], [85.1, 19.4], [84.1, 18.3], [82.3, 16.6], [80.3, 15.8], [80.1, 13.5], [79.8, 11.5], [79.3, 10.3], [78.9, 9.2], [78.2, 8.9], [77.5, 8.08], [76.5, 9.0], [75.7, 11.4], [74.8, 13.0], [74.0, 15.0], [73.0, 17.5], [72.8, 19.2], [72.9, 21.0], [72.6, 21.8], [72.2, 21.1], [71.0, 20.7], [69.2, 22.2], [70.3, 22.9], [69.0, 22.6]];
const ALL = { v: 1284.78, bg: 591.77, sg: 693.01 };
const COLS = [
  { id: 'assam', n: 'Assam Valley', at: [94.2, 26.9], v: 610.52 }, { id: 'assam', n: 'Cachar', at: [92.8, 24.7], v: 39.32, lo: [0.55, -0.15] },
  { id: 'dooars', n: 'Dooars', at: [89.3, 26.7], v: 209.43 }, { id: 'dooars', n: 'Terai', at: [88.3, 26.35], v: 158.45, lo: [-0.7, -0.25] }, { id: 'darjeeling', n: 'Darjeeling', at: [88.15, 27.25], v: 5.6, lo: [-0.7, 0.2] },
  { id: 'nilgiri', n: 'Tamil Nadu', at: [76.7, 11.4], v: 163.92 }, { id: 'kerala', n: 'Kerala', at: [77.1, 9.9], v: 58.38, lo: [0.6, -0.2] }, { id: 'other', n: 'Karnataka', at: [75.7, 13.3], v: 4.5 },
  { id: 'other', n: 'Other northern states', at: [91.6, 23.7], v: 34.66 }, { id: 'kangra', n: 'Kangra', at: [76.3, 32.1], v: 0 },
];
const REG = {
  assam: { n: 'Assam', v: 649.84, bg: 338.57, sg: 311.27, where: 'The Brahmaputra valley, close to sea level: hot, wet and flat. Cachar lies in the Barak valley to the south.', tea: 'The Assam plant: strong, dark, malty. Mostly CTC, the backbone of Indian chai.', gi: 'Assam Orthodox is a registered GI.' },
  darjeeling: { n: 'Darjeeling', v: 5.6, bg: 5.51, sg: 0.09, where: 'Steep Himalayan slopes in the north of West Bengal, roughly 600 to 2,000 m up. 87 recognised gardens.', tea: 'The China plant, made the orthodox way: light, floral, sold by flush (first, second, autumn).', gi: 'India\'s first registered GI, in 2004.' },
  dooars: { n: 'Dooars and Terai', v: 367.88, bg: 128.12, sg: 239.76, where: 'The plains and foothills of North Bengal below Darjeeling, on both sides of the Teesta.', tea: 'Mostly CTC: bright, full-bodied, widely blended. Two thirds now comes from small growers.', gi: '' },
  nilgiri: { n: 'Nilgiris and Tamil Nadu', v: 163.92, bg: 55.16, sg: 108.76, where: 'The "Blue Mountains" of the Western Ghats, about 1,000 to 2,500 m. Tea grows here all year.', tea: 'Fragrant and brisk. Both CTC and orthodox, and prized winter "frost" teas.', gi: 'Nilgiri (Orthodox) is a registered GI.' },
  kerala: { n: 'Kerala', v: 58.38, bg: 48.24, sg: 10.14, where: 'The high ranges around Munnar in Idukki, and Wayanad: rolling estates at about 1,500 m.', tea: 'Clean, bright teas, mostly from large estates.', gi: '' },
  kangra: { n: 'Kangra', v: null, bg: null, sg: null, where: 'The foothills of the Dhauladhar range in Himachal Pradesh. Tea was planted here in the mid-19th century.', tea: 'The China plant: green and orthodox black teas, in small amounts. Counted by the Tea Board within "other northern states" (34.66 million kg in all).', gi: 'Kangra tea is a registered GI.' },
};
const SC = 0.165, toXY = ([lon, lat]) => [(lon - 82.5) * SC, (lat - 22) * SC];
const RV = { pos: [-0.9, 5.8, 8.4], target: [-0.9, 5.4, 0] };
const coolT = (min) => AMB + (85 - AMB) * Math.exp(-min / 15);
const tmp = new THREE.Color();

export default {
  id: 'india',
  short: 'India and you',
  title: 'Tea in India, and in your day',
  subtitle: 'Where the leaf is grown and who grows it, and what official health guidance says about caffeine, meals and very hot cups.',
  view: VIEW,
  learn: `<p>India made about <b>1,285 million kg</b> of tea in 2024. Only China makes more. About four fifths of it never leaves the country: India is one of the world's great tea drinkers.</p>
    <p>Half of it comes from <b>Assam</b>, where the big-leaved Assam plant grows in the hot, wet Brahmaputra valley and makes strong, malty CTC. <b>Darjeeling</b> is the opposite: a tiny crop of delicate orthodox tea from the China plant on steep Himalayan slopes. It was India's first product protected by a <b>geographical indication</b>, in 2004. Below it lie the <b>Dooars and Terai</b>. In the south, tea climbs the <b>Nilgiris</b> and the high ranges around <b>Munnar</b>. <b>Kangra</b> in Himachal Pradesh grows a little too.</p>
    <p><b>Who makes it.</b> Tea is still plucked mostly by hand, mostly by women. Many Assam garden workers are descended from people brought there as indentured labourers in the 19th century, a harsh system in which many died. The Plantations Labour Act of 1951 made estates responsible for workers' housing, medical care, crèches and schooling. The daily cash wage in Assam's Brahmaputra valley gardens has been ₹250 since late 2023, with a ₹30 rise announced for April 2026. Workers' unions say that is too little to live on. More than half of India's tea now comes from <b>small growers</b>, who sell green leaf to factories.</p>
    <p><b>Tea and your day.</b> Official guidance is simple. India's <b>ICMR-NIN</b> advises keeping caffeine within <b>300 mg a day</b> and counts 30 to 65 mg in a 150 ml cup of tea. Europe's food safety authority, EFSA, puts the figure at 400 mg for healthy adults and 200 mg in pregnancy. ICMR-NIN also says to avoid tea for <b>an hour before and after meals</b>, because its tannins make it harder to absorb <b>iron</b>.</p>
    <p>And let it cool. The World Health Organization's cancer agency, IARC, classes drinking <b>very hot</b> drinks, above <b>65 °C</b>, as a probable cause of cancer of the food pipe. It is the heat, not the tea. Tea is a pleasant drink, not a medicine: no official body says it cures anything.</p>
    <p class="tip"><b>Try it:</b> on the map, compare Assam's column with Darjeeling's. Then switch to "Your day", count your own cups, and find how long a fresh cup takes to fall below 65 °C.</p>`,
  terms: [
    { t: 'Geographical indication (GI)', d: 'A legal tag saying a product comes from a named place and owes its character to it. Only tea grown in Darjeeling may be sold as Darjeeling tea.' },
    { t: 'Flush', d: 'A season of new growth. Darjeeling\'s first flush is plucked in spring, the second in early summer.' },
    { t: 'Small tea grower', d: 'A farmer with a small tea plot who sells plucked leaf to a factory. They now grow more than half of India\'s tea.' },
    { t: 'Tea Board of India', d: 'The government body, set up in 1954, that regulates and promotes Indian tea and publishes its statistics.' },
    { t: 'ICMR-NIN', d: 'The National Institute of Nutrition of the Indian Council of Medical Research, which writes India\'s dietary guidelines.' },
    { t: 'IARC', d: 'The International Agency for Research on Cancer, part of the World Health Organization.' },
  ],
  defaults: { mode: 'map', region: 'assam', cups: 4, mg: 50, preg: false, wait: 3, gap: 20 },
  controls: [
    { key: 'mode', type: 'seg', label: 'Show', options: [{ v: 'map', label: 'Where it grows' }, { v: 'day', label: 'Your day' }] },
    { key: 'region', type: 'seg', label: 'Region', options: Object.entries(REG).map(([v, r]) => ({ v, label: r.n.split(' and ')[0] })) },
    { key: 'cups', type: 'range', label: 'Cups of tea in a day', min: 0, max: 10, step: 1, ends: ['0', '10'], fmt: (v, s) => `${v} · ${v * s.mg} mg caffeine` },
    { key: 'mg', type: 'range', label: 'Caffeine in each 150 ml cup', min: 30, max: 65, step: 5, ends: ['30 mg, light', '65 mg, strong'], fmt: (v) => v + ' mg', hint: 'ICMR-NIN gives 30 to 65 mg for a 150 ml cup of tea.' },
    { key: 'preg', type: 'toggle', label: 'Pregnant or breastfeeding' },
    { key: 'wait', type: 'range', label: 'Wait before the first sip', min: 0, max: 15, step: 0.5, ends: ['straight away', '15 min'], fmt: (v) => `${v} min · ${Math.round(coolT(v))} °C` },
    { key: 'gap', type: 'range', label: 'Minutes between a meal and your tea', min: 0, max: 120, step: 5, ends: ['with the meal', '2 h'], fmt: (v) => v + ' min' },
  ],
  onChange(s, key) { if (key === 'region') s.mode = 'map'; if (['cups', 'mg', 'preg', 'wait', 'gap'].includes(key)) s.mode = 'day'; },
  quiz: [
    { q: 'Which region grows about half of India\'s tea?', options: ['Darjeeling', 'Assam', 'The Nilgiris', 'Kangra'], answer: 1, why: 'Assam made about 650 of India\'s 1,285 million kg in 2024. Darjeeling, though famous, made under 6 million kg.' },
    { q: 'Why does ICMR-NIN advise keeping tea an hour away from meals?', options: ['Tea cools the food', 'Tannins in tea make it harder to absorb iron from the meal', 'Caffeine spoils the taste', 'Milk curdles in the stomach'], answer: 1, why: 'Tannins bind iron in the gut. Leaving a gap of at least an hour before and after meals reduces that effect.' },
    { q: 'What exactly did IARC classify as a probable cause of cancer in 2016?', options: ['Tea', 'Caffeine', 'Drinking any beverage very hot, above 65 °C', 'Milk in tea'], answer: 2, why: 'It is the temperature that matters, not the drink. Letting a cup cool for a few minutes brings it below 65 °C.' },
  ],
  reel: [
    { ms: 5600, caption: 'India makes about 1.3 billion kg of tea a year, half of it in Assam, and drinks four fifths of it at home. Let your cup cool below 65 °C first.', set: { mode: 'map', region: 'assam', cups: 4, mg: 50, preg: false, wait: 3, gap: 20 }, view: RV, spin: 0.1 },
  ],

  build({ stage, s: s0 }) {
    const top = new THREE.Group(); stage.root.add(top);
    const root = new THREE.Group(); root.position.x = -0.75; stage.root.add(root);
    const rnd = rng(77);
    let S = s0, key = '';
    const Mp = new THREE.Group(), Dy = new THREE.Group(); root.add(Mp, Dy);
    const LM = [], LD = [];
    // ---- the map: a tilted slab, with upright columns standing on it
    const TILT = 0.6, cT = Math.cos(TILT), sT = Math.sin(TILT), Y0 = 1.25;
    const sh = new THREE.Shape(); OUTLINE.forEach((p, i) => { const [x, y] = toXY(p); if (i) sh.lineTo(x, y); else sh.moveTo(x, y); });
    const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x2f5d3a, roughness: 0.8 }));
    slab.rotation.x = -Math.PI / 2 + TILT; slab.position.set(0, Y0, 0); slab.castShadow = true; slab.receiveShadow = true; Mp.add(slab);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry, 30), new THREE.LineBasicMaterial({ color: 0x9fd486, transparent: true, opacity: 0.8 })); edge.rotation.copy(slab.rotation); edge.position.copy(slab.position); Mp.add(edge);
    const onMap = (p) => { const [x, y] = toXY(p); return [x, Y0 + y * sT + 0.14 * cT, -y * cT + 0.14 * sT]; };
    const cols = COLS.map((c) => {
      const h = Math.max(0.06, (c.v / 610.52) * 2.1), at = onMap(c.at);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, h, 20), new THREE.MeshStandardMaterial({ color: 0xffb547, roughness: 0.4, emissive: 0x000000 })); m.position.set(at[0], at[1] + h / 2, at[2]); m.castShadow = true; Mp.add(m);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), M.glow(0xffe08a)); cap.position.set(at[0], at[1] + h, at[2]); Mp.add(cap);
      const o = c.lo || [0, 0], l = stage.label('', [at[0] + o[0], at[1] + h + 0.3 + o[1], at[2]], Mp); LM.push(l);
      return { ...c, m, cap, l, h };
    });
    const lMap = stage.label('stylised outline · Tea Board of India figures for 2024', [0, 0.1, 2.2], Mp); LM.push(lMap);
    // ---- your day: a tray of cups, a caffeine gauge, one hot cup with a thermometer
    const tray = box(4.0, 0.08, 1.9, new THREE.MeshStandardMaterial({ color: 0x5a4332, roughness: 0.7 })); tray.position.set(-0.6, 0.3, 0.9); Dy.add(tray);
    const cups = Array.from({ length: 10 }, (_, i) => makeCup(Dy, { x: -2.2 + (i % 5) * 0.8, y: 0.34, z: 0.45 + Math.floor(i / 5) * 0.9, r: 0.3, h: 0.66, saucer: false }));
    const GH = 3.2, GX = 1.9, gy = (mg) => 0.5 + (clamp(mg, 0, 700) / 700) * GH;
    const gTube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, GH, 24), M.clear(0xdff2ff, 0.18)); gTube.position.set(GX, 0.5 + GH / 2, 0); Dy.add(gTube);
    const gGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 20); gGeo.translate(0, 0.5, 0);
    const gFill = new THREE.Mesh(gGeo, M.glow(0x5ce1a9)); gFill.position.set(GX, 0.5, 0); Dy.add(gFill);
    const rings = [[200, 'EFSA 200: pregnancy'], [300, 'ICMR-NIN 300'], [400, 'EFSA 400']].map(([mg, t]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 8, 32), M.glow(0xffffff)); r.rotation.x = Math.PI / 2; r.position.set(GX, gy(mg), 0); Dy.add(r); const l = stage.label(t, [GX + 0.95, gy(mg), 0.3], Dy); LD.push(l); return { mg, r, l }; });
    const lG = stage.label('', [GX, gy(700) + 0.35, 0], Dy, 'hot'); LD.push(lG);
    const hot = makeCup(Dy, { x: -1.5, y: 1.9, z: -0.9, r: 0.62, h: 1.25 }); const ped = box(1.9, 1.55, 1.5, new THREE.MeshStandardMaterial({ color: 0x3b4250, roughness: 0.6 })); ped.position.set(-1.5, 1.12, -0.9); Dy.add(ped);
    const th = makeThermo(Dy, stage, { x: -0.45, y: 2.0, h: 1.7, lo: 20, hi: 100, ticks: [65, 100] }); LD.push(...th.lbls); th.band(20, 65);
    const steam = puffs(Dy, 50, 0.08, 0xdfe8f5, rnd);
    const lHot = stage.label('', [-1.6, 4.05, -0.9], Dy, 'hot'); LD.push(lHot);

    const bA = board(top, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (S.mode === 'map') {
        title(g, 'Tea made in 2024', 'million kg · Tea Board of India');
        const rows = ['assam', 'dooars', 'nilgiri', 'kerala', 'darjeeling'].map((id) => { const r = REG[id], on = id === S.region; return { label: r.n.split(' and Tamil')[0], value: r.v, color: on ? COL.heat : '#8a94a6', lcol: on ? COL.text : COL.soft, text: `${r.v.toFixed(r.v < 10 ? 1 : 0)} · ${((r.v / ALL.v) * 100).toFixed(r.v < 10 ? 1 : 0)}%`, dark: on }; });
        bars(g, rows, { y: 56, w: 612, rowH: 50, labelW: 190, max: 820, font: 18 });
        g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText(`All India: ${ALL.v.toLocaleString('en-IN')} million kg (provisional). Second only to China.`, 20, h - 18);
      } else {
        const tot = S.cups * S.mg, lim = S.preg ? GUIDE.preg : GUIDE.icmr; title(g, 'Caffeine from your tea today', `${S.cups} cups × ${S.mg} mg`);
        const x0 = 30, x1 = w - 30, X = (v) => x0 + (clamp(v, 0, 700) / 700) * (x1 - x0), y = 120;
        g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x0, y, x1 - x0, 54); g.fillStyle = tot > lim ? COL.bad : tot > lim * 0.8 ? COL.heat : COL.ok; g.fillRect(x0, y, X(tot) - x0, 54);
        [[200, 'EFSA 200', 'pregnancy'], [300, 'ICMR-NIN 300', 'a day'], [400, 'EFSA 400', 'adults, a day']].forEach(([v, a, b], i) => { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(v), y - 14); g.lineTo(X(v), y + 68); g.stroke(); g.font = 'bold 16px sans-serif'; g.fillStyle = COL.text; g.fillText(a, X(v) - 40, i % 2 ? y + 90 : y - 40); g.font = '15px sans-serif'; g.fillStyle = COL.soft; g.fillText(b, X(v) - 40, i % 2 ? y + 110 : y - 22); });
        g.font = 'bold 26px sans-serif'; g.fillStyle = '#0b1220'; if (X(tot) - x0 > 110) g.fillText(tot + ' mg', x0 + 12, y + 36); else { g.fillStyle = COL.text; g.fillText(tot + ' mg', X(tot) + 10, y + 36); }
        g.font = '18px sans-serif'; g.fillStyle = COL.text;
        wrap(g, tot > lim ? `Over the ${S.preg ? 'EFSA figure for pregnancy' : 'ICMR-NIN limit'} of ${lim} mg, from tea alone. Coffee, cola and chocolate add more.` : `Within the ${S.preg ? 'EFSA figure for pregnancy' : 'ICMR-NIN limit'} of ${lim} mg, counting tea alone. Coffee, cola and chocolate add more.`, 30, 262, w - 60, 26);
        g.fillStyle = S.gap >= GUIDE.mealGap ? COL.ok : COL.heat; g.fillText(S.gap >= GUIDE.mealGap ? `Tea ${S.gap} min from the meal: the gap ICMR-NIN asks for.` : `Tea ${S.gap} min from the meal: ICMR-NIN asks for at least 60.`, 30, h - 18);
      }
    }, B1);
    const bB = board(top, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h);
      if (S.mode === 'map') {
        const r = REG[S.region] || REG.assam; title(g, r.n, r.v ? `${r.v.toFixed(r.v < 10 ? 2 : 1)} million kg in 2024` : 'a small, old tea district');
        g.font = '18px sans-serif'; g.fillStyle = COL.text; let y = wrap(g, r.where, 20, 66, w - 40, 25); y = wrap(g, r.tea, 20, y + 8, w - 40, 25);
        if (r.gi) { g.fillStyle = COL.heat; y = wrap(g, r.gi, 20, y + 8, w - 40, 25); }
        if (r.v) {
          const bw = w - 40, yy = h - 78, f = r.bg / (r.bg + r.sg);
          g.fillStyle = '#c9a45a'; g.fillRect(20, yy, bw * f, 30); g.fillStyle = COL.leaf; g.fillRect(20 + bw * f, yy, bw * (1 - f), 30);
          g.font = '16px sans-serif'; g.fillStyle = COL.soft; g.fillText(`big gardens ${Math.round(f * 100)}%  ·  small growers ${Math.round((1 - f) * 100)}%   (all India: ${Math.round((ALL.sg / ALL.v) * 100)}% small growers)`, 20, yy + 54);
        }
      } else {
        title(g, 'A fresh cup cooling', 'estimate for a small open cup');
        const { X, Y } = axes(g, w, h, { x0: 70, y1: 58, y0: h - 46, xMax: 15, yMin: 20, yMax: 100, xTicks: [0, 3, 6, 9, 12, 15], yTicks: [20, 40, 65, 85, 100], xFmt: (v) => v + ' min', yFmt: (v) => v + '°' });
        g.fillStyle = 'rgba(255,93,93,.14)'; g.fillRect(X(0), Y(100), X(15) - X(0), Y(65) - Y(100));
        dashH(g, X(0), X(15), Y(65), 'IARC: "very hot" is above 65 °C', 'rgba(255,255,255,.8)');
        const p = []; for (let t = 0; t <= 15; t += 0.25) p.push([t, coolT(t)]); line(g, p, X, Y, COL.hot, 5);
        dot(g, X(S.wait), Y(coolT(S.wait)), coolT(S.wait) > 65 ? COL.bad : COL.ok, 10);
      }
    }, B2);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, []); reelBoards([bA, bB], -0.75, stage, VIEW);
        const map = s.mode === 'map'; Mp.visible = map; Dy.visible = !map;
        LM.forEach((l) => { l.visible = map; }); LD.forEach((l) => { l.visible = !map; });
        if (map) {
          cols.forEach((c) => {
            const on = c.id === s.region; c.m.material.color.set(on ? 0xffb547 : 0x7c8798); c.m.material.emissive.set(on ? 0x5a3a08 : 0x000000); c.cap.material.color.set(on ? 0xffe08a : 0xaeb7c4);
            c.cap.scale.setScalar(on ? 1 + 0.15 * Math.sin(time * 4) : 0.8);
            c.l.visible = on || (!narrow && c.v > 150); c.l.element.className = 'lbl' + (on ? ' hot' : ''); if (on) c.l.element.style.setProperty('--c', COL.heat);
            c.l.element.innerHTML = c.v ? `${c.n} · ${c.v.toFixed(c.v < 10 ? 1 : 0)}` : c.n;
          });
          lMap.visible = !narrow;
        } else {
          const tot = s.cups * s.mg, lim = s.preg ? GUIDE.preg : GUIDE.icmr, T = coolT(s.wait);
          cups.forEach((c, i) => { c.g.visible = i < Math.max(1, s.cups); c.set(i < s.cups ? 0.85 : 0, liquorColor(0.9, 0.55 + (s.mg - 30) / 80, tmp).lerp(tmp.clone().set(0xf6efe0), 0.35), 0.96); });
          gFill.scale.y = Math.max(0.01, gy(tot) - 0.5); gFill.material.color.set(tot > lim ? 0xff5d5d : tot > lim * 0.8 ? 0xffb547 : 0x5ce1a9);
          rings.forEach((r) => { const mine = r.mg === lim; r.r.material.color.set(mine ? 0xffffff : 0x7c8798); r.l.visible = !narrow || mine; r.l.element.className = 'lbl' + (mine ? ' hot' : ''); if (mine) r.l.element.style.setProperty('--c', tot > lim ? COL.bad : COL.ok); });
          lG.element.style.setProperty('--c', tot > lim ? COL.bad : COL.ok); lG.element.innerHTML = `<b>${tot} mg today</b>`;
          hot.set(0.85, liquorColor(0.9, 0.8, tmp).lerp(tmp.clone().set(0xf6efe0), 0.35), 0.96); th.set(T);
          steam.step(dt, clamp((T - 40) / 45, 0, 1) * 22, () => { const a = rnd() * TAU, r = 0.5 * Math.sqrt(rnd()); return [-1.5 + r * Math.cos(a), 3.15, -0.9 + r * Math.sin(a)]; }, () => [(rnd() - 0.5) * 0.2, 0.6 + rnd() * 0.4, (rnd() - 0.5) * 0.2], 1.6);
          lHot.element.style.setProperty('--c', T > 65 ? COL.bad : COL.ok); lHot.element.innerHTML = `<b>${Math.round(T)} °C: ${T > 65 ? 'too hot' : 'fine to sip'}</b>`;
          if (narrow) th.lbls.forEach((l) => { l.visible = false; });
        }
        const k = `${s.mode}|${s.region}|${s.cups}|${s.mg}|${s.preg}|${s.wait}|${s.gap}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        if (s.mode === 'map') {
          const r = REG[s.region] || REG.assam;
          return `<div class="big" style="color:${COL.heat}">${r.n}</div>
            <div class="row"><span>Tea made in 2024</span><b>${r.v ? r.v.toFixed(r.v < 10 ? 2 : 1) + ' million kg' : 'small: within "others"'}</b></div>
            <div class="row"><span>Share of India's ${ALL.v.toLocaleString('en-IN')} million kg</span><b>${r.v ? ((r.v / ALL.v) * 100).toFixed(1) + '%' : 'under 3% with all others'}</b></div>
            <div class="row"><span>From small growers</span><b>${r.v ? Math.round((r.sg / r.v) * 100) + '%' : 'not listed'} · all India ${Math.round((ALL.sg / ALL.v) * 100)}%</b></div>
            <div class="row"><span>Drunk within India</span><b>about four fifths of the crop</b></div>
            <small>${r.where} ${r.tea} ${r.gi} Figures: Tea Board of India, 2024, provisional.</small>`;
        }
        const tot = s.cups * s.mg, lim = s.preg ? GUIDE.preg : GUIDE.icmr, T = coolT(s.wait), t65 = 15 * Math.log((85 - AMB) / (65 - AMB));
        return `<div class="big" style="color:${tot > lim ? COL.bad : COL.ok}">${tot} mg of caffeine</div>
          <div class="row"><span>${s.cups} cups × ${s.mg} mg</span><b>${tot > lim ? 'over' : 'within'} ${lim} mg (${s.preg ? 'EFSA, pregnancy' : 'ICMR-NIN'})</b></div>
          <div class="row"><span>EFSA, healthy adults</span><b>up to 400 mg a day, 200 mg at once</b></div>
          <div class="row"><span>First sip after ${s.wait} min</span><b style="color:${T > 65 ? COL.bad : COL.ok}">${Math.round(T)} °C · ${T > 65 ? 'above' : 'below'} IARC's 65 °C</b></div>
          <div class="row"><span>Poured at 85 °C, it passes 65 °C in</span><b>about ${t65.toFixed(0)} min</b></div>
          <div class="row"><span>Gap from your meal</span><b style="color:${s.gap >= 60 ? COL.ok : COL.heat}">${s.gap} min · ICMR-NIN: at least 60</b></div>
          <small>Guidance from ICMR-NIN (2024), EFSA (2015) and IARC (2016). The cooling curve is an estimate. This is general information, not medical advice: ask a doctor about your own health.</small>`;
      },
    };
  },
};
