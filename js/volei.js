'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Pista de volei praia do Parque dos Condes
   e Currito el Mago, rei das celebracións (personaxe orixinal)
   ========================================================== */

/* ---------- a pista ---------- */
function sandTex() {
  const c = cnv(256, 256), x = c.getContext('2d');
  x.fillStyle = '#e2cb98'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = RR(-28, 22); x.fillStyle = `rgba(${150 + v},${120 + v},${70 + v},${RR(0.15, 0.45)})`; x.fillRect(R() * 256, R() * 256, RR(1, 2.6), RR(1, 2.6)); }
  for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(160,128,80,.18)'; x.lineWidth = RR(1, 3); x.beginPath(); const a = R() * 256, b = R() * 256; x.arc(a, b, RR(4, 14), 0, RR(1, 5)); x.stroke(); }
  const t = toTex(c); t.repeat.set(4, 2); return t;
}
function netTex() {
  const c = cnv(512, 64), x = c.getContext('2d');
  x.clearRect(0, 0, 512, 64); x.strokeStyle = 'rgba(20,20,22,.95)'; x.lineWidth = 2;
  for (let i = 0; i <= 512; i += 8) { x.beginPath(); x.moveTo(i, 8); x.lineTo(i, 64); x.stroke(); }
  for (let j = 8; j <= 64; j += 8) { x.beginPath(); x.moveTo(0, j); x.lineTo(512, j); x.stroke(); }
  x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, 512, 9); x.fillStyle = '#1d4fd8'; x.fillRect(0, 56, 512, 8);
  const t = toTex(c, false); return t;
}
function ballTex() {
  const c = cnv(128, 64), x = c.getContext('2d'), cols = ['#f4f4f0', '#f2c21b', '#1d4fd8'];
  for (let i = 0; i < 6; i++) { x.fillStyle = cols[i % 3]; x.fillRect(0, i * 64 / 6, 128, 64 / 6 + 1); }
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.5; for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(0, i * 64 / 6); x.lineTo(128, i * 64 / 6); x.stroke(); }
  return toTex(c, false);
}
function buildVoleiCourt(B, g) {
  const V = LM.volei, y0 = terrainH(V.ox, V.oz), ys = y0 + 0.15;
  V.y0 = y0; V.ys = ys;
  // explanada de formigón (rectangular) e area
  const slab = boxGeo(23, 0.6, 13, [6, 4]); xform(slab, 0, y0 - 0.18, 0); B.concrete.add(slab);
  addSWRect(-11.5, -6.5, 11.5, 6.5, 0.12);
  const sand = new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.12, 9.2), std({ map: sandTex(), roughness: 1 }));
  sand.position.set(0, ys - 0.06, 0); sand.receiveShadow = true; g.add(sand);
  // bordo de madeira da area
  for (const s of [-1, 1]) { const a = boxGeo(17.6, 0.2, 0.2, [4, 1]); xform(a, 0, y0 + 0.14, s * 4.7); B.wood.add(a); const b = boxGeo(0.2, 0.2, 9.6, [1, 3]); xform(b, s * 8.7, y0 + 0.14, 0); B.wood.add(b); }
  // liñas (cintas azuis) 16 x 8
  const lineM = std({ color: 0x1d4fd8, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.012, 0.06), lineM); a.position.set(0, ys + 0.002, s * 4); g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 8.1), lineM); b.position.set(s * 8, ys + 0.002, 0); g.add(b);
  }
  // rede e postes
  const postM = std({ color: 0xd8dde2, roughness: 0.35, metalness: 0.6 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.65, 10), postM); p.position.set(0, ys + 1.32, s * 4.9); p.castShadow = true; g.add(p);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.6, 10), std({ color: 0x1d4fd8, roughness: 0.7 })); pad.position.set(0, ys + 0.8, s * 4.9); g.add(pad);
    addCircCol(0, s * 4.9, 0.2, 3, 'volei');
  }
  const net = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 1.0), new THREE.MeshStandardMaterial({ map: netTex(), transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, roughness: 0.8 }));
  net.position.set(0, ys + 1.93, 0); net.rotation.y = Math.PI / 2; g.add(net);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 9.8, 4), std({ color: 0x222222 })); cable.rotation.x = Math.PI / 2; cable.position.set(0, ys + 1.42, 0); g.add(cable);
  addBoxCol(-0.08, -4.9, 0.08, 4.9, 2.6, 'volei');
  // cadeira do árbitro
  for (const [lx, lz] of [[-0.45, -5.5], [0.45, -5.5], [-0.45, -6.2], [0.45, -6.2]]) { const l = new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6); xform(l, lx, y0 + 0.12 + 0.95, lz); B.metal.add(l); }
  { const pl = boxGeo(1.1, 0.08, 0.9, [1, 1]); xform(pl, 0, y0 + 2.0, -5.85); B.wood.add(pl); const bk = boxGeo(1.1, 0.7, 0.08, [1, 1]); xform(bk, 0, y0 + 2.4, -6.3); B.wood.add(bk); addBoxCol(-0.55, -6.3, 0.55, -5.4, 2.2, 'volei'); }
  // pancartas do torneo
  const ban = textTex('TORNEO VOLEI PRAIA · REMEMBER', { w: 1024, h: 128, bg: '#1d4fd8', fg: '#f2c21b', size: 72, border: '#f4f4f0' });
  const ban2 = textTex('PARQUE DOS CONDES · MONFORTE', { w: 1024, h: 128, bg: '#f2c21b', fg: '#1d4fd8', size: 72, border: '#1d4fd8' });
  [[-5.4, ban], [5.4, ban2]].forEach(([lx, t]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 0.95), std({ map: t, roughness: 0.7, side: THREE.DoubleSide })); m.position.set(lx, y0 + 0.75, -6.25); g.add(m);
    for (const s of [-1, 1]) { const p = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6); xform(p, lx + s * 3.8, y0 + 0.75, -6.27); B.metal.add(p); }
    addBoxCol(lx - 3.8, -6.35, lx + 3.8, -6.15, 1.3, 'volei');
  });
  // focos de iluminación (coma na foto do torneo de noite)
  V.floods = [];
  for (const [lx, lz] of [[-10.6, 5.6], [10.6, -5.6]]) {
    const m = new THREE.CylinderGeometry(0.12, 0.17, 9, 8); xform(m, lx, y0 + 4.6, lz); B.metalDark.add(m); addCircCol(lx, lz, 0.3, 9, 'volei');
    const head = new THREE.Group(); head.position.set(lx, y0 + 9.1, lz); g.add(head);
    head.rotation.set(0, Math.atan2(-lx, -lz), 0);
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.3), std({ color: 0x2a2d31, roughness: 0.5 })); box.rotation.x = 0.45; head.add(box);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0xfff6dc })); l.position.set(-0.36 + i * 0.72, -0.18 + j * 0.36, 0.16); l.rotation.x = 0.45; box.add(l); V.floods.push(l);
      l.position.set(-0.36 + i * 0.72, -0.18 + j * 0.36, 0.16); l.rotation.x = 0;
    }
    const [wx, wz] = V.pt(lx * 0.92, lz * 0.92); G.lamps.push({ x: wx, y: y0 + 8.6, z: wz });
  }
  // bancos para o público nos extremos
  bench(B, -10.2, y0 + 0.12, -2.5, Math.PI / 2); bench(B, -10.2, y0 + 0.12, 2.5, Math.PI / 2);
  bench(B, 10.2, y0 + 0.12, -2.5, -Math.PI / 2); bench(B, 10.2, y0 + 0.12, 2.5, -Math.PI / 2);
}

/* ---------- Currito el Mago ---------- */
const CURRITO_CELS = [
  { id: 'siuu', say: 'SIIIUUUU!', dur: 3.6 },
  { id: 'frecha', say: 'Frechaaa! Directo á escuadra!', dur: 3.4 },
  { id: 'orellas', say: 'Non vos escoito!', dur: 3.4 },
  { id: 'aviom', say: 'Avióóóón!', dur: 3.2 },
  { id: 'bebe', say: 'Este vai polo meu bebé!', dur: 3.2 },
  { id: 'xeonllos', say: 'Escorregaaaa!', dur: 2.8 },
];
const CURRITO_IDLE = ['Magia!', 'Ponzoña!', 'Runner runner!', 'Algún pececillo para o póker?', 'Sucio Omar, traidor!', 'Lemos–Arenteiro sen min...', 'Ultreia, Sucio Omar...'];
function shirtTex1() {
  const c = cnv(128, 128), x = c.getContext('2d');
  x.fillStyle = '#f6f6f2'; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#1d2a6a'; x.fillRect(0, 0, 18, 128); x.fillRect(110, 0, 18, 128);
  x.fillStyle = '#1d2a6a'; x.font = '900 46px "Big Shoulders Display", Arial, sans-serif'; x.textAlign = 'center'; x.fillText('1', 64, 104);
  x.fillText('1', 64 - 128, 104);
  return toTex(c, false);
}
function curritoSpeech(n) {
  const c = cnv(512, 128); n.speechC = c; n.speechT = toTex(c, false);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: n.speechT, depthTest: false, transparent: true })); sp.scale.set(3.6, 0.9, 1); sp.renderOrder = 10; sp.visible = false; G.scene.add(sp); n.speech = sp;
}
function curritoSay(n, text, hold = 2.6) {
  const x = n.speechC.getContext('2d'); x.clearRect(0, 0, 512, 128);
  x.fillStyle = 'rgba(29,79,216,.95)'; x.strokeStyle = '#f2c21b'; x.lineWidth = 6;
  x.beginPath(); x.roundRect ? x.roundRect(6, 6, 500, 94, 26) : x.rect(6, 6, 500, 94); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(240, 98); x.lineTo(256, 124); x.lineTo(272, 98); x.fill();
  x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  let fs = 44; x.font = `900 ${fs}px "Big Shoulders Display", Barlow, sans-serif`; while (x.measureText(text).width > 470 && fs > 22) { fs -= 2; x.font = `900 ${fs}px "Big Shoulders Display", Barlow, sans-serif`; }
  x.fillText(text, 256, 54); n.speechT.needsUpdate = true; n.speech.visible = true; n.speechHold = hold;
}
function spawnCurrito() {
  const V = LM.volei; if (!V) return;
  const [x, z] = V.pt(-4.5, 0);
  const n = spawnNPC({ id: 'currito', name: 'Currito el Mago', x, z, yaw: V.yaw(Math.PI / 2), scale: 1.02, colors: { shirt: '#f6f6f2', pants: '#1d2a6a', skin: '#e9b48c', hair: '#5a3a24', shoe: '#f2f2f2', sleeve: false } });
  if (!n) return;
  const p = n.p; p.manual = true;
  // camiseta co 1 e garabata vermella, capa azul
  const geo = world.crowd.meshes.torso.geometry.clone(); geo.scale(1.04, 0.98, 1.06);
  const ov = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: shirtTex1(), roughness: 0.65 }));
  ov.matrixAutoUpdate = false; ov.castShadow = true; G.scene.add(ov); n.overlay = ov;
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.26, 0.015), std({ color: 0xc8202a, roughness: 0.5 })); tie.position.set(0, 0.13, 0.135); ov.add(tie);
  const capeM = std({ color: 0x1d4fd8, roughness: 0.55, side: THREE.DoubleSide });
  const capeG = new THREE.PlaneGeometry(0.58, 0.98, 1, 4); capeG.translate(0, -0.49, 0);
  { const pa = capeG.attributes.position; for (let i = 0; i < pa.count; i++) { const yy = pa.getY(i); pa.setX(i, pa.getX(i) * (1 + -yy * 0.35)); } }
  const cape = new THREE.Mesh(capeG, capeM); cape.position.set(0, 0.26, -0.15); cape.castShadow = true; ov.add(cape); n.cape = cape;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 6, 14, Math.PI), capeM); collar.rotation.set(-Math.PI / 2 + 0.2, 0, Math.PI); collar.position.set(0, 0.27, -0.02); ov.add(collar);
  // chistera azul e barba (seguen á cabeza)
  const hg = new THREE.Group(); hg.matrixAutoUpdate = false; G.scene.add(hg); n.headG = hg;
  const hatM = std({ color: 0x1f3fb8, roughness: 0.5 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 18), hatM); brim.position.y = 0.085; hg.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.125, 0.22, 16), hatM); crown.position.y = 0.2; hg.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.04, 16), std({ color: 0x0e1c5c, roughness: 0.6 })); band.position.y = 0.115; hg.add(band);
  hg.children.forEach(c => { c.rotation.z = -0.08; c.position.x += 0.01; });
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.121, 14, 8, Math.PI / 2 - 1.05, 2.1, Math.PI * 0.6, Math.PI * 0.27), std({ color: 0x5a3a24, roughness: 0.95 }));
  hg.add(beard);
  // xeonlleiras brancas
  n.knees = [0, 1].map(() => { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.11, 10), std({ color: 0xf4f4f0, roughness: 0.8 })); G.scene.add(k); return k; });
  curritoSpeech(n);
  n.home = { x, z }; n.cel = null; n.celT = 0; n.idleT = 1.5; n.run = null;
  // bola de volei
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), std({ map: ballTex(), roughness: 0.55 })); ball.castShadow = true; G.scene.add(ball); n.ball = null; G.vball = ball;
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; G.scene.add(sh); G.vballSh = sh;
  const mk = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 32), new THREE.MeshBasicMaterial({ color: 0xf2c21b, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })); mk.rotation.x = -Math.PI / 2; mk.visible = false; G.scene.add(mk); G.vmark = mk;
  G.currito = n;
}
// poses de brazos: [ax, az, cóbado] para dereito (s=0) e esquerdo (s=1)
function armsPose(p, a0, z0, e0, a1, z1, e1) { p.arms = [a0, -z0, e0, a1, z1, e1]; }
function curritoPick() { const V = LM.volei; return V.pt(RR(-7.2, -1.8), RR(-3.4, 3.4)); }
function updateCurrito(dt) {
  const n = G.currito; if (!n) return;
  const p = n.p, V = LM.volei, me = G.player.ped, VG = G.voley, t = G.t;
  const dme = Math.hypot(me.x - p.x, me.z - p.z);
  let jumpY = 0;
  p.nod = 0; p.look = 0; p.lie = 0; p.kneel = 0;
  if (VG && VG.on) { voleyCurrito(dt, n); jumpY = n.jumpY || 0; }
  else if (p.talking || (G.dialog && dme < 5)) {
    p.arms = null; p.walk = lerp(p.walk, 0, dt * 6); p.run = 0; p.sit = 0; p.wave = false; p.armUp = 0;
    p.yaw += angDiff(p.yaw, Math.atan2(me.x - p.x, me.z - p.z)) * Math.min(1, dt * 4);
  } else if (n.run) {
    // carreira ata o seguinte sitio
    const [tx, tz] = n.run, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    p.arms = null; p.wave = false; p.armUp = 0; p.sit = 0;
    if (d < 0.3) { n.run = null; n.cel = pick(CURRITO_CELS); n.celT = 0; if (dme < 45) curritoSay(n, n.cel.say, n.cel.dur); }
    else { const sp = Math.min(5.2, d * 3); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; p.yaw += angDiff(p.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); p.walk = 1; p.run = 1; p.phase += dt * 10; }
  } else if (n.cel) {
    n.celT += dt; const c = n.cel.id, k = n.celT; p.walk = lerp(p.walk, 0, dt * 6); p.run = 0; p.sit = 0; p.wave = false; p.armUp = 0;
    if (c === 'siuu') {
      if (k < 0.5) { armsPose(p, -0.6, 0.3, 0.3, -0.6, 0.3, 0.3); }
      else if (k < 1.25) { const u = (k - 0.5) / 0.75; jumpY = Math.sin(u * Math.PI) * 0.75; p.yaw += dt * Math.PI / 0.75; armsPose(p, -2.7, 0.2, 0.1, -2.7, 0.2, 0.1); }
      else { armsPose(p, 0.55, 0.55, 0.05, 0.55, 0.55, 0.05); p.nod = -0.25; }
    } else if (c === 'frecha') {
      // de xeonllos, brazo esquerdo estirado cara arriba e o dereito tensando o arco
      const u = Math.min(1, k / 0.45); p.kneel = u; p.nod = -0.18;
      armsPose(p, -0.05, 1.7, k > 2.5 ? 1.2 : 2.7, -2.5, 0.45, 0);
      p.look = 0.35;
    } else if (c === 'orellas') {
      // mans ás orellas, cóbados abertos: «non vos escoito»
      armsPose(p, -2.1, 0.45, 2.4, -2.1, 0.45, 2.4); p.yaw += dt * 0.7; p.nod = -0.08 + Math.sin(t * 2.5) * 0.04;
    } else if (c === 'aviom') {
      const w = Math.sin(t * 2) * 0.35; armsPose(p, 0, 1.5 + w, 0.05, 0, 1.5 - w, 0.05);
      const sp = 3.4, yaw = p.yaw + dt * 1.6; p.yaw = yaw; p.x += Math.sin(yaw) * sp * dt; p.z += Math.cos(yaw) * sp * dt; p.walk = 1; p.run = 0.7; p.phase += dt * 8;
      const [lx, lz] = V.inv(p.x, p.z); if (lx > -1.2 || lx < -8 || Math.abs(lz) > 3.8) { const [cx, cz] = V.pt(clamp(lx, -8, -1.2), clamp(lz, -3.8, 3.8)); p.x = cx; p.z = cz; }
    } else if (c === 'bebe') {
      const w = Math.sin(t * 7) * 0.3; armsPose(p, -1.05, -0.45 + w, 0.9, -1.05, -0.45 - w, 0.9); p.look = Math.sin(t * 7) * 0.2;
    } else if (c === 'xeonllos') {
      const u = Math.min(1, k / 0.5); p.kneel = u; armsPose(p, -2.5, 0.6, 0.1, -2.5, 0.6, 0.1); p.nod = -0.35;
      if (k < 0.7) { const sp = 4 * (1 - u); p.x += Math.sin(p.yaw) * sp * dt; p.z += Math.cos(p.yaw) * sp * dt; }
    }
    if (n.celT > n.cel.dur) { n.cel = null; n.idleT = RR(0.6, 1.6); p.arms = null; }
  } else {
    p.arms = null; p.walk = lerp(p.walk, 0, dt * 6); p.run = 0; p.sit = 0; p.wave = dme < 8 && Math.sin(t * 2) > 0.4;
    if (dme < 9) p.yaw += angDiff(p.yaw, Math.atan2(me.x - p.x, me.z - p.z)) * Math.min(1, dt * 3);
    n.idleT -= dt; if (n.idleT <= 0) { n.run = curritoPick(); if (dme < 18 && R() < 0.35) curritoSay(n, pick(CURRITO_IDLE), 3); }
  }
  p.y = groundH(p.x, p.z) + jumpY;
  // complementos
  const sc = p.scale, yaw = p.yaw;
  pedMatrix('head', p.idx, n.headG.matrix); n.headG.matrixWorldNeedsUpdate = true; n.headG.visible = p.visible;
  if (n.cape) n.cape.rotation.x = 0.12 + (p.run || 0) * 0.75 * (p.walk || 0) + (jumpY > 0.1 ? 0.5 : 0) + Math.sin(t * 5) * 0.03;
  const rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
  n.knees.forEach((k, i) => { const s = i ? 1 : -1, kn = (p.sit || 0); k.position.set(p.x + rx * s * 0.1 * sc + fx * (0.02 + kn * 0.35) * sc, p.y + (0.5 - kn * 0.12 - (p.kneel || 0) * 0.43) * sc, p.z + rz * s * 0.1 * sc + fz * (0.02 + kn * 0.35) * sc); k.rotation.set(kn * 1.2, yaw, 0, 'YXZ'); });
  n.speech.position.set(p.x, p.y + 2.75 * sc, p.z);
  if (n.speechHold > 0) { n.speechHold -= dt; if (n.speechHold <= 0) n.speech.visible = false; }
  // bola en repouso cando non hai xogo
  if (!(VG && VG.on) && G.vball) { const [bx, bz] = V.pt(-0.9, 4.3); G.vball.position.set(bx, V.ys + 0.11, bz); G.vballSh.visible = false; G.vmark.visible = false; }
}
function talkCurrito(n) {
  const C = (t, extra) => ({ who: 'Currito el Mago', text: t, ...extra });
  n.cel = null; n.run = null; n.p.arms = null; n.p.kneel = 0;
  const volei = () => save.curritoWin
    ? [C('Botamos uns pases para quentar? Corre (Maiús) ata a sombra da bola e preme E xusto cando baixe.'), () => voleyStart()]
    : [C('Esa é a actitude! Pero antes, unha proba: dez pases seguidos sen que a bola toque a area.'),
       C('Eu tirocha. Ti corre (Maiús) ata o círculo amarelo da sombra e preme E (ou ★) cando a bola baixe á altura das mans.'),
       C('Abracadabra... ao lío!'), () => voleyStart()];
  const menu = C(save.curritoWin ? 'Parella! Xa estamos inscritos no Torneo Remember. Que facemos?' : 'Este sábado hai torneo de volei praia aquí no Parque dos Condes. Apúntaste comigo e facemos un remember dos vellos tempos? Ou prefires unha partidiña de cartas?', { choices: [
    { t: save.curritoWin ? 'Uns pases de volei' : 'Apúntome ao torneo! Imos facer un remember', fn: volei },
    { t: 'Unha man de «Olín sin verlas»', fn: () => pokerIntro(C) },
    { t: 'E o Sucio Omar?', fn: () => [C('Nin mo nomees! Agora estará en Portomarín cunha cuncha na mochila e as botas novas facéndolle burbullas.'), C('O Lemos–Arenteiro, fútbol profesional, entradas collidas... e el, «é que o Camiño chámame, Currito». O Camiño! Chamábao a ponzoña, iso si.')] },
    { t: 'E por que che chaman o Mago?', fn: () => [C('Porque coa bola nas mans fago desaparecer os puntos do rival. E porque coas cartas... bueno, iso xa o verás.')] },
    { t: 'Agora non, Currito', fn: () => [C('Ti verás... Os grandes momentos non esperan! SIUUU!')] },
  ] });
  openDialog(save.curritoWin ? [menu] : [
    C('SIIIUUU! Perdoa, perdoa, é que cando piso a area non o podo evitar. Son Currito, Currito el Mago.'),
    C('Viches a frecha? E o das orellas? E o avión? Teño todo o repertorio de celebracións do fútbol.'),
    ...omarLines(C),
    menu,
  ], pokerHide);
}

function omarLines(C) {
  return [
    C('Hoxe tiña plan grande, eh: quedara co SUCIO OMAR para ir ver fútbol profesional, o Lemos contra o Arenteiro. Partidazo!'),
    C('E que fai o Sucio Omar? Déixame colgado! Marchou facer o Camiño de Santiago. Cuncha, bordón e adeus moi boas.'),
    C('Así que baixei ao parque a dar uns toques de balón... e a buscar algún pececillo para ganarlle ao póker. Ti non serás un pececillo, non? Je, je. Magia!'),
  ];
}

/* ---------- «Olín sin verlas»: unha carta cada un, gaña a máis alta ---------- */
const PK_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'], PK_SUITS = ['♠', '♥', '♦', '♣'];
function pokerUI() {
  if ($('poker')) return $('poker');
  const st = document.createElement('style');
  st.textContent = `#poker{position:fixed;left:50%;top:12%;transform:translateX(-50%);display:flex;gap:42px;z-index:40;pointer-events:none;font-family:Barlow,sans-serif}
#poker[hidden]{display:none}
#poker .seat{display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;font-weight:800;font-size:18px;text-shadow:0 2px 4px #000}
#poker .card{width:110px;height:156px;perspective:600px}
#poker .in{position:relative;width:100%;height:100%;transition:transform .7s cubic-bezier(.3,1.4,.5,1);transform-style:preserve-3d}
#poker .card.up .in{transform:rotateY(180deg)}
#poker .f,#poker .b{position:absolute;inset:0;border-radius:10px;backface-visibility:hidden;box-shadow:0 8px 24px rgba(0,0,0,.5)}
#poker .b{background:repeating-linear-gradient(45deg,#1d4fd8 0 8px,#1840b0 8px 16px);border:5px solid #f4f4f0}
#poker .b::after{content:'★';position:absolute;inset:0;display:grid;place-items:center;color:#f2c21b;font-size:46px}
#poker .f{background:#fbfaf6;transform:rotateY(180deg);border:2px solid #ccc;display:grid;place-items:center;font-size:64px;font-weight:900;color:#15191d}
#poker .f.red{color:#c8202a}
#poker .f small{position:absolute;left:8px;top:4px;font-size:22px;line-height:1}
#poker .f i{position:absolute;right:8px;bottom:4px;font-size:22px;font-style:normal;transform:rotate(180deg)}
#poker .pot{align-self:center;color:#f2c21b;font-size:24px;font-weight:900;text-shadow:0 2px 4px #000;text-align:center}
#poker .seat.win .card{filter:drop-shadow(0 0 14px #f2c21b)}`;
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'poker'; d.hidden = true;
  d.innerHTML = `<div class="seat" id="pkMe"><div class="card"><div class="in"><div class="b"></div><div class="f"></div></div></div><span>TI</span></div>
<div class="pot" id="pkPot"></div>
<div class="seat" id="pkCu"><div class="card"><div class="in"><div class="b"></div><div class="f"></div></div></div><span>CURRITO</span></div>`;
  document.body.appendChild(d); return d;
}
function pokerHide() { const d = $('poker'); if (d) d.hidden = true; }
function pkCard(el, c) { const f = el.querySelector('.f'), r = PK_RANKS[c.r], su = PK_SUITS[c.s]; f.className = 'f' + (c.s === 1 || c.s === 2 ? ' red' : ''); f.innerHTML = `<small>${r}<br>${su}</small>${su}<i>${r}<br>${su}</i>`; }
function pokerIntro(C) {
  const money = G.player.money;
  if (money < 1) return [C('Sen cartos non hai olín, campeón. Volve cando teñas algo no peto.')];
  return [
    C('Un pececillo! Digo... un rival de nivel. Senta, senta.'),
    C('«Olín sin verlas»: cada un colle unha carta sen mirala, apostamos o mesmo e a carta máis alta, coas regras do póker, lévase o bote. O As é a máis alta.'),
    pokerBetLine(C),
  ];
}
function pokerBetLine(C) {
  const mk = v => ({ t: `${v} €`, disabled: G.player.money < v ? 'Non tes cartos dabondo' : null, fn: () => pokerDeal(C, v) });
  return C(`Canto apostas? (de 1 a 10 €; tes ${G.player.money} €)`, { choices: [
    mk(1), mk(2), mk(5), mk(10),
    { t: 'Outra cantidade...', fn: () => [C('Di ti, sen medo:', { choices: [3, 4, 6, 7, 8, 9].map(mk) })] },
    { t: 'Mellor non', fn: () => [C('Covarde! É broma. Cando queiras, a baralla está quente.')] },
  ] });
}
function pokerLine(res, me, cu, bet, name) {
  if (res === 0) return `Empate! ${name(me)} contra ${name(cu)}, mesmo valor. Repartimos o bote e aquí non pasou nada.`;
  const w = res > 0 ? me : cu, l = res > 0 ? cu : me, ponz = w.r <= 5, runner = w.r - l.r === 1;
  if (res > 0) return ponz ? `PONZOÑA! Gañarme cun ${name(me)}?! Eu con ${name(cu)}... Iso é ponzoña pura. Leva o bote: +${bet} €.`
    : runner ? `Runner runner! ${name(me)} contra o meu ${name(cu)}, por unha carta de nada. Lévaste o bote: +${bet} €.`
      : `Ti tes ${name(me)} e eu ${name(cu)}... Gañaches, +${bet} €. Hoxe a magia está do teu lado.`;
  return ponz ? `Eu cun ${name(cu)} e ti ${name(me)}... Ponzoña da boa! Ata eu me sorprendo. O bote é meu (-${bet} €).`
    : runner ? `Runner runner, pececillo! O meu ${name(cu)} contra o teu ${name(me)}. Así se gaña (-${bet} €).`
      : `Eu teño ${name(cu)} e ti ${name(me)}. MAGIA! O bote é meu. SIUUU! (-${bet} €)`;
}
function pokerDeal(C, bet) {
  if (G.player.money < bet) return [C('Iso non o tes, amigo. Aposta menos.'), pokerBetLine(C)];
  const a = Math.floor(R() * 52); let b; do b = Math.floor(R() * 52); while (b === a);
  const me = { r: a % 13, s: a / 13 | 0 }, cu = { r: b % 13, s: b / 13 | 0 };
  const res = me.r > cu.r ? 1 : me.r < cu.r ? -1 : 0, name = c => PK_RANKS[c.r] + PK_SUITS[c.s];
  const d = pokerUI(), mE = $('pkMe'), cE = $('pkCu');
  return [
    () => {
      d.hidden = false; mE.className = 'seat'; cE.className = 'seat';
      for (const e of [mE, cE]) e.querySelector('.card').classList.remove('up');
      pkCard(mE, me); pkCard(cE, cu); $('pkPot').innerHTML = `BOTE<br>${bet * 2} €`;
      G.sfx.coin && G.sfx.coin();
    },
    C(`Bote de ${bet * 2} €. Cartas na fronte e sen mirar... Unha, dúas... e tres!`),
    () => {
      for (const e of [mE, cE]) e.querySelector('.card').classList.add('up');
      if (res > 0) mE.classList.add('win'); else if (res < 0) cE.classList.add('win');
      if (res !== 0) addMoney(res * bet);
      if (G.currito && res < 0) { const n = G.currito; n.cel = CURRITO_CELS[0]; n.celT = 0; }
    },
    C(pokerLine(res, me, cu, bet, name)),
    C('Outra man?', { choices: [
      { t: `Outra man (${bet} €)`, fn: () => pokerDeal(C, bet) },
      { t: 'Cambiar a aposta', fn: () => [pokerBetLine(C)] },
      { t: 'Retirarme', fn: () => [() => pokerHide(), C(res > 0 ? 'Retirarse gañando, iso é de listos. Ata a próxima!' : 'Ata a próxima. A baralla sempre volve!')] },
    ] }),
  ];
}

/* ---------- minixogo: pases con Currito ---------- */
G.voley = { on: false };
function voleySnd(kind) {
  const A = G.sfx; if (!A || !A.ac) return; const ac = A.ac, t = ac.currentTime;
  if (kind === 'hit' || kind === 'bump') {
    const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = kind === 'hit' ? 900 : 650; fl.Q.value = 1.2;
    const g = ac.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); s.connect(fl); fl.connect(g); g.connect(A.out); s.start(t); s.stop(t + 0.15);
    const o = ac.createOscillator(), g2 = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.1); g2.gain.setValueAtTime(0.3, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g2); g2.connect(A.out); o.start(t); o.stop(t + 0.14);
  } else if (kind === 'sand') {
    const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 500;
    const g = ac.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); s.connect(fl); fl.connect(g); g.connect(A.out); s.start(t); s.stop(t + 0.3);
  } else if (kind === 'whiff') {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.15); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 0.18);
  }
}
function voleyStart() {
  const V = LM.volei, n = G.currito; if (!V || !n) return;
  const VG = G.voley; Object.assign(VG, { on: true, phase: 'serve', timer: 1.6, count: 0, goal: 10, cool: 0, to: null, ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }, tgt: null, deadT: 0 });
  const me = G.player.ped; [me.x, me.z] = V.pt(4.5, 0); me.y = groundH(me.x, me.z); me.yaw = V.yaw(-Math.PI / 2);
  if (typeof camYaw !== 'undefined') { camYaw = V.yaw(Math.PI / 2); camPitch = 0.22; }
  const p = n.p; [p.x, p.z] = V.pt(-4.5, 0); p.yaw = V.yaw(Math.PI / 2); n.cel = null; n.run = null;
  toast('Pásalle a bola a Currito 10 veces seguidas!', 3);
}
function voleyEnd(msg) {
  const VG = G.voley; VG.on = false; VG.phase = 'off';
  if (G.currito) { G.currito.p.arms = null; G.currito.jumpY = 0; G.currito.idleT = 1.2; }
  G.player.ped.arms = null;
  if (G.vmark) G.vmark.visible = false;
  if (msg) toast(msg);
}
const VG_G = 9.8;
function voleyLaunch(fromX, fromY, fromZ, tx, tz, ty, T) {
  const b = G.voley.ball; b.x = fromX; b.y = fromY; b.z = fromZ;
  b.vx = (tx - fromX) / T; b.vz = (tz - fromZ) / T; b.vy = (ty - fromY + 0.5 * VG_G * T * T) / T;
}
function voleyServeTo(fromP) {
  const VG = G.voley, V = LM.volei, me = G.player.ped;
  // obxectivo no lado do xogador: preto de onde está ao principio, máis lonxe co paso dos pases
  const [plx, plz] = V.inv(me.x, me.z), r = Math.min(4.6, 1.2 + VG.count * 0.42), a = R() * Math.PI * 2;
  const lx = clamp((VG.count < 1 ? 4.5 : plx) + Math.cos(a) * r * RR(0.5, 1), 1.6, 7.4), lz = clamp((VG.count < 1 ? 0 : plz) + Math.sin(a) * r * RR(0.5, 1), -3.6, 3.6);
  const [tx, tz] = V.pt(lx, lz), T = Math.max(1.35, 1.95 - VG.count * 0.05);
  voleyLaunch(fromP.x, V.ys + 2.1, fromP.z, tx, tz, V.ys + 1.0, T);
  VG.tgt = { x: tx, z: tz }; VG.to = 'player'; VG.phase = 'fly'; voleySnd('hit');
}
function voleyHit() {
  const VG = G.voley, me = G.player.ped, V = LM.volei; if (!VG.on || G.dialog) return;
  me.armsT = 0.35;
  if (VG.cool > 0) return;
  if (VG.phase !== 'fly' || VG.to !== 'player') { VG.cool = 0.4; voleySnd('whiff'); return; }
  const b = VG.ball, d = Math.hypot(b.x - me.x, b.z - me.z), h = b.y - V.ys;
  if (d < 1.55 && h > 0.25 && h < 2.6) {
    VG.count++; voleySnd('bump');
    const [tx, tz] = V.pt(RR(-6.8, -2.2), RR(-3.3, 3.3)), T = RR(1.5, 1.8);
    voleyLaunch(b.x, Math.max(b.y, V.ys + 0.9), b.z, tx, tz, V.ys + 1.2, T);
    VG.tgt = { x: tx, z: tz }; VG.to = 'currito';
    const lines = ['Boa!', 'Iso é!', 'Que mans!', 'Magia!', 'Remember!', 'Ponzoña de pase!', 'Uff, que pase!'];
    if (VG.count >= VG.goal) toast(`${VG.count} pases! Agora Currito...`, 2); else toast(`Pase ${VG.count} de ${VG.goal}`, 1.2);
    if (G.currito && R() < 0.45) curritoSay(G.currito, pick(lines), 1.4);
  } else { VG.cool = 0.5; voleySnd('whiff'); }
}
function voleyCurrito(dt, n) {
  const VG = G.voley, p = n.p, b = VG.ball, V = LM.volei;
  n.jumpY = 0; p.sit = 0; p.wave = false; p.armUp = 0; p.lie = 0;
  if (VG.phase === 'serve') {
    p.walk = 0; p.arms = null; armsPose(p, -2.6, 0.1, 0.2, -2.6, 0.1, 0.2);
    const hx = p.x + Math.sin(p.yaw) * 0.2, hz = p.z + Math.cos(p.yaw) * 0.2; b.x = hx; b.z = hz; b.y = p.y + 2.25;
    if (!G.dialog) VG.timer -= dt;
    if (VG.timer <= 0) { voleyServeTo(p); n.jumpY = 0.25; }
    return;
  }
  if (VG.phase === 'fly' && VG.to === 'currito') {
    const dx = VG.tgt.x - p.x, dz = VG.tgt.z - p.z, d = Math.hypot(dx, dz);
    if (d > 0.15) { const sp = Math.min(8, d * 5); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; p.walk = 1; p.run = 1; p.phase += dt * 10; } else { p.walk = lerp(p.walk, 0, dt * 8); p.run = 0; }
    p.yaw += angDiff(p.yaw, Math.atan2(b.x - p.x, b.z - p.z)) * Math.min(1, dt * 8);
    armsPose(p, -0.9, -0.25, 0.1, -0.9, -0.25, 0.1); p.arms[1] = 0.25; p.arms[4] = -0.25;
    if (b.vy < 0 && b.y < V.ys + 1.25 && Math.hypot(b.x - p.x, b.z - p.z) < 2.2) {
      if (VG.count >= VG.goal) { VG.phase = 'win'; VG.timer = 0.6; voleySnd('hit'); return; }
      voleyServeTo({ x: b.x, z: b.z }); b.y = Math.max(b.y, V.ys + 1.1); n.jumpY = 0.15;
      if (R() < 0.3) curritoSay(n, pick(['Abracadabra!', 'Magia!', 'Vai, que vai!', 'Runner runner!', 'Ollo a esta!', 'Remember!']), 1.4);
    }
    return;
  }
  if (VG.phase === 'win') {
    p.walk = lerp(p.walk, 0, dt * 8); p.run = 0; b.x = p.x + Math.sin(p.yaw) * 0.3; b.z = p.z + Math.cos(p.yaw) * 0.3; b.y = p.y + 1.1;
    VG.timer -= dt; if (VG.timer <= 0 && !G.dialog) { VG.phase = 'done'; voleyWin(n); }
    return;
  }
  // a bola vai cara ao xogador: Currito agarda no centro do seu campo
  const [hx, hz] = V.pt(-4.2, 0), dx = hx - p.x, dz = hz - p.z, d = Math.hypot(dx, dz);
  if (d > 0.3 && VG.phase === 'fly') { p.x += dx / d * 3 * dt; p.z += dz / d * 3 * dt; p.walk = 0.8; p.phase += dt * 7; } else p.walk = lerp(p.walk, 0, dt * 6);
  p.yaw += angDiff(p.yaw, Math.atan2(b.x - p.x, b.z - p.z)) * Math.min(1, dt * 6);
  p.arms = null; p.nod = -0.1;
}
function voleyWin(n) {
  if (G.story && typeof advVolleyWin === 'function' && advVolleyWin(n)) return;
  const C = t => ({ who: 'Currito el Mago', text: t }), first = !save.curritoWin;
  openDialog([
    C(`DEZ pases! Iso é química, parella! Quedamos inscritos no Torneo Remember!`),
    ...(first ? [C('Toma, a túa parte do premio da proba. Investe en crema solar, que no torneo pega o sol.'), () => { save.curritoWin = true; persist(); addMoney(25); }] : [C('Seguimos en forma. Ninguén nos para!')]),
    C('E agora, como mandan os cánones...'),
    () => { voleyEnd(first ? 'Inscrito no Torneo Remember con Currito el Mago (+25 €)' : null); n.cel = CURRITO_CELS[0]; n.celT = 0; curritoSay(n, 'SIIIUUUU!', 3); },
  ]);
}
function voleyFail() {
  const VG = G.voley, n = G.currito, c = VG.count;
  const C = (t, extra) => ({ who: 'Currito el Mago', text: t, ...extra });
  openDialog([
    C(`Aiii! Tocou a area. Fixemos ${c} ${c === 1 ? 'pase' : 'pases'}. ${c >= 7 ? 'Case o temos!' : c >= 3 ? 'Imos ben, pero hai que afinar.' : 'Tranquilidade, que isto é como andar en bici.'}`, { choices: [
      { t: 'Outra vez!', fn: () => [() => voleyStart()] },
      { t: 'Déixao, Currito', fn: () => [C('Vale, vale. Cando queiras, aquí estou. Recorda: os grandes momentos non esperan!'), () => voleyEnd()] },
    ] }),
  ]);
}
function updateVoley(dt) {
  const VG = G.voley, V = LM.volei; if (!VG.on || !V) return;
  const me = G.player.ped, b = VG.ball;
  // abandonar a pista
  if (G.player.car || Math.hypot(me.x - V.ox, me.z - V.oz) > 22) { voleyEnd('Deixaches os pases con Currito'); return; }
  VG.cool -= dt;
  // pose de toque do xogador
  if (me.armsT > 0) { me.armsT -= dt; armsPose(me, -0.95, 0.3, 0.05, -0.95, 0.3, 0.05); me.arms[1] = 0.3; me.arms[4] = -0.3; } else me.arms = null;
  if (VG.phase === 'fly' && !G.dialog) {
    b.vy -= VG_G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.y < V.ys + 0.11) {
      b.y = V.ys + 0.11; voleySnd('sand');
      if (VG.to === 'player') { VG.phase = 'dead'; VG.deadT = 1.3; b.vy = 2.2; b.vx *= 0.3; b.vz *= 0.3; }
      else { voleyServeTo({ x: b.x, z: b.z }); } // por se acaso: Currito sempre a salva (é mago)
    }
  } else if (VG.phase === 'dead') {
    b.vy -= VG_G * dt; b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt;
    if (b.y < V.ys + 0.11) { b.y = V.ys + 0.11; b.vy = Math.abs(b.vy) > 1 ? -b.vy * 0.35 : 0; b.vx *= 0.6; b.vz *= 0.6; }
    VG.deadT -= dt; if (VG.deadT <= 0 && !G.dialog) { VG.phase = 'failed'; voleyFail(); }
  }
  // bola, sombra e marcador
  G.vball.position.set(b.x, b.y, b.z); G.vball.rotation.x += dt * 8; G.vball.rotation.z += dt * 5;
  G.vballSh.visible = true; G.vballSh.position.set(b.x, V.ys + 0.02, b.z); { const k = clamp(1 - (b.y - V.ys) / 9, 0.25, 1); G.vballSh.scale.setScalar(0.6 + k); G.vballSh.material.opacity = 0.42 * k; }
  const toMe = VG.phase === 'fly' && VG.to === 'player';
  G.vmark.visible = toMe;
  if (toMe) {
    G.vmark.position.set(VG.tgt.x, V.ys + 0.03, VG.tgt.z);
    const near = Math.hypot(me.x - VG.tgt.x, me.z - VG.tgt.z) < 1.2, h = b.y - V.ys, ready = near && h < 2.6 && b.vy < 0;
    G.vmark.material.color.setHex(ready ? 0x3bd16f : near ? 0x9be36a : 0xf2c21b); G.vmark.scale.setScalar(1 + Math.sin(G.t * 10) * 0.06);
    setPrompt(ready ? `${isTouch ? '★' : 'E'} · PASA AGORA!` : `Corre (Maiús) ao círculo amarelo`);
  }
  // marcador no HUD
  $('mission').hidden = false; $('mName').textContent = 'Torneo Remember · proba de pases';
  $('mText').textContent = `Pases seguidos: ${VG.count} / ${VG.goal}`; $('mTimer').textContent = '';
}
