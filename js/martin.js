'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Modo historia «Vía morta» · Martín Pardo
   Martín (28 anos, de Vilatán, O Saviñao) é maquinista e volve
   destinado ao depósito de Monforte despois de anos no Mediterráneo.
   Fala castelán (o resto do xogo, galego). Biblia do personaxe:
   vitalista, irónico, con retranca, corredor rapidísimo, do Dépor.
   ACTO 1 · O regreso: chaves no quiosco de Dona Concha → piso sen auga
   → burocracia no Concello (Eladio) → sinatura de Dona Amparo na
   Fraternal → carreira contra o peche → noite no piso e un asubío
   de vapor imposible (gancho para o acto 2).
   Gardado propio (save.martin), cartos á parte dos do modo libre.
   ========================================================== */
G.martin = null;
const MART_STEPS = {
  concha: 'Recolle as chaves do piso no quiosco de Dona Concha (Praza da Estación)',
  piso: 'Vai á túa casa: a Casa Juana, a vermella de Doutor Casares, 211 (xunto á gasolineira)',
  concello: 'Dá de alta a auga no Concello (Campo de San Antonio)',
  amparo: 'Busca a Dona Amparo, a caseira, na Fraternal',
  carreira: 'Leva o contrato ao Concello antes de que Eladio peche!',
  esperar: 'Eladio marchou ao café. Volve ao Concello en canto abra',
  casa: 'Volve á Casa Juana (Doutor Casares, 211) e descansa',
  fin1: 'Durme na Casa Juana (Doutor Casares, 211) para empezar o acto 2',
  a2: 'Reencontros: Valerio (farmacia), Mega Andrés (Fluvial) e Xoán (Malecón)',
  a2_taller: 'Investiga o vello taller da Casa Juana (Doutor Casares, 211)',
  a3_ivan: 'Pregúntalle a Iván Nogal, na estación, polo «tren pantasma»',
  a3_pistas: 'Investiga arredor do Museo do Ferrocarril (Q: ollo de maquinista)',
  a3_noite: 'Volve ás cocheiras do museo despois das 23:00',
  a4: 'Axuda aos do vapor: válvula, carbón e permiso',
  a4_fin: 'Volve ás cocheiras: Don Anxo espérate',
  a5: 'Sábado ás 21:00: a Mikado sae da estación. Sube á cabina (cocheiras do museo)',
  a5_noite: 'Domingo, 6:00: Iván espérate no vestíbulo da estación, diante do mural',
  fin: 'Vía morta · historia completada',
};
const MART_ACT = { concha: 1, piso: 1, concello: 1, amparo: 1, carreira: 1, esperar: 1, casa: 1, fin1: 1, a2: 2, a2_taller: 2, a3_ivan: 3, a3_pistas: 3, a3_noite: 3, a4: 4, a4_fin: 4, a5: 5, a5_noite: 5, fin: 5 };
const MART_DIAS = ['Luns', 'Martes', 'Mércores', 'Xoves', 'Venres', 'Sábado', 'Domingo'];
const MA = (t, extra) => ({ who: 'Martín', text: t, ...extra });
const MX = who => (t, extra) => ({ who, text: t, ...extra });
const CO = MX('Dona Concha'), EL = MX('Don Eladio'), AM = MX('Dona Amparo'), DV = MX('Tío David'), NA = MX('Nai'), VA = MX('Valerio'), AN = MX('Mega Andrés'), XO = MX('Xoán «o Galgo»'), IV = MX('Iván Nogal'), DA = MX('Don Anxo'), RE = MX('Remedios'), PE = MX('Pepe do Taller');


/* cara de Martín nos diálogos: img/mf-<emoción>.png (15 emocións do autor). L.mood manda; se non, polo texto */
const MART_MOOD_RX = [
  [/última vez que bajé|ocho horas de cabina|será el cansancio/i, 'pensativo'], [/progreso, lo llaman|palomas|sistema redondo|surrealista|lambretta|cuenta como calentamiento|respeto\.|cuentan como fruta|ositos de gominola/i, 'risueno'],
  [/ni una gota|me da miedo|estoy bien, mamá/i, 'preocupado'], [/¿número\?|usted está en la ventanilla|no me lo diga/i, 'esceptico'],
  [/eso ha sido un silbato|no puede ser/i, 'sorprendido'], [/palabra mágica|^¿correr/i, 'entusiasmado'], [/tiempo récord|apúntelo|kilómetros|traerle los trenes|del dépor/i, 'orgulloso'],
  [/me ganó|transbordos|cuarenta y ocho/i, 'frustrado'], [/agua: sí|ganarse un amigo|prometido/i, 'aliviado'], [/por curiosidad|mañana me paso/i, 'convencido'],
  [/hola, mamá|unas llaves|martín pardo/i, 'sonriente'], [/más pequeño|vergüenza|perdón/i, 'avergonzado'], [/\bjaja|ja, ja/i, 'risueno'], [/joder|maldit|basta ya/i, 'enfadado'], [/¿[^?]*\?\s*$/, 'dudoso'],
];
const MART_FROM_AVE = { sonriente: 'sonriente', rie: 'risueno', asustado: 'preocupado', enojado: 'enfadado', avergonzado: 'avergonzado', cansado: 'frustrado', confundido: 'dudoso', pensativo: 'pensativo', sorprendido: 'sorprendido' };
function martinMoodFor(t) {
  t = t || ''; for (const [rx, m] of MART_MOOD_RX) if (rx.test(t)) return m;
  if (/[áéíóú]|\b(el|la|los|las|que|pero|una)\b/i.test(t) && !/\b(o|a|os|as|unha|non|moi)\b/i.test(t)) return /!/.test(t) ? 'entusiasmado' : 'sonriente';
  return typeof aveMoodFor === 'function' ? (MART_FROM_AVE[aveMoodFor(t)] || 'neutro') : 'neutro';
}
function martinFaceFor(L) { return 'img/mf-' + (L.mood || martinMoodFor(L.text)) + '.png'; }

/* ---------- menú ---------- */
function initMartinMenu() {
  if ($('btnMartin')) return;
  const after = $('storyPwd') || $('btnStory') || $('btnPlay'); if (!after) return;
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'btnMartin'; b.innerHTML = 'Vía morta<br>Martín Pardo'; b.style.lineHeight = '0.95';
  after.after(b);
  const box = document.createElement('div'); box.id = 'martinBox'; box.hidden = true;
  box.innerHTML = `<span id="martinSaved">Tes unha partida de Martín gardada</span><div class="pwrow"><button class="btn small" id="martinCont" type="button">Continuar</button><button class="btn small" id="martinNew" type="button">Comezar de novo (acto 1)</button></div><span style="opacity:.75">Ou empezar nun acto:</span><div class="pwrow">${[1, 2, 3, 4, 5].map(n => `<button class="btn small" data-acto="${n}" type="button">${n}</button>`).join('')}</div>`;
  b.after(box);
  const st = document.createElement('style');
  st.textContent = `#martinBox{display:flex;flex-direction:column;gap:6px;color:#e9e2d0;font-family:Barlow,sans-serif;font-size:14px}#martinBox[hidden]{display:none}#martinBox .pwrow{display:flex;gap:8px}#martinBox .btn.small{font-size:18px;padding:8px 12px}`;
  document.head.appendChild(st);
  const has = () => save.martin && save.martin.step && save.martin.step !== 'concha';
  b.onclick = () => { if (!has()) { startMartin(false); return; } box.hidden = !box.hidden;
    const S = save.martin; $('martinSaved').textContent = `Tes unha partida de Martín no acto ${MART_ACT[S.step] || 1}.`; if (!box.hidden) setTimeout(() => box.scrollIntoView({ block: 'end', behavior: 'smooth' }), 30); };
  box.querySelectorAll('[data-acto]').forEach(x => x.onclick = () => { save.martin = martinActSave(+x.dataset.acto); startMartin(false); });
  $('martinCont').onclick = () => startMartin(false);
  $('martinNew').onclick = () => { save.martin = null; startMartin(true); };
}

/* partida no comezo de cada acto (selector do menú) */
function martinActSave(n) {
  const base = { money: 120, day: 0, flags: { eladio: 'record', asubio: true } }, F = base.flags;
  if (n <= 1) return { step: 'concha', money: 120, flags: {}, day: 0 };
  if (n >= 3) Object.assign(F, { tallerDone: true, valerio: true, andres: true, xoan: true, xoanVisto: true, ivanMural: true });
  if (n >= 4) Object.assign(F, { p_graxa: true, p_pegadas: true, p_pizarra: true, p_motor: true });
  if (n >= 5) Object.assign(F, { valvulaCarga: true, valvula: true, parte: true, parteBusca: true, carbon: true, permiso: true, permisoPaso: 'ok' });
  return { ...base, step: { 2: 'fin1', 3: 'a3_ivan', 4: 'a3_noite', 5: 'a5' }[n], day: { 2: 0, 3: 2, 4: 2, 5: 4 }[n], hour: { 2: 23, 3: 10, 4: 22.8, 5: 20.5 }[n], startAct: n };
}
/* ---------- comezo ---------- */
function startMartin(fresh) {
  if (!save.martin || fresh) save.martin = { step: 'concha', money: 120, flags: {}, day: 0 };
  const S = save.martin; S.flags = S.flags || {}; S.day = S.day || 0;
  G.martin = { t: 0, timer: 0, waitUntil: S.waitUntil || 0, race: null };
  // os cartos de Martín van á parte dos do modo libre
  const free = save.money, orig = persist;
  window.persist = function () { const m = save.money; if (G.martin) { save.martin.money = G.player.money; save.money = free; } orig(); save.money = m; };
  G.player.money = S.money; save.money = S.money; $('money').textContent = S.money + ' €';
  ['btnMartin', 'martinBox', 'btnStory', 'storyPwd'].forEach(id => { if ($(id)) $(id).hidden = true; });
  // retratos
  PORTRAITS['Martín'] = PORTRAITS['Ti'] = 'img/martin-face.png';
  if (typeof pixelFace === 'function') {
    PORTRAITS['Dona Amparo'] = pixelFace({ skin: '#ecc7ab', skinD: '#cfa588', hair: '#b9a9c9', shirt: '#2a4a3a', collar: '#f6f1e4', smile: true, bg: '#2a3a2a', bg2: '#6a8a5a' });
    PORTRAITS['Don Eladio'] = pixelFace({ skin: '#e3b48f', skinD: '#c08a66', hairStyle: 'side', hair: '#7a7a7a', shirt: '#3d4450', lapel: '#2f343c', tie: '#7a1f2a', collar: '#f4f2ec', moustache: '#6a6a6a', angry: true, bg: '#3a4048', bg2: '#8a939d' });
    PORTRAITS['Xoán «o Galgo»'] = pixelFace({ skin: '#e3b48f', skinD: '#c08a66', hair: '#2a1d14', hairStyle: 'spiky', shirt: '#e2452a', collar: '#f4f4f0', smile: true, bg: '#2a3a5a', bg2: '#5a8ad8' });
    PORTRAITS['Don Anxo'] = pixelFace({ skin: '#e9bc98', skinD: '#c99672', hairStyle: 'bald', hair: '#d6d2ca', cap: '#1d2a4a', shirt: '#2a3a5a', collar: '#6a7a9a', moustache: '#e0dcd4', smile: true, bg: '#2a2a2e', bg2: '#6a5a4a' });
    PORTRAITS['Remedios'] = pixelFace({ skin: '#e3b48f', skinD: '#c08a66', hair: '#9a9a9a', shirt: '#3a5a8a', collar: '#2a3a5a', angry: true, bg: '#3a2a1a', bg2: '#8a6a3a' });
    PORTRAITS['Pepe do Taller'] = pixelFace({ skin: '#d9a47e', skinD: '#b8835e', hair: '#3a2a1c', cap: '#1d4fd8', shirt: '#2a4a8a', collar: '#1d2a4a', stubble: true, smile: true, bg: '#2a3a4a', bg2: '#5a7a9a' });
    PORTRAITS['Nai'] = pixelFace({ skin: '#ecc7ab', skinD: '#cfa588', hair: '#6a4a3a', shirt: '#8a2a4a', collar: '#f6f1e4', smile: true, bg: '#4a2a3a', bg2: '#9a5a7a' });
  }
  startGame();
  G.hour = S.step === 'concha' ? 10.25 : S.startAct ? S.hour : Math.max(9, Math.min(S.hour || 11, 18)); envTimer = 0; lastEnvHour = -99;
  martinPlaces();
}
function martinPlaces() {
  const M = G.martin; if (!M) return;
  let fl = null; const E = G.fachadaEdge && G.fachadaEdge.casares211;
  if (E) { fl = { x: E.ax + E.ux * E.L * 0.5 + E.ox * 1.4, z: E.az + E.uz * E.L * 0.5 + E.oz * 1.4 }; M.flatDoor = { x: E.ax + E.ux * (E.door || E.L * 0.85) + E.ox * 1.2, z: E.az + E.uz * (E.door || E.L * 0.85) + E.oz * 1.2 }; }
  M.flat = fl || { x: 432, z: -492 };
  M.kiosk = G.kiosk ? G.kiosk.door : null;
  M.conc = G.concelloDoor || { x: -315, z: 183 };
  M.frat = typeof fraternalDoor === 'function' ? fraternalDoor() : null;
  M.farm = typeof MEL !== 'undefined' && MEL.farm ? MEL.farm : null;
  M.andres = typeof AND !== 'undefined' && AND.spot ? AND.spot : (LM.fluvial ? (([x, z]) => ({ x, z }))(LM.fluvial.pt(29.5, -14.6)) : null);
  const iv = typeof NPCS !== 'undefined' && NPCS.find(n => n.id === 'ivan'); M.ivan = iv ? iv.p : null;
  if (LM.station) { const P = ([x, z]) => ({ x, z }); M.museo = P(LM.station.pt(393.6, -138)); M.loco = P(LM.station.pt(392.5, -95));
    M.pistas = [{ id: 'graxa', ...P(LM.station.pt(392.5, -82.5)) }, { id: 'pegadas', ...P(LM.station.pt(393.4, -121)) }, { id: 'pizarra', ...P(LM.station.pt(393.8, -153)) }, { id: 'motor', ...P(LM.station.pt(393.6, -170)) }]; }
  const fe = G.fachadaEdge && G.fachadaEdge.ford; if (fe) M.taller = { x: fe.mx + fe.ox * 2, z: fe.mz + fe.oz * 2 };
  if (LM.malecon && LM.malecon.path) { const Pm = LM.malecon.path, q = Pm.at(Pm.len * 0.45), sd = LM.malecon.side; M.xoan = { x: q.x - q.uz * sd * 4.5, z: q.z + q.ux * sd * 4.5, yaw: Math.atan2(q.ux, q.uz) }; }
  if (LM.castle) { const [x, z] = LM.castle.pt(-112, -160); M.castelo = { x, z }; }
  if (LM.comp) { const [x, z] = LM.comp.pt(-35, 188); M.comp = { x, z }; }
}
/* tras a intro do tren */
function martinAfterIntro() {
  const S = save.martin; martinPlaces();
  if (S.step === 'concha') {
    openDialog([
      MA('Monforte. La última vez que bajé aquí de un tren llevaba la mochila del instituto y un bocata de chorizo.'),
      MA('Ahora traigo el tren entero. Progreso, lo llaman.'),
      MA('Hay más palomas que personas. Y las palomas también tienen pinta de estar jubiladas.'),
      MA('La dueña del piso me dijo que dejaba las llaves en el quiosco de la estación. Si es el de Concha, seguro que sigue abierto: ese quiosco ha sobrevivido a tres crisis y al euro.'),
      () => martinGo('concha'),
    ]);
  } else if (S.startAct) {
    const n = S.startAct; delete S.startAct; persist();
    if (n === 2) { toast('Acto 2 · Durme na Casa Juana (Doutor Casares, 211) para comezar o día', 5); martinGo('fin1', true); }
    else { bigMsg('ACTO ' + n, { 3: 'A curiosidade', 4: 'A implicación', 5: 'O descubrimento' }[n]); martinGo(S.step); if (n === 4) toast('Son case as 23:00: vai ás cocheiras do Museo do Ferrocarril', 5); }
  } else { martinGo(S.step, true); if (S.step === 'a2') martinSpawnXoan(); toast('Vía morta · ' + (MART_STEPS[S.step] || ''), 5); }
}
function martinGo(step, quiet) {
  martinPlaces(); const S = save.martin, M = G.martin; S.step = step; S.hour = G.hour; persist();
  const wp = martinWaypoint(step);
  if (wp && typeof setWaypoint === 'function') setWaypoint(wp.x, wp.z);
  if (!quiet && MART_STEPS[step]) toast(MART_STEPS[step], 4.5);
}

/* ---------- actualización: HUD, prompts, cronómetros, calendario ---------- */
function martinWaypoint(step) {
  const M = G.martin, S = save.martin, F = S.flags;
  if (step === 'a2') return !F.valerio ? M.farm : !F.andres ? M.andres : !F.xoan ? M.xoan : null;
  if (step === 'a4') return F.parteBusca && !F.parte ? M.flat : !F.valvula ? (F.valvulaCarga ? M.museo : M.taller) : !F.carbon ? M.andres : !F.permiso ? (F.permisoPaso === 'concha' || F.permisoPaso === 'agarda' ? M.kiosk : M.conc) : M.museo;
  return { concha: M.kiosk, piso: M.flat, concello: M.conc, amparo: M.frat, carreira: M.conc, esperar: M.conc, casa: M.flat, fin1: M.flat, a2_taller: M.flat, a3_ivan: M.ivan, a3_pistas: M.museo, a3_noite: M.museo, a4_fin: M.museo, a5: M.museo, a5_noite: M.ivan }[step] || null;
}
function martinInsert(lines) { const D = G.dialog; if (D) D.lines.splice(D.i + 1, 0, ...lines); }
const martinDia = () => MART_DIAS[((save.martin.day || 0) % 7 + 7) % 7];
const martinChampDay = () => { const w = ((save.martin.day || 0) % 7 + 7) % 7; return w === 1 || w === 2; };
function martinChecklist() {
  const S = save.martin, F = S.flags, ok = (b, t) => `<br><span class="${b ? 'ok' : ''}">${b ? '✔' : '·'} ${t}</span>`;
  if (S.step === 'a2') return ok(F.valerio, 'Valerio · farmacia do Cardeal') + ok(F.andres, 'Mega Andrés · Club Fluvial') + ok(F.xoan, 'Xoán «o Galgo» · Malecón');
  if (S.step === 'a3_pistas') return ok(F.p_graxa, 'Graxa no carril') + ok(F.p_pegadas, 'Pegadas') + ok(F.p_pizarra, 'Pizarra') + ok(F.p_motor, 'O motor do fondo');
  if (S.step === 'a4') return ok(F.valvula, 'Válvula · Taller Ford' + (F.valvulaCarga && !F.valvula ? ' (cárgala ata o museo)' : '')) + ok(F.carbon, 'Carbón · Mega Andrés') + ok(F.permiso, 'Permiso · Concello') + (F.parteBusca ? ok(F.parte, 'A carpintaría da Casa Juana') : '');
  return '';
}
function updateMartin(dt) {
  const M = G.martin; if (!M || !G.started) return;
  const S = save.martin, hud = $('storyHud');
  // calendario: cada vez que o reloxo pasa da medianoite, un día máis
  if (M.prevH !== undefined && G.hour < M.prevH - 12) { S.day = (S.day || 0) + 1; persist(); toast(`${martinDia()} · ${martinChampDay() ? 'hoxe hai Champions ás 20:00 na Fraternal' : 'novo día en Monforte'}`, 3.5); }
  M.prevH = G.hour;
  if (hud) {
    const min = martinHudMin(); let h = `<b class="sh-t">VÍA MORTA · ACTO ${MART_ACT[S.step] || 1}<i>${min ? '▸' : '▾'}</i></b>`; let body = `${MART_STEPS[S.step] || ''}${martinChecklist()}`;
    if (M.race && M.race.type === 'goto') { const t = Math.max(0, M.race.t); body += `<br><span class="${t < 15 ? 'warn' : 'ok'}">⏱ ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}</span>`; }
    if (M.race && M.race.type === 'cp') body += `<br><span class="ok">⏱ ${M.race.el.toFixed(1)} s · récord de Xoán ${M.race.target.toFixed(0)} s · control ${M.race.i + 1}/${M.race.cps.length}</span>`;
    if (S.step === 'esperar') { const m = Math.max(0, Math.ceil((M.waitUntil - G.hour) * 60)); body += `<br><span class="cold">Abre en ${m} min</span>`; }
    if (S.flags.permisoPaso === 'agarda') { const m = Math.max(0, Math.ceil((S.flags.firmasAt - G.hour) * 60)); body += `<br><span class="cold">Sinaturas: ${m > 0 ? 'Concha necesita ' + m + ' min' : 'listas no quiosco'}</span>`; }
    body += `<br><span class="cold">${martinDia()}${martinChampDay() ? ' · Champions 20:00' : ''}</span>`;
    // minimizada: só o título e, se hai carreira, o cronómetro
    if (min) { const t = M.race ? (M.race.type === 'goto' ? ` · ⏱ ${Math.ceil(Math.max(0, M.race.t))} s` : ` · ⏱ ${M.race.el.toFixed(0)} s`) : ''; h = h.replace('</b>', `</b><span class="sh-mini">${martinDia()}${t}</span>`); }
    else h += `<div class="sh-b">${body}</div>`;
    if (!hud._wired) martinHudWire(hud);
    hud.classList.toggle('min', min);
    if (hud._h !== h) { hud.innerHTML = h; hud._h = h; } hud.hidden = false;
  }
  if (!G.paused && !G.dialog && !G.cine) martinRaces(dt);
  martinChampions();
  if (M.carry && !S.flags.valvula && G.player.ped) G.player.ped.run = 0;
  martinSparkles(dt);
  if (typeof updateOjo === 'function') updateOjo(dt);
  if (typeof ojoButton === 'function') ojoButton();
  if (S.step === 'a2' && !S.flags.xoan && !M.xoanNPC && (M.xoanTry = (M.xoanTry || 0) - dt) <= 0) { M.xoanTry = 2; martinSpawnXoan(); }
  if (!G.dialog) { if ($('martinMural') && !$('martinMural').hidden) martinMural(false); if (M.inCasa && !M.sleeping) martinCasaOut(); }
  if (M.finale || M.inTaller) return;
  if (G.player.car || G.dialog || G.cine) return;
  const n = martinNear(); if (n) setPrompt(`${isTouch ? '★' : 'E'} · ${n.label}`);
}
/* a tarxeta de obxectivos pódese minimizar: tocándoa ou coa tecla O (gárdase a preferencia) */
function martinHudMin() { if (G.martin.hudMin === undefined) { try { G.martin.hudMin = localStorage.getItem('lemosHudMin') === '1'; } catch (e) { G.martin.hudMin = false; } } return G.martin.hudMin; }
function martinHudToggle() { const v = !martinHudMin(); G.martin.hudMin = v; try { localStorage.setItem('lemosHudMin', v ? '1' : '0'); } catch (e) { } const hud = $('storyHud'); if (hud) hud._h = ''; }
function martinHudWire(hud) {
  hud._wired = true; hud.style.pointerEvents = 'auto'; hud.style.cursor = 'pointer'; hud.title = 'Minimizar / amosar (O)';
  hud.addEventListener('click', e => { if (G.martin) { e.stopPropagation(); martinHudToggle(); } });
  const st = document.createElement('style');
  st.textContent = '#storyHud .sh-t i{font-style:normal;margin-left:8px;opacity:.7;font-size:.8em}#storyHud.min{min-width:0;padding:5px 10px}#storyHud .sh-mini{display:block;font-size:13px;opacity:.85}#storyHud .sh-b{max-width:340px}@media (pointer:coarse){#storyHud .sh-b{max-width:240px}}';
  document.head.appendChild(st);
}
window.addEventListener('keydown', e => { if (G.martin && G.started && !G.paused && !G.dialog && e.code === 'KeyO' && !e.repeat) martinHudToggle(); });
/* carreiras: contra o reloxo ata un punto ('goto') ou por controis ('cp') */
function martinCpMesh(c) {
  const M = G.martin;
  if (!M.cpMesh && G.cpMesh) { M.cpMesh = G.cpMesh.clone(); G.scene.add(M.cpMesh); }
  if (!M.cpMesh) return;
  M.cpMesh.visible = !!c; if (!c) return;
  M.cpMesh.position.set(c.x, groundH(c.x, c.z), c.z); M.cpMesh.scale.setScalar(c.r / 2.5); M.cpMesh.rotation.y += 0.03;
}
function martinRaces(dt) {
  const M = G.martin, R = M.race; if (!R) { if (M.cpMesh) M.cpMesh.visible = false; return; }
  const me = G.player.car || G.player.ped;
  if (R.type === 'goto') {
    R.t -= dt;
    if (R.t <= 0) { M.race = null; R.onFail && R.onFail(); }
    return;
  }
  if (R.type === 'cp') {
    if (G.player.car) { M.race = null; toast('Xoán: «En coche non vale, chulo! Volve ao Malecón e repetimos.»', 4.5); setWaypoint(M.xoan.x, M.xoan.z); return; }
    R.el += dt; const c = R.cps[R.i]; martinCpMesh(c);
    { const dme = Math.hypot(me.x - c.x, me.z - c.z); if (dme > 14 && (!G.waypoint || Math.hypot(G.waypoint.x - c.x, G.waypoint.z - c.z) > 1)) { G.waypoint = { x: c.x, z: c.z }; G._routeT = 0; } }
    if (Math.hypot(me.x - c.x, me.z - c.z) < c.r) {
      R.i++; if (G.sfx && G.sfx.bell) G.sfx.bell(c);
      if (R.i >= R.cps.length) { M.race = null; martinXoanFin(R.el, R.target); return; }
      const nx = R.cps[R.i]; setWaypoint(nx.x, nx.z); toast(`✔ ${c.n} · ${R.el.toFixed(1)} s → agora: ${nx.n}`, 2.4);
    }
  }
}
/* Champions: martes e mércores ás 20:00 Martín vai á Fraternal ver o fútbol co Tío David (ata as 23:00) */
function martinChampions() {
  const S = save.martin, M = G.martin; if (!martinChampDay() || ['concha', 'piso', 'concello', 'amparo', 'carreira', 'esperar', 'casa'].includes(S.step)) return;
  const key = 'champ' + S.day; if (S.flags[key]) return;
  if (G.hour >= 19.6 && G.hour < 20 && !M.champWarn) { M.champWarn = S.day; toast('Martín: «Las ocho menos poco. Hoy hay Champions con David: eso no se negocia.»', 4.5); if (M.frat) setWaypoint(M.frat.x, M.frat.z); }
  if (G.hour >= 20 && G.hour < 22.5 && !G.dialog && !G.cine && !G.minigame && !G.interior && !M.race && !M.finale && !G.mission) martinChampScene();
}
const CHAMP_EQ = ['Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Bayern', 'Liverpool', 'Manchester City', 'Arsenal', 'PSG', 'Inter', 'Milan', 'Juventus', 'Borussia Dortmund', 'Benfica', 'Porto', 'Napoli', 'Chelsea'];
function martinChampScene() {
  const S = save.martin, M = G.martin; S.flags['champ' + S.day] = true; persist();
  const pl = G.player; if (pl.car) toggleCarForce();
  const a = pick(CHAMP_EQ); let b = pick(CHAMP_EQ); while (b === a) b = pick(CHAMP_EQ);
  const ga = Math.floor(R() * 4), gb = Math.floor(R() * 4), res = ga > gb ? 0 : ga < gb ? 2 : 1;
  let bet = -1;
  const pickBet = k => () => { bet = k; return [MA(['Gana el de casa. Lo noto en las rodillas, como los abuelos con la lluvia.', 'Empate. Ni para ti ni para mí, como las bodas en Vilatán.', 'Gana el de fuera. Me gustan las causas perdidas: soy del Dépor.'][k])]; };
  $('fade').classList.add('on');
  setTimeout(() => {
    if (M.frat) { const me = pl.ped; me.x = M.frat.x; me.z = M.frat.z; me.y = groundH(me.x, me.z); }
    G.hour = Math.max(G.hour, 20); envTimer = 0; lastEnvHour = -99;
    if (typeof interiorEnter === 'function' && INTERIORS.fraternal) interiorEnter('fraternal');
    $('fade').classList.remove('on');
    openDialog([
      DV(pick(['Chegas xusto, rapaz! Aquí tes a túa cadeira, a de sempre. Ben, a de sempre dende o martes pasado.', 'Ven, senta, que xa sae o himno! Ese himno ponme os pelos de punta, e mira que me quedan poucos.', 'Martiño! Pon unha caña, Manolo, que chega o maquinista!'])),
      DV(`Hoxe xogan o ${a} e o ${b}. Que dis? Cinco euros, coma sempre?`, { choices: [{ t: `Gaña o ${a}`, fn: pickBet(0) }, { t: 'Empate', fn: pickBet(1) }, { t: `Gaña o ${b}`, fn: pickBet(2) }] }),
      DV(pick(['Ese dianteiro non remata nin unha papeleta. Eu, co Lemos, aquela contra o Ourense en Terceira, metina de cabeza no segundo pau. Ti viches que salto?', 'Isto antes era fútbol de verdade. Eu marqueille ao Ourense en Terceira cun barro ata os nocellos. Hoxe con este céspede marco eu sete.', 'Mira, mira! Iso é o que fixen eu contra o Ourense en Terceira! Ben... parecido. Eu fíxeno de cabeza e con máis estilo.'])),
      ...(!S.flags.ivanChamp ? [IV('Boas! Hai sitio para un do apoio? Traio pipas.'), DV('Iván! Senta. Contáballe ao rapaz o do meu gol ao Ourense, en Terceira, un domingo de sol...'), IV('Foi en mércores, David. E chovía. Saíches na foto do xornal co barro ata os xeonllos.'), DV('... Pois é verdade. E ti como sabes iso, se naciches en Suíza?'), IV('Lin moito xornal vello. Hai que entreterse en algo nas noites de inverno.'), () => { S.flags.ivanChamp = true; }] : []),
      MA(pick(['David, si me cuentas otra vez lo del Ourense, me lo aprendo de memoria y lo narro yo en la próxima.', 'Lo del Ourense en Tercera. Lo sé. Segundo palo. De cabeza. Barro hasta los tobillos. David, eres una leyenda.', 'Yo una vez vi a Fran hacer eso en Riazor. Bueno, en la tele del bar de Vilatán. Bueno, se parecía a Fran.'])),
      () => { $('fade').classList.add('on'); setTimeout(() => { G.hour = 23.0; envTimer = 0; lastEnvHour = -99; $('fade').classList.remove('on'); }, 700); },
      DV(`Final: ${a} ${ga}, ${b} ${gb}. ${res === 1 ? 'Empate, que aburrimento!' : `Gañou o ${res === 0 ? a : b}.`}`),
      () => {
        const won = bet === res; if (bet >= 0) { G.player.money = Math.max(0, G.player.money + (won ? 5 : -Math.min(5, G.player.money))); $('money').textContent = G.player.money + ' €'; persist(); }
        martinInsert([won ? DV('Aaaai, xa me levaches cinco euros! Mañá cóbroos ao dominó, que lo sepas.') : DV('Cinco euros para a miña hucha! Iso pásache por ser do Dépor, que xa vés acostumado a perder.'),
          MA(won ? 'Cinco euros. Me los guardo para el café de mañana. Mañana te invito... a mirar cómo me lo tomo.' : 'Tranquilo, David. Llevo toda la vida perdiendo apuestas. Soy del Dépor: es nuestro deporte nacional.')]);
      },
      DV('Ala, as once. Vai durmir, rapaz, que mañá madrugas. E pecha ben o portal, que anda por aí o tren pantasma... ha, ha!'),
      MA('Las once. Hora de dormir: mañana tengo turno. Buenas noches, David. Y no le cuentes lo del Ourense al camarero, que ya se lo sabe.'),
      () => { if (G.interior) interiorExit(); if (M.flat) setWaypoint(M.flat.x, M.flat.z); toast('Son as 23:00 · Vai durmir á Casa Juana (Doutor Casares, 211)', 4.5); },
    ]);
  }, 700);
}
/* durmir no piso: pasa ao día seguinte ás 8:00 */
function martinSleep() {
  const S = save.martin, M = G.martin;
  M.sleeping = true; martinCasaIn(); $('fade').classList.add('on');
  setTimeout(() => {
    M.sleeping = false; martinCasaOut();
    if (G.hour > 12) S.day = (S.day || 0) + 1;
    G.hour = 8.0; M.prevH = 8; envTimer = 0; lastEnvHour = -99; persist();
    $('fade').classList.remove('on');
    if (S.step === 'fin1') martinAct2(); else bigMsg(martinDia().toUpperCase(), '8:00 · Doutor Casares, 211');
    if (S.step === 'a3_noite') toast('Martín: «He dormido como un tronco... y los fantasmas, sin mí. Esta noche, a las once, al depósito.»', 5);
  }, 900);
}
function martinNear() {
  const S = save.martin, M = G.martin, me = G.player.ped, F = S.flags; if (!M || !me || M.inTaller) return null;
  const d = p => p ? Math.hypot(me.x - p.x, me.z - p.z) : 1e9;
  const dCasa = Math.min(d(M.flat), d(M.flatDoor)), nearCasa = dCasa < 4.8;
  if (S.step === 'concha' && G.kiosk && Math.min(d(M.kiosk), d({ x: G.kiosk.cx, z: G.kiosk.cz })) < 3.6) return { id: 'concha', label: 'Falar con Dona Concha' };
  if ((S.step === 'piso' || S.step === 'casa') && nearCasa) return { id: S.step, label: S.step === 'piso' ? 'Abrir o piso' : 'Entrar no piso' };
  if (['concello', 'carreira', 'esperar'].includes(S.step) && d(M.conc) < 5) return { id: S.step, label: 'Ventanilla do Concello' };
  if (S.step === 'amparo' && d(M.frat) < 3.4) return { id: 'amparo', label: 'Entrar na Fraternal' };
  const late = MART_ACT[S.step] >= 2 || S.step === 'fin1';
  if (S.step === 'concha' && nearCasa) return { id: 'pechada', label: 'Casa Juana (pechada)' };
  if (['concello', 'amparo', 'carreira', 'esperar'].includes(S.step) && nearCasa) return { id: 'senauga', label: 'Entrar na casa' };
  if (S.step === 'a4' && F.parteBusca && !F.parte && nearCasa) return { id: 'carpintaria', label: 'Rexistrar a vella carpintaría' };
  if (S.step === 'a2_taller' && nearCasa) return { id: 'taller', label: 'Entrar no taller vello' };
  if (late && nearCasa) return (G.hour >= 21.5 || G.hour < 6) ? { id: 'sleep', label: 'Durmir na casa' } : { id: 'casaDia', label: 'Entrar na casa' };
  if (S.step === 'a2') {
    if (!F.valerio && d(M.farm) < 3.4) return { id: 'valerio', label: 'Entrar na farmacia (Valerio)' };
    if (!F.andres && d(M.andres) < 3.2) return { id: 'andres', label: 'Falar con Mega Andrés' };
    if (!F.xoan && d(M.xoan) < 3.2) return { id: 'xoan', label: M.race ? 'Carreira en curso' : 'Falar con Xoán «o Galgo»' };
  }
  if (S.step === 'a3_ivan' && d(M.ivan) < 3.4) return { id: 'ivan', label: 'Falar con Iván Nogal' };
  if (!F.ivanMural && ['piso', 'concello', 'amparo', 'esperar', 'casa', 'fin1', 'a2'].includes(S.step) && d(M.ivan) < 3.4) return { id: 'ivanMural', label: 'Falar con Iván Nogal' };
  if (S.step === 'a3_pistas') { for (const p of M.pistas || []) if (!F['p_' + p.id] && d(p) < 2.6) return { id: 'pista', p, label: 'Examinar' }; }
  if ((S.step === 'a3_noite' || S.step === 'a3_pistas') && d(M.museo) < 3.6 && S.step === 'a3_noite') return { id: 'noite', label: (G.hour >= 23 || G.hour < 5) ? 'Agardar nas cocheiras' : 'Esperar ata as 23:00' };
  if (S.step === 'a4') {
    if (!F.valvula && !F.valvulaCarga && d(M.taller) < 4) return { id: 'pepe', label: 'Falar con Pepe do Taller' };
    if (F.valvulaCarga && !F.valvula && d(M.museo) < 4) return { id: 'entregar', label: 'Deixar a válvula nas cocheiras' };
    if (F.parteBusca && !F.parte && nearCasa) return { id: 'carpintaria', label: 'Rexistrar a vella carpintaría' };
    if (!F.carbon && d(M.andres) < 3.2) return { id: 'carbon', label: 'Falar con Mega Andrés' };
    if (!F.permiso && d(M.conc) < 5 && F.permisoPaso !== 'concha' && F.permisoPaso !== 'agarda') return { id: 'permiso', label: 'Ventanilla do Concello' };
    if (!F.permiso && (F.permisoPaso === 'concha' || F.permisoPaso === 'agarda') && G.kiosk && Math.min(d(M.kiosk), d({ x: G.kiosk.cx, z: G.kiosk.cz })) < 3.6) return { id: 'firmas', label: 'Falar con Dona Concha' };
  }
  if (S.step === 'a4_fin' && d(M.museo) < 3.6) return { id: 'a4fin', label: 'Entrar nas cocheiras' };
  if (S.step === 'a5' && d(M.museo) < 3.6) return { id: 'final', label: 'Subir á cabina da Mikado' };
  if (S.step === 'a5_noite' && d(M.ivan) < 4) return { id: 'muralCine', label: 'Falar con Iván (antes do tren a Vilatán)' };
  return null;
}
function martinInteract() {
  if (!G.martin || G.player.car || G.dialog || G.cine || G.minigame || G.martin.finale) return false;
  const n = martinNear(); if (!n) return false;
  ({ concha: martinConcha, piso: martinPiso, concello: martinConcello1, amparo: martinAmparo, carreira: martinConcello2, esperar: martinConcello2, casa: martinCasa, sleep: martinSleep,
    valerio: martinValerio, ivanMural: martinIvanMural, andres: martinAndres, xoan: martinXoan, ivan: martinIvan, pista: () => martinPista(n.p), noite: martinNoite,
    pepe: martinPepe, entregar: martinEntrega, carpintaria: martinCarpintaria, carbon: martinCarbon, permiso: martinPermiso, firmas: martinFirmas, a4fin: martinA4Fin, final: martinFinal, vilatan: martinVilatan, pechada: () => openDialog([MA('Cerrada. Normal: las llaves las tiene Concha, en el quiosco de la plaza de la estación. Primero el quiosco, luego la casa.', { mood: 'esceptico' })]),
    senauga: () => openDialog([MA('Sin agua y sin luz no hay nada que hacer aquí dentro. Primero, el papeleo. Que Dios me pille confesado.', { mood: 'frustrado' })]),
    casaDia: () => { martinCasaIn(); openDialog([MA(pick(['Casa Juana. Más de cien años, varios dueños y un taller atrás con argollas en el techo. Y ahora, un maquinista.', 'Café, ducha y a la calle. Monforte no se descubre desde el sofá.', 'Desde el balcón se ve el depósito. Quien eligió esta casa sabía lo que hacía.'])), () => martinCasaOut()]); }, muralCine: martinMuralCine, taller: martinTaller })[n.id]();
  return true;
}

/* ---------- escenas ---------- */
function martinConcha() {
  openDialog([
    CO('Bos días, que vai ser? Prensa, gominolas, un cupón...?'),
    MA('Unas llaves, si las tiene. Y una bolsa de ositos, por los viejos tiempos.'),
    CO('... Espera. Esa cara... Ti es o rapaz de Vilatán! O que viña cada luns a por sobres de cromos do Dépor e nunca lle saía o Djalminha!'),
    MA('Nunca. Seis temporadas intentándolo. Aún tengo tres Fran repetidos, por si alguien está interesado.'),
    CO('Martiño Pardo! Estás feito un home. E que alto! Na túa casa daban ben de comer.'),
    MA('Caldo de mi madre y kilómetros. Muchos kilómetros.'),
    CO('A Amparo deixoume as chaves, si. A Casa Juana! A vermella de Doutor Casares, a 211, a do lado da gasolineira. Leva moitos anos pechada e agora arranxárona para alugar. Non sei eu se terá auga.'),
    MA('¿Casa Juana? ¿Quién es Juana?'),
    CO('A muller do señor Alfredo, o carpinteiro. Aí tiña unha carpintaría que daba gusto: máquinas, motores, correas... Dende o quiosco oíase o serrón. Pregúntalle á Amparo, que lle encanta contalo.'),
    MA('Mientras tenga techo, ya es mejor que algún cuarto de descanso en el que he dormido.'),
    CO('E que fas de volta por aquí? Os mozos marchan, non volven.'),
    MA('Me han destinado al depósito. Maquinista. Alguien tiene que traerle los trenes a los que se quedan.'),
    CO('Ai, que ben falas! Pois benvido, rapaz. Monforte está máis vello ca min, pero aínda dá guerra.'),
    () => { G.player.money = Math.max(0, G.player.money - 2); $('money').textContent = G.player.money + ' €'; persist(); martinGo('piso'); },
  ]);
}
/* interior da casa vermella: ao entrar vese ao chou o salón ou a cociña (imaxes do autor) */
function martinCasaIn() {
  let el = $('martinCasa');
  if (!el) { el = document.createElement('div'); el.id = 'martinCasa'; el.style.cssText = 'position:fixed;inset:0;z-index:24;background:#0d1013 center/cover no-repeat;image-rendering:pixelated'; document.body.appendChild(el); }
  el.style.backgroundImage = `url(img/casa-${R() < 0.5 ? 'salon' : 'cocina'}.jpg)`; el.hidden = false; G.martin.inCasa = true;
}
function martinCasaOut() { const el = $('martinCasa'); if (el) el.hidden = true; if (G.martin) G.martin.inCasa = false; }
function fadeScene(fn, ms = 700) { $('fade').classList.add('on'); setTimeout(() => { fn(); $('fade').classList.remove('on'); }, ms); }
function martinPiso() {
  openDialog([
    MA('La casa roja de al lado de la gasolinera. De pequeño pensaba que aquí vivía un pirata. Ahora vivo yo. No sé quién sale ganando.'),
    () => { $('fade').classList.add('on'); setTimeout(() => { martinCasaIn(); $('fade').classList.remove('on'); }, 700); },
    MA('Vaya. Parqué, cocina blanca, balcón de hierro... Alguien la reformó hace nada. Huele a cerrado y a pintura nueva. Mejor que muchos hoteles de Renfe.'),
    MA('Grifo... nada. Ni una gota. Interruptor... tampoco. Todo nuevo, todo en su sitio y nada funciona: una casa en vía muerta.'),
    MA('Por la ventana de la cocina se ve la casa de atrás: una nave vieja con vigas de madera y argollas de hierro en el techo, en fila. Como para colgar ejes. Qué raro.', { mood: 'pensativo' }),
    MA('Hay una nota en la nevera: «Para dar de alta a auga, ir ao Concello. Ventanilla 3. Preguntar por Eladio».'),
    MA('«Preguntar por Eladio». No sé por qué, pero esa frase me da miedo.'),
    () => { martinCasaOut(); martinGo('concello'); },
  ]);
}
function martinConcello1() {
  openDialog([
    EL('Bo día. Número?'),
    MA('¿Número? Si aquí no hay nadie.'),
    EL('Sen número non se atende. A máquina está aí, á dereita.'),
    MA('El uno. Qué ilusión: la primera vez que soy el primero en algo que no sea una carrera.'),
    EL('Número un! Dígame.'),
    MA('Vengo a dar de alta el agua de una casa. Doctor Casares, 211. La roja.'),
    EL('Iso é na ventanilla 3.'),
    MA('... Usted está en la ventanilla 3.'),
    EL('Agora estou na 1. A 3 é pola tarde. Pero bueno, xa que está: ten o certificado de empadroamento?'),
    MA('He llegado hace una hora. Empadronado, lo que se dice empadronado, estoy en la cabina de una locomotora.'),
    EL('Para empadroarse precisa o contrato de aluguer asinado pola propietaria. Sen contrato non hai padrón, e sen padrón non hai auga.'),
    MA('Y sin agua no hay ducha, y sin ducha no hay vida social. Es un sistema redondo, la verdad. Ni Renfe lo habría diseñado mejor.'),
    EL('A propietaria é a Amparo, non? Esa pasa todas as mañás na Fraternal, xogando á brisca. Pero dese présa: eu pecho ás dúas en punto. Nin un minuto máis.'),
    MA('He hecho transbordos en Chamartín más sencillos que esto.'),
    () => martinGo('amparo'),
  ]);
}
function martinAmparo() {
  const inside = typeof interiorEnter === 'function' && typeof INTERIORS !== 'undefined' && INTERIORS.fraternal;
  if (inside) interiorEnter('fraternal');
  openDialog([
    DV('Eeeh, mira quen entra! Un rapaz novo na Fraternal! Isto non pasaba dende o noventa e oito.'),
    AM('Copas! E arrastro! ... Quen é este mozo tan guapo, David?'),
    MA('Martín Pardo, su nuevo inquilino. La Casa Juana, en Doctor Casares. Necesito que me firme el contrato, Doña Amparo.'),
    AM('Ai, o maquinista! Moi ben, moi ben. Eu lévolles as chaves aos donos, que agora a teñen de apartamento. Sabes de quen foi esa casa? Do señor Alfredo, carpinteiro e industrial, e da súa segunda muller, a Juana. De aí o nome.'),
    AM('Na nave de atrás tiña unha carpintaría con máquinas que nin en Ourense: un motor Siemens de dez cabalos, unha transmisión de dez metros con sete poleas, outra con seis... Cortaba, cepillaba, torneaba, de todo.'),
    AM('E no cincuenta e dous vendeuno todo, toda a maquinaria, por trinta mil pesetas. A un enxeñeiro de Camiños e a un contratista! Para que querían eles unha carpintaría enteira? Iso pregúntao ata o meu sobriño, o que estivo en Suíza. Pregúntamo cada semana.'),
    MA('¿Un ingeniero de Caminos comprando una carpintería entera? Eso o es un misterio o es una boda muy rara.', { mood: 'esceptico' }),
    MA('Doña Amparo, la historia de la carpintería me tiene en vilo, de verdad. Pero Eladio cierra a las dos.'),
    AM('Eladio! Ese home naceu pechando. Dáme o papel, fillo, dáme.'),
    DV('E ti de que equipo es, rapaz?'),
    MA('Del Dépor. De nacimiento y por cabezonería.'),
    DV('Do Dépor! Pois que saibas que eu, co Lemos, marqueille un gol ao Ourense en Terceira que aínda o lembran. De cabeza, ao segundo pau!'),
    MA('Y yo vi a Djalminha hacerle una lambretta a medio Madrid. Por la tele, pero cuenta igual.'),
    AM('Velaquí: asinado e ben asinado. Agora corre, que o Concello está na outra punta e Eladio pecha ás dúas en punto!'),
    MA('¿Correr? Doña Amparo, acaba de decir la palabra mágica.'),
    () => { if (inside) interiorExit(); martinStartRace(); },
  ]);
}
function martinStartRace() {
  const M = G.martin, me = G.player.ped, d = Math.hypot(me.x - M.conc.x, me.z - M.conc.z), S = save.martin;
  const t = Math.max(40, Math.min(300, d * 1.3 / 7.6 + 25)); // a correr polas rúas dá xusto; en coche, folgado
  M.race = { type: 'goto', t, onFail: () => { M.waitUntil = S.waitUntil = G.hour + 1.25; toast('Don Eladio pechou a ventanilla e marchou ao café. Fóra de servizo...', 5);
    setTimeout(() => toast('Martín: «Me ha ganado un funcionario. Esto no sale de aquí.»', 4.5), 1800); martinGo('esperar', true); } };
  martinGo('carreira', true);
  toast(`Corre ata o Concello! (${isTouch ? 'empurra o joystick ao máximo' : 'Shift para correr'}) · ⏱ ${Math.round(t)} s`, 4.5);
}
function martinConcello2() {
  const S = save.martin, M = G.martin;
  if (S.step === 'esperar' && G.hour < M.waitUntil) {
    const hh = Math.floor(M.waitUntil), mm = Math.round((M.waitUntil - hh) * 60);
    openDialog([MA(pick([`Cartel en la ventanilla: «Volvo ás ${hh}:${String(mm).padStart(2, '0')}». Escrito a mano. Con la letra de alguien que no piensa volver a las ${hh}:${String(mm).padStart(2, '0')}.`, 'Cerrado. Hay una planta de plástico, un calendario de 2019 y un silencio que da miedo.']))]);
    return;
  }
  const inTime = S.step === 'carreira'; M.race = null;
  openDialog([
    ...(inTime ? [EL('... Vaia. Chegou. Ninguén chega.'), MA('Tiempo récord desde la Fraternal. Sin calentar y con zapatillas de vestir. Apúntelo en algún sitio.')]
      : [EL('Vostede outra vez. Pois mire, xa é pola tarde: ventanilla 3, aberta.'), MA('Me ganó un café con leche. No pasa nada. A Kipchoge también le habrá pasado alguna vez.')]),
    EL('Contrato... empadroamento... selo... e selo. Listo. Agora, para a auga, ventanilla 3.'),
    MA('No me lo diga. Usted.'),
    EL('(cambia o cartel da mesa) Ventanilla 3, dígame.'),
    MA('Esto es más surrealista que un cercanías de Valencia un quince de agosto.'),
    EL('A auga quedará dada de alta en corenta e oito horas hábiles.'),
    MA('¿Cuarenta y ocho horas? Pues nada, a ducharme en el Cabe con los patos.'),
    EL('... Ou podo chamar ao meu cuñado, o de Augas. É do Dépor, coma vostede. Esta mesma tarde ten auga.'),
    MA('Eladio, acaba usted de ganarse un amigo. Y una bufanda.'),
    () => { S.flags.eladio = inTime ? 'record' : 'cafe'; G.hour = Math.max(G.hour, 17.5); envTimer = 0; lastEnvHour = -99; martinGo('casa'); },
  ]);
}
function martinCasa() {
  const S = save.martin;
  openDialog([
    () => { $('fade').classList.add('on'); setTimeout(() => { martinCasaIn(); G.hour = Math.max(G.hour, 21.2); envTimer = 0; lastEnvHour = -99; $('fade').classList.remove('on'); }, 900); },
    MA('Agua: sí. Luz: sí. Wifi: el del vecino, que se llama «PACO_2G» y no tiene contraseña. Monforte me está cuidando.'),
    MA('(suena el móvil) Hola, mamá.'),
    NA('Martiño? Xa estás aí? Comiches?'),
    MA('Sí, he comido. Bueno, unos ositos de gominola. Cuentan como fruta, ¿no?'),
    NA('Ai, este neno... O domingo vés a Vilatán, que fago caldo e vén a túa tía Pilar. Pecharon outra casa na aldea, a dos Novo. Xa case non queda ninguén.'),
    MA('El domingo voy. Prometido. Con hambre y todo.'),
    NA('E estás ben, fillo? Alá na praia tiñas os amigos, o sol...'),
    MA('... Estoy bien, mamá. Es raro, ¿sabes? Todo me parece más pequeño de lo que recordaba. O el grande soy yo. No lo tengo claro.'),
    NA('Grande es, iso si. Descansa, rei. Un bico.'),
    () => { G.hour = 23.6; envTimer = 0; lastEnvHour = -99; if (G.sfx && G.sfx.trainHorn && world.train) G.sfx.trainHorn(world.train); },
    MA('... ¿Eso ha sido un silbato de vapor?'),
    MA('No puede ser. En el depósito no queda ni una máquina que respire. Las vi en el museo: pintaditas, quietas, con su cartelito de «non tocar».'),
    MA('Será el cansancio. Ocho horas de cabina, un funcionario con dos ventanillas y una carpintería que se vendió entera en 1952.'),
    MA('Aunque... viene del depósito. Y suena justo hacia aquí. Hacia esta casa.', { mood: 'pensativo' }),
    () => { if (G.sfx && G.sfx.trainHorn && world.train) G.sfx.trainHorn(world.train); },
    MA('... Vale. Mañana me paso por el depósito. Por curiosidad. Solo por curiosidad.'),
    () => { martinCasaOut(); S.flags.asubio = true; martinGo('fin1', true); bigMsg('FIN DO ACTO 1', 'O regreso'); setTimeout(() => toast('Durme no piso (E) para comezar o acto 2 · O reencontro', 6), 3500); },
  ]);
}

/* Iván Nogal (o de Renfe) e o mural de 1954 do vestíbulo: conversa opcional dos actos 1-2.
   Ollo: Iván é o neto de Xosé Nogal (aprendiz na carpintaría da Casa Juana antes de entrar en Renfe). Todo o que di aquí é pista para o final.
   A historia da Casa Juana (Alfredo Fernández Gutiérrez, Juana Rivera, a venda da maquinaria en 1952) é real; Xosé, Elvira, Iván e o parte de 1958 son ficción. */
function martinMural(on) {
  let el = $('martinMural');
  if (!el) { el = document.createElement('div'); el.id = 'martinMural'; el.style.cssText = 'position:fixed;inset:0;z-index:24;background:#14110d url(img/mural-estacion.jpg) center 38%/contain no-repeat;box-shadow:inset 0 0 160px #000'; document.body.appendChild(el); }
  el.hidden = !on;
}
function martinIvanMural() {
  const F = save.martin.flags; F.ivanMural = true; persist();
  openDialog([
    IV('Benvido ao nó ferroviario de Galicia! Ben, ao que queda del. Es o maquinista novo, non? Iván Nogal, apoio de Renfe. E guía turístico non oficial.'),
    MA('Martín Pardo. ¿Guía de qué? Si aquí lo único que hay para ver es la máquina de café.'),
    () => martinMural(true),
    IV('O mural do vestíbulo, home! Pintouno en 1954 un delineante de Renfe de León, Cándido Fernández Inchaurbe. Monforte á dereita, co seu redondel azul, e as liñas saíndo cara a Lugo, Ourense e Castela. E non sae a liña de Zamora, porque aínda non existía.'),
    MA('¿Tú te sabes de memoria todos los murales o solo este?'),
    MA('Hay hasta un castillo encima de Monforte. Y abajo, junto a Tuy, una firma con fecha: 1954.'),
    IV('Inchaurbe, 1954. Tes bo ollo: ninguén se fixa na firma. E respondendo á túa pregunta: só me sei os murais que me deixan sentar diante. Mira o emigrante, o que espera o barco en Vigo. Leva setenta anos esperando. Coma alguén que eu coñezo.'),
    MA('¿Quién?'),
    IV('Eu, cando chega o rexional das seis. Ha! E onde vives, compañeiro?'),
    () => martinMural(false),
    MA('En la casa roja de Doctor Casares. La de al lado de la gasolinera.'),
    IV('... A Casa Juana. Bo balcón. Dende el vese o depósito. E atrás, a nave do señor Alfredo: motor Siemens de dez cabalos, primeira transmisión de dez metros e sete poleas.', { mood: 'neutro' }),
    MA('¿Has estado dentro? ¿Cómo sabes lo de las poleas?'),
    IV('Iso díxomo a Amparo, vaia. Ben... e lin as escrituras no rexistro. Afeccións raras. Aquí todo o mundo sabe todo de todas as casas. Ala, que chega o de Ourense e hai que contar maletas.'),
  ]);
}

/* ==========================================================
   ACTO 2 · O reencontro
   ========================================================== */
function martinAct2() {
  martinGo('a2', true);
  bigMsg('ACTO 2', 'O reencontro');
  openDialog([
    MA('Primer turno: Monforte–Ourense y vuelta. Puntual, sin incidencias y con un pasajero que me ofreció rosquillas. Vida de lujo.'),
    MA('Al pasar por el depósito vi algo raro: candado nuevo en las cocheras del museo. Brillante. En un sitio donde lo más nuevo es el calendario de 2019.'),
    MA('Pero hoy toca otra cosa. Valerio sigue en la farmacia del Cardeal, Andrés vive en una tumbona del Fluvial y Xoán... Xoán seguro que sigue corriendo por el Malecón.'),
    () => { martinGo('a2'); martinSpawnXoan(); },
  ]);
}
function martinA2Check() {
  const F = save.martin.flags;
  if (F.valerio && F.andres && F.xoan) {
    setTimeout(() => openDialog([
      MA('Valerio, Andrés, Xoán... Unos se fueron, otros se quedaron, y todos tienen menos pelo que en el instituto. Excepto yo. Que conste.'),
      MA('Esta noche lo he vuelto a oír. El silbato. Dos veces, larguísimo, como cuando una máquina pide vía.'),
      MA('Y no venía de la estación. Venía de detrás de mi casa. Del taller viejo de la Casa Juana, ese que nadie abre desde hace años.', { mood: 'preocupado' }),
      MA('Antes de preguntarle a nadie, voy a mirar yo. Que soy maquinista, no vidente.'),
      () => martinGo('a2_taller'),
    ]), 1200);
  } else martinGo('a2', true);
}
function martinValerio() {
  const inside = typeof interiorEnter === 'function' && INTERIORS.farmacia; if (inside) interiorEnter('farmacia');
  if (typeof valMood === 'function') valMood('ri')();
  openDialog([
    VA('Boas tardes, en que podo... Non. Non pode ser. Martín Pardo! O de Vilatán! O que lle gañou os 1500 metros ao profe de ximnasia!'),
    MA('Y el profe se lesionó el gemelo. Nunca me lo perdonó. Me suspendió en «actitud».'),
    VA('Ha! E ti que fas aquí? Dixeran que estabas en Valencia, de maquinista, rodeado de praias e de...'),
    MA('Y de mosquitos. No te creas todo lo que dicen. Ahora estoy en el depósito de Monforte. Y tú... detrás del mostrador de tu padre.'),
    VA('Detrás do mostrador do meu pai, coa bata do meu pai e cos clientes do meu pai. Algúns teñen noventa anos e veñen só a falar.'),
    MA('Eso también es farmacia. Escuchar es gratis y no tiene efectos secundarios.'),
    VA('Ti sempre tan listo. Toma, un regalo de benvida: crema para as agullas. Pola pinta, corres moito.'),
    MA('Más que nunca. Correr aquí es fácil: no hay nadie con quien chocarse.'),
    VA('Iso é verdade... Antes isto estaba cheo. Agora, cando pecha a tenda dun veciño, o local queda con cartel de «Se aluga» ata que o cartel se cae de vello.'),
    MA('... Ya. Me fijé al venir. La zapatería de la esquina, el videoclub... Monforte está como una estación de paso: todo el mundo parece que se va.'),
    VA('Pero algúns quedamos. E outros chegan: o Iván, o de Renfe, o suízo. Vén cada semana buscar as pastillas da súa tía Amparo e quédase unha hora falando de trens. Coma ti de correr.'),
    MA('¿Iván es sobrino de Amparo? Entonces el sobrino de Suiza del que me habló... Vaya. Monforte es un pañuelo. Un pañuelo muy pequeño.'),
    VA('Pero algúns quedamos. E agora ti volviches. Iso conta, Martín.'),
    MA('Cuenta. Aunque no sé si he vuelto o si estoy de paso. Ya te diré.'),
    () => { if (inside) interiorExit(); save.martin.flags.valerio = true; persist(); martinA2Check(); },
  ]);
}
function martinAndres() {
  const S = save.martin;
  openDialog([
    AN('Eeeh, que temos aquí! Un mozo con camisa branca no Fluvial! Ou vés de voda, ou es da Xunta.'),
    MA('Maquinista. Martín Pardo. Me han dicho que usted es el que más horas de sol acumula en toda la comarca.'),
    AN('Mega Andrés. E non o digas coma se fose malo! Eu levo anos estudando a vida dende esta tumbona. Conclusión: a vida, mellor deitado.'),
    MA('Respeto la filosofía. Yo la estudio corriendo. Llego a las mismas conclusiones, pero sudando.'),
    AN('Correr! Iso é de xente con présa. E a présa é o contrario de vivir. Pero mira, ti tes pinta de competitivo...'),
    MA('Un poco. Bastante. Mucho.'),
    AN('Nadas? Unha carreira de 50 metros, de parede a parede. Se gañas, invítote a un mojito. Se gaño eu, vés mañá a tomar o sol comigo e non miras o reloxo nin unha vez.', { choices: [
      { t: 'Á auga!', fn: () => [MA('Acepto. Advierto que nado como corro: con mucha dignidad y poca técnica.'), () => { if (typeof NAT !== 'undefined') NAT.onEnd = won => martinAndresFin(won); natOpen(); }] },
      { t: 'Hoxe non', fn: () => [MA('Hoy no, Andrés. Pero vuelvo. Y vuelvo con bañador.'), AN('Aquí estarei. Literalmente.')] },
    ] }),
  ]);
}
function martinAndresFin(won) {
  const F = save.martin.flags;
  natClose();
  openDialog([
    won ? AN('Que me gañaches! A min! Ao tiburón do Cabe! Ti es un perigo público, maquinista.') : AN('Ha! O tiburón do Cabe non perdoa! Mañá tumbona e nin un reloxo, eh?'),
    MA(won ? 'Nadar no es lo mío, pero perder tampoco. Me quedo el mojito para otro día.' : 'Vale, vale. Lo reconozco: en el agua eres mejor. En tierra ya hablaremos.'),
    AN('Sabes que, rapaz? Ti e mais eu somos iguais: a ti dache por correr e a min por parar. Pero os dous fuximos do mesmo: do reloxo.'),
    MA('... Eso ha sido profundo, Andrés. Me preocupa.'),
    AN('Ha! Non te acostumes. Vai, que me tapas o sol.'),
    () => { F.andres = true; F.andresWon = won; persist(); martinA2Check(); },
  ]);
}
function martinSpawnXoan() {
  const M = G.martin; if (!M || !M.xoan || M.xoanNPC || typeof spawnNPC !== 'function') return;
  // spawnNPC só colle peóns que van camiñando; se nese momento non hai ningún libre, prepárase un calquera
  if (!world.crowd.peds.some(q => q.state === 'walk' && !q.npc && q !== G.player.ped)) { const q = world.crowd.peds.find(q => !q.npc && q !== G.player.ped && !q.role); if (q) q.state = 'walk'; }
  M.xoanNPC = spawnNPC({ id: 'xoan', name: 'Xoán «o Galgo»', x: M.xoan.x, z: M.xoan.z, yaw: M.xoan.yaw, scale: 1.0, colors: { shirt: '#e2452a', pants: '#17181b', skin: '#e3b48f', hair: '#2a1d14', shoe: '#f2f2f2', sleeve: false } }) || null;
}
function martinXoan() {
  const M = G.martin; if (M.race) return;
  const fresh = !save.martin.flags.xoanVisto; save.martin.flags.xoanVisto = true;
  openDialog([
    ...(fresh ? [
      XO('Non me fodas. Martín Pardo? O que me gañou o cross escolar tres anos seguidos?'),
      MA('Cuatro, Xoán. Cuatro. El cuarto te caíste en el barro de la Pinguela, pero cuenta.'),
      XO('Iso foi un empuxón! Bah, déixao. Eu sigo correndo, eh? Agora son fisio e adestro aos do club. O récord da «Volta do Castelo» é meu: Malecón, Praza da Compañía, castelo e volta.'),
      MA('¿La Volta do Castelo? ¿Con la cuesta de San Vicente? Eso no es una carrera, es una penitencia.'),
    ] : [XO('Que, outro intento? A cuesta de San Vicente segue alí, esperándote.')]),
    XO('Atréveste? Se me baixas o récord, invítote a polbo. Se non, cóntaslle a todo Monforte que o rapaz de Vilatán xa non é o que era.', { choices: [
      { t: 'Saír agora', fn: () => [MA('Tú cuenta. Yo corro.'), () => martinXoanStart()] },
      { t: 'Máis tarde', fn: () => [MA('Luego. Que tengo que calentar. Y hacer como que no me da miedo la cuesta.')] },
    ] }),
  ]);
}
/* A Volta do Castelo (curta): Malecón → Praza do Doutor Goyanes → Praza de España → Castelo (porta) → Malecón.
   Os controis colócanse en chan accesible (nunca dentro dun edificio) e márcanse con aros e ruta amarela no GPS */
function martinFreePoint(x, z) {
  const inside = (px, pz) => (G.buildingsList || []).some(b => b.poly && Math.abs(b.cx - px) < 60 && Math.abs(b.cz - pz) < 60 && inPoly(px, pz, b.poly));
  if (!inside(x, z)) return { x, z };
  for (let r = 2; r <= 30; r += 2) for (let a = 0; a < 16; a++) { const px = x + Math.cos(a / 16 * Math.PI * 2) * r, pz = z + Math.sin(a / 16 * Math.PI * 2) * r; if (!inside(px, pz)) return { x: px, z: pz }; }
  return { x, z };
}
function martinRaceCps() {
  const M = G.martin, out = [], add = (p, r, n) => { if (p) out.push({ ...martinFreePoint(p.x, p.z), r, n }); };
  const gz = (G.namedZones || []).find(z => z.n === 'Praza do Doutor Goyanes');
  add(gz ? (([x, z]) => ({ x, z }))(polyCentroid(gz.p)) : null, 9, 'Praza do Doutor Goyanes');
  const esp = typeof DESTS !== 'undefined' && DESTS.find(d => d.n === 'Praza de España');
  add(esp ? { x: esp.x, z: esp.z } : { x: 54, z: 263 }, 9, 'Praza de España');
  add(G.castleGate || M.castelo, 10, 'Castelo de San Vicente');
  add(M.xoan, 8, 'Malecón (meta)');
  return out;
}
function martinXoanStart() {
  const M = G.martin, cps = martinRaceCps();
  let L = 0, prev = M.xoan; for (const c of cps) { L += Math.hypot(c.x - prev.x, c.z - prev.z); prev = c; }
  const target = L * 1.3 / 6.9 + 15;
  M.race = { type: 'cp', cps, i: 0, el: 0, target };
  setWaypoint(cps[0].x, cps[0].z);
  toast(`Volta do Castelo: ${cps.map(c => c.n).join(' → ')}. Récord de Xoán: ${target.toFixed(0)} s. A pé!`, 6);
}
function martinXoanFin(t, target) {
  const F = save.martin.flags, win = t <= target;
  F.xoanBest = Math.min(F.xoanBest || 1e9, t); persist();
  openDialog(win ? [
    XO(`${t.toFixed(1)} segundos?! Iso... iso é récord. O meu récord. Que xa non é meu.`),
    MA('Tranquilo, Xoán. Es solo un número. Un número más pequeño que el tuyo, pero un número.'),
    XO('Ha! Vale, vale. Polbo para dous. Sabes que? Pensei que volvías para presumir. E volviches para presumir. Pero alégrome de verte, home.'),
    MA('Y yo a ti. Aquí sigues, corriendo por las mismas calles. Yo me fui a buscar calles nuevas y... no sé, aquí corro más ligero.'),
    () => { F.xoan = true; persist(); martinA2Check(); },
  ] : [
    XO(`${t.toFixed(1)} segundos. O récord segue sendo meu: ${target.toFixed(0)}. A cuesta de San Vicente é moi traizoeira, eh?`),
    MA('La cuesta, el adoquín, el viento... y una señora con un carro de la compra que iba por la izquierda. Otra vez.'),
    () => { setWaypoint(G.martin.xoan.x, G.martin.xoan.z); toast('Volve falar con Xoán para repetir a carreira', 3.5); },
  ]);
}

/* ==========================================================
   ACTO 3 · A curiosidade
   ========================================================== */
function martinIvan() {
  openDialog([
    IV('Ola, compañeiro! Que tal o primeiro turno? Pasáchelo ben co rexional das seis e media? Ese tren ten máis anos ca min.'),
    MA('Iván, pregunta rara: ¿alguien ha movido alguna máquina en el museo últimamente? ¿Pruebas, traslados...?'),
    IV('No museo? Que va. Esas locomotoras están máis quietas ca un xubilado ás tres da tarde. Por que?'),
    MA('Porque por las noches oigo un silbato de vapor. Y yo distingo un silbato de vapor de un pito de árbitro, te lo aseguro. Siempre igual: dos largos y uno corto.'),
    IV('...', { mood: 'neutro' }),
    MA('Y suena hacia mi casa. La Casa Juana. Como si alguien llamara a la puerta del taller de atrás.'),
    IV('Dous longos e un curto. Iso non é ningunha sinal do regulamento. Será algún graciosiño. Por certo, sabías que en 1958 o rexional das nove e media saía dez minutos tarde todos os días? Dez. Todos.'),
    MA('Me lo apunto para el próximo concurso de la tele. Iván, céntrate.'),
    IV('... O tren pantasma. Ha! Sabía que acabarías preguntando. A Concha di que o oe os xoves. O Tío David di que o oe sempre que perde o Lemos.'),
    IV('Eu non creo en pantasmas. Pero si che digo unha cousa: alguén leva semanas collendo graxa do almacén. E non son eu.'),
    MA('Otra cosa. En el taller de mi casa hay una foto de 1949: el carpintero con tres aprendices. Uno firma «Xosé N.». ¿Te suena?', { mood: 'dudoso' }),
    IV('Xosé N.? Home... Nogal é un apelido moi común en Monforte. Ou non. Pásame a graxa, digo... deixa.', { mood: 'neutro' }),
    MA('Grasa, silbatos y un candado nuevo. O es un fantasma muy mañoso, o aquí hay alguien trabajando a escondidas.'),
    IV('Pois mira ti mesmo. Ti tes ollo de maquinista. Eu teño ollo de cansado.'),
    () => { martinGo('a3_pistas'); setTimeout(() => toast(isTouch ? 'Toca o botón OLLO preto das cocheiras: o mundo vólvese gris e as pistas, amarelas' : 'Preme Q (ollo de maquinista) preto das cocheiras: o mundo vólvese gris e as pistas, amarelas', 5), 4800); },
  ]);
}
const MART_PISTAS = {
  graxa: [MA('Grasa en el carril de la Mikado. Fresca, brillante, sin polvo. Este carril lleva décadas muerto... y alguien lo está engrasando como si fuera a salir mañana.')],
  pegadas: [MA('Pisadas con carbonilla. Botas de trabajo, de las antiguas. Y unas zapatillas de andar por casa. ¿Quién va a un depósito en zapatillas de casa? Alguien que vive cerca. Y que tiene muchos años.')],
  motor: [MA('En el fondo de la cochera, bajo una lona: un motor eléctrico viejísimo y una fila de poleas. Placa de latón: «SIEMENS · 10 PS». Y alguien grabó a punta de navaja: «A.F.G.».', { mood: 'sorprendido' }), MA('Motor Siemens de diez caballos... Alfredo Fernández Gutiérrez. El carpintero de mi casa. Así que la carpintería de 1952 acabó aquí, en el depósito. Y alguien la ha estado desmontando pieza a pieza, como buscando algo.', { mood: 'pensativo' })],
  pizarra: [MA('Una pizarra en la puerta. «Presión: 9 kg. Probar inxector. Mércores: tubos». Con una letra preciosa, de las de antes, todas las letras iguales. Esto no es un fantasma: es un plan de mantenimiento. Y el que lo escribe es muy, muy ordenado.')],
};
function martinPista(p) {
  const F = save.martin.flags;
  openDialog([...MART_PISTAS[p.id], () => {
    F['p_' + p.id] = true; persist();
    if (F.p_graxa && F.p_pegadas && F.p_pizarra && F.p_motor) setTimeout(() => openDialog([
      MA('Grasa nueva, carbonilla, un plan de presión... y las máquinas de la carpintería de mi casa, aquí, desmontadas. Alguien está despertando a esa locomotora. Y busca algo más.'),
      MA('Pues esta noche, a partir de las once, me quedo aquí. Si hay fantasma, que me lo presente.'),
      () => martinGo('a3_noite'),
    ]), 600);
  }]);
}
function martinSparkles(dt) {
  const M = G.martin, S = save.martin; if (!M || !M.pistas) return;
  if (!M.spk) { M.spk = M.pistas.map(() => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: martinSparkTex(), color: 0xffe36b, transparent: true, depthWrite: false })); sp.visible = false; G.scene.add(sp); return sp; }); }
  const me = G.player.ped, on = S.step === 'a3_pistas', eye = (M.eyeT || 0) > 0; M.eyeT = Math.max(0, (M.eyeT || 0) - dt);
  M.pistas.forEach((p, i) => { const sp = M.spk[i], d = Math.hypot(me.x - p.x, me.z - p.z), vis = on && !S.flags['p_' + p.id] && (d < 7 || (eye && d < 12));
    sp.visible = vis; if (vis) { const k = 0.6 + Math.sin(G.t * 6 + i) * 0.2 + (eye ? 0.4 : 0); sp.scale.set(k, k, k); sp.position.set(p.x, groundH(p.x, p.z) + 0.6, p.z); } });
}
let _mspk = null;
function martinSparkTex() {
  if (_mspk) return _mspk; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,230,120,.8)'); g.addColorStop(1, 'rgba(255,200,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = '#fff'; x.fillRect(30, 4, 4, 56); x.fillRect(4, 30, 56, 4);
  return _mspk = new THREE.CanvasTexture(c);
}
function martinNoite() {
  const S = save.martin;
  if (!(G.hour >= 23 || G.hour < 5)) {
    if (martinChampDay() && G.hour < 23 && !S.flags['champ' + S.day]) { openDialog([MA('¿Esperar aquí hasta las once? Ni de broma: hoy hay Champions con David. Los fantasmas, que esperen al descanso. Bueno, a las once.')]); return; }
    openDialog([MA('Faltan horas. Me siento en este banco, me pongo los cascos y finjo que no estoy vigilando un museo. Muy natural todo.'),
      () => { $('fade').classList.add('on'); setTimeout(() => { if (G.hour > 5) { } G.hour = 23.1; envTimer = 0; lastEnvHour = -99; $('fade').classList.remove('on'); setTimeout(martinNoite, 400); }, 900); }]);
    return;
  }
  if (G.sfx && G.sfx.trainHorn && world.train) G.sfx.trainHorn(world.train);
  for (let i = 0; i < 40; i++) setTimeout(() => { const M = G.martin; if (M && M.loco && world.smoke) world.smoke.emit(M.loco.x + RR(-0.5, 0.5), groundH(M.loco.x, M.loco.z) + 4.5, M.loco.z + RR(-0.5, 0.5), RR(-0.3, 0.3), RR(1.5, 2.5), RR(-0.3, 0.3), 1.2, 3, 0xd8d8d8, 0.55); }, i * 90);
  openDialog([
    MA('Ahí está otra vez. Y esta vez lo veo: vapor saliendo por el tejado de las cocheras. Los fantasmas no echan humo. Bueno, este sí.'),
    MA('La puerta está entornada... ¿Hola? ¿Señor fantasma? Vengo en son de paz y con experiencia en locomotoras.'),
    RE('Quieto aí! Quen vai? Anxo, coidado, que hai un mozo!'),
    DA('Tranquila, Remedios. Se fose da Xunta viría con carpeta. Este vén con zapatillas. A ver, rapaz, quen es ti?'),
    MA('Martín Pardo, maquinista. Del depósito. Bueno, del depósito de verdad, el que tiene trenes que funcionan. Aunque veo que este también.'),
    DA('Un maquinista! Remedios, oíches? Un maquinista de verdade! Eu son Anxo Corredoira. Corenta anos conducindo vapor por esta liña, ata que a xubilaron... a ela e mais a min.'),
    RE('E eu, Remedios. Trinta anos no taller do depósito. Se ten parafusos, eu arránxoo. Se ten sentimentos, arránxao el.'),
    MA('Entonces... el silbato, la grasa, la pizarra... ¿Están restaurando la Mikado? ¿Ustedes dos? ¿De noche?'),
    DA('Nós e outros catro xubilados, que hoxe non viñeron porque había Champions. Si. A Mikado vai saír unha última vez antes de que a leven.'),
    RE('E alguén que nos trae as listas de pezas, cunha letra que dá envexa. Pero ese non quere que se saiba quen é, así que non preguntes.'),
    MA('¿Esta máquina tuvo algún accidente? Tiene una abolladura en el tope que no es de museo.'),
    DA('... Hai noites que mellor non lembrar, rapaz.'),
    MA('¿Que se la llevan? ¿Adónde?'),
    RE('A un museo de Madrid. Ou a chatarra, segundo quen pregunte. O mes que vén. E Monforte, que foi a cidade do tren, quedará cun cartel e unha foto.'),
    DA('Por iso queremos facer unha viaxe. Unha soa. Que a vexa toda a cidade, cheo de vapor e co asubío. Para lembrarlles quen fomos.'),
    MA('... Vale. ¿Qué necesitan?'),
    () => { bigMsg('FIN DO ACTO 3', 'A curiosidade'); setTimeout(martinAct4, 3000); },
  ]);
}

/* ==========================================================
   ACTO 4 · A implicación
   ========================================================== */
function martinAct4() {
  bigMsg('ACTO 4', 'A implicación');
  openDialog([
    RE('Necesitamos tres cousas. Unha: a válvula de seguridade. A vella rompeu. Pepe, o do taller da Ford, ten unha nunha caixa dende 1987.'),
    DA('Dúas: carbón. O de verdade non se atopa, pero aquel tolo do Fluvial, o das tumbonas, garda sacos e sacos para os churrascos do Malo Será.'),
    RE('E tres, a peor: un permiso do Concello para circular pola vía. Sen papel, a Guardia Civil párannos en Sober.'),
    MA('Un permiso del Concello. O sea, Eladio. Ya nos conocemos. Es como un jefe final de videojuego, pero con sello.'),
    DA('E catro... ben, a catro xa a temos, creo.'),
    MA('¿Qué cuarta?'),
    DA('Xa a falaremos. Vai, rapaz, que o tempo corre. E ti tamén, dinme.'),
    () => martinGo('a4'),
  ]);
}
function martinPepe() {
  const M = G.martin, F = save.martin.flags;
  openDialog([
    PE('Boas! Que lle pasa ao coche? Ruído? Fume? Luz amarela? Non me digas que é a luz amarela.'),
    MA('No tengo coche. Vengo por una válvula de seguridad de locomotora de vapor. De parte de Remedios.'),
    PE('Da Remedios! Ai, a Remedios... ensinoume a soldar cando eu tiña quince anos. Espera.'),
    PE('Aquí está: válvula de seguridade da Mikado, con caixa orixinal e todo. Chegou ao taller do meu pai no 87, dun desguace. Pesa corenta quilos. Nin a levantes de golpe, que se che vai a riñonada.'),
    PE('Ah, e que saibas que o suízo ese da estación veu tres veces a querer mercarma. Tres! A el non lla vendo: fala demasiado ben.'),
    MA('¿Iván? ¿Para qué querría Iván una válvula de cuarenta kilos?'),
    PE('Pois iso pregunteille eu. Díxome que era «por un asunto de familia». Ti vés de parte da Remedios: a ti si.'),
    MA('Cuarenta kilos. Bueno. Llevo años levantando la persiana de una cabina, no será tan... uf. Vale. Es peor.'),
    PE('Ha! Ata o museo hai un bo cacho. Correndo con iso no colo non chegas nin ao semáforo. Ou camiñas, ou buscas algo con rodas.'),
    MA('Correr no me va a servir. Primera vez en mi vida que lo digo. Que no salga de aquí.'),
    () => { F.valvulaCarga = true; M.carry = true; persist(); martinGo('a4', true); toast('Leva a válvula ás cocheiras do museo. Con 40 kg non podes correr... pero un coche si que pode', 5); },
  ]);
}
function martinEntrega() {
  const M = G.martin, F = save.martin.flags;
  openDialog([
    RE('A válvula! E sen abolladuras! Ti es dos bos, rapaz.'),
    MA('Cuarenta kilos, Remedios. Tengo los brazos como un tren de mercancías: largos y sin fuerza.'),
    MA('Remedios, ese motor Siemens del fondo, con las poleas... es de la carpintería de mi casa, ¿verdad? Lleva las iniciales del carpintero.', { mood: 'dudoso' }),
    RE('Iso chegou ao depósito hai moitísimo, cando eu era aprendiz. Dicían que viña dunha carpintaría de Doutor Casares. E o rapaz das listas de pezas pasou meses desmontándoo, polea a polea. Buscaba algo.'),
    MA('¿Buscaba qué?'),
    RE('Non mo dixo. Só repetía unha frase dunha carta vella: «Deixeino onde se moven as correas, na casa onde aprendín o oficio». E aquí non apareceu nada.'),
    MA('Donde se mueven las correas... en la casa donde aprendió el oficio.', { mood: 'pensativo' }),
    MA('Remedios, las correas no se movían aquí. Se movían en la casa donde estuvieron montadas primero. En la nave de atrás de la Casa Juana. En mi casa.', { mood: 'sorprendido' }),
    () => { F.valvula = true; F.parteBusca = true; M.carry = false; persist(); martinA4Check(); toast('Rexistra a vella carpintaría da Casa Juana (Doutor Casares, 211)', 5); },
  ]);
}
/* a nave de atrás da Casa Juana: na primeira transmisión (dez metros, sete poleas) Xosé Nogal escondeu o parte de 1958 */
function martinCarpintaria() {
  const F = save.martin.flags;
  tallerOpen('parte', () => openDialog([
    MA('El séptimo soporte. Subo al banco, meto la navaja por la soldadura... cede. Si yo tuviera que esconder algo en un taller de correas, lo escondería donde nadie mete la mano mientras las poleas giran.'),
    MA('... Una lata de tabaco. Dentro, un papel doblado, amarillo. «Parte de incidencia. 14 de xaneiro de 1958». Y una nota: «Para quen veña buscar. X. N.».', { mood: 'sorprendido' }),
    MA('Freno automático de los vagones a tres kilos. El mínimo es cinco. Lo midió varias veces, con hora. Y abajo, otra firma: «Reparación denegada. O xefe de depósito».', { mood: 'preocupado' }),
    MA('Quien escribió esto avisó semanas antes de que esos vagones no frenaban. Y lo escondió en la casa donde aprendió a trabajar con máquinas.'),
    MA('Iván. Iván tiene que ver esto. (llama por teléfono)'),
    () => { $('fade').classList.add('on'); setTimeout(() => $('fade').classList.remove('on'), 800); },
    IV('Vin correndo... ben, en bici. Que atopaches?', { mood: 'neutro' }),
    MA('Estaba en la séptima polea de la transmisión de la Casa Juana. Llevabas meses buscándolo en el depósito, ¿verdad?'),
    IV('(colle o papel e non di nada durante un longo intre) Esa letra...'),
    IV('Vinte anos, Martín. Vinte anos sabendo o que pasou e sen o papel. Arquivos, desguaces, o motor do señor Alfredo peza a peza... E estaba aquí. Na casa onde o meu avó aprendeu o oficio.'),
    MA('¿Tu abuelo? ¿Quién era tu abuelo, Iván? ¿Qué pasó esa noche?', { mood: 'dudoso' }),
    IV('O sábado. O sábado cóntocho todo, diante de quen ten que oílo. Prometido. Gárdao ti: eu agora non sei se o podería ter na man.'),
    MA('Vaya. Así que el de la letra bonita de la pizarra eras tú. Y yo pensando que el fantasma llevaba zapatillas de casa.', { mood: 'esceptico' }),
    () => { F.parte = true; persist(); martinA4Check(); },
  ]));
}
/* acto 2 → o taller da Casa Juana (escena de investigación) */
function martinTaller() {
  tallerOpen('investigar', () => {
    save.martin.flags.tallerDone = true; persist();
    openDialog([
      MA('Vamos a ordenar esto, como un parte de servicio. Una carpintería con motor Siemens de diez caballos y dos transmisiones. Escritura 375, 2 de junio de 1952: se vende entera, de la sierra de cinta a la última prensa, por treinta mil pesetas a un ingeniero de Caminos y a un contratista.', { mood: 'pensativo' }),
      MA('En la foto de 1949, tres aprendices. Uno, «Xosé N.». Y alguien que ha estado aquí hace nada, buscando algo bajo el séptimo soporte... sin encontrarlo, o no habría vuelto.', { mood: 'dudoso' }),
      MA('¿Y adónde va a parar la maquinaria de una carpintería que compra un ingeniero de Caminos? A lo mejor a un sitio con vías. Con locomotoras. Con un depósito.', { mood: 'convencido' }),
      MA('Esto es una hipótesis mía, ojo. Pero el silbato, el taller y el depósito están en la misma línea. Literalmente: se ve uno desde el otro.'),
      () => { bigMsg('FIN DO ACTO 2', 'O reencontro'); setTimeout(() => { bigMsg('ACTO 3', 'A curiosidade'); martinGo('a3_ivan'); }, 3200); },
    ]);
  });
}
function martinCarbon() {
  const F = save.martin.flags;
  openDialog([
    AN('Volve o maquinista! Vés tomar o sol? Que ben, que ben...'),
    MA('Vengo a por carbón, Andrés. Para la Mikado. Me han dicho que guardas sacos para el churrasco.'),
    AN('O meu carbón?! O carbón do churrasco dos domingos?! Iso é sagrado, rapaz. Iso non se dá...'),
    MA('Es para que la locomotora de vapor salga una última vez por Monforte. Con toda la ciudad mirando. Con humo, silbato... y un mojito en la estación, si hace falta.'),
    AN('... Unha locomotora de vapor. Por Monforte. O meu avó era fogoneiro, sabías? ... Vale. Pero gáñaste o carbón: unha carreira a nadar. Se me gañas, os sacos son teus.', { choices: [
      { t: 'Á auga', fn: () => [MA('Al agua. Por la Mikado y por tu abuelo.'), () => { NAT.onEnd = won => martinCarbonFin(won); natOpen(); }] },
      { t: 'Agora non', fn: () => [AN('Pois aquí estará o carbón. E mais eu.')] },
    ] }),
  ]);
}
function martinCarbonFin(won) {
  natClose();
  const F = save.martin.flags;
  if (!won) { openDialog([AN('Ha! Outra vez o tiburón! Pero mira... ti volve, que eu non me movo de aquí.'), MA('Te lo juro, Andrés: un día de estos te gano. Y no será hoy, por lo visto.')]); return; }
  openDialog([
    AN('Pois si que tes folgo, maquinista. Leva os sacos. E dille a esa máquina que o carbón vén de parte do neto dun fogoneiro.'),
    MA('Se lo diré. Y tú vienes a verla salir. Con bañador, si quieres, pero vienes.'),
    () => { F.carbon = true; persist(); martinA4Check(); },
  ]);
}
function martinPermiso() {
  const F = save.martin.flags;
  if (F.permisoPaso === 'firmas') {
    openDialog([
      EL('Sinaturas... cento doce. De veciños empadroados. Con DNI, enderezo e... unha que pon «Mega Andrés, tumbona 4». Bueno. Vale.'),
      EL('Selo... selo... e selo. Permiso para circulación histórica na vía, sábado, das doce á unha. Asinado.'),
      MA('Eladio. Es usted un héroe silencioso. Muy silencioso. Y muy lento. Pero un héroe.'),
      EL('... Eu tamén vou ir velo, sabe? O meu pai era guardagullas. Dígalle a Anxo que me garde sitio.'),
      () => { F.permiso = true; F.permisoPaso = 'ok'; persist(); martinA4Check(); },
    ]);
    return;
  }
  openDialog([
    EL('Vostede outra vez. Que é hoxe? Auga? Luz? Unha carpintaría?'),
    MA('Un permiso para que una locomotora de vapor circule el sábado por la vía. Una hora. Con toda la ciudad mirando.'),
    EL('... Iso é o modelo T-14. O último que mo pediu foi un tal Nogal, o mes pasado, para a vía morta da Barreira. Fáltanlle as sinaturas. Precisa a autorización de Adif e... cen sinaturas de veciños empadroados.'),
    MA('¿Cien firmas? ¿En Monforte? Si a las nueve de la noche no hay cien personas en toda la calle.'),
    EL('Iso non é cousa miña. Cen sinaturas. Ventanilla 1. Que agora tamén é a 3.'),
    MA('Cien firmas... Hay una persona en Monforte que habla con cien personas antes del mediodía. Y vende gominolas.'),
    () => { F.permisoPaso = 'concha'; persist(); martinGo('a4', true); toast('Pídelle axuda a Dona Concha para recoller cen sinaturas', 4); },
  ]);
}
function martinFirmas() {
  const F = save.martin.flags;
  if (F.permisoPaso === 'agarda') {
    if (G.hour < F.firmasAt && G.hour > F.firmasAt - 6) { openDialog([CO('Aínda me faltan unhas poucas, rapaz! Dáme un pouquiño, que agora vén a xente do mercado.')]); return; }
    openDialog([
      CO('Velaquí! Cento doce sinaturas! Asinou ata o señor do bar da esquina, que non asina nin o recibo da luz.'),
      CO('E Mega Andrés asinou dende a tumbona, por teléfono. Non sei se vale, pero eu púxena igual.'),
      MA('Concha, es usted la red social más eficaz de Galicia. Ni Twitter, ni Instagram: el quiosco.'),
      () => { F.permisoPaso = 'firmas'; persist(); martinGo('a4', true); toast('Leva as sinaturas a Eladio, ao Concello', 4); },
    ]);
    return;
  }
  openDialog([
    CO('A locomotora vai saír?! Ai, meu pai era revisor! Cen sinaturas? Dáme unha hora e tráiocho cento cincuenta.'),
    MA('¿Una hora? Concha, Eladio tarda eso en sellar un sobre.'),
    CO('Eladio é Eladio. Eu son a Concha. Vai dar unha volta e volve en nada.'),
    () => { F.permisoPaso = 'agarda'; F.firmasAt = (G.hour + 1) % 24; persist(); martinGo('a4', true); },
  ]);
}
function martinA4Check() {
  const F = save.martin.flags;
  if (F.valvula && F.carbon && F.permiso && F.parte) { martinGo('a4_fin'); toast('Todo listo! Volve ás cocheiras do museo', 4); }
  else martinGo('a4', true);
}
function martinA4Fin() {
  const inGo = () => { $('fade').classList.add('on'); setTimeout(() => { G.hour = Math.max(G.hour, 21.5); envTimer = 0; lastEnvHour = -99; $('fade').classList.remove('on'); }, 800); };
  openDialog([
    inGo,
    RE('Válvula posta, carbón no ténder e o papel de Eladio pegado na cabina con celo. A Mikado está lista.'),
    DA('Senta, rapaz. Toma un café de pota. E dime unha cousa: por que volviches? Os mozos non volven.'),
    MA('Me destinaron aquí. Me tocó.', { mood: 'neutro' }),
    DA('Iso é o que lle dis á xente. A min dime a verdade.'),
    MA('... La verdad es que allí estaba bien. Sol, playa, amigos... Pero al llegar a casa, por la noche, no había nadie que supiera de dónde venía. Era el de Galicia y punto.', { mood: 'preocupado' }),
    MA('Y aquí todos saben quién soy. Para bien y para mal. Concha se acuerda de mis cromos. David me cuenta su gol. Valerio, mi carrera de 1500. Es... raro. Pesa, pero calienta.', { mood: 'pensativo' }),
    MA('Y no sé si me quiero quedar o si solo estoy descansando antes de irme otra vez. Eso es todo. No hay más.', { mood: 'preocupado' }),
    DA('Rapaz, eu conducín corenta anos. E aprendín que as vías non van a ningún sitio: van e volven. O importante non é onde remates, é quen vai contigo na cabina.'),
    MA('... Eso lo voy a robar, Anxo. Lo voy a decir en las bodas como si fuera mío.', { mood: 'sonriente' }),
    RE('Bueno, xa está ben de poesía. Falta a cuarta cousa, Anxo. Díllo.'),
    DA('A cuarta cousa é un maquinista con licenza en vigor. Eu teño setenta e oito anos e cataratas. Remedios non ten licenza. E ti...'),
    MA('... ¿Yo? ¿Conducir la Mikado? ¿Por Monforte? ¿Con toda la ciudad mirando?', { mood: 'sorprendido' }),
    MA('Anxo, ese parte de 1958 que encontré en la caja... usted estaba aquí entonces, ¿verdad?', { mood: 'preocupado' }),
    DA('... O sábado, rapaz. Iván ten dereito a contalo el primeiro. Eu levo moito tempo calado; podo calar tres días máis.'),
    DA('Contigo na cabina. E eu ao teu lado, contándoche onde frear. De fogoneiro virá un voluntario que sabe de caldeiras. Sábado, ás nove da noite.'),
    MA('Llevo ocho años conduciendo trenes que no se acuerdan de nadie. Para una vez que uno se va a acordar de mí... Vale. Acepto.', { mood: 'entusiasmado' }),
    () => { bigMsg('FIN DO ACTO 4', 'A implicación'); setTimeout(() => { bigMsg('ACTO 5', 'O descubrimento'); martinGo('a5'); }, 3200); },
  ]);
}

/* ==========================================================
   ACTO 5 · O descubrimento: a saída da Mikado e o domingo en Vilatán
   ========================================================== */
function martinFinal() {
  const S = save.martin, M = G.martin;
  $('fade').classList.add('on');
  setTimeout(() => {
    const w = ((S.day % 7) + 7) % 7; S.day += (5 - w + 7) % 7; G.hour = 21.0; M.prevH = 21; envTimer = 0; lastEnvHour = -99; persist();
    $('fade').classList.remove('on'); bigMsg('SÁBADO · 21:00', 'A última viaxe da Mikado');
    martinFinaleStart();
  }, 1000);
}
function martinFinaleStart() {
  const M = G.martin, tr = world.train;
  if (!tr || typeof makeSteamLoco !== 'function') { martinFinaleEnd(); return; }
  // o rexional retírase da vía mentres sae a Mikado
  M.trSaved = { state: tr.state, s: tr.s, timer: tr.timer }; tr.state = 'away'; tr.timer = 9999; tr.s = -1e5; tr.place();
  const loco = makeSteamLoco(); G.scene.add(loco);
  const s0 = tr.stopS - 60;
  M.finale = { t: 0, loco, s: s0, v: 0, puff: 0, said: 0 };
  G.cine = { finale: true, t: 0, look: new THREE.Vector3() };
  $('hud').classList.add('cine'); if (G.player.ped) G.player.ped.visible = false;
  if (G.sfx && G.sfx.trainHorn) G.sfx.trainHorn(tr);
}
const MART_FINALE_LINES = [
  [1.0, 'Iván (de fogoneiro): «Presión a nove. Carbón dentro. Cando queiras, maquinista.»'],
  [3.0, 'Don Anxo: «Regulador... suave, rapaz, coma quen colle unha nena no colo.»'],
  [5.0, 'Martín: «Está viva. Lo noto en las manos. Esto no es un tren: es un animal respirando.»'],
  [9.0, 'Dona Concha: «Martiñooo! O dos cromos do Dépor! É el, é el!»'],
  [12.5, 'Tío David: «Asubía, rapaz, asubía! Coma o día que lle marquei ao Ourense!»'],
  [16.0, 'Mega Andrés: «Ese carbón é do meu avó! Bueno, dos meus churrascos. Bueno, é igual!»'],
  [19.5, 'Don Eladio: «Selado e asinado! ... (sorrí, por primeira vez en trinta anos)»'],
  [23.0, 'Xoán e Valerio: «Vai, Martín, vai!»'],
  [26.5, 'Martín: «Media ciudad en el andén. Media ciudad que no veía desde que tenía diecisiete años.»'],
  [30.0, 'Don Anxo: «Agora, rapaz... a agulla vella da esquerda. Á Barreira. Non preguntes.»'],
];
function updateMartinFinale(dt) {
  const M = G.martin, Fz = M && M.finale; if (!Fz) return false;
  const tr = world.train; Fz.t += dt;
  if (Fz.t < 33) Fz.v = Math.min(9, Fz.v + dt * 0.8); else Fz.v = Math.max(0, Fz.v - dt * 2.2);
  Fz.s += Fz.v * dt;
  const a = tr.at(Fz.s), b = tr.at(Fz.s + 2); const yaw = Math.atan2(b.x - a.x, b.z - a.z);
  Fz.loco.position.set(a.x, (a.y || 0) + 0.35, a.z); Fz.loco.rotation.y = yaw;
  Fz.puff -= dt; if (Fz.puff <= 0 && world.smoke) { Fz.puff = 0.12; const fx = Math.sin(yaw), fz = Math.cos(yaw); world.smoke.emit(a.x + fx * 3.6, (a.y || 0) + 4.4, a.z + fz * 3.6, RR(-0.4, 0.4), RR(2, 3), RR(-0.4, 0.4), 1.4, 3.5, 0xe8e8e8, 0.6); }
  while (Fz.said < MART_FINALE_LINES.length && Fz.t >= MART_FINALE_LINES[Fz.said][0]) { toast(MART_FINALE_LINES[Fz.said][1], 3.6); Fz.said++; }
  if ((Fz.t > 6 && Fz.t - dt <= 6) || (Fz.t > 18 && Fz.t - dt <= 18)) { if (G.sfx && G.sfx.trainHorn) G.sfx.trainHorn({ x: a.x, z: a.z, y: 2 }); }
  // cámara: dende un lado, acompañando a máquina
  const C = G.cine, fx = Math.sin(yaw), fz = Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw);
  const side = Fz.t < 14 ? 1 : -1, dist = Fz.t < 14 ? 11 : 14;
  const tgt = new THREE.Vector3(a.x + sx * side * dist - fx * 4, (a.y || 0) + 3.2, a.z + sz * side * dist - fz * 4);
  camera.position.lerp(tgt, 1 - Math.pow(0.03, dt)); C.look.lerp(new THREE.Vector3(a.x + fx * 3, (a.y || 0) + 2.4, a.z + fz * 3), 1 - Math.pow(0.02, dt)); camera.lookAt(C.look);
  if (Fz.t > 37.5 && !Fz.stopScene) { Fz.stopScene = true; martinViaMorta(); }
  return true;
}
/* a revelación: a Mikado párase na vía morta da Barreira ás 21:40 e Iván deixa de ser «o de Renfe» */
function martinViaMorta() {
  G.hour = 21.67; envTimer = 0; lastEnvHour = -99;
  bigMsg('VÍA MORTA DA BARREIRA', '21:40');
  const horn = () => { const Fz = G.martin.finale; if (Fz && G.sfx && G.sfx.trainHorn) G.sfx.trainHorn({ x: Fz.loco.position.x, z: Fz.loco.position.z, y: 2 }); };
  setTimeout(() => openDialog([
    MA('¿La Barreira? Aquí no entra un tren desde... Anxo, esta vía está muerta. Hay una topera ahí delante.', { mood: 'preocupado' }),
    DA('Xusto aí. Para xusto aí, rapaz. Son as nove e corenta.'),
    IV('Martín... Toca ti. Dous longos e un curto.'),
    () => { horn(); setTimeout(horn, 900); setTimeout(horn, 1700); },
    MA('...', { mood: 'neutro' }),
    CO('(dende a estrada, en voz baixa) Ese asubío... Ese era o asubío do Nogal! Pasaba por diante da Casa Juana e asubiaba así, dous longos e un curto, para saudar ao taller onde aprendera. O señor Alfredo saía á porta a responderlle co boné...'),
    IV('(baixa da cabina e quita a gorra de Renfe) Chámome Iván Nogal Ferreiro. Son neto de Xosé Nogal, o maquinista que despediron por esta noite. Antes de entrar en Renfe foi aprendiz na carpintaría da Casa Juana: alí aprendeu o que era un motor, unha correa, unha polea. A miña avoa Elvira esperou sesenta anos a que alguén o dixese en voz alta.'),
    IV('Eu non vin a Monforte traballar na estación. Vin esperar isto. Vinte anos buscando un papel. O meu avó deixou escrito que estaba «onde se moven as correas, na casa onde aprendín o oficio». Eu busqueino nas máquinas do señor Alfredo, no depósito, polea a polea. Pero as correas movíanse primeiro na Casa Juana. Atopouno el, o maquinista que vive alí.'),
    IV('O 14 de xaneiro de 1958, ás nove e corenta, un mercancías sen freos baixou cara á estación. No andén 1 estaba o tren dos emigrantes para Vigo, dez minutos tarde, coma sempre. O meu avó mandou cambiar esta agulla e púxose diante coa súa Mikado.'),
    MA('(lee el parte en voz alta) «Freno automático a tres kilos. Mínimo, cinco. Reparación denegada». Firmado por el jefe de depósito. Semanas antes.', { mood: 'convencido' }),
    MA('Esto no es una maniobra no autorizada. Es un hombre que vio venir un tren sin frenos y se puso delante. Con su máquina. Con un chaval de diecisiete años al lado.', { mood: 'enfadado' }),
    DA('Ese chaval era eu. Tiña dezasete anos. Asinei o informe que me mandaron asinar, porque se non me botaban. Levo sesenta e oito anos calado.'),
    DA('(cara a toda a xente) Xosé Nogal salvou o tren dos emigrantes. Eu vino. E perdón, Iván. Perdón, Elvira.'),
    MA('Y la carpintería de 1952... las máquinas de Alfredo acabaron en el depósito, y ahí aprendió tu abuelo a mantener una locomotora. Todo pasaba por esa casa.', { mood: 'pensativo' }),
    IV('(a Martín, case sen voz) Asubiaba cara á Casa Juana cada noite, coma o meu avó, por se alguén alí escoitaba. Ti fuches o primeiro que preguntou. Perdoa por non dicircho antes.'),
    MA('No me pidas perdón. Llevo una semana corriendo detrás de un fantasma... y resulta que el fantasma era el único que sabía adónde iba.', { mood: 'aliviado' }),
    IV('Sabes o que dicía a miña avoa? Que as vías mortas non existen. Que só son vías que esperan.'),
    () => { $('fade').classList.add('on'); setTimeout(martinFinaleEnd, 900); },
  ]), 1200);
}
function martinFinaleEnd() {
  const M = G.martin, tr = world.train, S = save.martin;
  if (M.finale) { G.scene.remove(M.finale.loco); M.finale = null; }
  if (M.trSaved && tr) { tr.state = 'away'; tr.timer = 20; }
  G.cine = null; $('hud').classList.remove('cine'); if (G.player.ped) G.player.ped.visible = true; camera._init = 0;
  if (M.museo) { const me = G.player.ped; me.x = M.museo.x - 3; me.z = M.museo.z; me.y = groundH(me.x, me.z); }
  G.hour = 23.0; envTimer = 0; lastEnvHour = -99;
  $('fade').classList.remove('on');
  openDialog([
    DA('Rapaz... corenta anos e nunca a vin tan guapa. Nin eu me sentín tan lixeiro. Grazas.'),
    MA('Gracias a usted, Anxo. Hoy he conducido el tren más lento de mi vida. Y el más importante. No sé explicarlo.', { mood: 'aliviado' }),
    IV('O lunes vou falar con Adif e co Concello. Unha placa ao carón do mural, pequena. Só o seu nome e a data. A miña avoa querería algo pequeno.'),
    RE('Pois non o expliques. Vai durmir, que mañá é domingo e tes caldo en Vilatán.'),
    () => { $('fade').classList.add('on'); setTimeout(() => { $('fade').classList.remove('on'); }, 900); },
    MA('(suena el móvil) ¿Sí? ... Sí, soy yo. ... ¿Valencia? ¿Jefe de maquinistas del corredor? ... ¿Desde el uno del mes que viene?', { mood: 'sorprendido' }),
    MA('... Les contesto el lunes. Gracias. Sí. Sí, es una gran oportunidad. Ya lo sé.', { mood: 'pensativo' }),
    MA('Valencia. Sol, playa, terrazas, un ascenso... y una semana en Monforte que pesa más que ocho años allí. Fantástico. Justo lo que necesitaba: una decisión.', { mood: 'frustrado' }),
    () => { S.day += 1; G.hour = 11; envTimer = 0; lastEnvHour = -99; G.hour = 5.9; G.martin.prevH = 5.9; envTimer = 0; lastEnvHour = -99; martinGo('a5_noite'); toast('Domingo, 6:00 · Iván escribiuche: «Antes de que collas o tren, pasa polo vestíbulo. Diante do mural.»', 6); },
  ]);
}
/* CINEMÁTICA CLAVE: Iván e Martín diante do mural da estación (imaxe do autor).
   Pecha o misterio e abre a decisión de Martín: todas as liñas do mural pasan por Monforte. */
function martinMuralCine() {
  let el = $('muralCine');
  if (!el) {
    el = document.createElement('div'); el.id = 'muralCine';
    el.innerHTML = '<div class="mc-img"></div><div class="mc-bar mc-top"></div><div class="mc-bar mc-bot"></div><div class="mc-title"><b>DOMINGO · 6:05</b><span>Vestíbulo da estación de Monforte</span></div>';
    const st = document.createElement('style');
    st.textContent = `#muralCine{position:fixed;inset:0;z-index:24;background:#000;overflow:hidden}#muralCine[hidden]{display:none}
#muralCine .mc-img{position:absolute;inset:-4%;background:url(img/mural-ivan-martin.jpg) center 30%/cover no-repeat;image-rendering:pixelated;animation:mcZoom 70s ease-out forwards;opacity:0;transition:opacity 1.6s}
#muralCine.on .mc-img{opacity:1}
@keyframes mcZoom{from{transform:scale(1.18) translateY(6%)}to{transform:scale(1.0) translateY(0)}}
#muralCine .mc-bar{position:absolute;left:0;right:0;height:9vh;background:#000}#muralCine .mc-top{top:0}#muralCine .mc-bot{bottom:0}
#muralCine .mc-title{position:absolute;top:12vh;left:0;right:0;text-align:center;color:#f4ead2;text-shadow:0 2px 10px #000;font-family:"Big Shoulders Display",sans-serif;opacity:0;transition:opacity 1.2s}
#muralCine .mc-title b{display:block;font-size:clamp(28px,5vw,54px);letter-spacing:.08em}#muralCine .mc-title span{font:600 16px Barlow,sans-serif;letter-spacing:.2em;text-transform:uppercase}
#muralCine.title .mc-title{opacity:1}`;
    document.head.appendChild(st); document.body.appendChild(el);
  }
  const img = el.querySelector('.mc-img'); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  el.hidden = false; el.classList.remove('on', 'title'); G.martin.muralCine = true;
  setTimeout(() => el.classList.add('on', 'title'), 60);
  setTimeout(() => el.classList.remove('title'), 4200);
  const end = () => { el.classList.remove('on'); setTimeout(() => { el.hidden = true; G.martin.muralCine = false; martinVilatan(); }, 1500); };
  setTimeout(() => openDialog([
    IV('Madrugaches.'),
    MA('No he dormido. Tenía un silbato metido en la cabeza. Y una oferta de Valencia en el móvil.', { mood: 'pensativo' }),
    IV('Xa mo contou a Concha. A Concha sábeo todo antes ca ti.'),
    MA('Esa mujer debería trabajar en el CNI.', { mood: 'sonriente' }),
    IV('...'),
    IV('Sabes por que me sentaba sempre aquí? Mira o emigrante, o de Vigo. O meu pai tiña oito anos cando colleron ese tren. Eu sempre digo «collemos». Non sei por que.'),
    IV('Pasei a infancia en Xenebra mirando mapas de Galicia. Este non o vin ata os corenta e catro anos. E cando o vin, entendín unha cousa.'),
    MA('¿Qué?', { mood: 'dudoso' }),
    IV('Mira as liñas. Coruña, Vigo, Ourense, Lugo... todas pasan por Monforte. Dende aquí pódese ir a calquera sitio. Pero para volver, case sempre se pasa por aquí.'),
    MA('Eso es muy bonito, Iván. Y muy de jefe de estación.', { mood: 'risueno' }),
    IV('Ha! Pode. Pero o meu avó marchou e non volveu. A miña avoa quedou e non marchou. E eu pasei vinte anos indo e vindo diante deste mural sen saber cal das dúas cousas era a boa.'),
    MA('¿Y cuál era?', { mood: 'pensativo' }),
    IV('Ningunha. O bo é volver cando tes algo que facer. E ti agora tes que decidir se tes algo que facer aquí.'),
    MA('... Llevo ocho años conduciendo trenes y nadie me había explicado un mapa tan bien.', { mood: 'convencido' }),
    IV('Iso é porque os maquinistas non mirades os mapas. Mirades as sinais.'),
    MA('Miramos la vía. Y la mía, ahora mismo, tiene una bifurcación.', { mood: 'preocupado' }),
    IV('Pois vai a Vilatán, come o caldo da túa nai e decide coma un home de Monforte: despois da sobremesa.'),
    MA('Gracias, Iván. Por el silbato de la primera noche. Por todo.', { mood: 'aliviado' }),
    IV('Grazas a ti. A placa irá aquí, xusto debaixo do emigrante. Para que o meu avó o vexa marchar e volver todos os días.'),
    () => { if (G.sfx && G.sfx.trainHorn && world.train) G.sfx.trainHorn(world.train); },
    IV('Ala, que chega o teu. Vía 1. Coma sempre.'),
    end,
  ]), 4600);
}
function martinVilatan() {
  const S = save.martin;
  let ov = $('vilatan');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'vilatan';
    ov.style.cssText = 'position:fixed;inset:0;z-index:24;background:linear-gradient(#9fc8e8 0%,#d8e8f0 38%,#7fa86a 39%,#5f8a4e 60%,#4a6e3c 100%);display:flex;align-items:flex-start;justify-content:center;padding-top:8vh;font-family:"Big Shoulders Display",sans-serif;color:#fff;text-shadow:0 2px 8px #0008';
    ov.innerHTML = '<div style="text-align:center"><div style="font-size:clamp(34px,7vw,72px);letter-spacing:.06em">VILATÁN</div><div style="font:600 18px Barlow,sans-serif;letter-spacing:.2em">O SAVIÑAO · DOMINGO</div></div>' +
      '<svg viewBox="0 0 800 300" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:55%"><path d="M0 120 Q200 60 400 110 T800 90 V300 H0Z" fill="#3f6a34"/><g fill="#e8e2d2" stroke="#6a5a4a" stroke-width="2"><rect x="120" y="130" width="90" height="60"/><rect x="560" y="120" width="110" height="70"/><rect x="330" y="150" width="70" height="45"/></g><g fill="#a8432e"><path d="M110 130 L165 100 L220 130Z"/><path d="M550 120 L615 88 L680 120Z"/><path d="M322 150 L365 128 L408 150Z"/></g><rect x="640" y="140" width="22" height="24" fill="#5a4a3a"/><circle cx="470" cy="150" r="26" fill="#2f5a2a"/><circle cx="250" cy="160" r="20" fill="#2f5a2a"/></svg>';
    document.body.appendChild(ov);
  }
  ov.hidden = false; G.martin.vilatan = true;
  const fin = k => () => {
    S.flags.final = k; persist();
    return k === 'ir' ? [
      MA('Me voy, mamá. A Valencia. Es una oportunidad que no vuelve.', { mood: 'convencido' }),
      NA('Pois vai, fillo. Que as raíces non son para quedar quieto: son para saber onde volver.'),
      MA('Como dice Iván: todas las líneas pasan por Monforte. Volveré. Cada vez que haya Champions en la Fraternal. Y en Navidad. Y cuando Xoán intente batir mi récord.', { mood: 'sonriente' }),
      NA('E o sábado da locomotora, que? Iso tamén foi para saber onde volver?'),
      MA('... Eso fue para que Monforte sepa que no me he ido del todo. Aunque me vaya.', { mood: 'pensativo' }),
    ] : [
      MA('Me quedo, mamá. Les digo que no. Monforte está viejo y medio vacío... pero esta semana he visto media ciudad en un andén.', { mood: 'convencido' }),
      NA('Ai, fillo... E non te arrepentirás? Alá tiñas o sol...'),
      MA('Igual sí. Algún día de lluvia en febrero me acordaré de la playa. Pero aquí hay un depósito con una Mikado, un funcionario que me guarda sitio y un récord que defender.', { mood: 'sonriente' }),
      NA('E unha nai que fai caldo os domingos.'),
      MA('Eso, lo primero. Que conste en acta. Ventanilla 3.', { mood: 'risueno' }),
    ];
  };
  openDialog([
    NA('Martiño! Ven, senta, que o caldo xa está. Contoume a túa tía que saíches no Progreso, conducindo unha locomotora antiga!'),
    MA('En la foto salgo con cara de susto, ¿verdad? Es que la Mikado frena cuando ella quiere.', { mood: 'avergonzado' }),
    NA('Saes guapísimo. E ese señor maior ao teu lado chorando coma un neno. A túa avoa coñecía á Elvira, sabes? Dicía que esa muller esperaba un tren que nunca chegaba.'),
    MA('Llegó, mamá. Tarde, pero llegó. Lo conduje yo.', { mood: 'orgulloso' }),
    MA('Mamá... me han ofrecido un puesto en Valencia. Jefe de maquinistas. Desde el mes que viene.', { mood: 'preocupado' }),
    NA('... E ti que queres?'),
    MA('Esa es la pregunta. Y llevo toda la semana sin hacérmela.', { mood: 'pensativo', choices: [
      { t: 'Aceptar o traslado a Valencia', fn: fin('ir') },
      { t: 'Quedar en Monforte', fn: fin('quedar') },
    ] }),
    () => {
      ov.hidden = true; G.martin.vilatan = false; martinGo('fin', true);
      bigMsg('FIN', S.flags.final === 'ir' ? 'Vía morta · as vías van e volven' : 'Vía morta · a cabina segue aquí');
      setTimeout(() => toast('Un mes despois, ao carón do mural da estación, hai unha placa pequena: «Xosé Nogal, maquinista. 14 de xaneiro de 1958». Iván mírala cada mañá antes do rexional das seis.', 8), 3200);
      setTimeout(() => toast('Grazas por xogar «Vía morta». Podes seguir paseando por Monforte con Martín (Champions os martes e mércores ás 20:00).', 7), 11500);
    },
  ]);
}
