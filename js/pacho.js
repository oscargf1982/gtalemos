'use strict';
/* ==========================================================
   LEMOS 27400 · Pancho Camisolas, diálogos e a misión da camiseta
   ========================================================== */
const QUEST_KEY = 'lemos27400_pacho';
G.quest = { state: 'none' };
try { const s = JSON.parse(localStorage.getItem(QUEST_KEY)); if (s && s.state) G.quest.state = s.state; } catch (e) { }
function saveQuest() { try { localStorage.setItem(QUEST_KEY, JSON.stringify({ state: G.quest.state })); } catch (e) { } }

const NPCS = [];
const PACHO_COL = { skin: '#efc3a0', hair: '#efc3a0', shirt: '#f6f6f3', pants: '#f6f6f3', shoe: '#121212', sleeve: true };
const FENER = { yellow: '#f2cf12', navy: '#132a54' };

/* letreiro flotante co nome */
function nameSprite(text, color = '#f2a33a') {
  const W = text.length > 9 ? 512 : 256, c = cnv(W, 96), x = c.getContext('2d');
  x.font = '800 54px "Big Shoulders Display", "Arial Narrow", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 10; x.strokeStyle = 'rgba(10,12,14,.85)'; x.strokeText(text, W / 2, 50); x.fillStyle = color; x.fillText(text, W / 2, 50);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTex(c, false), depthTest: false, transparent: true }));
  s.scale.set(1.9 * W / 256, 0.72, 1); s.renderOrder = 10; return s;
}
function bubbleSprite() {
  const c = cnv(96, 96), x = c.getContext('2d');
  x.fillStyle = '#f2a33a'; x.beginPath(); x.arc(48, 42, 36, 0, 7); x.fill(); x.beginPath(); x.moveTo(36, 70); x.lineTo(48, 92); x.lineTo(58, 70); x.fill();
  x.fillStyle = '#15191d'; x.font = '900 58px "Big Shoulders Display", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 48, 45);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTex(c, false), depthTest: false, transparent: true }));
  s.scale.set(0.7, 0.7, 1); s.renderOrder = 11; return s;
}
function makeBall() {
  const c = cnv(256, 128), x = c.getContext('2d');
  x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#1b1b1b';
  for (let i = 0; i < 12; i++) { const px = (i % 6) * 44 + (i > 5 ? 22 : 0) + 10, py = i > 5 ? 90 : 34; x.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; x.lineTo(px + Math.cos(a) * 11, py + Math.sin(a) * 11); } x.fill(); }
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), std({ map: toTex(c, false), roughness: 0.5 }));
  m.castShadow = true; return m;
}

function spawnNPC(opts) {
  const C = world.crowd;
  // reutiliza un peón calquera para o NPC (mantén o número de instancias)
  let p = C.peds.find(q => q.state === 'walk' && q !== G.player.ped && !q.npc);
  if (!p) return null;
  Object.assign(p, { state: 'npc', home: 'npc', npc: opts.id, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null, target: null });
  p.x = opts.x; p.z = opts.z; p.y = groundH(p.x, p.z); p.yaw = p.homeYaw = opts.yaw; p.scale = opts.scale || 1; p.fat = opts.fat || 1;
  Object.assign(p.col, opts.colors); C.paint(p);
  const tag = nameSprite(opts.name); G.scene.add(tag);
  const bub = bubbleSprite(); G.scene.add(bub);
  const n = { ...opts, p, tag, bub }; NPCS.push(n); return n;
}
function repaintArms(p, col) { const c = new THREE.Color(col), m = world.crowd.meshes.uarm; m.setColorAt(p.idx * 2, c); m.setColorAt(p.idx * 2 + 1, c); m.instanceColor.needsUpdate = true; }

function spawnStoryNPCs() {
  const pacho = spawnNPC({ id: 'pacho', name: 'Pancho Camisolas', x: LM.compOld(56, 107)[0], z: LM.compOld(56, 107)[1], yaw: LM.comp.yaw(Math.PI), scale: 1.15, fat: 1.55, colors: PACHO_COL });
  if (pacho) { pacho.ball = makeBall(); G.scene.add(pacho.ball); if (G.quest.state === 'done') wearFener(pacho.p); }
  spawnNPC({ id: 'emre', name: 'Jusé', x: LM.stationOld(229.5, -222)[0], z: LM.stationOld(229.5, -222)[1], yaw: LM.station.yaw(-Math.PI / 2), scale: 1.0, colors: { shirt: '#f4f4f2', pants: '#1d2a4a', skin: '#e9c2a2', hair: '#3a2a1c', shoe: '#e9e9e9', sleeve: true } });
  const juse = NPCS.find(n => n.id === 'emre'); if (juse) { repaintArms(juse.p, '#d4202b'); addCheckerShirt(juse); }
  spawnSpasic();
  spawnIvan();
  spawnDamian();
  spawnCurrito();
  spawnSajoni();
}
function wearFener(p) { p.col.shirt = FENER.yellow; world.crowd.paint(p); repaintArms(p, FENER.navy); }

/* ---------- caixa de diálogo ---------- */
G.dialog = null;
function openDialog(lines, onEnd) {
  G.dialog = { lines, i: -1, onEnd };
  $('dialog').hidden = false; $('dlgChoices').innerHTML = '';
  if (document.exitPointerLock) document.exitPointerLock();
  nextLine();
}
function nextLine() {
  const D = G.dialog; if (!D) return;
  D.i++;
  if (D.i >= D.lines.length) return closeDialog();
  const L = D.lines[D.i];
  if (typeof L === 'function') { L(); return nextLine(); }
  $('dlgName').textContent = L.who; $('dlgName').dataset.who = L.who === 'Ti' ? 'me' : 'npc';
  setDialogFace(L.who);
  D.full = L.text; D.shown = 0; D.typing = true; $('dlgText').textContent = '';
  $('dlgChoices').innerHTML = ''; $('dlgHint').hidden = true;
  D.choices = L.choices || null;
  for (const n of NPCS) n.p.talking = L.who === n.name;
}
function showChoices() {
  const D = G.dialog, box = $('dlgChoices'); box.innerHTML = '';
  D.choices.forEach((c, k) => {
    const b = document.createElement('button'); b.className = 'dlg-choice'; b.type = 'button';
    b.innerHTML = `<span class="k">${k + 1}</span>${c.t}`;
    if (c.disabled) { b.disabled = true; b.title = c.disabled; }
    b.onclick = e => { e.stopPropagation(); choose(k); };
    box.appendChild(b);
  });
}
function choose(k) {
  const D = G.dialog; if (!D || !D.choices || D.typing) return;
  const c = D.choices[k]; if (!c || c.disabled) return;
  G.sfx.checkpoint && G.sfx.coin();
  const more = c.fn ? c.fn() : null;
  if (more && more.length) { D.lines.splice(D.i + 1, 0, ...more); }
  D.choices = null; nextLine();
}
function dialogAdvance() {
  const D = G.dialog; if (!D) return;
  if (D.typing) { D.shown = D.full.length; return; }
  if (D.choices) return;
  nextLine();
}
function closeDialog() {
  const D = G.dialog; G.dialog = null; $('dialog').hidden = true;
  for (const n of NPCS) n.p.talking = false;
  if (D && D.onEnd) D.onEnd();
}
function updateDialog(dt) {
  const D = G.dialog; if (!D) return;
  if (D.typing) {
    D.shown = Math.min(D.full.length, D.shown + dt * 55);
    $('dlgText').textContent = D.full.slice(0, Math.floor(D.shown));
    if (D.shown >= D.full.length) { D.typing = false; if (D.choices) showChoices(); else $('dlgHint').hidden = false; }
  }
}

/* ---------- conversas ---------- */
const P = (text, extra) => ({ who: 'Pancho Camisolas', text, ...extra });
const E = (text, extra) => ({ who: 'Jusé', text, ...extra });
const ME = text => ({ who: 'Ti', text });
function talkTo(n) {
  if (G.dialog) return;
  if (G.story && typeof advTalk === 'function' && advTalk(n)) return;
  if (n.id === 'spasic') return talkSpasic(n);
  if (n.id === 'mayor') return talkMayor(n);
  if (n.id === 'ivan') return ivanTalk(n);
  if (n.id === 'damian') return damianTalk(n);
  if (n.id === 'currito') return talkCurrito(n);
  if (n.id === 'sajoni') return talkSajoni(n);
  const q = G.quest;
  if (n.id === 'pacho') {
    const hola = P('Que pasa, chorbo! Aúpa Depor!');
    if (q.state === 'none') return openDialog([
      hola,
      P('Ei, ti! Si, ti, o do coche granate. Ven aquí un momentiño.'),
      P('Son Pancho Camisolas. Socio do Madrid desde que tiña dentes de leite. Vinte e oito anos sen faltar a un partido na tele do bar.'),
      P('Pero teño un problema: o meu cuñado é do Fenerbahçe. De Istambul, ho! Casou coa miña irmá e agora fai as cousas grandes da familia en amarelo e azul.'),
      P('O sábado é o seu aniversario e quero sorprendelo cunha camiseta do Fener. Auténtica, das de Kadıköy, non dunha feira.', {
        choices: [
          { t: 'Un madridista mercando unha do Fener? Ti estás ben?', fn: () => [P('Ho, a familia é a familia. E se lle regalo outra cousa, o que me cae é peor ca un 4-0 en Anfield.'), P('Daquela que? Axúdasme?', { choices: pachoAccept() })] },
          ...pachoAccept(),
        ],
      }),
    ]);
    if (q.state === 'go') return openDialog([
      hola,
      P('Aínda nada? Na estación, home, no andén 1. Un croata con cara de poucos amigos e camiseta de cadros vermellos e brancos. Chámase Jusé.'),
      P('E non lle fales do clásico, que se pon nervioso.'),
    ]);
    if (q.state === 'return') return openDialog([
      hola,
      ME('Aquí a tes: amarela e azul marino, coas raias e todo.'),
      P('Mírala! Uf... ata cheira a Bósforo.'),
      P('Sabes que? Para que non me vexa con ela antes de tempo, póñoa xa eu. Así a vou quentando.'),
      () => { wearFener(n.p); },
      P('Que ninguén do Madrid me vexa, eh? Toma, por molestarte: ' + (G.story ? 'cincuenta euros, que a crise tamén chegou á Compañía,' : 'catrocentos euros') + ' e un bocadillo de raxo cando queiras no Cardeal.'),
      () => { q.state = 'done'; saveQuest(); addMoney(G.story ? 50 : 400); bigMsg('MISIÓN SUPERADA', 'Unha camiseta para Pancho Camisolas · +' + (G.story ? 50 : 400) + ' €'); G.sfx.win(); save.done.pacho = true; persist(); updateMenuStats(); },
    ]);
    if (q.state === 'done') return openDialog([hola, pick([
      P('Ao meu cuñado encantoulle a camiseta. Agora quere unha do Madrid. Isto non acaba nunca.'),
      P('Se me ves de amarelo é por solidariedade familiar. Que conste.'),
      P('Ves ese edificio? O Escorial galego. Coma o Bernabéu, pero de granito e con máis séculos.'),
      P('O domingo hai partido. Ven ao Cardeal, que poñen a pantalla grande no Recuncho.'),
    ])]);
  }
  if (n.id === 'emre') {
    if (q.state !== 'go') return openDialog([E(q.state === 'none'
      ? pick(['¿Qué miras? Llevo dos horas esperando un tren que no llega. ¡En Zagreb los trenes salen a su hora!', '¿Tú también vas a preguntarme por la camiseta? ¡Sí, es de Prosinečki! ¡Déjame en paz!'])
      : pick(['¿Otra vez tú? Dile al calvo ese que me debe un vino. Y que no me llame más.', '¡Ni se te ocurra pedirme otra camiseta!']))]);
    return openDialog([
      E('¿Qué? ¿Vienes de parte del calvo ese? ¡Me ha llamado diez veces esta mañana! ¡Diez!'),
      E('¡Y no me toques la camiseta, que es la de Prosinečki! Más respeto.'),
      ME('Si, son o recadeiro de Pancho Camisolas. Quedou na Praza da Compañía.'),
      E('Sí, tengo la camiseta del Fenerbahçe. La compré en Estambul y me costó un ojo de la cara. ¡Y ahora todo el mundo la quiere! ¡No la regalo así como así!', {
        choices: [
          { t: 'Págoche 50 €', disabled: G.player.money < 50 ? 'Non tes cartos dabondo' : null, fn: () => { G.player.money -= 50; save.money = G.player.money; persist(); return [E('Cincuenta euros. Ni uno menos. ¡Y no me mires así, que la camiseta es nueva!'), () => gotShirt()]; } },
          { t: 'Cóntoche a historia do Cardeal e da Ponte Vella', fn: () => [ME('O cardeal Rodrigo de Castro mandou construír o colexio e a ponte do parque en 1598, e chaman ao edificio o Escorial galego...'), E('¡Basta, basta! ¡Qué rollo! Toma la camiseta y déjame en paz, que me duele la cabeza.'), () => gotShirt()] },
          { t: 'Xogámola a un penalti', fn: () => { const goal = R() < 0.6; return goal ? [ME('Lanzo... á escuadra!'), E('¡Bah! Suerte de principiante. Toma la maldita camiseta.'), () => gotShirt()] : [ME('Lanzo... ao larguero!'), E('¡Ja! ¡Al larguero! ...Bueno, llévatela igual, que no quiero verte más por aquí. ¡Y dile al calvo que me debe un vino!'), () => gotShirt()]; } },
        ],
      }),
    ]);
  }
}
/* camiseta de cadros vermellos e brancos (superposta ao torso do peón) */
function addCheckerShirt(n) {
  const c = cnv(128, 128), x = c.getContext('2d'), k = 16;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#f4f4f2' : '#d4202b'; x.fillRect(i * k, j * k, k, k); }
  const tex = toTex(c, false); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1.5);
  const geo = world.crowd.meshes.torso.geometry.clone(); geo.scale(1.04, 1.02, 1.06);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, envMapIntensity: 0.4 }));
  m.matrixAutoUpdate = false; m.castShadow = true; G.scene.add(m); n.overlay = m;
  // nome á costas
  const nc = cnv(256, 64), nx = nc.getContext('2d'); nx.fillStyle = '#ffffff'; nx.fillRect(0, 0, 256, 64);
  nx.fillStyle = '#13284f'; nx.font = '800 40px "Big Shoulders Display", "Arial Narrow", sans-serif'; nx.textAlign = 'center'; nx.textBaseline = 'middle'; nx.fillText('PROSINEČKI', 128, 34);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshStandardMaterial({ map: toTex(nc, false), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }));
  back.position.set(0, 0.12, -0.142); back.rotation.y = Math.PI; m.add(back);
}
function pachoAccept() {
  return [
    { t: 'Conta comigo', fn: () => [P('Grande! Hai un croata que trouxo unha do Fener de Istambul e agarda o tren no andén 1 da estación. Chámase Jusé. Ten mal xenio, avísoche.'), P('Fala con el e tráeme a camiseta. Eu espero aquí, vixiando o Escorial galego.'), () => { G.quest.state = 'go'; saveQuest(); toast('Nova misión: Unha camiseta para Pancho Camisolas'); G.sfx.start(); setWaypoint(229, -222); }] },
    { t: 'Agora non podo', fn: () => [P('Bo, bo. Aquí estarei, coma sempre. Pancho Camisolas non se move da Compañía.')] },
  ];
}
function gotShirt() { G.quest.state = 'return'; saveQuest(); toast('Tes a camiseta: volve onde Pancho Camisolas na Praza da Compañía'); setWaypoint(...LM.compOld(56, 105)); G.sfx.checkpoint(); }

/* ---------- actualización ---------- */
function nearNPC() {
  if (G.player.car) return null;
  const me = G.player.ped; let best = null, bd = 3.2;
  for (const n of NPCS) { const d = Math.hypot(n.p.x - me.x, n.p.z - me.z) - (n.id === 'spasic' ? 2 : 0); if (d < bd) { bd = d; best = n; } }
  return best;
}
function updateStory(dt) {
  updateDialog(dt);
  const q = G.quest;
  for (const n of NPCS) {
    const p = n.p, h = 1.95 * p.scale;
    if (n.overlay) { world.crowd.meshes.torso.getMatrixAt(p.idx, n.overlay.matrix); n.overlay.matrixWorldNeedsUpdate = true; n.overlay.visible = p.visible; }
    n.tag.position.set(p.x, p.y + h + 0.35, p.z);
    const has = (n.id === 'pacho' && (q.state === 'none' || q.state === 'return')) || (n.id === 'emre' && q.state === 'go') || (n.id === 'spasic' && G.quest2.state === 'none') || (n.id === 'ivan' && !G.ivanMet);
    n.bub.visible = has && !G.dialog; n.bub.position.set(p.x, p.y + h + 0.95 + Math.sin(G.t * 3) * 0.08, p.z);
    const d = Math.hypot(camera.position.x - p.x, camera.position.z - p.z); n.tag.visible = d < 40;
    if (n.ball) { // toques co balón cando non fala
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), t = G.t * 3.2;
      const kick = !p.talking && !G.dialog;
      n.ball.position.set(p.x + fx * 0.55, p.y + (kick ? 0.12 + Math.abs(Math.sin(t)) * 0.75 : 0.11), p.z + fz * 0.55);
      n.ball.rotation.x += dt * (kick ? 6 : 0);
    }
  }
  const n = nearNPC();
  if (n && !G.dialog) setPrompt(`${isTouch ? '★' : 'E'} · Falar con ${n.name}`);
  updateSpasic(dt);
  updateDamian(dt);
  updateCurrito(dt); updateVoley(dt);
  updateAvelino(dt);
  updatePlazaHotels();
  // obxectivo no HUD se non hai outra misión
  if (!G.mission && !(q.state === 'go' || q.state === 'return')) spasicObjective(dt);
  if (!G.mission && (q.state === 'go' || q.state === 'return')) {
    $('mission').hidden = false; $('mName').textContent = 'Unha camiseta para Pancho Camisolas';
    $('mText').textContent = q.state === 'go' ? 'Busca a Jusé no andén 1 da estación' : 'Leva a camiseta a Pancho Camisolas (Praza da Compañía)';
    $('mTimer').textContent = '';
    const t = q.state === 'go' ? NPCS.find(x => x.id === 'emre').p : NPCS.find(x => x.id === 'pacho').p;
    G.curTarget = { x: t.x, z: t.z, r: 2 };
    const me = G.player.car || G.player.ped; G.cpMesh.visible = Math.hypot(me.x - t.x, me.z - t.z) > 7; G.cpMesh.position.set(t.x, groundH(t.x, t.z), t.z); G.cpMesh.scale.setScalar(0.5); G.cpMesh.userData.ring.rotation.z += dt * 2;
  }
}
function storyInteract() { const n = nearNPC(); if (n) { talkTo(n); return true; } return false; }

/* ==========================================================
   O SPASIC · calvo, chándal verde, puro enorme e bici pintada
   con raias azuis e vermellas. Misión: a moto do sorteo da Pinguela
   ========================================================== */
const SPASIC_KEY = 'lemos27400_spasic';
G.quest2 = { state: 'none' };
try { const s = JSON.parse(localStorage.getItem(SPASIC_KEY)); if (s && s.state) G.quest2.state = s.state; } catch (e) { }
function saveQuest2() { try { localStorage.setItem(SPASIC_KEY, JSON.stringify({ state: G.quest2.state })); } catch (e) { } }
const SP_LOOP = { x: 0, z: 0, rx: 36, rz: 36 }; // centrado na fonte ao iniciar
const S = (text, extra) => ({ who: 'El Spasic', text, ...extra });

function stripeTex() {
  const c = cnv(32, 256), x = c.getContext('2d'), cols = ['#1d4fd8', '#f4f4f0', '#d41f24', '#f4f4f0'];
  for (let i = 0; i < 16; i++) { x.fillStyle = cols[i % 4]; x.fillRect(0, i * 16, 32, i % 2 ? 6 : 26); }
  for (let i = 0; i < 16; i++) { x.fillStyle = cols[i % 4]; x.fillRect(0, i * 16 + (i % 2 ? 6 : 0), 32, 16 - (i % 2 ? 6 : 0)); }
  const t = toTex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t;
}
function makeBike() {
  const g = new THREE.Group(), stripe = new THREE.MeshStandardMaterial({ map: stripeTex(), roughness: 0.4, metalness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 }), chrome = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 1, roughness: 0.25 });
  const up = new THREE.Vector3(0, 1, 0);
  const tube = (a, b, r, mat) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), mat); m.position.copy(A).add(Bv).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); m.castShadow = true; g.add(m); return m; };
  const R = [0, 0.34, -0.55], F = [0, 0.34, 0.55], BB = [0, 0.32, 0], S2 = [0, 0.9, -0.17], H = [0, 0.94, 0.4], Hb = [0, 0.74, 0.44];
  tube(S2, BB, 0.03, stripe); tube(Hb, BB, 0.034, stripe); tube(S2, H, 0.028, stripe);
  for (const s of [-0.06, 0.06]) { tube([s, BB[1], BB[2]], [s, R[1], R[2]], 0.016, stripe); tube([s, S2[1], S2[2]], [s, R[1], R[2]], 0.014, stripe); tube([s, Hb[1], Hb[2]], [s, F[1], F[2]], 0.017, chrome); }
  tube(Hb, H, 0.03, stripe);
  tube([-0.27, 1.02, 0.43], [0.27, 1.02, 0.43], 0.016, chrome); tube(H, [0, 1.02, 0.43], 0.018, chrome);
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.28), dark); saddle.position.set(0, 0.95, -0.2); g.add(saddle);
  const wheels = [];
  for (const p of [R, F]) {
    const w = new THREE.Group(); w.position.set(...p);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.028, 8, 28), dark); tire.rotation.y = Math.PI / 2; w.add(tire);
    for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.64, 4), chrome); sp.rotation.x = k / 8 * Math.PI; w.add(sp); }
    g.add(w); wheels.push(w);
  }
  const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), chrome); crank.rotation.z = Math.PI / 2; crank.position.set(0.06, 0.32, 0); g.add(crank);
  g.userData.wheels = wheels; return g;
}
function makeCigar() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.19, 10), new THREE.MeshStandardMaterial({ color: 0x5a3519, roughness: 0.8 })); g.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0xc9a12a, metalness: 0.6, roughness: 0.3 })); band.position.y = -0.05; g.add(band);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); tip.position.y = 0.095; g.add(tip);
  g.matrixAutoUpdate = false; return g;
}
function spawnSpasic() {
  SP_LOOP.x = LM.parkC.x; SP_LOOP.z = LM.parkC.z;
  const n = spawnNPC({ id: 'spasic', name: 'El Spasic', x: SP_LOOP.x + SP_LOOP.rx, z: SP_LOOP.z, yaw: 0, scale: 1.04, colors: { skin: '#e8b994', hair: '#e8b994', shirt: '#1d7a3a', pants: '#1d7a3a', shoe: '#f2f2f2', sleeve: false } });
  if (!n) return;
  n.p.manual = true; n.ang = 0; n.speed = 0;
  n.bike = makeBike(); G.scene.add(n.bike);
  n.cigar = makeCigar(); G.scene.add(n.cigar); n.puff = 0;
  if (G.quest2.state === 'steal' || G.quest2.state === 'deliver') { G.quest2.state = 'steal'; setTimeout(startRiot, 0); }
}
const _hm = new THREE.Matrix4(), _om = new THREE.Matrix4(), _tv3 = new THREE.Vector3();
// percorrido arredor da fonte, bordeando a pista de volei praia polo lado da fonte
function spasicPt(a) {
  let x = SP_LOOP.x + Math.cos(a) * SP_LOOP.rx, z = SP_LOOP.z + Math.sin(a) * SP_LOOP.rz; const V = LM.volei;
  if (V) { let [lx, lz] = V.inv(x, z); const k = Math.max(0, 1 - Math.max(0, Math.abs(lx) - 13) / 6);
    if (k > 0) { const side = V.inv(SP_LOOP.x, SP_LOOP.z)[1] > 0 ? 1 : -1; const tz = side * 9; if (side > 0 ? lz < tz : lz > tz) { lz = lerp(lz, tz, k); [x, z] = V.pt(lx, lz); } } }
  return [x, z];
}
function updateSpasic(dt) {
  const n = NPCS.find(x => x.id === 'spasic'); if (!n) return;
  const p = n.p, me = G.player.car || G.player.ped, near = Math.hypot(me.x - p.x, me.z - p.z) < 7.5;
  const target = (near || (G.dialog && p.talking)) ? 0 : 3.4;
  n.speed = lerp(n.speed, target, Math.min(1, dt * 2));
  n.ang += dt * n.speed / 19;
  const [bx, bz] = spasicPt(n.ang), [bx2, bz2] = spasicPt(n.ang + 0.02);
  const yaw = Math.atan2(bx2 - bx, bz2 - bz);
  const by = groundH(bx, bz);
  n.bike.position.set(bx, by, bz); n.bike.rotation.set(0, yaw, n.speed < 0.3 ? 0.12 : 0);
  for (const w of n.bike.userData.wheels) w.rotation.x += dt * n.speed / 0.34;
  // o Spasic montado: sentado, pedaleando
  p.x = bx - Math.sin(yaw) * 0.16; p.z = bz - Math.cos(yaw) * 0.16; p.y = by + 0.3; p.yaw = yaw;
  p.sit = 0.72; p.walk = n.speed > 0.3 ? 1 : 0.15; p.run = 0; p.phase += dt * n.speed * 2.2; p.armUp = 0.45;
  p.look = near ? clamp(angDiff(yaw, Math.atan2(me.x - p.x, me.z - p.z)), -1, 1) : 0;
  // puro na boca e fume
  world.crowd.meshes.head.getMatrixAt(p.idx, _hm);
  _om.makeRotationX(Math.PI / 2 - 0.25); _om.setPosition(0.04, -0.045, 0.14); _hm.multiply(_om);
  n.cigar.matrix.copy(_hm); n.cigar.matrixWorldNeedsUpdate = true;
  n.puff -= dt; if (n.puff <= 0) { n.puff = RR(0.25, 0.6); _tv3.set(0, 0.1, 0).applyMatrix4(_hm); world.smoke.emit(_tv3.x, _tv3.y, _tv3.z, RR(-0.1, 0.1), RR(0.3, 0.6), RR(-0.1, 0.1), 0.18, 2.4, 0xd6d6d6, 0.4); }
  // misión
  const q = G.quest2;
  if (q.state === 'steal' && G.questMoto && G.player.car === G.questMoto) motoStolen();
  if (q.state === 'deliver' && G.player.car === G.questMoto && !G.dialog && Math.hypot(me.x - p.x, me.z - p.z) < 9 && G.player.car.speed < 3) {
    toggleCar();
    openDialog([
      S('¡Pero bueno! ¡La moto! ¡Mírala qué bonita, si hasta brilla!'),
      S('Ahora sí que hay justicia en Monforte. Toma tus seiscientos euros, máquina.'),
      S('Y si alguien pregunta, yo estaba aquí dando vueltas con la bici, como siempre. Ahora quítate de en medio, que vienen los azules.'),
      () => { q.state = 'done'; saveQuest2(); addMoney(600); bigMsg('MISIÓN SUPERADA', 'A moto do sorteo · +600 €'); G.sfx.win(); save.done.spasic = true; persist(); updateMenuStats(); if (G.questMoto) { G.questMoto.driver = null; G.questMoto.place(p.x + 2.2, p.z + 1.4, yaw); } },
    ]);
  }
}
function talkSpasic(n) {
  const q = G.quest2;
  if (q.state === 'none') return openDialog([
    S('¡Eeeh, máquina! ¿Qué pasa? Soy el Spasic. Ni se te ocurra tocarme la bici, que está recién pintada.'),
    S('¿Te has enterado del sorteo de la moto en la Pinguela? ¡Tongo! ¡Tongo como una casa! Le ha tocado al cuñado del de la tómbola. Otra vez.'),
    S('Aquello está que arde: gente gritando, empujones, la policía plantada... un circo. Y la moto ahí, solita, esperando a un valiente.'),
    S('Tú me traes esa moto y yo te suelto seiscientos euros. ¿Hace?', {
      choices: [
        { t: 'Hace. Vou pola moto', fn: () => [S('¡Así me gusta! El campo de la Pinguela está río abajo, al suroeste del parque: sigue el paseo del Cabe. La moto está al lado del escenario.'), S('Súbete y sal pitando, que la poli no se va a quedar mirando. Te espero aquí, dando vueltas.'), () => { q.state = 'steal'; saveQuest2(); startRiot(); toast('Nova misión: A moto do sorteo'); G.sfx.start(); setWaypoint(-195, 252); }] },
        { t: 'Iso é roubar, Spasic', fn: () => [S('¿Robar? Robar es lo que han hecho ellos con el sorteo, chaval. Piénsatelo y vuelve, que yo no me muevo de aquí.')] },
      ],
    }),
  ]);
  if (q.state === 'steal') return openDialog([S('¿Qué haces aquí todavía? ¡La Pinguela! ¡La moto! ¡Venga, que se enfría el puro!')]);
  if (q.state === 'deliver') return openDialog([S('¿Y la moto? ¡Sin moto no hay pasta! Tráemela aquí, que no muerdo.')]);
  return openDialog([pick([
    S('Con la moto y la bici ya no me para nadie. Bueno, la bici la uso más, que la moto gasta.'),
    S('Dicen que van a repetir el sorteo. Esta vez sin el cuñado. Ya veremos.'),
    S('Este puro me lo regaló un cubano en la feira de Monforte. O eso me dijo.'),
    S('¿Has visto qué rayas le he pintado a la bici? Azul y rojo, para que se me vea desde el castillo.'),
  ])]);
}
function startRiot() {
  if (G.riotOn) return; G.riotOn = true;
  if (G.tongoSign) G.tongoSign.visible = true;
  const spot = G.motoSpot;
  if (!G.questMoto) { G.questMoto = spawnVehicle('moto', spot.x, spot.z, spot.yaw, '#c8202a'); G.questMoto.sleep = true; }
  const C = world.crowd, free = C.peds.filter(q => (q.state === 'walk' || (q.state === 'wander' && q.area !== 'cardeal')) && !q.npc && q !== G.player.ped).sort(() => R() - 0.5);
  const nRiot = Math.min(22, Math.max(6, free.length - 3));
  G.riotPeds = [];
  free.slice(0, nRiot).forEach(q => { Object.assign(q, { state: 'riot', home: 'riot', riotX: spot.x - 3, riotZ: spot.z + 4, target: null, timer: 0, visible: true }); const a = R() * 6.28, r = RR(3, 11); q.x = q.riotX + Math.cos(a) * r; q.z = q.riotZ + Math.sin(a) * r * 0.7; q.y = groundH(q.x, q.z); G.riotPeds.push(q); });
  // axentes de uniforme arredor da moto
  free.slice(nRiot, nRiot + 3).forEach((q, k) => { Object.assign(q, { state: 'guard', home: 'guard', visible: true }); q.col.shirt = '#1c2c56'; q.col.pants = '#1c2c56'; q.col.shoe = '#0e0e0e'; q.col.sleeve = false; C.paint(q); const a = k / 3 * 6.28; q.x = spot.x + Math.cos(a) * 3; q.z = spot.z + Math.sin(a) * 2.6; q.y = groundH(q.x, q.z); G.riotPeds.push(q); });
  // coches patrulla coas luces acesas
  G.riotCops = [spawnVehicle('policia', ...LM.ping.pt(-204, 316), LM.ping.yaw(Math.PI / 2)), spawnVehicle('policia', ...LM.ping.pt(-183, 320), LM.ping.yaw(-Math.PI / 2 + 0.3))];
  for (const v of G.riotCops) { v.sirenOn = true; v.sleep = true; }
}
function motoStolen() {
  const q = G.quest2; q.state = 'deliver'; saveQuest2();
  addWanted(2, 'Roubaches a moto do sorteo! A policía vai por ti');
  toast('Corre! Leva a moto ao Spasic no Parque dos Condes', 4.5);
  for (const p of G.riotPeds || []) { p.home = 'walk'; startFlee(p, G.player.ped.x, G.player.ped.z, RR(3, 6)); p.prevState = 'walk'; p.wave = false; p.armUp = 0; }
  for (const v of G.riotCops || []) { v.sleep = false; v.ai = { mode: 'chase', stuck: 0 }; }
  G.riotOn = false; setWaypoint(SP_LOOP.x, SP_LOOP.z + SP_LOOP.rz);
}
function spasicObjective(dt) {
  const q = G.quest2; if (q.state !== 'steal' && q.state !== 'deliver') return;
  const sp = NPCS.find(x => x.id === 'spasic'); if (!sp) return;
  let t, text;
  if (q.state === 'steal') { t = G.questMoto || G.motoSpot; text = 'Rouba a moto do sorteo no Campo da Pinguela'; }
  else if (G.player.car === G.questMoto) { t = sp.p; text = 'Leva a moto ao Spasic (Parque dos Condes)'; }
  else { t = G.questMoto; text = 'Volve á moto e lévalla ao Spasic'; }
  $('mission').hidden = false; $('mName').textContent = 'A moto do sorteo'; $('mText').textContent = text; $('mTimer').textContent = '';
  G.curTarget = { x: t.x, z: t.z, r: 2 };
  const me = G.player.car || G.player.ped; G.cpMesh.visible = Math.hypot(me.x - t.x, me.z - t.z) > 7; G.cpMesh.position.set(t.x, groundH(t.x, t.z), t.z); G.cpMesh.scale.setScalar(0.6); G.cpMesh.userData.ring.rotation.z += dt * 2;
}
