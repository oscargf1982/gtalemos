'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Club Fluvial de Monforte
   (beira do Cabe, fronte á Rúa do Caneiro): piscina olímpica,
   piscina mediana, chapoteiro, vestiarios, bar, tenis, volei
   praia, baloncesto e pádel. Posicións tiradas da vista aérea
   e encaixadas nas pistas de OpenStreetMap.
   ========================================================== */
G.noTrees = G.noTrees || [];

function fluvialLandmarks() {
  // piscina olímpica: centro e eixo longo (SO → NE) segundo a vista aérea
  const ox = 289, oz = -487, rot = Math.atan2(0.948, 0.319);
  const F = LM.fluvial = makeFrame(ox, oz, rot);
  // pistas de OSM: tenis (2), volei praia, baloncesto e pádel
  const want = [['tenis', 215, -418], ['tenis', 206, -432], ['volei', 257, -431], ['basket', 237, -406], ['padel', 220, -398]];
  LM.fluvialCourts = [];
  for (const [kind, x, z] of want) {
    let best = null, bd = 9;
    for (const a of AREAS) { if (a.t !== 'pitch') continue; const c = polyCentroid(a.p), d = Math.hypot(c[0] - x, c[1] - z); if (d < bd) { bd = d; best = a; } }
    if (!best) continue;
    best.skip = true;
    const r = minRect(best.p), angL = r.w >= r.d ? r.ang : r.ang + Math.PI / 2;
    LM.fluvialCourts.push({ kind, F: makeFrame(r.cx, r.cz, -angL), L: Math.max(r.w, r.d), W: Math.min(r.w, r.d), poly: best.p });
    reserve(best.p); G.noTrees.push(best.p);
  }
  const zone = frameRectPoly(F, -42, -30, 86, 20);
  reserve(zone); G.noTrees.push(zone);
  G.namedZones.push({ n: 'Club Fluvial de Monforte', p: zone });
  for (const c of LM.fluvialCourts) G.namedZones.push({ n: 'Club Fluvial · ' + { tenis: 'pista de tenis', volei: 'volei praia', basket: 'pista de baloncesto', padel: 'pista de pádel' }[c.kind], p: c.poly });
}

/* ---------- texturas ---------- */
function poolTex(L, W, lanes) {
  const c = cnv(1024, Math.round(1024 * W / L)), x = c.getContext('2d'), H = c.height;
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3cc3dc'); g.addColorStop(0.5, '#2fb2d2'); g.addColorStop(1, '#3cc3dc'); x.fillStyle = g; x.fillRect(0, 0, 1024, H);
  for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(255,255,255,${RR(0.04, 0.12)})`; x.lineWidth = RR(1, 3); x.beginPath(); const a = R() * 1024, b = R() * H; x.moveTo(a, b); x.bezierCurveTo(a + 12, b - 6, a + 24, b + 6, a + 36, b); x.stroke(); }
  if (lanes) { x.fillStyle = 'rgba(16,40,92,.55)'; const lw = H / lanes; for (let k = 0; k < lanes; k++) { const y = (k + 0.5) * lw; x.fillRect(1024 * 0.04, y - 3, 1024 * 0.92, 6); x.fillRect(1024 * 0.04, y - 14, 6, 28); x.fillRect(1024 * 0.96 - 6, y - 14, 6, 28); } }
  return toTex(c, false);
}
function courtTex(kind, L, W) {
  const S = 24, c = cnv(Math.round(L * S), Math.round(W * S)), x = c.getContext('2d'), cx = c.width / 2, cy = c.height / 2;
  const line = (x0, y0, x1, y1) => { x.beginPath(); x.moveTo(cx + x0 * S, cy + y0 * S); x.lineTo(cx + x1 * S, cy + y1 * S); x.stroke(); };
  const rect = (hl, hw) => x.strokeRect(cx - hl * S, cy - hw * S, hl * 2 * S, hw * 2 * S);
  x.lineWidth = 3; x.strokeStyle = '#f4f4f0';
  if (kind === 'tenis') {
    x.fillStyle = '#3f7a4a'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#b5523a'; x.fillRect(cx - 13.5 * S, cy - 6.6 * S, 27 * S, 13.2 * S);
    rect(11.885, 5.485); rect(11.885, 4.115); line(-6.4, 0, 6.4, 0); line(-6.4, -4.115, -6.4, 4.115); line(6.4, -4.115, 6.4, 4.115); line(-11.885, 0, -11.6, 0); line(11.6, 0, 11.885, 0);
  } else if (kind === 'basket') {
    x.fillStyle = '#5f6b66'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#3c8a55'; x.fillRect(cx - 14 * S, cy - 7.5 * S, 28 * S, 15 * S);
    rect(14, 7.5); line(0, -7.5, 0, 7.5); x.beginPath(); x.arc(cx, cy, 1.8 * S, 0, 7); x.stroke();
    for (const s of [-1, 1]) {
      x.fillStyle = '#2f6e45'; x.fillRect(cx + s * 14 * S - (s > 0 ? 5.8 * S : 0), cy - 2.45 * S, 5.8 * S, 4.9 * S); x.strokeRect(cx + s * 14 * S - (s > 0 ? 5.8 * S : 0), cy - 2.45 * S, 5.8 * S, 4.9 * S);
      x.beginPath(); x.arc(cx + s * 12.425 * S, cy, 6.75 * S, s > 0 ? Math.PI / 2 + 0.03 : -Math.PI / 2 - 0.03, s > 0 ? Math.PI * 1.5 - 0.03 : Math.PI / 2 + 0.03 - 0.06, s > 0); x.stroke();
      // porterías de fútbol sala pintadas
      x.beginPath(); x.arc(cx + s * 14 * S, cy, 6 * S, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2, s > 0); x.strokeStyle = 'rgba(242,194,27,.8)'; x.stroke(); x.strokeStyle = '#f4f4f0';
    }
  } else if (kind === 'padel') {
    x.fillStyle = '#2f6aa3'; x.fillRect(0, 0, c.width, c.height);
    rect(10, 5); line(0, -5, 0, 5); line(-6.95, -5, -6.95, 5); line(6.95, -5, 6.95, 5); line(-6.95, 0, 6.95, 0);
  } else { // volei: area
    x.fillStyle = '#e2cb98'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 6000; i++) { const v = RR(-28, 22); x.fillStyle = `rgba(${150 + v},${120 + v},${70 + v},${RR(0.15, 0.4)})`; x.fillRect(R() * c.width, R() * c.height, 2, 2); }
    x.strokeStyle = '#1d4fd8'; x.lineWidth = 4; rect(8, 4);
  }
  return toTex(c, false);
}
function meshFenceTex() {
  const c = cnv(128, 128), x = c.getContext('2d'); x.clearRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(40,90,60,.9)'; x.lineWidth = 2;
  for (let i = -128; i < 256; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke(); }
  const t = toTex(c); return t;
}

/* ---------- pezas ---------- */
// valado de malla en rectángulo local, cun oco (porta) no lado +z
function fenceRect(B, g, x0, z0, x1, z1, h, y0, gap = 3) {
  const tex = meshFenceTex(), mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.8 });
  const seg = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return;
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(L / 2, h / 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, h), mat.clone()); m.material.map = t;
    m.position.set((ax + bx) / 2, y0 + h / 2, (az + bz) / 2); m.rotation.y = -Math.atan2(bz - az, bx - ax); g.add(m);
    addBoxCol(Math.min(ax, bx) - 0.05, Math.min(az, bz) - 0.05, Math.max(ax, bx) + 0.05, Math.max(az, bz) + 0.05, h, 'valado');
  };
  const mx = (x0 + x1) / 2;
  seg(x0, z0, x1, z0); seg(x0, z0, x0, z1); seg(x1, z0, x1, z1);
  seg(x0, z1, mx - gap / 2, z1); seg(mx + gap / 2, z1, x1, z1);
  for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [mx - gap / 2, z1], [mx + gap / 2, z1], [mx, z0]]) { const p = new THREE.CylinderGeometry(0.05, 0.05, h, 6); xform(p, px, y0 + h / 2, pz); B.metalDark.add(p); }
}
function sunbed(B, x, y, z, yaw) {
  const s = boxGeo(0.7, 0.08, 1.9); s.rotateY(yaw); xform(s, x, y + 0.32, z); B.white.add(s);
  const b = boxGeo(0.7, 0.06, 0.7); b.rotateX(-0.9); b.rotateY(yaw); xform(b, x - Math.sin(yaw) * 0.85, y + 0.55, z - Math.cos(yaw) * 0.85); B.white.add(b);
  for (const k of [-0.7, 0.7]) for (const q of [-0.28, 0.28]) { const l = boxGeo(0.05, 0.3, 0.05); xform(l, x + Math.sin(yaw) * k + Math.cos(yaw) * q, y + 0.15, z + Math.cos(yaw) * k - Math.sin(yaw) * q); B.metal.add(l); }
}
function parasol(g, x, y, z, col) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), std({ color: 0xdddddd, metalness: 0.5, roughness: 0.4 })); pole.position.set(x, y + 1.2, z); g.add(pole);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.45, 8, 1, true), std({ color: col, roughness: 0.8, side: THREE.DoubleSide })); top.position.set(x, y + 2.35, z); top.castShadow = true; g.add(top);
}
function buildPool(B, g, y0, L, W, lanes, deckL, deckW) {
  // praia de baldosa, bordo branco e lámina de auga lixeiramente afundida
  const deck = boxGeo(deckL, 0.5, deckW, [Math.round(deckL / 3), Math.round(deckW / 3)]); xform(deck, 0, y0 - 0.15, 0); B.sidewalk.add(deck);
  addSWRect(-deckL / 2, -deckW / 2, deckL / 2, deckW / 2, 0.1);
  for (const s of [-1, 1]) { const a = boxGeo(L + 0.8, 0.14, 0.4); xform(a, 0, y0 + 0.17, s * (W / 2 + 0.2)); B.white.add(a); const b = boxGeo(0.4, 0.14, W); xform(b, s * (L / 2 + 0.2), y0 + 0.17, 0); B.white.add(b); }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(L, W), std({ map: poolTex(L, W, lanes), roughness: 0.05, metalness: 0.15, emissive: 0x0b4a5a, emissiveIntensity: 0.25 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, y0 + 0.13, 0); water.receiveShadow = true; g.add(water);
  G.pools = G.pools || []; G.pools.push(water);
  // non se pode camiñar sobre a auga
  addBoxCol(-L / 2, -W / 2, L / 2, W / 2, 1.2, 'piscina');
  // escaleiras nas esquinas
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const k of [-0.3, 0.3]) {
    const r = new THREE.TorusGeometry(0.35, 0.025, 6, 12, Math.PI); r.rotateY(Math.PI / 2); xform(r, sx * (L / 2 - 1.6) + k, y0 + 0.25, sz * (W / 2 - 0.05)); B.metal.add(r);
  }
  return water;
}

/* ---------- conxunto ---------- */
function buildClubFluvial(B, scene) {
  const F = LM.fluvial; if (!F) return;
  const y0 = terrainH(F.ox, F.oz);
  // --- piscina olímpica (50 × 21, 8 rúas), vestiarios de tellado violeta ---
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => {
    buildPool(LB, g, y0, 50, 21, 8, 57, 25.5);
    (G.mapExtra = G.mapExtra || []).push([frameRectPoly(F, -25, -10.5, 25, 10.5), '#3cc3dc'], [frameRectPoly(F, -16, 13.1, 12, 17.7), '#6b4fc8']);
    // corcheiras
    for (let k = 1; k < 8; k++) { const z = -10.5 + k * 21 / 8; for (let i = 0; i < 25; i++) { const c = new THREE.CylinderGeometry(0.07, 0.07, 2, 6); c.rotateZ(Math.PI / 2); xform(c, -24 + i * 2, y0 + 0.15, z); LB.vcol.add(colorize(c, i < 2 || i > 22 ? '#d4202b' : i % 2 ? '#f4f4f0' : '#1d4fd8')); } }
    // poyetes de saída numerados
    for (let k = 0; k < 8; k++) { const z = -10.5 + (k + 0.5) * 21 / 8, b = boxGeo(0.6, 0.7, 0.55); xform(b, -25.6, y0 + 0.35, z); LB.white.add(colorize(b, '#f4f4f0')); }
    // cadeira do socorrista
    for (const [lx, lz] of [[-0.4, -12.6], [0.4, -12.6]]) { const l = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6); xform(l, lx, y0 + 1.15, lz); LB.metal.add(l); }
    { const st = boxGeo(1, 0.08, 0.7); xform(st, 0, y0 + 2.25, -12.6); LB.white.add(st); const pa = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.35, 8, 1, true), std({ color: 0xd4202b, side: THREE.DoubleSide })); pa.position.set(0, y0 + 3.4, -12.6); g.add(pa); const po = boxGeo(0.05, 1.2, 0.05); xform(po, 0, y0 + 2.8, -12.6); LB.metal.add(po); }
    // vestiarios (á beira do río)
    const vb = boxGeo(28, 3.2, 4.6, [8, 2]); xform(vb, -2, y0 + 1.6, 15.4); LB.white.add(vb); addBoxCol(-16, 13.1, 12, 17.7, 4, 'vestiarios');
    const roof = new THREE.Mesh(new THREE.BoxGeometry(29.2, 0.35, 5.6), std({ color: 0x6b4fc8, roughness: 0.55, metalness: 0.2 })); roof.position.set(-2, y0 + 3.35, 15.4); roof.castShadow = true; g.add(roof);
    for (let i = 0; i < 6; i++) { const d = boxGeo(1.1, 2.1, 0.06); xform(d, -14 + i * 5, y0 + 1.05, 13.07); LB.glass.add(d); }
    const vs = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.9), std({ map: textTex('CLUB FLUVIAL · VESTIARIOS', { w: 1024, h: 100, bg: '#6b4fc8', fg: '#ffffff', size: 60 }), roughness: 0.6 })); vs.position.set(-2, y0 + 2.6, 13.06); vs.rotation.y = Math.PI; g.add(vs);
    // tumbonas e parasoles no céspede do oeste
    const cols = [0xf2c21b, 0xd4202b, 0x1d4fd8, 0x2fa36b];
    for (let i = 0; i < 9; i++) { const lx = -22 + i * 5.4; sunbed(LB, lx, y0 + 0.02, -15.6, Math.PI); sunbed(LB, lx + 1.1, y0 + 0.02, -15.6, Math.PI); if (i % 2 === 0) parasol(g, lx + 0.55, y0, -17.5, cols[(i / 2) % 4]); }
    for (let i = 0; i < 6; i++) sunbed(LB, -20 + i * 7, y0 + 0.02, -21.5, Math.PI);
    // edificio de entrada / oficinas
    const eb = boxGeo(9, 3.6, 9, [3, 2]); xform(eb, -36.4, y0 + 1.8, 0.7); LB.concrete.add(eb); addBoxCol(-40.9, -3.8, -31.9, 5.2, 4.5, 'club');
    const er = boxGeo(9.6, 0.3, 9.6); xform(er, -36.4, y0 + 3.75, 0.7); LB.flat.add(er);
    const es = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.1), std({ map: textTex('CLUB FLUVIAL MONFORTE', { w: 1024, h: 128, bg: '#1d4fd8', fg: '#ffffff', size: 70, border: '#f2c21b' }), roughness: 0.6, side: THREE.DoubleSide })); es.position.set(-41, y0 + 2.9, 0.7); es.rotation.y = -Math.PI / 2; g.add(es);
    G.lamps.push((([x, z]) => ({ x, y: y0 + 5, z }))(F.pt(0, -14)));
  });
  // --- piscina mediana (xirada como na foto) e chapoteiro ---
  {
    const [cx, cz] = F.pt(59.6, -9.3), [ax, az] = F.pt(72.6, -10.7), [bx, bz] = F.pt(57.2, 4.9);
    const dx = bx - ax, dz = bz - az, rot = Math.atan2(-dz, dx);
    inFrame(B, scene, cx, cz, rot, (LB, g) => {
      buildPool(LB, g, y0, 18, 10, 0, 22, 16.6);
      G.mapExtra.push([frameRectPoly(makeFrame(cx, cz, rot), -9, -5, 9, 5), '#3cc3dc']);
      for (let i = 0; i < 4; i++) { sunbed(LB, -8 + i * 2.2, y0 + 0.02, -9.6, 0); }
      parasol(g, -4.5, y0, -11.5, 0x1d4fd8);
    });
    const [rx, rz] = F.pt(78.2, -7.6);
    inFrame(B, scene, rx, rz, 0, (LB, g) => {
      const d = new THREE.CylinderGeometry(4.8, 4.8, 0.5, 28); xform(d, 0, y0 - 0.15, 0); LB.sidewalk.add(d); addSWRect(-4.6, -4.6, 4.6, 4.6, 0.1);
      const ring = new THREE.TorusGeometry(3.2, 0.14, 6, 32); ring.rotateX(Math.PI / 2); xform(ring, 0, y0 + 0.14, 0); LB.white.add(ring);
      const w = new THREE.Mesh(new THREE.CircleGeometry(3.15, 28), std({ map: poolTex(8, 8, 0), roughness: 0.05, emissive: 0x0b4a5a, emissiveIntensity: 0.3 })); w.rotation.x = -Math.PI / 2; w.position.y = y0 + 0.13; g.add(w);
      addCircCol(0, 0, 3.1, 1, 'chapoteiro');
      const duck = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), std({ color: 0xf2c21b })); duck.position.set(0.8, y0 + 0.18, -0.6); g.add(duck);
    });
  }
  // --- bar «Malo Será» con terraza ---
  {
    const [bx, bz] = F.pt(38.7, -18.9);
    inFrame(B, scene, bx, bz, F.rot, (LB, g) => {
      const b = boxGeo(10, 3.3, 7.5, [4, 2]); xform(b, 0, y0 + 1.65, 0); LB.concrete.add(b); const gl = boxGeo(7, 2.2, 0.08); xform(gl, 0, y0 + 1.2, 3.78); LB.glass.add(gl); addBoxCol(-5, -3.75, 5, 3.75, 4, 'bar');
      const r = boxGeo(11, 0.3, 8.5); xform(r, 0, y0 + 3.45, 0); LB.metalDark.add(r);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), nightMat(std({ map: textTex('MALO SERÁ', { w: 768, h: 128, bg: '#1b1b1d', fg: '#ff8a2a', size: 92, border: '#ff8a2a' }), emissive: 0xffffff, emissiveMap: textTex('MALO SERÁ', { w: 768, h: 128, bg: '#000000', fg: '#ff8a2a', size: 92 }), roughness: 0.5 }), 0.3, 1.4));
      sg.position.set(0, y0 + 2.7, 3.8); g.add(sg);
      // terraza cara á piscina
      for (let i = 0; i < 3; i++) {
        const tx = -3.5 + i * 3.5, tz = 6;
        const t = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12); xform(t, tx, y0 + 0.75, tz); LB.metal.add(t); const l = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6); xform(l, tx, y0 + 0.37, tz); LB.metal.add(l);
        for (const s of [-1, 1]) { const ch = boxGeo(0.42, 0.06, 0.42); xform(ch, tx + s * 0.7, y0 + 0.45, tz); LB.wood.add(ch); }
        parasol(g, tx, y0, tz, 0xff8a2a);
      }
      G.lamps.push((([x, z]) => ({ x, y: y0 + 3, z }))(F.pt(38.7, -14)));
    });
  }
  // --- pistas deportivas (sobre as pistas de OSM) ---
  for (const C of LM.fluvialCourts) {
    const K = C.F, L = C.L, W = C.W, yc = terrainH(K.ox, K.oz);
    inFrame(B, scene, K.ox, K.oz, K.rot, (LB, g) => {
      const surf = new THREE.Mesh(new THREE.PlaneGeometry(L, W), std({ map: courtTex(C.kind, L, W), roughness: C.kind === 'padel' ? 0.7 : 0.95, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      surf.rotation.x = -Math.PI / 2; surf.position.set(0, yc + (C.kind === 'volei' ? 0.12 : 0.07), 0); surf.receiveShadow = true; g.add(surf);
      if (C.kind === 'volei') { const sb = boxGeo(L, 0.1, W); xform(sb, 0, yc + 0.03, 0); LB.wood.add(sb); }
      const postM = std({ color: 0xd8dde2, metalness: 0.6, roughness: 0.35 });
      const net = (hw, h, col) => {
        for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h + 0.1, 8), postM); p.position.set(0, yc + (h + 0.1) / 2, s * hw); g.add(p); addCircCol(0, s * hw, 0.15, 3, 'poste'); }
        const n = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, h * 0.55), new THREE.MeshStandardMaterial({ map: netTex(), transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, color: col || 0xffffff }));
        n.position.set(0, yc + h * 0.72, 0); n.rotation.y = Math.PI / 2; g.add(n); addBoxCol(-0.06, -hw, 0.06, hw, h, 'rede');
      };
      if (C.kind === 'tenis') { net(6.4, 1.07); fenceRect(LB, g, -L / 2 + 0.3, -W / 2 + 0.3, L / 2 - 0.3, W / 2 - 0.3, 3.5, yc, 3); }
      if (C.kind === 'volei') net(4.6, 2.43);
      if (C.kind === 'padel') {
        net(5.1, 0.92);
        // paredes de vidro nos fondos e laterais curtas
        const gl = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide });
        for (const s of [-1, 1]) {
          const e = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), gl); e.position.set(s * 10, yc + 1.5, 0); e.rotation.y = Math.PI / 2; g.add(e); addBoxCol(s * 10 - 0.08, -5, s * 10 + 0.08, 5, 3, 'vidro');
          for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), gl); w.position.set(s * 8, yc + 1.5, k * 5); g.add(w); addBoxCol(s * 8 - 2, k * 5 - 0.08, s * 8 + 2, k * 5 + 0.08, 3, 'vidro'); }
          for (const k of [-5, -1.5, 1.5, 5]) { const p = boxGeo(0.08, 4, 0.08); xform(p, s * 10, yc + 2, k); LB.metalDark.add(p); }
        }
      }
      if (C.kind === 'basket') {
        for (const s of [-1, 1]) {
          const x = s * 14.6, p = new THREE.CylinderGeometry(0.09, 0.09, 3.3, 8); xform(p, x, yc + 1.65, 0); LB.metalDark.add(p); addCircCol(x, 0, 0.2, 3.5, 'canastra');
          const arm = boxGeo(1.2, 0.08, 0.08); xform(arm, x - s * 0.55, yc + 3.25, 0); LB.metalDark.add(arm);
          const bd = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 1.8), std({ color: 0xf4f4f0, roughness: 0.4 })); bd.position.set(x - s * 1.2, yc + 3.45, 0); g.add(bd);
          const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 16), std({ color: 0xff6a1a, metalness: 0.4 })); hoop.rotation.x = Math.PI / 2; hoop.position.set(x - s * 1.45, yc + 3.05, 0); g.add(hoop);
        }
      }
    });
  }
  // valado arredor das dúas pistas de tenis xa vai en cada pista; luces
  for (const C of LM.fluvialCourts) if (C.kind !== 'padel') { const [x, z] = C.F.pt(0, -C.W / 2 - 1); G.lamps.push({ x, y: terrainH(x, z) + 7, z }); }
}

/* ---------- bañistas: uns nadan lonxitudes, outros toman o sol ---------- */
function initFluvial() {
  const F = LM.fluvial; if (!F || typeof takePed !== 'function') return;
  const y0 = terrainH(F.ox, F.oz), C = world.crowd, list = [];
  const suits = ['#d4202b', '#1d4fd8', '#111111', '#f2c21b', '#2fa36b', '#e0569a'];
  const mk = (role, lx, lz) => {
    const p = takePed(); if (!p) return null;
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'banhista', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 1, armUp: 0, edge: null });
    const sw = pick(suits); Object.assign(p.col, { shirt: p.col.skin, pants: sw, shoe: p.col.skin, sleeve: false }); C.paint(p);
    const [x, z] = F.pt(lx, lz); p.x = x; p.z = z;
    const o = { p, role, lx, lz, dir: R() < 0.5 ? 1 : -1, sp: RR(0.9, 1.5), ph: R() * 6 }; list.push(o); return o;
  };
  for (const lane of [1, 3, 4, 6]) mk('nada', RR(-20, 20), -10.5 + (lane + 0.5) * 21 / 8);
  for (let i = 0; i < 5; i++) mk('sol', -22 + i * 10.8 + (i % 2) * 1.1, -16.5);
  G.fluvial = { list, y0 };
}
function updateFluvial(dt) {
  const S = G.fluvial; if (!S) return;
  const F = LM.fluvial, me = G.player.ped;
  if (Math.hypot(me.x - F.ox, me.z - F.oz) > 260) return;
  for (const o of S.list) {
    const p = o.p;
    if (o.role === 'nada') {
      o.lx += o.dir * o.sp * dt; if (Math.abs(o.lx) > 23.5) { o.dir *= -1; o.lx = Math.sign(o.lx) * 23.5; }
      const [x, z] = F.pt(o.lx, o.lz); p.x = x; p.z = z; p.y = S.y0 - 0.02 + Math.sin(G.t * 4 + o.ph) * 0.04;
      p.yaw = F.yaw(o.dir > 0 ? Math.PI / 2 : -Math.PI / 2); p.fallDir = -1; p.lie = 1; p.walk = 1; p.phase += dt * 6;
      p.arms = [-2.6 + Math.sin(G.t * 5 + o.ph) * 1.2, 0.15, 0.2, -2.6 - Math.sin(G.t * 5 + o.ph) * 1.2, -0.15, 0.2];
    } else {
      const [x, z] = F.pt(o.lx, o.lz); p.x = x; p.z = z; p.y = S.y0 + 0.42; p.yaw = F.yaw(Math.PI); p.fallDir = 1; p.lie = 1; p.walk = 0; p.arms = null;
    }
  }
}
