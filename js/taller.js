'use strict';
/* ==========================================================
   GTA LEMOS 27400 · «Vía morta» · O taller da Casa Juana e o ollo de maquinista
   1) Escena de aventura gráfica (estilo LucasArts) na nave de atrás da Casa Juana
      (Doutor Casares, 211): a antiga carpintaría do señor Alfredo Fernández Gutiérrez.
      Datos reais: motor Siemens de 10 HP, primeira transmisión de ~10 m e 7 poleas,
      segunda de ~4,5 m e 6 poleas; maquinaria vendida o 2/6/1952 por 30.000 pesetas.
      Ficción: a foto cos aprendices (Xosé N.), as pegadas recentes e o parte de 1958.
   2) Ollo de maquinista (Q ou botón OLLO): o mundo vólvese gris e as pistas
      resáltanse en amarelo, tanto no taller como arredor das cocheiras do museo.
   ========================================================== */
const TALLER = { el: null, cv: null, mode: null, found: {}, ojo: 0, hover: null };
const TALLER_W = 960, TALLER_H = 540;
// puntos de interese (rectángulos na escena 960×540)
const TALLER_HOT = {
  pernos: { r: [640, 452, 900, 530], n: 'Marcas no chan', lines: () => [MA('Agujeros de pernos en el suelo, en grupos de cuatro. Aquí estuvieron atornilladas las máquinas: sierra, cepilladora, torno, taladro... Por las marcas, eran pesadas. Muy pesadas.', { mood: 'pensativo' })] },
  viga: { r: [10, 4, 950, 132], n: 'A viga da transmisión', lines: () => [MA('La viga de la primera transmisión. Diez metros, siete soportes para siete poleas. Hoy solo quedan las vigas, el polvo y la luz entrando por el tejado. Pero aquí un motor movía el eje y las correas bajaban a cada máquina. Esto no era una carpintería de barrio: era una fábrica.', { mood: 'sorprendido' }), MA('El séptimo soporte, el del fondo, tiene la tapa soldada. Los otros seis se abren con la mano. ¿Quién suelda una tapa de una polea?', { mood: 'dudoso' })] },
  caixon: { r: [70, 436, 214, 522], n: 'O caixón do banco', doc: true, lines: () => [MA('En el cajón del banco, entre clavos oxidados, una copia amarillenta: «Escritura número 375. 2 de junio de 1952». El inventario de todo lo que había en esta nave.', { mood: 'sorprendido' }),
    MA('Sierra de cinta, sierra circular, cepilladora-regruesadora, torno para madera, máquina de espigar, pulidora, taladros, cuatro prensas, tres bancos de trabajo... varios motores Siemens y dos transmisiones con poleas.', { mood: 'pensativo' }),
    MA('Todo, por treinta mil pesetas. Y los compradores: un ingeniero de Caminos y un contratista. ¿Para qué quiere un ingeniero de Caminos una carpintería entera?', { mood: 'dudoso' })] },
  foto: { r: [484, 192, 566, 268], n: 'A foto da parede', lines: () => [MA('Una foto clavada en la pared, comida por la humedad. Un señor con bigote y tres chavales con mono delante de una sierra enorme.', { mood: 'pensativo' }), MA('Detrás, a lápiz: «O señor Alfredo cos aprendices, 1949. Pepe, Manolo, Xosé N.». Xosé N.... ¿N. de qué?', { mood: 'dudoso' })] },
  pegadas: { r: [262, 456, 452, 530], n: 'Pegadas no po', lines: () => [MA('Huellas en el polvo. Recientes: el polvo de encima no ha vuelto a posarse. Van directas debajo del séptimo soporte... y vuelven.', { mood: 'sorprendido' }), MA('Alguien ha estado aquí antes que yo, buscando lo mismo. Y no tiene llave. O sí la tiene.', { mood: 'esceptico' })] },
};
const TALLER_PARTE = { r: [660, 140, 820, 250], n: 'O sétimo soporte' };

function tallerEl() {
  if (TALLER.el) return TALLER.el;
  const el = document.createElement('div'); el.id = 'tallerScene'; el.hidden = true;
  el.innerHTML = `<canvas width="${TALLER_W}" height="${TALLER_H}"></canvas><div class="tl-bar"><span class="tl-t">O taller da Casa Juana</span><span class="tl-c"></span><button class="tl-ojo" type="button">OLLO (Q)</button><button class="tl-x" type="button">Saír</button></div><div class="tl-hint"></div><div class="tl-doc" hidden><h4>ESCRITURA N.º 375 · 2 de xuño de 1952</h4><p>Inventario da carpintaría de D. Alfredo Fernández Gutiérrez (Casa Juana)</p><table><tr><td>Serra de cinta</td><td>1</td></tr><tr><td>Serra circular</td><td>1</td></tr><tr><td>Cepilladora/regruesadora</td><td>1</td></tr><tr><td>Torno para madeira</td><td>1</td></tr><tr><td>Máquina de espigar</td><td>1</td></tr><tr><td>Pulidora</td><td>1</td></tr><tr><td>Taladros</td><td>sen precisar</td></tr><tr><td>Prensas</td><td>4</td></tr><tr><td>Bancos de traballo</td><td>3</td></tr><tr><td>Motores eléctricos Siemens</td><td>varios</td></tr><tr><td>Transmisións con poleas</td><td>2</td></tr></table><p class="tl-pr">Prezo: 30.000 pesetas</p></div>`;
  const st = document.createElement('style');
  st.textContent = `#tallerScene{position:fixed;inset:0;z-index:24;background:#0b0c0e;display:flex;flex-direction:column;align-items:center;justify-content:center}#tallerScene[hidden]{display:none}
#tallerScene canvas{width:min(100vw,calc((100vh - 64px) * 16 / 9));height:auto;cursor:crosshair;transition:filter .35s}
#tallerScene .tl-bar{display:flex;gap:10px;align-items:center;padding:8px 12px;font-family:Barlow,sans-serif;color:#e9e2d0;width:min(100vw,960px);box-sizing:border-box}
#tallerScene .tl-t{font-family:"Big Shoulders Display",sans-serif;font-size:20px;color:#f2a33a;letter-spacing:.04em}#tallerScene .tl-c{flex:1;opacity:.8}
#tallerScene button{font:700 15px Barlow,sans-serif;padding:8px 14px;border-radius:4px;border:0;background:#2a2f36;color:#fff;cursor:pointer}#tallerScene .tl-ojo{background:#c9a21a;color:#111}
#tallerScene .tl-doc{position:absolute;top:6%;left:50%;transform:translateX(-50%) rotate(-1.2deg);width:min(86vw,420px);background:#efe4c8;color:#2a2116;font:15px Georgia,serif;padding:16px 20px;box-shadow:0 10px 40px #000c;border:1px solid #b9a77e}#tallerScene .tl-doc h4{margin:0 0 4px;font:700 16px Georgia,serif;letter-spacing:.04em}#tallerScene .tl-doc p{margin:0 0 8px;font-style:italic;font-size:13px}#tallerScene .tl-doc table{width:100%;border-collapse:collapse}#tallerScene .tl-doc td{border-bottom:1px dotted #8a7a5a;padding:2px 0}#tallerScene .tl-doc td+td{text-align:right}#tallerScene .tl-doc .tl-pr{margin:8px 0 0;text-align:right;font-weight:700;font-style:normal}
#tallerScene .tl-hint{position:absolute;pointer-events:none;font:700 14px Barlow,sans-serif;color:#ffe36b;text-shadow:0 1px 4px #000;transform:translate(-50%,-140%)}`;
  document.head.appendChild(st); document.body.appendChild(el);
  TALLER.el = el; TALLER.cv = el.querySelector('canvas');
  el.querySelector('.tl-x').onclick = () => tallerClose(false);
  el.querySelector('.tl-ojo').onclick = () => ojoToggle();
  const pos = e => { const r = TALLER.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * TALLER_W, (e.clientY - r.top) / r.height * TALLER_H]; };
  const hit = ([x, y]) => { for (const [k, h] of Object.entries(tallerHots())) { const [a, b, c, d] = h.r; if (x >= a && x <= c && y >= b && y <= d) return k; } return null; };
  TALLER.cv.addEventListener('pointermove', e => { const k = hit(pos(e)); TALLER.hover = k; const hint = el.querySelector('.tl-hint'); if (k) { hint.textContent = tallerHots()[k].n; hint.style.left = e.clientX + 'px'; hint.style.top = e.clientY + 'px'; hint.hidden = false; } else hint.hidden = true; });
  TALLER.cv.addEventListener('pointerdown', e => { if (G.dialog) return; const k = hit(pos(e)); if (k) tallerExamine(k); });
  return el;
}
function tallerHots() { return TALLER.mode === 'parte' ? { soporte: TALLER_PARTE } : TALLER_HOT; }
function tallerOpen(mode, onDone) {
  tallerEl(); TALLER.mode = mode; TALLER.onDone = onDone; TALLER.found = {}; TALLER.el.hidden = false; G.martin.inTaller = true;
  if (document.exitPointerLock) try { document.exitPointerLock(); } catch (e) { }
  tallerDraw(); tallerCount();
  if (!TALLER.raf) { const loop = () => { if (TALLER.el.hidden) { TALLER.raf = 0; return; } tallerDraw(); TALLER.raf = requestAnimationFrame(loop); }; TALLER.raf = requestAnimationFrame(loop); }
  openDialog(mode === 'parte'
    ? [MA('Otra vez en la nave de atrás. Ahora sé lo que busco: «onde se moven as correas». Las correas bajaban de la viga. Y hay un soporte que alguien soldó.', { mood: 'convencido' })]
    : [MA('La nave de atrás de la Casa Juana. Huele a serrín de hace setenta años y a humedad. Si el silbato apunta a esta casa, la respuesta está aquí dentro.', { mood: 'pensativo' }),
      MA(isTouch ? '(Toca lo que quieras examinar. El botón OLLO lo pone todo gris y marca en amarillo lo importante.)' : '(Haz clic en lo que quieras examinar. Con Q, el ojo de maquinista lo pone todo gris y marca en amarillo lo importante.)', { mood: 'sonriente' })]);
}
function tallerClose(done) {
  if (!TALLER.el) return; TALLER.el.hidden = true; TALLER.el.querySelector('.tl-doc').hidden = true; G.martin.inTaller = false; TALLER.ojo = 0; ojoApply();
  if (done && TALLER.onDone) { const f = TALLER.onDone; TALLER.onDone = null; f(); }
}
function tallerCount() {
  const n = Object.keys(TALLER.found).length, t = Object.keys(tallerHots()).length;
  TALLER.el.querySelector('.tl-c').textContent = TALLER.mode === 'parte' ? 'Busca onde se movían as correas' : `Pistas: ${n}/${t}`;
}
function tallerExamine(k) {
  const H = tallerHots()[k]; if (!H) return;
  if (TALLER.mode === 'parte') { tallerClose(true); return; }
  const first = !TALLER.found[k]; TALLER.found[k] = true; tallerCount();
  const lines = H.lines(), doc = TALLER.el.querySelector('.tl-doc');
  if (H.doc) { doc.hidden = false; lines.push(() => { doc.hidden = true; }); }
  if (first && Object.keys(TALLER.found).length === Object.keys(TALLER_HOT).length) lines.push(() => setTimeout(() => tallerClose(true), 300));
  openDialog(lines);
}
/* ---------- debuxo da nave: fotos reais do taller vello da Casa Juana + atrezo do xogo ---------- */
const TALLER_IMG = {};
function tallerImg(k) { if (!TALLER_IMG[k]) { const im = new Image(); im.src = `img/taller-${k}.jpg`; TALLER_IMG[k] = im; } const im = TALLER_IMG[k]; return im.complete && im.naturalWidth ? im : null; }
// recorte 16:9 de cada foto (vertical): y inicial en píxeles da foto de 1186 de ancho
const TALLER_CROP = { 1: 420, 2: 120 };
function tallerDraw() {
  const c = TALLER.cv, x = c.getContext('2d'), W = TALLER_W, H = TALLER_H, t = performance.now() / 1000;
  const k = TALLER.mode === 'parte' ? 2 : 1, im = tallerImg(k), ojo = TALLER.ojo > 0;
  x.save(); x.filter = ojo ? 'grayscale(1) brightness(.62) contrast(1.15)' : 'sepia(.12) brightness(.92)';
  if (im) { const sc = im.naturalWidth / 1186; x.drawImage(im, 0, TALLER_CROP[k] * sc, im.naturalWidth, im.naturalWidth * 9 / 16, 0, 0, W, H); }
  else { x.fillStyle = '#2b2620'; x.fillRect(0, 0, W, H); }
  x.filter = ojo ? 'grayscale(1) brightness(.75)' : 'none';
  if (k === 1) {
    // caixón de madeira no chan, á esquerda
    x.fillStyle = '#5a3f26'; x.fillRect(76, 452, 132, 64); x.fillStyle = '#6e4e30'; x.fillRect(76, 444, 132, 14); x.fillStyle = '#3a281a'; for (let i = 0; i < 3; i++) x.fillRect(80, 470 + i * 16, 124, 2); x.fillStyle = '#c9a54a'; x.fillRect(136, 448, 14, 5);
    x.fillStyle = 'rgba(239,228,200,.9)'; x.save(); x.translate(150, 446); x.rotate(-0.2); x.fillRect(0, -8, 30, 14); x.restore();
    // foto vella cravada no piar
    x.fillStyle = '#2a2018'; x.fillRect(492, 198, 66, 62); x.fillStyle = '#b9ae94'; x.fillRect(497, 203, 56, 44); x.fillStyle = '#5a5246'; for (let i = 0; i < 4; i++) x.fillRect(503 + i * 12, 220, 7, 24); x.fillStyle = '#8a7e66'; x.fillRect(497, 249, 56, 6);
    // pegadas recentes no po
    for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(25,20,16,.6)'; x.beginPath(); x.ellipse(276 + i * 23, 520 - i * 7 - (i % 2) * 9, 5, 9, 0.9, 0, 7); x.fill(); }
    // pernos (catro por máquina) no chan da dereita
    for (const [bx, by] of [[660, 470], [760, 488], [830, 462]]) { x.fillStyle = 'rgba(30,26,22,.55)'; x.fillRect(bx, by, 50, 22); x.fillStyle = '#151311'; for (const [dx, dy] of [[4, 4], [42, 4], [4, 14], [42, 14]]) x.fillRect(bx + dx, by + dy, 5, 5); }
  } else {
    // soporte da transmisión enriba do piar, coa tapa soldada
    x.fillStyle = '#3d3d42'; x.fillRect(708, 168, 40, 52); x.fillStyle = '#25252a'; x.beginPath(); x.arc(728, 228, 16, 0, 7); x.fill(); x.fillStyle = '#a08850'; x.fillRect(704, 192, 48, 4);
  }
  x.restore();
  // OLLO DE MAQUINISTA: as pistas, en amarelo
  if (ojo) {
    const pulse = 0.6 + Math.sin(t * 6) * 0.4;
    for (const [kk, h] of Object.entries(tallerHots())) { const [a, b, cc, d] = h.r; x.strokeStyle = `rgba(255,214,40,${0.55 + pulse * 0.45})`; x.lineWidth = 3; x.setLineDash([8, 5]); x.strokeRect(a - 4, b - 4, cc - a + 8, d - b + 8); x.setLineDash([]);
      x.fillStyle = 'rgba(255,214,40,.16)'; x.fillRect(a, b, cc - a, d - b); x.fillStyle = TALLER.found[kk] ? '#9be38a' : '#ffd628'; x.font = 'bold 16px Barlow, sans-serif'; x.shadowColor = '#000'; x.shadowBlur = 4; x.fillText((TALLER.found[kk] ? '✔ ' : '') + h.n, a, b > 24 ? b - 10 : d + 20); x.shadowBlur = 0; }
  }
}

/* ==========================================================
   OLLO DE MAQUINISTA no mundo 3D: gris + pistas resaltadas en amarelo
   ========================================================== */
const OJO = { el: null, props: null };
function ojoActiveCtx() { const M = G.martin; return !!(M && (M.inTaller || (save.martin && save.martin.step === 'a3_pistas'))); }
function ojoToggle() {
  if (!ojoActiveCtx()) return;
  if (G.martin.inTaller) { TALLER.ojo = TALLER.ojo > 0 ? 0 : 1; TALLER.el.querySelector('.tl-ojo').textContent = TALLER.ojo ? 'OLLO: ON' : 'OLLO (Q)'; return; }
  G.martin.eyeT = (G.martin.eyeT || 0) > 0 ? 0 : 12;
  if (G.martin.eyeT) toast(pick(['Martín: «Ojo de maquinista. Treinta mil kilómetros mirando señales sirven para algo.»', 'Martín: «Detalles. Los detalles nunca mienten. Las personas, a veces.»']), 3);
}
function ojoApply() {
  const on = !!(G.martin && !G.martin.inTaller && (G.martin.eyeT || 0) > 0);
  const cv = typeof renderer !== 'undefined' && renderer && renderer.domElement;
  if (cv && cv._ojo !== on) { cv._ojo = on; cv.style.filter = on ? 'grayscale(1) brightness(.8) contrast(1.08)' : ''; }
  if (OJO.el) OJO.el.hidden = !on;
  return on;
}
/* atrezo visible das pistas arredor das cocheiras: graxa no carril, pegadas, pizarra e o motor Siemens */
function ojoBuildProps() {
  const M = G.martin; if (OJO.props || !M || !M.pistas || !LM.station) return;
  const F = LM.station, P = (lx, lz) => F.pt(lx, lz), g = new THREE.Group(); OJO.props = g;
  const put = (m, lx, lz, y, yawL) => { const [wx, wz] = P(lx, lz); m.position.set(wx, groundH(wx, wz) + y, wz); if (yawL !== undefined) m.rotation.y = F.yaw(yawL); g.add(m); return m; };
  // graxa: raia negra brillante sobre o carril e pingas nas travesas
  const grease = new THREE.MeshStandardMaterial({ color: 0x0b0b08, roughness: 0.15, metalness: 0.6 });
  put(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 2.6), grease), 393.33, -83.5, 0.43, 0);
  for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.12 + (i % 2) * 0.06, 10), grease); d.rotation.x = -Math.PI / 2; put(d, 393.1 + (i % 3) * 0.12, -84.6 + i * 0.5, 0.36); }
  // pegadas con carbonilla, dende a porta das cocheiras cara ao carril
  const fp = new THREE.MeshBasicMaterial({ color: 0x1c1a17, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.065, 8), fp); s.rotation.x = -Math.PI / 2; s.scale.set(1, 2.1, 1); put(s, 393.6 - (i % 2) * 0.35, -126 + i * 0.75, 0.04); }
  // pizarra na parede das cocheiras
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192; const x = cv.getContext('2d');
  x.fillStyle = '#1d2a22'; x.fillRect(0, 0, 256, 192); x.strokeStyle = '#8a6a3a'; x.lineWidth = 10; x.strokeRect(0, 0, 256, 192);
  x.fillStyle = '#e8e6dc'; x.font = 'italic 22px Georgia, serif'; ['Presión: 9 kg', 'Probar inxector', 'Mércores: tubos', 'Sábado: 21:00 ✓'].forEach((s, i) => x.fillText(s, 20, 45 + i * 40));
  const bt = new THREE.CanvasTexture(cv); bt.encoding = THREE.sRGBEncoding;
  put(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.98, 0.05), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.9 })), 395.82, -153, 1.6, -Math.PI / 2);
  // motor Siemens con poleas, baixo unha lona á beira da cochera
  const green = new THREE.MeshStandardMaterial({ color: 0x2e4a34, roughness: 0.6, metalness: 0.4 }), iron = new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.5, metalness: 0.7 });
  const mot = new THREE.Group(); mot.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 14), green)); mot.children[0].rotation.z = Math.PI / 2; mot.children[0].position.y = 0.5;
  for (let i = 0; i < 3; i++) { const pu = new THREE.Mesh(new THREE.CylinderGeometry(0.3 - i * 0.06, 0.3 - i * 0.06, 0.12, 14), iron); pu.rotation.z = Math.PI / 2; pu.position.set(0.66 + i * 0.16, 0.5, 0); mot.add(pu); }
  const lona = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0x5a6a4a, roughness: 1 })); lona.position.set(-0.2, 0.95, 0); lona.rotation.z = 0.25; mot.add(lona);
  put(mot, 393.6, -170, 0, 0);
  G.scene.add(g);
  // capa HTML para os resaltes amarelos (non lle afecta o gris do lenzo)
  const el = document.createElement('div'); el.id = 'ojoLayer'; el.hidden = true;
  el.style.cssText = 'position:fixed;inset:0;z-index:6;pointer-events:none';
  document.body.appendChild(el); OJO.el = el;
  const st = document.createElement('style');
  st.textContent = '.ojo-mk{position:absolute;transform:translate(-50%,-50%);border:3px dashed #ffd628;border-radius:50%;box-shadow:0 0 18px #ffd62899,inset 0 0 18px #ffd62855;animation:ojoP 1s ease-in-out infinite}.ojo-lb{position:absolute;transform:translate(-50%,0);font:800 15px Barlow,sans-serif;color:#ffd628;text-shadow:0 1px 4px #000;white-space:nowrap}.ojo-lb.ok{color:#9be38a}@keyframes ojoP{50%{box-shadow:0 0 30px #ffd628cc,inset 0 0 26px #ffd62877}}';
  document.head.appendChild(st);
}
const OJO_NAMES = { graxa: 'Graxa', pegadas: 'Pegadas', pizarra: 'Pizarra', motor: 'Motor Siemens' };
const OJO_H = { graxa: 0.45, pegadas: 0.05, pizarra: 1.6, motor: 0.6 };
const _ojoV = new THREE.Vector3();
function updateOjo(dt) {
  const M = G.martin; if (!M) return;
  const S = save.martin; if (S && MART_ACT[S.step] >= 3) ojoBuildProps();
  if (M.inTaller) { if (TALLER.ojo > 0) { } ojoApply(); return; }
  if ((M.eyeT || 0) > 0 && S.step !== 'a3_pistas') M.eyeT = 0;
  const on = ojoApply(); if (!on || !OJO.el || !M.pistas) { if (OJO.el) OJO.el.innerHTML = ''; return; }
  // proxecta cada pista á pantalla (tendo en conta o relevo, que só se aplica ao debuxar)
  const cam = camera, lift = typeof relH === 'function' ? relH(cam.position.x, cam.position.z) : 0;
  cam.position.y += lift; cam.updateMatrixWorld();
  let h = '';
  for (const p of M.pistas) {
    const y = groundH(p.x, p.z) + (OJO_H[p.id] || 0.5) + (typeof relH === 'function' ? relH(p.x, p.z) : 0);
    _ojoV.set(p.x, y, p.z); const dist = cam.position.distanceTo(_ojoV); if (dist > 60) continue;
    _ojoV.project(cam); if (_ojoV.z > 1) continue;
    const sx = (_ojoV.x + 1) / 2 * innerWidth, sy = (1 - _ojoV.y) / 2 * innerHeight, r = Math.max(36, Math.min(160, 900 / dist)), ok = S.flags['p_' + p.id];
    h += `<div class="ojo-mk" style="left:${sx}px;top:${sy}px;width:${r}px;height:${r}px;${ok ? 'border-color:#9be38a' : ''}"></div><div class="ojo-lb ${ok ? 'ok' : ''}" style="left:${sx}px;top:${sy + r / 2 + 4}px">${ok ? '✔ ' : ''}${OJO_NAMES[p.id] || p.id} · ${dist.toFixed(0)} m</div>`;
  }
  cam.position.y -= lift; cam.updateMatrixWorld();
  OJO.el.innerHTML = h;
}
/* botón OLLO no móbil (e tamén clicable no ordenador) cando hai algo que investigar */
function ojoButton() {
  let b = $('ojoBtn');
  if (!b) { b = document.createElement('button'); b.id = 'ojoBtn'; b.type = 'button'; b.textContent = 'OLLO'; b.style.cssText = 'position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:150px;z-index:7;font:800 16px Barlow,sans-serif;padding:12px 16px;border-radius:999px;border:2px solid #111;background:#ffd628;color:#111;box-shadow:0 4px 14px #0008'; b.onclick = e => { e.stopPropagation(); ojoToggle(); }; document.body.appendChild(b); }
  const show = !!(G.martin && !G.martin.inTaller && save.martin && save.martin.step === 'a3_pistas' && !G.dialog && !G.paused);
  b.hidden = !show;
}
window.addEventListener('keydown', e => {
  if (!G.martin || !G.started || G.paused || G.dialog || e.code !== 'KeyQ' || e.repeat) return;
  ojoToggle();
});
