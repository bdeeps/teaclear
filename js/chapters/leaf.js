// Chapter 1: the leaf. On the left a tea shoot, "two leaves and a bud", drawn about life size
// (1 scene unit ≈ 3 cm). In the middle one leaf cell, magnified about 5,000 times (a leaf cell is
// roughly 40 µm across).
// The cell keeps two things apart. The big central vacuole holds the polyphenols (catechins, chiefly
//   EGCG) and most of the caffeine. The enzyme polyphenol oxidase (PPO) sits in the chloroplasts.
//   While the cell is whole they never meet. Crush or roll the leaf and the vacuole's membrane tears:
//   catechins, enzyme and oxygen from the air mix, and the catechins are joined into orange
//   theaflavins and red-brown thearubigins. Heat the leaf first and the enzyme is destroyed, so the
//   same crushing changes nothing: that is green tea.
// Numbers: fresh shoot about 77% water (70–80%). Of the dry matter: catechins 10–25% (Deka et al.,
//   RSC Advances 2021, Tocklai cultivars), caffeine about 3–4% and theanine 1–2% (Wikipedia: Tea,
//   Camellia sinensis, Theanine). Variety values are typical, not measurements of one bush.
// The reaction clock is the oxidation model of tea.js at 25 °C (a teaching model).
import { THREE, M } from '../kit.js';
import {
  VARIETY, W_FRESH, oxidise, tfPeak, leafColor, css, COL, leafMesh, dots, chamber, rng, board, panelBg, axes, title, line, dot, bars, legend, fitNarrow, reelBoards,
  clamp, lerp, beam, link, TAU, VIEW, BW, BH, B1, B2,
} from '../tea.js';

const NC = 150, NK = 26, NO = 36, CHL = 7;
const cCat = new THREE.Color(COL.cat), cTF = new THREE.Color(COL.tf), cTR = new THREE.Color(COL.tr), cEnz = new THREE.Color(COL.enz), cDead = new THREE.Color(0x6b7280), tmp = new THREE.Color();
const RV = { pos: [-0.1, 5.8, 8.4], target: [-0.1, 5.4, 0] };

export default {
  id: 'leaf',
  short: 'The leaf',
  title: 'Two leaves and a bud',
  subtitle: 'Every tea starts as the same green shoot. Inside each cell, the flavour and the enzyme that will change it are kept in separate rooms.',
  view: VIEW,
  learn: `<p>All tea, green, black, white or oolong, comes from one plant: <b>Camellia sinensis</b>. Pluckers take only the tender tip of each branch, <b>two leaves and a bud</b>, because that is where the flavour is richest.</p>
    <p>A fresh shoot is about <b>77% water</b>. The rest holds three things that matter in your cup. <b>Catechins</b> are the plant's bitter defence chemicals, up to a quarter of the dry leaf. <b>Caffeine</b>, about 3 to 4%, is a natural insect poison. <b>Theanine</b>, 1 to 2%, is an amino acid that tastes savoury and sweet.</p>
    <p>Now look inside one cell. The catechins sit in a big water bag called the <b>vacuole</b>. An enzyme called <b>polyphenol oxidase</b> sits elsewhere, in the green chloroplasts. A thin membrane keeps them apart, so a living leaf stays green.</p>
    <p><b>Crush the cell</b> and the membrane tears. Catechins, enzyme and <b>oxygen</b> from the air meet, and the catechins are joined into new, bigger molecules: orange <b>theaflavins</b> and red-brown <b>thearubigins</b>. It is the same reaction that browns a cut apple. Tea makers call it "fermentation", but no microbes are involved. The right word is <b>oxidation</b>.</p>
    <p><b>Heat the leaf first</b> and the enzyme is destroyed. Then you can crush it as much as you like and it stays green. That one choice, heat before or after, is the difference between green tea and black tea.</p>
    <p class="tip"><b>Try it:</b> slide "Crush the cell" up and watch the green dots turn orange, then brown. Press "A fresh cell", switch on "Heat it first", and crush again.</p>`,
  terms: [
    { t: 'Camellia sinensis', d: 'The tea plant, an evergreen shrub. Its two main varieties are the small-leaved China plant and the large-leaved Assam plant.' },
    { t: 'Flush', d: 'A burst of new shoots. Pluckers take two leaves and a bud from each.' },
    { t: 'Catechins', d: 'The main polyphenols of the fresh leaf, 10 to 25% of its dry weight. EGCG is the most abundant. They taste bitter and astringent.' },
    { t: 'Vacuole', d: 'The large water-filled bag in the middle of a plant cell. In tea it stores the catechins.' },
    { t: 'Polyphenol oxidase', d: 'The enzyme that joins catechins with oxygen. It is kept in the chloroplasts until the cell is broken.' },
    { t: 'Theanine', d: 'An amino acid found almost only in tea, 1 to 2% of the dry leaf. It gives a savoury, brothy taste.' },
  ],
  defaults: { crush: 0, air: true, heat: false, variety: 'assamica' },
  controls: [
    { key: 'crush', type: 'range', label: 'Crush the cell', min: 0, max: 1, step: 0.01, ends: ['whole', 'torn open'], fmt: (v) => (v < 0.05 ? 'whole' : v > 0.9 ? 'torn open' : Math.round(v * 100) + '% broken') },
    { key: 'air', type: 'toggle', label: 'Air can reach it', hint: 'The reaction needs oxygen. No air, no browning.' },
    { key: 'heat', type: 'toggle', label: 'Heat it first (fix the leaf)', hint: 'Steam or a hot pan destroys the enzyme. This is how green tea stays green.' },
    { key: 'variety', type: 'seg', label: 'Which plant', options: Object.entries(VARIETY).map(([v, k]) => ({ v, label: k.n })) },
    { key: 'go', type: 'buttons', label: 'Start again', items: [{ label: 'A fresh cell', act: (s, inst) => { s.crush = 0; inst.reset(); } }] },
  ],
  quiz: [
    { q: 'Where are the catechins kept in a living tea leaf cell?', options: ['In the cell wall', 'In the vacuole, the big water bag in the middle', 'In the chloroplasts with the enzyme', 'Outside the cell'], answer: 1, why: 'The vacuole stores them. The enzyme that would change them sits in the chloroplasts, so in a whole cell the two never meet.' },
    { q: 'What turns a crushed tea leaf brown?', options: ['Microbes fermenting it', 'The sun bleaching it', 'An enzyme joining catechins with oxygen from the air', 'Caffeine burning'], answer: 2, why: 'Polyphenol oxidase, catechins and oxygen meet when the cell is torn. It is oxidation, like a cut apple going brown, not true fermentation.' },
    { q: 'How does green tea stay green?', options: ['It comes from a different plant', 'The leaf is heated early, which destroys the enzyme', 'It is never dried', 'It is picked at night'], answer: 1, why: 'Steaming or pan-firing the fresh leaf kills polyphenol oxidase. With no working enzyme, rolling the leaf cannot brown it.' },
  ],
  reel: [
    { ms: 5200, caption: 'Every tea starts the same way: two leaves and a bud from one plant, Camellia sinensis.', set: { crush: 0, air: true, heat: false, variety: 'assamica' }, act: (s, inst) => inst.reset(), view: RV, spin: 0.12 },
    { ms: 5600, caption: 'Inside each cell, bitter catechins and an enzyme are kept apart. Crush the leaf and they meet oxygen: green turns copper.', set: { air: true, heat: false, variety: 'assamica' }, anim: { crush: [0, 1] }, act: (s, inst) => inst.reset(), view: RV, spin: 0.1 },
  ],

  build({ stage, s: s0 }) {
    const top = new THREE.Group(); stage.root.add(top);
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(31);
    let S = s0, t = 0, key = '', vkey = '';
    // ---- the shoot
    const shoot = new THREE.Group(); shoot.position.set(-2.35, 0, 0.4); shoot.scale.setScalar(0.8); root.add(shoot);
    const stemM = new THREE.MeshStandardMaterial({ color: 0x86b85a, roughness: 0.6 });
    shoot.add(beam([0, 0.05, 0], [0.05, 1.3, 0], 0.07, stemM, 10), beam([0.05, 1.3, 0], [-0.03, 2.3, 0], 0.06, stemM, 10), beam([-0.03, 2.3, 0], [0.02, 2.95, 0], 0.045, stemM, 10));
    const bud = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.75, 14), new THREE.MeshStandardMaterial({ color: 0xcfe6a2, roughness: 0.5 })); bud.position.set(0.04, 3.3, 0); bud.rotation.z = -0.06; bud.castShadow = true; shoot.add(bud);
    const L1 = leafMesh(1.5, 0.62, 0x69b53e), L2 = leafMesh(1.85, 0.8, 0x4f9a35), L3 = leafMesh(2.1, 0.95, 0x356f2a);
    L1.position.set(0.02, 2.9, 0); L1.rotation.set(-0.5, 0.2, 1.0);
    L2.position.set(-0.03, 2.3, 0); L2.rotation.set(-0.5, Math.PI - 0.2, 0.95);
    L3.position.set(0.05, 1.3, 0); L3.rotation.set(-0.6, 0.35, 0.75);
    shoot.add(L1, L2, L3);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.14, 24), M.matte(0x5a4332)); pot.position.y = 0.07; shoot.add(pot);
    // ---- the cell
    const X0 = -1.25, X1 = 2.75, Y0 = 0.6, Y1 = 4.2, DZ = 1.2, CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
    const cell = chamber(root, X0, X1, Y0, Y1, DZ * 2, { color: 0x7ed957, opacity: 0.1, edge: 0x9fd486 });
    const vac = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), M.clear(0xd8f08a, 0.2)); vac.scale.set(1.35, 1.12, 0.85); vac.position.set(CX, CY, 0); vac.renderOrder = 3; root.add(vac);
    const chlM = new THREE.MeshStandardMaterial({ color: 0x2f8f3a, roughness: 0.5 });
    const CH = Array.from({ length: CHL }, (_, i) => {
      const a = (i / CHL) * TAU + 0.4, p = [CX + 1.72 * Math.cos(a) * 0.98, CY + 1.5 * Math.sin(a), (i % 2 ? 0.55 : -0.5)];
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), chlM); m.scale.set(1.35, 0.75, 0.9); m.position.set(...p); m.rotation.z = a + 1.57; m.castShadow = true; root.add(m);
      return p;
    });
    const enz = dots(CHL * 4, 0.07, 0x6fb6ff, 8); root.add(enz);
    const cat = dots(NC, 0.075, 0xc8e86b, 8, true); root.add(cat);
    const C = Array.from({ length: NC }, (_, i) => {
      const a = rnd() * TAU, b = rnd() * 2 - 1, r = Math.cbrt(rnd()) * 0.92, sq = Math.sqrt(1 - b * b);
      return { in: [CX + 1.35 * r * sq * Math.cos(a), CY + 1.08 * r * b, 0.85 * r * sq * Math.sin(a)], out: [lerp(X0 + 0.2, X1 - 0.2, rnd()), lerp(Y0 + 0.2, Y1 - 0.2, rnd()), lerp(-DZ + 0.15, DZ - 0.15, rnd())], j: (i + 0.5) / NC, u: rnd(), ph: rnd() * TAU, k: 0 };
    });
    C.sort(() => rnd() - 0.5).forEach((c, i) => { c.j = (i + 0.5) / NC; });
    const caf = dots(NK, 0.06, 0xffffff, 8, true); root.add(caf);
    const K = Array.from({ length: NK }, () => { const a = rnd() * TAU, b = rnd() * 2 - 1, r = Math.cbrt(rnd()) * 0.9, sq = Math.sqrt(1 - b * b); return { p: [CX + 1.35 * r * sq * Math.cos(a), CY + 1.08 * r * b, 0.85 * r * sq * Math.sin(a)], ph: rnd() * TAU }; });
    const oxy = dots(NO, 0.05, 0xff6b81, 6); root.add(oxy);
    const O = Array.from({ length: NO }, () => ({ x: lerp(X0 + 0.2, X1 - 0.2, rnd()), z: lerp(-DZ + 0.2, DZ - 0.2, rnd()), ph: rnd(), v: 0.25 + 0.35 * rnd() }));
    const guide = beam([-2.0, 2.2, 0.4], [X0, Y1 - 0.4, 0], 0.012, M.glow(0x9fd486), 6), guide2 = beam([-2.0, 2.05, 0.4], [X0, Y0 + 0.4, 0], 0.012, M.glow(0x9fd486), 6);
    guide.castShadow = guide2.castShadow = false; root.add(guide, guide2);

    const bA = board(top, BW, BH, 632, 364, (g, w, h) => {
      const v = VARIETY[S.variety] || VARIETY.assamica, dry = (1 - W_FRESH) * 100;
      panelBg(g, w, h); title(g, 'What is in a fresh shoot', v.n + ', typical');
      g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText('of 100 g of plucked leaf', 20, 64);
      const x0 = 20, bw = w - 40, y = 76;
      g.fillStyle = COL.water; g.fillRect(x0, y, bw * W_FRESH, 38); g.fillStyle = COL.leaf; g.fillRect(x0 + bw * W_FRESH, y, bw * (1 - W_FRESH), 38);
      g.font = 'bold 19px sans-serif'; g.fillStyle = '#0b1220'; g.fillText(`water ${Math.round(W_FRESH * 100)} g`, x0 + 12, y + 26); g.fillText(`dry ${dry.toFixed(0)} g`, x0 + bw * W_FRESH + 10, y + 26);
      g.font = '17px sans-serif'; g.fillStyle = COL.soft; g.fillText('of the dry part', 20, 146);
      bars(g, [
        { label: 'Catechins', value: v.cat, color: COL.cat, text: `${v.cat}%  (range 10–25%)`, dark: true },
        { label: 'Caffeine', value: v.caf, color: COL.caf, text: `${v.caf.toFixed(1)}%` },
        { label: 'Theanine', value: v.the, color: COL.latent, text: `${v.the.toFixed(1)}%  (range 1–2%)` },
        { label: 'Fibre, protein, rest', value: 100 - v.cat - v.caf - v.the, color: '#8a94a6', text: `${(100 - v.cat - v.caf - v.the).toFixed(0)}%` },
      ], { y: 156, w: 612, rowH: 48, labelW: 200, max: 100, font: 18 });
    }, B1);
    const bB = board(top, BW, BH, 632, 364, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Inside the crushed cell', 'model, 25 °C');
      legend(g, [['catechins', COL.cat], ['theaflavins', COL.tf], ['thearubigins', COL.tr]], 24, 48, 17);
      const { X, Y } = axes(g, w, h, { x0: 70, y1: 86, y0: h - 46, xMax: 120, yMax: 100, xTicks: [0, 30, 60, 90, 120], yTicks: [0, 50, 100], xFmt: (v) => v + ' min', yFmt: (v) => v + '%' });
      const a = [], b = [], c = [];
      for (let m = 0; m <= 120; m += 2) { const o = oxidise(m, 25, 'ctc'); a.push([m, o.c * 100]); b.push([m, o.tf * 100]); c.push([m, o.tr * 100]); }
      line(g, a, X, Y, COL.cat, 4); line(g, c, X, Y, COL.tr, 4); line(g, b, X, Y, COL.tf, 4);
      const o = oxidise(t, 25, 'ctc'), tm = Math.min(120, t);
      if (S.heat) { g.font = 'bold 20px sans-serif'; g.fillStyle = COL.ok; g.fillText('Enzyme destroyed by heat: nothing changes', X(8), Y(62)); }
      dot(g, X(tm), Y(o.c * 100), COL.cat, 8); dot(g, X(tm), Y(o.tf * 100), COL.tf, 8); dot(g, X(tm), Y(o.tr * 100), COL.tr, 8);
    }, B2);
    const lShoot = stage.label('two leaves and a bud', [-2.35, 3.25, 0.4], root, 'hot'); lShoot.element.style.setProperty('--c', COL.leaf);
    const lBud = stage.label('bud', [-1.95, 2.75, 0.4], root), lCoarse = stage.label('older leaf: stays on the bush', [-2.6, 0.12, 1.2], root);
    const lVac = stage.label('vacuole: catechins and caffeine', [CX, CY + 1.3, 0.9], root, 'hot'); lVac.element.style.setProperty('--c', COL.cat);
    const lChl = stage.label('chloroplast with the enzyme', [CH[0][0] - 0.2, CH[0][1] + 0.38, 1.2], root, 'hot'); lChl.element.style.setProperty('--c', COL.enz);
    const lO = stage.label('oxygen from the air', [CX + 0.9, Y1 + 0.28, 0], root), lCell = stage.label('one leaf cell, magnified about 5,000 times', [CX + 0.5, Y0 - 0.3, 1.2], root);
    const lState = stage.label('', [CX, CY - 1.5, 1.2], root, 'hot');

    return {
      reset() { t = 0; C.forEach((c) => { c.k = 0; }); },
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lBud, lCoarse, lCell, lO, lChl, lShoot, lVac]); reelBoards([bA, bB], -0.1, stage, VIEW);
        const v = VARIETY[s.variety] || VARIETY.assamica;
        if (vkey !== s.variety) { vkey = s.variety; [L1, L2, L3].forEach((l) => l.scale.setScalar(v.leaf)); bA.redraw(); }
        const live = s.crush > 0.05 && s.air && !s.heat;
        if (live) t = Math.min(240, t + dt * 4 * s.crush);              // 1 second of watching = 4 minutes for a fully crushed cell
        const o = oxidise(t, 25, 'ctc'), x = s.heat ? 0 : o.x;
        // catechins: inside the vacuole until the membrane tears, then loose in the cell and reacting
        C.forEach((c, i) => {
          const free = s.crush > c.j * 0.95 + 0.03; c.k += ((free ? 1 : 0) - c.k) * Math.min(1, dt * 2.2);
          const wob = 0.05 + 0.07 * c.k, px = lerp(c.in[0], c.out[0], c.k) + wob * Math.sin(time * 1.7 + c.ph), py = lerp(c.in[1], c.out[1], c.k) + wob * Math.cos(time * 1.3 + c.ph * 2), pz = lerp(c.in[2], c.out[2], c.k);
          cat.place(i, px, py, pz, 1);
          const done = free && !s.heat && c.k > 0.5 ? c.u : 2;       // u orders which dots have reacted first
          cat.tint(i, done < o.tr ? cTR : done < o.tr + o.tf ? cTF : cCat);
        });
        cat.done();
        K.forEach((k, i) => { const sp = 1 + 0.9 * clamp(s.crush * 1.3, 0, 1); caf.place(i, CX + (k.p[0] - CX) * sp + 0.04 * Math.sin(time * 2 + k.ph), CY + (k.p[1] - CY) * sp + 0.04 * Math.cos(time * 2.3 + k.ph), k.p[2] * sp, 1); });
        caf.done();
        CH.forEach((p, i) => { for (let j = 0; j < 4; j++) { const a = j * 1.57 + time * 0.4 + i; enz.place(i * 4 + j, p[0] + 0.22 * Math.cos(a) + (live ? 0.25 * Math.sin(time * 1.1 + j + i) * s.crush : 0), p[1] + 0.2 * Math.sin(a) + (live ? 0.25 * Math.cos(time * 0.9 + j * 2 + i) * s.crush : 0), p[2] + 0.22, 1); enz.tint(i * 4 + j, s.heat ? cDead : cEnz); } });
        enz.done();
        chlM.color.set(s.heat ? 0x4d6b3c : 0x2f8f3a);
        O.forEach((q, i) => { const k = (time * q.v + q.ph) % 1, y = Y1 + 0.35 - k * (s.crush > 0.05 ? 2.6 : 0.5); oxy.place(i, q.x + 0.1 * Math.sin(time * 2 + i), y, q.z, s.air ? 0.6 + 0.6 * Math.sin(Math.PI * k) : 0.0001); });
        oxy.done();
        vac.material.opacity = 0.22 * (1 - clamp(s.crush * 1.15, 0, 1)); vac.visible = s.crush < 0.86;
        leafColor(x * clamp(s.crush * 1.2, 0, 1), cell.glass.material.color); cell.glass.material.opacity = 0.1 + 0.12 * x * s.crush;
        leafColor(x * s.crush, tmp); [L1, L2].forEach((l, i) => l.userData.mat.color.set(i ? 0x4f9a35 : 0x69b53e).lerp(tmp, clamp(s.crush * 1.2, 0, 1) * x));
        lO.visible = lO.visible && s.air; lVac.visible = lVac.visible && s.crush < 0.5;
        const msg = s.heat ? (s.crush > 0.05 ? 'crushed, but the enzyme is dead: stays green' : 'heated: the enzyme is destroyed') : s.crush < 0.05 ? 'whole cell: nothing reacts' : !s.air ? 'no oxygen: the reaction waits' : x < 0.5 ? 'oxidising: orange theaflavins appear' : 'oxidised: mostly red-brown thearubigins';
        lState.element.style.setProperty('--c', s.heat ? COL.ok : x > 0.05 && s.crush > 0.05 ? COL.tf : COL.leaf); lState.element.innerHTML = `<b>${msg}</b>`;
        const k = `${Math.round(t)}|${s.heat}|${s.variety}`; if (k !== key) { key = k; bB.redraw(); }
      },
      readout: (s) => {
        const v = VARIETY[s.variety] || VARIETY.assamica, o = oxidise(s.heat ? 0 : t, 25, 'ctc'), dry = (1 - W_FRESH) * 100, pk = tfPeak(25, 'ctc');
        const name = s.heat ? 'Fixed: it stays green' : s.crush < 0.05 ? 'A living leaf cell' : !s.air ? 'Crushed, but no air' : o.x < 0.9 ? 'Oxidising' : 'Fully oxidised';
        return `<div class="big" style="color:${css(leafColor(s.heat ? 0 : o.x * s.crush, tmp))}">${name}</div>
          <div class="row"><span>${v.n} · ${v.latin}</span><b>${v.note.split(':')[0]}</b></div>
          <div class="row"><span>In 100 g of fresh shoot</span><b>${Math.round(W_FRESH * 100)} g water · ${dry.toFixed(0)} g dry</b></div>
          <div class="row"><span>Catechins · caffeine in it</span><b>${((dry * v.cat) / 100).toFixed(1)} g · ${Math.round(dry * v.caf * 10)} mg</b></div>
          <div class="row"><span>Time since the cell was torn</span><b>${t < 1 ? 'not yet' : Math.round(t) + ' min'}</b></div>
          <div class="row"><span>Catechins left</span><b style="color:${COL.cat}">${Math.round(o.c * 100)}%</b></div>
          <div class="row"><span>Theaflavins · thearubigins</span><b><span style="color:${COL.tf}">${(o.tf * v.cat).toFixed(1)}%</span> · <span style="color:${COL.tr}">${(o.tr * v.cat).toFixed(1)}%</span> of dry leaf</b></div>
          <small>Theaflavins peak about ${Math.round(pk.t)} minutes after crushing in this model (25 °C), then are built on into thearubigins. Real leaf varies with the bush, the season and the factory.</small>`;
      },
    };
  },
};
