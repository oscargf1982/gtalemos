'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Mega Andrés (Club Fluvial)
   Toma o sol nunha tumbona á beira da piscina olímpica, cun mojito.
   Fala da vida boa; pídeche algo fresquiño do chiringuito «Malo Será»
   e, se llo levas, desafíate a unha carreira de natación (50 m)
   na que se nada máis rápido premendo alternativamente dúas teclas,
   coma no Track & Field de sempre.
   Sprites pixel art do autor: img/andres.png (4×3), img/andres-nado.png (4×2), img/andres-face.png
   ========================================================== */
const AND = { init: false, sp: null, fr: -1, mood: null, moodT: 0 };
const andSave = () => (save.andres = save.andres || { step: 'none', wins: 0, best: 0 });
if (typeof PORTRAIT_IMG !== 'undefined') PORTRAIT_IMG['Mega Andrés'] = 'img/andres-face.png';

function andInit() {
  AND.init = true;
  const F = LM.fluvial; if (!F) return;
  const [x, z] = F.pt(29.5, -14.6), [bx, bz] = F.pt(38.7, -14.0);
  AND.spot = { x, z }; AND.bar = { x: bx, z: bz };
  const tex = new THREE.TextureLoader().load('img/andres.png'); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.encoding = THREE.sRGBEncoding;
  const h = 1.97, w = h * 220 / 240, g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - 0.02, 0);
  AND.sp = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); AND.sp.renderOrder = 2; G.scene.add(AND.sp);
  andFrame(0);
}
function andFrame(f) {
  if (AND.fr === f) return; AND.fr = f; const t = AND.sp.material.map, c = f % 4, r = Math.floor(f / 4);
  t.repeat.set(1 / 4, 1 / 3); t.offset.set(c / 4, 1 - (r + 1) / 3);
}
function andMood(m, s = 4) { AND.mood = m; AND.moodT = s; }
function updateAndres(dt) {
  if (!AND.init) andInit();
  if (!AND.sp) return;
  const me = G.player.ped, S = andSave(), d = Math.hypot(me.x - AND.spot.x, me.z - AND.spot.z);
  AND.sp.visible = d < 220; if (!AND.sp.visible) return;
  const cam = camera.position; AND.sp.position.set(AND.spot.x, groundH(AND.spot.x, AND.spot.z), AND.spot.z);
  AND.sp.rotation.y = Math.atan2(cam.x - AND.spot.x, cam.z - AND.spot.z); AND.sp.material.color.setScalar(1 - 0.4 * (G.night || 0));
  AND.moodT -= dt;
  let f;
  if (AND.moodT > 0) f = { heart: 9, celebra: 8, susto: 10, ok: 5 }[AND.mood] ?? 1;
  else if (G.dialog && $('dlgName').textContent === 'Mega Andrés') f = 1;
  else if (G.hour >= 22 || G.hour < 8) f = 11; // de noite dorme na tumbona
  else { const c = (G.t / 2.2) % 6; f = c < 3 ? 0 : c < 4 ? 1 : c < 5 ? 2 : 3; }
  andFrame(f);
  if (G.player.car || G.dialog || G.minigame) return;
  if (d < 3) setPrompt(`${isTouch ? '★' : 'E'} · Falar con Mega Andrés`);
  else if (S.step === 'pedir' && Math.hypot(me.x - AND.bar.x, me.z - AND.bar.z) < 3.5) setPrompt(`${isTouch ? '★' : 'E'} · Pedir no Malo Será`);
}

const ANDRES_VIDA = [
  'A vida son catro días, e tres choven. Así que o día que sae o sol hai que aproveitalo deitado.',
  'Sabes cal é o segredo da felicidade? Tumbona, mojito e non mirar o móbil. O resto é ruído.',
  'Traballar está ben, eh. Para quen lle guste. Eu prefiro velo dende aquí.',
  'O estrés é coma o cloro: se non saes da auga, acaba picándoche nos ollos.',
  'Hai xente que corre para chegar antes a ningures. Eu xa cheguei: estou aquí.',
  'Unha sesta ben feita vale máis que dez reunións.',
  'Cando eu era novo tamén tiña présas. Logo descubrín as tumbonas do Fluvial.',
  'Escoita o río, rapaz. O Cabe non ten présa ningunha e mira que ben lle vai.',
];
function andTalk() {
  const S = andSave(), A = (t, extra) => ({ who: 'Mega Andrés', text: t, ...extra }), ME = t => ({ who: 'Ti', text: t });
  const vida = () => A(pick(ANDRES_VIDA));
  const race = () => A(S.wins ? 'Queres a revancha? Que eu non perdo dúas veces seguidas... ou iso digo sempre.' : 'Unha carreira de 50 metros, de parede a parede. Se me gañas, invito eu. Se gaño eu... pois sigo aquí, que é o que máis me gusta.', { choices: [
    { t: 'Ao auga! (carreira)', fn: () => [A('Ponte no poio. E lembra: braceo rápido, esquerda-dereita-esquerda-dereita, sen parar!'), () => natOpen()] },
    { t: 'Cóntame algo da vida', fn: () => [vida(), A(pick(['Iso apúntao.', 'De nada, é de balde.', 'E agora, se me desculpas, toca virar a tumbona.']))] },
    { t: 'Outro día', fn: () => [A('Sen présa. O sol vai seguir aí... ben, mañá xa veremos, que isto é Monforte.')] },
  ] });
  if (S.step === 'none') return openDialog([
    A('Eeeeh, que tal, campión! Senta, senta... ben, non hai sitio, pero sente a vibra.'),
    vida(),
    ME('E ti a que te dedicas?'),
    A('A disfrutar da vida. Tomo o sol, tomo mojitos e descanso. Por esa orde, e logo volta a empezar.'),
    A('Oe, xa que estás de pé... achégate ao «Malo Será», o chiringuito do club, aí ao lado, e tráeme algo ben fresquiño. Que eu estou nun momento delicado da miña bronceadura.'),
    () => { S.step = 'pedir'; persist(); if (typeof setWaypoint === 'function') setWaypoint(AND.bar.x, AND.bar.z); toast('Leva unha bebida refrescante do Malo Será a Mega Andrés', 4); },
  ]);
  if (S.step === 'pedir') return openDialog([A(pick(['Aínda sen bebida? O chiringuito está aí ao lado, rapaz, non é o Camiño de Santiago.', 'Malo Será, aí ao lado. Pide algo fresco, que me derreto.']))]);
  if (S.step === 'levar') {
    const dr = S.drink;
    const reac = { mojito: 'Un MOJITO! Ti si que me entendes. Hortelá, lima, xeo... a vida en vaso.', granizado: 'Granizado de limón! Fresquiño, fresquiño. Moi ben, moi ben.', auga: 'Auga... Bueno. Hidratarse tamén é disfrutar da vida, supoño.' }[dr] || 'Grazas, home!';
    return openDialog([ME('Toma, Andrés, aquí tes.'), () => andMood(dr === 'auga' ? 'ok' : 'heart', 5), A(reac),
      A('Agora que estou fresco... a que non me gañas a nadar? Eu, cando quero, son un tiburón.'),
      () => { S.step = 'amigo'; persist(); }, race()]);
  }
  return openDialog([vida(), race()]);
}
function andBar() {
  const S = andSave(), C = (t, extra) => ({ who: 'Camareiro do Malo Será', text: t, ...extra });
  const buy = (k, n, t) => () => {
    if (n && G.player.money < n) return [C('Uf, non che chega. Se queres, ponche un vaso de auga da billa, que iso é de balde.')];
    if (n) { G.player.money -= n; $('money').textContent = G.player.money + ' €'; }
    S.drink = k; S.step = 'levar'; persist();
    if (typeof setWaypoint === 'function') setWaypoint(AND.spot.x, AND.spot.z);
    return [C(t), () => toast('Lévalle a bebida a Mega Andrés, na tumbona', 3.5)];
  };
  openDialog([C('Benvido ao Malo Será! Para Andrés, non? Sempre pide o mesmo, pero ti verás.', { choices: [
    { t: 'Un mojito (5 €)', fn: buy('mojito', 5, 'Mojito con moita hortelá e moito xeo. Coma sempre.') },
    { t: 'Un granizado de limón (3 €)', fn: buy('granizado', 3, 'Granizado de limón, recén feito. Que non se derreta polo camiño!') },
    { t: 'Un vaso de auga (de balde)', fn: buy('auga', 0, 'Auga fresquiña. Andrés vai poñer unha cara...') },
    { t: 'Nada, grazas', fn: () => [C('Cando queiras. Aquí estamos, malo será.')] },
  ] })]);
}
function andresInteract() {
  if (!AND.sp || G.player.car || G.dialog || G.minigame) return false;
  const me = G.player.ped, S = andSave();
  if (Math.hypot(me.x - AND.spot.x, me.z - AND.spot.z) < 3) { andTalk(); return true; }
  if (S.step === 'pedir' && Math.hypot(me.x - AND.bar.x, me.z - AND.bar.z) < 3.5) { andBar(); return true; }
  return false;
}

/* ---------- minixogo: carreira de natación (50 m) ---------- */
const NAT = { el: null, img: null };
// celas de img/andres-nado.png (380×200): 0 salto, 1 chimpo, 2-3 nadar, 4 brazos arriba na auga, 5 de pé co mojito, 6 celebra, 7 susto
const NAT_HEAD = { 0: [292, 78], 2: [287, 128], 3: [190, 118], 4: [190, 58], 5: [185, 34], 6: [185, 50], 7: [190, 42] };
function natEl() {
  if (NAT.el) return NAT.el;
  const el = document.createElement('div'); el.id = 'natacion'; el.className = 'nat-ov'; el.hidden = true;
  el.innerHTML = `<div class="mg-box"><div class="mg-top"><span class="mg-title">Carreira de natación con Mega Andrés · 50 m</span><span class="mg-msg"></span><button class="mg-x" title="Saír">✕</button></div>
  <canvas class="mg-cv" width="760" height="430"></canvas>
  <div class="mg-bar nat-bar"><button class="nat-b" data-k="L">◀ A</button><span class="nat-tip">Alterna ◀ e ▶ (ou A e D) o máis rápido que poidas</span><button class="nat-b" data-k="R">D ▶</button></div></div>`;
  document.body.appendChild(el); NAT.el = el;
  el.querySelector('.mg-x').onclick = natClose;
  el.querySelectorAll('.nat-b').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); natPress(b.dataset.k); }));
  window.addEventListener('keydown', e => {
    if (G.minigame !== 'natacion') return;
    const k = { ArrowLeft: 'L', KeyA: 'L', KeyZ: 'L', ArrowRight: 'R', KeyD: 'R', KeyX: 'R' }[e.code];
    if (k) { e.preventDefault(); if (!e.repeat) natPress(k); }
    else if (e.code === 'Escape') natClose();
    else if ((e.code === 'Space' || e.code === 'Enter') && NAT.R && NAT.R.ph === 'fin') natStart();
  });
  NAT.img = new Image(); NAT.img.src = 'img/andres-nado.png';
  return el;
}
function natOpen() {
  natEl().hidden = false; G.minigame = 'natacion';
  if (document.exitPointerLock) try { document.exitPointerLock(); } catch (e) { }
  natStart();
  if (!NAT.raf) { let last = performance.now(); const loop = now => { const dt = Math.min(0.1, (now - last) / 1000); last = now; if (G.minigame === 'natacion') { natStep(dt); natDraw(); NAT.raf = requestAnimationFrame(loop); } else NAT.raf = 0; }; NAT.raf = requestAnimationFrame(loop); }
}
function natClose() { if (NAT.el) NAT.el.hidden = true; if (G.minigame === 'natacion') G.minigame = null; }
function natMsg(t) { NAT.el.querySelector('.mg-msg').textContent = t; }
function natStart() {
  NAT.R = { ph: 'listos', t: 0, me: { d: 0, v: 0, st: 0, ph: 0, last: '', presses: [], done: 0 }, an: { d: 0, v: 0, st: 0, ph: 0, done: 0 }, false: false, winner: null };
  natMsg('Ponte no poio...');
  const bar = NAT.el.querySelector('.nat-bar'); bar.querySelectorAll('.nat-again').forEach(b => b.remove());
}
function natPress(k) {
  const R = NAT.R; if (!R) return;
  if (R.ph === 'listos' || R.ph === 'conta') { if (R.ph === 'conta' && R.t > 0.6) { R.ph = 'listos'; R.t = -0.8; natMsg('Saída nula! Agarda ao «XA!»'); } return; }
  if (R.ph !== 'nado') return;
  const m = R.me; if (k === m.last) return; // hai que alternar
  m.last = k; m.presses.push(performance.now());
}
function natStep(dt) {
  const R = NAT.R; if (!R) return; R.t += dt;
  const DIST = 50, m = R.me, a = R.an;
  if (R.ph === 'listos' && R.t > 0.9) { R.ph = 'conta'; R.t = 0; }
  if (R.ph === 'conta') { const n = 3 - Math.floor(R.t / 0.75); natMsg(n > 0 ? n + '...' : 'XA!'); if (R.t >= 2.25) { R.ph = 'nado'; R.t = 0; m.st = a.st = 0; } return; }
  if (R.ph !== 'nado') return;
  // ti: a velocidade sae do ritmo de pulsacións alternas (último 0,8 s)
  const now = performance.now(); m.presses = m.presses.filter(t => now - t < 800);
  const rate = m.presses.length / 0.8, tv = Math.min(5.2, rate * 0.62);
  m.st += dt;
  if (!m.done) {
    if (m.st < 0.55) m.v = Math.max(m.v, 3.2); // o salto dá un empurrón
    else m.v += (tv - m.v) * Math.min(1, dt * 3.5);
    m.d += m.v * dt; m.ph += dt * (1.2 + m.v * 0.9);
    if (m.d >= DIST) { m.d = DIST; m.done = R.t; }
  }
  // Mega Andrés: bo nadador pero sen pasarse, con algún momento de "desfrutar"
  a.st += dt;
  if (!a.done) {
    const ta = a.st < 0.2 ? 0 : a.st < 0.75 ? 3.4 : 3.55 + 0.35 * Math.sin(a.st * 0.9) - (a.d > 30 && a.d < 36 ? 0.5 : 0);
    a.v += (ta - a.v) * Math.min(1, dt * 3); a.d += a.v * dt; a.ph += dt * (1.2 + a.v * 0.9);
    if (a.d >= DIST) { a.d = DIST; a.done = R.t; }
  }
  if (!R.winner && (m.done || a.done)) R.winner = m.done && (!a.done || m.done <= a.done) ? 'me' : 'an';
  if (a.done && !m.done && R.t - a.done > 10) { m.done = R.t; R.gaveUp = true; } // se paras de nadar, acaba igual
  if (m.done && a.done) natEnd();
  else if (R.winner === 'an' && !m.done) natMsg('Mega Andrés xa tocou a parede! Remata ti!');
  else if (R.winner === 'me' && !a.done) natMsg('Tocaches primeiro!');
  else natMsg(`${m.d.toFixed(1)} m · ${R.t.toFixed(1)} s`);
}
function natEnd() {
  const R = NAT.R; if (R.ph === 'fin') return; R.ph = 'fin';
  const S = andSave(), won = R.winner === 'me', tm = R.me.done;
  let txt;
  if (won) {
    const first = !S.wins; S.wins = (S.wins || 0) + 1;
    if (first) { G.player.money += 25; $('money').textContent = G.player.money + ' €'; }
    txt = `Gañaches en ${tm.toFixed(2)} s!` + (first ? ' Andrés invítate: +25 €' : '');
    andMood('susto', 6);
  } else { txt = `Gañou Mega Andrés (${R.an.done.toFixed(2)} s). Ti: ${tm.toFixed(2)} s`; andMood('celebra', 6); }
  if (!S.best || tm < S.best) { S.best = tm; txt += ' · Récord persoal!'; }
  persist(); natMsg(txt);
  const bar = NAT.el.querySelector('.nat-bar'), b = document.createElement('button'); b.className = 'nat-again'; b.textContent = 'Outra carreira'; b.onclick = natStart; bar.appendChild(b);
  setTimeout(() => { if (G.minigame !== 'natacion') return; if (typeof toast === 'function') toast(won ? pick(['Mega Andrés: «Ti adestraches ás miñas costas, eh?»', 'Mega Andrés: «Deixeite gañar... para que disfrutes da vida.»']) : pick(['Mega Andrés: «O tiburón do Cabe nunca falla!»', 'Mega Andrés: «Máis mojito e menos présa, campión.»']), 4); }, 600);
}
function natDraw() {
  const cv = NAT.el.querySelector('.mg-cv'), x = cv.getContext('2d'), W = cv.width, H = cv.height, R = NAT.R, img = NAT.img;
  x.imageSmoothingEnabled = false;
  // ceo, céspede e beira
  let g = x.createLinearGradient(0, 0, 0, 110); g.addColorStop(0, '#7cc4ef'); g.addColorStop(1, '#cde9f7'); x.fillStyle = g; x.fillRect(0, 0, W, 110);
  x.fillStyle = '#3e9a4a'; x.fillRect(0, 92, W, 22); x.fillStyle = '#e9e3d4'; x.fillRect(0, 112, W, 16);
  x.fillStyle = '#ff8a2a'; x.font = 'bold 16px Barlow, sans-serif'; x.fillText('MALO SERÁ', W - 110, 84); x.fillStyle = '#6b4fc8'; x.fillRect(40, 60, 230, 32); x.fillStyle = '#fff'; x.fillText('CLUB FLUVIAL MONFORTE', 52, 82);
  const X0 = 70, X1 = W - 40, lanes = [{ top: 128, bot: 278, y: 200, who: 'an', lab: 'MEGA ANDRÉS' }, { top: 282, bot: 430, y: 356, who: 'me', lab: 'TI' }];
  const SC = 0.52;
  const drawCell = (c, cx, by, cap) => {
    if (!img || !img.complete) return;
    const sx = (c % 4) * 380, sy = Math.floor(c / 4) * 200, w = 380 * SC, h = 200 * SC, dx = cx - w / 2, dy = by - h;
    x.drawImage(img, sx, sy, 380, 200, dx, dy, w, h);
    if (cap && NAT_HEAD[c]) { const [hx, hy] = NAT_HEAD[c], px = dx + hx * SC, py = dy + hy * SC; x.fillStyle = '#1a8c3a'; x.beginPath(); x.ellipse(px, py - 4, 13, 9, 0, Math.PI, 0); x.fill(); x.fillRect(px - 2, py - 6, 20, 4); x.fillStyle = '#d4202b'; x.fillRect(px - 5, py - 9, 8, 3); }
  };
  for (const L of lanes) {
    const s = R[L.who], cap = L.who === 'me';
    // corte da rúa: aire, auga, borde de saída e parede de chegada
    x.fillStyle = '#d7eef7'; x.fillRect(0, L.top, W, L.y - L.top);
    g = x.createLinearGradient(0, L.y, 0, L.bot); g.addColorStop(0, '#46c2dc'); g.addColorStop(1, '#1b6f9c'); x.fillStyle = g; x.fillRect(X0, L.y, X1 - X0, L.bot - L.y);
    x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 18; i++) { const xx = X0 + ((i * 53 + performance.now() / 25) % (X1 - X0 - 16)); x.fillRect(xx, L.y + 2 + (i % 3) * 3, 12, 2); }
    x.fillStyle = '#e9e3d4'; x.fillRect(0, L.y, X0, L.bot - L.y); x.fillRect(X1, L.y, W - X1, L.bot - L.y);
    x.fillStyle = '#c9c2b0'; for (let yy = L.y + 12; yy < L.bot; yy += 12) { x.fillRect(0, yy, X0, 1); x.fillRect(X1, yy, W - X1, 1); }
    x.fillStyle = '#f4f4f0'; x.fillRect(X0 - 46, L.y - 12, 46, 12); x.fillStyle = '#1d4fd8'; x.font = 'bold 10px Barlow, sans-serif'; x.fillText(L.who === 'me' ? '4' : '5', X0 - 26, L.y - 3);
    x.fillStyle = 'rgba(0,0,0,.5)'; x.font = '11px Barlow, sans-serif'; for (const m of [10, 20, 30, 40]) { const xx = X0 + (X1 - X0) * m / 50; x.fillRect(xx, L.bot - 10, 1, 8); x.fillText(m + ' m', xx - 10, L.bot - 13); }
    x.fillStyle = cap ? '#c0392b' : '#1d4fd8'; x.font = 'bold 15px Barlow, sans-serif'; x.fillText(L.lab, X0 + 6, L.top + 18);
    const pos = X0 + 60 + (X1 - X0 - 130) * s.d / 50;
    if (R.ph === 'listos' || R.ph === 'conta') drawCell(5, X0 - 24, L.y - 10, cap);
    else if (R.ph === 'fin' || s.done) drawCell(R.winner === L.who ? 4 : 3, X1 - 60, L.y + (R.winner === L.who ? 34 : 24), cap);
    else if (s.st < 0.45) { const u = s.st / 0.45; drawCell(0, X0 + 10 + u * 70, L.y - 2 - Math.sin(u * Math.PI) * 22 + u * 14, cap); }
    else if (s.st < 0.7) drawCell(1, X0 + 85, L.y + 26, false);
    else drawCell(2 + (Math.floor(s.ph * 2) % 2), pos, L.y + 26, cap);
  }
  // corcheira entre as dúas rúas
  for (let k = 0; k <= 25; k++) { x.fillStyle = k < 2 || k > 23 ? '#d4202b' : k % 2 ? '#f2f2f2' : '#1d4fd8'; x.beginPath(); x.arc(X0 + 6 + (X1 - X0 - 12) * k / 25, 280, 5, 0, 7); x.fill(); }
  // ritmo
  if (R.ph === 'nado' && !R.me.done) { const r = Math.min(1, R.me.v / 5.2); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(W - 210, H - 26, 190, 14); x.fillStyle = r > 0.75 ? '#2fd36b' : r > 0.45 ? '#f2c21b' : '#d4202b'; x.fillRect(W - 210, H - 26, 190 * r, 14); x.fillStyle = '#fff'; x.font = 'bold 11px Barlow, sans-serif'; x.fillText('RITMO', W - 252, H - 15); }
  if (R.ph === 'conta' || (R.ph === 'nado' && R.t < 0.6)) { const n = R.ph === 'nado' ? 'XA!' : String(Math.max(1, 3 - Math.floor(R.t / 0.75))); x.fillStyle = 'rgba(0,0,0,.45)'; x.font = 'bold 90px Barlow, sans-serif'; x.textAlign = 'center'; x.fillText(n, W / 2 + 4, 104); x.fillStyle = n === 'XA!' ? '#2fd36b' : '#ffe36b'; x.fillText(n, W / 2, 100); x.textAlign = 'left'; }
}
