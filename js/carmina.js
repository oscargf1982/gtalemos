'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Carmiña: morena, moi guapa, lentes de pasta
   verdes e un cubata na man, na Rúa da Duquesa de Alba. Non se
   atopa ben e pídeche que a leves á casa en moto... e a única moto
   que hai a man é a do Lemos. Ao chegar: bico e corazón.
   ========================================================== */
const CM = (t, e) => ({ who: 'Carmiña', text: t, ...e });
const CARMINA_LINES = ['Ai, que mareo...', 'Este cubata está moi cargado', 'Onde aparquei eu a casa?', 'Hip!', 'Que guapo está Monforte de noite...', 'Alguén me leva?'];
function carminaQ() { const S = G.story; if (S) return S.flags.carmina || (S.flags.carmina = { state: 'none' }); return save.carmina || (save.carmina = { state: 'none' }); }
function spawnCarmina() {
  const r = ROADS.find(q => q.name === 'Rúa da Duquesa de Alba'); if (!r || G.carmina) return;
  const p0 = roadPoint(r, r.len * 0.32), off = r.hw + (r.sw || 2) * 0.6, x = p0.x - p0.uz * off, z = p0.z + p0.ux * off;
  const n = spawnNPC({ id: 'carmina', name: 'Carmiña', x, z, yaw: Math.atan2(p0.uz, -p0.ux), scale: 0.95, fat: 0.95, colors: { shirt: '#c0304a', pants: '#c0304a', skin: '#a8714e', hair: '#1d1612', shoe: '#1b1b1b', sleeve: true } });
  if (!n) return;
  const p = n.p; p.manual = true; p.female = true; n.home0 = { x, z, yaw: p.yaw };
  const mk = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; m.castShadow = true; G.scene.add(m); return m; };
  // vestido curto vermello
  n.skirt = mk((() => { const g = new THREE.CylinderGeometry(0.19, 0.29, 0.5, 18, 1, true); g.translate(0, -0.2, 0); g.scale(1, 1, 0.75); return g; })(), std({ color: 0xc0304a, roughness: 0.6, side: THREE.DoubleSide }));
  // lentes de pasta verdes (a melena leva o modelo detallado)
  n.glasses = (() => { const g = new THREE.Group(), m = std({ color: 0x1f8a3a, roughness: 0.35 }), gl = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.25, roughness: 0.05 });
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 6, 16), m); f.scale.set(1.25, 1, 1); f.position.set(s * 0.042, 0, 0); g.add(f); const l = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), gl); l.scale.set(1.25, 1, 1); l.position.set(s * 0.042, 0, -0.002); g.add(l); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.11), m); arm.position.set(s * 0.082, 0.005, -0.055); g.add(arm); }
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.008), m); g.add(br); g.matrixAutoUpdate = false; G.scene.add(g); return g; })();
  // o cubata: vaso longo con xeo, refresco de cola, rodaxa de limón e palliña
  n.drink = (() => { const g = new THREE.Group(); const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.15, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide })); g.add(glass);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.033, 0.11, 12), std({ color: 0x3a1a0a, roughness: 0.1 })); liq.position.y = -0.015; g.add(liq);
    const lem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.006, 10), std({ color: 0xf2e04a })); lem.rotation.x = Math.PI / 2; lem.position.set(0, 0.06, 0.035); g.add(lem);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 5), std({ color: 0xff3a6a })); st.position.set(0.012, 0.09, 0); st.rotation.z = 0.2; g.add(st);
    g.matrixAutoUpdate = false; G.scene.add(g); return g; })();
  // a moto do Lemos, aparcada un pouco máis adiante
  const pm = roadPoint(r, r.len * 0.36), moff = r.hw - 0.9, mx = pm.x - pm.uz * moff, mz = pm.z + pm.ux * moff;
  const moto = spawnVehicle('moto', mx, mz, Math.atan2(pm.ux, pm.uz), '#c8202a'); moto.sleep = true; moto.customName = 'Moto do Lemos'; n.moto = moto;
  { const c = cnv(256, 64), x2 = c.getContext('2d'); x2.fillStyle = '#ffffff'; x2.fillRect(0, 0, 256, 64); x2.fillStyle = '#c8202a'; x2.font = '900 40px "Big Shoulders Display", Barlow, sans-serif'; x2.textAlign = 'center'; x2.fillText('C.D. LEMOS', 128, 46);
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), std({ map: toTex(c, false), side: THREE.DoubleSide })); st.position.set(s * 0.21, 0.7, -0.35); st.rotation.y = s * Math.PI / 2; moto.body.add(st); } }
  curritoSpeech(n); n.lineT = 3; n.ph = R() * 6;
  // a casa de Carmiña
  const hr = ROADS.filter(q => q.type === 'car' && q.name && q.name !== 'Rúa da Duquesa de Alba').map(q => { const s = q.len / 2, pt = roadPoint(q, s); return { q, pt, d: Math.hypot(pt.x + 250, pt.z - 760) }; }).sort((a, b) => a.d - b.d)[0];
  if (hr) { const off2 = hr.q.hw + 1.4; n.house = { x: hr.pt.x - hr.pt.uz * off2, z: hr.pt.z + hr.pt.ux * off2, street: hr.q.name, yaw: Math.atan2(hr.pt.uz, -hr.pt.ux) }; }
  // corazón
  n.heart = (() => { const c = cnv(128, 128), x2 = c.getContext('2d'); x2.fillStyle = '#ff2a5a'; x2.shadowColor = '#ff7a9a'; x2.shadowBlur = 16; x2.beginPath(); x2.moveTo(64, 112); x2.bezierCurveTo(10, 72, 4, 30, 34, 22); x2.bezierCurveTo(52, 18, 62, 32, 64, 40); x2.bezierCurveTo(66, 32, 76, 18, 94, 22); x2.bezierCurveTo(124, 30, 118, 72, 64, 112); x2.fill(); x2.fillStyle = 'rgba(255,255,255,.5)'; x2.beginPath(); x2.ellipse(40, 40, 10, 6, -0.6, 0, 7); x2.fill();
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTex(c, false), transparent: true, depthTest: false })); s.renderOrder = 20; s.visible = false; G.scene.add(s); return s; })();
  G.carmina = n;
  const Q = carminaQ(); if (Q.state === 'done') { p.visible = false; }
}
function talkCarmina(n) {
  const Q = carminaQ(), me = G.story ? 'Avelino' : 'Ti', ME2 = (t, e) => ({ who: me, text: t, ...e });
  if (Q.state === 'none') return openDialog([
    CM('Ola, ola... hip! Perdoa, é que... estou un pouquiño mareada. Son Carmiña.'),
    ME2(G.story ? 'Eh You! Estás ben? Tes mala cara... ben, cara boa, pero de mareo.' : 'Estás ben? Tes cara de mareo.'),
    CM('Este cubata... creo que o camareiro confundiu a cola co ron. Vivo aquí preto, pero se camiño vou acabar no Cabe.'),
    CM('Levaríasme á casa en moto? Mira, aí está a moto do Lemos... o dono está no bar vendo o partido. Nin se vai enterar. Ou si. Pero tarde.', {
      choices: [
        { t: 'Sube, que te levo', fn: () => [CM('Ai, que cabaleiro! Colle a moto e ven buscarme. Eu agarro ben forte, prometido.'), () => { Q.state = 'go'; persist(); setWaypoint(n.moto.x, n.moto.z); toast('Nova misión: colle a Moto do Lemos e leva a Carmiña á casa', 4.5); if (G.sfx.checkpoint) G.sfx.checkpoint(); }] },
        { t: 'Mellor chamo un taxi', fn: () => [CM('Un taxi? Ás horas que son en Monforte? Hip... ti verás. Se cambias de idea, aquí estou... abrazada a esta farola.')] },
      ],
    }),
  ]);
  if (Q.state === 'go') return openDialog([CM(G.player.car === n.moto ? 'Esa! Arrima a moto e subo.' : 'A moto do Lemos está aí mesmo... Vai, que isto dá voltas.')]);
  if (Q.state === 'ride') return openDialog([CM('Á casa, condutor! Hip!')]);
  return openDialog([CM('Grazas por levarme... ❤️')]);
}
function updateCarmina(dt) {
  const n = G.carmina; if (!n) { if (typeof ROADS !== 'undefined' && NPCS.length) spawnCarmina(); return; }
  const Q = carminaQ(), p = n.p, me = G.player.ped, car = G.player.car, t = G.t;
  if (Q.state === 'done' && !G.cine) { p.visible = false; for (const o of [n.skirt, n.glasses, n.drink]) o.visible = false; return; }
  if (Q.state === 'ride' || (Q.state === 'go' && car === n.moto && Math.hypot(car.x - p.x, car.z - p.z) < 4 && car.speed < 2.5 && !n.riding)) {
    // vai de paquete na moto
    if (car === n.moto) {
      if (!n.riding) { n.riding = true; Q.state = 'ride'; persist(); toast('Carmiña sobe atrás e abrázate forte. Á casa! (marcada no GPS)', 4); if (n.house) setWaypoint(n.house.x, n.house.z); }
      const m = n.moto, fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
      p.x = m.x - fx * 0.42; p.z = m.z - fz * 0.42; p.y = m.root.position.y + 0.42; p.yaw = m.yaw; p.sit = 0.75; p.walk = 0; p.arms = [-1.1, -0.5, 0.6, -1.1, 0.5, 0.6]; p.nod = 0.15;
      if (n.house && Math.hypot(m.x - n.house.x, m.z - n.house.z) < 9 && m.speed < 2) carminaArrive(n);
    } else if (n.riding) { // baixaches da moto: ela agarda alí
      n.riding = false; Q.state = 'go'; p.sit = 0; p.arms = null; p.x = me.x + 1; p.z = me.z + 0.6; p.y = groundH(p.x, p.z); toast('Carmiña baixa da moto e agarda a que volvas subir', 3);
    }
  } else if (!G.cine) {
    // de pé, cambaleando, co cubata
    p.walk = 0; p.sit = 0; const sway = Math.sin(t * 1.3 + n.ph) * 0.15; p.yaw += angDiff(p.yaw, Math.hypot(me.x - p.x, me.z - p.z) < 6 ? Math.atan2(me.x - p.x, me.z - p.z) : (n.home0.yaw + sway)) * Math.min(1, dt * 2);
    p.y = groundH(p.x, p.z); p.nod = 0.1 + Math.sin(t * 0.9 + n.ph) * 0.08; const sip = Math.sin(t * 0.5 + n.ph) > 0.75;
    p.arms = [-0.3, 0.12, 0.3, sip ? -1.9 : -0.9, -0.25, sip ? 2.0 : 1.3];
    n.lineT -= dt; if (n.lineT <= 0 && Math.hypot(me.x - p.x, me.z - p.z) < 25) { n.lineT = RR(5, 9); curritoSay(n, pick(CARMINA_LINES), 2.4); }
  }
  n.speech.position.set(p.x, p.y + 2.4, p.z); if (n.speechHold > 0) { n.speechHold -= dt; if (n.speechHold <= 0) n.speech.visible = false; }
}
const _cm = new THREE.Matrix4(), _co = new THREE.Matrix4();
function carminaOverlays() {
  const n = G.carmina; if (!n) return; const p = n.p, vis = p.visible;
  for (const o of [n.skirt, n.glasses, n.drink]) o.visible = vis;
  if (!vis) return;
  pedMatrix('hips', p.idx, n.skirt.matrix);
  pedMatrix('head', p.idx, _cm); _co.makeTranslation(0, 0.018, 0.124); n.glasses.matrix.copy(_cm).multiply(_co);
  pedMatrix('farm', p.idx * 2 + 1, _cm); _co.makeTranslation(0, -0.31, 0.04); n.drink.matrix.copy(_cm).multiply(_co);
  n.drink.visible = vis && !n.riding && !(G.cine && G.cine.kiss);
  for (const o of [n.skirt, n.glasses, n.drink]) o.matrixWorldNeedsUpdate = true;
}
/* ---------- chegada: bico e corazón ---------- */
function carminaArrive(n) {
  const Q = carminaQ(); Q.state = 'done'; persist(); n.riding = false;
  const m = n.moto; toggleCar(); m.inp.throttle = 0; m.inp.hand = 1;
  setWaypoint(null);
  const me = G.player.ped, p = n.p, H = n.house, fx = Math.cos(H.yaw), fz = -Math.sin(H.yaw);
  me.x = H.x - fx * 0.25; me.z = H.z - fz * 0.25; me.y = groundH(me.x, me.z); me.yaw = Math.atan2(fx, fz); me.visible = true; me.sit = 0;
  p.x = H.x + fx * 0.25; p.z = H.z + fz * 0.25; p.y = groundH(p.x, p.z); p.yaw = Math.atan2(-fx, -fz); p.sit = 0; p.arms = null;
  G.cine = { kiss: true, t: 0, look: new THREE.Vector3(H.x, me.y + 1.6, H.z) };
  $('hud').classList.add('cine');
}
function updateKiss(dt) {
  const K = G.cine, n = G.carmina, p = n.p, me = G.player.ped, H = n.house; K.t += dt;
  const k = Math.min(1, K.t / 1.2);
  // achéganse, ela ponse de puntas e... bico
  p.arms = [-1.6, 0.5, 0.9, -1.6, -0.5, 0.9]; p.nod = 0.25 * k; me.nod = 0.3 * k; p.y = groundH(p.x, p.z) + 0.05 * k;
  me.arms = K.t > 1 ? [-1.2, 0.5, 1.2, -1.2, -0.5, 1.2] : null;
  if (K.t > 1.2 && !K.chime) { K.chime = true; const A = G.sfx; if (A && A.ac) { const ac = A.ac, t0 = ac.currentTime; [784, 988, 1175, 1568].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0 + i * 0.12); g.gain.exponentialRampToValueAtTime(0.12, t0 + i * 0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.12 + 0.6); o.connect(g); g.connect(A.out); o.start(t0 + i * 0.12); o.stop(t0 + i * 0.12 + 0.65); }); } }
  const ht = K.t - 1.2; n.heart.visible = ht > 0;
  if (ht > 0) { const s = (0.6 + Math.min(1, ht * 1.5) * 0.9) * (1 + Math.sin(ht * 9) * 0.08); n.heart.scale.set(s, s, 1); n.heart.position.set(H.x, me.y + 3.0 + ht * 0.45, H.z); if (n.tag) n.tag.visible = false; n.heart.material.opacity = ht > 3 ? Math.max(0, 1 - (ht - 3)) : 1; }
  if (K.t > 1.4 && !K.msg) { K.msg = true; bigMsg('❤️', 'Carmiña chegou sa e salva á casa'); }
  if (K.t > 5) {
    n.heart.visible = false; me.arms = null; me.nod = 0; p.visible = false; G.cine = null; $('hud').classList.remove('cine');
    save.hearts = (save.hearts || 0) + 1; persist();
    toast('Carmiña: «Grazas, meu heroe... mañá devolve a moto do Lemos, eh?» ❤️', 5);
    if (G.sfx.win) G.sfx.win();
  }
  return true;
}
function kissCamera(dt) {
  const K = G.cine, me = G.player.ped, n = G.carmina, H = n.house, fx = Math.cos(H.yaw), fz = -Math.sin(H.yaw), sx = -fz, sz = fx;
  const tgt = new THREE.Vector3(H.x + sx * 2.6, me.y + 1.75, H.z + sz * 2.6), look = new THREE.Vector3(H.x, me.y + 1.6, H.z);
  if (!K.camInit) { camera.position.copy(tgt); K.look.copy(look); K.camInit = true; }
  camera.position.lerp(tgt, 1 - Math.pow(0.1, dt)); K.look.lerp(look, 1 - Math.pow(0.1, dt)); camera.lookAt(K.look); camera.fov = lerp(camera.fov, 42, dt * 2); camera.updateProjectionMatrix();
}
