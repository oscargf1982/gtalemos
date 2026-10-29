'use strict';
/* ==========================================================
   LEMOS 27400 · bicis e patinetes a toda velocidade polo Cardeal
   ========================================================== */
const RIDERS = [];
/* traxecto: Ponte Vella (oeste→leste) e logo Rúa do Cardeal (norte→sur) */
const RIDE_PATH = [[-104, 10], [-40, 10], [5, 10], [12, 17], [12, 46], [12, 75]];
const RIDE_LEN = (() => { let L = 0; for (let i = 1; i < RIDE_PATH.length; i++) L += Math.hypot(RIDE_PATH[i][0] - RIDE_PATH[i - 1][0], RIDE_PATH[i][1] - RIDE_PATH[i - 1][1]); return L; })();
function ridePoint(s) {
  s = clamp(s, 0, RIDE_LEN);
  for (let i = 1; i < RIDE_PATH.length; i++) {
    const a = RIDE_PATH[i - 1], b = RIDE_PATH[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= L || i === RIDE_PATH.length - 1) { const t = clamp(s / L, 0, 1), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L; return { x: lerp(a[0], b[0], t), z: lerp(a[1], b[1], t), tx, tz }; }
    s -= L;
  }
}
function makeScooter(col) {
  const g = new THREE.Group(), body = new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.35, metalness: 0.4 }), dark = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.82), body); deck.position.set(0, 0.13, 0); g.add(deck);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), body); stem.position.set(0, 0.62, 0.4); stem.rotation.x = -0.12; g.add(stem);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 8), dark); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.11, 0.46); g.add(bar);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), new THREE.MeshBasicMaterial({ color: 0xeef4ff })); lamp.rotation.x = Math.PI / 2; lamp.position.set(0, 0.95, 0.46); g.add(lamp);
  const wheels = [];
  for (const z of [-0.38, 0.42]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.03, 8, 16), dark); w.rotation.y = Math.PI / 2; w.position.set(0, 0.11, z); g.add(w); wheels.push(w); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData.wheels = wheels; return g;
}
function spawnRiders() {
  const C = world.crowd, free = C.peds.filter(q => q.state === 'walk' && !q.npc && q !== G.player.ped);
  const kinds = ['bike', 'scooter', 'bike', 'scooter', 'scooter'];
  const n = Math.min(kinds.length, Math.max(2, free.length - 6));
  for (let i = 0; i < n; i++) {
    const p = free[i], kind = kinds[i];
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'rider', manual: true, immune: true, visible: true, sit: 0, lie: 0, armUp: 0, edge: null });
    const veh = kind === 'bike' ? makeBike() : makeScooter(pick(['#1aa6d8', '#f2f2f0', '#e2452a', '#1f1f22', '#3dbb6a']));
    if (kind === 'bike') veh.scale.setScalar(1.0);
    G.scene.add(veh);
    const r = { p, kind, veh, s: RR(0, RIDE_LEN), dir: R() < 0.5 ? 1 : -1, speed: kind === 'bike' ? RR(8, 10.5) : RR(9, 12), lane: RR(-1.6, 1.6), ph: R() * 6, wait: 0, bellT: 0, cur: 0 };
    RIDERS.push(r);
  }
}
function updateRiders(dt) {
  if (!RIDERS.length) return;
  const me = G.player.ped, onFoot = !G.player.car;
  for (const r of RIDERS) {
    const p = r.p;
    if (r.wait > 0) { r.wait -= dt; r.cur = lerp(r.cur, 0, Math.min(1, dt * 4)); }
    else {
      r.cur = lerp(r.cur, r.speed, Math.min(1, dt * 1.5));
      r.s += r.dir * r.cur * dt;
      if (r.s >= RIDE_LEN) { r.s = RIDE_LEN; r.dir = -1; r.wait = RR(0.5, 3); r.lane = RR(-1.6, 1.6); }
      if (r.s <= 0) { r.s = 0; r.dir = 1; r.wait = RR(0.5, 3); r.lane = RR(-1.6, 1.6); }
    }
    const P = ridePoint(r.s), tx = P.tx * r.dir, tz = P.tz * r.dir, nx = -tz, nz = tx;
    // fan eses entre a xente; esquivan un pouco ao xogador, pero non sempre a tempo
    let weave = Math.sin(G.t * 0.9 + r.ph) * 0.9;
    if (onFoot) { const dx = me.x - P.x, dz = me.z - P.z, ahead = dx * tx + dz * tz, lat = dx * nx + dz * nz; if (ahead > 0 && ahead < 6 && Math.abs(lat - r.lane) < 1.4) weave -= Math.sign(lat - r.lane || 1) * 0.35; }
    const off = clamp(r.lane + weave, -2.6, 2.6);
    const x = P.x + nx * off, z = P.z + nz * off, y = groundH(x, z), yaw = Math.atan2(tx, tz);
    r.veh.position.set(x, y, z); r.veh.rotation.set(0, yaw, -weave * 0.08 * (r.cur / 10));
    for (const w of r.veh.userData.wheels) w.rotation.x += dt * r.cur / (r.kind === 'bike' ? 0.34 : 0.11);
    if (r.kind === 'bike') { p.x = x - tx * 0.16; p.z = z - tz * 0.16; p.y = y + 0.3; p.sit = 0.72; p.walk = r.cur > 0.5 ? 1 : 0.15; p.phase += dt * r.cur * 2.2; p.armUp = 0.45; }
    else { p.x = x - tx * 0.05; p.z = z - tz * 0.05; p.y = y + 0.16; p.sit = 0.12; p.walk = 0; p.armUp = 0.6; p.phase = 0; }
    p.yaw = yaw; p.look = 0; p.nod = 0;
    // timbre ao achegarse
    r.bellT -= dt;
    if (onFoot && r.cur > 3) {
      const dx = me.x - x, dz = me.z - z, d = Math.hypot(dx, dz), ahead = dx * tx + dz * tz;
      if (d < 12 && ahead > 0 && r.bellT <= 0) { r.bellT = 3; if (G.sfx.bell) G.sfx.bell({ x, z }); }
      // atropelo: se o xogador non o esquiva nin salta
      const airborne = me.y > groundH(me.x, me.z) + 0.45;
      if (d < 0.85 && !airborne && !G.dialog && (!G._riderHit || G.t - G._riderHit > 1.5)) {
        G._riderHit = G.t; G.shake = 0.7;
        me.x += tx * 1.6 + Math.sign(dx * nx + dz * nz || 1) * nx * 0.8; me.z += tz * 1.6 + Math.sign(dx * nx + dz * nz || 1) * nz * 0.8;
        me.speed = 0;
        toast(pick([r.kind === 'bike' ? '¡Ei! Unha bici a toda pastilla!' : '¡Ei! Un patinete a todo gas!', '¡Mira por onde vas!', 'Ai! Pasoume por riba!']), 2);
        if (G.sfx.thud) G.sfx.thud(0.6, me);
        if (G.player.money > 0) { const loss = Math.min(G.player.money, 10); G.player.money -= loss; save.money = G.player.money; persist(); }
      }
    }
    // os peóns apártanse ao seu paso
    for (const q of world.crowd.peds) {
      if (q === p || q.npc || q === me || q.state === 'seat' || q.state === 'flee' || q.state === 'down') continue;
      if (Math.abs(q.x - x) > 3 || Math.abs(q.z - z) > 3) continue;
      const dx = q.x - x, dz = q.z - z; if (dx * tx + dz * tz > 0 && Math.hypot(dx, dz) < 2.2) { startFlee(q, x, z, 1.2); q.prevState = q.home || 'walk'; }
    }
  }
}
