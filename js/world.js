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
    road: new Batch(MAT.road, { cast: false }), asphalt: new Batch(MAT.asphalt, { cast: false }), sidewalk: new Batch(MAT.sidewalk),
    cobble: new Batch(MAT.cobble, { cast: false }), stone: new Batch(MAT.stone), tile: new Batch(MAT.tile), slate: new Batch(MAT.slate),
    flat: new Batch(MAT.flatRoof), shop: new Batch(MAT.shop), bar: new Batch(MAT.bar), station: new Batch(MAT.station), colegio: new Batch(MAT.colegio),
    metalDark: new Batch(MAT.metalDark), metal: new Batch(MAT.metal), rail: new Batch(MAT.rail, { cast: false }), wood: new Batch(MAT.wood), white: new Batch(MAT.white),
    concrete: new Batch(MAT.concrete), ballast: new Batch(MAT.ballast, { cast: false }), gravel: new Batch(MAT.gravel, { cast: false }), park: new Batch(MAT.parkGrass, { cast: false }),
    bronze: new Batch(MAT.bronze), vcol: new Batch(MAT.vertexCol), glass: new Batch(MAT.glassDark),
  };
  const F = MAT.facades.map(m => new Batch(m));

  buildGround(scene, Q);
  buildRiver(scene);
  buildRoads(B);
  buildBridges(B);
  buildCastle(B, scene);
  buildCardeal(B, F, scene);
  // monumentos deseñados nas súas coordenadas propias e colocados no plano real
  inFrame(B, scene, 70, -41, 0, (LB, g) => buildCompanhia2(LB, g));
  G.statue = { x: G.statue.x + 70, z: G.statue.z - 41 };
  inFrame(B, scene, -26, 41.5, 0, (LB, g) => buildClarisas(LB, g));
  buildPark(B, scene);
  buildPinguela(B, scene);
  inFrame(B, scene, -111, -228, 0, (LB, g) => { buildStation(LB, g); buildRailYard(LB, g); });
  G.tracks = G.tracks.map(x => x - 111); G.stationZ = -228;
  buildDetails(B, scene);
  buildBuildings(B, F);
  buildProps(B, scene, Q);
  buildTrees(scene, Q);
  buildGlows(scene);
  for (const k in B) B[k].build(scene);
  F.forEach(b => b.build(scene));
}

/* ---------- Chan e montañas ---------- */
function buildGround(scene, Q) {
  const size = 1700, seg = Q === 'high' ? 380 : Q === 'med' ? 300 : 210;
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + 50, z = p.getZ(i) + 10; p.setX(i, x); p.setZ(i, z);
    const h = terrainH(x, z); p.setY(i, h);
    uv.setXY(i, x / 14, z / 14);
    // cor: verde máis escuro (bosque) no monte e montañas, lama no leito do río
    let r = 1, gg = 1, b = 1;
    if (h > 3) { const t = clamp(h / 60, 0, 1); r = lerp(.9, .55, t); gg = lerp(.95, .7, t); b = lerp(.85, .55, t); }
    if (h < -0.5) { r = .75; gg = .68; b = .5; }
    const n = 0.9 + 0.2 * Math.max(0, noise2(x * 3, z * 3));
    col[i * 3] = r * n; col[i * 3 + 1] = gg * n; col[i * 3 + 2] = b * n;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, MAT.grass); m.receiveShadow = true; scene.add(m);
  G.groundMesh = m;

  // montañas da Ribeira Sacra no horizonte
  const mg = new THREE.CylinderGeometry(1500, 1500, 1, 160, 6, true);
  const mp = mg.attributes.position, mc = new Float32Array(mp.count * 3);
  for (let i = 0; i < mp.count; i++) {
    const x = mp.getX(i), z = mp.getZ(i), a = Math.atan2(z, x), yN = mp.getY(i) + 0.5;
    const hh = 80 + 120 * Math.abs(Math.sin(a * 3.1) * Math.cos(a * 5.3 + 1)) + 40 * Math.sin(a * 17);
    mp.setY(i, yN * hh - 20);
    const s = 1 - yN * 0.25; mc[i * 3] = .36 * s; mc[i * 3 + 1] = .45 * s; mc[i * 3 + 2] = .42 * s;
  }
  mg.setAttribute('color', new THREE.BufferAttribute(mc, 3)); mg.computeVertexNormals();
  const mm = new THREE.Mesh(mg, std({ vertexColors: true, roughness: 1, side: THREE.BackSide }));
  mm.position.set(50, 0, 10); scene.add(mm);
}

/* ---------- Río Cabe ---------- */
function buildRiver(scene) {
  const pts = RIVER.filter((p, i) => i % 1 === 0);
  const g = ribbon(pts, (RIVER_HW - 1.5) * 2, { step: 6, vScale: 18, yOff: -1.05 });
  // UV en coordenadas de mundo para o mapa de normais
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 22, p.getZ(i) / 22);
  const m = new THREE.Mesh(g, MAT.water); m.receiveShadow = true; scene.add(m);
  G.water = m;
}

/* ---------- Rúas, beirarrúas, pasos de peóns ---------- */
function buildRoads(B) {
  const crosswalkTex = (() => { const c = cnv(256, 64), x = c.getContext('2d'); x.clearRect(0, 0, 256, 64); x.fillStyle = 'rgba(240,240,232,.92)'; for (let i = 0; i < 8; i++) x.fillRect(i * 32 + 6, 4, 18, 56); return toTex(c, false); })();
  const cwMat = std({ map: crosswalkTex, transparent: true, roughness: .7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const cwB = new Batch(cwMat, { cast: false });

  for (const r of ROADS) {
    const pts = r.dir === 'ns' ? [[r.x, r.z0], [r.x, r.z1]] : [[r.x0, r.z], [r.x1, r.z]];
    if (r.type === 'ped') {
      // Ponte Vella + Cardeal: granito, máis largo (inclúe beirarrúas)
      const full = r.w + SIDEWALK * 2 + 0.8, vb = BRIDGES.find(b => b.type === 'vella' && b.dir === r.dir && (r.dir === 'ns' ? b.x === r.x : b.z === r.z));
      const P2 = (a, b) => r.dir === 'ns' ? [[r.x, a], [r.x, b]] : [[a, r.z], [b, r.z]];
      const a0 = r.dir === 'ns' ? r.z0 : r.x0, a1 = r.dir === 'ns' ? r.z1 : r.x1;
      let parts = [[P2(a0, a1), full]];
      if (vb) { const za = vb.c - RIVER_HW - 2.5, zb = vb.c + RIVER_HW + 2.5; parts = [[P2(a0, za), full], [P2(za, zb), vb.hw * 2 - 1.25], [P2(zb, a1), full]]; }
      for (const [pp, w] of parts) {
        const g = ribbon(pp, w, { step: 0.75, vScale: 6, yFn: surfY, yOff: 0.05 });
        const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
        B.cobble.add(g);
      }
      continue;
    }
    B.road.add(ribbon(pts, r.w, { step: 4, vScale: 12, yFn: surfY, yOff: 0.03 }));
    // beirarrúas partidas nas interseccións
    const cuts = [];
    for (const o of ROADS) {
      if (o === r) continue;
      if (r.dir === 'ns' && o.dir === 'ew' && r.x > o.x0 - 1 && r.x < o.x1 + 1 && o.z > r.z0 - 8 && o.z < r.z1 + 8) cuts.push([o.z - o.hw - SIDEWALK, o.z + o.hw + SIDEWALK]);
      if (r.dir === 'ew' && o.dir === 'ns' && r.z > o.zz0 - 1 && r.z < o.zz1 + 1 && o.x > r.x0 - 8 && o.x < r.x1 + 8) cuts.push([o.x - o.hw - SIDEWALK, o.x + o.hw + SIDEWALK]);
    }
    cuts.sort((a, b) => a[0] - b[0]);
    const a0 = r.dir === 'ns' ? r.z0 : r.x0, a1 = r.dir === 'ns' ? r.z1 : r.x1;
    let segs = [[a0, a1]];
    for (const c of cuts) { const ns = []; for (const s of segs) { if (c[1] <= s[0] || c[0] >= s[1]) ns.push(s); else { if (c[0] > s[0]) ns.push([s[0], c[0]]); if (c[1] < s[1]) ns.push([c[1], s[1]]); } } segs = ns; }
    for (const s of segs) {
      if (s[1] - s[0] < 1) continue;
      for (const side of [-1, 1]) {
        if (r.name === 'Subida ao Castelo') continue; // acceso ao monte sen beirarrúa
        const off = r.hw + SIDEWALK / 2;
        if (r.dir === 'ns') {
          const x = r.x + side * off, L = s[1] - s[0];
          const g = boxGeo(SIDEWALK, 0.65, L, [3, 3]); xform(g, x, -0.175, (s[0] + s[1]) / 2);
          // nas pontes o chan está máis alto: elevar
          B.sidewalk.add(g);
          addSidewalk(x - SIDEWALK / 2, s[0], x + SIDEWALK / 2, s[1]);
        } else {
          const z = r.z + side * off, L = s[1] - s[0];
          const g = boxGeo(L, 0.65, SIDEWALK, [3, 3]); xform(g, (s[0] + s[1]) / 2, -0.175, z);
          B.sidewalk.add(g);
          addSidewalk(s[0], z - SIDEWALK / 2, s[1], z + SIDEWALK / 2);
        }
      }
    }
  }
  // interseccións e pasos de peóns
  for (const n of NODES) {
    const rs = new Set(n.edges.map(e => e.road)); if (rs.size < 2) continue;
    let wx = 0, wz = 0;
    for (const r of rs) { if (r.dir === 'ns') wx = Math.max(wx, r.w); if (r.dir === 'ew') wz = Math.max(wz, r.w); }
    if (!wx || !wz) continue;
    const g = new THREE.PlaneGeometry(wx, wz); g.rotateX(-Math.PI / 2); xform(g, n.x, 0.04, n.z);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * wx / 12, uv.getY(i) * wz / 12);
    B.asphalt.add(g);
    for (const e of n.edges) {
      if (e.road.type !== 'car' || e.road.spiral) continue;
      const dx = Math.sign(e.to.x - n.x), dz = Math.sign(e.to.z - n.z);
      const w = e.road.w, cw = new THREE.PlaneGeometry(w - 1, 3); cw.rotateX(-Math.PI / 2);
      if (dx) { cw.rotateY(Math.PI / 2); xform(cw, n.x + dx * (wx / 2 + 2.2), 0.045, n.z); }
      else xform(cw, n.x, 0.045, n.z + dz * (wz / 2 + 2.2));
      cwB.add(cw);
    }
  }
  // estrada do castelo
  B.road.add(ribbon(SPIRAL, 8, { step: 3, vScale: 12, yFn: (x, z) => terrainH(x, z), yOff: 0.12 }));
  cwB.build(G.scene);
}

/* ---------- Pontes ---------- */
function buildBridges(B) {
  for (const b of BRIDGES) {
    const zc = b.c, half = b.half || RIVER_HW + 2.5, HU = half - 0.5;
    if (b.type === 'road') {
      const ns = b.dir === 'ns', cx = ns ? b.x : b.c, cz = ns ? b.c : b.z;
      const dims = (along, across) => ns ? [across, along] : [along, across];
      const [sx, sz] = dims(half * 2, b.hw * 2);
      const g = boxGeo(sx, 1.2, sz, [3, 3]); xform(g, cx, -0.58, cz); B.concrete.add(g);
      for (const s2 of [-1, 1]) {
        const ox = ns ? s2 * (b.hw - 0.2) : 0, oz = ns ? 0 : s2 * (b.hw - 0.2);
        const [px, pz] = dims(half * 2, 0.25); const p = boxGeo(px, 1.0, pz); xform(p, cx + ox, 0.6, cz + oz); B.metal.add(p);
        const [kx, kz] = dims(half * 2, 0.5); const k = boxGeo(kx, 0.25, kz); xform(k, cx + ox, 0.12, cz + oz); B.concrete.add(k);
        if (ns) addBoxCol(b.x + s2 * b.hw - 0.4, zc - half, b.x + s2 * b.hw + 0.4, zc + half, 2, 'rail', -5);
        else addBoxCol(b.c - half, b.z + s2 * b.hw - 0.4, b.c + half, b.z + s2 * b.hw + 0.4, 2, 'rail', -5);
      }
      const [qx, qz] = dims(2, b.hw * 1.6); const pil = boxGeo(qx, 3, qz, [3, 3]); xform(pil, cx, -2.4, cz); B.concrete.add(pil);
      continue;
    }
    if (b.type === 'vella' || b.type === 'wood') {
      const fn = b.type === 'vella' ? buildPonteVella : buildWoodBridge, lb = { dir: 'ns', x: 0, c: 0, hw: b.hw, type: b.type };
      if (b.dir === 'ew') inFrame(B, G.scene, b.c, b.z, -Math.PI / 2, LB => fn(LB, lb)); else inFrame(B, G.scene, b.x, b.c, 0, LB => fn(LB, lb));
      continue;
    }
    // pontes de pedra con arcos
    const arches = b.type === 'vella' ? 4 : 2, width = b.hw * 2, len = half * 2 + 2;
    const shape = new THREE.Shape();
    const deck = u => (b.type === 'vella' ? 1.5 : 1.0) * Math.max(0, 1 - u * u);
    const N = 24; shape.moveTo(-len / 2, -3.6);
    shape.lineTo(-len / 2, 0.05);
    for (let i = 1; i <= N; i++) { const z = -len / 2 + len * i / N; shape.lineTo(z, deck(z / HU) - 0.06); }
    shape.lineTo(len / 2, -3.6);
    const span = (len - 4) / arches;
    for (let i = 0; i < arches; i++) {
      const c = -len / 2 + 2 + span * (i + 0.5), r = span * 0.42;
      const h = new THREE.Path(); h.moveTo(c - r, -3.7); h.lineTo(c - r, -1.6); h.absarc(c, -1.6, r, Math.PI, 0, true); h.lineTo(c + r, -3.7); h.lineTo(c - r, -3.7);
      shape.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 10 });
    // UV planar en pedra
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 4, p.getY(i) / 4);
    g.rotateY(Math.PI / 2); g.translate(b.x - width / 2, 0, zc);
    B.stone.add(g);
    if (b.type === 'park') { const pg = ribbon([[b.x, zc - half], [b.x, zc + half]], b.hw * 2 - 1.2, { step: 1, yFn: surfY, yOff: 0.035 }); const pp = pg.attributes.position, pu = pg.attributes.uv; for (let i = 0; i < pp.count; i++) pu.setXY(i, pp.getX(i) / 4, pp.getZ(i) / 4); B.cobble.add(pg); }
    // parapetos
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= N; i++) { const z = -len / 2 + len * i / N; pts.push([b.x + s * (b.hw - 0.3), zc + z]); }
      const pg = ribbon(pts, 0.6, { step: 1.5, vScale: 4, yFn: (x, z) => deck((z - zc) / HU) + 0.05, yOff: 0.55 });
      const pg2 = ribbon(pts, 0.6, { step: 1.5, vScale: 4, yFn: (x, z) => deck((z - zc) / HU) + 0.05, yOff: 1.0 });
      B.stone.add(pg2);
      // lateral do parapeto: caixas pequenas
      for (let i = 0; i < N; i++) {
        const z0 = -len / 2 + len * i / N, z1 = -len / 2 + len * (i + 1) / N, y0 = deck(z0 / HU), y1 = deck(z1 / HU);
        const seg = boxGeo(0.55, 1.0, len / N + 0.05, [3, 3]); xform(seg, b.x + s * (b.hw - 0.3), (y0 + y1) / 2 + 0.5, zc + (z0 + z1) / 2, 0, -Math.atan2(y1 - y0, len / N));
        B.stone.add(seg);
      }
      addBoxCol(b.x + s * b.hw - 0.6, zc - half, b.x + s * b.hw + 0.1 * s, zc + half, 2.5, 'rail', -5);
      if (s > 0) G.colGrid.m.forEach(() => { });
    }
    // corrixir colisor dereito (x0<x1)
    const last = COLLIDERS[COLLIDERS.length - 1]; if (last.x0 > last.x1) { const t = last.x0; last.x0 = last.x1; last.x1 = t; }
    // tallamares (quebraaugas) nos piares
    if (b.type === 'vella') for (let i = 1; i < arches; i++) {
      const c = -len / 2 + 2 + span * i; const cut = new THREE.CylinderGeometry(0.01, width * 0.55, 3.2, 4, 1); xform(cut, b.x, -2, zc + c, Math.PI / 4, 0, 0, 1, 1, 1);
      const cg = boxGeo(width + 2.4, 2.6, 2.4, [3, 3]); xform(cg, b.x, -2.2, zc + c, Math.PI / 4 * 0); B.stone.add(cg);
    }
  }
}

/* ---------- Monte e Castelo de San Vicente ---------- */
function buildCastle(B, scene) {
  const T = HILL.top, cx = HILL.x, cz = HILL.z;
  // praza de pedra na cima
  const disc = new THREE.CircleGeometry(HILL.r0 - 1, 48); disc.rotateX(-Math.PI / 2); xform(disc, cx, T + 0.04, cz);
  const uv = disc.attributes.uv, dp = disc.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, dp.getX(i) / 4, dp.getZ(i) / 4);
  B.cobble.add(disc);
  // muralla con ameas e torreóns
  const R0 = HILL.r0 - 1.5, gateA = Math.atan2(SPIRAL[SPIRAL.length - 1][0] - cx, SPIRAL[SPIRAL.length - 1][1] - cz);
  const step = 3.2 / R0;
  for (let a = 0; a < Math.PI * 2; a += step) {
    if (Math.abs(angDiff(a, gateA)) < 0.16) continue;
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
  // porta da muralla
  {
    const gx = cx + Math.sin(gateA) * R0, gz = cz + Math.cos(gateA) * R0;
    for (const s of [-1, 1]) { const px = gx + Math.cos(gateA) * s * 5.8, pz = gz - Math.sin(gateA) * s * 5.8; const t = boxGeo(3.6, 12, 4.2, [4, 4]); xform(t, px, T + 1, pz, gateA); B.stone.add(t); addCircCol(px, pz, 2.2, 12, 'porta', T - 6); }
    const arch = boxGeo(15, 2.6, 4.2, [4, 4]); xform(arch, gx, T + 6.4, gz, gateA); B.stone.add(arch);
  }
  inFrame(B, scene, HILL.x + 90, HILL.z + 155, 0, (LB, g) => { buildTorreHomenaxe(LB, g, T); buildMosteiro(LB, g, T); });
  G.torre.x += HILL.x + 90; G.torre.z += HILL.z + 155;
  // miradoiro: bancos
  for (let i = 0; i < 6; i++) { const a = gateA + 1.2 + i * 0.35, x = cx + Math.sin(a) * 30, z = cz + Math.cos(a) * 30; bench(B, x, T, z, a + Math.PI); }
  // piñeiros no monte (San Vicente "do Pino")
  G.hillPines = [];
  for (let i = 0; i < 260; i++) {
    const a = R() * Math.PI * 2, r = RR(HILL.r0 + 6, HILL.r1 + 4), x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
    let ok = true; for (const p of SPIRAL) if (Math.hypot(p[0] - x, p[1] - z) < 8) { ok = false; break; }
    if (ok && !inRoad(x, z, 3)) G.hillPines.push([x, terrainH(x, z), z]);
  }
  G.castleGate = { x: cx + Math.sin(gateA) * (R0 - 4), z: cz + Math.cos(gateA) * (R0 - 4) };
}
function bench(B, x, y, z, yaw) {
  const s = boxGeo(1.8, 0.08, 0.45); xform(s, x, y + 0.45, z, yaw); B.wood.add(s);
  const b = boxGeo(1.8, 0.4, 0.06); xform(b, x - Math.sin(yaw) * 0.22, y + 0.72, z - Math.cos(yaw) * 0.22, yaw); B.wood.add(b);
  for (const s2 of [-1, 1]) { const l = boxGeo(0.06, 0.45, 0.45); xform(l, x + Math.cos(yaw) * s2 * 0.8, y + 0.22, z - Math.sin(yaw) * s2 * 0.8, yaw); B.metalDark.add(l); }
}

/* ---------- Edificios ---------- */
G.buildingsList = [];
function lotOK(x0, z0, x1, z1) {
  if (x0 < MAP.minX + 4 || x1 > MAP.maxX || z0 < MAP.minZ + 4 || z1 > MAP.maxZ - 4) return false;
  for (const r of ROADS) { const p = SIDEWALK + 0.25; if (x1 > r.rx0 - p && x0 < r.rx1 + p && z1 > r.rz0 - p && z0 < r.rz1 + p) return false; }
  const hx = clamp(HILL.x, x0, x1), hz = clamp(HILL.z, z0, z1); if (Math.hypot(hx - HILL.x, hz - HILL.z) < HILL.r1 + 3) return false;
  for (const fx of [0, 0.5, 1]) for (const fz of [0, 0.5, 1]) if (riverDist(lerp(x0, x1, fx), lerp(z0, z1, fz)) < RIVER_HW + 7) return false;
  const P = ZONES.park; if (x1 > P.x0 - 2 && x0 < P.x1 + 2 && z1 > P.z0 - 2 && z0 < P.z1 + 2) return false;
  const CL = ZONES.clara; if (x1 > CL.x0 && x0 < CL.x1 && z1 > CL.z0 && z0 < CL.z1) return false;
  const ML = ZONES.malecon; if (x1 > ML.x0 && x0 < ML.x1 && z1 > ML.z0 && z0 < ML.z1) return false;
  const C = ZONES.companhia; if (x1 > C.x0 && x0 < C.x1 && z1 > C.z0 && z0 < C.z1) return false;
  const PG = ZONES.pinguela; if (x1 > PG.x0 && x0 < PG.x1 && z1 > PG.z0 && z0 < PG.z1) return false;
  if (x1 > ZONES.station.x0 - 1) return false;
  const q = G.colGrid.query((x0 + x1) / 2, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0), []);
  for (const o of q) if (o.k === 'b' && x1 > o.x0 + 0.05 && x0 < o.x1 - 0.05 && z1 > o.z0 + 0.05 && z0 < o.z1 - 0.05) return false;
  return true;
}
function addBuilding(B, F, x0, z0, x1, z1, opts = {}) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const floors = opts.floors || 3, style = opts.style !== undefined ? opts.style : RI(0, 6);
  const gh = 3.6, uh = floors * 3.1, H = gh + uh;
  // baixo comercial
  const gb = boxGeo(w, gh, d, SHOP_TILE); xform(gb, cx, gh / 2, cz); (opts.bar ? B.bar : B.shop).add(gb);
  // andares
  const ub = boxGeo(w, uh, d, FAC_TILE);
  // desprazamento de UV aleatorio en horizontal para que non se repitan os mesmos vans iluminados
  const uv = ub.attributes.uv, off = RI(0, 3) * 0.25, offv = RI(0, 3) * 0.25; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + off, uv.getY(i) + offv);
  xform(ub, cx, gh + uh / 2, cz); F[style].add(ub);
  // tellado
  const modern = TEX.facades[style].style === 'moderno';
  if (modern || opts.flat) {
    const cap = boxGeo(w + 0.2, 0.5, d + 0.2); xform(cap, cx, H + 0.25, cz); B.flat.add(cap);
    const t = boxGeo(2.5, 2.2, 2.5); xform(t, cx + RR(-w / 4, w / 4), H + 1.4, cz + RR(-d / 4, d / 4)); B.concrete.add(t);
  } else {
    const r = hipRoof(w, d, Math.min(w, d) * RR(0.24, 0.32), 4); xform(r, cx, H, cz); (R() < 0.72 ? B.tile : B.slate).add(r);
    // cheminea
    if (R() < 0.5) { const ch = boxGeo(0.8, 2, 0.8, [3, 3]); xform(ch, cx + RR(-w / 3, w / 3), H + 1.2, cz + RR(-d / 4, d / 4)); B.concrete.add(ch); }
  }
  // franxa de granito no zócalo
  const z0g = boxGeo(w + 0.08, 0.6, d + 0.08, [3, 3]); xform(z0g, cx, 0.3, cz); B.stone.add(z0g);
  addBoxCol(x0, z0, x1, z1, H + 2, 'edif', -5);
  G.buildingsList.push({ x0, z0, x1, z1, H });
  return H;
}
function frontageAlong(B, F, r, opts) {
  for (const side of [-1, 1]) {
    const front = r.hw + SIDEWALK + 0.35;
    const a0 = (r.dir === 'ns' ? r.z0 : r.x0), a1 = (r.dir === 'ns' ? r.z1 : r.x1);
    let t = a0 + RR(0, 4);
    while (t < a1) {
      const lw = opts.lw ? RR(...opts.lw) : RR(9, 17), dp = opts.dp ? RR(...opts.dp) : RR(11, 17);
      let x0, x1, z0, z1;
      if (r.dir === 'ns') { const xf = r.x + side * front; if (side > 0) { x0 = xf; x1 = xf + dp; } else { x1 = xf; x0 = xf - dp; } z0 = t; z1 = t + lw; }
      else { const zf = r.z + side * front; if (side > 0) { z0 = zf; z1 = zf + dp; } else { z1 = zf; z0 = zf - dp; } x0 = t; x1 = t + lw; }
      if (lotOK(x0, z0, x1, z1)) {
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        let floors, style;
        const central = cx > -230 && cx < 210 && cz > -45 && cz < 235;
        if (opts.floors) floors = RI(...opts.floors); else floors = central ? RI(3, 6) : RI(2, 4);
        if (central && R() < 0.12) floors = RI(6, 8);
        style = opts.styles ? pick(opts.styles) : (floors >= 6 ? pick([5, 1, 6, 0]) : (cz < -30 ? pick([3, 3, 0, 4, 2]) : RI(0, 6)));
        addBuilding(B, F, x0, z0, x1, z1, { floors, style, bar: opts.bar });
        t += lw + (R() < 0.15 ? RR(2, 6) : 0);
      } else t += 2;
    }
  }
}
function buildBuildings(B, F) {
  // estación: barrio con edificios de 3-5 andares
  for (const r of ROADS) {
    if (r.type !== 'car' || r.name === 'Subida ao Castelo') continue;
    frontageAlong(B, F, r, {});
  }
  // segunda fiada traseira en mazás grandes
  for (const r of ROADS) {
    if (r.type !== 'car' || r.name === 'Subida ao Castelo') continue;
    for (const side of [-1, 1]) {
      const a0 = (r.dir === 'ns' ? r.z0 : r.x0), a1 = (r.dir === 'ns' ? r.z1 : r.x1);
      for (let t = a0; t < a1; t += RR(12, 22)) {
        const front = r.hw + SIDEWALK + 0.35 + RR(24, 32), lw = RR(10, 16), dp = RR(10, 14);
        let x0, x1, z0, z1;
        if (r.dir === 'ns') { const xf = r.x + side * front; if (side > 0) { x0 = xf; x1 = xf + dp; } else { x1 = xf; x0 = xf - dp; } z0 = t; z1 = t + lw; }
        else { const zf = r.z + side * front; if (side > 0) { z0 = zf; z1 = zf + dp; } else { z1 = zf; z0 = zf - dp; } x0 = t; x1 = t + lw; }
        if (R() < 0.6 && lotOK(x0 - 2, z0 - 2, x1 + 2, z1 + 2)) addBuilding(B, F, x0, z0, x1, z1, { floors: RI(2, 4) });
      }
    }
  }
}

/* ---------- Rúa do Cardeal: bares, terrazas, galerías ---------- */
const BAR_NAMES = ['Bar O Cardeal', 'Taberna A Ponte', 'Mesón do Cabe', 'Bar Os Condes', 'Tapería Remberde', 'Viños Mencía', 'O Recuncho', 'Café Lemos', 'Pulpería A Compañía', 'A Cunca', 'Bar O Muíño', 'Furancho da Rúa'];
const BAR_COLORS = ['#ff4f6d', '#ffb347', '#62e0ff', '#9dff7a', '#ff7ae0', '#ffd75e', '#ff8a5c', '#7ab8ff', '#ff5e5e', '#5effc4', '#e0b0ff', '#ffe08a'];
function buildCardeal(B, F, scene) {
  const r = ROADS.find(o => o.type === 'ped' && o.dir === 'ns');
  const z0 = r.z0 + 6.5, z1 = r.z1 - 4;
  const front = r.hw + SIDEWALK + 0.35;
  let bi = 0;
  const tables = [], chairs = [], umbrellas = [], barrels = [], awnings = [];
  for (const side of [-1, 1]) {
    let z = z0 + (side > 0 ? 2 : 0);
    while (z < z1 - 4) {
      const lw = RR(7.5, 11), dp = RR(13, 16);
      const xf = r.x + side * front, x0 = side > 0 ? xf : xf - dp, x1 = side > 0 ? xf + dp : xf;
      const zz1 = Math.min(z + lw, z1);
      if (zz1 - z < 5) break;
      const isBar = bi < BAR_NAMES.length && R() < 0.85;
      addBuilding(B, F, x0, z, x1, zz1, { floors: RI(3, 4), style: pick([4, 4, 0, 1, 2, 4]), bar: isBar });
      if (isBar) {
        const name = BAR_NAMES[bi], col = BAR_COLORS[bi]; bi++;
        const zc = (z + zz1) / 2, fx = xf + side * -0.12;
        const yaw = side > 0 ? -Math.PI / 2 : Math.PI / 2; // mira á rúa
        // letreiro luminoso
        const tex = textTex(name.toUpperCase(), { w: 512, h: 96, bg: '#14100e', fg: col, size: 54, glow: true, border: col });
        const sm = nightMat(std({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.5 }), 0.25, 1.6);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(lw - 1.5, 5.2), 0.95), sm);
        sign.position.set(fx + side * -0.03, 3.05, zc); sign.rotation.y = yaw; scene.add(sign);
        // toldo
        awnings.push({ x: xf - side * 0.9, z: zc, w: lw - 1.2, yaw, col });
        // terraza: pipas (barrís) e mesas con sombrilla
        const tx = r.x + side * (r.hw - 0.5);
        const nT = RI(1, 2);
        for (let k = 0; k < nT; k++) {
          const tz = zc + (nT === 1 ? 0 : (k ? 2.2 : -2.2));
          if (R() < 0.45) {
            barrels.push([tx + side * 1.6, tz]);
            G.seats.push({ x: tx + side * 1.6 - side * 0.0, z: tz + 0.75, yaw: Math.PI, y: 0, stand: true });
            G.seats.push({ x: tx + side * 1.6, z: tz - 0.75, yaw: 0, y: 0, stand: true });
          } else {
            tables.push([tx, tz]); umbrellas.push([tx, tz, col]);
            for (const [ox, oz, ya] of [[0.8, 0, -Math.PI / 2], [-0.8, 0, Math.PI / 2], [0, 0.8, Math.PI], [0, -0.8, 0]]) { chairs.push([tx + ox, tz + oz, ya]); if (R() < 0.7) G.seats.push({ x: tx + ox, z: tz + oz, yaw: ya + Math.PI, y: 0, sit: true }); }
          }
          addCircCol(tx, tz, 0.7, 1.2, 'mesa', -1);
        }
        G.bars.push({ name, color: col, door: { x: xf - side * 1.6, z: zc }, side });
      }
      z = zz1;
    }
  }
  // placas co nome da rúa
  const plTex = textTex('Rúa do Cardeal', { w: 512, h: 128, bg: '#1f3f73', fg: '#f4f1e8', size: 66, border: '#f4f1e8', font: 'Barlow, sans-serif', weight: 600 });
  for (const [zz, side] of [[z0 + 1.5, -1], [z1 - 2, 1]]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), std({ map: plTex, roughness: .5 })); pl.position.set(r.x + side * (front - 0.08), 4.3, zz); pl.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(pl); }
  // instancias
  const inst = (geo, mat, list, fn) => { if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length); const o = new THREE.Object3D(); list.forEach((it, i) => { fn(o, it); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
  const tableG = mergeGeos([xform(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 16), 0, 0.74, 0), xform(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 6), 0, 0.36, 0), xform(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 12), 0, 0.02, 0)]);
  inst(tableG, MAT.metal, tables, (o, [x, z]) => { o.position.set(x, 0.03, z); o.rotation.set(0, 0, 0); });
  const chairG = mergeGeos([xform(boxGeo(0.42, 0.04, 0.42), 0, 0.45, 0), xform(boxGeo(0.42, 0.42, 0.04), 0, 0.68, -0.2), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => xform(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 5), a * 0.19, 0.22, b * 0.19))]);
  inst(chairG, MAT.metalDark, chairs, (o, [x, z, y]) => { o.position.set(x, 0.03, z); o.rotation.set(0, y, 0); });
  const barrelG = new THREE.CylinderGeometry(0.42, 0.42, 1.05, 16); barrelG.translate(0, 0.53, 0);
  inst(barrelG, MAT.wood, barrels, (o, [x, z]) => { o.position.set(x, 0.03, z); });
  // sombrillas coa cor do bar
  for (const [x, z, col] of umbrellas) {
    const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 8, 1, true), std({ color: new THREE.Color(col).lerp(new THREE.Color('#f4efe6'), 0.55), roughness: 0.9, side: THREE.DoubleSide }));
    u.position.set(x, 2.45, z); u.castShadow = true; scene.add(u);
    const p = boxGeo(0.05, 2.4, 0.05); xform(p, x, 1.2, z); B.metal.add(p);
  }
  for (const a of awnings) {
    const c = cnv(64, 64), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2eee6' : new THREE.Color(a.col).lerp(new THREE.Color('#5a1020'), 0.5).getStyleSRGB(); x.fillRect(i * 8, 0, 8, 64); }
    const g = new THREE.Mesh(new THREE.PlaneGeometry(a.w, 1.8), std({ map: toTex(c, false), roughness: .9, side: THREE.DoubleSide }));
    g.position.set(a.x, 3.75, a.z); g.rotation.set(0, a.yaw, 0); g.rotateX(-1.0); g.castShadow = true; scene.add(g);
  }
  // festóns de luces que cruzan a rúa
  const bulbs = [], wire = [];
  for (let z = z0 + 3; z < z1; z += 7) {
    const xa = r.x - front, xb = r.x + front, za = z, zb = z + 3.5, y0 = 6.6;
    let prev = null;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = lerp(xa, xb, t), zz = lerp(za, zb, t), y = y0 - Math.sin(t * Math.PI) * 1.1;
      if (prev) wire.push(prev[0], prev[1], prev[2], x, y, zz); prev = [x, y, zz];
      if (i % 1 === 0 && i > 0 && i < 14) bulbs.push([x, y - 0.12, zz]);
    }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
  inst(new THREE.SphereGeometry(0.09, 8, 6), MAT.bulb, bulbs, (o, [x, y, z]) => o.position.set(x, y, z)).castShadow = false;
  G.cardealLights = bulbs.filter((_, i) => i % 13 === 6).map(([x, y, z]) => ({ x, y, z }));
}

/* ---------- Parque dos Condes (orilla leste do Cabe, ao sur da Compañía) ---------- */
function buildPark(B, scene) {
  const P = ZONES.park, cx = -25, cz = 222;
  // céspede en teselas de 4 m só onde non hai río
  for (let x = P.x0; x < P.x1; x += 4) for (let z = P.z0; z < P.z1; z += 4) {
    if (!inPark(x + 2, z + 2)) continue;
    const g = new THREE.PlaneGeometry(4.02, 4.02); g.rotateX(-Math.PI / 2); xform(g, x + 2, 0.02, z + 2);
    const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 10, p.getZ(i) / 10);
    B.park.add(g);
  }
  const path = (pp, w = 3) => { const g = ribbon(pp, w, { step: 2, vScale: 4, yOff: 0.05 }); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 5, p.getZ(i) / 5); B.gravel.add(g); };
  const clipLine = (pts) => { const out = []; let cur = []; for (const p of pts) { if (inPark(p[0], p[1]) || (p[0] < P.x0 && riverDistRaw(p[0], p[1]) > RIVER_HW + 2.5)) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = []; } } if (cur.length > 1) out.push(cur); return out; };
  // eixos, anel arredor da fonte e diagonais
  for (const seg of clipLine(Array.from({ length: 60 }, (_, i) => [lerp(P.x0, P.x1, i / 59), cz]))) path(seg, 4);
  path([[cx, P.z0 + 1], [cx, cz - 16]], 4); path([[cx, cz + 16], [cx, P.z1 - 1]], 4);
  const ring = []; for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 32) ring.push([cx + Math.cos(a) * 22, cz + Math.sin(a) * 16]); path(ring, 3);
  path([[P.x1 - 2, P.z0 + 4], [cx + 18, cz - 10]], 2.5); path([[P.x1 - 2, P.z1 - 4], [cx + 18, cz + 10]], 2.5);
  // paseo fluvial pola beira, do parque ata A Pinguela
  const bank = [];
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b2 = RIVER[i + 1]; if (a[1] < 120 || a[0] < -235) continue;
    const tx = b2[0] - a[0], tz = b2[1] - a[1], L = Math.hypot(tx, tz) || 1, nx = tz / L, nz = -tx / L; // orilla leste/sur
    const px = a[0] + nx * (RIVER_HW + 5), pz = a[1] + nz * (RIVER_HW + 5);
    if (pz > 120 && px < P.x1 && px > -235) bank.push([px, pz]);
  }
  if (bank.length > 1) path(bank, 3.4);
  G.bankPath = bank;
  // GRAN FONTE
  buildGrandFountain(B, scene, cx, cz);
  // parque infantil
  const px = 40, pz = 196;
  for (let i = 0; i < 2; i++) { for (const [ox, oz] of [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]]) { const l = boxGeo(0.08, 2.5, 0.08); xform(l, px + ox + i * 4, 1.2, pz + oz * 0.4, 0, oz * 0.3); B.vcol.add(colorize(l, '#d23b2a')); } const top = boxGeo(2.6, 0.1, 0.1); xform(top, px + i * 4, 2.45, pz); B.vcol.add(colorize(top, '#d23b2a')); const seat = boxGeo(0.5, 0.05, 0.25); xform(seat, px + i * 4, 0.6, pz); B.vcol.add(colorize(seat, '#2a3b8f')); }
  const slide = boxGeo(0.7, 0.08, 3.5); xform(slide, px + 9, 1.1, pz, 0, 0.55); B.vcol.add(colorize(slide, '#f0b323'));
  const tower = boxGeo(1.4, 2, 1.4); xform(tower, px + 9, 1, pz - 2); B.vcol.add(colorize(tower, '#2f8a4b')); addCircCol(px + 9, pz - 2, 1, 2);
  // bancos e farolas de parque
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, x = cx + Math.cos(a) * 24.5, z = cz + Math.sin(a) * 18.5; if (i % 3 === 0) bench(B, x, 0.03, z, Math.atan2(cx - x, cz - z)); }
  for (let i = 4; i < bank.length; i += 9) { const [x, z] = bank[i]; const r = riverNear(x, z); bench(B, x + (x - r.px) * 0.12, 0.03, z + (z - r.pz) * 0.12, Math.atan2(r.px - x, r.pz - z)); }
  G.parkLampPts = [];
  for (let i = 2; i < bank.length; i += 6) G.parkLampPts.push(bank[i]);
  for (const a of [0.5, 2.1, 3.7, 5.3]) G.parkLampPts.push([cx + Math.cos(a) * 27, cz + Math.sin(a) * 20]);
  // cartel de entrada (lado da Rúa Roberto Baamonde)
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.3), std({ map: textTex('PARQUE DOS CONDES', { w: 512, h: 112, bg: '#2a3a2a', fg: '#f1e6c8', size: 60, border: '#c9b98a' }), roughness: .7 }));
  sg.position.set(P.x1 + 0.2, 3.2, cz); sg.rotation.y = Math.PI / 2; scene.add(sg);
  for (const s2 of [-1, 1]) { const p = boxGeo(0.5, 4, 0.5, [3, 3]); xform(p, P.x1 + 0.2, 2, cz + s2 * 3.4); B.stone.add(p); addCircCol(P.x1 + 0.2, cz + s2 * 3.4, 0.4, 4); }
  // embarcadoiro na beira, apuntando ao río
  const rn = riverNear(-92, 198), nx = (-92 - rn.px), nz = (198 - rn.pz), nl = Math.hypot(nx, nz) || 1;
  const bx = rn.px + nx / nl * (RIVER_HW - 1.5), bz = rn.pz + nz / nl * (RIVER_HW - 1.5), th = Math.atan2(nx / nl, nz / nl);
  inFrame(B, scene, bx, bz, th, (LB, g) => buildEmbarcadoiro(LB, g));
  { const [jx, jz] = [bx - Math.sin(th) * 1.0, bz - Math.cos(th) * 1.0]; G.jetty = { x: jx, z: jz }; }
  // puntos de paseo
  for (let i = 0; i < 400 && G.parkPoints.length < 70; i++) { const x = RR(P.x0 + 4, P.x1 - 4), z = RR(P.z0 + 3, P.z1 - 3); if (inPark(x, z) && Math.hypot(x - cx, z - cz) > 14.5) G.parkPoints.push([x, z]); }
  G.parkCenter = { x: cx, z: cz };
}

/* ---------- Praza e Colexio da Compañía ---------- */
function buildCompanhia(B, scene) {
  const C = ZONES.companhia;
  const pl = new THREE.PlaneGeometry(C.x1 - C.x0, 48); pl.rotateX(-Math.PI / 2); xform(pl, (C.x0 + C.x1) / 2, 0.04, C.z0 + 24);
  const uv = pl.attributes.uv, p = pl.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4); B.cobble.add(pl);
  const x0 = -100, x1 = 30, z0 = 166, z1 = 208, H = 17;
  const g = boxGeo(x1 - x0, H, z1 - z0, FAC_TILE); xform(g, (x0 + x1) / 2, H / 2, (z0 + z1) / 2); B.colegio.add(g);
  const r = hipRoof(x1 - x0, z1 - z0, 6, 4, 0.6); xform(r, (x0 + x1) / 2, H, (z0 + z1) / 2); B.slate.add(r);
  addBoxCol(x0, z0, x1, z1, H + 8, 'colexio');
  for (const tx of [x0 + 6, x1 - 6]) {
    const t = boxGeo(13, 30, 13, [4, 4]); xform(t, tx, 15, z0 + 4); B.stone.add(t);
    const sp = new THREE.ConeGeometry(9.5, 10, 4); xform(sp, tx, 35, z0 + 4, Math.PI / 4); B.slate.add(sp);
    const ball = new THREE.SphereGeometry(0.5, 10, 8); xform(ball, tx, 40.5, z0 + 4); B.metal.add(ball);
    addBoxCol(tx - 6.5, z0 - 2.5, tx + 6.5, z0 + 10.5, 40, 'torre');
    for (const y of [20, 25]) for (const s of [-1, 1]) { const w = boxGeo(2.2, 3.4, 0.2); xform(w, tx + s * 3, y, z0 - 2.55); B.glass.add(w); }
  }
  // fachada da igrexa e cúpula
  const ix = -35, iw = 26;
  const fg = boxGeo(iw, 25, 4, [4, 4]); xform(fg, ix, 12.5, z0 - 2); B.stone.add(fg);
  const ped = new THREE.CylinderGeometry(0.01, 15, 6, 3, 1); xform(ped, ix, 27.5, z0 - 2, 0, 0, 0, 1, 1, 0.2); ped.rotateY(0); B.stone.add(ped);
  const drum = new THREE.CylinderGeometry(8, 8, 6, 24); xform(drum, ix, 28, z0 + 16); B.stone.add(drum);
  const dome = new THREE.SphereGeometry(8.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); xform(dome, ix, 31, z0 + 16); B.slate.add(dome);
  const lan = new THREE.CylinderGeometry(1.4, 1.6, 3.5, 12); xform(lan, ix, 40.5, z0 + 16); B.stone.add(lan);
  const door = boxGeo(5, 8, 0.3); xform(door, ix, 4, z0 - 4.1); B.glass.add(door);
  for (const s of [-1, 1]) for (const k of [0, 1]) { const col = new THREE.CylinderGeometry(0.6, 0.65, 10, 14); xform(col, ix + s * (4.5 + k * 4.5), 5, z0 - 4.5); B.stone.add(col); }
  addBoxCol(ix - iw / 2, z0 - 5, ix + iw / 2, z0, 26, 'igrexa');
  // estatua do Cardeal Rodrigo de Castro
  const sx = -35, sz = 138;
  const pd = boxGeo(3.2, 3, 3.2, [3, 3]); xform(pd, sx, 1.5, sz); B.stone.add(pd);
  const pd2 = boxGeo(3.8, 0.5, 3.8, [3, 3]); xform(pd2, sx, 0.25, sz); B.stone.add(pd2);
  const robe = new THREE.CylinderGeometry(0.55, 0.95, 2.4, 14); xform(robe, sx, 4.2, sz); B.bronze.add(robe);
  const tor = new THREE.CylinderGeometry(0.5, 0.55, 0.9, 14); xform(tor, sx, 5.8, sz); B.bronze.add(tor);
  const head = new THREE.SphereGeometry(0.3, 14, 10); xform(head, sx, 6.5, sz); B.bronze.add(head);
  const hat = new THREE.CylinderGeometry(0.62, 0.62, 0.1, 18); xform(hat, sx, 6.82, sz); B.bronze.add(hat);
  const hat2 = new THREE.SphereGeometry(0.28, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); xform(hat2, sx, 6.85, sz); B.bronze.add(hat2);
  const arm = new THREE.CylinderGeometry(0.12, 0.14, 1.0, 8); xform(arm, sx + 0.4, 5.5, sz - 0.4, 0, 0.8, 0.3); B.bronze.add(arm);
  addBoxCol(sx - 1.9, sz - 1.9, sx + 1.9, sz + 1.9, 7, 'estatua');
  const plq = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), std({ map: textTex('CARDEAL RODRIGO DE CASTRO', { w: 512, h: 96, bg: '#3a3427', fg: '#d9c48a', size: 40 }), roughness: .5, metalness: .4 }));
  plq.position.set(sx, 2.1, sz - 1.62); plq.rotation.y = Math.PI; scene.add(plq);
  for (let i = 0; i < 8; i++) bench(B, C.x0 + 12 + i * 16, 0.04, 155, Math.PI);
  G.statue = { x: sx, z: sz };
}

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
    const bal = boxGeo(3.4, 0.35, 900, [3, 3]); xform(bal, tx, 0.05, 0); B.ballast.add(bal);
    for (const s of [-1, 1]) { const rl = boxGeo(0.08, 0.16, 900); xform(rl, tx + s * 0.834, 0.3, 0); B.rail.add(rl); }
    for (let z = -330; z < 330; z += 0.75) sleepers.push([tx, z]);
  }
  const sm = new THREE.InstancedMesh(boxGeo(2.6, 0.14, 0.28), MAT.concrete, sleepers.length); const o = new THREE.Object3D();
  sleepers.forEach(([x, z], i) => { o.position.set(x, 0.24, z); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.receiveShadow = true; scene.add(sm);
  // vagóns históricos aparcados (colección do museo)
  G.stationCenter = { x: 315 - 111, z: -228 };
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
function addSidewalkPlat(x0, z0, x1, z1) { if (G._frame) [x0, z0, x1, z1] = frameRect(x0, z0, x1, z1); const s = { x0, z0, x1, z1, h: 0.7 }; SW_RECTS.push(s); G.swGrid.insert(s, x0, z0, x1, z1); G.platforms = G.platforms || []; G.platforms.push(s); }
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

/* ---------- Mobiliario: farolas, varandas, coleccionables ---------- */
function buildProps(B, scene, Q) {
  const poles = [], heads = [];
  for (const r of ROADS) {
    if (r.type !== 'car' || r.name === 'Subida ao Castelo') continue;
    const a0 = r.dir === 'ns' ? r.z0 : r.x0, a1 = r.dir === 'ns' ? r.z1 : r.x1;
    let k = 0;
    for (let t = a0 + 10; t < a1 - 4; t += 30, k++) {
      const side = k % 2 ? 1 : -1;
      let x, z, yaw;
      if (r.dir === 'ns') { x = r.x + side * (r.hw + 0.6); z = t; yaw = -side * Math.PI / 2; }
      else { x = t; z = r.z + side * (r.hw + 0.6); yaw = side > 0 ? Math.PI : 0; }
      if (inRoad(x, z, -0.2)) continue;
      const y = surfY(x, z) + (bridgeAt(x, z) ? 0 : 0.15);
      poles.push([x, y, z, yaw]); G.lamps.push({ x: x + Math.sin(yaw) * 1.7, y: y + 7.4, z: z + Math.cos(yaw) * 1.7 });
      addCircCol(x, z, 0.2, 7, 'farola');
    }
  }
  // farolas do parque e do paseo (estilo fernandino)
  const P = ZONES.park;
  for (const [x, z] of (G.parkLampPts || [])) { poles.push([x, 0, z, 0, 'park']); G.lamps.push({ x, y: 4, z }); }
  const pole = mergeGeos([xform(new THREE.CylinderGeometry(0.08, 0.13, 8, 8), 0, 4, 0), xform(boxGeo(0.1, 0.1, 1.8), 0, 7.85, 0.9)]);
  const head = boxGeo(0.5, 0.18, 0.9); head.translate(0, 7.75, 1.7);
  const parkPole = mergeGeos([xform(new THREE.CylinderGeometry(0.07, 0.12, 3.6, 8), 0, 1.8, 0)]);
  const parkHead = new THREE.SphereGeometry(0.32, 12, 10); parkHead.translate(0, 3.9, 0);
  const sp = poles.filter(p => !p[4]), pp = poles.filter(p => p[4]);
  const mk = (geo, mat, list, shadow) => { const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(); list.forEach(([x, y, z, yaw], i) => { o.position.set(x, y, z); o.rotation.set(0, yaw, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = shadow; scene.add(m); };
  mk(pole, MAT.metalDark, sp, true); mk(head, MAT.lampHead, sp, false); mk(parkPole, MAT.metalDark, pp, true); mk(parkHead, MAT.lampHead, pp, false);
  // varanda de madeira ao longo do río (paseo fluvial)
  const posts = [];
  const nearBridge = (x, z) => BRIDGES.some(b => (b.dir === 'ns' ? Math.hypot(x - b.x, z - b.c) : Math.hypot(x - b.c, z - b.z)) < b.hw + RIVER_HW + 1);
  for (const s of [-1, 1]) {
    let prev = null;
    for (let i = 0; i < RIVER.length - 1; i++) {
      const a = RIVER[i], b2 = RIVER[i + 1], tx = b2[0] - a[0], tz = b2[1] - a[1], L = Math.hypot(tx, tz) || 1, nx = -tz / L, nz = tx / L;
      for (const f of [0, 0.5]) {
        const cx = lerp(a[0], b2[0], f), cz = lerp(a[1], b2[1], f), x = cx + nx * s * (RIVER_HW + 0.8), z = cz + nz * s * (RIVER_HW + 0.8);
        if (x < MAP.minX + 4 || x > MAP.maxX - 4 || z < MAP.minZ || z > MAP.maxZ || nearBridge(cx, cz) || inRoad(x, z, 0.5)) { prev = null; continue; }
        posts.push([x, z]);
        if (prev) { const L2 = Math.hypot(x - prev[0], z - prev[1]), yaw = Math.atan2(x - prev[0], z - prev[1]); if (L2 < 5) for (const h of [0.55, 1.0]) { const rl = boxGeo(0.07, 0.09, L2); xform(rl, (x + prev[0]) / 2, h, (z + prev[1]) / 2, yaw); B.wood.add(rl); } }
        prev = [x, z];
      }
    }
  }
  const pm = new THREE.InstancedMesh(boxGeo(0.12, 1.1, 0.12), MAT.wood, posts.length), o = new THREE.Object3D();
  posts.forEach(([x, z], i) => { o.position.set(x, 0.55, z); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); }); pm.castShadow = true; scene.add(pm);
  // aparcamento en liña ao longo das rúas
  for (const r of ROADS) {
    if (r.type !== 'car' || r.name === 'Subida ao Castelo') continue;
    const a0 = r.dir === 'ns' ? r.z0 : r.x0, a1 = r.dir === 'ns' ? r.z1 : r.x1;
    for (let t = a0 + 14; t < a1 - 14; t += RR(18, 46)) {
      const side = R() < 0.5 ? -1 : 1, off = r.hw - 1.2;
      let x, z, yaw;
      if (r.dir === 'ns') { x = r.x + side * off; z = t; yaw = side > 0 ? Math.PI : 0; }
      else { x = t; z = r.z + side * off; yaw = side > 0 ? Math.PI / 2 : -Math.PI / 2; }
      if (bridgeAt(x, z) || NODES.some(n => Math.hypot(n.x - x, n.z - z) < 16)) continue;
      G.parking.push({ x, z, yaw });
    }
  }
  // taxis na estación
  G.taxiStand = [{ x: 190 + 4.8, z: -254, yaw: Math.PI }, { x: 190 + 4.8, z: -261, yaw: Math.PI }];
  // botellas de Mencía (coleccionables)
  const pb = BRIDGES.find(b => b.type === 'park'), vb = BRIDGES.find(b => b.type === 'vella');
  const spots = [
    [G.torre.x, G.torre.top + 1.6, G.torre.z, 'no alto da Torre da Homenaxe'], [vb.c - 6, 0.2, vb.z, 'baixo a Ponte Vella'], [G.jetty.x, -0.3, G.jetty.z, 'no embarcadoiro'],
    [35, 0.3, 117, 'diante da portada da Compañía'], [281.5, 4.3, -325, 'na locomotora de vapor'], [229, 0.9, -188, 'no andén 1'],
    [HILL.x + 30, HILL.top + 0.3, HILL.z - 20, 'no claustro do mosteiro'], [pb.x, 1.3, pb.c, 'na ponte do parque'], [12, 0.3, 72, 'ao final do Cardeal'],
    [-270, 0.3, 120, 'na Régoa'], [150, 0.3, -170, 'no barrio da estación'], [40, 0.3, -125, 'detrás do monte'],
  ];
  const bg = mergeGeos([xform(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 12), 0, 0.21, 0), xform(new THREE.CylinderGeometry(0.04, 0.11, 0.14, 12), 0, 0.49, 0), xform(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), 0, 0.62, 0)]);
  const bm = std({ color: 0x3d0a1c, roughness: 0.1, metalness: 0.3, emissive: 0x7a1f3d, emissiveIntensity: 0.6 });
  for (const [x, y, z, where] of spots) {
    const m = new THREE.Mesh(bg, bm); m.position.set(x, y, z); m.scale.setScalar(1.6); scene.add(m);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 24), new THREE.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(x, y + 0.02, z); scene.add(halo);
    G.bottles.push({ m, halo, x, y, z, where, got: false });
  }
}

/* ---------- Árbores ---------- */
function buildTrees(scene, Q) {
  const trees = [];
  const P = ZONES.park;
  for (let i = 0; i < 600 && trees.length < 150; i++) { const x = RR(P.x0 + 3, P.x1 - 3), z = RR(P.z0 + 3, P.z1 - 3); if (!inPark(x, z) || riverDistRaw(x, z) < RIVER_HW + 9) continue; if (Math.hypot(x - 25, z - 222) < 0 || Math.hypot(x + 25, z - 222) < 30 || Math.abs(z - 222) < 3 || Math.abs(x + 25) < 3 || Math.hypot(x - 45, z - 196) < 10) continue; trees.push([x, z, RR(0.9, 1.4)]); }
  for (const s of [-1, 1]) for (let i = 0; i < RIVER.length - 1; i += 2) {
    const a = RIVER[i], b2 = RIVER[i + 1], tx = b2[0] - a[0], tz = b2[1] - a[1], L = Math.hypot(tx, tz) || 1, x = a[0] - tz / L * s * (RIVER_HW + 3.5), z = a[1] + tx / L * s * (RIVER_HW + 3.5);
    if (x < MAP.minX || x > MAP.maxX - 20 || z < MAP.minZ || z > MAP.maxZ + 40) continue;
    if (BRIDGES.some(b => (b.dir === 'ns' ? Math.hypot(a[0] - b.x, a[1] - b.c) : Math.hypot(a[0] - b.c, a[1] - b.z)) < b.hw + 4) || inRoad(x, z, 2) || inPark(x, z) || (z > 120 && x < -60 && x > -240 && riverDistRaw(x, z) < RIVER_HW + 7)) continue;
    trees.push([x, z, RR(0.8, 1.2)]);
  }
  for (const t of G.extraTrees || []) trees.push(t);
  // avenidas arboradas
  for (const r of ROADS) if (r.dir === 'ew' && (r.z === 78 || r.z === -170)) for (let x = r.x0 + 8; x < r.x1; x += 14) { const z = r.z + (R() < 0.5 ? -1 : 1) * (r.hw + 1.6); if (!inRoad(x, z, 0.6) && !NODES.some(n => Math.hypot(n.x - x, n.z - z) < 10)) trees.push([x, z, RR(0.65, 0.9)]); }
  // patios interiores
  for (let i = 0; i < (Q === 'low' ? 80 : 220); i++) { const x = RR(MAP.minX + 10, MAP.maxX - 10), z = RR(MAP.minZ + 10, MAP.maxZ - 10); if (!inRoad(x, z, 5) && lotOK(x - 1.5, z - 1.5, x + 1.5, z + 1.5) && x < 300) trees.push([x, z, RR(0.7, 1.2)]); }
  // fóra: carballeiras nas ladeiras
  for (let i = 0; i < (Q === 'low' ? 150 : 450); i++) { const a = R() * Math.PI * 2, d = RR(380, 640), x = 50 + Math.cos(a) * d, z = 10 + Math.sin(a) * d; if (x > RAIL.x0 - 8 && x < RAIL.x1 + 8) continue; const h = terrainH(x, z); if (h > 1) trees.push([x, z, RR(1.1, 1.8), h]); }
  // xeometrías
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
    if (h === undefined && x < MAP.maxX) addCircCol(x, z, 0.35 * s, 6, 'arbore');
  });
  ti.castShadow = ci.castShadow = true; ti.receiveShadow = ci.receiveShadow = true;
  scene.add(ti, ci);
  // piñeiros do monte
  const pines = G.hillPines;
  const pc = mergeGeos([xform(new THREE.ConeGeometry(2.2, 5, 8), 0, 6.5, 0), xform(new THREE.ConeGeometry(1.6, 4, 8), 0, 9, 0), xform(new THREE.ConeGeometry(2.6, 4, 8), 0, 4.5, 0)]);
  const pt = new THREE.CylinderGeometry(0.15, 0.28, 6, 6); pt.translate(0, 3, 0);
  const pti = new THREE.InstancedMesh(pt, MAT.trunk, pines.length), pci = new THREE.InstancedMesh(pc, MAT.pine, pines.length);
  pines.forEach(([x, y, z], i) => { const s = RR(0.8, 1.3); o.position.set(x, y - 0.2, z); o.rotation.set(RR(-0.05, 0.05), R() * 6, 0); o.scale.set(s, s, s); o.updateMatrix(); pti.setMatrixAt(i, o.matrix); pci.setMatrixAt(i, o.matrix); addCircCol(x, z, 0.3, 6, 'pino', y - 3); });
  pti.castShadow = pci.castShadow = true; scene.add(pti, pci);
  // viñedos en socalcos (Ribeira Sacra) ao sur
  const vines = [];
  for (let row = 0; row < 26; row++) for (let i = 0; i < 70; i++) { const x = -240 + i * 4.2 + (row % 2) * 2, z = 340 + row * 3.2, h = terrainH(x, z); if (h > 0.5) vines.push([x, h, z]); }
  const vg = boxGeo(3.6, 1.1, 0.7); vg.translate(0, 0.55, 0);
  const vi = new THREE.InstancedMesh(vg, std({ color: 0x4d6b2a, roughness: 1, flatShading: true }), vines.length);
  vines.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); vi.setMatrixAt(i, o.matrix); });
  vi.receiveShadow = true; scene.add(vi);
}
