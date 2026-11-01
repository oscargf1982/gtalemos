'use strict';
/* ==========================================================
   GTA LEMOS 27400 · a cidade real a partir de OpenStreetMap
   rúas con trazado real, beirarrúas, cruces, edificios ao longo
   das rúas, parques, aparcadoiros, vías do tren
   © colaboradores de OpenStreetMap (ODbL)
   ========================================================== */
G.reserved = [];   // polígonos onde non se xeran edificios (monumentos, prazas...)
G.namedZones = []; // polígonos con nome para o HUD
function reserve(P, name) { G.reserved.push({ p: P, bb: polyBox(P) }); if (name) G.namedZones.push({ n: name, p: P }); }
function reservedAt(x, z) { for (const q of G.reserved) if (x > q.bb.x0 && x < q.bb.x1 && z > q.bb.z0 && z < q.bb.z1 && inPoly(x, z, q.p)) return true; return false; }
/* rectángulo orientado (marco) como polígono */
function frameRectPoly(F, x0, z0, x1, z1) { return [F.pt(x0, z0), F.pt(x1, z0), F.pt(x1, z1), F.pt(x0, z1)]; }

/* ---------- xeometría auxiliar ---------- */
/* parede vertical que segue unha polilínea (bordos, muretes) */
function wallStrip(pts, y0, y1, yFn) {
  const P = [], U = [], I = []; let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i]; if (i) acc += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    const g = yFn ? yFn(x, z) : 0; P.push(x, g + y0, z, x, g + y1, z); U.push(acc / 3, 0, acc / 3, (y1 - y0) / 3);
    if (i) { const o = (i - 1) * 2; I.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  const g2 = g.clone(); const ix = g2.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g2.computeVertexNormals();
  return mergeGeos([g, g2]);
}
/* teselas que enchen un polígono seguindo o terreo */
function fillPoly(P, batch, { step = 5, yOff = 0.03, uv = 8, skip = null } = {}) {
  const bb = polyBox(P);
  for (let x = Math.floor(bb.x0 / step) * step; x < bb.x1; x += step) for (let z = Math.floor(bb.z0 / step) * step; z < bb.z1; z += step) {
    const cx = x + step / 2, cz = z + step / 2;
    if (!inPoly(cx, cz, P)) continue;
    if (riverDistRaw(cx, cz) < RIVER_HW + 0.5) continue;
    if (skip && skip(cx, cz)) continue;
    const g = new THREE.PlaneGeometry(step + 0.04, step + 0.04, 1, 1); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i) + cx, pz = p.getZ(i) + cz; p.setXYZ(i, px, Math.max(terrainH(px, pz), -0.5) + yOff, pz); u.setXY(i, px / uv, pz / uv); }
    g.computeVertexNormals(); batch.add(g);
  }
}
/* edificio rotado: cx,cz centro, rot (marco), w ao longo de local x, d en local z */
G.buildingsList = [];
function addBuildingRot(B, F, cx, cz, rot, w, d, opts = {}) {
  const floors = opts.floors || 3, style = opts.style !== undefined ? opts.style : RI(0, 6);
  const c = Math.cos(rot), s = Math.sin(rot);
  const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [cx + lx * c + lz * s, cz - lx * s + lz * c]);
  let y0 = 1e9; for (const [x, z] of corners) y0 = Math.min(y0, terrainH(x, z)); y0 = Math.max(y0, 0) ; const base = y0 - 2.2;
  const gh = 3.6, uh = floors * 3.1, H = gh + uh;
  const ry = rot; // xform: rotación arredor de Y co mesmo convenio que os marcos
  const gb = boxGeo(w, gh + 2.2, d, SHOP_TILE); xform(gb, cx, base + (gh + 2.2) / 2, cz, ry); (opts.bar ? B.bar : opts.noShop ? F[style] : B.shop).add(gb);
  const ub = boxGeo(w, uh, d, FAC_TILE);
  const uvA = ub.attributes.uv, off = RI(0, 3) * 0.25, offv = RI(0, 3) * 0.25; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) + off, uvA.getY(i) + offv);
  xform(ub, cx, y0 + gh + uh / 2, cz, ry); F[style].add(ub);
  const modern = TEX.facades[style].style === 'moderno';
  if (modern || opts.flat) {
    const cap = boxGeo(w + 0.2, 0.5, d + 0.2); xform(cap, cx, y0 + H + 0.25, cz, ry); B.flat.add(cap);
  } else {
    const r = hipRoof(w, d, Math.min(w, d) * RR(0.24, 0.32), 4); xform(r, cx, y0 + H, cz, ry); (R() < 0.75 ? B.tile : B.slate).add(r);
    if (R() < 0.4) { const ch = boxGeo(0.8, 2, 0.8, [3, 3]); xform(ch, cx + RR(-w / 4, w / 4) * c, y0 + H + 1.2, cz - RR(-w / 4, w / 4) * s, ry); B.concrete.add(ch); }
  }
  const zg = boxGeo(w + 0.08, 0.6, d + 0.08, [3, 3]); xform(zg, cx, y0 + 0.3, cz, ry); B.stone.add(zg);
  const o = addOBB(cx, cz, w / 2, d / 2, rot, H + 2.2, opts.tag || 'edif', base);
  G.buildingsList.push({ cx, cz, w, d, rot, H, y0, poly: corners });
  return o;
}
/* ¿solápase un rectángulo orientado con edificios xa postos? (SAT con OBB e caixas) */
/* un anaco do Catastro omítese se tapa boa parte dun modelo feito a man (quedaría dentro del) ou se o modelo o cubre en máis dun 25 % */
/* tellado a catro augas sobre o rectángulo que mellor encaixa coa planta (tipo 1: cumio no eixo longo; 2: no curto) */
function hipRoofPoly(P, type, rise, y) {
  let cx = 0, cz = 0; for (const [x, z] of P) { cx += x; cz += z; } cx /= P.length; cz /= P.length;
  let sxx = 0, szz = 0, sxz = 0; for (const [x, z] of P) { const dx = x - cx, dz = z - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th), vx = -uz, vz = ux;
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const [x, z] of P) { const u = (x - cx) * ux + (z - cz) * uz, v = (x - cx) * vx + (z - cz) * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const ov = 0.3; u0 -= ov; u1 += ov; v0 -= ov; v1 += ov;
  const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2; let a = (u1 - u0) / 2, bb = (v1 - v0) / 2;
  if (a < 1.5 || bb < 1.5) return null;
  // eixo do cumio: A (lonxitude a) ; B perpendicular
  let Ax = ux, Az = uz, Bx = vx, Bz = vz;
  const longU = a >= bb; if ((type === 1) !== longU) { [Ax, Az, Bx, Bz] = [vx, vz, ux, uz]; const t = a; a = bb; bb = t; }
  const ox = cx + uc * ux + vc * vx, oz = cz + uc * uz + vc * vz;
  const r = Math.max(0, a - bb * 0.9), h = Math.min(rise, Math.max(1, bb * 0.75));
  const W = (sa, sb, yy) => [ox + Ax * sa + Bx * sb, yy, oz + Az * sa + Bz * sb];
  const c1 = W(-a, -bb, y), c2 = W(a, -bb, y), c3 = W(a, bb, y), c4 = W(-a, bb, y), e1 = W(-r, 0, y + h), e2 = W(r, 0, y + h);
  const pos = [], uv = [];
  const tri = (p, q, s) => { // orde antihoraria vista desde arriba (normal cara arriba)
    const ax = q[0] - p[0], az = q[2] - p[2], bx = s[0] - p[0], bz = s[2] - p[2]; if (ax * bz - az * bx > 0) { const t = q; q = s; s = t; }
    for (const v of [p, q, s]) { pos.push(v[0], v[1], v[2]); uv.push(v[0] / 4, v[2] / 4); }
  };
  tri(c1, c2, e2); tri(c1, e2, e1); tri(c3, c4, e1); tri(c3, e1, e2); tri(c2, c3, e2); tri(c4, c1, e1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  return g;
}
function customCover(P) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const q = G.colGrid.query((x0 + x1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2 + 2, []).filter(o => o.k !== 'c' && o.h >= 3 && o.tag !== 'edif' && o.tag !== 'igrexa');
  if (!q.length) return 0;
  const inO = (o, x, z) => { if (o.k === 'o') { const dx = x - o.x, dz = z - o.z, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c; return Math.abs(lx) < o.hx && Math.abs(lz) < o.hz; } return x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1; };
  // ¿algún modelo quedaría tragado polo anaco?
  for (const o of q) {
    let n = 0, hit = 0; const ox0 = o.x0, ox1 = o.x1, oz0 = o.z0, oz1 = o.z1, st = Math.max(0.8, Math.min(ox1 - ox0, oz1 - oz0) / 5);
    for (let x = ox0 + st / 2; x < ox1; x += st) for (let z = oz0 + st / 2; z < oz1; z += st) { if (!inO(o, x, z)) continue; n++; if (inPoly(x, z, P)) hit++; }
    if (n && hit / n > 0.5) return 1;
  }
  const st = Math.max(1, Math.min(x1 - x0, z1 - z0) / 6); let n = 0, hit = 0;
  for (let x = x0 + st / 2; x < x1; x += st) for (let z = z0 + st / 2; z < z1; z += st) { if (!inPoly(x, z, P)) continue; n++; if (q.some(o => inO(o, x, z))) hit++; }
  return n ? hit / n : 0;
}
function obbOverlaps(cx, cz, hx, hz, rot, pad = 0.2, skip = null) {
  const q = G.colGrid.query(cx, cz, Math.hypot(hx, hz) + 2, []);
  const c = Math.cos(rot), s = Math.sin(rot);
  const axA = [[c, -s], [s, c]];
  for (const o of q) {
    if (o.k === 'c' || o.h < 3 || (skip && skip(o))) continue;
    let oc, os, ohx, ohz, ox, oz;
    if (o.k === 'o') { oc = o.c; os = o.s; ohx = o.hx; ohz = o.hz; ox = o.x; oz = o.z; }
    else { oc = 1; os = 0; ohx = (o.x1 - o.x0) / 2; ohz = (o.z1 - o.z0) / 2; ox = (o.x0 + o.x1) / 2; oz = (o.z0 + o.z1) / 2; }
    const axB = [[oc, -os], [os, oc]], dx = ox - cx, dz = oz - cz;
    let sep = false;
    for (const [ax, az] of [...axA, ...axB]) {
      const rA = Math.abs(hx * (axA[0][0] * ax + axA[0][1] * az)) + Math.abs(hz * (axA[1][0] * ax + axA[1][1] * az));
      const rB = Math.abs(ohx * (axB[0][0] * ax + axB[0][1] * az)) + Math.abs(ohz * (axB[1][0] * ax + axB[1][1] * az));
      if (Math.abs(dx * ax + dz * az) > rA + rB + pad) { sep = true; break; }
    }
    if (!sep) return true;
  }
  return false;
}

/* ---------- Rúas ---------- */
function buildRoadsOSM(B) {
  const yo = r => r.major ? 0.06 : r.cls === 'service' ? 0.04 : 0.05;
  const markedB = B.road, plainB = B.asphRoad;
  for (const r of ROADS) {
    const yF = surfY;
    if (r.bridge && r.bridge.type === 'wood') continue;
    if (r.type === 'car') {
      const marked = r.w >= 7.5 && !r.ow && r.cls !== 'service';
      (marked ? markedB : plainB).add(ribbon(r.pts, r.w, { step: 3, vScale: 12, yFn: yF, yOff: yo(r) }));
    } else if (r.type === 'ped') {
      const w = r.bridge && r.bridge.type === 'vella' ? r.bridge.hw * 2 - 1.25 : r.w;
      const g = ribbon(r.pts, w, { step: 0.75, vScale: 6, yFn: yF, yOff: 0.055 });
      const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
      B.cobble.add(g);
    } else if (r.type === 'path') {
      const m = roadPoint(r, r.len / 2), green = AREAS.some(a => (a.t === 'park' || a.t === 'grass' || a.t === 'wood') && inPoly(m.x, m.z, a.p)) || !r.urban;
      const g = ribbon(r.pts, r.w, { step: 2, vScale: 4, yFn: yF, yOff: green ? 0.05 : 0.07 });
      const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
      (green ? B.gravel : B.paving).add(g);
    } else if (r.type === 'track') {
      const g = ribbon(r.pts, r.w, { step: 3, vScale: 5, yFn: yF, yOff: 0.04 }); B.gravel.add(g);
    }
    // beirarrúas e bordos
    if (r.type === 'car' && r.sw > 0 && !r.bridge) {
      const t0 = juncAt(r, 0).length > 1 ? endTrim(r, 0) : 0, t1 = juncAt(r, 1).length > 1 ? endTrim(r, 1) : 0;
      const line = trimLine(r.pts, t0, t1); if (!line) continue;
      for (const side of [-1, 1]) {
        const sl = offsetLine(line, side * (r.hw + r.sw / 2));
        const g = ribbon(sl, r.sw, { step: 2, vScale: 3, yFn: (x, z) => terrainH(x, z), yOff: 0.16 });
        const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 3, p.getZ(i) / 3);
        B.sidewalk.add(g);
        const cl = offsetLine(line, side * (r.hw + 0.02));
        B.curb.add(wallStrip(cl, -0.05, 0.16, (x, z) => terrainH(x, z)));
      }
    }
  }
  // cruces: parche de asfalto (tapa as liñas) e pasos de peóns
  const crosswalkTex = (() => { const c = cnv(256, 64), x = c.getContext('2d'); x.clearRect(0, 0, 256, 64); x.fillStyle = 'rgba(240,240,232,.92)'; for (let i = 0; i < 8; i++) x.fillRect(i * 32 + 6, 4, 18, 56); return toTex(c, false); })();
  const cwB = new Batch(std({ map: crosswalkTex, transparent: true, roughness: .7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), { cast: false });
  for (const [k, list] of JUNC) {
    const cars = list.filter(o => o.r.type === 'car');
    if (cars.length < 2) continue;
    const p = cars[0].end ? cars[0].r.pts[cars[0].r.pts.length - 1] : cars[0].r.pts[0];
    let mh = 0; for (const o of cars) mh = Math.max(mh, o.r.hw);
    if (cars.length >= 3 || cars.some(o => o.r.w >= 7.5)) {
      const disc = new THREE.CircleGeometry(mh + 0.4, 20); disc.rotateX(-Math.PI / 2);
      const dp = disc.attributes.position, du = disc.attributes.uv;
      for (let i = 0; i < dp.count; i++) { const x = dp.getX(i) + p[0], z = dp.getZ(i) + p[1]; dp.setXYZ(i, x, surfY(x, z) + 0.075, z); du.setXY(i, x / 12, z / 12); }
      disc.computeVertexNormals(); B.asphalt.add(disc);
    }
    if (cars.length >= 3) for (const o of cars) {
      const r = o.r; if (!r.urban || r.w < 6 || r.cls === 'service' || r.bridge) continue;
      const tr = endTrim(r, o.end) + 1.8; if (r.len < tr + 6) continue;
      const q = roadPoint(r, o.end ? r.len - tr : tr);
      const cw = new THREE.PlaneGeometry(r.w - 1, 3); cw.rotateX(-Math.PI / 2); cw.rotateY(Math.atan2(q.ux, q.uz));
      xform(cw, q.x, surfY(q.x, q.z) + (r.major ? 0.085 : 0.075), q.z); cwB.add(cw);
    }
  }
  cwB.build(G.scene);
}

/* ---------- Río (ancho real variable) ---------- */
function buildRiverOSM(scene) {
  const P = [], U = [], I = [];
  // reamostraxe cada 5 m
  const S = [];
  for (let i = 0; i < RIVER.length - 1; i++) { const a = RIVER[i], b = RIVER[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 5)); for (let k = 0; k < n; k++) S.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n), lerp(RIVER_W[i], RIVER_W[i + 1], k / n)]); }
  S.push([...RIVER[RIVER.length - 1], RIVER_W[RIVER_W.length - 1]]);
  for (let i = 0; i < S.length; i++) {
    const p = S[i], a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const w = p[2] - 1.0;
    for (const s of [-1, 1]) { const x = p[0] - tz * w * s, z = p[1] + tx * w * s; P.push(x, -1.05, z); U.push(x / 22, z / 22); }
    if (i) { const o = (i - 1) * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  const m = new THREE.Mesh(g, MAT.water); m.receiveShadow = true; scene.add(m); G.water = m;
}

/* ---------- Áreas: parques, céspede, prazas, aparcadoiros, campos ---------- */
function pitchTex(L, W, color = '#3f8a3a') {
  const c = cnv(512, 320), x = c.getContext('2d');
  for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? color : '#4a9a42'; x.fillRect(i * 512 / 12, 0, 512 / 12 + 1, 320); }
  x.strokeStyle = 'rgba(244,244,238,.9)'; x.lineWidth = 3; const sx = 512 / L, sz = 320 / W, m = 1.5;
  x.strokeRect(m * sx, m * sz, (L - 2 * m) * sx, (W - 2 * m) * sz); x.beginPath(); x.moveTo(256, m * sz); x.lineTo(256, 320 - m * sz); x.stroke();
  x.beginPath(); x.arc(256, 160, Math.min(9, W / 6) * sx, 0, 7); x.stroke();
  const pa = Math.min(16, L / 6), pw = Math.min(40, W * 0.6);
  x.strokeRect(m * sx, 160 - pw / 2 * sz, pa * sx, pw * sz); x.strokeRect(512 - (m + pa) * sx, 160 - pw / 2 * sz, pa * sx, pw * sz);
  return toTex(c, false);
}
function buildAreasOSM(B, scene) {
  for (const a of AREAS) {
    const P = a.p; if (P.length < 3) continue;
    const bb = polyBox(P), cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2;
    if (a.skip) continue;
    switch (a.t) {
      case 'park': case 'grass': case 'cemetery': case 'play':
        fillPoly(P, B.park, { step: 5, yOff: a.t === 'play' ? 0.05 : 0.035, uv: 10, skip: (x, z) => !!inStreet(x, z, 0.3) || (a.t !== 'play' && AREAS.some(o => o !== a && (o.t === 'pitch' || o.t === 'parking' || o.t === 'plaza') && inPoly(x, z, o.p))) });
        if (a.t !== 'play' && a.t !== 'cemetery' && polyArea(P) > 400) reserve(P, a.n || null);
        if (a.t === 'play') { reserve(P); const r = minRect(P); buildPlayground(B, r.cx, r.cz, -r.ang); }
        break;
      case 'plaza': {
        fillPoly(P, B.cobble, { step: 4, yOff: 0.06, uv: 4 }); reserve(P, a.n || null); break;
      }
      case 'parking': {
        fillPoly(P, B.asphRoad, { step: 4, yOff: 0.05, uv: 12, skip: (x, z) => !!inRoad(x, z, 0.2) }); reserve(P);
        // prazas: filas ao longo do eixo longo
        const r = minRect(P), c = Math.cos(r.ang), s = Math.sin(r.ang);
        if (r.w > 12 && r.d > 10) {
          const rows = Math.floor((r.d - 2) / 5.5);
          for (let j = 0; j < rows; j++) for (let u = -r.w / 2 + 2; u < r.w / 2 - 2; u += 2.6) {
            const v = -r.d / 2 + 3 + j * 5.5, x = r.cx + u * c - v * s, z = r.cz + u * s + v * c;
            if (!inPoly(x, z, P) || inRoad(x, z, 0.5)) continue;
            if (R() < 0.6) G.parking.push({ x, z, yaw: -r.ang + (j % 2 ? Math.PI : 0) });
            const ln = new THREE.PlaneGeometry(0.1, 4.8); ln.rotateX(-Math.PI / 2); ln.rotateY(-r.ang); xform(ln, x + 1.3 * c, terrainH(x, z) + 0.07, z + 1.3 * s); B.white.add(ln);
          }
        }
        break;
      }
      case 'pitch': {
        const r = minRect(P); if (r.w < 8 || r.d < 6) break;
        const L = Math.max(r.w, r.d), W = Math.min(r.w, r.d), ang = r.w >= r.d ? r.ang : r.ang + Math.PI / 2;
        const sport = a.sp || 'soccer';
        const col = sport === 'tennis' ? '#2f6aa3' : sport === 'basketball' ? '#a8553a' : sport === 'soccer' ? '#3f8a3a' : '#4f7f5f';
        const m = new THREE.Mesh(new THREE.PlaneGeometry(L, W), new THREE.MeshStandardMaterial({ map: pitchTex(L, W, col), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
        m.rotation.set(-Math.PI / 2, 0, -ang); m.position.set(r.cx, terrainH(r.cx, r.cz) + 0.06, r.cz); m.receiveShadow = true; scene.add(m);
        reserve(P, a.n || null);
        if (sport === 'soccer' && L > 30) for (const sg of [-1, 1]) {
          const gx = r.cx + Math.cos(ang) * sg * (L / 2 - 1.5), gz = r.cz + Math.sin(ang) * sg * (L / 2 - 1.5), gw = Math.min(7.32, W * 0.2);
          for (const k of [-1, 1]) { const px = gx - Math.sin(ang) * k * gw / 2, pz = gz + Math.cos(ang) * k * gw / 2, p = new THREE.CylinderGeometry(0.06, 0.06, 2.44, 8); xform(p, px, 1.22, pz); B.white.add(p); addCircCol(px, pz, 0.12, 2.5, 'poste'); }
          const bar = new THREE.CylinderGeometry(0.06, 0.06, gw, 8); bar.rotateX(Math.PI / 2); xform(bar, gx, 2.44, gz, -ang); B.white.add(bar);
        }
        break;
      }
      case 'wood': fillPoly(P, B.park, { step: 6, yOff: 0.03, uv: 10 }); for (let i = 0; i < polyArea(P) / 120; i++) { const x = RR(bb.x0, bb.x1), z = RR(bb.z0, bb.z1); if (inPoly(x, z, P) && !inStreet(x, z, 1)) G.extraTrees.push([x, z, RR(0.9, 1.3)]); } break;
    }
  }
}
function buildPlayground(B, cx, cz, rot) {
  const c = Math.cos(rot), s = Math.sin(rot), P = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
  for (let i = 0; i < 2; i++) for (const [ox, oz] of [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]]) { const [x, z] = P(ox + i * 4 - 4, oz * 0.4); const l = boxGeo(0.08, 2.5, 0.08); xform(l, x, 1.2, z, rot, oz * 0.3); B.vcol.add(colorize(l, '#d23b2a')); }
  const [sx, sz] = P(4, 0); const slide = boxGeo(0.7, 0.08, 3.5); xform(slide, sx, 1.1, sz, rot, 0.55); B.vcol.add(colorize(slide, '#f0b323'));
  const [tx, tz] = P(4, -2); const tower = boxGeo(1.4, 2, 1.4); xform(tower, tx, 1, tz, rot); B.vcol.add(colorize(tower, '#2f8a4b')); addCircCol(tx, tz, 1, 2);
}

/* ---------- Edificios de OSM (planta real) ---------- */
const OSM_SKIP = new Set(['Castelo de Monforte de Lemos', 'Igrexa de San Vicente do Pino', 'Torre da Homenaxe', 'Torre Pequena', 'Colexio da Nosa Señora da Antiga', 'Convento das Clarisas', 'Monforte de Lemos', 'Colexio Privado Ferroviario', 'Edificio Multiúsos de Monforte de Lemos']);
/* ---------- usos: texturas de nave industrial e de alpendre agrario ---------- */
function useTextures() {
  if (TEX.nave) return;
  const mk = (draw) => { const c = cnv(256, 256), x = c.getContext('2d'); draw(x); return toTex(c); };
  TEX.nave = mk(x => { x.fillStyle = '#9aa2a8'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 256; i += 8) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(i, 0, 2, 256); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(i + 3, 0, 2, 256); }
    x.fillStyle = '#5a6a78'; x.fillRect(0, 0, 256, 18); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(110,70,40,${RR(0.02, 0.08)})`; x.fillRect(R() * 256, 180 + R() * 76, 3, 3); }
    x.fillStyle = '#c8ccd0'; x.fillRect(150, 120, 90, 136); for (let k = 124; k < 256; k += 9) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(150, k, 90, 2); } x.fillStyle = '#e8e000'; x.fillRect(150, 118, 90, 4); });
  // planta baixa de vivenda: zócalo de granito e unha xanela pequena con reixa (tesela de 4 × 3,6 m)
  TEX.baixo = mk(x => { x.fillStyle = '#8f897d'; x.fillRect(0, 0, 256, 256);
    for (let r = 0, k = 0; r < 256; r += 32, k++) for (let c = -(k % 2) * 40; c < 256; c += 80) { const v = RI(-12, 12); x.fillStyle = `rgb(${150 + v},${144 + v},${132 + v})`; x.fillRect(c + 2, r + 2, 76, 28); x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(c + 2, r + 26, 76, 4); }
    x.fillStyle = '#6f6a60'; x.fillRect(0, 0, 256, 10);                       // imposta
    x.fillStyle = '#d8d2c4'; x.fillRect(84, 54, 88, 92);                      // cerco de pedra
    x.fillStyle = '#26303a'; x.fillRect(94, 62, 68, 76);                      // vidro
    x.fillStyle = 'rgba(160,190,210,.25)'; x.fillRect(96, 64, 30, 34);
    x.fillStyle = '#1c1c1c'; for (let k = 100; k < 162; k += 10) x.fillRect(k, 62, 3, 76); x.fillRect(94, 98, 68, 3); // reixa
    x.fillStyle = '#c9c2b2'; x.fillRect(80, 146, 96, 8); });
  // portais: catro portas de madeira/metal nun atlas (cada unha 1,4 × 2,6 m)
  TEX.portas = (() => { const c = cnv(256, 128), x = c.getContext('2d');
    const cols = [['#5b3a22', '#3e2715'], ['#7a2f22', '#521d14'], ['#2f3b46', '#1d252c'], ['#6e5a3a', '#4b3c25']];
    cols.forEach(([a, b], i) => { const ox = i * 64;
      x.fillStyle = '#d6cfbf'; x.fillRect(ox, 0, 64, 128);                     // cerco de granito
      x.fillStyle = a; x.fillRect(ox + 7, 10, 50, 118);
      x.fillStyle = b; for (const [yy, hh] of [[16, 40], [62, 58]]) { x.fillRect(ox + 12, yy, 18, hh); x.fillRect(ox + 34, yy, 18, hh); }
      x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(ox + 7, 10, 2, 118);
      x.fillStyle = '#c9a54a'; x.fillRect(ox + 46, 70, 4, 6);                  // manilla
      x.fillStyle = '#e8e2d2'; x.fillRect(ox + 26, 2, 12, 7); x.fillStyle = '#334'; x.fillRect(ox + 30, 4, 4, 3); // número
      if (i % 2) { x.fillStyle = 'rgba(30,45,60,.85)'; x.fillRect(ox + 14, 16, 36, 22); } });                 // montante de vidro
    return toTex(c, false); })();
  TEX.alpendre = mk(x => { x.fillStyle = '#8a8070'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 256; r += 22) for (let k = -20 + (r / 22 % 2) * 20; k < 256; k += 40) { const v = RI(-14, 14); x.fillStyle = `rgb(${135 + v},${125 + v},${110 + v})`; x.fillRect(k + 2, r + 2, 36, 18); }
    x.fillStyle = '#5a3a20'; x.fillRect(90, 130, 80, 126); for (let k = 92; k < 170; k += 12) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(k, 130, 2, 126); } });
}
const POI_LABEL = { pharmacy: 'FARMACIA', chemist: 'DROGARÍA', bakery: 'PANADARÍA', cafe: 'CAFETARÍA', bar: 'BAR', pub: 'PUB', restaurant: 'RESTAURANTE', fast_food: 'COMIDA RÁPIDA', supermarket: 'SUPERMERCADO', hairdresser: 'PERRUQUERÍA', butcher: 'CARNICERÍA', greengrocer: 'FROITERÍA', bank: 'BANCO', books: 'LIBRARÍA', clothes: 'MODA', shoes: 'ZAPATARÍA', optician: 'ÓPTICA', florist: 'FLORISTERÍA', hardware: 'FERRETERÍA', confectionery: 'PASTELARÍA', stationery: 'PAPELARÍA', laundry: 'LAVANDARÍA', dentist: 'CLÍNICA DENTAL', tattoo: 'TATTOO', deli: 'ULTRAMARINOS', variety_store: 'BAZAR', computer: 'INFORMÁTICA', copyshop: 'COPISTERÍA', furniture: 'MOBLES', second_hand: 'SEGUNDA MAN', motorcycle: 'MOTOS', bicycle: 'BICICLETAS', car_parts: 'RECAMBIOS', fitness_centre: 'XIMNASIO', kiosk: 'QUIOSCO', car: 'CONCESIONARIO', car_repair: 'TALLER', convenience: 'ALIMENTACIÓN', association: 'ASOCIACIÓN', employment_agency: 'AXENCIA DE EMPREGO', advertising_agency: 'PUBLICIDADE', it: 'INFORMÁTICA', key_cutter: 'CHAVES', shoemaker: 'ZAPATEIRO', winery: 'ADEGA', post_office: 'CORREOS', doors: 'PORTAS', doityourself: 'BRICOLAXE', clinic: 'CLÍNICA', ticket: 'BILLETES', funeral_directors: 'FUNERARIA', music_school: 'ESCOLA DE MÚSICA', cinema: 'CINE', ice_cream: 'XEADOS', veterinary: 'VETERINARIO', doctors: 'CONSULTA MÉDICA', insurance: 'SEGUROS', estate_agent: 'INMOBILIARIA', lawyer: 'AVOGADOS', jewelry: 'XOIARÍA', gift: 'AGASALLOS', beauty: 'ESTÉTICA', mobile_phone: 'TELEFONÍA', electronics: 'ELECTRÓNICA', pet: 'MASCOTAS', toys: 'XOGUETES', sports: 'DEPORTES', travel_agency: 'VIAXES', photo: 'FOTOGRAFÍA', wine: 'VIÑOS', alcohol: 'BEBIDAS', seafood: 'PESCADARÍA', tobacco: 'ESTANCO', lottery: 'LOTARÍAS', newsagent: 'PRENSA' };
/* categorías de baixo comercial: cada unha co seu escaparate, en versión tradicional (edificio vello) ou moderna */
const SHOP_CAT = t => /^(cafe|bar|pub|restaurant|fast_food|ice_cream|winery)$/.test(t) ? 'bar' : /^(greengrocer|butcher|bakery|confectionery|deli|convenience|supermarket|seafood|wine|alcohol)$/.test(t) ? 'comida'
  : /^(pharmacy|chemist|optician|dentist|clinic|doctors|veterinary)$/.test(t) ? 'saude' : /^(bank|association|employment_agency|advertising_agency|it|post_office|insurance|estate_agent|lawyer|travel_agency|music_school)$/.test(t) ? 'oficina'
  : /^(clothes|shoes|hairdresser|tattoo|florist|jewelry|gift|beauty|shoemaker|toys|sports|mobile_phone|photo)$/.test(t) ? 'moda' : /^(car|motorcycle|car_repair|car_parts|bicycle|hardware|doors|doityourself|furniture|key_cutter)$/.test(t) ? 'taller' : 'tenda';
function shopFrontTex(cat, old) {
  const W = 512, H = 192, c = cnv(W, H), x = c.getContext('2d'), e = cnv(W, H), ex = e.getContext('2d'); ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  const frame = old ? '#b3ab9b' : '#3a3d42', wood = old ? '#5a3a22' : '#26292d';
  x.fillStyle = old ? '#a8a091' : '#d6d3cc'; x.fillRect(0, 0, W, H); noiseFill(x, W, H, 0, old ? 18 : 8);
  for (let i = 0; i < 2; i++) {
    const X = i * W / 2 + 14, w = W / 2 - 28;
    x.fillStyle = frame; x.fillRect(X - 8, 18, w + 16, H - 18);
    if (old) { x.fillStyle = 'rgba(0,0,0,.12)'; for (let k = 18; k < H; k += 22) x.fillRect(X - 8, k, 8, 2); for (let k = 18; k < H; k += 22) x.fillRect(X + w, k, 8, 2); }
    if (cat === 'taller') { // persiana metálica e porta pequena
      x.fillStyle = '#8e9296'; x.fillRect(X, 30, w * 0.7, H - 30); for (let k = 30; k < H; k += 6) { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(X, k, w * 0.7, 2); }
      x.fillStyle = '#20262b'; x.fillRect(X, 120, w * 0.7, H - 120); ex.fillStyle = 'rgba(255,230,190,.5)'; ex.fillRect(X, 124, w * 0.7, H - 126);
      x.fillStyle = wood; x.fillRect(X + w * 0.74, 50, w * 0.26, H - 50); x.fillStyle = 'rgba(90,110,125,.8)'; x.fillRect(X + w * 0.78, 60, w * 0.18, 50);
      continue;
    }
    const gl = x.createLinearGradient(X, 34, X + w, H); const tint = { bar: ['#3a2a1e', '#6b4a2c'], comida: ['#2c3a2a', '#5a6a4a'], saude: ['#dfe9e6', '#f4f8f6'], oficina: ['#2b3640', '#6f8594'], moda: ['#2a2a30', '#7d7a80'], tenda: ['#27323a', '#5f7381'] }[cat];
    gl.addColorStop(0, tint[0]); gl.addColorStop(0.5, tint[1]); gl.addColorStop(1, '#1d2328'); x.fillStyle = gl; x.fillRect(X, 34, w, H - 34);
    // carpintería: madeira con cuarteiróns (vello) ou aluminio con vidro grande (moderno)
    x.fillStyle = wood; x.fillRect(X, 34, w, 5); x.fillRect(X + w * 0.66, 34, 5, H - 34); x.fillRect(X, H - 26, w * 0.66, 26);
    if (old) for (let k = 1; k < 3; k++) x.fillRect(X + k * w * 0.22, 34, 3, H - 60); else x.fillRect(X + w * 0.33, 34, 3, H - 60);
    if (cat === 'comida') { for (let k = 0; k < 10; k++) { x.fillStyle = pick(['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#8e44ad']); x.beginPath(); x.arc(X + 14 + k * w * 0.06, H - 34, 7, 0, 7); x.fill(); }
      for (let k = 0; k < w; k += 20) { x.fillStyle = k / 20 % 2 ? '#f4f2ea' : (old ? '#2e6b3a' : '#c0392b'); x.fillRect(X + k, 22, 20, 18); } }
    if (cat === 'bar') { x.fillStyle = 'rgba(255,190,110,.35)'; x.fillRect(X, 40, w * 0.66, H - 66); x.fillStyle = '#2a1d14'; x.fillRect(X + 10, 120, w * 0.6, 24); for (let k = 0; k < 6; k++) { x.fillStyle = pick(['#7a1f3d', '#355f2e', '#c7a14a']); x.fillRect(X + 20 + k * 26, 74, 8, 22); } }
    if (cat === 'saude') { x.fillStyle = '#e8eeec'; for (let k = 0; k < 4; k++) x.fillRect(X + 10, 60 + k * 26, w * 0.55, 4); x.fillStyle = '#18a050'; x.fillRect(X + w * 0.3, 44, 18, 6); x.fillRect(X + w * 0.3 + 6, 38, 6, 18); ex.fillStyle = 'rgba(80,255,140,.9)'; ex.fillRect(X + w * 0.3, 38, 18, 18); }
    if (cat === 'moda') for (let k = 0; k < 3; k++) { const mx = X + 26 + k * w * 0.18; x.fillStyle = pick(['#c0392b', '#2c3e50', '#d4a017', '#7d3c98', '#e8e4dc']); x.fillRect(mx - 9, 70, 18, 46); x.fillStyle = '#d8c0a8'; x.beginPath(); x.arc(mx, 60, 7, 0, 7); x.fill(); x.fillStyle = '#333'; x.fillRect(mx - 1, 116, 2, 30); }
    if (cat === 'oficina') { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(X + 8, 70, w * 0.5, 10); x.fillStyle = '#6f8594'; x.fillRect(X + 8, 100, w * 0.25, 40); }
    if (cat === 'tenda') for (let k = 0; k < 4; k++) { x.fillStyle = pick(['#c7a14a', '#5d6d7e', '#a04030', '#e8e4dc']); x.fillRect(X + 12 + k * 30, 110 - RI(0, 30), 22, 34); }
    const lit = cat === 'bar' ? 'rgba(255,170,90,.95)' : cat === 'saude' ? 'rgba(235,255,245,.95)' : `rgba(255,${220 + RI(0, 30)},${180 + RI(0, 60)},.8)`;
    ex.fillStyle = lit; ex.fillRect(X + 2, 40, w * 0.64, H - 66);
    // franxa do rótulo (o nome vai no letreiro aparte)
    x.fillStyle = { bar: '#6b2c1c', comida: '#2e6b3a', saude: '#18a050', oficina: '#24425e', moda: '#1c1c1e', tenda: pick(['#7a1f3d', '#8a5a1c', '#1e5f66']) }[cat]; x.fillRect(X - 8, 2, w + 16, 20);
  }
  return { map: toTex(c), emissive: toTex(e) };
}
const POI_BAR = new Set(['cafe', 'bar', 'pub', 'restaurant', 'fast_food']);
const SHOP_STREETS = new Set(['Rúa do Doutor Casares', 'Rúa do Cardeal Rodrigo de Castro', 'Rúa do Comercio', 'Rúa de Ourense', 'Rúa de Chantada', 'Rúa de Roberto Baamonde', 'Rúa de Concepción Arenal', 'Rúa de Abelardo Baanante', 'Rúa da Duquesa de Alba', 'Rúa de Leopoldo Calvo Sotelo', 'Rúa de Curros Enríquez', 'Rúa da Coruña', 'Rúa de San Pedro', 'Rúa de Pontevedra', 'Rúa de Ricardo Quiroga', 'Rúa Zapaterías', 'Rúa de Santo Domingo', 'Rúa Pescaderías', 'Rúa Bailén', 'Rúa Teceláns', 'Rúa do Burato', 'Praza de España', 'Rúa de Armando Cotarelo']);
function buildOSMBuildings(B, F) {
  useTextures();
  const BN = new Batch(nightMat(std({ map: TEX.nave, roughness: 0.6, metalness: 0.3 }), 0, 0)), BA = new Batch(std({ map: TEX.alpendre, roughness: 0.95 }));
  const SBT = new Map(), shopBatch = (cat, old) => { const k = cat + (old ? 'V' : 'M'); let b = SBT.get(k); if (!b) { const T = shopFrontTex(cat, old); b = new Batch(nightMat(std({ map: T.map, emissiveMap: T.emissive, emissive: 0xffffff, roughness: 0.6 }), cat === 'bar' ? 0.35 : 0.05, cat === 'bar' ? 1.3 : 1.1)); SBT.set(k, b); } return b; };
  const BB = new Batch(std({ map: TEX.baixo, roughness: 0.9 })), BD = new Batch(std({ map: TEX.portas, roughness: 0.7 }));
  G.useStats_portas = 0;
  // números de portal (enderezos.js): índice espacial e atlas de placas
  const ADR = [], AG = new Map(), akey = (x, z) => Math.floor(x / 20) + ',' + Math.floor(z / 20);
  if (typeof ENDEREZOS !== 'undefined') for (const [x, z, n, si, e] of ENDEREZOS.a) { const o = { x: x / 10, z: z / 10, n, s: ENDEREZOS.r[si], e, used: false }; ADR.push(o); const k = akey(o.x, o.z); let l = AG.get(k); if (!l) AG.set(k, l = []); l.push(o); }
  G.addrGrid = AG; G.addrKey = akey;
  const labels = [...new Set(ADR.map(o => o.n))], LBI = new Map(labels.map((l, i) => [l, i]));
  const PCOLS = 16, prow = Math.ceil(Math.max(1, labels.length) / PCOLS), PH = 1 << Math.ceil(Math.log2(Math.max(32, prow * 32)));
  const pc = cnv(1024, PH), px = pc.getContext('2d');
  labels.forEach((l, i) => { const ox = (i % PCOLS) * 64, oy = Math.floor(i / PCOLS) * 32;
    px.fillStyle = '#f2f2ee'; px.fillRect(ox + 1, oy + 1, 62, 30); px.fillStyle = '#1f4f8f'; px.fillRect(ox + 4, oy + 4, 56, 24);
    px.fillStyle = '#fff'; px.font = `bold ${l.length > 3 ? 15 : 20}px Arial`; px.textAlign = 'center'; px.textBaseline = 'middle'; px.fillText(l, ox + 32, oy + 17); });
  const plateTex = toTex(pc, false); const BP = new Batch(nightMat(std({ map: plateTex, emissiveMap: plateTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.4 }), 0, 0.25));
  const plateUV = l => { const i = LBI.get(l), ox = (i % PCOLS) * 64, oy = Math.floor(i / PCOLS) * 32; return [ox / 1024, (ox + 64) / 1024, 1 - (oy + 32) / PH, 1 - oy / PH]; };
  const addrNear = (x0, z0, x1, z1) => { const out = []; for (let gx = Math.floor(x0 / 20); gx <= Math.floor(x1 / 20); gx++) for (let gz = Math.floor(z0 / 20); gz <= Math.floor(z1 / 20); gz++) for (const o of AG.get(gx + ',' + gz) || []) if (!o.used && o.x > x0 && o.x < x1 && o.z > z0 && o.z < z1) out.push(o); return out; };
  G.useStats_numeros = 0;
  // todos os comercios de OpenStreetMap (comercios.js); se teñen rúa e número, vanse ao portal do Catastro
  const shopPois = (typeof COMERCIOS !== 'undefined' ? COMERCIOS.map(([t, n, x, z, st, num]) => ({ t, n, p: [x, z], st, num })) : OSM.pois).filter(q => POI_LABEL[q.t]);
  if (typeof ENDEREZOS !== 'undefined') for (const q of shopPois) if (q.st && q.num) { const si = ENDEREZOS.r.indexOf(q.st); if (si < 0) continue; for (const [x, z, n, s2] of ENDEREZOS.a) if (s2 === si && n === q.num) { q.p = [x / 10, z / 10]; break; } }
  G.useStats_poisTot = shopPois.length;
  G.useStats = { shop: 0, bar: 0, poi: 0, nave: 0, alpendre: 0, oficina: 0, publico: 0 };
  const signs = [];
  // cada tenda de OSM vai a un só edificio: o que a contén ou o de parede máis próxima
  const poiOf = new Map(), segD = (x, z, a, c) => { const dx = c[0] - a[0], dz = c[1] - a[1], L2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L2, 0, 1); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  // cada comercio ao edificio que o contén ou ao máis próximo; se xa está ocupado, ao veciño libre máis próximo (ata 12 m)
  for (const q of shopPois) {
    const cand = [];
    for (const b of OSM.bldgs) { if (!b.cat || b.p.length < 3) continue; const P = b.p; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } if (q.p[0] < x0 - 12 || q.p[0] > x1 + 12 || q.p[1] < z0 - 12 || q.p[1] > z1 + 12) continue;
      let d = inPoly(q.p[0], q.p[1], P) ? -1 : 1e9; if (d > 0) for (let i = 0; i < P.length; i++) d = Math.min(d, segD(q.p[0], q.p[1], P[i], P[(i + 1) % P.length])); if (d < 12) cand.push([d, b]); }
    cand.sort((u, v) => u[0] - v[0]);
    const free = cand.find(([d, b]) => !poiOf.has(b) && (b.lv || 1) >= 1 && b.use !== 3 && b.use !== 2);
    if (free) poiOf.set(free[1], q); else G.useStats_poisSen = (G.useStats_poisSen || 0) + 1;
  }
  // fachadas singulares (fachadas.js): edificio e panos que dan á rúa
  const SPEC = new Map(), SPEC_SEGS = [];
  // parede doutro edificio que coincide (paralela e a menos de 1,6 m) cunha fachada singular: non se debuxa, para que esta se vexa
  const underSpec = (b, a, c) => { const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz) || 1;
    for (const S of SPEC_SEGS) { if (S.b === b) continue; const sx = S.c[0] - S.a[0], sz = S.c[1] - S.a[1], SL = Math.hypot(sx, sz) || 1; if (Math.abs(dx * sz - dz * sx) / (L * SL) > 0.25) continue;
      const t = ((mx - S.a[0]) * sx + (mz - S.a[1]) * sz) / (SL * SL); if (t < -0.1 || t > 1.1) continue; if (Math.abs((mx - S.a[0]) * sz - (mz - S.a[1]) * sx) / SL < 1.6) return true; } return false; };
  const facingOf = (P, A2, i) => { let a = P[i], c = P[(i + 1) % P.length]; if (A2 > 0) { const t = a; a = c; c = t; } const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 2) return 0; for (const o of [3.5, 7]) { const px = (a[0] + c[0]) / 2 - dz / L * o, pz = (a[1] + c[1]) / 2 + dx / L * o; if (inStreet(px, pz, 1) || inRoad(px, pz, 1, true)) return L; } return 0; };
  const area2 = P => { let A2 = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) A2 += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return A2; };
  if (typeof FACHADAS !== 'undefined') for (const F of FACHADAS) {
    let best = null, bd = F.r || 9;
    for (const b of OSM.bldgs) {
      if (!b.p || b.p.length < 3) continue; const P = b.p;
      const [ax, az] = F.at; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      if (ax < x0 - bd || ax > x1 + bd || az < z0 - bd || az > z1 + bd) continue;
      const A2 = area2(P);
      if ((F.multi || F.inside || F.side) && inPoly(ax, az, P)) { best = { b, i: -1 }; bd = 0; break; }
      for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length], dx = c[0] - a[0], dz = c[1] - a[1], L2 = dx * dx + dz * dz; if (L2 < 4) continue;
        const t = ((ax - a[0]) * dx + (az - a[1]) * dz) / L2; if (t < -0.05 || t > 1.05) continue; const d = Math.hypot(a[0] + dx * t - ax, a[1] + dz * t - az); if (d < bd && (F.side || facingOf(P, A2, i))) { bd = d; best = { b, i }; } }
    }
    if (!best) continue;
    const b = best.b, P = b.p, A2 = area2(P), facing = i => facingOf(P, A2, i);
    let list = [];
    if (F.all) { for (let i = 0; i < P.length; i++) if (Math.hypot(P[(i + 1) % P.length][0] - P[i][0], P[(i + 1) % P.length][1] - P[i][1]) >= 2) list.push(i); }
    else if (F.side) { // medianeira cara a un rumbo (S = sur, +z)
      const want = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[F.side]; let bi = -1, bv = 0.5;
      for (let i = 0; i < P.length; i++) { let a = P[i], c = P[(i + 1) % P.length]; if (A2 > 0) { const t = a; a = c; c = t; } const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 5) continue; const v = (-dz / L) * want[0] + (dx / L) * want[1]; if (v > bv) { bv = v; bi = i; } }
      if (bi >= 0) list = [bi];
    } else if (best.i >= 0 && !F.multi) list = [best.i];
    else { const all = P.map((_, i) => [i, facing(i)]).filter(q => q[1] > 0); if (F.multi) list = all.map(q => q[0]); else if (all.length) list = [all.sort((u, v) => v[1] - u[1])[0][0]]; }
    if (!list.length) { // sen rúa diante: a parede máis próxima a unha rúa
      let bi = -1, bdd = 1e9; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 3) continue; const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, nr = nearRoad(mx, mz, r => r.type === 'car'); if (nr.r && nr.d < bdd) { bdd = nr.d; bi = i; } }
      if (bi >= 0) list = [bi]; }
    if (!list.length) continue;
    const taken = SPEC.get(b); if (taken) list = list.filter(i => !taken.has(i)); if (!list.length) continue;
    const ord = A2 > 0 ? list.slice().sort((u, v) => v - u) : list.slice().sort((u, v) => u - v);
    const lens = ord.map(i => Math.hypot(P[(i + 1) % P.length][0] - P[i][0], P[(i + 1) % P.length][1] - P[i][1])), Lt = lens.reduce((u, v) => u + v, 0);
    const edges = taken || new Map(); let acc = 0; ord.forEach((i, k) => { edges.set(i, { F, Lt, u0: acc / Lt, u1: (acc + lens[k]) / Lt }); acc += lens[k]; });
    SPEC.set(b, edges); G.fachadasOK = (G.fachadasOK || 0) + 1; for (const i of ord) SPEC_SEGS.push({ b, a: P[i], c: P[(i + 1) % P.length] }); (G.specDbg = G.specDbg || {})[F.id] = { b, list };
  }
  for (const b of OSM.bldgs) {
    const P = b.p; if (P.length < 3) continue;
    const [cx, cz] = polyCentroid(P);
    if (OSM_SKIP.has(b.n)) continue;
    if (Math.hypot(cx - HILL.x, cz - HILL.z) < HILL.r0 + 3) continue;
    if (b.cat) {
      // edificios do Catastro: só se omiten se pisan un edificio feito a man (ou nas zonas que deben quedar baleiras)
      if ((G.keepEmpty || []).some(q => inPoly(cx, cz, q))) continue;
      const forced = SPEC.has(b) && [...SPEC.get(b).values()].some(e => e.F.force);
      if (!forced && customCover(P) > 0.25) continue;
    } else if (reservedAt(cx, cz) || G.monumentZones.some(q => inPoly(cx, cz, q))) continue;
    if (b.b === 'roof' || b.b === 'ruins') continue;
    const lv = b.lv || (b.b === 'church' || b.b === 'chapel' ? 3 : b.b === 'industrial' || b.b === 'retail' ? 2 : b.b === 'apartments' ? 5 : 3);
    let H = b.h || (b.b === 'church' ? 14 : 3.6 + Math.max(0, lv - 1) * 3.1);
    if (b.mh) { const tol = Math.max(2.5, H * 0.25); H = clamp(b.mh, H - tol, H + tol); } // altura medida co LiDAR
    let y0 = 1e9; for (const [x, z] of P) y0 = Math.min(y0, terrainH(x, z)); y0 = Math.max(0, y0);
    // aspecto segundo o uso
    const use = b.use || (b.b === 'industrial' ? 3 : 0);
    const nave = use === 3 || (use === 0 && b.b === 'industrial'), alpendre = use === 2;
    let style = b.b === 'church' || b.b === 'chapel' || b.a === 'manor' || (b.y && b.y < 1930) ? 3 : nave ? 5 : RI(0, 6);
    if (use === 4) style = 5;                        // oficinas: fachada moderna
    if (use === 6) style = b.y && b.y < 1970 ? 3 : 1; // servizos públicos: pedra ou crema
    const LOOK = { colegio: B.colegio, pedra: B.stone, moderno: F[5], estacion: B.station };
    if (b.look === 'moderno') style = 5;
    const wallBatch = b.look && LOOK[b.look] ? LOOK[b.look] : b.b === 'church' || b.b === 'chapel' ? B.stone : nave ? BN : alpendre ? BA : F[style];
    if (nave) G.useStats.nave++; if (alpendre) G.useStats.alpendre++; if (use === 4) G.useStats.oficina++; if (use === 6) G.useStats.publico++;
    // baixos comerciais: comercio do Catastro, tendas de OSM ou rúas comerciais
    const poi = !nave && !alpendre ? poiOf.get(b) || null : null;
    let shopMode = null;
    if (b.look) shopMode = null; // edificio singular: sen baixos comerciais
    else if (poi) shopMode = SHOP_CAT(poi.t);
    else if (use === 4) shopMode = 'oficina';
    else if (use === 5) shopMode = 'tenda';
    else if (b.cat && use === 1 && lv >= 3) { const h = (Math.abs(Math.sin(cx * 12.9898 + cz * 78.233)) * 43758.5453) % 1; if (h < 0.8) shopMode = h < 0.12 ? 'bar' : h < 0.24 ? 'comida' : h < 0.34 ? 'moda' : h < 0.4 ? 'saude' : h < 0.46 ? 'taller' : 'tenda'; }
    const shopOld = (b.y && b.y < 1950) || style === 3;
    // paredes, aresta a aresta (as que dan á rúa levan baixo comercial)
    let A2 = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) A2 += P[j][0] * P[i][1] - P[i][0] * P[j][1];
    // relevo: o edificio queda ríxido (horizontal) á altura do seu centro; as paredes baixan ata o chan polo lado de embaixo
    let drop = 0; if (typeof relW === 'function') { const wc = relW(cx, cz); for (const [x, z] of P) drop = Math.max(drop, wc - relW(x, z)); }
    const yb = y0 - 2 - drop;
    const geo = { wall: { pos: [], uv: [], idx: [] }, shop: { pos: [], uv: [], idx: [] }, bar: { pos: [], uv: [], idx: [] }, baixo: { pos: [], uv: [], idx: [] }, door: { pos: [], uv: [], idx: [] }, plate: { pos: [], uv: [], idx: [] }, spec: { pos: [], uv: [], idx: [] } };
    const spB = SPEC.get(b), specG = new Map();
    const quad = (g, a, c, yA, yB, u0, u1, vA, vB) => { const v = g.pos.length / 3; g.pos.push(a[0], yA, a[1], c[0], yA, c[1], c[0], yB, c[1], a[0], yB, a[1]); g.uv.push(u0, vA, u1, vA, u1, vB, u0, vB); g.idx.push(v, v + 1, v + 2, v, v + 2, v + 3); };
    let acc = 0, shopEdge = null, bestL = 0, signEdge = null;
    // vivendas: planta baixa de granito con portal na fachada que dá á rúa (ou na máis longa)
    const resid = !nave && !alpendre && !b.look && b.b !== 'church' && b.b !== 'chapel' && use !== 6;
    let doorI = -1;
    if (resid) { let best = -1; for (let i = 0; i < P.length; i++) { let a = P[i], c = P[(i + 1) % P.length]; if (A2 > 0) { const t = a; a = c; c = t; } const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 2.2) continue;
      const px = (a[0] + c[0]) / 2 - dz / L * 3, pz = (a[1] + c[1]) / 2 + dx / L * 3, sc = L + (inStreet(px, pz, 1) || inRoad(px, pz, 1, true) ? 1000 : 0); if (sc > best) { best = sc; doorI = i; } } }
    // portais reais do Catastro: a porta vai onde está o portal e leva o seu número
    const doors = new Map(); let parcelNum = null;
    if (resid && ADR.length) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (const o of addrNear(x0 - 4, z0 - 4, x1 + 4, z1 + 4)) {
        if (o.e) { let bd = 3, bi = -1, bt = 0;
          for (let i = 0; i < P.length; i++) { let a = P[i], c = P[(i + 1) % P.length]; if (A2 > 0) { const t = a; a = c; c = t; } const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 1.8) continue;
            const tr = ((o.x - a[0]) * dx + (o.z - a[1]) * dz) / (L * L); if (tr < -0.02 || tr > 1.02) continue; const d = Math.hypot(a[0] + dx * tr - o.x, a[1] + dz * tr - o.z); if (d < bd) { bd = d; bi = i; bt = clamp(tr, 0.9 / L, 1 - 0.9 / L); } }
          if (bi >= 0 && doors.size < 4) { o.used = true; if (!doors.has(bi)) doors.set(bi, []); doors.get(bi).push({ t: bt, n: o.n }); }
        } else if (!parcelNum && inPoly(o.x, o.z, P)) { o.used = true; parcelNum = o.n; }
      }
      if (doors.size) doorI = -1;
      else if (doorI >= 0) doors.set(doorI, [{ t: 0.5, n: parcelNum }]);
    } else if (doorI >= 0) doors.set(doorI, [{ t: 0.5, n: null }]);
    for (let i = 0; i < P.length; i++) {
      let a = P[i], c = P[(i + 1) % P.length]; if (A2 > 0) { const t = a; a = c; c = t; } // percorrido horario: a cara frontal (esquerda) mira cara a fóra
      const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.05) continue;
      const ox = -dz / L, oz = dx / L, mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2;
      if (!spB && SPEC_SEGS.length && underSpec(b, a, c)) { acc += L; continue; }
      if (spB && spB.has(i)) { const sp = spB.get(i); let sg = specG.get(sp.F); if (!sg) specG.set(sp.F, sg = { pos: [], uv: [], idx: [], Lt: sp.Lt }); quad(sg, [a[0] + ox * 0.06, a[1] + oz * 0.06], [c[0] + ox * 0.06, c[1] + oz * 0.06], yb, y0 + H, sp.u0, sp.u1, (yb - y0) / H, 1);
        (G.fachadaEdge = G.fachadaEdge || {})[sp.F.id] = { ax: a[0], az: a[1], ux: dx / L, uz: dz / L, ox, oz, L, mx, mz, door: L * 0.875 };
        acc += L; continue; }
      let street = null; if (shopMode && L >= 2.5) { const pr = poi ? 6 : 3, px = mx + ox * pr, pz = mz + oz * pr; street = inStreet(px, pz, 1) || inRoad(px, pz, 1, true); if (street && !poi && use === 1 && !SHOP_STREETS.has(street.name)) street = null; }
      const fu0 = acc / FAC_TILE[0], fu1 = (acc + L) / FAC_TILE[0];
      if (street && H > 4.5) {
        const sg = geo.shop;
        quad(sg, a, c, yb, y0 + 3.6, acc / SHOP_TILE[0], (acc + L) / SHOP_TILE[0], -2 / SHOP_TILE[1], 1);
        quad(geo.wall, a, c, y0 + 3.6, y0 + H, fu0, fu1, 0.25, (H - 3.6) / FAC_TILE[1] + 0.25);
        if (L > bestL) { bestL = L; signEdge = { a, c, ox, oz, L }; }
      } else if (resid && H > 3) {
        const gt = Math.min(3.6, H);
        quad(geo.baixo, a, c, yb, y0 + gt, acc / 4, (acc + L) / 4, (yb - y0) / 3.6, gt / 3.6);
        if (H > gt + 0.3) quad(geo.wall, a, c, y0 + gt, y0 + H, fu0, fu1, 0.25, (H - 3.6) / FAC_TILE[1] + 0.25);
        for (const dr of doors.get(i) || []) { // portal (no sitio do portal real se se coñece), lixeiramente saído, coa placa do número
          const k = Math.floor((Math.abs(Math.sin(cx * 3.7 + cz * 1.3 + dr.t * 9)) * 1000) % 4), dw = Math.min(1.4, L - 0.6) / 2, tc = clamp(dr.t * L, dw + 0.2, L - dw - 0.2), m0 = (tc - dw) / L, m1 = (tc + dw) / L;
          const pa = [a[0] + dx * m0 + ox * 0.05, a[1] + dz * m0 + oz * 0.05], pc = [a[0] + dx * m1 + ox * 0.05, a[1] + dz * m1 + oz * 0.05];
          quad(geo.door, pa, pc, y0 - 0.05, y0 + 2.6, k / 4 + 0.002, (k + 1) / 4 - 0.002, 0, 1); G.useStats_portas++;
          if (dr.n && LBI.has(dr.n)) { const [u0, u1, v0, v1] = plateUV(dr.n), q0 = (tc - 0.2) / L, q1 = (tc + 0.2) / L;
            quad(geo.plate, [a[0] + dx * q0 + ox * 0.07, a[1] + dz * q0 + oz * 0.07], [a[0] + dx * q1 + ox * 0.07, a[1] + dz * q1 + oz * 0.07], y0 + 2.68, y0 + 2.88, u0, u1, v0, v1); G.useStats_numeros++; }
        }
      } else quad(geo.wall, a, c, yb, y0 + H, fu0, fu1, (yb - y0) / FAC_TILE[1], H / FAC_TILE[1]);
      acc += L;
    }
    const toGeo = g => { const w = new THREE.BufferGeometry(); w.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3)); w.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2)); w.setIndex(g.idx); w.computeVertexNormals(); return typeof relRigid === 'function' ? relRigid(w, cx, cz) : w; };
    if (geo.wall.idx.length) wallBatch.add(toGeo(geo.wall));
    if (geo.shop.idx.length) { shopBatch(shopMode, shopOld).add(toGeo(geo.shop)); if (shopMode === 'bar') G.useStats.bar++; else G.useStats.shop++; (G.useStats.cat = G.useStats.cat || {})[shopMode] = (G.useStats.cat[shopMode] || 0) + 1; }
    if (geo.baixo.idx.length) BB.add(toGeo(geo.baixo));
    if (geo.door.idx.length) BD.add(toGeo(geo.door));
    if (geo.plate.idx.length) BP.add(toGeo(geo.plate));
    for (const [F, sg] of specG) { let map; if (F.img) { map = new THREE.TextureLoader().load(F.img); map.magFilter = THREE.NearestFilter; map.encoding = THREE.sRGBEncoding; map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; } else map = fachadaTex(F, sg.Lt, H); const m = new THREE.Mesh(toGeo(sg), std({ map, roughness: 0.8 })); m.castShadow = m.receiveShadow = true; G.scene.add(m); }
    // rótulo co nome real (tendas de OSM)
    if (poi && signEdge) { const { a, c, ox, oz, L } = signEdge; const sx = (a[0] + c[0]) / 2 + ox * 0.08, sz = (a[1] + c[1]) / 2 + oz * 0.08; signs.push({ x: sx, z: sz, y: y0 + 3.35 + (typeof relW === 'function' ? relW(cx, cz) - relW(sx, sz) : 0), yaw: Math.atan2(ox, oz), w: Math.min(L - 0.4, 4.2), text: (poi.n || POI_LABEL[poi.t]).toUpperCase().slice(0, 26), bar: POI_BAR.has(poi.t), t: poi.t }); G.useStats.poi++; }
    // tellado
    const sh = new THREE.Shape(P.map(([x, z]) => new THREE.Vector2(x, -z)));
    let hip = b.roof ? hipRoofPoly(P, b.roof, b.rise, y0 + H) : null; if (hip && typeof relRigid === 'function') relRigid(hip, cx, cz);
    if (hip) { (nave ? B.flat : b.look === 'pedra' || style === 3 && use !== 1 ? B.slate : B.tile).add(hip); G.useStats.hip = (G.useStats.hip || 0) + 1; }
    else {
    const rg = new THREE.ShapeGeometry(sh); rg.rotateX(-Math.PI / 2); rg.translate(0, y0 + H + 0.02, 0);
    const ru = rg.attributes.uv, rp = rg.attributes.position; for (let i = 0; i < ru.count; i++) ru.setXY(i, rp.getX(i) / 4, rp.getZ(i) / 4);
    if (typeof relRigid === 'function') relRigid(rg, cx, cz);
    (nave || b.b === 'industrial' || b.b === 'retail' || use === 4 || style === 5 ? B.flat : B.tile).add(rg);
    }
    const r = minRect(P);
    if (b.cat && polyArea(P) < r.w * r.d * 0.82) { // planta en L/U: colisión parede a parede para non invadir a rúa
      for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]); if (L < 0.3) continue; addOBB((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, L / 2, 0.25, -Math.atan2(c[1] - a[1], c[0] - a[0]), H + 4, 'edif', y0 - 2); }
    } else addOBB(r.cx, r.cz, r.w / 2, r.d / 2, -r.ang, H + 2, b.b === 'church' ? 'igrexa' : 'edif', y0 - 2);
    G.buildingsList.push({ cx, cz, poly: P, H, y0, name: b.n, use, shop: shopMode });
    if (b.n) G.namedZones.push({ n: b.n, p: P });
  }
  BN.build(G.scene); BA.build(G.scene); BB.build(G.scene); BD.build(G.scene); BP.build(G.scene); for (const b of SBT.values()) b.build(G.scene);
  // rótulos (unha soa textura atlas para todos)
  if (signs.length) {
    const per = 4, rows = Math.ceil(signs.length / per), cw = 1024, rh = 64, c = cnv(cw, rows * rh), x = c.getContext('2d');
    const cols = { pharmacy: ['#1f8a3a', '#ffffff'], bank: ['#1f3a8a', '#ffffff'] };
    signs.forEach((s, i) => { const X = (i % per) * 256, Y = Math.floor(i / per) * rh, [bg, fg] = cols[s.t] || (s.bar ? ['#5a1a1a', '#ffd98a'] : [pick(['#24425e', '#7a1f3d', '#2f5a3a', '#3a3a3a', '#8a5a1c']), '#f4f0e6']);
      x.fillStyle = bg; x.fillRect(X, Y, 256, rh); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(X, Y, 256, 3); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      let fs = 34; x.font = `800 ${fs}px "Barlow Condensed", sans-serif`; while (x.measureText(s.text).width > 240 && fs > 14) { fs -= 2; x.font = `800 ${fs}px "Barlow Condensed", sans-serif`; } x.fillText(s.text, X + 128, Y + rh / 2 + 2); });
    const tex = toTex(c, false), mat = nightMat(std({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 }), 0.05, 0.7);
    const pos = [], uv = [], idx = [];
    signs.forEach((s, i) => { const u0 = (i % per) / per, u1 = u0 + 1 / per, v1 = 1 - Math.floor(i / per) / rows, v0 = v1 - 1 / rows, hw = s.w / 2, rx = Math.cos(s.yaw), rz = -Math.sin(s.yaw), v = pos.length / 3;
      pos.push(s.x - rx * hw, s.y - 0.24, s.z - rz * hw, s.x + rx * hw, s.y - 0.24, s.z + rz * hw, s.x + rx * hw, s.y + 0.24, s.z + rz * hw, s.x - rx * hw, s.y + 0.24, s.z - rz * hw);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v1); idx.push(v, v + 1, v + 2, v, v + 2, v + 3); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    G.scene.add(new THREE.Mesh(g, mat));
  }
}

/* ---------- Edificios ao longo das rúas (onde OSM non ten plantas) ---------- */
const OLDTOWN = { x: -40, z: 290, r: 260 };
function buildFrontage(B, F, Q) {
  if (OSM.catastro) { G.nFrontage = 0; return; } // cos edificios do Catastro xa están todas as fachadas reais
  const density = Q === 'low' ? 0.55 : Q === 'med' ? 0.8 : 1;
  let n = 0;
  const lotOK = (cx, cz, hx, hz, rot) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    const pts = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz], [0, -hz], [0, hz], [-hx, 0], [hx, 0], [0, 0]].map(([lx, lz]) => [cx + lx * c + lz * s, cz - lx * s + lz * c]);
    let hmin = 1e9, hmax = -1e9;
    for (const [x, z] of pts) {
      if (x < MAP.minX + 5 || x > MAP.maxX - 5 || z < MAP.minZ + 5 || z > MAP.maxZ - 5) return false;
      if (inStreet(x, z, 0.3) || inRoad(x, z, 0.6, true)) return false;
      if (riverDistRaw(x, z) < RIVER_HW + 4) return false;
      if (reservedAt(x, z)) return false;
      if (Math.hypot(x - HILL.x, z - HILL.z) < HILL.r0 + 12) return false;
      const h = terrainH(x, z); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h);
    }
    if (hmax - hmin > 5) return false;
    if (G.monumentZones.some(q => pts.some(([x, z]) => inPoly(x, z, q)))) return false;
    return !obbOverlaps(cx, cz, hx, hz, rot, 0.15);
  };
  const roads = ROADS.filter(r => r.urban && (r.type === 'car' || r.type === 'ped') && !r.bridge && r.cls !== 'service' && r.len > 8);
  // as principais primeiro (fachadas continuas), logo as demais
  roads.sort((a, b) => (b.major - a.major) || (b.len - a.len));
  for (const r of roads) {
    const t0 = juncAt(r, 0).length > 1 ? endTrim(r, 0) : 0, t1 = juncAt(r, 1).length > 1 ? endTrim(r, 1) : 0;
    for (const side of [-1, 1]) {
      let s = t0 + RR(0.5, 3);
      while (s < r.len - t1 - 5) {
        const m = roadPoint(r, s), dOld = Math.hypot(m.x - OLDTOWN.x, m.z - OLDTOWN.z), old = dOld < OLDTOWN.r;
        const lw = old ? RR(6, 10) : RR(8, 15), dp = old ? RR(9, 14) : RR(11, 17);
        const p = roadPoint(r, s + lw / 2);
        const nx = -p.uz * side, nz = p.ux * side, fo = r.hw + r.sw + 0.35;
        const cx = p.x + nx * (fo + dp / 2), cz = p.z + nz * (fo + dp / 2), rot = Math.atan2(-p.uz, p.ux);
        if (R() < density && lotOK(cx, cz, lw / 2, dp / 2, rot)) {
          let floors, style;
          const station = Math.hypot(cx - 560, cz + 380) < 330;
          if (old) { floors = RI(2, 4); style = pick([3, 4, 4, 0, 1, 2]); }
          else if (r.major || station) { floors = RI(3, 6); if (R() < 0.15) floors = RI(6, 8); style = floors >= 6 ? pick([5, 1, 6, 0]) : RI(0, 6); }
          else { floors = isUrban(cx, cz) && dOld < 700 ? RI(2, 4) : RI(1, 3); style = RI(0, 6); }
          addBuildingRot(B, F, cx, cz, rot, lw, dp, { floors, style, noShop: floors <= 2 && !old && R() < 0.5 });
          n++;
          s += lw + (old ? 0 : R() < 0.25 ? RR(2, 7) : 0);
        } else s += 2;
      }
    }
  }
  G.nFrontage = n;
}

/* ---------- Vías do tren (OSM) ---------- */
function buildRailsOSM(B, scene, skipFn) {
  const sleepers = [];
  for (const rl of OSM.rails) {
    // anaco a anaco, saltando a zona da estación (as vías da estación constrúense no seu marco)
    let cur = [];
    const flush = () => {
      if (cur.length > 1) {
        const bal = ribbon(cur, 3.2, { step: 4, vScale: 4, yFn: (x, z) => Math.max(terrainH(x, z), 0), yOff: 0.12 }); B.ballast.add(bal);
        for (const s of [-1, 1]) { const l2 = offsetLine(cur, s * 0.834); B.rail.add(wallStrip(l2, 0.22, 0.36, (x, z) => Math.max(terrainH(x, z), 0))); }
        for (let i = 0; i < cur.length - 1; i++) { const a = cur[i], b = cur[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let t = 0; t < L; t += 0.9) { const x = lerp(a[0], b[0], t / L), z = lerp(a[1], b[1], t / L); if (x > MAP.minX - 300 && x < MAP.maxX + 300 && z > MAP.minZ - 300 && z < MAP.maxZ + 300) sleepers.push([x, Math.max(terrainH(x, z), 0), z, yaw]); } }
      }
      cur = [];
    };
    for (const p of rl.p) { if (skipFn(p[0], p[1])) flush(); else cur.push(p); }
    flush();
  }
  if (sleepers.length > 60000) sleepers.length = 60000;
  const sm = new THREE.InstancedMesh(boxGeo(2.6, 0.14, 0.28), MAT.concrete, sleepers.length), o = new THREE.Object3D();
  sleepers.forEach(([x, y, z, yaw], i) => { o.position.set(x, y + 0.24, z); o.rotation.set(0, yaw, 0); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); });
  sm.receiveShadow = true; scene.add(sm);
}

/* ---------- Farolas, aparcamento en liña, varandas do río ---------- */
function buildStreetProps(B, scene, Q) {
  const poles = [];
  for (const r of ROADS) {
    if (r.type !== 'car' || !r.urban || r.cls === 'service' || r.bridge) continue;
    let k = 0;
    for (let s = 8; s < r.len - 4; s += r.major ? 26 : 32, k++) {
      const side = k % 2 ? 1 : -1, p = roadPoint(r, s), nx = -p.uz * side, nz = p.ux * side, off = r.hw + (r.sw > 0 ? Math.min(0.6, r.sw * 0.3) : 0.6);
      const x = p.x + nx * off, z = p.z + nz * off;
      if (inRoad(x, z, -0.2)) continue;
      const yaw = Math.atan2(-nx, -nz), y = terrainH(x, z) + (r.sw > 0 ? 0.16 : 0);
      poles.push([x, y, z, yaw]); G.lamps.push({ x: x + Math.sin(yaw) * 1.7, y: y + 7.4, z: z + Math.cos(yaw) * 1.7 });
      addCircCol(x, z, 0.2, 7, 'farola');
    }
    // aparcamento en liña nas rúas residenciais
    if (!r.major && r.w >= 6 && r.len > 30) for (let s = 12; s < r.len - 12; s += RR(14, 40)) {
      const side = r.ow ? 1 : (R() < 0.5 ? -1 : 1), p = roadPoint(r, s), off = r.hw - 1.1;
      const x = p.x - p.uz * side * off, z = p.z + p.ux * side * off;
      if (bridgeAt(x, z) || juncAt(r, 0).length > 1 && s < 14 || juncAt(r, 1).length > 1 && s > r.len - 14) continue;
      G.parking.push({ x, z, yaw: Math.atan2(p.ux, p.uz) + (side > 0 ? Math.PI : 0) });
    }
  }
  for (const [x, z] of (G.parkLampPts || [])) { poles.push([x, terrainH(x, z), z, 0, 'park']); G.lamps.push({ x, y: terrainH(x, z) + 4, z }); }
  const pole = mergeGeos([xform(new THREE.CylinderGeometry(0.08, 0.13, 8, 8), 0, 4, 0), xform(boxGeo(0.1, 0.1, 1.8), 0, 7.85, 0.9)]);
  const head = boxGeo(0.5, 0.18, 0.9); head.translate(0, 7.75, 1.7);
  const parkPole = mergeGeos([xform(new THREE.CylinderGeometry(0.07, 0.12, 3.6, 8), 0, 1.8, 0)]);
  const parkHead = new THREE.SphereGeometry(0.32, 12, 10); parkHead.translate(0, 3.9, 0);
  const sp = poles.filter(p => !p[4]), pp = poles.filter(p => p[4]);
  const mk = (geo, mat, list, shadow) => { if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(); list.forEach(([x, y, z, yaw], i) => { o.position.set(x, y, z); o.rotation.set(0, yaw, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = shadow; scene.add(m); };
  mk(pole, MAT.metalDark, sp, true); mk(head, MAT.lampHead, sp, false); mk(parkPole, MAT.metalDark, pp, true); mk(parkHead, MAT.lampHead, pp, false);
  // varanda de madeira nas beiras urbanas do río
  const posts = [];
  for (const s of [-1, 1]) {
    let prev = null;
    for (let i = 0; i < RIVER.length - 1; i++) {
      const a = RIVER[i], b2 = RIVER[i + 1], L = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1, tx = (b2[0] - a[0]) / L, tz = (b2[1] - a[1]) / L, n = Math.ceil(L / 2.5);
      for (let k = 0; k < n; k++) {
        const f = k / n, cx = lerp(a[0], b2[0], f), cz = lerp(a[1], b2[1], f), hw = lerp(RIVER_W[i], RIVER_W[i + 1], f) + 0.8;
        const x = cx - tz * s * hw, z = cz + tx * s * hw;
        if (!isUrban(x, z) || x < MAP.minX + 4 || x > MAP.maxX - 4 || z < MAP.minZ || z > MAP.maxZ || bridgeAt(x, z) || BRIDGES.some(bb => Math.hypot(x - bb.x, z - bb.z) < bb.half + 2) || inRoad(x, z, 0.5, true) || reservedAt(x, z) && !AREAS.some(q => q.t === 'park' && inPoly(x, z, q.p))) { prev = null; continue; }
        const y = Math.max(0, terrainH(x, z));
        posts.push([x, y, z]);
        if (prev) { const L2 = Math.hypot(x - prev[0], z - prev[2]), yaw = Math.atan2(x - prev[0], z - prev[2]); if (L2 < 4) for (const h of [0.55, 1.0]) { const rl = boxGeo(0.07, 0.09, L2); xform(rl, (x + prev[0]) / 2, (y + prev[1]) / 2 + h, (z + prev[2]) / 2, yaw); B.wood.add(rl); } }
        prev = [x, y, z];
      }
    }
  }
  const pm = new THREE.InstancedMesh(boxGeo(0.12, 1.1, 0.12), MAT.wood, posts.length), o = new THREE.Object3D();
  posts.forEach(([x, y, z], i) => { o.position.set(x, y + 0.55, z); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); }); pm.castShadow = true; scene.add(pm);
}
