'use strict';
/* ==========================================================
   LEMOS 27400 · viaxe rápida co Yepes en patinete
   ========================================================== */
const FT_DESTS = [
  { n: 'Praza da Compañía', d: 'Colexio dos Escolapios', x: 35, z: 100, yaw: 0 },
  { n: 'Castelo de San Vicente', d: 'Torre da Homenaxe e Mosteiro', get x() { return G.castleGate.x; }, get z() { return G.castleGate.z; }, yaw: Math.PI },
  { n: 'Ponte Vella', d: 'Santa Clara e Praza Dr. Goyanes', x: -66, z: 12, yaw: Math.PI / 2 },
  { n: 'Rúa do Cardeal', d: 'Bares e terrazas', x: 12, z: 22, yaw: 0 },
  { n: 'Paseo do Malecón', d: 'Feira do Viño e manifestación', x: -64, z: 22, yaw: 0 },
  { n: 'Parque dos Condes', d: 'A gran fonte e o embarcadoiro', x: -25, z: 246, yaw: Math.PI },
  { n: 'Campo da Pinguela', d: 'Campo de fútbol', x: -195, z: 252, yaw: 0 },
  { n: 'Estación de Monforte', d: 'Andéns e Museo do Ferrocarril', x: 196, z: -236, yaw: Math.PI / 2 },
];
G.cine = null;
let YEPES = null;
function initYepes() {
  const C = world.crowd, p = C.peds.find(q => q.state === 'walk' && !q.npc && q !== G.player.ped);
  if (!p) return;
  Object.assign(p, { state: 'npc', home: 'npc', npc: 'yepes', manual: true, immune: true, visible: false, sit: 0, lie: 0, walk: 0, run: 0, edge: null });
  Object.assign(p.col, { shirt: '#5f646b', pants: '#17181b', hair: '#d4202b', skin: '#e3b48f', shoe: '#f2f2f2', sleeve: false }); C.paint(p);
  const veh = makeScooter('#e2452a'); veh.visible = false; G.scene.add(veh);
  const tag = nameSprite('El Yepes', '#ff8a5c'); tag.visible = false; G.scene.add(tag);
  YEPES = { p, veh, tag };
}
/* ---------- interface ---------- */
function openTravel() {
  const box = $('travelList'); box.innerHTML = '';
  const me = G.player.car || G.player.ped;
  FT_DESTS.forEach((d, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-dest';
    const dist = Math.hypot(d.x - me.x, d.z - me.z);
    b.innerHTML = `<span class="ft-n">${d.n}</span><span class="ft-d">${d.d}</span><span class="ft-m">${Math.round(dist / 0.65)} m</span>`;
    b.onclick = () => chooseTravel(i);
    box.appendChild(b);
  });
  $('travel').hidden = false;
}
function quickTravel() { if (G.cine || G.dialog) return; if (document.exitPointerLock) document.exitPointerLock(); if (!G.mapOpen) toggleMap(true); openTravel(); }
function closeTravel() { $('travel').hidden = true; }
function chooseTravel(i) {
  const d = FT_DESTS[i], pl = G.player;
  if (pl.wanted > 0) { toast('O Yepes non vén se te busca a policía'); return; }
  if (G.dialog) return;
  if (pl.car) { if (pl.car.speed > 3) { toast('Para o vehículo primeiro'); return; } toggleCar(); }
  closeTravel(); toggleMap(false);
  startYepes(d);
}
/* ---------- cinemática ---------- */
function startYepes(dest) {
  if (!YEPES) { teleportTo(dest); return; }
  const me = G.player.ped, Y = YEPES;
  // chega dende o lado da cámara, para ao carón do xogador
  let ax = camera.position.x - me.x, az = camera.position.z - me.z, al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
  const sx = -az, sz = ax; // lateral
  const stop = { x: me.x + sx * 1.1, z: me.z + sz * 1.1 };
  const start = { x: stop.x + ax * 22 + sx * 4, z: stop.z + az * 22 + sz * 4 };
  const yaw = Math.atan2(stop.x - start.x, stop.z - start.z);
  Y.p.visible = true; Y.veh.visible = true; Y.tag.visible = true;
  G.cine = { t: 0, phase: 'arrive', dest, start, stop, yaw, pos: { ...start }, speed: 8, camFrom: camera.position.clone(), look: new THREE.Vector3(me.x, me.y + 1.2, me.z) };
  $('hud').classList.add('cine');
  if (G.sfx.bell) G.sfx.bell(start);
}
function teleportTo(d) {
  const p = G.player.ped;
  p.x = d.x; p.z = d.z; p.y = groundH(d.x, d.z); p.yaw = d.yaw || 0; p.visible = true; p.sit = 0; p.armUp = 0; p.speed = 0;
  camYaw = (d.yaw || 0) + Math.PI; camPitch = 0.22; camIdle = 0; camera._init = 0;
  setWaypoint(null);
}
function placeYepes(x, z, yaw, rider) {
  const Y = YEPES, y = groundH(x, z);
  Y.veh.position.set(x, y, z); Y.veh.rotation.set(0, yaw, 0);
  for (const w of Y.veh.userData.wheels) w.rotation.x += (G.cine ? G.cine.speed : 0) * 0.016 / 0.11;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  Y.p.x = x + fx * 0.1; Y.p.z = z + fz * 0.1; Y.p.y = y + 0.16; Y.p.yaw = yaw; Y.p.sit = 0.12; Y.p.walk = 0; Y.p.armUp = 0.6;
  Y.tag.position.set(Y.p.x, Y.p.y + 2.3, Y.p.z);
  if (rider) { const me = G.player.ped; me.x = x - fx * 0.42; me.z = z - fz * 0.42; me.y = y + 0.16; me.yaw = yaw; me.sit = 0.1; me.walk = 0; me.run = 0; me.armUp = 0.25; }
}
function updateCine(dt) {
  const C = G.cine; if (!C) return false;
  C.t += dt;
  const me = G.player.ped;
  if (C.phase === 'arrive') {
    const dx = C.stop.x - C.pos.x, dz = C.stop.z - C.pos.z, d = Math.hypot(dx, dz);
    C.speed = Math.max(1.2, Math.min(9, d * 0.9));
    if (d < 0.15) { C.phase = 'hop'; C.t = 0; toast('El Yepes: «Sube atrás, chorbo! Agárrate ben»', 2.6); }
    else { C.pos.x += dx / d * C.speed * dt; C.pos.z += dz / d * C.speed * dt; }
    placeYepes(C.pos.x, C.pos.z, C.yaw, false);
    me.yaw += angDiff(me.yaw, Math.atan2(C.pos.x - me.x, C.pos.z - me.z)) * Math.min(1, dt * 5);
  } else if (C.phase === 'hop') {
    C.speed = 0;
    const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), tx = C.stop.x - fx * 0.42, tz = C.stop.z - fz * 0.42, k = Math.min(1, C.t / 0.9);
    if (C.t < 0.05) C.hop0 = { x: me.x, z: me.z, y: me.y };
    me.x = lerp(C.hop0.x, tx, k); me.z = lerp(C.hop0.z, tz, k); me.y = C.hop0.y + Math.sin(k * Math.PI) * 0.45 + k * 0.16; me.yaw += angDiff(me.yaw, C.yaw) * Math.min(1, dt * 8);
    me.walk = k < 1 ? 1 : 0; me.phase += dt * 6;
    placeYepes(C.stop.x, C.stop.z, C.yaw, false);
    if (C.t > 1.1) { C.phase = 'leave'; C.t = 0; C.pos = { ...C.stop }; if (G.sfx.bell) G.sfx.bell(C.stop); }
  } else if (C.phase === 'leave') {
    C.speed = Math.min(11, C.speed + dt * 6);
    C.pos.x += Math.sin(C.yaw) * C.speed * dt; C.pos.z += Math.cos(C.yaw) * C.speed * dt;
    placeYepes(C.pos.x, C.pos.z, C.yaw, true);
    if (C.t > 1.3 && !C.faded) { C.faded = true; $('fade').classList.add('on'); }
    if (C.t > 2.1) { C.phase = 'black'; C.t = 0; teleportTo(C.dest); YEPES.p.visible = false; YEPES.veh.visible = false; YEPES.tag.visible = false; }
  } else if (C.phase === 'black') {
    if (C.t > 0.5 && !C.unfaded) { C.unfaded = true; $('fade').classList.remove('on'); bigMsg(C.dest.n.toUpperCase(), 'Viaxe rápida co Yepes'); }
    if (C.t > 0.9) { G.cine = null; $('hud').classList.remove('cine'); }
  }
  return true;
}
function cineCamera(dt) {
  const C = G.cine, me = G.player.ped;
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), sx = Math.cos(C.yaw), sz = -Math.sin(C.yaw);
  const focus = C.phase === 'arrive' ? { x: (me.x + C.pos.x) / 2, z: (me.z + C.pos.z) / 2 } : C.pos || C.stop;
  const tgt = new THREE.Vector3(focus.x + sx * 6.5 - fx * 2.5, groundH(focus.x, focus.z) + 2.4, focus.z + sz * 6.5 - fz * 2.5);
  const t = segBlocked(focus.x, focus.z, 1.5, tgt.x, tgt.z, tgt.y);
  if (t < 1) { tgt.x = lerp(focus.x, tgt.x, t * 0.9); tgt.z = lerp(focus.z, tgt.z, t * 0.9); }
  camera.position.lerp(tgt, 1 - Math.pow(0.02, dt));
  C.look.lerp(new THREE.Vector3(focus.x, groundH(focus.x, focus.z) + 1.2, focus.z), 1 - Math.pow(0.01, dt));
  camera.lookAt(C.look);
  camera.fov = lerp(camera.fov, 55, dt * 2); camera.updateProjectionMatrix();
}
