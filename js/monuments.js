'use strict';
/* ==========================================================
   LEMOS 27400 · monumentos recreados a partir de documentación
   Alzados pintados a medida (canvas) sobre volumes fieis ás medidas publicadas.
   ========================================================== */

/* ---------- utilidades de alzado ---------- */
function elevTex(wm, hm, ppm, draw, opts = {}) {
  const W = Math.max(8, Math.round(wm * ppm)), H = Math.max(8, Math.round(hm * ppm));
  const c = cnv(W, H), x = c.getContext('2d');
  const e = opts.emissive ? cnv(W, H) : null, ex = e ? e.getContext('2d') : null;
  if (ex) { ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H); }
  const P = { W, H, ppm, X: m => m * ppm, Y: m => H - m * ppm, S: m => m * ppm };
  draw(x, P, ex);
  const out = { map: toTex(c, false) };
  if (ex) out.emissive = toTex(e, false);
  if (opts.normal) out.normal = normalFrom(c, opts.normal);
  return out;
}
/* sillería de granito: fiadas regulares con variación de ton e meteorización */
function ashlar(x, P, x0, y0, w, h, base, rowM = 0.5, opts = {}) {
  const [r, g, b] = base, rh = P.S(rowM);
  x.save(); x.beginPath(); x.rect(P.X(x0), P.Y(y0 + h), P.S(w), P.S(h)); x.clip();
  x.fillStyle = `rgb(${r * 0.7},${g * 0.7},${b * 0.7})`; x.fillRect(P.X(x0), P.Y(y0 + h), P.S(w), P.S(h));
  let row = 0;
  for (let yy = P.Y(y0); yy > P.Y(y0 + h) - rh; yy -= rh, row++) {
    let xx = P.X(x0) - (row % 2) * rh * 0.9;
    while (xx < P.X(x0 + w)) {
      const bw = rh * RR(1.4, opts.long ? 3.6 : 2.6), v = RR(-18, 14), warm = RR(-6, 8);
      x.fillStyle = `rgb(${clamp(r + v + warm, 0, 255)},${clamp(g + v, 0, 255)},${clamp(b + v - warm, 0, 255)})`;
      x.fillRect(xx + 1, yy - rh + 1, bw - 2, rh - 2);
      xx += bw;
    }
  }
  // escorrementos e liques
  for (let i = 0; i < w * h * 0.08; i++) { const px = P.X(x0 + R() * w), py = P.Y(y0 + R() * h), l = RR(10, 60); const gr = x.createLinearGradient(px, py, px, py + l); gr.addColorStop(0, 'rgba(40,38,30,.18)'); gr.addColorStop(1, 'rgba(40,38,30,0)'); x.fillStyle = gr; x.fillRect(px, py, RR(2, 6), l); }
  if (opts.moss) blotches(x, P.W, P.H, Math.round(w * h * 0.02), 6, 30, '#3c4a26', 0.05, 0.18);
  x.restore();
}
function moulding(x, P, x0, x1, y, hM, col = '#d6c9a6') { x.fillStyle = col; x.fillRect(P.X(x0), P.Y(y + hM), P.S(x1 - x0), P.S(hM)); x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(P.X(x0), P.Y(y), P.S(x1 - x0), Math.max(2, P.S(0.08))); }
function glassRect(x, ex, P, x0, y0, w, h, lit, frame = '#5a3b26') {
  const g = x.createLinearGradient(P.X(x0), P.Y(y0 + h), P.X(x0 + w), P.Y(y0)); g.addColorStop(0, '#2d3940'); g.addColorStop(0.5, '#7f939d'); g.addColorStop(1, '#1f282e');
  x.fillStyle = g; x.fillRect(P.X(x0), P.Y(y0 + h), P.S(w), P.S(h));
  x.fillStyle = frame; const t = Math.max(2, P.S(0.07)); x.fillRect(P.X(x0 + w / 2) - t / 2, P.Y(y0 + h), t, P.S(h)); x.fillRect(P.X(x0), P.Y(y0 + h * 0.62), P.S(w), t);
  if (ex && lit) { ex.fillStyle = `rgba(255,${200 + RI(0, 30)},${130 + RI(0, 50)},${RR(0.55, 0.95)})`; ex.fillRect(P.X(x0) + 2, P.Y(y0 + h) + 2, P.S(w) - 4, P.S(h) - 4); }
}
function archPath(x, P, cx, y0, w, h) { // vano de medio punto
  const r = w / 2; x.beginPath(); x.moveTo(P.X(cx - r), P.Y(y0)); x.lineTo(P.X(cx - r), P.Y(y0 + h - r)); x.arc(P.X(cx), P.Y(y0 + h - r), P.S(r), Math.PI, 0); x.lineTo(P.X(cx + r), P.Y(y0)); x.closePath();
}
function fillArch(x, ex, P, cx, y0, w, h, lit, dark = '#1e2226') {
  archPath(x, P, cx, y0, w, h); const g = x.createLinearGradient(0, P.Y(y0 + h), 0, P.Y(y0)); g.addColorStop(0, dark); g.addColorStop(1, '#3a4248'); x.fillStyle = g; x.fill();
  if (ex && lit) { archPath(ex, P, cx, y0, w, h); ex.fillStyle = `rgba(255,205,140,${RR(0.5, 0.9)})`; ex.fill(); }
}
function shield(x, P, cx, cy, s, col = '#b9a77f') { x.fillStyle = col; x.beginPath(); x.moveTo(P.X(cx - s / 2), P.Y(cy + s / 2)); x.lineTo(P.X(cx + s / 2), P.Y(cy + s / 2)); x.lineTo(P.X(cx + s / 2), P.Y(cy - s * 0.1)); x.quadraticCurveTo(P.X(cx + s / 2), P.Y(cy - s / 2), P.X(cx), P.Y(cy - s * 0.62)); x.quadraticCurveTo(P.X(cx - s / 2), P.Y(cy - s / 2), P.X(cx - s / 2), P.Y(cy - s * 0.1)); x.closePath(); x.fill(); x.strokeStyle = 'rgba(40,30,20,.6)'; x.lineWidth = Math.max(1, P.S(0.06)); x.stroke(); x.strokeRect(P.X(cx - s * 0.3), P.Y(cy + s * 0.3), P.S(s * 0.6), P.S(s * 0.5)); }

/* malla con alzado nunha cara (resto en pedra) */
function elevBox(scene, w, h, d, faces, x, y, z, ry = 0, sideMat) {
  // faces: {pz, nz, px, nx}: materiais para cada cara vertical
  const side = sideMat || MAT.stone;
  const g = boxGeo(w, h, d, [4, 4]);
  const keys = ['px', 'nx', null, null, 'pz', 'nz'], unit = new THREE.BoxGeometry(w, h, d).attributes.uv, uv = g.attributes.uv;
  keys.forEach((k, f) => { if (k && faces[k]) for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, unit.getX(i), unit.getY(i)); });
  const mats = [faces.px || side, faces.nx || side, MAT.flatRoof, side, faces.pz || side, faces.nz || side];
  const m = new THREE.Mesh(g, mats); m.position.set(x, y + h / 2, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); return m;
}
function elevMat(t, nightK = 0.9) {
  const m = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normal || null, roughness: 0.86, envMapIntensity: 0.35 });
  if (t.emissive) { m.emissiveMap = t.emissive; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 0; nightMat(m, 0, nightK); }
  return m;
}
const GOLD_GRANITE = [196, 178, 140], GREY_GRANITE = [150, 144, 132], DARK_GRANITE = [128, 122, 112];

/* ==========================================================
   TORRE DA HOMENAXE · ~30 m de altura e ~13 m de lado, muros de ata 3,5 m,
   catro niveis, "Ventá da Raíña" con arcos trilobulados no terceiro nivel
   ========================================================== */
function buildTorreHomenaxe(B, scene, T) {
  const tx = -112, tz = -160, w = 13.4, d = 12.6, th = 30;
  const face = (wm, south) => elevTex(wm, th, 14, (x, P, ex) => {
    ashlar(x, P, 0, 0, wm, th, GREY_GRANITE, 0.55, { moss: true });
    // zócalo en talud
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, P.Y(2), P.W, P.S(2));
    // seteiras en cada nivel
    for (const y of [6.5, 13, 20.5]) for (const fx of [0.28, 0.72]) { x.fillStyle = '#16181a'; x.fillRect(P.X(wm * fx) - P.S(0.12), P.Y(y + 1.6), P.S(0.24), P.S(1.6)); }
    if (south) {
      // porta de acceso en arco
      x.fillStyle = '#1a1c1e'; archPath(x, P, wm / 2, 0, 2, 3.4); x.fill();
      x.strokeStyle = '#b4ad9c'; x.lineWidth = P.S(0.25); archPath(x, P, wm / 2, 0, 2.4, 3.8); x.stroke();
      // Ventá da Raíña: dobre vano trilobulado baixo tímpano semicircular
      const vy = 17.5, vw = 2.6, vh = 3.4, vx = wm / 2;
      x.fillStyle = '#c3bba8'; archPath(x, P, vx, vy - 0.3, vw + 0.8, vh + 1.0); x.fill();
      for (const s of [-1, 1]) {
        const cx = vx + s * vw / 4, r = vw / 4 - 0.08;
        x.fillStyle = '#17191b'; x.beginPath(); x.moveTo(P.X(cx - r), P.Y(vy)); x.lineTo(P.X(cx - r), P.Y(vy + vh - r * 1.4));
        x.arc(P.X(cx - r * 0.45), P.Y(vy + vh - r * 1.4), P.S(r * 0.55), Math.PI, Math.PI * 1.5); x.arc(P.X(cx), P.Y(vy + vh - r * 1.1), P.S(r * 0.55), Math.PI, 0); x.arc(P.X(cx + r * 0.45), P.Y(vy + vh - r * 1.4), P.S(r * 0.55), -Math.PI * 0.5, 0);
        x.lineTo(P.X(cx + r), P.Y(vy)); x.closePath(); x.fill();
        if (ex) { ex.fillStyle = 'rgba(255,190,120,.55)'; ex.fillRect(P.X(cx - r * 0.8), P.Y(vy + vh * 0.7), P.S(r * 1.6), P.S(vh * 0.6)); }
      }
      x.fillStyle = '#6f6857'; x.fillRect(P.X(vx) - P.S(0.1), P.Y(vy + vh - 0.4), P.S(0.2), P.S(vh - 0.4)); // parteluz
      // escudos (Enríquez, Castro, Osorio)
      for (const [sx, sy] of [[wm * 0.22, 24], [wm * 0.5, 25.2], [wm * 0.78, 24]]) shield(x, P, sx, sy, 1.3, '#a9a089');
    } else {
      x.fillStyle = '#16181a'; x.fillRect(P.X(wm / 2) - P.S(0.5), P.Y(18.5 + 2), P.S(1), P.S(2)); // ventá alta
    }
    // ménsulas do adarve
    for (let k = 0.6; k < wm; k += 1.2) { x.fillStyle = '#6a655b'; x.fillRect(P.X(k), P.Y(th - 0.4), P.S(0.6), P.S(1.4)); }
  }, { emissive: true, normal: 2.2 });
  const S = elevMat(face(w, true), 0.6), N = elevMat(face(w, false), 0.3), E = elevMat(face(d, false), 0.3);
  elevBox(scene, w, th, d, { pz: S, nz: N, px: E, nx: E }, tx, T - 1, tz);
  // adarve voado con ameas
  const ledge = boxGeo(w + 1.6, 1.0, d + 1.6, [4, 4]); xform(ledge, tx, T + th - 0.3, tz); B.stone.add(ledge);
  const merl = (L, along) => { const n = Math.floor(L / 2.4); for (let k = 0; k < n; k++) { const o = -L / 2 + 1.2 + k * (L - 2.4) / Math.max(1, n - 1); along(o); } };
  for (const s of [-1, 1]) {
    merl(w + 1.4, o => { const m = boxGeo(1.4, 1.7, 0.8, [4, 4]); xform(m, tx + o, T + th + 1.05, tz + s * (d / 2 + 0.4)); B.stone.add(m); });
    merl(d + 1.4, o => { const m = boxGeo(0.8, 1.7, 1.4, [4, 4]); xform(m, tx + s * (w / 2 + 0.4), T + th + 1.05, tz + o); B.stone.add(m); });
  }
  addBoxCol(tx - w / 2, tz - d / 2, tx + w / 2, tz + d / 2, th + 6, 'torre', T - 5);
  // bandeira galega
  const pole = new THREE.CylinderGeometry(0.08, 0.1, 7, 6); xform(pole, tx, T + th + 4, tz); B.metal.add(pole);
  const fc = cnv(128, 86), fx = fc.getContext('2d'); fx.fillStyle = '#fff'; fx.fillRect(0, 0, 128, 86); fx.strokeStyle = '#0f6db5'; fx.lineWidth = 20; fx.beginPath(); fx.moveTo(0, 0); fx.lineTo(128, 86); fx.stroke();
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 2, 10, 4), std({ map: toTex(fc, false), side: THREE.DoubleSide, roughness: .9 }));
  flag.position.set(tx + 1.5, T + th + 6.2, tz); flag.castShadow = true; scene.add(flag);
  const base = flag.geometry.attributes.position.array.slice();
  G.anims.push(t => { const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const xx = base[i * 3] + 1.5; p.setZ(i, Math.sin(xx * 2.2 - t * 6) * 0.18 * xx); } p.needsUpdate = true; flag.geometry.computeVertexNormals(); });
  G.torre = { x: tx, z: tz, top: T + th };
}

/* ==========================================================
   MOSTEIRO DE SAN VICENTE DO PINO · edificio neoclásico de tres niveis
   con columnas dóricas na fachada; igrexa de fachada renacentista
   ========================================================== */
function buildMosteiro(B, scene, T) {
  const mx = -73, mz = -152, W = 36, D = 30, wd = 9, h = 15;
  const front = elevTex(W, h, 16, (x, P, ex) => {
    ashlar(x, P, 0, 0, W, h, [190, 180, 160], 0.45, { long: true });
    moulding(x, P, 0, W, 5, 0.4, '#d8ccb0'); moulding(x, P, 0, W, 10, 0.35, '#d8ccb0'); moulding(x, P, 0, W, h - 0.8, 0.8, '#ddd2b8');
    const bays = 9, bw = W / bays;
    for (let i = 0; i < bays; i++) {
      const cx = bw * (i + 0.5), centre = i === 4;
      for (const [y, hh] of [[1.0, 2.8], [5.9, 2.9], [10.8, 2.6]]) {
        if (centre && y < 2) { x.fillStyle = '#231d18'; archPath(x, P, cx, 0, 2.2, 3.8); x.fill(); continue; }
        x.fillStyle = '#e0d6bd'; x.fillRect(P.X(cx - 0.85), P.Y(y + hh + 0.35), P.S(1.7), P.S(hh + 0.6));
        if (y > 5) { x.fillStyle = '#cfc3a6'; x.fillRect(P.X(cx - 1.0), P.Y(y + hh + 0.55), P.S(2.0), P.S(0.22)); }
        glassRect(x, ex, P, cx - 0.65, y, 1.3, hh, R() < 0.5);
      }
      if (i > 0) { x.fillStyle = 'rgba(225,215,190,.55)'; x.fillRect(P.X(bw * i) - P.S(0.2), P.Y(h - 0.8), P.S(0.4), P.S(h - 0.8)); } // pilastras
    }
  }, { emissive: true, normal: 1.6 });
  const fm = elevMat(front, 0.8), plain = MAT.colegio;
  const wings = [[mx, mz + D / 2 - wd / 2, W, wd, 'front'], [mx, mz - D / 2 + wd / 2, W, wd], [mx - W / 2 + wd / 2, mz, wd, D - wd * 2], [mx + W / 2 - wd / 2, mz, wd, D - wd * 2]];
  for (const [x, z, w, d, f] of wings) {
    if (f) elevBox(scene, w, h, d, { pz: fm }, x, T, z, 0, plain);
    else { const g = boxGeo(w, h, d, FAC_TILE); xform(g, x, T + h / 2, z); B.colegio.add(g); }
    const r = hipRoof(w, d, 3.6, 4, 0.6); xform(r, x, T + h, z); B.slate.add(r);
    addBoxCol(x - w / 2, z - d / 2, x + w / 2, z + d / 2, h + 4, 'mosteiro', T - 5);
  }
  // pórtico de catro columnas dóricas e frontón
  const fz = mz + D / 2 + 0.9;
  for (const ox of [-3.3, -1.1, 1.1, 3.3]) { const c = new THREE.CylinderGeometry(0.34, 0.4, 5.2, 16); xform(c, mx + ox, T + 2.6, fz); B.stone.add(c); const cap = boxGeo(0.95, 0.25, 0.95); xform(cap, mx + ox, T + 5.3, fz); B.stone.add(cap); }
  const ent = boxGeo(8.2, 0.8, 1.7); xform(ent, mx, T + 5.8, fz - 0.2); B.stone.add(ent);
  const ped = new THREE.CylinderGeometry(0.01, 4.6, 1.6, 3, 1); xform(ped, mx, T + 7, fz - 0.2, Math.PI / 2, 0, 0, 1, 1, 0.42); B.stone.add(ped);
  // claustro
  for (let i = -2; i <= 2; i++) for (const s of [-1, 1]) { const c = new THREE.CylinderGeometry(0.35, 0.35, 4, 8); xform(c, mx + i * 3.6, T + 2, mz + s * (D / 2 - wd - 0.8)); B.stone.add(c); }
  // IGREXA: fachada renacentista
  const ix = -99, iz = -151, iw = 11, il = 26, ih = 17;
  const fac = elevTex(iw, ih, 22, (x, P, ex) => {
    ashlar(x, P, 0, 0, iw, ih, [178, 168, 148], 0.45, { moss: true });
    x.fillStyle = '#cdc2a6'; x.fillRect(P.X(0.4), 0, P.S(0.9), P.H); x.fillRect(P.X(iw - 1.3), 0, P.S(0.9), P.H); // contrafortes
    // portada: arco de medio punto entre columnas pareadas, entablamento e frontón
    x.fillStyle = '#d3c8ac'; x.fillRect(P.X(iw / 2 - 3), P.Y(7.2), P.S(6), P.S(7.2));
    x.fillStyle = '#1e1915'; archPath(x, P, iw / 2, 0, 2.6, 5); x.fill();
    x.strokeStyle = '#efe6cf'; x.lineWidth = P.S(0.3); archPath(x, P, iw / 2, 0, 3.2, 5.5); x.stroke();
    for (const s of [-1, 1]) for (const k of [0, 1]) { const cx = iw / 2 + s * (2.1 + k * 0.6); const g = x.createLinearGradient(P.X(cx - 0.22), 0, P.X(cx + 0.22), 0); g.addColorStop(0, '#9c927b'); g.addColorStop(0.5, '#f1e8d2'); g.addColorStop(1, '#9c927b'); x.fillStyle = g; x.fillRect(P.X(cx - 0.22), P.Y(6.3), P.S(0.44), P.S(6.3)); }
    x.fillStyle = '#e6dcc2'; x.fillRect(P.X(iw / 2 - 3.2), P.Y(7.3), P.S(6.4), P.S(0.9));
    x.beginPath(); x.moveTo(P.X(iw / 2 - 3.2), P.Y(7.3)); x.lineTo(P.X(iw / 2), P.Y(8.9)); x.lineTo(P.X(iw / 2 + 3.2), P.Y(7.3)); x.closePath(); x.fill();
    // fornela con imaxe e fiestra alta
    x.fillStyle = '#2a2622'; archPath(x, P, iw / 2, 9.6, 1.2, 2.2); x.fill(); x.fillStyle = '#b7ab90'; x.fillRect(P.X(iw / 2 - 0.25), P.Y(11.3), P.S(0.5), P.S(1.6));
    fillArch(x, ex, P, iw / 2, 12.6, 1.6, 2.6, true);
    // óculo e cornixa
    moulding(x, P, 0, iw, ih - 0.7, 0.7, '#ddd2b6');
    shield(x, P, iw / 2 - 3.4, 11, 1.1); shield(x, P, iw / 2 + 3.4, 11, 1.1);
  }, { emissive: true, normal: 2 });
  elevBox(scene, iw, ih, il, { pz: elevMat(fac, 0.5) }, ix, T, iz);
  const r = hipRoof(iw, il, 4.5, 4, 0.5); xform(r, ix, T + ih, iz); B.slate.add(r);
  addBoxCol(ix - iw / 2, iz - il / 2, ix + iw / 2, iz + il / 2, ih + 6, 'igrexa', T - 5);
  // espadana
  const esp = boxGeo(5, 6, 1.2, [4, 4]); xform(esp, ix, T + ih + 5.5, iz + il / 2 - 0.6); B.stone.add(esp);
  for (const s of [-1, 1]) { const bell = new THREE.CylinderGeometry(0.25, 0.6, 0.9, 12); xform(bell, ix + s * 1.2, T + ih + 5.6, iz + il / 2 - 0.6); B.bronze.add(bell); }
  const cr = boxGeo(0.25, 1.6, 0.25); xform(cr, ix, T + ih + 9.3, iz + il / 2 - 0.6); B.stone.add(cr);
  const cr2 = boxGeo(1.0, 0.25, 0.25); xform(cr2, ix, T + ih + 9.6, iz + il / 2 - 0.6); B.stone.add(cr2);
}

/* ==========================================================
   COLEXIO DE NOSA SEÑORA DA ANTIGA ("Escorial galego")
   Fachada simétrica de ~110 m en granito dourado; alas de tres plantas (15,8 m)
   con galería superior de arcos de medio punto e balaustradas; remate de
   pináculos de bóla; torres embebidas de dous corpos rematadas en media laranxa;
   igrexa central (portada de columnas dóricas pareadas, corpo xónico, frontón
   partido con peineta e seis acróteras); cúpula con tambor, linterna e pináculo;
   torres campanario xemelgas sobre o presbiterio.
   ========================================================== */
function buildCompanhia2(B, scene) {
  const C = { x0: -88, x1: 22, z0: 129 }; // praza en coordenadas de deseño (fronte á fachada, orientada ao norte)
  const pl = new THREE.PlaneGeometry(C.x1 - C.x0, 37); pl.rotateX(-Math.PI / 2); xform(pl, (C.x0 + C.x1) / 2, 0.04, C.z0 + 18.5);
  const uv = pl.attributes.uv, pp = pl.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pp.getX(i) / 4, pp.getZ(i) / 4); B.cobble.add(pl);
  const cx = -35, z0 = 166, L = 110, xa = cx - L / 2, xb = cx + L / 2, Hw = 15.8, depth = 14, chW = 22;
  // --- ala lateral: alzado de 44 m ---
  const wingLen = (L - chW) / 2;
  const wingTex = mirror => elevTex(wingLen, Hw, 24, (x, P, ex) => {
    ashlar(x, P, 0, 0, wingLen, Hw, GOLD_GRANITE, 0.48, { long: true });
    moulding(x, P, 0, wingLen, 5.0, 0.35, '#e2d3a8'); moulding(x, P, 0, wingLen, 10.2, 0.45, '#e2d3a8'); moulding(x, P, 0, wingLen, Hw - 0.9, 0.9, '#e8dab2');
    const bays = 10, bw = wingLen / bays;
    for (let i = 0; i < bays; i++) {
      const c = bw * (i + 0.5), fromChurch = mirror ? i : bays - 1 - i;
      if (fromChurch === 3) { // porta con frontón curvo
        x.fillStyle = '#e4d6b0'; x.fillRect(P.X(c - 1.4), P.Y(4.4), P.S(2.8), P.S(4.4));
        x.beginPath(); x.arc(P.X(c), P.Y(4.4), P.S(1.6), Math.PI, 0); x.fill();
        x.fillStyle = '#2a2018'; x.fillRect(P.X(c - 0.95), P.Y(3.7), P.S(1.9), P.S(3.7));
        glassRect(x, ex, P, c - 0.95, 6.0, 1.9, 3.2, R() < 0.6);
      } else {
        x.fillStyle = '#e4d6b0'; x.fillRect(P.X(c - 0.8), P.Y(3.6), P.S(1.6), P.S(2.4)); glassRect(x, ex, P, c - 0.6, 1.4, 1.2, 2.0, R() < 0.35);
        x.fillStyle = '#1b1b1b'; for (let k = 0; k < 5; k++) x.fillRect(P.X(c - 0.6 + k * 0.3), P.Y(3.4), Math.max(1, P.S(0.05)), P.S(2.0)); // reixa
        x.fillStyle = '#e4d6b0'; x.fillRect(P.X(c - 0.85), P.Y(9.1), P.S(1.7), P.S(3.0)); glassRect(x, ex, P, c - 0.65, 6.3, 1.3, 2.6, R() < 0.45);
      }
      // galería de arcos de medio punto con balaustrada
      fillArch(x, ex, P, c, 10.7, bw * 0.62, 4.0, R() < 0.3, '#2a2c2c');
      x.strokeStyle = '#efe2bc'; x.lineWidth = P.S(0.18); archPath(x, P, c, 10.7, bw * 0.62 + 0.3, 4.15); x.stroke();
      x.fillStyle = '#e6d8b0'; x.fillRect(P.X(c - bw * 0.31), P.Y(11.8), P.S(bw * 0.62), P.S(0.15)); for (let k = 0; k < 7; k++) { const bx = c - bw * 0.28 + k * bw * 0.093; x.fillRect(P.X(bx), P.Y(11.8), P.S(0.12), P.S(1.0)); }
      x.fillStyle = 'rgba(232,218,178,.95)'; x.fillRect(P.X(bw * i) - P.S(0.22), P.Y(Hw - 0.9), P.S(0.44), P.S(Hw - 10.6 - 0.9)); // pilastras da galería
    }
  }, { emissive: true, normal: 1.8 });
  const wL = elevMat(wingTex(false), 0.75), wR = elevMat(wingTex(true), 0.75);
  const goldSide = std({ map: TEX.colegio.map, normalMap: TEX.colegio.normal, color: 0xf0dfb5, roughness: 0.85, envMapIntensity: 0.35 });
  goldSide.map = TEX.colegio.map;
  for (const [wx, mat] of [[xa + wingLen / 2, wL], [xb - wingLen / 2, wR]]) {
    elevBox(scene, wingLen, Hw, depth, { nz: mat }, wx, 0, z0 + depth / 2, 0, goldSide);
    const r = hipRoof(wingLen, depth, 3.4, 4, 0.5); xform(r, wx, Hw, z0 + depth / 2); B.tile.add(r);
    addBoxCol(wx - wingLen / 2, z0, wx + wingLen / 2, z0 + depth, Hw + 4, 'colexio');
  }
  // relevo 3D sobre as alas: zócalo almofadado, impostas, cornixa voada, peitorís e pilastras da galería
  for (const [x0, x1] of [[xa, xa + wingLen], [xb - wingLen, xb]]) {
    const W2 = x1 - x0, mxw = (x0 + x1) / 2, bw = wingLen / 10;
    const add = (w, h, d, x, y, z) => { const g = boxGeo(w, h, d, [3, 3]); xform(g, x, y, z); B.stone.add(g); };
    add(W2 + 0.2, 0.9, 0.35, mxw, 0.45, z0 - 0.17);           // zócalo
    add(W2 + 0.1, 0.3, 0.32, mxw, 5.15, z0 - 0.16);           // imposta baixa
    add(W2 + 0.1, 0.4, 0.4, mxw, 10.4, z0 - 0.2);             // imposta da galería
    add(W2 + 0.6, 0.55, 0.75, mxw, Hw - 0.28, z0 - 0.37);     // cornixa
    add(W2 + 0.3, 0.3, 0.45, mxw, Hw - 0.75, z0 - 0.22);
    for (let i = 0; i < 10; i++) {
      const c = x0 + bw * (i + 0.5);
      add(1.8, 0.14, 0.32, c, 1.35, z0 - 0.15); add(1.9, 0.16, 0.34, c, 6.25, z0 - 0.16);   // peitorís
      add(bw * 0.62, 0.12, 0.28, c, 11.9, z0 - 0.12);                                       // pasamán da balaustrada
      if (i > 0) add(0.5, Hw - 11.4, 0.26, x0 + bw * i, (10.6 + Hw - 0.9) / 2, z0 - 0.13); // pilastras
    }
  }
  // farolas fernandinas na praza
  for (const lx of [cx - 40, cx - 20, cx + 20, cx + 40]) {
    const pole = new THREE.CylinderGeometry(0.09, 0.16, 4.2, 10); xform(pole, lx, 2.1, 158); B.metalDark.add(pole);
    for (const s of [-1, 1]) { const arm = boxGeo(0.9, 0.06, 0.06); xform(arm, lx + s * 0.45, 4.0, 158); B.metalDark.add(arm); const lamp = new THREE.SphereGeometry(0.28, 12, 10); xform(lamp, lx + s * 0.9, 4.0, 158); B.white.add(lamp); pushLamp({ x: lx + s * 0.9, y: 4.0, z: 158 }); }
    addCircCol(lx, 158, 0.25, 4, 'farola');
  }
  // alas traseiras (patios)
  for (const [x0, x1, za, zb] of [[xa, xa + 12, z0 + depth, 210], [xb - 12, xb, z0 + depth, 210], [xa, xb, 198, 210]]) {
    const g = boxGeo(x1 - x0, Hw, zb - za, FAC_TILE); xform(g, (x0 + x1) / 2, Hw / 2, (za + zb) / 2); B.colegio.add(g);
    const r = hipRoof(x1 - x0, zb - za, 3.2, 4, 0.5); xform(r, (x0 + x1) / 2, Hw, (za + zb) / 2); B.tile.add(r);
    addBoxCol(x0, za, x1, zb, Hw + 4, 'colexio');
  }
  // pináculos de bóla na cornixa
  for (let px = xa + 1; px <= xb - 1; px += 4.4) { if (Math.abs(px - cx) < chW / 2) continue; const pb = boxGeo(0.55, 0.55, 0.55); xform(pb, px, Hw + 0.28, z0 + 0.3); B.stone.add(pb); const ball = new THREE.SphereGeometry(0.36, 10, 8); xform(ball, px, Hw + 0.9, z0 + 0.3); B.stone.add(ball); }
  // --- torres embebidas (non nos extremos): dous corpos, balaustrada, media laranxa ---
  for (const tx of [xa + 9.5, xb - 9.5]) {
    const tt = elevTex(9, 20, 22, (x, P, ex) => {
      ashlar(x, P, 0, 0, 9, 20, GOLD_GRANITE, 0.48, { long: true });
      moulding(x, P, 0, 9, 5.0, 0.35, '#e2d3a8'); moulding(x, P, 0, 9, 10.2, 0.45, '#e2d3a8'); moulding(x, P, 0, 9, 15.3, 0.5, '#e8dab2'); moulding(x, P, 0, 9, 19.4, 0.6, '#e8dab2');
      for (const [y, hh] of [[1.4, 2.0], [6.3, 2.6], [11.0, 3.2]]) glassRect(x, ex, P, 3.7, y, 1.6, hh, R() < 0.4);
      fillArch(x, ex, P, 4.5, 16.0, 2.0, 3.0, false);
    }, { emissive: true, normal: 1.8 });
    const tm = elevMat(tt, 0.6);
    elevBox(scene, 9, 20, 9, { nz: tm, px: tm, nx: tm }, tx, 0, z0 + 4.2, 0, goldSide);
    const bal = boxGeo(9.4, 0.9, 9.4, [3, 3]); xform(bal, tx, 20.45, z0 + 4.2); B.stone.add(bal);
    for (let k = -3; k <= 3; k++) for (const s of [-1, 1]) { const b1 = boxGeo(0.25, 0.7, 0.25); xform(b1, tx + k * 1.3, 21.25, z0 + 4.2 + s * 4.5); B.stone.add(b1); const b2 = boxGeo(0.25, 0.7, 0.25); xform(b2, tx + s * 4.5, 21.25, z0 + 4.2 + k * 1.3); B.stone.add(b2); }
    const up = boxGeo(6, 4.2, 6, [4, 4]); xform(up, tx, 22.1, z0 + 4.2); B.stone.add(up);
    for (const s of [-1, 1]) { const op = boxGeo(1.4, 2.2, 0.1); xform(op, tx + s * 1.4, 22.2, z0 + 4.2 - 3.02); B.glass.add(op); }
    const dome = new THREE.SphereGeometry(3.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); xform(dome, tx, 24.2, z0 + 4.2); B.stone.add(dome);
    const pin = new THREE.ConeGeometry(0.35, 1.6, 8); xform(pin, tx, 28.0, z0 + 4.2); B.stone.add(pin);
    const ball = new THREE.SphereGeometry(0.3, 10, 8); xform(ball, tx, 29.0, z0 + 4.2); B.metal.add(ball);
    addBoxCol(tx - 4.5, z0 - 0.3, tx + 4.5, z0 + 8.7, 30, 'torre');
  }
  // --- fachada da igrexa (silueta extruída) ---
  const sh = new THREE.Shape(), hw = chW / 2;
  sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, 11.6); sh.lineTo(hw - 0.4, 11.6);
  sh.quadraticCurveTo(7.2, 12.4, 7, 15.5); sh.lineTo(7, 21.2); sh.lineTo(7.6, 21.2); sh.lineTo(1.9, 24.4); sh.lineTo(1.6, 24.4);
  sh.lineTo(1.6, 26.0); sh.quadraticCurveTo(0, 27.4, -1.6, 26.0); sh.lineTo(-1.6, 24.4); sh.lineTo(-1.9, 24.4); sh.lineTo(-7.6, 21.2); sh.lineTo(-7, 21.2); sh.lineTo(-7, 15.5);
  sh.quadraticCurveTo(-7.2, 12.4, -hw + 0.4, 11.6); sh.lineTo(-hw, 11.6); sh.lineTo(-hw, 0);
  const fg = new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false, curveSegments: 12 });
  const fp = fg.attributes.position, fu = fg.attributes.uv; for (let i = 0; i < fp.count; i++) fu.setXY(i, (fp.getX(i) + hw) / chW, fp.getY(i) / 27.4);
  fg.rotateY(Math.PI); fg.translate(cx, 0, z0 + 0.2);
  const chTex = elevTex(chW, 27.4, 26, (x, P, ex) => {
    const X = m => P.X(m + hw);
    // corpo inferior almofadado
    ashlar(x, P, 0, 0, chW, 27.4, GOLD_GRANITE, 0.5);
    for (let yy = 0; yy < 11.2; yy += 0.75) { x.fillStyle = 'rgba(60,45,25,.35)'; x.fillRect(0, P.Y(yy), P.W, Math.max(2, P.S(0.07))); }
    moulding(x, P, 0, chW, 11.0, 0.7, '#ecdcb0');
    // óculos e fiestras laterais (inferior)
    for (const s of [-1, 1]) { x.fillStyle = '#efe0b6'; x.beginPath(); x.arc(X(s * 7.6), P.Y(8.6), P.S(0.95), 0, 7); x.fill(); x.fillStyle = '#20262a'; x.beginPath(); x.arc(X(s * 7.6), P.Y(8.6), P.S(0.65), 0, 7); x.fill(); x.fillStyle = '#efe0b6'; x.fillRect(X(s * 7.6 - 0.9), P.Y(5.2), P.S(1.8), P.S(3.0)); glassRect(x, ex, P, s * 7.6 - 0.65 + hw, 2.4, 1.3, 2.6, true); }
    // portada: vano adintelado, columnas dóricas pareadas, friso de triglifos e metopas, cartela
    x.fillStyle = '#ead9ae'; x.fillRect(X(-4.2), P.Y(10.4), P.S(8.4), P.S(10.4));
    x.fillStyle = '#231a12'; x.fillRect(X(-1.5), P.Y(6.4), P.S(3), P.S(6.4)); x.fillStyle = '#4a3422'; x.fillRect(X(-1.35), P.Y(6.2), P.S(2.7), P.S(6.2));
    x.fillStyle = '#d6c391'; x.fillRect(X(-4.4), P.Y(9.5), P.S(8.8), P.S(1.4));
    for (let k = -4; k <= 4; k++) { x.fillStyle = k % 2 ? '#bda975' : '#f0e2b8'; x.fillRect(X(k * 0.95 - 0.25), P.Y(9.4), P.S(0.5), P.S(1.1)); if (k % 2 === 0) { x.strokeStyle = '#a99460'; x.lineWidth = 2; x.beginPath(); x.arc(X(k * 0.95 + 0.47), P.Y(8.85), P.S(0.25), 0, 7); x.stroke(); } }
    x.fillStyle = '#e9dcb4'; x.fillRect(X(-1.8), P.Y(11), P.S(3.6), P.S(1.0)); x.fillStyle = '#4b3b26'; x.font = `600 ${Math.round(P.S(0.32))}px serif`; x.textAlign = 'center'; x.fillText('D.O.M.  RODERICVS  DE  CASTRO', X(0), P.Y(10.45));
    // corpo superior: pilastras xónicas, gran ventanal, escudo do fundador, dous óculos
    for (const k of [-6.4, -3.2, 3.2, 6.4]) { x.fillStyle = '#efe0b6'; x.fillRect(X(k - 0.35), P.Y(21), P.S(0.7), P.S(9.4)); x.fillStyle = '#d8c48f'; x.fillRect(X(k - 0.5), P.Y(21.1), P.S(1.0), P.S(0.45)); }
    fillArch(x, ex, P, hw, 15.6, 2.6, 4.6, true);
    x.strokeStyle = '#efe0b6'; x.lineWidth = P.S(0.3); archPath(x, P, hw, 15.6, 3.2, 5.0); x.stroke();
    shield(x, P, hw, 13.4, 1.8, '#d6c391');
    for (const s of [-1, 1]) { x.fillStyle = '#efe0b6'; x.beginPath(); x.arc(X(s * 4.8), P.Y(18.6), P.S(0.75), 0, 7); x.fill(); x.fillStyle = '#20262a'; x.beginPath(); x.arc(X(s * 4.8), P.Y(18.6), P.S(0.5), 0, 7); x.fill(); }
    moulding(x, P, 0, chW, 20.9, 0.6, '#ecdcb0');
    // peineta co escudo da Coroa
    shield(x, P, hw, 25.2, 1.9, '#e2cf9a');
  }, { emissive: true, normal: 2 });
  const chMesh = new THREE.Mesh(fg, elevMat(chTex, 0.6)); chMesh.castShadow = chMesh.receiveShadow = true; scene.add(chMesh);
  // columnas dóricas pareadas da portada
  for (const s of [-1, 1]) for (const k of [0, 1]) { const c = new THREE.CylinderGeometry(0.42, 0.46, 8.0, 16); xform(c, cx + s * (2.4 + k * 1.15), 4.4, z0 - 2.55); B.stone.add(c); const base = boxGeo(1.05, 0.4, 1.05); xform(base, cx + s * (2.4 + k * 1.15), 0.2, z0 - 2.55); B.stone.add(base); }
  const ent = boxGeo(8.9, 1.4, 1.2); xform(ent, cx, 9.1, z0 - 2.55); B.stone.add(ent);
  for (const s of [-1, 1]) for (const k of [0, 1]) { const pn = new THREE.ConeGeometry(0.28, 1.3, 4); xform(pn, cx + s * (2.4 + k * 3.4), 10.5, z0 - 2.4); B.stone.add(pn); }
  // seis acróteras no frontón partido e aletóns con pirámides
  for (const [ax, ay] of [[-7.4, 21.6], [-4.8, 22.9], [-2.2, 24.3], [2.2, 24.3], [4.8, 22.9], [7.4, 21.6]]) { const b = new THREE.SphereGeometry(0.32, 10, 8); xform(b, cx + ax, ay + 0.3, z0 - 1.0); B.stone.add(b); const pd = boxGeo(0.5, 0.4, 0.5); xform(pd, cx + ax, ay, z0 - 1.0); B.stone.add(pd); }
  for (const s of [-1, 1]) { const py = new THREE.ConeGeometry(0.45, 1.6, 4); xform(py, cx + s * 10.2, 12.6, z0 - 1.0, Math.PI / 4); B.stone.add(py); const bl = new THREE.SphereGeometry(0.22, 8, 6); xform(bl, cx + s * 10.2, 13.6, z0 - 1.0); B.stone.add(bl); }
  // nave da igrexa
  const nv = boxGeo(16, 20, 40, [4, 4]); xform(nv, cx, 10, z0 + 20); B.stone.add(nv);
  const nr = hipRoof(16, 40, 4.5, 4, 0.5); xform(nr, cx, 20, z0 + 20); B.tile.add(nr);
  const tr = boxGeo(30, 18, 10, [4, 4]); xform(tr, cx, 9, z0 + 27); B.stone.add(tr); // cruceiro de brazos curtos
  const trr = hipRoof(30, 10, 3.5, 4, 0.5); xform(trr, cx, 18, z0 + 27); B.tile.add(trr);
  addBoxCol(cx - hw, z0 - 3, cx + hw, z0 + 2, 27, 'igrexa'); addBoxCol(cx - 8, z0 + 2, cx + 8, z0 + 40, 22, 'igrexa');
  // cúpula sobre o cruceiro: tambor con oito vans, media laranxa, linterna, cupuliña e pináculo
  const dz = z0 + 27;
  const drum = new THREE.CylinderGeometry(7, 7, 6, 32); xform(drum, cx, 24, dz); B.stone.add(drum);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, w = boxGeo(1.6, 3.2, 0.3); xform(w, cx + Math.sin(a) * 7.02, 24, dz + Math.cos(a) * 7.02, a); B.glass.add(w); const pl2 = boxGeo(0.6, 6, 0.6); xform(pl2, cx + Math.sin(a + 0.39) * 7.05, 24, dz + Math.cos(a + 0.39) * 7.05, a); B.stone.add(pl2); }
  const cor = new THREE.CylinderGeometry(7.6, 7.6, 0.6, 32); xform(cor, cx, 27.2, dz); B.stone.add(cor);
  const dome = new THREE.SphereGeometry(7.2, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2); xform(dome, cx, 27.4, dz); B.stone.add(dome);
  const lant = new THREE.CylinderGeometry(1.5, 1.6, 3.6, 16); xform(lant, cx, 36.4, dz); B.stone.add(lant);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, w = boxGeo(0.6, 1.8, 0.2); xform(w, cx + Math.sin(a) * 1.55, 36.5, dz + Math.cos(a) * 1.55, a); B.glass.add(w); }
  const cup = new THREE.SphereGeometry(1.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); xform(cup, cx, 38.2, dz); B.stone.add(cup);
  const pin = new THREE.ConeGeometry(0.4, 2.6, 8); xform(pin, cx, 41.1, dz); B.stone.add(pin);
  const bl = new THREE.SphereGeometry(0.3, 10, 8); xform(bl, cx, 42.6, dz); B.metal.add(bl);
  // torres campanario xemelgas sobre o presbiterio
  for (const s of [-1, 1]) {
    const bx = cx + s * 6.5, bz = z0 + 37;
    const b1 = boxGeo(4.4, 8, 4.4, [4, 4]); xform(b1, bx, 24, bz); B.stone.add(b1);
    for (const f of [0, 1, 2, 3]) { const a = f * Math.PI / 2; const o = boxGeo(1.4, 2.6, 0.2); xform(o, bx + Math.sin(a) * 2.22, 25, bz + Math.cos(a) * 2.22, a); B.glass.add(o); }
    const bal = boxGeo(4.8, 0.5, 4.8); xform(bal, bx, 28.25, bz); B.stone.add(bal);
    const b2 = boxGeo(3.2, 5, 3.2, [4, 4]); xform(b2, bx, 31, bz); B.stone.add(b2);
    for (const f of [0, 1, 2, 3]) { const a = f * Math.PI / 2; const o = boxGeo(1.1, 2.2, 0.2); xform(o, bx + Math.sin(a) * 1.62, 31.2, bz + Math.cos(a) * 1.62, a); B.glass.add(o); }
    const sd = new THREE.SphereGeometry(1.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); xform(sd, bx, 33.5, bz); B.stone.add(sd);
    const sp = new THREE.ConeGeometry(0.25, 1.4, 6); xform(sp, bx, 35.8, bz); B.stone.add(sp);
    const c1 = boxGeo(0.12, 1.1, 0.12); xform(c1, bx, 37.0, bz); B.metalDark.add(c1); const c2 = boxGeo(0.6, 0.12, 0.12); xform(c2, bx, 37.2, bz); B.metalDark.add(c2);
  }
  // mobiliario da praza
  for (let i = 0; i < 7; i++) bench(B, C.x0 + 8 + i * 15.5, 0.04, 152, Math.PI);
  G.statue = { x: cx, z: z0 - 6 };
}

/* ==========================================================
   PONTE VELLA · seis arcos de medio punto (dous cegados), arcos centrais
   máis amplos, tallamares augas arriba; Santa Clara diante do extremo norte
   ========================================================== */
function buildPonteVella(B, b) {
  const zc = b.c, width = b.hw * 2, half = b.half || RIVER_HW + 2.5, len = half * 2 + 2, KS = (half - 2.5) / RIVER_HW;
  const deck = u => 1.5 * Math.max(0, 1 - u * u);
  // vans: [centro (local), luz] — simétricos, máis amplos no centro; os extremos cegados
  const spans = [[-12.6, 2.6, true], [-8.4, 3.8], [-3.1, 5.2], [3.1, 5.2], [8.4, 3.8], [12.6, 2.6, true]].map(([c, sp, bl]) => [c * KS, sp * Math.min(KS, 1.6), bl]);
  const shape = new THREE.Shape(), N = 28;
  shape.moveTo(-len / 2, -3.6); shape.lineTo(-len / 2, 0.05);
  for (let i = 1; i <= N; i++) { const z = -len / 2 + len * i / N; shape.lineTo(z, deck(z / (half - 0.5)) - 0.06); }
  shape.lineTo(len / 2, -3.6);
  for (const [c, sp, blind] of spans) {
    if (blind) continue;
    const r = sp / 2, spring = -1.9 + (sp - 3.8) * 0.25;
    const h = new THREE.Path(); h.moveTo(c - r, -3.7); h.lineTo(c - r, spring); h.absarc(c, spring, r, Math.PI, 0, true); h.lineTo(c + r, -3.7); h.lineTo(c - r, -3.7);
    shape.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 14 });
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 4, p.getY(i) / 4);
  g.rotateY(Math.PI / 2); g.translate(b.x - width / 2, 0, zc);
  B.stone.add(g);
  // dovelas marcadas e arcos cegados (recheo rehundido)
  for (const [c, sp, blind] of spans) {
    const r = sp / 2, spring = -1.9 + (sp - 3.8) * 0.25;
    for (const s of [-1, 1]) {
      const ring = new THREE.TorusGeometry(r + 0.3, 0.32, 6, 18, Math.PI); xform(ring, b.x + s * (b.hw + 0.12), spring, zc - c, Math.PI / 2);
      B.stone.add(ring);
      if (blind) { const f = boxGeo(0.3, r + 1.8, sp); xform(f, b.x + s * (b.hw - 0.15), spring - 0.9 + r * 0.3, zc - c); B.concrete.add(f); }
    }
  }
  // tallamares triangulares augas arriba (oeste) e contrafortes augas abaixo
  const piers = [-10.6, -5.9, 0, 5.9, 10.6].map(v => v * KS);
  for (const pz of piers) {
    const cut = new THREE.CylinderGeometry(1.5, 1.5, 4.2, 3, 1); xform(cut, b.x - b.hw - 0.6, -1.6, zc - pz, Math.PI / 2 * 3, 0, 0, 1, 1, 1.4); B.stone.add(cut);
    const cap = new THREE.ConeGeometry(1.5, 1.4, 3); xform(cap, b.x - b.hw - 0.6, 1.1, zc - pz, Math.PI / 2 * 3, 0, 0, 1, 1, 1.4); B.stone.add(cap);
    const bt = boxGeo(1.6, 3.8, 2.2, [3, 3]); xform(bt, b.x + b.hw + 0.7, -1.8, zc - pz); B.stone.add(bt);
  }
  // parapetos que seguen o lombo
  for (const s of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const z0 = -len / 2 + len * i / N, z1 = -len / 2 + len * (i + 1) / N, y0 = deck(z0 / (half - 0.5)), y1 = deck(z1 / (half - 0.5));
      const seg = boxGeo(0.6, 1.05, len / N + 0.05, [3, 3]); xform(seg, b.x + s * (b.hw - 0.3), (y0 + y1) / 2 + 0.5, zc + (z0 + z1) / 2, 0, -Math.atan2(y1 - y0, len / N));
      B.stone.add(seg);
      const top = boxGeo(0.75, 0.14, len / N + 0.05, [3, 3]); xform(top, b.x + s * (b.hw - 0.3), (y0 + y1) / 2 + 1.08, zc + (z0 + z1) / 2, 0, -Math.atan2(y1 - y0, len / N));
      B.stone.add(top);
    }
    addBoxCol(Math.min(b.x + s * b.hw - 0.6, b.x + s * b.hw + 0.1 * s), zc - half, Math.max(b.x + s * b.hw - 0.6, b.x + s * b.hw + 0.1 * s), zc + half, 2.5, 'rail', -5);
  }
}

/* ==========================================================
   MOSTEIRO DE SANTA CLARA (Museo de Arte Sacra das Clarisas)
   fachada principal austera, en granito, diante da Ponte Vella
   ========================================================== */
function buildClarisas(B, scene) {
  const z0 = -40, cx = -40;
  // igrexa: fachada sobria cara á ponte
  const iw = 14, ih = 14, il = 24;
  const ft = elevTex(iw, ih + 5, 18, (x, P, ex) => {
    ashlar(x, P, 0, 0, iw, ih + 5, [170, 162, 146], 0.5, { moss: true });
    x.fillStyle = '#c7bca2'; x.fillRect(P.X(0.3), 0, P.S(0.8), P.H); x.fillRect(P.X(iw - 1.1), 0, P.S(0.8), P.H);
    x.fillStyle = '#1d1915'; archPath(x, P, iw / 2, 0, 2.4, 4.4); x.fill(); x.strokeStyle = '#dcd2bb'; x.lineWidth = P.S(0.3); archPath(x, P, iw / 2, 0, 3.0, 4.8); x.stroke();
    x.fillStyle = '#d9cfb6'; x.fillRect(P.X(iw / 2 - 2.2), P.Y(5.6), P.S(4.4), P.S(0.5));
    x.fillStyle = '#2b2622'; archPath(x, P, iw / 2, 6.6, 1.1, 2); x.fill(); x.fillStyle = '#a99d84'; x.fillRect(P.X(iw / 2 - 0.22), P.Y(8.0), P.S(0.44), P.S(1.4));
    fillArch(x, ex, P, iw / 2, 9.6, 1.4, 2.4, true);
    shield(x, P, iw / 2, 13.2, 1.3, '#bdb196');
    moulding(x, P, 0, iw, ih - 0.5, 0.5, '#d6ccb2');
  }, { emissive: true, normal: 2 });
  const sh = new THREE.Shape(); sh.moveTo(-iw / 2, 0); sh.lineTo(iw / 2, 0); sh.lineTo(iw / 2, ih); sh.lineTo(0, ih + 4.2); sh.lineTo(-iw / 2, ih); sh.lineTo(-iw / 2, 0);
  const fg = new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: false });
  const fp = fg.attributes.position, fu = fg.attributes.uv; for (let i = 0; i < fp.count; i++) fu.setXY(i, (fp.getX(i) + iw / 2) / iw, fp.getY(i) / (ih + 5));
  fg.translate(cx, -1, z0 - 1.0);
  const fm = new THREE.Mesh(fg, elevMat(ft, 0.5)); fm.castShadow = fm.receiveShadow = true; scene.add(fm);
  const nave = boxGeo(iw, ih + 1, il, [4, 4]); xform(nave, cx, (ih + 1) / 2 - 1, z0 - 1 - il / 2); B.stone.add(nave);
  const nr = hipRoof(iw, il, 4.2, 4, 0.4); xform(nr, cx, ih, z0 - 1 - il / 2); B.tile.add(nr);
  // espadana coas campás
  const esp = boxGeo(4.4, 5.2, 1.0, [4, 4]); xform(esp, cx, ih + 5.2, z0 - 0.6); B.stone.add(esp);
  for (const s of [-1, 1]) { const bell = new THREE.CylinderGeometry(0.22, 0.55, 0.8, 12); xform(bell, cx + s * 1.0, ih + 5.4, z0 - 0.6); B.bronze.add(bell); }
  addBoxCol(cx - iw / 2, z0 - 1 - il, cx + iw / 2, z0, ih + 6, 'clarisas');
  // convento: ala austera de dous andares con poucas fiestras enreixadas
  const cw = 34, ch = 10, cd = 12, ccx = cx - iw / 2 - cw / 2;
  const ct = elevTex(cw, ch, 16, (x, P, ex) => {
    ashlar(x, P, 0, 0, cw, ch, [168, 160, 144], 0.5, { moss: true });
    moulding(x, P, 0, cw, ch - 0.5, 0.5, '#d2c7ad');
    for (let i = 0; i < 8; i++) { const c = 2.2 + i * 4.2; x.fillStyle = '#d6cbb1'; x.fillRect(P.X(c - 0.6), P.Y(7.6), P.S(1.2), P.S(1.9)); glassRect(x, ex, P, c - 0.45, 5.9, 0.9, 1.5, R() < 0.25); x.fillStyle = '#181818'; for (let k = 0; k < 4; k++) x.fillRect(P.X(c - 0.45 + k * 0.3), P.Y(7.4), Math.max(1, P.S(0.05)), P.S(1.5)); if (i % 2) { x.fillStyle = '#d6cbb1'; x.fillRect(P.X(c - 0.35), P.Y(3.0), P.S(0.7), P.S(1.0)); x.fillStyle = '#20252a'; x.fillRect(P.X(c - 0.25), P.Y(2.9), P.S(0.5), P.S(0.8)); } }
    // letreiro do museo
    x.fillStyle = '#3a2f22'; x.fillRect(P.X(cw - 9), P.Y(4.2), P.S(7.4), P.S(0.9)); x.fillStyle = '#efe4c8'; x.font = `600 ${Math.round(P.S(0.5))}px Barlow, sans-serif`; x.textAlign = 'center'; x.fillText('MUSEO DE ARTE SACRA · CLARISAS', P.X(cw - 5.3), P.Y(3.55));
    x.fillStyle = '#231d18'; archPath(x, P, cw - 5.3, 0, 1.8, 2.9); x.fill();
  }, { emissive: true, normal: 2 });
  elevBox(scene, cw, ch + 1, cd, { pz: elevMat(ct, 0.5) }, ccx, -1, z0 - cd / 2 + 0.2);
  const cr = hipRoof(cw, cd, 3.0, 4, 0.4); xform(cr, ccx, ch, z0 - cd / 2 + 0.2); B.tile.add(cr);
  addBoxCol(ccx - cw / 2, z0 - cd + 0.2, ccx + cw / 2, z0 + 0.2, ch + 4, 'clarisas');
}

/* ==========================================================
   PARQUE DOS CONDES · embarcadoiro de lanchas no Cabe
   ========================================================== */
function buildEmbarcadoiro(B, scene) {
  const x0 = -11, x1 = 11, zb = 0;
  const dk = boxGeo(x1 - x0, 0.25, 3.2, [3, 3]); xform(dk, (x0 + x1) / 2, -0.55, zb - 1.0); B.wood.add(dk);
  for (let x = x0 + 1; x < x1; x += 3) for (const dz of [-2.4, 0.4]) { const pl = new THREE.CylinderGeometry(0.14, 0.14, 2.4, 8); xform(pl, x, -1.4, zb + dz); B.wood.add(pl); }
  const ramp = boxGeo(2.4, 0.2, 5.5, [3, 3]); xform(ramp, x1 - 2, -0.1, zb + 2.2, 0, -0.2); B.wood.add(ramp);
  // caseta de aluguer
  const hut = boxGeo(3.4, 2.6, 2.6); xform(hut, x1 - 2.2, 1.3, zb + 7.5); B.vcol.add(colorize(hut, '#e9e4d6'));
  const hr = hipRoof(3.4, 2.6, 0.9, 4, 0.3); xform(hr, x1 - 2.2, 2.6, zb + 7.5); B.slate.add(hr);
  addBoxCol(x1 - 3.9, zb + 6.2, x1 - 0.5, zb + 8.8, 3);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.6), std({ map: textTex('EMBARCADOIRO', { w: 512, h: 100, bg: '#24425e', fg: '#f4f1e8', size: 62 }), roughness: .6 }));
  sg.position.set(x1 - 2.2, 2.2, zb + 6.18); sg.rotation.y = Math.PI; scene.add(sg);
  // lanchas e piraguas flotando
  const boats = [];
  const hullCol = ['#c8432f', '#2f6aa3', '#f1b73a', '#2f8a5a', '#e9e4d6'];
  for (let i = 0; i < 6; i++) {
    const kayak = i % 2 === 1;
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std({ color: hullCol[i % hullCol.length], roughness: .5 }));
    hull.scale.set(kayak ? 0.36 : 0.75, kayak ? 0.28 : 0.45, kayak ? 2.2 : 1.8); g.add(hull);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 20), std({ color: 0x5a3e24 })); rim.rotation.x = Math.PI / 2; rim.scale.set(kayak ? 0.36 : 0.75, kayak ? 2.2 : 1.8, 1); g.add(rim);
    if (!kayak) { const seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.3), MAT.wood); seat.position.y = -0.08; g.add(seat); }
    g.position.set(x0 + 2 + i * 3.4, -1.0, zb - 3.4 - (i % 2) * 0.6); g.rotation.y = RR(-0.15, 0.15) + (kayak ? 0 : 0.05);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g); boats.push({ g, ph: R() * 6, y: g.position.y });
  }
  G.anims.push(t => { for (const b of boats) { b.g.position.y = b.y + Math.sin(t * 1.3 + b.ph) * 0.05; b.g.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.04; } });
}

/* ==========================================================
   PASARELA DE MADEIRA (ponte peonil recente sobre o Cabe)
   ========================================================== */
function buildWoodBridge(B, b) {
  const zc = b.c, half = b.half || RIVER_HW + 2.5, w = b.hw * 2;
  const N = 16;
  for (let i = 0; i < N; i++) {
    const z0 = -half + 2 * half * i / N, z1 = -half + 2 * half * (i + 1) / N, y0 = bridgeDeck(b, b.x, zc + z0), y1 = bridgeDeck(b, b.x, zc + z1);
    const seg = boxGeo(w, 0.22, 2 * half / N + 0.03, [1.2, 1.2]); xform(seg, b.x, (y0 + y1) / 2 - 0.1, zc + (z0 + z1) / 2, 0, -Math.atan2(y1 - y0, 2 * half / N)); B.wood.add(seg);
    for (const s of [-1, 1]) { const rl = boxGeo(0.1, 0.1, 2 * half / N + 0.03); xform(rl, b.x + s * (w / 2 - 0.05), (y0 + y1) / 2 + 1.0, zc + (z0 + z1) / 2, 0, -Math.atan2(y1 - y0, 2 * half / N)); B.wood.add(rl); const po = boxGeo(0.12, 1.05, 0.12); xform(po, b.x + s * (w / 2 - 0.05), y0 + 0.45, zc + z0); B.wood.add(po); }
  }
  // arco de vigas laminadas
  for (const s of [-1, 1]) for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, za = -Math.cos(a0) * half, zb2 = -Math.cos(a1) * half, ya = Math.sin(a0) * 2.2 - 2.4, yb = Math.sin(a1) * 2.2 - 2.4;
    const L = Math.hypot(zb2 - za, yb - ya), g = boxGeo(0.3, 0.45, L); xform(g, b.x + s * (w / 2 - 0.2), (ya + yb) / 2, zc + (za + zb2) / 2, 0, -Math.atan2(yb - ya, zb2 - za)); B.wood.add(g);
  }
  for (const s of [-1, 1]) addBoxCol(b.x + (s > 0 ? b.hw - 0.2 : -b.hw - 0.2), zc - half, b.x + (s > 0 ? b.hw + 0.2 : -b.hw + 0.2), zc + half, 2, 'rail', -5);
}

/* ==========================================================
   PLAYA DE VÍAS · Monforte foi un gran nó ferroviario (24 vías)
   ========================================================== */
function buildRailYard(B, scene) {
  const extra = [387.5, 400.5, 407, 413.5, 420];
  const sleepers = [];
  for (const tx of extra) {
    const z0 = -95, z1 = 178, Lz = z1 - z0, zc = (z0 + z1) / 2;
    const bal = boxGeo(3.4, 0.35, Lz, [3, 3]); xform(bal, tx, 0.05, zc); B.ballast.add(bal);
    for (const s of [-1, 1]) { const rl = boxGeo(0.08, 0.16, Lz); xform(rl, tx + s * 0.834, 0.3, zc); B.rail.add(rl); }
    for (let z = z0; z < z1; z += 0.9) sleepers.push([tx, z]);
  }
  const sm = new THREE.InstancedMesh(boxGeo(2.6, 0.14, 0.28), MAT.concrete, sleepers.length), o = new THREE.Object3D();
  sleepers.forEach(([x, z], i) => { o.position.set(x, 0.24, z); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.receiveShadow = true; scene.add(sm);
  // vagóns de mercadorías estacionados (caixa pechada, cisterna, plataforma con madeira)
  const wagonKinds = [
    () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.7, 13), std({ color: pick(['#7b3a26', '#5c4a3a', '#3d4f5e', '#8a6a3a']), roughness: .8 })); b.position.y = 2.25; g.add(b); const rf = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 13, 12, 1, false, -Math.PI / 2, Math.PI), std({ color: 0x6b6b68, roughness: .7 })); rf.rotation.x = Math.PI / 2; rf.scale.set(0.95, 1, 0.2); rf.position.y = 3.6; g.add(rf); return g; },
    () => { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 11.5, 18), std({ color: pick(['#d9d6cf', '#2b2b2e', '#c9b23a']), roughness: .45, metalness: .5 })); t.rotation.x = Math.PI / 2; t.position.y = 2.3; g.add(t); const f = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 12.5), std({ color: 0x222222 })); f.position.y = 1.0; g.add(f); return g; },
    () => { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 13), std({ color: 0x2a2a2a })); f.position.y = 1.05; g.add(f); for (let k = -1; k <= 1; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 3.6), std({ color: 0xb08a5a, roughness: .9 })); l.position.set(0, 1.9, k * 4.1); g.add(l); } return g; },
  ];
  const wheelG = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 14), wheelM = std({ color: 0x1a1a1a, metalness: .6, roughness: .5 });
  for (const tx of [381, 400.5, 413.5, 420]) {
    let z = RR(-80, -40);
    const n = RI(6, 10);
    for (let i = 0; i < n; i++) {
      const w = pick(wagonKinds)(); w.position.set(tx, 0.38, z); scene.add(w);
      for (const dz of [-4.5, 4.5]) for (const s of [-1, 1]) { const wh = new THREE.Mesh(wheelG, wheelM); wh.rotation.z = Math.PI / 2; wh.position.set(s * 0.834, 0.45, dz); w.add(wh); }
      w.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      addBoxCol(tx - 1.5, z - 6.8, tx + 1.5, z + 6.8, 4, 'vagon');
      z += 14.2;
    }
  }
  // pórticos de sinalización e catenaria
  for (let z = -120; z < 178; z += 60) {
    for (const x of [338, 424]) { const p = new THREE.CylinderGeometry(0.18, 0.22, 7.5, 8); xform(p, x, 3.75, z); B.metalDark.add(p); }
    const beam = boxGeo(86, 0.35, 0.35); xform(beam, 381, 7.2, z); B.metalDark.add(beam);
  }
}

/* ==========================================================
   Brillo nocturno das luces (halos aditivos)
   ========================================================== */
function buildGlows(scene) {
  const c = cnv(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,220,160,1)'); g.addColorStop(0.25, 'rgba(255,190,110,.45)'); g.addColorStop(1, 'rgba(255,160,80,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const pts = [];
  for (const l of G.lamps) pts.push(l.x, l.y - 0.2, l.z);
  for (const l of (G.cardealLights || [])) pts.push(l.x, l.y, l.z);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.PointsMaterial({ map: toTex(c, false), size: 3.2, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false; scene.add(p);
  G.anims.push(() => { mat.opacity = G.night * 0.85; p.visible = G.night > 0.05; });
}

/* ==========================================================
   CAMPO DA PINGUELA · campo de fútbol municipal, con bancada,
   torres de iluminación e o escenario do sorteo da moto
   ========================================================== */
function buildPinguela(B, scene) {
  const cx = -195, cz = 278, PW = 92, PD = 58;
  // céspede con franxas e liñas
  const c = cnv(1024, 660), x = c.getContext('2d'), sx = 1024 / PW, sz = 660 / PD;
  for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#3f7a2c' : '#4a8a33'; x.fillRect(i * 1024 / 14, 0, 1024 / 14 + 1, 660); }
  noiseFill(x, 1024, 660, 0, 14);
  x.strokeStyle = 'rgba(245,245,240,.92)'; x.lineWidth = 5; const m = 1.5;
  x.strokeRect(m * sx, m * sz, (PW - 2 * m) * sx, (PD - 2 * m) * sz);
  x.beginPath(); x.moveTo(512, m * sz); x.lineTo(512, 660 - m * sz); x.stroke();
  x.beginPath(); x.arc(512, 330, 5 * sx, 0, 7); x.stroke();
  for (const s of [0, 1]) { const x0 = s ? (PW - m - 9) * sx : m * sx; x.strokeRect(x0, 330 - 10 * sz, 9 * sx, 20 * sz); const x1 = s ? (PW - m - 3.5) * sx : m * sx; x.strokeRect(x1, 330 - 5 * sz, 3.5 * sx, 10 * sz); }
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PW + 6, PD + 6), std({ map: toTex(c, false), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }));
  pitch.rotation.x = -Math.PI / 2; pitch.position.set(cx, 0.05, cz); pitch.receiveShadow = true; scene.add(pitch);
  // porterías
  for (const s of [-1, 1]) {
    const gx = cx + s * (PW / 2 - 1.5);
    for (const dz of [-3.66, 3.66]) { const p = new THREE.CylinderGeometry(0.06, 0.06, 2.44, 8); xform(p, gx, 1.22, cz + dz); B.white.add(p); }
    const bar = new THREE.CylinderGeometry(0.06, 0.06, 7.32, 8); xform(bar, gx, 2.44, cz, 0, Math.PI / 2, 0); B.white.add(bar);
    const net = boxGeo(1.6, 2.4, 7.3); xform(net, gx + s * 0.85, 1.2, cz);
    const nm = new THREE.Mesh(net, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 1, depthWrite: false })); scene.add(nm);
    addBoxCol(gx - 0.15, cz - 3.8, gx + 0.15 + s * 1.6, cz + 3.8, 2.5, 'porteria');
  }
  const X0 = cx - PW / 2 - 3, X1 = cx + PW / 2 + 3, Z0 = cz - PD / 2 - 3, Z1 = cz + PD / 2 + 3;
  // bancada sur (graderío de formigón con cuberta) mirando ao norte
  const bx0 = cx - 40, bx1 = cx + 40, bz = Z1 + 0.8;
  for (let k = 0; k < 6; k++) { const g = boxGeo(bx1 - bx0, 0.45, 1.0, [3, 3]); xform(g, cx, 0.22 + k * 0.45, bz + k * 0.9); B.concrete.add(g); const st = boxGeo(bx1 - bx0, 0.08, 0.5); xform(st, cx, 0.5 + k * 0.45, bz + k * 0.9 - 0.2); B.vcol.add(colorize(st, k % 2 ? '#b8332f' : '#e9e4d6')); }
  const back = boxGeo(bx1 - bx0, 3.5, 0.4, [3, 3]); xform(back, cx, 1.75, bz + 5.6); B.concrete.add(back);
  const roof = boxGeo(bx1 - bx0 + 1, 0.2, 7, [3, 3]); xform(roof, cx, 6.2, bz + 2.6); B.metalDark.add(roof);
  for (let px = bx0; px <= bx1; px += 13) { const col = new THREE.CylinderGeometry(0.12, 0.12, 6, 8); xform(col, px, 3.1, bz + 5.3); B.metalDark.add(col); }
  addBoxCol(bx0, bz - 0.6, bx1, bz + 6, 4, 'bancada');
  // valado perimetral (malla) e muro baixo, coa entrada ao norte
  const fence = new THREE.MeshStandardMaterial({ color: 0x5d6a5a, transparent: true, opacity: 0.5, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  const F = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), f = new THREE.Mesh(new THREE.PlaneGeometry(L, 2.2), fence); f.position.set((x0 + x1) / 2, 1.1, (z0 + z1) / 2); f.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(f); const w = boxGeo(L, 0.5, 0.25, [3, 3]); xform(w, (x0 + x1) / 2, 0.25, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0)); B.concrete.add(w); };
  F(X0, Z0, cx - 6, Z0); F(cx + 6, Z0, X1, Z0); F(X0, Z0, X0, Z1); F(X1, Z0, X1, Z1);
  addBoxCol(X0 - 0.2, Z0 - 0.2, cx - 6, Z0 + 0.2, 2.2); addBoxCol(cx + 6, Z0 - 0.2, X1 + 0.2, Z0 + 0.2, 2.2); addBoxCol(X0 - 0.2, Z0, X0 + 0.2, Z1, 2.2); addBoxCol(X1 - 0.2, Z0, X1 + 0.2, Z1, 2.2);
  // torres de iluminación
  for (const [tx, tz] of [[X0 + 1, Z0 + 1], [X1 - 1, Z0 + 1], [X0 + 1, Z1 - 1], [X1 - 1, Z1 - 1]]) {
    const p = new THREE.CylinderGeometry(0.22, 0.35, 18, 10); xform(p, tx, 9, tz); B.metalDark.add(p);
    const h = boxGeo(3, 1.6, 0.4); xform(h, tx, 18.4, tz, Math.atan2(cx - tx, cz - tz)); B.metalDark.add(h);
    const lamps = boxGeo(2.8, 1.4, 0.1); xform(lamps, tx + Math.sin(Math.atan2(cx - tx, cz - tz)) * 0.25, 18.4, tz + Math.cos(Math.atan2(cx - tx, cz - tz)) * 0.25, Math.atan2(cx - tx, cz - tz)); B.vcol.add(colorize(lamps, '#fffbe8'));
    G.lamps.push({ x: tx, y: 18, z: tz });
    addCircCol(tx, tz, 0.4, 18);
  }
  // portalón e letreiro
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.3), std({ map: textTex('CAMPO DA PINGUELA', { w: 1024, h: 140, bg: '#1d3a2a', fg: '#f4f0e2', size: 86, border: '#c9b98a' }), roughness: .6 }));
  sign.position.set(cx, 4.1, Z0 - 0.3); sign.rotation.y = Math.PI; scene.add(sign);
  for (const s of [-1, 1]) { const p = boxGeo(0.6, 4.6, 0.6, [3, 3]); xform(p, cx + s * 5, 2.3, Z0 - 0.3); B.concrete.add(p); addCircCol(cx + s * 5, Z0 - 0.3, 0.45, 5); }
  // escenario do sorteo (sobre o céspede, no lado da bancada)
  const sx0 = cx - 6, stz = cz - 10;
  const stg = boxGeo(9, 1.0, 4, [3, 3]); xform(stg, cx - 6, 0.5, stz); B.wood.add(stg);
  addBoxCol(sx0 - 4.5, stz - 2, sx0 + 4.5, stz + 2, 1.0, 'escenario');
  const table = boxGeo(3, 0.08, 1); xform(table, sx0, 1.8, stz + 0.6); B.vcol.add(colorize(table, '#e9e4d6'));
  const drum = new THREE.CylinderGeometry(0.45, 0.45, 0.9, 16, 1, false); xform(drum, sx0 + 0.8, 2.3, stz + 0.6, 0, 0, Math.PI / 2); B.metal.add(drum);
  for (const s of [-1, 1]) { const pole = new THREE.CylinderGeometry(0.06, 0.06, 4, 8); xform(pole, sx0 + s * 4.2, 3, stz - 1.6); B.metalDark.add(pole); }
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.4), std({ map: textTex('GRAN SORTEO · MOTO', { w: 1024, h: 170, bg: '#7a1f3d', fg: '#ffd75e', size: 104, border: '#ffd75e' }), roughness: .7, side: THREE.DoubleSide }));
  ban.position.set(sx0, 4.3, stz - 1.6); scene.add(ban);
  const ban2 = ban.clone(); ban2.rotation.y = Math.PI; ban2.position.z -= 0.02; scene.add(ban2);
  const tongo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), std({ map: textTex('TONGO!', { w: 512, h: 170, bg: '#f4f1e8', fg: '#c0201f', size: 120 }), roughness: .9, side: THREE.DoubleSide }));
  tongo.position.set(cx + 8, 1.7, cz - 3); tongo.rotation.y = 0.4; scene.add(tongo); G.tongoSign = tongo; tongo.visible = false;
  // cordón arredor do sitio da moto
  G.motoSpot = { x: cx + 2, z: stz + 0.5, yaw: Math.PI / 2 };
  for (const [ox, oz] of [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6]]) { const p = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8); xform(p, G.motoSpot.x + ox, 0.45, G.motoSpot.z + oz); B.metal.add(p); }
  G.pinguela = { x: cx, z: cz, gate: { x: cx, z: Z0 - 3 } };
}

/* ==========================================================
   GRAN FONTE DO PARQUE DOS CONDES
   gran vaso circular, surtidor central moi alto, coroa de chorros
   verticais, arcos de auga cara a fóra e iluminación ámbar de noite
   ========================================================== */
function buildGrandFountain(B, scene, cx, cz) {
  const R0 = 11.5;
  // vaso de granito con bordo moldurado
  const rim = new THREE.TorusGeometry(R0, 0.38, 10, 72); xform(rim, cx, 0.62, cz, 0, Math.PI / 2 * 0); rim.rotateX(0);
  const rimG = new THREE.CylinderGeometry(R0 + 0.45, R0 + 0.6, 0.75, 72, 1, true); xform(rimG, cx, 0.37, cz); B.stone.add(rimG);
  const rimIn = new THREE.CylinderGeometry(R0 - 0.35, R0 - 0.35, 0.75, 72, 1, true); rimIn.scale(-1, 1, 1); xform(rimIn, cx, 0.37, cz); B.stone.add(rimIn);
  const cap = new THREE.RingGeometry(R0 - 0.4, R0 + 0.62, 72, 1); cap.rotateX(-Math.PI / 2); xform(cap, cx, 0.76, cz);
  const cuv = cap.attributes.uv, cp = cap.attributes.position; for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cp.getX(i) / 2, cp.getZ(i) / 2); B.stone.add(cap);
  const floor = new THREE.CircleGeometry(R0 - 0.3, 64); floor.rotateX(-Math.PI / 2); xform(floor, cx, 0.06, cz); B.vcol.add(colorize(floor, '#2f4a4c'));
  addCircCol(cx, cz, R0 + 0.6, 1.0, 'fonte', -1);
  // pedestal central en dous chanzos e coroa de boquillas
  const p1 = new THREE.CylinderGeometry(3.6, 3.9, 0.9, 48); xform(p1, cx, 0.45, cz); B.stone.add(p1);
  const p2 = new THREE.CylinderGeometry(2.2, 2.5, 0.6, 40); xform(p2, cx, 1.2, cz); B.stone.add(p2);
  const brass = new THREE.CylinderGeometry(0.4, 0.5, 0.35, 16); xform(brass, cx, 1.65, cz); B.bronze.add(brass);
  // auga
  const water = new THREE.Mesh(new THREE.CircleGeometry(R0 - 0.3, 64), MAT.water); water.rotation.x = -Math.PI / 2; water.position.set(cx, 0.55, cz); scene.add(water);
  // material dos chorros: estrías verticais translúcidas, ámbar de noite
  const c = cnv(64, 256), x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.12, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 256);
  x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(0,0,0,${RR(0.1, 0.5)})`; x.fillRect(R() * 64, 0, RR(1, 4), 256); }
  const jt = toTex(c, false, false); jt.wrapS = THREE.RepeatWrapping;
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xe8f4f8, alphaMap: jt, transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0, emissive: 0xffa531, emissiveIntensity: 0, depthWrite: false, side: THREE.DoubleSide });
  nightMat(jetMat, 0.05, 1.6);
  const jets = [];
  const jet = (x0, z0, h, r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, h, 14, 6, true); g.translate(0, h / 2, 0); const m = new THREE.Mesh(g, jetMat); m.position.set(x0, 0.55, z0); scene.add(m); jets.push({ m, h, ph: R() * 6 }); return m; };
  jet(cx, cz, 13, 0.55, 0.06);                                      // surtidor central
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; jet(cx + Math.cos(a) * 1.4, cz + Math.sin(a) * 1.4, 6.5, 0.28, 0.05); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; jet(cx + Math.cos(a) * 7.6, cz + Math.sin(a) * 7.6, i % 2 ? 4.2 : 6.2, 0.3, 0.05); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; jet(cx + Math.cos(a) * (R0 - 1.2), cz + Math.sin(a) * (R0 - 1.2), 1.8, 0.13, 0.03); }
  // arcos de auga dende o pedestal cara á coroa
  const arcs = [];
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2, r0 = 2.2, r1 = 6.4 + (i % 2) * 0.8, hmax = 3.4 + (i % 3) * 0.5;
    const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, r = lerp(r0, r1, t); pts.push(new THREE.Vector3(Math.cos(a) * r, 1.5 + 4 * hmax * t * (1 - t) - t * 1.0, Math.sin(a) * r)); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.07, 6, false);
    const m = new THREE.Mesh(g, jetMat); m.position.set(cx, 0, cz); scene.add(m); arcs.push(m);
  }
  // escuma na base dos chorros
  const foamC = cnv(64, 64), fx = foamC.getContext('2d'), fg = fx.createRadialGradient(32, 32, 0, 32, 32, 32); fg.addColorStop(0, 'rgba(255,255,255,.9)'); fg.addColorStop(1, 'rgba(255,255,255,0)'); fx.fillStyle = fg; fx.fillRect(0, 0, 64, 64);
  const foamMat = new THREE.MeshBasicMaterial({ map: toTex(foamC, false), transparent: true, depthWrite: false, opacity: 0.7 });
  for (const j of jets) { const f = new THREE.Mesh(new THREE.CircleGeometry(j.h > 5 ? 1.3 : 0.5, 20), foamMat); f.rotation.x = -Math.PI / 2; f.position.set(j.m.position.x, 0.57, j.m.position.z); scene.add(f); }
  // focos submerxidos (visibles de noite)
  const spotMat = nightMat(new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xffb84a, emissiveIntensity: 0 }), 0, 3);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), spotMat); s.position.set(cx + Math.cos(a) * 6.8, 0.5, cz + Math.sin(a) * 6.8); scene.add(s); }
  const light = new THREE.PointLight(0xffa640, 0, 34, 1.6); light.position.set(cx, 5, cz); scene.add(light);
  G.lamps.push({ x: cx, y: 13, z: cz });
  // animación: o surtidor respira, os aneis alternan, spray no cumio
  let sprayT = 0;
  G.anims.push(t => {
    for (let i = 0; i < jets.length; i++) { const j = jets[i]; const k = i === 0 ? 0.92 + 0.08 * Math.sin(t * 0.9) : i < 7 ? 0.85 + 0.15 * Math.sin(t * 2.1 + j.ph) : i < 17 ? 0.7 + 0.3 * Math.max(0, Math.sin(t * 0.8 + (i % 2) * Math.PI)) : 0.85 + 0.15 * Math.sin(t * 5 + j.ph); j.m.scale.y = k; }
    jt.offset.y = -t * 1.6;
    for (let i = 0; i < arcs.length; i++) arcs[i].scale.y = 0.92 + 0.08 * Math.sin(t * 1.5 + i * 0.4);
    light.intensity = G.night * 2.2;
    sprayT -= 0.016; if (sprayT <= 0 && world.smoke && G.started !== undefined) { sprayT = 0.12; const h = 13 * jets[0].m.scale.y; world.smoke.emit(cx + RR(-0.4, 0.4), 0.55 + h, cz + RR(-0.4, 0.4), RR(-0.6, 0.6), RR(-0.6, 0.2), RR(-0.6, 0.6), 0.9, 1.6, G.night > 0.5 ? 0xffd090 : 0xf2f7fa, 0.35); }
  });
}

/* ==========================================================
   COLEXIO PRIVADO FERROVIARIO (Rúa da Coruña)
   muros encalados branco-azulados, esquinais de granito dentados,
   recercados de granito e carpintaría de madeira, frontón escalonado
   co rótulo e o escudo, alpendre de madeira sobre piares de granito
   e alas laterais con pináculos. Fachada local en z = 0 mirando a −z.
   ========================================================== */
function buildFerroviario(B, scene) {
  const WALL = '#e6edf0', GR = '#cdb393', GRD = '#a98e6c', WOOD = '#8a4a22';
  const quoins = (x, P, x0, y0, h, side) => { // esquinais dentados
    for (let y = y0, k = 0; y < y0 + h; y += 0.7, k++) { const w = k % 2 ? 1.0 : 0.6; x.fillStyle = GR; x.fillRect(P.X(side < 0 ? x0 : x0 - w), P.Y(y + 0.66), P.S(w), P.S(0.66)); x.fillStyle = 'rgba(80,60,40,.25)'; x.fillRect(P.X(side < 0 ? x0 : x0 - w), P.Y(y + 0.02), P.S(w), 2); }
  };
  const frame = (x, ex, P, cx, y0, w, h, lit, ears = true) => { // recercado de granito con orellas
    const m = 0.45; x.fillStyle = GR; x.fillRect(P.X(cx - w / 2 - m), P.Y(y0 + h + m), P.S(w + 2 * m), P.S(h + 2 * m));
    if (ears) { x.fillRect(P.X(cx - w / 2 - m - 0.25), P.Y(y0 + h + m), P.S(w + 2 * m + 0.5), P.S(0.5)); x.fillRect(P.X(cx - w / 2 - m - 0.25), P.Y(y0 - m + 0.4), P.S(w + 2 * m + 0.5), P.S(0.4)); }
    x.fillStyle = GRD; x.fillRect(P.X(cx - w / 2 - m - 0.3), P.Y(y0 - m + 0.05), P.S(w + 2 * m + 0.6), P.S(0.18));
    glassRect(x, ex, P, cx - w / 2, y0, w, h, lit, WOOD);
    x.strokeStyle = WOOD; x.lineWidth = P.S(0.09); x.strokeRect(P.X(cx - w / 2), P.Y(y0 + h), P.S(w), P.S(h));
  };
  const wallBase = (x, P, w, h) => { x.fillStyle = WALL; x.fillRect(0, 0, P.W, P.H); noiseFill(x, P.W, P.H, 0, 6); x.fillStyle = GR; x.fillRect(0, P.Y(0.9), P.W, P.S(0.9)); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, P.Y(0.9), P.W, 2); };
  // --- corpo central (16 × 14 m) ---
  const CW = 16, CH = 14, CD = 15;
  const ct = elevTex(CW, CH, 22, (x, P, ex) => {
    wallBase(x, P, CW, CH);
    quoins(x, P, 0, 0.9, CH - 1.6, -1); quoins(x, P, CW, 0.9, CH - 1.6, 1);
    // planta baixa (portal tras o alpendre) e laterais
    frame(x, ex, P, 2.6, 1.6, 1.4, 2.0, R() < 0.5); frame(x, ex, P, CW - 2.6, 1.6, 1.4, 2.0, R() < 0.5);
    x.fillStyle = GR; x.fillRect(P.X(CW / 2 - 1.8), P.Y(3.6), P.S(3.6), P.S(3.6)); x.fillStyle = '#5a2f17'; x.fillRect(P.X(CW / 2 - 1.2), P.Y(3.1), P.S(2.4), P.S(3.1));
    x.fillStyle = '#3a1e0e'; x.fillRect(P.X(CW / 2 - 0.04), P.Y(3.1), P.S(0.08), P.S(3.1));
    // primeiro andar: ventás laterais e tripla central
    frame(x, ex, P, 3.0, 5.6, 1.4, 2.2, R() < 0.5); frame(x, ex, P, CW - 3.0, 5.6, 1.4, 2.2, R() < 0.5);
    x.fillStyle = GR; x.fillRect(P.X(CW / 2 - 3.3), P.Y(8.3), P.S(6.6), P.S(3.0)); x.fillRect(P.X(CW / 2 - 1.0), P.Y(8.8), P.S(2.0), P.S(0.6));
    for (const dx of [-2.1, 0, 2.1]) glassRect(x, ex, P, CW / 2 + dx - 0.75, 5.6, 1.5, 2.3, R() < 0.5, WOOD);
    // frontón escalonado, rótulo e escudo
    x.strokeStyle = GR; x.lineWidth = P.S(0.5); x.lineJoin = 'miter'; x.beginPath();
    x.moveTo(P.X(0.8), P.Y(9.3)); x.lineTo(P.X(3.8), P.Y(9.3)); x.lineTo(P.X(3.8), P.Y(10.6)); x.lineTo(P.X(5.2), P.Y(10.6)); x.quadraticCurveTo(P.X(CW / 2), P.Y(11.6), P.X(CW - 5.2), P.Y(10.6)); x.lineTo(P.X(CW - 3.8), P.Y(10.6)); x.lineTo(P.X(CW - 3.8), P.Y(9.3)); x.lineTo(P.X(CW - 0.8), P.Y(9.3)); x.stroke();
    x.strokeRect(P.X(CW / 2 - 2.2), P.Y(10.8), P.S(4.4), P.S(1.2));
    shield(x, P, CW / 2, 10.2, 0.75, '#c9a440');
    x.fillStyle = '#9a2a24'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 ${Math.round(P.S(0.62))}px "Barlow Condensed", "Arial Narrow", sans-serif`; x.fillText('COLEXIO P. FERROVIARIO', P.X(CW / 2), P.Y(8.85));
    frame(x, ex, P, 2.9, 10.6, 1.5, 1.2, R() < 0.4, false); frame(x, ex, P, CW - 2.9, 10.6, 1.5, 1.2, R() < 0.4, false);
    // ménsulas de madeira baixo o beiril
    x.fillStyle = '#6b3a1c'; for (let px = 0.4; px < CW; px += 0.9) x.fillRect(P.X(px), P.Y(CH), P.S(0.28), P.S(0.45));
  }, { emissive: true, normal: 1.5 });
  const side = std({ color: 0xe2e9ec, roughness: 0.9 });
  elevBox(scene, CW, CH, CD, { nz: elevMat(ct, 0.8) }, 0, 0, CD / 2, 0, side);
  const cr = hipRoof(CW, CD, 3.6, 4, 1.1); xform(cr, 0, CH, CD / 2); B.tile.add(cr);
  addBoxCol(-CW / 2, 0, CW / 2, CD, CH + 4, 'ferroviario');
  // --- alas laterais (9 × 12 m), adiantadas 1,5 m ---
  const WW = 9, WH = 12, WD = 16;
  for (const s of [-1, 1]) {
    const wt = elevTex(WW, WH, 22, (x, P, ex) => {
      wallBase(x, P, WW, WH);
      quoins(x, P, 0, 0.9, WH - 1.2, -1); quoins(x, P, WW, 0.9, WH - 1.2, 1);
      // gran ventá arqueada na planta baixa
      x.fillStyle = GR; archPath(x, P, WW / 2, 1.0, 4.4, 4.6); x.fill();
      x.save(); archPath(x, P, WW / 2, 1.3, 3.6, 4.0); x.clip(); glassRect(x, ex, P, WW / 2 - 1.8, 1.3, 3.6, 4.0, R() < 0.5, WOOD);
      x.strokeStyle = WOOD; x.lineWidth = P.S(0.08); for (const dx of [-0.9, 0.9]) { x.beginPath(); x.moveTo(P.X(WW / 2 + dx), P.Y(1.3)); x.lineTo(P.X(WW / 2 + dx), P.Y(5.3)); x.stroke(); } x.restore();
      // ventá alta con balcón de granito
      x.fillStyle = GR; x.fillRect(P.X(WW / 2 - 2.0), P.Y(7.0), P.S(4.0), P.S(0.5)); x.fillRect(P.X(WW / 2 - 1.6), P.Y(7.4), P.S(0.4), P.S(0.5)); x.fillRect(P.X(WW / 2 + 1.2), P.Y(7.4), P.S(0.4), P.S(0.5));
      frame(x, ex, P, WW / 2, 7.4, 2.0, 2.6, R() < 0.5);
      moulding(x, P, 0, WW, WH - 0.8, 0.5, GR);
    }, { emissive: true, normal: 1.5 });
    const cx = s * (CW / 2 + WW / 2);
    elevBox(scene, WW, WH, WD, { nz: elevMat(wt, 0.8) }, cx, 0, WD / 2 - 1.5, 0, side);
    const wr = hipRoof(WW, WD, 2.8, 4, 0.6); xform(wr, cx, WH, WD / 2 - 1.5); B.tile.add(wr);
    addBoxCol(cx - WW / 2, -1.5, cx + WW / 2, WD - 1.5, WH + 3, 'ferroviario');
    // pináculos de granito nas esquinas dianteiras
    for (const px of [cx - WW / 2 + 0.6, cx + WW / 2 - 0.6]) {
      const base = boxGeo(1.2, 1.2, 1.2, [3, 3]); xform(base, px, WH + 0.6, -0.9); B.stone.add(base);
      const ob = new THREE.ConeGeometry(0.62, 2.4, 4); xform(ob, px, WH + 2.4, -0.9, Math.PI / 4); B.stone.add(ob);
    }
  }
  // --- alpendre: piares de granito, vigas e ménsulas de madeira, tellado de tella ---
  const PW = 7.6, PD = 4.4, PH = 3.9;
  for (const s of [-1, 1]) { const p = boxGeo(0.75, PH, 0.75, [3, 3]); xform(p, s * (PW / 2 - 0.5), PH / 2, -PD + 0.4); B.stone.add(p); const cap = boxGeo(1.0, 0.3, 1.0, [3, 3]); xform(cap, s * (PW / 2 - 0.5), PH + 0.1, -PD + 0.4); B.stone.add(cap); addCircCol(s * (PW / 2 - 0.5), -PD + 0.4, 0.45, PH, 'piar'); }
  const beam = boxGeo(PW + 0.4, 0.45, 0.35); xform(beam, 0, PH + 0.45, -PD + 0.3); B.wood.add(beam);
  for (const s of [-1, 1]) { const sb = boxGeo(0.35, 0.45, PD); xform(sb, s * (PW / 2), PH + 0.45, -PD / 2); B.wood.add(sb); }
  for (let i = 0; i < 9; i++) { const c = boxGeo(0.22, 0.32, 0.6); xform(c, -PW / 2 + 0.3 + i * (PW - 0.6) / 8, PH + 0.1, -PD + 0.05); B.wood.add(c); }
  const ceil = boxGeo(PW + 0.4, 0.1, PD); xform(ceil, 0, PH + 0.68, -PD / 2); B.wood.add(ceil);
  const pr = hipRoof(PW + 0.4, PD + 0.4, 1.0, 4, 0.5); xform(pr, 0, PH + 0.72, -PD / 2); B.tile.add(pr);
  const lantern = new THREE.SphereGeometry(0.18, 10, 8); xform(lantern, 0, PH - 0.3, -PD / 2); B.white.add(lantern); pushLamp({ x: 0, y: PH - 0.3, z: -PD / 2 });
  // --- reixa de ferro diante ---
  const zf = -PD - 0.9, bars = [];
  for (let x0 = -(CW / 2 + WW) + 0.3; x0 < CW / 2 + WW - 0.2; x0 += 0.18) { if (Math.abs(x0) < 1.6) continue; bars.push(x0); }
  const barG = new THREE.CylinderGeometry(0.018, 0.018, 1.5, 5), im = new THREE.InstancedMesh(barG, MAT.metalDark, bars.length), o = new THREE.Object3D();
  bars.forEach((bx, i) => { o.position.set(bx, 0.75, zf); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); scene.add(im);
  for (const y of [0.2, 1.3]) for (const s of [-1, 1]) { const rl = boxGeo(CW / 2 + WW - 1.6, 0.05, 0.05); xform(rl, s * ((CW / 2 + WW + 1.6) / 2), y, zf); B.metalDark.add(rl); }
  for (const s of [-1, 1]) { addBoxCol(s > 0 ? 1.6 : -(CW / 2 + WW), zf - 0.1, s > 0 ? CW / 2 + WW : -1.6, zf + 0.1, 1.5, 'reixa'); const gp = boxGeo(0.3, 1.9, 0.3, [3, 3]); xform(gp, s * 1.6, 0.95, zf); B.stone.add(gp); }
  // pavimento do patio dianteiro
  const pv = new THREE.PlaneGeometry(CW + 2 * WW, -zf); pv.rotateX(-Math.PI / 2); xform(pv, 0, 0.06, zf / 2); { const p = pv.attributes.position, uv = pv.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 3, p.getZ(i) / 3); } B.paving.add(pv);
}

/* ==========================================================
   AUDITORIO E CONSERVATORIO MUNICIPAL MESTRE IBÁÑEZ
   (Ronda María Emilia Casas Baamonde, fronte ao CEIP Plurilingüe)
   corpo de dúas plantas con zócalo de granito e banda de fiestras,
   volume da sala en ton salmón, escalinata gris con varandas granates
   e gran alpendre de vigas granates co rótulo. Fachada en z = 0 mirando a −z.
   ========================================================== */
function buildConservatorio(B, scene) {
  const L = 56, D = 24, H0 = 2.4, MAROON = '#7a2630';
  const maroon = std({ color: new THREE.Color(MAROON), roughness: 0.45, metalness: 0.5 });
  // --- alzado principal ---
  const ft = elevTex(L, 9, 16, (x, P, ex) => {
    x.fillStyle = '#a7a39a'; x.fillRect(0, 0, P.W, P.H); noiseFill(x, P.W, P.H, 0, 8);
    ashlar(x, P, 0, 0, L, H0 + 0.3, [150, 146, 138], 0.55, {});
    // fiestras baixas do semisoto
    for (let i = 0; i < 9; i++) { const cx = 4 + i * 6; if (cx > L - 14) break; glassRect(x, ex, P, cx - 1.1, 0.7, 2.2, 0.9, R() < 0.3, '#f2f2ee'); }
    // banda de fiestras corridas da planta principal
    x.fillStyle = '#d9d6cf'; x.fillRect(P.X(0), P.Y(H0 + 3.3), P.S(L - 12), P.S(3.3));
    for (let cx = 0.6; cx < L - 12.6; cx += 2.4) { glassRect(x, ex, P, cx, H0 + 0.25, 2.2, 2.8, R() < 0.45, '#f4f4f2'); x.fillStyle = '#f4f4f2'; x.fillRect(P.X(cx), P.Y(H0 + 3.05), P.S(2.2), P.S(0.12)); }
    // portas de vidro da entrada
    for (const cx of [L * 0.42, L * 0.42 + 2.6]) { x.fillStyle = '#f4f4f2'; x.fillRect(P.X(cx - 1.1), P.Y(H0 + 2.6), P.S(2.2), P.S(2.6)); glassRect(x, ex, P, cx - 0.95, H0 + 0.05, 0.9, 2.4, true, '#f4f4f2'); glassRect(x, ex, P, cx + 0.05, H0 + 0.05, 0.9, 2.4, true, '#f4f4f2'); }
    // franxa granate baixo a banda e cornixa gris
    x.fillStyle = MAROON; x.fillRect(0, P.Y(H0 + 0.25), P.S(L - 12), P.S(0.25));
    x.fillStyle = '#8f8b84'; x.fillRect(0, P.Y(9), P.W, P.S(0.5));
    // bloque de granito ao extremo dereito, con fiestriñas
    ashlar(x, P, L - 12, 0, 12, 9, [160, 155, 146], 0.5, { long: true });
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) glassRect(x, ex, P, L - 10.5 + k * 3.6, 2.6 + j * 3.2, 1.3, 1.0, R() < 0.3, '#f2f2ee');
  }, { emissive: true, normal: 1.5 });
  const sideT = std({ map: (() => { const t = TEX.stone; return t; })(), color: 0xb9b3a8, roughness: 0.85 });
  elevBox(scene, L, 9, D, { nz: elevMat(ft, 0.7) }, 0, 0, D / 2, 0, sideT);
  addBoxCol(-L / 2, 0, L / 2, D, 12, 'conservatorio');
  // --- volume da sala (salmón) e cheminea ---
  const VW = 34, VD = 16, VH = 7;
  const vt = elevTex(VW, VH, 8, (x, P) => { x.fillStyle = '#d6b39a'; x.fillRect(0, 0, P.W, P.H); noiseFill(x, P.W, P.H, 0, 6); x.strokeStyle = 'rgba(120,80,60,.35)'; x.lineWidth = 2; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(P.X(i * VW / 6), 0); x.lineTo(P.X(i * VW / 6), P.H); x.stroke(); } x.fillStyle = '#9a7a68'; x.fillRect(0, 0, P.W, P.S(0.3)); }, {});
  const vm = elevMat(vt, 0); const vs = std({ color: 0xd6b39a, roughness: 0.9 });
  elevBox(scene, VW, VH, VD, { nz: vm, pz: vm }, 5, 9, D / 2 + 1, 0, vs);
  const ch = boxGeo(1.4, 4.5, 1.4, [3, 3]); xform(ch, 5 - VW / 2 + 4, 9 + VH + 1.6, D / 2 - 6); B.concrete.add(ch);
  // --- terraza elevada e escalinata ---
  const TX0 = -L / 2 + 12.5, TX1 = L / 2 - 4, TD = 4.2, SW = 15, SC = L / 2 - (L * 0.42 + 1.3); // a textura da cara −z vai de +x a −x // centro da escaleira (fronte ás portas)
  const terr = boxGeo(TX1 - TX0, H0, TD, [3, 3]); xform(terr, (TX0 + TX1) / 2, H0 / 2, -TD / 2); B.concrete.add(terr);
  const tTop = boxGeo(TX1 - TX0, 0.06, TD); xform(tTop, (TX0 + TX1) / 2, H0 + 0.03, -TD / 2); B.paving.add(tTop);
  addSWRect(TX0, -TD, TX1, 0, H0);
  const NST = 13, RISE = H0 / NST, TREAD = 0.34, slate = std({ color: 0x5c6670, roughness: 0.6 });
  for (let i = 0; i < NST; i++) {
    const z1 = -TD - i * TREAD - (i >= 7 ? 1.2 : 0), z0 = z1 - TREAD, h = H0 - (i + 1) * RISE + RISE;
    const st = boxGeo(SW, h, TREAD + 0.02); xform(st, SC, h / 2, (z0 + z1) / 2); B.stone.add(st);
    addSWRect(SC - SW / 2, z0, SC + SW / 2, z1, h);
    if (i === 6) { const land = boxGeo(SW, h - RISE * 0.0, 1.2); xform(land, SC, (h) / 2, z0 - 0.6); B.stone.add(land); addSWRect(SC - SW / 2, z0 - 1.2, SC + SW / 2, z0, h - RISE); }
  }
  const zStairs = -TD - NST * TREAD - 1.2;
  // muro lateral da terraza onde non hai escaleira
  for (const [a, b] of [[TX0, SC - SW / 2], [SC + SW / 2, TX1]]) if (b - a > 0.5) { const w = boxGeo(b - a, H0, 0.4, [3, 3]); xform(w, (a + b) / 2, H0 / 2, -TD - 0.2); B.concrete.add(w); addBoxCol(a, -TD - 0.4, b, -TD, H0 + 1.1, 'muro'); }
  // --- varandas granates ---
  const rail = (pts, h = 1.05) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay, az] = pts[i], [bx, by, bz] = pts[i + 1], Lg = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), pitch = Math.atan2(by - ay, Lg);
      for (const yy of [h, h * 0.5]) { const r = boxGeo(0.05, 0.05, Math.hypot(Lg, by - ay)); xform(r, (ax + bx) / 2, (ay + by) / 2 + yy, (az + bz) / 2, yaw, -pitch); B.vcol.add(colorize(r, MAROON)); }
      for (let t = 0; t <= 1.001; t += 1 / Math.max(1, Math.round(Lg / 1.6))) { const p = boxGeo(0.06, h, 0.06); xform(p, lerp(ax, bx, t), lerp(ay, by, t) + h / 2, lerp(az, bz, t)); B.vcol.add(colorize(p, MAROON)); }
    }
  };
  rail([[TX0, H0, -TD + 0.15], [SC - SW / 2, H0, -TD + 0.15]]); rail([[SC + SW / 2, H0, -TD + 0.15], [TX1, H0, -TD + 0.15]]);
  for (const sx of [SC - SW / 2 + 0.2, SC + SW / 2 - 0.2, SC]) rail([[sx, H0, -TD], [sx, 0, zStairs]], sx === SC ? 0.95 : 1.05);
  rail([[TX1, H0, -TD + 0.15], [TX1, H0, -0.2]]);
  // --- gran alpendre: piares redondos granates, vigas, lamas e rótulo ---
  const CX0 = SC - 13, CX1 = SC + 13, CZ0 = -TD - 3.4, CY = H0 + 4.4;
  for (const cx of [CX0 + 0.4, SC - 4.6, SC + 4.6, CX1 - 0.4]) { const base = cx === CX0 + 0.4 || cx === CX1 - 0.4 ? 0 : H0; const col = new THREE.CylinderGeometry(0.22, 0.22, CY - base, 12); xform(col, cx, base + (CY - base) / 2, CZ0 + 0.3); B.vcol.add(colorize(col, MAROON)); addCircCol(cx, CZ0 + 0.3, 0.3, CY, 'piar'); }
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(CX1 - CX0, 1.0, 0.3), maroon); fascia.position.set(SC, CY + 0.5, CZ0); fascia.castShadow = true; scene.add(fascia);
  const lc = cnv(2048, 80), lx = lc.getContext('2d'); lx.fillStyle = MAROON; lx.fillRect(0, 0, 2048, 80); lx.fillStyle = '#f4efe4'; lx.textAlign = 'center'; lx.textBaseline = 'middle'; lx.font = '600 54px "Times New Roman", Georgia, serif'; lx.fillText('CONSERVATORIO  MPAL.  MESTRE  IBAÑEZ', 1024, 44);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(CX1 - CX0 - 0.4, 0.9), std({ map: toTex(lc, false), roughness: 0.6 })); label.position.set(SC, CY + 0.5, CZ0 - 0.16); label.rotation.y = Math.PI; scene.add(label);
  for (const s of [-1, 1]) { const sb = boxGeo(0.3, 0.9, -CZ0 + 0.3); xform(sb, s > 0 ? CX1 : CX0, CY + 0.45, CZ0 / 2); B.vcol.add(colorize(sb, MAROON)); }
  for (let z = CZ0 + 0.6; z < -0.2; z += 1.1) { const sl = boxGeo(CX1 - CX0, 0.12, 0.45); xform(sl, SC, CY + 0.12, z); B.vcol.add(colorize(sl, z % 2.2 < 1.1 ? '#f2efe8' : MAROON)); }
  const roof = boxGeo(CX1 - CX0 + 0.3, 0.18, -CZ0 + 0.4); xform(roof, SC, CY + 1.05, CZ0 / 2); B.flat.add(roof);
  for (let i = 0; i < 4; i++) { const lp = new THREE.SphereGeometry(0.14, 8, 6); xform(lp, SC - 6 + i * 4, CY - 0.05, CZ0 / 2); B.white.add(lp); pushLamp({ x: SC - 6 + i * 4, y: CY - 0.2, z: CZ0 / 2 }); }
  // pavimento diante e sinal de accesibilidade
  const pv = new THREE.PlaneGeometry(L + 4, -zStairs + 2); pv.rotateX(-Math.PI / 2); xform(pv, 0, 0.07, (zStairs - 2) / 2); { const p = pv.attributes.position, uv = pv.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 3, p.getZ(i) / 3); } B.paving.add(pv);
  const sp = boxGeo(0.07, 2.4, 0.07); xform(sp, SC - SW / 2 - 2.5, 1.2, zStairs + 0.5); B.metalDark.add(sp);
  const ac = cnv(64, 64), ax = ac.getContext('2d'); ax.fillStyle = '#1f5fbf'; ax.fillRect(0, 0, 64, 64); ax.strokeStyle = '#fff'; ax.lineWidth = 5; ax.beginPath(); ax.arc(30, 40, 13, 0.3, 5.5); ax.stroke(); ax.fillStyle = '#fff'; ax.beginPath(); ax.arc(32, 12, 5, 0, 7); ax.fill(); ax.fillRect(29, 18, 6, 18); ax.fillRect(29, 32, 18, 5);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), std({ map: toTex(ac, false) })); sg.position.set(SC - SW / 2 - 2.5, 2.1, zStairs + 0.46); sg.rotation.y = Math.PI; scene.add(sg);
  G.conservatorio = { stairs: zStairs };
}
