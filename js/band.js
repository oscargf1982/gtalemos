'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Parque dos Condes: The Mayor e o concerto
   de «Los Roncolas» diante da gran fonte
   (personaxes e grupo orixinais do xogo)
   ========================================================== */
G.band = null;
G.mayor = null;

/* ---------- escenario ---------- */
function bandFrame() {
  const c = LM.parkC, g = G.parkGate || { x: c.x + 30, z: c.z };
  let dx = g.x - c.x, dz = g.z - c.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  // escenario a 17 m da fonte, mirando cara á entrada do parque (de costas á fonte)
  return makeFrame(c.x + dx * 17, c.z + dz * 17, Math.atan2(dx, dz));
}
function roncolasTex() {
  const c = cnv(1024, 300), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#f6efe0'); g.addColorStop(1, '#e8dcc2'); x.fillStyle = g; x.fillRect(0, 0, 1024, 300);
  x.strokeStyle = '#1b1b1d'; x.lineWidth = 10; x.strokeRect(10, 10, 1004, 280);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '900 150px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillText('LOS RONCOLAS', 520, 160);
  x.fillStyle = '#b3201f'; x.fillText('LOS RONCOLAS', 512, 150);
  x.font = '700 34px Barlow, sans-serif'; x.fillStyle = '#1b1b1d'; x.fillText('★  ROCK · SKA · SWING  ★  EN DIRECTO NO PARQUE DOS CONDES  ★', 512, 258);
  return toTex(c, false);
}
function buildBandStage(B, scene) {
  if (!LM.parkC) return;
  const F = bandFrame(), y0 = terrainH(F.ox, F.oz);
  const g = new THREE.Group(); g.position.set(F.ox, y0, F.oz); g.rotation.y = F.rot; scene.add(g);
  const black = std({ color: 0x1c1c1f, roughness: 0.7 }), metal = std({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.85 });
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  box(10, 1.0, 5, black, 0, 0.5, 0);                                        // tarima
  box(10.2, 0.06, 5.2, std({ color: 0x3a2a1e, roughness: 0.8 }), 0, 1.03, 0); // chan de madeira
  for (const s of [-1, 1]) box(1.2, 0.5, 0.8, black, s * 1.2, 0.25, 2.9);   // chanzos
  // estrutura de truss
  for (const [x, z] of [[-4.8, -2.3], [4.8, -2.3], [-4.8, 2.3], [4.8, 2.3]]) box(0.3, 6.2, 0.3, metal, x, 1 + 3.1, z);
  box(9.9, 0.35, 0.35, metal, 0, 7.1, -2.3); box(9.9, 0.35, 0.35, metal, 0, 7.1, 2.3);
  for (const s of [-1, 1]) box(0.35, 0.35, 4.9, metal, s * 4.8, 7.1, 0);
  // pancarta do grupo ao fondo
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.6), std({ map: roncolasTex(), roughness: 0.85 }));
  ban.position.set(0, 4.6, -2.25); g.add(ban);
  // bafles e monitores
  for (const s of [-1, 1]) { box(1.1, 1.7, 0.9, black, s * 5.7, 0.85, 1.8); box(1.1, 1.2, 0.9, black, s * 5.7, 2.3, 1.8); box(0.9, 0.45, 0.6, black, s * 2.4, 1.25, 2.1).rotation.x = -0.4; }
  // batería: bombo co logo, caixa, timbais e pratos
  const bombo = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 24), std({ color: 0xf2efe8, roughness: 0.5 })); bombo.rotation.x = Math.PI / 2; bombo.position.set(0, 1.6, -1.2); g.add(bombo);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), std({ map: textTex('RONCOLAS', { w: 256, h: 256, bg: '#f2efe8', fg: '#b3201f', size: 56 }), roughness: 0.5 })); logo.position.set(0, 1.6, -0.97); g.add(logo);
  for (const [x, z, r, h] of [[0.55, -0.9, 0.22, 1.85], [-0.45, -1.0, 0.18, 2.0], [0.25, -1.55, 0.2, 2.05], [0.9, -1.4, 0.3, 1.7]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 16), std({ color: 0xb3201f, roughness: 0.4, metalness: 0.3 })); t.position.set(x, h, z); g.add(t); }
  for (const [x, z, y] of [[-0.9, -0.9, 2.5], [1.2, -0.9, 2.6], [0.6, -1.9, 2.7]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 20), std({ color: 0xc9a440, roughness: 0.25, metalness: 0.95 })); c.position.set(x, y, z); c.rotation.z = 0.15; g.add(c); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, y - 1, 6), metal); st.position.set(x, 1 + (y - 1) / 2, z); g.add(st); }
  box(0.5, 0.5, 0.5, black, 0, 1.25, -2.0); // banqueta
  // micros
  for (const x of [-3.2, -1.3, 1.4, 3.2]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.55, 6), metal); st.position.set(x, 1.8, 0.95); g.add(st); const mic = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), black); mic.position.set(x, 2.6, 0.9); g.add(mic); }
  // amplificadores
  for (const x of [-3.6, 3.6]) box(0.8, 0.7, 0.45, std({ color: 0x2a2a2c, roughness: 0.6 }), x, 1.35, -1.7);
  // focos de cores e feixes
  const beams = [], cols = [0x22e0d0, 0x3cff9a, 0x2aa8ff, 0xff4fa0, 0xffd34a, 0x22e0d0];
  G.beamTex = G.beamTex || (() => { const c = cnv(32, 128), x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 128); return toTex(c, false); })();
  cols.forEach((col, i) => {
    const x = -4 + i * 1.6, head = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.35, 12), black); head.position.set(x, 6.8, 2.3); g.add(head);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 12), new THREE.MeshBasicMaterial({ color: col })); lens.position.set(x, 6.61, 2.3); lens.rotation.x = Math.PI / 2; g.add(lens);
    const piv = new THREE.Group(); piv.position.set(x, 6.6, 2.3); g.add(piv);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 20, 1, true), new THREE.MeshBasicMaterial({ color: col, map: G.beamTex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    beam.position.y = -3; piv.add(beam); beams.push({ piv, beam, ph: i * 1.1 });
  });
  addOBB(F.ox, F.oz, 5.1, 2.6, F.rot, 1.0, 'escenario', y0 - 1);
  for (const [lx, lz] of [[-5.7, 1.8], [5.7, 1.8]]) { const [x, z] = F.pt(lx, lz); addCircCol0(x, z, 0.7, 3, 'bafle'); }
  G.bandStage = { F, y: y0 + 1.06, beams, group: g };
  G.namedZones.unshift({ n: 'Concerto de Los Roncolas', p: frameRectPoly(F, -6, -3, 6, 9) });
}

/* ---------- instrumentos ---------- */
function makeGuitar(bodyCol, bass) {
  const g = new THREE.Group(), m = std({ color: bodyCol, roughness: 0.35, metalness: 0.1 }), wood = std({ color: 0x6b4423, roughness: 0.6 }), dark = std({ color: 0x151515, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(bass ? 0.2 : 0.18, bass ? 0.2 : 0.18, 0.06, 16), m); body.rotation.x = Math.PI / 2; body.scale.set(1, 1, 1.35); g.add(body);
  const pg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.065, 12), std({ color: 0xf2efe8, roughness: 0.4 })); pg.rotation.x = Math.PI / 2; pg.position.set(0.05, -0.04, 0.005); g.add(pg);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, bass ? 0.85 : 0.65, 0.03), wood); neck.position.set(0, (bass ? 0.85 : 0.65) / 2 + 0.18, 0); g.add(neck);
  const headst = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.03), dark); headst.position.set(0, (bass ? 0.85 : 0.65) + 0.25, 0); g.add(headst);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 4, 20, Math.PI), dark); strap.position.set(0, 0.25, -0.05); strap.rotation.z = Math.PI / 2 + 0.3; g.add(strap);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeSax() {
  const g = new THREE.Group(), brass = std({ color: 0xc9a440, roughness: 0.22, metalness: 0.95 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.55, 12), brass); g.add(tube);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.16, 16, 1, true), brass); bell.position.set(0.06, -0.3, 0.06); bell.rotation.z = -0.9; g.add(bell);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.2, 8), brass); neck.position.set(0, 0.34, 0.04); neck.rotation.x = 0.8; g.add(neck);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeHat() {
  const g = new THREE.Group(), m = std({ color: 0x18181a, roughness: 0.7 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 18), m); g.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 16), m); crown.position.y = 0.065; g.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.025, 16), std({ color: 0x7a1f3d })); band.position.y = 0.02; g.add(band);
  return g;
}
function makeShades() { const g = new THREE.Group(), m = std({ color: 0x050505, roughness: 0.1, metalness: 0.6 }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.035, 0.01), m); l.position.set(s * 0.045, 0, 0); g.add(l); } const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.01), m); b.position.y = 0.015; g.add(b); return g; }
function makeBraces() { const g = new THREE.Group(), m = std({ color: 0x141414, roughness: 0.6 }); for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.01), m); st.position.set(s * 0.09, 0, 0.13); g.add(st); const bk = st.clone(); bk.position.z = -0.13; g.add(bk); } return g; }

/* ---------- membros do grupo, The Mayor e público ---------- */
const RONCOLAS = [
  { id: 'baixo', name: 'Baixo', lx: -3.2, lz: 0.4, shirt: '#f2f0ea', pants: '#1a1a1c', hair: '#2a1d14', skin: '#e2b08c', inst: 'bass', col: 0xc77b30, shades: true, braces: true },
  { id: 'saxo', name: 'Saxo', lx: -1.3, lz: 0.6, shirt: '#2a2a2e', pants: '#1a1a1c', hair: '#3a2a1c', skin: '#d9a47e', inst: 'sax', hat: true },
  { id: 'bateria', name: 'Batería', lx: 0, lz: -1.9, shirt: '#f2f0ea', pants: '#2a2a2c', hair: '#d9a47e', skin: '#d9a47e', inst: 'drums', sit: true },
  { id: 'voz', name: 'Voz e guitarra', lx: 1.4, lz: 0.6, shirt: '#9a9fa6', pants: '#3a3d42', hair: '#1a120c', skin: '#c99872', inst: 'guitar', col: 0xf2efe8 },
  { id: 'guitarra', name: 'Guitarra', lx: 3.2, lz: 0.4, shirt: '#f2f0ea', pants: '#1a1a1c', hair: '#2a1d14', skin: '#e9bc98', inst: 'guitar', col: 0x9ec9a8, braces: true },
];
function takePed() { return world.crowd.peds.find(q => q.state === 'walk' && !q.npc && q !== G.player.ped); }
function initBand() {
  if (!G.bandStage) return;
  const S = G.bandStage, F = S.F, C = world.crowd, members = [];
  for (const m of RONCOLAS) {
    const p = takePed(); if (!p) break;
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'band', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: m.sit ? 0.75 : 0, lie: 0, armUp: 0, edge: null, female: false });
    const [x, z] = F.pt(m.lx, m.lz); p.x = x; p.z = z; p.y = S.y + (m.sit ? 0.15 : 0); p.yaw = F.yaw(0); p.scale = RR(1.0, 1.06);
    Object.assign(p.col, { shirt: m.shirt, pants: m.pants, hair: m.hair, skin: m.skin, shoe: '#111111', sleeve: true }); C.paint(p);
    const o = { ...m, p, ph: R() * 6 };
    if (m.inst === 'bass' || m.inst === 'guitar') { o.instM = makeGuitar(m.col, m.inst === 'bass'); G.scene.add(o.instM); }
    if (m.inst === 'sax') { o.instM = makeSax(); G.scene.add(o.instM); }
    if (m.hat) { o.hatM = makeHat(); G.scene.add(o.hatM); }
    if (m.shades) { o.shadesM = makeShades(); G.scene.add(o.shadesM); }
    if (m.braces) { o.bracesM = makeBraces(); G.scene.add(o.bracesM); }
    members.push(o);
  }
  // público diante do escenario
  const fans = [];
  for (let i = 0; i < 12; i++) {
    const p = takePed(); if (!p) break;
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'fan', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, edge: null });
    const side = i % 2 ? 1 : -1, lx = i < 6 ? side * RR(5.5, 9) : RR(-7, 7), lz = i < 6 ? RR(4.5, 10) : RR(11.5, 14.5), [x, z] = F.pt(lx, lz); p.x = x; p.z = z; p.y = terrainH(x, z); p.yaw = F.yaw(Math.PI) + RR(-0.3, 0.3); fans.push({ p, ph: R() * 6, jump: R() < 0.4 });
  }
  G.band = { members, fans, t: 0 };
  initEntourage();
}
const MAYOR_LINES = [
  'Contemplen a fonte! Douscentos chorros e nin un só concelleiro mollado.',
  'Esta fonte é obra miña. Os méritos, meus. As facturas, do mandato anterior.',
  'Silencio, cidadáns! Aquí eu teño o bastón de mando e vostedes, entradas de balde.',
  'Os de Lugo morren de envexa. Que garden partida e o intenten outra vez!',
  'Luces vermellas, verdes e azuis! Nin nos ordenadores da Xunta hai tanta cor.',
  'Los Roncolas? Trouxen eu. Sen min, isto sería un parque con banda sonora de grilos.',
  'Votádeme outra vez e desbloqueo outra fonte no Malecón. Logro garantido!',
];
function initMayor() {
  if (!LM.parkC) return;
  const c = LM.parkC;
  const F = G.bandStage ? G.bandStage.F : bandFrame(), [mx, mz] = F.pt(1.4, 4.2);
  const n = spawnNPC({ id: 'mayor', name: 'The Mayor', x: mx, z: mz, yaw: F.yaw(0), scale: 1.06, fat: 1.45, colors: { shirt: '#4b4f56', pants: '#4b4f56', skin: '#e7b996', hair: '#c9c6bf', shoe: '#121212', sleeve: true } });
  if (!n) return;
  repaintArms(n.p, '#4b4f56');
  n.pause = 0; n.lineT = 0; n.poseT = RR(3, 6); n.homeYaw = F.yaw(0); n.home = { x: mx, z: mz };
  // garabata verde e bigote canoso
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.02), std({ color: 0x1f7a3a, roughness: 0.6 })); G.scene.add(tie); n.tie = tie;
  const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.36), std({ color: 0xf4f2ec, roughness: 0.7, side: THREE.DoubleSide })); G.scene.add(shirt); n.shirtFront = shirt;
  const stache = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.03), std({ color: 0xd8d4cc, roughness: 0.9 })); G.scene.add(stache); n.stache = stache;
  // bocadillo de texto
  const c2 = cnv(512, 128); n.speechC = c2; n.speechT = toTex(c2, false);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: n.speechT, depthTest: false, transparent: true })); sp.scale.set(4.2, 1.05, 1); sp.renderOrder = 12; sp.visible = false; G.scene.add(sp); n.speech = sp;
  G.mayor = n;
}
function mayorSay(n, text) {
  const x = n.speechC.getContext('2d'); x.clearRect(0, 0, 512, 128);
  x.fillStyle = 'rgba(250,247,238,.96)'; x.strokeStyle = '#1b1b1d'; x.lineWidth = 5;
  x.beginPath(); x.roundRect ? x.roundRect(6, 6, 500, 96, 22) : x.rect(6, 6, 500, 96); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(240, 100); x.lineTo(256, 124); x.lineTo(272, 100); x.fill();
  x.fillStyle = '#1b1b1d'; x.textAlign = 'center'; x.textBaseline = 'middle';
  let fs = 34; x.font = `700 ${fs}px Barlow, sans-serif`;
  const words = text.split(' '), lines = ['']; for (const w of words) { const t = (lines[lines.length - 1] + ' ' + w).trim(); if (x.measureText(t).width > 470) lines.push(w); else lines[lines.length - 1] = t; }
  if (lines.length > 2) { fs = 26; x.font = `700 ${fs}px Barlow, sans-serif`; }
  lines.slice(0, 3).forEach((l, i, a) => x.fillText(l, 256, 54 + (i - (a.length - 1) / 2) * (fs + 4)));
  n.speechT.needsUpdate = true; n.speech.visible = true; n.speechHold = 7;
}
function talkMayor(n) {
  const M = t => ({ who: 'The Mayor', text: t });
  openDialog([
    M('Vaia, vaia! Un cidadán achégase sen cita previa. Vota vostede en Monforte? Non? Tanto ten: o voto non se pide, a admiración si.'),
    M('Contemple esta marabilla: a gran fonte do Parque dos Condes. O proxecto foi dun enxeñeiro, a idea foi miña e os aplausos, por suposto, tamén.'),
    M(pick(MAYOR_LINES), {
      choices: [
        { t: 'É moi bonita, señor alcalde', fn: () => [M('Magnífico! Por fin alguén con puntos de intelixencia suficientes. Tome: unha chapa conmemorativa e dez euros para un viño no Cardeal. Non o comente no Pleno.'), () => { save.mayorErrand = true; if (!save.mayorTip) { save.mayorTip = true; addMoney(10); persist(); } }] },
        { t: 'E canto custou?', fn: () => [M('Ah, a curiosidade! Ese vicio milenario que algúns practican coa destreza dun inspector de Facenda. Esa información está gardada nun disquete... que, casualmente, non atopo.'), M('Mire, un paxaro! E escoite: Los Roncolas comezan xa. Siga a música e deixe as contas para os contables.')] },
        { t: 'Para o próximo mandato, unha ponte no Malecón?', fn: () => [M('Shhh! Baixe a voz, que están os da Asociación na beira e teñen o botón de protestar sempre activado.'), M('Non á ponte, non á ponte... de momento. En política, como nas aventuras gráficas, os obxectos úsanse no capítulo axeitado.')] },
      ],
    }),
  ]);
}
function updateBand(dt) {
  const t = G.t, B = G.band, S = G.bandStage;
  const night = G.night || 0;
  if (S) for (const b of S.beams) {
    b.piv.rotation.set(Math.sin(t * 0.9 + b.ph) * 0.55, 0, Math.cos(t * 0.7 + b.ph) * 0.45);
    b.beam.material.opacity = (0.08 + 0.32 * night) * (0.65 + 0.35 * Math.sin(t * 3 + b.ph));
  }
  if (B) {
    const beat = t * 2.4 * Math.PI; // ~144 bpm partido
    for (const m of B.members) {
      const p = m.p, sc = p.scale, yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      p.walk = 0; p.nod = Math.max(0, Math.sin(beat + m.ph)) * 0.22; p.look = Math.sin(t * 0.5 + m.ph) * 0.25;
      if (m.inst === 'drums') { p.armUp = 0.45 + 0.35 * Math.abs(Math.sin(beat * 2)); p.wave = false; }
      else if (m.inst === 'sax') { p.armUp = 0.75 + 0.05 * Math.sin(beat); p.phase += dt * 2; }
      else { p.armUp = 0.3 + 0.25 * Math.abs(Math.sin(beat * 2 + m.ph)); }
      p.y = S.y + (m.sit ? 0.15 : 0) + (m.inst === 'drums' ? 0 : Math.abs(Math.sin(beat)) * 0.04);
      const chestY = p.y + 1.25 * sc, headY = p.y + (m.sit ? 1.3 : 1.73) * sc;
      if (m.instM) {
        if (m.inst === 'sax') { m.instM.position.set(p.x + fx * 0.28, chestY - 0.05, p.z + fz * 0.28); m.instM.rotation.set(0.35, yaw, 0.2); }
        else { m.instM.position.set(p.x + fx * 0.2 - rx * 0.05, chestY - 0.12, p.z + fz * 0.2 - rz * 0.05); m.instM.rotation.set(0, yaw, -1.05 + Math.sin(beat) * 0.03); }
      }
      if (m.hatM) { m.hatM.position.set(p.x, headY + 0.11 * sc, p.z); m.hatM.rotation.set(0, yaw, 0); }
      if (m.shadesM) { m.shadesM.position.set(p.x + fx * 0.115 * sc, headY + 0.02 * sc, p.z + fz * 0.115 * sc); m.shadesM.rotation.set(0, yaw, 0); }
      if (m.bracesM) { m.bracesM.position.set(p.x, p.y + 1.33 * sc, p.z); m.bracesM.rotation.set(0, yaw, 0); }
    }
    for (const f of B.fans) {
      const p = f.p; p.walk = 0; p.nod = Math.max(0, Math.sin(beat + f.ph)) * 0.2;
      p.armUp = f.jump ? 0.6 + 0.4 * Math.max(0, Math.sin(beat * 0.5 + f.ph)) : 0;
      p.y = terrainH(p.x, p.z) + (f.jump ? Math.max(0, Math.sin(beat + f.ph)) * 0.18 : 0);
    }
  }
  updateEntourage(dt); updateFireworks(dt);
  const n = G.mayor; if (!n) return;
  const p = n.p, me = G.player.ped, dme = Math.hypot(me.x - p.x, me.z - p.z);
  p.x = n.home.x; p.z = n.home.z; p.walk = 0;
  if (p.talking || G.dialog && dme < 5) { p.armUp = 0; p.wave = false; p.yaw += angDiff(p.yaw, Math.atan2(me.x - p.x, me.z - p.z)) * Math.min(1, dt * 4); }
  else {
    // posa para os fotógrafos: saúda, levanta o puño, sorrí...
    n.poseT -= dt;
    if (n.poseT <= 0) { n.pose = pick(['wave', 'wave', 'fist', 'still', 'still']); n.poseT = RR(2.5, 5); }
    p.wave = n.pose === 'wave'; p.armUp = n.pose === 'fist' ? lerp(p.armUp, 1, dt * 5) : lerp(p.armUp, 0, dt * 5);
    // mira aos fotógrafos, ou ao xogador se se achega
    const ty = dme < 9 ? Math.atan2(me.x - p.x, me.z - p.z) : n.homeYaw + Math.sin(G.t * 0.35) * 0.35;
    p.yaw += angDiff(p.yaw, ty) * Math.min(1, dt * 2.5);
  }
  p.y = terrainH(p.x, p.z);
  n.lineT -= dt;
  if (dme < 32 && n.lineT <= 0 && !G.dialog) { n.lineT = RR(8, 10); n.li = ((n.li || 0) + 1) % MAYOR_LINES.length; mayorSay(n, MAYOR_LINES[n.li]); }
  if (n.speechHold > 0) { n.speechHold -= dt; if (n.speechHold <= 0 || dme > 40) n.speech.visible = false; }
  const sc = p.scale, yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), fat = p.fat || 1;
  n.speech.position.set(p.x, p.y + 2.75 * sc, p.z);
  n.tie.position.set(p.x + fx * 0.13 * sc * fat * 0.92, p.y + 1.36 * sc, p.z + fz * 0.13 * sc * fat * 0.92); n.tie.rotation.set(0, yaw, 0);
  n.shirtFront.position.set(p.x + fx * 0.128 * sc * fat * 0.92, p.y + 1.4 * sc, p.z + fz * 0.128 * sc * fat * 0.92); n.shirtFront.rotation.set(0, yaw, 0);
  n.stache.position.set(p.x + fx * 0.11 * sc, p.y + 1.7 * sc, p.z + fz * 0.11 * sc); n.stache.rotation.set(0, yaw, 0);
}
/* ---------- comitiva do Mayor: a señora, o do sombreiro e os fotógrafos ---------- */
function makeBigHat() {
  const g = new THREE.Group(), m = std({ color: 0xd8c79a, roughness: 0.85 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.03, 28), m); g.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 20), m); crown.position.y = 0.22; g.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.06, 20), std({ color: 0x2a1d14, roughness: 0.6 })); band.position.y = 0.045; g.add(band);
  const fea = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.05), std({ color: 0xe8e2cf })); fea.position.set(0.17, 0.14, 0); fea.rotation.z = -0.4; g.add(fea);
  return g;
}
function makeCamera() {
  const g = new THREE.Group(), blk = std({ color: 0x111113, roughness: 0.45, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.08), blk); g.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.14, 12), blk); lens.rotation.x = Math.PI / 2; lens.position.z = 0.1; g.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.034, 12), std({ color: 0x5577aa, roughness: 0.05, metalness: 0.8 })); glass.position.z = 0.172; g.add(glass);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.05), blk); fl.position.set(0, 0.09, 0.01); g.add(fl);
  return g;
}
let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = cnv(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (_glowTex = toTex(c, false));
}
function npcPed(npc, col) {
  const p = takePed(); if (!p) return null;
  Object.assign(p, { state: 'npc', home: 'npc', npc, manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null });
  Object.assign(p.col, col); world.crowd.paint(p); return p;
}
function initEntourage() {
  const S = G.bandStage, M = G.mayor; if (!S) return;
  const F = S.F, E = G.entourage = { photogs: [], extras: [] };
  const place = (p, lx, lz) => { const [x, z] = F.pt(lx, lz); p.x = x; p.z = z; p.y = terrainH(x, z); p.yaw = F.yaw(0); };
  // señora maior, abrigo morado, moño gris e bolso
  const w = npcPed('dona', { shirt: '#5b2a6e', pants: '#5b2a6e', skin: '#ecc7ab', hair: '#cfcfd2', shoe: '#2a1a14', sleeve: true });
  if (w) {
    place(w, -0.2, 4.4); w.scale = 0.93; w.female = true; w.old = true;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, 0.55, 14), std({ color: 0x5b2a6e, roughness: 0.85 }));
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), std({ color: 0xcfcfd2, roughness: 0.9 }));
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.08), std({ color: 0x1a1a1a, roughness: 0.4 }));
    const pearls = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16), std({ color: 0xf6f1e4, roughness: 0.2 }));
    [skirt, bun, bag, pearls].forEach(o => G.scene.add(o));
    E.extras.push({ p: w, kind: 'dona', skirt, bun, bag, pearls });
  }
  // señor do sombreiro prominente
  const h = npcPed('sombreiro', { shirt: '#3d3329', pants: '#3d3329', skin: '#d9a47e', hair: '#4a3a2c', shoe: '#1a1410', sleeve: true });
  if (h) {
    place(h, 3.3, 4.4); h.scale = 1.04; h.fat = 1.2;
    repaintArms(h, '#3d3329');
    const hat = makeBigHat(); G.scene.add(hat);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.02), std({ color: 0xa8231f })); G.scene.add(bow);
    E.extras.push({ p: h, kind: 'sombreiro', hat, bow });
  }
  // fotógrafos en semicírculo diante do Mayor
  const [mx, mz] = M ? [M.home.x, M.home.z] : F.pt(1.4, 4.2);
  const cols = ['#c9b48a', '#1d2433', '#2a2a2a', '#6b7b5a', '#8a2a2a', '#c9b48a', '#3a4a6a', '#2a2a2a', '#a0a6ad'];
  const flashM = new THREE.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 9; i++) {
    const a = (i / 8 - 0.5) * 2.3, r = RR(4.2, 5.4);
    const p = npcPed('foto', { shirt: cols[i], pants: pick(['#2a2a2c', '#3a3d42', '#4a3a2a', '#1d2a4a']), skin: pick(['#e9bc98', '#d9a47e', '#c99872', '#f0cdb0']), hair: pick(['#2a1d14', '#1a120c', '#6a4a2a', '#9a9a9a']), shoe: '#151515', sleeve: R() < 0.5 });
    if (!p) break;
    const lx = 1.4 + Math.sin(a) * r, lz = 4.2 + Math.cos(a) * r;
    const [x, z] = F.pt(lx, lz); p.x = x; p.z = z; p.y = terrainH(x, z); p.yaw = Math.atan2(mx - x, mz - z); p.scale = RR(0.96, 1.06);
    const cam = makeCamera(); G.scene.add(cam);
    const fl = new THREE.Sprite(flashM.clone()); fl.scale.set(1.3, 1.3, 1); fl.visible = false; G.scene.add(fl);
    E.photogs.push({ p, cam, fl, t: 0, ph: R() * 6, crouch: false, cool: RR(0.3, 2), home: { x, z } });
  }
  E.light = new THREE.PointLight(0xf4f6ff, 0, 14, 2); G.scene.add(E.light); E.lightK = 0;
}
function updateEntourage(dt) {
  const E = G.entourage, M = G.mayor; if (!E) return;
  const t = G.t, me = G.player.ped, posing = M && (M.p.wave || M.p.armUp > 0.5);
  for (const e of E.extras) {
    const p = e.p, sc = p.scale, yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    p.walk = 0; p.y = terrainH(p.x, p.z);
    const dme = Math.hypot(me.x - p.x, me.z - p.z), base = G.bandStage.F.yaw(0) + (e.kind === 'dona' ? 0.25 : -0.25);
    p.yaw += angDiff(p.yaw, dme < 6 ? Math.atan2(me.x - p.x, me.z - p.z) : base + Math.sin(t * 0.3 + sc) * 0.3) * Math.min(1, dt * 2);
    const headY = p.y + 1.73 * sc;
    if (e.kind === 'dona') {
      p.wave = Math.sin(t * 0.5 + 1) > 0.75; p.nod = Math.max(0, Math.sin(t * 2.4 * Math.PI)) * 0.08;
      e.skirt.position.set(p.x, p.y + 0.62 * sc, p.z); e.skirt.rotation.set(0, yaw, 0);
      e.bun.position.set(p.x - fx * 0.1 * sc, headY + 0.1 * sc, p.z - fz * 0.1 * sc);
      e.bag.position.set(p.x - rx * 0.27 * sc, p.y + 0.9 * sc, p.z - rz * 0.27 * sc); e.bag.rotation.set(0, yaw, 0);
      e.pearls.rotation.set(-Math.PI / 2 + 0.3, yaw, 0, 'YXZ');
    } else {
      p.armUp = 0; p.wave = Math.sin(t * 0.43) > 0.82;
      e.hat.position.set(p.x, headY + 0.12 * sc, p.z); e.hat.rotation.set(-0.05, yaw, 0, 'YXZ');
      e.bow.position.set(p.x + fx * 0.13 * sc * 1.1, p.y + 1.5 * sc, p.z + fz * 0.13 * sc * 1.1); e.bow.rotation.set(0, yaw, 0);
    }
  }
  // fotógrafos: apuntan ao Mayor e disparan flashes
  const night = G.night || 0;
  let flashed = null;
  for (const f of E.photogs) {
    const p = f.p, sc = p.scale;
    p.x = f.home.x; p.z = f.home.z; p.walk = 0;
    const tgt = M ? M.p : null;
    if (tgt) p.yaw += angDiff(p.yaw, Math.atan2(tgt.x - p.x, tgt.z - p.z) + Math.sin(t * 0.7 + f.ph) * 0.12) * Math.min(1, dt * 3);
    p.sit = f.crouch ? 0.35 : 0; p.armUp = 1; p.wave = false;
    p.y = terrainH(p.x, p.z) - (f.crouch ? 0.35 * sc : 0);
    const yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), headY = p.y + 1.7 * sc;
    f.cam.position.set(p.x + fx * 0.24 * sc, headY + 0.02, p.z + fz * 0.24 * sc); f.cam.rotation.set(-0.08, yaw, 0, 'YXZ');
    f.cool -= dt; f.t -= dt;
    if (f.cool <= 0 && !G.paused) { f.t = 0.09; f.cool = posing ? RR(0.25, 1.4) : RR(0.9, 3.2); flashed = f; }
    f.fl.visible = f.t > 0;
    if (f.fl.visible) { f.fl.position.set(p.x + fx * 0.3 * sc, headY + 0.13, p.z + fz * 0.3 * sc); const k = 0.9 + night * 1.2; f.fl.scale.set(k, k, 1); }
  }
  if (flashed) { E.light.position.copy(flashed.fl.position); E.lightK = 1; }
  E.lightK = Math.max(0, E.lightK - dt * 9); E.light.intensity = E.lightK * (0.6 + night * 3);
}

/* ---------- fogos artificiais (de noite) ---------- */
const FW_N = 2600, FW_COLS = [0xff3b3b, 0x3bff6b, 0x3b8bff, 0xffd23b, 0xff3bd8, 0x3bf2ff, 0xffffff, 0xff8a2a];
function initFireworks() {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(FW_N * 3), col = new Float32Array(FW_N * 3);
  for (let i = 0; i < FW_N; i++) pos[i * 3 + 1] = -9999;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 3.2, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; G.scene.add(pts);
  const light = new THREE.PointLight(0xffffff, 0, 110, 2); G.scene.add(light);
  G.fw = { pts, pos, col, vx: new Float32Array(FW_N), vy: new Float32Array(FW_N), vz: new Float32Array(FW_N), life: new Float32Array(FW_N), max: new Float32Array(FW_N), base: new Float32Array(FW_N * 3), drag: new Float32Array(FW_N), head: 0, rockets: [], next: 1, light, lightK: 0 };
}
function fwSpark(x, y, z, vx, vy, vz, life, c, drag = 1.3) {
  const W = G.fw, i = W.head; W.head = (W.head + 1) % FW_N;
  W.pos[i * 3] = x; W.pos[i * 3 + 1] = y; W.pos[i * 3 + 2] = z; W.vx[i] = vx; W.vy[i] = vy; W.vz[i] = vz;
  W.life[i] = W.max[i] = life; W.drag[i] = drag;
  W.base[i * 3] = c.r; W.base[i * 3 + 1] = c.g; W.base[i * 3 + 2] = c.b;
}
function fwSound(x, z, kind) {
  const A = G.sfx; if (!A || !A.ac || G.paused) return;
  const ac = A.ac, cp = camera.position, d = Math.hypot(cp.x - x, cp.z - z), v = clamp(1 - d / 700, 0, 1) ** 1.3; if (v < 0.02) return;
  const t = ac.currentTime + (kind === 'boom' ? d / 340 : 0);
  if (kind === 'boom') {
    const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 380 + R() * 200;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    s.connect(fl); fl.connect(g); g.connect(A.out); s.start(t); s.stop(t + 1.4);
    const o = ac.createOscillator(), g2 = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    g2.gain.setValueAtTime(0.5 * v, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g2); g2.connect(A.out); o.start(t); o.stop(t + 0.65);
  } else {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(2400, t + 1.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035 * v, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 1.25);
  }
}
function fwBurst(r) {
  const W = G.fw, c1 = new THREE.Color(pick(FW_COLS)), c2 = new THREE.Color(pick(FW_COLS)), type = pick(['sphere', 'sphere', 'ring', 'willow', 'duo']);
  const n = type === 'willow' ? 170 : 150, sp = type === 'willow' ? RR(9, 12) : RR(12, 17);
  const gold = new THREE.Color(0xffc45a);
  // eixo do anel
  const ax = RR(-1, 1), az = RR(-1, 1);
  for (let k = 0; k < n; k++) {
    let dx, dy, dz;
    if (type === 'ring') { const a = k / n * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a) * 0.35 + ax * 0.2; dz = Math.sin(a) * 0.9 + az * 0.2; }
    else { const u = R() * 2 - 1, a = R() * Math.PI * 2, q = Math.sqrt(1 - u * u); dx = q * Math.cos(a); dy = u; dz = q * Math.sin(a); }
    const s = sp * (type === 'ring' ? 1 : RR(0.85, 1.05));
    const c = type === 'willow' ? gold : type === 'duo' && k % 2 ? c2 : c1;
    fwSpark(r.x, r.y, r.z, dx * s, dy * s, dz * s, type === 'willow' ? RR(2.6, 3.4) : RR(1.4, 2.1), c, type === 'willow' ? 2.2 : 1.4);
  }
  W.light.position.set(r.x, r.y, r.z); W.light.color.copy(type === 'willow' ? gold : c1); W.lightK = 1;
  fwSound(r.x, r.z, 'boom');
}
function updateFireworks(dt) {
  const S = G.bandStage; if (!S) return;
  if (!G.fw) initFireworks();
  const W = G.fw, F = S.F, night = G.night || 0, cp = camera.position;
  const near = Math.hypot(cp.x - F.ox, cp.z - F.oz) < 650;
  // lanzamentos detrás da fonte mentres é de noite
  W.next -= dt;
  if (night > 0.45 && near && W.next <= 0 && !G.paused) {
    const salvo = R() < 0.25 ? 3 : 1;
    for (let k = 0; k < salvo; k++) {
      const [x, z] = F.pt(RR(-16, 16), RR(-40, -28)), y = terrainH(x, z) + 0.5;
      W.rockets.push({ x, y, z, vx: RR(-1.5, 1.5), vy: RR(27, 33), vz: RR(-1.5, 1.5), fuse: RR(1.25, 1.7) + k * 0.15 });
      fwSound(x, z, 'whistle');
    }
    W.next = salvo > 1 ? RR(2.2, 3.5) : RR(0.6, 1.8);
  }
  const trail = new THREE.Color(0xffd9a0);
  for (let i = W.rockets.length - 1; i >= 0; i--) {
    const r = W.rockets[i];
    r.vy -= 9 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt; r.fuse -= dt;
    if (R() < 0.9) fwSpark(r.x, r.y, r.z, RR(-0.6, 0.6), RR(-2, 0), RR(-0.6, 0.6), RR(0.35, 0.6), trail, 2);
    if (r.fuse <= 0) { fwBurst(r); W.rockets.splice(i, 1); }
  }
  // chispas
  const P = W.pos, C = W.col;
  for (let i = 0; i < FW_N; i++) {
    if (W.life[i] <= 0) { if (P[i * 3 + 1] > -9000) { P[i * 3 + 1] = -9999; C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = 0; } continue; }
    W.life[i] -= dt;
    const d = Math.exp(-dt * W.drag[i]); W.vx[i] *= d; W.vz[i] *= d; W.vy[i] = W.vy[i] * d - 5.5 * dt;
    P[i * 3] += W.vx[i] * dt; P[i * 3 + 1] += W.vy[i] * dt; P[i * 3 + 2] += W.vz[i] * dt;
    const f = Math.max(0, W.life[i] / W.max[i]), k = f * f * (0.75 + 0.25 * Math.sin(i + G.t * 30));
    C[i * 3] = W.base[i * 3] * k; C[i * 3 + 1] = W.base[i * 3 + 1] * k; C[i * 3 + 2] = W.base[i * 3 + 2] * k;
  }
  W.pts.geometry.attributes.position.needsUpdate = true; W.pts.geometry.attributes.color.needsUpdate = true;
  W.lightK = Math.max(0, W.lightK - dt * 2.2); W.light.intensity = W.lightK * 1.3 * night;
}

/* música do grupo: ska-rock sintetizado, soa máis forte canto máis preto */
function updateBandMusic(dt) {
  const A = G.sfx, S = G.bandStage; if (!A || !A.ac || !S || !G.band) return;
  const ac = A.ac, me = camera.position, d = Math.hypot(me.x - S.F.ox, me.z - S.F.oz), vol = clamp(1 - d / 110, 0, 1) ** 1.5 * 0.9;
  let M = G.bandMusic;
  if (!M) { M = G.bandMusic = { g: ac.createGain(), next: ac.currentTime + 0.1, step: 0 }; M.g.gain.value = 0; M.g.connect(A.out); }
  M.g.gain.setTargetAtTime(G.paused ? 0 : vol, ac.currentTime, 0.2);
  if (vol < 0.01) { M.next = ac.currentTime + 0.1; return; }
  const st = 60 / 150 / 2; // corcheas a 150 bpm
  const bassL = [43, 43, 50, 43, 45, 45, 52, 45, 48, 48, 55, 48, 50, 50, 57, 50];
  const chords = [[67, 71, 74], [69, 72, 76], [72, 76, 79], [74, 78, 81]];
  const lead = [79, 0, 81, 79, 76, 0, 74, 76, 79, 0, 83, 81, 79, 76, 74, 0];
  const nf = m => 440 * Math.pow(2, (m - 69) / 12);
  while (M.next < ac.currentTime + 0.25) {
    const t = M.next, i = M.step, bar = Math.floor(i / 8) % 4;
    const note = (f, dur, type, v, lp = 3000) => { const o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(fl); fl.connect(g); g.connect(M.g); o.start(t); o.stop(t + dur + 0.05); };
    const hit = (f, dur, v, type = 'lowpass') => { const s = ac.createBufferSource(); s.buffer = A.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(M.g); s.start(t); s.stop(t + dur + 0.05); };
    note(nf(bassL[(bar * 4 + (i % 8 >> 1)) % 16]), st * 1.8, 'triangle', 0.16, 900);          // baixo
    if (i % 2 === 1) for (const c of chords[bar]) note(nf(c), st * 0.7, 'square', 0.022, 2400); // contratempo ska
    if (lead[i % 16] && Math.floor(i / 16) % 2 === 1) note(nf(lead[i % 16]), st * 1.6, 'sawtooth', 0.04, 1800); // saxo
    if (i % 4 === 0) { note(55, 0.18, 'sine', 0.35); note(110, 0.08, 'sine', 0.2); }          // bombo
    if (i % 4 === 2) hit(1800, 0.14, 0.32, 'bandpass');                                         // caixa
    hit(7000, 0.04, 0.06, 'highpass');                                                           // charles
    M.next += st; M.step++;
  }
}
