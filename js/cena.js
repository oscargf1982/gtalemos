'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Cinemática da cea UCL DENTRO do Restaurante
   Pulpería UCELERS: madeira en diagonal co gran círculo granate
   iluminado, parede verde petróleo, plantas colgantes, mesas
   negras con camiño granate e cadeiras de madeira clara.
   A cea, os chistes de ovellas, a desbandada, a conta, a rabecha
   de Avelino no chan... e de volta á rúa con mentalidade gañadora.
   ========================================================== */
const CENA = { x: 1160, z: 1160 };
// chan dos decorados interiores: por riba de todo o terreo da contorna, para que o monte non asome polas paredes
function cineFloor(x, z, r) { let m = -1e9; for (let i = -r; i <= r; i += 1.5) for (let j = -r; j <= r; j += 1.5) m = Math.max(m, terrainH(x + i, z + j)); return m + 0.3; }

function cenaTex() {
  const T = {};
  // chan de baldosa gris clara
  { const c = cnv(512, 512), x = c.getContext('2d'); x.fillStyle = '#c9c7c2'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { const v = RR(-10, 10); x.fillStyle = `rgb(${200 + v},${198 + v},${193 + v})`; x.fillRect(i * 128 + (j % 2) * 64 + 1, j * 64 + 1, 126, 62); }
    for (let k = 0; k < 2500; k++) { x.fillStyle = `rgba(0,0,0,${RR(0.01, 0.05)})`; x.fillRect(R() * 512, R() * 512, 2, 2); }
    T.floor = toTex(c); T.floor.repeat.set(4, 3); }
  // parede do fondo: táboas en diagonal co gran círculo granate e luz LED
  { const c = cnv(1024, 256), x = c.getContext('2d'); x.fillStyle = '#d9c39e'; x.fillRect(0, 0, 1024, 256);
    x.save(); x.rotate(-0.5); for (let i = -40; i < 80; i++) { const v = RR(-14, 14); x.fillStyle = `rgb(${215 + v},${190 + v},${150 + v})`; x.fillRect(-400, i * 14, 2000, 13); x.fillStyle = 'rgba(120,90,50,.18)'; x.fillRect(-400, i * 14 + 13, 2000, 1); } x.restore();
    x.shadowColor = '#ffb0d0'; x.shadowBlur = 30; x.fillStyle = '#8a3a52'; x.beginPath(); x.arc(760, 210, 230, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
    x.strokeStyle = 'rgba(255,200,220,.9)'; x.lineWidth = 4; x.beginPath(); x.arc(760, 210, 230, Math.PI * 1.02, Math.PI * 1.98); x.stroke();
    x.fillStyle = '#8a3a52'; x.fillRect(760, 0, 264, 256);
    T.back = toTex(c, false);
    const e = cnv(1024, 256), ex = e.getContext('2d'); ex.fillStyle = '#000'; ex.fillRect(0, 0, 1024, 256); ex.strokeStyle = '#ff9ac0'; ex.lineWidth = 6; ex.shadowColor = '#ff9ac0'; ex.shadowBlur = 20; ex.beginPath(); ex.arc(760, 210, 232, Math.PI * 1.02, Math.PI * 1.98); ex.stroke(); T.backE = toTex(e, false); }
  // parede branca con plantas colgantes e apliques
  { const c = cnv(1024, 256), x = c.getContext('2d'); x.fillStyle = '#f2f1ee'; x.fillRect(0, 0, 1024, 256);
    for (let p = 0; p < 6; p++) { const px = 80 + p * 170; for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(${40 + RR(0, 30)},${80 + RR(0, 40)},${40 + RR(0, 20)},.9)`; x.beginPath(); x.ellipse(px + RR(-30, 30), RR(0, 90) * (k / 40) + 6, RR(5, 10), RR(3, 7), R(), 0, 7); x.fill(); } }
    for (const sx of [160, 500, 840]) { x.fillStyle = '#2a2a2c'; x.fillRect(sx - 8, 130, 16, 26); const g = x.createRadialGradient(sx, 120, 2, sx, 120, 70); g.addColorStop(0, 'rgba(255,220,160,.8)'); g.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = g; x.fillRect(sx - 70, 50, 140, 140); }
    T.white = toTex(c, false); }
  // parede verde petróleo coa porta branca
  { const c = cnv(1024, 256), x = c.getContext('2d'); x.fillStyle = '#2f4d55'; x.fillRect(0, 0, 1024, 256);
    x.fillStyle = '#f4f4f0'; x.fillRect(420, 40, 110, 216); x.fillStyle = '#9fc6d6'; x.fillRect(450, 70, 50, 40); x.fillStyle = '#c9c9c4'; x.fillRect(505, 150, 14, 6);
    x.fillStyle = '#f2c21b'; x.font = '700 22px Georgia, serif'; x.fillText('UCELERS', 700, 70);
    T.teal = toTex(c, false); }
  // camiño de mesa granate
  { const c = cnv(64, 256), x = c.getContext('2d'); x.fillStyle = '#9a3a55'; x.fillRect(0, 0, 64, 256); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, 64, 4); x.fillRect(0, 252, 64, 4); T.runner = toTex(c, false); }
  return T;
}
function buildCena() {
  if (G.cena) return G.cena;
  const T = cenaTex(), g = new THREE.Group(), y0 = cineFloor(CENA.x, CENA.z, 9), W = 14, D = 9, H = 3.2;
  g.position.set(CENA.x, y0, CENA.z); G.scene.add(g);
  const mk = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m; };
  mk(new THREE.BoxGeometry(W, 0.1, D), std({ map: T.floor, roughness: 0.6 }), 0, -0.05, 0);
  mk(new THREE.BoxGeometry(W, 0.1, D), std({ color: 0xf4f4f2 }), 0, H + 0.05, 0);
  const wall = (tex, w, x, z, ry, em) => mk(new THREE.PlaneGeometry(w, H), std(Object.assign({ map: tex, roughness: 0.85, side: THREE.DoubleSide }, em ? { emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 1 } : {})), x, H / 2, z, ry);
  wall(T.back, W, 0, -D / 2, 0, T.backE);        // fondo (norte)
  wall(T.white, W, 0, D / 2, Math.PI);            // fronte
  wall(T.teal, D, -W / 2, 0, Math.PI / 2);        // esquerda, coa porta
  wall(T.white, D, W / 2, 0, -Math.PI / 2);       // dereita
  // focos negros no teito
  for (let i = -5; i <= 5; i += 2.5) for (const z of [-2, 2]) mk(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), std({ color: 0x111111 }), i, H - 0.06, z);
  // mesas negras con camiño granate e cadeiras de madeira clara
  const blk = std({ color: 0x1d1d20, roughness: 0.5 }), wood = std({ color: 0xc89a62, roughness: 0.7 }), runner = std({ map: T.runner, roughness: 0.8 });
  const table = (x, z, w, d) => { mk(new THREE.BoxGeometry(w, 0.05, d), blk, x, 0.75, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) mk(new THREE.BoxGeometry(0.05, 0.75, 0.05), blk, x + sx * (w / 2 - 0.1), 0.37, z + sz * (d / 2 - 0.1)); mk(new THREE.BoxGeometry(w * 0.95, 0.01, 0.34), runner, x, 0.78, z); };
  const chair = (x, z, ry) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); const s = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), wood); s.position.y = 0.46; c.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.04), wood); b.position.set(0, 0.78, -0.21); b.rotation.x = -0.1; c.add(b); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 6), wood); l.position.set(sx * 0.18, 0.23, sz * 0.18); c.add(l); } };
  // mesa longa da cea UCL
  table(-0.8, 0, 1.6, 0.9); table(0.8, 0, 1.6, 0.9);
  const seats = [];
  for (const sx of [-1.1, 0, 1.1]) for (const sz of [-1, 1]) { const x = sx, z = sz * 0.82; chair(x, z, sz > 0 ? Math.PI : 0); seats.push({ x, z, yaw: sz > 0 ? Math.PI : 0 }); }
  // copas, botellas do peleón e pratos de polbo
  const glass = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 }), wine = std({ color: 0x5a0f1e, roughness: 0.2 }), btl = std({ color: 0x1f3a22, roughness: 0.2, metalness: 0.2 }), plate = std({ color: 0xf4f4f0 }), polbo = std({ color: 0xb8553a });
  for (const s of seats) { const px = s.x * 0.9, pz = s.z * 0.45; mk(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 14), plate, px, 0.79, pz); mk(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), glass, px + 0.2, 0.86, pz); mk(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), wine, px + 0.2, 0.83, pz); }
  for (const x of [-1.2, -0.3, 0.6, 1.4]) { mk(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 10), btl, x, 0.91, 0.05); mk(new THREE.CylinderGeometry(0.016, 0.02, 0.08, 6), btl, x, 1.08, 0.05); }
  for (const x of [-0.6, 0.7]) { mk(new THREE.CylinderGeometry(0.2, 0.18, 0.03, 16), std({ color: 0xc89a62 }), x, 0.79, -0.1); for (let k = 0; k < 8; k++) mk(new THREE.SphereGeometry(0.03, 6, 4), polbo, x + RR(-0.12, 0.12), 0.82, -0.1 + RR(-0.12, 0.12)); }
  // máis mesas baleiras ao redor
  for (const [x, z] of [[-4.5, -2.5], [-4.5, 2.6], [4.4, -2.5], [4.4, 2.6], [0, 3.3]]) { table(x, z, 0.9, 0.9); chair(x, z - 0.7, 0); chair(x, z + 0.7, Math.PI); }
  // barra preto da porta
  mk(new THREE.BoxGeometry(0.6, 1.1, 2.6), std({ color: 0x8a6a48, roughness: 0.6 }), -5.6, 0.55, -2.6);
  // luces cálidas (acesas só na cinemática)
  const L1 = new THREE.PointLight(0xffd9a8, 0, 14, 1.6); L1.position.set(-2, 2.8, 0); g.add(L1);
  const L2 = new THREE.PointLight(0xffc4d8, 0, 14, 1.6); L2.position.set(3, 2.8, -1); g.add(L2);
  G.cena = { g, y0, seats, lights: [L1, L2], door: { x: -6.6, z: 0.8 } };
  return G.cena;
}
const cenaW = (x, z) => [CENA.x + x, CENA.z + z];
function cenaBubble(o) { if (!o.speech) curritoSpeech(o); return o; }

/* ---------- arranque da cinemática ---------- */
const CENA_CHISTES = [
  ['Sabedes a da ovella que miraba o río?', 0], ['Si, home! Coa pata metida na bota do pastor!', 1], ['JAJAJAJA!', 2],
  ['E o pastor descalzo buscando a bota polo monte!', 3], ['JAJAJA! E a ovella: «méééé, que fresquiña baixa a auga!»', 4],
  ['Pola UCL! Outra botella de peleón!', -1], ['E a outra ovella con dúas botas! Unha en cada pata!', 0], ['JAJAJAJAJA! Paraaa, que me afogo!', 2],
  ['Camareiro! Máis peleón!', -1], ['O pastor aínda está buscando a bota! Dende 1987!', 3], ['JAJAJAJA!', 1],
];
function startCena() {
  const S = G.story; S.phase = 'dinner';
  $('fade').classList.add('on'); setWaypoint(null);
  setTimeout(() => {
    const C = buildCena(), me = G.player.ped;
    G.hour = 22.3; envTimer = 0; lastEnvHour = -99;
    C.lights.forEach(l => l.intensity = 1.6);
    // Avelino senta á mesa
    const sA = C.seats[2]; [me.x, me.z] = cenaW(sA.x, sA.z + (sA.yaw ? 0.15 : -0.15)); me.y = C.y0; me.yaw = sA.yaw; me.sit = 1; me.walk = 0; me.visible = true;
    // amigos da UCL e camareiro
    const cols = [['#2f5fb8', '#22324d'], ['#c8262e', '#1d1d20'], ['#f2c21b', '#3a3d42'], ['#2fa36b', '#22324d'], ['#7a1f8c', '#2a2a2c']];
    C.friends = [];
    [0, 1, 3, 4, 5].forEach((si, k) => {
      const p = takePed(); if (!p) return; const s = C.seats[si];
      Object.assign(p, { state: 'npc', home: 'npc', npc: 'cena', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 1, lie: 0, armUp: 0, edge: null });
      Object.assign(p.col, { shirt: cols[k][0], pants: cols[k][1], shoe: '#151515', sleeve: R() < 0.5 }); world.crowd.paint(p);
      [p.x, p.z] = cenaW(s.x, s.z + (s.yaw ? 0.15 : -0.15)); p.y = C.y0; p.yaw = s.yaw;
      C.friends.push(cenaBubble({ p, ph: R() * 6, gone: false }));
    });
    const w = takePed();
    if (w) { Object.assign(w, { state: 'npc', home: 'npc', npc: 'cena', manual: true, immune: true, visible: true, walk: 0, sit: 0, lie: 0, armUp: 0.6, edge: null });
      Object.assign(w.col, { shirt: '#f4f4f0', pants: '#151515', hair: '#1a120c', shoe: '#151515', sleeve: true }); world.crowd.paint(w);
      [w.x, w.z] = cenaW(-5.0, -1.4); w.y = C.y0; w.yaw = Math.PI / 2; C.waiter = cenaBubble({ p: w }); }
    C.av = cenaBubble({ p: me });
    G.cine = { dinner: true, t: 0, phase: 'party', joke: 0, jokeT: 1.2, look: new THREE.Vector3() };
    $('hud').classList.add('cine'); const sb = $('skipIntro'); sb.innerHTML = 'Saltar a cea <kbd>Espazo</kbd>'; sb.hidden = false;
    $('fade').classList.remove('on');
    bigMsg('CEA UCL', 'Restaurante Pulpería UCELERS · Rúa de Chantada, 48');
  }, 900);
}
function cenaSay(o, text, hold) { if (o && o.speech) curritoSay(o, text, hold || 2.4); }

/* ---------- actualización ---------- */
function updateDinner(dt) {
  const C = G.cena, K = G.cine; K.t += dt;
  const t = G.t, me = G.player.ped;
  const bubble = o => { if (!o || !o.speech) return; o.speech.position.set(o.p.x, o.p.y + 2.2, o.p.z); if (o.speechHold > 0) { o.speechHold -= dt; if (o.speechHold <= 0) o.speech.visible = false; } };
  // risas: cabezas, brazos e pequenos botes
  const laugh = (p, ph, k) => { p.nod = Math.max(0, Math.sin(t * 9 + ph)) * 0.3 * k - 0.05; p.armUp = k > 0.5 && Math.sin(t * 1.3 + ph) > 0.6 ? 1 : 0; p.wave = k > 0.7 && Math.sin(t * 0.9 + ph) > 0.85; };
  if (K.phase === 'party') {
    for (const f of C.friends) laugh(f.p, f.ph, 1); laugh(me, 2, 1);
    K.jokeT -= dt;
    if (K.jokeT <= 0 && K.joke < CENA_CHISTES.length) { const [txt, who] = CENA_CHISTES[K.joke++]; cenaSay(who < 0 ? C.av : C.friends[who % C.friends.length], txt, 2.3); K.jokeT = 1.9; if (G.sfx.coin && txt.startsWith('JA')) G.sfx.coin(); }
    // o camareiro trae máis botellas
    if (C.waiter) { const w = C.waiter.p, tx = CENA.x - 1.8 + Math.sin(t * 0.4) * 1.2, tz = CENA.z - 1.6; const dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz); if (d > 0.2) { w.x += dx / d * 1.2 * dt; w.z += dz / d * 1.2 * dt; w.walk = 0.6; w.phase += dt * 6; w.yaw = Math.atan2(dx, dz); } else w.walk = 0; }
    if (K.joke >= CENA_CHISTES.length && K.jokeT <= 0) { K.phase = 'leave'; K.t = 0; K.next = 0.3; cenaSay(C.friends[0], 'Bueno... eu xa marcho, que mañá madrugo!', 2); }
  } else if (K.phase === 'leave') {
    // marchan un a un cara á porta
    K.next -= dt;
    if (K.next <= 0) { const f = C.friends.find(q => !q.leaving); if (f) { f.leaving = true; f.p.sit = 0; cenaSay(f, pick(['Ata a próxima UCL!', 'Paga ti, Avelino, que eres o anfitrión!', 'Eu deixei algo... non, nada!', 'Que bonito, que bonito... chao!', 'Lévome a bota do pastor!']), 2); } K.next = 1.4; }
    for (const f of C.friends) {
      if (!f.leaving) { laugh(f.p, f.ph, 0.4); continue; } if (f.gone) continue;
      const [dx0, dz0] = cenaW(C.door.x, C.door.z), dx = dx0 - f.p.x, dz = dz0 - f.p.z, d = Math.hypot(dx, dz);
      f.p.y = C.y0; f.p.nod = 0; f.p.armUp = 0; f.p.wave = d < 2;
      if (d > 0.3) { f.p.x += dx / d * 1.6 * dt; f.p.z += dz / d * 1.6 * dt; f.p.walk = 1; f.p.phase += dt * 8; f.p.yaw = Math.atan2(dx, dz); } else { f.gone = true; f.p.visible = false; f.speech.visible = false; }
    }
    laugh(me, 2, 0.2);
    if (C.friends.every(f => f.gone)) { K.phase = 'bill'; K.t = 0; }
  } else if (K.phase === 'bill') {
    if (!K.billOpen) { K.billOpen = true; cenaBill(); }
    // o camareiro achégase á mesa
    if (C.waiter) { const w = C.waiter.p, [tx, tz] = cenaW(0.2, 1.55), dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz); if (d > 0.2) { w.x += dx / d * 1.4 * dt; w.z += dz / d * 1.4 * dt; w.walk = 0.7; w.phase += dt * 6; w.yaw = Math.atan2(dx, dz); } else { w.walk = 0; w.yaw = Math.atan2(me.x - w.x, me.z - w.z); } }
    // a rabecha: Avelino no chan, pataleando e berrando
    if (K.tantrum) {
      me.sit = 0; me.lie = 1; me.fallDir = 1; me.y = C.y0 + 0.05; me.walk = 1; me.phase += dt * 14;
      me.arms = [-2.6 + Math.sin(t * 16) * 0.9, 0.6, 0.2, -2.6 - Math.sin(t * 16) * 0.9, 0.6, 0.2];
      if (!K.flTo) { K.flTo = true; const [x, z] = cenaW(-0.4, 2.2); me.x = x; me.z = z; me.yaw = -Math.PI / 2; }
    } else if (K.angry) { me.sit = 0; me.lie = 0; me.y = C.y0; me.walk = 0; me.arms = [-2.8, 0.4, 0.3 + Math.abs(Math.sin(t * 10)) * 0.8, -2.8, 0.4, 0.3 + Math.abs(Math.sin(t * 10 + 1)) * 0.8]; me.nod = -0.3; }
  }
  for (const f of C.friends) bubble(f); bubble(C.waiter); bubble(C.av);
  return true;
}
function cenaCamera(dt) {
  const K = G.cine, C = G.cena, me = G.player.ped; let tgt, look;
  if (K.phase === 'party') { const a = K.t * 0.12 + 0.6, r = 3.6; tgt = new THREE.Vector3(CENA.x + Math.sin(a) * r, C.y0 + 2.1, CENA.z + Math.cos(a) * r); look = new THREE.Vector3(CENA.x, C.y0 + 1.0, CENA.z); }
  else if (K.phase === 'leave') { tgt = new THREE.Vector3(CENA.x + 4.2, C.y0 + 2.4, CENA.z + 3.0); look = new THREE.Vector3(CENA.x - 3, C.y0 + 1.0, CENA.z); }
  else { tgt = new THREE.Vector3(me.x + 2.6, C.y0 + 1.9, me.z + 2.4); look = new THREE.Vector3(me.x, C.y0 + 0.8, me.z); }
  if (!K.camInit || K.lastPh !== K.phase) { camera.position.copy(tgt); K.look.copy(look); K.camInit = true; K.lastPh = K.phase; }
  camera.position.lerp(tgt, 1 - Math.pow(0.05, dt)); K.look.lerp(look, 1 - Math.pow(0.02, dt));
  camera.lookAt(K.look); camera.fov = lerp(camera.fov, 55, dt * 2); camera.updateProjectionMatrix();
}
function skipCena() { const K = G.cine; if (!K || !K.dinner || K.phase !== 'party' && K.phase !== 'leave') return; for (const f of G.cena.friends) { f.gone = true; f.leaving = true; f.p.visible = false; if (f.speech) f.speech.visible = false; } K.phase = 'bill'; K.t = 0; $('skipIntro').hidden = true; }

/* ---------- a conta e a rabecha ---------- */
function cenaBill() {
  $('skipIntro').hidden = true;
  const K = G.cine;
  openDialog([
    CW('Bueno, Avelino... xa marcharon todos. Que cea máis bonita! Aquí tes a conta.'),
    AV('Claro, claro. Canto é? Vinte euros por cabeza, non?'),
    CW('Polbo, lacón, pan e postres... iso está incluído no menú UCL. O que vai á parte é o viño do peleón: cento cincuenta euros.'),
    AV('CENTO CINCUENTA?! Por un viño que se chama PELEÓN?! Iso non é un viño, é un atraco á man armada!'),
    () => { K.angry = true; },
    CW('Doce botellas, Avelino. Ti pedías «outra máis polas ovellas» cada cinco minutos.'),
    AV('A carteira... estaba aquí... no peto... NON ESTÁ! Só teño cinco euros soltos e un caramelo de menta!'),
    () => { K.angry = false; K.tantrum = true; },
    AV('AAAAAAH! NON PODE SER! POR QUE A MIN?! MALDITO PELEÓN! MALDITAS OVELLAS! MALDITA BOTA DO PASTOR!'),
    CW('Avelino, érguete do chan, que acabo de fregar...'),
    AV('NON ME ERGO! VOU VIVIR AQUÍ! NESTA BALDOSA! DÍGANLLE Á MIÑA NAI QUE A QUERÍA!'),
    CW('Home, non é para tanto... Fagamos unha cousa: non marchas de Monforte sen pagarme. E o tren a Cee custa 45 euros, que xa che vexo a cara.'),
    CW('Por certo: cando chegaches, xa ías medio contento e dicías que deixaras «algo moi importante» na estación. Empeza por aí.'),
    CW('E por esta noite podes durmir no almacén, entre as caixas de polbo. Só esta noite!'),
    () => { G.player.money = 5; $('money').textContent = '5 €'; },
  ], () => cenaOutside());
}
function cenaOutside() {
  const C = G.cena, me = G.player.ped;
  $('fade').classList.add('on');
  setTimeout(() => {
    // limpar a escena
    for (const f of C.friends) { const p = f.p; p.visible = false; p.state = 'hidden'; p.npc = 'cenaGone'; if (f.speech) f.speech.visible = false; }
    if (C.waiter) { C.waiter.p.visible = false; C.waiter.p.state = 'hidden'; C.waiter.p.npc = 'cenaGone'; if (C.waiter.speech) C.waiter.speech.visible = false; }
    if (C.av && C.av.speech) C.av.speech.visible = false;
    C.lights.forEach(l => l.intensity = 0);
    me.lie = 0; me.sit = 0; me.arms = null; me.walk = 0; me.nod = 0; me.wave = false;
    const d = G.ucelersDoor; me.x = d.x; me.z = d.z + 1.2; me.y = groundH(me.x, me.z); me.yaw = Math.PI;
    G.hour = 23.7; envTimer = 0; lastEnvHour = -99;
    G.cine = null; $('hud').classList.remove('cine');
    camYaw = me.yaw + Math.PI; camPitch = 0.15; camDist = 5; camera._init = 0;
    $('fade').classList.remove('on');
    setTimeout(() => {
      me.wave = true; me.armUp = 1;
      openDialog([
        AV('...'),
        AV('Ben. Respira, Avelino. Respira. Cento cincuenta euros, sen carteira e nunha cidade allea.'),
        AV('Pero sabes que? TODO TEN SOLUCIÓN! Os problemas non se choran: encáranse con mentalidade gañadora!'),
        AV('Mañá recupero a carteira, pago a débeda, merco o billete... e volvo a Cee coma un campión da UCL!'),
        AV('Avelino Villar, detective privado da súa propia resaca. Caso aberto! Agora... ao almacén das caixas de polbo.'),
      ], () => { me.wave = false; me.armUp = 0; storySleep({ id: 'almacen', label: 'Almacén do UCELERS', cost: 0, x: G.ucelersDoor.x, z: G.ucelersDoor.z, why: 'Durmes entre caixas de polbo e botellas baleiras do viño do peleón.' }, true); });
    }, 700);
  }, 900);
}
