'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Relevo real do terreo (MDT02 do IGN)
   O xogo (físicas, colisións, persoas, coches) segue no plano
   "lóxico" de sempre; ao debuxar, cada vértice érguese a diferenza
   entre o relevo real e o terreo lóxico nese punto (RELEVO.w).
   Así todo — edificios, rúas, monumentos, persoas — senta sobre
   as costas, o monte de San Vicente e a veiga do Cabe reais.
   ========================================================== */
const RELEVO = { on: false, w: null, nx: 0, nz: 0, x0: 0, z0: 0, st: 8 };
function relevoRaw(i, j) { // relevo real (m) no nodo i,j
  const R = RELEVO; i = i < 0 ? 0 : i >= R.nx ? R.nx - 1 : i; j = j < 0 ? 0 : j >= R.nz ? R.nz - 1 : j;
  return R.w[j * R.nx + i];
}
/* desprazamento vertical (m) entre o mundo lóxico e o real */
function relH(x, z) {
  const R = RELEVO; if (!R.on) return 0;
  const gx = (x - R.x0) / R.st, gz = (z - R.z0) / R.st, i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
  const a = relevoRaw(i, j), b = relevoRaw(i + 1, j), c = relevoRaw(i, j + 1), d = relevoRaw(i + 1, j + 1);
  return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
}
/* desprazamento dispoñible xa durante a construción (para edificios ríxidos) */
function relW(x, z) {
  const R = RELEVO; if (!R.w) { if (typeof RELEVO_DATA === 'undefined') return 0; relevoPrep(); }
  const gx = (x - R.x0) / R.st, gz = (z - R.z0) / R.st, i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
  const a = relevoRaw(i, j), b = relevoRaw(i + 1, j), c = relevoRaw(i, j + 1), d = relevoRaw(i + 1, j + 1);
  return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
}
/* xeometría que debe quedar ríxida (edificios): compénsase o desprazamento vértice a vértice co do punto (cx,cz) */
function relRigid(g, cx, cz) {
  if (typeof RELEVO_DATA === 'undefined' || !g) return g;
  const p = g.attributes.position, w0 = relW(cx, cz);
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + w0 - relW(p.getX(i), p.getZ(i)));
  g.userData.noTess = true; return g;
}
function relevoPrep() {
  if (RELEVO.w || typeof RELEVO_DATA === 'undefined') return;
  const D = RELEVO_DATA, bin = atob(D.b64), q = new Int16Array(D.nx * D.nz);
  for (let k = 0; k < q.length; k++) { const v = bin.charCodeAt(2 * k) | (bin.charCodeAt(2 * k + 1) << 8); q[k] = v > 32767 ? v - 65536 : v; }
  Object.assign(RELEVO, { nx: D.nx, nz: D.nz, x0: D.x0, z0: D.z0, st: D.step });
  // w = relevo real − terreo lóxico (o monte e as montañas de fóra xa están no terreo do xogo)
  const w = new Float32Array(q.length);
  const M = 60; // fóra do mapa avalíase no bordo para que o desprazamento siga liso
  for (let j = 0; j < D.nz; j++) for (let i = 0; i < D.nx; i++) {
    const x = D.x0 + i * D.step, z = D.z0 + j * D.step;
    const lx = clamp(x, MAP.minX - M, MAP.maxX + M), lz = clamp(z, MAP.minZ - M, MAP.maxZ + M);
    w[j * D.nx + i] = q[j * D.nx + i] / 10 - Math.max(hillH(lx, lz), outerH(lx, lz));
  }
  RELEVO.w = w;
}
function relevoInit() {
  if (typeof RELEVO_DATA === 'undefined' || RELEVO.on) return;
  relevoPrep(); const D = RELEVO_DATA, w = RELEVO.w;
  // textura RGBA (16 bits en R,G) para o sombreador
  const px = new Uint8Array(w.length * 4);
  for (let k = 0; k < w.length; k++) { const u = clamp(Math.round(w[k] * 100) + 32768, 0, 65535); px[k * 4] = u >> 8; px[k * 4 + 1] = u & 255; px[k * 4 + 3] = 255; }
  const tex = new THREE.DataTexture(px, D.nx, D.nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  RELEVO.U = { relTex: { value: tex }, relO: { value: new THREE.Vector2(D.x0, D.z0) }, relStep: { value: D.step }, relN: { value: new THREE.Vector2(D.nx, D.nz) } };
  RELEVO.on = true;
  // o chan bákease na xeometría (para ter normais boas nas costas)
  if (G.groundMesh) {
    const g = G.groundMesh.geometry, p = g.attributes.position;
    const sp = 6; // o chan (malla grosa) báixase onde o relevo é cóncavo, para que a interpolación non tape rúas nin prazas
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), c = relH(x, z); let k = 0;
      for (const [dx, dz] of [[sp, 0], [0, sp], [sp * .7, sp * .7], [sp * .7, -sp * .7], [sp * 1.6, 0], [0, sp * 1.6]]) k = Math.max(k, (relH(x + dx, z + dz) + relH(x - dx, z - dz)) / 2 - c);
      p.setY(i, p.getY(i) + c - k * 1.2 - 0.05); }
    p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
    G.groundMesh.material.userData.noRelief = true;
  }
  if (G.scene) G.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o === G.groundMesh || !o.geometry || o.geometry.userData.relTess) return;
    o.updateMatrix(); const g2 = o.geometry.clone(); g2.applyMatrix4(o.matrix);
    const ng = relevoTess(g2, 5);
    if (ng !== g2) { ng.applyMatrix4(new THREE.Matrix4().copy(o.matrix).invert()); ng.userData.relTess = true; o.geometry = ng; } else g2.dispose();
  });
}
/* xeometría chan e grande (prazas, parques, lousas): subdivídese para que siga o relevo en vez de cortalo en liña recta */
function relevoTess(g, maxLen = 5, scale = 1) {
  if (typeof RELEVO_DATA === 'undefined' || g.userData.noTess) return g;
  const P = g.attributes.position; if (!P || P.count < 3) return g;
  const a = P.array; let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < a.length; i += 3) { const x = a[i], y = a[i + 1], z = a[i + 2]; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  if ((y1 - y0) * scale > 2 || Math.max(x1 - x0, z1 - z0) * scale <= maxLen) return g;
  const idx = g.index ? g.index.array : null, nT = (idx ? idx.length : P.count) / 3;
  const atts = Object.keys(g.attributes).filter(k => ['position', 'normal', 'uv', 'color'].includes(k)).map(k => ({ k, A: g.attributes[k], s: g.attributes[k].itemSize, out: [] }));
  let any = false;
  for (let t = 0; t < nT; t++) {
    const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
    const L = Math.max(Math.hypot(a[i0 * 3] - a[i1 * 3], a[i0 * 3 + 2] - a[i1 * 3 + 2]), Math.hypot(a[i1 * 3] - a[i2 * 3], a[i1 * 3 + 2] - a[i2 * 3 + 2]), Math.hypot(a[i2 * 3] - a[i0 * 3], a[i2 * 3 + 2] - a[i0 * 3 + 2])) * scale;
    const n = Math.min(24, Math.max(1, Math.ceil(L / maxLen))); if (n > 1) any = true;
    const emit = (u, v) => { const w = 1 - u - v; for (const at of atts) { const A = at.A.array, s = at.s; for (let c = 0; c < s; c++) at.out.push(A[i0 * s + c] * w + A[i1 * s + c] * u + A[i2 * s + c] * v); } };
    for (let r = 0; r < n; r++) for (let q = 0; q < n - r; q++) {
      emit(q / n, r / n); emit((q + 1) / n, r / n); emit(q / n, (r + 1) / n);
      if (q < n - r - 1) { emit((q + 1) / n, r / n); emit((q + 1) / n, (r + 1) / n); emit(q / n, (r + 1) / n); }
    }
  }
  if (!any) return g;
  const out = new THREE.BufferGeometry();
  for (const at of atts) out.setAttribute(at.k, new THREE.Float32BufferAttribute(at.out, at.s));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
/* ---- sombreadores: todo material érguese co relevo ---- */
const RELEVO_GLSL = `
uniform sampler2D relTex; uniform vec2 relO; uniform float relStep; uniform vec2 relN;
float relS(vec2 ij){ ij = clamp(ij, vec2(0.0), relN - 1.0); vec4 t = texture2D(relTex, (ij + 0.5) / relN); return ((t.r * 65280.0 + t.g * 255.0) - 32768.0) * 0.01; }
float relieveH(vec2 p){ vec2 g = (p - relO) / relStep; vec2 i = floor(g); vec2 f = g - i;
  return mix(mix(relS(i), relS(i + vec2(1.0, 0.0)), f.x), mix(relS(i + vec2(0.0, 1.0)), relS(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
THREE.Material.prototype.customProgramCacheKey = function () { return (this.userData && this.userData.noRelief) ? 'flat' : RELEVO.on ? 'relevo' : 'plain'; };
THREE.Material.prototype.onBeforeCompile = function (sh) {
  if (!RELEVO.on || this.isShaderMaterial || (this.userData && this.userData.noRelief)) return;
  Object.assign(sh.uniforms, RELEVO.U);
  let v = sh.vertexShader;
  if (v.indexOf('#include <common>') < 0) return;
  v = v.replace('#include <common>', '#include <common>\n' + RELEVO_GLSL);
  v = v.replace('#include <project_vertex>', `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
{ vec4 rwp = modelMatrix * mvPosition; rwp.y += relieveH(rwp.xz); mvPosition = viewMatrix * rwp; }
gl_Position = projectionMatrix * mvPosition;`);
  v = v.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
  worldPosition.y += relieveH(worldPosition.xz);
#endif`);
  v = v.replace('vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );', 'vec4 rwp = modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ); rwp.y += relieveH(rwp.xz); vec4 mvPosition = viewMatrix * rwp;');
  sh.vertexShader = v;
};
/* recorte de visibilidade tendo en conta o relevo */
(function () {
  const sp = new THREE.Sphere();
  THREE.Frustum.prototype.intersectsObject = function (o) {
    const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere();
    sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    if (RELEVO.on && !(o.material && o.material.userData && o.material.userData.noRelief)) { sp.center.y += relH(sp.center.x, sp.center.z); if (sp.radius > 40) sp.radius += 40; }
    return this.intersectsSphere(sp);
  };
  THREE.Frustum.prototype.intersectsSprite = function (s) {
    sp.center.set(0, 0, 0); sp.radius = 0.7071067811865476; sp.applyMatrix4(s.matrixWorld);
    if (RELEVO.on) sp.center.y += relH(sp.center.x, sp.center.z);
    return this.intersectsSphere(sp);
  };
})();
/* cámara e luces: érguense só mentres se debuxa */
const _relSaved = [];
let _relLights = [], _relLightT = -1;
function relevoBegin(scene, camera) {
  if (!RELEVO.on) return;
  const now = performance.now();
  if (now - _relLightT > 2000) { _relLightT = now; _relLights = []; scene.traverse(o => { if (o.isPointLight || o.isSpotLight || o.isDirectionalLight) _relLights.push(o); }); }
  _relSaved.length = 0;
  const lift = (o, dy) => { _relSaved.push(o, o.position.y); o.position.y += dy; o.updateMatrixWorld(); };
  lift(camera, relH(camera.position.x, camera.position.z));
  const wp = new THREE.Vector3();
  for (const l of _relLights) {
    if (l.isDirectionalLight) { const t = l.target.position, dy = relH(t.x, t.z); lift(l, dy); lift(l.target, dy); }
    else { l.getWorldPosition(wp); lift(l, relH(wp.x, wp.z)); }
  }
}
function relevoEnd() {
  for (let k = _relSaved.length - 2; k >= 0; k -= 2) { const o = _relSaved[k]; o.position.y = _relSaved[k + 1]; o.updateMatrixWorld(); }
  _relSaved.length = 0;
}
