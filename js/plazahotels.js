'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Praza da Estación: Hostal River (á esquerda,
   mirando dende a estación) e Hotel Lemavos (á dereita).
   Pódese pasar a noite: no Hostal River lavando pratos
   (minixogo) e no Hotel Lemavos pagando 20 €.
   ========================================================== */
const PH = {
  river: { x0: 276, x1: 301, z0: -28, z1: -4, H: 19 }, // á beira da glorieta, ao outro lado da fonte fronte ao Lemavos
  lemavos: { x0: 276, x1: 303, z0: -72, z1: -49, H: 19 },
};
function plazaHotelsLandmarks() {
  const S = LM.station; if (!S) return;
  for (const k in PH) { const b = PH[k], P = frameRectPoly(S, b.x0 - 1, b.z0 - 1, b.x1 + 0.5, b.z1 + 1); reserve(P, k === 'river' ? 'Hostal River' : 'Hotel Lemavos'); (G.noTrees = G.noTrees || []).push(P); }
}

/* ---------- fachadas ---------- */
function riverFacade(W, H, plaza) {
  const P = arCanvas(W, H);
  P.rect(0, 0, W, H, '#f4f2ee'); P.noise(900, 0.04);
  const pink = '#d99aa3';
  // bandas rosas en cada forxado e marcos rosas arredor das fiestras
  for (let f = 0; f < 6; f++) P.rect(0, 4 + f * 3 - 0.18, W, 0.36, pink);
  const n = Math.max(3, Math.round(W / 3.1)), cw = W / n;
  for (let f = 0; f < 5; f++) for (let i = 0; i < n; i++) {
    const u = i * cw + cw * 0.18, w = cw * 0.64, y = 4.55 + f * 3;
    P.rect(u - 0.18, y - 0.25, w + 0.36, 2.25, pink);
    P.win(u, y, w, 1.85, { frame: '#f6f6f2', blind: RR(0, 0.35), sill: false });
  }
  P.rect(0, H - 0.5, W, 0.5, '#e9e4dc');
  // baixo: cafetaría con escaparates e porta do hostal
  P.rect(0, 0, W, 4, '#7a5a3a');
  if (plaza) {
    P.shop(0.4, W * 0.42, 3.4, '#5a3e26'); P.door(W * 0.48, 1.6, 2.8, '#4a3020', { frame: '#e6dccb' }); P.shop(W * 0.58, W * 0.38, 3.4, '#5a3e26');
    P.sign(W * 0.46, 3.0, 2.4, 0.55, 'HOSTAL RIVER', '#1d2b3a', '#ffd27a', { glow: '#ffd27a' });
  } else { P.shop(0.4, W - 0.8, 3.4, '#5a3e26'); }
  return arTex(P);
}
function lemavosFacade(W, H, plaza) {
  const P = arCanvas(W, H);
  P.rect(0, 0, W, H, '#f2f2f0'); P.noise(600, 0.03);
  const grey = '#5f646d';
  // paneis grises e fiestras verticais
  const n = Math.max(3, Math.round(W / 2.6)), cw = W / n;
  for (let i = 0; i < n; i++) { const u = i * cw + 0.35; if (plaza && i === 1) continue; P.rect(u, 4.2, cw - 0.7, H - 7.6, grey); for (let f = 0; f < 5; f++) P.win(u + 0.3, 4.7 + f * 3, cw - 1.3, 2.0, { frame: '#e8e8e6', blind: RR(0, 0.3), sill: false }); }
  // faixa branca vertical co nome do hotel (na fachada da praza)
  if (plaza) {
    const u = cw + 0.35, w = cw - 0.7; P.rect(u, 4.2, w, H - 7.6, '#f7f7f5');
    const x = P.x; x.fillStyle = '#4a4f58'; x.textAlign = 'center'; x.textBaseline = 'middle'; const L = 'HOTEL LEMAVOS'.split(''), step = (H - 8.4) / L.length;
    x.font = `800 ${P.S(Math.min(w * 0.8, step * 0.9))}px "Big Shoulders Display", sans-serif`;
    L.forEach((ch, i) => { x.fillText(ch, P.X(u + w / 2), P.Y(H - 4.2 - (i + 0.5) * step)); P.ex.fillStyle = '#9fd0ff'; P.ex.font = x.font; P.ex.textAlign = 'center'; P.ex.textBaseline = 'middle'; P.ex.fillText(ch, P.X(u + w / 2), P.Y(H - 4.2 - (i + 0.5) * step)); });
  }
  // ático acristalado
  P.rect(0, H - 3.2, W, 3.2, '#dfe3e6'); for (let u = 0.3; u < W - 1; u += 1.6) P.win(u, H - 2.8, 1.3, 2.2, { frame: '#f4f4f2', sill: false, lit: 0.6 });
  // baixo branco con entrada de vidro
  P.rect(0, 0, W, 4.2, '#efeee9');
  if (plaza) { P.shop(W * 0.62, 3.4, 3.2, '#3a3f46', { glow: '#fff1cf' }); P.door(W * 0.4, 1.6, 2.7, '#4a4f58', { frame: '#d8d8d4' }); P.sign(W * 0.36, 3.1, 2.4, 0.5, 'HOTEL', '#efeee9', '#4a4f58'); }
  else { P.win(1.0, 1.0, 1.8, 2.0, { grille: true }); P.shutter(4.0, 3.6, 3.0, '#bfc3c7'); }
  return arTex(P);
}
function phFacadeMesh(g, tex, w, h, x, y, z, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), nightMat(std({ map: tex.t, emissiveMap: tex.e, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.8 }), 0, 1.0));
  m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m;
}

/* ---------- construción ---------- */
function buildPlazaHotels(B, scene) {
  const S = LM.station; if (!S) return;
  inFrame(B, scene, S.ox, S.oz, S.rot, (LB, g) => {
    // ===== Hostal River =====
    { const b = PH.river, [wx, wz] = S.pt(b.x1, (b.z0 + b.z1) / 2), y0 = terrainH(wx, wz), dx = b.x1 - b.x0, dz = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      const box = boxGeo(dx, b.H + 2, dz, [6, 6]); xform(box, cx, y0 + b.H / 2 - 1, cz); LB.vcol.add(colorize(box, '#efece6'));
      addBoxCol(b.x0, b.z0, b.x1, b.z1, b.H + 2, 'hostal');
      const roof = boxGeo(dx + 0.3, 0.4, dz + 0.3); xform(roof, cx, y0 + b.H + 0.2, cz); LB.flat.add(roof);
      const att = boxGeo(dx - 5, 2.6, dz - 5); xform(att, cx - 1.5, y0 + b.H + 1.5, cz + 1.5); LB.vcol.add(colorize(att, '#f2efe8'));
      phFacadeMesh(g, riverFacade(dz, b.H, true), dz, b.H, b.x1 + 0.02, y0 + b.H / 2, cz, Math.PI / 2);
      phFacadeMesh(g, riverFacade(dx, b.H, false), dx, b.H, cx, y0 + b.H / 2, b.z0 - 0.02, Math.PI);
      // esquina redondeada acristalada con bandas rosas
      const cx2 = b.x1 - 0.6, cz2 = b.z0 + 0.6, R = 3.4;
      const gt = (() => { const c = cnv(512, 128), x = c.getContext('2d'); x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, 512, 128); for (let i = 0; i < 8; i++) { const gg = x.createLinearGradient(0, 10, 0, 90); gg.addColorStop(0, '#6f8698'); gg.addColorStop(1, '#2c3a46'); x.fillStyle = gg; x.fillRect(i * 64 + 4, 10, 56, 78); x.fillStyle = '#2f5fb8'; x.fillRect(i * 64 + 4, 92, 56, 22); } return toTex(c); })();
      gt.repeat.set(1, 1);
      for (let f = 0; f < 5; f++) {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 2.6, 28, 1, true, 0, Math.PI * 1.5), nightMat(std({ map: gt, emissiveMap: gt, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.3, side: THREE.DoubleSide }), 0, 0.3));
        cyl.position.set(cx2, y0 + 4.5 + f * 3 + 1.1, cz2); cyl.rotation.y = 0; g.add(cyl);
        const band = new THREE.CylinderGeometry(R + 0.12, R + 0.12, 0.42, 28); xform(band, cx2, y0 + 4.0 + f * 3 + 0.05, cz2); LB.vcol.add(colorize(band, '#d99aa3'));
      }
      { const top = new THREE.CylinderGeometry(R + 0.2, R + 0.2, 0.5, 28); xform(top, cx2, y0 + b.H - 0.2, cz2); LB.vcol.add(colorize(top, '#e9e4dc')); }
      // toldos vermellos e terraza na rúa lateral
      const awT = textTex('CAFETERÍA RIVER', { w: 512, h: 64, bg: '#b8222a', fg: '#ffffff', size: 40 });
      for (const ax of [b.x0 + 6, b.x0 + 14.5]) {
        const aw = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.08, 2.4), std({ color: 0xc8262e, roughness: 0.8 })); aw.position.set(ax, y0 + 3.3, b.z0 - 1.15); aw.rotation.x = -0.28; aw.castShadow = true; g.add(aw);
        const fr = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.4), std({ map: awT, roughness: 0.8 })); fr.position.set(ax, y0 + 2.75, b.z0 - 2.36); fr.rotation.y = Math.PI; g.add(fr);
        for (let i = 0; i < 3; i++) { const tx = ax - 2.4 + i * 2.4, tz = b.z0 - 2.0; const t = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 10); xform(t, tx, y0 + 0.75, tz); LB.metal.add(t); const l = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6); xform(l, tx, y0 + 0.37, tz); LB.metal.add(l); for (const s of [-1, 1]) { const ch = boxGeo(0.42, 0.06, 0.42); xform(ch, tx + s * 0.6, y0 + 0.45, tz); LB.metal.add(ch); } }
      }
      // rótulo luminoso no alto da esquina
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), nightMat(std({ map: textTex('HOSTAL RIVER', { w: 768, h: 140, bg: '#f4f2ee', fg: '#c8262e', size: 104 }), emissive: 0xffffff, emissiveMap: textTex('HOSTAL RIVER', { w: 768, h: 140, bg: '#000000', fg: '#ff5a5a', size: 104 }), side: THREE.DoubleSide }), 0.1, 1.3));
      sg.position.set(b.x1 + 0.05, y0 + b.H + 0.9, cz); sg.rotation.y = Math.PI / 2; g.add(sg);
    }
    // ===== Hotel Lemavos =====
    { const b = PH.lemavos, [wx, wz] = S.pt(b.x1, (b.z0 + b.z1) / 2), y0 = terrainH(wx, wz), dx = b.x1 - b.x0, dz = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      const box = boxGeo(dx, b.H + 2, dz, [6, 6]); xform(box, cx, y0 + b.H / 2 - 1, cz); LB.vcol.add(colorize(box, '#e9e9e6'));
      addBoxCol(b.x0, b.z0, b.x1, b.z1, b.H + 2, 'hotel');
      const roof = boxGeo(dx + 0.3, 0.4, dz + 0.3); xform(roof, cx, y0 + b.H + 0.2, cz); LB.flat.add(roof);
      phFacadeMesh(g, lemavosFacade(dz, b.H, true), dz, b.H, b.x1 + 0.02, y0 + b.H / 2, cz, Math.PI / 2);
      phFacadeMesh(g, lemavosFacade(dx, b.H, false), dx, b.H, cx, y0 + b.H / 2, b.z1 + 0.02, 0);
      // balcóns semicirculares apilados na esquina
      const glassM = new THREE.MeshStandardMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide });
      for (let f = 0; f < 5; f++) {
        const y = y0 + 4.2 + f * 3;
        const slab = new THREE.CylinderGeometry(2.4, 2.4, 0.18, 24); xform(slab, b.x1, y, b.z1); LB.vcol.add(colorize(slab, '#f2f2f0'));
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.0, 24, 1, true, Math.PI * 0, Math.PI * 1.5), glassM); rail.position.set(b.x1, y + 0.6, b.z1); g.add(rail);
        const top = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.03, 6, 24, Math.PI * 1.5), std({ color: 0x9aa0a6, metalness: 0.8 })); top.rotation.x = Math.PI / 2; top.position.set(b.x1, y + 1.1, b.z1); g.add(top);
      }
      { const strip = boxGeo(0.9, b.H - 4, 0.9); xform(strip, b.x1 - 0.3, y0 + 4 + (b.H - 4) / 2, b.z1 - 0.3); LB.vcol.add(colorize(strip, '#f4f4f2')); }
      // marquesiña da entrada
      const mq = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 3.4), std({ color: 0x4a4f58, roughness: 0.5 })); mq.position.set(b.x1 + 1.2, y0 + 3.1, b.z0 + dz * 0.4 + 0.8); g.add(mq);
    }
  });
  // puntos de entrada (para durmir)
  const [rx, rz] = S.pt(PH.river.x1 + 1.3, (PH.river.z0 + PH.river.z1) / 2 + 1), [lx, lz] = S.pt(PH.lemavos.x1 + 1.3, PH.lemavos.z0 + (PH.lemavos.z1 - PH.lemavos.z0) * 0.48);
  G.plazaHotels = [
    { id: 'river', name: 'Hostal River', x: rx, z: rz, why: 'Cama estreita pero limpa, e un bocadillo de tortilla de recompensa.' },
    { id: 'lemavos', name: 'Hotel Lemavos', x: lx, z: lz, cost: 20, why: 'Ducha quente, toallas brancas e almorzo bufé. Que luxo!' },
  ];
  for (const h of G.plazaHotels) { h.tag = nameSprite(h.name + (h.cost ? ' · 20 €' : ' · lavar pratos'), '#8fd0ff'); h.tag.visible = false; G.scene.add(h.tag); h.y = groundH(h.x, h.z); }
}

/* ---------- interacción ---------- */
function plazaHotelNear() {
  if (!G.plazaHotels || G.player.car) return null; const me = G.player.ped;
  return G.plazaHotels.find(h => Math.hypot(me.x - h.x, me.z - h.z) < 3.2) || null;
}
const phNight = () => G.hour >= 20 || G.hour < 6;
function updatePlazaHotels() {
  if (!G.plazaHotels) return;
  const night = phNight();
  for (const h of G.plazaHotels) { const d = Math.hypot(camera.position.x - h.x, camera.position.z - h.z); h.tag.visible = night && d < 140 && !(G.story && G.story.phase !== 'play'); h.tag.position.set(h.x, h.y + 3.0 + Math.sin(G.t * 2) * 0.1, h.z); }
  const h = plazaHotelNear(); if (!h || G.dialog || G.dishes) return;
  if (G.story && G.story.phase !== 'play') return;
  const K = isTouch ? '★' : 'E';
  // na aventura, o Hostal River dá o bocata a cambio de lavar pratos (a calquera hora)
  if (h.id === 'river' && G.story && G.story.step === 'bocata' && typeof advPoint === 'function') { const pr = advPoint('river', false); if (pr) { setPrompt(pr); return; } }
  setPrompt(night ? `${K} · ${h.name}: ${h.cost ? 'durmir por 20 €' : 'durmir a cambio de lavar pratos'}` : `${h.name} · para durmir, volve a partir das 20:00`);
}
function plazaHotelsInteract() {
  const h = plazaHotelNear(); if (!h || G.dialog || G.cine || G.dishes) return false;
  if (G.story && G.story.phase !== 'play') return false;
  if (h.id === 'river' && G.story && G.story.step === 'bocata' && typeof advPoint === 'function') return advPoint('river', true);
  if (!phNight()) { toast(`${h.name}: as habitacións dánse a partir das 20:00.`); return true; }
  if (h.id === 'lemavos') {
    const RC = (t, e) => ({ who: 'Recepcionista do Lemavos', text: t, ...e });
    openDialog([RC('Boas noites e benvido ao Hotel Lemavos. Unha habitación individual son 20 euros, almorzo incluído.', { choices: [
      { t: 'Págoa (20 €)', disabled: G.player.money < 20 ? 'Non tes cartos dabondo' : null, fn: () => [RC('Habitación 214, cuarta planta. Que descanse!'), () => { G.player.money -= 20; $('money').textContent = G.player.money + ' €'; if (!G.story) { save.money = G.player.money; persist(); } phSleep(h); }] },
      { t: 'Mellor non', fn: () => [RC('Como queira. Se cambia de idea, a recepción está aberta toda a noite.')] },
    ] })]);
  } else {
    const DN = (t, e) => ({ who: 'Dono do Hostal River', text: t, ...e });
    openDialog([DN('Boas! Cuartos de balde non hai... pero a cafetaría está ata arriba de pratos sucios. Se me lavas oito en menos dun minuto, tes cama esta noite.', { choices: [
      { t: 'Trato feito: a lavar pratos!', fn: () => [DN('Estropallo na man e a fregar! Arrastra o rato (ou o dedo) por riba da suciedade, ou alterna as teclas A e D.'), () => startDishes(() => { openDialog([DN('Impecables! Moi ben, aquí tes a chave do cuarto 3. Boas noites!'), () => phSleep(h)]); }, n => { openDialog([DN(`Só ${n} pratos limpos... Así non, home. Volve a intentalo cando queiras.`)]); })] },
      { t: 'Agora non', fn: () => [DN('Ti verás. Os pratos non se lavan sós!')] },
    ] })]);
  }
  return true;
}
function phSleep(h) {
  if (G.story && typeof storySleep === 'function') { storySleep({ id: h.id, label: h.name, x: h.x, z: h.z, why: h.why }, false); return; }
  // modo libre: pasa a noite e esperta pola mañá
  $('fade').classList.add('on');
  setTimeout(() => {
    bigMsg('BOA NOITE', h.why);
    setTimeout(() => { G.hour = 8.5; envTimer = 0; lastEnvHour = -99; const me = G.player.ped; me.x = h.x; me.z = h.z; me.y = groundH(me.x, me.z); $('fade').classList.remove('on'); bigMsg('BOS DÍAS', h.name + ' · 08:30'); }, 2400);
  }, 900);
}

/* ---------- minixogo: lavar pratos ---------- */
function startDishes(onWin, onFail) {
  if (document.exitPointerLock) document.exitPointerLock();
  const GOAL = 8, TIME = 60;
  const ov = document.createElement('div'); ov.id = 'dishes';
  ov.innerHTML = `<div class="dz-box"><div class="dz-top"><b>LAVAR PRATOS · HOSTAL RIVER</b><span id="dzInfo"></span></div><canvas id="dzC" width="420" height="420"></canvas><div class="dz-help">Arrastra o rato ou o dedo sobre a suciedade · ou alterna <kbd>A</kbd> <kbd>D</kbd> · <kbd>Esc</kbd> para deixalo</div></div>`;
  const st = document.createElement('style'); st.textContent = `#dishes{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(8,12,16,.72);font-family:Barlow,sans-serif;color:#eee;touch-action:none}
#dishes .dz-box{background:#15191d;border:3px solid #f2a33a;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;align-items:center;max-width:94vw}
#dishes .dz-top{display:flex;justify-content:space-between;width:100%;gap:16px;font-size:18px}#dishes .dz-top b{font-family:"Big Shoulders Display",sans-serif;font-size:22px;color:#f2a33a}
#dishes canvas{width:min(420px,80vw);height:min(420px,80vw);border-radius:8px;background:#7fb6c9;cursor:crosshair}
#dishes .dz-help{font-size:14px;opacity:.85;text-align:center}#dishes kbd{background:#2a2f35;border-radius:3px;padding:0 5px}`;
  document.head.appendChild(st); document.body.appendChild(ov);
  const cv = ov.querySelector('#dzC'), x = cv.getContext('2d'), info = ov.querySelector('#dzInfo');
  let done = 0, blobs = [], total = 0, t0 = performance.now(), over = false, slide = 0, sponge = { x: 210, y: 210, on: false }, lastKey = '';
  G.dishes = true;
  const newPlate = () => { blobs = []; const n = RI(9, 14); for (let i = 0; i < n; i++) { const a = R() * 6.28, r = RR(20, 130); blobs.push({ x: 210 + Math.cos(a) * r, y: 210 + Math.sin(a) * r, r: RR(14, 34), a: 1, c: pick(['#6b4a2a', '#8a5a2a', '#c86a2a', '#5a6a2a']) }); } total = blobs.reduce((s, b) => s + b.r * b.r, 0); slide = 1; };
  const dirt = () => blobs.reduce((s, b) => s + b.r * b.r * b.a, 0) / total;
  const scrub = (px, py, k = 1) => { for (const b of blobs) { const d = Math.hypot(b.x - px, b.y - py); if (d < b.r + 26) b.a = Math.max(0, b.a - 0.09 * k); } splash(px, py); };
  const bubbles = []; const splash = (px, py) => { if (bubbles.length > 70) bubbles.splice(0, bubbles.length - 70); if (R() < 0.5) for (let i = 0; i < 1; i++) bubbles.push({ x: px + RR(-14, 14), y: py + RR(-14, 14), r: RR(3, 9), l: 1 }); };
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 420, (e.clientY - r.top) / r.height * 420]; };
  cv.addEventListener('pointerdown', e => { sponge.on = true; cv.setPointerCapture(e.pointerId); const [a, b] = pos(e); sponge.x = a; sponge.y = b; });
  cv.addEventListener('pointerup', () => { sponge.on = false; });
  cv.addEventListener('pointermove', e => { const [a, b] = pos(e); const mv = Math.hypot(a - sponge.x, b - sponge.y); sponge.x = a; sponge.y = b; if ((sponge.on || e.pointerType === 'mouse') && mv > 2) scrub(a, b, Math.min(2, mv / 14)); });
  const onKey = e => {
    if (!G.dishes) return;
    if (e.code === 'Escape') { finish(false); }
    else if ((e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') && e.type === 'keydown' && !e.repeat) {
      const k = e.code === 'KeyA' || e.code === 'ArrowLeft' ? 'L' : 'R';
      if (k !== lastKey) { const live = blobs.filter(b => b.a > 0); const b = live.length ? pick(live) : null; if (b) { sponge.x = b.x + RR(-8, 8); sponge.y = b.y + RR(-8, 8); scrub(sponge.x, sponge.y, 1.6); } lastKey = k; }
    }
    e.stopImmediatePropagation(); e.preventDefault();
  };
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true);
  const sfx = (f) => { const A = G.sfx; if (!A || !A.ac) return; const ac = A.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2, t + 0.12); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(A.out); o.start(t); o.stop(t + 0.22); };
  const finish = (win) => {
    if (over) return; over = true; G.dishes = false;
    removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKey, true);
    for (const k in keys) keys[k] = false;
    setTimeout(() => { ov.remove(); st.remove(); win ? onWin() : onFail(done); }, win ? 700 : 300);
  };
  newPlate();
  const draw = () => {
    if (over && !ov.isConnected) return;
    const left = Math.max(0, TIME - (performance.now() - t0) / 1000);
    info.textContent = `Pratos: ${done}/${GOAL} · ${Math.ceil(left)} s`;
    slide = Math.max(0, slide - 0.08); const ox = slide * 420;
    x.fillStyle = '#7fb6c9'; x.fillRect(0, 0, 420, 420);
    x.fillStyle = 'rgba(255,255,255,.15)'; for (let i = 0; i < 6; i++) x.fillRect(0, i * 70, 420, 2);
    // prato
    x.save(); x.translate(ox, 0);
    x.fillStyle = '#e8eef0'; x.beginPath(); x.arc(210, 210, 175, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(210, 210, 130, 0, 7); x.fill();
    x.strokeStyle = '#2f5fb8'; x.lineWidth = 4; x.beginPath(); x.arc(210, 210, 165, 0, 7); x.stroke();
    for (const b of blobs) if (b.a > 0) { x.globalAlpha = b.a * 0.9; x.fillStyle = b.c; x.beginPath(); x.ellipse(b.x, b.y, b.r, b.r * 0.8, b.x, 0, 7); x.fill(); }
    x.globalAlpha = 1; x.restore();
    for (const p of bubbles) { p.l -= 0.03; p.y -= 0.6; x.strokeStyle = `rgba(255,255,255,${Math.max(0, p.l)})`; x.lineWidth = 2; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.stroke(); }
    while (bubbles.length && bubbles[0].l <= 0) bubbles.shift();
    // estropallo
    x.fillStyle = '#f2c21b'; x.fillRect(sponge.x - 22, sponge.y - 14, 44, 28); x.fillStyle = '#2fa36b'; x.fillRect(sponge.x - 22, sponge.y - 14, 44, 8);
    if (!over && slide === 0 && dirt() < 0.06) { done++; sfx(660); if (done >= GOAL) { finish(true); } else newPlate(); }
    if (!over && left <= 0) finish(false);
    if (!over || ov.isConnected) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}
