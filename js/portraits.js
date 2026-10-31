'use strict';
/* ==========================================================
   GTA LEMOS 27400 · retratos en miniatura para os diálogos
   (pixel art: Iván Nogal co retrato achegado polo autor; o resto debuxados aquí)
   ========================================================== */
const PORTRAIT_IMG = { 'Iván Nogal': 'img/ivan.png' };
const PORTRAITS = {};
/* rostro pixelado 32×32 → escalado sen suavizar */
function pixelFace(o) {
  const c = cnv(32, 32), x = c.getContext('2d'), px = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  const g = x.createRadialGradient(16, 14, 2, 16, 16, 22); g.addColorStop(0, o.bg2 || '#3d8bd6'); g.addColorStop(1, o.bg || '#1f5aa6'); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  // torso / roupa
  px(5, 25, 22, 7, o.shirt); if (o.pattern === 'check') for (let i = 0; i < 11; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) px(5 + i * 2, 25 + j * 2, 2, 2, '#f4f4f2');
  if (o.stripe) px(5, 27, 22, 1, o.stripe);
  if (o.collar) { px(12, 24, 3, 3, o.collar); px(17, 24, 3, 3, o.collar); }
  if (o.tie) px(15, 25, 2, 7, o.tie);
  if (o.lapel) { px(9, 25, 3, 7, o.lapel); px(20, 25, 3, 7, o.lapel); }
  // pescozo e cabeza
  px(13, 21, 6, 5, o.skinD || o.skin);
  px(10, 7, 12, 15, o.skin); px(9, 9, 1, 10, o.skin); px(22, 9, 1, 10, o.skin); px(11, 22, 10, 1, o.skin);
  px(9, 13, 1, 3, o.skinD || '#c98f6b'); px(22, 13, 1, 3, o.skinD || '#c98f6b'); // orellas
  if (o.fat) { px(8, 15, 2, 5, o.skin); px(22, 15, 2, 5, o.skin); px(10, 22, 12, 2, o.skin); }
  // pelo
  if (o.hair && o.hairStyle !== 'bald') { px(10, 5, 12, 4, o.hair); px(9, 7, 2, 5, o.hair); px(21, 7, 2, 5, o.hair); if (o.hairStyle === 'spiky') for (let i = 0; i < 6; i++) px(10 + i * 2, 4 - (i % 2), 1, 2, o.hair); if (o.hairStyle === 'side') px(11, 8, 6, 2, o.hair); }
  if (o.hairStyle === 'bald') { px(12, 7, 8, 1, '#ffffff33'); px(9, 11, 1, 3, o.hair || o.skinD); px(22, 11, 1, 3, o.hair || o.skinD); }
  if (o.cap) { px(9, 5, 14, 4, o.cap); px(5, 8, 8, 1, o.cap); }
  // ollos, cellas, nariz, boca
  px(12, 12, 3, 1, o.brow || '#2a1d14'); px(17, 12, 3, 1, o.brow || '#2a1d14');
  px(13, 14, 2, 2, '#f6f2ea'); px(17, 14, 2, 2, '#f6f2ea'); px(13, 14, 1, 2, '#1b1b1d'); px(18, 14, 1, 2, '#1b1b1d');
  if (o.shades) { px(11, 13, 10, 3, '#0b0b0d'); px(15, 13, 2, 1, '#0b0b0d'); }
  px(15, 16, 2, 3, o.skinD || '#c98f6b');
  if (o.moustache) px(13, 19, 6, 1, o.moustache);
  if (o.angry) { px(12, 11, 1, 1, '#2a1d14'); px(19, 11, 1, 1, '#2a1d14'); px(14, 20, 4, 1, '#7a2a24'); } else if (o.smile) { px(13, 20, 6, 1, '#7a2a24'); px(13, 19, 1, 1, '#7a2a24'); px(18, 19, 1, 1, '#7a2a24'); } else px(14, 20, 4, 1, '#7a2a24');
  if (o.cigar) { px(18, 20, 8, 2, '#5a3a20'); px(25, 20, 1, 2, '#ff6a1a'); px(26, 17, 1, 2, '#cfcfcf88'); px(27, 15, 1, 2, '#cfcfcf55'); }
  if (o.stubble) for (let i = 0; i < 14; i++) px(11 + (i * 7) % 10, 19 + (i % 3), 1, 1, '#00000022');
  // marco
  x.strokeStyle = '#0d1013'; x.lineWidth = 1; x.strokeRect(0.5, 0.5, 31, 31);
  const big = cnv(128, 128), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, 128, 128);
  return big.toDataURL();
}
function portraitFor(who) {
  if (PORTRAITS[who]) return PORTRAITS[who];
  if (PORTRAIT_IMG[who]) return PORTRAITS[who] = PORTRAIT_IMG[who];
  const D = {
    'Pacho': { skin: '#efc3a0', skinD: '#cf9a78', hairStyle: 'bald', shirt: G.quest && G.quest.state === 'done' ? '#f2cf12' : '#f6f6f3', collar: '#d9d9d4', fat: true, smile: true, bg: '#20335a', bg2: '#3a5f9a' },
    'Jusé': { skin: '#e9c2a2', skinD: '#c99a7a', hair: '#3a2a1c', shirt: '#d4202b', pattern: 'check', angry: true, stubble: true, bg: '#5a1d22', bg2: '#9a3a3a' },
    'El Spasic': { skin: '#e8b994', skinD: '#c48f6a', hairStyle: 'bald', shirt: '#1d7a3a', stripe: '#f2f2f2', cigar: true, bg: '#1b4a2a', bg2: '#3a7a4a' },
    'The Mayor': { skin: '#e7b996', skinD: '#c48f6a', hair: '#d6d2ca', hairStyle: 'side', shirt: '#4b4f56', lapel: '#3a3d43', tie: '#1f7a3a', collar: '#f4f2ec', moustache: '#d8d4cc', fat: true, smile: true, bg: '#4a3a1a', bg2: '#9a7a3a' },
    'El Yepes': { skin: '#e3b48f', skinD: '#c08a66', hair: '#2a1d14', cap: '#d4202b', shirt: '#5f646b', smile: true, bg: '#3a2a4a', bg2: '#6a5a8a' },
    'Ti': { skin: '#e9bc98', skinD: '#c99672', hair: '#2a1d14', hairStyle: 'side', shirt: '#7a1f3d', collar: '#5a1428', bg: '#1d2b3a', bg2: '#3a556e' },
  }[who];
  if (!D) return null;
  return PORTRAITS[who] = pixelFace(D);
}
function setDialogFace(who) {
  const img = $('dlgFace'), src = portraitFor(who);
  if (!src) { img.hidden = true; return; }
  if (img.dataset.src !== src) { img.src = src; img.dataset.src = src; }
  img.hidden = false; img.dataset.who = who === 'Ti' ? 'me' : 'npc';
}

/* ==========================================================
   IVÁN NOGAL · ferroviario de Renfe na Praza da Estación
   ========================================================== */
function vestTex() {
  const c = cnv(128, 128), x = c.getContext('2d');
  x.fillStyle = '#e4f52c'; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#b9bcb6'; x.fillRect(0, 70, 128, 10); x.fillRect(0, 96, 128, 10); x.fillRect(22, 0, 10, 70); x.fillRect(96, 0, 10, 70);
  x.fillStyle = '#7a1f8c'; x.font = 'italic 700 15px Barlow, sans-serif'; x.textAlign = 'center'; x.fillText('renfe', 72, 56);
  return toTex(c, false);
}
function spawnIvan() {
  const [x, z] = LM.station.pt(313, -3);
  const n = spawnNPC({ id: 'ivan', name: 'Iván Nogal', x, z, yaw: LM.station.yaw(-Math.PI / 2) + 0.4, scale: 1.03, fat: 1.12, colors: { shirt: '#24252c', pants: '#1e1f26', skin: '#e9bc98', hair: '#3a2c24', shoe: '#101010', sleeve: true } });
  if (!n) return;
  repaintArms(n.p, '#24252c');
  // peto amarelo reflectante (superposto ao torso, como a camiseta de Jusé)
  const tex = vestTex(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const geo = world.crowd.meshes.torso.geometry.clone(); geo.scale(1.07, 0.96, 1.1);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0x3a4a00, emissiveIntensity: 0.25 }));
  m.matrixAutoUpdate = false; m.castShadow = true; G.scene.add(m); n.overlay = m;
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.015), std({ color: 0x7a4ab8, roughness: 0.5 })); tie.position.set(0, 0.17, 0.14); m.add(tie);
  n.homeX = x; n.homeZ = z;
}
function ivanTalk(n) {
  G.ivanMet = true;
  const I = (t, extra) => ({ who: 'Iván Nogal', text: t, ...extra });
  const mark = (x, z, name) => () => { setWaypoint(x, z); toast(`${name} marcado no GPS`); };
  const V = LM.vella, cd = LM.cardeal.at(LM.cardeal.len / 2), pc = G.parkGate || LM.parkC, [cx, cz] = LM.compOld(35, 82), [mx, mz] = LM.stationOld(300, -300), [sx, sz] = [LM.clara.ox, LM.clara.oz];
  const menu = () => I('Que che conto? Escolle un sitio:', {
    choices: [
      { t: 'O Castelo de San Vicente', fn: () => [I('Alí no alto, o monte de San Vicente: a Torre da Homenaxe, medieval, de case trinta metros, e o mosteiro bieito de San Vicente do Pino, que hoxe é Parador.'), I('Dende a muralla vese todo o val de Lemos. Sobe pola Rúa de Santo Domingo ou polo Barrio de San Vicente.'), mark(G.castleGate.x, G.castleGate.z, 'O Castelo'), menu()] },
      { t: 'O Colexio da Compañía', fn: () => [I('O colexio de Nosa Señora da Antiga, que mandou erguer o cardeal Rodrigo de Castro a finais do século XVI. Chámanlle o Escorial galego.'), I('Agora lévano os Escolapios, e ten unha pinacoteca con cadros de El Greco e de Andrea del Sarto. Por certo: alí anda Pacho, que te busca.'), mark(cx, cz, 'A Compañía'), menu()] },
      { t: 'A Ponte Vella e Santa Clara', fn: () => [I('A Ponte Vella cruza o Cabe dende tempos moi antigos; a que vemos hoxe é sobre todo do século XVI.'), I('Á beira está o mosteiro das Clarisas, co Museo de Arte Sacra: hai pezas de ourivaría que deixan coa boca aberta.'), mark(V.x, V.z, 'A Ponte Vella'), menu()] },
      { t: 'A Rúa do Cardeal', fn: () => [I('A rúa dos viños! Peonil, chea de bares e terrazas. Leva o nome do cardeal Rodrigo de Castro.'), I('Coidado coas bicis e os patinetes, que baixan a toda pastilla.'), mark(cd.x, cd.z, 'A Rúa do Cardeal'), menu()] },
      { t: 'O Parque dos Condes', fn: () => [I('Á beira do Cabe, coa gran fonte iluminada e o embarcadoiro. Hoxe tocan Los Roncolas, e o alcalde anda por alí presumindo da fonte.'), mark(pc.x, pc.z, 'O Parque dos Condes'), menu()] },
      { t: 'O Museo do Ferrocarril', fn: () => [I('Iso é o meu! Monforte é cidade ferroviaria dende o século XIX: aquí cruzan as liñas de Galicia coa meseta.'), I('No museo hai locomotoras de vapor e vagóns históricos. Está aquí mesmo, seguindo as vías.'), mark(mx, mz, 'O Museo do Ferrocarril'), menu()] },
      { t: 'Grazas, xa me arranxo', fn: () => [I('De nada! Se te perdes, xa sabes: preme M para o mapa ou Y para que te leve o Yepes no patinete. Boa estadía en Monforte!')] },
    ],
  });
  openDialog([
    I('Boas! Benvido a Monforte de Lemos. Son Iván Nogal, de Renfe. Acabas de baixar do rexional, non?'),
    ME('Si, acabo de chegar. É a primeira vez que veño.'),
    I('Pois estás de sorte: coñezo cada pedra desta cidade. Queres que che explique os principais monumentos?', {
      choices: [
        { t: 'Si, por favor', fn: () => [menu()] },
        { t: 'Non, grazas', fn: () => [I('Ningún problema. Se cambias de idea, aquí estarei, á beira da vía 1.')] },
      ],
    }),
  ]);
}
