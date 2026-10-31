'use strict';
/* ==========================================================
   GTA LEMOS 27400 · El Sajoni (Rúa Calvo Sotelo, ao final da
   Rúa Zapardiel): tatuaxes, altofalante a todo volume,
   tumbonas e o seu can. Personaxe orixinal do xogo.
   ========================================================== */

function sajoniLandmarks() {
  const nr = nearRoad(596, 49, r => r.name === 'Rúa de Leopoldo Calvo Sotelo'); if (!nr.r) return;
  const nx = -nr.uz, nz = nr.ux, d = nr.r.hw + (nr.r.sw || 2.4) + 4.5; // lado leste, pasada a beirarrúa
  const ox = nr.px + nx * d, oz = nr.pz + nz * d;
  // eixo local +z mirando cara á rúa
  const F = LM.sajoni = makeFrame(ox, oz, Math.atan2(-nx, -nz));
  const z = frameRectPoly(F, -6.5, -6, 6.5, 3.6);
  reserve(z); (G.noTrees = G.noTrees || []).push(z);
  G.namedZones.push({ n: 'O recuncho do Sajoni', p: z });
}

/* ---------- escenario: alfombra, tumbonas, neveira e altofalante ---------- */
function buildSajoniSpot(B, scene) {
  const F = LM.sajoni; if (!F) return;
  const y0 = terrainH(F.ox, F.oz);
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => {
    // céspede pisado e unha alfombra de praia
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), std({ map: (() => { const c = cnv(256, 160), x = c.getContext('2d'); const cols = ['#f2c21b', '#e0569a', '#1fb5c8', '#f4f4f0']; for (let i = 0; i < 16; i++) { x.fillStyle = cols[i % 4]; x.fillRect(i * 16, 0, 16, 160); } return toTex(c, false); })(), roughness: 0.9 }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(-2.4, y0 + 0.05, -2.2); g.add(rug);
    // dúas tumbonas de praia (tela listada)
    const cloth = std({ map: (() => { const c = cnv(64, 128), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f4f4f0' : '#1d4fd8'; x.fillRect(i * 8, 0, 8, 128); } return toTex(c, false); })(), roughness: 0.85, side: THREE.DoubleSide });
    for (const [lx, lz, a] of [[-3.4, -2.4, 0.25], [-1.4, -2.6, -0.15]]) {
      const grp = new THREE.Group(); grp.position.set(lx, y0, lz); grp.rotation.y = a; g.add(grp);
      const seat = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.2), cloth); seat.rotation.x = -Math.PI / 2 + 0.25; seat.position.set(0, 0.32, 0.35); grp.add(seat);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), cloth); back.rotation.x = -0.75; back.position.set(0, 0.62, -0.55); grp.add(back);
      const wood = std({ color: 0xb08a5a, roughness: 0.7 });
      for (const s of [-1, 1]) {
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.9), wood); r1.position.set(s * 0.31, 0.35, 0); r1.rotation.x = 0.25; grp.add(r1);
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), wood); r2.position.set(s * 0.31, 0.45, -0.5); r2.rotation.x = -0.6; grp.add(r2);
      }
      addCircCol(lx, lz, 0.5, 0.8, 'tumbona');
    }
    // neveira con latas
    const cool = boxGeo(0.6, 0.45, 0.4); xform(cool, 0.1, y0 + 0.23, -3.5); LB.vcol.add(colorize(cool, '#1fb5c8'));
    const lid = boxGeo(0.62, 0.08, 0.42); xform(lid, 0.1, y0 + 0.49, -3.5); LB.vcol.add(colorize(lid, '#f4f4f0'));
    for (let i = 0; i < 4; i++) { const c = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8); xform(c, -0.3 + i * 0.18, y0 + 0.06, -2.9 + (i % 2) * 0.15); LB.vcol.add(colorize(c, i % 2 ? '#d4202b' : '#c9c9c9')); }
    // tixela do can
    const bowl = new THREE.CylinderGeometry(0.16, 0.12, 0.08, 12); xform(bowl, 2.6, y0 + 0.04, -3.2); LB.vcol.add(colorize(bowl, '#d4202b'));
  });
}

/* ---------- altofalante de festa (animado) ---------- */
function makeSpeaker() {
  const g = new THREE.Group(), blk = std({ color: 0x141416, roughness: 0.5 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.15, 0.46), blk); box.position.y = 0.6; box.castShadow = true; g.add(box);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12, Math.PI), blk); handle.position.y = 1.18; g.add(handle);
  const cones = [];
  for (const [y, r] of [[0.38, 0.22], [0.86, 0.13]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.025, 6, 24), new THREE.MeshBasicMaterial({ color: 0xff3bd8 })); ring.position.set(0, y, 0.235); g.add(ring);
    const cone = new THREE.Mesh(new THREE.CircleGeometry(r, 20), std({ color: 0x2a2a2e, roughness: 0.8 })); cone.position.set(0, y, 0.232); g.add(cone);
    const dust = new THREE.Mesh(new THREE.CircleGeometry(r * 0.3, 12), std({ color: 0x55565c, roughness: 0.4 })); dust.position.set(0, y, 0.24); g.add(dust);
    cones.push({ ring, cone, dust, r });
  }
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x3bf2ff })); led.position.set(0, 1.08, 0.235); g.add(led);
  g.userData = { cones, led };
  return g;
}
/* ---------- o can ---------- */
function makeDog() {
  const g = new THREE.Group(), fur = std({ color: 0x8a5a32, roughness: 0.95 }), dark = std({ color: 0x3a2618, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.62), fur); body.position.y = 0.42; body.castShadow = true; g.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.6, 0.36); g.add(head);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), fur); head.add(hd);
  const sn = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), fur); sn.position.set(0, -0.04, 0.16); head.add(sn);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), dark); nose.position.set(0, -0.01, 0.24); head.add(nose);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), dark); ear.position.set(s * 0.1, 0.1, -0.03); ear.rotation.z = s * 0.35; head.add(ear); const eye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), dark); eye.position.set(s * 0.055, 0.04, 0.112); head.add(eye); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), std({ color: 0xd4202b })); collar.position.set(0, 0.53, 0.3); collar.rotation.x = 1.2; g.add(collar);
  const tail = new THREE.Group(); tail.position.set(0, 0.52, -0.31); g.add(tail);
  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.28), fur); tl.position.z = -0.13; tail.add(tl); tail.rotation.x = 0.6;
  const legs = [];
  for (const [x, z] of [[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]]) { const lg = new THREE.Group(); lg.position.set(x, 0.32, z); g.add(lg); const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.07), fur); m.position.y = -0.16; lg.add(m); legs.push(lg); }
  g.userData = { head, tail, legs, body };
  return g;
}

/* ---------- tatuaxes nos brazos ---------- */
function tattooTex() {
  const c = cnv(128, 128), x = c.getContext('2d');
  x.fillStyle = '#c99068'; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(20,24,34,.9)'; x.fillStyle = 'rgba(20,24,34,.9)'; x.lineWidth = 3;
  // tribais, unha rosa, unha áncora e letras
  for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, 12 + i * 30); x.bezierCurveTo(30, i * 30, 60, 30 + i * 30, 128, 10 + i * 30); x.stroke(); }
  x.beginPath(); x.arc(40, 60, 12, 0, 7); x.stroke(); x.beginPath(); x.arc(40, 60, 6, 0, 7); x.fill();
  x.fillStyle = 'rgba(180,30,40,.85)'; x.beginPath(); x.arc(92, 88, 9, 0, 7); x.fill();
  x.fillStyle = 'rgba(20,24,34,.9)'; x.font = '900 18px serif'; x.fillText('MAI', 70, 40); x.fillRect(100, 100, 4, 22); x.fillRect(92, 104, 20, 4);
  return toTex(c, false);
}
function sajoniFace() {
  return { skin: '#c99068', skinD: '#a8714e', hairStyle: 'bald', hair: '#2a1d14', shirt: '#151515', collar: '#e8c22a', shades: true, smile: true, stubble: true, bg: '#5a1d4a', bg2: '#e0569a' };
}

/* ---------- NPC ---------- */
function spawnSajoni() {
  const F = LM.sajoni; if (!F) return;
  const [x, z] = F.pt(0, 0.6);
  const n = spawnNPC({ id: 'sajoni', name: 'El Sajoni', x, z, yaw: F.yaw(0), scale: 1.05, fat: 1.15, colors: { shirt: '#151515', pants: '#3a5a8a', skin: '#c99068', hair: '#c99068', shoe: '#f2f2f2', sleeve: false } });
  if (!n) return;
  const p = n.p; p.manual = true;
  // brazos tatuados (copian as matrices dos brazos do peón)
  const tt = tattooTex(), mm = world.crowd.meshes;
  n.ink = [];
  for (const part of ['uarm', 'farm']) for (const s of [0, 1]) {
    const geo = mm[part].geometry.clone(); geo.scale(1.06, 1.0, 1.06);
    const m = new THREE.Mesh(geo, std({ map: tt, roughness: 0.7 })); m.matrixAutoUpdate = false; m.castShadow = true; G.scene.add(m);
    n.ink.push({ m, part, s });
  }
  // cadea dourada e lentes de sol
  n.chain = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 16), std({ color: 0xe8c22a, metalness: 0.9, roughness: 0.25 })); G.scene.add(n.chain);
  n.shades = makeShades(); G.scene.add(n.shades);
  // altofalante e can
  const sp = makeSpeaker(); const [sx, sz] = F.pt(1.7, -0.6); sp.position.set(sx, terrainH(sx, sz), sz); sp.rotation.y = F.yaw(0) - 0.3; G.scene.add(sp); n.speaker = sp;
  addCircCol0(sx, sz, 0.45, 1.3, 'altofalante');
  const dog = makeDog(); const [dx, dz] = F.pt(2.2, -2.5); dog.position.set(dx, terrainH(dx, dz), dz); G.scene.add(dog);
  n.dog = { g: dog, x: dx, z: dz, yaw: 0, tx: dx, tz: dz, t: 0, wait: 2, bark: 4, ph: 0 };
  n.home = { x, z }; n.move = 0; n.spin = 0;
  curritoSpeech(n);
  G.sajoni = n;
}
const SAJONI_LINES = ['Sube iso, sube iso!', 'Isto é un temazo!', 'Monforte, levantade as mans!', 'Ai que me vou!', 'Perreo intenso en Calvo Sotelo!', 'Quen di que o luns non se baila?'];
function updateSajoni(dt) {
  const n = G.sajoni; if (!n) return;
  const p = n.p, me = G.player.ped, t = G.t, F = LM.sajoni, dme = Math.hypot(me.x - p.x, me.z - p.z);
  const bpm = 96, beat = t * bpm / 60 * Math.PI * 2;
  // baile
  if (p.talking || (G.dialog && dme < 5)) {
    p.arms = null; p.walk = 0; p.yaw += angDiff(p.yaw, Math.atan2(me.x - p.x, me.z - p.z)) * Math.min(1, dt * 4); p.y = groundH(p.x, p.z);
  } else {
    n.move -= dt; if (n.move <= 0) { n.move = RR(4, 7); n.style = (n.style + 1 || 0) % 4; if (dme < 25 && R() < 0.6) curritoSay(n, pick(SAJONI_LINES), 2.6); }
    const b = Math.sin(beat), b2 = Math.sin(beat * 0.5);
    if (n.style === 0) { p.arms = [-2.7 + b * 0.25, 0.25, 0.2, -2.7 - b * 0.25, 0.25, 0.2]; p.yaw += angDiff(p.yaw, F.yaw(0) + b2 * 0.5) * Math.min(1, dt * 6); }
    else if (n.style === 1) { p.arms = [-1.2 + b * 0.6, -0.3, 1.6, -1.2 - b * 0.6, -0.3, 1.6]; p.yaw += dt * 1.8; }
    else if (n.style === 2) { p.arms = [-0.4, 0.5 + Math.abs(b) * 0.5, 0.6, -2.9, 0.1, 0.1]; p.yaw += angDiff(p.yaw, F.yaw(0) + 0.6 * Math.sign(b2)) * Math.min(1, dt * 8); }
    else { p.arms = [-0.6 + b * 0.8, 0.9, 0.3, -0.6 - b * 0.8, 0.9, 0.3]; p.yaw += angDiff(p.yaw, F.yaw(0) - 0.5) * Math.min(1, dt * 5); }
    const sway = Math.sin(beat * 0.5) * 0.28;
    p.x = n.home.x + Math.cos(p.yaw) * sway; p.z = n.home.z - Math.sin(p.yaw) * sway;
    p.y = groundH(p.x, p.z) + Math.abs(Math.sin(beat)) * 0.08; p.nod = Math.max(0, Math.sin(beat)) * 0.25; p.walk = 0.35; p.phase = beat * 0.5;
  }
  // tatuaxes, cadea e lentes
  const mm = world.crowd.meshes;
  for (const k of n.ink) { pedMatrix(k.part, p.idx * 2 + k.s, k.m.matrix); k.m.matrixWorldNeedsUpdate = true; k.m.visible = p.visible; }
  const sc = p.scale, yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw);
  n.chain.position.set(p.x + fx * 0.09 * sc, p.y + 1.5 * sc, p.z + fz * 0.09 * sc); n.chain.rotation.set(-1.2, yaw, 0, 'YXZ');
  n.shades.position.set(p.x + fx * 0.115 * sc, p.y + 1.75 * sc + (p.nod || 0) * -0.02, p.z + fz * 0.115 * sc); n.shades.rotation.set(0, yaw, 0);
  n.speech.position.set(p.x, p.y + 2.75 * sc, p.z);
  if (n.speechHold > 0) { n.speechHold -= dt; if (n.speechHold <= 0) n.speech.visible = false; }
  // altofalante: os conos bombean co ritmo e as luces cambian de cor
  const kick = Math.pow(Math.max(0, Math.cos(beat)), 6), U = n.speaker.userData;
  for (const c of U.cones) { const k = 1 + kick * 0.12; c.cone.scale.set(k, k, 1); c.dust.position.z = 0.24 + kick * 0.03; c.ring.material.color.setHSL((t * 0.15 + c.r) % 1, 1, 0.55); }
  U.led.material.color.setHSL((t * 0.3) % 1, 1, 0.6); n.speaker.position.y = terrainH(n.speaker.position.x, n.speaker.position.z) + kick * 0.01;
  // o can: voltas polo recuncho, achégase ao xogador e ladra
  const D = n.dog, dg = D.g, U2 = dg.userData;
  const dpl = Math.hypot(me.x - D.x, me.z - D.z);
  D.wait -= dt;
  if (dpl < 6 && !G.player.car) { D.tx = me.x - Math.sin(me.yaw) * 0.2 + (D.x < me.x ? -0.7 : 0.7); D.tz = me.z; }
  else if (D.wait <= 0) { const [ax, az] = F.pt(RR(-5, 5), RR(-5, 2.5)); D.tx = ax; D.tz = az; D.wait = RR(2, 5); }
  const ddx = D.tx - D.x, ddz = D.tz - D.z, dd = Math.hypot(ddx, ddz), sp = dd > 0.6 ? Math.min(dpl < 6 ? 3.2 : 1.6, dd * 2) : 0;
  if (sp > 0) { D.x += ddx / dd * sp * dt; D.z += ddz / dd * sp * dt; D.yaw += angDiff(D.yaw, Math.atan2(ddx, ddz)) * Math.min(1, dt * 6); }
  else if (dpl < 6) D.yaw += angDiff(D.yaw, Math.atan2(me.x - D.x, me.z - D.z)) * Math.min(1, dt * 4);
  D.ph += dt * (sp * 6 + 0.1);
  dg.position.set(D.x, groundH(D.x, D.z), D.z); dg.rotation.y = D.yaw;
  U2.legs.forEach((l, i) => { l.rotation.x = sp > 0 ? Math.sin(D.ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 : 0; });
  U2.tail.rotation.y = Math.sin(t * (dpl < 6 ? 18 : 7)) * 0.6; U2.head.rotation.x = sp > 0 ? 0 : Math.sin(t * 1.3) * 0.1;
  D.bark -= dt;
  if (D.bark <= 0) { D.bark = RR(4, 10); if (dpl < 30) { U2.head.rotation.x = -0.3; sajoniSnd('bark', D.x, D.z); } }
  // o xogador baila ou tómbase
  sajoniPlayer(dt, beat);
  sajoniMusic(dt);
}
function sajoniPlayer(dt, beat) {
  const me = G.player.ped, S = G.sajoniPl; if (!S) return;
  const moving = Math.abs(IN.mx) > 0.1 || Math.abs(IN.my) > 0.1 || G.player.car;
  if (S.kind === 'dance') {
    S.t -= dt;
    if (S.t <= 0 || moving) { me.arms = null; G.sajoniPl = null; if (S.t <= 0) { toast(G.story ? 'O Sajoni aplaude: «Tes ritmo, chorbo! Se algunha noite non tes onde durmir, a miña tumbona é túa»' : 'O Sajoni aplaude: «Tes ritmo, chorbo!»', 4); G.sajoniDanced = true; } return; }
    const b = Math.sin(beat); me.arms = [-2.6 + b * 0.3, 0.3, 0.2, -2.6 - b * 0.3, 0.3, 0.2]; me.y += Math.abs(b) * 0.06; me.nod = Math.max(0, b) * 0.2; me.yaw += dt * 1.2;
  } else if (S.kind === 'lie') {
    if (moving && S.t > 0.5) { me.lie = 0; me.fallDir = 1; G.sajoniPl = null; return; }
    S.t += dt; me.x = S.x; me.z = S.z; me.y = groundH(S.x, S.z) + 0.38; me.yaw = S.yaw; me.lie = 1; me.fallDir = 1; me.walk = 0; me.arms = [-2.9, 0.2, 2.4, -2.9, 0.2, 2.4];
  }
}
/* ---------- son: dembow sintetizado e ladridos ---------- */
function sajoniSnd(kind, x, z) {
  const A = G.sfx; if (!A || !A.ac || G.paused) return; const ac = A.ac, cp = camera.position, v = clamp(1 - Math.hypot(cp.x - x, cp.z - z) / 40, 0, 1); if (v < 0.03) return;
  if (kind === 'bark') for (const dl of [0, 0.22]) {
    const t = ac.currentTime + dl, o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 2;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(fl); fl.connect(g); g.connect(A.out); o.start(t); o.stop(t + 0.16);
  }
}
function sajoniMusic(dt) {
  const A = G.sfx, n = G.sajoni; if (!A || !A.ac || !n) return;
  const ac = A.ac, cp = camera.position, sp = n.speaker.position, d = Math.hypot(cp.x - sp.x, cp.z - sp.z);
  const vol = clamp(1 - d / 85, 0, 1) ** 1.6 * (G.sajoniLoud > G.t ? 1.25 : 0.95);
  let M = G.sajoniMus;
  if (!M) { M = G.sajoniMus = { g: ac.createGain(), next: ac.currentTime + 0.1, step: 0 }; M.g.gain.value = 0; M.g.connect(A.out); }
  M.g.gain.setTargetAtTime(G.paused ? 0 : vol, ac.currentTime, 0.2);
  if (vol < 0.01) { M.next = ac.currentTime + 0.1; return; }
  const st = 60 / 96 / 4; // semicorcheas a 96 bpm
  const nf = m => 440 * Math.pow(2, (m - 69) / 12);
  const bass = [38, 38, 41, 43];
  const lead = [74, 0, 72, 74, 0, 77, 0, 74, 72, 0, 69, 0, 72, 0, 70, 0];
  while (M.next < ac.currentTime + 0.25) {
    const t = M.next, i = M.step % 16, bar = Math.floor(M.step / 16) % 4;
    const note = (f, dur, type, v, lp = 3000) => { const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(fl); fl.connect(g); g.connect(M.g); o.start(t); o.stop(t + dur + 0.02); };
    const hit = (f, dur, v, type = 'highpass') => { const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(M.g); s.start(t); s.stop(t + dur + 0.02); };
    // dembow: bombo en 1 e 3, caixa no contratempo («boom-ch-boom-chick»)
    if (i === 0 || i === 8) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(M.g); o.start(t); o.stop(t + 0.32); }
    if (i === 3 || i === 6 || i === 11 || i === 14) hit(1500, 0.12, 0.38, 'bandpass');
    if (i % 2 === 0) hit(8000, 0.03, 0.08);
    if (i === 0 || i === 6 || i === 8 || i === 14) note(nf(bass[bar]), st * 2.6, 'sawtooth', 0.12, 420);
    if (lead[i] && Math.floor(M.step / 32) % 2 === 1) note(nf(lead[i] - (bar === 2 ? 2 : 0)), st * 1.4, 'square', 0.035, 2200);
    M.next += st; M.step++;
  }
}
/* ---------- diálogo ---------- */
function talkSajoni(n) {
  const S = (t, extra) => ({ who: 'El Sajoni', text: t, ...extra });
  const F = LM.sajoni;
  const lounge = (i) => () => { const [x, z] = F.pt(i ? -1.4 : -3.4, i ? -1.7 : -1.5); G.sajoniPl = { kind: 'lie', x, z, yaw: F.yaw(i ? -0.15 : 0.25), t: 0 }; toast('Estás nunha tumbona. Móvete para erguerte.', 3); };
  const menu = () => S('Que che apetece?', { choices: [
    { t: 'Bailamos!', fn: () => [S('Esa é a actitude! Ponte aí diante do altofalante e déixate levar.'), () => { G.sajoniPl = { kind: 'dance', t: 8 }; toast('Estás a bailar co Sajoni! (móvete para parar)', 3); }] },
    { t: 'Tumbarme nunha tumbona', fn: () => [S('Todo teu, colega. A da esquerda é a boa, a outra range.'), lounge(0)] },
    { t: 'Baixa un pouco o volume, non?', fn: () => [S('Baixar? BAIXAR? Ai, que gracioso. Agarda que a subo un chisco máis...'), () => { G.sajoniLoud = G.t + 20; }] },
    { t: 'E os tatuaxes?', fn: () => [S('Este é a rosa pola miña nai, esta a áncora porque son de río, do Cabe, e estes riscos... foi unha noite das festas, non preguntes.'), menu()] },
    { t: 'E o can?', fn: () => [S('É Chispa. Non morde, só se che rouba a empanada. Ladra a todo o que se move, pero é un trozo de pan.'), menu()] },
    { t: 'Ata logo, Sajoni', fn: () => [S('Vai con Deus, e se oes un temazo, xa sabes onde estou!')] },
  ] });
  G.sajoni.cool = true;
  openDialog([
    S('EEEEH! Que pasa, que pasa! Benvido ao recuncho do Sajoni, o mellor ambiente de toda Calvo Sotelo!'),
    S('Aquí hai música a tope, tumbonas para relaxarse e o can, que é o porteiro. Ninguén entra sen bailar polo menos un pouquiño.'),
    menu(),
  ]);
}
