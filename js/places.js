'use strict';
/* ==========================================================
   GTA LEMOS 27400 · lugares e monumentos colocados no plano real
   (posicións e orientacións tiradas de OpenStreetMap)
   ========================================================== */
const LM = {}; // marcos (frames) e puntos clave
G.monumentZones = [];

function osmBldg(name) { return OSM.bldgs.find(b => b.n === name); }
function osmArea(name, t) { return AREAS.find(a => a.n === name && (!t || a.t === t)); }
function norm2(x, z) { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; }
/* une os anacos dunha rúa (mesmo nome) nunha soa polilínea */
function chainRoads(list) {
  const segs = list.map(r => r.pts.slice());
  if (!segs.length) return [];
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1.5;
  let best = [];
  for (let st = 0; st < segs.length; st++) {
    const used = new Set([st]); let line = segs[st].slice(), grow = true;
    while (grow) {
      grow = false;
      for (let i = 0; i < segs.length; i++) {
        if (used.has(i)) continue; const s = segs[i];
        if (near(line[line.length - 1], s[0])) { line = line.concat(s.slice(1)); used.add(i); grow = true; }
        else if (near(line[line.length - 1], s[s.length - 1])) { line = line.concat(s.slice(0, -1).reverse()); used.add(i); grow = true; }
        else if (near(line[0], s[s.length - 1])) { line = s.slice(0, -1).concat(line); used.add(i); grow = true; }
        else if (near(line[0], s[0])) { line = s.slice(1).reverse().concat(line); used.add(i); grow = true; }
      }
    }
    const L = polyLen(line); if (L > polyLen(best)) best = line;
  }
  return best;
}
function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
/* percorrido parametrizado dunha polilínea */
function pathOf(P) {
  const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const len = cum[cum.length - 1];
  const at = s => { s = clamp(s, 0, len); let k = 1; while (k < P.length - 1 && cum[k] < s) k++; const a = P[k - 1], b = P[k], L = (cum[k] - cum[k - 1]) || 1, t = (s - cum[k - 1]) / L; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L }; };
  return { pts: P, len, cum, at };
}
function nearestOnPath(path, x, z) { let bs = 0, bd = 1e9; for (let s = 0; s <= path.len; s += 1) { const p = path.at(s), d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; bs = s; } } return { s: bs, d: bd }; }

function computeLandmarks() {
  // --- Colexio da Compañía (Escolapios): fachada cara á praza do Campo da Compañía ---
  {
    const b = osmBldg('Colexio da Nosa Señora da Antiga'), r = minRect(b.p);
    const pl = osmArea('Campo da Compañía', 'plaza'), pc = pl ? polyCentroid(pl.p) : [r.cx + 50, r.cz];
    const ux = Math.cos(r.w >= r.d ? r.ang : r.ang + Math.PI / 2), uz = Math.sin(r.w >= r.d ? r.ang : r.ang + Math.PI / 2);
    let nx = pc[0] - r.cx, nz = pc[1] - r.cz; const k = nx * ux + nz * uz; nx -= k * ux; nz -= k * uz; [nx, nz] = norm2(nx, nz);
    // axuste á planta real do Catastro: o modelo quedaba desprazado e xirado (mellor encaixe: xiro −4,5° e desprazamento 13, 7 m)
    const th = -4.5 * Math.PI / 180, mx = -337.49, mz = 675.75, px = r.cx - mx, pz = r.cz - mz;
    LM.comp = frameAt(-35, 188, mx + px * Math.cos(th) - pz * Math.sin(th) + 13, mz + px * Math.sin(th) + pz * Math.cos(th) + 7, Math.atan2(-nx, -nz) - th);
    // antigas coordenadas de deseño (marco anterior: +70, −41)
    LM.compOld = (x, z) => LM.comp.pt(x - 70, z + 41);
    G.monumentZones.push(frameRectPoly(LM.comp, -95, 125, 25, 214));
    G.namedZones.push({ n: 'Praza da Compañía', p: frameRectPoly(LM.comp, -95, 125, 25, 166) });
    G.namedZones.push({ n: 'Colexio da Compañía (Escolapios)', p: frameRectPoly(LM.comp, -95, 166, 25, 214) });
  }
  // --- Mosteiro de Santa Clara: igrexa mirando cara á Ponte Vella ---
  {
    const b = osmBldg('Convento das Clarisas'), C = polyCentroid(b.p);
    const pv = ROADS.find(r => r.name === 'A Ponte Vella'), ends = [pv.pts[0], pv.pts[pv.pts.length - 1]];
    const E = ends.reduce((a, e) => Math.hypot(e[0] - C[0], e[1] - C[1]) < Math.hypot(a[0] - C[0], a[1] - C[1]) ? e : a);
    const [nx, nz] = norm2(E[0] - C[0], E[1] - C[1]);
    LM.clara = frameAt(-57, -50, C[0], C[1], Math.atan2(nx, nz));
    G.monumentZones.push(frameRectPoly(LM.clara, -86, -70, -30, -36));
    G.namedZones.push({ n: 'Mosteiro de Santa Clara', p: b.p });
  }
  // --- Estación: edificio ao oeste das vías, o andén 1 diante ---
  {
    const b = osmBldg('Monforte de Lemos'), r = minRect(b.p), pl = osmArea('Andén 1', 'platform'), pc = pl ? polyCentroid(pl.p) : [r.cx + 20, r.cz];
    const ax = Math.cos(r.w >= r.d ? r.ang : r.ang + Math.PI / 2), az = Math.sin(r.w >= r.d ? r.ang : r.ang + Math.PI / 2);
    let nx = pc[0] - r.cx, nz = pc[1] - r.cz; const k = nx * ax + nz * az; nx -= k * ax; nz -= k * az; [nx, nz] = norm2(nx, nz);
    const rot = Math.atan2(-nz, nx); // local +x -> cara ás vías
    let F = frameAt(328, 0, r.cx, r.cz, rot);
    // axustar para que a vía 1 (local x = 348.5) quede sobre a liña principal real
    const [tx, tz] = F.pt(348.5, 0); let bd = 1e9, bp = null;
    for (let i = 0; i < TRAIN_PATH.length - 1; i++) { const a = TRAIN_PATH[i], c = TRAIN_PATH[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], L2 = dx * dx + dz * dz || 1; let t = ((tx - a[0]) * dx + (tz - a[1]) * dz) / L2; t = clamp(t, 0, 1); const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(px - tx, pz - tz); if (d < bd) { bd = d; bp = [px, pz]; } }
    if (bp && bd < 30) { const lx = F.inv(bp[0], bp[1])[0], dl = lx - 348.5; F = makeFrame(F.ox + dl * nx, F.oz + dl * nz, rot); }
    LM.station = F;
    LM.stationOld = (x, z) => F.pt(x + 111, z + 228); // coordenadas antigas do xogo (marco −111, −228)
    G.monumentZones.push(frameRectPoly(F, 300, -200, 440, 200));
    G.namedZones.push({ n: 'Estación de Monforte', p: frameRectPoly(F, 318, -96, 362, 96) });
    G.namedZones.push({ n: 'Praza da Estación', p: frameRectPoly(F, 300, -60, 321, 60) });
    G.namedZones.push({ n: 'Museo do Ferrocarril', p: frameRectPoly(F, 380, -190, 440, -80) });
  }
  // --- Colexio Privado Ferroviario, na Rúa da Coruña ---
  {
    const b = osmBldg('Colexio Privado Ferroviario'), C = polyCentroid(b.p);
    const nr = nearRoad(C[0], C[1], r => r.name === 'Rúa da Coruña'), r = nr.r;
    let nx = C[0] - nr.px, nz = C[1] - nr.pz; [nx, nz] = norm2(nx, nz); // da rúa cara ao colexio
    const k = nx * nr.ux + nz * nr.uz; nx -= k * nr.ux; nz -= k * nr.uz; [nx, nz] = norm2(nx, nz);
    const d = r.hw + r.sw + 5.6; // a reixa queda na beira da beirarrúa
    LM.ferro = makeFrame(nr.px + nx * d, nr.pz + nz * d, Math.atan2(nx, nz));
    G.monumentZones.push(frameRectPoly(LM.ferro, -18, -5.5, 18, 17));
    G.namedZones.push({ n: 'Colexio Ferroviario', p: frameRectPoly(LM.ferro, -18, -5.5, 18, 17) });
  }
  // --- Gasolineira (Repsol real) na Rúa do Doutor Casares, á beira dos números pares, antes do cruce coa Rúa da Coruña ---
  {
    // no Catastro: o anaco industrial dunha planta xusto despois da zapataría (Doutor Casares, beira dos pares), e a pista cara ao cruce
    const P0 = { p: [457, -497] };
    let nr = nearRoad(P0.p[0], P0.p[1], r => r.type === 'car' && r.name === 'Rúa do Doutor Casares'); if (!nr.r) nr = nearRoad(P0.p[0], P0.p[1], r => r.type === 'car' && r.cls !== 'service'); const r = nr.r;
    let nx = P0.p[0] - nr.px, nz = P0.p[1] - nr.pz; if (Math.hypot(nx, nz) < 0.5) { nx = -nr.uz; nz = nr.ux; } [nx, nz] = norm2(nx, nz);
    const d = r.hw + r.sw + 7.5, rot = Math.atan2(-nr.uz, nr.ux);
    let F = makeFrame(nr.px + nx * d, nr.pz + nz * d, rot);
    if (F.inv(nr.px, nr.pz)[1] > 0) F = makeFrame(F.ox, F.oz, rot + Math.PI); // a rúa queda en local −z
    LM.gas = F;
    G.monumentZones.push(frameRectPoly(F, -13, -6.5, 13, 11));
    G.namedZones.push({ n: 'Gasolineira Lemos', p: frameRectPoly(F, -13, -6.5, 13, 11) });
  }
  // --- Glorieta Pablo Iglesias: fonte de aceiro corten e escultura aos ferroviarios ---
  {
    const f = AREAS.find(a => a.t === 'fountain' && a.p[0][0] > 600); LM.stFountain = f ? minRect(f.p) : null;
    if (LM.stFountain) { const r = LM.stFountain; G.monumentZones.push([[r.cx - 6, r.cz - 6], [r.cx + 6, r.cz - 6], [r.cx + 6, r.cz + 6], [r.cx - 6, r.cz + 6]]); }
  }
  // --- Auditorio e Conservatorio Municipal Mestre Ibáñez (fronte ao CEIP Plurilingüe) ---
  {
    const b = osmBldg('Edificio Multiúsos de Monforte de Lemos'), C = polyCentroid(b.p);
    const nr = nearRoad(C[0], C[1], r => r.name === 'Rúa María Emilia Casas Baamonde' && r.type === 'car'), r = nr.r;
    let nx = C[0] - nr.px, nz = C[1] - nr.pz; const k = nx * nr.ux + nz * nr.uz; nx -= k * nr.ux; nz -= k * nr.uz; [nx, nz] = norm2(nx, nz);
    const d = r.hw + r.sw + 11.5;
    LM.cons = makeFrame(nr.px + nx * d, nr.pz + nz * d, Math.atan2(nx, nz));
    G.monumentZones.push(frameRectPoly(LM.cons, -31, -11.5, 31, 26));
    G.namedZones.push({ n: 'Auditorio e Conservatorio Mestre Ibáñez', p: frameRectPoly(LM.cons, -31, -11.5, 31, 26) });
  }
  // --- Club Fluvial (piscinas e pistas á beira do Cabe) ---
  if (typeof fluvialLandmarks === 'function') fluvialLandmarks();
  if (typeof sajoniLandmarks === 'function') sajoniLandmarks();
  if (typeof arenalLandmarks === 'function') arenalLandmarks();
  if (typeof ucelersLandmarks === 'function') ucelersLandmarks();
  if (typeof plazaHotelsLandmarks === 'function') plazaHotelsLandmarks();
  if (typeof goyanesLandmarks === 'function') goyanesLandmarks();
  if (typeof carudeLandmarks === 'function') carudeLandmarks();
  if (typeof concelloLandmarks === 'function') concelloLandmarks();
  if (typeof zonasLandmarks === 'function') zonasLandmarks(); if (typeof ceipLandmarks === 'function') ceipLandmarks();
  // --- Torre da Homenaxe e Mosteiro de San Vicente ---
  {
    const t = polyCentroid(osmBldg('Torre da Homenaxe').p), m = polyCentroid(osmBldg('Castelo de Monforte de Lemos').p);
    const lt = [-112, -160], lm = [-73 + 18, -152 + 15]; // centro aprox. do claustro no deseño
    const aw = Math.atan2(m[1] - t[1], m[0] - t[0]), al = Math.atan2(lm[1] - lt[1], lm[0] - lt[0]);
    LM.castle = frameAt(lt[0], lt[1], t[0], t[1], -(aw - al));
  }
  // --- Campo da Pinguela ---
  {
    const a = osmArea('Estadio da Pinguela', 'stadium'), r = minRect(a.p);
    let ang = r.w >= r.d ? r.ang : r.ang + Math.PI / 2;
    const tryF = an => frameAt(-195, 278, r.cx, r.cz, Math.atan2(-Math.sin(an), Math.cos(an)));
    // a porta (local −z) cara á rúa máis próxima
    const gate = F => { const [x, z] = F.pt(-195, 278 - 40); const nr = nearRoad(x, z, q => q.type === 'car'); return nr.r ? nr.d : 999; };
    const F1 = tryF(ang), F2 = tryF(ang + Math.PI);
    LM.ping = gate(F1) <= gate(F2) ? F1 : F2;
    G.monumentZones.push(frameRectPoly(LM.ping, -250, 240, -140, 316));
    G.namedZones.push({ n: 'Campo da Pinguela', p: a.p });
  }
  // --- Parque dos Condes: a gran fonte no punto máis amplo do parque ---
  {
    const a = osmArea('Parque dos Condes', 'park'); LM.parkPoly = a.p;
    const bb = polyBox(a.p); let best = null, bv = -1;
    const edgeD = (x, z) => { let m = 1e9; for (let i = 0, j = a.p.length - 1; i < a.p.length; j = i++) { const p = a.p[i], q = a.p[j], dx = q[0] - p[0], dz = q[1] - p[1], L2 = dx * dx + dz * dz || 1; let t = clamp(((x - p[0]) * dx + (z - p[1]) * dz) / L2, 0, 1); m = Math.min(m, Math.hypot(p[0] + dx * t - x, p[1] + dz * t - z)); } return m; };
    for (let x = bb.x0; x < bb.x1; x += 3) for (let z = bb.z0; z < bb.z1; z += 3) {
      if (!inPoly(x, z, a.p)) continue;
      const v = Math.min(edgeD(x, z), riverRaw(x, z) - 4, inStreet(x, z, 0) ? 0 : 99, nearRoad(x, z, q => q.type === 'path').d + 6);
      if (v > bv) { bv = v; best = [x, z]; }
    }
    LM.parkC = { x: best[0], z: best[1] };
    // explanada de formigón ao nornoroeste da fonte: pista de volei praia
    { const b = -20 * Math.PI / 180; LM.volei = makeFrame(best[0] + Math.sin(b) * 30, best[1] - Math.cos(b) * 30, 30 * Math.PI / 180);
      const vp = frameRectPoly(LM.volei, -11.5, -6.5, 11.5, 6.5); G.monumentZones.push(vp); G.namedZones.push({ n: 'Pista de volei praia', p: vp }); LM.volei.poly = vp; (G.noTrees = G.noTrees || []).push(frameRectPoly(LM.volei, -14, -9, 14, 9)); }
    G.namedZones.push({ n: 'Parque dos Condes', p: a.p });
  }
  // --- Ponte Vella ---
  LM.vella = BRIDGES.find(b => b.type === 'vella');
  // --- Rúa do Cardeal (tramo peonil) ---
  LM.cardeal = pathOf(chainRoads(ROADS.filter(r => r.name === 'Rúa do Cardeal Rodrigo de Castro' && r.type === 'ped')));
  // --- Paseo do Malecón: tramo xunto ao río ata a Ponte Vella ---
  {
    const all = chainRoads(ROADS.filter(r => r.name === 'Paseo do Malecón' && r.type === 'car'));
    // conserva o tramo na beira entre z = 20 e a Praza do Doutor Goyanes
    let P = all.filter(p => p[1] > 10 && p[1] < 178);
    if (P.length < 2) P = all;
    if (P[0][1] > P[P.length - 1][1]) P.reverse();
    const path = pathOf(P), mid = path.at(path.len / 2), rn = riverNear(mid.x, mid.z);
    const side = ((rn.px - mid.x) * -mid.uz + (rn.pz - mid.z) * mid.ux) > 0 ? 1 : -1; // lado do río (+1 = esquerda)
    LM.malecon = { path, side, road: ROADS.find(r => r.name === 'Paseo do Malecón' && r.pts.some(p => Math.abs(p[1] - mid.z) < 30)) };
    // zona: entre a beira da rúa e o río
    const poly = [];
    for (let s = 0; s <= path.len; s += 4) { const p = path.at(s); poly.push([p.x - p.uz * side * 3.5, p.z + p.ux * side * 3.5]); }
    for (let s = path.len; s >= 0; s -= 4) { const p = path.at(s), r2 = riverNear(p.x, p.z), d = Math.max(6, Math.hypot(r2.px - p.x, r2.pz - p.z) - r2.hw); poly.push([p.x - p.uz * side * d, p.z + p.ux * side * d]); }
    LM.malecon.poly = poly; G.monumentZones.push(poly); G.namedZones.push({ n: 'Paseo do Malecón', p: poly });
  }
}

/* ---------- Pontes (en calquera ángulo) ---------- */
function buildRoadBridge(B, b) {
  const half = b.half, hw = b.hw;
  const g = boxGeo(hw * 2, 1.2, half * 2, [3, 3]); xform(g, 0, -0.58, 0); B.concrete.add(g);
  for (const s2 of [-1, 1]) {
    const p = boxGeo(0.25, 1.0, half * 2); xform(p, s2 * (hw - 0.2), 0.6, 0); B.metal.add(p);
    const k = boxGeo(0.5, 0.25, half * 2); xform(k, s2 * (hw - 0.2), 0.12, 0); B.concrete.add(k);
    addBoxCol(s2 * hw - 0.4, -half, s2 * hw + 0.4, half, 2, 'rail', -5);
  }
  const pil = boxGeo(hw * 1.6, 3, 2, [3, 3]); xform(pil, 0, -2.4, 0); B.concrete.add(pil);
}
function buildBridgesOSM(B, scene) {
  for (const b of BRIDGES) {
    const lb = { dir: 'ns', x: 0, z: 0, c: 0, ux: 0, uz: 1, hw: b.hw, half: b.half, type: b.type };
    const fn = b.type === 'vella' ? buildPonteVella : b.type === 'wood' ? buildWoodBridge : buildRoadBridge;
    inFrame(B, scene, b.x, b.z, b.rot, LB => fn(LB, lb));
  }
}

/* ---------- Chan e montañas ---------- */
function buildGround(scene, Q) {
  const cx0 = (MAP.minX + MAP.maxX) / 2, cz0 = (MAP.minZ + MAP.maxZ) / 2;
  const size = 3000, seg = Q === 'high' ? 460 : Q === 'med' ? 380 : 300;
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx0, z = p.getZ(i) + cz0; p.setX(i, x); p.setZ(i, z);
    const h = terrainH(x, z); p.setY(i, h);
    uv.setXY(i, x / 14, z / 14);
    let r = 1, gg = 1, b = 1;
    if (h > 3) { const t = clamp(h / 60, 0, 1); r = lerp(.9, .55, t); gg = lerp(.95, .7, t); b = lerp(.85, .55, t); }
    if (h < -0.5) { r = .75; gg = .68; b = .5; }
    if (isUrban(x, z) && h > -0.5 && h < 3) { r *= 0.92; gg *= 0.9; b *= 0.86; }
    const n = 0.9 + 0.2 * Math.max(0, noise2(x * 3, z * 3));
    col[i * 3] = r * n; col[i * 3 + 1] = gg * n; col[i * 3 + 2] = b * n;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, MAT.grass); m.receiveShadow = true; scene.add(m);
  G.groundMesh = m;
  const mg = new THREE.CylinderGeometry(2300, 2300, 1, 180, 6, true);
  const mp = mg.attributes.position, mc = new Float32Array(mp.count * 3);
  for (let i = 0; i < mp.count; i++) {
    const x = mp.getX(i), z = mp.getZ(i), a = Math.atan2(z, x), yN = mp.getY(i) + 0.5;
    const hh = 120 + 170 * Math.abs(Math.sin(a * 3.1) * Math.cos(a * 5.3 + 1)) + 50 * Math.sin(a * 17);
    mp.setY(i, yN * hh - 20);
    const s = 1 - yN * 0.25; mc[i * 3] = .36 * s; mc[i * 3 + 1] = .45 * s; mc[i * 3 + 2] = .42 * s;
  }
  mg.setAttribute('color', new THREE.BufferAttribute(mc, 3)); mg.computeVertexNormals();
  const mm = new THREE.Mesh(mg, std({ vertexColors: true, roughness: 1, side: THREE.BackSide }));
  mm.position.set(cx0, 0, cz0); scene.add(mm);
}

/* ---------- Monte e Castelo de San Vicente ---------- */
function buildCastle(B, scene) {
  const T = HILL.top, cx = HILL.x, cz = HILL.z;
  const disc = new THREE.CircleGeometry(HILL.r0 - 1, 48); disc.rotateX(-Math.PI / 2); xform(disc, cx, T + 0.04, cz);
  const uv = disc.attributes.uv, dp = disc.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, dp.getX(i) / 4, dp.getZ(i) / 4);
  B.cobble.add(disc);
  // porta da muralla cara á rúa máis próxima do Barrio de San Vicente
  let gateA = 0, gd = 1e9;
  for (const r of ROADS) if (r.type === 'car' && r.name === 'Barrio de San Vicente') for (let s = 0; s <= r.len; s += 2) { const p = roadPoint(r, s), d = Math.hypot(p.x - cx, p.z - cz); if (d < gd) { gd = d; gateA = Math.atan2(p.x - cx, p.z - cz); } }
  const R0 = HILL.r0 - 1.5, step = 3.2 / R0;
  for (let a = 0; a < Math.PI * 2; a += step) {
    if (Math.abs(angDiff(a, gateA)) < 0.13) continue;
    const x = cx + Math.sin(a) * R0, z = cz + Math.cos(a) * R0;
    const w = boxGeo(3.4, 9, 2.2, [4, 4]); xform(w, x, T - 2.5, z, a); B.stone.add(w);
    const m = boxGeo(1.6, 1.2, 2.2, [4, 4]); xform(m, x, T + 2.6, z, a); B.stone.add(m);
    addCircCol(x, z, 1.5, 6, 'muralla', T - 6);
  }
  for (let i = 0; i < 8; i++) {
    const a = gateA + 0.45 + i * (Math.PI * 2 - 0.9) / 7, x = cx + Math.sin(a) * (R0 + 0.5), z = cz + Math.cos(a) * (R0 + 0.5);
    const t = new THREE.CylinderGeometry(3, 3.4, 13, 14); xform(t, x, T - 1, z); B.stone.add(t);
    for (let k = 0; k < 8; k++) { const ka = k / 8 * Math.PI * 2, m = boxGeo(1.1, 1.2, 0.8); xform(m, x + Math.sin(ka) * 2.6, T + 6.1, z + Math.cos(ka) * 2.6, ka); B.stone.add(m); }
    addCircCol(x, z, 3.2, 12, 'torreon', T - 6);
  }
  {
    const gx = cx + Math.sin(gateA) * R0, gz = cz + Math.cos(gateA) * R0;
    for (const s of [-1, 1]) { const px = gx + Math.cos(gateA) * s * 5.8, pz = gz - Math.sin(gateA) * s * 5.8; const t = boxGeo(3.6, 12, 4.2, [4, 4]); xform(t, px, T + 1, pz, gateA); B.stone.add(t); addCircCol(px, pz, 2.2, 12, 'porta', T - 6); }
    const arch = boxGeo(15, 2.6, 4.2, [4, 4]); xform(arch, gx, T + 6.4, gz, gateA); B.stone.add(arch);
  }
  const F = LM.castle;
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => { buildTorreHomenaxe(LB, g, T); buildMosteiro(LB, g, T); });
  { const [x, z] = F.pt(G.torre.x, G.torre.z); G.torre.x = x; G.torre.z = z; }
  for (let i = 0; i < 6; i++) { const a = gateA + 1.2 + i * 0.35, x = cx + Math.sin(a) * 30, z = cz + Math.cos(a) * 30; if (!obbOverlaps(x, z, 1, 1, 0)) bench(B, x, T, z, a + Math.PI); }
  G.hillPines = [];
  for (let i = 0; i < 420; i++) {
    const a = R() * Math.PI * 2, r = RR(HILL.r0 + 5, HILL.r1 - 10), x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
    if (!inStreet(x, z, 3) && !inRoad(x, z, 2, true) && !obbOverlaps(x, z, 1.5, 1.5, 0, 0)) G.hillPines.push([x, terrainH(x, z), z]);
  }
  G.castleGate = { x: cx + Math.sin(gateA) * (R0 - 4), z: cz + Math.cos(gateA) * (R0 - 4), yaw: gateA + Math.PI };
  G.castleOut = { x: cx + Math.sin(gateA) * (R0 + 10), z: cz + Math.cos(gateA) * (R0 + 10) };
}

/* ---------- Rúa do Cardeal: bares e terrazas ao longo do tramo peonil real ---------- */
function buildCardealOSM(B, F, scene) {
  const P = LM.cardeal; if (!P.len) return;
  const hw = 3.5, front = hw + 0.35;
  let bi = 0;
  const tables = [], chairs = [], umbrellas = [], barrels = [], awnings = [];
  for (const side of [-1, 1]) {
    let s = 6 + (side > 0 ? 2 : 0);
    while (s < P.len - 8) {
      const lw = RR(7.5, 11), dp = RR(12, 15), p = P.at(s + lw / 2);
      const nx = -p.uz * side, nz = p.ux * side, rot = Math.atan2(-p.uz, p.ux);
      const cx = p.x + nx * (front + dp / 2), cz = p.z + nz * (front + dp / 2);
      if (obbOverlaps(cx, cz, lw / 2, dp / 2, rot, 0.1) || inStreet(cx + nx * (-dp / 2 + 0.5), cz + nz * (-dp / 2 + 0.5), 0) && !inRoad(p.x, p.z, 0)) { s += 2; continue; }
      const isBar = bi < BAR_NAMES.length && R() < 0.8;
      addBuildingRot(B, F, cx, cz, rot, lw, dp, { floors: RI(3, 4), style: pick([4, 4, 0, 1, 2, 4, 3]), bar: isBar });
      if (isBar) {
        const name = BAR_NAMES[bi], col = BAR_COLORS[bi]; bi++;
        const fx = p.x + nx * (front - 0.12), fz = p.z + nz * (front - 0.12), yaw = Math.atan2(-nx, -nz), y = terrainH(fx, fz);
        const tex = textTex(name.toUpperCase(), { w: 512, h: 96, bg: '#14100e', fg: col, size: 54, glow: true, border: col });
        const sm = nightMat(std({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.5 }), 0.25, 1.6);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(lw - 1.5, 5.2), 0.95), sm);
        sign.position.set(fx - nx * 0.03, y + 3.05, fz - nz * 0.03); sign.rotation.y = yaw; scene.add(sign);
        awnings.push({ x: fx - nx * 0.9, z: fz - nz * 0.9, y, w: lw - 1.2, yaw, col });
        const nT = RI(1, 2);
        for (let k = 0; k < nT; k++) {
          const q = P.at(s + lw / 2 + (nT === 1 ? 0 : (k ? 2.2 : -2.2))), tx = q.x - q.uz * side * (hw - 1.0), tz = q.z + q.ux * side * (hw - 1.0), ty = terrainH(tx, tz);
          if (R() < 0.45) {
            barrels.push([tx, ty, tz]);
            G.seats.push({ x: tx + q.ux * 0.75, z: tz + q.uz * 0.75, yaw: Math.atan2(-q.ux, -q.uz), y: ty, stand: true });
            G.seats.push({ x: tx - q.ux * 0.75, z: tz - q.uz * 0.75, yaw: Math.atan2(q.ux, q.uz), y: ty, stand: true });
          } else {
            tables.push([tx, ty, tz]); umbrellas.push([tx, ty, tz, col]);
            for (const [ox, oz] of [[q.ux, q.uz], [-q.ux, -q.uz], [-q.uz, q.ux], [q.uz, -q.ux]]) { const sx = tx + ox * 0.8, sz = tz + oz * 0.8, ya = Math.atan2(-ox, -oz); chairs.push([sx, ty, sz, ya + Math.PI]); if (R() < 0.7) G.seats.push({ x: sx, z: sz, yaw: ya, y: ty, sit: true }); }
          }
          addCircCol(tx, tz, 0.7, 1.2, 'mesa', -1);
        }
        G.bars.push({ name, color: col, door: { x: fx - nx * 1.6, z: fz - nz * 1.6 }, side });
      }
      s += lw;
    }
  }
  const inst = (geo, mat, list, fn) => { if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length); const o = new THREE.Object3D(); list.forEach((it, i) => { fn(o, it); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
  const tableG = mergeGeos([xform(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 16), 0, 0.74, 0), xform(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 6), 0, 0.36, 0), xform(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 12), 0, 0.02, 0)]);
  inst(tableG, MAT.metal, tables, (o, [x, y, z]) => { o.position.set(x, y + 0.06, z); o.rotation.set(0, 0, 0); });
  const chairG = mergeGeos([xform(boxGeo(0.42, 0.04, 0.42), 0, 0.45, 0), xform(boxGeo(0.42, 0.42, 0.04), 0, 0.68, -0.2), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => xform(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 5), a * 0.19, 0.22, b * 0.19))]);
  inst(chairG, MAT.metalDark, chairs, (o, [x, y, z, ya]) => { o.position.set(x, y + 0.06, z); o.rotation.set(0, ya, 0); });
  const barrelG = new THREE.CylinderGeometry(0.42, 0.42, 1.05, 16); barrelG.translate(0, 0.53, 0);
  inst(barrelG, MAT.wood, barrels, (o, [x, y, z]) => { o.position.set(x, y + 0.06, z); });
  for (const [x, y, z, col] of umbrellas) {
    const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 8, 1, true), std({ color: new THREE.Color(col).lerp(new THREE.Color('#f4efe6'), 0.55), roughness: 0.9, side: THREE.DoubleSide }));
    u.position.set(x, y + 2.45, z); u.castShadow = true; scene.add(u);
    const pp = boxGeo(0.05, 2.4, 0.05); xform(pp, x, y + 1.2, z); B.metal.add(pp);
  }
  for (const a of awnings) {
    const c = cnv(64, 64), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2eee6' : new THREE.Color(a.col).lerp(new THREE.Color('#5a1020'), 0.5).getStyleSRGB(); x.fillRect(i * 8, 0, 8, 64); }
    const g = new THREE.Mesh(new THREE.PlaneGeometry(a.w, 1.8), std({ map: toTex(c, false), roughness: .9, side: THREE.DoubleSide }));
    g.position.set(a.x, a.y + 3.75, a.z); g.rotation.set(0, a.yaw, 0); g.rotateX(-1.0); g.castShadow = true; scene.add(g);
  }
  // festóns de luces que cruzan a rúa
  const bulbs = [], wire = [];
  for (let s = 4; s < P.len - 4; s += 7) {
    const p = P.at(s), q = P.at(s + 3.5), xa = p.x + p.uz * front, za = p.z - p.ux * front, xb = q.x - q.uz * front, zb = q.z + q.ux * front, y0 = terrainH(p.x, p.z) + 6.6;
    let prev = null;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = lerp(xa, xb, t), zz = lerp(za, zb, t), y = y0 - Math.sin(t * Math.PI) * 1.1;
      if (prev) wire.push(prev[0], prev[1], prev[2], x, y, zz); prev = [x, y, zz];
      if (i > 0 && i < 14) bulbs.push([x, y - 0.12, zz]);
    }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
  const bm = inst(new THREE.SphereGeometry(0.09, 8, 6), MAT.bulb, bulbs, (o, [x, y, z]) => o.position.set(x, y, z)); if (bm) bm.castShadow = false;
  G.cardealLights = bulbs.filter((_, i) => i % 13 === 6).map(([x, y, z]) => ({ x, y, z }));
  // placas co nome da rúa
  const plTex = textTex('Rúa do Cardeal', { w: 512, h: 128, bg: '#1f3f73', fg: '#f4f1e8', size: 66, border: '#f4f1e8', font: 'Barlow, sans-serif', weight: 600 });
  for (const [s, side] of [[3, -1], [P.len - 3, 1]]) { const p = P.at(s), nx = -p.uz * side, nz = p.ux * side, pl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), std({ map: plTex, roughness: .5 })); pl.position.set(p.x + nx * (front - 0.1), terrainH(p.x, p.z) + 4.3, p.z + nz * (front - 0.1)); pl.rotation.y = Math.atan2(-nx, -nz); scene.add(pl); }
  G.cardealPath = P;
}

/* ---------- Parque dos Condes ---------- */
function buildParkOSM(B, scene) {
  const P = LM.parkPoly, cx = LM.parkC.x, cz = LM.parkC.z;
  // a céspede xa a pon buildAreasOSM; aquí: fonte, anel, bancos, farolas, embarcadoiro
  buildGrandFountain(B, scene, cx, cz);
  const ring = []; for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 32) ring.push([cx + Math.cos(a) * 22, cz + Math.sin(a) * 16]);
  const rg = ribbon(ring, 3, { step: 2, vScale: 4, yFn: (x, z) => terrainH(x, z), yOff: 0.06 }); { const p = rg.attributes.position, uv = rg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 5, p.getZ(i) / 5); } B.gravel.add(rg);
  // praza dura arredor da fonte (onde toca o grupo)
  const pz = new THREE.CircleGeometry(20, 40); pz.rotateX(-Math.PI / 2); pz.scale(1, 1, 0.75); xform(pz, cx, terrainH(cx, cz) + 0.05, cz); { const p = pz.attributes.position, uv = pz.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4); } B.cobble.add(pz);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, x = cx + Math.cos(a) * 24.5, z = cz + Math.sin(a) * 18.5; if (i % 3 === 0 && inPoly(x, z, P)) bench(B, x, terrainH(x, z) + 0.03, z, Math.atan2(cx - x, cz - z)); }
  G.parkLampPts = G.parkLampPts || [];
  for (const a of [0.5, 2.1, 3.7, 5.3]) G.parkLampPts.push([cx + Math.cos(a) * 27, cz + Math.sin(a) * 20]);
  // farolas e bancos ao longo dos camiños do parque
  for (const r of ROADS) {
    if (r.type !== 'path') continue; const m = roadPoint(r, r.len / 2); if (!inPoly(m.x, m.z, P)) continue;
    for (let s = 6; s < r.len - 3; s += 22) { const p = roadPoint(r, s), x = p.x - p.uz * (r.hw + 0.8), z = p.z + p.ux * (r.hw + 0.8); if (inPoly(x, z, P) && Math.hypot(x - cx, z - cz) > 24 && !(LM.volei && inPoly(x, z, LM.volei.poly))) { G.parkLampPts.push([x, z]); if (R() < 0.5) bench(B, x + p.ux * 3, terrainH(x, z) + 0.03, z + p.uz * 3, Math.atan2(p.uz, -p.ux)); } }
  }
  // cartel de entrada xunto á rúa máis próxima
  {
    const nr = nearRoad(cx, cz, r => r.type === 'car' && r.urban); let bs = null, bd = 1e9;
    for (const q of P) { const n2 = nearRoad(q[0], q[1], r => r.type === 'car'); if (n2.r && n2.d < bd) { bd = n2.d; bs = q; } }
    if (bs) {
      const yaw = Math.atan2(cx - bs[0], cz - bs[1]) + Math.PI, x = bs[0] + Math.sin(yaw + Math.PI) * 2, z = bs[1] + Math.cos(yaw + Math.PI) * 2;
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.3), std({ map: textTex('PARQUE DOS CONDES', { w: 512, h: 112, bg: '#2a3a2a', fg: '#f1e6c8', size: 60, border: '#c9b98a' }), roughness: .7, side: THREE.DoubleSide }));
      sg.position.set(x, terrainH(x, z) + 3.2, z); sg.rotation.y = yaw; scene.add(sg);
      for (const s2 of [-1, 1]) { const px = x + Math.cos(yaw) * s2 * 3.4, pzz = z - Math.sin(yaw) * s2 * 3.4, p = boxGeo(0.5, 4, 0.5, [3, 3]); xform(p, px, terrainH(px, pzz) + 2, pzz); B.stone.add(p); addCircCol(px, pzz, 0.4, 4); }
      G.parkGate = { x: x + Math.sin(yaw + Math.PI) * 3, z: z + Math.cos(yaw + Math.PI) * 3 };
    }
  }
  // embarcadoiro (posición de OSM)
  {
    const ej = [-323, 467], rn = riverNear(ej[0], ej[1]); let nx = ej[0] - rn.px, nz = ej[1] - rn.pz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const bx = rn.px + nx * (rn.hw - 1.5), bz = rn.pz + nz * (rn.hw - 1.5), th = Math.atan2(nx, nz);
    inFrame(B, scene, bx, bz, th, (LB, g) => buildEmbarcadoiro(LB, g));
    G.jetty = { x: bx + Math.sin(th) * -1.0, z: bz + Math.cos(th) * -1.0 };
  }
  for (let i = 0; i < 600 && G.parkPoints.length < 70; i++) { const bb = polyBox(P), x = RR(bb.x0, bb.x1), z = RR(bb.z0, bb.z1); if (inPoly(x, z, P) && riverDistRaw(x, z) > RIVER_HW + 3 && Math.hypot(x - cx, z - cz) > 14.5 && !inStreet(x, z, 0.5) && !(LM.volei && inPoly(x, z, LM.volei.poly))) G.parkPoints.push([x, z]); }
  G.parkCenter = { x: cx, z: cz };
}

/* ---------- Coleccionables ---------- */
function buildBottles(scene) {
  const vb = LM.vella, pb = BRIDGES.find(b => b.park) || BRIDGES.find(b => b.type === 'wood');
  const so = LM.stationOld, co = LM.compOld, cd = LM.cardeal;
  const spots = [
    [G.torre.x, G.torre.top + 1.6, G.torre.z, 'no alto da Torre da Homenaxe'],
    [vb.x + vb.uz * 6, 0.2, vb.z - vb.ux * 6, 'baixo a Ponte Vella'],
    [G.jetty.x, -0.3, G.jetty.z, 'no embarcadoiro'],
    [...co(35, 117).slice(0, 1), 0.3, co(35, 117)[1], 'diante da portada da Compañía'],
    [...so(281.5, -325).slice(0, 1), 4.3, so(281.5, -325)[1], 'na locomotora de vapor'],
    [...so(229, -188).slice(0, 1), 0.9, so(229, -188)[1], 'no andén 1'],
    [HILL.x + 20, HILL.top + 0.3, HILL.z - 8, 'no claustro do mosteiro'],
    [pb.x, 1.3, pb.z, 'na pasarela do parque'],
    [cd.at(cd.len - 2).x, 0.3, cd.at(cd.len - 2).z, 'ao final do Cardeal'],
    [-268, 0.3, 203, 'na Praza do Campo de San Antonio'],
    [560, 0.3, -380, 'no barrio da estación'],
    [HILL.x + 130, 0.3, HILL.z - 120, 'detrás do monte'],
  ];
  const bg = mergeGeos([xform(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 12), 0, 0.21, 0), xform(new THREE.CylinderGeometry(0.04, 0.11, 0.14, 12), 0, 0.49, 0), xform(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), 0, 0.62, 0)]);
  const bm = std({ color: 0x3d0a1c, roughness: 0.1, metalness: 0.3, emissive: 0x7a1f3d, emissiveIntensity: 0.6 });
  for (let [x, y, z, where] of spots) {
    if (y < 1 && where !== 'no embarcadoiro') y = groundH(x, z) + 0.3;
    const m = new THREE.Mesh(bg, bm); m.position.set(x, y, z); m.scale.setScalar(1.6); scene.add(m);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 24), new THREE.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(x, y + 0.02, z); scene.add(halo);
    G.bottles.push({ m, halo, x, y, z, where, got: false });
  }
}

/* ---------- Árbores ---------- */
function buildTrees(scene, Q) {
  const trees = [];
  // parques e xardíns de OSM
  for (const a of AREAS) {
    if (a.t !== 'park' && a.t !== 'grass' && a.t !== 'cemetery') continue;
    const bb = polyBox(a.p), area = polyArea(a.p), n = Math.min(160, area / (a.t === 'park' ? 260 : 600));
    for (let i = 0, k = 0; i < n * 4 && k < n; i++) {
      const x = RR(bb.x0, bb.x1), z = RR(bb.z0, bb.z1);
      if (!inPoly(x, z, a.p) || riverDistRaw(x, z) < RIVER_HW + 5 || inStreet(x, z, 1.5) || inRoad(x, z, 1.5, true)) continue;
      if (LM.parkC && Math.hypot(x - LM.parkC.x, z - LM.parkC.z) < 30) continue;
      if ((G.noTrees || []).some(q => inPoly(x, z, q))) continue;
      if (AREAS.some(o => (o.t === 'pitch' || o.t === 'play' || o.t === 'parking') && inPoly(x, z, o.p))) continue;
      trees.push([x, z, RR(0.8, 1.25)]); k++;
    }
  }
  for (const t of G.extraTrees || []) trees.push(t);
  // beiras do río
  for (const s of [-1, 1]) for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b2 = RIVER[i + 1], L = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1, tx = (b2[0] - a[0]) / L, tz = (b2[1] - a[1]) / L;
    for (let f = 0; f < L; f += 11) {
      const cx = a[0] + tx * f, cz = a[1] + tz * f, hw = lerp(RIVER_W[i], RIVER_W[i + 1], f / L) + RR(3, 6), x = cx - tz * s * hw, z = cz + tx * s * hw;
      if (x < MAP.minX || x > MAP.maxX || z < MAP.minZ || z > MAP.maxZ) continue;
      if (BRIDGES.some(b => Math.hypot(x - b.x, z - b.z) < b.half + 4) || inStreet(x, z, 1.5) || inRoad(x, z, 1.5, true) || obbOverlaps(x, z, 1, 1, 0, 0)) continue;
      if (LM.malecon && inPoly(x, z, LM.malecon.poly)) continue;
      if ((G.noTrees || []).some(q => inPoly(x, z, q))) continue;
      trees.push([x, z, RR(0.8, 1.25)]);
    }
  }
  // avenidas arboradas
  for (const r of ROADS) if (r.type === 'car' && r.major && r.urban && !r.bridge) for (let s = 10; s < r.len - 6; s += 16) {
    const p = roadPoint(r, s), side = (Math.floor(s / 16) % 2) ? 1 : -1, off = r.hw + Math.max(1.2, r.sw * 0.7), x = p.x - p.uz * side * off, z = p.z + p.ux * side * off;
    const bx = p.x - p.uz * side * (off + 4), bz = p.z + p.ux * side * (off + 4);
    if (!inRoad(x, z, 0.4) && !obbOverlaps(x, z, 0.8, 0.8, 0, 0) && !G.lamps.some(l => Math.abs(l.x - x) < 4 && Math.abs(l.z - z) < 4) && !G.monumentZones.some(q => inPoly(bx, bz, q))) trees.push([x, z, RR(0.7, 0.95)]);
  }
  // campo: arboredo e carballeiras fóra do núcleo urbano
  const nOut = Q === 'low' ? 500 : Q === 'med' ? 900 : 1400;
  for (let i = 0, k = 0; i < nOut * 3 && k < nOut; i++) {
    const x = RR(MAP.minX + 10, MAP.maxX - 10), z = RR(MAP.minZ + 10, MAP.maxZ - 10);
    if (isUrban(x, z) && R() < 0.85) continue;
    if (riverDistRaw(x, z) < RIVER_HW + 3 || inStreet(x, z, 2) || inRoad(x, z, 2, true) || reservedAt(x, z) || obbOverlaps(x, z, 1.5, 1.5, 0, 0) || trainDist(x, z) < 8) continue;
    if (Math.hypot(x - HILL.x, z - HILL.z) < HILL.r1) continue;
    trees.push([x, z, RR(0.8, 1.4)]); k++;
  }
  for (let i = 0; i < (Q === 'low' ? 200 : 500); i++) { const a = R() * Math.PI * 2, d = RR(80, 380), x = (MAP.minX + MAP.maxX) / 2 + Math.cos(a) * ((MAP.maxX - MAP.minX) / 2 + d), z = (MAP.minZ + MAP.maxZ) / 2 + Math.sin(a) * ((MAP.maxZ - MAP.minZ) / 2 + d); if (trainDist(x, z) < 20) continue; const h = terrainH(x, z); trees.push([x, z, RR(1.2, 2), h]); }
  const crown = new THREE.IcosahedronGeometry(2.6, 1); const cp = crown.attributes.position;
  for (let i = 0; i < cp.count; i++) { const k = 0.85 + Math.abs(noise2(cp.getX(i) * 40, cp.getZ(i) * 40 + cp.getY(i) * 20)) * 0.35; cp.setXYZ(i, cp.getX(i) * k, cp.getY(i) * k * 0.9, cp.getZ(i) * k); }
  crown.computeVertexNormals(); crown.translate(0, 6.2, 0);
  const crown2 = new THREE.IcosahedronGeometry(1.8, 1); crown2.translate(1.3, 5.2, 0.6);
  const crownG = mergeGeos([crown, crown2]);
  const trunk = new THREE.CylinderGeometry(0.18, 0.32, 5, 7); trunk.translate(0, 2.5, 0);
  const ti = new THREE.InstancedMesh(trunk, MAT.trunk, trees.length), ci = new THREE.InstancedMesh(crownG, MAT.leaves, trees.length), o = new THREE.Object3D(), c = new THREE.Color();
  trees.forEach(([x, z, s, h], i) => {
    const y = h !== undefined ? h : Math.max(0, terrainH(x, z));
    o.position.set(x, y, z); o.rotation.set(0, R() * 6.28, 0); o.scale.set(s, s * RR(0.9, 1.15), s); o.updateMatrix();
    ti.setMatrixAt(i, o.matrix); ci.setMatrixAt(i, o.matrix);
    c.setHSL(RR(0.2, 0.3), RR(0.35, 0.55), RR(0.22, 0.34)).convertSRGBToLinear(); ci.setColorAt(i, c);
    if (h === undefined) addCircCol(x, z, 0.35 * s, 6, 'arbore');
  });
  ti.castShadow = ci.castShadow = true; ti.receiveShadow = ci.receiveShadow = true;
  scene.add(ti, ci);
  const pines = G.hillPines;
  const pc = mergeGeos([xform(new THREE.ConeGeometry(2.2, 5, 8), 0, 6.5, 0), xform(new THREE.ConeGeometry(1.6, 4, 8), 0, 9, 0), xform(new THREE.ConeGeometry(2.6, 4, 8), 0, 4.5, 0)]);
  const pt = new THREE.CylinderGeometry(0.15, 0.28, 6, 6); pt.translate(0, 3, 0);
  const pti = new THREE.InstancedMesh(pt, MAT.trunk, pines.length), pci = new THREE.InstancedMesh(pc, MAT.pine, pines.length);
  pines.forEach(([x, y, z], i) => { const s = RR(0.8, 1.3); o.position.set(x, y - 0.2, z); o.rotation.set(RR(-0.05, 0.05), R() * 6, 0); o.scale.set(s, s, s); o.updateMatrix(); pti.setMatrixAt(i, o.matrix); pci.setMatrixAt(i, o.matrix); addCircCol(x, z, 0.4 * s, 8, 'pino'); });
  pti.castShadow = pci.castShadow = true; scene.add(pti, pci);
  G.nTrees = trees.length;
}

/* ---------- datos de xogo dependentes do plano (chamado tras construír o mundo e o grafo) ---------- */
function roadSide(x, z, off = 1.2, filter = r => r.type === 'car' && r.cls !== 'service') {
  const nr = nearRoad(x, z, filter); if (!nr.r) return { x, z, yaw: 0 };
  const r = nr.r, side = nr.side, ux = nr.ux, uz = nr.uz, o = r.hw - off;
  return { x: nr.px - uz * side * o, z: nr.pz + ux * side * o, yaw: Math.atan2(ux, uz) + (side > 0 ? Math.PI : 0), road: r };
}
function onRoad(x, z) { const nr = nearRoad(x, z, r => r.type === 'car' && r.cls !== 'service'); return nr.r ? { x: nr.px, z: nr.pz } : { x, z }; }
function initPlaces() {
  const co = LM.compOld, so = LM.stationOld, V = LM.vella, cd = LM.cardeal, M = LM.malecon, pc = LM.parkC;
  G.stationStop = (([x, z]) => ({ x, z }))(LM.station.pt(348.5, 0));
  // chegada en tren: o xogador sae á Praza da Estación
  { const [x, z] = LM.station.pt(314, 6); G.startPos = { x, z, yaw: LM.station.yaw(-Math.PI / 2) }; }
  // coche do xogador aparcado na rúa máis próxima á praza
  { const [x, z] = LM.station.pt(292, 34); G.startCar = roadSide(x, z, 1.15); G.startPos.yaw = Math.atan2(G.startCar.x - G.startPos.x, G.startCar.z - G.startPos.z); }
  // parada de taxis diante da estación
  { const [a, b] = LM.station.pt(312, -22), [c, d] = LM.station.pt(312, -29); G.taxiStand = [{ x: a, z: b, yaw: LM.station.yaw(Math.PI) }, { x: c, z: d, yaw: LM.station.yaw(Math.PI) }]; }
  const vW = { x: V.x - V.ux * (V.half + 6), z: V.z - V.uz * (V.half + 6) }, vE = { x: V.x + V.ux * (V.half + 6), z: V.z + V.uz * (V.half + 6) };
  const stationFront = (([x, z]) => ({ x, z }))(LM.station.pt(300, 0));
  const pinguela = G.pinguela.gate, gate = G.castleOut || { x: HILL.x, z: HILL.z + 80 };
  const park = G.parkGate || pc, cdA = cd.at(4), cdB = cd.at(cd.len - 4), comp = (([x, z]) => ({ x, z }))(co(35, 82));
  const mal = M.path.at(M.path.len / 2);
  MISSIONS = [
    { id: 'ruta', name: 'Ruta do Patrimonio', at: (p => [p.x, p.z])(roadSide(-268, 203, 2.5)), reward: 600, time: 300, needCar: true,
      intro: 'A oficina de turismo quere un vídeo da cidade. Pasa en coche polos monumentos antes de 5 minutos.',
      steps: [{ x: V.x, z: V.z, r: 14, t: 'Cruza a Ponte Vella' }, { x: cd.at(cd.len * 0.6).x, z: cd.at(cd.len * 0.6).z, r: 9, t: 'Baixa pola Rúa do Cardeal' }, { x: park.x, z: park.z, r: 14, t: 'Pasa polo Parque dos Condes' }, { x: stationFront.x, z: stationFront.z, r: 14, t: 'Chega á Estación' }, { x: gate.x, z: gate.z, r: 16, t: 'Sube ao Castelo de San Vicente' }] },
    { id: 'tren', name: 'O último tren', at: [gate.x, gate.z], reward: 450, time: 120, needCar: true,
      intro: 'Unha peregrina vai perder o tren rexional. Levala á estación antes de que saia: o tren non espera!',
      steps: [{ x: stationFront.x, z: stationFront.z, r: 12, t: 'Leva a peregrina á Estación' }] },
    { id: 'tapas', name: 'Ruta de tapas', at: [cdA.x, cdA.z], reward: 300, time: 140, onFoot: true,
      intro: 'Os amigos esperan polo Cardeal. Pasa a pé por cinco bares e saúda antes de que pidan sen ti.', steps: 'bars' },
    { id: 'taxi', name: 'Taxi Lemos', at: [G.taxiStand[0].x, G.taxiStand[0].z], reward: 0, time: 0, needTaxi: true,
      intro: 'Sube a un dos taxis da parada e preme T para comezar a quenda: leva tres clientes ao seu destino.', steps: 'taxi' },
  ];
  const D = (n, x, z) => ({ n, ...onRoad(x, z) });
  DESTS = [D('Ponte Vella', vW.x, vW.z), D('Castelo de San Vicente', gate.x, gate.z), D('Parque dos Condes', park.x, park.z), D('Estación', stationFront.x, stationFront.z),
    D('Praza da Compañía', comp.x, comp.z), D('Rúa do Cardeal', cdB.x, cdB.z), D('A Pinguela', pinguela.x, pinguela.z), D('Concello', -315, 183), D('Hospital', -513, -311),
    D('Praza de España', 54, 263), D('Estación de autobuses', 390, -260), D('Alcampo', 646, 712)];
  // menú: voo polos monumentos
  const cam = (px, pz, ph, lx, lz, lh, n) => ({ p: [px, Math.max(terrainH(px, pz), 0) + ph, pz], l: [lx, Math.max(terrainH(lx, lz), 0) + lh, lz], n });
  { const [a, b] = co(8, 83), [c, d] = co(35, 131); const [e, f] = co(35, 71), [g2, h] = co(35, 134); const [s1, s2] = so(179, -288), [s3, s4] = so(229, -218);
    TOUR = [
      cam(a, b, 9, c, d, 16, 'Colexio da Compañía'),
      cam(HILL.x + Math.sin(G.castleGate.yaw) * 120, HILL.z + Math.cos(G.castleGate.yaw) * 120, 22, HILL.x, HILL.z, 14, 'Castelo de San Vicente'),
      cam(V.x - V.uz * 32 + V.ux * 10, V.z + V.ux * 32 + V.uz * 10, 6, V.x, V.z, 2, 'Ponte Vella sobre o Cabe'),
      cam(cd.at(2).x, cd.at(2).z, 9, cd.at(60).x, cd.at(60).z, 4, 'Rúa do Cardeal'),
      cam(pc.x + 38, pc.z - 32, 14, pc.x, pc.z, 4, 'Parque dos Condes'),
      cam(mal.x - mal.uz * M.side * -20, mal.z + mal.ux * M.side * -20, 8, mal.x - mal.uz * M.side * 6, mal.z + mal.ux * M.side * 6, 2, 'Paseo do Malecón'),
      cam(e, f, 12, g2, h, 14, 'Colexio da Compañía'),
      cam(s1, s2, 14, s3, s4, 3, 'Estación de Monforte'),
    ]; }
  // etiquetas do mapa
  const mid = P => P.at(P.len / 2);
  G.mapLabels = [['CASTELO', HILL.x, HILL.z], ['PARQUE DOS CONDES', pc.x, pc.z + 30], ['MALECÓN', mal.x, mal.z], ['ESTACIÓN', stationFront.x - 40, stationFront.z],
    ['RÚA DO CARDEAL', mid(cd).x + 30, mid(cd).z], ['COMPAÑÍA', comp.x - 60, comp.z], ['PONTE VELLA', V.x, V.z - 14], ['SANTA CLARA', LM.clara.ox - 30, LM.clara.oz], ['A PINGUELA', G.pinguela.x, G.pinguela.z],
    ['RÍO CABE', -40, -200], ['PRAZA DE ESPAÑA', 54, 255], ['HOSPITAL', -513, -311], ['CONCELLO', -315, 183], ['EMBARCADOIRO', G.jetty.x - 30, G.jetty.z]];
  // botóns do mapa
  const wp = { 'Castelo': gate, 'Ponte Vella': V, 'Rúa do Cardeal': mid(cd), 'Parque dos Condes': park, 'Estación': stationFront, 'Compañía': comp, 'A Pinguela': pinguela };
  document.querySelectorAll('[data-wp]').forEach(b => { const q = wp[b.textContent.trim()]; if (q) b.dataset.wp = q.x.toFixed(1) + ',' + q.z.toFixed(1); });
  // viaxe rápida
  const F = (n, d, p, yaw) => ({ n, d, x: p.x, z: p.z, yaw });
  const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const compP = (([x, z]) => ({ x, z }))(co(35, 100)), pkP = { x: pc.x + 0, z: pc.z }, pkStand = (() => { const d = Math.hypot(park.x - pc.x, park.z - pc.z) || 1; return { x: pc.x + (park.x - pc.x) / d * 28, z: pc.z + (park.z - pc.z) / d * 28 }; })();
  const malP = (() => { const q = M.path.at(M.path.len * 0.5); return { x: q.x - q.uz * M.side * 5.5, z: q.z + q.ux * M.side * 5.5 }; })();
  FT_DESTS.length = 0;
  FT_DESTS.push(
    F('Praza da Compañía', 'Colexio dos Escolapios', compP, LM.comp.yaw(0)),
    F('Castelo de San Vicente', 'Torre da Homenaxe e Mosteiro', G.castleGate, G.castleGate.yaw),
    F('Ponte Vella', 'Santa Clara e Praza Dr. Goyanes', vW, yawTo(vW, V)),
    F('Rúa do Cardeal', 'Bares e terrazas', cdA, yawTo(cdA, cd.at(20))),
    F('Paseo do Malecón', 'Feira do Viño e manifestación', malP, yawTo(malP, M.path.at(M.path.len * 0.5))),
    F('Parque dos Condes', 'A gran fonte e Los Roncolas', pkStand, yawTo(pkStand, pkP)),
    F('Campo da Pinguela', 'Campo de fútbol', pinguela, yawTo(pinguela, G.pinguela)),
    F('Estación de Monforte', 'Andéns e Museo do Ferrocarril', stationFront, LM.station.yaw(Math.PI / 2)),
  );
}
