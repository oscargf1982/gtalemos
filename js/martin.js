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
  piso: 'Vai ao teu piso: Rúa do Cardeal, 20',
  concello: 'Dá de alta a auga no Concello (Campo de San Antonio)',
  amparo: 'Busca a Dona Amparo, a caseira, na Fraternal',
  carreira: 'Leva o contrato ao Concello antes de que Eladio peche!',
  esperar: 'Eladio marchou ao café. Volve ao Concello en canto abra',
  casa: 'Volve ao piso da Rúa do Cardeal e descansa',
  fin1: 'Acto 1 completado · Vía morta continuará',
};
const MA = (t, extra) => ({ who: 'Martín', text: t, ...extra });
const MX = who => (t, extra) => ({ who, text: t, ...extra });
const CO = MX('Dona Concha'), EL = MX('Don Eladio'), AM = MX('Dona Amparo'), DV = MX('Tío David'), NA = MX('Nai');

/* ---------- menú ---------- */
function initMartinMenu() {
  if ($('btnMartin')) return;
  const after = $('storyPwd') || $('btnStory') || $('btnPlay'); if (!after) return;
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'btnMartin'; b.innerHTML = 'Vía morta<br>Martín Pardo'; b.style.lineHeight = '0.95';
  after.after(b);
  const box = document.createElement('div'); box.id = 'martinBox'; box.hidden = true;
  box.innerHTML = `<span>Tes unha partida de Martín gardada</span><div class="pwrow"><button class="btn small" id="martinCont" type="button">Continuar</button><button class="btn small" id="martinNew" type="button">Comezar de novo</button></div>`;
  b.after(box);
  const st = document.createElement('style');
  st.textContent = `#martinBox{display:flex;flex-direction:column;gap:6px;color:#e9e2d0;font-family:Barlow,sans-serif;font-size:14px}#martinBox[hidden]{display:none}#martinBox .pwrow{display:flex;gap:8px}#martinBox .btn.small{font-size:18px;padding:8px 12px}`;
  document.head.appendChild(st);
  const has = () => save.martin && save.martin.step && save.martin.step !== 'concha';
  b.onclick = () => { if (has()) box.hidden = !box.hidden; else startMartin(false); };
  $('martinCont').onclick = () => startMartin(false);
  $('martinNew').onclick = () => { save.martin = null; startMartin(true); };
}

/* ---------- comezo ---------- */
function startMartin(fresh) {
  if (!save.martin || fresh) save.martin = { step: 'concha', money: 120, flags: {} };
  const S = save.martin;
  G.martin = { t: 0, timer: 0, waitUntil: S.waitUntil || 0 };
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
    PORTRAITS['Nai'] = pixelFace({ skin: '#ecc7ab', skinD: '#cfa588', hair: '#6a4a3a', shirt: '#8a2a4a', collar: '#f6f1e4', smile: true, bg: '#4a2a3a', bg2: '#9a5a7a' });
  }
  startGame();
  G.hour = S.step === 'concha' ? 10.25 : Math.max(10.25, S.hour || 11); envTimer = 0; lastEnvHour = -99;
  martinPlaces();
}
function martinPlaces() {
  const M = G.martin; if (!M) return;
  let fl = null;
  if (typeof ENDEREZOS !== 'undefined') for (const [x, z, n, si] of ENDEREZOS.a) if (n === '20' && ENDEREZOS.r[si] === 'Rúa do Cardeal Rodrigo de Castro') fl = { x: x / 10, z: z / 10 };
  if (fl && typeof nearRoad === 'function') { const nr = nearRoad(fl.x, fl.z); if (nr) { const dx = nr.px - fl.x, dz = nr.pz - fl.z, l = Math.hypot(dx, dz) || 1; const k = Math.min(2.2, l * 0.5); fl = { x: fl.x + dx / l * k, z: fl.z + dz / l * k }; } }
  M.flat = fl || { x: -90, z: 343 };
  M.kiosk = G.kiosk ? G.kiosk.door : null;
  M.conc = G.concelloDoor || { x: -315, z: 183 };
  M.frat = typeof fraternalDoor === 'function' ? fraternalDoor() : null;
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
  } else { martinGo(S.step, true); toast('Vía morta · ' + (MART_STEPS[S.step] || ''), 5); }
}
function martinGo(step, quiet) {
  martinPlaces(); const S = save.martin, M = G.martin; S.step = step; S.hour = G.hour; persist();
  const wp = { concha: M.kiosk, piso: M.flat, concello: M.conc, amparo: M.frat, carreira: M.conc, esperar: M.conc, casa: M.flat }[step];
  if (wp && typeof setWaypoint === 'function') setWaypoint(wp.x, wp.z);
  if (!quiet && MART_STEPS[step]) toast(MART_STEPS[step], 4.5);
}

/* ---------- actualización: HUD, prompts, cronómetro ---------- */
function updateMartin(dt) {
  const M = G.martin; if (!M || !G.started) return;
  const S = save.martin, hud = $('storyHud');
  if (hud) {
    let h = `<b>VÍA MORTA · ACTO 1</b>${MART_STEPS[S.step] || ''}`;
    if (S.step === 'carreira') { const t = Math.max(0, M.timer); h += `<br><span class="${t < 15 ? 'warn' : 'ok'}">⏱ ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}</span>`; }
    if (S.step === 'esperar') { const m = Math.max(0, Math.ceil((M.waitUntil - G.hour) * 60)); h += `<br><span class="cold">Abre en ${m} min</span>`; }
    if (hud._h !== h) { hud.innerHTML = h; hud._h = h; } hud.hidden = false;
  }
  if (S.step === 'carreira' && !G.paused && !G.dialog) {
    M.timer -= dt;
    if (M.timer <= 0) { M.waitUntil = S.waitUntil = G.hour + 1.25; toast('Don Eladio pechou a ventanilla e marchou ao café. Fóra de servizo...', 5);
      setTimeout(() => toast('Martín: «Me ha ganado un funcionario. Esto no sale de aquí.»', 4.5), 1800); martinGo('esperar', true); }
  }
  if (G.player.car || G.dialog || G.cine) return;
  const n = martinNear(); if (n) setPrompt(`${isTouch ? '★' : 'E'} · ${n.label}`);
}
function martinNear() {
  const S = save.martin, M = G.martin, me = G.player.ped; if (!M || !me) return null;
  const d = p => p ? Math.hypot(me.x - p.x, me.z - p.z) : 1e9;
  if (S.step === 'concha' && G.kiosk && Math.min(d(M.kiosk), d({ x: G.kiosk.cx, z: G.kiosk.cz })) < 3.6) return { id: 'concha', label: 'Falar con Dona Concha' };
  if ((S.step === 'piso' || S.step === 'casa') && d(M.flat) < 3.6) return { id: S.step, label: S.step === 'piso' ? 'Abrir o piso' : 'Entrar no piso' };
  if (['concello', 'carreira', 'esperar'].includes(S.step) && d(M.conc) < 5) return { id: S.step, label: 'Ventanilla do Concello' };
  if (S.step === 'amparo' && d(M.frat) < 3.4) return { id: 'amparo', label: 'Entrar na Fraternal' };
  return null;
}
function martinInteract() {
  if (!G.martin || G.player.car || G.dialog || G.cine || G.minigame) return false;
  const n = martinNear(); if (!n) return false;
  ({ concha: martinConcha, piso: martinPiso, concello: martinConcello1, amparo: martinAmparo, carreira: martinConcello2, esperar: martinConcello2, casa: martinCasa })[n.id]();
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
    CO('A Amparo deixoume as chaves, si. Rúa do Cardeal, 20, segundo andar. Pero ollo, que ese piso leva dous anos pechado. Non sei eu se terá auga.'),
    MA('Mientras tenga techo, ya es mejor que algún cuarto de descanso en el que he dormido.'),
    CO('E que fas de volta por aquí? Os mozos marchan, non volven.'),
    MA('Me han destinado al depósito. Maquinista. Alguien tiene que traerle los trenes a los que se quedan.'),
    CO('Ai, que ben falas! Pois benvido, rapaz. Monforte está máis vello ca min, pero aínda dá guerra.'),
    () => { G.player.money = Math.max(0, G.player.money - 2); $('money').textContent = G.player.money + ' €'; persist(); martinGo('piso'); },
  ]);
}
function fadeScene(fn, ms = 700) { $('fade').classList.add('on'); setTimeout(() => { fn(); $('fade').classList.remove('on'); }, ms); }
function martinPiso() {
  openDialog([
    MA('Segundo sin ascensor. Bueno, cuenta como calentamiento.'),
    () => { $('fade').classList.add('on'); setTimeout(() => $('fade').classList.remove('on'), 900); },
    MA('Huele a cerrado, a naftalina y a 1997. El sofá tiene funda de plástico. Respeto.'),
    MA('Grifo... nada. Ni una gota. Interruptor... tampoco. Todo en su sitio y nada funciona: un piso en vía muerta.'),
    MA('Hay una nota en la nevera: «Para dar de alta a auga, ir ao Concello. Ventanilla 3. Preguntar por Eladio».'),
    MA('«Preguntar por Eladio». No sé por qué, pero esa frase me da miedo.'),
    () => martinGo('concello'),
  ]);
}
function martinConcello1() {
  openDialog([
    EL('Bo día. Número?'),
    MA('¿Número? Si aquí no hay nadie.'),
    EL('Sen número non se atende. A máquina está aí, á dereita.'),
    MA('El uno. Qué ilusión: la primera vez que soy el primero en algo que no sea una carrera.'),
    EL('Número un! Dígame.'),
    MA('Vengo a dar de alta el agua de un piso. Cardeal, 20.'),
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
    MA('Martín Pardo, su nuevo inquilino. Cardeal, 20. Necesito que me firme el contrato, Doña Amparo.'),
    AM('Ai, o maquinista! Moi ben, moi ben. Ese piso era da miña tía Elvira, que en paz descanse. Tiña un canario que se chamaba Ramón...'),
    AM('... e o canario cantaba a muiñeira, ou iso dicía ela. Logo veu o meu sobriño, o que estivo en Suíza, e quería poñer alí unha tenda de reloxos, imaxina...'),
    MA('Doña Amparo, la historia del canario me tiene en vilo, de verdad. Pero Eladio cierra a las dos.'),
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
  const M = G.martin, me = G.player.ped, d = Math.hypot(me.x - M.conc.x, me.z - M.conc.z);
  M.timer = Math.max(40, Math.min(300, d * 1.3 / 7.6 + 25)); // a correr polas rúas dá xusto; en coche, folgado
  martinGo('carreira', true);
  toast(`Corre ata o Concello! (${isTouch ? 'empurra o joystick ao máximo' : 'Shift para correr'}) · ⏱ ${Math.round(M.timer)} s`, 4.5);
}
function martinConcello2() {
  const S = save.martin, M = G.martin;
  if (S.step === 'esperar' && G.hour < M.waitUntil) {
    const hh = Math.floor(M.waitUntil), mm = Math.round((M.waitUntil - hh) * 60);
    openDialog([MA(pick([`Cartel en la ventanilla: «Volvo ás ${hh}:${String(mm).padStart(2, '0')}». Escrito a mano. Con la letra de alguien que no piensa volver a las ${hh}:${String(mm).padStart(2, '0')}.`, 'Cerrado. Hay una planta de plástico, un calendario de 2019 y un silencio que da miedo.']))]);
    return;
  }
  const inTime = S.step === 'carreira';
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
    () => { $('fade').classList.add('on'); setTimeout(() => { G.hour = Math.max(G.hour, 21.2); envTimer = 0; lastEnvHour = -99; $('fade').classList.remove('on'); }, 900); },
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
    MA('Será el cansancio. Ocho horas de cabina, un funcionario con dos ventanillas y un canario que cantaba muiñeiras.'),
    () => { if (G.sfx && G.sfx.trainHorn && world.train) G.sfx.trainHorn(world.train); },
    MA('... Vale. Mañana me paso por el depósito. Por curiosidad. Solo por curiosidad.'),
    () => { S.flags.asubio = true; martinGo('fin1', true); bigMsg('FIN DO ACTO 1', 'Vía morta · continuará'); setTimeout(() => toast('Podes seguir paseando por Monforte con Martín. O acto 2 chegará pronto.', 6), 3500); },
  ]);
}
