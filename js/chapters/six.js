// Chapter 3: one plant, six teas. Six glasses in a row: white, green, yellow, oolong, black, dark.
// All six are Camellia sinensis. What differs is what is done to the leaf, above all how far the
// catechins are allowed to oxidise before heat ("fixing", "kill-green" or firing) destroys the enzyme.
//   White: plucked, withered for one to three days, dried. Never rolled, never fixed: a slight natural
//     oxidation only.
//   Green: fixed first, in a hot pan (the Chinese way) or in steam (the Japanese way), then rolled and
//     dried. The enzyme dies before it can work.
//   Yellow: made like green tea, then wrapped warm and damp for 6–8 hours ("sealed yellowing").
//   Oolong: withered, bruised by tossing, part-oxidised (roughly 5–40% for light oolongs, 60–70% for
//     dark ones), then fixed, rolled and dried.
//   Black: withered, rolled or CTC-cut, fully oxidised, fired.
//   Dark (pu-erh and its kin): fixed like green tea, then truly fermented by moulds, bacteria and
//     yeasts. Ripe pu-erh is piled damp for about 45–60 days, a process developed in 1973.
//   (Wikipedia: Tea processing, Pu'er tea.) The percentages are the trade's rough language, not a
//   laboratory measure.
// The chemistry bars use the oxidation model of tea.js read by "share of catechins oxidised".
import { THREE, M } from '../kit.js';
import { oxAt, liquorColor, leafColor, madeColor, css, COL, makeCup, dots, rng, board, panelBg, title, bars, wrap, fitNarrow, reelBoards, clamp, lerp, VIEW, BW, BH, B1, B2, TAU } from '../tea.js';

const TEA = {
  white: { n: 'White', ox: 0.08, leaf: 0xa9b58a, strength: 0.55, eg: 'Darjeeling and Nilgiri silver tips; Bai Mudan from Fujian', line: 'Barely touched: withered and dried, nothing else.',
    steps: [['Pluck', 'buds and young leaves'], ['Wither', 'slowly, 1 to 3 days', 1], ['Dry', 'gently']] },
  green: { n: 'Green', ox: 0.02, leaf: 0x5d8a3a, strength: 0.75, eg: 'Kangra and Assam greens; Longjing (pan-fired); sencha (steamed)', line: 'Heated first, so the enzyme dies and the leaf stays green.',
    steps: [['Pluck', ''], ['Fix', 'hot pan or steam: enzyme destroyed', 1], ['Roll', 'shape the leaf'], ['Dry', '']] },
  yellow: { n: 'Yellow', ox: 0.06, leaf: 0x8a8f3a, strength: 0.7, eg: 'Junshan Yinzhen from Hunan: rare and slow to make', line: 'A green tea left wrapped warm and damp until it mellows.',
    steps: [['Pluck', ''], ['Fix', 'hot pan'], ['Wrap', 'warm and damp, 6 to 8 h', 1], ['Dry', '']] },
  oolong: { n: 'Oolong', ox: 0.4, leaf: 0x6a5a2a, strength: 0.85, eg: 'Darjeeling and Nilgiri oolongs; Tieguanyin and Wuyi from Fujian; Taiwan', line: 'Part-oxidised, then stopped with heat halfway.',
    steps: [['Pluck', ''], ['Wither', 'in sun and shade'], ['Bruise', 'toss to break the leaf edges'], ['Oxidise', 'partly', 1], ['Fix', 'hot pan stops it', 1], ['Roll and dry', '']] },
  black: { n: 'Black', ox: 0.97, leaf: 0x2b1a10, strength: 1, eg: 'Assam, Dooars and Nilgiri CTC; Darjeeling orthodox; Keemun', line: 'Cells broken and left to oxidise all the way.',
    steps: [['Pluck', ''], ['Wither', '12 to 18 h'], ['Roll or CTC', 'break the cells'], ['Oxidise', 'fully', 1], ['Fire', 'hot air stops it']] },
  dark: { n: 'Dark', ox: 0.02, leaf: 0x2a1c14, strength: 1, eg: 'Pu-erh from Yunnan; Liu Bao from Guangxi', line: 'The only tea that is truly fermented, by microbes.',
    steps: [['Pluck', ''], ['Fix', 'hot pan, like green tea'], ['Roll, sun-dry', ''], ['Pile damp', 'moulds, bacteria, yeasts: 45 to 60 days', 1], ['Dry, press', 'often into cakes']] },
};
const ORDER = ['white', 'green', 'yellow', 'oolong', 'black', 'dark'];
const DARK_LIQ = new THREE.Color(0x4a1608), tmp = new THREE.Color(), tmp2 = new THREE.Color();
const classify = (ox) => (ox < 0.06 ? 'green' : ox < 0.82 ? 'oolong' : 'black');
const WINDOW = { white: [0.04, 0.14], yellow: [0.03, 0.1], dark: [0, 0.06] };
const RV = { pos: [-0.1, 5.8, 8.4], target: [-0.1, 5.4, 0] };
const liq = (id, ox, out) => (id === 'dark' ? out.copy(DARK_LIQ) : id === 'white' ? out.set(0xe6dc9a) : id === 'yellow' ? out.set(0xe8c94a) : liquorColor(ox, 1, out));

export default {
  id: 'six',
  short: 'Six teas',
  title: 'One plant, six teas',
  subtitle: 'White, green, yellow, oolong, black and dark are not six plants. They are six answers to one question: when do you stop the enzyme?',
  view: VIEW,
  learn: `<p>Green tea and black tea are the same leaf. So are white, yellow, oolong and dark tea. What makes them different is <b>what is done to the leaf</b>, and above all <b>when it is heated</b>.</p>
    <p><b>Green tea</b> is heated straight away. In China the leaf is tossed in a hot pan. In Japan it is steamed. Either way the enzyme dies, so the leaf cannot brown. It stays green and keeps most of its catechins.</p>
    <p><b>Black tea</b> goes the other way. The cells are broken and the leaf is left in air until nearly all the catechins have become theaflavins and thearubigins. Only then is it fired.</p>
    <p><b>Oolong</b> sits in between. The leaf is bruised, allowed to oxidise part of the way, and then stopped with heat. A light oolong is close to green. A dark one is close to black.</p>
    <p><b>White tea</b> is the least handled: buds and young leaves are simply withered and dried. <b>Yellow tea</b> is a green tea that is wrapped warm and damp for some hours, which softens its grassy edge.</p>
    <p><b>Dark tea</b>, such as pu-erh from Yunnan, is the odd one out. It is fixed like green tea and then piled up damp so that <b>moulds, bacteria and yeasts</b> work on it for weeks. It is the only tea that is truly <b>fermented</b>.</p>
    <p>By law in India, only the leaf of Camellia sinensis may be sold as "tea". A drink of tulsi, chamomile or hibiscus is a herbal infusion.</p>
    <p class="tip"><b>Try it:</b> drag "Oxidation before heat stops it" from 0 to 100% and watch the leaf, the liquor and the name change. Then pick "Dark" and read its steps.</p>`,
  terms: [
    { t: 'Fixing', d: 'Heating fresh leaf in a pan or in steam to destroy the enzyme. Also called kill-green. It is what keeps green tea green.' },
    { t: 'Oolong', d: 'A tea oxidised part of the way and then fixed. The name covers everything from nearly green to nearly black.' },
    { t: 'White tea', d: 'Tea made from buds and young leaves that are only withered and dried.' },
    { t: 'Dark tea', d: 'Tea fermented by microbes after fixing. Pu-erh from Yunnan is the best known.' },
    { t: 'Liquor', d: 'The tea trade\'s word for the brewed drink in the cup.' },
    { t: 'Herbal infusion', d: 'A drink brewed from any other plant, such as tulsi or chamomile. Also called a tisane. It is not tea.' },
  ],
  defaults: { tea: 'black', ox: 0.97, fixer: 'pan' },
  controls: [
    { key: 'tea', type: 'seg', label: 'Which tea', options: ORDER.map((v) => ({ v, label: TEA[v].n })) },
    { key: 'ox', type: 'range', label: 'Oxidation before heat stops it', min: 0, max: 1, step: 0.01, ends: ['none', 'all the way'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'fixer', type: 'seg', label: 'Green tea: how it is fixed', options: [{ v: 'pan', label: 'Hot pan (China)' }, { v: 'steam', label: 'Steam (Japan)' }], hint: 'Steaming is quicker and keeps the leaf a brighter green. Pan-firing gives a toastier taste.' },
  ],
  onChange(s, key) {
    if (key === 'tea' && TEA[s.tea]) s.ox = TEA[s.tea].ox;
    if (key === 'ox') { const w = WINDOW[s.tea]; if (!(w && s.ox >= w[0] && s.ox <= w[1])) s.tea = classify(s.ox); }
  },
  quiz: [
    { q: 'What is the main difference between green tea and black tea?', options: ['They come from different plants', 'Green tea is heated early so it cannot oxidise; black tea is oxidised fully', 'Black tea is roasted green tea', 'Green tea has no caffeine'], answer: 1, why: 'Both are Camellia sinensis. Fixing the leaf first destroys the enzyme and keeps it green. Leaving broken leaf in air turns it black.' },
    { q: 'Which tea is truly fermented by microbes?', options: ['Black tea', 'Oolong', 'Dark tea such as pu-erh', 'White tea'], answer: 2, why: 'Dark teas are piled damp so moulds, bacteria and yeasts can work on them. What black-tea makers call fermentation is really oxidation by the leaf\'s own enzyme.' },
    { q: 'Where does oolong sit?', options: ['Between green and black: partly oxidised', 'Below white tea', 'It is a herbal infusion', 'It is black tea with milk'], answer: 0, why: 'Oolong leaf is bruised, allowed to oxidise part of the way, then fixed with heat.' },
  ],
  reel: [
    { ms: 6000, caption: 'Green, oolong and black tea are the same leaf. The only question is how long it oxidises before heat stops the enzyme.', set: { tea: 'green', fixer: 'pan' }, anim: { ox: [0, 0.97] }, view: RV, spin: 0.08 },
  ],

  build({ stage, s: s0 }) {
    const top = new THREE.Group(); stage.root.add(top);
    const root = new THREE.Group(); root.position.x = -0.1; stage.root.add(root);
    const rnd = rng(9);
    let S = s0, key = '';
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.16, 2.6), new THREE.MeshStandardMaterial({ color: 0x5a4332, roughness: 0.7 })); shelf.position.set(0, 0.3, 0.2); shelf.receiveShadow = true; root.add(shelf);
    const X = (i) => -2.8 + i * 1.12;
    const cups = ORDER.map((id, i) => {
      const g = new THREE.Group(); g.position.set(X(i), 0.38, 0); root.add(g);
      const cup = makeCup(g, { r: 0.42, h: 0.95, saucer: false });
      const pile = dots(46, 0.05, TEA[id].leaf, 6, true); g.add(pile);
      const P = Array.from({ length: 46 }, () => { const a = rnd() * TAU, r = 0.36 * Math.sqrt(rnd()); return [r * Math.cos(a), 0.04 + 0.16 * rnd() * (1 - r / 0.36), 0.95 + r * Math.sin(a) * 0.7, 0.8 + rnd() * 0.9]; });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 8, 48), M.glow(0xffb547)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; g.add(ring);
      const lbl = stage.label(TEA[id].n, [0, 1.45, 0], g);
      return { id, g, cup, pile, P, ring, lbl, k: 0 };
    });
    const lNote = stage.label('', [0, 3.3, 0], root, 'hot');
    const lSame = stage.label('all six: Camellia sinensis', [0, 0.05, 1.7], root);

    const bA = board(top, BW, BH, 632, 364, (g, w, h) => {
      const t = TEA[S.tea] || TEA.black; panelBg(g, w, h); title(g, `${t.n} tea: what is done to the leaf`);
      const n = t.steps.length, cw = Math.min(196, (w - 40 - (Math.min(n, 3) - 1) * 14) / Math.min(n, 3));
      t.steps.forEach(([a, b, hot], i) => {
        const col = i % 3, row = Math.floor(i / 3), x = 20 + col * (cw + 14), y = 58 + row * 128;
        g.fillStyle = hot ? 'rgba(255,181,71,.2)' : 'rgba(255,255,255,.07)'; g.fillRect(x, y, cw, 112);
        g.strokeStyle = hot ? COL.heat : 'rgba(255,255,255,.25)'; g.lineWidth = hot ? 3 : 1.5; g.strokeRect(x, y, cw, 112);
        g.font = 'bold 15px sans-serif'; g.fillStyle = COL.soft; g.fillText(String(i + 1), x + 10, y + 22);
        g.font = 'bold 21px sans-serif'; g.fillStyle = hot ? COL.heat : COL.text; g.fillText(a, x + 28, y + 26);
        g.font = '16px sans-serif'; g.fillStyle = COL.soft; wrap(g, b, x + 10, y + 54, cw - 18, 21);
        if (i < n - 1 && col < 2) { g.fillStyle = COL.soft; g.font = 'bold 20px sans-serif'; g.fillText('›', x + cw + 2, y + 62); }
      });
      g.font = '17px sans-serif'; g.fillStyle = COL.text; g.fillText(t.line, 20, h - 16);
    }, B1);
    const bB = board(top, BW, BH, 632, 364, (g, w, h) => {
      const o = oxAt(S.ox), dark = S.tea === 'dark'; panelBg(g, w, h); title(g, 'In the leaf', `${Math.round(S.ox * 100)}% oxidised, model`);
      bars(g, [
        { label: 'Catechins left', value: o.c * 100, color: COL.cat, text: Math.round(o.c * 100) + '%', dark: true },
        { label: 'Theaflavins', value: o.tf * 400, color: COL.tf, text: (o.tf * 100).toFixed(1) + '% of the catechins', dark: true },
        { label: 'Thearubigins', value: o.tr * 100, color: COL.tr, text: Math.round(o.tr * 100) + '%' },
      ], { y: 58, w: 612, rowH: 56, labelW: 190, max: 130 });
      g.fillStyle = css(liq(S.tea, S.ox, tmp)); g.fillRect(20, 240, 90, 90); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.strokeRect(20, 240, 90, 90);
      g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText('liquor', 38, 352);
      g.fillStyle = COL.text; g.font = '18px sans-serif';
      wrap(g, dark ? 'Microbes then change the leaf further over weeks: beyond this model. The liquor turns dark, earthy and smooth.' : S.ox < 0.06 ? 'Nearly all the catechins survive: a green, grassy, more astringent leaf.' : S.ox < 0.82 ? 'Some catechins have become theaflavins and thearubigins: floral to toasty, amber liquor.' : 'Almost no catechins left: a coppery leaf and a red-brown, malty liquor.', 130, 264, w - 150, 25);
    }, B2);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lSame]); reelBoards([bA, bB], -0.1, stage, VIEW);
        cups.forEach((c, i) => {
          const on = c.id === s.tea, t = TEA[c.id]; c.k += ((on ? 1 : 0) - c.k) * Math.min(1, dt * 5);
          const ox = on ? s.ox : t.ox;
          c.cup.set(0.86, liq(c.id, ox, tmp), 0.94);
          c.g.position.y = 0.38 + 0.5 * c.k; c.g.scale.setScalar(1 + 0.3 * c.k); c.ring.visible = on; c.ring.position.y = 0.02 - 0.3 * c.k;
          if (c.id === 'green' && s.fixer === 'steam') tmp2.set(0x3f9a3a); else if (c.id === 'oolong' || c.id === 'black' || (c.id === 'green' && on)) madeColor(ox, tmp2); else tmp2.set(t.leaf);
          c.P.forEach((p, j) => { c.pile.place(j, p[0], p[1], p[2], p[3]); c.pile.tint(j, tmp2); }); c.pile.done();
          c.lbl.element.className = 'lbl' + (on ? ' hot' : ''); if (on) c.lbl.element.style.setProperty('--c', COL.heat);
        });
        const t = TEA[s.tea] || TEA.black;
        lNote.element.style.setProperty('--c', COL.heat); lNote.element.innerHTML = `<b>${t.n}: ${t.line}</b>`;
        const k = `${s.tea}|${Math.round(s.ox * 100)}|${s.fixer}`; if (k !== key) { key = k; bA.redraw(); bB.redraw(); }
      },
      readout: (s) => {
        const t = TEA[s.tea] || TEA.black, o = oxAt(s.ox);
        const heat = s.tea === 'white' ? 'only at drying' : s.tea === 'black' ? 'last, in the dryer' : s.tea === 'oolong' ? 'part-way, in a hot pan' : s.tea === 'green' ? (s.fixer === 'steam' ? 'first, with steam' : 'first, in a hot pan') : 'first, in a hot pan';
        return `<div class="big" style="color:${css(liq(s.tea, s.ox, tmp).lerp(tmp2.set(0xffffff), 0.25))}">${t.n} tea</div>
          <div class="row"><span>Catechins oxidised by the enzyme</span><b>${Math.round(s.ox * 100)}%</b></div>
          <div class="row"><span>Heat stops the enzyme</span><b>${heat}</b></div>
          <div class="row"><span>Catechins left · theaflavins</span><b><span style="color:${COL.cat}">${Math.round(o.c * 100)}%</span> · <span style="color:${COL.tf}">${(o.tf * 100).toFixed(1)}%</span></b></div>
          <div class="row"><span>Fermented by microbes</span><b>${s.tea === 'dark' ? 'yes, for weeks' : 'no'}</b></div>
          <div class="row"><span>Caffeine</span><b>in all six: it survives every step</b></div>
          <small>${t.line} Examples: ${t.eg}. The oxidation percentages are the trade's rough language.</small>`;
      },
    };
  },
};
