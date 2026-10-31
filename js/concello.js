'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Casa do Concello na Praza do Campo de San
   Antonio: edificio en U de dúas plantas, branco con bandas de
   ladrillo, tellado de tella, balcón central coas bandeiras e
   «CASA DO CONCELLO» sobre as tres portas; patio con escalinata,
   palmeiras e ciprés; adro de lousa terracota; e a gran praza ao
   sueste con plátanos podados, bancos e marquesiña.
   Marco local: x de leste (0) a oeste (50.5) ao longo da fachada
   traseira (Rúa sur); z cara ao patio e á rúa norte (NE).
   ========================================================== */
const CONC = { o: [-298, 208], rot: 2.713 };
function concelloLandmarks() {
  LM.concello = makeFrame(CONC.o[0], CONC.o[1], CONC.rot);
  if (typeof OSM_SKIP !== 'undefined') OSM_SKIP.add('Concello de Monforte de Lemos');
  const F = LM.concello;
  const P = [F.pt(-1, -0.5), F.pt(51, -0.5), F.pt(51, 21), F.pt(37.8, 21), F.pt(37.8, 14), F.pt(13.8, 14), F.pt(13.8, 28.5), F.pt(-1, 28.5)];
  reserve(P, 'Casa do Concello'); (G.noTrees = G.noTrees || []).push(frameRectPoly(F, -1, -1, 52, 34));
}
/* ---------- fachadas ---------- */
const CONC_PX = 28; // píxeles por metro
function concFacade(W, H, wins, opts = {}) {
  const BASE = 1.6, S = CONC_PX, cw = Math.max(8, Math.round(W * S)), ch = Math.round((H + BASE) * S), c = cnv(cw, ch), x = c.getContext('2d');
  const e = cnv(cw, ch), ex = e.getContext('2d'); ex.fillStyle = '#000'; ex.fillRect(0, 0, cw, ch);
  const X = u => u * S, Y = v => ch - (v + BASE) * S;
  x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, cw, ch);
  for (let i = 0; i < cw * ch / 90; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${RR(0.015, 0.04)})`; x.fillRect(R() * cw, R() * ch, 2, 2); }
  const brick = (v0, v1) => { x.fillStyle = '#b5583e'; x.fillRect(0, Y(v1), cw, (v1 - v0) * S); x.fillStyle = 'rgba(0,0,0,.12)'; for (let v = v0; v < v1; v += 0.12) x.fillRect(0, Y(v), cw, 1); };
  brick(-BASE, 0.55); brick(4.15, 4.45); brick(H - 0.55, H);
  // manchas de humidade baixo a cornixa
  for (let i = 0; i < 6; i++) { const u = R() * W, g = x.createLinearGradient(0, Y(H - 0.55), 0, Y(H - 2)); g.addColorStop(0, 'rgba(90,80,60,.12)'); g.addColorStop(1, 'rgba(90,80,60,0)'); x.fillStyle = g; x.fillRect(X(u), Y(H - 0.55), X(RR(0.4, 1.4)), 1.5 * S); }
  for (const w of wins) {
    const v0 = w.floor ? (w.kind === 'arch' ? 5.0 : 4.75) : (w.kind === 'door' ? 0.55 : 1.15), hh = w.h || (w.kind === 'door' ? 3.2 : w.floor ? 2.45 : 2.2), ww = w.w || 1.35, u0 = w.u - ww / 2;
    // marco e vidro
    x.fillStyle = w.kind === 'door' ? '#b89a5a' : '#e9e6de'; x.fillRect(X(u0 - 0.1), Y(v0 + hh + 0.1), (ww + 0.2) * S, (hh + 0.2) * S);
    const g = x.createLinearGradient(0, Y(v0 + hh), 0, Y(v0)); g.addColorStop(0, '#6f8a9e'); g.addColorStop(0.5, '#3d4d5a'); g.addColorStop(1, '#2a333b'); x.fillStyle = g;
    if (w.kind === 'arch') { x.beginPath(); x.moveTo(X(u0), Y(v0)); x.lineTo(X(u0), Y(v0 + hh - ww / 2)); x.arc(X(w.u), Y(v0 + hh - ww / 2), ww / 2 * S, Math.PI, 0); x.lineTo(X(u0 + ww), Y(v0)); x.fill();
      x.strokeStyle = '#b5583e'; x.lineWidth = 0.22 * S; x.beginPath(); x.arc(X(w.u), Y(v0 + hh - ww / 2), (ww / 2 + 0.12) * S, Math.PI, 0); x.stroke(); }
    else x.fillRect(X(u0), Y(v0 + hh), ww * S, hh * S);
    // carpintería
    x.fillStyle = w.kind === 'door' ? '#a8894a' : '#f4f2ee'; x.fillRect(X(w.u) - 2, Y(v0 + hh), 4, hh * S); if (w.kind !== 'door') x.fillRect(X(u0), Y(v0 + hh * 0.72), ww * S, 3);
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(X(u0 + 0.12), Y(v0 + hh - 0.1), 0.18 * S, (hh - 0.3) * S);
    if (w.kind === 'door') { x.fillStyle = 'rgba(255,240,200,.25)'; x.fillRect(X(u0 + 0.1), Y(v0 + hh * 0.55), (ww - 0.2) * S, 2); }
    // varandas de ferro nas fiestras balconeiras
    if (w.floor && w.kind === 'french') { x.fillStyle = '#1b1b1d'; x.fillRect(X(u0 - 0.15), Y(v0 + 1.0), (ww + 0.3) * S, 3); x.fillRect(X(u0 - 0.15), Y(v0 + 0.05), (ww + 0.3) * S, 3); for (let k = u0 - 0.1; k <= u0 + ww + 0.1; k += 0.12) x.fillRect(X(k), Y(v0 + 1.0), 2, 0.95 * S); }
    // peitoril
    if (!w.floor && w.kind !== 'door') { x.fillStyle = '#d9d4c8'; x.fillRect(X(u0 - 0.15), Y(v0), (ww + 0.3) * S, 0.12 * S); }
    // luz de noite
    if (R() < (w.kind === 'door' ? 0.95 : 0.55)) { ex.fillStyle = w.kind === 'door' ? '#ffe2a8' : `rgb(${RR(220, 255)},${RR(190, 220)},${RR(130, 170)})`; ex.fillRect(X(u0), Y(v0 + hh), ww * S, hh * S); }
  }
  if (opts.sign) { x.fillStyle = '#8a6a3a'; x.font = `700 ${Math.round(0.34 * S)}px Georgia, serif`; x.textAlign = 'center'; x.fillText(opts.sign, X(opts.signU), Y(opts.signV)); }
  const t = toTex(c, false), te = toTex(e, false); t.anisotropy = 4;
  return nightMat(std({ map: t, emissiveMap: te, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.82 }), 0, 0.85);
}
const concRow = (W, n, kind, floor, opts = {}) => { const out = [], m = opts.margin || 1.4, step = (W - 2 * m) / Math.max(1, n - 1); for (let i = 0; i < n; i++) out.push({ u: n === 1 ? W / 2 : m + i * step, kind, floor, w: opts.w }); return out; };
const concBoth = (W, n, opts = {}) => [...concRow(W, n, opts.k0 || 'win', 0, opts), ...concRow(W, n, opts.k1 || 'french', 1, opts)];
/* ---------- piezas ---------- */
function concBox(LB, g, y0, x0, x1, z0, z1, H, faces, roofH = 2.6) {
  const W = x1 - x0, D = z1 - z0, blank = std({ color: 0xf3f1ec, roughness: 0.85 });
  const fm = k => faces[k] ? concFacade(k === 'px' || k === 'nx' ? D : W, H, faces[k], faces[k + 'O'] || {}) : blank;
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H + 1.6, D), [fm('px'), fm('nx'), blank, blank, fm('pz'), fm('nz')]);
  // a xeometría afunde 1.6 m baixo o chan (pendente); as texturas usan só a parte vista
  box.geometry.translate(0, -0.8, 0); box.position.set((x0 + x1) / 2, y0 + H / 2, (z0 + z1) / 2); box.castShadow = true; box.receiveShadow = true; g.add(box);
  const eave = boxGeo(W + 0.7, 0.28, D + 0.7); xform(eave, (x0 + x1) / 2, y0 + H + 0.1, (z0 + z1) / 2); LB.vcol.add(colorize(eave, '#b5583e'));
  const rf = hipRoof(W + 0.6, D + 0.6, roofH, 4, 0.3); xform(rf, (x0 + x1) / 2, y0 + H + 0.24, (z0 + z1) / 2); LB.tile.add(rf);
  addBoxCol(x0, z0, x1, z1, H + roofH, 'concello');
}
function concPalm(LB, x, y, z, h) {
  const tr = new THREE.CylinderGeometry(0.16, 0.24, h, 8); xform(tr, x, y + h / 2, z); LB.wood.add(colorize(tr, '#6b5a40'));
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, f = new THREE.ConeGeometry(0.28, 1.9, 4); f.rotateZ(Math.PI / 2 + 0.5); f.translate(0.95, 0, 0); f.rotateY(a); xform(f, x, y + h, z); LB.vcol.add(colorize(f, i % 2 ? '#3f6a33' : '#4d7a3a')); }
}
function buildConcello(B, scene) {
  const F = LM.concello; if (!F) return;
  const y0 = terrainH(...F.pt(25, 14)) + 0.02;
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => {
    const H = 8.6;
    // corpo central (entre as ás): fachada principal ao patio (+z)
    concBox(LB, g, y0, 13.8, 37.8, 0, 13.5, H, {
      pz: [1.5, 3.9, 6.1, 17.9, 20.1, 22.5].flatMap(u => [{ u, kind: 'win', floor: 0, w: 1.3 }, { u, kind: 'french', floor: 1, w: 1.3 }]),
      nz: concBoth(24, 7),
    }, 2.4);
    // ás: leste (cara á gran praza) e oeste (cara á Rúa Teceláns)
    concBox(LB, g, y0, -0.4, 13.8, 0, 28.3, H, { px: concBoth(28.3, 7), nx: concBoth(28.3, 7, { k1: 'arch' }), pz: concBoth(14.2, 3), nz: concBoth(14.2, 3) }, 2.8);
    concBox(LB, g, y0, 37.8, 50.6, 0, 20.6, H, { px: concBoth(20.6, 5), nx: concBoth(20.6, 5, { k1: 'arch' }), pz: concBoth(12.8, 3), nz: concBoth(12.8, 3) }, 2.8);
    // corpo de entrada adiantado: tres portas, balcón corrido, bandeiras e rótulo
    { const x0 = 20.8, x1 = 30.8, z0 = 13.4, z1 = 15.4, W = x1 - x0;
      const doors = [{ u: 2.0, kind: 'door', floor: 0, w: 1.7 }, { u: 5.0, kind: 'door', floor: 0, w: 1.7 }, { u: 8.0, kind: 'door', floor: 0, w: 1.7 }, { u: 2.0, kind: 'french', floor: 1, w: 1.6 }, { u: 5.0, kind: 'french', floor: 1, w: 1.6 }, { u: 8.0, kind: 'french', floor: 1, w: 1.6 }];
      concBox(LB, g, y0, x0, x1, z0, z1, H + 0.5, { pz: doors, pzO: { sign: 'CASA DO CONCELLO', signU: W / 2 - 0, signV: 4.0 } }, 1.4);
      // balcón corrido de pedra con varanda
      const bal = boxGeo(W + 0.4, 0.22, 1.1); xform(bal, (x0 + x1) / 2, y0 + 4.62, z1 + 0.55); LB.vcol.add(colorize(bal, '#b5583e'));
      const rail = boxGeo(W + 0.4, 0.05, 0.05); xform(rail, (x0 + x1) / 2, y0 + 5.7, z1 + 1.08); LB.metalDark.add(rail);
      for (let u = x0 - 0.15; u <= x1 + 0.2; u += 0.16) { const b = boxGeo(0.025, 0.95, 0.025); xform(b, u, y0 + 5.2, z1 + 1.08); LB.metalDark.add(b); }
      // bandeiras: Galicia, España e Monforte
      const flagTex = k => { const c = cnv(96, 64), x = c.getContext('2d');
        if (k === 0) { x.fillStyle = '#fff'; x.fillRect(0, 0, 96, 64); x.strokeStyle = '#4a8fd8'; x.lineWidth = 14; x.beginPath(); x.moveTo(0, 0); x.lineTo(96, 64); x.stroke(); }
        else if (k === 1) { x.fillStyle = '#c60b1e'; x.fillRect(0, 0, 96, 64); x.fillStyle = '#ffc400'; x.fillRect(0, 16, 96, 32); }
        else { x.fillStyle = '#6a3a8a'; x.fillRect(0, 0, 96, 64); x.fillStyle = '#f2c21b'; x.beginPath(); x.arc(48, 32, 10, 0, 7); x.fill(); }
        return toTex(c, false); };
      G.concelloFlags = [];
      [x0 + 2.2, (x0 + x1) / 2, x1 - 2.2].forEach((u, k) => {
        const pole = new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6); xform(pole, u, y0 + 6.0, z1 + 0.9, 0, 0.55); LB.metal.add(pole);
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6, 6, 1), std({ map: flagTex(k), side: THREE.DoubleSide, roughness: 0.8 })); fl.position.set(u + (k === 1 ? 0 : 0.0), y0 + 6.75, z1 + 1.55); fl.rotation.set(0, Math.PI / 2, 0); g.add(fl); G.concelloFlags.push(fl);
      });
      // escalinata
      for (let i = 0; i < 6; i++) { const st = boxGeo(8.4, 0.16, 3.2 - i * 0.45); xform(st, (x0 + x1) / 2, y0 - 0.6 + 0.16 * (i + 1) + 0.0, z1 + (3.2 - i * 0.45) / 2); LB.stone.add(st); }
      // escudo xunto á porta
      const sh = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), std({ color: 0x8a6a3a, metalness: 0.6, roughness: 0.4 })); sh.position.set(x0 + 3.5, y0 + 2.2, z1 + 0.02); g.add(sh);
    }
    // patio: dous xardíns elevados con bordo de ladrillo, palmeiras, ciprés e buxos
    for (const [x0, x1] of [[14.6, 23.6], [28.2, 37.2]]) {
      const z0 = 16.5, z1 = 26.5;
      for (const [w, d, cx, cz] of [[x1 - x0, 0.25, (x0 + x1) / 2, z0], [x1 - x0, 0.25, (x0 + x1) / 2, z1], [0.25, z1 - z0, x0, (z0 + z1) / 2], [0.25, z1 - z0, x1, (z0 + z1) / 2]]) { const k = boxGeo(w, 0.45, d); xform(k, cx, y0 + 0.0, cz); LB.vcol.add(colorize(k, '#b5583e')); }
      const soil = boxGeo(x1 - x0 - 0.3, 0.3, z1 - z0 - 0.3); xform(soil, (x0 + x1) / 2, y0 - 0.02, (z0 + z1) / 2); LB.vcol.add(colorize(soil, '#3d5a2c'));
      const left = x0 < 20;
      concPalm(LB, left ? x1 - 2.5 : x0 + 2.5, y0, 19.5, 2.4); concPalm(LB, left ? x0 + 2.2 : x1 - 2.2, y0, 24, 3.2);
      for (const [cx, cz, h] of [[left ? x1 - 1.5 : x0 + 1.5, 24.5, 3.6], [left ? x0 + 4.5 : x1 - 4.5, 18, 2.6], [(x0 + x1) / 2, 25.2, 2.2]]) { const cy = new THREE.ConeGeometry(0.75, h, 8); xform(cy, cx, y0 + h / 2 + 0.1, cz); LB.vcol.add(colorize(cy, '#2f5a2a')); }
      for (let i = 0; i < 4; i++) { const b = new THREE.IcosahedronGeometry(0.45, 0); xform(b, RR(x0 + 1, x1 - 1), y0 + 0.4, RR(z0 + 1, z1 - 1)); LB.vcol.add(colorize(b, '#4f7a3a')); }
      addBoxCol(x0, z0, x1, z1, 0.6, 'xardín');
    }
    // bolardos e sinal de aparcamento
    for (let u = 6; u <= 46; u += 2.2) { if (Math.abs(u - 25.8) < 3) continue; const bo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8); xform(bo, u, y0 + 0.45, 31.5); LB.metalDark.add(bo); }
    { const p = new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6); xform(p, 9, y0 + 1.2, 30.5); LB.metal.add(p); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), std({ map: textTex('♿', { w: 64, h: 76, bg: '#1f5ab8', fg: '#ffffff', size: 48 }) })); s.position.set(9, y0 + 2.2, 30.55); g.add(s); }
  });
  // adro de lousa terracota (patio e explanada ata a rúa norte)
  { const tex = (() => { const c = cnv(256, 256), x = c.getContext('2d'); x.fillStyle = '#c8714e'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = RR(-12, 12); x.fillStyle = `rgb(${200 + v},${116 + v},${80 + v})`; x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } x.fillStyle = '#d8d2c6'; x.fillRect(0, 0, 256, 3); x.fillRect(0, 0, 3, 256); for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(0,0,0,${RR(0.02, 0.06)})`; x.fillRect(R() * 256, R() * 256, 2, 2); } return toTex(c); })();
    const BT = new Batch(std({ map: tex, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), { cast: false });
    const P = [F.pt(13.8, 13.5), F.pt(37.8, 13.5), F.pt(37.8, 20.6), F.pt(50.6, 20.6), F.pt(52, 33), F.pt(-1, 33), F.pt(-1, 28.3), F.pt(13.8, 28.3)];
    fillPoly(P, BT, { step: 2, yOff: 0.09, uv: 4 }); BT.build(scene); }
  // a gran praza: plátanos podados, bancos, papeleiras e marquesiña
  const A = OSM.areas.find(a => a.n === 'Praza do Campo de San Antonio');
  if (A) {
    const P = A.p, trees = [];
    for (let x = -296; x < -242; x += 8) for (let z = 178; z < 220; z += 8) { const tx = x + RR(-1, 1), tz = z + RR(-1, 1); if (inPoly(tx, tz, P) && !inStreet(tx, tz, 1.5) && !inRoad(tx, tz, 1.5)) trees.push([tx, tz]); }
    const bark = std({ color: 0xa89f8c, roughness: 0.95 }), knot = std({ color: 0x8a8070, roughness: 0.95 });
    for (const [tx, tz] of trees.slice(0, 12)) {
      const y = terrainH(tx, tz), g = new THREE.Group(); g.position.set(tx, y, tz); g.rotation.y = R() * 6; scene.add(g);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 3.4, 8), bark); tr.position.y = 1.7; tr.castShadow = true; g.add(tr);
      for (let k = 0; k < 4; k++) { const a = k / 4 * 6.28 + R(), br = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 2.2, 6), bark); br.position.set(Math.cos(a) * 0.55, 4.2, Math.sin(a) * 0.55); br.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); br.castShadow = true; g.add(br);
        const kn = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), knot); kn.position.set(Math.cos(a) * 1.05, 5.25, Math.sin(a) * 1.05); g.add(kn);
        for (let s = 0; s < 3; s++) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9, 4), bark); tw.position.set(Math.cos(a) * 1.05 + RR(-0.2, 0.2), 5.7, Math.sin(a) * 1.05 + RR(-0.2, 0.2)); tw.rotation.set(RR(-0.3, 0.3), 0, RR(-0.3, 0.3)); g.add(tw); } }
      const grate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1.4), MAT.metalDark); grate.position.y = 0.1; g.add(grate);
      addCircCol0(tx, tz, 0.35, 3);
    }
    // bancos vermellos e papeleiras
    const C0 = polyCentroid(P);
    for (const [ox, oz, r] of [[-10, 4, 0.4], [6, -6, 2.0], [14, 2, 1.0], [-2, 9, 0.2]]) { const bx = C0[0] + ox, bz = C0[1] + oz; if (!inPoly(bx, bz, P)) continue; const y = terrainH(bx, bz); bench({ wood: { add: g => { const m = new THREE.Mesh(g, std({ color: 0xa83a2a, roughness: 0.7 })); m.castShadow = true; scene.add(m); } }, metalDark: { add: g => scene.add(new THREE.Mesh(g, MAT.metalDark)) } }, bx, y, bz, r); }
    for (const [ox, oz] of [[-6, 6], [10, -2]]) { const bx = C0[0] + ox, bz = C0[1] + oz; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.9, 10), std({ color: 0x2a2d31, roughness: 0.6 })); b.position.set(bx, terrainH(bx, bz) + 0.45, bz); b.castShadow = true; scene.add(b); }
  }
  // porta do Concello (para pagar as multas)
  const [dx, dz] = F.pt(25.8, 19.5); G.concelloDoor = { x: dx, z: dz };
  G.namedZones.push({ n: 'Casa do Concello', p: frameRectPoly(F, -1, -0.5, 51, 33) });
}
/* as bandeiras ondean co vento */
function updateConcello(dt) {
  const fl = G.concelloFlags; if (!fl) return;
  for (let k = 0; k < fl.length; k++) { const p = fl[k].geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.45; p.setZ(i, Math.sin(G.t * 4 + x * 5 + k) * 0.06 * x); } p.needsUpdate = true; }
}
