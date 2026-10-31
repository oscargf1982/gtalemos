'use strict';
/* ==========================================================
   LEMOS 27400 · obras de asfaltado: cada día córtase unha rúa distinta
   ========================================================== */
G.works = null;
const WORKS_MAT = {};
function worksMats() {
  if (WORKS_MAT.yellow) return;
  const M = o => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.55, metalness: 0.15 }, o));
  WORKS_MAT.yellow = M({ color: 0xf2b316 }); WORKS_MAT.orange = M({ color: 0xe8661a }); WORKS_MAT.white = M({ color: 0xf2f2ee });
  WORKS_MAT.dark = M({ color: 0x1c1d20, roughness: 0.7 }); WORKS_MAT.steel = M({ color: 0x8d9297, metalness: 0.7, roughness: 0.35 });
  WORKS_MAT.glass = M({ color: 0x1a232b, roughness: 0.1, metalness: 0.4 }); WORKS_MAT.tar = M({ color: 0x141416, roughness: 0.95 });
  WORKS_MAT.amber = new THREE.MeshBasicMaterial({ color: 0xffa21a }); WORKS_MAT.amberOff = new THREE.MeshBasicMaterial({ color: 0x5a3a10 });
  const c = cnv(256, 64), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f4f4f0' : '#d42020'; x.beginPath(); x.moveTo(i * 32 - 16, 64); x.lineTo(i * 32 + 16, 0); x.lineTo(i * 32 + 48, 0); x.lineTo(i * 32 + 16, 64); x.fill(); }
  WORKS_MAT.barrier = M({ map: toTex(c, false) });
  const s = cnv(256, 256), y = s.getContext('2d'); y.fillStyle = '#f4f1e6'; y.beginPath(); y.moveTo(128, 14); y.lineTo(244, 228); y.lineTo(12, 228); y.closePath(); y.fill(); y.lineWidth = 22; y.strokeStyle = '#d42020'; y.stroke();
  y.fillStyle = '#111'; y.beginPath(); y.arc(118, 120, 13, 0, 7); y.fill(); y.fillRect(104, 136, 26, 46); y.save(); y.translate(150, 150); y.rotate(-0.6); y.fillRect(-4, -36, 8, 56); y.restore(); y.fillRect(80, 186, 100, 12);
  WORKS_MAT.sign = M({ map: toTex(s, false), transparent: true, side: THREE.DoubleSide });
  WORKS_MAT.cut = M({ map: textTex('RÚA CORTADA · OBRAS', { w: 768, h: 96, bg: '#f2b316', fg: '#151515', size: 64 }) });
}
const box = (w, h, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; m.receiveShadow = true; return m; };
const cyl = (r, h, mat, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.castShadow = true; return m; };
function wheel(g, x, y, z, r, w = 0.35) { const m = cyl(r, w, WORKS_MAT.dark, 14); m.rotation.z = Math.PI / 2; m.position.set(x, y, z); g.add(m); const h = cyl(r * 0.5, w + 0.02, WORKS_MAT.steel, 10); h.rotation.z = Math.PI / 2; h.position.set(x, y, z); g.add(h); }
function beacon(g, x, y, z, list) { const b = cyl(0.12, 0.16, WORKS_MAT.amberOff, 10); b.position.set(x, y, z); g.add(b); list.push(b); }
/* camión basculante cargado de aglomerado */
function makeDumpTruck(beacons) {
  const g = new THREE.Group();
  const cab = box(2.4, 1.9, 1.9, WORKS_MAT.white); cab.position.set(0, 2.05, 2.7); g.add(cab);
  const ws = box(2.2, 0.8, 0.05, WORKS_MAT.glass); ws.position.set(0, 2.5, 3.66); g.add(ws);
  const chassis = box(2.3, 0.4, 7.2, WORKS_MAT.dark); chassis.position.set(0, 0.95, 0.3); g.add(chassis);
  const bed = box(2.45, 1.4, 4.4, WORKS_MAT.orange); bed.position.set(0, 1.95, -0.9); bed.rotation.x = -0.08; g.add(bed);
  const load = box(2.2, 0.35, 4.1, WORKS_MAT.tar); load.position.set(0, 2.72, -0.9); load.rotation.x = -0.08; g.add(load);
  for (const z of [2.6, -0.6, -2.0]) for (const s of [-1, 1]) wheel(g, s * 1.05, 0.55, z, 0.55);
  beacon(g, 0.7, 3.1, 2.7, beacons); beacon(g, -0.7, 3.1, 2.7, beacons);
  return g;
}
/* extendedora de asfalto */
function makePaver(beacons) {
  const g = new THREE.Group();
  const body = box(2.6, 1.3, 3.6, WORKS_MAT.yellow); body.position.set(0, 1.2, 0); g.add(body);
  const hop = box(2.8, 0.7, 1.6, WORKS_MAT.yellow); hop.position.set(0, 1.55, 2.4); g.add(hop);
  const tar = box(2.5, 0.25, 1.3, WORKS_MAT.tar); tar.position.set(0, 1.85, 2.4); g.add(tar);
  const screed = box(3.4, 0.45, 0.9, WORKS_MAT.yellow); screed.position.set(0, 0.45, -2.2); g.add(screed);
  const seat = box(1.2, 0.5, 0.8, WORKS_MAT.dark); seat.position.set(0, 2.1, -0.6); g.add(seat);
  const roof = box(2.4, 0.08, 2.0, WORKS_MAT.yellow); roof.position.set(0, 3.3, -0.4); g.add(roof);
  for (const s of [-1, 1]) { const p = cyl(0.05, 1.3, WORKS_MAT.dark, 8); p.position.set(s * 1.1, 2.65, -0.4); g.add(p); const tr = box(0.5, 0.6, 3.4, WORKS_MAT.dark); tr.position.set(s * 1.05, 0.35, 0.2); g.add(tr); }
  beacon(g, 0, 3.42, -0.4, beacons);
  return g;
}
/* rodillo compactador */
function makeRoller(beacons) {
  const g = new THREE.Group();
  for (const z of [1.3, -1.3]) { const d = cyl(0.75, 1.9, WORKS_MAT.steel, 22); d.rotation.z = Math.PI / 2; d.position.set(0, 0.75, z); g.add(d); const f = box(2.1, 0.3, 0.3, WORKS_MAT.yellow); f.position.set(0, 1.55, z); g.add(f); }
  const body = box(1.6, 1.0, 1.6, WORKS_MAT.yellow); body.position.set(0, 1.6, 0); g.add(body);
  const cab = box(1.4, 1.2, 1.2, WORKS_MAT.glass); cab.position.set(0, 2.7, 0); g.add(cab);
  const roof = box(1.6, 0.1, 1.5, WORKS_MAT.yellow); roof.position.set(0, 3.35, 0); g.add(roof);
  beacon(g, 0, 3.48, 0, beacons);
  g.userData.drums = true; return g;
}
function makeBarrier() {
  const g = new THREE.Group();
  const b = box(2.4, 0.32, 0.06, WORKS_MAT.barrier); b.position.y = 0.95; g.add(b);
  const b2 = box(2.4, 0.2, 0.06, WORKS_MAT.barrier); b2.position.y = 0.45; g.add(b2);
  for (const s of [-1, 1]) { const l = box(0.08, 1.15, 0.5, WORKS_MAT.white); l.position.set(s * 1.05, 0.57, 0); g.add(l); }
  const lamp = cyl(0.09, 0.08, WORKS_MAT.amberOff, 10); lamp.rotation.x = Math.PI / 2; lamp.position.set(1.05, 1.25, 0); g.add(lamp); g.userData.lamp = lamp;
  return g;
}
function makeCone() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.7, 14), WORKS_MAT.orange); c.position.y = 0.38; c.castShadow = true; g.add(c);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 14), WORKS_MAT.white); s.position.y = 0.45; g.add(s);
  const b = box(0.42, 0.04, 0.42, WORKS_MAT.dark); b.position.y = 0.02; g.add(b);
  return g;
}

/* ---------- escoller a rúa do día ---------- */
function worksCandidates() {
  const out = [];
  for (const r of ROADS) {
    if (r.type !== 'car' || !r.urban || r.bridge || r.cls === 'service' || r.w < 6) continue;
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i], b = r.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 45) continue;
      let bridge = false; for (let t = 0; t <= 1; t += 0.05) if (bridgeAt(lerp(a[0], b[0], t), lerp(a[1], b[1], t))) { bridge = true; break; }
      if (bridge) continue;
      out.push({ a: { x: a[0], z: a[1] }, e: { to: { x: b[0], z: b[1] }, len: L, road: r } });
    }
  }
  return out;
}
function dayKey() {
  const d = new Date(), base = d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const day = Math.floor(((G.absHour || G.hour) - 6) / 24);
  return base * 37 + day;
}
function initWorks() { worksMats(); G.worksDay = null; updateWorks(0, true); }
function clearWorks() {
  const W = G.works; if (!W) return;
  G.scene.remove(W.group);
  for (const o of W.cols) o.off = true;
  for (const e of W.edges) e.blocked = false;
  for (const p of W.workers) { Object.assign(p, { state: 'walk', home: 'walk', npc: null, manual: false, immune: false, edge: null, armUp: 0, nod: 0 }); Object.assign(p.col, p.prevCol); world.crowd.paint(p); }
  G.works = null;
}
function buildWorks(seed) {
  clearWorks();
  const rnd = mulberry32(seed), cands = worksCandidates().filter(c => {
    const mx = (c.a.x + c.e.to.x) / 2, mz = (c.a.z + c.e.to.z) / 2;
    for (const v of world.vehicles) if ((v === G.player.car || v.type === 'taxi' || v.type === 'clasico' || v.t.livery === 'police') && Math.hypot(v.x - mx, v.z - mz) < c.e.len / 2 + 6) return false;
    const me = G.player.car || G.player.ped; if (Math.hypot(me.x - mx, me.z - mz) < c.e.len / 2 + 10) return false;
    return true;
  });
  if (!cands.length) return;
  const C = cands[Math.floor(rnd() * cands.length)], A = C.a, Bn = C.e.to, r = C.e.road;
  const dx = Bn.x - A.x, dz = Bn.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const zone = Math.min(L - 22, 46), mx = A.x + dx / 2, mz = A.z + dz / 2, yaw = Math.atan2(ux, uz);
  const grp = new THREE.Group(); G.scene.add(grp);
  const W = { group: grp, cols: [], edges: [], workers: [], beacons: [], lamps: [], stops: [], road: r, roller: null, name: r.name || 'unha rúa do centro', center: { x: mx, z: mz } };
  const P = (along, side) => [mx + ux * along + nx * side, mz + uz * along + nz * side];
  const place = (obj, along, side, rot = 0) => { const [x, z] = P(along, side); obj.position.set(x, groundH(x, z) + 0.02, z); obj.rotation.y = yaw + rot; grp.add(obj); return obj; };
  const col = (along, side, rad, h = 3) => { const [x, z] = P(along, side); const o = addCircCol0(x, z, rad, h, 'obras'); W.cols.push(o); };
  // asfalto novo (negro, recén estendido) na metade da zona e fresado no resto
  const fresh = new THREE.Mesh(new THREE.PlaneGeometry(r.w - 0.4, zone * 0.55), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.35, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -6 }));
  fresh.rotation.x = -Math.PI / 2; place(fresh, -zone * 0.2, 0); fresh.position.y = 0.06; fresh.rotation.z = -yaw;
  fresh.rotation.set(-Math.PI / 2, 0, yaw);
  const milled = new THREE.Mesh(new THREE.PlaneGeometry(r.w - 0.4, zone * 0.4), new THREE.MeshStandardMaterial({ color: 0x5b5a57, roughness: 1, polygonOffset: true, polygonOffsetFactor: -6 }));
  place(milled, zone * 0.28, 0); milled.position.y = 0.06; milled.rotation.set(-Math.PI / 2, 0, yaw);
  // barreiras que pechan a rúa nos dous extremos
  for (const end of [-1, 1]) {
    const along = end * zone / 2;
    for (let s = -r.hw + 1.2; s <= r.hw - 1.1; s += 2.45) { const b = place(makeBarrier(), along, s); W.lamps.push(b.userData.lamp); }
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.15), WORKS_MAT.sign); place(sg, along + end * 3.5, -r.hw + 0.9, end > 0 ? 0 : Math.PI); sg.position.y += 1.7;
    const post = box(0.07, 1.6, 0.07, WORKS_MAT.steel); place(post, along + end * 3.5, -r.hw + 0.9); post.position.y += 0.8;
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.55), WORKS_MAT.cut); place(ban, along + end * 0.05, 0, end > 0 ? 0 : Math.PI); ban.position.y += 1.55;
    const [bcx, bcz] = P(along, 0), o = addOBB(bcx, bcz, 0.4, r.hw, Math.atan2(-uz, ux), 1.4, 'obras'); W.cols.push(o);
    const [sx, sz] = P(along + end * 2, 0); W.stops.push({ x: sx, z: sz });
    for (let k = 1; k <= 5; k++) place(makeCone(), along + end * (2 + k * 2.2), lerp(-r.hw + 1, 0, k / 5) * (k % 2 ? 1 : 1));
  }
  // conos ao longo da obra
  for (let a = -zone / 2 + 3; a < zone / 2 - 2; a += 4.5) place(makeCone(), a, r.hw - 0.6);
  // maquinaria
  const truck = place(makeDumpTruck(W.beacons), zone * 0.05, -r.hw * 0.4 + 1.2); col(zone * 0.05 + 2.6, -r.hw * 0.4 + 1.2, 1.3); col(zone * 0.05, -r.hw * 0.4 + 1.2, 1.3); col(zone * 0.05 - 2.4, -r.hw * 0.4 + 1.2, 1.3);
  const paver = place(makePaver(W.beacons), zone * 0.05 - 7.5, -r.hw * 0.4 + 1.2); col(zone * 0.05 - 7.5, -r.hw * 0.4 + 1.2, 1.8);
  const roller = place(makeRoller(W.beacons), -zone * 0.3, r.hw * 0.35); W.roller = { obj: roller, base: -zone * 0.3, side: r.hw * 0.35, P, yaw };
  const rc = addCircCol0(0, 0, 1.6, 3, 'obras'); W.cols.push(rc); W.rollerCol = rc;
  // obreiros con chaleco laranxa e casco
  const free = world.crowd.peds.filter(q => q.state === 'walk' && !q.npc && q !== G.player.ped);
  const spots = [[zone * 0.05 - 4.8, r.hw * 0.25], [-zone * 0.1, -r.hw * 0.1], [zone * 0.32, r.hw * 0.4], [-zone * 0.42, -r.hw * 0.45]];
  spots.slice(0, Math.min(4, Math.max(0, free.length - 4))).forEach((sp, i) => {
    const p = free[i]; p.prevCol = { ...p.col };
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'obreiro', manual: true, immune: true, visible: true, sit: 0, lie: 0, walk: 0, run: 0 });
    Object.assign(p.col, { shirt: '#ff6a12', pants: '#1f2f4f', hair: '#f2c40f', shoe: '#2a2018' }); world.crowd.paint(p);
    const [x, z] = P(sp[0], sp[1]); p.x = x; p.z = z; p.y = groundH(x, z); p.yaw = yaw + (i % 2 ? Math.PI : 0) + RR(-0.6, 0.6); p.task = i % 3; p.ph = i * 1.7;
    W.workers.push(p);
  });
  // corta a rúa no grafo (os dous sentidos)
  for (const n of NODES) for (const e of n.edges) {
    if (e.road !== r) continue;
    const ex = (n.x + e.to.x) / 2 - mx, ez = (n.z + e.to.z) / 2 - mz;
    if (Math.abs(ex * ux + ez * uz) < zone / 2 + 15 && Math.abs(-ex * uz + ez * ux) < 2) { e.blocked = true; W.edges.push(e); }
  }
  G.works = W;
  // o tráfico que ía por esa rúa recalcula
  for (const v of world.vehicles) {
    if (!v.ai || v.ai.mode !== 'traffic') continue;
    if (v.ai.edge && v.ai.edge.blocked) { const back = v.ai.edge.to.edges.find(e => e.to === v.ai.from); if (back) aiSetEdge(v, v.ai.edge.to, back); }
    else if (v.ai.next && v.ai.next.blocked) aiSetEdge(v, v.ai.from, v.ai.edge);
    // coches aparcados dentro da obra: fóra
  }
  for (let i = world.vehicles.length - 1; i >= 0; i--) { const v = world.vehicles[i]; if (!v.ai && v !== G.player.car && v.sleep && v.type !== 'taxi' && v.type !== 'clasico' && v.type !== 'moto') { const dxv = v.x - mx, dzv = v.z - mz, al = dxv * ux + dzv * uz, lt = dxv * nx + dzv * nz; if (Math.abs(al) < zone / 2 + 3 && Math.abs(lt) < r.hw + 1) { v.remove(G.scene); world.vehicles.splice(i, 1); } } }
}
function updateWorks(dt, force) {
  const key = dayKey();
  if (force || key !== G.worksDay) {
    G.worksDay = key; buildWorks(key);
    if (!force && G.works) toast(`Novo día: obras de asfaltado en ${G.works.name}. Rúa cortada ao tráfico`, 5);
    else if (G.works) G._worksIntro = `Hoxe hai obras de asfaltado en ${G.works.name}: rúa cortada ao tráfico`;
  }
  const W = G.works; if (!W) return;
  // balizas e lámpadas intermitentes
  const on = Math.floor(G.t * 3) % 2 === 0;
  for (let i = 0; i < W.beacons.length; i++) W.beacons[i].material = (on ^ (i % 2)) ? WORKS_MAT.amber : WORKS_MAT.amberOff;
  for (let i = 0; i < W.lamps.length; i++) W.lamps[i].material = (Math.floor(G.t * 2 + i * 0.5) % 2) ? WORKS_MAT.amber : WORKS_MAT.amberOff;
  // o rodillo vai e vén
  const R0 = W.roller, a = R0.base + Math.sin(G.t * 0.35) * 6, [x, z] = R0.P(a, R0.side);
  R0.obj.position.set(x, groundH(x, z) + 0.02, z); W.rollerCol.x = x; W.rollerCol.z = z;
  // obreiros traballando: pá, rastrillo, sinalar
  for (const p of W.workers) {
    p.walk = 0; p.speed = 0; p.sit = p.task === 0 ? 0.25 + 0.15 * Math.sin(G.t * 2.4 + p.ph) : 0;
    p.armUp = p.task === 1 ? 0.5 + 0.5 * Math.sin(G.t * 3 + p.ph) : p.task === 2 ? 0.3 : 0.35 + 0.3 * Math.sin(G.t * 2.4 + p.ph);
    p.wave = p.task === 2 && Math.sin(G.t * 0.7 + p.ph) > 0.4; p.nod = Math.sin(G.t * 2.4 + p.ph) * 0.15;
  }
}
