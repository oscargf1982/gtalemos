'use strict';
/* ==========================================================
   GTA LEMOS 27400 · O Melenas (personaxe orixinal)
   Metaleiro da Rúa da Duquesa de Alba que leva toda a mañá
   dándolle cabezazos a unha porta. Cadea de recados:
   Melenas → Valerio (farmacia do Cardeal) → Rosiña (pastelaría
   Dulce Manía) → Dona Concha (quiosco) → Valerio → Melenas.
   ========================================================== */
const MEL = { init: false, npcs: {} };
const melSave = () => (save.melenas = save.melenas || { step: 'none' });
const melStep = s => { melSave().step = s; persist(); };
function melRoadSpot(name, f, side, off) {
  const r = ROADS.find(q => q.name === name); if (!r) return null;
  const p = roadPoint(r, r.len * f), nx = -p.uz * side, nz = p.ux * side, d = r.hw + r.sw + off;
  return { x: p.x + nx * d, z: p.z + nz * d, face: Math.atan2(-nx, -nz), wall: Math.atan2(nx, nz) };
}
function melInit() {
  MEL.init = true;
  // posicións: o Melenas na Duquesa de Alba (diante dunha porta); a farmacia do Cardeal e a pastelaría segundo OpenStreetMap
  MEL.spot = melRoadSpot('Rúa da Duquesa de Alba', 0.42, 1, 0.9);
  // mellor: diante dun portal real do Catastro nesa rúa (a porta que recibe os cabezazos)
  if (typeof ENDEREZOS !== 'undefined') { const si = ENDEREZOS.r.indexOf('Rúa da Duquesa de Alba'), ref = MEL.spot; let best = null, bd = 1e9;
    for (const [x, z, n, s2, e] of ENDEREZOS.a) { if (s2 !== si || !e) continue; const X = x / 10, Z = z / 10, d = ref ? Math.hypot(X - ref.x, Z - ref.z) : 0;
      const bl = (G.buildingsList || []).some(b => Math.hypot(b.cx - X, b.cz - Z) < 25 && inPoly(X, Z, b.poly.map(q => q)) === false && b.poly.some((q, i) => { const c = b.poly[(i + 1) % b.poly.length]; const dx = c[0] - q[0], dz = c[1] - q[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((X - q[0]) * dx + (Z - q[1]) * dz) / L2)); return Math.hypot(q[0] + dx * t - X, q[1] + dz * t - Z) < 1.2; }));
      if (bl && d < bd) { bd = d; best = [X, Z, n]; } }
    if (best) { const nr = nearRoad(best[0], best[1], r => r.name === 'Rúa da Duquesa de Alba'); let wx = best[0] - nr.px, wz = best[1] - nr.pz; const l = Math.hypot(wx, wz) || 1; wx /= l; wz /= l;
      MEL.spot = { x: best[0] - wx * 0.75, z: best[1] - wz * 0.75, wall: Math.atan2(wx, wz), face: Math.atan2(-wx, -wz), num: best[2] }; } }
  // a porta que recibe: o portalón granate da nave de Duquesa de Alba 13 (fachada singular)
  const E = G.fachadaEdge && G.fachadaEdge.duquesa13;
  if (E) { const gx = E.L * 0.5, gw = Math.min(E.L * 0.36, 4.4), t = gx + gw * 0.5; MEL.spot = { x: E.ax + E.ux * t + E.ox * 0.7, z: E.az + E.uz * t + E.oz * 0.7, wall: Math.atan2(-E.ox, -E.oz), face: Math.atan2(E.ox, E.oz), num: null }; }
  // a porta castigada: madeira escura con marcas de golpes
  if (MEL.spot && MEL.spot.num) { const c = cnv(64, 128), x = c.getContext('2d'); x.fillStyle = '#4a2e1c'; x.fillRect(0, 0, 64, 128); x.fillStyle = '#3a2214'; x.fillRect(6, 8, 24, 52); x.fillRect(34, 8, 24, 52); x.fillRect(6, 68, 24, 52); x.fillRect(34, 68, 24, 52);
    x.fillStyle = '#c9a54a'; x.fillRect(50, 66, 4, 6); x.fillStyle = 'rgba(0,0,0,.45)'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(28 + Math.random() * 10, 30 + Math.random() * 12, 2 + Math.random() * 2, 0, 7); x.fill(); }
    const d = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), std({ map: toTex(c, false), roughness: 0.8 })); const sp = MEL.spot, ex = sp.x + Math.sin(sp.wall) * 0.69, ez = sp.z + Math.cos(sp.wall) * 0.69;
    d.position.set(ex, groundH(ex, ez) + 1.2, ez); d.rotation.y = sp.face; G.scene.add(d); }
  const near = (x, z) => { const nr = nearRoad(x, z, r => r.type === 'car' || r.type === 'ped'); let nx = x - nr.px, nz = z - nr.pz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; const d = Math.min(l, nr.r ? nr.r.hw + nr.r.sw + 0.9 : 3); return { x: nr.px + nx * d, z: nr.pz + nz * d, face: Math.atan2(-nx, -nz) }; };
  const poi = n => (typeof COMERCIOS !== 'undefined' ? COMERCIOS.find(c => c[1].includes(n)) : null);
  const f = poi('Raíces Madriñán'), d = poi('Dulce Manía');
  // farmacia: diante da parede de edificio máis próxima ao punto de OSM, mirando á rúa, coa cruz verde enriba
  const atWall = (x, z) => { let best = null, bd = 25; for (const b of G.buildingsList || []) { if (Math.hypot(b.cx - x, b.cz - z) > 60) continue; const P = b.poly; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length], dx = c[0] - a[0], dz = c[1] - a[1], L2 = dx * dx + dz * dz; if (L2 < 9) continue; const t = Math.max(0.2, Math.min(0.8, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(px - x, pz - z); if (d < bd) { const L = Math.sqrt(L2); let nx = -dz / L, nz = dx / L; if (inPoly(px + nx * 0.5, pz + nz * 0.5, P)) { nx = -nx; nz = -nz; } bd = d; best = { px, pz, nx, nz }; } } } return best; };
  const FE = G.fachadaEdge && G.fachadaEdge.farmaciaCardeal;
  const fw = FE ? { px: FE.ax + FE.ux * FE.L * 0.75, pz: FE.az + FE.uz * FE.L * 0.75, nx: FE.ox, nz: FE.oz } : atWall(f ? f[2] : -93, f ? f[3] : 375.7);
  if (fw) { MEL.farm = { x: fw.px + fw.nx * 1.1, z: fw.pz + fw.nz * 1.1, face: Math.atan2(fw.nx, fw.nz) };
    const cr = new THREE.Group(), gm = nightMat(std({ color: 0x18a050, emissive: 0x30ff80, emissiveIntensity: 0.3, roughness: 0.4 }), 0.4, 1.6);
    cr.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.12), gm), new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.12), gm));
    const cx = fw.px + fw.nx * 0.5, cz = fw.pz + fw.nz * 0.5; cr.position.set(cx + (FE ? -FE.ux * FE.L * 0.6 : 0), groundH(cx, cz) + (FE ? 5.2 : 3.6), cz + (FE ? -FE.uz * FE.L * 0.6 : 0)); if (FE) { cr.scale.setScalar(1.2); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.8), std({ color: 0x9a9a9a })); arm.position.set(0, 0, -0.4); cr.add(arm); } cr.rotation.y = Math.atan2(fw.nx, fw.nz) + (FE ? 0 : Math.PI / 2); G.scene.add(cr); }
  else MEL.farm = f ? near(f[2], f[3]) : near(-93, 375.7);
  MEL.past = d ? near(d[2], d[3]) : near(-8.2, 287.1);
}
function melPed(key, look) {
  if (MEL.npcs[key] && MEL.npcs[key].state === 'npc') return MEL.npcs[key];
  const p = typeof freePed === 'function' ? freePed() : null; if (!p) return null;
  Object.assign(p, { state: 'npc', home: 'npc', npc: 'melenas_' + key, manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null, female: !!look.female, scale: look.scale || 1 });
  Object.assign(p.col, look.col); world.crowd.paint(p);
  return MEL.npcs[key] = p;
}
/* (melena 3D xa non se usa) dous panos negros que caen da cabeza e se moven co cabezazo */
function melHair() {
  if (MEL.hair) return MEL.hair;
  const m = std({ color: 0x0d0d0f, roughness: 0.9, side: THREE.DoubleSide }), g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.06), m); back.position.set(0, -0.2, -0.1); g.add(back);
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.18), m); side.position.set(s * 0.13, -0.17, -0.02); g.add(side); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); G.scene.add(g); return MEL.hair = g;
}
const _melM = new THREE.Matrix4(), _melP = new THREE.Vector3(), _melQ = new THREE.Quaternion(), _melS = new THREE.Vector3();
function updateMelenas(dt) {
  if (!MEL.init) melInit();
  if (!MEL.spot) return;
  const me = G.player.ped, S = melSave();
  const dMe = (o) => Math.hypot(me.x - o.x, me.z - o.z);
  // O Melenas (sprite pixel art achegado polo autor): atlas img/melenas.png 4×3 — 0 fronte, 1 perfil, 2 costas, 3 perfil, 4-7 camiñar, 8 sinalar, 9 cornos
  if (dMe(MEL.spot) < 160) {
    if (!MEL.sp) { const tex = new THREE.TextureLoader().load('img/melenas.png'); tex.magFilter = THREE.NearestFilter; tex.encoding = THREE.sRGBEncoding;
      const g = new THREE.PlaneGeometry(0.85, 1.95); g.translate(0, 0.975, 0); MEL.sp = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); MEL.sp.rotation.order = 'YXZ'; G.scene.add(MEL.sp);
      MEL.npcs.melenas = { state: 'npc', x: MEL.spot.x, z: MEL.spot.z }; }
    MEL.t = (MEL.t || 0) + dt; const sp = MEL.spot, done = S.step === 'done', talking = G.dialog && $('dlgName').textContent === 'O Melenas', P = MEL.npcs.melenas;
    let lean = 0;
    if (!done && !talking) { const ph = (MEL.t * 1.6) % 1; lean = ph < 0.25 ? ph / 0.25 : ph < 0.35 ? 1 : Math.max(0, 1 - (ph - 0.35) / 0.4);
      if (ph >= 0.24 && (MEL.lastHit || 0) < MEL.t - 0.5) { MEL.lastHit = MEL.t; if (dMe(sp) < 15 && G.sfx && G.sfx.thud) G.sfx.thud(0.25, { x: sp.x, z: sp.z }); } }
    P.x = sp.x - Math.sin(sp.wall) * 0.25 + Math.sin(sp.wall) * lean * 0.2; P.z = sp.z - Math.cos(sp.wall) * 0.25 + Math.cos(sp.wall) * lean * 0.2;
    const cam = camera.position, yawC = Math.atan2(cam.x - P.x, cam.z - P.z), M = MEL.sp; M.visible = true;
    M.position.set(P.x, groundH(P.x, P.z), P.z); M.rotation.y = yawC;
    // cara a onde mira (porta, xogador ou rúa) respecto da cámara → fotograma
    const face = talking ? Math.atan2(me.x - P.x, me.z - P.z) : done ? sp.face : sp.wall, rel = Math.atan2(Math.sin(face - yawC), Math.cos(face - yawC));
    let f, flip = false, tilt = 0;
    if (talking) f = Math.floor(MEL.t / 0.9) % 2 ? 8 : 0;
    else if (done) { f = 9; M.position.y += Math.abs(Math.sin(MEL.t * 5)) * 0.06; }
    else if (Math.abs(rel) < 0.6) f = 0; else if (Math.abs(rel) > 2.5) f = 2;
    else { f = 1; flip = rel < 0; tilt = (flip ? 1 : -1) * lean * 0.45; }
    M.rotation.z = tilt; M.material.color.setScalar(1 - 0.5 * (G.night || 0));
    if (MEL.fr !== f || MEL.flip !== flip) { MEL.fr = f; MEL.flip = flip; const t = M.material.map, c = f % 4, r = Math.floor(f / 4); t.repeat.set(flip ? -0.25 : 0.25, 1 / 3); t.offset.set(flip ? (c + 1) / 4 : c / 4, 1 - (r + 1) / 3); }
    if (typeof PORTRAITS !== 'undefined') PORTRAITS['O Melenas'] = done ? 'img/melenas-face.png' : 'img/melenas-ferido.png';
    if (!G.player.car && !G.dialog && dMe(P) < 3) setPrompt(`${isTouch ? '★' : 'E'} · Falar co Melenas`);
  } else if (MEL.sp) MEL.sp.visible = false;
  // Valerio está dentro da farmacia (Rúa do Cardeal, 3): na porta ofrécese entrar
  if (!G.player.car && !G.dialog && !G.interior && dMe(MEL.farm) < 3) setPrompt(`${isTouch ? '★' : 'E'} · Entrar na farmacia`);
  if (G.interior === 'farmacia') farmUpdate(dt);
  // Rosiña, a pasteleira (mandil rosa)
  if (dMe(MEL.past) < 120) { const r = melPed('rosina', { female: true, scale: 0.95, col: { shirt: '#f2a6c0', pants: '#f4f0e8', shoe: '#f4f4f4', hair: '#6b4a2e', skin: '#f2d2b6', sleeve: true } });
    if (r) { r.x = MEL.past.x; r.z = MEL.past.z; r.y = groundH(r.x, r.z); r.yaw = dMe(r) < 8 ? Math.atan2(me.x - r.x, me.z - r.z) : MEL.past.face; if (!G.player.car && !G.dialog && dMe(r) < 3) setPrompt(`${isTouch ? '★' : 'E'} · Falar con Rosiña (pastelaría)`); } }
}
/* cartel vertical cun atlas 4×3 que sempre mira á cámara; o fotograma depende de cara a onde mira o personaxe */
function melBillboard(img, w, h) {
  const tex = new THREE.TextureLoader().load(img); tex.magFilter = THREE.NearestFilter; tex.encoding = THREE.sRGBEncoding;
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); G.scene.add(m); m.userData.fr = -1; return m;
}
function melBillboardUpdate(M, x, z, front, face) {
  const cam = camera.position, yawC = Math.atan2(cam.x - x, cam.z - z), rel = Math.atan2(Math.sin(face - yawC), Math.cos(face - yawC));
  let f = front; if (Math.abs(rel) > 2.5) f = 2; else if (Math.abs(rel) > 0.8) f = rel > 0 ? 3 : 1;
  M.visible = true; M.position.set(x, groundH(x, z), z); M.rotation.y = yawC; M.material.color.setScalar(1 - 0.5 * (G.night || 0));
  if (M.userData.fr !== f) { M.userData.fr = f; const t = M.material.map, c = f % 4, r = Math.floor(f / 4); t.repeat.set(0.25, 1 / 3); t.offset.set(c / 4, 1 - (r + 1) / 3); }
}
const valMood = m => () => { MEL.vMood = m; if (typeof PORTRAITS !== 'undefined') PORTRAITS['Valerio'] = 'img/valerio-' + ({ matraz: 'chisca' }[m] || m) + '.png'; if (G.dialog && typeof setDialogFace === 'function') setDialogFace('Valerio'); };
function melWay(o, t) { if (o) setWaypoint(o.x, o.z); if (t) toast(t, 4); }
function melPay(n) { if (G.player.money < n) return false; G.player.money -= n; $('money').textContent = G.player.money + ' €'; return true; }
function melInteract() {
  if (!MEL.init || G.player.car || G.dialog) return false;
  if (G.interior && G.interior !== 'farmacia') return false;
  const me = G.player.ped, S = melSave(), near = k => MEL.npcs[k] && MEL.npcs[k].state === 'npc' && Math.hypot(me.x - MEL.npcs[k].x, me.z - MEL.npcs[k].z) < 3;
  const M = t => ({ who: 'O Melenas', text: t }), V = (t, e) => ({ who: 'Valerio', text: t, ...e }), R = (t, e) => ({ who: 'Rosiña', text: t, ...e }), Ti = t => ({ who: 'Ti', text: t });
  if (near('melenas')) {
    if (S.step === 'none') openDialog([Ti('Ei... estás ben? Levas un anaco dándolle cabezazos a esa porta.'), M('BOOOM. BOOOM. Ai... Que? Si, home, si. Estou practicando o headbanging para o concerto do sábado.'), M('O problema é que agora teño unha dor de cabeza que me retumba coma un bombo de dobre pedal. Non vexo nin os riffs.'),
      M('Fai o favor, metaleiro: achégate á farmacia da Rúa do Cardeal e tráeme ibuprofeno ou o que teñan. Eu non me podo mover, que se me move o cerebro.'), () => { melStep('farmacia'); melWay(MEL.farm, 'Misión: consegue ibuprofeno na farmacia da Rúa do Cardeal'); }]);
    else if (S.step === 'ibuprofeno') openDialog([Ti('Aquí tes o ibuprofeno. Valerio di que nada de cabezazos durante unha semana.'), M('UNHA SEMANA?! Ese home non entende o metal... Bueno, vale. Glup. Ai, que alivio. Xa oio a guitarra outra vez.'),
      M('Sabes por que lle daba a esa porta? É o local de ensaio dos Ferro Vello, a miña antiga banda. Botáronme por tocar "demasiado forte". DEMASIADO FORTE. Como se iso existise.'),
      M('Toma, para ti: a miña púa da sorte e uns cartos para un bocadillo. E se pasas polo Carud\'e Rock, búscame na primeira fila. Serei o que máis move a melena... con coidado.'),
      () => { G.player.money += 25; $('money').textContent = G.player.money + ' €'; if (G.story && typeof give === 'function' && typeof ITEMS !== 'undefined') { ITEMS.pua = ITEMS.pua || { n: 'Púa do Melenas', i: '🎸', d: 'Púa negra con caveira. Segundo o Melenas, dá sorte e +10 de decibelios.' }; give('pua'); } else toast('Conseguiches: 🎸 Púa do Melenas e 25 €', 3.5); melStep('done'); bigMsg('RECADO COMPLETADO', 'O Melenas xa non lle dá cabezazos á porta'); }]);
    else if (S.step === 'done') openDialog([M(pick(['Gráficas pola axuda, irmán. Agora fago air guitar, que non doe.', 'Ferro Vello vaise arrepentir. O sábado no Carud\'e Rock vai tremer Monforte!', 'Sabes cal é o mellor disco da historia? Todos os que soan alto.']))]);
    else openDialog([M(pick(['Aínda non trouxeches o ibuprofeno? BOOM... ai.', 'Farmacia. Rúa do Cardeal. Rápido, que me vai explotar a cabeza coma un amplificador vello.', 'Se Valerio che pon pegas, dille que é para unha emerxencia METÁLICA.']))]);
    return true;
  }
  if (!G.interior && Math.hypot(me.x - MEL.farm.x, me.z - MEL.farm.z) < 3) { farmEnter(); return true; }
  if (G.interior === 'farmacia') {
    if (S.step === 'farmacia') openDialog([valMood('face'), Ti('Boas. Necesito ibuprofeno para un colega que ten un dor de cabeza tremendo.'), V('Ibuprofeno... Dor de cabeza... Non será ese rapaz das greñas que lle dá cabezazos ás portas da Duquesa de Alba?'),
      valMood('chisca'), V('Mira, fago unha cousa: véndocho, pero só se me traes uns pasteles. Levo dende as oito aquí detrás do mostrador e o estómago ruxe máis que a música do teu amigo.'), V('Na pastelaría Dulce Manía, aí ao comezo do Cardeal, teñen uns de crema que... ai. Tráeme unha caixa e falamos.'),
      () => { melStep('pasteles'); melWay(MEL.past, 'Misión: consegue pasteles para Valerio na pastelaría'); }]);
    else if (S.step === 'pasteles_ok') openDialog([valMood('face'), Ti('Aquí tes a caixa de pasteles.'), valMood('ri'), V('Ai, miña nai, de crema e de froitas... e aínda quentes! Trato é trato.'), valMood('matraz'), V('Aquí tes o ibuprofeno de 400. Un cada oito horas, con comida. E dille ao teu amigo que a cabeza non é unha baqueta.'),
      () => { melStep('ibuprofeno'); melWay(MEL.spot, 'Conseguiches o ibuprofeno. Volve onda o Melenas'); }]);
    else if (S.step === 'pasteles' || S.step === 'tarta') openDialog([valMood('enfado'), V('Sen pasteles non hai ibuprofeno. Son farmacéutico, pero tamén son persoa.')]);
    else openDialog([valMood('face'), V(pick(['Boas. Se buscas protector solar, en Monforte non che fai moita falla.', 'Farmacia de garda? Hoxe toca a do Cardeal, ou sexa, eu. Coma sempre.', 'Bébete auga, que se nota que andas moito pola rúa.']))]);
    return true;
  }
  if (near('rosina')) {
    if (S.step === 'pasteles') openDialog([R('Boas, rei! Pasteles para Valerio? Ese home é capaz de cambiar unha receita por un milfollas.'),
      R('Unha caixa variada son 12 euros. Ou... se me fas un favor, déixocha de balde: tiña que levarlle esta tarta de aniversario a Dona Concha, a do quiosco da estación, e non podo deixar a tenda soa.', { choices: [
        { t: 'Pago os 12 euros', fn: () => melPay(12) ? [R('Aquí a tes, con lazo e todo. Dálle recordos a Valerio, e que non se coma todos de golpe.'), () => { melStep('pasteles_ok'); melWay(MEL.farm, 'Tes os pasteles. Lévallos a Valerio'); }] : [R('Uy, non che chegan os cartos. Mellor faime o favor da tarta, non?'), () => { melStep('tarta'); melWay(G.kiosk ? G.kiosk.door : null, 'Leva a tarta a Dona Concha, no quiosco da Praza da Estación'); }] },
        { t: 'Levo a tarta a Dona Concha', fn: () => [R('Es un sol! Coidado coas fochancas, que é de nata. Concha dárache a caixa de pasteles, que xa lla deixei preparada esta mañá.'), () => { melStep('tarta'); melWay(G.kiosk ? G.kiosk.door : null, 'Leva a tarta a Dona Concha, no quiosco da Praza da Estación'); }] },
      ] })]);
    else if (S.step === 'tarta') openDialog([R('A tarta é para Dona Concha, no quiosco da Praza da Estación. Non a abras, eh, que a conto!')]);
    else openDialog([R(pick(['Hoxe temos filloas, melindres e uns pasteis de crema que voan.', 'Se vés de parte de Valerio, xa sei que queres: crema, crema e máis crema.', 'Doce que non se come, doce que se perde.']))]);
    return true;
  }
  return false;
}
/* Dona Concha recibe a tarta (chámase desde kioskInteract) */
function melKioskHook() {
  const S = melSave(); if (S.step !== 'tarta') return false;
  const C = t => ({ who: 'Dona Concha', text: t });
  openDialog([C('Unha tarta? Para min? Ai, esa Rosiña, que se acordou do meu aniversario! Corenta e un anos neste quiosco e aínda me emociono.'), C('Toma, rei, a caixa de pasteles que me deixou para ti. E leva tamén estas lambetadas, que te vexo moi delgadiño.'),
    () => { melStep('pasteles_ok'); melWay(MEL.farm, 'Tes os pasteles. Lévallos a Valerio, na farmacia do Cardeal'); }]);
  return true;
}

/* ---------- interior da farmacia (escena pixel art achegada polo autor) ---------- */
function farmEnter() {
  let el = $('interior');
  if (!el) { el = document.createElement('div'); el.id = 'interior';
    el.innerHTML = `<div class="in-scene"><div class="in-valerio" title="Falar con Valerio"></div></div><div class="in-bar"><span class="in-title">Farmacia · Rúa do Cardeal, 3</span><button class="in-talk">Falar con Valerio (E)</button><button class="in-exit">Saír (Esc)</button></div>`;
    document.body.appendChild(el);
    el.querySelector('.in-valerio').onclick = e => { e.stopPropagation(); if (!G.dialog) melInteract(); };
    el.querySelector('.in-talk').onclick = () => { if (!G.dialog) melInteract(); };
    el.querySelector('.in-exit').onclick = () => farmExit(); }
  el.hidden = false; G.interior = 'farmacia'; MEL.inT = 0; if (G.sfx && G.sfx.door) G.sfx.door();
  if (document.exitPointerLock) try { document.exitPointerLock(); } catch (e) { }
  toast('Na farmacia. Fala con Valerio ou sae (Esc).', 2.5);
}
function farmExit() { const el = $('interior'); if (el) el.hidden = true; G.interior = null; if (G.dialog && typeof closeDialog === 'function') closeDialog(); }
function farmUpdate(dt) {
  const v = document.querySelector('#interior .in-valerio'); if (!v) return;
  MEL.inT = (MEL.inT || 0) + dt; const bar = document.querySelector('#interior .in-bar'); if (bar) bar.style.visibility = G.dialog ? 'hidden' : 'visible';
  const talking = G.dialog && $('dlgName').textContent === 'Valerio';
  const f = talking ? (MEL.vMood === 'ri' ? 9 : MEL.vMood === 'matraz' ? 11 : Math.floor(MEL.inT / 0.9) % 2 ? 8 : 0) : (Math.floor(MEL.inT / 4) % 3 === 2 ? 10 : 0);
  v.style.backgroundPosition = `${(f % 4) * 100 / 3}% ${Math.floor(f / 4) * 50}%`;
  if (typeof PORTRAITS !== 'undefined') PORTRAITS['Valerio'] = 'img/valerio-' + ({ ri: 'ri', matraz: 'chisca', enfado: 'enfado', chisca: 'chisca', sorpresa: 'sorpresa' }[MEL.vMood] || 'face') + '.png';
}
