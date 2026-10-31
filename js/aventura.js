'use strict';
/* ==========================================================
   GTA LEMOS 27400 · «A carteira do viño do peleón»
   Aventura gráfica do modo historia de Avelino Villar:
   obxectivos encadeados, inventario, indicador de destino
   e suxestión de viaxe rápida.
   ========================================================== */
const ITEMS = {
  moedas: { n: 'Cinco euros soltos', i: '🪙', d: 'O único que quedou no peto despois da cea. Dan para pouco... ou para un puro.' },
  puro: { n: 'Puro do bo', i: '🚬', d: 'Dos gordos, dos que fuma o Spasic. Os outros «saben a cartón».' },
  tesoiras: { n: 'Tesoiras douradas', i: '✂️', d: 'As tesoiras douradas de inaugurar do alcalde. Sen elas, The Mayor non é ninguén.' },
  autografo: { n: 'Autógrafo de The Mayor', i: '✍️', d: 'Rúbrica de tres voltas e un floreo. Para Damián Selfies e as súas historias.' },
  bocata: { n: 'Bocata de tortilla', i: '🥪', d: 'Tortilla CON cebola. Gañado fregando pratos no Hostal River.' },
  carteira: { n: 'Carteira (baleira)', i: '👛', d: 'A túa carteira! Recuperada... e baleira. Cheira a can.' },
  dni: { n: 'DNI de Avelino', i: '🪪', d: 'Avelino Villar, de Cee. Na foto sae peor ca na realidade.' },
  decimoA: { n: 'Medio décimo', i: '🎫', d: 'Medio décimo de lotaría. A outra metade gañouna Currito ao «Olín sin verlas».' },
  decimo: { n: 'Décimo enteiro', i: '🎟️', d: 'O décimo enteiro! Igual está premiado...' },
  botella: { n: 'Botella de viño do peleón', i: '🍷', d: 'A última botella do peleón da cea UCL. Alguén na cidade a vai querer.' },
  billete: { n: 'Billete a Cee', i: '🚆', d: 'Rexional Monforte → Santiago e bus a Cee. Volta á casa!' },
};
const npcPos = id => () => { const n = NPCS.find(q => q.id === id); return n ? { x: n.p.x, z: n.p.z } : null; };
const ptPos = id => () => { const p = G.story && G.story.points && G.story.points.find(q => q.id === id); return p ? { x: p.x, z: p.z } : null; };
const STEPS = {
  ivan: { t: 'Pregúntalle a Iván Nogal se apareceu a túa carteira', w: 'Estación de Monforte', tgt: npcPos('ivan'), next: 'damian' },
  damian: { t: 'Busca a Damián Selfies, que te fotografou onte', w: 'Colexio Ferroviario (Rúa da Coruña)', tgt: npcPos('damian'), next: 'mayor' },
  mayor: { t: 'Consegue un autógrafo de The Mayor para Damián', w: 'Parque dos Condes, diante de Los Roncolas', tgt: npcPos('mayor'), next: 'spasic' },
  spasic: { t: 'Pregúntalle ao Spasic polas tesoiras douradas do Mayor', w: 'Parque dos Condes (vai en bici arredor da fonte)', tgt: npcPos('spasic'), next: 'puro' },
  puro: { t: 'Merca un puro do bo para o Spasic', w: 'Estanco da Praza Dr. Goyanes ou Gasolineira Lemos', tgt: ptPos('gas'), next: 'spasic2' },
  spasic2: { t: 'Cámbialle o puro ao Spasic polas tesoiras', w: 'Parque dos Condes', tgt: npcPos('spasic'), next: 'mayor2' },
  mayor2: { t: 'Devólvelle as tesoiras douradas a The Mayor', w: 'Parque dos Condes', tgt: npcPos('mayor'), next: 'damian2' },
  damian2: { t: 'Leva o autógrafo a Damián Selfies', w: 'Colexio Ferroviario (Rúa da Coruña)', tgt: npcPos('damian'), next: 'sajoni' },
  sajoni: { t: 'Fala co Sajoni: o seu can Chispa levou a túa carteira!', w: 'Rúa Calvo Sotelo, ao final da Rúa Zapardiel', tgt: npcPos('sajoni'), next: 'bocata' },
  bocata: { t: 'Consegue un bocata: pide traballo no Hostal River', w: 'Praza da Estación', tgt: ptPos('river'), next: 'chispa' },
  chispa: { t: 'Dálle o bocata a Chispa (fala co Sajoni)', w: 'Rúa Calvo Sotelo', tgt: npcPos('sajoni'), next: 'currito' },
  currito: { t: 'Recupera a outra metade do décimo: Currito el Mago', w: 'Pista de volei praia (Parque dos Condes)', tgt: npcPos('currito'), next: 'loto' },
  loto: { t: 'Cobra o décimo premiado en Loterías', w: 'Rúa de Concepción Arenal, 48', tgt: ptPos('loto'), next: 'pancho' },
  pancho: { t: 'Faltan cartos: Pancho Camisolas busca unha camiseta', w: 'Praza da Compañía', tgt: () => (G.quest.state === 'go' ? npcPos('emre')() : npcPos('pacho')()), next: 'pagar' },
  pagar: { t: 'Paga a débeda no UCELERS (150 €)', w: 'Rúa de Chantada, 48', tgt: ptPos('pay'), next: 'mayor3' },
  mayor3: { t: 'Véndelle a botella de viño do peleón a The Mayor', w: 'Parque dos Condes', tgt: npcPos('mayor'), next: 'billete' },
  billete: { t: 'Merca o billete a Cee a Iván Nogal (45 €)', w: 'Estación de Monforte', tgt: npcPos('ivan'), next: 'tren' },
  tren: { t: 'Colle o tren de volta a Cee na vía 1', w: 'Estación de Monforte', tgt: ptPos('train'), next: null },
};

/* ---------- utilidades ---------- */
const has = k => G.story && G.story.inv.includes(k);
function give(k) { const S = G.story; if (!has(k)) S.inv.push(k); toast(`Conseguiches: ${ITEMS[k].i} ${ITEMS[k].n}`, 3.2); G.sfx.coin && G.sfx.coin(); }
function take(k) { const S = G.story; S.inv = S.inv.filter(q => q !== k); }
function money(d) { G.player.money += d; $('money').textContent = G.player.money + ' €'; if (d > 0 && G.sfx.coin) G.sfx.coin(); }
const SP = (w, t, e) => ({ who: w, text: t, ...e });
const A = (t, e) => SP('Avelino', t, e), I = (t, e) => SP('Iván Nogal', t, e), D = (t, e) => SP('Damián Selfies', t, e), M = (t, e) => SP('The Mayor', t, e),
  SS = (t, e) => SP('El Spasic', t, e), SJ = (t, e) => SP('El Sajoni', t, e), CU = (t, e) => SP('Currito el Mago', t, e), CA = (t, e) => SP('Camareiro do UCELERS', t, e),
  GA = (t, e) => SP('Dependenta da Gasolineira', t, e), LO = (t, e) => SP('Lotera', t, e), HR = (t, e) => SP('Dono do Hostal River', t, e);

/* ---------- destinos extra de viaxe rápida ---------- */
function addExtraDests() {
  if (FT_DESTS.some(d => d.n === 'Restaurante UCELERS')) return;
  const add = (n, d, p) => p && FT_DESTS.push({ n, d, x: p.x, z: p.z, yaw: 0 });
  if (G.ucelersDoor) { const F = LM.ucelers; const [x, z] = F.pt(UCEL.s, -UCEL.hw + 2); add('Restaurante UCELERS', 'Pulpería na Rúa de Chantada, 48', { x, z }); }
  if (LM.cons) { const [x, z] = LM.cons.pt(-3, -22); add('Conservatorio Mestre Ibáñez', 'Auditorio municipal, fronte ao CEIP', { x, z }); }
  if (LM.sajoni) { const [x, z] = LM.sajoni.pt(0, 4); add('Rúa Calvo Sotelo', 'O recuncho do Sajoni', { x, z }); }
  if (LM.ferro) { const [x, z] = LM.ferro.pt(-7, -11); add('Colexio Ferroviario', 'Rúa da Coruña', { x, z }); }
  if (LM.gas) { const [x, z] = LM.gas.pt(0, -3); add('Gasolineira Lemos', 'Rúa do Doutor Casares', { x, z }); }
  if (LM.arenal) { const [x, z] = LM.arenal.pt(42, -2); add('Rúa de Concepción Arenal', 'Loterías, Café Bar Lemos e A Fraternal', { x, z }); }
  if (LM.fluvial) { const [x, z] = LM.fluvial.pt(-46, -6); add('Club Fluvial', 'Piscinas e pistas', { x, z }); }
  if (LM.concello) { const [x, z] = LM.concello.pt(25.8, 36); add('Casa do Concello', 'Praza do Campo de San Antonio', { x, z }); }
  if (LM.carude) { const [x, z] = LM.carude.pt(0, 16); add('Carud\'e Rock', 'Festival na Praza de Carude', { x, z }); }
  if (typeof MED !== 'undefined') add('Feira Medieval', 'Praza de España e rúas de San Vicente', { x: MED.plaza[0] - 8, z: MED.plaza[1] + 6 });
  add('Rúa dos Abeledos', 'A zona catastrófica', { x: -372, z: 99 });
  add('Rúa de Rosalía de Castro', 'As vacas da estación', { x: 741, z: -650 });
}

/* ---------- inicio e pasos ---------- */
function advInit() {
  const S = G.story; S.inv = []; S.step = null;
  addExtraDests();
  if (LM.gas) { const [x, z] = LM.gas.pt(0, 4.6); S.points.push({ id: 'gas', x, z }); }
  if (LM.goy1) { const [x, z] = LM.goy1.pt(2.2, -5.4 + 1.2); S.points.push({ id: 'estanco', x, z }); }
  if (LM.arenal) { const [x, z] = LM.arenal.pt(42, -(ARENAL.fl - 1.0)); S.points.push({ id: 'loto', x, z }); }
  if (G.plazaHotels) { const h = G.plazaHotels[0]; S.points.push({ id: 'river', x: h.x, z: h.z }); }
  // tarxeta de novo obxectivo
  const st = document.createElement('style');
  st.textContent = `#advCard{position:absolute;left:50%;top:max(64px,env(safe-area-inset-top,0px));transform:translate(-50%,-10px);opacity:0;transition:opacity .35s,transform .35s;background:linear-gradient(180deg,#15191df4,#15191de0);border:2px solid #f2a33a;border-radius:8px;padding:10px 18px 12px;min-width:min(460px,86vw);max-width:min(560px,92vw);font-family:Barlow,sans-serif;color:#efe8d6;pointer-events:none;text-align:center;z-index:30}
#advCard.show{opacity:1;transform:translate(-50%,0)}#advCard .k{font-family:"Big Shoulders Display",sans-serif;letter-spacing:.14em;color:#f2a33a;font-size:15px}#advCard .t{font-family:"Big Shoulders Display",sans-serif;font-size:26px;line-height:1.05;margin:2px 0 6px;color:#fff}
#advCard .r{font-size:15px;opacity:.95}#advCard .ft{margin-top:5px;font-size:14px;color:#8fd0ff}#advCard kbd{background:#2a2f35;border-radius:3px;padding:0 5px;color:#fff}
#storyHud .obj{color:#fff;font-weight:600;max-width:260px;margin-left:auto;margin-top:2px}#storyHud .where{color:#8fd0ff;font-size:13px}#storyHud .inv{margin-top:5px;font-size:20px;letter-spacing:2px}#storyHud .inv span{display:inline-block;filter:drop-shadow(0 1px 1px #000)}`;
  document.head.appendChild(st);
  const c = document.createElement('div'); c.id = 'advCard'; $('hud').appendChild(c);
}
function advStart() { G.story.inv.push('moedas'); setStep('ivan'); }
function setStep(id) {
  const S = G.story; S.step = id; S.wpT = 0;
  if (!id) return;
  if (id === 'pancho' && G.quest.state === 'done') return setStep(STEPS.pancho.next);
  const st = STEPS[id], tg = st.tgt(), me = G.player.car || G.player.ped;
  if (tg) setWaypoint(tg.x, tg.z);
  let ft = '';
  if (tg) {
    const dist = Math.hypot(tg.x - me.x, tg.z - me.z);
    let best = null, bd = 1e9; for (const d of FT_DESTS) { const k = Math.hypot(d.x - tg.x, d.z - tg.z); if (k < bd) { bd = k; best = d; } }
    if (dist > 160 && best && bd < dist * 0.6) ft = `<div class="ft">⚡ Viaxe rápida suxerida: «${best.n}» · preme <kbd>${isTouch ? 'VIAXE RÁPIDA' : 'Y'}</kbd> e chama ao Pellas</div>`;
    S.ftHint = best ? best.n : null;
  }
  const c = $('advCard');
  c.innerHTML = `<div class="k">NOVO OBXECTIVO</div><div class="t">${st.t}</div><div class="r">📍 ${st.w}${tg ? ` · ${Math.round(Math.hypot(tg.x - me.x, tg.z - me.z) / 0.65)} m` : ''}</div>${ft}`;
  c.classList.add('show'); clearTimeout(S.cardT); S.cardT = setTimeout(() => c.classList.remove('show'), 8500);
  if (G.sfx.checkpoint) G.sfx.checkpoint();
}
function nextStep() { const S = G.story, n = STEPS[S.step] && STEPS[S.step].next; setStep(n); }
function advUpdate(dt) {
  const S = G.story; if (!S || !S.step) return;
  // o waypoint segue aos NPC que se moven
  S.wpT -= dt; if (S.wpT <= 0) { S.wpT = 1; const tg = STEPS[S.step].tgt(); if (tg && !G.cine) setWaypoint(tg.x, tg.z); }
  if (S.step === 'pancho' && G.quest.state === 'done') nextStep();
}
function advHudHtml(clock, night) {
  const S = G.story, st = S.step && STEPS[S.step], me = G.player.car || G.player.ped, tg = st && st.tgt();
  const inv = S.inv.map(k => `<span title="${ITEMS[k].n}">${ITEMS[k].i}</span>`).join(' ');
  return `<b>DÍA ${S.day} · ${clock}</b>` +
    (st ? `<div class="obj">${st.t}</div><div class="where">📍 ${st.w}${tg ? ' · ' + Math.round(Math.hypot(tg.x - me.x, tg.z - me.z) / 0.65) + ' m' : ''}</div>` : '') +
    `<span class="${S.debt > 0 ? '' : 'ok'}">Débeda UCELERS: ${S.debt > 0 ? S.debt + ' €' : 'pagada ✓'}</span>` +
    (S.cold ? '<br><span class="cold">Tiritando: noite ao raso (non podes correr)</span>' : '') +
    (night ? '<br><span class="warn">De noite: busca onde durmir!</span>' : '') +
    (inv ? `<div class="inv">${inv}</div>` : '');
}

/* ---------- conversas da aventura (substitúen as normais cando toca) ---------- */
function advTalk(n) {
  const S = G.story; if (!S || !S.step || S.phase !== 'play') return false;
  const id = n.id, step = S.step;
  if (id === 'ivan') {
    if (step === 'ivan') { openDialog([
      A('Eh You! Boas... Iván, non? Perdín a carteira. Ou ma perdeu ela a min, aínda non o teño claro.'),
      I('Avelino Villar! Recordo perfectamente. Onte baixaches do rexional cantando o himno da Champions... en galego... coa letra inventada.'),
      A('Iso explica a dor de gorxa. E a carteira?'),
      I('Na caixa de obxectos perdidos só hai un paraugas, unha dentadura e un furón disecado. Ningún é teu, espero.'),
      I('Pero onte Damián Selfies estivo facéndose fotos contigo na praza. Ese rapaz fotografa ata as farolas. Se alguén viu algo, foi a súa cámara.'),
      A('Un testemuño gráfico! Por fin unha pista que non cheira a viño do peleón.'),
      () => nextStep()]); return true; }
    if (step === 'billete') {
      if (G.player.money < 45) { openDialog([I(`O billete a Cee son 45 euros, incluído o bus dende Santiago. Tes ${G.player.money}. Podo venderche medio billete, pero só chegarías a Ordes.`)]); return true; }
      openDialog([
        A('Iván, véndeme un billete a Cee. Só de ida, que a volta xa a farei cando cure o fígado.'),
        I('Monforte → Santiago → Cee. Corenta e cinco euros, señor. Hai un regional saíndo en nada pola vía 1.'),
        () => { money(-45); give('billete'); },
        I('E Avelino... o de cantar no tren, mellor en voz baixa. Ou en castelán, polo menos rima algo.'),
        () => nextStep()]); return true;
    }
    // pistas cando non é o seu paso
    const st = STEPS[step];
    openDialog([I(`Se te perdes, Avelino, que non é a primeira vez: ${st.t.charAt(0).toLowerCase() + st.t.slice(1)}. Mira en: ${st.w}.`), I(S.ftHint ? `E se tes présa, o Pellas lévate en patinete ata «${S.ftHint}». Preme Y. Non lle preguntes polo carné.` : 'Ánimo, que Monforte é pequeno e as pistas grandes.')]);
    return true;
  }
  if (id === 'damian') {
    if (step === 'damian') { openDialog([
      D('Agarda, agarda... sorrí... PERFECTA! Ah, es ti! O de onte! O do himno da Champions!'),
      A('Iso dixéronmo. Iván di que tes fotos de onte. Perdín a carteira e preciso ver o que pasou.'),
      D('Teño unha foto onde se ve algo moi... interesante. Pero isto é un negocio, colega. Nada é gratis nas redes.'),
      D('Consígueme un autógrafo de The Mayor para as miñas historias. Ese home non se deixa achegar: ten máis fotógrafos ca un Balón de Ouro.'),
      A('Un autógrafo do alcalde a cambio dunha foto. Estou a vivir un capítulo de Monkey Island, pero con polbo.'),
      () => nextStep()]); return true; }
    if (step === 'damian2' && has('autografo')) { openDialog([
      A('Aquí tes: «Para Damián, con cariño, o mellor alcalde da historia de Monforte». Escribiuno el, claro.'),
      D('Isto é ouro! Ou polo menos cinco mil likes. Trato é trato: mira esta foto de onte ás once e media.'),
      D('Ti saes na fonte da praza cantando cara a lúa. E ao fondo, ves ese can marrón coa túa carteira na boca? É Chispa, o can do Sajoni!'),
      A('Roubado por un can. A miña nai vai estar orgullosa: o meu primeiro roubo e foi un cuadrúpede.'),
      D('O Sajoni anda sempre en Calvo Sotelo, ao final da Rúa Zapardiel. Segue a música: non ten perda, óese dende Lugo.'),
      () => { take('autografo'); nextStep(); }]); return true; }
    return false;
  }
  if (id === 'mayor') {
    if (step === 'mayor') { openDialog([
      A('Eh You! Señor alcalde! Un autógrafo, por favor. Non é para min, é para un influencer. Ben... para un rapaz con móbil.'),
      M('Autógrafos? AUTÓGRAFOS? Vaia, vaia! Alguén atopou o botón de «Modo Fan». Lamento informarlle de que, sen as miñas tesoiras douradas, este alcalde non asina nin a lista da compra.'),
      M('Sen elas non podo inaugurar nada! E un alcalde que non inaugura é, simplemente, un señor de traxe gris esperando o autobús. Que traxedia! Que aventura de pena!'),
      SP('Señora maior', 'Ai, fillo... onte vin ao do puro da bicicleta pescando na fonte cunha cana feita cun paraugas. Algo brillante sacou.'),
      M('O Spasic! Por todos os tentáculos morados! Ese home colecciona todo o que brilla coa paixón dun concelleiro de urbanismo. Recupere as tesoiras e asínolle o que queira. Ata a factura da luz.'),
      () => nextStep()]); return true; }
    if (step === 'mayor2' && has('tesoiras')) { openDialog([
      M('AS MIÑAS TESOIRAS! Fotógrafos, fotógrafos! Flash, máis flash! Que saia na portada: «O Mayor recupera as tesoiras douradas grazas a un veciño exemplar».'),
      A('Son de Cee.'),
      M('Corrixo: «...a un veciño exemplar de Cee, cidade irmá de Monforte dende hoxe mesmo, por decreto e sen pasar polo Pleno». Tome o autógrafo: rúbrica de tres voltas e un floreo. Logro desbloqueado.'),
      () => { take('tesoiras'); give('autografo'); nextStep(); }]); return true; }
    if (step === 'mayor3' && has('botella')) { openDialog([
      A('Señor alcalde, que me daría por unha botella de auténtico viño do peleón da cea UCL?'),
      M('O... o PELEÓN? Da colleita da cea UCL? Silencio! Nin unha palabra máis! Ese viño é patrimonio inmaterial deste alcalde dende que era concelleiro de festas.'),
      M('Ofrézolle cincuenta euros e unha praza co seu nome. Ben... unha placa. Ben... un pósit na porta do Concello. Se o despega o vento, ese é xa un asunto da Xunta.'),
      A('Os cincuenta chegan. O pósit gárdeo para cando sexa famoso.'),
      () => { take('botella'); money(50); nextStep(); }]); return true; }
    return false;
  }
  if (id === 'spasic') {
    if (step === 'spasic') { openDialog([
      A('Eh You, Spasic! Dixéronme que pescaches algo dourado na fonte.'),
      SS('Pescar? Eu non pesco. Eu RESCATO. A fonte é un ecosistema e esas tesoiras estaban a molestar aos peixes.'),
      A('Na fonte non hai peixes.'),
      SS('Porque as tesoiras os espantaron! Ves? Rescate. Douchas... se me traes un puro dos bos. Este xa está mascado dende o martes.'),
      SS('Na gasolineira do Doutor Casares véndenos. E que sexa dos gordos, eh, que eu non fumo palillos.'),
      () => nextStep()]); return true; }
    if (step === 'spasic2' && has('puro')) { openDialog([
      SS('Ese é un puro de verdade! Cheira a éxito e a gasóleo. Toma as tesoiras, que xa me estaban picando no peto.'),
      A('Un pracer facer negocios contigo, Spasic.'),
      SS('O pracer é meu. E se ves unha moto sen dono, xa sabes onde estou.'),
      () => { take('puro'); give('tesoiras'); nextStep(); }]); return true; }
    return false;
  }
  if (id === 'sajoni') {
    if (step === 'sajoni') { openDialog([
      SJ('EEEH! Benvido ao recuncho do Sajoni! Hoxe hai reggaeton, mañá reggaeton e o domingo... adiviña.'),
      A('Eh You! Sajoni, o teu can roubou a miña carteira. Teño probas fotográficas.'),
      SJ('Chispa? Imposible! Bueno... posible. Ten unha teima coas cousas de coiro. Leva tres zapatos meus e un balón de rugby.'),
      SJ('O que colle, enterrao. E só cava se lle dás un bocata. É o seu único vicio. Ben, ese e morder os cables do altofalante.'),
      A('Un bocata. Claro. E onde consigo eu un bocata con dous euros?'),
      SJ('No Hostal River, na praza da estación, o dono sempre busca alguén para fregar pratos. Paga en bocatas e en dores de costas.'),
      () => nextStep()]); return true; }
    if (step === 'chispa' && has('bocata')) { openDialog([
      A('Chispa, bonito... mira o que trae o tío Avelino. Tortilla con cebola. Si, CON cebola.'),
      SJ('Á cebola dálle iso. Mira, xa está a cavar! Chispa, CAVA! Iso é! Que velocidade, parece unha escavadora da Xunta.'),
      () => { take('bocata'); const d = G.sajoni && G.sajoni.dog; if (d) { const [x, z] = LM.sajoni.pt(-3, -3.6); d.tx = x; d.tz = z; d.wait = 6; } },
      SJ('Toma, colega, a túa carteira. Un pouco mordida e con terra, pero cheira a can feliz.'),
      A('Baleira... Como era de esperar. Pero está o DNI, medio décimo de lotaría... e unha nota coa miña letra:'),
      A('«A outra metade para Currito, que me gañou ao Olín sin verlas». Que? Xoguei ás cartas antes da cea? Que máis fixen onte?!'),
      SJ('Currito el Mago? Anda pola pista de volei praia do Parque dos Condes, celebrando goles que non existen. Ah, e cando non teñas onde durmir, a tumbona é túa. Ti es da familia agora.'),
      () => { give('carteira'); give('dni'); give('decimoA'); G.sajoniDanced = true; nextStep(); }]); return true; }
    return false;
  }
  if (id === 'currito') {
    if (step === 'currito') { openDialog([
      CU('SIIIUUU! Avelino! O meu rival favorito! Que tal a cabeza? Onte bebiches viño do peleón coma se fose auga bendita.'),
      A('Eh You, Currito! Tes a outra metade do meu décimo. A nota di que ma gañaches ás cartas.'),
      CU('Gañeina limpamente! Bueno, cun pouco de MAGIA. Ti tiñas un catro e dicías que era un as porque «en Cee os catros valen máis».'),
      CU('Fagamos un trato: o Sucio Omar deixoume colgado para o Lemos–Arenteiro e o torneo de volei, e preciso parella. Se me pasas a bola dez veces seguidas, a metade é túa.'),
      A('Volei praia. En outubro. Despois do peleón. Por que non.'),
      CU('Así me gusta! Ponte no teu campo, corre á sombra da bola e preme E cando baixe. Abracadabra!'),
      () => voleyStart()]); return true; }
    return false;
  }
  if (id === 'pacho' && step === 'pancho' && G.quest.state === 'none') {
    // presentación cómica antes da misión normal
    S.panchoIntro = true; return false;
  }
  return false;
}
// vitoria no volei con Currito durante a aventura
function advVolleyWin(n) {
  const S = G.story; if (!S || S.step !== 'currito') return false;
  openDialog([
    CU('DEZ PASES! Iso é química, parella! Estamos inscritos no Torneo Remember. Toma, a túa metade. Unha promesa é unha promesa... e unha aposta é sagrada.'),
    () => { take('decimoA'); give('decimo'); save.curritoWin = true; voleyEnd(); n.cel = CURRITO_CELS[0]; n.celT = 0; curritoSay(n, 'SIIIUUUU!', 3); },
    A('O décimo enteiro! Nunca pensei que me fose ilusionar tanto un papel con números.'),
    CU('Cóbrao en Loterías, na Rúa de Concepción Arenal. E se toca... RUNNER RUNNER! Ah, e o meu sofá é teu cando queiras.'),
    () => nextStep(),
  ]);
  return true;
}

/* ---------- puntos (sen NPC): gasolineira, loterías, hostal, UCELERS, tren ---------- */
function advPoint(id, act) {
  const S = G.story; if (!S || S.phase !== 'play') return act ? false : null;
  const step = S.step, K = isTouch ? '★' : 'E';
  if (id === 'estanco') {
    if (step !== 'puro') return act ? false : null;
    if (!act) return `${K} · Mercar un puro no estanco (3 €)`;
    if (G.player.money < 3) { openDialog([SP('Estanqueira', 'Tres euros o puro, cariño. Aquí fiado só ao señor alcalde, e iso porque nos arranxa a beirarrúa.')]); return true; }
    openDialog([
      A('Boas! Un puro dos gordos. É para un amigo con bici pintada e moita personalidade.'),
      SP('Estanqueira', 'O Spasic, non? Leva este, que os finos di que «son para xente sen ambición».'),
      () => { money(-3); take('moedas'); give('puro'); },
      SP('Estanqueira', 'E dille que me devolva o mechero que levou en 2019.'),
      () => nextStep()]);
    return true;
  }
  if (id === 'gas') {
    if (step !== 'puro') return act ? false : null;
    if (!act) return `${K} · Mercar un puro na gasolineira (3 €)`;
    if (G.player.money < 3) { openDialog([GA('Tres euros o puro, rei. Fiado non, que despois a xente marcha a Cee e non volve.')]); return true; }
    openDialog([
      A('Boas. Un puro, por favor. Dos gordos. É para un amigo... cunha bici pintada.'),
      GA('Para o Spasic? Xa o coñecemos. Leva este, que é dos que usa el. Os outros di que «saben a cartón».'),
      () => { money(-3); take('moedas'); give('puro'); },
      GA('E non lle digas onde o mercaches, que logo vén pedir desconto de cliente.'),
      () => nextStep()]);
    return true;
  }
  if (id === 'loto') {
    if (step !== 'loto') return act ? false : null;
    if (!act) return `${K} · Cobrar o décimo en Loterías`;
    openDialog([
      LO('Boas, que desexa? Se é para mercar, hoxe temos o 27400, que está a dar moito que falar.'),
      A('Veño cobrar. Este décimo. Ten algo de terra, un pouco de baba de can e un toque de viño do peleón.'),
      LO('A ver... DNI... correcto... dúas metades... pegámolas con celo... e o número é... PREMIADO! Cen euros!'),
      A('CEN EUROS! Isto é... isto é... PONZOÑA PURA! Grazas, Currito, onde queira que esteas!'),
      () => { take('decimo'); money(100); bigMsg('+100 €', 'Décimo premiado'); },
      LO('Moitas felicidades. E se quere un consello: non o gaste todo en viño do peleón.'),
      A('Tarde para iso, señora. Moi tarde.'),
      () => nextStep()]);
    return true;
  }
  if (id === 'river') {
    if (step !== 'bocata') return act ? false : null;
    if (!act) return `${K} · Pedir traballo no Hostal River (por un bocata)`;
    openDialog([
      A('Eh You! Boas! Disque aquí se paga en bocatas. Fago o que sexa: fregar, varrer, cantar o himno da Champions...'),
      HR('O de cantar non, por favor. Pero pratos sucios teño ata o teito. Lava oito en menos dun minuto e o bocata de tortilla é teu.'),
      HR('Arrastra o rato ou o dedo pola suciedade, ou alterna A e D. E non rompas ningún, que son da voda da miña curmá.', { choices: [
        { t: 'A fregar!', fn: () => [() => startDishes(() => { openDialog([HR('Brillan coma a calva do Spasic! Toma o teu bocata, campión. Con cebola, como a xente de ben.'), () => { give('bocata'); nextStep(); }]); }, n => { openDialog([HR(`${n} pratos... Así non chega nin para un biscoito. Volve cando queiras.`)]); })] },
        { t: 'Agora non', fn: () => [HR('Os pratos esperan. Os pratos sempre esperan.')] },
      ] })]);
    return true;
  }
  if (id === 'pay') {
    if (step !== 'pagar') { if (!act) return S.debt > 0 ? 'Restaurante Pulpería UCELERS · débeda: 150 €' : null; openDialog([CA(S.debt > 0 ? `Avelino! Aínda me debes os 150 euros do peleón. Non te preocupes, que me fío de ti... pero gardei a túa foto na caixa rexistradora.` : 'Aquí sempre es benvido, Avelino. Bueno, mentres pagues.')]); return true; }
    if (!act) return `${K} · Pagar a débeda do viño do peleón (150 €)`;
    if (G.player.money < 150) { openDialog([CA(`Tes ${G.player.money} euros? Fáltanche ${150 - G.player.money}. Pódeste poñer a fregar, pero os meus pratos son de barro e non hai minixogo que os salve.`), CA('Proba coas misións da cidade (E nos marcadores) ou fala con Pancho Camisolas, que sempre busca recadeiros.')]); return true; }
    openDialog([
      A('Aquí o tes: cento cincuenta euros. Contados. Dúas veces. Un deles con baba de can.'),
      CA('Avelino Villar paga as súas débedas! Isto vai ao mural da casa, entre a foto do polbo xigante e a do Lemos campión.'),
      () => { money(-150); S.debt = 0; },
      CA('E para que te acordes de nós... toma: unha botella do peleón da cea. A última da caixa. Non a bebas toda dunha vez.'),
      A('Tranquilo. Despois do de onte, non penso bebela nunca máis. Pero algo me di que alguén na cidade a vai querer...'),
      () => { give('botella'); nextStep(); }]);
    return true;
  }
  if (id === 'train') {
    if (step !== 'tren') return act ? false : null;
    if (!act) return `${K} · Coller o tren de volta a Cee`;
    advEnding(); return true;
  }
  return act ? false : null;
}

/* ---------- final ---------- */
function advEnding() {
  const S = G.story; S.phase = 'end';
  $('fade').classList.add('on');
  setTimeout(() => {
    $('fade').classList.remove('on');
    bigMsg('VÍA 1', 'Rexional con destino Santiago');
    const d = S.day;
    openDialog([
      CU('AVELINO! Non marches sen despedirte do teu compañeiro de volei! Toma un SIUUU de despedida: SIIIUUUU!'),
      SJ('E Chispa tróuxoche un agasallo: o teu calcetín da sorte. Non preguntes de onde o sacou.'),
      SP('Pancho Camisolas', 'Avelino, o meu cuñado está tan contento coa camiseta que xa fala de casarse outra vez coa miña irmá.'),
      D('Todos xuntos para a última! Sorrí... #DespedidaUCL #CeeMonforte #ViñoDoPeleón... PERFECTA!'),
      I('Atención: o rexional con destino Santiago sae da vía 1. E chega o de Santiago... con... un señor con mochila e cuncha?'),
      SP('Sucio Omar', 'Ai, ai, os meus pés... Abandonei o Camiño en Sarria: tres ampollas, unha do tamaño dun pemento de Padrón. Que me perdín?'),
      CU('SUCIO OMAR!!! Traidor! O Lemos–Arenteiro! O torneo! A miña vida!'),
      A('Bueno, Monforte... isto foi unha aventura. Paguei a débeda, perdín a dignidade e gañei amigos. Para a próxima cea UCL... auga. Ou viño do peleón, pero sen carteira.'),
      SP('Narrador', `E así, Avelino Villar volveu a Cee en ${d} ${d === 1 ? 'día' : 'días'}, cun billete no peto, o calcetín da sorte e a lección aprendida. Ou case.`),
      SP('Narrador', 'FIN de «A carteira do viño do peleón». Que queres facer agora?', { choices: [
        { t: 'Volver ao menú', fn: () => [() => location.reload()] },
        { t: 'Seguir paseando por Monforte', fn: () => [() => { G.story.phase = 'done'; $('storyHud').hidden = true; setWaypoint(null); }] },
      ] }),
    ]);
  }, 1200);
}

/* ---------- mochila / inventario (tecla I ou botón MOCHILA) ---------- */
function toggleInventory(force) {
  let el = $('invPanel');
  if (!el) {
    const st = document.createElement('style');
    st.textContent = `#invPanel{position:fixed;inset:0;display:grid;place-items:center;background:#0009;z-index:60;font-family:Barlow,sans-serif}
#invPanel[hidden]{display:none}#invPanel .box{width:min(560px,92vw);max-height:84vh;overflow:auto;background:#15191d;border:2px solid #f2c21b;padding:16px 18px;color:#e9e6dc;box-shadow:0 20px 60px #000a}
#invPanel h2{margin:0 0 4px;font:900 28px "Big Shoulders Display",Barlow,sans-serif;letter-spacing:.05em;color:#f2c21b}#invPanel .sub{opacity:.7;font-size:14px;margin-bottom:12px}
#invPanel .it{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid #ffffff1a}#invPanel .ic{font-size:30px;line-height:1;width:40px;text-align:center}#invPanel .it b{display:block;font-size:17px}#invPanel .it span{font-size:14px;opacity:.8}
#invPanel .empty{opacity:.7;padding:12px 0}#invPanel .cl{margin-top:12px;appearance:none;border:0;background:#f2c21b;color:#15191d;font:800 15px Barlow,sans-serif;padding:8px 14px;cursor:pointer;text-transform:uppercase}`;
    document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'invPanel'; el.hidden = true; document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el || e.target.classList.contains('cl')) toggleInventory(false); });
  }
  const show = force !== undefined ? force : el.hidden;
  if (show) {
    const S = G.story, money = G.player.money;
    let html = '';
    if (!S) html = `<div class="empty">A mochila só se usa no modo «A historia de Avelino Villar». No modo libre levas ${money} € e moita liberdade.</div>`;
    else if (!S.inv.length) html = '<div class="empty">Baleira. Nin unha pelusa.</div>';
    else html = S.inv.map(k => `<div class="it"><div class="ic">${ITEMS[k].i}</div><div><b>${ITEMS[k].n}</b><span>${ITEMS[k].d || ''}</span></div></div>`).join('');
    const st = S && S.step && STEPS[S.step];
    el.innerHTML = `<div class="box"><h2>MOCHILA</h2><div class="sub">${money} €${S ? ' · Débeda UCELERS: ' + (S.debt > 0 ? S.debt + ' €' : 'pagada ✓') : ''}${st ? '<br>Obxectivo: ' + st.t : ''}</div>${html}<button class="cl" type="button">Pechar <kbd>I</kbd></button></div>`;
    if (document.exitPointerLock) document.exitPointerLock();
  }
  el.hidden = !show; G.invOpen = show;
}
