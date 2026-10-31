'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Cinemática inicial do modo historia:
   Avelino no interior do rexional, mirando o móbil. Primeiro
   plano da pantalla co grupo «PUNTEIROLOS»... e o tren chega.
   ========================================================== */
const TREN = { x: 1210, z: 1090 };
const PUNT_MSGS = [
  ['Moncho', '#e0569a', 'Avelino, onde andas?? Xa estamos todos sentados 🍷'],
  ['Rober', '#2f7fd8', 'O meu chuletón está desaparecendo a velocidade de lóstrego 🥩🥩'],
  ['Xurxo', '#d88a1f', 'Como tardes moito vas ti mercar os chuletóns á carnicería 😂😂'],
  ['me', '', 'Xa chego!! Este tren vai a paso de ovella 🐑'],
  ['Lois', '#2fa36b', 'Falando de ovellas... sabedes a da ovella que miraba o río coa pata metida na bota do pastor? 😂'],
  ['Moncho', '#e0569a', 'OUTRA VEZ ESE CHISTE NON 🙈🙈'],
  ['Xurxo', '#d88a1f', 'E o pastor descalzo buscando a bota dende 1987 😂😂😂'],
  ['Rober', '#2f7fd8', 'Queda medio chuletón e o viño do peleón xa está aberto. Espabila!! 🍷'],
  ['me', '', 'Gardádeme un anaco!! Xa se ve o castelo de San Vicente 🏰'],
  ['Lois', '#2fa36b', 'Vai baixando, que a primeira rolda págala ti 😎'],
  ['me', '', 'Iso xa o veremos... 🙃'],
];
function buildTrenSet() {
  if (G.trenSet) return G.trenSet;
  const g = new THREE.Group(), y0 = cineFloor(TREN.x, TREN.z, 9); g.position.set(TREN.x, y0, TREN.z); G.scene.add(g);
  const L = 14, W = 2.9, H = 2.5;
  const mk = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  mk(new THREE.BoxGeometry(W, 0.1, L), std({ color: 0x3a3f46, roughness: 0.8 }), 0, -0.05, 0);
  mk(new THREE.BoxGeometry(W, 0.1, L), std({ color: 0xe9ebee }), 0, H + 0.05, 0);
  for (const z of [-L / 2, L / 2]) mk(new THREE.PlaneGeometry(W, H), std({ color: 0xd8dce0, side: THREE.DoubleSide }), 0, H / 2, z);
  // paisaxe que corre polas fiestras (viñas, montes, río)
  const c = cnv(1024, 256), x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, 256); sky.addColorStop(0, '#ff9a6a'); sky.addColorStop(0.5, '#ffc98a'); sky.addColorStop(1, '#9ab8d0'); x.fillStyle = sky; x.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 5; i++) { x.fillStyle = ['#5a7a4a', '#4a6a3a', '#6a8a4a', '#3a5a2e', '#557a42'][i]; x.beginPath(); x.moveTo(0, 256); for (let k = 0; k <= 1024; k += 32) x.lineTo(k, 120 + i * 18 + Math.sin(k * 0.01 + i * 2) * 26); x.lineTo(1024, 256); x.fill(); }
  for (let k = 0; k < 80; k++) { x.fillStyle = 'rgba(40,60,30,.6)'; x.fillRect(R() * 1024, 200 + R() * 50, 2, 8); }
  const land = toTex(c); land.wrapS = THREE.RepeatWrapping;
  const landM = new THREE.MeshBasicMaterial({ map: land, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const wall = mk(new THREE.PlaneGeometry(L, H), std({ color: 0xc8ccd2, side: THREE.DoubleSide }), s * W / 2, H / 2, 0, Math.PI / 2);
    const win = mk(new THREE.PlaneGeometry(L - 1, 0.9), landM, s * (W / 2 - 0.01), 1.45, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    for (let z = -L / 2 + 1; z < L / 2; z += 1.6) mk(new THREE.BoxGeometry(0.06, 1.0, 0.12), std({ color: 0x9aa0a6 }), s * (W / 2 - 0.03), 1.45, z);
    // asentos azuis
    for (let z = -5; z <= 5; z += 1.7) { const seat = std({ color: 0x2a4f8a, roughness: 0.8 }); mk(new THREE.BoxGeometry(0.95, 0.12, 0.5), seat, s * 0.85, 0.45, z); mk(new THREE.BoxGeometry(0.95, 0.75, 0.12), seat, s * 0.85, 0.85, z - 0.28); mk(new THREE.BoxGeometry(0.95, 0.18, 0.1), std({ color: 0xf2f2ee }), s * 0.85, 1.28, z - 0.28); }
    mk(new THREE.BoxGeometry(0.4, 0.04, L - 1), std({ color: 0x9aa0a6, metalness: 0.6 }), s * 1.1, 2.05, 0);
  }
  const light = new THREE.PointLight(0xfff1dc, 0, 12, 1.5); light.position.set(0, 2.3, 0); g.add(light);
  G.trenSet = { g, y0, land, light };
  return G.trenSet;
}
const PHONE_ARMS = [-0.55, 0.3, 1.55, -0.55, -0.3, 1.55];
function startTrainPhone() {
  const T = buildTrenSet(), me = G.player.ped;
  T.light.intensity = 1.4;
  [me.x, me.z] = [TREN.x + 0.85, TREN.z + 0.05]; me.y = T.y0; me.yaw = 0; me.sit = 1; me.visible = true; me.walk = 0; me.armUp = 0; me.nod = 0.45; me.arms = PHONE_ARMS;
  const ph = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), std({ color: 0x111113, emissive: 0x6aa0ff, emissiveIntensity: 0.4 })); G.scene.add(ph); T.phone = ph;
  G.cine = { phone: true, t: 0, look: new THREE.Vector3(), i: 0, next: 3.2 };
  $('hud').classList.add('cine'); const sb = $('skipIntro'); sb.innerHTML = 'Saltar <kbd>Espazo</kbd>'; sb.hidden = false;
  bigMsg('A HISTORIA DE AVELINO VILLAR', 'Rexional Santiago → Monforte · 20:20');
  phoneUI();
}
function phoneUI() {
  if ($('phoneUI')) { $('phoneUI').hidden = false; return; }
  const st = document.createElement('style');
  st.textContent = `#phoneUI{position:fixed;right:max(4vw,16px);top:50%;transform:translateY(-50%) translateX(30px);opacity:0;transition:opacity .5s,transform .5s;width:min(330px,78vw);height:min(600px,86vh);background:#111;border-radius:34px;padding:12px;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 3px #2a2a2c;z-index:45;pointer-events:none;font-family:Barlow,sans-serif}
#phoneUI.show{opacity:1;transform:translateY(-50%)}
#phoneUI .scr{width:100%;height:100%;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;background:#efe7dc}
#phoneUI .hd{background:#1f6f5a;color:#fff;padding:12px 12px 10px;display:flex;align-items:center;gap:10px}
#phoneUI .av{width:38px;height:38px;border-radius:50%;background:#f2c21b;display:grid;place-items:center;font-size:20px}
#phoneUI .tt b{display:block;font-size:17px;letter-spacing:.04em}#phoneUI .tt span{font-size:12px;opacity:.85}
#phoneUI .bd{flex:1;overflow:hidden;padding:10px 8px;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;background-image:radial-gradient(rgba(0,0,0,.05) 1px,transparent 1px);background-size:14px 14px}
#phoneUI .m{max-width:82%;padding:6px 9px 4px;border-radius:9px;font-size:14.5px;line-height:1.25;color:#1b1b1d;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.12);animation:pop .25s ease-out}
#phoneUI .m.me{align-self:flex-end;background:#d6f5c2}#phoneUI .m i{display:block;font-style:normal;font-weight:700;font-size:12.5px;margin-bottom:1px}
#phoneUI .m small{display:block;text-align:right;font-size:10px;opacity:.5}
#phoneUI .ty{align-self:flex-start;background:#fff;border-radius:9px;padding:6px 12px;font-size:18px;letter-spacing:2px;color:#8a8a8a}
#phoneUI .ft{background:#f6f6f6;padding:8px 10px;font-size:13px;color:#8a8a8a}
@keyframes pop{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}`;
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'phoneUI';
  d.innerHTML = `<div class="scr"><div class="hd"><div class="av">⚽</div><div class="tt"><b>PUNTEIROLOS</b><span>Moncho, Rober, Xurxo, Lois, ti</span></div></div><div class="bd" id="phBody"></div><div class="ft">Mensaxe...</div></div>`;
  document.body.appendChild(d);
}
function phonePush(i) {
  const [who, col, txt] = PUNT_MSGS[i], b = $('phBody'), ty = b.querySelector('.ty'); if (ty) ty.remove();
  const m = document.createElement('div'); m.className = 'm' + (who === 'me' ? ' me' : '');
  const hh = 20, mm = 21 + i;
  m.innerHTML = (who === 'me' ? '' : `<i style="color:${col}">${who}</i>`) + txt + `<small>${hh}:${String(mm).padStart(2, '0')}${who === 'me' ? ' ✓✓' : ''}</small>`;
  b.appendChild(m); while (b.children.length > 9) b.firstChild.remove();
  const A = G.sfx; if (A && A.ac) { const ac = A.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(who === 'me' ? 880 : 1180, t); o.frequency.exponentialRampToValueAtTime(who === 'me' ? 1200 : 1500, t + 0.08); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 0.16); }
}
function updatePhone(dt) {
  const K = G.cine, T = G.trenSet, me = G.player.ped; K.t += dt;
  T.land.offset.x += dt * 0.12;
  // o tren abanea
  me.y = T.y0 + Math.sin(G.t * 9) * 0.008; me.nod = 0.45 + Math.sin(G.t * 0.7) * 0.05; me.arms = PHONE_ARMS;
  const fx = Math.sin(me.yaw), fz = Math.cos(me.yaw);
  T.phone.position.set(me.x + fx * 0.42, me.y + 0.98, me.z + fz * 0.42); T.phone.rotation.set(-0.75, me.yaw, 0, 'YXZ');
  if (K.t > 2.2 && !K.ui) { K.ui = true; $('phoneUI').classList.add('show'); }
  K.next -= dt;
  if (K.ui && K.next <= 0) {
    if (K.i < PUNT_MSGS.length) {
      if (!K.typing) { K.typing = true; const b = $('phBody'), ty = document.createElement('div'); ty.className = 'ty'; ty.textContent = '•••'; b.appendChild(ty); K.next = 0.7; }
      else { K.typing = false; phonePush(K.i++); K.next = 1.5; }
    } else if (!K.end) { K.end = true; K.next = 2.2; toast('🚆 Próxima parada: Monforte de Lemos', 3); }
    else endTrainPhone();
  }
  return true;
}
function phoneCamera(dt) {
  const K = G.cine, me = G.player.ped;
  const a = Math.min(1, K.t / 6);
  const tgt = new THREE.Vector3(me.x - 0.75 + a * 0.15, me.y + 1.55 - a * 0.1, me.z + 1.3 - a * 0.2), look = new THREE.Vector3(me.x, me.y + 1.1, me.z);
  if (!K.camInit) { camera.position.copy(tgt); K.look.copy(look); K.camInit = true; }
  camera.position.lerp(tgt, 1 - Math.pow(0.1, dt)); K.look.lerp(look, 1 - Math.pow(0.05, dt));
  camera.lookAt(K.look); camera.fov = lerp(camera.fov, 50, dt * 2); camera.updateProjectionMatrix();
}
function endTrainPhone() {
  const T = G.trenSet, me = G.player.ped;
  $('phoneUI').classList.remove('show'); setTimeout(() => { if ($('phoneUI')) $('phoneUI').hidden = true; }, 600);
  T.light.intensity = 0; if (T.phone) T.phone.visible = false;
  me.sit = 0; me.armUp = 0; me.nod = 0; me.arms = null;
  G.cine = null;
  startArrivalIntro();
}
