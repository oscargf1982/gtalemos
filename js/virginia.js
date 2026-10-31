'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Virginia Bolsas, cabecilla da Asociación
   Salvemos o Malecón: gabardina, lentes escuras, pelo curto
   rizado, megáfono... e Pacheco, o seu can branco de cabeza
   canela. Odia a ponte do Malecón e todo o que faga o alcalde.
   Se traballaches para o alcalde, Pacheco vai por ti.
   ========================================================== */
const VIRGINIA_LINES = ['NON Á PONTE!', 'O Malecón non se vende!', 'Alcalde, dimisión!', 'Máis río e menos formigón!', 'Pacheco, non lle ladres aos patos!', 'Nin ponte nin pontiña!', 'Monforte, esperta!'];
const VB = (t, e) => ({ who: 'Virginia Bolsas', text: t, ...e });
const PCH = t => ({ who: 'Pacheco', text: t });
function makePacheco() {
  const d = makeDog(), white = std({ color: 0xf2eee6, roughness: 0.95 }), canela = std({ color: 0xc8874a, roughness: 0.95 }), canelaD = std({ color: 0xa86a34, roughness: 0.95 });
  const U = d.userData;
  U.body.material = white; U.legs.forEach(l => l.traverse(m => { if (m.isMesh) m.material = white; })); U.tail.traverse(m => { if (m.isMesh) m.material = white; });
  U.head.children.forEach((m, i) => { if (!m.isMesh) return; if (i < 2) m.material = canela; else if (m.geometry.parameters && m.geometry.parameters.height === 0.14) m.material = canelaD; });
  // mancha canela no lombo e colar azul
  const spot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), canela); spot.position.set(0.03, 0.56, -0.08); d.add(spot);
  d.traverse(m => { if (m.isMesh && m.geometry.type === 'TorusGeometry') m.material = std({ color: 0x1f4fd8 }); });
  d.scale.setScalar(1.12);
  return d;
}
function curlsGeo() {
  const list = [], N = 46;
  for (let i = 0; i < N; i++) {
    const th = Math.acos(1 - (i + 0.5) / N * 1.15), ph = i * 2.39996;
    const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
    if (z > 0.35 && y < 0.55) continue; // deixa a cara libre
    list.push(xform(new THREE.SphereGeometry(0.034, 7, 5), x * 0.112, y * 0.12 + 0.02, z * 0.118 - 0.008));
  }
  return mergeGeos(list);
}
function spawnVirginia() {
  const F = G.fair; if (!F || G.virginia) return;
  const sm = (F.sRange[0] + F.sRange[1]) / 2 + 3, q = F.at(sm, 1.2);
  const n = spawnNPC({ id: 'virginia', name: 'Virginia Bolsas', x: q.x, z: q.z, yaw: Math.atan2(-q.nx, -q.nz), scale: 0.97, fat: 1.05, colors: { shirt: '#b89a6a', pants: '#2a2a2e', skin: '#efc3a0', hair: '#3a2418', shoe: '#3a2418', sleeve: false } });
  if (!n) return;
  const p = n.p; p.manual = true; p.female = true;
  // faldóns da gabardina, cinto, rizos, lentes e megáfono (seguen as matrices da pose)
  const coatM = std({ color: 0xb89a6a, roughness: 0.85 }), dark = std({ color: 0x6a5434, roughness: 0.7 });
  const mk = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; m.castShadow = true; G.scene.add(m); return m; };
  const skirt = (() => { const g = new THREE.CylinderGeometry(0.19, 0.26, 0.62, 22, 1, true); g.translate(0, -0.26, 0); g.scale(1, 1, 0.72); return g; })();
  n.coat = mk(skirt, Object.assign(coatM.clone(), { side: THREE.DoubleSide }));
  n.belt = mk((() => { const g = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 22, 1, true); g.translate(0, 0.27 - 0.28, 0); g.scale(1, 1, 0.68); return g; })(), dark);
  n.lapel = mk((() => { const g = new THREE.BoxGeometry(0.2, 0.05, 0.03); g.translate(0, 0.26, 0.135); return g; })(), coatM);
  n.curls = mk(curlsGeo(), std({ color: 0x3a2418, roughness: 0.8 }));
  n.shades = makeShades(); n.shades.traverse(o => { if (o.isMesh) o.castShadow = false; }); n.shades.matrixAutoUpdate = false; G.scene.add(n.shades);
  { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, 0.2, 14, 1, true), std({ color: 0xf2f2ee, side: THREE.DoubleSide })); c.rotation.x = Math.PI / 2; c.position.z = 0.1; g.add(c);
    const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), std({ color: 0xd4202b })); hd.position.set(0, -0.05, 0.02); g.add(hd); g.matrixAutoUpdate = false; G.scene.add(g); n.mega = g; }
  // Pacheco
  const dog = makePacheco(); G.scene.add(dog);
  n.dog = { g: dog, x: q.x + 1, z: q.z + 1, yaw: 0, tx: q.x, tz: q.z, ph: 0, bark: 3, wait: 1, attack: null };
  n.home = { s: sm, o: 1.2 }; n.tt = 0; n.shout = 3;
  curritoSpeech(n);
  G.virginia = n;
}
function virginiaHatesYou() {
  const S = G.story;
  if (S) { if (S.phase === 'end') return true; const order = Object.keys(STEPS), i = order.indexOf(S.step); return i > order.indexOf('mayor2'); }
  return !!save.mayorErrand;
}
function talkVirginia(n) {
  const me = G.story ? 'Avelino' : 'Ti', MEL = (t, e) => ({ who: me, text: t, ...e });
  if (virginiaHatesYou()) {
    return openDialog([
      VB('Ti! Quieto aí! Xa me chegou o conto: andas facendo recados para o alcalde. Tesoiras douradas, autógrafos, sorrisos para as fotos... COLABORACIONISTA!'),
      save.virginiaSigned ? VB('E ademais asinaches a nosa petición! Traidor por partida dobre! Iso nin no Pleno se viu!') : VB('Que pasa, que agora tamén lle levas o formigón da ponte nunha carretilla?'),
      MEL(G.story ? 'Eh You! Eu só quería recuperar a miña carteira...' : 'Eu só lle fixen un favor...'),
      VB('Un favor ao alcalde é un piar da ponte! Pacheco... BUSCA! A el, Pacheco! Ao nocello!'),
      PCH('GRRRRR... GUAU! GUAU!'),
      () => virginiaSic(n),
    ]);
  }
  { const Q = carudeQ(); if (Q.state !== 'none') return openDialog(carudeVirginiaLines()); }
  openDialog([
    VB('Eh, ti! Si, ti! Para un momento. Son Virginia Bolsas, presidenta da Asociación Salvemos o Malecón. E este é Pacheco, vicepresidente.'),
    PCH('Guau!'),
    VB('Ese alcalde quere plantar unha ponte de formigón no medio do Malecón. Unha ponte! Coma se o Cabe precisase máis cemento do que xa ten ese home na cara.'),
    VB('E non é só a ponte, eh: a fonte, as tesoiras douradas, os fotógrafos, o bigote... Todo o que fai ese home está mal. Por principio.', {
      choices: [
        { t: 'E por que non unha ponte?', fn: () => [VB('Porque non! Porque o Malecón é dos paseantes, dos patos e de Pacheco. E porque se o propón ese home, xa sei que vai mal.'), VB('Se mañá di que a auga molla, convoco unha manifestación en contra da auga. Con pancarta e todo.')] },
        { t: 'Onde asino?', fn: () => [VB('Aquí, aquí! Unha sinatura máis... xa van trescentas doce. Pacheco asinou coa pata, que tamén é veciño e paga o IBI da caseta.'), () => { if (!save.virginiaSigned) { save.virginiaSigned = true; persist(); toast('Asinaches a petición «NON Á PONTE» de Salvemos o Malecón', 3.5); } }] },
        { t: 'Podo axudarte nalgo?', fn: () => carudeVirginiaLines() },
        { t: 'Pois a min o alcalde caeume ben', fn: () => [VB('CAEUCHE BEN?! Pacheco, mira este... Non, Pacheco, quieto. Aínda non.'), PCH('Grrrr...'), VB('Vou tomar nota da túa cara. Como te vexa facéndolle un recadiño a ese home, Pacheco vaise acordar do teu nocello.')] },
      ],
    }),
  ]);
}
function virginiaSic(n) {
  const D = n.dog; D.attack = { t: 14, bites: 0, cd: 0.6 };
  curritoSay(n, 'A el, Pacheco!', 2.5);
  toast('Pacheco vai por ti! Corre!', 3);
}
function updateVirginia(dt) {
  const n = G.virginia; if (!n) { if (G.fair && typeof makeDog === 'function') spawnVirginia(); return; }
  const F = G.fair, p = n.p, me = G.player.ped, t = G.t, dme = Math.hypot(me.x - p.x, me.z - p.z);
  // paseo diante da pancarta co megáfono
  if (p.talking || (G.dialog && dme < 5)) { p.walk = lerp(p.walk, 0, dt * 6); p.yaw += angDiff(p.yaw, Math.atan2(me.x - p.x, me.z - p.z)) * Math.min(1, dt * 5); p.armUp = lerp(p.armUp, 0, dt * 5); }
  else {
    if (!n.tgt || n.tt <= 0) { const s = clamp(n.home.s + RR(-5, 5), F.sRange[0], F.sRange[1]), q = F.at(s, clamp(n.home.o + RR(-1, 1), -2, F.bank(s) - 0.5)); n.tgt = [q.x, q.z]; n.tt = RR(3, 7); }
    n.tt -= dt;
    const dx = n.tgt[0] - p.x, dz = n.tgt[1] - p.z, d = Math.hypot(dx, dz);
    if (d > 0.4) { p.yaw += angDiff(p.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); p.x += dx / d * 0.85 * dt; p.z += dz / d * 0.85 * dt; p.walk = 0.7; p.phase += dt * 3.4; }
    else { p.walk = 0; p.yaw += angDiff(p.yaw, Math.atan2(F.bigX - p.x, F.zm - p.z) + Math.PI) * dt * 2; }
    n.shout -= dt;
    const shouting = n.shout < 1.6;
    p.armUp = lerp(p.armUp, shouting ? 0.82 : 0.15, dt * 5); p.nod = shouting ? Math.max(0, Math.sin(t * 8)) * 0.12 : 0;
    if (n.shout <= 0) { n.shout = RR(4, 7); if (dme < 30) curritoSay(n, pick(VIRGINIA_LINES), 2.4); }
  }
  p.y = groundH(p.x, p.z);
  n.speech.position.set(p.x, p.y + 2.6 * p.scale, p.z);
  if (n.speechHold > 0) { n.speechHold -= dt; if (n.speechHold <= 0) n.speech.visible = false; }
  // Pacheco
  const D = n.dog, dg = D.g, U = dg.userData, inCar = !!G.player.car, tgtP = inCar ? G.player.car : me;
  const dpl = Math.hypot(tgtP.x - D.x, tgtP.z - D.z);
  let spd = 0, tx, tz;
  if (D.attack) {
    const A = D.attack; A.t -= dt; A.cd -= dt;
    tx = tgtP.x; tz = tgtP.z; spd = dpl > 0.8 ? 5.4 : 0;
    if (!inCar && dpl < 1.0 && A.cd <= 0 && !G.dialog) {
      A.cd = 1.4; A.bites++; G.shake = 0.55; sajoniSnd('bark', D.x, D.z);
      const ux = (me.x - D.x) / (dpl || 1), uz = (me.z - D.z) / (dpl || 1); me.x += ux * 0.9; me.z += uz * 0.9;
      toast(pick(['Ai! Pacheco tráboute o nocello!', 'Grrr! Pacheco non solta o pantalón!', 'Pacheco morde coma un concelleiro da oposición!', 'Ai, ai! A dentadura de Pacheco é moi de esquerdas co alcalde!']), 2.2);
      if (G.sfx && G.sfx.thud) G.sfx.thud(0.3, me);
    }
    if (A.bites >= 3 || A.t <= 0 || dpl > 32 || (inCar && dpl > 12)) {
      D.attack = null; curritoSay(n, A.bites ? 'Ben feito, Pacheco! Ven aquí!' : 'Pacheco, volve! Xa o colleremos!', 2.6);
      toast(A.bites ? 'Pacheco volve con Virginia, satisfeito' : 'Escapaches de Pacheco!', 2.5);
    }
  } else {
    // ao pé da dona, ladrando aos que pasan
    tx = p.x + Math.cos(p.yaw) * 0.8; tz = p.z - Math.sin(p.yaw) * 0.8;
    const dd = Math.hypot(tx - D.x, tz - D.z); spd = dd > 0.5 ? Math.min(3.5, dd * 1.6) : 0;
  }
  const ddx = tx - D.x, ddz = tz - D.z, dd = Math.hypot(ddx, ddz);
  if (spd > 0 && dd > 0.01) { D.x += ddx / dd * spd * dt; D.z += ddz / dd * spd * dt; D.yaw += angDiff(D.yaw, Math.atan2(ddx, ddz)) * Math.min(1, dt * 8); }
  else if (D.attack || dpl < 5) D.yaw += angDiff(D.yaw, Math.atan2(tgtP.x - D.x, tgtP.z - D.z)) * Math.min(1, dt * 4);
  D.ph += dt * (spd * 6 + 0.1);
  dg.position.set(D.x, groundH(D.x, D.z) + (D.attack && spd > 0 ? Math.abs(Math.sin(D.ph * 0.5)) * 0.06 : 0), D.z); dg.rotation.y = D.yaw;
  U.legs.forEach((l, i) => { l.rotation.x = spd > 0 ? Math.sin(D.ph + (i === 0 || i === 3 ? 0 : Math.PI)) * (D.attack ? 0.9 : 0.6) : 0; });
  U.tail.rotation.y = Math.sin(t * (D.attack ? 4 : 9)) * 0.5; U.head.rotation.x = D.attack ? -0.15 + Math.sin(t * 20) * 0.08 : Math.sin(t * 1.3) * 0.1;
  D.bark -= dt;
  if (D.bark <= 0) { D.bark = D.attack ? RR(0.5, 1.1) : RR(5, 12); if (dpl < 30) { U.head.rotation.x = -0.3; sajoniSnd('bark', D.x, D.z); } }
}
/* despois da pose: gabardina, rizos, lentes e megáfono */
const _vm = new THREE.Matrix4(), _vo = new THREE.Matrix4();
function virginiaOverlays() {
  const n = G.virginia; if (!n) return; const p = n.p, vis = p.visible;
  for (const o of [n.coat, n.belt, n.lapel, n.curls, n.shades, n.mega]) o.visible = vis;
  if (!vis) return;
  pedMatrix('hips', p.idx, n.coat.matrix); n.belt.matrix.copy(n.coat.matrix);
  pedMatrix('torso', p.idx, n.lapel.matrix); _vo.makeTranslation(0, 0, 0); n.lapel.matrix.multiply(_vo);
  pedMatrix('head', p.idx, n.curls.matrix);
  pedMatrix('head', p.idx, _vm); _vo.makeTranslation(0, 0.018, 0.112); n.shades.matrix.copy(_vm).multiply(_vo);
  pedMatrix('farm', p.idx * 2 + 1, _vm); _vo.makeTranslation(0, -0.3, 0.03); _vm.multiply(_vo); _vo.makeRotationX(-Math.PI / 2 + 0.3); n.mega.matrix.copy(_vm).multiply(_vo);
  for (const o of [n.coat, n.belt, n.lapel, n.curls, n.shades, n.mega]) o.matrixWorldNeedsUpdate = true;
  n.mega.visible = p.armUp > 0.45; // o megáfono só aparece cando berra
}
