'use strict';
/* ==========================================================
   GTA LEMOS 27400 · CEIP Plurilingüe de Monforte de Lemos
   O bloque de tres plantas e a ala baixa saen do Catastro (con
   fachada propia); aquí engádense o pabellón polideportivo (que
   o Catastro non recolle), as pistas descubertas, o patio de
   Infantil, a zona de árbores e areeiros e a valla de balaústres
   de formigón cara á rúa. Situación tomada da vista aérea.
   Marco local: x ao longo do bloque (cara ao NE), z cara ao SE;
   1 m = 13,5 px da foto aérea, orixe no centro do bloque.
   ========================================================== */
const CEIP = { ox: 160.05, oz: -450.4, rot: 0.729 };
const ceipL = (px, py) => [(px - 737) / 13.5, (py - 640) / 13.5]; // px da foto aérea → local
function ceipLandmarks() {
  const F = CEIP.F = makeFrame(CEIP.ox, CEIP.oz, CEIP.rot);
  const rect = (x0, z0, x1, z1) => frameRectPoly(F, x0, z0, x1, z1);
  // pistas de tenis do Club Fluvial: alí non hai casas (o Catastro marca dúas)
  const [tx0, tz0] = ceipL(880, 930), [tx1, tz1] = ceipL(1110, 1440);
  (G.keepEmpty = G.keepEmpty || []).push(rect(tx0, tz0, tx1, tz1));
  G.namedZones.push({ n: 'CEIP Plurilingüe de Monforte', p: rect(...ceipL(60, 40), ...ceipL(1080, 1720)) });
}
function ceipTex(kind) {
  const c = cnv(512, 256), x = c.getContext('2d');
  if (kind === 'pav') { // pabellón: muro branco, franxa de vidro azulado entre piares
    x.fillStyle = '#f0f0ec'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#2f4f6e'; x.fillRect(0, 70, 512, 150); x.fillStyle = 'rgba(160,190,215,.35)'; for (let i = 0; i < 512; i += 16) x.fillRect(i, 70, 6, 150);
    x.fillStyle = '#e8e8e2'; for (let i = 0; i < 512; i += 128) x.fillRect(i, 60, 14, 196); x.fillStyle = '#c9ccce'; x.fillRect(0, 220, 512, 36); x.fillStyle = '#dcdcd6'; x.fillRect(0, 0, 512, 60);
  } else if (kind === 'side') { x.fillStyle = '#f0f0ec'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#dedcd4'; for (let i = 0; i < 512; i += 64) x.fillRect(i, 0, 3, 256); x.fillStyle = '#b9bcbe'; x.fillRect(0, 228, 512, 28); }
  else if (kind === 'court') { x.fillStyle = '#3f7d55'; x.fillRect(0, 0, 512, 256); x.strokeStyle = '#f4f4f0'; x.lineWidth = 4; x.strokeRect(12, 12, 488, 232); x.beginPath(); x.moveTo(256, 12); x.lineTo(256, 244); x.stroke(); x.beginPath(); x.arc(256, 128, 34, 0, 7); x.stroke();
    for (const s of [0, 1]) { x.beginPath(); x.arc(s ? 488 : 24, 128, 92, s ? Math.PI / 2 : -Math.PI / 2, s ? Math.PI * 1.5 : Math.PI / 2); x.stroke(); x.strokeRect(s ? 400 : 12, 88, 100, 80); } }
  else if (kind === 'volei') { x.fillStyle = '#b5523a'; x.fillRect(0, 0, 512, 256); x.strokeStyle = '#f4f4f0'; x.lineWidth = 5; x.strokeRect(12, 12, 488, 232); x.beginPath(); x.moveTo(256, 12); x.lineTo(256, 244); x.moveTo(176, 12); x.lineTo(176, 244); x.moveTo(336, 12); x.lineTo(336, 244); x.stroke(); }
  return toTex(c, false);
}
/* fachada do bloque escolar: branco con franxas azuis de xanelas en cada planta */
function ceipFacade(P) {
  const { L, H } = P, nf = Math.max(1, Math.round(H / 3.4)), fh = H / nf;
  P.rect(0, 0, L, H, '#f2f2ee'); P.rect(0, 0, L, 0.5, '#c9ccce'); P.rect(0, H - 0.3, L, 0.3, '#e2e2dc');
  for (let i = 0; i < nf; i++) { const y = i * fh + fh * 0.38, h = fh * 0.38; if (i === 0 && H < 5) continue;
    P.rect(0.6, y - 0.12, L - 1.2, h + 0.24, '#6f9cc8'); const n = Math.max(1, Math.floor((L - 1.2) / 1.6)); for (let k = 0; k < n; k++) P.win(0.8 + k * (L - 1.6) / n + 0.12, y, (L - 1.6) / n - 0.3, h, { frame: '#f2f2ee', glass: '#2f4a66', fw: 0.06 }); }
  if (H < 5) for (let k = 0; k < Math.floor(L / 3); k++) P.win(0.8 + k * 3, 0.9, 2.0, 1.4, { frame: '#f2f2ee', glass: '#2f4a66' });
}
if (typeof FACHADAS !== 'undefined') {
  const W = (px, py) => { const [a, b] = ceipL(px, py), c = Math.cos(CEIP.rot), s = Math.sin(CEIP.rot); return [CEIP.ox + a * c + b * s, CEIP.oz - a * s + b * c]; };
  FACHADAS.push({ id: 'ceipBloque', at: W(737, 640), draw: ceipFacade, all: true, inside: true, r: 4 });
  FACHADAS.push({ id: 'ceipAla', at: W(600, 300), draw: ceipFacade, all: true, inside: true, r: 4 });
}
function buildCEIP(B, scene) {
  if (!CEIP.F) return;
  const F = CEIP.F, y0 = terrainH(F.ox, F.oz);
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => {
    const mesh = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    // ---- pabellón polideportivo (27 × 47 m) e anexo de vestiarios ----
    const [pa, pb] = ceipL(545, 1385), PW = 27, PL = 47, PH = 9;
    const pavM = std({ map: ceipTex('pav'), roughness: 0.6 }), sideM = std({ map: ceipTex('side'), roughness: 0.8 }), roofM = std({ color: 0xc9cdd0, roughness: 0.6, metalness: 0.2 });
    const wall = (w, h, x, z, ry, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y0 + h / 2, z); p.rotation.y = ry; p.receiveShadow = true; g.add(p); };
    const pavBox = boxGeo(PW - 0.2, PH, PL - 0.2); xform(pavBox, pa, y0 + PH / 2, pb); LB.white.add(pavBox);
    wall(PL, PH, pa - PW / 2 - 0.02, pb, -Math.PI / 2, pavM); wall(PL, PH, pa + PW / 2 + 0.02, pb, Math.PI / 2, sideM);
    wall(PW, PH, pa, pb + PL / 2 + 0.02, 0, sideM); wall(PW, PH, pa, pb - PL / 2 - 0.02, Math.PI, pavM);
    { const r = new THREE.Mesh(new THREE.BoxGeometry(PW + 1.2, 0.35, PL + 1.2), roofM); r.position.set(pa, y0 + PH + 0.2, pb); r.castShadow = true; g.add(r); const rc = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, PL + 1.2), roofM); rc.position.set(pa, y0 + PH + 0.5, pb); g.add(rc); }
    for (let k = -2; k <= 2; k++) { const c = boxGeo(0.45, PH, 0.45); xform(c, pa - PW / 2 - 0.3, y0 + PH / 2, pb + k * PL / 5); LB.white.add(c); }
    addBoxCol(pa - PW / 2, pb - PL / 2, pa + PW / 2, pb + PL / 2, PH + 2, 'pabellon');
    const [aa, ab] = ceipL(572, 990), AW = 25.5, AL = 12, AH = 5.5;
    const ann = boxGeo(AW, AH, AL, [6, 2]); xform(ann, aa, y0 + AH / 2, ab); LB.concrete.add(ann);
    const ar = boxGeo(AW + 0.4, 0.3, AL + 0.4); xform(ar, aa, y0 + AH + 0.15, ab); LB.flat.add(ar);
    addBoxCol(aa - AW / 2, ab - AL / 2, aa + AW / 2, ab + AL / 2, AH + 2, 'pabellon');
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), std({ map: textTex('PAVILLÓN POLIDEPORTIVO', { w: 1024, h: 112, bg: '#f0f0ec', fg: '#2f4f6e', size: 64 }), roughness: 0.6 }));
    sign.position.set(pa - PW / 2 - 0.05, y0 + PH - 1.2, pb); sign.rotation.y = -Math.PI / 2; g.add(sign);
    // ---- pistas descubertas: baloncesto e volei ----
    const court = (kind, x, z, w, l) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, l), std({ map: ceipTex(kind), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 })); p.rotation.x = -Math.PI / 2; p.position.set(x, y0 + 0.04, z); p.receiveShadow = true; g.add(p); };
    const [ba, bb] = ceipL(575, 835); court('court', ba, bb, 22, 12);
    for (const s of [-1, 1]) { const px = ba + s * 10.6; mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), MAT.metalDark, px + s * 0.5, y0 + 1.7, bb); mesh(new THREE.BoxGeometry(0.06, 1.05, 1.8), MAT.white, px, y0 + 3.2, bb); const aro = mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 16), std({ color: 0xe0601a }), px - s * 0.3, y0 + 3.0, bb); aro.rotation.x = Math.PI / 2; }
    const [va, vb] = ceipL(300, 900); court('volei', va, vb, 9, 18);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), MAT.metalDark, va + s * 4.8, y0 + 1.25, vb);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1), std({ color: 0xf4f4f0, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); net.position.set(va, y0 + 2.0, vb); g.add(net);
    // ---- patio de Infantil: valla de cores, columpios, tobogán e areeiro ----
    const [i0, j0] = ceipL(110, 260), [i1, j1] = ceipL(350, 650), cols = [0xe8392b, 0xf2c21b, 0x2f7fd0, 0x2fa04a];
    const post = (x, z, k) => { const p = boxGeo(0.12, 1.1, 0.12); xform(p, x, y0 + 0.55, z); g.add(new THREE.Mesh(p, std({ color: cols[k % 4], roughness: 0.5 }))); };
    let k = 0; for (let x = i0; x <= i1; x += 1.2) { post(x, j0, k++); post(x, j1, k++); } for (let z = j0; z <= j1; z += 1.2) { post(i0, z, k++); post(i1, z, k++); }
    for (const [z, rx] of [[j0, 0], [j1, 0]]) { const r = boxGeo(i1 - i0, 0.08, 0.08); xform(r, (i0 + i1) / 2, y0 + 1.05, z); LB.white.add(r); }
    for (const x of [i0, i1]) { const r = boxGeo(0.08, 0.08, j1 - j0); xform(r, x, y0 + 1.05, (j0 + j1) / 2); LB.white.add(r); }
    addBoxCol(i0 - 0.1, j0 - 0.1, i1 + 0.1, j0 + 0.1, 1.1, 'valla'); addBoxCol(i0 - 0.1, j1 - 0.1, i1 + 0.1, j1 + 0.1, 1.1, 'valla'); addBoxCol(i1 - 0.1, j0, i1 + 0.1, j1 - 2.5, 1.1, 'valla');
    const soft = new THREE.Mesh(new THREE.PlaneGeometry(i1 - i0 - 0.4, j1 - j0 - 0.4), std({ color: 0x3f8f5a, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })); soft.rotation.x = -Math.PI / 2; soft.position.set((i0 + i1) / 2, y0 + 0.03, (j0 + j1) / 2); g.add(soft);
    const cx = (i0 + i1) / 2, cz = (j0 + j1) / 2;
    // columpios
    const red = std({ color: 0xd8342a, roughness: 0.5 }), yel = std({ color: 0xf2c21b, roughness: 0.5 }), blu = std({ color: 0x2f7fd0, roughness: 0.5 });
    for (const s of [-1, 1]) for (const t of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), red, cx - 4 + s * 1.6, y0 + 1.2, cz - 4 + t * 0.6); l.rotation.x = t * 0.22; }
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6), red, cx - 4, y0 + 2.45, cz - 4).rotation.z = Math.PI / 2;
    for (const s of [-0.8, 0.8]) { mesh(new THREE.BoxGeometry(0.5, 0.05, 0.25), yel, cx - 4 + s, y0 + 0.5, cz - 4); for (const q of [-0.2, 0.2]) mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.95, 4), MAT.metalDark, cx - 4 + s + q, y0 + 1.48, cz - 4); }
    // tobogán con escaleira
    const sx = cx + 3, sz = cz - 2;
    mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), blu, sx, y0 + 0.8, sz); mesh(new THREE.BoxGeometry(1.4, 0.15, 1.4), yel, sx, y0 + 1.65, sz);
    const sl = mesh(new THREE.BoxGeometry(0.7, 0.08, 3.0), yel, sx, y0 + 0.9, sz + 1.9); sl.rotation.x = 0.55;
    const ld = mesh(new THREE.BoxGeometry(0.6, 1.9, 0.1), red, sx, y0 + 0.85, sz - 1.0); ld.rotation.x = -0.35;
    // areeiro
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), std({ color: 0xe0cc95, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 })); sand.rotation.x = -Math.PI / 2; sand.position.set(cx + 2, y0 + 0.06, cz + 4); g.add(sand);
    for (const [w, d, x, z] of [[4.3, 0.2, 0, -1.6], [4.3, 0.2, 0, 1.6], [0.2, 3.2, -2.1, 0], [0.2, 3.2, 2.1, 0]]) mesh(new THREE.BoxGeometry(w, 0.3, d), std({ color: 0x8a5a34 }), cx + 2 + x, y0 + 0.15, cz + 4 + z);
    // ---- zona de árbores pequenas e areeiros diante do edificio ----
    const trunkM = MAT.trunk, leafM = std({ color: 0x5c8a3a, roughness: 0.9, flatShading: true });
    for (const [px, py] of [[160, 700], [240, 720], [320, 690], [190, 800], [270, 820], [180, 1000], [250, 1150], [190, 1300], [260, 1450]]) { const [x, z] = ceipL(px, py); mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.8, 6), trunkM, x, y0 + 0.9, z); mesh(new THREE.IcosahedronGeometry(0.9, 0), leafM, x, y0 + 2.1, z); }
    for (const [px, py] of [[220, 760], [300, 1050]]) { const [x, z] = ceipL(px, py); const s2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), std({ color: 0xe0cc95, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 })); s2.rotation.x = -Math.PI / 2; s2.position.set(x, y0 + 0.06, z); g.add(s2); }
  });
  // ---- valla de balaústres de formigón ao longo da rúa (cunha porta) ----
  const road = ROADS.filter(r => r.name === 'Rúa María Emilia Casas Baamonde');
  const pts = []; const [g0x, g0z] = F.pt(...ceipL(250, 690));
  const ends = [F.pt(...ceipL(100, 120)), F.pt(...ceipL(200, 1720))];
  const nr0 = { ...nearRoad(ends[0][0], ends[0][1], r => r.name === 'Rúa María Emilia Casas Baamonde') }, nr1 = { ...nearRoad(ends[1][0], ends[1][1], r => r.name === 'Rúa María Emilia Casas Baamonde') };
  if (!nr0.r || !nr1.r || !road.length) return;
  const off = nr0.r.hw + nr0.r.sw + 0.7;
  const side = (nr) => { const dx = CEIP.ox - nr.px, dz = CEIP.oz - nr.pz, nx = -nr.uz, nz = nr.ux; return dx * nx + dz * nz > 0 ? 1 : -1; };
  const sg = side(nr0);
  const A = [nr0.px - nr0.uz * off * sg, nr0.pz + nr0.ux * off * sg], Bp = [nr1.px - nr1.uz * off * sg, nr1.pz + nr1.ux * off * sg];
  const L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), ux = (Bp[0] - A[0]) / L, uz = (Bp[1] - A[1]) / L, yaw = Math.atan2(ux, uz);
  const gt = ((g0x - A[0]) * ux + (g0z - A[1]) * uz); // posición da porta
  const conc = std({ color: 0xd9d6cc, roughness: 0.95 }), bal = [];
  for (let t = 0; t < L; t += 0.32) { if (Math.abs(t - gt) < 2.2) continue; bal.push(t); }
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), conc, bal.length), o = new THREE.Object3D();
  bal.forEach((t, i) => { const x = A[0] + ux * t, z = A[1] + uz * t; o.position.set(x, terrainH(x, z) + 0.6, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = true; scene.add(im);
  for (const [t0, t1] of [[0, gt - 2.2], [gt + 2.2, L]]) { if (t1 - t0 < 0.5) continue; const m = (t0 + t1) / 2, x = A[0] + ux * m, z = A[1] + uz * m, len = t1 - t0;
    for (const yy of [0.15, 1.05]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, len), conc); r.position.set(x, terrainH(x, z) + yy, z); r.rotation.y = yaw; r.castShadow = true; scene.add(r); }
    addOBB(x, z, 0.12, len / 2, yaw, 1.2, 'valla'); }
  // porta de reixa verde (aberta) e cartel
  const gx = A[0] + ux * gt, gz = A[1] + uz * gt;
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), conc); p.position.set(gx + ux * s * 2.2, terrainH(gx, gz) + 0.8, gz + uz * s * 2.2); scene.add(p); }
  const sn = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.5), std({ map: textTex('CEIP PLURILINGÜE DE MONFORTE', { w: 1024, h: 140, bg: '#f4f4f0', fg: '#1f4f8f', size: 56 }), roughness: 0.6, side: THREE.DoubleSide }));
  sn.position.set(gx, terrainH(gx, gz) + 2.1, gz); sn.rotation.y = yaw + Math.PI / 2; scene.add(sn);
  G.ceipGate = { x: gx, z: gz };
}
