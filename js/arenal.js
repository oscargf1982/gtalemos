'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Rúa de Concepción Arenal (dende a Praza
   da Estación ata a Rúa do Doutor Casares), refeita a partir
   das fotos de rúa: A Fraternal (antigo cine), o Café Bar
   Lemos, a loxa de Loterías, galerías, solares e o vello
   concesionario de automóbiles.
   ========================================================== */
// eixo da rúa: s = metros dende a praza (cara ao oeste), z > 0 = man dereita (norte)
const ARENAL = { A: [732, -624], B: [488, -631], fl: 6.3, D: 12 };

function arenalLandmarks() {
  const [ax, az] = ARENAL.A, [bx, bz] = ARENAL.B, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
  // marco local: x ao longo da rúa (ux,uz), z cara ao norte
  const F = LM.arenal = makeFrame(ax, az, Math.atan2(-uz, ux));
  ARENAL.L = L;
  // libera as dúas beiras para os edificios novos (nin OSM nin fachadas xenéricas)
  for (const sg of [-1, 1]) {
    const z0 = sg * (ARENAL.fl - 0.4), z1 = sg * (ARENAL.fl + 22);
    const P = frameRectPoly(F, 4, Math.min(z0, z1), L - 6, Math.max(z0, z1));
    reserve(P); (G.noTrees = G.noTrees || []).push(P);
  }
}

/* ---------- pintor de fachadas ---------- */
const AR_PX = 34;
function arCanvas(W, H) {
  const px = Math.min(AR_PX, 1024 / W), c = cnv(Math.round(W * px), Math.round(H * px)), e = cnv(c.width, c.height);
  const x = c.getContext('2d'), ex = e.getContext('2d'); ex.fillStyle = '#000'; ex.fillRect(0, 0, e.width, e.height);
  // coordenadas en metros: u dende a esquerda, y dende o chan
  const X = u => u * px, Y = y => c.height - y * px, S = m => m * px;
  const P = {
    c, e, x, ex, W, H, X, Y, S,
    rect(u, y, w, h, col) { x.fillStyle = col; x.fillRect(X(u), Y(y + h), S(w), S(h)); },
    noise(n = 900, a = 0.08) { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${RR(0.02, a)})`; x.fillRect(R() * c.width, R() * c.height, RR(1, 4), RR(1, 4)); } },
    // manchas de humidade e escorrentías (fachadas vellas)
    stains(k = 1) {
      for (let i = 0; i < 14 * k; i++) { const u = R() * W, w = RR(0.3, 1.6); const g = x.createLinearGradient(0, Y(H), 0, Y(RR(1, H * 0.7))); g.addColorStop(0, 'rgba(40,40,30,.28)'); g.addColorStop(1, 'rgba(40,40,30,0)'); x.fillStyle = g; x.fillRect(X(u), Y(H), S(w), S(H)); }
      for (let i = 0; i < 6 * k; i++) { x.fillStyle = `rgba(60,60,45,${RR(0.08, 0.2)})`; x.beginPath(); x.ellipse(X(R() * W), Y(RR(0, 1.2)), S(RR(0.6, 2)), S(RR(0.3, 0.8)), 0, 0, 7); x.fill(); }
    },
    ashlar(u, y, w, h, base = [178, 172, 160], big = false) {
      const bh = big ? 0.5 : 0.35; let row = 0;
      for (let yy = y; yy < y + h - 0.01; yy += bh, row++) {
        let uu = u - (row % 2 ? (big ? 0.45 : 0.3) : 0);
        while (uu < u + w) { const bw = RR(big ? 0.7 : 0.5, big ? 1.2 : 0.9), v = RR(-14, 14); x.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v})`; const a = Math.max(uu, u), b = Math.min(uu + bw, u + w); x.fillRect(X(a), Y(Math.min(yy + bh, y + h)), S(b - a) - 1, S(Math.min(bh, y + h - yy)) - 1); uu += bw; }
      }
    },
    brick(u, y, w, h, base = [150, 70, 48]) { for (let yy = y, r = 0; yy < y + h; yy += 0.09, r++) for (let uu = u - (r % 2) * 0.12; uu < u + w; uu += 0.24) { const v = RR(-18, 18); x.fillStyle = `rgb(${base[0] + v},${base[1] + v * 0.6},${base[2] + v * 0.5})`; x.fillRect(X(Math.max(u, uu)), Y(yy + 0.08), S(Math.min(0.22, u + w - uu)), S(0.075)); } },
    // fiestra: vidro, marco, persiana/contraventás e luz de noite
    win(u, y, w, h, o = {}) {
      const fr = o.frame || '#f2f0ea';
      x.fillStyle = fr; x.fillRect(X(u - 0.07), Y(y + h + 0.07), S(w + 0.14), S(h + 0.14));
      const g = x.createLinearGradient(0, Y(y + h), 0, Y(y)); g.addColorStop(0, o.dark ? '#1c2228' : '#3b4c5c'); g.addColorStop(1, '#1d262e'); x.fillStyle = g; x.fillRect(X(u), Y(y + h), S(w), S(h));
      x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(X(u + w * 0.08), Y(y + h * 0.95), S(w * 0.18), S(h * 0.85));
      x.fillStyle = fr; x.fillRect(X(u + w / 2 - 0.03), Y(y + h), S(0.06), S(h)); if (h > 1.2) x.fillRect(X(u), Y(y + h * 0.62), S(w), S(0.05));
      if (o.blind !== undefined) { x.fillStyle = o.blindCol || '#d9d4c8'; x.fillRect(X(u), Y(y + h), S(w), S(h * o.blind)); x.fillStyle = 'rgba(0,0,0,.12)'; for (let k = 0; k < h * o.blind; k += 0.08) x.fillRect(X(u), Y(y + h - k), S(w), 1); }
      if (o.shutters) { x.fillStyle = o.shutters; for (const s of [-1, 1]) { const su = s < 0 ? u - w / 2 - 0.05 : u + w + 0.05; x.fillRect(X(su), Y(y + h), S(w / 2), S(h)); x.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0.1; k < h; k += 0.15) x.fillRect(X(su), Y(y + h - k), S(w / 2), 1); x.fillStyle = o.shutters; } }
      if (o.grille) { x.strokeStyle = '#1b1b1d'; x.lineWidth = 2; for (let k = 0.12; k < w; k += 0.14) { x.beginPath(); x.moveTo(X(u + k), Y(y + h)); x.lineTo(X(u + k), Y(y)); x.stroke(); } }
      if (o.sill !== false) { x.fillStyle = o.sillCol || '#cfcac0'; x.fillRect(X(u - 0.12), Y(y), S(w + 0.24), S(0.08)); }
      if (!o.dark && R() < (o.lit ?? 0.45)) { const gg = ex.createLinearGradient(0, Y(y + h), 0, Y(y)); gg.addColorStop(0, '#ffcf8a'); gg.addColorStop(1, '#d99a4a'); ex.fillStyle = gg; ex.fillRect(X(u), Y(y + h * (1 - (o.blind || 0))), S(w), S(h * (1 - (o.blind || 0)))); }
    },
    door(u, w, h, col = '#5a3a24', o = {}) {
      x.fillStyle = o.frame || '#d8d2c4'; x.fillRect(X(u - 0.12), Y(h + 0.12), S(w + 0.24), S(h + 0.12));
      x.fillStyle = col; x.fillRect(X(u), Y(h), S(w), S(h));
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2;
      for (const k of o.panels ? [0.2, 0.55] : []) x.strokeRect(X(u + w * 0.12), Y(h * (k + 0.35)), S(w * 0.76), S(h * 0.3));
      if (o.split) { x.beginPath(); x.moveTo(X(u + w / 2), Y(h)); x.lineTo(X(u + w / 2), Y(0)); x.stroke(); }
      if (o.arch) { x.fillStyle = o.frame || '#d8d2c4'; x.beginPath(); x.arc(X(u + w / 2), Y(h), S(w / 2 + 0.12), Math.PI, 0); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(X(u + w / 2), Y(h), S(w / 2), Math.PI, 0); x.fill(); }
      x.fillStyle = '#c9b06a'; x.fillRect(X(u + w * 0.8), Y(h * 0.5), 3, 3);
    },
    garage(u, w, h, col = '#3a3d40') { x.fillStyle = '#8f8a80'; x.fillRect(X(u - 0.15), Y(h + 0.15), S(w + 0.3), S(h + 0.15)); x.fillStyle = col; x.fillRect(X(u), Y(h), S(w), S(h)); x.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < w; k += 0.55) x.fillRect(X(u + k), Y(h), 2, S(h)); for (let k = 0.4; k < h; k += 0.9) x.fillRect(X(u), Y(k), S(w), 2); },
    shutter(u, w, h, col = '#9a9ea3') { x.fillStyle = col; x.fillRect(X(u), Y(h), S(w), S(h)); x.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < h; k += 0.1) x.fillRect(X(u), Y(h - k), S(w), 1); x.fillStyle = '#5c5f63'; x.fillRect(X(u - 0.05), Y(h + 0.35), S(w + 0.1), S(0.35)); },
    shop(u, w, h, frame = '#2a2d31', o = {}) {
      x.fillStyle = frame; x.fillRect(X(u), Y(h), S(w), S(h));
      const n = Math.max(1, Math.round(w / 1.6)), pw = (w - 0.3) / n;
      for (let i = 0; i < n; i++) { const g = x.createLinearGradient(0, Y(h - 0.15), 0, Y(0.4)); g.addColorStop(0, '#41556a'); g.addColorStop(1, '#1f2a33'); x.fillStyle = g; x.fillRect(X(u + 0.15 + i * pw + 0.06), Y(h - 0.15), S(pw - 0.12), S(h - 0.55)); if (o.lit !== false) { ex.fillStyle = o.glow || '#f2e2b8'; ex.fillRect(X(u + 0.15 + i * pw + 0.06), Y(h - 0.15), S(pw - 0.12), S(h - 0.55)); } }
      x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < n; i++) x.fillRect(X(u + 0.3 + i * pw), Y(h - 0.3), S(0.25), S(h - 0.9));
    },
    sign(u, y, w, h, text, bg, fg, o = {}) {
      x.fillStyle = bg; x.fillRect(X(u), Y(y + h), S(w), S(h));
      if (o.border) { x.strokeStyle = o.border; x.lineWidth = 3; x.strokeRect(X(u) + 2, Y(y + h) + 2, S(w) - 4, S(h) - 4); }
      x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      let fs = S(h) * 0.62; x.font = `${o.weight || 800} ${fs}px ${o.font || '"Big Shoulders Display", Barlow, sans-serif'}`;
      while (x.measureText(text).width > S(w) * 0.92 && fs > 6) { fs -= 1; x.font = `${o.weight || 800} ${fs}px ${o.font || '"Big Shoulders Display", Barlow, sans-serif'}`; }
      x.fillText(text, X(u + w / 2), Y(y + h / 2));
      if (o.glow) { ex.fillStyle = o.glow; ex.font = x.font; ex.textAlign = 'center'; ex.textBaseline = 'middle'; ex.fillText(text, X(u + w / 2), Y(y + h / 2)); }
    },
    cornice(y, h = 0.3, col = '#e8e4da') { x.fillStyle = col; x.fillRect(0, Y(y + h), c.width, S(h)); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, Y(y), c.width, 2); },
    pilaster(u, w, col) { x.fillStyle = col; x.fillRect(X(u), 0, S(w), c.height); },
  };
  return P;
}
function arTex(P) { const t = toTex(P.c, false), e = toTex(P.e, false); return { t, e }; }

/* ---------- pezas 3D: balcóns, galerías, rótulos ---------- */
const AR_MAT = {};
function railTex() {
  if (AR_MAT.rail) return AR_MAT.rail;
  const c = cnv(128, 64), x = c.getContext('2d'); x.clearRect(0, 0, 128, 64); x.fillStyle = '#16171a';
  x.fillRect(0, 0, 128, 5); x.fillRect(0, 58, 128, 6); for (let i = 0; i < 128; i += 10) x.fillRect(i, 0, 3, 64);
  x.strokeStyle = '#16171a'; x.lineWidth = 2; for (let i = 0; i < 128; i += 20) { x.beginPath(); x.arc(i + 10, 32, 7, 0, 7); x.stroke(); }
  const t = toTex(c); return (AR_MAT.rail = t);
}
function galleryTex(cols = 4, rows = 3) {
  const c = cnv(256, 256), x = c.getContext('2d');
  x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, 256, 256);
  const bx = 10, by = 10, bw = 236, bh = 236;
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#5d7486'); g.addColorStop(1, '#2a3540'); x.fillStyle = g; x.fillRect(bx, by, bw, bh);
  x.fillStyle = '#f4f2ec'; for (let i = 0; i <= cols; i++) x.fillRect(bx + i * bw / cols - 3, by, 6, bh); for (let j = 0; j <= rows; j++) x.fillRect(bx, by + j * bh / rows - 2, bw, 4);
  x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < cols; i++) x.fillRect(bx + i * bw / cols + 8, by + 6, 10, bh - 12);
  x.fillStyle = '#f4f2ec'; x.fillRect(0, 196, 256, 60); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 256; i += 32) x.fillRect(i, 200, 2, 56);
  return toTex(c);
}
function arBuild(B, g, b, side, y0) {
  // b: { s0, s1, H, D, front: {t,e}, wall, roof, balconies:[{u,w,y}], galleries:[{u,w,y,h}], extras(fn) }
  const W = b.s1 - b.s0, sg = side, fl = b.fl ?? ARENAL.fl, D = b.D || ARENAL.D, cx = (b.s0 + b.s1) / 2, zf = sg * fl, zc = sg * (fl + D / 2);
  const X = u => sg > 0 ? cx + W / 2 - u : cx - W / 2 + u; // u da fachada → x local
  // volume
  const box = boxGeo(W, b.H + 2, D, [Math.round(W / 4), Math.round(b.H / 3)]); xform(box, cx, y0 + b.H / 2 - 1, zc); B.vcol.add(colorize(box, b.wall || '#d8d2c4'));
  addBoxCol(b.s0, Math.min(zf, sg * (fl + D)), b.s1, Math.max(zf, sg * (fl + D)), b.H + 1, 'edificio');
  // fachada
  const mat = nightMat(std({ map: b.front.t, emissiveMap: b.front.e, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 }), 0, 1.0);
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(W, b.H), mat); fp.position.set(cx, y0 + b.H / 2, zf - sg * 0.02); fp.rotation.y = sg > 0 ? Math.PI : 0; fp.receiveShadow = true; g.add(fp);
  // tellado
  if (b.roof === 'flat') { const r = boxGeo(W + 0.3, 0.4, D + 0.3); xform(r, cx, y0 + b.H + 0.2, zc); B.flat.add(r); const p = boxGeo(W, 0.6, 0.15); xform(p, cx, y0 + b.H + 0.3, zf); B.vcol.add(colorize(p, b.wall || '#d8d2c4')); }
  else if (b.roof !== 'none') { const r = hipRoof(W, D, b.roofH || 2.4, 4, 0.5); xform(r, cx, y0 + b.H, zc); (b.roof === 'slate' ? B.slate : B.tile).add(r); }
  // balcóns de forxa
  const railM = std({ map: railTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 });
  for (const bl of b.balconies || []) {
    const d = bl.d || 0.75, lx = X(bl.u + bl.w / 2);
    const slab = boxGeo(bl.w + 0.2, 0.14, d); xform(slab, lx, y0 + bl.y, sg * (fl - d / 2)); B.vcol.add(colorize(slab, bl.col || '#cfcac0'));
    const t = railTex().clone(); t.needsUpdate = true; t.repeat.set(bl.w / 1.2, 1); const m2 = railM.clone(); m2.map = t;
    const rf = new THREE.Mesh(new THREE.PlaneGeometry(bl.w + 0.2, 1.0), m2); rf.position.set(lx, y0 + bl.y + 0.55, sg * (fl - d)); g.add(rf);
    for (const s of [-1, 1]) { const rs = new THREE.Mesh(new THREE.PlaneGeometry(d, 1.0), railM); rs.position.set(lx + s * (bl.w / 2 + 0.1), y0 + bl.y + 0.55, sg * (fl - d / 2)); rs.rotation.y = Math.PI / 2; g.add(rs); }
  }
  // galerías acristaladas (brancas, típicas)
  for (const gl of b.galleries || []) {
    const d = gl.d || 0.9, lx = X(gl.u + gl.w / 2), gt = galleryTex(Math.max(2, Math.round(gl.w / 0.9)), 3);
    const gm = nightMat(std({ map: gt, emissiveMap: gt, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.4 }), 0, 0.25);
    const side2 = std({ map: galleryTex(1, 3), roughness: 0.4 });
    const mats = [side2, side2, std({ color: 0xf4f2ec }), std({ color: 0xf4f2ec }), sg > 0 ? side2 : gm, sg > 0 ? gm : side2];
    const m = new THREE.Mesh(new THREE.BoxGeometry(gl.w, gl.h, d), mats); m.position.set(lx, y0 + gl.y + gl.h / 2, sg * (fl - d / 2)); m.castShadow = true; g.add(m);
    const cap = boxGeo(gl.w + 0.2, 0.15, d + 0.15); xform(cap, lx, y0 + gl.y + gl.h + 0.07, sg * (fl - d / 2)); B.vcol.add(colorize(cap, '#f4f2ec'));
  }
  if (b.extras) b.extras({ X, sg, fl, y0, cx, W, g, B });
}

/* ---------- catálogo de edificios ---------- */
function arPlan() {
  // dereita (norte, números impares): dende a praza
  const Rt = [], Lf = [];
  // nº 45: casa amarela de dúas plantas, zócalo azul e portalón de garaxe
  Rt.push({ s0: 8, s1: 19, H: 7.2, wall: '#e4cf86', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#e8d48c'); P.noise(); P.stains(0.6); P.rect(0, 0, P.W, 1.35, '#3f7fc8'); P.cornice(P.H - 0.35, 0.35, '#efe4b8');
    P.garage(0.6, 4.4, 3.3, '#3e4246'); P.door(5.6, 1.1, 2.4, '#7a7f84', { frame: '#cfc6a8', panels: true }); P.win(7.6, 1.2, 1.2, 1.4, { grille: true, frame: '#e9e1c4' }); P.win(9.4, 1.2, 1.1, 1.4, { grille: true });
    for (const u of [1.0, 4.4, 7.8]) P.win(u, 4.1, 1.2, 1.9, { blind: 0.35 });
  }, balconies: [{ u: 0.6, w: 10, y: 3.85, d: 0.7 }] });
  // A FRATERNAL: o emblemático edificio do antigo cine
  Rt.push({ s0: 19, s1: 37, H: 12.4, wall: '#5c7fb0', roof: 'flat', paint(P) {
    P.rect(0, 0, P.W, P.H, '#5a7dae'); P.noise(1200, 0.06); P.stains(0.5);
    for (const u of [0, 5.7, 11.7, 17.4]) P.pilaster(u, 0.6, '#f0ede4');
    P.cornice(4.6, 0.4, '#f0ede4'); P.cornice(P.H - 1.3, 0.35, '#f0ede4'); P.rect(0, P.H - 0.35, P.W, 0.35, '#f0ede4');
    // planta baixa: tenda verde, gran portada do cine e comercio
    P.shop(0.7, 4.8, 3.6, '#2f7a3a'); P.sign(0.7, 3.65, 4.8, 0.7, 'FROITERÍA', '#3d9a3d', '#ffffff');
    P.rect(6.6, 0, 4.9, 4.2, '#efe9da'); P.door(7.0, 4.1, 3.4, '#6b3a24', { frame: '#efe9da', split: true, panels: true });
    P.sign(6.4, 4.0, 5.4, 0.6, 'LA FRATERNAL', '#1b2a44', '#f2c21b', { glow: '#f2c21b' });
    P.shop(12.4, 4.8, 3.6, '#2a2d31'); P.sign(12.4, 3.65, 4.8, 0.7, 'BAZAR', '#c8202a', '#ffffff');
    for (const u of [1.2, 3.6, 7.0, 9.4, 12.8, 15.2]) { P.win(u, 5.4, 1.2, 2.0, { blind: 0.2 }); P.win(u, 8.2, 1.2, 1.8, { blind: 0.4 }); }
    // remate co nome
    P.rect(6.2, P.H - 1.25, 5.6, 1.25, '#f0ede4'); P.sign(6.4, P.H - 1.15, 5.2, 0.9, 'LA FRATERNAL', '#f0ede4', '#1b2a44', { weight: 900 });
  }, galleries: [{ u: 0.8, w: 16.4, y: 5.1, h: 2.6, d: 0.85 }],
    extras({ X, sg, fl, y0, g }) {
      // marquesiña do antigo cine sobre a porta
      const m = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.25, 1.4), std({ color: 0x1b2a44, roughness: 0.5 })); m.position.set(X(9.05), y0 + 4.55, sg * (fl - 0.7)); g.add(m);
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.25), nightMat(std({ color: 0xf2c21b, emissive: 0xf2c21b, emissiveIntensity: 0.2 }), 0.2, 1.5)); strip.position.set(X(9.05), y0 + 4.55, sg * (fl - 1.41)); strip.rotation.y = sg > 0 ? Math.PI : 0; g.add(strip);
    } });
  // Café Bar Lemos: casa vella ocre desconchada, ladrillo á vista e rótulo vertical
  Rt.push({ s0: 37, s1: 47, H: 8.6, wall: '#cfae6a', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#d6b46c'); P.noise(1600, 0.1); P.stains(1.4);
    P.ashlar(0, 0, P.W, 1.0, [150, 140, 120]);
    for (const [u, w] of [[2.2, 2.6], [6.4, 2.6]]) P.brick(u - 0.4, 4.2, w + 0.8, 3.0);
    for (let i = 0; i < 8; i++) { P.x.fillStyle = 'rgba(190,170,130,.9)'; P.x.beginPath(); P.x.ellipse(P.X(R() * P.W), P.Y(RR(2, 7)), P.S(RR(0.3, 0.9)), P.S(RR(0.2, 0.5)), R(), 0, 7); P.x.fill(); }
    P.door(0.6, 1.4, 2.6, '#6a4a2c', { panels: true }); P.door(3.0, 2.4, 2.9, '#7a5634', { split: true }); P.win(6.4, 0.9, 2.6, 2.0, { grille: true, frame: '#7a5634', dark: true });
    P.x.fillStyle = 'rgba(30,30,30,.7)'; P.x.font = `700 ${P.S(0.4)}px sans-serif`; P.x.fillText('DSS', P.X(7.4), P.Y(0.6));
    P.win(2.4, 4.6, 2.2, 2.1, { shutters: '#8a6a44', blind: 0.5 }); P.win(6.6, 4.6, 2.2, 2.1, { shutters: '#8a6a44', blind: 0.2 });
  }, balconies: [{ u: 2.0, w: 3.0, y: 4.35, d: 0.6 }],
    extras({ X, sg, fl, y0, g }) {
      const c = cnv(128, 384), x = c.getContext('2d'); x.fillStyle = '#f2c21b'; x.fillRect(0, 0, 128, 384); x.strokeStyle = '#1d4fd8'; x.lineWidth = 8; x.strokeRect(4, 4, 120, 376);
      x.fillStyle = '#1d4fd8'; x.font = '900 46px "Big Shoulders Display", sans-serif'; x.textAlign = 'center'; 'LEMOS'.split('').forEach((ch, i) => x.fillText(ch, 64, 56 + i * 44));
      x.fillStyle = '#1d4fd8'; x.fillRect(10, 280, 108, 94); x.fillStyle = '#ffffff'; x.font = '800 30px Barlow, sans-serif'; x.fillText('CAFÉ', 64, 318); x.fillText('BAR', 64, 356);
      const t = toTex(c, false), m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.65), nightMat(std({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0, side: THREE.DoubleSide }), 0, 0.8));
      m.position.set(X(9.0), y0 + 5.6, sg * (fl - 0.45)); m.rotation.y = Math.PI / 2; g.add(m);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.6), std({ color: 0x222222 })); arm.position.set(X(9.0), y0 + 6.5, sg * (fl - 0.3)); g.add(arm);
    } });
  // rosa alto con galerías corridas en todas as plantas
  Rt.push({ s0: 47, s1: 61, H: 16.2, wall: '#e6c9c6', roof: 'flat', paint(P) {
    P.rect(0, 0, P.W, P.H, '#e8cbc8'); P.noise(); P.stains(0.4);
    P.rect(0, 0, P.W, 3.8, '#c9c4ba'); P.shop(0.5, 5.5, 3.3, '#3a3d42'); P.door(6.6, 1.3, 2.6, '#3a3d42', { frame: '#c9c4ba' }); P.garage(8.5, 4.6, 3.0, '#8a8e93');
    for (let f = 0; f < 4; f++) for (const u of [0.6, 12.2]) P.win(u, 4.6 + f * 2.9, 1.0, 1.7, { blind: 0.3 });
  }, galleries: [0, 1, 2, 3].map(f => ({ u: 2.0, w: 9.8, y: 4.2 + f * 2.9, h: 2.5, d: 0.85 })) });
  // branco de catro plantas con galerías
  Rt.push({ s0: 61, s1: 74, H: 13.2, wall: '#efede6', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#efece4'); P.noise(); P.stains(0.6); P.rect(0, 0, P.W, 1.0, '#bdb7aa');
    P.shutter(0.6, 4.4, 3.0); P.door(5.6, 1.3, 2.6, '#4a3a2a', { panels: true }); P.shop(7.6, 4.8, 3.2, '#5a3a2a');
    for (let f = 0; f < 3; f++) P.win(0.8, 4.6 + f * 2.9, 1.1, 1.7, { blind: 0.4 });
  }, galleries: [0, 1, 2].map(f => ({ u: 2.4, w: 9.8, y: 4.3 + f * 2.9, h: 2.5, d: 0.8 })) });

  // esquerda (sur, números pares)
  // bloque longo verde auga sobre zócalo de granito, balcóns de forxa
  Lf.push({ s0: 7, s1: 38, H: 13.0, wall: '#cfe2cf', roof: 'slate', paint(P) {
    P.rect(0, 0, P.W, P.H, '#d2e5d2'); P.noise(1500); P.stains(0.4); P.ashlar(0, 0, P.W, 1.3, [176, 166, 150], true); P.cornice(P.H - 0.4, 0.4, '#eef2ec'); P.cornice(3.9, 0.25, '#eef2ec');
    for (let u = 1.2; u < P.W - 1.5; u += 2.8) { P.win(u, 1.4, 1.5, 1.9, { grille: true, frame: '#1b1b1d', dark: R() < 0.5 }); for (let f = 0; f < 3; f++) P.win(u + 0.2, 4.4 + f * 2.8, 1.1, 2.0, { blind: RR(0.1, 0.6) }); }
    P.door(14.6, 1.6, 2.8, '#2a2a2c', { frame: '#b9b2a2', panels: true });
  }, balconies: (() => { const a = []; for (let f = 0; f < 3; f++) for (let u = 1.0; u < 29; u += 5.6) a.push({ u, w: 1.6 + (f === 0 ? 2.8 : 0), y: 4.3 + f * 2.8, d: 0.6 }); return a; })() });
  // Loterías e Apostas: escaparate azul baixo un edificio de pedra gris
  Lf.push({ s0: 38, s1: 50, H: 14.4, wall: '#b8b4ac', roof: 'flat', paint(P) {
    P.rect(0, 0, P.W, P.H, '#bdb9b0'); P.ashlar(0, 3.9, P.W, P.H - 3.9, [184, 180, 172], true); P.noise(900, 0.05);
    P.rect(0, 0, 9.6, 3.9, '#1f4fb8'); P.shop(0.3, 9.0, 3.0, '#1f4fb8', { glow: '#cfe4ff' });
    P.sign(0.2, 3.0, 9.2, 0.85, 'LOTERÍAS Y APUESTAS DEL ESTADO', '#f4f4f0', '#1f4fb8', { glow: '#1f4fb8' });
    P.rect(1.0, 0.95, 1.1, 0.75, '#f4f4f0'); P.x.fillStyle = '#1f4fb8'; P.x.font = `800 ${P.S(0.35)}px Barlow`; P.x.fillText('48', P.X(1.55), P.Y(1.32));
    P.door(10.1, 1.4, 2.7, '#2a2a2c', { frame: '#8f8a80' });
    for (let f = 0; f < 3; f++) for (const u of [0.8, 3.6, 6.4, 9.2]) P.win(u, 4.6 + f * 3.0, 1.6, 1.9, { frame: '#2a5fc8', blind: 0.25 });
  }, balconies: [0, 1, 2].map(f => ({ u: 3.3, w: 4.6, y: 4.3 + f * 3.0, d: 0.55, col: '#a9a59c' })) });
  // casa de dúas plantas, alta revestida de chapa vermella
  Lf.push({ s0: 50, s1: 59, H: 6.8, wall: '#e9e6de', roof: 'flat', paint(P) {
    P.rect(0, 0, P.W, P.H, '#ecebe6'); P.noise(); P.stains(0.8);
    P.rect(0, 3.6, P.W, P.H - 3.6, '#9e2c22'); P.x.fillStyle = 'rgba(0,0,0,.25)'; for (let u = 0; u < P.W; u += 0.25) P.x.fillRect(P.X(u), P.Y(P.H), 2, P.S(P.H - 3.6));
    P.door(0.8, 1.2, 2.5, '#6a4a2c'); P.win(2.8, 1.0, 1.6, 1.7, { grille: true }); P.win(5.4, 1.0, 1.6, 1.7, { grille: true, dark: true });
    P.win(1.5, 4.3, 1.2, 1.5, { frame: '#f4f2ec' }); P.win(5.6, 4.3, 1.2, 1.5, { frame: '#f4f2ec' });
  } });
  // branco alto con galería de cuarteróns en toda a fachada
  Lf.push({ s0: 59, s1: 72, H: 13.4, wall: '#f2f0ea', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#f2f0ea'); P.noise(); P.stains(0.5); P.rect(0, 0, P.W, 0.9, '#b5b0a5');
    P.shop(0.5, 5.0, 3.2, '#3a3d42'); P.door(6.0, 1.3, 2.7, '#3a2a1e', { panels: true }); P.shutter(7.9, 4.5, 3.0, '#b8bcc0');
  }, galleries: [0, 1, 2].map(f => ({ u: 0.4, w: 12.2, y: 4.1 + f * 3.0, h: 2.7, d: 0.9 })) });
  // casa crema de tres plantas, tellado de tella
  Lf.push({ s0: 72, s1: 84, H: 10.0, wall: '#ecdcb6', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#eddcb4'); P.noise(); P.stains(0.9); P.rect(0, 0, P.W, 1.1, '#b7aa90');
    P.door(1.0, 1.2, 2.5, '#5a3a24', { panels: true }); P.shutter(3.0, 3.8, 2.9, '#a7aaae'); P.win(8.2, 1.0, 1.4, 1.6, { grille: true });
    for (let f = 0; f < 2; f++) for (const u of [1.4, 5.2, 9.0]) P.win(u, 4.0 + f * 2.9, 1.2, 1.8, { shutters: '#7a5a3a', blind: 0.3 });
  }, balconies: [{ u: 4.6, w: 2.4, y: 3.75, d: 0.6 }, { u: 4.6, w: 2.4, y: 6.65, d: 0.6 }] });

  // resto da rúa: edificios correntes, avellentados, e solares cerrados
  const cols = ['#e6dcc8', '#d9d2c2', '#e8d7a8', '#cfd3d6', '#efe9dc', '#d8c6b0', '#c9cfc4'];
  const std3 = (s0, s1, floors, col, o = {}) => ({ s0, s1, H: 3.8 + floors * 2.9 + 0.4, wall: col, roof: o.roof || (floors > 3 ? 'flat' : 'tile'), paint(P) {
    P.rect(0, 0, P.W, P.H, col); P.noise(1400, 0.09); P.stains(o.old ? 1.6 : 1.0); P.rect(0, 0, P.W, 0.9, '#a9a294'); P.cornice(P.H - 0.4, 0.4, '#e2ddd2');
    if (o.brick) P.brick(0, 3.8, P.W, P.H - 4.2);
    let u = 0.6; const gr = o.ground || pick(['shutter', 'garage', 'shop', 'door']);
    if (gr === 'shop') { P.shop(u, Math.min(5, P.W - 3), 3.2, '#3a3d42', { lit: R() < 0.5 }); u += Math.min(5, P.W - 3) + 0.6; }
    else if (gr === 'wood') { for (let k = 0; k < 3; k++) { P.rect(u, 0.3, 2.2, 3.0, '#6a4628'); P.win(u + 0.2, 1.2, 1.8, 1.9, { grille: true, frame: '#6a4628', dark: true, sill: false }); u += 2.6; } }
    else if (gr === 'garage') { P.garage(u, 3.6, 3.0, pick(['#5a5f66', '#7a6a58', '#3e4246'])); u += 4.2; }
    else { P.shutter(u, 3.4, 2.9, pick(['#a7aaae', '#8f949a', '#b9b3a6'])); u += 4.0; }
    P.door(u, 1.2, 2.6, pick(['#5a3a24', '#3a3d42', '#6a4a2c']), { panels: true }); u += 1.8;
    while (u < P.W - 1.4) { P.win(u, 1.0, 1.3, 1.7, { grille: true, dark: R() < 0.5 }); u += 2.2; }
    const n = Math.max(2, Math.floor(P.W / 2.9));
    for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) P.win(0.7 + i * (P.W - 1.4) / n + 0.25, 4.3 + f * 2.9, 1.15, 1.8, { blind: RR(0, 0.7), shutters: o.shutters, dark: o.old && R() < 0.3 });
  }, balconies: o.balc ? (() => { const a = [], n = Math.max(2, Math.floor((s1 - s0) / 2.9)); for (let f = 0; f < floors; f++) a.push({ u: 0.5, w: s1 - s0 - 1, y: 4.05 + f * 2.9, d: 0.7 }); return a; })() : null });
  const lot = (s0, s1, kind = 'wall') => ({ s0, s1, lot: kind });

  Rt.push(std3(74, 88, 4, cols[0], { ground: 'shop' }), std3(88, 100, 3, cols[2], { old: true, shutters: '#7a5a3a' }), lot(100, 112, 'wall'),
    std3(112, 126, 5, '#d9b9a2', { brick: true, balc: true, ground: 'garage' }), std3(126, 138, 3, cols[3], { old: true }), std3(138, 150, 3, cols[5], { ground: 'shop' }),
    // (cruce coa Rúa de Severo Ochoa)
    std3(170, 182, 3, cols[4], { old: true }), lot(182, 192, 'wall'));
  // casa vella de cachotería con galería branca e portas de madeira
  Rt.push({ s0: 192, s1: 206, H: 8.2, wall: '#bdb3a0', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#f0eee8'); P.ashlar(0, 0, P.W, 4.2, [176, 160, 132], true); P.noise(800, 0.06);
    for (const u of [0.9, 4.4, 7.9, 11.3]) P.door(u, 1.5, 2.9, '#8a4a2c', { arch: false, panels: true, frame: '#b9ab90' });
    P.rect(0, 4.1, P.W, 0.25, '#d9d2c2');
  }, galleries: [{ u: 0.3, w: 13.4, y: 4.4, h: 3.2, d: 0.95 }] });
  // muro de ladrillo con malla e casa vella en venda, ata o cruce
  Rt.push(lot(206, 214, 'brickmesh'));
  Rt.push({ s0: 214, s1: 226, H: 8.0, wall: '#b9b4a8', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#bcb6aa'); P.noise(2200, 0.12); P.stains(2.2); P.ashlar(0, 0, P.W, 0.8, [140, 135, 125]);
    P.door(1.0, 1.3, 2.6, '#7a5634', { panels: true }); P.door(4.4, 1.8, 2.7, '#7a5634', { split: true }); P.win(8.0, 0.9, 1.6, 1.8, { grille: true, frame: '#7a5634', dark: true });
    P.sign(6.6, 2.2, 1.0, 0.45, 'VENDE', '#f4f4f0', '#1b1b1d', { weight: 700 });
    P.win(4.6, 4.2, 1.3, 2.2, { frame: '#7a6a58', dark: true }); P.win(8.2, 4.2, 1.3, 2.0, { frame: '#7a6a58', dark: true });
  }, balconies: [{ u: 4.2, w: 2.1, y: 4.0, d: 0.55 }] });
  Rt.push({ s0: 226, s1: 236, H: 7.0, wall: '#f2f0ea', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#f2f0ea'); P.noise(); P.stains(1); P.rect(0, 0, P.W, 0.8, '#a9a294');
    P.door(1.0, 1.1, 2.4, '#3a3d42'); P.door(3.0, 1.1, 2.4, '#3a3d42'); P.win(5.4, 1.0, 1.3, 1.6, { grille: true }); P.win(7.6, 1.0, 1.3, 1.6, { grille: true });
  }, galleries: [{ u: 0.4, w: 9.2, y: 3.6, h: 2.6, d: 0.85 }] });

  Lf.push(std3(84, 98, 4, cols[1], { ground: 'shop', balc: true }), std3(98, 110, 3, cols[6], { old: true }), lot(110, 120, 'wall'),
    std3(120, 134, 4, cols[4], { ground: 'garage' }), std3(134, 148, 3, cols[2], { old: true, shutters: '#6a5a44' }),
    // edificio de ladrillo de cinco plantas con vella tenda de madeira
    std3(148, 164, 5, '#d4c4ac', { brick: true, balc: true, ground: 'wood' }), lot(164, 176, 'planks'),
    std3(176, 188, 2, '#e3c97a', { old: true, roof: 'tile' }), std3(188, 200, 3, cols[0], {}), lot(200, 212, 'wall'));
  // vello concesionario de automóbiles (pechado)
  Lf.push({ s0: 212, s1: 230, H: 7.6, wall: '#a8553a', roof: 'flat', paint(P) {
    P.rect(0, 0, P.W, P.H, '#d7d2c8'); P.brick(0, 4.2, P.W, P.H - 4.2, [160, 78, 52]); P.stains(1.4);
    P.shop(0.4, 13.4, 3.2, '#c9ccd0', { lit: false }); P.x.fillStyle = 'rgba(240,240,235,.35)'; for (let i = 0; i < 5; i++) P.x.fillRect(P.X(1 + i * 2.6), P.Y(2.8), P.S(1.4), P.S(1.2)); // papeis nos vidros
    P.sign(0, 3.55, 13.8, 0.75, 'COMPRA-VENTA DE AUTOMÓVILES', '#1f3f9a', '#ffffff', { border: '#f4f4f0' });
    P.shutter(14.2, 3.4, 3.1, '#9da2a8');
    for (const u of [1.0, 4.4, 7.8, 11.2, 14.6]) P.win(u, 4.7, 1.3, 1.7, { dark: true, frame: '#d7d2c8' });
  } });
  Lf.push({ s0: 230, s1: 236, H: 7.4, wall: '#e6e2d8', roof: 'tile', paint(P) {
    P.rect(0, 0, P.W, P.H, '#e3dfd4'); P.stains(1.2); P.shop(0.3, 5.4, 3.0, '#2a2d31', { lit: false }); P.sign(0.3, 3.05, 5.4, 0.5, 'MALES E DESCONTOS', '#1f3f9a', '#ffffff');
    P.win(1.0, 4.3, 1.2, 1.7, { blind: 0.4 }); P.win(3.6, 4.3, 1.2, 1.7, { blind: 0.6 });
  } });
  return { R: Rt, L: Lf };
}

/* ---------- construción ---------- */
function buildArenal(B, scene) {
  const F = LM.arenal; if (!F) return;
  const plan = arPlan();
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => {
    for (const [side, list] of [[1, plan.R], [-1, plan.L]]) for (const b of list) {
      const s = (b.s0 + b.s1) / 2, [wx, wz] = F.pt(s, side * (ARENAL.fl + 3)), y0 = terrainH(wx, wz);
      if (b.lot) { arLot(LB, g, b, side, y0); continue; }
      const P = arCanvas(b.s1 - b.s0, b.H); b.paint(P); b.front = arTex(P);
      arBuild(LB, g, b, side, y0);
    }
  });
}
// solares baleiros: muro encalado, ladrillo con malla ou táboas de madeira
function arLot(B, g, b, sg, y0) {
  const W = b.s1 - b.s0, cx = (b.s0 + b.s1) / 2, z = sg * (ARENAL.fl + 0.15), h = b.lot === 'planks' ? 2.4 : 2.2;
  const P = arCanvas(W, h);
  if (b.lot === 'planks') { for (let u = 0; u < W; u += 0.22) { const v = RR(-20, 20); P.rect(u, 0, 0.2, h, `rgb(${120 + v},${92 + v},${62 + v})`); } P.stains(0.6); }
  else if (b.lot === 'brickmesh') { P.brick(0, 0, W, 0.9, [170, 80, 55]); P.x.clearRect(0, 0, P.c.width, P.Y(0.9)); P.x.strokeStyle = 'rgba(70,70,70,.9)'; P.x.lineWidth = 2; for (let k = -40; k < P.c.width; k += 10) { P.x.beginPath(); P.x.moveTo(k, 0); P.x.lineTo(k + P.Y(0.9), P.Y(0.9)); P.x.stroke(); P.x.beginPath(); P.x.moveTo(k + P.Y(0.9), 0); P.x.lineTo(k, P.Y(0.9)); P.x.stroke(); } for (let u = 0; u < W; u += 2.4) P.brick(u, 0, 0.36, h); }
  else { P.rect(0, 0, W, h, '#e9e5dc'); P.noise(1200, 0.1); P.stains(1.4); P.rect(0, h - 0.12, W, 0.12, '#bdb6a8'); }
  const t = arTex(P), m = new THREE.Mesh(new THREE.PlaneGeometry(W, h), std({ map: t.t, transparent: b.lot === 'brickmesh', alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.9 }));
  m.position.set(cx, y0 + h / 2, z); m.rotation.y = sg > 0 ? Math.PI : 0; g.add(m);
  addBoxCol(b.s0, z - 0.15, b.s1, z + 0.15, h, 'muro');
  // matogueira detrás do muro
  for (let i = 0; i < W / 2.5; i++) { const bush = new THREE.SphereGeometry(RR(0.5, 1.0), 6, 5); bush.scale(1, 0.7, 1); xform(bush, b.s0 + RR(0.6, W - 0.6), y0 + 0.4, sg * (ARENAL.fl + RR(1.5, 7))); B.vcol.add(colorize(bush, pick(['#5a7a3a', '#6b8a42', '#4a6a30']))); }
}
