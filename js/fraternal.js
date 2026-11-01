'use strict';
/* ==========================================================
   GTA LEMOS 27400 · La Fraternal (Rúa de Concepción Arenal)
   Dentro está o Tío David, que te desafía ao dominó, á brisca,
   ás damas e ao xadrez. Gañar dálle uns euros (e moita conversa).
   ========================================================== */
G.fraternal = null;
/* batallitas do Tío David: baseadas na entrevista publicada en El Progreso (setembro de 2022) */
const DAVID_LEMOS = [
  'Eu nacín no Barco, sabes? Alí non había fútbol, só baloncesto! Cheguei a Monforte con doce anos, fillo de ferroviarios. Monfortino de adopción.',
  'O fútbol descubrino nos Escolapios. Nos recreos xogabamos vinte contra vinte. Vinte contra vinte! Un balón para corenta rapaces, e eu sempre o tiña.',
  'Xogaba a todas horas: antes de comer, ao saír de clase, antes de deitarme... Despois veu o Calasancio, a Peña de Jopy... Futbolista nácese, non se fai.',
  'No 66 fichei polo Lemos, cando estabamos en Tercera Nacional. Tercera Nacional, eh! Do mellor que tivo nunca o Lemos.',
  'Contra o Ourense, que aquel ano era o mellor da categoría, marqueilles un gol. Anulárono por un fóra de xogo que non existía! E despois eles meten un moi dubidoso e gañan 1-0. Aínda hai xente que mo lembra.',
  'Eu xogaba no Lemos e traballaba na óptica Cardenal. Pola mañá graduando a vista, pola tarde adestrando. Por iso vía os pases antes que ninguén.',
  'En Barcelona, nun partido de empresa polo día de Santa Otilia, metín once goles. Once! E por primeira vez a miña fábrica gañoulle á outra.',
  'No 77, coa moda do fútbol sala, fundamos co meus irmáns o Atlético Monfortino. Fixemos un partido en Semana Santa contra o Calasancio xuvenil e de aí saíu a liga de fútbol sala de Monforte.',
  'Xoguei ao fútbol sala ata os corenta e oito anos, e fun o máximo goleador da Liga Federada. Despois fixen de árbitro, que alguén tiña que poñer orde.',
  'Agora xa só vexo os partidos. E no outono vou aos cogumelos. Iso si que é un deporte de risco, que hai que saber cales colles!',
];
const davidStory = () => pick(DAVID_LEMOS);
function fraternalDoor() {
  if (!LM.arenal) return null;
  const [x, z] = LM.arenal.pt(28.3, ARENAL.fl - 1.2); return { x, z };
}
function updateFraternal(dt) {
  if (!G.fraternal) G.fraternal = { door: fraternalDoor() };
  updateDavid(dt);
  const D = G.fraternal.door; if (!D || G.player.car || G.dialog || G.minigame) return;
  const me = G.player.ped; if (!G.interior && Math.hypot(me.x - D.x, me.z - D.z) < 3) setPrompt(`${isTouch ? '★' : 'E'} · Entrar na Fraternal`);
}
function fraternalInteract(inside) {
  const F = G.fraternal; if (!F || !F.door || G.dialog || G.minigame) return false;
  if (!inside) { if (G.player.car || G.interior) return false; const me = G.player.ped; if (Math.hypot(me.x - F.door.x, me.z - F.door.z) > 3) return false; interiorEnter('fraternal'); return true; }
  const D = (t, extra) => ({ who: 'Tío David', text: t, ...extra });
  const games = () => D('A que xogamos? Eu xogo a todo, pero ao dominó non me gaña nin o cura.', { choices: [
    { t: 'Dominó', fn: () => [D('Ao dominó! Colle as túas sete fichas. Sen trampas, que te estou vendo.'), () => mgOpen('domino')] },
    { t: 'Brisca', fn: () => [D('Unha brisca a dous. O triunfo é a carta que queda debaixo do mazo. Fai sesenta e un e gañas.'), () => mgOpen('brisca')] },
    { t: 'Damas', fn: () => [D('Damas! Ti levas as brancas e saes ti. Comer é obrigatorio, eh, que aquí somos serios.'), () => mgOpen('damas')] },
    { t: 'Xadrez', fn: () => [D('Xadrez... o xogo dos reis. Ti brancas. E non me fagas esperar, que ás nove pecho o bar.'), () => mgOpen('xadrez')] },
    { t: 'Cóntame de cando xogabas no Lemos', fn: () => [D(davidStory()), D(pick(['E iso non é nada...', 'Que tempos, rapaz, que tempos.', 'Futbolista nácese, xa cho dixen.'])), games()] },
    { t: 'Hoxe non, Tío David', fn: () => [D('Ti verás. Aquí estarei, coma sempre, entre o café e a partida.')] },
  ] });
  const ME = t => ({ who: 'Ti', text: t });
  const ourense = [
    [ME('Tío David! Aínda se fala do gol que lle marcaches ao Ourense cando o Lemos estaba en Tercera Nacional!'), D('Ese gol era legal! O liñeiro estaba a tomar un café, porque fóra de xogo non había ningún. E logo eles meten un en fóra de xogo descarado e gañan 1-0. Aínda me ferve o sangue.')],
    [ME('Oe, Tío David, e aquel gol ao Ourense en Tercera Nacional?'), D('Ai, non me fales... Era o mellor equipo da categoría e eu metinlles un golazo. Anulárono! Hai xente que aínda mo lembra pola rúa, sabes?')],
    [ME('Dixéronme que lle marcaches un gol ao Ourense cando xogabas no Lemos, en Tercera Nacional...'), D('Dixéronche ben! O que non che dirían é que o anularon. Fóra de xogo, dicían. Fóra de xogo o árbitro, que non vía nin cos meus lentes!')],
    [ME('Tío David, o do gol ao Ourense en Tercera Nacional foi verdade?'), D('Verdade verdadeira! Se ata me paran polo mercado para falar del. E iso que mo anularon... Imaxínate se subise ao marcador.')],
  ];
  const og = pick(ourense);
  openDialog([D(G.davidMet ? 'Volves! Xa sabía eu que tiñas gana de perder outra vez.' : 'Hombre! Benvido á Fraternal. Eu son o Tío David. Aquí xogamos desde antes de que houbese televisión.'), ...og, D(G.davidMet ? 'Veña, escolle.' : 'Se me gañas, pago eu. Se perdes, polo menos aprendes algo. Que me dis?'), games()]);
  G.davidMet = true; return true;
}
/* ==================== capa dos minixogos ==================== */
const MG = { el: null, game: null };
function mgEl() {
  if (MG.el) return MG.el;
  const el = document.createElement('div'); el.id = 'minigame'; el.hidden = true;
  el.innerHTML = `<div class="mg-box"><div class="mg-top"><span class="mg-title"></span><span class="mg-msg"></span><button class="mg-x" title="Saír">✕</button></div><div class="mg-row"><div class="mg-david"></div><canvas class="mg-cv"></canvas></div><div class="mg-bar"></div></div>`;
  document.body.appendChild(el); MG.el = el;
  el.querySelector('.mg-x').onclick = () => mgClose();
  const cv = el.querySelector('.mg-cv');
  const hit = ev => { const r = cv.getBoundingClientRect(); const t = ev.touches ? ev.touches[0] : ev; return [(t.clientX - r.left) * cv.width / r.width, (t.clientY - r.top) * cv.height / r.height]; };
  cv.addEventListener('pointerdown', ev => { ev.preventDefault(); if (MG.game && MG.game.click && !MG.busy) { MG.game.click(...hit(ev)); mgDraw(); } });
  return el;
}
function mgMsg(t) { MG.el.querySelector('.mg-msg').textContent = t; if (typeof mgDavid === 'function') mgDavid(/Pensa|xoga|rouba|Xoga/.test(t) ? 8 : /Gañaches/.test(t) ? 10 : /Gañou|Xaque|leva a baza/.test(t) ? 9 : 0); }
function mgOpen(kind) {
  const el = mgEl(); el.hidden = false; G.minigame = kind; MG.busy = false;
  if (document.exitPointerLock) try { document.exitPointerLock(); } catch (e) {}
  const cv = el.querySelector('.mg-cv'); cv.width = 760; cv.height = 560;
  MG.game = { domino: mgDomino, brisca: mgBrisca, damas: mgDamas, xadrez: mgXadrez, taekwondo: () => mgFight('taekwondo'), boxeo: () => mgFight('boxeo') }[kind]();
  const fight = kind === 'taekwondo' || kind === 'boxeo'; el.querySelector('.mg-david').style.display = fight ? 'none' : '';
  el.querySelector('.mg-title').textContent = { domino: 'Dominó co Tío David', brisca: 'Brisca co Tío David', damas: 'Damas co Tío David', xadrez: 'Xadrez co Tío David', taekwondo: 'Taekwondo co sensei', boxeo: 'Boxeo co sensei' }[kind];
  mgDraw();
}
function mgClose() { if (MG.el) MG.el.hidden = true; G.minigame = null; MG.game = null; }
function mgDraw() { const cv = MG.el.querySelector('.mg-cv'), x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#245a36'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 400; i++) x.fillRect(Math.random() * cv.width, Math.random() * cv.height, 2, 2); if (MG.game) MG.game.draw(x, cv.width, cv.height); }
function mgLater(fn, ms = 650) { MG.busy = true; setTimeout(() => { MG.busy = false; if (!MG.game) return; fn(); mgDraw(); if (!MG.game.over && Math.random() < 0.12) mgBar(`<i>Tío David: «${davidStory()}»</i>`); }, ms); }
function mgEnd(won, draw) {
  const pr = { domino: 15, brisca: 15, damas: 20, xadrez: 40, taekwondo: 25, boxeo: 25 }[G.minigame] || 10, fightK = G.minigame === 'taekwondo' || G.minigame === 'boxeo';
  if (won) { G.player.money += pr; $('money').textContent = G.player.money + ' €'; }
  const L = won ? [`Gañaches! Toma, ${pr} euros. Mañá non che vai saír tan ben.`, 'Bah, tiveches sorte. Outra?'] : draw ? ['Táboas. Ningún dos dous quere perder, eh?'] : ['Gañei eu! Ai, rapaz, aínda tes moito que aprender.', 'Non te poñas triste, que eu levo setenta anos xogando.'];
  mgMsg(won ? `Gañaches! +${pr} €` : draw ? 'Empate' : fightK ? 'Gañou o sensei' : 'Gañou o Tío David');
  if (fightK) { L.length = 0; L.push(...(won ? ['Bo traballo. Toma, ' + pr + ' euros de premio. Volve o martes, que hai adestramento.', 'Tes pernas. Agora falta cabeza. Toma o premio.'] : draw ? ['Empate. Polo menos non caíches.'] : ['Garda arriba, sempre! Volve mañá.', 'Ao chan. Saúda e volve a intentalo.'])); }
  else if (Math.random() < 0.6) L.push(...DAVID_LEMOS.map(t => (won ? 'Gañaches, si... pero escoita: ' : 'Ves? Experiencia. ') + t));
  const bar = MG.el.querySelector('.mg-bar'); bar.innerHTML = `<i>${fightK ? 'Sensei' : 'Tío David'}: «${pick(L)}»</i> <button class="mg-again">Outra partida</button> <button class="mg-out">Saír</button>`;
  bar.querySelector('.mg-again').onclick = () => { const k = G.minigame; bar.innerHTML = ''; mgOpen(k); };
  bar.querySelector('.mg-out').onclick = () => mgClose();
  MG.game.over = true;
}
const mgBar = h => { MG.el.querySelector('.mg-bar').innerHTML = h || ''; };

/* ==================== DOMINÓ (dobre seis, a dous) ==================== */
function mgDomino() {
  const all = []; for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push([a, b]);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const S = { me: all.splice(0, 7), ai: all.splice(0, 7), pile: all, chain: [], sel: -1, turn: 'me', pass: 0 };
  const ends = () => S.chain.length ? [S.chain[0][0], S.chain[S.chain.length - 1][1]] : null;
  const fits = t => { const e = ends(); if (!e) return ['L']; const r = []; if (t[0] === e[0] || t[1] === e[0]) r.push('L'); if (t[0] === e[1] || t[1] === e[1]) r.push('R'); return r; };
  const place = (t, side) => { const e = ends(); if (!e) { S.chain.push(t.slice()); return; } if (side === 'L') S.chain.unshift(t[1] === e[0] ? [t[0], t[1]] : [t[1], t[0]]); else S.chain.push(t[0] === e[1] ? [t[0], t[1]] : [t[1], t[0]]); };
  const pips = h => h.reduce((s, t) => s + t[0] + t[1], 0);
  const check = () => { if (!S.me.length) return mgEnd(true); if (!S.ai.length) return mgEnd(false); if (S.pass >= 2) { const a = pips(S.me), b = pips(S.ai); mgMsg('Pechado!'); return mgEnd(a < b, a === b); } return false; };
  const aiTurn = () => {
    let t = -1, side = null, best = -1; S.ai.forEach((tl, i) => { for (const s of fits(tl)) { const v = tl[0] + tl[1] + (tl[0] === tl[1] ? 3 : 0); if (v > best) { best = v; t = i; side = s; } } });
    if (t < 0 && S.pile.length) { S.ai.push(S.pile.pop()); mgMsg('O Tío David rouba unha ficha...'); return mgLater(aiTurn, 450); }
    if (t < 0) { S.pass++; mgMsg('O Tío David pasa. Tócache.'); } else { place(S.ai.splice(t, 1)[0], side); S.pass = 0; mgMsg(`O Tío David xoga. Tócache a ti.`); }
    S.turn = 'me'; if (check() !== false) return; if (!S.me.some(t2 => fits(t2).length) && !S.pile.length) { S.pass++; mgMsg('Non podes xogar: pasas.'); S.turn = 'ai'; if (check() === false) mgLater(aiTurn); }
  };
  mgMsg('Escolle unha ficha túa. Se non podes, rouba do monte.');
  const T = { x: 0 };
  return {
    draw(x, W, H) {
      // cadea en serpe
      const tw = 44, th = 22; let px = 20, py = 70, dir = 1;
      x.font = 'bold 13px sans-serif';
      for (const t of S.chain) { if ((dir > 0 && px + tw > W - 20) || (dir < 0 && px < 20)) { py += th + 10; dir = -dir; px = dir > 0 ? 20 : W - 20 - tw; } domTile(x, px, py, tw, th, dir > 0 ? t : [t[1], t[0]]); px += dir * (tw + 3); }
      // as miñas fichas
      x.fillStyle = '#f2e6c0'; x.fillText(`Monte: ${S.pile.length} · Tío David: ${S.ai.length} fichas`, 20, 30);
      for (let i = 0; i < S.ai.length; i++) { x.fillStyle = '#e9e2d0'; x.fillRect(W - 30 - i * 16, 18, 13, 24); }
      const n = S.me.length, sw = Math.min(70, (W - 40) / n); S.me.forEach((t, i) => { const tx = 20 + i * sw, ty = H - 110; domTile(x, tx, ty, 30, 60, t, true, i === S.sel, fits(t).length > 0); });
      if (S.sel >= 0) { const f = fits(S.me[S.sel]); x.fillStyle = '#f2c21b'; x.font = 'bold 16px sans-serif'; if (f.includes('L')) x.fillText('◀ esquerda', 20, H - 130); if (f.includes('R')) x.fillText('dereita ▶', W - 110, H - 130); }
      x.fillStyle = S.pile.length ? '#c9a24a' : '#666'; x.fillRect(W - 150, H - 40, 130, 30); x.fillStyle = '#222'; x.font = 'bold 14px sans-serif'; x.fillText('ROUBAR FICHA', W - 140, H - 20);
    },
    click(mx, my) {
      if (S.turn !== 'me' || this.over) return; const W = 760, H = 560;
      if (mx > W - 150 && my > H - 40) { if (S.me.some(t => fits(t).length)) { mgMsg('Tes ficha que vale, non rouba!'); return; } if (S.pile.length) { S.me.push(S.pile.pop()); mgMsg('Roubaches unha ficha.'); } return; }
      const n = S.me.length, sw = Math.min(70, (W - 40) / n);
      for (let i = 0; i < n; i++) { const tx = 20 + i * sw; if (mx > tx && mx < tx + 30 && my > H - 110 && my < H - 50) { const f = fits(S.me[i]); if (!f.length) { mgMsg('Esa non entra.'); return; } if (f.length === 1) { place(S.me.splice(i, 1)[0], f[0]); S.sel = -1; return this.after(); } S.sel = i; mgMsg('Entra polos dous lados: toca esquerda ou dereita.'); return; } }
      if (S.sel >= 0 && my > H - 145 && my < H - 120) { const f = fits(S.me[S.sel]); const side = mx < W / 2 ? 'L' : 'R'; if (f.includes(side)) { place(S.me.splice(S.sel, 1)[0], side); S.sel = -1; return this.after(); } }
    },
    after() { S.pass = 0; if (check() !== false) return; S.turn = 'ai'; mgMsg('Xoga o Tío David...'); mgLater(aiTurn); },
  };
}
function domTile(x, px, py, w, h, t, vert, sel, ok) {
  x.fillStyle = sel ? '#ffe9a0' : '#f6f2e6'; x.strokeStyle = ok === false ? '#888' : '#222'; x.lineWidth = 1.5; x.fillRect(px, py, w, h); x.strokeRect(px, py, w, h);
  const half = (v, cx, cy, s) => { const P = { 0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v]; x.fillStyle = '#1a1a1a'; for (const [a, b] of P) { x.beginPath(); x.arc(cx + a * s, cy + b * s, s * 0.32, 0, 7); x.fill(); } };
  if (vert) { x.fillRect(px + 3, py + h / 2 - 0.5, w - 6, 1); half(t[0], px + w / 2, py + h / 4, w * 0.26); half(t[1], px + w / 2, py + 3 * h / 4, w * 0.26); }
  else { x.fillStyle = '#222'; x.fillRect(px + w / 2 - 0.5, py + 3, 1, h - 6); half(t[0], px + w / 4, py + h / 2, h * 0.26); half(t[1], px + 3 * w / 4, py + h / 2, h * 0.26); }
}

/* ==================== BRISCA (baralla española de 40, a dous) ==================== */
function mgBrisca() {
  const SU = ['oros', 'copas', 'espadas', 'bastos'], RK = [1, 3, 12, 11, 10, 7, 6, 5, 4, 2], PT = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2 };
  const deck = []; for (const s of SU) for (const r of RK) deck.push({ s, r });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const S = { me: deck.splice(0, 3), ai: deck.splice(0, 3), deck, trump: deck[0], table: [], lead: 'me', ptMe: 0, ptAi: 0, last: null };
  const pw = c => RK.length - RK.indexOf(c.r); // forza dentro do pau
  const beats = (b, a) => b.s === a.s ? pw(b) > pw(a) : b.s === S.trump.s; // b gaña a a (a saíu primeiro)
  const pts = c => PT[c.r] || 0;
  const draw = () => { const order = S.lastWin === 'ai' ? ['ai', 'me'] : ['me', 'ai']; for (const w of order) if (S.deck.length) S[w].push(S.deck.length > 1 ? S.deck.pop() : S.deck.shift()); };
  const resolve = () => {
    const [a, b] = S.table; const first = S.lead; const secondWins = beats(b.c, a.c); const win = secondWins ? (first === 'me' ? 'ai' : 'me') : first;
    const p = pts(a.c) + pts(b.c); if (win === 'me') S.ptMe += p; else S.ptAi += p; S.lastWin = win; S.lead = win;
    mgMsg(win === 'me' ? `Levas a baza (+${p}).` : `O Tío David leva a baza (+${p}).`);
    mgLater(() => { S.table = []; draw(); if (!S.me.length && !S.ai.length) { return mgEnd(S.ptMe > 60, S.ptMe === 60); } if (S.lead === 'ai') aiPlay(); }, 900);
  };
  const aiPlay = () => {
    let i;
    if (!S.table.length) { // saír co máis barato que non sexa triunfo
      i = S.ai.reduce((bi, c, k) => (pts(c) + (c.s === S.trump.s ? 15 : 0) + pw(c) * 0.1 < pts(S.ai[bi]) + (S.ai[bi].s === S.trump.s ? 15 : 0) + pw(S.ai[bi]) * 0.1 ? k : bi), 0);
    } else { const a = S.table[0].c, wins = S.ai.map((c, k) => [k, c]).filter(([k, c]) => beats(c, a));
      if (wins.length && (pts(a) >= 3 || wins.some(([k, c]) => c.s !== S.trump.s))) i = wins.sort((u, v) => (u[1].s === S.trump.s) - (v[1].s === S.trump.s) || pw(u[1]) - pw(v[1]))[0][0];
      else i = S.ai.reduce((bi, c, k) => pts(c) + pw(c) * 0.1 + (c.s === S.trump.s ? 15 : 0) < pts(S.ai[bi]) + pw(S.ai[bi]) * 0.1 + (S.ai[bi].s === S.trump.s ? 15 : 0) ? k : bi, 0); }
    S.table.push({ who: 'ai', c: S.ai.splice(i, 1)[0] });
    if (S.table.length === 2) resolve(); else mgMsg('Tócache.');
  };
  mgMsg(`Triunfo: ${S.trump.s}. Saes ti.`);
  return {
    draw(x, W, H) {
      x.fillStyle = '#f2e6c0'; x.font = 'bold 15px sans-serif'; x.fillText(`Ti: ${S.ptMe} puntos · Tío David: ${S.ptAi} · Mazo: ${S.deck.length}`, 20, 30);
      if (S.deck.length) { card(x, 30, 200, S.trump, 0.9, true); x.fillStyle = '#7a1f1f'; x.fillRect(60, 190, 70, 105); x.strokeStyle = '#f2e6c0'; x.strokeRect(60, 190, 70, 105); }
      x.fillStyle = '#f2e6c0'; x.font = '13px sans-serif'; x.fillText('Triunfo', 30, 330);
      S.ai.forEach((c, i) => { x.fillStyle = '#7a1f1f'; x.fillRect(W / 2 - 120 + i * 80, 50, 70, 105); x.strokeStyle = '#f2e6c0'; x.strokeRect(W / 2 - 120 + i * 80, 50, 70, 105); });
      S.table.forEach((t, i) => card(x, W / 2 - 90 + i * 100, 210, t.c, 1));
      S.me.forEach((c, i) => card(x, W / 2 - 150 + i * 105, H - 160, c, 1.25));
    },
    click(mx, my) {
      if (this.over || (S.table.length === 0 && S.lead !== 'me') || S.table.length === 2 || (S.table.length === 1 && S.table[0].who === 'me')) return; const W = 760, H = 560;
      for (let i = 0; i < S.me.length; i++) { const cx = W / 2 - 150 + i * 105; if (mx > cx && mx < cx + 88 && my > H - 160 && my < H - 28) { S.table.push({ who: 'me', c: S.me.splice(i, 1)[0] }); if (S.table.length === 2) resolve(); else { mgMsg('Pensa o Tío David...'); mgLater(aiPlay); } return; } }
    },
  };
}
function card(x, px, py, c, s = 1, rot) {
  const w = 70 * s, h = 105 * s; x.save(); x.translate(px, py); if (rot) { x.translate(w / 2, h / 2); x.rotate(Math.PI / 2); x.translate(-w / 2, -h / 2); }
  x.fillStyle = '#fbf7ec'; x.fillRect(0, 0, w, h); x.strokeStyle = '#333'; x.lineWidth = 1.5; x.strokeRect(0, 0, w, h);
  const col = { oros: '#d4a017', copas: '#c0392b', espadas: '#2c5fa8', bastos: '#2e7d32' }[c.s], name = { 1: 'As', 10: 'Sota', 11: 'Cab.', 12: 'Rei' }[c.r] || String(c.r);
  x.fillStyle = col; x.font = `bold ${16 * s}px sans-serif`; x.fillText(name, 6 * s, 20 * s);
  const cx = w / 2, cy = h / 2 + 6 * s, r = 14 * s; x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 3 * s;
  if (c.s === 'oros') { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.fillStyle = '#fff3b0'; x.beginPath(); x.arc(cx, cy, r * 0.5, 0, 7); x.fill(); }
  else if (c.s === 'copas') { x.beginPath(); x.moveTo(cx - r, cy - r); x.quadraticCurveTo(cx, cy + r * 0.9, cx + r, cy - r); x.fill(); x.fillRect(cx - 2 * s, cy, 4 * s, r); x.fillRect(cx - r * 0.6, cy + r, r * 1.2, 3 * s); }
  else if (c.s === 'espadas') { x.beginPath(); x.moveTo(cx, cy - r * 1.4); x.lineTo(cx, cy + r * 1.1); x.stroke(); x.beginPath(); x.moveTo(cx - r * 0.7, cy + r * 0.5); x.lineTo(cx + r * 0.7, cy + r * 0.5); x.stroke(); }
  else { x.lineWidth = 6 * s; x.beginPath(); x.moveTo(cx - r * 0.5, cy + r * 1.2); x.lineTo(cx + r * 0.5, cy - r * 1.2); x.stroke(); }
  x.font = `${11 * s}px sans-serif`; x.fillStyle = '#555'; x.fillText(c.s, 6 * s, h - 6 * s);
  x.restore();
}

/* ==================== DAMAS (8×8, captura obrigatoria, damas voadoras) ==================== */
function mgDamas() {
  const B = []; for (let r = 0; r < 8; r++) { B.push([]); for (let c = 0; c < 8; c++) B[r].push((r + c) % 2 && r < 3 ? 'b' : (r + c) % 2 && r > 4 ? 'w' : null); }
  const S = { B, turn: 'w', sel: null, chain: null };
  const own = (p, t) => p && p.toLowerCase() === t, king = p => p === 'W' || p === 'B', dirF = t => t === 'w' ? -1 : 1;
  const movesOf = (B, r, c, onlyCap) => {
    const p = B[r][c], t = p.toLowerCase(), out = [], caps = [];
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      if (king(p)) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !B[rr][cc]) { out.push([rr, cc, null]); rr += dr; cc += dc; }
        if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && B[rr][cc] && !own(B[rr][cc], t)) { let r2 = rr + dr, c2 = cc + dc; while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && !B[r2][c2]) { caps.push([r2, c2, [rr, cc]]); r2 += dr; c2 += dc; } } }
      else { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        if (!B[rr][cc] && dr === dirF(t)) out.push([rr, cc, null]);
        else if (B[rr][cc] && !own(B[rr][cc], t) && dr === dirF(t)) { const r2 = rr + dr, c2 = cc + dc; if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && !B[r2][c2]) caps.push([r2, c2, [rr, cc]]); } }
    }
    return caps.length || onlyCap ? caps : out;
  };
  const allMoves = (B, t) => { const L = [], C = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (own(B[r][c], t)) { const m = movesOf(B, r, c); for (const x of m) (x[2] ? C : L).push([r, c, ...x]); } return C.length ? C : L; };
  const apply = (B, m) => { const [r, c, r2, c2, cap] = m, p = B[r][c]; B[r][c] = null; if (cap) B[cap[0]][cap[1]] = null; B[r2][c2] = (r2 === 0 && p === 'w') ? 'W' : (r2 === 7 && p === 'b') ? 'B' : p; return !!cap; };
  const score = B => { let s = 0; for (const row of B) for (const p of row) if (p) s += (p === 'b' ? 1 : p === 'B' ? 3 : p === 'w' ? -1 : -3); return s; };
  const aiTurn = () => {
    let ms = allMoves(S.B, 'b'); if (!ms.length) return mgEnd(true);
    let best = null, bv = -1e9;
    for (const m of ms) { const B2 = S.B.map(r => r.slice()); let cur = m, cont = apply(B2, cur); let pos = [m[2], m[3]];
      while (cont) { const more = movesOf(B2, pos[0], pos[1], true); if (!more.length) break; const n = more[0]; apply(B2, [pos[0], pos[1], ...n]); pos = [n[0], n[1]]; }
      const rep = allMoves(B2, 'w'); let worst = 1e9; for (const r of rep.length ? rep : [null]) { if (!r) { worst = 100; break; } const B3 = B2.map(q => q.slice()); apply(B3, r); worst = Math.min(worst, score(B3)); }
      const v = worst + Math.random() * 0.3; if (v > bv) { bv = v; best = m; } }
    let pos = [best[2], best[3]], cont = apply(S.B, best);
    const chainStep = () => { const more = cont ? movesOf(S.B, pos[0], pos[1], true) : []; if (more.length) { const n = more[0]; cont = apply(S.B, [pos[0], pos[1], ...n]); pos = [n[0], n[1]]; mgLater(chainStep, 400); return; }
      S.turn = 'w'; if (!allMoves(S.B, 'w').length) return mgEnd(false); mgMsg('Tócache (brancas).'); };
    chainStep();
  };
  mgMsg('Brancas. Toca unha peza e despois o destino.');
  const sq = 64, ox = (760 - 8 * sq) / 2, oy = (560 - 8 * sq) / 2;
  return {
    draw(x) {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.fillStyle = (r + c) % 2 ? '#6b4a2c' : '#e8d8b0'; x.fillRect(ox + c * sq, oy + r * sq, sq, sq); const p = S.B[r][c]; if (!p) continue;
        x.fillStyle = p.toLowerCase() === 'w' ? '#f4f0e6' : '#1d1d1f'; x.beginPath(); x.arc(ox + c * sq + sq / 2, oy + r * sq + sq / 2, sq * 0.38, 0, 7); x.fill(); x.strokeStyle = '#888'; x.lineWidth = 2; x.stroke();
        if (king(p)) { x.fillStyle = '#d4a017'; x.font = 'bold 26px sans-serif'; x.fillText('♛', ox + c * sq + sq / 2 - 12, oy + r * sq + sq / 2 + 9); } }
      if (S.sel) { x.strokeStyle = '#f2c21b'; x.lineWidth = 4; x.strokeRect(ox + S.sel[1] * sq + 2, oy + S.sel[0] * sq + 2, sq - 4, sq - 4);
        const legal = allMoves(S.B, 'w').filter(m => m[0] === S.sel[0] && m[1] === S.sel[1]); x.fillStyle = 'rgba(242,194,27,.5)'; for (const m of legal) { x.beginPath(); x.arc(ox + m[3] * sq + sq / 2, oy + m[2] * sq + sq / 2, 10, 0, 7); x.fill(); } }
    },
    click(mx, my) {
      if (this.over || S.turn !== 'w') return; const c = Math.floor((mx - ox) / sq), r = Math.floor((my - oy) / sq); if (r < 0 || r > 7 || c < 0 || c > 7) return;
      const legal = (S.chain ? movesOf(S.B, S.chain[0], S.chain[1], true).map(m => [S.chain[0], S.chain[1], ...m]) : allMoves(S.B, 'w'));
      if (S.sel) { const m = legal.find(q => q[0] === S.sel[0] && q[1] === S.sel[1] && q[2] === r && q[3] === c);
        if (m) { const cap = apply(S.B, m); if (cap && movesOf(S.B, r, c, true).length) { S.chain = [r, c]; S.sel = [r, c]; mgMsg('Segue comendo!'); return; }
          S.sel = null; S.chain = null; S.turn = 'b'; mgMsg('Pensa o Tío David...'); mgLater(aiTurn); return; } }
      if (!S.chain && own(S.B[r][c], 'w')) { if (legal.some(q => q[0] === r && q[1] === c)) S.sel = [r, c]; else mgMsg(legal.some(q => q[4]) ? 'Hai que comer! Outra peza pode.' : 'Esa peza non se pode mover.'); }
    },
  };
}

/* ==================== XADREZ (sen enroque nin captura ao paso; coroa en raíña) ==================== */
function mgXadrez() {
  const init = ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR'];
  const S = { B: init.map(r => r.split('').map(ch => ch === '.' ? null : ch)), turn: 'w', sel: null };
  const isW = p => p && p === p.toUpperCase(), side = p => p ? (isW(p) ? 'w' : 'b') : null;
  const V = { p: 100, n: 310, b: 320, r: 500, q: 900, k: 0 };
  const pseudo = (B, t) => {
    const M = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = B[r][c]; if (!p || side(p) !== t) continue; const k = p.toLowerCase();
      const add = (r2, c2) => { if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) return false; const q = B[r2][c2]; if (q && side(q) === t) return false; M.push([r, c, r2, c2]); return !q; };
      if (k === 'p') { const d = t === 'w' ? -1 : 1, st = t === 'w' ? 6 : 1; if (!B[r + d] || r + d < 0 || r + d > 7) continue; if (!B[r + d][c]) { M.push([r, c, r + d, c]); if (r === st && !B[r + 2 * d][c]) M.push([r, c, r + 2 * d, c]); } for (const dc of [-1, 1]) { const q = B[r + d][c + dc]; if (q && side(q) !== t) M.push([r, c, r + d, c + dc]); } }
      else if (k === 'n') for (const [a, b] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) add(r + a, c + b);
      else if (k === 'k') for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) { if (a || b) add(r + a, c + b); }
      else { const dirs = k === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : k === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [a, b] of dirs) { let r2 = r + a, c2 = c + b; while (add(r2, c2)) { r2 += a; c2 += b; } } }
    }
    return M;
  };
  const mv = (B, m) => { const B2 = B.map(r => r.slice()); let p = B2[m[0]][m[1]]; B2[m[0]][m[1]] = null; if (p === 'P' && m[2] === 0) p = 'Q'; if (p === 'p' && m[2] === 7) p = 'q'; B2[m[2]][m[3]] = p; return B2; };
  const inCheck = (B, t) => { let kr = -1, kc = -1; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (B[r][c] === (t === 'w' ? 'K' : 'k')) { kr = r; kc = c; } return pseudo(B, t === 'w' ? 'b' : 'w').some(m => m[2] === kr && m[3] === kc); };
  const legal = (B, t) => pseudo(B, t).filter(m => !inCheck(mv(B, m), t));
  const evalB = B => { let s = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = B[r][c]; if (!p) continue; const v = V[p.toLowerCase()] + (p.toLowerCase() === 'p' ? (isW(p) ? (6 - r) : (r - 1)) * 8 : 0) + (3.5 - Math.abs(3.5 - c)) * 3 + (3.5 - Math.abs(3.5 - r)) * 3; s += isW(p) ? -v : v; } return s; };
  const search = (B, t, d, a, b) => { // negamax dende o punto de vista das negras
    if (!d) return evalB(B);
    const ms = legal(B, t); if (!ms.length) return inCheck(B, t) ? (t === 'b' ? -1e6 - d : 1e6 + d) : 0;
    if (t === 'b') { let v = -1e9; for (const m of ms) { v = Math.max(v, search(mv(B, m), 'w', d - 1, a, b)); a = Math.max(a, v); if (a >= b) break; } return v; }
    let v = 1e9; for (const m of ms) { v = Math.min(v, search(mv(B, m), 'b', d - 1, a, b)); b = Math.min(b, v); if (a >= b) break; } return v;
  };
  const glyph = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  const aiTurn = () => {
    const ms = legal(S.B, 'b'); if (!ms.length) return mgEnd(inCheck(S.B, 'b'), !inCheck(S.B, 'b'));
    const caps = m => S.B[m[2]][m[3]] ? 1 : 0; ms.sort((u, v) => caps(v) - caps(u));
    let best = ms[0], bv = -1e9; for (const m of ms) { const v = search(mv(S.B, m), 'w', 2, -1e9, 1e9) + Math.random() * 6; if (v > bv) { bv = v; best = m; } }
    S.B = mv(S.B, best); S.last = best; S.turn = 'w';
    const my = legal(S.B, 'w'); if (!my.length) return mgEnd(false, !inCheck(S.B, 'w'));
    mgMsg(inCheck(S.B, 'w') ? 'Xaque! Tócache.' : 'Tócache (brancas).');
  };
  mgMsg('Brancas. Toca unha peza e despois o destino.');
  const sq = 64, ox = (760 - 8 * sq) / 2, oy = (560 - 8 * sq) / 2;
  return {
    draw(x) {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.fillStyle = (r + c) % 2 ? '#7a5a3a' : '#ead8b2'; x.fillRect(ox + c * sq, oy + r * sq, sq, sq);
        if (S.last && ((S.last[0] === r && S.last[1] === c) || (S.last[2] === r && S.last[3] === c))) { x.fillStyle = 'rgba(242,194,27,.3)'; x.fillRect(ox + c * sq, oy + r * sq, sq, sq); }
        const p = S.B[r][c]; if (p) { x.font = '48px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = isW(p) ? '#fbf8f0' : '#151515'; x.strokeStyle = isW(p) ? '#222' : '#ddd'; x.lineWidth = 1; const g = glyph[p.toLowerCase()]; x.fillText(g, ox + c * sq + sq / 2, oy + r * sq + sq / 2 + 3); x.strokeText(g, ox + c * sq + sq / 2, oy + r * sq + sq / 2 + 3); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; } }
      if (S.sel) { x.strokeStyle = '#f2c21b'; x.lineWidth = 4; x.strokeRect(ox + S.sel[1] * sq + 2, oy + S.sel[0] * sq + 2, sq - 4, sq - 4); x.fillStyle = 'rgba(242,194,27,.55)'; for (const m of legal(S.B, 'w').filter(m => m[0] === S.sel[0] && m[1] === S.sel[1])) { x.beginPath(); x.arc(ox + m[3] * sq + sq / 2, oy + m[2] * sq + sq / 2, 10, 0, 7); x.fill(); } }
    },
    click(mx, my) {
      if (this.over || S.turn !== 'w') return; const c = Math.floor((mx - ox) / sq), r = Math.floor((my - oy) / sq); if (r < 0 || r > 7 || c < 0 || c > 7) return;
      if (S.sel) { const m = legal(S.B, 'w').find(q => q[0] === S.sel[0] && q[1] === S.sel[1] && q[2] === r && q[3] === c);
        if (m) { S.B = mv(S.B, m); S.last = m; S.sel = null; S.turn = 'b'; if (!legal(S.B, 'b').length) return mgEnd(inCheck(S.B, 'b'), !inCheck(S.B, 'b')); mgMsg('Pensa o Tío David...'); mgLater(aiTurn, 300); return; } }
      if (side(S.B[r][c]) === 'w') S.sel = [r, c]; else S.sel = null;
    },
  };
}

/* ==================== o Tío David en persoa (sprite pixel art achegado polo autor) ==================== */
if (typeof PORTRAIT_IMG !== 'undefined') PORTRAIT_IMG['Tío David'] = 'img/david-face.png';
// fotogramas do atlas img/david.png (4×3): 0 fronte, 1 perfil dereito, 2 costas, 3 perfil esquerdo, 4-7 camiñar, 8 sinalar, 9 man aberta, 10 brazos cruzados, 11 sentado no banco
const DAVID = { tex: null, sp: null, t: 0, s: 0, dir: 1, wait: 0, frame: -1, flip: false };
function davidFrame(f, flip) {
  if (DAVID.frame === f && DAVID.flip === flip) return; DAVID.frame = f; DAVID.flip = flip;
  const t = DAVID.sp.material.map, c = f % 4, r = Math.floor(f / 4);
  t.repeat.set(flip ? -0.25 : 0.25, 1 / 3); t.offset.set(flip ? (c + 1) / 4 : c / 4, 1 - (r + 1) / 3);
}
function updateDavid(dt) {
  const Fr = G.fraternal; if (!Fr || !Fr.door || !LM.arenal) return;
  if (!DAVID.sp) {
    const tex = new THREE.TextureLoader().load('img/david.png'); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipMapLinearFilter; tex.encoding = THREE.sRGBEncoding;
    // cartel vertical que sempre mira á cámara (só xira en vertical)
    const pg = new THREE.PlaneGeometry(1.6, 1.84); pg.translate(0, 0.92, 0);
    const sp = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); sp.castShadow = true; G.scene.add(sp); DAVID.sp = sp;
    const [ax, az] = LM.arenal.pt(0, 0), [bx, bz] = LM.arenal.pt(1, 0); DAVID.ux = bx - ax; DAVID.uz = bz - az; // ao longo da fachada
    const [sx, sz] = LM.arenal.pt(28.3, 0); const l = Math.hypot(sx - Fr.door.x, sz - Fr.door.z) || 1; DAVID.fx = (sx - Fr.door.x) / l; DAVID.fz = (sz - Fr.door.z) / l; // cara á rúa
    davidFrame(0, false);
  }
  const me = G.player.ped, h = G.hour, D = DAVID; D.t += dt;
  if (!(h >= 20 && h < 23.5)) { D.sp.visible = false; return; } D.sp.visible = true; // de día está dentro da Fraternal; á noitiña sae ao banco
  let x, z, face, moving = false;
  const near = !G.player.car && Math.hypot(me.x - Fr.door.x, me.z - Fr.door.z) < 7;
  const sitting = h >= 20 && h < 23.5 && !near && !(G.dialog && $('dlgName').textContent === 'Tío David');
  if (sitting) { x = Fr.door.x + D.ux * 2.4 + D.fx * 0.4; z = Fr.door.z + D.uz * 2.4 + D.fz * 0.4; face = Math.atan2(D.fx, D.fz); }
  else if (near || G.minigame) { x = Fr.door.x + D.ux * D.s; z = Fr.door.z + D.uz * D.s; face = Math.atan2(me.x - x, me.z - z); }
  else {
    if (D.wait > 0) D.wait -= dt; else { D.s += D.dir * 1.0 * dt; moving = true; if (Math.abs(D.s) > 3) { D.s = Math.sign(D.s) * 3; D.dir = -D.dir; D.wait = 2 + Math.random() * 2; } }
    x = Fr.door.x + D.ux * D.s; z = Fr.door.z + D.uz * D.s; face = moving ? Math.atan2(D.ux * D.dir, D.uz * D.dir) : Math.atan2(D.fx, D.fz);
  }
  const y = groundH(x, z); D.sp.position.set(x, y + (moving ? Math.abs(Math.sin(D.t * 6)) * 0.03 : 0), z);
  D.sp.material.color.setScalar(1 - 0.55 * (G.night || 0)); D.sp.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z);
  if (sitting) { davidFrame(11, false); return; }
  // vista segundo onde estea a cámara respecto de cara onde mira
  const cp = camera.position, dx = cp.x - x, dz = cp.z - z, lx = dx * Math.cos(face) - dz * Math.sin(face), lz = dx * Math.sin(face) + dz * Math.cos(face);
  const view = Math.abs(lz) >= Math.abs(lx) ? (lz > 0 ? 'front' : 'back') : (lx > 0 ? 'left' : 'right');
  if (moving && (view === 'left' || view === 'right')) { davidFrame(4 + Math.floor(D.t * 7) % 4, view === 'left'); return; }
  if (view === 'back') return davidFrame(2, false);
  if (view !== 'front') return davidFrame(view === 'left' ? 3 : 1, false);
  const talking = G.dialog && $('dlgName').textContent === 'Tío David';
  if (talking) return davidFrame(Math.floor(D.t / 0.9) % 2 ? 8 : 9, false);
  davidFrame(near ? 10 : 0, false);
}
/* no taboleiro: o Tío David ao carón, con xestos */
function mgDavid(f) { const el = MG.el && MG.el.querySelector('.mg-david'); if (el) el.style.backgroundPosition = `${(f % 4) * 100 / 3}% ${Math.floor(f / 4) * 50}%`; }
