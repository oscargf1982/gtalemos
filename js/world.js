'use strict';
/* ==========================================================
   LEMOS 27400 · construción da cidade
   ========================================================== */
const MAT = {};
G.nightMats = [];     // {mat, base, k}: emissiveIntensity = base + night*k
G.lamps = [];          // posicións de farolas (para luces dinámicas)
G.parking = [];        // prazas de aparcamento {x,z,yaw}
G.seats = [];          // asentos de terrazas {x,z,yaw,y}
G.bars = [];           // bares do Cardeal
G.bottles = [];        // coleccionables
G.parkPoints = [];     // puntos de paseo do parque
G.anims = [];          // obxectos animados (fonte, bandeira...)

function nightMat(mat, base, k) { G.nightMats.push({ mat, base, k }); return mat; }
function std(o) { return new THREE.MeshStandardMaterial(o); }

function makeMaterials(Q) {
  MAT.road = std({ map: TEX.road, normalMap: TEX.asphaltN, roughness: 0.9, metalness: 0 });
  MAT.asphRoad = std({ map: TEX.asphaltPlain, normalMap: TEX.asphaltN, roughness: 0.9 });
  MAT.paving = std({ map: TEX.sidewalk, normalMap: TEX.sidewalkN, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  MAT.curb = std({ color: 0x9a968d, roughness: 0.8 });
  MAT.asphalt = std({ map: TEX.asphaltPlain, normalMap: TEX.asphaltN, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  MAT.sidewalk = std({ map: TEX.sidewalk, normalMap: TEX.sidewalkN, roughness: 0.85 });
  MAT.cobble = std({ map: TEX.cobble, normalMap: TEX.cobbleN, roughness: 0.75, normalScale: new THREE.Vector2(1.2, 1.2) });
  MAT.grass = std({ map: TEX.grass, normalMap: TEX.grassN, roughness: 1, vertexColors: true });
  MAT.parkGrass = std({ map: TEX.grass, normalMap: TEX.grassN, roughness: 1, color: 0xb8e09a, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  MAT.gravel = std({ map: TEX.gravel, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  MAT.stone = std({ map: TEX.stone, normalMap: TEX.stoneN, roughness: 0.88 });
  MAT.tile = std({ map: TEX.tile, normalMap: TEX.tileN, roughness: 0.8 });
  MAT.slate = std({ map: TEX.slate, roughness: 0.55, metalness: 0.15 });
  MAT.flatRoof = std({ color: 0x6d6a66, roughness: 0.95 });
  MAT.facades = TEX.facades.map(f => nightMat(std({ map: f.map, normalMap: f.normal, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.82 }), 0, 1.15));
  MAT.shop = nightMat(std({ map: TEX.shops.map, emissiveMap: TEX.shops.emissive, emissive: 0xffffff, roughness: 0.6 }), 0.05, 1.1);
  MAT.bar = nightMat(std({ map: TEX.bars.map, emissiveMap: TEX.bars.emissive, emissive: 0xffffff, roughness: 0.6 }), 0.35, 1.3);
  MAT.station = nightMat(std({ map: TEX.estacion.map, emissiveMap: TEX.estacion.emissive, emissive: 0xffffff, roughness: 0.8 }), 0, 1.1);
  MAT.colegio = nightMat(std({ map: TEX.colegio.map, normalMap: TEX.colegio.normal, emissiveMap: TEX.colegio.emissive, emissive: 0xffffff, roughness: 0.85 }), 0, 0.7);
  MAT.metalDark = std({ color: 0x2b2e33, roughness: 0.45, metalness: 0.7 });
  MAT.metal = std({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 });
  MAT.rail = std({ color: 0x8a8580, roughness: 0.35, metalness: 0.9 });
  MAT.wood = std({ color: 0x6b4a2e, roughness: 0.8 });
  MAT.white = std({ color: 0xf2f0ea, roughness: 0.6 });
  MAT.concrete = std({ color: 0xa8a49b, roughness: 0.95 });
  MAT.ballast = std({ map: TEX.gravel, color: 0x6e6a64, roughness: 1 });
  MAT.lampHead = nightMat(std({ color: 0xfff1d0, emissive: 0xffc77a, emissiveIntensity: 0.1, roughness: 0.4 }), 0.05, 3.2);
  MAT.bulb = nightMat(std({ color: 0xfff1c4, emissive: 0xffd08a, emissiveIntensity: 0.2, roughness: 0.4 }), 0.25, 4);
  MAT.bronze = std({ color: 0x4f5a40, roughness: 0.45, metalness: 0.85 });
  MAT.trunk = std({ color: 0x5a4632, roughness: 0.95 });
  MAT.leaves = std({ color: 0xffffff, roughness: 0.9, flatShading: true });
  MAT.pine = std({ color: 0x2f4a2a, roughness: 0.95, flatShading: true });
  MAT.canvas = std({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide, vertexColors: false });
  MAT.water = std({ color: 0x26423c, roughness: 0.06, metalness: 0.25, normalMap: TEX.waterN, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.92 });
  MAT.waterJet = std({ color: 0xcfe8f0, roughness: 0.1, transparent: true, opacity: 0.55 });
  MAT.glassDark = std({ color: 0x1b2228, roughness: 0.08, metalness: 0.6 });
  MAT.vertexCol = std({ vertexColors: true, roughness: 0.8 });
  const all = Object.values(MAT).flat(); for (const m of all) if (m && m.isMaterial && m !== MAT.water) m.envMapIntensity = 0.35;
}

/* ---------- Cinta que segue o chan ---------- */
function ribbon(pts, w, { step = 4, vScale = 12, yFn = null, yOff = 0.03, closed = false } = {}) {
  // reamostraxe da polilínea
  const S = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) S.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]);
  }
  S.push(pts[pts.length - 1]);
  const P = [], U = [], I = []; let acc = 0;
  for (let i = 0; i < S.length; i++) {
    const p = S[i], a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz, nz = tx;
    if (i > 0) acc += Math.hypot(p[0] - S[i - 1][0], p[1] - S[i - 1][1]);
    for (const s of [-1, 1]) {
      const x = p[0] + nx * w / 2 * s, z = p[1] + nz * w / 2 * s;
      const y = (yFn ? yFn(x, z) : 0) + yOff;
      P.push(x, y, z); U.push(s < 0 ? 0 : 1, acc / vScale);
    }
    if (i > 0) { const o = (i - 1) * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
const surfY = (x, z) => { const b = bridgeAt(x, z); if (b) return bridgeDeck(b, x, z); return Math.max(terrainH(x, z), 0); };

/* ======================================================== */
function buildWorld(scene, Q) {
  makeMaterials(Q);
  const B = {
    road: new Batch(MAT.road, { cast: false }), asphRoad: new Batch(MAT.asphRoad, { cast: false }), asphalt: new Batch(MAT.asphalt, { cast: false }), sidewalk: new Batch(MAT.sidewalk), curb: new Batch(MAT.curb, { cast: false }), paving: new Batch(MAT.paving, { cast: false }),
    cobble: new Batch(MAT.cobble, { cast: false }), stone: new Batch(MAT.stone), tile: new Batch(MAT.tile), slate: new Batch(MAT.slate),
    flat: new Batch(MAT.flatRoof), shop: new Batch(MAT.shop), bar: new Batch(MAT.bar), station: new Batch(MAT.station), colegio: new Batch(MAT.colegio),
    metalDark: new Batch(MAT.metalDark), metal: new Batch(MAT.metal), rail: new Batch(MAT.rail, { cast: false }), wood: new Batch(MAT.wood), white: new Batch(MAT.white),
    concrete: new Batch(MAT.concrete), ballast: new Batch(MAT.ballast, { cast: false }), gravel: new Batch(MAT.gravel, { cast: false }), park: new Batch(MAT.parkGrass, { cast: false }),
    bronze: new Batch(MAT.bronze), vcol: new Batch(MAT.vertexCol), glass: new Batch(MAT.glassDark),
  };
  const F = MAT.facades.map(m => new Batch(m));
  const T0 = performance.now(), lap = n => { if (window.__test) console.log('build', n, Math.round(performance.now() - T0)); };
  computeLandmarks(); lap('landmarks');
  buildGround(scene, Q); lap('ground');
  buildRiverOSM(scene);
  buildRoadsOSM(B); lap('roads');
  buildBridgesOSM(B, scene);
  buildCastle(B, scene); lap('castle');
  // monumentos deseñados nas súas coordenadas propias e colocados no plano real (OSM)
  { const C = LM.comp; inFrame(B, scene, C.ox, C.oz, C.rot, (LB, g) => { buildCompanhia2(LB, g); buildCompanhiaGarden(LB, g); }); const [sx, sz] = C.pt(G.statue.x, G.statue.z); G.statue = { x: sx, z: sz }; }
  { const C = LM.clara; inFrame(B, scene, C.ox, C.oz, C.rot, (LB, g) => buildClarisas(LB, g)); }
  { const C = LM.ping; inFrame(B, scene, C.ox, C.oz, C.rot, (LB, g) => buildPinguela(LB, g));
    const m = C.pt(G.motoSpot.x, G.motoSpot.z); G.motoSpot = { x: m[0], z: m[1], yaw: C.yaw(G.motoSpot.yaw) };
    const pc = C.pt(G.pinguela.x, G.pinguela.z), gt = C.pt(G.pinguela.gate.x, G.pinguela.gate.z); G.pinguela = { x: pc[0], z: pc[1], gate: { x: gt[0], z: gt[1] } }; }
  { const C = LM.station; inFrame(B, scene, C.ox, C.oz, C.rot, (LB, g) => { buildStation(LB, g); buildRailYard(LB, g); buildStationPlaza(LB, g); });
    G.stationCenter = (([x, z]) => ({ x, z }))(C.pt(315, 0)); }
  { const C = LM.ferro; inFrame(B, scene, C.ox, C.oz, C.rot, (LB, g) => buildFerroviario(LB, g)); }
  { const C = LM.cons; inFrame(B, scene, C.ox, C.oz, C.rot, (LB, g) => buildConservatorio(LB, g)); }
  buildClubFluvial(B, scene);
  buildSajoniSpot(B, scene);
  buildArenal(B, scene);
  buildUcelers(B, scene);
  buildPlazaHotels(B, scene);
  if (typeof buildCarude === 'function') buildCarude();
  if (typeof buildConcello === 'function') buildConcello(B, scene);
  if (typeof buildAbeledos === 'function') buildAbeledos(B, scene);
  buildGoyanes(B, scene);
  if (LM.volei) { const V = LM.volei; inFrame(B, scene, V.ox, V.oz, V.rot, (LB, g) => buildVoleiCourt(LB, g)); }
  buildRailsOSM(B, scene, (x, z) => { const [lx, lz] = LM.station.inv(x, z); return lx > 330 && lx < 432 && Math.abs(lz) < 176; });
  lap('monuments');
  buildParkOSM(B, scene);
  buildCardealOSM(B, F, scene);
  buildDetails(B, scene); lap('details');
  buildAreasOSM(B, scene); lap('areas');
  buildOSMBuildings(B, F); lap('osm bldgs');
  buildFrontage(B, F, Q); lap('frontage ' + G.nFrontage);
  buildStreetProps(B, scene, Q);
  buildBottles(scene);
  buildTrees(scene, Q); lap('trees ' + G.nTrees);
  buildGlows(scene);
  for (const k in B) B[k].build(scene);
  F.forEach(b => b.build(scene));
  lap('batches');
  if (typeof relevoInit === 'function') relevoInit();
}

/* ---------- Monte e Castelo de San Vicente ---------- */
function bench(B, x, y, z, yaw) {
  const s = boxGeo(1.8, 0.08, 0.45); xform(s, x, y + 0.45, z, yaw); B.wood.add(s);
  const b = boxGeo(1.8, 0.4, 0.06); xform(b, x - Math.sin(yaw) * 0.22, y + 0.72, z - Math.cos(yaw) * 0.22, yaw); B.wood.add(b);
  for (const s2 of [-1, 1]) { const l = boxGeo(0.06, 0.45, 0.45); xform(l, x + Math.cos(yaw) * s2 * 0.8, y + 0.22, z - Math.sin(yaw) * s2 * 0.8, yaw); B.metalDark.add(l); }
}

/* ---------- Edificios ---------- */
G.buildingsList = [];
/* ---------- Rúa do Cardeal: bares, terrazas, galerías ---------- */
const BAR_NAMES = ['Bar O Cardeal', 'Taberna A Ponte', 'Mesón do Cabe', 'Bar Os Condes', 'Tapería Remberde', 'Viños Mencía', 'O Recuncho', 'Café Lemos', 'Pulpería A Compañía', 'A Cunca', 'Bar O Muíño', 'Furancho da Rúa'];
const BAR_COLORS = ['#ff4f6d', '#ffb347', '#62e0ff', '#9dff7a', '#ff7ae0', '#ffd75e', '#ff8a5c', '#7ab8ff', '#ff5e5e', '#5effc4', '#e0b0ff', '#ffe08a'];
/* ---------- Estación de tren e Museo do Ferrocarril ---------- */
function buildStation(B, scene) {
  const x0 = 321, x1 = 335, zc = 0;
  const part = (za, zb, h) => { const g = boxGeo(x1 - x0, h, zb - za, [16, 8]); xform(g, (x0 + x1) / 2, h / 2, (za + zb) / 2); B.station.add(g); const r = hipRoof(x1 - x0, zb - za, 3.2, 4, 0.7); xform(r, (x0 + x1) / 2, h, (za + zb) / 2); B.slate.add(r); addBoxCol(x0, za, x1, zb, h + 4, 'estacion'); };
  part(-56, -14, 8); part(14, 56, 8); part(-14, 14, 12);
  // cornixa e esquinais
  for (const z of [-56, -14, 14, 56]) { const q = boxGeo(x1 - x0 + 0.3, z === -14 || z === 14 ? 12 : 8, 0.8, [3, 3]); xform(q, (x0 + x1) / 2, (z === -14 || z === 14 ? 6 : 4), z); B.stone.add(q); }
  // letreiro
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.6), std({ map: textTex('MONFORTE DE LEMOS', { w: 1024, h: 112, bg: '#1d2b3a', fg: '#f4f0e6', size: 82, border: '#c8b68a' }), roughness: .5 }));
  sign.position.set(x0 - 0.06, 10.4, zc); sign.rotation.y = -Math.PI / 2; scene.add(sign);
  const sign2 = sign.clone(); sign2.position.set(x1 + 0.06, 10.4, zc); sign2.rotation.y = Math.PI / 2; scene.add(sign2);
  // reloxo (marca a hora do xogo)
  const cc = cnv(256, 256); const clockTex = toTex(cc, false);
  const drawClock = (hh, mm) => { const x = cc.getContext('2d'); x.clearRect(0, 0, 256, 256); x.fillStyle = '#f6f1e2'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = '#2b2b2b'; x.stroke(); x.fillStyle = '#222'; for (let i = 0; i < 12; i++) { x.save(); x.translate(128, 128); x.rotate(i / 12 * Math.PI * 2); x.fillRect(-3, -110, 6, 18); x.restore(); } const hand = (a, l, w) => { x.save(); x.translate(128, 128); x.rotate(a); x.fillRect(-w / 2, -l, w, l + 10); x.restore(); }; hand((hh % 12 + mm / 60) / 12 * Math.PI * 2, 60, 9); hand(mm / 60 * Math.PI * 2, 95, 6); clockTex.needsUpdate = true; };
  G.drawClock = drawClock; drawClock(10, 10);
  const clockMat = nightMat(std({ map: clockTex, emissiveMap: clockTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: .5 }), 0, 0.6);
  for (const [x, ry] of [[x0 - 0.08, -Math.PI / 2], [x1 + 0.08, Math.PI / 2]]) { const c = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), clockMat); c.position.set(x, 8.2, zc); c.rotation.y = ry; scene.add(c); }
  // andéns
  const plat = (xa, xb, za, zb) => { const g = boxGeo(xb - xa, 1.3, zb - za, [3, 3]); xform(g, (xa + xb) / 2, 0.05, (za + zb) / 2); B.sidewalk.add(g); const e = boxGeo(0.35, 0.02, zb - za); xform(e, xb - 0.5, 0.71, (za + zb) / 2); B.vcol.add(colorize(e, '#e8c22a')); addSidewalkPlat(xa, za, xb, zb); };
  plat(335, 346.7, -95, 95); plat(352.6, 357.6, -75, 75);
  const e2 = boxGeo(0.35, 0.02, 150); xform(e2, 353.1, 0.71, 0); B.vcol.add(colorize(e2, '#e8c22a'));
  // marquesiñas de ferro fundido
  const canopy = (xa, xb, za, zb) => { const g = boxGeo(xb - xa, 0.18, zb - za); xform(g, (xa + xb) / 2, 4.8, (za + zb) / 2, 0, 0, 0.05); B.metalDark.add(g); for (let z = za + 3; z < zb; z += 9) { const c = new THREE.CylinderGeometry(0.12, 0.16, 4.1, 8); xform(c, (xa + xb) / 2, 2.75, z); B.metalDark.add(c); addCircCol((xa + xb) / 2, z, 0.25, 5, 'columna'); for (const s of [-1, 1]) { const br = boxGeo(0.08, 0.08, 2.2); xform(br, (xa + xb) / 2, 4.3, z + s * 0.9, 0, s * 0.6); B.metalDark.add(br); } } };
  canopy(336, 345.5, -50, 50); canopy(353.2, 357, -40, 40);
  // vías: balasto, travesas e carrís (ancho ibérico 1668 mm)
  const tracks = [348.5, 361.5, 368, 374.5, 381];
  G.tracks = tracks;
  const sleepers = [];
  for (const tx of tracks) {
    const bal = boxGeo(3.4, 0.35, 360, [3, 3]); xform(bal, tx, 0.05, 0); B.ballast.add(bal);
    for (const s of [-1, 1]) { const rl = boxGeo(0.08, 0.16, 360); xform(rl, tx + s * 0.834, 0.3, 0); B.rail.add(rl); }
    for (let z = -180; z < 180; z += 0.75) sleepers.push([tx, z]);
  }
  const sm = new THREE.InstancedMesh(boxGeo(2.6, 0.14, 0.28), MAT.concrete, sleepers.length); const o = new THREE.Object3D();
  sleepers.forEach(([x, z], i) => { o.position.set(x, 0.24, z); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.receiveShadow = true; scene.add(sm);
  // vagóns históricos aparcados (colección do museo)
  // Museo do Ferrocarril (antigas cocheiras do depósito de vapor)
  const mx0 = 396, mx1 = 428, mz0 = -178, mz1 = -110;
  const mg = boxGeo(mx1 - mx0, 9, mz1 - mz0, FAC_TILE); xform(mg, (mx0 + mx1) / 2, 4.5, (mz0 + mz1) / 2);
  const brick = new Batch(MAT.facades[5]); brick.add(mg);
  const mr = boxGeo(mx1 - mx0 + 1, 0.6, mz1 - mz0 + 1); xform(mr, (mx0 + mx1) / 2, 9.3, (mz0 + mz1) / 2); B.slate.add(mr);
  for (let i = 0; i < 4; i++) { const d = boxGeo(0.3, 6, 5); xform(d, mx0 - 0.1, 3, mz0 + 10 + i * 15); B.glass.add(d); }
  brick.build(scene);
  addBoxCol(mx0, mz0, mx1, mz1, 12, 'museo');
  const ms = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.4), std({ map: textTex('MUSEO DO FERROCARRIL DE GALICIA', { w: 1024, h: 100, bg: '#5a1a1a', fg: '#f4ead2', size: 56 }), roughness: .6 }));
  ms.position.set(mx0 - 0.25, 7.3, (mz0 + mz1) / 2); ms.rotation.y = -Math.PI / 2; scene.add(ms);
  // locomotora de vapor exposta
  const loco = makeSteamLoco(); loco.position.set(392.5, 0.35, -95); scene.add(loco);
  addBoxCol(391, -103, 394, -87, 4, 'loco');
  const st = boxGeo(3, 0.3, 24); xform(st, 392.5, 0.1, -95); B.ballast.add(st);
  for (const s of [-1, 1]) { const rl = boxGeo(0.08, 0.16, 24); xform(rl, 392.5 + s * 0.834, 0.33, -95); B.rail.add(rl); }
}
function addSidewalkPlat(x0, z0, x1, z1) { const s = addSWRect(x0, z0, x1, z1, 0.7); G.platforms = G.platforms || []; G.platforms.push(s); }
function makeSteamLoco() {
  const g = new THREE.Group(), blk = std({ color: 0x15161a, roughness: .45, metalness: .6 }), red = std({ color: 0x8c1d18, roughness: .5, metalness: .3 }), brass = std({ color: 0xb08d3a, roughness: .3, metalness: .9 });
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 7, 20), blk); boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 2.1, 1); g.add(boiler);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.4), blk); cab.position.set(0, 2.6, -3.4); g.add(cab);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.15, 2.8), blk); roof.position.set(0, 3.95, -3.4); g.add(roof);
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 1.2, 12), blk); chim.position.set(0, 3.4, 3.6); g.add(chim);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), brass); dome.position.set(0, 3, 0.8); g.add(dome);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 9.5), red); frame.position.set(0, 0.9, 0); g.add(frame);
  for (const z of [-1.8, 0, 1.8]) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 20), red); w.rotation.z = Math.PI / 2; w.position.set(s * 1.0, 0.75, z); g.add(w); }
  const buf = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 0.3), red); buf.position.set(0, 1.0, 4.8); g.add(buf);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

