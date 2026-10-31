'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Modelos detallados para o protagonista e os
   personaxes con diálogo: cara pintada (ollos con iris e brillo,
   cellas, nariz, beizos, meixelas), orellas, pelo con flequillo,
   roupa con textura de tecido (costuras, colo, botóns), mans e
   zapatos. Usan as mesmas matrices da pose da multitude, así que
   se moven igual pero sen o aspecto de «boneco de caixas».
   ========================================================== */
const HERO = { list: [], geo: null, maxDist: 55 };
// matrices das partes do heroe (as instancias da multitude quedan ocultas)
function pedMatrix(part, i, out) {
  const C = world.crowd, s = part === 'torso' || part === 'hips' || part === 'head' || part === 'hair' ? 1 : 2, pi = Math.floor(i / s), p = C.peds[pi];
  if (p && p.hero && p.hero.mats[part]) return out.copy(p.hero.mats[part][i - pi * s]);
  return C.meshes[part].getMatrixAt(i, out);
}
const HERO_LOOK = {
  pacho: { smile: 1, bald: 1, brow: 0.6 }, emre: { stubble: 1, angry: 1 }, spasic: { stubble: 1, bald: 1 }, mayor: { moustache: '#d8d4cc', smile: 1, old: 1 },
  ivan: { smile: 1, stubble: 0.5 }, damian: { smile: 1 }, currito: { smile: 1 }, sajoni: { stubble: 1, smile: 1 }, hostal: { moustache: '#4a3a2a', bald: 1, smile: 1 },
  virginia: { female: 1, bald: 1, angry: 1 },
};
function heroGeos() {
  if (HERO.geo) return HERO.geo;
  const S = (r, w, h, ts, tl) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, ts || 0, tl || Math.PI);
  const g = {};
  g.head = S(0.118, 36, 28).scale(0.92, 1.05, 1);
  g.neck = xform(new THREE.CylinderGeometry(0.047, 0.053, 0.13, 16), 0, -0.13, 0);
  g.nose = mergeGeos([xform(S(0.022, 12, 10), 0, -0.012, 0.106, 0, 0, 0, 0.75, 1.25, 1.05), xform(S(0.014, 10, 8), 0, -0.03, 0.118, 0, 0, 0, 1.25, 0.8, 0.9)]);
  g.ears = mergeGeos([-1, 1].map(s => xform(S(0.028, 12, 10), s * 0.104, -0.005, -0.004, 0, 0, 0, 0.45, 1, 0.8)));
  // pelo: casquete con flequillo + parte traseira ata a caluga
  g.hairTop = xform(S(0.1255, 30, 16, 0, Math.PI * 0.38), 0, 0.012, -0.006, 0, 0, 0, 0.95, 1.0, 1.05);
  // parte traseira: só por detrás das orellas, ata a caluga
  { const b = new THREE.SphereGeometry(0.125, 30, 18, Math.PI / 2 + 1.45, Math.PI * 2 - 2.9, 0, Math.PI * 0.56); g.hairBack = xform(b, 0, 0.012, -0.01, 0, 0, 0, 0.96, 1.0, 1.05); }
  // patillas curtas diante das orellas
  g.sideburns = mergeGeos([-1, 1].map(s => xform(new THREE.BoxGeometry(0.012, 0.045, 0.022), s * 0.106, 0.01, 0.022)));
  g.hairLong = xform(new THREE.CylinderGeometry(0.118, 0.1, 0.2, 20, 1, true, 1.0, Math.PI * 2 - 2.0), 0, -0.06, -0.012, 0, 0, 0, 1, 1, 1.02);
  g.torso = (() => { const c = new THREE.CylinderGeometry(0.205, 0.165, 0.56, 28, 4); c.scale(1, 1, 0.64); return mergeGeos([c, xform(S(0.205, 28, 10, 0, Math.PI / 2), 0, 0.27, 0, 0, 0, 0, 1, 0.46, 0.64)]); })();
  g.collar = xform(new THREE.TorusGeometry(0.06, 0.016, 8, 20), 0, 0.335, 0.005, 0, Math.PI / 2, 0, 1, 1, 0.9);
  g.hips = (() => { const c = new THREE.CylinderGeometry(0.175, 0.165, 0.21, 24); c.scale(1, 1, 0.66); return c; })();
  g.belt = (() => { const c = new THREE.CylinderGeometry(0.178, 0.177, 0.04, 24, 1, true); c.scale(1, 1, 0.66); c.translate(0, 0.08, 0); return c; })();
  g.uarm = xform(new THREE.CylinderGeometry(0.06, 0.052, 0.31, 14), 0, -0.15, 0);
  g.shoulder = S(0.062, 14, 10);
  g.farm = xform(new THREE.CylinderGeometry(0.05, 0.041, 0.27, 14), 0, -0.135, 0);
  g.elbow = xform(S(0.05, 12, 8), 0, 0, 0);
  g.hand = mergeGeos([xform(S(0.042, 14, 10), 0, -0.29, 0.004, 0, 0, 0, 0.75, 1.15, 0.5), xform(S(0.018, 8, 6), 0.03, -0.275, 0.02, 0, 0, 0, 0.8, 1.6, 0.8)]);
  g.thigh = xform(new THREE.CylinderGeometry(0.087, 0.067, 0.45, 16), 0, -0.22, 0);
  g.knee = S(0.067, 12, 8);
  g.shin = xform(new THREE.CylinderGeometry(0.064, 0.05, 0.42, 16), 0, -0.21, 0);
  g.shoe = mergeGeos([xform(S(0.06, 16, 10, 0, Math.PI / 2), 0, -0.065, 0.06, 0, 0, 0, 0.95, 0.95, 2.4), xform(new THREE.BoxGeometry(0.115, 0.03, 0.27), 0, -0.066, 0.055)]);
  g.sole = xform(new THREE.BoxGeometry(0.118, 0.022, 0.275), 0, -0.075, 0.055);
  return HERO.geo = g;
}
/* ---------- texturas ---------- */
function shade(hex, k) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); }
function heroFaceTex(p, L) {
  const W = 512, H = 256, c = cnv(W, H), x = c.getContext('2d'), skin = p.col.skin;
  x.fillStyle = skin; x.fillRect(0, 0, W, H);
  // poros e matices
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '120,60,40' : '255,235,220'},${RR(0.02, 0.06)})`; x.fillRect(R() * W, R() * H, RR(1, 3), RR(1, 3)); }
  const K = 81.5, cx = W * 0.25, cy = H * 0.5; // píxeles por radián; fronte da cara
  const P = (a, b) => [cx + a * K, cy + b * K];
  // sombreado: frente iluminada, cuencas, queixo
  let g = x.createRadialGradient(cx, cy - 6, 8, cx, cy, 120); g.addColorStop(0, 'rgba(255,240,225,.18)'); g.addColorStop(1, 'rgba(90,40,25,.16)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (L.stubble || (!p.female && R() < 0.25)) { const k = L.stubble || 0.6; for (let i = 0; i < 1800 * k; i++) { const a = RR(-0.75, 0.75), b = RR(0.3, 0.95) - Math.abs(a) * 0.15; const [u, v] = P(a, b); if (Math.abs(a) < 0.18 && b < 0.42) continue; x.fillStyle = `rgba(40,30,25,${RR(0.08, 0.22)})`; x.fillRect(u, v, 1.5, 1.5); } }
  // meixelas
  for (const s of [-1, 1]) { const [u, v] = P(s * 0.42, 0.22); g = x.createRadialGradient(u, v, 1, u, v, 16); g.addColorStop(0, p.female ? 'rgba(230,110,110,.35)' : 'rgba(210,110,90,.2)'); g.addColorStop(1, 'rgba(230,110,110,0)'); x.fillStyle = g; x.fillRect(u - 20, v - 20, 40, 40); }
  // cuencas dos ollos
  for (const s of [-1, 1]) { const [u, v] = P(s * 0.33, -0.15); g = x.createRadialGradient(u, v, 2, u, v, 16); g.addColorStop(0, 'rgba(90,50,40,.28)'); g.addColorStop(1, 'rgba(90,50,40,0)'); x.fillStyle = g; x.fillRect(u - 18, v - 18, 36, 36); }
  // ollos
  const iris = p.eye || (p.hero && p.hero.eye) || pick(['#5a3a22', '#3a5a7a', '#4a6a3a', '#6a4a2a', '#2a2a2a']);
  for (const s of [-1, 1]) {
    const [u, v] = P(s * 0.33, -0.13);
    x.fillStyle = '#f6f2ec'; x.beginPath(); x.ellipse(u, v, 9.5, 5.4, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = iris; x.beginPath(); x.arc(u + s * -0.5, v + 0.3, 4.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#0d0d0f'; x.beginPath(); x.arc(u + s * -0.5, v + 0.3, 2.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(u + s * -0.5 + 1.6, v - 1.4, 1.2, 0, Math.PI * 2); x.fill();
    // pálpebra superior e pestanas
    x.strokeStyle = p.female ? '#1a1210' : 'rgba(60,35,25,.85)'; x.lineWidth = p.female ? 2.2 : 1.6; x.beginPath(); x.ellipse(u, v + 0.6, 10, 6, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
    if (p.female) for (const k of [-6, -2, 2, 6]) { x.beginPath(); x.moveTo(u + k, v - 5); x.lineTo(u + k * 1.25, v - 8); x.stroke(); }
    x.strokeStyle = 'rgba(120,70,55,.35)'; x.lineWidth = 1; x.beginPath(); x.ellipse(u, v + 1.5, 9, 5, 0, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
    if (L.old || p.old) { x.strokeStyle = 'rgba(110,70,55,.35)'; for (const k of [0, 3]) { x.beginPath(); x.moveTo(u + s * 11, v - 2 + k); x.lineTo(u + s * 17, v - 4 + k * 1.6); x.stroke(); } }
  }
  // cellas
  const brow = L.browCol || (p.col.hair === p.col.skin ? shade(p.col.skin, -0.3) : p.col.hair);
  x.strokeStyle = brow; x.lineCap = 'round';
  for (const s of [-1, 1]) {
    const [u, v] = P(s * 0.33, -0.32), ang = L.angry ? s * 0.25 : s * -0.05;
    x.lineWidth = (p.female ? 2.4 : 3.6) * (L.brow || 1);
    x.beginPath(); x.moveTo(u - 11 * Math.cos(ang) * -s, v + 11 * Math.sin(ang) - (L.angry ? 0 : 1)); x.quadraticCurveTo(u, v - 3, u + 11 * s, v + 1.5 - (L.angry ? 3 * 0 : 0)); x.stroke();
  }
  // nariz: sombra lateral e fosas
  { const [u, v] = P(0, 0.1); x.strokeStyle = 'rgba(110,60,45,.35)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(u - 4, v - 14); x.quadraticCurveTo(u - 6, v + 2, u - 6, v + 4); x.stroke();
    x.fillStyle = 'rgba(80,40,30,.5)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(u + s * 3.6, v + 6, 2.2, 1.3, 0, 0, Math.PI * 2); x.fill(); } }
  // bigote
  if (L.moustache) { const [u, v] = P(0, 0.33); x.fillStyle = L.moustache; x.beginPath(); x.ellipse(u - 7, v, 9, 3.6, 0.15, 0, Math.PI * 2); x.ellipse(u + 7, v, 9, 3.6, -0.15, 0, Math.PI * 2); x.fill(); }
  // boca
  { const [u, v] = P(0, 0.44), w = 14, sm = L.angry ? -3 : L.smile ? 4 : 1.5;
    x.fillStyle = p.female ? '#b84a5a' : shade(skin, -0.16); x.beginPath(); x.moveTo(u - w, v); x.quadraticCurveTo(u - w * 0.4, v - 3.6, u, v - 2); x.quadraticCurveTo(u + w * 0.4, v - 3.6, u + w, v); x.quadraticCurveTo(u, v + 2 + sm * 0.6, u - w, v); x.fill();
    x.strokeStyle = 'rgba(60,20,20,.75)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(u - w, v - sm * 0.25); x.quadraticCurveTo(u, v + sm, u + w, v - sm * 0.25); x.stroke();
    x.fillStyle = p.female ? '#a33c4c' : shade(skin, -0.12); x.beginPath(); x.moveTo(u - w * 0.8, v + 1); x.quadraticCurveTo(u, v + 7, u + w * 0.8, v + 1); x.quadraticCurveTo(u, v + 3, u - w * 0.8, v + 1); x.fill();
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(u - 3, v + 3, 6, 1.2); }
  // queixo
  { const [u, v] = P(0, 0.72); g = x.createRadialGradient(u, v, 2, u, v, 22); g.addColorStop(0, 'rgba(255,235,220,.12)'); g.addColorStop(1, 'rgba(255,235,220,0)'); x.fillStyle = g; x.fillRect(u - 24, v - 24, 48, 48); }
  const t = toTex(c, false); t.anisotropy = 4; return t;
}
function fabricTex(col, kind) {
  const c = cnv(256, 256), x = c.getContext('2d');
  x.fillStyle = col; x.fillRect(0, 0, 256, 256);
  // trama do tecido
  for (let i = 0; i < 256; i += 2) { x.fillStyle = `rgba(0,0,0,${kind === 'denim' ? 0.07 : 0.035})`; x.fillRect(0, i, 256, 1); x.fillStyle = 'rgba(255,255,255,.03)'; x.fillRect(i, 0, 1, 256); }
  if (kind === 'denim') for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${RR(0.02, 0.08)})`; x.fillRect(R() * 256, R() * 256, RR(2, 6), 1); }
  for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${RR(0.015, 0.05)})`; x.fillRect(R() * 256, R() * 256, 2, 2); }
  // pregues verticais suaves
  for (let i = 0; i < 6; i++) { const u = R() * 256, g = x.createLinearGradient(u - 12, 0, u + 12, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(u - 12, 0, 24, 256); }
  if (kind === 'shirt') {
    // costuras laterais, tapeta con botóns e colo (fronte no centro da textura)
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1.5; for (const u of [64, 192]) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, 256); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.1)'; x.fillRect(125, 20, 1.5, 236); x.fillRect(131, 20, 1.5, 236);
    for (let v = 40; v < 240; v += 34) { x.fillStyle = shade(col, 0.25); x.beginPath(); x.arc(128, v, 2.6, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(127, v - 0.5, 2, 1); }
    x.fillStyle = shade(col, -0.12); x.beginPath(); x.moveTo(100, 0); x.lineTo(128, 26); x.lineTo(156, 0); x.fill();
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 248, 256, 8);
  }
  if (kind === 'denim' || kind === 'pants') { x.strokeStyle = kind === 'denim' ? 'rgba(220,170,80,.5)' : 'rgba(0,0,0,.2)'; x.lineWidth = 1.2; x.setLineDash([3, 2]); for (const u of [64, 192]) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, 256); x.stroke(); } x.setLineDash([]); }
  const t = toTex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function skinTex(col) {
  const c = cnv(64, 64), x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '120,60,40' : '255,235,220'},${RR(0.02, 0.06)})`; x.fillRect(R() * 64, R() * 64, 1.5, 1.5); }
  return toTex(c, false);
}
/* ---------- construción dun heroe ---------- */
function makeHero(p, id) {
  if (!p || p.hero) return p && p.hero;
  const G0 = heroGeos(), L = HERO_LOOK[id] || {}, col = p.col;
  p.female = !!L.female; p.old = !!(L.old || p.old && id !== 'player');
  const isDenim = /^#(1f2a44|3c4d63|1d2a4a|2f4f8a)/i.test(col.pants) || R() < 0.3;
  const skinM = new THREE.MeshStandardMaterial({ map: skinTex(col.skin), roughness: 0.62, envMapIntensity: 0.35 });
  const faceM = new THREE.MeshStandardMaterial({ map: heroFaceTex(p, L), roughness: 0.58, envMapIntensity: 0.35 });
  const shirtT = fabricTex(col.shirt, 'shirt'); shirtT.offset.x = 0.5;
  const shirtM = new THREE.MeshStandardMaterial({ map: shirtT, roughness: 0.9 });
  const sleeveM = new THREE.MeshStandardMaterial({ map: fabricTex(col.shirt, 'plain'), roughness: 0.9 });
  const pantsM = new THREE.MeshStandardMaterial({ map: fabricTex(col.pants, isDenim ? 'denim' : 'pants'), roughness: 0.92 });
  const shoeM = new THREE.MeshStandardMaterial({ color: col.shoe, roughness: 0.45, metalness: 0.05 }), soleM = new THREE.MeshStandardMaterial({ color: col.shoe === '#e9e9e9' || col.shoe === '#eeeeea' || col.shoe === '#f2f2f2' ? '#bdbdbd' : '#ece8e0', roughness: 0.8 });
  const hairCol = col.hair, bald = L.bald || hairCol === col.skin;
  const hairT = (() => { const c = cnv(128, 128), x = c.getContext('2d'); x.fillStyle = hairCol; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++) { x.strokeStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${RR(0.05, 0.14)})`; x.lineWidth = 1; const u = R() * 128, v = R() * 128; x.beginPath(); x.moveTo(u, v); x.lineTo(u + RR(-2, 2), v + RR(6, 14)); x.stroke(); } const t = toTex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; })();
  const hairM = new THREE.MeshStandardMaterial({ map: hairT, roughness: 0.75, metalness: 0.02 });
  const beltM = new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.5 });
  const grp = new THREE.Group(); G.scene.add(grp);
  const part = (children) => { const o = new THREE.Group(); o.matrixAutoUpdate = false; for (const [geo, mat] of children) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; o.add(m); } grp.add(o); return o; };
  const H = {
    p, id, grp, mats: {}, obj: {},
  };
  const headParts = [[G0.head, faceM], [G0.neck, skinM], [G0.nose, skinM], [G0.ears, skinM]];
  H.obj.head = [part(headParts)];
  H.obj.hair = [part(bald ? [] : [[G0.hairTop, hairM], [G0.hairBack, hairM]].concat(p.female ? [[G0.hairLong, hairM]] : [[G0.sideburns, hairM]]))];
  H.obj.torso = [part([[G0.torso, shirtM], [G0.collar, shirtM]])];
  H.obj.hips = [part([[G0.hips, pantsM], [G0.belt, beltM]])];
  H.obj.uarm = [0, 1].map(() => part([[G0.uarm, sleeveM], [G0.shoulder, sleeveM]]));
  H.obj.farm = [0, 1].map(() => part([[G0.farm, col.sleeve ? skinM : sleeveM], [G0.elbow, col.sleeve ? skinM : sleeveM], [G0.hand, skinM]]));
  H.obj.thigh = [0, 1].map(() => part([[G0.thigh, pantsM]]));
  H.obj.shin = [0, 1].map(() => part([[G0.shin, pantsM], [G0.knee, pantsM]]));
  H.obj.shoe = [0, 1].map(() => part([[G0.shoe, shoeM], [G0.sole, soleM]]));
  for (const k of PED_PARTS) H.mats[k] = H.obj[k].map(() => new THREE.Matrix4());
  H.shirtM = shirtM; H.sleeveM = sleeveM; H.lastShirt = col.shirt;
  p.hero = H; HERO.list.push(H);
  return H;
}
function initHeroes() {
  if (HERO.ready || !world || !world.crowd || !G.player || !G.player.ped) return;
  HERO.ready = true;
  makeHero(G.player.ped, 'player');
  for (const n of NPCS) makeHero(n.p, n.id);
}
/* despois da pose: copia as matrices aos modelos detallados e oculta as instancias */
function updateHeroes() {
  if (!HERO.ready) { if (typeof NPCS !== 'undefined' && NPCS.length) initHeroes(); return; }
  for (const n of NPCS) if (!n.p.hero) makeHero(n.p, n.id);
  const C = world.crowd, cam = camera.position, zero = C.zero;
  for (const H of HERO.list) {
    const p = H.p;
    if (p.col.shirt !== H.lastShirt) { H.lastShirt = p.col.shirt; const t = fabricTex(p.col.shirt, 'shirt'); t.offset.x = 0.5; H.shirtM.map = t; H.shirtM.needsUpdate = true; H.sleeveM.map = fabricTex(p.col.shirt, 'plain'); H.sleeveM.needsUpdate = true; }
    const near = p.visible && Math.hypot(p.x - cam.x, p.z - cam.z) < HERO.maxDist;
    H.grp.visible = near;
    for (const k of PED_PARTS) {
      const n = H.obj[k].length;
      for (let s = 0; s < n; s++) {
        const idx = p.idx * n + s, m = H.mats[k][s];
        C.meshes[k].getMatrixAt(idx, m);
        if (near) { const o = H.obj[k][s]; o.matrix.copy(m); o.matrixWorldNeedsUpdate = true; C.meshes[k].setMatrixAt(idx, zero); }
      }
    }
  }
}
