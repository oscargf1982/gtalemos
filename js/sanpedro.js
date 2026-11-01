'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Rúa de San Pedro e arredores:
   exposición de coches (esquina con Calvo Sotelo), Ximnasio Neka
   (taekwondo e boxeo co sensei) e paso a nivel da Florida.
   ========================================================== */
G.sp = { built: false };
function spBuild() {
  const S = G.sp; S.built = true;
  // ---------- exposición de coches cercada (esquina San Pedro / Calvo Sotelo) ----------
  const C0 = [618, -58]; let best = null;
  let bs = 1e9;
  for (let gx = -30; gx <= 30; gx += 2) for (let gz = -30; gz <= 30; gz += 2) {
    const cx = C0[0] + gx, cz = C0[1] + gz; if (inRoad(cx, cz, 3.5) || inStreet(cx, cz, 2)) continue;
    const q = G.colGrid.query(cx, cz, 7, []).filter(o => o.k !== 'c' && o.h >= 2.5 && o.tag !== 'arbore'); if (q.length) continue;
    const sc = Math.hypot(gx, gz); if (sc < bs) { bs = sc; best = [cx, cz]; }
  }
  if (best) {
    const [cx, cz] = best, nr = nearRoad(cx, cz, r => r.type === 'car'), yaw = Math.atan2(nr.ux, nr.uz), W = 18, D = 11;
    const g = new THREE.Group(); g.position.set(cx, groundH(cx, cz), cz); g.rotation.y = yaw; G.scene.add(g);
    const fc = cnv(64, 64), fx = fc.getContext('2d'); fx.strokeStyle = '#3c5a44'; fx.lineWidth = 3; for (let i = -64; i < 128; i += 12) { fx.beginPath(); fx.moveTo(i, 0); fx.lineTo(i + 64, 64); fx.stroke(); fx.beginPath(); fx.moveTo(i + 64, 0); fx.lineTo(i, 64); fx.stroke(); }
    const ft = toTex(fc); ft.repeat.set(W / 1.2, 1.2);
    const fm = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 });
    const post = new THREE.MeshStandardMaterial({ color: 0x2f5a3a, roughness: 0.5, metalness: 0.5 });
    const side = (x, z, L, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.25), fm); m.position.set(x, 0.65, z); m.rotation.y = ry; g.add(m); for (let s = -L / 2; s <= L / 2 + 0.01; s += 2.5) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 6), post); p.position.set(x + Math.cos(ry) * s, 0.67, z - Math.sin(ry) * s); g.add(p); } };
    side(0, -D / 2, W, 0); side(0, D / 2, W, 0); side(-W / 2, 0, D, Math.PI / 2); side(W / 2, 0, D, Math.PI / 2);
    const pv = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std({ color: 0x8a8a86, roughness: 0.95 })); pv.rotation.x = -Math.PI / 2; pv.position.y = 0.03; g.add(pv);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), std({ map: textTex('CENTRO DE OPORTUNIDADES · AUTOS LEMOS', { w: 1024, h: 320, bg: '#f4f4f0', fg: '#1f3f8f', size: 54 }), roughness: 0.6 })); sg.position.set(-W / 2 + 2, 2.2, -D / 2 - 0.05); sg.rotation.y = Math.PI; g.add(sg);
    const sp1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.1), post); sp1.position.set(-W / 2 + 2, 1.1, -D / 2); g.add(sp1);
    for (const [lx, sx] of [[-1, 1], [1, 1]]) {}
    const F = makeFrame(cx, cz, yaw);
    addOBB(cx, cz, W / 2, 0.15, yaw, 1.4, 'valado'); // as dúas cercas longas (simplificado: un bloque central baixo non deixa entrar)
    const types = ['compacto', 'berlina', 'suv', 'compacto', 'berlina', 'suv'];
    S.lot = []; for (let i = 0; i < 6; i++) { const lx = -W / 2 + 2 + (i % 3) * 5.5 + 1, lz = i < 3 ? -2.4 : 2.4; const [x, z] = F.pt(lx, lz); S.lot.push({ type: types[i], x, z, yaw: yaw + Math.PI / 2 }); }
    S.lotC = best;
  }
  // ---------- Ximnasio Neka ----------
  const E = G.fachadaEdge && G.fachadaEdge.neka;
  if (E) S.gym = { door: { x: E.mx + E.ox * 1.4, z: E.mz + E.oz * 1.4 }, E };
  // ---------- paso a nivel da Florida (Rúa de Benito Vicetto / Calvo Sotelo) ----------
  buildCrossing(593.8, 260.7);
}
function spPlaceLotCars() {
  const S = G.sp; if (!S.lot || S.lotDone || typeof spawnVehicle !== 'function') return; S.lotDone = true;
  for (const c of S.lot) { const v = spawnVehicle(c.type, c.x, c.z, c.yaw, pick(['#f2f2f0', '#1d1d1f', '#9aa0a6', '#2b4a8a', '#e8c23a', '#7a1f1f'])); v.sleep = true; v.lot = true; }
}

/* ---------- paso a nivel ---------- */
function buildCrossing(x, z) {
  const T = OSM.train; let bi = 0, bd = 1e9; for (let i = 0; i < T.length - 1; i++) { const a = T[i], b = T[i + 1], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, d = Math.hypot(mx - x, mz - z); if (d < bd) { bd = d; bi = i; } }
  const a = T[bi], b = T[bi + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L; // eixo da vía
  const nr = nearRoad(x, z, r => r.type === 'car'), rw = nr.r ? nr.r.hw + (nr.r.sw || 0) : 4;
  const y0 = groundH(x, z), g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = Math.atan2(ux, uz); G.scene.add(g); // local z = ao longo da vía, local x = a través
  // caixa amarela (cuadrícula) a ambos lados
  const yc = cnv(256, 256), yx = yc.getContext('2d'); yx.strokeStyle = '#f2c21b'; yx.lineWidth = 10; yx.strokeRect(5, 5, 246, 246); for (let i = -256; i < 512; i += 48) { yx.beginPath(); yx.moveTo(i, 0); yx.lineTo(i + 256, 256); yx.stroke(); yx.beginPath(); yx.moveTo(i + 256, 0); yx.lineTo(i, 256); yx.stroke(); }
  const ym = new THREE.MeshBasicMaterial({ map: toTex(yc, false), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(rw * 1.6, 3.2), ym); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.06, s * 4.5); g.add(m); }
  // barreiras: mastro cinsento e brazo a raias vermellas e brancas
  const sc = cnv(256, 16), sx = sc.getContext('2d'); for (let i = 0; i < 8; i++) { sx.fillStyle = i % 2 ? '#f4f4f0' : '#c8202a'; sx.fillRect(i * 32, 0, 32, 16); }
  const armM = std({ map: toTex(sc, false), roughness: 0.5 }), grey = std({ color: 0x8a8f94, roughness: 0.5, metalness: 0.5 });
  const arms = [];
  for (const s of [-1, 1]) {
    const px = s * (rw + 0.6), pz = s * 3.0;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.4), grey); box.position.set(px, 0.6, pz); box.castShadow = true; g.add(box);
    const piv = new THREE.Group(); piv.position.set(px, 1.0, pz); g.add(piv);
    const len = rw * 1.9, arm = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.09), armM); arm.position.set(-s * len / 2, 0, 0); arm.castShadow = true; piv.add(arm);
    arms.push({ piv, s });
    // sinal de paso a nivel (cruz de San Andrés) e luces
    const cr = new THREE.Group(); cr.position.set(px + s * 0.6, 2.4, pz); g.add(cr);
    for (const r of [0.6, -0.6]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.03), armM); bar.rotation.z = r; cr.add(bar); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), grey); pole.position.set(px + s * 0.6, 1.2, pz); g.add(pole);
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), nightMat(std({ color: 0x400000, emissive: 0xff2020, emissiveIntensity: 0 }), 0, 0)); lamp.position.set(px + s * 0.6, 1.85, pz - s * 0.03); lamp.rotation.y = s > 0 ? 0 : Math.PI; g.add(lamp); arms[arms.length - 1].lamp = lamp;
  }
  G.crossing = { x, z, ux, uz, arms, ang: 0 };
  G.namedZones.push({ n: 'Paso a nivel da Florida', p: [[x - 12, z - 12], [x + 12, z - 12], [x + 12, z + 12], [x - 12, z + 12]] });
}
function updateCrossing(dt) {
  const C = G.crossing; if (!C) return;
  const tb = G.trainBox; let near = false;
  if (tb) { const al = (tb.x - C.x) * C.ux + (tb.z - C.z) * C.uz; near = Math.abs(al) < 140 + (tb.half || 0) && Math.hypot(tb.x - C.x, tb.z - C.z) < 260; }
  const want = near ? 1 : 0; C.ang += Math.sign(want - C.ang) * Math.min(Math.abs(want - C.ang), dt * 0.6);
  for (const A of C.arms) { A.piv.rotation.z = -A.s * (1 - C.ang) * 1.45; if (A.lamp) A.lamp.material.emissiveIntensity = near && Math.floor(G.t * 3) % 2 === (A.s > 0 ? 0 : 1) ? 3 : 0; }
  if (near && !C.bell && G.sfx && G.sfx.bell) { C.bellT = (C.bellT || 0) - dt; }
  // coches da IA: paran se a barreira está baixada
  if (C.ang > 0.3) for (const v of world.vehicles) if (v.ai && Math.hypot(v.x - C.x, v.z - C.z) < 14) { const along = (v.x - C.x) * Math.sin(v.yaw) + (v.z - C.z) * Math.cos(v.yaw); if (along < -4) { v.inp.throttle = 0; v.inp.brake = 1; } }
}

/* ---------- veciñas cos seus fillos vestidos de karatekas diante do Neka ---------- */
function updateNekaCrowd(dt) {
  const S = G.sp; if (!S.gym || S.crowd) return;
  const me = G.player.ped, E = S.gym.E; if (Math.hypot(me.x - E.mx, me.z - E.mz) > 140) return;
  S.crowd = [];
  for (let i = 0; i < 4; i++) {
    const s = -3 + i * 2.2, bx = E.mx + E.ux * s + E.ox * 2.2, bz = E.mz + E.uz * s + E.oz * 2.2;
    const mom = freePed(); if (!mom) break; Object.assign(mom, { state: 'npc', home: 'npc', npc: 'nekaMom', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null, female: true, scale: 1 });
    Object.assign(mom.col, { shirt: pick(['#c0392b', '#2c3e50', '#8e44ad', '#e8e4dc', '#d35400', '#16a085']), pants: pick(['#1f2a44', '#2b2b2e', '#5a4a3a']), hair: pick(['#3b2a1e', '#1d1612', '#a07a4f', '#6b4a2e']) }); world.crowd.paint(mom);
    mom.x = bx; mom.z = bz; mom.y = groundH(bx, bz); mom.yaw = Math.atan2(-E.ox, -E.oz) + RR(-0.6, 0.6);
    const kid = freePed(); if (!kid) break; Object.assign(kid, { state: 'npc', home: 'npc', npc: 'nekaKid', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null, scale: RR(0.5, 0.62) });
    Object.assign(kid.col, { shirt: '#f4f4f0', pants: '#f4f4f0', shoe: kid.col.skin, sleeve: false }); world.crowd.paint(kid); if (typeof repaintArms === 'function') repaintArms(kid, '#f4f4f0');
    kid.x = bx + E.ux * 0.7; kid.z = bz + E.uz * 0.7; kid.y = groundH(kid.x, kid.z); kid.yaw = mom.yaw + Math.PI * 0.5;
    S.crowd.push({ mom, kid, ph: R() * 6 });
  }
  // cintos de cores dos nenos (tiras sobre a cadeira)
  S.belts = S.crowd.map((c, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 4, 12), std({ color: ['#f2c21b', '#e67e22', '#27ae60', '#1d1d1f'][i % 4] })); m.rotation.x = Math.PI / 2; G.scene.add(m); return m; });
}
function nekaAnimate(dt) {
  const S = G.sp; if (!S.crowd) return;
  S.crowd.forEach((c, i) => { c.ph += dt; const k = c.kid; if (k.state !== 'npc') return;
    k.armUp = Math.max(0, Math.sin(c.ph * 3)) * 0.9; k.nod = Math.sin(c.ph * 6) * 0.05; k.yaw += Math.sin(c.ph * 0.7) * 0.01;
    const b = S.belts[i]; if (b) { const sc = k.scale || 0.55; b.position.set(k.x, k.y + 0.98 * sc, k.z); b.scale.setScalar(sc / 0.55); }
    c.mom.nod = Math.sin(c.ph * 2) * 0.04; });
}
function updateSanPedro(dt) {
  if (!G.sp.built && G.colGrid && G.fachadaEdge) spBuild();
  const me = G.player.car || G.player.ped;
  if (G.sp.lotC && !G.sp.lotDone && Math.hypot(me.x - G.sp.lotC[0], me.z - G.sp.lotC[1]) < 220) spPlaceLotCars();
  updateCrossing(dt); updateNekaCrowd(dt); nekaAnimate(dt);
  const Gy = G.sp.gym; if (Gy && !G.player.car && !G.dialog && !G.minigame && Math.hypot(G.player.ped.x - Gy.door.x, G.player.ped.z - Gy.door.z) < 2.6) setPrompt(`${isTouch ? '★' : 'E'} · Entrar no Ximnasio Neka`);
}
function nekaInteract() {
  const Gy = G.sp && G.sp.gym; if (!Gy || G.player.car || G.dialog || G.minigame) return false;
  if (Math.hypot(G.player.ped.x - Gy.door.x, G.player.ped.z - Gy.door.z) > 2.6) return false;
  const S = (t, e) => ({ who: 'Sensei do Neka', text: t, ...e });
  openDialog([S('Benvido ao Neka! Aquí saíron campións galegos e de España. Ti que vés, a mirar ou a suar?'),
    S('Escolle disciplina. E saúda ao entrar no tatami, que isto non é a feira.', { choices: [
      { t: 'Taekwondo', fn: () => [S('Taekwondo: as patadas puntúan máis que os puños. Baixa a garda e verás.'), () => mgOpen('taekwondo')] },
      { t: 'Boxeo', fn: () => [S('Boxeo: só puños, e mantén a garda arriba. Se che dou no queixo, ao chan.'), () => mgOpen('boxeo')] },
      { t: 'Só miraba', fn: () => [S('Mirar tamén é adestrar... pero pouco. Volve cando teñas gana.')] },
    ] })]);
  return true;
}

/* ---------- minixogo de loita contra o sensei (vista lateral) ---------- */
function mgFight(kind) {
  const TKD = kind === 'taekwondo';
  const S = { me: { x: 230, hp: 100, act: null, t: 0, guard: false, cd: 0 }, ai: { x: 530, hp: 100, act: null, t: 0, guard: false, cd: 0, think: 1 }, msg: '', round: 1, time: 60, hits: [] };
  const MV = TKD ? { a: { n: 'Patada', dmg: 14, reach: 120, dur: 0.45, hit: 0.22 }, b: { n: 'Puño', dmg: 6, reach: 80, dur: 0.25, hit: 0.1 } } : { a: { n: 'Directo', dmg: 9, reach: 85, dur: 0.28, hit: 0.12 }, b: { n: 'Gancho', dmg: 15, reach: 70, dur: 0.5, hit: 0.28 } };
  const keys = {};
  const kd = e => { if (G.minigame !== kind) return; keys[e.code] = true; if (e.code === 'KeyJ') start(S.me, 'a'); if (e.code === 'KeyK') start(S.me, 'b'); };
  const ku = e => { keys[e.code] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  function start(f, m) { if (f.act || f.cd > 0 || S.over) return; f.act = m; f.t = 0; f.hitDone = false; }
  const bar = MG.el.querySelector('.mg-bar');
  bar.innerHTML = `<button data-k="L">◀</button><button data-k="R">▶</button><button data-k="G">Garda</button><button data-k="a">${MV.a.n} (J)</button><button data-k="b">${MV.b.n} (K)</button><span style="opacity:.8">Frechas/A-D: moverse · S: garda</span>`;
  const hold = {}; bar.querySelectorAll('button').forEach(b => { const k = b.dataset.k; b.onpointerdown = e => { e.preventDefault(); if (k === 'a' || k === 'b') start(S.me, k); else hold[k] = true; }; b.onpointerup = b.onpointerleave = () => { hold[k] = false; }; });
  mgMsg(TKD ? 'Taekwondo co sensei: a patada (J) puntúa máis.' : 'Boxeo co sensei: garda arriba (S) e golpea (J/K).');
  let last = performance.now(), raf = 0;
  const loop = () => {
    if (G.minigame !== kind) { removeEventListener('keydown', kd); removeEventListener('keyup', ku); return; }
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!S.over) step(dt); mgDraw(); raf = requestAnimationFrame(loop);
  };
  function step(dt) {
    const me = S.me, ai = S.ai; S.time -= dt;
    const L = keys.ArrowLeft || keys.KeyA || hold.L, R = keys.ArrowRight || keys.KeyD || hold.R; me.guard = !!(keys.ArrowDown || keys.KeyS || hold.G) && !me.act;
    if (!me.act && !me.guard) me.x += ((R ? 1 : 0) - (L ? 1 : 0)) * 190 * dt;
    // IA do sensei: achégase, garda cando ti atacas, ataca cando estás a tiro
    ai.think -= dt; const dist = ai.x - me.x;
    if (!ai.act) { ai.guard = me.act && Math.random() < 0.035 * 30 * dt * 0.6 ? true : ai.guard && Math.random() < 0.97;
      if (ai.think <= 0) { ai.think = 0.25 + Math.random() * 0.45; const m = Math.random() < 0.5 ? 'a' : 'b'; if (dist < MV[m].reach + 10 && Math.random() < 0.6) { ai.guard = false; start(ai, m); } }
      if (!ai.guard && !ai.act) ai.x += (dist > 95 ? -1 : dist < 70 ? 0.8 : 0) * 150 * dt; }
    me.x = clamp(me.x, 60, ai.x - 55); ai.x = clamp(ai.x, me.x + 55, 700);
    for (const [f, o, sgn] of [[me, ai, 1], [ai, me, -1]]) {
      f.cd = Math.max(0, f.cd - dt);
      if (!f.act) continue; const M = MV[f.act]; f.t += dt;
      if (!f.hitDone && f.t >= M.hit) { f.hitDone = true; const d = Math.abs(o.x - f.x);
        if (d <= M.reach) { const dmg = o.guard ? Math.round(M.dmg * 0.2) : M.dmg; o.hp = Math.max(0, o.hp - dmg); o.x += sgn * (o.guard ? 8 : 24); S.hits.push({ x: (f.x + o.x) / 2, t: 0.3, txt: o.guard ? 'garda' : `-${dmg}` }); } }
      if (f.t >= M.dur) { f.act = null; f.cd = 0.15; }
    }
    S.hits.forEach(h => h.t -= dt); S.hits = S.hits.filter(h => h.t > 0);
    if (me.hp <= 0 || ai.hp <= 0 || S.time <= 0) { S.over = true; const won = ai.hp < me.hp; mgEnd(won, ai.hp === me.hp); bar.querySelectorAll('[data-k]').forEach(b => b.remove()); }
  }
  setTimeout(() => { last = performance.now(); raf = requestAnimationFrame(loop); }, 50);
  const fighter = (x, X, f, dir, gi, belt, skin, hair) => {
    const y = 470, t = f.act ? f.t / MV[f.act].dur : 0, ext = f.act ? Math.sin(Math.min(1, t * 1.6) * Math.PI) : 0;
    x.save(); x.translate(X, y); x.scale(dir, 1);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(0, 4, 40, 8, 0, 0, 7); x.fill();
    // pernas
    x.strokeStyle = gi; x.lineCap = 'round'; x.lineWidth = 16;
    const kick = f.act && ((TKD && f.act === 'a') || (!TKD && false));
    x.beginPath(); x.moveTo(-6, -95); x.lineTo(-18, -45); x.lineTo(-22, 0); x.stroke();
    x.beginPath(); x.moveTo(6, -95); if (kick) { x.lineTo(30 + ext * 40, -100 - ext * 30); x.lineTo(60 + ext * 70, -120 - ext * 30); } else { x.lineTo(18, -45); x.lineTo(24, 0); } x.stroke();
    // tronco
    x.fillStyle = gi; x.fillRect(-20, -175, 40, 85); x.fillStyle = belt; x.fillRect(-21, -100, 42, 9);
    // brazos
    x.strokeStyle = TKD ? gi : skin; x.lineWidth = 12;
    const punch = f.act && !kick;
    const fr = punch ? 40 + ext * 55 : f.guard ? 22 : 30, fy = punch ? -150 : f.guard ? -175 : -140;
    x.beginPath(); x.moveTo(12, -165); x.lineTo(fr * 0.6, (fy - 165) / 2 - 10); x.lineTo(fr, fy); x.stroke();
    x.beginPath(); x.moveTo(-10, -165); x.lineTo(10, -150); x.lineTo(f.guard ? 18 : 14, f.guard ? -185 : -160); x.stroke();
    x.fillStyle = TKD ? skin : '#c8202a'; x.beginPath(); x.arc(fr, fy, TKD ? 8 : 12, 0, 7); x.fill(); x.beginPath(); x.arc(f.guard ? 18 : 14, f.guard ? -185 : -160, TKD ? 8 : 12, 0, 7); x.fill();
    // cabeza
    x.fillStyle = skin; x.beginPath(); x.arc(0, -195, 20, 0, 7); x.fill(); x.fillStyle = hair; x.beginPath(); x.arc(-3, -202, 19, Math.PI, 2 * Math.PI); x.fill();
    x.fillStyle = '#111'; x.fillRect(8, -198, 4, 4);
    if (TKD) { x.strokeStyle = '#c8202a'; x.lineWidth = 3; x.beginPath(); x.arc(0, -198, 21, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
    x.restore();
  };
  return {
    draw(x, W, H) {
      x.fillStyle = TKD ? '#2a6a4a' : '#3a2a2a'; x.fillRect(0, 0, W, H);
      x.fillStyle = TKD ? '#3c8a5c' : '#5a4038'; x.fillRect(0, 360, W, 200); x.strokeStyle = TKD ? '#f2c21b' : '#e8e4dc'; x.lineWidth = 3; x.strokeRect(40, 380, W - 80, 160);
      if (!TKD) { x.strokeStyle = '#c8202a'; x.lineWidth = 4; for (const yy of [250, 290, 330]) { x.beginPath(); x.moveTo(20, yy); x.lineTo(W - 20, yy); x.stroke(); } }
      x.fillStyle = 'rgba(255,255,255,.08)'; x.font = 'bold 60px sans-serif'; x.textAlign = 'center'; x.fillText('NEKA', W / 2, 120); x.textAlign = 'left';
      const hp = (X, v, n, right) => { x.fillStyle = '#222'; x.fillRect(X, 20, 300, 22); x.fillStyle = v > 30 ? '#3bd16f' : '#e8432a'; x.fillRect(right ? X + 300 - v * 3 : X, 20, v * 3, 22); x.fillStyle = '#f2f2f0'; x.font = 'bold 14px sans-serif'; x.fillText(n, X, 60); };
      hp(30, S.me.hp, 'TI', false); hp(W - 330, S.ai.hp, 'SENSEI', true);
      x.fillStyle = '#f2f2f0'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.fillText(Math.max(0, Math.ceil(S.time)), W / 2, 40); x.textAlign = 'left';
      fighter(x, S.me.x, S.me, 1, TKD ? '#f4f4f0' : '#2b4a8a', TKD ? '#f2c21b' : '#2b4a8a', '#e9bc98', '#2a1d14');
      fighter(x, S.ai.x, S.ai, -1, TKD ? '#f4f4f0' : '#1d1d1f', TKD ? '#111' : '#1d1d1f', '#d8a37e', '#151515');
      for (const h of S.hits) { x.fillStyle = h.txt === 'garda' ? '#9fd3ff' : '#ffd23f'; x.font = 'bold 20px sans-serif'; x.fillText(h.txt, h.x - 15, 260 - (0.3 - h.t) * 120); }
    },
    click() {},
  };
}
