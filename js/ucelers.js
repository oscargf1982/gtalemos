'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Restaurante Pulpería UCELERS
   (Rúa de Chantada, 48) e as dúas casas veciñas, segundo a foto
   ========================================================== */
const UCEL = { A: [-612, 116], B: [-394, 226], s: 100 };

function ucelersLandmarks() {
  const [ax, az] = UCEL.A, [bx, bz] = UCEL.B, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
  const F = LM.ucelers = makeFrame(ax, az, Math.atan2(-uz, ux)); // x ao longo da rúa; z<0 = lado norte
  const [px, pz] = F.pt(UCEL.s, 0), nr = nearRoad(px, pz, r => r.name === 'Rúa de Chantada');
  UCEL.hw = nr.r ? nr.r.hw : 4; UCEL.fl = UCEL.hw + (nr.r && nr.r.sw ? nr.r.sw : 2.4);
  const P = frameRectPoly(F, UCEL.s - 15, -UCEL.fl - 18, UCEL.s + 15, -UCEL.fl + 0.4);
  reserve(P); (G.noTrees = G.noTrees || []).push(P);
  G.namedZones.push({ n: 'Restaurante Pulpería UCELERS', p: frameRectPoly(F, UCEL.s - 4.5, -UCEL.fl - 10, UCEL.s + 4.5, -UCEL.fl + 3) });
}

function ucelersLogo(P, u, y, w, h) {
  // faixa negra co rótulo: logotipo de polbo estilizado + UCELERS
  P.rect(u, y, w, h, '#121214');
  const x = P.x, cx = P.X(u + h * 0.75), cy = P.Y(y + h / 2), r = P.S(h * 0.32);
  x.strokeStyle = '#f4f4f0'; x.lineWidth = Math.max(2, r * 0.18);
  x.beginPath(); x.arc(cx, cy - r * 0.2, r * 0.55, Math.PI, 0); x.stroke();
  for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(cx + k * r * 0.25, cy); x.quadraticCurveTo(cx + k * r * 0.6, cy + r * 0.8, cx + k * r * 0.9, cy + r * 0.3); x.stroke(); }
  x.fillStyle = '#f4f4f0'; x.textAlign = 'left'; x.textBaseline = 'middle';
  x.font = `700 ${P.S(h * 0.62)}px Georgia, "Times New Roman", serif`; x.fillText('UCELERS', P.X(u + h * 1.5), P.Y(y + h * 0.5));
  x.font = `600 ${P.S(h * 0.2)}px Barlow, sans-serif`; x.textAlign = 'right'; x.fillText('Pulpería', P.X(u + w - 0.15), P.Y(y + h * 0.66)); x.fillText('Restaurante', P.X(u + w - 0.15), P.Y(y + h * 0.36));
  P.ex.fillStyle = '#fff3d8'; P.ex.font = x.font; P.ex.textAlign = 'left'; P.ex.textBaseline = 'middle'; P.ex.font = `700 ${P.S(h * 0.62)}px Georgia, serif`; P.ex.fillText('UCELERS', P.X(u + h * 1.5), P.Y(y + h * 0.5));
}
function makeJeep() {
  const g = new THREE.Group(), blk = std({ color: 0x111113, roughness: 0.4, metalness: 0.4 }), wht = std({ color: 0xf2f0ea, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.4), blk); body.position.y = 0.75; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.15, 1.1), blk); hood.position.set(0, 1.15, 1.1); g.add(hood);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.8, 2.0), wht); cab.position.set(0, 1.5, -0.55); g.add(cab);
  const glass = std({ color: 0x1d262e, roughness: 0.1, metalness: 0.5 });
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 0.05), glass); ws.position.set(0, 1.5, 0.47); ws.rotation.x = -0.2; g.add(ws);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.45, 0.9), glass); sw.position.set(s * 0.74, 1.55, -0.2); g.add(sw); const st = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 2.6), wht); st.position.set(s * 0.76, 0.75, 0); g.add(st); }
  for (const [x, z] of [[-0.72, 1.1], [0.72, 1.1], [-0.72, -1.1], [0.72, -1.1]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), blk); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 10), std({ color: 0xd8cfa8 })); hub.rotation.z = Math.PI / 2; hub.position.set(x, 0.36, z); g.add(hub); }
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 12), blk); spare.rotation.x = Math.PI / 2; spare.position.set(0, 0.95, -1.82); g.add(spare);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function buildUcelers(B, scene) {
  const F = LM.ucelers; if (!F) return;
  const s = UCEL.s, fl = UCEL.fl;
  inFrame(B, scene, F.ox, F.oz, F.rot, (LB, g) => {
    const [wx, wz] = F.pt(s, -fl - 3), y0 = terrainH(wx, wz);
    // --- veciño da esquerda: bloque alto de formigón recuado, muro con balaústres e cocheira ---
    { const b = { s0: s - 14, s1: s - 4.3, H: 16.5, D: 12, fl: fl + 5, wall: '#cdbfa8', roof: 'flat', paint(P) {
      P.rect(0, 0, P.W, P.H, '#cbbca4'); for (let y = 0; y < P.H; y += 0.4) for (let u = (y / 0.4) % 2 * 0.3; u < P.W; u += 0.6) { const v = RR(-10, 10); P.rect(u, y, 0.58, 0.38, `rgb(${200 + v},${186 + v},${162 + v})`); }
      for (let f = 0; f < 4; f++) P.win(P.W - 2.4, 4.0 + f * 3.0, 1.2, 1.5, { frame: '#e8e4da', blind: 0.3 }); P.noise(800, 0.05);
    } }; b.front = arTex((() => { const P = arCanvas(b.s1 - b.s0, b.H); b.paint(P); return P; })()); arBuild(LB, g, b, -1, y0); }
    // muro baixo de granito con balaústres
    { const W = 6.6, cx = s - 14 + W / 2, P = arCanvas(W, 1.6); P.ashlar(0, 0, W, 0.7, [180, 168, 150], true); P.rect(0, 1.45, W, 0.15, '#cfc5b2');
      for (let u = 0.15; u < W; u += 0.32) { P.rect(u, 0.7, 0.16, 0.75, '#d6cbb6'); P.rect(u - 0.03, 1.0, 0.22, 0.12, '#cfc5b2'); }
      for (let u = 0.2; u < W; u += 0.32) P.x.clearRect(P.X(u + 0.13), P.Y(1.45), P.S(0.16), P.S(0.75));
      const t = arTex(P), m = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.6), std({ map: t.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.9 })); m.position.set(cx, y0 + 0.8, -fl - 0.15); g.add(m);
      addBoxCol(cx - W / 2, -fl - 0.3, cx + W / 2, -fl, 1.6, 'muro'); const pil = boxGeo(0.45, 1.8, 0.45); xform(pil, cx + W / 2, y0 + 0.9, -fl - 0.15); LB.stone.add(pil); }
    // cocheira: tellado negro e portal negro
    { const c0 = s - 7.4, c1 = s - 4.3, cw = c1 - c0, cc = (c0 + c1) / 2;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(cw + 1.6, 0.18, 5.4), std({ color: 0x1d1f22, roughness: 0.6 })); roof.position.set(cc - 0.6, y0 + 2.75, -fl - 2.6); roof.rotation.x = -0.06; roof.castShadow = true; g.add(roof);
      const gate = new THREE.Mesh(new THREE.PlaneGeometry(cw, 2.3), std({ color: 0x121214, roughness: 0.5, metalness: 0.5 })); gate.position.set(cc, y0 + 1.15, -fl - 0.25); g.add(gate);
      addBoxCol(c0, -fl - 0.4, c1, -fl - 0.1, 2.4, 'portal'); }
    // --- Restaurante Pulpería UCELERS (nº 48): dúas plantas brancas, persiana metálica e porta branca ---
    { const b = { s0: s - 4.3, s1: s + 4.3, H: 6.9, D: 14, wall: '#efede8', roof: 'flat', paint(P) {
      P.rect(0, 0, P.W, P.H, '#f0eee9'); P.noise(700, 0.05); P.stains(0.5);
      P.rect(0, P.H - 0.25, P.W, 0.25, '#e2ded6'); P.rect(0, 3.55, P.W, 0.12, '#dad6ce');
      // planta alta: dúas fiestras con persianas baixadas e un cartel branco no medio
      P.win(1.1, 4.2, 1.9, 1.5, { blind: 1, blindCol: '#e6dfcf', frame: '#e4e0d8', lit: 0 }); P.win(5.4, 4.2, 1.9, 1.5, { blind: 1, blindCol: '#e6dfcf', frame: '#e4e0d8', lit: 0 });
      P.rect(3.65, 4.85, 0.8, 0.45, '#fbfbf8');
      // baixo: faixa negra co rótulo, persiana metálica do comedor e porta da vivenda
      P.rect(0.15, 0, 5.15, 3.5, '#121214'); ucelersLogo(P, 0.15, 2.95, 5.15, 0.6); P.shutter(0.35, 4.75, 2.85, '#a9adb2');
      P.rect(5.3, 0, 0.75, 1.0, '#2f62b8'); P.rect(7.55, 0, 0.75, 1.0, '#2f62b8');
      // porta branca con debuxo xeométrico negro
      P.rect(6.1, 0, 1.4, 2.65, '#f6f6f2'); const x = P.x; x.strokeStyle = '#121214'; x.lineWidth = 3;
      for (let i = 0; i < 6; i++) { x.strokeRect(P.X(6.25 + (i % 2) * 0.55), P.Y(0.5 + Math.floor(i / 2) * 0.68 + 0.55), P.S(0.5), P.S(0.55)); x.beginPath(); x.moveTo(P.X(6.25 + (i % 2) * 0.55), P.Y(0.5 + Math.floor(i / 2) * 0.68)); x.lineTo(P.X(6.75 + (i % 2) * 0.55), P.Y(1.05 + Math.floor(i / 2) * 0.68)); x.stroke(); }
      P.rect(6.65, 2.75, 0.32, 0.22, '#f4f4f0'); x.fillStyle = '#121214'; x.font = `700 ${P.S(0.16)}px Barlow`; x.textAlign = 'center'; x.fillText('48', P.X(6.81), P.Y(2.82));
      P.rect(5.55, 1.6, 0.18, 0.18, '#1f62c8'); // placa de restaurante
      // tubaxe e caixa de contadores
      P.rect(5.95, 3.0, 0.08, 3.9, '#d0ccc4'); P.rect(5.6, 3.65, 0.4, 0.25, '#d8d4cc');
    } }; b.front = arTex((() => { const P = arCanvas(b.s1 - b.s0, b.H); b.paint(P); return P; })()); arBuild(LB, g, b, -1, y0);
      // antena no tellado
      const ant = boxGeo(0.04, 1.6, 0.04); xform(ant, s + 0.5, y0 + 7.7, -fl - 4); LB.metal.add(ant); const ab = boxGeo(0.8, 0.03, 0.03); xform(ab, s + 0.5, y0 + 8.3, -fl - 4); LB.metal.add(ab);
    }
    // --- veciño da dereita: plaqueta verde xaspeada, rede verde de obra e portais de reixa ---
    { const b = { s0: s + 4.3, s1: s + 15, H: 7.2, D: 12, wall: '#e9ece6', roof: 'none', paint(P) {
      P.rect(0, 0, P.W, P.H, '#eef0ea'); P.noise(600, 0.05);
      P.rect(0, 3.7, P.W, P.H - 3.7, '#6f9a8a'); for (let i = 0; i < 2200; i++) { const v = RR(-30, 30); P.x.fillStyle = `rgba(${90 + v},${140 + v},${120 + v},.6)`; P.x.fillRect(R() * P.c.width, P.Y(RR(3.7, P.H)), 2, 2); }
      P.rect(0, 0, P.W, 1.0, '#5f8a74'); for (let i = 0; i < 900; i++) { P.x.fillStyle = `rgba(230,240,235,${RR(0.2, 0.6)})`; P.x.fillRect(R() * P.c.width, P.Y(RR(0, 1.0)), 2, 2); }
      P.rect(0, 3.55, P.W, 0.15, '#e8ebe4');
      for (const [u, w] of [[0.8, 3.6], [8.6, 2.1]]) { P.rect(u, 0, w, 2.9, '#cfd2d4'); P.x.strokeStyle = '#7a7e82'; P.x.lineWidth = 2; for (let k = 0.08; k < w; k += 0.13) { P.x.beginPath(); P.x.moveTo(P.X(u + k), P.Y(2.9)); P.x.lineTo(P.X(u + k), P.Y(0)); P.x.stroke(); } P.x.strokeRect(P.X(u), P.Y(2.9), P.S(w), P.S(2.9)); }
      P.rect(2.4, 1.6, 0.3, 0.3, '#c8202a'); P.rect(2.43, 1.63, 0.24, 0.24, '#1f62c8');
      P.win(1.2, 4.3, 3.0, 1.8, { frame: '#e8ebe4', blind: 0.2 }); P.win(6.0, 4.3, 3.0, 1.8, { frame: '#e8ebe4', blind: 0.5 });
    } }; b.front = arTex((() => { const P = arCanvas(b.s1 - b.s0, b.H); b.paint(P); return P; })()); arBuild(LB, g, b, -1, y0);
      // faiado branco con buhardilla
      const W = b.s1 - b.s0, cx = (b.s0 + b.s1) / 2, att = boxGeo(W - 1, 2.2, 7); xform(att, cx, y0 + 8.3, -fl - 6.5); LB.white.add(att);
      const rf = hipRoof(W - 1, 7, 1.4, 4, 0.4); xform(rf, cx, y0 + 9.4, -fl - 6.5); LB.tile.add(rf);
      const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), std({ color: 0xe6e1d6, roughness: 0.6 })); dm.position.set(cx + 1.2, y0 + 8.4, -fl - 2.97); g.add(dm);
      // rede verde de obra sobre a planta alta, con andamio
      const net = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, 3.6), new THREE.MeshStandardMaterial({ color: 0x2fd39a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 0.9 }));
      net.position.set(cx, y0 + 5.4, -fl + 0.55); net.rotation.z = 0.0; g.add(net);
      for (let u = b.s0 + 0.4; u < b.s1; u += 2.5) { const p = new THREE.CylinderGeometry(0.03, 0.03, 4.0, 6); xform(p, u, y0 + 5.3, -fl + 0.5); LB.metal.add(p); }
      for (const yy of [3.6, 7.1]) { const p = new THREE.CylinderGeometry(0.03, 0.03, W, 6); p.rotateZ(Math.PI / 2); xform(p, cx, y0 + yy, -fl + 0.5); LB.metal.add(p); }
    }
    // o todoterreo negro e branco aparcado diante
    const jeep = makeJeep(); jeep.position.set(s - 1.2, terrainH(wx, wz), -UCEL.hw + 1.15); jeep.rotation.y = Math.PI / 2; g.add(jeep);
    addBoxCol(s - 2.95, -UCEL.hw + 0.4, s + 0.55, -UCEL.hw + 1.9, 2, 'coche');
  });
  G.ucelersDoor = (([x, z]) => ({ x, z }))(F.pt(s - 1.5, -fl + 1.2));
}
