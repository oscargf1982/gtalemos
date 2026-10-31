'use strict';
/* ==========================================================
   LEMOS 27400 · Paseo do Malecón: manifestación "NON Á PONTE"
   e Feira do Viño con carpas de venda ambulante
   ========================================================== */
G.fair = null;
/* logo da asociación «Salvemos o Malecón» (achegado polo autor) */
const LOGO = { img: null, ready: false, wait: [] };
(function () { const im = new Image(); im.onload = () => { LOGO.ready = true; LOGO.img = im; LOGO.wait.forEach(f => f()); LOGO.wait = []; }; im.src = 'img/salvemos-malecon.jpg'; })();
function withLogo(fn) { if (LOGO.ready) fn(); else LOGO.wait.push(fn); }
/* pancarta de man: logo arriba e lema embaixo */
function signTex(text, sub, bg = '#f4f1e6', fg = '#c0201f') {
  const W = 256, H = 210, c = cnv(W, H), x = c.getContext('2d'), tex = toTex(c, false);
  const draw = () => {
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(0,0,0,.13)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo((i * 53 + 17) % W, 0); x.lineTo((i * 71 + 40) % W, H); x.stroke(); } // cartón
    if (LOGO.ready) { x.save(); x.beginPath(); x.arc(W / 2, 60, 56, 0, 7); x.clip(); x.drawImage(LOGO.img, W / 2 - 58, 2, 116, 116); x.restore(); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 40; x.font = `900 ${fs}px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif`;
    while (x.measureText(text).width > 240 && fs > 24) { fs -= 2; x.font = `900 ${fs}px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif`; }
    x.fillText(text, W / 2, sub ? 146 : 158);
    if (sub) { x.font = '700 19px Barlow, sans-serif'; x.fillStyle = '#222'; x.fillText(sub, W / 2, 184); }
    tex.needsUpdate = true;
  };
  draw(); withLogo(draw);
  return tex;
}
/* pancarta grande: logos nos extremos e lema no medio */
function bannerTex(text, sub) {
  const W = 1024, H = 172, c = cnv(W, H), x = c.getContext('2d'), tex = toTex(c, false);
  const draw = () => {
    x.fillStyle = '#f4f1e6'; x.fillRect(0, 0, W, H); x.strokeStyle = '#2f6aa3'; x.lineWidth = 6; x.strokeRect(5, 5, W - 10, H - 10);
    if (LOGO.ready) for (const cx of [86, W - 86]) { x.save(); x.beginPath(); x.arc(cx, H / 2, 74, 0, 7); x.clip(); x.drawImage(LOGO.img, cx - 76, H / 2 - 76, 152, 152); x.restore(); }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#c0201f'; x.font = '900 92px "Big Shoulders Display", "Arial Narrow", Impact, sans-serif'; x.fillText(text, W / 2, 70);
    x.fillStyle = '#1f3f73'; x.font = '700 30px Barlow, sans-serif'; x.fillText(sub, W / 2, 138);
    tex.needsUpdate = true;
  };
  draw(); withLogo(draw);
  return tex;
}
function stripeCanvasTex(a, b) { const c = cnv(64, 64), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * 8, 0, 8, 64); } return toTex(c, false); }
function makeTent(col, label) {
  const g = new THREE.Group(), W = 3.6, D = 3.0, H = 2.4;
  const canvasM = new THREE.MeshStandardMaterial({ map: stripeCanvasTex('#f4f1e6', col), roughness: 0.9, side: THREE.DoubleSide });
  const poleM = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.8, roughness: 0.3 });
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, H, 8), poleM); p.position.set(x, H / 2, z); g.add(p); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(W, D) / 2 * 1.02, 1.1, 4, 1, true), canvasM); roof.rotation.y = Math.PI / 4; roof.scale.set(W / D * 0.86, 1, 1); roof.position.y = H + 0.55; roof.castShadow = true; g.add(roof);
  const valance = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.32, D + 0.04), canvasM); valance.position.y = H - 0.12; g.add(valance);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), canvasM); back.position.set(0, H / 2, -D / 2); g.add(back);
  // mostrador con mantel e botellas de viño
  const counter = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, 0.95, 0.7), new THREE.MeshStandardMaterial({ color: 0x7a1f3d, roughness: 0.9 })); counter.position.set(0, 0.48, D / 2 - 0.45); counter.castShadow = true; g.add(counter);
  const top = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.04, 0.8), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 })); top.position.set(0, 0.97, D / 2 - 0.45); g.add(top);
  const bottleG = mergeGeos([xform(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 10), 0, 0.11, 0), xform(new THREE.CylinderGeometry(0.014, 0.04, 0.08, 10), 0, 0.26, 0)]);
  const bm = [new THREE.MeshStandardMaterial({ color: 0x2a0812, roughness: 0.1, metalness: 0.3 }), new THREE.MeshStandardMaterial({ color: 0x1d3a1a, roughness: 0.1, metalness: 0.3 })];
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(bottleG, bm[i % 3 === 0 ? 1 : 0]); b.position.set(-W / 2 + 0.35 + (i % 7) * 0.48, 0.99, D / 2 - 0.6 + Math.floor(i / 7) * 0.28); g.add(b); }
  for (let i = 0; i < 5; i++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.3, transparent: true, opacity: 0.8 })); cup.position.set(-0.8 + i * 0.4, 1.03, D / 2 - 0.2); g.add(cup); }
  // estante de caixas e barrís
  for (let i = 0; i < 3; i++) { const bx = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: 0xa9875a, roughness: 0.95 })); bx.position.set(-1 + i * 0.7, 0.18 + (i % 2) * 0.35, -D / 2 + 0.35); g.add(bx); }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.9, 14), MAT.wood); barrel.position.set(W / 2 + 0.6, 0.45, D / 2 - 0.3); barrel.castShadow = true; g.add(barrel);
  // letreiro da adega
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, 0.5), new THREE.MeshStandardMaterial({ map: textTex(label, { w: 512, h: 72, bg: '#2a1a12', fg: '#f2d48a', size: 42 }), roughness: 0.6 }));
  sg.position.set(0, H - 0.12, D / 2 + 0.03); g.add(sg);
  return g;
}
const PROTEST_SIGNS = [['NON Á PONTE'], ['NON Á PONTE', 'Salvemos o Malecón'], ['NON Á PONTE NOVA'], ['O MALECÓN NON SE TOCA'], ['NON Á PONTE', 'Veciñanza de Monforte'], ['MÁIS RÍO, MENOS FORMIGÓN']];
const WINE_STALLS = [['ADEGA VAL DE LEMOS', '#7a1f3d'], ['MENCÍA · RIBEIRA SACRA', '#5a1428'], ['ADEGAS DO SIL', '#2f5a3a'], ['GODELLO E MENCÍA', '#8a5a1c'], ['VIÑOS DE AMANDI', '#24425e']];
function initFair() {
  const M = LM.malecon, L = M.path.len, scene = G.scene;
  const F = { protesters: [], signs: [], vendors: [], buyers: [], group: new THREE.Group() };
  scene.add(F.group); worksMats();
  const at = (s, off) => maleconAt(s, off), bank = s => Math.max(6.5, maleconBank(s) - 1.2);
  const yawRiver = q => Math.atan2(q.nx, q.nz), yawLand = q => Math.atan2(-q.nx, -q.nz);
  // rúa pechada ao tráfico durante a feira: barreiras nos extremos e grafo cortado
  for (const [s, dir] of [[2, 1], [L - 2, -1]]) for (const o of [-2.2, 0, 2.2]) { const q = at(s, o), b = makeBarrier(); b.position.set(q.x, groundH(q.x, q.z), q.z); b.rotation.y = Math.atan2(q.ux, q.uz) + Math.PI / 2 - Math.PI / 2 + (dir > 0 ? 0 : Math.PI); F.group.add(b); }
  for (const s of [2, L - 2]) { const q = at(s, 0); addOBB(q.x, q.z, 0.4, 3.4, Math.atan2(-q.uz, q.ux), 1.4, 'feira'); }
  if (M.road) for (const n of NODES) for (const e of n.edges) if (e.road.name === 'Paseo do Malecón') { const mx = (n.x + e.to.x) / 2, mz = (n.z + e.to.z) / 2, h = nearestOnPath(M.path, mx, mz); if (h.d < 4 && h.s > 1 && h.s < L - 1) e.blocked = true; }
  // arco de entrada da feira (lado da Ponte Vella)
  {
    const q = at(L - 6, 0), yaw = Math.atan2(q.ux, q.uz);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.3), new THREE.MeshStandardMaterial({ map: textTex('FEIRA DO VIÑO DE MONFORTE', { w: 1024, h: 110, bg: '#7a1f3d', fg: '#ffd75e', size: 72, border: '#ffd75e' }), roughness: 0.7, side: THREE.DoubleSide }));
    banner.position.set(q.x, groundH(q.x, q.z) + 4.6, q.z); banner.rotation.y = yaw; F.group.add(banner);
    for (const o of [-4.6, 4.6]) { const r = at(L - 6, o), p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.2, 10), MAT.metalDark); p.position.set(r.x, groundH(r.x, r.z) + 2.6, r.z); p.castShadow = true; F.group.add(p); addCircCol0(r.x, r.z, 0.2, 5); }
  }
  // carpas de viño na calzada (lado de terra), mirando cara ao río
  const C = world.crowd, take = () => C.peds.find(q => q.state === 'walk' && !q.npc && q !== G.player.ped);
  const reserve = (p, extra) => { Object.assign(p, { state: 'npc', home: 'npc', npc: 'feira', manual: true, immune: true, visible: true, sit: 0, lie: 0, walk: 0, run: 0, edge: null }, extra); };
  WINE_STALLS.forEach(([label, col], i) => {
    const s = L - 14 - i * 11; if (s < 8) return;
    const q = at(s, -1.4), y = groundH(q.x, q.z);
    const t = makeTent(col, label); t.position.set(q.x, y + 0.02, q.z); t.rotation.y = yawRiver(q); F.group.add(t);
    addOBB(q.x, q.z, 1.8, 1.5, Math.atan2(-q.uz, q.ux), 2.6, 'carpa');
    const v = take(); if (v) { reserve(v, {}); const w = at(s + RR(-0.8, 0.8), -2.0); v.x = w.x; v.z = w.z; v.y = groundH(w.x, w.z); v.yaw = yawRiver(q); v.col.shirt = pick(['#f2efe6', '#7a1f3d', '#2a2a2e']); C.paint(v); v.ph = R() * 6; F.vendors.push(v); }
    for (let k = 0; k < 2; k++) { const b = take(); if (!b) break; reserve(b, {}); const w = at(s + (k ? 0.8 : -0.8), 1.6 + R() * 0.8); b.x = w.x; b.z = w.z; b.y = groundH(w.x, w.z); b.yaw = yawLand(q) + RR(-0.3, 0.3); b.ph = R() * 6; F.buyers.push(b); }
  });
  // manifestación: na beira e na calzada, coas pancartas
  const signMats = PROTEST_SIGNS.map(([t, sub]) => new THREE.MeshStandardMaterial({ map: signTex(t, sub), roughness: 0.9, side: THREE.DoubleSide }));
  const stick = new THREE.CylinderGeometry(0.025, 0.025, 1.3, 6), stickM = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.9 });
  const sEnd = Math.max(14, L - 14 - WINE_STALLS.length * 11);
  F.sRange = [4, sEnd]; F.at = at; F.bank = bank;
  const N = 22;
  for (let i = 0; i < N; i++) {
    const p = take(); if (!p) break;
    reserve(p, {}); p.hs = RR(F.sRange[0], F.sRange[1]); p.ho = RR(-2, bank(p.hs) - 0.5); const q = at(p.hs, p.ho); p.x = q.x; p.z = q.z; p.y = groundH(p.x, p.z); p.ph = R() * 6; p.yaw = yawLand(q) + RR(-0.6, 0.6);
    F.protesters.push(p);
    if (i % 3 !== 2) {
      const g = new THREE.Group(); const board = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.82), signMats[i % signMats.length]); board.position.y = 0.7; board.castShadow = true; g.add(board);
      const st = new THREE.Mesh(stick, stickM); st.position.y = 0; g.add(st); F.group.add(g); F.signs.push({ g, p });
    }
  }
  // gran pancarta colectiva, de cara á rúa
  {
    const sm = (F.sRange[0] + F.sRange[1]) / 2, q = at(sm, Math.min(4, bank(sm) - 1.5)), y = groundH(q.x, q.z);
    const big = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.2), new THREE.MeshStandardMaterial({ map: bannerTex('NON Á PONTE', 'Asociación Salvemos o Malecón · Monforte'), roughness: 0.9, side: THREE.DoubleSide }));
    big.position.set(q.x, y + 1.9, q.z); big.rotation.y = Math.atan2(q.ux, q.uz) + Math.PI / 2; F.group.add(big); F.big = big;
    for (const s2 of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), stickM); p.position.set(q.x + q.ux * s2 * 3.6, y + 1.2, q.z + q.uz * s2 * 3.6); F.group.add(p); }
    F.bigX = q.x; F.zm = q.z;
  }
  G.fair = F;
}
function updateFair(dt) {
  const F = G.fair; if (!F) return;
  const t = G.t;
  for (const p of F.protesters) {
    // camiñan devagar, paran, berran consignas e axitan as pancartas
    if (!p.tgt || p.tt <= 0) { const ts = clamp(p.hs + RR(-4, 4), F.sRange[0], F.sRange[1]), to = clamp(p.ho + RR(-1.5, 1.5), -2, F.bank(ts) - 0.5), q = F.at(ts, to); p.tgt = [q.x, q.z]; p.tt = RR(2, 6); }
    p.tt -= dt;
    const dx = p.tgt[0] - p.x, dz = p.tgt[1] - p.z, d = Math.hypot(dx, dz);
    if (d > 0.4) { p.yaw += angDiff(p.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); p.x += dx / d * 0.7 * dt; p.z += dz / d * 0.7 * dt; p.walk = lerp(p.walk, 0.6, dt * 4); p.phase += dt * 3; }
    else { p.walk = lerp(p.walk, 0, dt * 4); p.yaw += angDiff(p.yaw, Math.atan2(F.bigX - p.x, F.zm - p.z) + Math.PI + Math.sin(p.ph) * 0.8) * dt; }
    p.y = groundH(p.x, p.z);
    p.armUp = 0.85 + 0.15 * Math.sin(t * 4 + p.ph); p.nod = Math.max(0, Math.sin(t * 5 + p.ph)) * 0.18;
  }
  for (const s of F.signs) {
    const p = s.p, sc = p.scale || 1, bob = Math.sin(t * 4 + p.ph) * 0.12;
    const hx = Math.cos(p.yaw) * 0.25 * sc, hz = -Math.sin(p.yaw) * 0.25 * sc;
    s.g.position.set(p.x + hx + Math.sin(p.yaw) * 0.25, p.y + 2.05 * sc + bob, p.z + hz + Math.cos(p.yaw) * 0.25);
    s.g.rotation.set(0, p.yaw, Math.sin(t * 3 + p.ph) * 0.12);
  }
  for (const v of F.vendors) { v.walk = 0; v.armUp = 0.3 + 0.3 * Math.max(0, Math.sin(t * 1.5 + v.ph)); v.nod = Math.sin(t * 2 + v.ph) * 0.06; }
  for (const b of F.buyers) { b.walk = 0; const sip = Math.sin(t * 0.8 + b.ph) > 0.6; b.armUp = lerp(b.armUp, sip ? 1 : 0.35, dt * 3); b.look = Math.sin(t * 0.4 + b.ph) * 0.4; }
  // consignas cando o xogador está preto
  const me = G.player.car || G.player.ped, d = Math.hypot(me.x - F.bigX, me.z - F.zm);
  F.chantT = (F.chantT || 0) - dt;
  if (d < 45 && F.chantT <= 0 && G.started) { F.chantT = RR(7, 12); if (G.sfx.chant) G.sfx.chant(); if (d < 25) toast(pick(['«Non á ponte! Non á ponte!»', '«O Cabe é de todos!»', '«Ponte non, río si!»']), 2); }
}
