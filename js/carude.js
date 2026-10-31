'use strict';
/* ==========================================================
   GTA LEMOS 27400 · CARUD'E ROCK na Praza de Carude: escenario,
   torres de altofalantes, focos, banda e público con camisetas
   negras do gato vermello, saltando cos brazos no aire.
   Misión de Virginia Bolsas: sabotear o festival... mexando nun
   altofalante. Ao día seguinte o festival múdase á Praza da
   Compañía e o alcalde apúntase o mérito.
   ========================================================== */
const CAR = { center: [-522, 925], rot: 0.315, bpm: 150 };
const CARUDE_LOGO = { img: null, ready: false, wait: [] };
(function () { const im = new Image(); im.onload = () => { CARUDE_LOGO.ready = true; CARUDE_LOGO.img = im; CARUDE_LOGO.wait.forEach(f => f()); CARUDE_LOGO.wait = []; }; im.src = 'img/carude-gato.png'; })();
function withCarudeLogo(fn) { if (CARUDE_LOGO.ready) fn(); else CARUDE_LOGO.wait.push(fn); }
const CARUDE_FAN_LINES = ['ROCK AND ROLL!', 'Esta noite non se dorme!', 'Outra! Outra!', 'Carud\'e Rock!!', 'Uuuuuh!', 'Arriba eses brazos!'];
const CARUDE_BOO = ['Ei!! Quen apagou a música?!', 'Ese do boné verde mexou no altofalante!', 'Que noxo!! Seguridade!!', 'A MÚSICA!!', 'Collede a ese!'];
const MAYOR_FEST_LINES = [
  'Contemplen! Un festival mellor, na mellor praza. Idea miña, naturalmente.',
  'Carude era pequeno para tanto rock. Fíxeno eu: a Compañía merece guitarras!',
  'Grazas a min hai festival e hai Escorial galego. Dous por un!',
  'Os de Carude din que alguén mexou no altofalante. Eu digo: progreso!',
  'Rock na Compañía! Nin os Escolapios o viron vir. Eu si.',
];
function carudeLandmarks() {
  const [cx, cz] = CAR.center;
  LM.carude = makeFrame(cx, cz, CAR.rot);
  const P = frameRectPoly(LM.carude, -11, -14, 11, 12);
  reserve(P); (G.noTrees = G.noTrees || []).push(P);
  G.namedZones.push({ n: 'Carud\'e Rock · Praza de Carude', p: frameRectPoly(LM.carude, -11, -14, 11, 12) });
}
function carudeCompFrame() {
  const C = LM.comp, [ox, oz] = C.pt(-35, 151);
  return makeFrame(ox, oz, C.rot + Math.PI);
}
/* ---------- texturas ---------- */
function carudeBannerTex() {
  const c = cnv(1024, 400), x = c.getContext('2d');
  const draw = () => {
    x.fillStyle = '#2b2b2b'; x.fillRect(0, 0, 1024, 400);
    x.fillStyle = '#f4efe6'; x.font = '900 120px "Big Shoulders Display", Barlow, sans-serif'; x.textBaseline = 'top'; x.fillText('CARUD\'E', 40, 30);
    x.fillStyle = '#f4efe6'; x.fillRect(540, 38, 300, 110); x.fillStyle = '#2b2b2b'; x.fillText('ROCK', 556, 30);
    x.fillStyle = '#f4efe6'; x.font = '900 52px "Big Shoulders Display", Barlow, sans-serif'; x.fillText('20', 860, 36); x.fillText('24', 860, 90);
    x.font = '400 46px Barlow, sans-serif'; x.fillText('ESTA NOITE NON SE DORME', 40, 175);
    x.fillStyle = '#e8283e'; x.font = '900 54px "Big Shoulders Display", Barlow, sans-serif'; ['DELOREANS · 7 ROJO', 'ZËNZAR · MÁRTIRES DEL ROCK\'N\'ROLL'].forEach((t, i) => x.fillText(t, 40, 250 + i * 64));
    if (CARUDE_LOGO.img) x.drawImage(CARUDE_LOGO.img, 840, 150, 140, 241);
  };
  draw(); const t = toTex(c, false); withCarudeLogo(() => { draw(); t.needsUpdate = true; }); return t;
}
function carudeShirtTex() {
  const c = cnv(256, 256), x = c.getContext('2d');
  const draw = () => {
    x.fillStyle = '#2b2b2b'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${RR(0.01, 0.04)})`; x.fillRect(R() * 256, R() * 256, 2, 2); }
    // fronte da camiseta no centro da textura (o cilindro mira a +z en u = 0; desprazamos 0.5)
    if (CARUDE_LOGO.img) x.drawImage(CARUDE_LOGO.img, 106, 70, 44, 76);
    x.fillStyle = '#f4efe6'; x.font = '900 15px "Big Shoulders Display", Barlow, sans-serif'; x.textAlign = 'center'; x.fillText('CARUD\'E ROCK', 128, 162);
    // costas: nomes das bandas
    x.font = '700 12px Barlow, sans-serif'; ['DELOREANS', '7 ROJO', 'ZËNZAR', 'MÁRTIRES'].forEach((t, i) => { x.fillStyle = '#e8283e'; x.fillText(t, 0 + 14 + 28, 90 + i * 16); x.fillText(t, 256 - 14 - 28, 90 + i * 16); });
  };
  draw(); const t = toTex(c, false); t.wrapS = THREE.RepeatWrapping; t.offset.x = 0.5; withCarudeLogo(() => { draw(); t.needsUpdate = true; }); return t;
}
/* ---------- escenario ---------- */
function makeSpeakerStack(n) {
  const g = new THREE.Group(), box = std({ color: 0x141416, roughness: 0.6 }), grill = std({ color: 0x2a2a2e, roughness: 0.9 }), cone = std({ color: 0x0a0a0c, roughness: 0.4 });
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.95, 0.9), box); b.position.y = 0.48 + i * 0.97; b.castShadow = true; g.add(b);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.83), grill); f.position.set(0, b.position.y, 0.452); g.add(f);
    for (const sx of [-0.27, 0.27]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.22, 18), cone); c.position.set(sx, b.position.y, 0.455); g.add(c); }
  }
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0x3bff6a })); led.position.set(0.5, 0.15, 0.46); g.add(led);
  g.userData.led = led; return g;
}
function makeGuitar(col) {
  const g = new THREE.Group(), m = std({ color: col, roughness: 0.35, metalness: 0.2 }), dk = std({ color: 0x1a1a1a, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.06), m); g.add(body);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.035), dk); neck.position.y = 0.5; g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.03), dk); head.position.y = 0.85; g.add(head);
  return g;
}
function buildCarude() {
  const F = LM.carude; if (!F) return;
  const C = G.carude = { F, group: new THREE.Group(), fans: [], band: [], speakers: [], beams: [], sab: false, moved: false, prevHour: G.hour, days: 0, lightsOn: true };
  const g = C.group; G.scene.add(g);
  const blk = std({ color: 0x18181a, roughness: 0.8 }), truss = std({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 });
  const mk = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  mk(new THREE.BoxGeometry(13, 1.9, 6.4), blk, 0, 0.35, -9);           // plataforma (afunde un pouco para tapar a pendente)
  mk(new THREE.BoxGeometry(13, 0.05, 6.4), std({ color: 0x2a2a2e, roughness: 0.6 }), 0, 1.32, -9);
  for (const sx of [-6.3, 6.3]) for (const sz of [-12, -6]) mk(new THREE.BoxGeometry(0.3, 7.2, 0.3), truss, sx, 3.6, sz);
  for (const sz of [-12, -6]) mk(new THREE.BoxGeometry(12.9, 0.3, 0.3), truss, 0, 7.1, sz);
  for (const sx of [-6.3, 6.3]) mk(new THREE.BoxGeometry(0.3, 0.3, 6.3), truss, sx, 7.1, -9);
  const roof = mk(new THREE.BoxGeometry(13.2, 0.08, 6.8), std({ color: 0x101012, roughness: 0.9 }), 0, 7.35, -9);
  const ban = mk(new THREE.PlaneGeometry(12.2, 4.8), std({ map: carudeBannerTex(), roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.12 }), 0, 4.0, -11.8);
  ban.material.emissiveMap = ban.material.map;
  // batería no escenario
  { const kit = new THREE.Group(); kit.position.set(0, 1.35, -10.5); g.add(kit); const dr = std({ color: 0xe8283e, roughness: 0.4 }), sk = std({ color: 0xeeeeea, roughness: 0.5 });
    const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 20), dr); bd.rotation.x = Math.PI / 2; bd.position.set(0, 0.42, 0.5); kit.add(bd);
    const lg = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), sk); lg.position.set(0, 0.42, 0.705); kit.add(lg);
    for (const [x, y, z] of [[-0.5, 0.7, 0.6], [0.5, 0.65, 0.65], [0.25, 0.85, 0.4]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16), dr); t.position.set(x, y, z); kit.add(t); }
    for (const [x, y] of [[-0.85, 1.2], [0.85, 1.3]]) { const cy = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.015, 18), std({ color: 0xc9a440, metalness: 0.9, roughness: 0.25 })); cy.position.set(x, y, 0.6); kit.add(cy); } }
  // altofalantes: torres a ambos lados e monitores
  for (const [x, z, n] of [[-7.8, -7.2, 3], [7.8, -7.2, 3], [-7.8, -10.4, 2], [7.8, -10.4, 2]]) { const s = makeSpeakerStack(n); s.position.set(x, 0, z); s.rotation.y = x < 0 ? 0.12 : -0.12; g.add(s); C.speakers.push({ g: s, lx: x, lz: z + 0.6, top: n * 0.97 }); }
  // valado diante do escenario
  for (let x = -6; x <= 6; x += 1.2) mk(new THREE.BoxGeometry(1.15, 1.1, 0.12), std({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 }), x, 0.55, -4.9);
  // focos de cores no teito
  for (let i = 0; i < 6; i++) {
    const piv = new THREE.Group(); piv.position.set(-5 + i * 2, 6.9, -6.2); g.add(piv);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: [0xe8283e, 0xffffff, 0xe8283e, 0xffb020, 0xe8283e, 0xffffff][i], transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.y = -4.5; piv.add(cone); C.beams.push({ piv, cone, ph: i * 1.3 });
  }
  const L1 = new THREE.PointLight(0xff3a4a, 0, 30, 1.6); L1.position.set(0, 6, -5); g.add(L1); C.light = L1;
  carudePlace(F);
}
function carudePlace(F) {
  const C = G.carude; C.F = F;
  const y0 = terrainH(F.ox, F.oz) - 0.3; C.y0 = y0;
  C.group.position.set(F.ox, y0 + 0.3, F.oz); C.group.rotation.y = F.rot;
}
function carudeTakePed(col) {
  const p = takePed(); if (!p) return null;
  Object.assign(p, { state: 'npc', home: 'npc', npc: 'carude', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null });
  Object.assign(p.col, col); world.crowd.paint(p); repaintArms(p, col.shirt);
  return p;
}
function initCarudeCrowd() {
  const C = G.carude; if (!C || C.crowdInit) return; C.crowdInit = true;
  const shirtM = new THREE.MeshStandardMaterial({ map: carudeShirtTex(), roughness: 0.9 }), torsoGeo = world.crowd.meshes.torso.geometry.clone(); torsoGeo.scale(1.05, 1.0, 1.07);
  // banda: guitarra, baixo e batería
  const bandDef = [{ lx: -3, lz: -8.6, inst: 'gtr', col: 0xe8283e }, { lx: 3, lz: -8.6, inst: 'bass', col: 0x2a2a2e }, { lx: 0, lz: -10.9, inst: 'drums' }, { lx: 0, lz: -7.6, inst: 'voz' }];
  for (const b of bandDef) {
    const p = carudeTakePed({ shirt: '#151515', pants: '#151515', shoe: '#151515', hair: pick(['#151515', '#3a2a1c', '#5a4a3a']), sleeve: true }); if (!p) break;
    const o = { p, ...b, ph: R() * 6 };
    if (b.inst === 'gtr' || b.inst === 'bass') { o.instM = makeGuitar(b.col); G.scene.add(o.instM); }
    if (b.inst === 'voz') { o.mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), std({ color: 0x222222 })); G.scene.add(o.mic); }
    C.band.push(o);
  }
  // seguridade (para a persecución)
  C.staff = [];
  for (let i = 0; i < 2; i++) { const p = carudeTakePed({ shirt: '#f2c21b', pants: '#151515', sleeve: false }); if (p) C.staff.push({ p, lx: i ? 7 : -7, lz: -4.3 }); }
  const N = 20;
  for (let i = 0; i < N; i++) {
    const p = carudeTakePed({ shirt: '#2b2b2b', sleeve: R() < 0.7 }); if (!p) break;
    const lx = RR(-7.5, 7.5), lz = RR(-3.6, 9);
    const ov = new THREE.Mesh(torsoGeo, shirtM); ov.matrixAutoUpdate = false; ov.castShadow = true; G.scene.add(ov);
    C.fans.push({ p, lx, lz, ph: R() * 6, style: R() < 0.7 ? 0 : R() < 0.5 ? 1 : 2, ov, jump: R() < 0.75 });
  }
}
/* ---------- misión ---------- */
function carudeQ() {
  if (G.story) return G.story.flags.carude || (G.story.flags.carude = { state: 'none', day: 0 });
  return save.carude || (save.carude = { state: 'none', day: 0 });
}
function carudeMoney(n) { if (G.story && typeof money === 'function') money(n); else addMoney(n); }
function carudeVirginiaLines() {
  const Q = carudeQ(), C = G.carude;
  if (Q.state === 'none') return [
    VB('Axuda? Pois mira, si! Estes días hai un festival na Praza de Carude: o Carud\'e Rock. Guitarras eléctricas ata as tantas, berros, batería... «Esta noite non se dorme», di o cartel. Literal!'),
    VB('Os veciños non pegan ollo, as galiñas de Carude non poñen e a señora Pura xa vai polo terceiro tapón de cera. E quen lle deu o permiso? O alcalde, claro!'),
    PCH('Grrr...'),
    VB('Necesito que o sabotees. Achégate a un dos altofalantes do festival e... fai o que teñas que facer. Que se apague esa música!', {
      choices: [
        { t: 'Conta comigo', fn: () => [VB('Así me gusta! Pacheco, mira: un veciño de verdade. Vai á Praza de Carude e non te deixes ver... moito.'), () => carudeAccept()] },
        { t: 'A min gústame o rock...', fn: () => [VB('E a min o silencio! Pensao. Se cambias de idea, xa sabes onde estou: berrando.')] },
      ],
    }),
  ];
  if (Q.state === 'go') return [VB('Aínda soa o Carud\'e Rock! Óese dende aquí! Á Praza de Carude, xa! Un altofalante, ti e a túa imaxinación.')];
  if (Q.state === 'done') return [
    VB('SILENCIO EN CARUDE! Os veciños durmiron coma anxos. Ben, todos menos o do número 12, que ronca peor ca un altofalante.'),
    VB('Xa me contaron COMO o fixeches... Pacheco tapou os ollos. Pero o fin xustifica os medios. Toma: vinte euros da caixa da asociación.'),
    () => { Q.state = 'paid'; carudeMoney(20); persist(); toast('Misión cumprida: Sabotaxe no Carud\'e Rock (+20 €)', 4); },
  ];
  if (C && C.moved) return [VB('Mudaron o festival á Praza da Compañía! E agora o alcalde apúntase o mérito! Ese home é capaz de inaugurar a súa propia derrota!'), PCH('GUAU!')];
  return [VB('O Carud\'e Rock calou. Agora só falta que cale o alcalde.')];
}
function carudeAccept() {
  const Q = carudeQ(); Q.state = 'go'; persist();
  const [x, z] = LM.carude.pt(0, 4); setWaypoint(x, z);
  toast('Nova misión: sabotea o Carud\'e Rock na Praza de Carude (marcada no GPS)', 5);
  if (G.sfx.checkpoint) G.sfx.checkpoint();
}
function carudeNearSpeaker() {
  const C = G.carude, Q = carudeQ(); if (!C || C.sab || C.moved || Q.state !== 'go' || G.player.car || G.cine || G.dialog) return null;
  const me = G.player.ped;
  for (const s of C.speakers) { const [x, z] = C.F.pt(s.lx, s.lz + 0.4); if (Math.hypot(me.x - x, me.z - z) < 2.4) return s; }
  return null;
}
function carudeInteract() { const s = carudeNearSpeaker(); if (!s) return false; startPee(s); return true; }
/* ---------- a sabotaxe: Avelino baixa os pantalóns e... ---------- */
function carudeBoxersMat() {
  const c = cnv(128, 64), x = c.getContext('2d'); x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, 128, 64);
  x.fillStyle = '#e8283e'; for (let i = 0; i < 14; i++) { const u = (i * 37) % 128, v = (i * 23) % 64; x.beginPath(); x.arc(u - 3, v, 3.4, 0, 7); x.arc(u + 3, v, 3.4, 0, 7); x.moveTo(u - 6.4, v + 1); x.lineTo(u, v + 8); x.lineTo(u + 6.4, v + 1); x.fill(); }
  return new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.8 });
}
function pantsDown(on) {
  const me = G.player.ped, H = me.hero; if (!H) return;
  if (!H.origMats) H.origMats = { hips: H.obj.hips[0].children.map(m => m.material), thigh: H.obj.thigh.map(o => o.children[0].material) };
  if (on) {
    const skinM = H.obj.head[0].children[1].material; H.boxM = H.boxM || carudeBoxersMat();
    H.obj.hips[0].children[0].material = H.boxM; H.obj.hips[0].children[1].visible = false;
    H.obj.thigh.forEach(o => { o.children[0].material = skinM; });
  } else {
    H.obj.hips[0].children[0].material = H.origMats.hips[0]; H.obj.hips[0].children[1].visible = true;
    H.obj.thigh.forEach((o, i) => { o.children[0].material = H.origMats.thigh[i]; });
  }
}
function startPee(s) {
  const C = G.carude, me = G.player.ped, [sx, sz] = C.F.pt(s.lx, s.lz);
  const [ax, az] = C.F.pt(s.lx, s.lz + 1.1);
  if (!G.peeDrops) { const geo = new THREE.SphereGeometry(0.018, 6, 4), mat = new THREE.MeshStandardMaterial({ color: 0xf2d43a, emissive: 0x6a5a10, transparent: true, opacity: 0.85, roughness: 0.2 }); G.peeDrops = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; G.scene.add(m); G.peeDrops.push({ m, life: 0, vx: 0, vy: 0, vz: 0 }); } }
  if (!C.meSpeech) { C.meSpeech = { p: me }; curritoSpeech(C.meSpeech); }
  G.cine = { pee: true, t: 0, sx, sz, ax, az, s, look: new THREE.Vector3(sx, me.y + 1, sz), emit: 0, phase: 0 };
  $('hud').classList.add('cine');
}
function peeSound(on) {
  const A = G.sfx; if (!A || !A.ac) return; const ac = A.ac;
  if (on && !G.peeSnd) { const s = ac.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 1.2; const g = ac.createGain(); g.gain.value = 0.06; s.connect(f); f.connect(g); g.connect(A.out); s.start(); G.peeSnd = { s, g }; }
  if (!on && G.peeSnd) { G.peeSnd.g.gain.setTargetAtTime(0, ac.currentTime, 0.05); const s = G.peeSnd.s; setTimeout(() => { try { s.stop(); } catch (e) { } }, 300); G.peeSnd = null; }
}
function carudeShort() {
  const A = G.sfx; if (!A || !A.ac) return; const ac = A.ac, t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.9); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 1.05);
  for (let i = 0; i < 5; i++) { const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000; const gg = ac.createGain(); const tt = t + i * 0.09 + R() * 0.04; gg.gain.setValueAtTime(0.3, tt); gg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.06); s.connect(f); f.connect(gg); gg.connect(A.out); s.start(tt); s.stop(tt + 0.08); }
}
function updatePee(dt) {
  const K = G.cine, C = G.carude, me = G.player.ped; K.t += dt;
  const t = K.t;
  // 1) colócase diante do altofalante
  if (t < 0.7) { const k = Math.min(1, dt * 5); me.x = lerp(me.x, K.ax, k); me.z = lerp(me.z, K.az, k); me.walk = 0.6; me.phase += dt * 5; me.y = groundH(me.x, me.z); }
  else me.walk = 0;
  me.yaw += angDiff(me.yaw, Math.atan2(K.sx - me.x, K.sz - me.z)) * Math.min(1, dt * 8);
  if (t > 0.7 && K.phase === 0) { K.phase = 1; pantsDown(true); curritoSay(C.meSpeech, 'Eh You... isto vai por Virginia!', 2.2); }
  // 2) o chorro
  const peeing = t > 1.1 && t < 3.6;
  if (peeing && !G.peeSnd) peeSound(true);
  if (!peeing && G.peeSnd) peeSound(false);
  me.arms = t > 0.8 && t < 3.8 ? [-0.5, -0.35, 0.9, -0.5, 0.35, 0.9] : null; me.nod = t > 0.8 && t < 3.8 ? 0.35 : 0;
  const fx = Math.sin(me.yaw), fz = Math.cos(me.yaw);
  if (peeing) { K.emit += dt * 70; while (K.emit > 1) { K.emit--; const d = G.peeDrops.find(q => q.life <= 0); if (!d) break; d.life = 0.7; d.m.visible = true; d.m.position.set(me.x + fx * 0.2, me.y + 0.86 * me.scale, me.z + fz * 0.2); const sp = 2.1 + RR(-0.1, 0.1); d.vx = fx * sp + RR(-0.05, 0.05); d.vz = fz * sp + RR(-0.05, 0.05); d.vy = 1.0 + RR(-0.1, 0.1); } }
  for (const d of G.peeDrops) { if (d.life <= 0) continue; d.life -= dt; d.vy -= 9.8 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt; if (d.life <= 0 || d.m.position.y < groundH(d.m.position.x, d.m.position.z)) { d.life = 0; d.m.visible = false; } }
  // 3) curtocircuíto
  if (t > 2.7 && K.phase === 1) {
    K.phase = 2; C.sab = true; C.lightsOn = false; carudeShort(); G.shake = 0.4;
    const top = K.s.top; for (let i = 0; i < 14; i++) world.smoke.emit(K.sx + RR(-0.4, 0.4), C.y0 + 0.3 + RR(0.2, top), K.sz + RR(-0.3, 0.3), RR(-0.3, 0.3), RR(0.6, 1.4), RR(-0.3, 0.3), 0.5, 2.2, i % 3 ? 0x333333 : 0xffd060, 0.7);
    for (const s of C.speakers) s.g.userData.led.material.color.setHex(0x220000);
    C.booT = 0;
  }
  if (t > 3.7 && K.phase === 2) { K.phase = 3; pantsDown(false); curritoSay(C.meSpeech, 'Ups...', 1.4); }
  if (t > 4.6) {
    me.arms = null; me.nod = 0; G.cine = null; $('hud').classList.remove('cine');
    C.chase = { t: 22, hits: 0 };
    toast('Apagaches o Carud\'e Rock! CORRE, que a seguridade do festival vai por ti!', 4);
    if (G.sfx.alert) G.sfx.alert();
  }
  if (C.meSpeech.speech) { C.meSpeech.speech.position.set(me.x, me.y + 2.5, me.z); if (C.meSpeech.speechHold > 0) { C.meSpeech.speechHold -= dt; if (C.meSpeech.speechHold <= 0) C.meSpeech.speech.visible = false; } }
  return true;
}
function peeCamera(dt) {
  const K = G.cine, me = G.player.ped, fx = Math.sin(me.yaw), fz = Math.cos(me.yaw), rx = Math.cos(me.yaw), rz = -Math.sin(me.yaw);
  // de lado e un pouco por detrás: vese o chorro, non o resto (é un xogo para todos os públicos)
  const tgt = new THREE.Vector3(me.x - rx * 3.4 - fx * 1.6, me.y + 1.6, me.z - rz * 3.4 - fz * 1.6), look = new THREE.Vector3(me.x + fx * 0.9, me.y + 0.9, me.z + fz * 0.9);
  if (!K.camInit) { camera.position.copy(tgt); K.look.copy(look); K.camInit = true; }
  camera.position.lerp(tgt, 1 - Math.pow(0.05, dt)); K.look.lerp(look, 1 - Math.pow(0.05, dt));
  camera.lookAt(K.look); camera.fov = lerp(camera.fov, 50, dt * 2); camera.updateProjectionMatrix();
}
/* ---------- música rock (sintetizada) ---------- */
function carudeMusic(dt) {
  const A = G.sfx, C = G.carude; if (!A || !A.ac || !C) return;
  const ac = A.ac, cp = camera.position, d = Math.hypot(cp.x - C.F.ox, cp.z - C.F.oz);
  const on = !C.sab || C.moved;
  const vol = on ? clamp(1 - d / 120, 0, 1) ** 1.5 * 0.9 : 0;
  let M = C.mus;
  if (!M) {
    M = C.mus = { g: ac.createGain(), next: ac.currentTime + 0.1, step: 0 }; M.g.gain.value = 0; M.g.connect(A.out);
    // distorsión compartida para as guitarras
    const ws = ac.createWaveShaper(), n = 1024, curve = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; curve[i] = Math.tanh(x * 9) * 0.6; } ws.curve = curve; ws.oversample = '2x';
    const pre = ac.createGain(); pre.gain.value = 0.7; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; const post = ac.createGain(); post.gain.value = 0.32;
    pre.connect(ws); ws.connect(lp); lp.connect(post); post.connect(M.g); M.gtr = pre;
  }
  M.g.gain.setTargetAtTime(G.paused ? 0 : vol, ac.currentTime, on ? 0.25 : 0.04);
  if (vol < 0.01) { M.next = ac.currentTime + 0.1; return; }
  const st = 60 / CAR.bpm / 2; // corcheas
  const nf = m => 440 * Math.pow(2, (m - 69) / 12);
  const prog = [40, 40, 43, 45, 40, 40, 48, 47];
  while (M.next < ac.currentTime + 0.25) {
    const t = M.next, i = M.step % 8, bar = Math.floor(M.step / 8) % prog.length, root = prog[bar];
    const hit = (f, dur, v, type = 'highpass') => { const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(M.g); s.start(t); s.stop(t + dur + 0.05); };
    // bombo, caixa, charles e crash
    if (i === 0 || i === 4 || i === 5) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15); g.gain.setValueAtTime(0.75, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(M.g); o.start(t); o.stop(t + 0.25); }
    if (i === 2 || i === 6) { hit(1800, 0.16, 0.42, 'bandpass'); hit(5000, 0.1, 0.18); }
    hit(8000, i % 2 ? 0.03 : 0.05, 0.08);
    if (i === 0 && bar % 4 === 0) hit(6000, 1.1, 0.16);
    // guitarra: acorde de quinta en corcheas (palm mute agás no primeiro tempo)
    { const open = i === 0 || i === 3, dur = open ? st * 1.6 : st * 0.6;
      for (const m of [root, root + 7, root + 12]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(nf(m), t); o.detune.value = RR(-8, 8); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(open ? 0.32 : 0.2, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(M.gtr); o.start(t); o.stop(t + dur + 0.02); } }
    // baixo
    { const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 420; o.type = 'sawtooth'; o.frequency.setValueAtTime(nf(root - 12), t); g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + st * 0.9); o.connect(fl); fl.connect(g); g.connect(M.g); o.start(t); o.stop(t + st); }
    // berro do público de vez en cando
    if (i === 0 && bar === 0 && R() < 0.5) hit(900, 1.4, 0.06, 'bandpass');
    M.next += st; M.step++;
  }
}
/* ---------- actualización ---------- */
function updateCarude(dt) {
  const C = G.carude; if (!C) return;
  if (!C.crowdInit) initCarudeCrowd();
  const Q = carudeQ(), F = C.F, t = G.t, me = G.player.ped, beat = t * CAR.bpm / 60 * Math.PI * 2;
  // días que pasan (para mudar o festival ao día seguinte)
  if (G.hour < C.prevHour - 1) C.days++; C.prevHour = G.hour;
  if ((Q.state === 'done' || Q.state === 'paid') && !C.sab) C.sab = true;
  if ((Q.state === 'done' || Q.state === 'paid') && !C.moved && (Q.sabDay === undefined || C.days > Q.sabDay || Q.moved)) carudeMove();
  const playing = !C.sab || C.moved;
  // focos
  for (const b of C.beams) { b.piv.rotation.set(Math.sin(t * 1.3 + b.ph) * 0.5, 0, Math.cos(t * 1.1 + b.ph) * 0.4); b.cone.material.opacity = playing ? (0.06 + 0.2 * (G.night || 0)) * (0.6 + 0.4 * Math.abs(Math.sin(beat * 0.5 + b.ph))) : 0; }
  C.light.intensity = playing ? (0.4 + 1.6 * (G.night || 0)) * (0.6 + 0.4 * Math.abs(Math.sin(beat))) : 0;
  // público
  const dme = Math.hypot(me.x - F.ox, me.z - F.oz);
  for (const f of C.fans) {
    const p = f.p; let [x, z] = F.pt(f.lx, f.lz); p.x = x; p.z = z; p.walk = 0;
    const base = terrainH(x, z);
    if (playing) {
      const b = Math.sin(beat + f.ph * 0.2);
      p.y = base + (f.jump ? Math.max(0, b) * 0.24 : 0);
      if (f.style === 0) p.arms = [-2.85 + b * 0.18, 0.22, 0.25, -2.85 - b * 0.18, 0.22, 0.25];
      else if (f.style === 1) p.arms = [-0.3, 0.15, 0.3, -2.6 + Math.max(0, b) * 0.4, 0.1, 0.5];
      else p.arms = [-2.4 + b * 0.5, 0.6, 0.6, -2.4 - b * 0.5, 0.6, 0.6];
      p.nod = Math.max(0, Math.sin(beat * 2 + f.ph)) * 0.22;
      p.yaw = F.yaw(Math.PI) + Math.sin(f.ph + t * 0.3) * 0.25;
    } else {
      p.y = base; p.arms = null; p.nod = 0; p.armUp = 0;
      const ty = C.chase && dme < 40 ? Math.atan2(me.x - p.x, me.z - p.z) : F.yaw(Math.PI) + Math.sin(f.ph) * 0.8;
      p.yaw += angDiff(p.yaw, ty) * Math.min(1, dt * 3);
    }
  }
  // banda
  for (const o of C.band) {
    const p = o.p; let [x, z] = F.pt(o.lx, o.lz); p.x = x; p.z = z; p.y = C.y0 + 1.6 + (o.inst === 'drums' ? -0.25 : 0); p.walk = 0; p.yaw = F.yaw(0);
    const sc = p.scale, yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    if (playing) {
      if (o.inst === 'drums') { p.sit = 0.8; p.arms = [-1.0 + Math.sin(beat * 2) * 0.5, 0.3, 1.2, -1.0 - Math.sin(beat * 2) * 0.5, -0.3, 1.2]; p.nod = Math.abs(Math.sin(beat)) * 0.3; }
      else if (o.inst === 'voz') { p.arms = [-0.3, 0.1, 0.2, -2.0 + Math.sin(beat * 0.25) * 0.6, -0.2, 1.4]; p.nod = Math.max(0, Math.sin(beat)) * 0.2; }
      else { p.arms = [-0.9, -0.2, 1.5, -0.5 + Math.sin(beat * 2) * 0.25, 0.4, 1.3]; p.nod = Math.max(0, Math.sin(beat + o.ph)) * 0.45; }
    } else { p.arms = null; p.nod = -0.1; p.sit = o.inst === 'drums' ? 0.8 : 0; }
    if (o.instM) { o.instM.position.set(p.x + fx * 0.2, p.y + 1.15 * sc, p.z + fz * 0.2); o.instM.rotation.set(0, yaw, -1.1); }
    if (o.mic) { o.mic.position.set(p.x + fx * 0.45, p.y + 0.75, p.z + fz * 0.45); }
  }
  // bocadillos do público
  C.lineT = (C.lineT || 0) - dt;
  if (!C.say) { C.say = { p: null }; curritoSpeech(C.say); }
  if (C.lineT <= 0 && dme < 45 && C.fans.length) {
    const f = pick(C.fans); C.say.p = f.p; C.lineT = playing ? RR(4, 7) : RR(2, 3.5);
    curritoSay(C.say, playing ? pick(CARUDE_FAN_LINES) : C.chase ? pick(CARUDE_BOO) : pick(['Sen música non hai festa...', 'Quen foi o porco?', 'Vaia cheiro hai aquí...', 'Mañá máis, dixo o técnico']), 2.4);
  }
  if (C.say.p) C.say.speech.position.set(C.say.p.x, C.say.p.y + 2.5, C.say.p.z);
  if (C.say.speechHold > 0) { C.say.speechHold -= dt; if (C.say.speechHold <= 0) C.say.speech.visible = false; }
  // seguridade: persegue ao xogador despois da sabotaxe
  for (const s of C.staff) {
    const p = s.p;
    if (C.chase && !C.moved) {
      const dx = me.x - p.x, dz = me.z - p.z, d = Math.hypot(dx, dz);
      if (d > 0.9) { p.x += dx / d * 5.0 * dt; p.z += dz / d * 5.0 * dt; p.walk = 1; p.run = 1; p.phase += dt * 11; }
      else { p.walk = 0; p.run = 0; }
      p.yaw = Math.atan2(dx, dz); p.y = groundH(p.x, p.z);
      if (d < 1.0 && !G.player.car && (!s.cd || s.cd < G.t)) { s.cd = G.t + 2; C.chase.hits++; G.shake = 0.5; me.x += dx / (d || 1) * 1.2; me.z += dz / (d || 1) * 1.2; toast(pick(['Un segurata dáche un pontapé no traseiro!', 'O segurata: «Mexas onde mexes, mexas pagas!»', 'Ai! A seguridade do Carud\'e Rock non perdoa!']), 2.4); }
    } else { const [x, z] = F.pt(s.lx, s.lz); p.x = x; p.z = z; p.y = terrainH(x, z); p.walk = 0; p.run = 0; p.yaw = F.yaw(Math.PI); }
  }
  if (C.chase) {
    C.chase.t -= dt;
    if (Math.hypot(me.x - F.ox, me.z - F.oz) > 60 || C.chase.t <= 0 || G.player.car) {
      C.chase = null;
      if (Q.state === 'go') { Q.state = 'done'; Q.sabDay = C.days; persist(); toast('Escapaches! Sabotaxe completa: volve onde Virginia Bolsas no Malecón', 5); if (G.sfx.checkpoint) G.sfx.checkpoint(); if (G.virginia) setWaypoint(G.virginia.p.x, G.virginia.p.z); }
    }
  }
  if (carudeNearSpeaker()) setPrompt(`${isTouch ? '★' : 'E'} · Sabotear o altofalante`);
  carudeMusic(dt);
}
/* o día seguinte: o festival na Praza da Compañía e o alcalde presumindo */
function carudeMove() {
  const C = G.carude; if (C.moved || !LM.comp) return;
  C.moved = true; const Q = carudeQ(); Q.moved = true; persist();
  carudePlace(carudeCompFrame());
  for (const s of C.speakers) s.g.userData.led.material.color.setHex(0x3bff6a);
  const M = G.mayor;
  if (M) { const [x, z] = C.F.pt(9.5, -1.5); M.home = { x, z }; M.homeYaw = C.F.yaw(-Math.PI / 2 - 0.4); M.p.x = x; M.p.z = z; }
  if (C.days > 0 || Q.sabDay !== undefined) toast('O Carud\'e Rock múdase á Praza da Compañía... e The Mayor xa está alí presumindo', 5);
}
/* despois da pose: camisetas do festival */
function carudeOverlays() {
  const C = G.carude; if (!C) return;
  const cam = camera.position;
  for (const f of C.fans) { const near = f.p.visible && Math.hypot(f.p.x - cam.x, f.p.z - cam.z) < 90; f.ov.visible = near; if (near) { pedMatrix('torso', f.p.idx, f.ov.matrix); f.ov.matrixWorldNeedsUpdate = true; } }
}
