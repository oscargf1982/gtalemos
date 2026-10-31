'use strict';
/* ==========================================================
   LEMOS 27400 · detalles tirados das vistas aéreas e de Street View
   (xardín da Compañía, laranxeiras do Cardeal, quiosco Anchoa no Malecón)
   ========================================================== */
G.extraTrees = [];
function boxM(w, h, d, mat, x, y, z, ry = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; return m; }
const GRANITE = () => MAT.stone;

/* banco de granito: lousa sobre dous bloques (como no paseo) */
function graniteBench(scene, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry;
  g.add(boxM(2.1, 0.14, 0.55, GRANITE(), 0, 0.46, 0));
  for (const s of [-1, 1]) g.add(boxM(0.4, 0.4, 0.45, GRANITE(), s * 0.75, 0.2, 0));
  scene.add(g);
  const c = Math.abs(Math.sin(ry)) > 0.5; addBoxCol(x - (c ? 0.3 : 1.05), z - (c ? 1.05 : 0.3), x + (c ? 0.3 : 1.05), z + (c ? 1.05 : 0.3), 0.6, 'banco');
  G.seats.push({ x: x + Math.sin(ry) * 0.05, z: z + Math.cos(ry) * 0.05, yaw: ry, y: 0, sit: true });
}

/* ---------- Praza da Compañía: céspede con buxos recortados (Street View) ---------- */
function buildCompanhiaGarden(B, scene) {
  // coordenadas locais do marco da Compañía (praza z 129..166, fachada en z = 166, eixo x = −35)
  const beds = [[-84, -43, 131.5, 146.5], [-27, 19, 131.5, 146.5]];
  const bushes = [];
  for (const [x0, x1, z0, z1] of beds) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); xform(g, (x0 + x1) / 2, 0.09, (z0 + z1) / 2); B.park.add(g);
    // bordo de granito
    for (const [w, d, x, z] of [[x1 - x0, 0.25, (x0 + x1) / 2, z0], [x1 - x0, 0.25, (x0 + x1) / 2, z1], [0.25, z1 - z0, x0, (z0 + z1) / 2], [0.25, z1 - z0, x1, (z0 + z1) / 2]]) { const k = boxGeo(w, 0.16, d); xform(k, x, 0.08, z); B.stone.add(k); }
    // buxos en bóla en fila dobre, deixando o centro aberto
    for (let x = x0 + 2.5; x < x1 - 1.5; x += 5.5) for (const z of [z0 + 2.2, z1 - 2.2]) {
      if (Math.hypot(x + 14, z - 148) < 3) continue;
      bushes.push([x + RR(-0.3, 0.3), z, RR(0.75, 1.05)]);
    }
    // macizo central de arbustos baixos
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    for (let i = -2; i <= 2; i++) bushes.push([mx + i * 1.6, mz, 0.85]);
  }
  const geo = new THREE.IcosahedronGeometry(1, 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.92 + 0.08 * Math.sin(p.getX(i) * 9 + p.getZ(i) * 7); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.82, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2f5a24'), roughness: 0.95, flatShading: true });
  const im = new THREE.InstancedMesh(geo, mat, bushes.length), o = new THREE.Object3D();
  bushes.forEach(([x, z, s], i) => { o.position.set(x, 0.1 + 0.7 * s, z); o.scale.set(s, s, s); o.rotation.y = R() * 6; o.updateMatrix(); im.setMatrixAt(i, o.matrix); addCircCol(x, z, 0.8 * s, 1.4, 'buxo'); });
  im.castShadow = im.receiveShadow = true; scene.add(im);
  // cedros grandes no extremo leste, coma na foto
  for (const [x, z, k] of [[95, 96, 1.5], [96, 112, 1.35], [-21, 98, 1.25]]) G.extraTrees.push([...LM.compOld(x, z), k]);
}

/* ---------- Rúa do Cardeal: laranxeiras, bancos de granito, colectores e pancarta ---------- */
function buildCardealDetails(B, scene) {
  const P = LM.cardeal; if (!P.len) return;
  const off = 2.55, side = -1; // fila de laranxeiras nun lado, coma na foto
  const trees = [];
  for (let s = 10; s < P.len - 6; s += 7) {
    const p = P.at(s), x = p.x - p.uz * side * off, z = p.z + p.ux * side * off;
    if (G.seats.some(q => Math.hypot(q.x - x, q.z - z) < 1.8) || G.bars.some(b => Math.hypot(b.door.x - x, b.door.z - z) < 2.5)) continue;
    trees.push([x, z, s]);
  }
  const trunk = new THREE.CylinderGeometry(0.09, 0.14, 2.2, 7); trunk.translate(0, 1.1, 0);
  const crown = new THREE.IcosahedronGeometry(1.15, 1); crown.scale(1, 0.9, 1); crown.translate(0, 2.9, 0);
  const crownM = new THREE.MeshStandardMaterial({ color: new THREE.Color('#244d1f'), roughness: 0.85, flatShading: true });
  const orangeG = new THREE.SphereGeometry(0.07, 6, 5), orangeM = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f08a12'), roughness: 0.5 });
  const ti = new THREE.InstancedMesh(trunk, MAT.trunk, trees.length), ci = new THREE.InstancedMesh(crown, crownM, trees.length), oi = new THREE.InstancedMesh(orangeG, orangeM, trees.length * 12), o = new THREE.Object3D();
  let k = 0;
  trees.forEach(([x, z], i) => {
    const y = terrainH(x, z);
    o.position.set(x, y, z); o.rotation.set(0, R() * 6, 0); o.scale.set(1, 1, 1); o.updateMatrix(); ti.setMatrixAt(i, o.matrix); ci.setMatrixAt(i, o.matrix);
    for (let j = 0; j < 12; j++) { const a = R() * 6.28, e = RR(-0.6, 0.9); o.position.set(x + Math.cos(a) * Math.cos(e) * 1.1, y + 2.9 + Math.sin(e) * 0.95, z + Math.sin(a) * Math.cos(e) * 1.1); o.rotation.set(0, 0, 0); o.updateMatrix(); oi.setMatrixAt(k++, o.matrix); }
    addCircCol(x, z, 0.2, 2.5, 'laranxeira');
    const pit = boxGeo(1.2, 0.06, 1.2); xform(pit, x, y + 0.06, z); B.gravel.add(pit);
  });
  ti.castShadow = ci.castShadow = true; scene.add(ti, ci, oi);
  for (let i = 0; i < trees.length - 1; i += 2) {
    const s = (trees[i][2] + trees[i + 1][2]) / 2; if (trees[i + 1][2] - trees[i][2] > 9) continue;
    const p = P.at(s), x = p.x - p.uz * side * off, z = p.z + p.ux * side * off;
    if (G.seats.some(q => Math.hypot(q.x - x, q.z - z) < 1.8)) continue;
    graniteBench(scene, x, z, Math.atan2(p.ux, p.uz) + Math.PI / 2);
  }
  const binM = new THREE.MeshStandardMaterial({ color: 0x3a3c3e, roughness: 0.55, metalness: 0.4 });
  for (const s of [5, 6.2, 7.4]) { const p = P.at(s), x = p.x - p.uz * side * 3.1, z = p.z + p.ux * side * 3.1, b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 1.1, 12), binM); b.position.set(x, terrainH(x, z) + 0.55, z); b.castShadow = true; scene.add(b); addCircCol(x, z, 0.32, 1.1, 'colector'); }
  // pancarta de lado a lado da rúa
  const q = P.at(Math.min(30, P.len / 2)), wd = 7.6, yaw = Math.atan2(q.ux, q.uz) + Math.PI / 2, yb = terrainH(q.x, q.z);
  const tex = textTex('MONFORTE · TERRA E MEMORIA', { w: 1024, h: 120, bg: '#f4f1e6', fg: '#b3201f', size: 78, border: '#1f3f73' });
  for (const f of [0, Math.PI]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(wd - 2.2, 1.05), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })); ban.position.set(q.x + q.ux * (f ? 0.01 : -0.01), yb + 6.1, q.z + q.uz * (f ? 0.01 : -0.01)); ban.rotation.y = yaw + f + Math.PI / 2 - Math.PI / 2; ban.castShadow = true; scene.add(ban); }
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, wd, 4), MAT.metalDark); cab.rotation.set(0, yaw, Math.PI / 2, 'YXZ'); cab.position.set(q.x, yb + 6.7, q.z); scene.add(cab);
}

/* ---------- Paseo do Malecón: quiosco Anchoa, plataneiros, bancos e varanda ---------- */
function anchoaTex() {
  const c = cnv(512, 96), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 96); g.addColorStop(0, '#9a1b26'); g.addColorStop(1, '#6d1019'); x.fillStyle = g; x.fillRect(0, 0, 512, 96);
  x.fillStyle = '#f4efe2'; x.fillRect(0, 84, 512, 4);
  x.textBaseline = 'middle'; x.fillStyle = '#f4efe2'; x.font = '600 28px Barlow, sans-serif'; x.fillText('Cervecería', 34, 48);
  x.font = '900 52px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif'; x.fillText('ANCHOA', 210, 46);
  return toTex(c, false);
}
function panelTex() {
  const c = cnv(256, 128), x = c.getContext('2d'); x.fillStyle = '#ece6d4'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = 'rgba(80,70,50,.35)'; x.lineWidth = 2; for (let i = 0; i <= 256; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); }
  return toTex(c, false);
}
function buildKiosk(scene, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry;
  const W = 4.6, D = 2.7, H = 2.5;
  const pm = new THREE.MeshStandardMaterial({ map: panelTex(), roughness: 0.7 });
  g.add(boxM(W, H, D, pm, 0, H / 2, 0));
  const red = new THREE.MeshStandardMaterial({ color: new THREE.Color('#7d141e'), roughness: 0.6 });
  g.add(boxM(W + 0.7, 0.12, D + 0.9, red, 0, H + 0.62, 0.2));               // tellado voado
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.7, 0.55), new THREE.MeshStandardMaterial({ map: anchoaTex(), roughness: 0.5 }));
  sign.position.set(0, H + 0.3, D / 2 + 0.65); g.add(sign);
  g.add(boxM(W + 0.7, 0.55, 0.06, red, 0, H + 0.3, -D / 2 - 0.25));
  for (const s of [-1, 1]) g.add(boxM(0.06, 0.55, D + 0.9, red, s * (W / 2 + 0.35), H + 0.3, 0.2));
  // mostrador e contraventás pechadas
  g.add(boxM(W - 0.6, 0.08, 0.5, new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.8 }), 0, 1.05, D / 2 + 0.22));
  // barril e caixa de cervexa ao lado
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.8, roughness: 0.3 })); bar.position.set(W / 2 + 0.5, 0.3, D / 2); g.add(bar);
  // caseta de lixo de madeira, coma na foto
  g.add(boxM(1.3, 1.8, 1.1, new THREE.MeshStandardMaterial({ color: 0xcfc2a2, roughness: 0.85 }), -W / 2 - 1.6, 0.9, 0));
  scene.add(g);
  const c = Math.abs(Math.sin(ry)) > 0.5, hw = (c ? D : W) / 2 + 0.1, hd = (c ? W : D) / 2 + 0.1;
  addBoxCol(x - hw, z - hd, x + hw, z + hd, H + 0.7, 'quiosco');
  const lx = -W / 2 - 1.6, cx2 = x + lx * Math.cos(ry), cz2 = z - lx * Math.sin(ry);
  addBoxCol(cx2 - 0.65, cz2 - 0.65, cx2 + 0.65, cz2 + 0.65, 1.8, 'caseta');
  G.anchoa = { x, z };
}
function maleconAt(s, off) { const M = LM.malecon, p = M.path.at(s), sd = M.side; return { x: p.x - p.uz * sd * off, z: p.z + p.ux * sd * off, ux: p.ux, uz: p.uz, nx: -p.uz * sd, nz: p.ux * sd }; }
function maleconBank(s) { const M = LM.malecon, p = M.path.at(s), rn = riverNear(p.x, p.z); return Math.hypot(rn.px - p.x, rn.pz - p.z) - rn.hw; }
function buildMaleconDetails(B, scene) {
  const M = LM.malecon, L = M.path.len, r = M.road, edge = (r ? r.hw + r.sw : 5) + 0.3;
  // peitoril de granito sobre o río
  let prev = null;
  for (let s = 0; s <= L; s += 2) {
    const d = Math.max(edge + 2.5, maleconBank(s) - 0.5), p = maleconAt(s, d);
    if (prev) { const Lg = Math.hypot(p.x - prev.x, p.z - prev.z), yaw = Math.atan2(p.x - prev.x, p.z - prev.z); const w = boxGeo(0.5, 0.65, Lg + 0.1, [3, 3]); xform(w, (p.x + prev.x) / 2, terrainH(p.x, p.z) + 0.33, (p.z + prev.z) / 2, yaw); B.stone.add(w); addCircCol((p.x + prev.x) / 2, (p.z + prev.z) / 2, 0.3, 0.65, 'peitoril'); }
    prev = p;
  }
  // quiosco Anchoa ao comezo do paseo, de costas ao río
  { const s = 9, d = (edge + Math.max(edge + 2.5, maleconBank(s) - 0.5)) / 2, p = maleconAt(s, d); buildKiosk(scene, p.x, p.z, Math.atan2(-p.nx, -p.nz)); }
  // bancos de granito ao longo do peitoril
  for (let s = 20; s < L - 4; s += 9) { const d = Math.max(edge + 2.5, maleconBank(s) - 0.5) - 1.1, p = maleconAt(s, d); graniteBench(scene, p.x, p.z, Math.atan2(-p.nx, -p.nz)); }
  // plataneiros e farolas negras
  for (let s = 4; s < L - 2; s += 8) { const p = maleconAt(s, edge + 1.1); G.extraTrees.push([p.x, p.z, RR(1.0, 1.25)]); }
  G.parkLampPts = G.parkLampPts || [];
  for (let s = 14; s < L - 2; s += 16) { const d = Math.max(edge + 2.5, maleconBank(s) - 0.5) - 0.6, p = maleconAt(s, d); G.parkLampPts.push([p.x, p.z]); }
}
/* ---------- Praza da Estación: empedrado, aparcamento e marquesiña de vidro (Street View) ---------- */
function buildStationPlaza(B, scene) {
  const xf = 321, zc = 0, x0 = 309.8;
  const pv = new THREE.PlaneGeometry(xf - x0, 112); pv.rotateX(-Math.PI / 2);
  const uv = pv.attributes.uv, pp = pv.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pp.getX(i) / 3, pp.getZ(i) / 3);
  const pm = new THREE.Mesh(pv, new THREE.MeshStandardMaterial({ map: TEX.cobble, normalMap: TEX.cobbleN, color: 0xb9b6ae, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  pm.position.set((xf + x0) / 2, 0.05, zc); pm.receiveShadow = true; scene.add(pm);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xf2f2ee }), blueM = new THREE.MeshStandardMaterial({ color: 0x2f62b8, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -4 });
  for (let k = -9; k <= 9; k++) { if (Math.abs(k) < 2) continue; const z = zc + k * 2.8; const l = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.1), lineM); l.rotation.x = -Math.PI / 2; l.position.set(xf - 5.6, 0.07, z); scene.add(l); }
  const bl = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6), blueM); bl.rotation.x = -Math.PI / 2; bl.position.set(xf - 5.6, 0.07, zc + 7); scene.add(bl);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 6.5), new THREE.MeshStandardMaterial({ color: 0xbfe0e6, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55 }));
  glass.position.set(xf - 0.95, 4.3, zc); glass.rotation.z = -0.08; scene.add(glass);
  const fr = boxGeo(0.08, 0.12, 6.6); xform(fr, xf - 1.9, 4.23, zc); B.metal.add(fr);
  for (const s of [-1, 1]) { const t = boxGeo(1.95, 0.05, 0.05); xform(t, xf - 0.95, 4.5, zc + s * 3.2, 0, 0, -0.3); B.metal.add(t); }
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.36), std({ map: textTex('Acceso · Entrada', { w: 256, h: 80, bg: '#1f4e8c', fg: '#ffffff', size: 30, font: 'Barlow, sans-serif', weight: 600 }), roughness: .5 }));
  sg.position.set(xf - 0.04, 3.1, zc); sg.rotation.y = -Math.PI / 2; scene.add(sg);
  for (const dz of [-6, 6]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.7, 10), std({ color: 0x3b3d40, roughness: .8 })); pl.position.set(xf - 1.2, 0.35, zc + dz); scene.add(pl); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), std({ color: 0x2f5a24, roughness: .95, flatShading: true })); b.position.set(xf - 1.2, 0.95, zc + dz); scene.add(b); addCircCol(xf - 1.2, zc + dz, 0.4, 1.2, 'macetón'); }
}
function buildDetails(B, scene) {
  buildCardealDetails(B, scene);
  buildMaleconDetails(B, scene);
  buildBandStage(B, scene);
}
