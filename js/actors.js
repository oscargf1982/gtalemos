'use strict';
/* ==========================================================
   LEMOS 27400 · vehículos, físicas, peóns, tráfico, tren
   ========================================================== */
const GRAV = 9.81;
const CAR_TYPES = {
  compacto: { L: 4.1, W: 1.78, wb: 2.55, wr: 0.32, mass: 1180, power: 90e3, maxF: 5600, grip: 1.05, steer: 0.62, prof: 'hatch', sill: 0.28, nameG: 'Compacto' },
  berlina: { L: 4.65, W: 1.82, wb: 2.8, wr: 0.33, mass: 1450, power: 140e3, maxF: 6800, grip: 1.08, steer: 0.58, prof: 'sedan', sill: 0.28, nameG: 'Berlina' },
  suv: { L: 4.5, W: 1.86, wb: 2.7, wr: 0.37, mass: 1650, power: 130e3, maxF: 7400, grip: 1.0, steer: 0.58, prof: 'suv', sill: 0.38, nameG: 'SUV' },
  furgoneta: { L: 4.9, W: 1.9, wb: 3.0, wr: 0.34, mass: 1900, power: 95e3, maxF: 7000, grip: 0.95, steer: 0.55, prof: 'van', sill: 0.32, nameG: 'Furgoneta' },
  deportivo: { L: 4.4, W: 1.9, wb: 2.6, wr: 0.34, mass: 1380, power: 300e3, maxF: 10500, grip: 1.25, steer: 0.6, prof: 'sport', sill: 0.22, nameG: 'Deportivo' },
  policia: { L: 4.5, W: 1.86, wb: 2.7, wr: 0.37, mass: 1650, power: 190e3, maxF: 8800, grip: 1.12, steer: 0.6, prof: 'suv', sill: 0.38, livery: 'police', nameG: 'Policía Local' },
  taxi: { L: 4.65, W: 1.82, wb: 2.8, wr: 0.33, mass: 1450, power: 130e3, maxF: 6800, grip: 1.08, steer: 0.58, prof: 'sedan', sill: 0.28, livery: 'taxi', nameG: 'Taxi' },
  clasico: { L: 4.04, W: 1.62, wb: 2.42, wr: 0.31, mass: 960, power: 48e3, maxF: 4200, grip: 0.92, steer: 0.62, prof: 'classic', sill: 0.3, nameG: 'Berlina clásica', classic: true },
  moto: { L: 2.1, W: 0.8, wb: 1.42, wr: 0.31, mass: 230, power: 40e3, maxF: 2900, grip: 1.15, steer: 0.5, prof: 'moto', sill: 0.3, moto: true, nameG: 'Moto do sorteo' },
  bus: { L: 12, W: 2.5, wb: 6.0, wr: 0.5, mass: 11000, power: 230e3, maxF: 42000, grip: 0.95, steer: 0.62, prof: 'bus', sill: 0.38, livery: 'bus', nameG: 'Autobús urbano' },
};
const CAR_COLORS = ['#e9e9e6', '#e9e9e6', '#111317', '#111317', '#a7abb0', '#a7abb0', '#5d6167', '#1f3354', '#8c1420', '#5a1424', '#24402f', '#c8b892', '#2c5e8f', '#7a7f87', '#3b3b3f'];

/* ---------- Perfís laterais (carrocería baixa + habitáculo máis estreito) ---------- */
function profilePts(p, L) {
  const h = L / 2;
  const P = {
    hatch: { front: [[h, 0.48], [h, 0.7], [h - 0.12, 0.82]], hood: [1.05, 0.98], roofF: [0.2, 1.47], roofR: [-1.45, 1.45], rearE: [-1.95, 1.03], rear: [[-h, 0.9], [-h, 0.46]] },
    sedan: { front: [[h, 0.48], [h, 0.68], [h - 0.12, 0.8]], hood: [1.25, 0.98], roofF: [0.45, 1.44], roofR: [-0.75, 1.43], rearE: [-1.5, 1.03], rear: [[-2.22, 1.0], [-h, 0.84], [-h, 0.46]] },
    suv: { front: [[h, 0.55], [h, 0.86], [h - 0.12, 0.99]], hood: [1.2, 1.12], roofF: [0.35, 1.7], roofR: [-1.92, 1.68], rearE: [-2.18, 1.2], rear: [[-h, 0.96], [-h, 0.52]] },
    van: { front: [[h, 0.5], [h, 0.92], [h - 0.1, 1.02]], hood: [1.75, 1.16], roofF: [1.1, 1.97], roofR: [-h + 0.06, 1.98], rearE: [-h + 0.02, 1.2], rear: [[-h, 0.48]] },
    sport: { front: [[h, 0.42], [h, 0.58], [h - 0.15, 0.66]], hood: [0.9, 0.86], roofF: [0.05, 1.22], roofR: [-0.9, 1.2], rearE: [-1.85, 0.98], rear: [[-h, 0.88], [-h, 0.42]] },
    classic: { front: [[h, 0.44], [h, 0.74], [h - 0.06, 0.8]], hood: [0.98, 0.86], roofF: [0.4, 1.4], roofR: [-0.92, 1.4], rearE: [-1.32, 0.9], rear: [[-1.96, 0.87], [-h, 0.82], [-h, 0.44]] },
    bus: { front: [[h, 0.45]], hood: [h, 1.05], roofF: [h - 0.05, 3.08], roofR: [-h + 0.05, 3.1], rearE: [-h, 1.05], rear: [[-h, 0.45]] },
  }[p];
  return P;
}
function carShape(t) {
  const P = profilePts(t.prof, t.L), h = t.L / 2, wb = t.wb / 2, ar = t.wr + 0.07, sill = t.sill, wy = t.wr;
  const s = new THREE.Shape();
  s.moveTo(-h + 0.12, sill);
  s.lineTo(-wb - ar, sill); s.lineTo(-wb - ar, wy); s.absarc(-wb, wy, ar, Math.PI, 0, true); s.lineTo(-wb + ar, sill);
  s.lineTo(wb - ar, sill); s.lineTo(wb - ar, wy); s.absarc(wb, wy, ar, Math.PI, 0, true); s.lineTo(wb + ar, sill);
  s.lineTo(h - 0.12, sill);
  for (const [u, v] of P.front) s.lineTo(u, v);
  s.lineTo(...P.hood); s.lineTo(...P.rearE);
  for (const [u, v] of P.rear) s.lineTo(u, v);
  s.lineTo(-h + 0.12, sill);
  // habitáculo (cor da carrocería)
  const c = new THREE.Shape(); c.moveTo(P.hood[0], P.hood[1] - 0.04); c.lineTo(...P.roofF); c.lineTo(...P.roofR); c.lineTo(P.rearE[0], P.rearE[1] - 0.04); c.lineTo(P.hood[0], P.hood[1] - 0.04);
  // vidros
  const gs = new THREE.Shape();
  if (t.prof === 'bus') { gs.moveTo(h + 0.02, 1.15); gs.lineTo(h + 0.02, 2.9); gs.lineTo(-h + 0.5, 2.9); gs.lineTo(-h + 0.5, 1.25); gs.lineTo(h - 1.0, 1.25); gs.lineTo(h - 1.0, 1.15); }
  else if (t.prof === 'van') { gs.moveTo(P.hood[0] + 0.03, P.hood[1] + 0.02); gs.lineTo(P.roofF[0] + 0.03, P.roofF[1] - 0.08); gs.lineTo(0.25, P.roofF[1] - 0.08); gs.lineTo(0.25, P.hood[1] + 0.02); }
  else {
    const dv = 0.07;
    gs.moveTo(P.hood[0] + 0.035, P.hood[1] + 0.005); gs.lineTo(P.roofF[0] + 0.02, P.roofF[1] - dv); gs.lineTo(P.roofR[0] - 0.02, P.roofR[1] - dv); gs.lineTo(P.rearE[0] - 0.035, P.rearE[1] + 0.005);
  }
  P.glass = [[P.hood[0], P.hood[1]]];
  P.top = [...P.front, P.hood];
  return { body: s, cabin: c, glass: gs, P };
}
const _geoCache = {};
function carGeos(type) {
  if (_geoCache[type]) return _geoCache[type];
  const t = CAR_TYPES[type], bev = t.prof === 'bus' ? 0.04 : 0.07;
  const { body, cabin, glass, P } = carShape(t);
  const mk = (shape, w, b) => { const g = new THREE.ExtrudeGeometry(shape, { depth: w - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 3, curveSegments: 12 }); g.translate(0, 0, -(w - 2 * b) / 2); g.rotateY(-Math.PI / 2); g.computeVertexNormals(); return g; };
  const inset = t.prof === 'bus' ? 0.0 : (t.prof === 'van' ? 0.08 : t.prof === 'classic' ? 0.14 : 0.26);
  const bodyG = mergeGeos([mk(body, t.W, bev), mk(cabin, t.W - inset, bev)]), glassG = mk(glass, t.W - inset + 0.04, bev * 0.7);
  // detalles en cores de vértice (paragolpes, grella, matrícula, espellos, xuntas)
  const h = t.L / 2, W = t.W, parts = [];
  const add = (g, c) => parts.push(colorize(g, c));
  const bh = t.prof === 'bus' ? 0.4 : 0.28;
  if (t.classic) {
    // estética de época: paragolpes cromados finos, grella de lamas horizontais, moldura lateral
    const CH = '#d9dde2';
    for (const z of [h + 0.08, -h - 0.08]) { add(xform(boxGeo(W + 0.12, 0.11, 0.1), 0, t.sill + 0.15, z), CH); for (const s2 of [-1, 1]) add(xform(boxGeo(0.1, 0.11, 0.3), s2 * (W / 2 + 0.03), t.sill + 0.15, z - Math.sign(z) * 0.15), CH); }
    add(xform(boxGeo(W * 0.9, 0.26, 0.04), 0, t.sill + 0.33, h + 0.01), '#141516');
    for (let k = 0; k < 4; k++) add(xform(boxGeo(W * 0.88, 0.02, 0.03), 0, t.sill + 0.23 + k * 0.065, h + 0.035), CH);
    for (const s2 of [-1, 1]) add(xform(boxGeo(0.015, 0.025, t.L * 0.86), s2 * (W / 2 + 0.012), t.sill + 0.42, 0), CH);
  } else {
    add(xform(boxGeo(W + 0.04, bh, 0.22), 0, t.sill + 0.16, h - 0.02), '#1b1c1f');
    add(xform(boxGeo(W + 0.04, bh, 0.22), 0, t.sill + 0.16, -h + 0.02), '#1b1c1f');
    add(xform(boxGeo(W * 0.5, 0.16, 0.05), 0, t.sill + 0.34, h + 0.06), '#0d0e10'); // grella
  }
  add(xform(boxGeo(0.52, 0.12, 0.02), 0, t.sill + 0.18, h + 0.14), '#f4f4f0'); // matrícula
  add(xform(boxGeo(0.05, 0.12, 0.022), -0.24, t.sill + 0.18, h + 0.141), '#1d47b8');
  add(xform(boxGeo(0.52, 0.12, 0.02), 0, t.sill + 0.42, -h - 0.04), '#f4f4f0');
  add(xform(boxGeo(0.05, 0.12, 0.022), -0.24, t.sill + 0.42, -h - 0.041), '#1d47b8');
  if (t.prof !== 'bus') {
    const by = P.glass[0][1];
    for (const s of [-1, 1]) {
      add(xform(boxGeo(0.18, 0.1, 0.22), s * (W / 2 + 0.08), by + 0.08, P.glass[0][0] - 0.25), '#16171a');
      add(xform(boxGeo(0.012, by - t.sill - 0.08, 0.012), s * (W / 2 + 0.005), (by + t.sill) / 2 + 0.02, 0.15), '#0b0b0c');
      add(xform(boxGeo(0.012, by - t.sill - 0.08, 0.012), s * (W / 2 + 0.005), (by + t.sill) / 2 + 0.02, P.glass[0][0] - 0.05), '#0b0b0c');
      add(xform(boxGeo(0.02, 0.04, 0.18), s * (W / 2 + 0.01), by - 0.12, 0.05), '#2a2b2e'); // tiradores
      add(xform(boxGeo(0.02, 0.04, 0.18), s * (W / 2 + 0.01), by - 0.12, P.glass[0][0] - 0.45), '#2a2b2e');
      add(xform(boxGeo(0.04, 0.09, W > 1.85 ? 2.0 : 1.6), s * (W / 2 + 0.01), t.sill + 0.06, 0), '#141416'); // embellecedor
    }
  }
  if (t.prof === 'bus') { for (let z = -h + 1.2; z < h - 1; z += 1.6) for (const s of [-1, 1]) add(xform(boxGeo(0.04, 1.8, 0.08), s * (W / 2 + 0.02), 1.95, z), '#1a1a1a'); }
  const trimG = mergeGeos(parts);
  // faros (dianteiros) e pilotos (traseiros)
  const fy = t.prof === 'bus' ? 0.75 : P.front[1][1] - 0.06, ry = t.prof === 'bus' ? 0.9 : t.prof === 'van' ? 0.95 : P.rear[P.rear.length - 2 >= 0 ? P.rear.length - 2 : 0][1] - 0.1;
  const head = t.classic ? mergeGeos([-1, 1].map(s => xform(boxGeo(0.3, 0.17, 0.05), s * (W / 2 - 0.2), t.sill + 0.33, h + 0.035))) : mergeGeos([-1, 1].map(s => xform(boxGeo(t.prof === 'bus' ? 0.4 : 0.42, 0.11, 0.06), s * (W / 2 - 0.28), fy, h + 0.03, 0, 0, 0)));
  const tail = t.classic ? mergeGeos([-1, 1].map(s => xform(boxGeo(0.32, 0.2, 0.05), s * (W / 2 - 0.22), t.sill + 0.38, -h - 0.03))) : mergeGeos([-1, 1].map(s => xform(boxGeo(t.prof === 'bus' ? 0.3 : 0.4, t.prof === 'bus' ? 0.5 : 0.12, 0.06), s * (W / 2 - 0.26), ry, -h - 0.03)));
  // roda: pneumático + llanta (cores de vértice)
  const wr = t.wr, tw = t.prof === 'bus' ? 0.32 : 0.24;
  const tire = colorize(new THREE.CylinderGeometry(wr, wr, tw, 22, 1), '#121212');
  const sidewall = colorize(new THREE.TorusGeometry(wr * 0.82, wr * 0.18, 6, 22), '#1c1c1c'); sidewall.rotateY(Math.PI / 2); sidewall.rotateZ(Math.PI / 2);
  const rim = colorize(new THREE.CylinderGeometry(wr * 0.66, wr * 0.66, tw + 0.02, 18, 1), '#b9bec4');
  const hub = colorize(new THREE.CylinderGeometry(wr * 0.18, wr * 0.18, tw + 0.05, 10, 1), '#55595e');
  const spokes = []; for (let i = 0; i < 5; i++) { const sp = colorize(boxGeo(tw + 0.04, wr * 1.1, 0.07), '#80868d'); sp.rotateX(i / 5 * Math.PI * 2); spokes.push(sp); }
  const wheel = mergeGeos([xform(tire, 0, 0, 0, 0, 0, Math.PI / 2), xform(rim, 0, 0, 0, 0, 0, Math.PI / 2), xform(hub, 0, 0, 0, 0, 0, Math.PI / 2), ...spokes]);
  return (_geoCache[type] = { bodyG, glassG, trimG, head, tail, wheel, P });
}
const _paint = {};
function paintMat(c, solid) { const k = c + (solid ? 's' : ''); if (!_paint[k]) _paint[k] = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c), metalness: solid ? 0.05 : 0.55, roughness: solid ? 0.28 : 0.32, clearcoat: solid ? 0.6 : 1, clearcoatRoughness: 0.08 }); return _paint[k]; }
const VMAT = {};
function vehicleMats() {
  VMAT.glass = new THREE.MeshPhysicalMaterial({ color: 0x0c1218, metalness: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.92 });
  VMAT.trim = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2 });
  VMAT.wheel = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.35 });
  VMAT.head = new THREE.MeshBasicMaterial({ color: 0xeef4ff });
  VMAT.tail = new THREE.MeshBasicMaterial({ color: 0x7a0a0a });
  VMAT.tailOn = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  VMAT.blue = new THREE.MeshBasicMaterial({ color: 0x1546ff }); VMAT.blueOff = new THREE.MeshBasicMaterial({ color: 0x0b1a44 });
  VMAT.taxiOn = new THREE.MeshBasicMaterial({ color: 0x29ff6a });
  const pol = cnv(512, 64), px = pol.getContext('2d');
  for (let i = 0; i < 16; i++) { px.fillStyle = i % 2 ? '#f5d10f' : '#123fa6'; px.fillRect(i * 32, 0, 32, 32); px.fillStyle = i % 2 ? '#123fa6' : '#f5d10f'; px.fillRect(i * 32, 32, 32, 32); }
  VMAT.policeStripe = new THREE.MeshStandardMaterial({ map: toTex(pol, false), roughness: 0.4 });
  VMAT.policeText = new THREE.MeshStandardMaterial({ map: textTex('POLICÍA LOCAL', { w: 512, h: 96, bg: '#ffffff', fg: '#123fa6', size: 64 }), roughness: 0.4 });
  VMAT.taxiSign = new THREE.MeshStandardMaterial({ map: textTex('TAXI', { w: 256, h: 96, bg: '#f4f4f0', fg: '#141414', size: 70 }), roughness: 0.4 });
  VMAT.busSign = new THREE.MeshBasicMaterial({ map: textTex('L1 · CENTRO – ESTACIÓN', { w: 1024, h: 96, bg: '#060606', fg: '#ffb400', size: 58, font: 'monospace' }) });
  VMAT.busStripe = new THREE.MeshStandardMaterial({ color: 0x7a1f3d, roughness: 0.4, metalness: 0.3 });
}

/* ---------- Vehículo ---------- */
let _vid = 0;
class Vehicle {
  constructor(type, color, scene) {
    this.id = _vid++; this.type = type; this.t = CAR_TYPES[type];
    const t = this.t, geos = t.moto ? null : carGeos(type);
    if (t.livery === 'police' || t.livery === 'taxi') color = '#f2f2ef';
    if (t.livery === 'bus') color = '#eeeeea';
    this.color = color;
    this.root = new THREE.Group(); this.body = new THREE.Group(); this.root.add(this.body);
    if (t.moto) buildMoto(this, color, scene); else {
    const bm = new THREE.Mesh(geos.bodyG, paintMat(color, t.classic)); bm.castShadow = true; bm.receiveShadow = true; this.body.add(bm);
    const gm = new THREE.Mesh(geos.glassG, VMAT.glass); this.body.add(gm);
    const tm = new THREE.Mesh(geos.trimG, VMAT.trim); tm.castShadow = true; this.body.add(tm);
    this.headM = new THREE.Mesh(geos.head, VMAT.head); this.body.add(this.headM);
    this.tailM = new THREE.Mesh(geos.tail, VMAT.tail); this.body.add(this.tailM);
    const W = t.W, h = t.L / 2;
    if (t.livery === 'police') {
      for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(t.L * 0.86, 0.22), VMAT.policeStripe); st.position.set(s * (W / 2 + 0.035), 0.82, 0); st.rotation.y = s * Math.PI / 2; this.body.add(st); const tx = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), VMAT.policeText); tx.position.set(s * (W / 2 + 0.04), 1.02, -0.5); tx.rotation.y = s * Math.PI / 2; this.body.add(tx); }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x222222 })); bar.position.set(0, 1.75, -0.2); this.body.add(bar);
      this.lightA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.26), VMAT.blueOff); this.lightA.position.set(-0.3, 1.82, -0.2); this.body.add(this.lightA);
      this.lightB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.26), VMAT.blueOff); this.lightB.position.set(0.3, 1.82, -0.2); this.body.add(this.lightB);
    }
    if (t.livery === 'taxi') {
      const sg = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.2), [VMAT.taxiSign, VMAT.taxiSign, VMAT.taxiSign, VMAT.taxiSign, VMAT.taxiSign, VMAT.taxiSign]); sg.position.set(0, 1.55, 0.1); this.body.add(sg);
      this.taxiLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), VMAT.taxiOn); this.taxiLight.position.set(0.24, 1.69, 0.1); this.body.add(this.taxiLight);
      for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(t.L * 0.7, 0.06), VMAT.busStripe); st.position.set(s * (W / 2 + 0.035), 0.78, 0); st.rotation.y = s * Math.PI / 2; this.body.add(st); }
    }
    if (t.livery === 'bus') {
      for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(t.L * 0.98, 0.35), VMAT.busStripe); st.position.set(s * (W / 2 + 0.035), 0.75, 0); st.rotation.y = s * Math.PI / 2; this.body.add(st); }
      const ds = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.3), VMAT.busSign); ds.position.set(0, 2.95, h + 0.02); this.body.add(ds);
    }
    // rodas
    this.wheels = [];
    const tw = t.prof === 'bus' ? 0.32 : 0.24;
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const piv = new THREE.Group(); piv.position.set(sx * (W / 2 - tw / 2 + 0.06), t.wr, sz * t.wb / 2);
      const wm = new THREE.Mesh(geos.wheel, VMAT.wheel); wm.castShadow = true; if (sx > 0) wm.rotation.y = Math.PI; piv.add(wm);
      this.root.add(piv); this.wheels.push({ piv, wm, front: sz > 0, side: sx });
    }
    }
    scene.add(this.root);
    // estado físico
    this.x = 0; this.z = 0; this.y = 0; this.vy = 0; this.yaw = 0; this.vx = 0; this.vz = 0; this.r = 0; this.steer = 0;
    this.pitch = 0; this.roll = 0; this.spin = 0; this.onGround = true; this.health = 100; this.sleep = false;
    this.Iz = t.mass * (t.L * t.L + t.W * t.W) / 12 * 1.1;
    const n = t.prof === 'bus' ? 5 : 3; this.circles = []; for (let i = 0; i < n; i++) this.circles.push(lerp(-t.L / 2 + t.W / 2, t.L / 2 - t.W / 2, i / (n - 1)));
    this.rad = t.W / 2 + 0.05;
    this.inp = { throttle: 0, brake: 0, steer: 0, hand: 0 };
    this.driver = null; this.ai = null; this.skid = 0; this.latAcc = 0; this.lonAcc = 0; this.sirenOn = false; this.inWater = 0;
  }
  place(x, z, yaw) { this.x = x; this.z = z; this.yaw = yaw; this.y = groundH(x, z); this.vx = this.vz = this.r = this.vy = 0; this.sync(0); }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get fwdSpeed() { return this.vx * Math.sin(this.yaw) + this.vz * Math.cos(this.yaw); }
  update(dt) {
    const t = this.t, inp = this.inp, m = t.mass;
    if (this.sleep && !inp.throttle && !this.driver) return;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), lx = Math.cos(this.yaw), lz = -Math.sin(this.yaw);
    let vf = this.vx * fx + this.vz * fz, vl = this.vx * lx + this.vz * lz;
    // dirección suavizada (menos ángulo a alta velocidade)
    const target = -inp.steer * t.steer / (1 + Math.pow(Math.abs(vf) / 9, 1.4));
    this.steer += (target - this.steer) * Math.min(1, dt * 7);
    const d = this.steer, a = t.wb / 2, b = t.wb / 2;
    let Flong = 0, Flat = 0, torque = 0;
    if (this.onGround && !this.inWater) {
      // motor e freos
      let brake = inp.brake;
      if (inp.throttle > 0) { if (vf < -0.8) brake = Math.max(brake, inp.throttle); else Flong += Math.min(t.maxF, t.power / Math.max(Math.abs(vf), 4)) * inp.throttle; }
      if (inp.throttle < 0) { if (vf > 0.8) brake = Math.max(brake, -inp.throttle); else if (vf > -9) Flong += t.maxF * 0.55 * inp.throttle; }
      if (this.health <= 0) Flong = 0;
      const Fb = 9500 * (m / 1400) * brake;
      if (Fb > 0) { if (Math.abs(vf) < Fb / m * dt * 1.2) { vf = 0; } else Flong -= Math.sign(vf) * Fb; }
      // resistencia
      Flong -= 0.42 * vf * Math.abs(vf) * (t.prof === 'bus' ? 3 : 1) + Math.sign(vf) * 0.012 * m * GRAV;
      Flong -= m * GRAV * Math.sin(this.pitch);
      // forzas laterais (modelo bicicleta con ángulos de deriva)
      const N = m * GRAV / 2, va = Math.max(Math.abs(vf), 1.2);
      const af = Math.atan((vl + this.r * a - d * vf) / va), ar = Math.atan((vl - this.r * b) / va);
      const C = 15 * N;
      let mf = t.grip * N, mr = t.grip * N * (inp.hand ? 0.38 : 1.12);
      if (G.rain) { mf *= 0.82; mr *= 0.8; }
      // círculo de fricción no eixo traseiro con potencia (sobrevirancia nos deportivos)
      if (t.prof === 'sport' && inp.throttle > 0.9 && Math.abs(vf) < 16) mr *= 0.9;
      const Ff = clamp(-C * af, -mf, mf), Fr = clamp(-C * 1.15 * ar, -mr, mr);
      if (inp.hand) Flong -= Math.sign(vf) * Math.min(Math.abs(vf) * m * 0.6, 5000);
      Flat = Ff * Math.cos(d) + Fr; Flong -= Ff * Math.sin(d);
      torque = a * Ff * Math.cos(d) - b * Fr;
      this.skid = Math.max(Math.abs(Ff) >= mf * 0.98 ? 1 : 0, Math.abs(Fr) >= mr * 0.98 ? 1 : 0) * (Math.abs(vf) > 4 || Math.abs(vl) > 2 ? 1 : 0);
      if (inp.hand && Math.abs(vf) > 5) this.skid = 1;
      if (inp.throttle > 0.9 && Math.abs(vf) < 4 && t.power > 200e3) this.skid = 1;
    } else this.skid = 0;
    if (this.inWater) { Flong = -vf * m * 1.5; Flat = -vl * m * 1.5; torque = -this.r * this.Iz * 2; }
    this.lonAcc = Flong / m; this.latAcc = Flat / m;
    // integración no mundo
    const ax = (Flong * fx + Flat * lx) / m, az = (Flong * fz + Flat * lz) / m;
    this.vx += ax * dt; this.vz += az * dt;
    if (vf === 0 && inp.brake > 0) { const vl2 = this.vx * lx + this.vz * lz; this.vx = vl2 * lx; this.vz = vl2 * lz; }
    this.r += torque / this.Iz * dt;
    if (this.onGround && Math.hypot(this.vx, this.vz) < 1.5) { this.r *= Math.pow(0.02, dt); if (!inp.throttle) { this.vx *= Math.pow(0.1, dt); this.vz *= Math.pow(0.1, dt); } }
    this.r *= Math.pow(inp.hand ? 0.7 : 0.35, dt);
    this.yaw += this.r * dt;
    this.x += this.vx * dt; this.z += this.vz * dt;
    // chan e saltos
    // as rodas pegadas ao chan: bordos, lombos de pontes e costas non fan saltar o coche;
    // só cae se o chan baixa de golpe máis dun metro (un muro, un barranco)
    const gy = groundH(this.x, this.z);
    if (this.onGround) {
      const drop = this.y - gy;
      if (drop < 1.0) { this.y = gy; this.vy = 0; }
      else { this.onGround = false; this.vy = 0; this.y -= GRAV * dt * dt * 0.5; }
    } else {
      const ny = this.y + this.vy * dt - GRAV * dt * dt * 0.5;
      if (ny <= gy + 0.001) {
        if (this.vy < -4) { this.landJolt = Math.min(1, -this.vy / 10); if (G.sfx) G.sfx.thud(Math.min(1, -this.vy / 12), this); }
        this.vy = 0; this.y = gy; this.onGround = true;
      } else { this.y = ny; this.vy -= GRAV * dt; }
    }
    // auga
    if (inRiver(this.x, this.z) && this.y < -0.4) { if (!this.inWater && G.sfx) G.sfx.splash(this); this.inWater = (this.inWater || 0) + dt; this.y = Math.max(this.y, -1.6 - Math.min(this.inWater, 2) * 0.5); }
    // inclinación segundo o terreo
    const h = t.L * 0.38, w2 = t.W * 0.45;
    const gF = groundH(this.x + fx * h, this.z + fz * h), gB = groundH(this.x - fx * h, this.z - fz * h);
    const gL = groundH(this.x + lx * w2, this.z + lz * w2), gR = groundH(this.x - lx * w2, this.z - lz * w2);
    if (this.onGround) { this.pitch = lerp(this.pitch, Math.atan2(gF - gB, 2 * h), Math.min(1, dt * 10)); this.roll = lerp(this.roll, Math.atan2(gL - gR, 2 * w2), Math.min(1, dt * 10)); }
    // colisións co mundo
    this.collideWorld();
    this.spin += vf / t.wr * dt;
    if (!this.driver && Math.hypot(this.vx, this.vz) < 0.05 && Math.abs(this.r) < 0.01 && this.onGround && !this.ai) this.sleep = true;
  }
  collideWorld() {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), out = this._o || (this._o = {}), p = this._p || (this._p = { x: 0, z: 0 });
    for (const off of this.circles) {
      p.x = this.x + fx * off; p.z = this.z + fz * off;
      const ox = p.x, oz = p.z;
      let hit = collideCircle(p, this.rad, this.y + 0.5, out);
      hit = trainPush(p, this.rad) || hit;
      if (hit) {
        const dx = p.x - ox, dz = p.z - oz, l = Math.hypot(dx, dz) || 1, nx = dx / l, nz = dz / l;
        this.x += dx; this.z += dz;
        const vn = this.vx * nx + this.vz * nz;
        if (vn < 0) {
          const e = 0.25, J = -(1 + e) * vn;
          this.vx += J * nx; this.vz += J * nz;
          // fricción tanxencial
          const tx = -nz, tz = nx, vt = this.vx * tx + this.vz * tz; this.vx -= vt * tx * 0.15; this.vz -= vt * tz * 0.15;
          this.r += off * J * (fz * nx - fx * nz) * this.t.mass / this.Iz * 0.6;
          if (-vn > 3) this.onCrash(-vn);
        }
      }
    }
  }
  onCrash(s) {
    this.health -= Math.max(0, s - 3) * 2.2;
    if (G.sfx) G.sfx.crash(Math.min(1, s / 18), this);
    if (this === G.player.car) G.shake = Math.min(1, s / 15);
    this.sleep = false;
  }
  sync(dt) {
    // suspensión: a carrocería suaviza os chanzos (bordos, xuntas)
    this.visY = this.onGround && this.visY !== undefined && Math.abs(this.visY - this.y) < 0.6 ? lerp(this.visY, this.y, Math.min(1, (dt || 0.016) * 14)) : this.y;
    this.root.position.set(this.x, this.visY, this.z);
    this.root.rotation.set(0, 0, 0); this.root.rotation.order = 'YXZ';
    this.root.rotation.y = this.yaw; this.root.rotation.x = -this.pitch; this.root.rotation.z = this.roll;
    if (this.t.moto) { this.lean = lerp(this.lean || 0, clamp(this.latAcc * 0.075, -0.6, 0.6), 0.15); this.root.rotation.z = this.roll - this.lean; }
    // balanceo da carrocería (suspensión)
    const tr = clamp(this.latAcc * 0.011, -0.07, 0.07), tp = clamp(-this.lonAcc * 0.008, -0.05, 0.05);
    this.body.rotation.z = lerp(this.body.rotation.z, tr, 0.15); this.body.rotation.x = lerp(this.body.rotation.x, tp, 0.12);
    this.landJolt = (this.landJolt || 0) * 0.85; this.body.position.y = -this.landJolt * 0.12 + (this.health < 30 ? 0 : 0);
    for (const w of this.wheels) { w.wm.rotation.x = this.spin * (w.side > 0 ? -1 : 1) * (w.side > 0 ? -1 : 1); if (w.front) w.piv.rotation.y = this.steer; }
    // luces de freo
    const braking = this.inp.brake > 0.1 || (this.inp.throttle < 0 && this.fwdSpeed > 0.5);
    this.tailM.material = braking || G.night > 0.5 && this.driver ? VMAT.tailOn : VMAT.tail;
    if (this.lightA) { const on = this.sirenOn && Math.floor(G.t * 8) % 2; this.lightA.material = on ? VMAT.blue : VMAT.blueOff; this.lightB.material = !on && this.sirenOn ? VMAT.blue : VMAT.blueOff; }
  }
  worldCircles(out) { const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw); out.length = 0; for (const off of this.circles) out.push({ x: this.x + fx * off, z: this.z + fz * off, off }); return out; }
  remove(scene) { scene.remove(this.root); }
}

/* empuxe do tren */
G.trainBox = null;
function trainPush(p, r) {
  const b = G.trainBox; if (!b) return false;
  const dx = p.x - b.x, dz = p.z - b.z, al = dx * b.ux + dz * b.uz, ac = -dx * b.uz + dz * b.ux;
  if (Math.abs(al) < b.half + r && Math.abs(ac) < b.hw + r) { const sgn = ac < 0 ? -1 : 1, d = (b.hw + r) * sgn - ac; p.x += -b.uz * d; p.z += b.ux * d; return true; }
  return false;
}
/* contacto entre vehículos */
const _ca = [], _cb = [];
function collideVehicles(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const A = list[i], B = list[j];
    const maxd = (A.t.L + B.t.L) / 2 + 0.5;
    if (Math.abs(A.x - B.x) > maxd || Math.abs(A.z - B.z) > maxd) continue;
    if (Math.abs(A.y - B.y) > 2.5) continue;
    A.worldCircles(_ca); B.worldCircles(_cb);
    for (const ca of _ca) for (const cb of _cb) {
      const dx = ca.x - cb.x, dz = ca.z - cb.z, d = Math.hypot(dx, dz), rr = A.rad + B.rad;
      if (d >= rr || d < 1e-4) continue;
      const nx = dx / d, nz = dz / d, pen = rr - d, ma = A.t.mass, mb = B.t.mass, tot = ma + mb;
      A.x += nx * pen * mb / tot; A.z += nz * pen * mb / tot; B.x -= nx * pen * ma / tot; B.z -= nz * pen * ma / tot;
      const rv = (A.vx - B.vx) * nx + (A.vz - B.vz) * nz;
      if (rv < 0) {
        const J = -(1.3) * rv / (1 / ma + 1 / mb);
        A.vx += J * nx / ma; A.vz += J * nz / ma; B.vx -= J * nx / mb; B.vz -= J * nz / mb;
        const fa = [Math.sin(A.yaw), Math.cos(A.yaw)], fb = [Math.sin(B.yaw), Math.cos(B.yaw)];
        A.r += ca.off * J * (fa[1] * nx - fa[0] * nz) / A.Iz * 0.7; B.r -= cb.off * J * (fb[1] * nx - fb[0] * nz) / B.Iz * 0.7;
        A.sleep = B.sleep = false;
        if (-rv > 2.5) { A.onCrash(-rv * mb / tot * 2); B.onCrash(-rv * ma / tot * 2); if (G.onVehicleHit) G.onVehicleHit(A, B, -rv); }
      }
    }
  }
}

/* ---------- Marcas de freada e fume ---------- */
class Skids {
  constructor(scene, n = 700) {
    this.n = n; this.i = 0;
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.24, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6 }), n);
    const o = new THREE.Object3D(); o.scale.set(0, 0, 0); o.updateMatrix(); for (let i = 0; i < n; i++) this.mesh.setMatrixAt(i, o.matrix);
    this.mesh.frustumCulled = false; scene.add(this.mesh); this.o = new THREE.Object3D(); this.last = new Map();
  }
  mark(key, x, y, z) {
    const l = this.last.get(key); this.last.set(key, [x, z, G.t]);
    if (!l || G.t - l[2] > 0.15) return;
    const dx = x - l[0], dz = z - l[1], L = Math.hypot(dx, dz); if (L < 0.05 || L > 3) return;
    this.o.position.set((x + l[0]) / 2, y + 0.06, (z + l[1]) / 2); this.o.rotation.set(0, Math.atan2(dx, dz), 0); this.o.scale.set(1, 1, L + 0.05); this.o.updateMatrix();
    this.mesh.setMatrixAt(this.i, this.o.matrix); this.i = (this.i + 1) % this.n; this.mesh.instanceMatrix.needsUpdate = true;
  }
}
class Smoke {
  constructor(scene, n = 160) {
    const c = cnv(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    this.tex = toTex(c, false); this.p = [];
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, color: 0xdddddd, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; scene.add(s); this.p.push({ s, life: 0 }); }
    this.i = 0;
  }
  emit(x, y, z, vx, vy, vz, size, life, color = 0xd8d8d8, op = 0.5) {
    const p = this.p[this.i]; this.i = (this.i + 1) % this.p.length;
    p.s.position.set(x, y, z); p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.size = size; p.op = op; p.s.material.color.setHex(color); p.s.visible = true;
  }
  update(dt) {
    for (const p of this.p) {
      if (p.life <= 0) continue; p.life -= dt;
      if (p.life <= 0) { p.s.visible = false; continue; }
      const k = 1 - p.life / p.max; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
      p.s.scale.setScalar(p.size * (0.6 + k * 2)); p.s.material.opacity = p.op * (1 - k);
    }
  }
}

/* ==========================================================
   PEÓNS (multitude instanciada: 8 debuxados para todos)
   ========================================================== */
const PED_PARTS = ['torso', 'hips', 'head', 'hair', 'uarm', 'farm', 'thigh', 'shin', 'shoe'];
const SKIN = ['#f1c9a5', '#e0ac85', '#c98e65', '#a86b48', '#7a4b31', '#f6d7bd'];
const HAIR = ['#1d1612', '#3b2a1e', '#6b4a2e', '#a07a4f', '#d6c08f', '#8a8a8a', '#cfcfcf', '#5a1e14'];
const SHIRT = ['#2b3a55', '#7a1f3d', '#e8e4dc', '#3b5d3a', '#c86b2a', '#1c1c1e', '#6c7a89', '#b8a07a', '#8e2b2b', '#2d6b78', '#d9c9a3', '#4a3b6b', '#f0d24a'];
const PANTS = ['#1f2a44', '#2b2b2e', '#5a4a3a', '#3c4d63', '#77705f', '#121212', '#6a3d2a'];
class Crowd {
  constructor(scene, max) {
    this.max = max; this.peds = [];
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, envMapIntensity: 0.4 });
    const geo = {
      torso: (() => { const g = new THREE.CylinderGeometry(0.2, 0.16, 0.56, 10); g.scale(1, 1, 0.62); g.translate(0, 0, 0); return mergeGeos([g, xform(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.27, 0, 0, 0, 0, 1, 0.45, 0.62)]); })(),
      hips: (() => { const g = new THREE.CylinderGeometry(0.17, 0.16, 0.2, 10); g.scale(1, 1, 0.65); return g; })(),
      head: mergeGeos([new THREE.SphereGeometry(0.115, 14, 10).scale(0.92, 1.05, 1), xform(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 8), 0, -0.13, 0), xform(new THREE.SphereGeometry(0.025, 6, 4), 0, -0.01, 0.11)]),
      hair: (() => { const g = new THREE.SphereGeometry(0.124, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55); g.scale(0.94, 1.0, 1.04); g.translate(0, 0.012, -0.012); return g; })(),
      uarm: (() => { const g = new THREE.CylinderGeometry(0.058, 0.05, 0.3, 8); g.translate(0, -0.15, 0); return g; })(),
      farm: (() => mergeGeos([xform(new THREE.CylinderGeometry(0.048, 0.04, 0.27, 8), 0, -0.135, 0), xform(new THREE.SphereGeometry(0.05, 8, 6), 0, -0.29, 0, 0, 0, 0, 0.8, 1.1, 0.6)]))(),
      thigh: (() => { const g = new THREE.CylinderGeometry(0.085, 0.065, 0.44, 8); g.translate(0, -0.22, 0); return g; })(),
      shin: (() => { const g = new THREE.CylinderGeometry(0.062, 0.048, 0.42, 8); g.translate(0, -0.21, 0); return g; })(),
      shoe: (() => { const g = new THREE.BoxGeometry(0.1, 0.08, 0.25); g.translate(0, -0.03, 0.05); return g; })(),
    };
    this.meshes = {};
    const mult = { uarm: 2, farm: 2, thigh: 2, shin: 2, shoe: 2 };
    for (const k of PED_PARTS) {
      const m = new THREE.InstancedMesh(geo[k], mat, max * (mult[k] || 1));
      m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const c = new THREE.Color(1, 1, 1); for (let i = 0; i < m.count; i++) m.setColorAt(i, c);
      scene.add(m); this.meshes[k] = m;
    }
    this.M = new THREE.Matrix4(); this.T = new THREE.Matrix4(); this.A = new THREE.Matrix4(); this.B = new THREE.Matrix4(); this.C = new THREE.Matrix4(); this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
  }
  add(opts = {}) {
    if (this.peds.length >= this.max) return null;
    const idx = this.peds.length;
    const female = R() < 0.5, old = R() < 0.2;
    const p = {
      idx, x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, speed: 0, phase: R() * 10, scale: (female ? RR(0.92, 1.0) : RR(0.98, 1.08)) * (old ? 0.97 : 1),
      walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, state: 'idle', timer: 0, visible: true, female, old,
      col: { skin: pick(SKIN), hair: old ? pick(['#9a9a9a', '#cfcfcf', '#e0e0e0']) : pick(HAIR), shirt: pick(SHIRT), pants: female && R() < 0.3 ? pick(SHIRT) : pick(PANTS), shoe: pick(['#151515', '#3a2a1e', '#e9e9e9', '#5a1e14']), sleeve: R() < 0.4 },
      ...opts,
    };
    if (opts.colors) Object.assign(p.col, opts.colors);
    this.peds.push(p); this.paint(p); return p;
  }
  paint(p) {
    const c = new THREE.Color(), set = (k, i, col) => { c.set(col); this.meshes[k].setColorAt(i, c); };
    const i = p.idx;
    set('torso', i, p.col.shirt); set('hips', i, p.col.pants); set('head', i, p.col.skin); set('hair', i, p.col.hair);
    for (const s of [0, 1]) { set('uarm', i * 2 + s, p.col.shirt); set('farm', i * 2 + s, p.col.sleeve ? p.col.skin : p.col.shirt); set('thigh', i * 2 + s, p.col.pants); set('shin', i * 2 + s, p.col.pants); set('shoe', i * 2 + s, p.col.shoe); }
    for (const k of PED_PARTS) this.meshes[k].instanceColor.needsUpdate = true;
  }
  /* pose e matrices de cada parte */
  pose(p) {
    const { M, T, A, B, C } = this, i = p.idx, mm = this.meshes;
    if (!p.visible) { for (const k of PED_PARTS) { const n = k === 'torso' || k === 'hips' || k === 'head' || k === 'hair' ? 1 : 2; for (let s = 0; s < n; s++) mm[k].setMatrixAt(i * n + s, this.zero); } return; }
    const ph = p.phase, w = p.walk, run = p.run, sit = p.sit, lie = p.lie;
    const amp = lerp(0.5, 0.95, run) * w, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 0.035 * w * (1 + run);
    const sc = p.scale;
    // base: posición, xiro, caída
    M.makeRotationY(p.yaw); M.setPosition(p.x, p.y, p.z);
    if (lie > 0) { A.makeTranslation(0, 0.18 * lie, 0); M.multiply(A); A.makeRotationX(-Math.PI / 2 * lie * (p.fallDir || 1)); M.multiply(A); }
    A.makeScale(sc * (p.fat || 1), sc, sc * (p.fat || 1) * 0.92 + sc * 0.08); M.multiply(A);
    const kneel = p.kneel || 0, hipY = 0.93 - sit * 0.45 - kneel * 0.43 + bob, lean = run * 0.18 * w + sit * -0.05;
    // pelve
    T.copy(M); A.makeTranslation(0, hipY + 0.05, 0); T.multiply(A); mm.hips.setMatrixAt(i, T);
    // torso
    const torsoBase = this.C.copy(M); A.makeTranslation(0, hipY + 0.1, 0); torsoBase.multiply(A); A.makeRotationX(lean); torsoBase.multiply(A); A.makeRotationY(Math.sin(ph) * 0.12 * w); torsoBase.multiply(A);
    T.copy(torsoBase); A.makeTranslation(0, 0.27, 0); T.multiply(A); mm.torso.setMatrixAt(i, T);
    // cabeza
    T.copy(torsoBase); A.makeTranslation(0, 0.7, 0.01); T.multiply(A); A.makeRotationY(p.look || 0); T.multiply(A); A.makeRotationX(-lean * 0.6 + (p.nod || 0)); T.multiply(A);
    mm.head.setMatrixAt(i, T); mm.hair.setMatrixAt(i, T);
    // brazos
    for (const s of [0, 1]) {
      const sg = s ? 1 : -1, swing = (s ? sw : -sw) * amp * 0.9;
      T.copy(torsoBase); A.makeTranslation(sg * 0.235, 0.5, 0); T.multiply(A);
      let ax = swing, az = sg * (0.07 + run * 0.1 * w);
      if (p.armUp && s === 1) ax = -lerp(0, 2.1, p.armUp);
      if (p.wave && s === 0) { ax = -2.8; az = -0.3 + Math.sin(G.t * 9) * 0.25; }
      if (lie > 0.5) { ax = -2.6; }
      if (p.arms) { ax = p.arms[s * 3]; az = p.arms[s * 3 + 1]; }
      A.makeRotationX(ax); T.multiply(A); A.makeRotationZ(az); T.multiply(A);
      mm.uarm.setMatrixAt(i * 2 + s, T);
      A.makeTranslation(0, -0.3, 0); T.multiply(A); A.makeRotationX(-(p.arms ? p.arms[s * 3 + 2] : 0.15 + run * 1.1 * w + (p.armUp && s === 1 ? 1.3 * p.armUp : 0) + sit * 0.6)); T.multiply(A);
      mm.farm.setMatrixAt(i * 2 + s, T);
    }
    // pernas
    for (const s of [0, 1]) {
      const sg = s ? 1 : -1, swing = (s ? -sw : sw) * amp;
      T.copy(M); A.makeTranslation(sg * 0.1, hipY, 0); T.multiply(A);
      const thighA = swing - sit * 1.5;
      A.makeRotationX(-thighA); T.multiply(A); A.makeRotationZ(sg * 0.02); T.multiply(A);
      mm.thigh.setMatrixAt(i * 2 + s, T);
      const knee = Math.max(0, -Math.cos(ph + (s ? Math.PI : 0))) * (0.5 + run * 0.9) * w + sit * 1.5 + kneel * 1.57;
      A.makeTranslation(0, -0.44, 0); T.multiply(A); A.makeRotationX(knee); T.multiply(A);
      mm.shin.setMatrixAt(i * 2 + s, T);
      A.makeTranslation(0, -0.42, 0); T.multiply(A); A.makeRotationX(-knee * 0.5 + thighA * 0.3 - sit * 0.0); T.multiply(A);
      mm.shoe.setMatrixAt(i * 2 + s, T);
    }
  }
  flush() { for (const k of PED_PARTS) { this.meshes[k].instanceMatrix.needsUpdate = true; } }
}

/* ---------- Comportamento dos peóns ---------- */
G.AREAS = {};
function pedOffset(r) { return r.type === 'path' ? 0.45 : r.type === 'ped' ? Math.max(0.6, r.hw - 1.5) : r.type === 'track' ? r.hw + 0.6 : r.hw + (r.sw ? r.sw / 2 : 0.9); }
function randomAreaPoint(area) {
  if (area === 'park') return pick(G.parkPoints);
  if (area === 'cardeal') { const P = LM.cardeal, q = P.at(RR(3, P.len - 3)), o = RR(-2.5, 2.5); return [q.x - q.uz * o, q.z + q.ux * o]; }
  if (area === 'castle') { const a = R() * 6.28, r = RR(6, 30); return [HILL.x + Math.sin(a) * r, HILL.z + Math.cos(a) * r]; }
  if (area === 'plaza') return LM.compOld(RR(-12, 85), RR(90, 120));
  if (area === 'station') return LM.stationOld(RR(226, 234), RR(-270, -186));
  if (area === 'paseo') { const M = LM.malecon, q = M.path.at(RR(0, M.path.len)), o = RR(4, 7); return [q.x - q.uz * M.side * o, q.z + q.ux * M.side * o]; }
  return [0, 0];
}
function pedThink(p, dt, world) {
  const pl = G.player;
  // perigo: vehículo a gran velocidade achegándose
  if (!p.immune && p.state !== 'down' && p.state !== 'getup' && p.state !== 'hidden' && p.state !== 'flee' && p.state !== 'board') {
    for (const v of world.vehicles) {
      const sp = v.speed; if (sp < 7) continue;
      const dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz); if (d > 14) continue;
      const along = (dx * v.vx + dz * v.vz) / sp; if (along < 0) continue;
      const lat = Math.abs(dx * v.vz - dz * v.vx) / sp;
      if (lat < 3) { const away = Math.sign(dx * v.vz - dz * v.vx) || 1; startFlee(p, v.x - v.vz * away * 3, v.z + v.vx * away * 3, 2.2); p.fleeAway = true; break; }
    }
  }
  switch (p.state) {
    case 'walk': {
      if (!p.edge) { const n = nearestNode(p.x, p.z); p.from = n; p.edge = pick(n.edges); p.side = R() < 0.5 ? -1 : 1; }
      const A = p.from, Bn = p.edge.to, dx = Bn.x - A.x, dz = Bn.z - A.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
      const off = pedOffset(p.edge.road) + (p.lane || 0);
      const rx = -uz * p.side, rz = ux * p.side;
      const tx = Bn.x + rx * off, tz = Bn.z + rz * off;
      if (Math.hypot(tx - p.x, tz - p.z) < 1.2) { const opts = Bn.edges.filter(e => e.to !== A && e.road.type !== 'track' && (e.road.urban || e.road.type === 'path')); p.from = Bn; p.edge = opts.length ? pick(opts) : pick(Bn.edges); if (R() < 0.3) p.side *= -1; }
      steerPed(p, tx, tz, p.walkSpeed || 1.35, dt);
      break;
    }
    case 'wander': {
      if (!p.target || p.timer > 0) { p.timer -= dt; p.walk = lerp(p.walk, 0, dt * 5); p.speed = 0; if (p.timer <= 0) p.target = randomAreaPoint(p.area); break; }
      if (Math.hypot(p.target[0] - p.x, p.target[1] - p.z) < 1) { p.target = null; p.timer = RR(2, 9); break; }
      steerPed(p, p.target[0], p.target[1], p.walkSpeed || 1.25, dt);
      break;
    }
    case 'seat': {
      p.walk = 0; p.speed = 0; p.x = p.seat.x; p.z = p.seat.z; p.yaw = p.seat.yaw;
      p.sit = p.seat.sit ? 1 : 0; p.y = groundH(p.x, p.z) + (p.seat.sit ? 0.0 : 0);
      p.drinkT = (p.drinkT || RR(2, 8)) - dt; if (p.drinkT < 0) { p.drinkT = RR(5, 14); p.drinking = 2.2; }
      if (p.drinking > 0) { p.drinking -= dt; p.armUp = lerp(p.armUp, 1, dt * 4); } else p.armUp = lerp(p.armUp, p.seat.stand ? 0.25 : 0, dt * 3);
      p.look = Math.sin(G.t * 0.5 + p.idx) * 0.5; p.nod = Math.max(0, Math.sin(G.t * 3 + p.idx * 2)) * 0.08;
      return;
    }
    case 'flee': {
      p.timer -= dt; p.run = 1;
      const ax = p.x - p.fx, az = p.z - p.fz, l = Math.hypot(ax, az) || 1;
      steerPed(p, p.x + ax / l * 5, p.z + az / l * 5, 4.6, dt);
      if (p.timer <= 0) { p.run = 0; p.state = p.prevState === 'seat' ? 'walk' : (p.prevState || 'walk'); p.edge = null; p.target = null; }
      break;
    }
    case 'down': {
      p.timer -= dt; p.walk = 0; p.lie = Math.min(1, p.lie + dt * 4);
      p.x += p.vx * dt; p.z += p.vz * dt; p.vx *= Math.pow(0.05, dt); p.vz *= Math.pow(0.05, dt);
      p.y = groundH(p.x, p.z);
      if (p.timer <= 0) { p.state = 'getup'; p.timer = 0.8; }
      break;
    }
    case 'getup': { p.timer -= dt; p.lie = Math.max(0, p.lie - dt * 1.6); if (p.timer <= 0) { p.lie = 0; startFlee(p, p.x + RR(-1, 1), p.z + RR(-1, 1), 5); p.prevState = p.home || 'walk'; } break; }
    case 'board': { // pasaxeiro do taxi
      const c = p.boardCar; if (!c) { p.state = 'idle'; break; }
      const sx = c.x + Math.cos(c.yaw) * 1.4, sz = c.z - Math.sin(c.yaw) * 1.4;
      steerPed(p, sx, sz, 1.6, dt);
      if (Math.hypot(sx - p.x, sz - p.z) < 0.9) { p.state = 'hidden'; p.visible = false; if (p.onBoard) p.onBoard(); }
      break;
    }
    case 'riot': { // xente alterada polo tongo do sorteo
      p.timer -= dt;
      if (!p.target || p.timer <= 0) { const a = R() * 6.28, r = RR(2.5, 12); p.target = [p.riotX + Math.cos(a) * r, p.riotZ + Math.sin(a) * r * 0.7]; p.timer = RR(1.5, 4); p.wave = R() < 0.55; p.armUp = R() < 0.3 ? 1 : 0; p.rs = R() < 0.25 ? 3.4 : 1.6; }
      if (Math.hypot(p.target[0] - p.x, p.target[1] - p.z) > 0.8) steerPed(p, p.target[0], p.target[1], p.rs, dt);
      else { p.walk = lerp(p.walk, 0, dt * 5); p.speed = 0; p.yaw += angDiff(p.yaw, Math.atan2(p.riotX - p.x, p.riotZ - p.z)) * dt * 3; p.nod = Math.sin(G.t * 12 + p.idx) * 0.1; }
      break;
    }
    case 'guard': { p.walk = lerp(p.walk, 0, dt * 5); p.speed = 0; const pl = G.player.ped; p.yaw += angDiff(p.yaw, Math.atan2(pl.x - p.x, pl.z - p.z)) * dt * 2; p.wave = Math.hypot(pl.x - p.x, pl.z - p.z) < 8 && Math.sin(G.t * 2 + p.idx) > 0.3; break; }
    case 'hidden': case 'idle': p.walk = lerp(p.walk, 0, dt * 5); p.speed = 0; break;
    case 'npc': {
      if (p.manual) break;
      p.walk = lerp(p.walk, 0, dt * 5); p.speed = 0;
      // mira cara ao xogador cando está preto
      const pl = G.player.ped, d = Math.hypot(pl.x - p.x, pl.z - p.z);
      const want = d < 9 ? Math.atan2(pl.x - p.x, pl.z - p.z) : p.homeYaw;
      p.yaw += angDiff(p.yaw, want) * Math.min(1, dt * 3);
      p.nod = Math.sin(G.t * (p.talking ? 7 : 1.3) + p.idx) * (p.talking ? 0.12 : 0.04);
      p.look = 0;
      break;
    }
  }
  // colisión cos edificios
  if (p.state !== 'seat' && p.state !== 'hidden' && !p.manual) {
    const o = p._o || (p._o = {}), q = p._q || (p._q = { x: 0, z: 0 }); q.x = p.x; q.z = p.z;
    if (collideCircle(q, 0.3, p.y + 0.5, o)) { p.x = q.x; p.z = q.z; if (p.state === 'wander') p.target = null; if (p.state === 'walk' && R() < 0.05) p.edge = null; }
    if (trainPush(q, 0.3)) { p.x = q.x; p.z = q.z; }
    if (p.state !== 'down') p.y = lerp(p.y, groundH(p.x, p.z), Math.min(1, dt * 15));
    if (inRiver(p.x, p.z)) { const rn = riverNear(p.x, p.z), dx = p.x - rn.px, dz = p.z - rn.pz, l = Math.hypot(dx, dz) || 1; p.x = rn.px + dx / l * (RIVER_HW + 1); p.z = rn.pz + dz / l * (RIVER_HW + 1); }
  }
}
function steerPed(p, tx, tz, speed, dt) {
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz) || 1;
  const want = Math.atan2(dx, dz); p.yaw += angDiff(p.yaw, want) * Math.min(1, dt * 8);
  p.speed = lerp(p.speed, speed, Math.min(1, dt * 4));
  p.x += Math.sin(p.yaw) * p.speed * dt; p.z += Math.cos(p.yaw) * p.speed * dt;
  p.walk = lerp(p.walk, 1, dt * 5); p.run = lerp(p.run, speed > 3 ? 1 : 0, dt * 4);
  p.phase += dt * p.speed * (speed > 3 ? 2.7 : 4.3);
}
function startFlee(p, fx, fz, t) {
  if (p.state === 'down' || p.state === 'hidden') return;
  if (p.state !== 'flee') p.prevState = p.state === 'seat' ? 'walk' : p.state;
  p.state = 'flee'; p.fx = fx; p.fz = fz; p.timer = t; p.sit = 0; p.armUp = 0;
  if (R() < 0.3 && G.sfx) G.sfx.scream(p);
}
function knockDown(p, vx, vz) {
  if (p.immune) return false;
  if (p.state === 'down' || p.state === 'hidden') return false;
  p.prevState = p.home || 'walk'; p.state = 'down'; p.timer = RR(3, 4.5); p.vx = vx * 0.6; p.vz = vz * 0.6; p.sit = 0; p.armUp = 0; p.walk = 0;
  const v = G.player.car; p.fallDir = 1; p.yaw = Math.atan2(-vx, -vz);
  if (G.sfx) G.sfx.thud(0.6, p);
  return true;
}

/* ==========================================================
   IA de tráfico e policía
   ========================================================== */
function aiSetEdge(v, from, edge) {
  v.ai.from = from; v.ai.edge = edge;
  const opts = edge.to.edges.filter(e => e.to !== from && e.road.type === 'car' && !e.blocked && (v.type !== 'bus' || !e.road.spiral));
  v.ai.next = opts.length ? pick(opts) : edge.to.edges.find(e => e.road.type === 'car' && !e.blocked) || edge.to.edges.find(e => e.to === from) || edge;
}
function laneOffset(road) { return road.spiral ? 2.0 : road.hw * 0.42; }
function lanePoint(A, Bn, road, s) {
  const dx = Bn.x - A.x, dz = Bn.z - A.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, off = laneOffset(road);
  return [A.x + ux * s - uz * off, A.z + uz * s + ux * off, L, ux, uz];
}
function aiDrive(v, dt, world) {
  const ai = v.ai, inp = v.inp;
  if (ai.mode === 'chase') return aiChase(v, dt, world);
  const A = ai.from, e = ai.edge, Bn = e.to;
  const dx = Bn.x - A.x, dz = Bn.z - A.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  const s = (v.x - A.x) * ux + (v.z - A.z) * uz, sp = v.fwdSpeed;
  const look = 5 + Math.abs(sp) * 0.55;
  let tx, tz;
  const endClear = Math.min(10, L * 0.3);
  if (s + look < L - endClear) { [tx, tz] = lanePoint(A, Bn, e.road, s + look); }
  else {
    // xirar á seguinte rúa
    const nx = ai.next; const [px, pz] = lanePoint(Bn, nx.to, nx.road, Math.min(look * 0.8, 8));
    tx = px; tz = pz;
    if (s > L - 3 || Math.hypot(px - v.x, pz - v.z) < 4) { aiSetEdge(v, Bn, nx); }
  }
  const want = Math.atan2(tx - v.x, tz - v.z), err = angDiff(v.yaw, want);
  inp.steer = clamp(-err * 2.4, -1, 1);
  // velocidade obxectivo
  let target = ai.cruise;
  const turning = Math.abs(angDiff(Math.atan2(ux, uz), Math.atan2(ai.next.to.x - Bn.x, ai.next.to.z - Bn.z)));
  if (turning > 0.5 && s > L - 26) target = Math.min(target, 6.5);
  if (e.road.spiral) target = Math.min(target, 8);
  target = Math.min(target, 2 + 9 * Math.cos(clamp(err, -1.5, 1.5)));
  // obstáculos diante
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), range = 5 + Math.max(0, sp) * 1.6;
  let block = 99;
  const check = (ox, oz, w) => { const rx = ox - v.x, rz = oz - v.z, al = rx * fx + rz * fz; if (al < 0.5 || al > range) return; const lat = Math.abs(rx * fz - rz * fx); if (lat < w) block = Math.min(block, al); };
  if (ai.ignore > 0) ai.ignore -= dt; else {
    for (const o of world.vehicles) if (o !== v) check(o.x, o.z, 1.7 + o.t.W / 2);
    for (const p of world.crowd.peds) if (p.visible && p.state !== 'seat') check(p.x, p.z, 1.3);
    if (!G.player.car) check(G.player.ped.x, G.player.ped.z, 1.4);
    if (G.works && G.works.stops) for (const b of G.works.stops) check(b.x, b.z, 7);
  }
  if (block < 99) target = Math.min(target, Math.max(0, (block - v.t.L / 2 - 2.5) * 0.9));
  const dv = target - sp;
  if (dv > 0) { inp.throttle = clamp(dv * 0.35, 0, 0.85); inp.brake = 0; }
  else { inp.throttle = 0; inp.brake = clamp(-dv * 0.4, 0, 1); }
  if (target < 0.3 && sp < 0.5) { inp.brake = 1; inp.throttle = 0; }
  // atascado
  if (Math.abs(sp) < 0.4) ai.stuck += dt; else ai.stuck = 0;
  if (ai.stuck > 5 && block < 99) { ai.ignore = 2.5; }
  if (ai.stuck > 14) { ai.respawn = true; }
  if (block < 7 && sp < 1 && G.sfx && R() < dt * 0.15) G.sfx.horn(v, 0.4);
}
function aiChase(v, dt, world) {
  const ai = v.ai, inp = v.inp, pl = G.player, tgt = pl.car || pl.ped;
  const tx0 = tgt.x, tz0 = tgt.z, d = Math.hypot(tx0 - v.x, tz0 - v.z);
  ai.repath = (ai.repath || 0) - dt;
  let tx = tx0, tz = tz0;
  const sight = d < 45 && segBlocked(v.x, v.z, v.y + 1, tx0, tz0, (tgt.y || 0) + 1) >= 1;
  if (!sight) {
    if (ai.repath <= 0 || !ai.path) { ai.repath = 1.5; const a = nearestNode(v.x, v.z, n => n.edges.some(e => e.road.type === 'car')), b = nearestNode(tx0, tz0, n => n.edges.some(e => e.road.type === 'car')); ai.path = pathTo(a, b) || [b]; ai.pi = 0; }
    while (ai.pi < ai.path.length - 1 && Math.hypot(ai.path[ai.pi].x - v.x, ai.path[ai.pi].z - v.z) < 9) ai.pi++;
    const n = ai.path[Math.min(ai.pi, ai.path.length - 1)]; tx = n.x; tz = n.z;
  } else if (pl.car) { tx += pl.car.vx * 0.5; tz += pl.car.vz * 0.5; }
  const want = Math.atan2(tx - v.x, tz - v.z), err = angDiff(v.yaw, want), sp = v.fwdSpeed;
  inp.steer = clamp(-err * 2.6, -1, 1);
  let target = d < 10 && !pl.car ? 0 : 26 * Math.max(0.3, Math.cos(clamp(err, -1.4, 1.4)));
  if (Math.abs(err) > 2.2 && sp < 4) { inp.throttle = -0.7; inp.steer = -inp.steer; inp.brake = 0; }
  else { const dv = target - sp; inp.throttle = dv > 0 ? clamp(dv * 0.3, 0, 1) : 0; inp.brake = dv < 0 ? clamp(-dv * 0.2, 0, 1) : 0; }
  inp.hand = Math.abs(err) > 1.0 && sp > 12 ? 1 : 0;
  if (Math.abs(sp) < 0.5 && Math.abs(err) < 2.2 && d > 8) ai.stuck += dt; else ai.stuck = 0;
  if (ai.stuck > 2.5) { inp.throttle = -0.8; inp.steer = -inp.steer; if (ai.stuck > 4) ai.stuck = 0; }
  v.sirenOn = true;
}

/* ==========================================================
   Tren rexional (chega, para no andén 1 e marcha)
   ========================================================== */
class Train {
  constructor(scene) {
    this.g = new THREE.Group(); scene.add(this.g);
    const body = new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, metalness: 0.4, roughness: 0.35, clearcoat: 0.6 });
    const stripe = new THREE.MeshStandardMaterial({ color: 0x7a1f3d, roughness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.3, metalness: 0.5 });
    const glass = VMAT.glass;
    this.cars = 3; this.carL = 24; this.len = this.cars * this.carL + 2;
    for (let i = 0; i < this.cars; i++) {
      const cz = (i - 1) * (this.carL + 1);
      const c = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.0, this.carL), body); c.position.set(0, 2.35, cz); c.castShadow = true; this.g.add(c);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, this.carL, 16, 1, false, -Math.PI / 2, Math.PI), body); roof.rotation.x = Math.PI / 2; roof.scale.set(1, 1, 0.25); roof.position.set(0, 3.85, cz); this.g.add(roof);
      for (const s of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.PlaneGeometry(this.carL - 0.4, 0.28), stripe); st.position.set(s * 1.46, 1.35, cz); st.rotation.y = s * Math.PI / 2; this.g.add(st);
        const win = new THREE.Mesh(new THREE.PlaneGeometry(this.carL - 3, 0.9), glass); win.position.set(s * 1.46, 2.6, cz); win.rotation.y = s * Math.PI / 2; this.g.add(win);
        for (const dz of [-this.carL / 2 + 2.5, this.carL / 2 - 2.5]) { const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.2), dark); door.position.set(s * 1.465, 2.0, cz + dz); door.rotation.y = s * Math.PI / 2; this.g.add(door); }
      }
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, this.carL - 2), dark); skirt.position.set(0, 0.65, cz); this.g.add(skirt);
      for (const bz of [-this.carL / 2 + 3, this.carL / 2 - 3]) for (const s of [-1, 1]) for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 14), dark); w.rotation.z = Math.PI / 2; w.position.set(s * 0.834, 0.75, cz + bz + k * 1.1); this.g.add(w); }
    }
    // cabinas aerodinámicas
    for (const s of [-1, 1]) {
      const nose = new THREE.Mesh(new THREE.SphereGeometry(1.45, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), body); nose.rotation.x = s * Math.PI / 2; nose.scale.set(1, 1.6, 1.05); nose.position.set(0, 2.35, s * (this.len / 2 - 1)); this.g.add(nose);
      const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), glass); ws.position.set(0, 3.0, s * (this.len / 2 + 0.6)); ws.rotation.y = s > 0 ? 0 : Math.PI; ws.rotation.x = -0.4 * 1; this.g.add(ws);
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.18), VMAT.head); hl.position.set(0, 1.6, s * (this.len / 2 + 0.75)); hl.rotation.y = s > 0 ? 0 : Math.PI; this.g.add(hl);
    }
    // percorrido real da liña (OSM) e parada na vía 1 da estación
    const P = TRAIN_PATH, cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    this.P = P; this.cum = cum; this.L = cum[cum.length - 1];
    const st = G.stationStop || { x: P[0][0], z: P[0][1] }; let bs = 0, bd = 1e9;
    for (let s = 0; s < this.L; s += 1) { const q = this.at(s), d = Math.hypot(q.x - st.x, q.z - st.z); if (d < bd) { bd = d; bs = s; } }
    this.stopS = bs; this.s = bs - 900; this.v = 0; this.state = 'away'; this.timer = 25; this.dir = 1; this.place();
    this.nextDeparture = null;
  }
  at(s) { const P = this.P, C = this.cum; s = clamp(s, 0, this.L); let k = 1; while (k < P.length - 1 && C[k] < s) k++; const a = P[k - 1], b = P[k], L = (C[k] - C[k - 1]) || 1, t = (s - C[k - 1]) / L; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L }; }
  place() {
    const q = this.at(this.s), q0 = this.at(this.s - this.len / 2), q1 = this.at(this.s + this.len / 2);
    let ux = q1.x - q0.x, uz = q1.z - q0.z; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
    this.x = q.x; this.z = q.z; this.yaw = Math.atan2(ux, uz) + (this.dir > 0 ? 0 : Math.PI);
    this.g.position.set(q.x, Math.max(0, terrainH(q.x, q.z)) + 0.38, q.z); this.g.rotation.y = this.yaw;
    G.trainBox = Math.abs(this.s - this.stopS) < 650 ? { x: q.x, z: q.z, ux, uz, half: this.len / 2 + 1, hw: 1.5 } : null;
  }
  update(dt) {
    const S0 = this.stopS;
    switch (this.state) {
      case 'away': this.timer -= dt; if (this.timer <= 0) { this.dir = R() < 0.5 ? 1 : -1; this.s = S0 - this.dir * 700; this.v = 24; this.state = 'arriving'; if (G.sfx) G.sfx.trainHorn(this); } break;
      case 'arriving': {
        const dist = (S0 - this.s) * this.dir; const vT = Math.sqrt(Math.max(0, 2 * (this.decel || 0.55) * dist));
        this.v = Math.min(this.v, vT); if (dist < 0.3) { this.v = 0; this.decel = 0; this.state = 'stopped'; this.timer = this.holdTime || 30; this.holdTime = 0; }
        break;
      }
      case 'stopped': this.timer -= dt; if (this.timer <= 0) { this.state = 'departing'; if (G.sfx) G.sfx.trainHorn(this); if (G.onTrainDepart) G.onTrainDepart(); } break;
      case 'departing': this.v = Math.min(30, this.v + 0.7 * dt); if (Math.abs(this.s - S0) > 720) { this.state = 'away'; this.timer = RR(40, 70); } break;
    }
    this.s += this.v * this.dir * dt;
    this.place();
    return this.v;
  }
}

/* ---------- moto (mecánica de coche cun só eixe, inclínase nas curvas) ---------- */
function buildMoto(v, color, scene) {
  const t = v.t, body = v.body, paint = paintMat(color), dark = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.5, metalness: 0.5 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.2, metalness: 1 });
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; body.add(m); return m; };
  add(new THREE.SphereGeometry(0.26, 16, 10), paint, 0, 0.92, 0.18).scale.set(0.9, 0.62, 1.35);        // depósito
  add(new THREE.BoxGeometry(0.3, 0.12, 0.7), dark, 0, 0.88, -0.42);                                       // asento
  add(new THREE.BoxGeometry(0.34, 0.26, 0.5), paint, 0, 0.72, -0.62).rotation.x = 0.2;                     // colín
  add(new THREE.BoxGeometry(0.28, 0.3, 0.42), dark, 0, 0.5, 0.02);                                        // motor
  add(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 8), dark, 0, 0.68, 0.0, Math.PI / 2 - 0.25);          // bastidor
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8), chrome, 0, 0.6, 0.62, -0.4);                     // forquita
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), dark, 0, 1.06, 0.48, 0, 0, Math.PI / 2);            // guiador
  add(new THREE.CylinderGeometry(0.05, 0.035, 0.75, 10), chrome, 0.16, 0.36, -0.42, Math.PI / 2 + 0.12); // escape
  v.headM = add(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), VMAT.head, 0, 0.98, 0.66, Math.PI / 2);
  v.tailM = add(new THREE.BoxGeometry(0.14, 0.06, 0.04), VMAT.tail, 0, 0.82, -0.88);
  add(new THREE.BoxGeometry(0.18, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0xf4f4f0 }), 0, 0.68, -0.9);
  const tire = colorize(new THREE.TorusGeometry(t.wr - 0.06, 0.065, 8, 22), '#121212'); tire.rotateY(Math.PI / 2);
  const rim = colorize(new THREE.CylinderGeometry(t.wr - 0.1, t.wr - 0.1, 0.05, 18), '#b9bec4'); rim.rotateZ(Math.PI / 2);
  const wheelG = mergeGeos([tire, rim]);
  v.wheels = [];
  for (const sz of [1, -1]) { const piv = new THREE.Group(); piv.position.set(0, t.wr, sz * t.wb / 2); const wm = new THREE.Mesh(wheelG, VMAT.wheel); wm.castShadow = true; piv.add(wm); v.root.add(piv); v.wheels.push({ piv, wm, front: sz > 0, side: -1 }); }
}
