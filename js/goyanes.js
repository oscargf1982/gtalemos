'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Praza do Doutor Goyanes (cabeza leste da
   Ponte Vella), segundo as fotos:
   - norte (de oeste a leste): hotel de galerías brancas e azuis
     (esquina co Malecón), estanco «TABACOS» e Bar Michael Cantón
   - sur (a praza peonil): á dereita da saída da ponte, na esquina
     coa Rúa das Hortas, a clínica auditiva; no medio da praza, fronte
     ao Bar Michael Cantón, a Oficina do Peregrino
   - leste: na entrada da Rúa do Comercio a farmacia de fachada azul
     e, xa na Rúa do Doutor Casares, o edificio gris do centro auditivo
   - praza peonil con bolardos, bancos de pedra e arboriñas
   - cámara na Rúa do Comercio: multa (estrela) que se paga no Concello
   ========================================================== */
function goyanesLandmarks() {
  // marco 1: rúa da praza (x cara ao leste); beira norte en z < 0
  LM.goy1 = makeFrame(-90, 179, 0);
  // marco 2: Rúa do Doutor Casares (x cara ao norte); beira leste en z > 0
  { const dx = -69 - -74, dz = 118 - 179, L = Math.hypot(dx, dz); LM.goy2 = makeFrame(-74, 179, Math.atan2(-dz / L, dx / L)); }
  // marco 3: Rúa das Hortas (x cara ao sur); beira oeste en z > 0
  { const dx = -122 - -108, dz = 220 - 179, L = Math.hypot(dx, dz); LM.goy3 = makeFrame(-108, 179, Math.atan2(-dz / L, dx / L)); }
  const zones = [frameRectPoly(LM.goy1, -13.2, -22, 11.2, -4.6), frameRectPoly(LM.goy2, -4, 4.6, 20, 20), frameRectPoly(LM.goy1, -15, 4.6, 12, 22)];
  for (const P of zones) { reserve(P); (G.noTrees = G.noTrees || []).push(P); }
  G.namedZones.push({ n: 'Praza do Doutor Goyanes', p: frameRectPoly(LM.goy1, -12, -4.6, 18, 16) });
  G.namedZones.push({ n: 'Oficina do Peregrino', p: frameRectPoly(LM.goy1, -1, 12, 10, 21) });
  G.namedZones.push({ n: 'Bar Michael Cantón', p: frameRectPoly(LM.goy1, 5, -18, 11.2, -4.6) });
}
function blueGalleryTex(cols) {
  const c = cnv(512, 128), x = c.getContext('2d');
  x.fillStyle = '#f6f6f2'; x.fillRect(0, 0, 512, 128);
  const g = x.createLinearGradient(0, 6, 0, 92); g.addColorStop(0, '#7d93a4'); g.addColorStop(1, '#33414c'); x.fillStyle = g; x.fillRect(6, 6, 500, 84);
  x.fillStyle = '#f6f6f2'; for (let i = 0; i <= cols; i++) x.fillRect(6 + i * 500 / cols - 3, 6, 6, 84);
  x.fillStyle = '#2f5fb8'; x.fillRect(0, 0, 512, 6); x.fillRect(0, 88, 512, 7); for (let i = 0; i <= cols; i++) x.fillRect(6 + i * 500 / cols - 1.5, 6, 3, 84);
  x.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < cols; i++) x.fillRect(14 + i * 500 / cols, 10, 8, 76);
  x.fillStyle = '#f6f6f2'; x.fillRect(0, 95, 512, 33); x.fillStyle = '#2f5fb8'; x.fillRect(0, 122, 512, 6);
  return toTex(c);
}
// galería (caixa): a cara principal mira cara a +z local (front=4) ou −z (front=5)
function goyGallery(g, w, h, d, x, y, z, ry, opts = {}) {
  const t = opts.blue ? blueGalleryTex(opts.cols || Math.max(3, Math.round(w / 0.85))) : galleryTex(opts.cols || Math.max(3, Math.round(w / 0.9)), 2);
  const front = nightMat(std({ map: t, emissiveMap: t, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.35 }), 0, 0.25);
  const side = std({ map: opts.blue ? blueGalleryTex(2) : galleryTex(1, 2), roughness: 0.35 }), top = std({ color: 0xf6f6f2 });
  const mats = [side, side, top, top, side, side]; mats[opts.back ? 5 : 4] = front;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); m.position.set(x, y + h / 2, z); m.rotation.y = ry; m.castShadow = true; g.add(m); return m;
}
function goyBuild(LB, g, b, side, y0) { const P = arCanvas(b.s1 - b.s0, b.H); b.paint(P); b.front = arTex(P); arBuild(LB, g, b, side, y0); }
function goyTables(LB, pts, y0) { for (const [tx, tz] of pts) { const t = new THREE.CylinderGeometry(0.33, 0.33, 0.05, 10); xform(t, tx, y0 + 0.75, tz); LB.metal.add(t); const l = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6); xform(l, tx, y0 + 0.37, tz); LB.metal.add(l); for (const s of [-1, 1]) { const ch = boxGeo(0.42, 0.8, 0.42); xform(ch, tx + s * 0.62, y0 + 0.4, tz); LB.vcol.add(colorize(ch, '#6b4a2e')); } } }

function buildGoyanes(B, scene) {
  const F1 = LM.goy1, F2 = LM.goy2, F3 = LM.goy3; if (!F1) return;
  const FL = 5.4;
  // ================= beira norte =================
  inFrame(B, scene, F1.ox, F1.oz, F1.rot, (LB, g) => {
    const y0 = terrainH(F1.ox, F1.oz - 12);
    // --- hotel de galerías brancas e azuis (esquina co Malecón) ---
    { const s0 = -12.8, s1 = -0.3, W = s1 - s0, H = 16.6, D = 15, cx = (s0 + s1) / 2;
      goyBuild(LB, g, { s0, s1, H, D, fl: FL, wall: '#efe6cf', roof: 'none', paint(P) {
        P.rect(0, 0, P.W, P.H, '#f0e7d0'); P.noise(700, 0.05); P.stains(0.4);
        P.rect(0, 0, P.W, 4.0, '#e8dfc6'); P.shop(0.4, 3.6, 3.2, '#2a2d31'); P.shop(4.3, 3.6, 3.2, '#2a2d31'); P.door(8.5, 1.4, 2.8, '#2a2d31', { frame: '#cfc6ae' }); P.shop(10.2, 2.0, 3.2, '#2a2d31');
      } }, -1, y0);
      for (let f = 0; f < 4; f++) goyGallery(g, W - 0.6, 2.7, 0.75, cx, y0 + 4.3 + f * 3, -FL + 0.37, 0, { blue: true, cols: 12 });
      const att = boxGeo(W, 1.2, D); xform(att, cx, y0 + H + 0.6, -FL - D / 2); LB.vcol.add(colorize(att, '#efe6cf'));
      const rf = hipRoof(W, D, 2.6, 4, 0.5); xform(rf, cx, y0 + H + 1.2, -FL - D / 2); LB.tile.add(rf);
      // fachada cara ao Malecón (oeste) con galerías
      const side = arCanvas(D, H); side.rect(0, 0, D, H, '#f0e7d0'); side.noise(500, 0.04); side.rect(0, 0, D, 4.0, '#e8dfc6'); side.shop(0.5, 4.5, 3.2, '#2a2d31'); side.door(6, 1.3, 2.7, '#2a2d31');
      const st = arTex(side), sm = new THREE.Mesh(new THREE.PlaneGeometry(D, H), nightMat(std({ map: st.t, emissiveMap: st.e, emissive: 0xffffff, emissiveIntensity: 0 }), 0, 1));
      sm.position.set(s0 - 0.02, y0 + H / 2, -FL - D / 2); sm.rotation.y = -Math.PI / 2; g.add(sm);
      for (let f = 0; f < 4; f++) goyGallery(g, D - 4, 2.7, 0.7, s0 - 0.35, y0 + 4.3 + f * 3, -FL - D / 2 - 1.2, -Math.PI / 2, { blue: true, cols: 12 });
      // rótulo vertical «HOSTAL» na esquina leste
      const vs = cnv(96, 512), vx = vs.getContext('2d'); vx.fillStyle = '#f4f4f0'; vx.fillRect(0, 0, 96, 512); vx.strokeStyle = '#2f5fb8'; vx.lineWidth = 6; vx.strokeRect(3, 3, 90, 506);
      vx.fillStyle = '#2f5fb8'; vx.font = '900 70px "Big Shoulders Display", sans-serif'; vx.textAlign = 'center'; 'HOSTAL'.split('').forEach((ch, i) => vx.fillText(ch, 48, 78 + i * 80));
      const vt = toTex(vs, false), sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2), nightMat(std({ map: vt, emissiveMap: vt, emissive: 0xffffff, emissiveIntensity: 0, side: THREE.DoubleSide }), 0.05, 0.9));
      sign.position.set(s1 - 0.3, y0 + 9.5, -FL + 0.55); sign.rotation.y = Math.PI / 2; g.add(sign);
    }
    // --- estanco «TABACOS» (casa crema de tres plantas) ---
    goyBuild(LB, g, { s0: -0.3, s1: 4.6, H: 10.6, D: 13, fl: FL, wall: '#efe2c4', roof: 'tile', paint(P) {
      P.rect(0, 0, P.W, P.H, '#efe2c4'); P.noise(); P.stains(0.7); P.rect(0, 0, P.W, 0.9, '#b9ae98');
      P.shop(0.3, 2.6, 3.1, '#5a3a24'); P.door(3.3, 1.2, 2.6, '#5a3a24', { panels: true });
      P.sign(0.2, 3.15, 3.0, 0.55, 'TABACOS', '#efe2c4', '#c8262e', { glow: '#ff5a3a' });
      for (let f = 0; f < 2; f++) for (const u of [0.8, 3.1]) P.win(u, 4.4 + f * 3, 1.1, 1.9, { blind: 0.4 });
    }, balconies: [{ u: 0.5, w: 4, y: 4.15, d: 0.5 }] }, -1, y0);
    { const tb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.55), nightMat(std({ map: textTex('T', { w: 128, h: 128, bg: '#7a1f2a', fg: '#f2c21b', size: 100 }), emissive: 0xffffff, emissiveMap: textTex('T', { w: 128, h: 128, bg: '#000', fg: '#f2c21b', size: 100 }) }), 0.1, 1));
      tb.position.set(4.1, y0 + 3.0, -FL + 0.35); g.add(tb); }
    // --- Bar Michael Cantón: cantería con pilastras, balcón de balaústres e toldo negro ---
    { const s0 = 4.6, s1 = 11.0, W = s1 - s0, cx = (s0 + s1) / 2;
      goyBuild(LB, g, { s0, s1, H: 10.4, D: 14, fl: FL, wall: '#c9b896', roof: 'tile', paint(P) {
        P.rect(0, 0, P.W, P.H, '#d8cbb0'); P.ashlar(0, 0, P.W, P.H, [196, 182, 152], true); P.noise(600, 0.05);
        for (const u of [0, P.W - 0.6]) P.pilaster(u, 0.6, '#cdbd9c');
        P.shop(0.7, P.W - 1.4, 3.4, '#1d1d1f', { glow: '#ffd9a0' }); P.rect(0.7, 3.5, P.W - 1.4, 0.3, '#cdbd9c');
        for (const u of [1.0, 3.6]) { P.win(u, 4.6, 1.5, 2.2, { frame: '#efe8d6', blind: 0.2 }); P.win(u, 7.6, 1.4, 1.8, { frame: '#efe8d6', blind: 0.5 }); }
      } }, -1, y0);
      // balcón de balaústres de pedra
      const bal = boxGeo(W - 0.6, 0.2, 0.9); xform(bal, cx, y0 + 4.3, -FL + 0.45); LB.stone.add(bal);
      for (let u = s0 + 0.5; u < s1 - 0.4; u += 0.32) { const bl = new THREE.CylinderGeometry(0.06, 0.08, 0.7, 6); xform(bl, u, y0 + 4.75, -FL + 0.82); LB.stone.add(bl); }
      const rail = boxGeo(W - 0.6, 0.12, 0.22); xform(rail, cx, y0 + 5.15, -FL + 0.82); LB.stone.add(rail);
      // toldo negro co nome
      const awT = textTex('Bar Michael Cantón', { w: 768, h: 96, bg: '#151517', fg: '#f4f4f0', size: 58, font: 'Georgia, serif', weight: 400 });
      const aw = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.08, 2.2), std({ color: 0x151517, roughness: 0.8 })); aw.position.set(cx, y0 + 3.2, -FL + 1.1); aw.rotation.x = -0.32; aw.castShadow = true; g.add(aw);
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.4, 0.42), std({ map: awT, roughness: 0.8 })); fr.position.set(cx, y0 + 2.62, -FL + 2.2); g.add(fr);
      goyTables(LB, [[cx - 1.4, -FL + 1.6], [cx + 1.4, -FL + 1.6]], y0);
    }
  });
  // ================= beira leste (entrada da Rúa do Comercio / Doutor Casares) =================
  inFrame(B, scene, F2.ox, F2.oz, F2.rot, (LB, g) => {
    const y0 = terrainH(...F2.pt(2, 9));
    // --- FARMACIA: edificio branco e azul na esquina da entrada da Rúa do Comercio ---
    { const s0 = -2.5, s1 = 8, D = 5.5, H = 15.2;
      goyBuild(LB, g, { s0, s1, H, D, fl: FL, wall: '#eef2f6', roof: 'flat', paint(P) {
        P.rect(0, 0, P.W, P.H, '#eef2f6'); P.noise(600, 0.04); P.rect(0, 0, P.W, 3.9, '#2f5fb8');
        P.shop(0.4, 5.4, 3.2, '#1f4fa0', { glow: '#e0f0ff' }); P.sign(0.4, 3.3, 5.4, 0.5, 'FARMACIA', '#2f5fb8', '#ffffff', { glow: '#ffffff' }); P.door(6.2, 1.3, 2.7, '#1f4fa0', { frame: '#e8eef4' }); P.shop(8.0, 3.0, 3.2, '#1f4fa0');
        for (let f = 0; f < 4; f++) { P.rect(0, 4.2 + f * 2.75, P.W, 0.25, '#2f5fb8'); for (const u of [0.6, 4.2, 7.8]) P.win(u, 4.6 + f * 2.75, 2.6, 1.6, { frame: '#f6f8fa', blind: RR(0, 0.4) }); }
      } }, 1, y0);
      // fachada sur, cara á Rúa do Comercio
      const side = arCanvas(D, H); side.rect(0, 0, D, H, '#eef2f6'); side.noise(300, 0.04); side.rect(0, 0, D, 3.9, '#2f5fb8'); side.shop(0.5, D - 1, 3.2, '#1f4fa0', { glow: '#e0f0ff' }); side.sign(0.5, 3.3, D - 1, 0.5, 'FARMACIA', '#2f5fb8', '#ffffff', { glow: '#ffffff' });
      for (let f = 0; f < 4; f++) { side.rect(0, 4.2 + f * 2.75, D, 0.25, '#2f5fb8'); for (const u of [0.6, 4.0]) side.win(u, 4.6 + f * 2.75, 2.4, 1.6, { frame: '#f6f8fa', blind: 0.2 }); }
      const st = arTex(side), sm = new THREE.Mesh(new THREE.PlaneGeometry(D, H), nightMat(std({ map: st.t, emissiveMap: st.e, emissive: 0xffffff, emissiveIntensity: 0 }), 0.05, 1));
      sm.position.set(s0 - 0.02, y0 + H / 2, FL + D / 2); sm.rotation.y = -Math.PI / 2; g.add(sm);
      // cruces verdes luminosas (na esquina, cara á praza e cara á Rúa do Comercio)
      const cr = cnv(128, 128), x = cr.getContext('2d'); x.fillStyle = '#1fd06a'; x.fillRect(44, 8, 40, 112); x.fillRect(8, 44, 112, 40); const t = toTex(cr, false);
      const cm = nightMat(std({ map: t, transparent: true, emissive: 0x1fd06a, emissiveMap: t, emissiveIntensity: 0.6, side: THREE.DoubleSide }), 0.6, 1.4);
      const c1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), cm); c1.position.set(s0 + 0.5, y0 + 4.6, FL - 0.6); c1.rotation.y = Math.PI / 2; g.add(c1);
    }
    // --- edificio gris de cinco plantas co centro auditivo (Rúa do Doutor Casares) ---
    goyBuild(LB, g, { s0: 8, s1: 20, H: 16.0, D: 13, fl: FL, wall: '#c9c9c4', roof: 'flat', paint(P) {
      P.rect(0, 0, P.W, P.H, '#cfcfca'); P.noise(900, 0.06); P.stains(0.8); P.rect(0, 0, P.W, 3.9, '#e9e7e0');
      P.shop(0.4, 5.6, 3.3, '#2a2d31', { glow: '#e8f2ff' }); P.sign(0.4, 3.35, 5.6, 0.45, 'CENTRO AUDITIVO', '#e9e7e0', '#2a2d31');
      P.door(6.6, 1.3, 2.7, '#3a3d42'); P.shutter(8.4, 3.2, 3.0, '#9aa0a6');
      for (let f = 0; f < 4; f++) for (const u of [0.8, 3.8, 6.8, 9.6]) P.win(u, 4.5 + f * 2.9, 1.6, 1.6, { frame: '#e9e7e0', blind: RR(0.3, 0.9) });
    } }, 1, y0);
    // cámara de control na entrada da Rúa do Comercio
    { const pole = new THREE.CylinderGeometry(0.07, 0.08, 4.2, 8); xform(pole, -3.5, y0 + 2.1, 3.6); LB.metalDark.add(pole); addCircCol(-3.5, 3.6, 0.15, 4, 'poste');
      const cam = boxGeo(0.25, 0.22, 0.6); xform(cam, -3.2, y0 + 4.1, 3.2); LB.vcol.add(colorize(cam, '#e8e8e4'));
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), std({ map: (() => { const c = cnv(180, 240), x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 180, 240); x.fillStyle = '#d4202b'; x.beginPath(); x.arc(90, 70, 58, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(90, 70, 44, 0, 7); x.fill(); x.fillStyle = '#1b1b1d'; x.fillRect(58, 58, 64, 26); x.font = '800 20px Barlow'; x.textAlign = 'center'; x.fillText('ZONA PEONIL', 90, 160); x.font = '600 17px Barlow'; x.fillText('Control por cámara', 90, 186); x.fillText('Multa: 40 €', 90, 210); return toTex(c, false); })(), side: THREE.DoubleSide }));
      sg.position.set(-3.5, y0 + 2.6, 3.45); sg.rotation.y = -Math.PI / 2; g.add(sg); }
  });
  // ================= beira sur: a praza peonil =================
  inFrame(B, scene, F1.ox, F1.oz, F1.rot, (LB, g) => {
    const y0 = terrainH(F1.ox, F1.oz + 9);
    // --- CLÍNICA AUDITIVA: á dereita da saída da Ponte Vella, na esquina coa Rúa das Hortas ---
    { const s0 = -14, s1 = -4, W = s1 - s0, H = 14.6, D = 10;
      goyBuild(LB, g, { s0, s1, H, D, fl: FL, wall: '#ecebe6', roof: 'flat', paint(P) {
        P.rect(0, 0, P.W, P.H, '#f2f1ec'); P.ashlar(0, 0, P.W, 3.9, [170, 168, 160], true); P.noise(500, 0.04);
        P.sign(0.6, 2.7, 6.2, 0.6, 'CLÍNICA AUDITIVA', '#d4202b', '#ffffff', { glow: '#ff9a9a' });
        P.shop(0.8, 5.8, 2.4, '#d8d6d0', { glow: '#f4f6ff' }); P.door(7.6, 1.3, 2.6, '#3a3d42');
        for (let f = 0; f < 3; f++) for (const u of [0.8, 4.0, 7.2]) P.win(u, 4.4 + f * 3.1, 1.3, 1.9, { frame: '#f6f6f2', blind: RR(0, 0.5) });
      }, balconies: [0, 1, 2].map(f => ({ u: 0.5, w: 4.2, y: 4.2 + f * 3.1, d: 0.55 })) }, 1, y0);
      // fachada oeste, cara á Rúa das Hortas e á ponte, co rótulo
      const side = arCanvas(D, H); side.rect(0, 0, D, H, '#f2f1ec'); side.ashlar(0, 0, D, 3.9, [170, 168, 160], true); side.sign(0.5, 2.6, D - 1, 0.6, 'CLÍNICA AUDITIVA', '#d4202b', '#ffffff', { glow: '#ff9a9a' }); side.shop(0.8, D - 1.6, 2.4, '#d8d6d0'); for (let f = 0; f < 3; f++) for (const u of [1.0, 4.4, 7.6]) side.win(u, 4.4 + f * 3.1, 1.6, 1.6, { frame: '#f6f6f2', blind: 0.3 });
      const st = arTex(side), sm = new THREE.Mesh(new THREE.PlaneGeometry(D, H), nightMat(std({ map: st.t, emissiveMap: st.e, emissive: 0xffffff, emissiveIntensity: 0 }), 0, 1));
      sm.position.set(s0 - 0.02, y0 + H / 2, FL + D / 2); sm.rotation.y = -Math.PI / 2; g.add(sm);
    }
    // --- OFICINA DO PEREGRINO: na praza, fronte ao Bar Michael Cantón ---
    { const PF = 12, s0 = -1, s1 = 8.5, W = s1 - s0, H = 10.4, cx = (s0 + s1) / 2;
      goyBuild(LB, g, { s0, s1, H, D: 6.5, fl: PF, wall: '#b8a68a', roof: 'tile', roofH: 3.0, paint(P) {
        P.rect(0, 0, P.W, P.H, '#f4f2ec'); P.ashlar(0, 0, P.W, 7.2, [182, 164, 132], true); P.noise(500, 0.04);
        const x = P.x;
        [0.7, 4.2, 7.7].forEach((u, i) => {
          x.fillStyle = '#a8977a'; x.fillRect(P.X(u - 0.15), P.Y(3.3), P.S(1.9), P.S(3.3));
          x.fillStyle = '#cfe0e6'; x.fillRect(P.X(u), P.Y(3.0), P.S(1.6), P.S(3.0)); x.beginPath(); x.arc(P.X(u + 0.8), P.Y(3.0), P.S(0.8), Math.PI, 0); x.fill();
          x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(P.X(u + 0.15), P.Y(2.8), P.S(0.3), P.S(2.6));
          const cxu = P.X(u + 0.8), cy = P.Y(1.6), r = P.S(0.5);
          if (i % 2 === 0) { // cuncha de vieira estilizada
            x.fillStyle = 'rgba(40,70,140,.75)'; x.beginPath(); x.moveTo(cxu, cy + r); for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; x.lineTo(cxu + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9); } x.closePath(); x.fill();
            x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; for (let k = 1; k < 8; k++) { const a = Math.PI + k / 8 * Math.PI; x.beginPath(); x.moveTo(cxu, cy + r); x.lineTo(cxu + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9); x.stroke(); }
          } else { // frecha amarela do Camiño
            x.fillStyle = '#f2c21b'; x.beginPath(); x.moveTo(cxu - r, cy - r * 0.2); x.lineTo(cxu + r * 0.3, cy - r * 0.2); x.lineTo(cxu + r * 0.3, cy - r * 0.6); x.lineTo(cxu + r, cy); x.lineTo(cxu + r * 0.3, cy + r * 0.6); x.lineTo(cxu + r * 0.3, cy + r * 0.2); x.lineTo(cxu - r, cy + r * 0.2); x.closePath(); x.fill();
          }
        });
        P.sign(2.6, 3.35, 4.8, 0.45, 'OFICINA DO PEREGRINO', '#f4f2ec', '#2a4a8a');
        for (const u of [1.0, 4.5, 8.0]) P.win(u, 4.6, 1.2, 2.1, { frame: '#f4f2ec', blind: 0.2 });
        P.rect(0, 7.0, P.W, 0.25, '#d8cdb6');
      }, balconies: [0.8, 4.3, 7.8].map(u => ({ u, w: 1.6, y: 4.45, d: 0.45, col: '#c9bba0' })) }, 1, y0);
      goyGallery(g, W - 0.6, 2.8, 0.85, cx, y0 + 7.3, PF - 0.42, 0, { back: true, cols: 11 });
      { const wh = std({ color: 0xf4f2ec }), gm = std({ map: galleryTex(4, 2), roughness: 0.4 });
        const dm = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.9, 2.2), [wh, wh, wh, wh, wh, gm]); dm.position.set(cx, y0 + H + 1.1, PF + 1.2); g.add(dm);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.9, 4, 1), std({ color: 0xa8452e, roughness: 0.8 })); cap.rotation.y = Math.PI / 4; cap.scale.set(1, 1, 0.75); cap.position.set(cx, y0 + H + 2.5, PF + 1.2); g.add(cap); }
      const sh = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16, Math.PI, Math.PI), std({ color: 0xf2c21b, side: THREE.DoubleSide })); sh.position.set(cx, y0 + 3.95, PF - 0.05); sh.rotation.y = Math.PI; g.add(sh);
    }
    // --- chan de lousas da praza peonil ---
    { const pv = boxGeo(21, 0.3, 18, [5, 4]); xform(pv, 5.5, y0 - 0.1, 13.6); LB.paving.add(pv); }
    // --- mobiliario: bolardos, bancos de pedra e arboriñas ---
    for (let x = -3; x <= 15; x += 1.8) { const bo = new THREE.CylinderGeometry(0.09, 0.11, 0.85, 8); xform(bo, x, y0 + 0.42, 4.4); LB.metalDark.add(bo); addCircCol(x, 4.4, 0.14, 1, 'bolardo'); }
    for (const [x, z, r] of [[1.5, 9.4, 0], [7.5, 9.4, 0], [13, 12, 0.5], [-2.2, 12, 1.57]]) { const bn = boxGeo(2.2, 0.48, 0.6, [2, 1]); xform(bn, x, y0 + 0.24, z, r); LB.stone.add(bn); addOBBLocal(x, z, 1.1, 0.3, r); }
    for (const [x, z] of [[-2, 7.5], [4.5, 7.2], [11, 7.5], [14, 9.5]]) {
      const tr = new THREE.CylinderGeometry(0.07, 0.1, 2.4, 6); xform(tr, x, y0 + 1.2, z); LB.wood.add(tr);
      const cr = new THREE.IcosahedronGeometry(1.1, 0); xform(cr, x, y0 + 2.9, z); LB.vcol.add(colorize(cr, '#4f7a3a'));
      const grate = boxGeo(1.0, 0.03, 1.0); xform(grate, x, y0 + 0.08, z); LB.metalDark.add(grate);
    }
  });
}
function addOBBLocal(x, z, hx, hz, r) { addBoxCol(x - hx, z - hz, x + hx, z + hz, 0.5, 'banco'); }

/* ---------- cámara da Rúa do Comercio: multa (estrela) que se paga no Concello ---------- */
G.fine = { on: false, amount: 40 };
function initFine() {
  if (G.fineInit) return; G.fineInit = true;
  const b = OSM.bldgs.find(q => q.n === 'Concello de Monforte de Lemos'), c = b ? polyCentroid(b.p) : [-314, 189];
  const nr = nearRoad(c[0], c[1], r => r.type === 'car'); let px = nr.px, pz = nr.pz;
  if (G.concelloDoor) { G.fine.desk = { x: G.concelloDoor.x, z: G.concelloDoor.z }; } else {
  const dx = c[0] - px, dz = c[1] - pz, d = Math.hypot(dx, dz) || 1; px += dx / d * Math.min(d - 3, (nr.r ? nr.r.hw : 3) + 2.5); pz += dz / d * Math.min(d - 3, (nr.r ? nr.r.hw : 3) + 2.5);
  G.fine.desk = { x: px, z: pz }; }
  const tag = nameSprite('Concello · pagar multa', '#ff8a5c'); tag.visible = false; G.scene.add(tag); G.fine.tag = tag;
  const badge = document.createElement('div'); badge.id = 'fineBadge'; badge.hidden = true; $('hud').appendChild(badge);
  const st = document.createElement('style'); st.textContent = `#fineBadge{position:absolute;right:max(16px,env(safe-area-inset-right,0px));top:max(92px,env(safe-area-inset-top,0px));background:#2a0f12e8;border:2px solid #ff5a4a;border-radius:6px;padding:4px 10px;font:700 15px Barlow,sans-serif;color:#ffd9d4;pointer-events:none}#fineBadge b{color:#ffd23b;font-size:20px;margin-right:6px}
@media (pointer:coarse){#fineBadge{top:max(70px,env(safe-area-inset-top,0px));font-size:12px}}`; document.head.appendChild(st);
}
function updateFine(dt) {
  initFine(); const F = G.fine, car = G.player.car;
  if (!F.on && car && car.speed > 0.5) {
    const nr = nearRoad(car.x, car.z, r => r.name === 'Rúa do Comercio');
    if (nr.r && nr.d < nr.r.hw + 0.6) {
      F.on = true; toast('📷 Cámara de tráfico: entraches cun vehículo na Rúa do Comercio (zona peonil). Multa de 40 €: págaa no Concello!', 6);
      if (G.sfx.alert) G.sfx.alert(); setWaypoint(F.desk.x, F.desk.z); $('fade').classList.add('flash'); setTimeout(() => $('fade').classList.remove('flash'), 200);
    }
  }
  const bd = $('fineBadge'); bd.hidden = !F.on; if (F.on) bd.innerHTML = `<b>★</b>MULTA ${F.amount} € · paga no Concello`;
  const me = G.player.ped, d = Math.hypot(me.x - F.desk.x, me.z - F.desk.z);
  F.tag.visible = F.on && Math.hypot(camera.position.x - F.desk.x, camera.position.z - F.desk.z) < 200; F.tag.position.set(F.desk.x, groundH(F.desk.x, F.desk.z) + 2.8, F.desk.z);
  if (F.on && !G.player.car && d < 3.5 && !G.dialog) setPrompt(`${isTouch ? '★' : 'E'} · Pagar a multa no Concello (${F.amount} €)`);
}
function fineInteract() {
  const F = G.fine; if (!F.on || G.player.car || !F.desk) return false;
  const me = G.player.ped; if (Math.hypot(me.x - F.desk.x, me.z - F.desk.z) > 3.5) return false;
  const FU = (t, e) => ({ who: 'Funcionaria do Concello', text: t, ...e });
  if (G.player.money < F.amount) { openDialog([FU(`Multa por circular pola Rúa do Comercio: ${F.amount} euros. Ten ${G.player.money}... Non aceptamos pagos en simpatía, sentímolo. Volva cando os teña.`)]); return true; }
  openDialog([
    FU('A ver... matrícula captada pola cámara da Rúa do Comercio, zona peonil. Corenta euros, por favor.'),
    FU('A cámara nunca dorme. Nin sequera na sesta.'),
    () => { G.player.money -= F.amount; $('money').textContent = G.player.money + ' €'; if (!G.story) { save.money = G.player.money; persist(); } F.on = false; setWaypoint(null); toast('Multa pagada. A estrela desaparece.'); },
    FU('Pagada. E lembre: a Rúa do Comercio é para camiñar, mercar e tomar algo. Non para facer de Fernando Alonso.'),
  ]);
  return true;
}
