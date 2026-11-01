'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Quiosco de Dona Concha (Praza da Estación,
   na beirarrúa do Hostal River): xornal local, lambetadas e
   conversa sobre o que pasa hoxe en Monforte.
   ========================================================== */
G.kiosk = null;
function buildKiosk() {
  const S = LM.station; if (!S || typeof PH === 'undefined') return;
  const b = PH.river, [x, z] = S.pt(b.x1 + 2.6, b.z0 - 4.5), yaw = S.yaw(Math.PI / 2), y0 = groundH(x, z);
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
  G.kiosk = { x, z, yaw, g, door: { x: dx, z: dz }, cx: x + Math.sin(yaw) * 0.55, cz: z + Math.cos(yaw) * 0.55 };
}
function updateKiosk(dt) {
  if (!G.kiosk && !G._kioskTried) { G._kioskTried = true; buildKiosk(); }
  const K = G.kiosk; if (!K) return;
  const me = G.player.ped;
  if (!K.p && typeof freePed === 'function' && Math.hypot(me.x - K.x, me.z - K.z) < 120) {
    const p = freePed(); if (p) { K.p = p; Object.assign(p, { state: 'npc', home: 'npc', npc: 'concha', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null, female: true, scale: 0.94 });
      Object.assign(p.col, { hair: '#c9c4bd', shirt: '#7a2f4a', pants: '#2a2a30', shoe: '#1a1a1a', sleeve: true, skin: '#efc8a8' }); world.crowd.paint(p); }
  }
  if (K.p && K.p.state === 'npc') { const p = K.p; p.x = K.cx; p.z = K.cz; p.y = groundH(p.x, p.z) + 0.05; const d = Math.hypot(me.x - p.x, me.z - p.z); p.yaw = d < 8 ? Math.atan2(me.x - p.x, me.z - p.z) : K.yaw; p.nod = d < 4 ? Math.max(0, Math.sin(G.t * 3)) * 0.06 : 0; }
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
function kioskInteract() {
  const K = G.kiosk; if (!K || G.player.car || G.dialog) return false;
  const me = G.player.ped; if (Math.hypot(me.x - K.door.x, me.z - K.door.z) > 2.6) return false;
  const C = (t, extra) => ({ who: 'Dona Concha', text: t, ...extra });
  const pay = (n) => { if (G.player.money < n) return false; G.player.money -= n; $('money').textContent = G.player.money + ' €'; return true; };
  const topics = () => C('De que queres saber?', { choices: [...kioskEvents().map(e => ({ t: e.tit, fn: () => [C(e.info), () => { if (e.at) { setWaypoint(e.at[0], e.at[1]); toast('Dona Concha marcouche o sitio no GPS', 2.5); } }, topics()] })), { t: 'Xa abonda, grazas', fn: () => [menu()] }] });
  const menu = () => C('Que che poño, rei?', { choices: [
    { t: 'O Xornal de Lemos (2 €)', fn: () => pay(2) ? [C('Aquí tes. Vén cheíño de cousas hoxe, non sei como imos dar abasto en Monforte!'), () => kioskNewspaper()] : [C('Non che chega, meu. Son dous euros. Volve cando teñas.'), menu()] },
    { t: 'Unha bolsa de lambetadas (1 €)', fn: () => pay(1) ? [C('Mestureiche ositos, moras e as de cocacola, que son as que máis saen. Non lle digas nada ao dentista.'), () => toast('Mercaches lambetadas. Ñam.', 2), menu()] : [C('Sen cartos non hai lambetadas, rei.'), menu()] },
    { t: 'Que hai hoxe pola vila?', fn: () => [C('Uf, hoxe Monforte está que non para. Mira, pregúntame o que queiras.'), topics()] },
    { t: 'Ata logo, Dona Concha', fn: () => [C('Vai con Deus, e cóidate, que andas moi delgadiño.')] },
  ] });
  openDialog([C(G.kioskMet ? 'Ola outra vez, rei!' : 'Boas tardes! Eu son a Concha, levo corenta anos neste quiosco. Aquí sabemos de todo antes que o xornal.'), menu()]);
  G.kioskMet = true; return true;
}
