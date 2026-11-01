'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Quiosco de Dona Concha (Praza da Estación,
   na beirarrúa do Hostal River): xornal local, lambetadas e
   conversa sobre o que pasa hoxe en Monforte.
   ========================================================== */
G.kiosk = null;
function buildKiosk() {
  const S = LM.station; if (!S || typeof PH === 'undefined') return;
  // na beirarrúa do Hostal River, pegado á súa fachada lateral que dá á rúa (non no medio da praza)
  const b = PH.river, cands = [[b.x0 + 7, b.z1 + 2.1, 0], [b.x0 + 7, b.z0 - 2.1, Math.PI], [b.x0 - 2.1, (b.z0 + b.z1) / 2, -Math.PI / 2], [b.x1 - 6, b.z1 + 2.1, 0], [b.x1 - 6, b.z0 - 2.1, Math.PI]];
  let pick0 = null;
  for (const [lx, lz, a] of cands) { const [cx, cz] = S.pt(lx, lz), yy = S.yaw(a), ox = Math.sin(yy), oz = Math.cos(yy);
    if (inRoad(cx, cz, 0) || inStreet(cx, cz, 0)) continue; let ok = false; for (const d of [3, 4.5, 6]) if (inRoad(cx + ox * d, cz + oz * d, 0) || inStreet(cx + ox * d, cz + oz * d, 0)) ok = true; if (ok) { pick0 = [cx, cz, yy]; break; } }
  if (!pick0) { const [cx, cz] = S.pt(b.x0 + 7, b.z1 + 2.1); pick0 = [cx, cz, S.yaw(0)]; }
  const [x, z, yaw] = pick0, y0 = groundH(x, z);
  const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = yaw; G.scene.add(g);
  const mk = (geo, mat, px, py, pz, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.x = rx; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const green = std({ color: 0x2f3b34, roughness: 0.5, metalness: 0.4 }), roofM = std({ color: 0x5b5f5c, roughness: 0.6, metalness: 0.3 }), white = std({ color: 0xf2f2ee, roughness: 0.5 });
  // caseta: 3 × 1,8 m, tellado de catro augas e toldo
  mk(new THREE.BoxGeometry(3.0, 2.4, 1.8), green, 0, 1.2, 0);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.7, 4, 1), roofM); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.62); rf.position.set(0, 2.75, 0); rf.castShadow = true; g.add(rf);
  mk(new THREE.BoxGeometry(3.2, 0.06, 0.9), std({ color: 0x8f938f, roughness: 0.5 }), 0, 2.35, 1.3, -0.25);
  // fronte: revisteiros con portadas, mostrador de lambetadas
  const mag = () => { const c = cnv(256, 160), xx = c.getContext('2d'); xx.fillStyle = '#e8e4da'; xx.fillRect(0, 0, 256, 160); for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { xx.fillStyle = pick(['#c0392b', '#2c6fb5', '#f1c40f', '#27ae60', '#8e44ad', '#e67e22', '#ecf0f1', '#1c2833']); xx.fillRect(4 + k * 42, 4 + r * 52, 38, 48); xx.fillStyle = 'rgba(255,255,255,.7)'; xx.fillRect(8 + k * 42, 10 + r * 52, 30, 6); } return toTex(c, false); };
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.25), std({ map: mag(), roughness: 0.7 })); front.position.set(0, 1.55, 0.91); g.add(front);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.0), std({ map: mag(), roughness: 0.7, side: THREE.DoubleSide })); w.position.set(s * 1.9, 1.1, 0.9); w.rotation.y = s * 0.5; w.castShadow = true; g.add(w); }
  const counter = mk(new THREE.BoxGeometry(2.6, 0.18, 0.5), white, 0, 0.85, 1.05);
  const cc = cnv(256, 64), cx2 = cc.getContext('2d'); for (let i = 0; i < 60; i++) { cx2.fillStyle = pick(['#ff5a8a', '#ffd23f', '#3ad1a0', '#ff7f2a', '#8f5aff', '#e8212a']); cx2.beginPath(); cx2.arc(R() * 256, R() * 64, 7, 0, 7); cx2.fill(); }
  const candy = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.42), std({ map: toTex(cc, false), roughness: 0.4 })); candy.rotation.x = -Math.PI / 2 + 0.3; candy.position.set(0, 0.96, 1.05); g.add(candy);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.32), std({ map: textTex('PRENSA · LAMBETADAS', { w: 512, h: 80, bg: '#2f3b34', fg: '#f2e6b0', size: 40 }), roughness: 0.6 })); sign.position.set(0, 2.25, 0.92); g.add(sign);
  addOBB(x, z, 1.6, 1.0, yaw, 3, 'quiosco');
  const [dx, dz] = [x + Math.sin(yaw) * 1.9, z + Math.cos(yaw) * 1.9];
  G.kiosk = { x, z, yaw, g, door: { x: dx, z: dz }, cx: x + Math.sin(yaw) * 1.25 + Math.cos(yaw) * 2.15, cz: z + Math.cos(yaw) * 1.25 - Math.sin(yaw) * 2.15 }; // ela, ao carón do revisteiro
}
function updateKiosk(dt) {
  if (!G.kiosk && !G._kioskTried) { G._kioskTried = true; buildKiosk(); }
  const K = G.kiosk; if (!K) return;
  const me = G.player.ped;
  // Dona Concha (pixel art achegado polo autor): atlas img/concha.png 4×2 — 0 perfil, 1-3 camiñar, 4 fronte, 5 falando, 6 lendo o xornal, 7 contenta
  if (!K.sp) {
    const tex = new THREE.TextureLoader().load('img/concha.png'); tex.magFilter = THREE.NearestFilter; tex.encoding = THREE.sRGBEncoding;
    const pg = new THREE.PlaneGeometry(1.0, 1.75); pg.translate(0, 0.875, 0);
    K.sp = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); G.scene.add(K.sp); K.fr = -1; K.t = 0;
  }
  K.t += dt;
  const sp = K.sp, y = groundH(K.cx, K.cz) + 0.1; sp.position.set(K.cx, y, K.cz); sp.rotation.y = Math.atan2(camera.position.x - K.cx, camera.position.z - K.cz);
  sp.material.color.setScalar(1 - 0.5 * (G.night || 0));
  const dme = Math.hypot(me.x - K.cx, me.z - K.cz), talking = G.dialog && $('dlgName').textContent === 'Dona Concha';
  const lx = Math.cos(K.yaw) * (camera.position.x - K.cx) - Math.sin(K.yaw) * (camera.position.z - K.cz), lz = Math.sin(K.yaw) * (camera.position.x - K.cx) + Math.cos(K.yaw) * (camera.position.z - K.cz);
  let f = K.cheer > 0 ? 7 : talking ? (Math.floor(K.t / 0.8) % 2 ? 5 : 4) : dme < 6 ? 4 : 6, flip = false;
  if (!talking && K.cheer <= 0 && Math.abs(lx) > Math.abs(lz) * 1.3) { f = 0; flip = lx > 0; }
  if (K.cheer > 0) K.cheer -= dt;
  if (K.fr !== f || K.flip !== flip) { K.fr = f; K.flip = flip; const t = sp.material.map, c = f % 4, r = Math.floor(f / 4); t.repeat.set(flip ? -0.25 : 0.25, 0.5); t.offset.set(flip ? (c + 1) / 4 : c / 4, r ? 0 : 0.5); }
  if (!G.player.car && !G.dialog && Math.hypot(me.x - K.door.x, me.z - K.door.z) < 2.6) setPrompt(`${isTouch ? '★' : 'E'} · Falar con Dona Concha (quiosco)`);
}
/* ---------- novas e información sobre cada evento ---------- */
function kioskEvents() {
  const ev = [];
  const cen = P => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
  ev.push({ id: 'medieval', tit: 'Monforte volve á Idade Media', sub: 'A Feira Medieval enche o contorno de San Vicente', txt: 'Postos de artesanía en Santo Domingo, Pescaderías e Falagueira; cetrería e tiro con arco na Praza de España; polbo, churrasco e filloas na Costa da Pena. Á noite, procesión de fachos ata o castelo con dragón incluído e, ás doce, suelta de farolillos.',
    info: 'Ai, a feira medieval! Os postos están en Santo Domingo, Pescaderías e a Falagueira. Se queres ver os falcóns, vai á Praza de España. E non te perdas a procesión de fachos de noite: soben ao castelo cun dragón de cartón que bota fume. Ás doce soltan os farolillos, é unha preciosidade.', at: typeof MED !== 'undefined' ? MED.plaza : [55, 276] });
  const mal = LM.malecon && LM.malecon.poly ? cen(LM.malecon.poly) : null;
  ev.push({ id: 'viño', tit: 'Feira do Viño no Malecón', sub: 'As adegas da Ribeira Sacra sacan a Mencía á rúa', txt: 'As carpas da Feira do Viño ocupan o Paseo do Malecón. Catas, petiscos e música ao carón do Cabe.',
    info: 'No Malecón hai feira do viño, fillo. Mencía da boa, da Ribeira Sacra. O meu home ía todos os anos e volvía cantando muiñeiras. Ti vai, pero bebe con cabeza, que logo hai que conducir.', at: mal });
  ev.push({ id: 'ponte', tit: '«NON Á PONTE»', sub: 'Veciños manifestándose no Malecón contra a nova ponte', txt: 'A asociación Salvemos o Malecón convoca unha protesta contra o proxecto da nova ponte. Pancartas, asubíos e moita indignación veciñal.',
    info: 'A da ponte é unha liorta, eh. Os de Salvemos o Malecón están que trinan. Están alí con pancartas no Malecón. Eu non me meto, que logo veñen mercar o xornal os dous bandos. Pero vaia, a ponte vella sempre foi a ponte vella.', at: mal });
  const bs = G.bandStage ? [G.bandStage.F.ox, G.bandStage.F.oz] : null;
  ev.push({ id: 'fonte', tit: 'Inaugúrase a gran fonte do Parque dos Condes', sub: 'Concerto de Los Roncolas e fogos artificiais', txt: 'O alcalde inaugura hoxe a nova fonte do Parque dos Condes. Despois, concerto de Los Roncolas e, ao caer a noite, fogos artificiais.',
    info: 'Hoxe inauguran a fonte do Parque dos Condes. Vai estar o Mayor, claro, que non perde unha foto. Despois tocan Los Roncolas e cando escurece tiran fogos. Se vas de noite colle sitio cedo, que se enche.', at: bs });
  const vo = LM.volei ? [LM.volei.ox, LM.volei.oz] : null;
  ev.push({ id: 'volei', tit: 'Torneo de Volei do Cuadrado', sub: 'Area, sol e Currito el Mago', txt: 'A pista de volei praia do Parque dos Condes acolle hoxe o torneo. O favorito do público: Currito el Mago, máis famoso polas súas celebracións que polos seus remates.',
    info: 'O torneo de volei é na pista de area do Parque dos Condes. Busca a Currito el Mago, ese rapaz que celebra todo coma se gañase o mundial. Din que busca parella... e que ten un sofá libre para quen gañe con el.', at: vo });
  const cr = G.carude && G.carude.F ? [G.carude.F.ox, G.carude.F.oz] : null;
  ev.push({ id: 'carude', tit: "Carud'e Rock fai tremer a Praza de Carude", sub: 'Guitarras, camisetas negras e altofalantes a tope', txt: "O festival Carud'e Rock volve á Praza de Carude con bandas locais e un público entregado. Os veciños queixanse do volume; os rockeiros, de que remate.",
    info: G.carude && G.carude.moved ? "O Carud'e Rock mudouse á Praza da Compañía despois do que pasou cos altofalantes... Ti non saberás nada diso, non? Ehh?" : "O Carud'e Rock está na Praza de Carude. Moita camiseta negra e moito pelo longo. A Virxinia, a das bolsas, non os pode nin ver, eh. Ela saberá por que.", at: cr });
  return ev;
}
function kioskNewspaper() {
  const ev = kioskEvents(), d = new Date(), dias = ['domingo', 'luns', 'martes', 'mércores', 'xoves', 'venres', 'sábado'];
  let el = $('xornal'); if (!el) { el = document.createElement('div'); el.id = 'xornal'; document.body.appendChild(el); }
  el.innerHTML = `<div class="xn-paper"><div class="xn-head"><div class="xn-name">O XORNAL DE LEMOS</div><div class="xn-date">Monforte de Lemos · ${dias[d.getDay()]} · Día ${G.story ? G.story.day : 1} · 2 €</div></div>
    <div class="xn-cols">${ev.map((e, i) => `<article class="${i === 0 ? 'xn-main' : ''}"><h2>${e.tit}</h2><h3>${e.sub}</h3><p>${e.txt}</p></article>`).join('')}</div>
    <button class="xn-close">Pechar o xornal</button></div>`;
  el.hidden = false; G.reading = true;
  el.querySelector('.xn-close').onclick = () => { el.hidden = true; G.reading = false; };
}
if (typeof PORTRAIT_IMG !== 'undefined') PORTRAIT_IMG['Dona Concha'] = 'img/concha-face.png';
const conchaMood = m => () => { if (typeof PORTRAITS !== 'undefined') PORTRAITS['Dona Concha'] = 'img/concha-' + m + '.png'; if (typeof setDialogFace === 'function' && G.dialog) setDialogFace('Dona Concha'); };
function kioskInteract() {
  const K = G.kiosk; if (!K || G.player.car || G.dialog) return false;
  const me = G.player.ped; if (Math.hypot(me.x - K.door.x, me.z - K.door.z) > 2.6) return false;
  if (typeof melKioskHook === 'function' && melKioskHook()) return true;
  const C = (t, extra) => ({ who: 'Dona Concha', text: t, ...extra });
  const pay = (n) => { if (G.player.money < n) return false; G.player.money -= n; $('money').textContent = G.player.money + ' €'; return true; };
  const topics = () => C('De que queres saber?', { choices: [...kioskEvents().map(e => ({ t: e.tit, fn: () => [C(e.info), () => { if (e.at) { setWaypoint(e.at[0], e.at[1]); toast('Dona Concha marcouche o sitio no GPS', 2.5); } }, topics()] })), { t: 'Xa abonda, grazas', fn: () => [conchaMood('face'), menu()] }] });
  const menu = () => C('Que che poño, rei?', { choices: [
    { t: 'O Xornal de Lemos (2 €)', fn: () => pay(2) ? [conchaMood('chisca'), () => { G.kiosk.cheer = 2.5; }, C('Aquí tes. Vén cheíño de cousas hoxe, non sei como imos dar abasto en Monforte!'), () => kioskNewspaper()] : [conchaMood('enfado'), C('Non che chega, meu. Son dous euros. Volve cando teñas.'), conchaMood('face'), menu()] },
    { t: 'Unha bolsa de lambetadas (1 €)', fn: () => pay(1) ? [conchaMood('chisca'), () => { G.kiosk.cheer = 2; }, C('Mestureiche ositos, moras e as de cocacola, que son as que máis saen. Non lle digas nada ao dentista.'), () => toast('Mercaches lambetadas. Ñam.', 2), conchaMood('face'), menu()] : [conchaMood('enfado'), C('Sen cartos non hai lambetadas, rei.'), conchaMood('face'), menu()] },
    { t: 'Que hai hoxe pola vila?', fn: () => [conchaMood('sorpresa'), C('Uf, hoxe Monforte está que non para. Mira, pregúntame o que queiras.'), conchaMood('pensa'), topics()] },
    { t: 'Ata logo, Dona Concha', fn: () => [C('Vai con Deus, e cóidate, que andas moi delgadiño.')] },
  ] });
  conchaMood('face')();
  openDialog([C(G.kioskMet ? 'Ola outra vez, rei!' : 'Boas tardes! Eu son a Concha, levo corenta anos neste quiosco. Aquí sabemos de todo antes que o xornal.'), menu()]);
  G.kioskMet = true; return true;
}
