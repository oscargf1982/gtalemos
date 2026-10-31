'use strict';
/* ==========================================================
   LEMOS 27400 · viaxe rápida co Yepes en patinete
   ========================================================== */
const FT_DESTS = []; // enchida por initPlaces() co plano real
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
  if (C.intro) return updateIntro(dt);
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
  if (C.intro) return introCamera(dt);
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

/* ==========================================================
   Chegada en tren á estación (cinemática de inicio, saltable)
   ========================================================== */
function startArrivalIntro() {
  const tr = world.train, me = G.player.ped;
  tr.state = 'arriving'; tr.dir = 1; tr.s = tr.stopS - 330; tr.v = 24; tr.decel = 1.7; tr.holdTime = 22; tr.place();
  me.visible = false;
  G.cine = { intro: true, t: 0, phase: 'train', look: new THREE.Vector3(tr.x, 3, tr.z) };
  $('hud').classList.add('cine'); $('skipIntro').hidden = false;
  if (G.sfx.trainHorn) G.sfx.trainHorn(tr);
  bigMsg('MONFORTE DE LEMOS', 'Rexional procedente de Ourense · vía 1');
}
function endIntro() {
  const me = G.player.ped, p = G.startPos;
  me.x = p.x; me.z = p.z; me.y = groundH(p.x, p.z); me.yaw = p.yaw; me.visible = true;
  camYaw = p.yaw + Math.PI; camPitch = 0.22; camIdle = 0; camera._init = 0;
  G.cine = null; $('hud').classList.remove('cine'); $('skipIntro').hidden = true; $('fade').classList.remove('on');
  setTimeout(() => toast('Benvido a Monforte! Pacho espérate na Praza da Compañía: está marcado no GPS.', 5.5), 400);
  setTimeout(() => toast(isTouch ? 'A túa berlina clásica granate está aparcada aí diante, na Praza da Estación (⇅ para subir)' : 'A túa berlina clásica granate está aparcada aí diante, na Praza da Estación (F para subir)', 5), 6200);
  setTimeout(() => { if (G._worksIntro) toast(G._worksIntro, 5); }, 11800);
  const pa = NPCS.find(n => n.id === 'pacho'); if (pa && G.quest.state === 'none') setWaypoint(pa.p.x, pa.p.z);
}
function skipIntro() {
  const C = G.cine; if (!C || !C.intro) return;
  const tr = world.train; if (tr.state === 'arriving') { tr.s = tr.stopS; tr.v = 0; tr.state = 'stopped'; tr.timer = 15; tr.decel = 0; tr.place(); }
  endIntro();
}
function updateIntro(dt) {
  const C = G.cine, tr = world.train; C.t += dt;
  if (C.phase === 'train' && tr.state === 'stopped') { C.phase = 'doors'; C.t = 0; }
  else if (C.phase === 'doors') {
    if (C.t > 1.6 && !C.faded) { C.faded = true; $('fade').classList.add('on'); }
    if (C.t > 2.4) { C.phase = 'out'; C.t = 0; const me = G.player.ped, p = G.startPos; me.x = p.x; me.z = p.z; me.y = groundH(p.x, p.z); me.yaw = p.yaw; me.visible = true; $('fade').classList.remove('on'); }
  } else if (C.phase === 'out') {
    // o xogador sae da estación cara á praza
    const me = G.player.ped; me.x += Math.sin(me.yaw) * 1.2 * dt; me.z += Math.cos(me.yaw) * 1.2 * dt; me.y = groundH(me.x, me.z); me.walk = 1; me.phase += dt * 5;
    if (C.t > 2.6) { me.walk = 0; G.startPos = { x: me.x, z: me.z, yaw: me.yaw }; endIntro(); }
  }
  if (C.t > 40) skipIntro();
  return true;
}
function introCamera(dt) {
  const C = G.cine, tr = world.train, F = LM.station;
  let tgt, look;
  if (C.phase === 'train' || C.phase === 'doors') {
    // cámara fixa no andén 1, do lado polo que entra o tren
    if (C.sgn === undefined) { const a = tr.at(tr.stopS - 80); C.sgn = F.inv(a.x, a.z)[1] < 0 ? -1 : 1; }
    const [cx, cz] = F.pt(339.5, C.sgn * 32);
    tgt = new THREE.Vector3(cx, 2.6, cz);
    look = new THREE.Vector3(tr.x, 2.2, tr.z);
  } else {
    const me = G.player.ped;
    tgt = new THREE.Vector3(me.x + Math.sin(me.yaw) * 7 + Math.cos(me.yaw) * 2, me.y + 2.2, me.z + Math.cos(me.yaw) * 7 - Math.sin(me.yaw) * 2);
    look = new THREE.Vector3(me.x, me.y + 1.4, me.z);
  }
  if (!C.camInit || C.phase !== C.lastPhase) { camera.position.copy(tgt); C.look.copy(look); C.camInit = true; C.lastPhase = C.phase; }
  camera.position.lerp(tgt, 1 - Math.pow(0.05, dt)); C.look.lerp(look, 1 - Math.pow(0.02, dt));
  camera.lookAt(C.look); camera.fov = lerp(camera.fov, 50, dt * 2); camera.updateProjectionMatrix();
}
