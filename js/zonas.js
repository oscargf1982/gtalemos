'use strict';
/* ==========================================================
   GTA LEMOS 27400 · dúas rúas con personalidade
   1) Rúa dos Abeledos: a imaxe da degradación. Edificios esventrados
      e queimados, cascallos, coches calcinados, fumes, farolas
      tombadas e unha calzada chea de fochas, coma despois dunha
      gran explosión.
   2) Rúa de Rosalía de Castro (á dereita ao saír da Praza da
      Estación): un rabaño de VACAS paseando e deixando boñigas
      no asfalto.
   ========================================================== */
const ABEL = { pts: [[-338, 132], [-357, 112], [-378, 95], [-417, 67], [-531, 5], [-539, -1], [-584, -36], [-604, -48]], half: 24 };
function corridorPoly(pts, w) {
  const L = [], Rt = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    L.push([pts[i][0] + nx * w, pts[i][1] + nz * w]); Rt.push([pts[i][0] - nx * w, pts[i][1] - nz * w]);
  }
  return L.concat(Rt.reverse());
}
function zonasLandmarks() {
  // en tramos para que o polígono non se cruce consigo mesmo
  for (let i = 0; i < ABEL.pts.length - 1; i++) { const P = corridorPoly([ABEL.pts[i], ABEL.pts[i + 1]], ABEL.half); reserve(P); (G.noTrees = G.noTrees || []).push(P); (G.keepEmpty = G.keepEmpty || []).push(P); }
  G.namedZones.push({ n: 'Rúa dos Abeledos · zona catastrófica', p: corridorPoly(ABEL.pts, 14) });
}
/* ---------- texturas ---------- */
function ruinWallTex(base) {
  const c = cnv(256, 256), x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  // revestimento caído: ladrillo á vista
  for (let i = 0; i < 6; i++) { const u = R() * 200, v = R() * 200, w = RR(40, 110), h = RR(30, 90); x.save(); x.beginPath(); x.ellipse(u + w / 2, v + h / 2, w / 2, h / 2, R(), 0, 7); x.clip(); for (let yy = v; yy < v + h; yy += 8) for (let xx = u - 20 + ((yy / 8) % 2) * 10; xx < u + w; xx += 20) { x.fillStyle = `rgb(${130 + RR(-20, 20)},${60 + RR(-10, 10)},${45 + RR(-10, 10)})`; x.fillRect(xx, yy, 18, 6); } x.restore(); }
  // ventás baleiras, negras, con marcas de lume
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { if (R() < 0.15) continue; const u = 22 + k * 80, v = 26 + r * 80; x.fillStyle = '#0b0b0c'; x.fillRect(u, v, 38, 46); const g = x.createLinearGradient(0, v - 30, 0, v); g.addColorStop(0, 'rgba(10,10,10,0)'); g.addColorStop(1, 'rgba(10,10,10,.85)'); x.fillStyle = g; x.beginPath(); x.moveTo(u - 8, v); x.quadraticCurveTo(u + 19, v - 50, u + 46, v); x.fill(); }
  // fendas, follín e manchas
  x.strokeStyle = 'rgba(20,20,20,.7)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { let u = R() * 256, v = R() * 256; x.beginPath(); x.moveTo(u, v); for (let k = 0; k < 6; k++) { u += RR(-14, 14); v += RR(6, 20); x.lineTo(u, v); } x.stroke(); }
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${R() < 0.7 ? '20,18,16' : '120,110,90'},${RR(0.03, 0.12)})`; x.fillRect(R() * 256, R() * 256, RR(1, 4), RR(1, 4)); }
  // pintadas
  x.font = '900 26px Impact, sans-serif'; x.fillStyle = pick(['rgba(200,30,30,.75)', 'rgba(30,120,200,.7)', 'rgba(40,160,60,.7)']); x.save(); x.translate(30, 230); x.rotate(-0.08); x.fillText(pick(['ABELEDOS ESQUECIDO', 'SOS', 'AXUDA', 'NON HAI FUTURO', 'ALCALDE ONDE ESTÁS?', 'PERIGO']), 0, 0); x.restore();
  return toTex(c);
}
function crackedTex() {
  const c = cnv(256, 256), x = c.getContext('2d'); x.clearRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(15,15,15,.85)'; x.lineWidth = 2;
  for (let i = 0; i < 14; i++) { let u = R() * 256, v = R() * 256; x.beginPath(); x.moveTo(u, v); for (let k = 0; k < 8; k++) { u += RR(-22, 22); v += RR(-22, 22); x.lineTo(u, v); } x.stroke(); }
  return toTex(c);
}
/* ---------- Rúa dos Abeledos ---------- */
function buildAbeledos(B, scene) {
  const A = G.abel = { potholes: [], fires: [], smokeT: 0 };
  const wallMats = ['#b8a890', '#9a9488', '#c2b49a', '#8a8478', '#a89880'].map(c => new THREE.MeshStandardMaterial({ map: ruinWallTex(c), roughness: 0.95 }));
  const WB = wallMats.map(m => new Batch(m));
  const roads = ROADS.filter(r => r.name === 'Rúa dos Abeledos');
  const segs = []; for (let i = 0; i < ABEL.pts.length - 1; i++) segs.push([ABEL.pts[i], ABEL.pts[i + 1]]);
  const concrete = '#8f8b84', brick = '#8a4a36', ash = '#2a2826';
  const rub = (x, z, n, r, cols) => { for (let i = 0; i < n; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * r, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, s = RR(0.2, 0.9) * (1 - d / r * 0.5); const b = boxGeo(s * RR(0.8, 1.6), s * RR(0.4, 0.9), s * RR(0.8, 1.4)); xform(b, px, groundH(px, pz) + s * 0.25 + (1 - d / r) * 0.6, pz, R() * 6, RR(-0.5, 0.5), RR(-0.5, 0.5)); B.vcol.add(colorize(b, pick(cols))); } };
  // edificios esventrados aos dous lados
  for (const [a, b] of segs) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, yaw = Math.atan2(ux, uz);
    for (let s = 6; s < L - 6; s += RR(11, 15)) for (const side of [-1, 1]) {
      if (R() < 0.12) { const cx = a[0] + ux * s + nx * side * 12, cz = a[1] + uz * s + nz * side * 12; rub(cx, cz, 40, 5, [concrete, brick, ash, '#6a6660']); continue; } // solar baleiro con cascallos
      const W = RR(8, 11), D = RR(7, 10), H = RR(5, 14), off = 6.5 + D / 2, cx = a[0] + ux * s + nx * side * off, cz = a[1] + uz * s + nz * side * off, y0 = groundH(cx, cz);
      const wb = pick(WB), loc = (lx, lz) => [cx + ux * lx + nx * side * lz, cz + uz * lx + nz * side * lz];
      // paredes como franxas verticais de altura irregular (perfil esnaquizado)
      const wall = (lx0, lz0, lx1, lz1, hMax, holeChance) => {
        const len = Math.hypot(lx1 - lx0, lz1 - lz0), n = Math.max(2, Math.round(len / 1.1)), [ax0, az0] = loc(lx0, lz0), [ax1, az1] = loc(lx1, lz1), th = Math.atan2(-(az1 - az0), ax1 - ax0);
        let h = hMax * RR(0.5, 1);
        for (let i = 0; i < n; i++) {
          h = clamp(h + RR(-2.2, 2.0), 0.6, hMax); if (R() < holeChance) { h = RR(0.3, 1.4); }
          const t = (i + 0.5) / n, px = lerp(ax0, ax1, t), pz = lerp(az0, az1, t);
          const g = boxGeo(len / n + 0.05, h + 1.5, 0.35, [4, 4]); xform(g, px, y0 + h / 2 - 0.75, pz, th);
          wb.add(g);
        }
      };
      wall(-W / 2, -D / 2, W / 2, -D / 2, H, 0.18);      // fachada á rúa
      wall(-W / 2, D / 2, W / 2, D / 2, H * 0.8, 0.1);   // traseira
      wall(-W / 2, -D / 2, -W / 2, D / 2, H * 0.9, 0.2); // laterais
      wall(W / 2, -D / 2, W / 2, D / 2, H * 0.7, 0.3);
      // forxados caídos (lousas inclinadas) e varillas
      for (let f = 1; f < H / 3; f++) { if (R() < 0.35) continue; const [px, pz] = loc(RR(-1, 1), RR(-1, 1)), sl = boxGeo(W * RR(0.5, 0.9), 0.22, D * RR(0.5, 0.9)); xform(sl, px, y0 + f * 3 - RR(0, 1.2), pz, yaw + RR(-0.2, 0.2), RR(-0.35, 0.35), RR(-0.35, 0.35)); B.vcol.add(colorize(sl, concrete)); }
      for (let i = 0; i < 6; i++) { const [px, pz] = loc(RR(-W / 2, W / 2), -D / 2), rb = new THREE.CylinderGeometry(0.02, 0.02, RR(1, 2.2), 4); xform(rb, px, y0 + RR(2, H), pz, R() * 6, RR(-0.8, 0.8), RR(-0.8, 0.8)); B.metalDark.add(rb); }
      // cascallos dentro e diante
      { const [px, pz] = loc(0, -D / 2 - 1.2); rub(px, pz, 18, 2.8, [concrete, brick, ash]); const [qx, qz] = loc(RR(-2, 2), RR(-1, 2)); rub(qx, qz, 22, 3.5, [concrete, brick, ash, '#5a3a2a']); }
      addOBB(cx, cz, W / 2, D / 2, -yaw, y0 + H, 'ruína', y0 - 2);
      if (R() < 0.35) A.fires.push([...loc(RR(-2, 2), RR(-1, 2)), y0]);
    }
  }
  WB.forEach(b => b.build(scene));
  // fochas, parches, fendas e auga estancada na calzada
  const crackM = new THREE.MeshBasicMaterial({ map: crackedTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6 });
  const holeM = std({ color: 0x1e1d1b, roughness: 1, polygonOffset: true, polygonOffsetFactor: -5 }), puddleM = std({ color: 0x3a4a52, roughness: 0.05, metalness: 0.4, polygonOffset: true, polygonOffsetFactor: -6 }), rimM = std({ color: 0x55524c, roughness: 1 });
  for (const r of roads) {
    if (!r.pts.some(([x, z]) => segs.some(([a, b]) => Math.min(Math.hypot(x - a[0], z - a[1]), Math.hypot(x - b[0], z - b[1])) < 40))) continue;
    for (let s = 2; s < r.len; s += RR(2.5, 5)) {
      const p = roadPoint(r, s); if (!segs.some(([a, b]) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz, t = clamp(((p.x - a[0]) * dx + (p.z - a[1]) * dz) / L2, 0, 1); return Math.hypot(p.x - a[0] - dx * t, p.z - a[1] - dz * t) < 3; })) continue;
      const off = RR(-r.hw + 0.6, r.hw - 0.6), x = p.x - p.uz * off, z = p.z + p.ux * off, y = groundH(x, z), rad = RR(0.4, 1.4);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(rad, 9), R() < 0.3 ? puddleM : holeM); hole.rotation.x = -Math.PI / 2; hole.rotation.z = R() * 6; hole.scale.set(1, RR(0.6, 1), 1); hole.position.set(x, y + 0.075, z); scene.add(hole);
      for (let k = 0; k < 5; k++) { const a = R() * 6.28, b = boxGeo(RR(0.15, 0.4), 0.08, RR(0.1, 0.3)); xform(b, x + Math.cos(a) * rad * 1.05, y + 0.08, z + Math.sin(a) * rad * 1.05, R() * 6); B.vcol.add(colorize(b, '#4a4844')); }
      A.potholes.push({ x, z, r: rad, hit: 0 });
      if (R() < 0.5) { const c = new THREE.Mesh(new THREE.PlaneGeometry(RR(3, 6), RR(3, 6)), crackM); c.rotation.x = -Math.PI / 2; c.rotation.z = R() * 6; c.position.set(x + RR(-1, 1), y + 0.08, z + RR(-1, 1)); scene.add(c); }
    }
  }
  // coches calcinados, contedores queimados e farolas tombadas
  const burnt = std({ color: 0x2a2420, roughness: 0.9, metalness: 0.3 }), rust = std({ color: 0x6a3a1e, roughness: 0.95 });
  for (let i = 0; i < 7; i++) {
    const [a, b] = pick(segs), t = RR(0.1, 0.9), side = R() < 0.5 ? -1 : 1, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), x = a[0] + dx * t + (-dz / L) * side * 4.2, z = a[1] + dz * t + (dx / L) * side * 4.2, y = groundH(x, z);
    const car = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4.0), R() < 0.5 ? burnt : rust); body.position.y = 0.45; car.add(body); const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.0), burnt); cab.position.set(0, 1.05, -0.2); cab.rotation.z = RR(-0.15, 0.15); car.add(cab);
    for (const [wx, wz] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) if (R() < 0.7) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), std({ color: 0x151515 })); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.2, wz); car.add(w); }
    car.position.set(x, y - (R() < 0.4 ? 0.15 : 0), z); car.rotation.set(RR(-0.08, 0.08), Math.atan2(dx, dz) + RR(-0.6, 0.6), R() < 0.15 ? Math.PI * 0.5 * (R() < 0.5 ? 1 : -1) : RR(-0.1, 0.1)); car.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(car);
    addOBB(x, z, 0.9, 2.1, -car.rotation.y, y + 1.4, 'coche queimado', y - 1);
    if (R() < 0.5) A.fires.push([x, z, y + 0.8]);
  }
  for (let i = 0; i < 6; i++) { const [a, b] = pick(segs), t = RR(0.1, 0.9), side = R() < 0.5 ? -1 : 1, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), x = a[0] + dx * t + (-dz / L) * side * 4.6, z = a[1] + dz * t + (dx / L) * side * 4.6, y = groundH(x, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 6), MAT.metalDark); pole.geometry.translate(0, 3, 0); pole.position.set(x, y, z); pole.rotation.set(RR(0.9, 1.45) * (R() < 0.5 ? 1 : -1), R() * 6, 0, 'YXZ'); pole.castShadow = true; scene.add(pole); }
  // chamas
  A.flames = A.fires.slice(0, 10).map(([x, z, y]) => { const f = medFlame(RR(1.6, 2.6)); f.position.set(x, (y || groundH(x, z)) + 0.8, z); scene.add(f); return { f, x, z, y: y || groundH(x, z), ph: R() * 6 }; });
  A.light = new THREE.PointLight(0xff7a2a, 0, 30, 1.6); scene.add(A.light);
}
function updateAbeledos(dt) {
  const A = G.abel; if (!A) return;
  const cam = camera.position, t = G.t;
  let nearF = null, nd = 1e9;
  for (const F of A.flames) { const d = Math.hypot(F.x - cam.x, F.z - cam.z); F.f.visible = d < 160; if (!F.f.visible) continue; F.f.scale.set(F.f.userData.base * 0.36 * (1 + Math.sin(t * 13 + F.ph) * 0.12), F.f.userData.base * 0.72 * (1 + Math.sin(t * 17 + F.ph) * 0.15), 1); if (d < nd) { nd = d; nearF = F; } }
  if (nearF && nd < 90) { A.light.position.set(nearF.x, nearF.y + 2, nearF.z); A.light.intensity = 1.2 + Math.sin(t * 11) * 0.3; } else A.light.intensity = 0;
  A.smokeT -= dt;
  if (A.smokeT <= 0) { A.smokeT = 0.12; for (const F of A.flames) if (Math.hypot(F.x - cam.x, F.z - cam.z) < 150 && R() < 0.5) world.smoke.emit(F.x + RR(-0.5, 0.5), F.y + 1.5, F.z + RR(-0.5, 0.5), RR(-0.2, 0.2), RR(1.2, 2.2), RR(-0.2, 0.2), 0.9, 4, 0x2a2826, 0.5); }
  // as fochas: sacudidas ao pasar co coche
  const car = G.player.car;
  if (car && car.speed > 3) for (const h of A.potholes) if (Math.abs(car.x - h.x) < 2 && Math.abs(car.z - h.z) < 2 && Math.hypot(car.x - h.x, car.z - h.z) < h.r + 0.6 && G.t - h.hit > 1) {
    h.hit = G.t; G.shake = Math.min(1, 0.25 + car.speed * 0.03); car.landJolt = 0.6 + car.speed * 0.03; car.vx *= 0.93; car.vz *= 0.93; if (G.sfx.thud) G.sfx.thud(0.5, car);
    if (car.speed > 12 && car.health !== undefined) car.health -= 2;
    if (!A.warned) { A.warned = true; toast('Rúa dos Abeledos: as fochas comen as rodas. Vai amodo!', 3); }
  }
}
/* ---------- Rúa de Rosalía de Castro: vacas e boñigas ---------- */
function cowTex() {
  const c = cnv(256, 128), x = c.getContext('2d'); x.fillStyle = '#f2efe8'; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#1b1b1d'; for (let i = 0; i < 9; i++) { x.beginPath(); const u = R() * 256, v = R() * 128; x.moveTo(u, v); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, r = RR(10, 26); x.lineTo(u + Math.cos(a) * r * 1.3, v + Math.sin(a) * r); } x.fill(); }
  return toTex(c);
}
function makeCow() {
  const g = new THREE.Group(), hide = std({ map: cowTex(), roughness: 0.9 }), dark = std({ color: 0x1b1b1d, roughness: 0.9 }), pink = std({ color: 0xe8a0a0, roughness: 0.7 }), horn = std({ color: 0xe8e0c8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 1.8), hide); body.position.y = 1.15; body.castShadow = true; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), hide); belly.scale.set(0.95, 0.75, 1.6); belly.position.y = 1.05; g.add(belly);
  const head = new THREE.Group(); head.position.set(0, 1.45, 1.0); g.add(head);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.55), hide); hd.position.z = 0.2; head.add(hd);
  const sn = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.2), pink); sn.position.set(0, -0.1, 0.52); head.add(sn);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), horn); h.position.set(s * 0.18, 0.28, 0.1); h.rotation.z = -s * 0.7; head.add(h); const e = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.12), hide); e.position.set(s * 0.28, 0.12, 0.05); e.rotation.z = s * 0.3; head.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), dark); ey.position.set(s * 0.2, 0.08, 0.36); head.add(ey); }
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.14, 8), std({ color: 0xc9a440, metalness: 0.8, roughness: 0.3 })); bell.position.set(0, -0.3, 0.15); head.add(bell);
  const udder = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), pink); udder.position.set(0, 0.68, -0.4); g.add(udder);
  const legs = [];
  for (const [x, z] of [[-0.3, 0.65], [0.3, 0.65], [-0.3, -0.65], [0.3, -0.65]]) { const l = new THREE.Group(); l.position.set(x, 0.8, z); g.add(l); const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.16), hide); m.position.y = -0.4; l.add(m); const hf = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.18), dark); hf.position.y = -0.8; l.add(hf); legs.push(l); }
  const tail = new THREE.Group(); tail.position.set(0, 1.5, -0.9); g.add(tail); const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.75, 5), hide); tl.position.y = -0.37; tail.add(tl); const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), dark); tuft.position.y = -0.75; tail.add(tuft);
  g.userData = { head, legs, tail };
  return g;
}
function makePoop() {
  const g = new THREE.Group(), m = std({ color: 0x4a3418, roughness: 0.35, metalness: 0.05 });
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28 - i * 0.07, 10, 6), m); b.scale.y = 0.3; b.position.set(RR(-0.04, 0.04), 0.04 + i * 0.06, RR(-0.04, 0.04)); g.add(b); }
  const splat = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), std({ color: 0x3a2812, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -5 })); splat.rotation.x = -Math.PI / 2; splat.position.y = 0.01; splat.scale.set(1, RR(0.6, 1), 1); g.add(splat);
  return g;
}
function initCows() {
  const r = ROADS.find(q => q.name === 'Rúa de Rosalía de Castro'); if (!r || G.cows) return;
  const C = G.cows = { road: r, cows: [], poops: [], mooT: 4 };
  const poop = (s, off) => { const p = roadPoint(r, s), x = p.x - p.uz * off, z = p.z + p.ux * off, g = makePoop(); g.position.set(x, groundH(x, z) + 0.06, z); g.rotation.y = R() * 6; G.scene.add(g); C.poops.push({ g, x, z, step: 0 }); };
  for (let s = 2; s < r.len - 1; s += RR(3, 6)) poop(s, RR(-r.hw + 0.8, r.hw - 0.8));
  for (let i = 0; i < 6; i++) { const g = makeCow(); G.scene.add(g); C.cows.push({ g, s: RR(4, r.len - 4), off: RR(-2, 2), dir: R() < 0.5 ? 1 : -1, v: RR(0.35, 0.6), ph: R() * 6, wait: RR(0, 4), poopT: RR(15, 40), yaw: 0 }); }
}
function updateCows(dt) {
  const C = G.cows; if (!C) { if (typeof ROADS !== 'undefined') initCows(); return; }
  const r = C.road, cam = camera.position, t = G.t, me = G.player.car || G.player.ped;
  for (const c of C.cows) {
    const U = c.g.userData; c.wait -= dt;
    let moving = c.wait <= 0;
    if (moving) { c.s += c.dir * c.v * dt; if (c.s > r.len - 1 || c.s < 1) { c.dir *= -1; c.wait = RR(2, 6); } if (R() < dt * 0.05) c.wait = RR(2, 7); }
    const p = roadPoint(r, c.s), x = p.x - p.uz * c.off, z = p.z + p.ux * c.off;
    // apártanse un pouco se o xogador está enriba
    const dme = Math.hypot(me.x - x, me.z - z); if (dme < 2.2) c.off = clamp(c.off + Math.sign(c.off - ((me.x - p.x) * -p.uz + (me.z - p.z) * p.ux) || 1) * dt * 1.5, -r.hw + 1, r.hw - 1);
    const ty = Math.atan2(p.ux * c.dir, p.uz * c.dir); c.yaw += angDiff(c.yaw, ty) * Math.min(1, dt * 2);
    c.g.position.set(x, groundH(x, z), z); c.g.rotation.y = c.yaw;
    c.ph += dt * (moving ? 4 : 0);
    U.legs.forEach((l, i) => l.rotation.x = moving ? Math.sin(c.ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.35 : 0);
    U.tail.rotation.z = Math.sin(t * 2 + c.ph) * 0.4; U.head.rotation.x = moving ? 0.1 : 0.45 + Math.sin(t * 0.8 + c.ph) * 0.15; // pacendo cando para
    // ... e deixa as súas boñigas
    c.poopT -= dt; if (c.poopT <= 0 && C.poops.length < 70) { c.poopT = RR(25, 60); const g = makePoop(), bx = x - Math.sin(c.yaw) * 1.0, bz = z - Math.cos(c.yaw) * 1.0; g.position.set(bx, groundH(bx, bz) + 0.06, bz); g.rotation.y = R() * 6; G.scene.add(g); C.poops.push({ g, x: bx, z: bz, step: 0 }); }
    // os coches non as atravesan: o do xogador para en seco
    const car = G.player.car; if (car && Math.hypot(car.x - x, car.z - z) < 2.2 && car.speed > 1) { car.vx *= 0.6; car.vz *= 0.6; if (!c.mooed || G.t - c.mooed > 3) { c.mooed = G.t; cowMoo(x, z); toast('MUUUU! Cuidado coas vacas!', 2); } }
  }
  // mumús de cando en vez
  C.mooT -= dt; if (C.mooT <= 0) { C.mooT = RR(5, 12); const c = pick(C.cows), p = c.g.position; if (Math.hypot(cam.x - p.x, cam.z - p.z) < 60) cowMoo(p.x, p.z); }
  // pisar unha boñiga
  if (!G.player.car) { const pp = G.player.ped; for (const b of C.poops) if (Math.abs(pp.x - b.x) < 0.6 && Math.abs(pp.z - b.z) < 0.6 && G.t - b.step > 4) { b.step = G.t; if (G.sfx.splash) G.sfx.splash(pp); toast(pick(['Plof! Pisaches unha boñiga!', 'Ai que noxo! Boñiga de vaca no zapato!', 'Boñiga fresca. Iso dá sorte... ou iso din.']), 2.4); } }
}
function cowMoo(x, z) {
  const A = G.sfx; if (!A || !A.ac || G.paused) return; const ac = A.ac, cp = camera.position, v = clamp(1 - Math.hypot(cp.x - x, cp.z - z) / 60, 0, 1); if (v < 0.03) return;
  const t = ac.currentTime, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900; o.type = 'sawtooth'; o2.type = 'sawtooth';
  o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(190, t + 0.35); o.frequency.linearRampToValueAtTime(120, t + 1.3);
  o2.frequency.setValueAtTime(152, t); o2.frequency.linearRampToValueAtTime(186, t + 0.35); o2.frequency.linearRampToValueAtTime(118, t + 1.3);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25 * v, t + 0.15); g.gain.setValueAtTime(0.25 * v, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(A.out); o.start(t); o2.start(t); o.stop(t + 1.45); o2.stop(t + 1.45);
}
