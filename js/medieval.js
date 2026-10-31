'use strict';
/* ==========================================================
   GTA LEMOS 27400 · FEIRA MEDIEVAL arredor do monte de San Vicente
   - Praza de España: cetrería e tiro con arco, xente de época
   - Santo Domingo, Pescaderías e Falagueira: traxes medievais e
     postos de venda ambulante (artesanía e comida)
   - Costa da Pena e adro de Santa María da Régoa: churrasco, polbo
     e filloas con mesas e bancos
   - DE NOITE: procesión de fachos cara ao castelo con malabaristas,
     zancudos, tambores e un dragón levado por dentro; no castelo,
     escenario con bailarina e lume; ás 00:00, farolillos ao ceo.
   ========================================================== */
const MED = {
  streets: ['Rúa de Santo Domingo', 'Rúa Pescaderías', 'Rúa Falagueira', 'Rúa da Falagueira', 'Praza de España'],
  plaza: [55, 276], food: [36, 127], stage: [172, 104], stageYaw: null,
  path: [[214, 160], [195, 160], [184, 157], [174, 151], [155, 132], [151, 124], [141, 105], [134, 90]],
  shirts: ['#7a1f2a', '#4a3220', '#2f4a2a', '#8a6a2a', '#e8dcc0', '#3a2a4a', '#5a1a1a', '#6a4a8a', '#1f3a5a'],
  pants: ['#3a2a1a', '#2a2a2a', '#5a4a3a', '#4a3a2a'],
};
const isNightFair = () => { const h = G.hour; return h >= 20.5 || h < 4; };
/* ---------- texturas e pezas ---------- */
function medFlameTex() {
  if (MED.flameT) return MED.flameT;
  const c = cnv(64, 128), x = c.getContext('2d'), g = x.createRadialGradient(32, 86, 2, 32, 74, 50);
  g.addColorStop(0, 'rgba(255,250,210,1)'); g.addColorStop(0.25, 'rgba(255,200,80,.95)'); g.addColorStop(0.55, 'rgba(255,110,20,.55)'); g.addColorStop(1, 'rgba(255,60,0,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(32, 2); x.bezierCurveTo(58, 50, 60, 100, 32, 126); x.bezierCurveTo(4, 100, 6, 50, 32, 2); x.fill();
  return MED.flameT = toTex(c, false);
}
function medFlame(scale = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: medFlameTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(0.35 * scale, 0.7 * scale, 1); s.userData.base = scale; return s;
}
function stripeTex(a, b, n = 8) { const c = cnv(128, 32), x = c.getContext('2d'); for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * 128 / n, 0, 128 / n, 32); } x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, 26, 128, 6); return toTex(c, false); }
function makeStall(label, a, b, kind) {
  const g = new THREE.Group(), wood = std({ color: 0x6b4a2e, roughness: 0.9 }), cloth = std({ map: stripeTex(a, b), roughness: 0.9, side: THREE.DoubleSide });
  for (const [x, z] of [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.5, 6), wood); p.position.set(x, 1.25, z); g.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 2.3), cloth); roof.position.y = 2.55; roof.rotation.x = 0.12; roof.castShadow = true; g.add(roof);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.3), std({ color: i % 2 ? a : b, side: THREE.DoubleSide })); f.position.set(-1.6 + i * 0.4, 2.35, 1.2); g.add(f); }
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.9, 0.8), wood); counter.position.set(0, 0.45, 0.65); counter.castShadow = true; g.add(counter);
  const cl = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.5, 0.82), std({ color: a, roughness: 0.9 })); cl.position.set(0, 0.68, 0.66); g.add(cl);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), std({ map: textTex(label, { w: 512, h: 96, bg: '#e8d8b0', fg: '#4a2a14', size: 52, font: 'Georgia, serif', border: '#6b4a2e' }), roughness: 0.9 })); sign.position.set(0, 2.15, 1.18); g.add(sign);
  // mercadoría
  const goods = { pan: [0xb07a3a, 'sph'], queixo: [0xf2d36a, 'cyl'], mel: [0xd99a2a, 'jar'], ferro: [0x9aa0a6, 'blade'], ceramica: [0xb5583e, 'jar'], coiro: [0x6b3a1a, 'box'], xoias: [0xe8c22a, 'sph'], especias: [0xc0402a, 'box'], viño: [0x5a1428, 'jar'] }[kind] || [0xb07a3a, 'sph'];
  const gm = std({ color: goods[0], roughness: goods[1] === 'blade' || kind === 'xoias' ? 0.3 : 0.7, metalness: goods[1] === 'blade' || kind === 'xoias' ? 0.8 : 0 });
  for (let i = 0; i < 8; i++) {
    let m; const t = goods[1];
    if (t === 'sph') m = new THREE.Mesh(new THREE.SphereGeometry(kind === 'xoias' ? 0.05 : 0.14, 8, 6), gm);
    else if (t === 'cyl') m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), gm);
    else if (t === 'jar') m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.24, 10), gm);
    else if (t === 'blade') { m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.9), gm); m.rotation.y = 0.2; }
    else m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), gm);
    m.position.set(-1.25 + (i % 4) * 0.8 + RR(-0.1, 0.1), 0.98, 0.5 + Math.floor(i / 4) * 0.28); g.add(m);
  }
  return g;
}
function makeFoodStall(kind) {
  const label = { churrasco: 'CHURRASCO', polbo: 'POLBO Á FEIRA', filloas: 'FILLOAS' }[kind];
  const g = makeStall(label, kind === 'polbo' ? '#7a1f2a' : '#2f4a2a', '#e8dcc0', 'pan');
  if (kind === 'churrasco') { const gr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.6), std({ color: 0x1b1b1b, metalness: 0.6, roughness: 0.4 })); gr.position.set(0, 1.0, 0.1); g.add(gr); const e = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.5), std({ color: 0xff5a1a, emissive: 0xff3a00, emissiveIntensity: 0.8 })); e.position.set(0, 0.94, 0.1); g.add(e); for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.4), std({ color: 0x7a3a1a, roughness: 0.6 })); r.position.set(-0.55 + i * 0.22, 1.07, 0.1); g.add(r); } }
  if (kind === 'polbo') { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.55, 18, 1, true), std({ color: 0xb8733a, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })); pot.position.set(-0.7, 1.2, 0.1); g.add(pot); const w = new THREE.Mesh(new THREE.CircleGeometry(0.43, 18), std({ color: 0x8a5a3a })); w.rotation.x = -Math.PI / 2; w.position.set(-0.7, 1.4, 0.1); g.add(w); for (let i = 0; i < 3; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 12), std({ color: 0xc8a06a })); pl.position.set(0.3 + i * 0.4, 0.97, 0.6); g.add(pl); const ot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), std({ color: 0xc0504a })); ot.scale.y = 0.4; ot.position.set(0.3 + i * 0.4, 1.01, 0.6); g.add(ot); } g.userData.steam = [-0.7, 1.5, 0.1]; }
  if (kind === 'filloas') { for (const x of [-0.6, 0.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), std({ color: 0x1b1b1b, metalness: 0.6 })); p.position.set(x, 1.0, 0.1); g.add(p); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.01, 16), std({ color: 0xe8c890 })); f.position.set(x, 1.03, 0.1); g.add(f); } const st = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12), std({ color: 0xe8c890 })); st.position.set(1.0, 1.05, 0.55); g.add(st); }
  return g;
}
function makeTable(n) {
  const g = new THREE.Group(), wood = std({ color: 0x7a5a3a, roughness: 0.9 }), L = 2.6;
  const top = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, 0.9), wood); top.position.y = 0.76; top.castShadow = true; g.add(top);
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.8), wood); l.position.set(sx * (L / 2 - 0.2), 0.37, 0); g.add(l); }
  for (const sz of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, 0.32), wood); b.position.set(0, 0.45, sz * 0.75); g.add(b); for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.28), wood); l.position.set(sx * (L / 2 - 0.2), 0.22, sz * 0.75); g.add(l); } }
  // pratos de polbo, cuncas de viño e pan
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 12), std({ color: 0xc8a06a })); p.position.set(-0.9 + i * 0.6, 0.81, i % 2 ? 0.2 : -0.2); g.add(p); const cu = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.06, 10), std({ color: 0xf2f0e8 })); cu.position.set(-0.7 + i * 0.6, 0.83, i % 2 ? -0.25 : 0.25); g.add(cu); }
  return g;
}
function makeBigDrum() { const g = new THREE.Group(); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.45, 18), std({ color: 0x7a1f2a, roughness: 0.6 })); d.rotation.x = Math.PI / 2; g.add(d); for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.37, 18), std({ color: 0xe8dcc0, side: THREE.DoubleSide })); h.position.z = s * 0.23; g.add(h); } return g; }
function makeFalcon() {
  const g = new THREE.Group(), m = std({ color: 0x6b4a2e, roughness: 0.8 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), m); b.scale.set(0.8, 0.8, 1.6); g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), std({ color: 0x3a2a1a })); h.position.set(0, 0.04, 0.2); g.add(h);
  const wings = []; for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.22), std({ color: 0x5a3a20, side: THREE.DoubleSide })); w.geometry.translate(s * 0.28, 0, 0); w.rotation.x = -Math.PI / 2; const piv = new THREE.Group(); piv.add(w); g.add(piv); wings.push({ piv, s }); }
  g.userData.wings = wings; return g;
}
function makeTarget() {
  const g = new THREE.Group(); const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.35, 18), std({ color: 0xd8c070, roughness: 1 })); bale.rotation.x = Math.PI / 2; bale.position.y = 1.0; g.add(bale);
  const c = cnv(128, 128), x = c.getContext('2d'); [['#f4f2ec', 64], ['#1b1b1d', 52], ['#2f6ab8', 40], ['#c0201f', 28], ['#f2c21b', 14]].forEach(([col, r]) => { x.fillStyle = col; x.beginPath(); x.arc(64, 64, r * 0.98, 0, 7); x.fill(); });
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.58, 24), std({ map: toTex(c, false) })); f.position.set(0, 1.0, 0.18); g.add(f);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), std({ color: 0x6b4a2e })); l.position.set(s * 0.4, 0.5, -0.25); l.rotation.x = 0.25; g.add(l); }
  return g;
}
function makeDragon(n) {
  const segs = [], green = std({ color: 0x2f7a3a, roughness: 0.7 }), red = std({ color: 0xc0201f, roughness: 0.7 }), gold = std({ color: 0xe8c22a, metalness: 0.5, roughness: 0.4 });
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), r = 0.62 - i * 0.03;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.15, 14, 1, true), green); b.rotation.x = Math.PI / 2; b.castShadow = true; g.add(b);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 4), red); sp.position.y = r + 0.15; g.add(sp);
    const fr = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.04, r + 0.04, 0.2, 14, 1, true), std({ color: 0xe8c22a, side: THREE.DoubleSide })); fr.rotation.x = Math.PI / 2; fr.position.y = -0.0; fr.scale.set(1, 1, 1); g.add(fr);
    G.scene.add(g); segs.push(g);
  }
  // cabeza con fauces, ollos e cornos
  const head = new THREE.Group();
  const sk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.2), red); head.add(sk);
  const sn = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.7), red); sn.position.set(0, -0.08, 0.85); head.add(sn);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.9), std({ color: 0x8a1414 })); jaw.position.set(0, -0.38, 0.7); head.add(jaw);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), std({ color: 0xffe066, emissive: 0xffaa00, emissiveIntensity: 0.6 })); e.position.set(s * 0.3, 0.25, 0.5); head.add(e); const h = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 6), gold); h.position.set(s * 0.28, 0.6, -0.2); h.rotation.x = -0.6; head.add(h); const w = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.5, 4), gold); w.position.set(s * 0.35, -0.1, 1.15); w.rotation.z = s * 1.2; head.add(w); }
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), std({ color: 0xffffff })); t.position.set(-0.25 + i * 0.1, -0.28, 1.15); t.rotation.x = Math.PI; head.add(t); }
  G.scene.add(head);
  return { segs, head, jaw };
}
function medPed(col) { const p = npcPed('feira-med', col); if (p) { repaintArms(p, col.shirt); p.med = true; } return p; }
function medCol() { return { shirt: pick(MED.shirts), pants: pick(MED.pants), shoe: pick(['#2a1a10', '#3a2a1a']), sleeve: false }; }
/* ---------- colocación ---------- */
function medRoads() { return ROADS.filter(r => MED.streets.includes(r.name) && (r.type !== 'car' || r.cls === 'living_street')); }
function inMedZone(x, z) {
  if (Math.hypot(x - MED.plaza[0], z - MED.plaza[1]) < 24 || Math.hypot(x - MED.food[0], z - MED.food[1]) < 22) return true;
  const r = inRoad(x, z, 4.5); return !!(r && MED.streets.includes(r.name) && (r.type !== 'car' || r.cls === 'living_street'));
}
function medFree(x, z, hx, hz, yaw) { return !obbOverlaps(x, z, hx, hz, yaw, 0.1) && !inRoad(x, z, -0.2) ? true : (!obbOverlaps(x, z, hx, hz, yaw, 0.1)); }
function buildMedieval() {
  const M = G.med = { stalls: [], vendors: [], diners: [], cooks: [], night: [], torches: [], drummers: [], jugglers: [], stilts: [], carriers: [], audience: [], arrows: [], lanterns: [], fire: [], group: new THREE.Group(), tunics: null };
  G.scene.add(M.group);
  const add = (o, x, z, yaw) => { o.position.set(x, groundH(x, z), z); o.rotation.y = yaw; M.group.add(o); return o; };
  // postos de venda nas rúas (no bordo da rúa peonil, mirando ao centro)
  const KINDS = [['MEL DA RIBEIRA', 'mel'], ['PAN DE MILLO', 'pan'], ['QUEIXOS', 'queixo'], ['FERREIRO', 'ferro'], ['OLARÍA', 'ceramica'], ['COIRO E BOLSAS', 'coiro'], ['XOIAS', 'xoias'], ['ESPECIARÍA', 'especias'], ['VIÑO DO PAÍS', 'viño'], ['DOCES DE CONVENTO', 'pan']];
  const COLS = [['#7a1f2a', '#e8c22a'], ['#2f4a2a', '#e8dcc0'], ['#1f3a5a', '#e8dcc0'], ['#5a1a1a', '#e8dcc0'], ['#6a4a8a', '#e8c22a']];
  let k = 0;
  for (const r of medRoads()) {
    for (let s = 6; s < r.len - 4 && M.stalls.length < 16; s += 15) {
      const p = roadPoint(r, s), side = (k % 2) ? 1 : -1, nx = -p.uz * side, nz = p.ux * side, off = Math.max(1.6, r.hw - 1.0) + 1.2;
      const x = p.x + nx * off, z = p.z + nz * off, yaw = Math.atan2(-nx, -nz);
      if (obbOverlaps(x, z, 1.7, 1.2, -yaw, 0.1)) continue;
      const [lab, kind] = KINDS[k % KINDS.length], [a, b] = COLS[k % COLS.length]; k++;
      const st = add(makeStall(lab, a, b, kind), x, z, yaw); M.stalls.push(st);
      addOBB(x, z, 1.6, 0.6, -yaw, groundH(x, z) + 2.5, 'posto', groundH(x, z) - 1);
      const v = medPed(medCol()); if (v) { const bx = x - Math.sin(yaw) * 0.3, bz = z - Math.cos(yaw) * 0.3; v.x = bx; v.z = bz; v.y = groundH(bx, bz); v.yaw = yaw; M.vendors.push({ p: v, ph: R() * 6 }); }
    }
  }
  // comida: adro de Santa María da Régoa e Costa da Pena
  { const [fx, fz] = MED.food; const kinds = ['churrasco', 'polbo', 'filloas'];
    kinds.forEach((kd, i) => { const x = fx - 12 + i * 6, z = fz - 6.5; const st = add(makeFoodStall(kd), x, z, 0); M.stalls.push(st); if (st.userData.steam) M.fire.push({ steam: st, x, z }); const v = medPed(medCol()); if (v) { v.x = x; v.z = z - 0.3; v.y = groundH(x, z); v.yaw = 0; M.cooks.push({ p: v, ph: i }); } if (kd === 'churrasco') M.fire.push({ smoke: [x, z] }); });
    for (let i = 0; i < 4; i++) { const x = fx - 10 + (i % 2) * 6, z = fz + (i < 2 ? 0 : 5); if (obbOverlaps(x, z, 1.4, 1, 0, 0)) continue; add(makeTable(), x, z, 0); addOBB(x, z, 1.3, 1.0, 0, groundH(x, z) + 0.8, 'mesa', groundH(x, z) - 1);
      for (const sz of [-1, 1]) for (const sx of [-0.7, 0.7]) { if (R() < 0.25) continue; const d = medPed({ ...medCol(), sleeve: R() < 0.5 }); if (!d) continue; d.x = x + sx; d.z = z + sz * 0.75; d.y = groundH(d.x, d.z) + 0.0; d.yaw = sz > 0 ? Math.PI : 0; d.sit = 1; M.diners.push({ p: d, ph: R() * 6 }); } } }
  // Costa da Pena: dous postos máis de comida e mesas
  { const r = ROADS.find(q => q.name === 'Rúa da Costa da Pena'); if (r) { let n = 0; for (let s = r.len * 0.45; s < r.len * 0.85 && n < 3; s += 9) { const p = roadPoint(r, s), nx = -p.uz, nz = p.ux, x = p.x + nx * (r.hw + 1.4), z = p.z + nz * (r.hw + 1.4), yaw = Math.atan2(-nx, -nz); if (obbOverlaps(x, z, 1.7, 1.2, -yaw, 0.1)) continue; add(n % 2 ? makeTable() : makeFoodStall(n ? 'polbo' : 'churrasco'), x, z, yaw); n++; if (!(n % 2)) M.fire.push({ smoke: [x, z] }); } } }
  // Praza de España: cetrería e tiro con arco
  { const [px, pz] = MED.plaza;
    const fal = medPed({ shirt: '#4a3220', pants: '#2a2a2a', shoe: '#2a1a10', sleeve: false }); if (fal) { fal.x = px; fal.z = pz; fal.y = groundH(px, pz); M.falconer = fal; }
    M.falcon = makeFalcon(); M.group.add(M.falcon); M.falconT = 0;
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 1.4 + 0.8, a2 = medPed(medCol()); if (!a2) break; a2.x = px + Math.sin(a) * 6.5; a2.z = pz + Math.cos(a) * 6.5; a2.y = groundH(a2.x, a2.z); a2.yaw = Math.atan2(px - a2.x, pz - a2.z); M.audience.push({ p: a2, ph: R() * 6, look: [px, pz] }); }
    M.targets = [];
    for (let i = 0; i < 3; i++) { const x = px + 10, z = pz - 4 + i * 3; const t = add(makeTarget(), x, z, -Math.PI / 2); M.targets.push({ g: t, x, z }); }
    M.archers = [];
    for (let i = 0; i < 2; i++) { const a = medPed({ shirt: i ? '#2f4a2a' : '#7a1f2a', pants: '#3a2a1a', shoe: '#2a1a10', sleeve: false }); if (!a) break; a.x = px - 2; a.z = pz - 2.5 + i * 3; a.y = groundH(a.x, a.z); a.yaw = Math.PI / 2; const bow = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 4, 16, Math.PI), std({ color: 0x5a3a20 })); M.group.add(bow); M.archers.push({ p: a, bow, t: RR(0, 3), ti: i }); }
    const arrowGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.75, 4); arrowGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 4; i++) { const ar = new THREE.Mesh(arrowGeo, std({ color: 0x6b4a2e })); ar.visible = false; M.group.add(ar); M.arrows.push({ m: ar, t: -1 }); }
  }
  // ---- grupo de noite ----
  const P = MED.path.map(([x, z]) => [x, z]); if (G.castleOut) P.push([G.castleOut.x, G.castleOut.z]); if (G.castleGate) P.push([G.castleGate.x, G.castleGate.z]);
  let L = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(L); }
  M.path = { P, cum, L };
  const torchGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.1, 6), torchM = std({ color: 0x4a3220 });
  const night = (p, role, extra = {}) => { const o = { p, role, s: RR(0, L), off: RR(-2.2, 2.2), ph: R() * 6, ...extra }; M.night.push(o); return o; };
  for (let i = 0; i < 16; i++) { const p = medPed(medCol()); if (!p) break; const t = new THREE.Mesh(torchGeo, torchM); const f = medFlame(1.1); t.add(f); f.position.y = 0.7; M.group.add(t); night(p, 'torch', { torch: t, flame: f }); }
  for (let i = 0; i < 3; i++) { const p = medPed({ shirt: '#1b1b1b', pants: '#3a2a1a', shoe: '#2a1a10', sleeve: false }); if (!p) break; const d = makeBigDrum(); M.group.add(d); night(p, 'drum', { drum: d }); }
  for (let i = 0; i < 2; i++) { const p = medPed({ shirt: i ? '#e8c22a' : '#c0201f', pants: i ? '#c0201f' : '#e8c22a', shoe: '#1b1b1b', sleeve: false }); if (!p) break; const balls = [0, 1, 2].map(() => { const b = medFlame(0.5); M.group.add(b); return b; }); night(p, 'juggle', { balls }); }
  for (let i = 0; i < 2; i++) { const p = medPed({ shirt: i ? '#6a4a8a' : '#1f3a5a', pants: i ? '#6a4a8a' : '#1f3a5a', shoe: '#1b1b1b', sleeve: false }); if (!p) break; const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 1.4, 8), std({ color: i ? 0x6a4a8a : 0x1f3a5a })); M.group.add(legs); const legs2 = legs.clone(); M.group.add(legs2); const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 10), std({ color: 0xe8c22a })); M.group.add(hat); night(p, 'stilt', { legs, legs2, hat }); }
  // dragón levado por tres persoas por dentro
  M.dragon = makeDragon(9); M.dragonS = L * 0.5;
  for (let i = 0; i < 3; i++) { const p = medPed({ shirt: '#1b1b1b', pants: '#2f7a3a', shoe: '#1b1b1b', sleeve: false }); if (p) M.carriers.push(p); }
  // escenario no castelo: bailarina de lume e público
  { const [sx, sz] = MED.stage, yaw = Math.atan2(G.castleGate ? G.castleGate.x - sx : -1, G.castleGate ? G.castleGate.z - sz : 0); MED.stageYaw = yaw;
    const st = new THREE.Group(); const T = groundH(sx, sz);
    const pl = new THREE.Mesh(new THREE.BoxGeometry(9, 1.0, 6), std({ color: 0x3a2a1a, roughness: 0.9 })); pl.position.y = 0.5; pl.castShadow = true; st.add(pl);
    for (const x of [-4.3, 4.3]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.5, 0.3), std({ color: 0x4a3220 })); t.position.set(x, 2.75, -2.8); st.add(t); }
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.6), std({ map: textTex('FEIRA MEDIEVAL', { w: 1024, h: 300, bg: '#5a1a1a', fg: '#e8c22a', size: 120, font: 'Georgia, serif', border: '#e8c22a' }), side: THREE.DoubleSide })); ban.position.set(0, 4.3, -2.85); st.add(ban);
    for (const x of [-4.5, 4.5]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.6, 10), std({ color: 0x2a2a2a, metalness: 0.6 })); br.position.set(x, 1.3, 2.6); st.add(br); const f = medFlame(3.2); f.position.set(x, 2.3, 2.6); st.add(f); M.fire.push({ brazier: f }); }
    st.position.set(sx, T, sz); st.rotation.y = yaw; M.group.add(st); M.stage = st; M.stageT = T;
    addOBB(sx, sz, 4.5, 3, -yaw, T + 1.0, 'escenario', T - 1);
    const d = medPed({ shirt: '#c0201f', pants: '#1b1b1b', shoe: '#1b1b1b', sleeve: true }); if (d) { d.female = true; M.dancer = d; M.poi = [medFlame(0.8), medFlame(0.8)]; M.poi.forEach(f => M.group.add(f)); }
    M.burst = medFlame(6); M.burst.visible = false; M.group.add(M.burst);
    for (let i = 0; i < 10; i++) { const a = medPed(medCol()); if (!a) break; const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), d2 = RR(6, 12), l = RR(-6, 6); a.x = sx + fx * d2 + rx * l; a.z = sz + fz * d2 + rz * l; a.y = groundH(a.x, a.z); a.yaw = Math.atan2(sx - a.x, sz - a.z); M.audience.push({ p: a, ph: R() * 6, night: true, look: [sx, sz] }); }
    M.stageLight = new THREE.PointLight(0xff8a3a, 0, 22, 1.6); M.stageLight.position.set(sx, T + 4, sz); G.scene.add(M.stageLight);
    M.procLight = new THREE.PointLight(0xff9a4a, 0, 26, 1.6); G.scene.add(M.procLight);
  }
  // farolillos (00:00)
  { const lm = new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.95 }), geo = new THREE.CylinderGeometry(0.28, 0.2, 0.5, 8);
    const glowT = (() => { const c = cnv(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(255,200,110,.9)'); g.addColorStop(1, 'rgba(255,140,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return toTex(c, false); })();
    for (let i = 0; i < 110; i++) { const m = new THREE.Mesh(geo, lm); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(1.6, 1.6, 1); m.add(s); m.visible = false; M.group.add(m); M.lanterns.push({ m, t: -1, vx: 0, vz: 0, vy: 0 }); } }
  // túnicas (saias) para quen vai vestido de época
  { const geo = new THREE.CylinderGeometry(0.19, 0.27, 0.62, 12, 1, true); geo.translate(0, -0.27, 0); geo.scale(1, 1, 0.75);
    M.tunics = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), 140); M.tunics.count = 0; M.tunics.frustumCulled = false; M.tunics.castShadow = true; const c = new THREE.Color(); for (let i = 0; i < 140; i++) M.tunics.setColorAt(i, c); G.scene.add(M.tunics); }
  M.prevHour = G.hour; M.costumeT = 0;
  G.namedZones.push({ n: 'Feira Medieval · Praza de España', p: [[MED.plaza[0] - 14, MED.plaza[1] - 12], [MED.plaza[0] + 14, MED.plaza[1] - 12], [MED.plaza[0] + 14, MED.plaza[1] + 12], [MED.plaza[0] - 14, MED.plaza[1] + 12]] });
}
/* ---------- traxes de época para quen pasea pola feira ---------- */
function medCostumes(dt) {
  const M = G.med; M.costumeT -= dt; if (M.costumeT > 0) return; M.costumeT = 0.5;
  const C = world.crowd;
  for (const p of C.peds) {
    if (p === G.player.ped || p.npc || (p.state !== 'walk' && p.state !== 'wander' && p.state !== 'seat' && p.state !== 'idle')) continue;
    const inz = inMedZone(p.x, p.z);
    if (inz && !p.medDress) { p.medOrig = { ...p.col }; Object.assign(p.col, medCol()); C.paint(p); repaintArms(p, p.col.shirt); p.medDress = true; }
    else if (!inz && p.medDress && Math.hypot(p.x - MED.plaza[0], p.z - MED.plaza[1]) > 30) { Object.assign(p.col, p.medOrig); C.paint(p); repaintArms(p, p.col.shirt); p.medDress = false; }
  }
}
const _mm = new THREE.Matrix4(), _mc = new THREE.Color();
function medTunics() {
  const M = G.med; if (!M || !M.tunics) return; let n = 0; const cam = camera.position;
  for (const p of world.crowd.peds) {
    if (!(p.med || p.medDress) || !p.visible || p.sit > 0.5 || n >= 140) continue;
    if (Math.hypot(p.x - cam.x, p.z - cam.z) > 70) continue;
    pedMatrix('hips', p.idx, _mm); M.tunics.setMatrixAt(n, _mm); _mc.set(p.col.shirt).offsetHSL(0, 0, -0.06); M.tunics.setColorAt(n, _mc); n++;
  }
  M.tunics.count = n; M.tunics.instanceMatrix.needsUpdate = true; if (M.tunics.instanceColor) M.tunics.instanceColor.needsUpdate = true;
}
/* ---------- actualización ---------- */
function medPathAt(s, off) {
  const { P, cum, L } = G.med.path; s = ((s % L) + L) % L;
  let i = 1; while (i < P.length - 1 && cum[i] < s) i++;
  const a = P[i - 1], b = P[i], l = (cum[i] - cum[i - 1]) || 1, t = (s - cum[i - 1]) / l, ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t - uz * off, z: a[1] + (b[1] - a[1]) * t + ux * off, yaw: Math.atan2(ux, uz) };
}
function updateMedieval(dt) {
  const M = G.med; if (!M) return;
  const t = G.t, night = isNightFair(), cam = camera.position, near = (x, z, r) => Math.hypot(x - cam.x, z - cam.z) < r;
  medCostumes(dt);
  // vendedores e comensais
  for (const v of M.vendors) { const p = v.p; p.walk = 0; p.armUp = 0.25 + 0.35 * Math.max(0, Math.sin(t * 1.4 + v.ph)); p.nod = Math.sin(t * 2 + v.ph) * 0.05; }
  for (const c of M.cooks) { const p = c.p; p.walk = 0; p.arms = [-1.1 + Math.sin(t * 5 + c.ph) * 0.3, 0.2, 1.3, -1.0, -0.2, 1.2]; }
  for (const d of M.diners) { const p = d.p; p.walk = 0; p.sit = 1; const eat = Math.sin(t * 0.9 + d.ph) > 0.4; p.arms = eat ? [-1.3, 0.1, 1.9, -0.6, -0.1, 0.9] : [-0.6, 0.1, 0.9, -0.6, -0.1, 0.9]; p.nod = Math.max(0, Math.sin(t * 3 + d.ph)) * 0.08; p.look = Math.sin(t * 0.3 + d.ph) * 0.5; }
  for (const f of M.fire) { if (f.smoke && near(f.smoke[0], f.smoke[1], 60) && R() < dt * 5) world.smoke.emit(f.smoke[0] + RR(-0.4, 0.4), groundH(f.smoke[0], f.smoke[1]) + 1.3, f.smoke[1] + RR(-0.3, 0.3), RR(-0.1, 0.1), RR(0.5, 0.9), RR(-0.1, 0.1), 0.35, 2.5, 0x9a9a9a, 0.35); if (f.steam && near(f.x, f.z, 60) && R() < dt * 4) world.smoke.emit(f.x - 0.7, groundH(f.x, f.z) + 1.5, f.z + 0.1, 0, 0.6, 0, 0.3, 1.6, 0xf2f2f2, 0.35); if (f.brazier) { f.brazier.scale.set(1.1 * (1 + Math.sin(t * 13) * 0.08), 2.2 * (1 + Math.sin(t * 17 + 1) * 0.1), 1); f.brazier.visible = night; } }
  // cetrería: o falcón voa en círculos e volve á luva
  if (M.falconer) {
    const fp = M.falconer, [px, pz] = MED.plaza; fp.walk = 0; fp.yaw = Math.atan2(Math.sin(t * 0.4), Math.cos(t * 0.4)); M.falconT += dt;
    const cyc = M.falconT % 14, fb = M.falcon, U = fb.userData; let fx, fy, fz, fyaw;
    const glove = [fp.x + Math.cos(fp.yaw) * 0.35 + Math.sin(fp.yaw) * 0.3, fp.y + 1.85, fp.z - Math.sin(fp.yaw) * 0.35 + Math.cos(fp.yaw) * 0.3];
    if (cyc < 3) { [fx, fy, fz] = glove; fyaw = fp.yaw; fp.arms = [-0.4, 0.1, 0.4, -1.9, -0.6, 1.0]; U.wings.forEach(w => w.piv.rotation.z = w.s * 1.2); }
    else { const a = (cyc - 3) * 0.9, k = Math.min(1, (cyc - 3) / 1.2) * Math.min(1, (14 - cyc) / 1.2); fx = lerp(glove[0], px + Math.sin(a) * 9, k); fz = lerp(glove[2], pz + Math.cos(a) * 9, k); fy = lerp(glove[1], groundH(px, pz) + 6 + Math.sin(a * 2) * 1.5, k); fyaw = a + Math.PI / 2; fp.arms = cyc > 12 ? [-0.4, 0.1, 0.4, -1.9, -0.6, 1.0] : [-0.4, 0.1, 0.4, -0.7, -0.2, 0.6]; U.wings.forEach(w => w.piv.rotation.z = w.s * Math.sin(t * 14) * 0.7); }
    fb.position.set(fx, fy, fz); fb.rotation.y = fyaw;
  }
  // tiro con arco
  for (const a of M.archers || []) {
    const p = a.p; p.walk = 0; a.t -= dt; const tg = M.targets[a.ti + (Math.floor(G.t / 7) % 2)];
    p.yaw = Math.atan2(tg.x - p.x, tg.z - p.z);
    const draw = clamp(1 - a.t / 1.5, 0, 1); p.arms = [-1.55, 0.05, 0.05, -1.55, -0.1, 0.2 + draw * 2.0];
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    a.bow.position.set(p.x + fx * 0.62 - rx * 0.24, p.y + 1.35, p.z + fz * 0.62 - rz * 0.24); a.bow.rotation.set(0, p.yaw + Math.PI / 2, Math.PI / 2);
    if (a.t <= 0) { a.t = RR(3, 5); const ar = M.arrows.find(q => q.t < 0) || M.arrows[0]; ar.t = 0; ar.a = [a.bow.position.x, a.bow.position.y, a.bow.position.z]; ar.b = [tg.x + RR(-0.2, 0.2), groundH(tg.x, tg.z) + 1.0 + RR(-0.2, 0.2), tg.z + RR(-0.2, 0.2)]; ar.m.visible = true; }
  }
  for (const ar of M.arrows) { if (ar.t < 0) continue; ar.t += dt; const k = Math.min(1, ar.t / 0.45), x = lerp(ar.a[0], ar.b[0], k), z = lerp(ar.a[2], ar.b[2], k), y = lerp(ar.a[1], ar.b[1], k) + Math.sin(k * Math.PI) * 0.4; ar.m.position.set(x, y, z); ar.m.lookAt(ar.b[0], ar.b[1], ar.b[2]); if (ar.t > 3.5) { ar.t = -1; ar.m.visible = false; } }
  for (const au of M.audience) { const p = au.p; p.visible = !au.night || night; p.walk = 0; p.yaw = Math.atan2(au.look[0] - p.x, au.look[1] - p.z); const cheer = Math.sin(t * 1.3 + au.ph) > 0.7; p.armUp = cheer ? 0.9 : 0; p.wave = Math.sin(t * 0.7 + au.ph) > 0.9; }
  // ---- noite: procesión, dragón e escenario ----
  for (const o of M.night) {
    const p = o.p; p.visible = night;
    for (const k of ['torch', 'drum', 'legs', 'legs2', 'hat']) if (o[k]) o[k].visible = night;
    if (o.balls) o.balls.forEach(b => b.visible = night);
    if (!night) continue;
    o.s += dt * (o.role === 'stilt' ? 0.7 : 0.85); if (o.s > M.path.L) o.s = 0;
    const q = medPathAt(o.s, o.off); p.x = q.x; p.z = q.z; p.y = groundH(q.x, q.z); p.yaw = q.yaw; p.walk = 0.7; p.phase += dt * 3.6;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    if (o.role === 'torch') { p.armUp = 0.95; o.torch.position.set(p.x + fx * 0.25 + rx * 0.2, p.y + 2.1, p.z + fz * 0.25 + rz * 0.2); o.flame.scale.set(0.38 * (1 + Math.sin(t * 15 + o.ph) * 0.12), 0.75 * (1 + Math.sin(t * 19 + o.ph) * 0.15), 1); }
    else if (o.role === 'drum') { p.walk = 0.5; p.arms = [-1.2 - Math.max(0, Math.sin(t * 9)) * 0.7, 0.3, 1.2, -1.2 - Math.max(0, Math.sin(t * 9 + Math.PI)) * 0.7, -0.3, 1.2]; o.drum.position.set(p.x + fx * 0.45, p.y + 1.05, p.z + fz * 0.45); o.drum.rotation.set(0, p.yaw + Math.PI / 2, 0); }
    else if (o.role === 'juggle') { p.walk = 0.3; p.arms = [-1.4 + Math.sin(t * 8) * 0.3, 0.3, 1.0, -1.4 - Math.sin(t * 8) * 0.3, -0.3, 1.0]; o.balls.forEach((b, i) => { const a = t * 5 + i * 2.09; b.position.set(p.x + fx * 0.45 + rx * Math.cos(a) * 0.35, p.y + 1.6 + Math.abs(Math.sin(a)) * 0.9, p.z + fz * 0.45 + rz * Math.cos(a) * 0.35); }); }
    else if (o.role === 'stilt') { p.y += 1.25; p.walk = 0.45; p.phase += dt * 1; o.hat.position.set(p.x, p.y + 1.95, p.z); const sw = Math.sin(p.phase) * 0.25; o.legs.position.set(p.x + rx * 0.1 + fx * sw, p.y - 0.62, p.z + rz * 0.1 + fz * sw); o.legs2.position.set(p.x - rx * 0.1 - fx * sw, p.y - 0.62, p.z - rz * 0.1 - fz * sw); p.arms = [-0.3, 0.9, 0.2, -0.3, 0.9, 0.2]; }
  }
  // dragón
  { const D = M.dragon; const vis = night; D.segs.forEach(s => s.visible = vis); D.head.visible = vis; M.carriers.forEach(p => p.visible = vis);
    if (night) {
      M.dragonS += dt * 0.8; if (M.dragonS > M.path.L) M.dragonS = 0;
      let prev = null;
      D.segs.forEach((sg, i) => { const q = medPathAt(M.dragonS - i * 1.05, Math.sin(t * 1.6 - i * 0.6) * 0.9), y = groundH(q.x, q.z) + 1.65 + Math.sin(t * 3 - i * 0.7) * 0.18; sg.position.set(q.x, y, q.z); sg.rotation.set(0, q.yaw, Math.sin(t * 2 - i) * 0.08); });
      const h = medPathAt(M.dragonS + 1.1, Math.sin(t * 1.6 + 0.6) * 0.9); D.head.position.set(h.x, groundH(h.x, h.z) + 1.9 + Math.sin(t * 3 + 0.7) * 0.25, h.z); D.head.rotation.set(Math.sin(t * 2.2) * 0.15, h.yaw + Math.sin(t * 1.3) * 0.4, 0); D.jaw.rotation.x = Math.max(0, Math.sin(t * 4)) * 0.4;
      M.carriers.forEach((p, i) => { const q = medPathAt(M.dragonS - i * 3.4, Math.sin(t * 1.6 - i * 2.0) * 0.9); p.x = q.x; p.z = q.z; p.y = groundH(q.x, q.z) - 0.1; p.yaw = q.yaw; p.walk = 0.7; p.phase += dt * 3.4; p.armUp = 0.9; });
      if (M.dragonFire > 0) M.dragonFire -= dt; else if (R() < dt * 0.15) { M.dragonFire = 1.2; }
    }
  }
  // luz da procesión (segue á cabeza)
  if (night) { const q = medPathAt(M.dragonS + 3, 0); M.procLight.position.set(q.x, groundH(q.x, q.z) + 3, q.z); M.procLight.intensity = near(q.x, q.z, 90) ? 1.6 + Math.sin(t * 9) * 0.2 : 0; } else M.procLight.intensity = 0;
  // escenario: bailarina con poi de lume e chamarada
  if (M.dancer) {
    const d = M.dancer, [sx, sz] = MED.stage, yaw = MED.stageYaw; d.visible = night; M.poi.forEach(f => f.visible = night); M.stageLight.intensity = night && near(sx, sz, 90) ? 2.2 + Math.sin(t * 11) * 0.4 : 0;
    if (night) {
      d.x = sx + Math.cos(yaw) * Math.sin(t * 0.5) * 2.5; d.z = sz - Math.sin(yaw) * Math.sin(t * 0.5) * 2.5; d.y = M.stageT + 1.0; d.yaw = yaw + t * 2.2; d.walk = 0.3; d.phase += dt * 4;
      d.arms = [-2.2 + Math.sin(t * 6) * 0.6, 0.6, 0.2, -2.2 - Math.sin(t * 6) * 0.6, 0.6, 0.2];
      M.poi.forEach((f, i) => { const a = t * 9 + i * Math.PI, sgn = i ? 1 : -1; f.position.set(d.x + Math.cos(d.yaw) * 0.5 * sgn + Math.cos(a) * 0.55, d.y + 1.9 + Math.sin(a) * 0.55, d.z - Math.sin(d.yaw) * 0.5 * sgn + Math.sin(a) * 0.3); });
      const cyc = t % 9; M.burst.visible = cyc < 0.9 && near(sx, sz, 120); if (M.burst.visible) { const k = cyc / 0.9; M.burst.position.set(sx, M.stageT + 2.5 + k * 3, sz); M.burst.scale.set(3 + k * 3, 5 + k * 4, 1); M.burst.material.opacity = 1 - k; }
    }
  }
  // farolillos ás 00:00
  const h = G.hour; if (M.prevHour > 23 && h < 1) medLaunchLanterns(); M.prevHour = h; updateLanternQueue(dt);
  for (const L of M.lanterns) { if (L.t < 0) continue; L.t += dt; const m = L.m; m.position.x += (L.vx + Math.sin(L.t * 0.5 + L.vz) * 0.2) * dt; m.position.z += L.vz * dt; m.position.y += L.vy * dt; m.material.opacity = 0.95; if (L.t > 160 || m.position.y > 180) { L.t = -1; m.visible = false; } }
}
function medLaunchLanterns() {
  const M = G.med; if (!M) return; const [sx, sz] = MED.stage;
  M.lanterns.forEach((L, i) => { L.t = -RR(0, 25) + 0.0001; L.m.visible = false; const a = R() * 6.28, r = RR(0, 30); L.m.position.set(sx + Math.sin(a) * r - 10, groundH(sx, sz) + 1.8, sz + Math.cos(a) * r); L.vx = RR(0.25, 0.6); L.vz = RR(-0.5, -0.15); L.vy = RR(0.9, 1.6); });
  // saída escalonada
  M.lanterns.forEach((L, i) => { L.t = -1; L.m.visible = false; L.delay = i * 0.12; });
  M.lantDelay = 0; M.lantQueue = M.lanterns.slice();
  if (Math.hypot(camera.position.x - sx, camera.position.z - sz) < 400) toast('🏮 Medianoite: centos de farolillos voan dende San Vicente!', 5);
}
function updateLanternQueue(dt) {
  const M = G.med; if (!M || !M.lantQueue || !M.lantQueue.length) return;
  M.lantDelay -= dt; while (M.lantDelay <= 0 && M.lantQueue.length) { M.lantDelay += 0.12; const L = M.lantQueue.shift(); L.t = 0; L.m.visible = true; }
}
