'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Modo historia: «A historia de Avelino Villar»
   Avelino chega dende Cee (bus a Santiago e tren a Monforte) para
   a cea UCL no Restaurante Pulpería UCELERS. Tras a cea non pode
   pagar o viño do peleón: ten que conseguir cartos con misións,
   pagar a débeda, mercar o billete de volta e buscar onde durmir
   cada noite. Dúas noites seguidas ao raso → desmaio.
   ========================================================== */
G.story = null;
const STORY_DEBT = 150, STORY_TICKET = 45;
const AV = (t, extra) => ({ who: 'Avelino', text: t, ...extra });
const CW = (t, extra) => ({ who: 'Camareiro do UCELERS', text: t, ...extra });

/* ---------- menú: modo libre e modo historia con contrasinal ---------- */
function initModes() {
  initPlayerCap();
  if (typeof addExtraDests === 'function') addExtraDests();
  const play = $('btnPlay'); play.textContent = 'Modo libre';
  const sb = document.createElement('button'); sb.className = 'btn'; sb.id = 'btnStory'; sb.innerHTML = 'A historia de<br>Avelino Villar'; sb.style.lineHeight = '0.95';
  play.after(sb);
  const box = document.createElement('div'); box.id = 'storyPwd'; box.hidden = true;
  box.innerHTML = `<label for="pwdIn">Contrasinal</label><div class="pwrow"><input id="pwdIn" type="password" autocomplete="off" spellcheck="false" placeholder="···"><button class="btn small" id="pwdGo" type="button">Entrar</button></div><span id="pwdErr" hidden>Contrasinal incorrecto</span>`;
  sb.after(box);
  const st = document.createElement('style');
  st.textContent = `#storyPwd{display:flex;flex-direction:column;gap:6px;color:#e9e2d0;font-family:Barlow,sans-serif}
#storyPwd[hidden]{display:none}
#storyPwd label{font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
#storyPwd .pwrow{display:flex;gap:8px}
#storyPwd input{flex:1;min-width:0;font:600 22px Barlow,sans-serif;padding:8px 12px;background:#0d1013;border:2px solid #f2a33a;color:#fff;border-radius:4px;letter-spacing:.3em}
#storyPwd .btn.small{font-size:20px;padding:8px 14px}
#pwdErr{color:#ff7a6a;font-weight:700}
#storyHud{position:absolute;right:max(16px,env(safe-area-inset-right,0px));top:max(118px,env(safe-area-inset-top,0px));min-width:210px;background:linear-gradient(270deg,#15191df0,#15191dc0);border-right:4px solid #f2a33a;padding:8px 12px 9px;font-family:Barlow,sans-serif;color:#e9e2d0;font-size:15px;line-height:1.35;text-align:right;pointer-events:none}
#storyHud b{font-family:"Big Shoulders Display",sans-serif;font-size:21px;letter-spacing:.04em;color:#f2a33a;display:block}
#storyHud .ok{color:#7be08a}#storyHud .warn{color:#ff9a6a;font-weight:700}#storyHud .cold{color:#8fd0ff;font-weight:700}
@media (pointer:coarse){#storyHud{top:max(96px,env(safe-area-inset-top,0px));font-size:13px;min-width:170px}#storyHud b{font-size:17px}}`;
  document.head.appendChild(st);
  const hud = document.createElement('div'); hud.id = 'storyHud'; hud.hidden = true; $('hud').appendChild(hud);
  const tryPwd = () => {
    const v = $('pwdIn').value.trim().toUpperCase();
    if (v === 'UCL') { $('pwdErr').hidden = true; box.hidden = true; startStory(); }
    else { $('pwdErr').hidden = false; $('pwdIn').select(); }
  };
  sb.onclick = () => { box.hidden = !box.hidden; if (!box.hidden) setTimeout(() => $('pwdIn').focus(), 30); };
  $('pwdGo').onclick = tryPwd;
  $('pwdIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') tryPwd(); });
}

/* ---------- comezo ---------- */
function startStory() {
  G.story = { phase: 'arrive', day: 0, debt: STORY_DEBT, ticket: false, rough: 0, cold: false, slept: true, freeNight: true, prevHour: 20.5, snap: null, flags: {}, money0: save.money };
  // os cartos da historia van á parte dos do modo libre
  const orig = persist; window.persist = function () { const m = save.money; save.money = G.story ? G.story.money0 : m; orig(); save.money = m; };
  G.player.money = 0; save.money = 0; $('money').textContent = '0 €';
  startGame();
  G.timeScale = 1 / 120; // no modo historia o tempo pasa á metade de velocidade
  G.hour = 20.4; envTimer = 0; lastEnvHour = -99;
  $('btnStory').hidden = true; $('storyPwd').hidden = true;
  initStoryWorld();
  if (typeof startTrainPhone === 'function') startTrainPhone();
}
function storyAfterIntro() {
  const S = G.story; S.phase = 'goDinner';
  setTimeout(() => toast('Avelino Villar chega dende Cee: autobús ata Santiago e rexional ata Monforte. Esta noite é a cea UCL!', 6), 400);
  setTimeout(() => toast('Vai ao Restaurante Pulpería UCELERS, na Rúa de Chantada, 48 (marcado no GPS). Podes coller un taxi ou ir co Pellas (Y).', 6), 6600);
  const d = G.ucelersDoor; if (d) setWaypoint(d.x, d.z);
}

/* ---------- puntos da historia: durmir, pagar, billete ---------- */
function initStoryWorld() {
  const S = G.story, spots = S.spots = [];
  const add = (o) => { const tag = nameSprite(o.label, '#8fd0ff'); tag.visible = false; G.scene.add(tag); o.tag = tag; o.y = groundH(o.x, o.z); spots.push(o); };
  // pensión na Rúa de Concepción Arenal (preto da estación)
  if (LM.arenal) { const [x, z] = LM.arenal.pt(54, ARENAL.fl - 1.0); add({ id: 'pension', label: 'Pensión Arenal · 25 €', x, z, cost: 25, why: 'Unha cama de verdade, auga quente e almorzo de café con leite.' });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), nightMat(std({ map: textTex('PENSIÓN', { w: 512, h: 112, bg: '#1d4fd8', fg: '#ffffff', size: 76 }), emissive: 0xffffff, emissiveMap: textTex('PENSIÓN', { w: 512, h: 112, bg: '#000000', fg: '#ffffff', size: 76 }), side: THREE.DoubleSide }), 0.3, 1.2));
    const [sx, sz] = LM.arenal.pt(54, ARENAL.fl - 0.3); sg.position.set(sx, groundH(sx, sz) + 3.6, sz); sg.rotation.y = LM.arenal.yaw(Math.PI); G.scene.add(sg); }
  // albergue de peregrinos xunto ao mosteiro de Santa Clara
  if (LM.clara) { const [x, z] = LM.clara.pt(-60, -28); add({ id: 'albergue', label: 'Albergue de peregrinos · 8 €', x, z, cost: 8, open: h => h >= 18 && h < 23, why: 'Litera e ronquidos de peregrinos. Pecha ás 23:00.' }); }
  // sofás de amigos (hai que gañalos)
  const sj = LM.sajoni; if (sj) { const [x, z] = sj.pt(-2.4, -1.2); add({ id: 'sajoni', label: 'Tumbona do Sajoni', x, z, cost: 0, need: () => G.sajoniDanced, needTxt: 'O Sajoni só deixa durmir na tumbona a quen bailou con el.', why: 'Música ata as tantas, pero a manta é quentiña e Chispa fai de estufa.' }); }
  if (LM.volei) { const [x, z] = LM.volei.pt(-10.2, 0); add({ id: 'currito', label: 'Sofá de Currito', x, z, cost: 0, need: () => save.curritoWin, needTxt: 'Currito só lle deixa o sofá á súa parella do torneo (gaña a proba de pases).', why: 'Currito ensínache trucos de cartas ata as tres da mañá.' }); }
  { const pa = NPCS.find(n => n.id === 'pacho'); if (pa) add({ id: 'pancho', label: 'Casa de Pancho Camisolas', x: pa.p.x + 2, z: pa.p.z + 2, cost: 0, need: () => G.quest.state === 'done', needTxt: 'Pancho Camisolas só acolle a quen lle conseguiu a camiseta do Fener.', why: 'Durmes baixo un póster do Fenerbahçe. Moi amarelo todo.' }); }
  if (LM.fluvial) { const [x, z] = LM.fluvial.pt(-2, 11.6); add({ id: 'fluvial', label: 'Vestiarios do Club Fluvial (risco)', x, z, cost: 0, risk: 0.4, why: 'Un banco duro e cheiro a cloro.' }); }
  // pagar a débeda e mercar o billete
  S.points = [];
  if (G.ucelersDoor) S.points.push({ id: 'pay', x: G.ucelersDoor.x, z: G.ucelersDoor.z });
  { const p = G.stationStop || (([x, z]) => ({ x, z }))(LM.station.pt(340, 0)); S.points.push({ id: 'train', x: p.x, z: p.z }); }
  if (typeof advInit === 'function') advInit();
}
function nearStoryThing() {
  const S = G.story; if (!S || !S.spots || G.player.car) return null;
  const me = G.player.ped;
  for (const p of S.points) if (Math.hypot(me.x - p.x, me.z - p.z) < (p.id === 'train' ? 6 : 3.8)) return { kind: 'point', p };
  if (S.phase === 'play') for (const s of S.spots) if (Math.hypot(me.x - s.x, me.z - s.z) < 2.6) return { kind: 'sleep', s };
  return null;
}
function storyInteractHook() {
  const S = G.story; if (!S || G.dialog || G.cine) return false;
  const t = nearStoryThing(); if (!t) return false;
  if (t.kind === 'sleep') { trySleep(t.s); return true; }
  return advPoint(t.p.id, true);
  return false;
}
function storyPrompt() {
  const S = G.story, t = nearStoryThing(); if (!t || G.dialog) return;
  const K = isTouch ? '★' : 'E', h = G.hour;
  if (t.kind === 'sleep') { const s = t.s; setPrompt(`${K} · Durmir: ${s.label}${s.open && !s.open(h) ? ' (pechado)' : ''}`); return; }
  const id = t.p.id;
  const pr = advPoint(id, false); if (pr) setPrompt(pr);
}

/* ---------- a cea UCL (cinemática con diálogo) ---------- */
function storyDinner() {
  const S = G.story; S.phase = 'dinner';
  if (typeof startCena === 'function') { setWaypoint(null); return startCena(); }
  $('fade').classList.add('on'); setWaypoint(null);
  setTimeout(() => {
    G.hour = 23.6; envTimer = 0; lastEnvHour = -99;
    const d = G.ucelersDoor, me = G.player.ped; if (d) { me.x = d.x; me.z = d.z + 0.5; me.y = groundH(me.x, me.z); }
    $('fade').classList.remove('on');
    bigMsg('CEA UCL', 'Restaurante Pulpería UCELERS · Rúa de Chantada, 48');
    setTimeout(() => openDialog([
      CW('Benvidos á cea UCL! Polbo á feira, lacón con grelos e, para os campións... o noso viño do peleón, a xoia da casa.'),
      AV('Dous anos sen ver a esta xente! Isto hai que celebralo. Outra botella do peleón! E outra! E... que hora é?'),
      CW('Marchando! E outra. E outra... Que ben bebe a xente de Cee. Parecedes peixes de Fisterra.'),
      AV('Brindo pola UCL, polo polbo e polo inventor das servilletas de papel! Hip!'),
      AV('...'),
      CW('Ben, Avelino, xa é tarde e os teus compañeiros marcharon todos dunha vez, coma se tivesen ensaiado. Aquí está a conta do viño do peleón: 150 euros.'),
      AV('Cento cincuenta?! Tranquilo, que pago eu... A carteira... estaba aquí... Non está. Só teño cinco euros soltos e un caramelo de menta.'),
      CW('Home, Avelino... Fagamos unha cousa: non marchas de Monforte sen pagarme. E o tren a Cee custa 45 euros, que xa che vexo a cara.'),
      CW('Por certo: cando chegaches, xa ías medio contento e dicías que deixaras «algo moi importante» na estación. Empeza por aí.'),
      CW('Por esta noite podes durmir no almacén, entre as caixas de polbo. Só esta noite! E ollo co frío: unha noite ao raso aguántase mal... dúas, acabas no hospital.'),
      AV('Grazas. Mañá resolvo o misterio da carteira. Avelino Villar, detective privado... e moi resacoso.'),
      () => { G.player.money = 5; $('money').textContent = '5 €'; },
    ], () => storySleep({ id: 'almacen', label: 'Almacén do UCELERS', cost: 0, x: G.ucelersDoor.x, z: G.ucelersDoor.z, why: 'Durmes entre caixas de polbo e botellas baleiras do viño do peleón.' }, true)), 1200);
  }, 900);
}

/* ---------- durmir ---------- */
function trySleep(s) {
  const S = G.story, h = G.hour, night = h >= 20 || h < 6;
  if (!night) { toast('Aínda é cedo para durmir. Volve a partir das 20:00.'); return; }
  if (s.open && !s.open(h)) { toast(`${s.label.split(' ·')[0]}: pechado a estas horas.`); return; }
  if (s.need && !s.need()) { toast(s.needTxt, 4.5); return; }
  if (s.cost > G.player.money) { toast(`Non tes cartos: custa ${s.cost} € e tes ${G.player.money} €.`); return; }
  if (s.risk && R() < s.risk) {
    const fine = Math.min(15, G.player.money);
    G.player.money -= fine; $('money').textContent = G.player.money + ' €';
    openDialog([{ who: 'Conserxe do Fluvial', text: `Eh, ti! Que fas aquí a estas horas?! Fóra! ${fine ? 'E son ' + fine + ' euros de multa.' : 'Dá grazas que non tes nin para a multa.'}` }]);
    return;
  }
  if (s.cost) { G.player.money -= s.cost; $('money').textContent = G.player.money + ' €'; }
  storySleep(s, false);
}
function storySleep(s, first) {
  const S = G.story; S.phase = 'sleeping';
  $('fade').classList.add('on');
  setTimeout(() => {
    bigMsg(first ? 'PRIMEIRA NOITE' : 'BOA NOITE', s.why || '');
    setTimeout(() => {
      S.slept = true; newDay(true);
      G.hour = 8.5; S.prevHour = 8.5; envTimer = 0; lastEnvHour = -99;
      const me = G.player.ped; me.x = s.x; me.z = s.z; me.y = groundH(me.x, me.z); me.lie = 0; G.sajoniPl = null;
      S.snap = { money: G.player.money, day: S.day, debt: S.debt, ticket: S.ticket, x: s.x, z: s.z };
      $('fade').classList.remove('on'); S.phase = 'play';
      bigMsg('DÍA ' + S.day, first ? 'A carteira do viño do peleón' : (S.step && STEPS[S.step] ? STEPS[S.step].t : 'Bos días, Monforte'));
      if (first && typeof advStart === 'function') setTimeout(advStart, 2200);
    }, 2600);
  }, 900);
}
function newDay(slept) {
  const S = G.story; S.day++;
  if (slept) { S.rough = 0; S.cold = false; return; }
  S.rough++;
  if (S.rough === 1) { S.cold = true; toast('Pasaches a noite ao raso. Avelino tirita de frío: non pode correr ata que durma baixo teito.', 6); bigMsg('DÍA ' + S.day, 'Noite ao raso · moito frío'); }
  else storyFaint();
}
function storyFaint() {
  const S = G.story; S.phase = 'faint';
  $('fade').classList.add('on');
  setTimeout(() => {
    $('fade').classList.remove('on');
    bigMsg('DESMAIO', 'Dúas noites seguidas ao raso');
    G.player.money = 0; $('money').textContent = '0 €';
    openDialog([
      { who: 'Enfermeira', text: 'Espertaches! Atopáronte tirado nun banco, conxelado. Estás no Hospital Comarcal de Monforte.' },
      { who: 'Enfermeira', text: 'Dúas noites seguidas ao raso, Avelino... E a carteira, baleira outra vez. Así non se pode.' },
      { who: 'Enfermeira', text: 'Que fas agora?', choices: [
        { t: 'Volver a intentalo dende a última noite baixo teito', fn: () => [() => storyRetry()] },
        { t: 'Volver ao menú', fn: () => [() => location.reload()] },
      ] },
    ]);
  }, 1500);
}
function storyRetry() {
  const S = G.story, sn = S.snap; if (!sn) { location.reload(); return; }
  Object.assign(S, { day: sn.day, debt: sn.debt, ticket: sn.ticket, rough: 0, cold: false, slept: true, phase: 'play' });
  G.player.money = sn.money; $('money').textContent = sn.money + ' €';
  const me = G.player.ped; me.x = sn.x; me.z = sn.z; me.y = groundH(me.x, me.z);
  G.hour = 8.5; S.prevHour = 8.5; envTimer = 0; lastEnvHour = -99; camera._init = 0;
  bigMsg('DÍA ' + S.day, 'Segunda oportunidade');
}

/* ---------- débeda, billete e final ---------- */
function payDebt() {
  const S = G.story;
  if (S.debt <= 0) return;
  if (G.player.money < S.debt) { openDialog([CW(`Aínda me debes ${S.debt} euros do viño do peleón, Avelino. Tes ${G.player.money}. Volve cando os teñas!`)]); return; }
  G.player.money -= S.debt; $('money').textContent = G.player.money + ' €'; S.debt = 0; G.sfx.coin && G.sfx.coin();
  openDialog([CW('Cento cincuenta euros, contados. Palabra de Avelino Villar! Para a próxima cea UCL, o viño do peleón vai por conta da casa... unha botella.'), AV('Unha soa? Ben, algo é algo.')]);
}
function buyTicket() {
  const S = G.story;
  if (S.ticket) return;
  if (G.player.money < STORY_TICKET) { openDialog([{ who: 'Iván Nogal', text: `O billete a Cee (bus dende Santiago incluído) son ${STORY_TICKET} euros. Tes ${G.player.money}. Ánimo, que xa case!` }]); return; }
  G.player.money -= STORY_TICKET; $('money').textContent = G.player.money + ' €'; S.ticket = true; G.sfx.coin && G.sfx.coin();
  openDialog([{ who: 'Iván Nogal', text: S.debt > 0 ? 'Aquí tes o billete a Cee. Pero oín que debes cartos no UCELERS... non marches sen pagar, que Monforte é pequeno!' : 'Billete a Cee! Cando queiras, achégate á vía 1 e colle o tren.' }]);
}
function storyEnding() {
  const S = G.story; S.phase = 'end';
  $('fade').classList.add('on');
  setTimeout(() => {
    $('fade').classList.remove('on');
    const d = S.day, verdict = d <= 3 ? 'Lenda da UCL: liquidaches todo nun suspiro.' : d <= 5 ? 'Boa xestión! Monforte xa te considera un veciño máis.' : 'Custou, pero volves a casa coa cabeza alta.';
    bigMsg('FIN', `Avelino volve a Cee en ${d} ${d === 1 ? 'día' : 'días'}`);
    openDialog([
      AV('Débeda pagada, billete no peto e moitos amigos novos. Monforte, volverei... pero para a próxima cea UCL, auga.'),
      { who: 'Narrador', text: `${verdict} Remataches «A historia de Avelino Villar» en ${d} días.` },
      { who: 'Narrador', text: 'Que queres facer agora?', choices: [
        { t: 'Volver ao menú', fn: () => [() => location.reload()] },
        { t: 'Seguir paseando por Monforte', fn: () => [() => { G.story.phase = 'done'; $('storyHud').hidden = true; }] },
      ] },
    ]);
  }, 1500);
}

/* ---------- actualización ---------- */
function updateAvelino(dt) {
  const S = G.story; if (!S || !G.started) return;
  const me = G.player.ped, hud = $('storyHud');
  // chegada á cea
  if (S.phase === 'goDinner' && G.ucelersDoor && !G.cine) {
    const p = G.player.car || me;
    if (Math.hypot(p.x - G.ucelersDoor.x, p.z - G.ucelersDoor.z) < 9) { if (G.player.car && G.player.car.speed > 1) setPrompt('Para e baixa do coche (F)'); else { if (G.player.car) toggleCar(); storyDinner(); } }
  }
  // paso das 6:00 sen durmir baixo teito
  if (S.phase === 'play') {
    const h = G.hour;
    if (S.prevHour >= 12 && h < 12) S.slept = false; // pasou a medianoite
    if (S.prevHour < 6 && h >= 6 && !S.slept) newDay(false);
    if (S.prevHour < 20 && h >= 20) toast('Fai frío e vén a noite: busca onde durmir! (os sitios aparecen en azul)', 5);
    S.prevHour = h;
    // etiquetas dos sitios de durmir de noite
    const night = h >= 19.5 || h < 6;
    for (const s of S.spots) { const d = Math.hypot(camera.position.x - s.x, camera.position.z - s.z); s.tag.visible = night && d < 160; s.tag.position.set(s.x, s.y + 2.6 + Math.sin(G.t * 2) * 0.1, s.z); }
    storyPrompt();
  } else if (S.points) for (const s of S.spots || []) s.tag.visible = false;
  // HUD
  if (S.phase === 'done') return;
  hud.hidden = false;
  const hh = Math.floor(G.hour), mm = Math.floor((G.hour % 1) * 60), clock = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const night = G.hour >= 20 || G.hour < 6;
  if (S.day && typeof advHudHtml === 'function') { hud.innerHTML = advHudHtml(clock, night); if (typeof advUpdate === 'function') advUpdate(dt); return; }
  hud.innerHTML = `<b>${S.day ? 'DÍA ' + S.day : 'A CEA UCL'} · ${clock}</b>` +
    (S.day ? `<span class="${S.debt > 0 ? '' : 'ok'}">Débeda UCELERS: ${S.debt > 0 ? S.debt + ' €' : 'pagada ✓'}</span><br>` +
      `<span class="${S.ticket ? 'ok' : ''}">Billete a Cee: ${S.ticket ? 'no peto ✓' : STORY_TICKET + ' €'}</span><br>` +
      (S.cold ? '<span class="cold">Tiritando: noite ao raso (non podes correr)</span><br>' : '') +
      (night && S.phase === 'play' ? '<span class="warn">Busca onde durmir!</span>' : (S.debt <= 0 && S.ticket ? '<span class="ok">Colle o tren na vía 1!</span>' : ''))
      : 'Vai ao UCELERS, Rúa de Chantada 48');
}

/* ---------- gorra verde de Biona para a personaxe xogable ---------- */
function initPlayerCap() {
  if (G.playerCap || !world.crowd || !G.player.ped) return;
  const hg = new THREE.Group(); hg.matrixAutoUpdate = false; G.scene.add(hg);
  const green = std({ color: 0x1f9a4a, roughness: 0.75 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.128, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), green); crown.scale.set(1, 0.82, 1.04); crown.position.y = 0.025; crown.castShadow = true; hg.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.129, 0.129, 0.03, 18, 1, true), green); band.position.y = 0.012; hg.add(band);
  const visorG = new THREE.CylinderGeometry(0.115, 0.115, 0.012, 18, 1, false, -Math.PI * 0.42, Math.PI * 0.84); visorG.scale(1, 1, 1.35);
  const visor = new THREE.Mesh(visorG, green); visor.position.set(0, 0.012, 0.035); visor.rotation.x = 0.12; hg.add(visor);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), green); btn.position.y = 0.13; hg.add(btn);
  // logotipo dianteiro: óvalo branco con «Biona» en vermello
  const c = cnv(128, 80), x = c.getContext('2d');
  x.fillStyle = '#1f9a4a'; x.fillRect(0, 0, 128, 80);
  x.fillStyle = '#f6f4ee'; x.beginPath(); x.ellipse(64, 42, 58, 30, 0, 0, 7); x.fill(); x.strokeStyle = '#d4202b'; x.lineWidth = 3; x.stroke();
  x.fillStyle = '#1f9a4a'; for (const k of [-12, 0, 12]) { x.beginPath(); x.arc(64 + k, 13, 6, 0, 7); x.fill(); }
  x.fillStyle = '#d4202b'; x.font = 'italic 700 30px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Biona', 64, 40);
  x.fillStyle = '#1f9a4a'; x.fillRect(22, 56, 84, 5); x.fillStyle = '#d4202b'; x.fillRect(26, 62, 76, 5);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.072), std({ map: toTex(c, false), roughness: 0.8, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
  logo.position.set(0, 0.075, 0.118); logo.rotation.x = -0.45; hg.add(logo);
  G.playerCap = hg;
}
function updatePlayerCap() {
  const hg = G.playerCap, p = G.player.ped; if (!hg || !p) return;
  hg.visible = p.visible && !G.player.car;
  if (!hg.visible) return;
  world.crowd.meshes.head.getMatrixAt(p.idx, hg.matrix); hg.matrixWorldNeedsUpdate = true;
}
