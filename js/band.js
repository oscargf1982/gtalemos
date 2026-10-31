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
  for (let i = 0; i < 14; i++) {
    const p = takePed(); if (!p) break;
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'fan', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, edge: null });
    const lx = RR(-5.5, 5.5), lz = RR(5.2, 11.5), [x, z] = F.pt(lx, lz); p.x = x; p.z = z; p.y = terrainH(x, z); p.yaw = F.yaw(Math.PI) + RR(-0.3, 0.3); fans.push({ p, ph: R() * 6, jump: R() < 0.4 });
  }
  G.band = { members, fans, t: 0 };
}
const MAYOR_LINES = [
  'Esta fonte é obra miña! Ben, do meu mandato.',
  'Douscentos chorros e luces de cores. Iso é política!',
  'Votádeme outra vez e poño outra igual no Malecón!',
  'Mirade que auga máis limpa. Inaugureina eu, con tesoiras douradas.',
  'Os de Lugo morren de envexa. Que lles den!',
  'Esta noite acéndese en vermello, verde e azul. Que espectáculo!',
  'Ese grupo, Los Roncolas, tamén os trouxen eu. Sen min, silencio.',
];
function initMayor() {
  if (!LM.parkC) return;
  const c = LM.parkC;
  const n = spawnNPC({ id: 'mayor', name: 'The Mayor', x: c.x + 14, z: c.z, yaw: 0, scale: 1.06, fat: 1.45, colors: { shirt: '#4b4f56', pants: '#4b4f56', skin: '#e7b996', hair: '#c9c6bf', shoe: '#121212', sleeve: true } });
  if (!n) return;
  repaintArms(n.p, '#4b4f56');
  n.ang = 0; n.pause = 0; n.lineT = 0; n.loop = { x: c.x, z: c.z, r: 14 };
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
  n.speechT.needsUpdate = true; n.speech.visible = true; n.speechHold = 4.5;
}
function talkMayor(n) {
  const M = t => ({ who: 'The Mayor', text: t });
  openDialog([
    M('Ah, un cidadán! Ou cidadá. Ou turista. Vota en Monforte? Non? Igual, benvido!'),
    M('Ves esta marabilla? A gran fonte do Parque dos Condes. Idea miña. Bueno, o proxecto era dun enxeñeiro, pero a idea... miña.'),
    M(pick(MAYOR_LINES), {
      choices: [
        { t: 'É moi bonita, señor alcalde', fn: () => [M('Grazas, grazas! Toma, unha chapa conmemorativa. E dez euros para un viño no Cardeal.'), () => { if (!save.mayorTip) { save.mayorTip = true; addMoney(10); persist(); } }] },
        { t: 'E canto custou?', fn: () => [M('Ehhh... iso é información reservada. Mira, un paxaro! E escoita, Los Roncolas tocan xa!')] },
        { t: 'Para o próximo mandato, unha ponte no Malecón?', fn: () => [M('Shhh! Non digas iso en voz alta, que están os da Asociación na beira. Non á ponte, non á ponte... de momento.')] },
      ],
    }),
  ]);
}
function updateBand(dt) {
  const t = G.t, B = G.band, S = G.bandStage;
  const night = G.nightK || 0;
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
  const n = G.mayor; if (!n) return;
  const p = n.p, me = G.player.ped, dme = Math.hypot(me.x - p.x, me.z - p.z);
  if (p.talking || G.dialog && dme < 5) { p.walk = 0; p.yaw += angDiff(p.yaw, Math.atan2(me.x - p.x, me.z - p.z)) * Math.min(1, dt * 4); }
  else if (n.pause > 0) {
    n.pause -= dt; p.walk = lerp(p.walk, 0, dt * 5); p.armUp = 1; p.wave = true;
    p.yaw += angDiff(p.yaw, Math.atan2(n.loop.x - p.x, n.loop.z - p.z)) * Math.min(1, dt * 3);
    if (n.pause <= 0) { p.armUp = 0; p.wave = false; }
  } else {
    n.ang += dt * 0.95 / n.loop.r;
    const tx = n.loop.x + Math.cos(n.ang) * n.loop.r, tz = n.loop.z + Math.sin(n.ang) * n.loop.r;
    p.yaw = Math.atan2(tx - p.x, tz - p.z); p.x = tx; p.z = tz; p.walk = lerp(p.walk, 0.55, dt * 3); p.phase += dt * 4.2; p.armUp = 0; p.wave = false;
    if (R() < dt * 0.06) n.pause = RR(2.5, 4.5);
  }
  p.y = terrainH(p.x, p.z);
  n.lineT -= dt;
  if (dme < 22 && n.lineT <= 0 && !G.dialog) { n.lineT = RR(7, 11); mayorSay(n, pick(MAYOR_LINES)); }
  if (n.speechHold > 0) { n.speechHold -= dt; if (n.speechHold <= 0 || dme > 30) n.speech.visible = false; }
  const sc = p.scale, yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), fat = p.fat || 1;
  n.speech.position.set(p.x, p.y + 2.75 * sc, p.z);
  n.tie.position.set(p.x + fx * 0.13 * sc * fat * 0.92, p.y + 1.36 * sc, p.z + fz * 0.13 * sc * fat * 0.92); n.tie.rotation.set(0, yaw, 0);
  n.shirtFront.position.set(p.x + fx * 0.128 * sc * fat * 0.92, p.y + 1.4 * sc, p.z + fz * 0.128 * sc * fat * 0.92); n.shirtFront.rotation.set(0, yaw, 0);
  n.stache.position.set(p.x + fx * 0.11 * sc, p.y + 1.7 * sc, p.z + fz * 0.11 * sc); n.stache.rotation.set(0, yaw, 0);
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
