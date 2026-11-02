'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Relevo real do terreo (MDT02 do IGN)
   O xogo (físicas, colisións, persoas, coches) segue no plano
   "lóxico" de sempre; ao debuxar, cada vértice érguese a diferenza
   entre o relevo real e o terreo lóxico nese punto (RELEVO.w).
   Así todo — edificios, rúas, monumentos, persoas — senta sobre
   as costas, o monte de San Vicente e a veiga do Cabe reais.
   ========================================================== */
const RELEVO = { on: false, w: null, nx: 0, nz: 0, x0: 0, z0: 0, st: 8, lods: [] };
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
  const R = RELEVO; if (typeof RELEVO_DATA === 'undefined') return 0; if (R.gpu === undefined) relevoCheck(); if (!R.gpu) return 0;
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
function relevoGPUtest() {
  try {
    if (typeof renderer === 'undefined' || !renderer) return true;
    const gl = renderer.getContext(); if (!(gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0)) return false;
    // nodos da malla con desniveis distintos (dentro de ±45 m) e o valor que debería dar o sombreador
    const D = RELEVO_DATA, w = RELEVO.w, pts = [], exp = [];
    const want = [-30, -12, -4, 0, 4, 12, 30, 0];
    for (const t of want) { let bk = -1, bd = 1e9; for (let k = 0; k < w.length; k += 7) { const d = Math.abs(w[k] - t); if (d < bd) { bd = d; bk = k; } } if (bk < 0) continue;
      const i = bk % D.nx, j = Math.floor(bk / D.nx); pts.push(D.x0 + i * D.step, 0, D.z0 + j * D.step); exp.push(Math.round(w[bk] * 100) / 100); }
    const N = exp.length, ix = new Float32Array(N); for (let k = 0; k < N; k++) ix[k] = k;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('pidx', new THREE.Float32BufferAttribute(ix, 1));
    const m = new THREE.ShaderMaterial({ uniforms: RELEVO.U, depthTest: false, depthWrite: false,
      vertexShader: RELEVO_GLSL + 'attribute float pidx; varying float vH; void main(){ vH = relieveH(position.xz); gl_Position = vec4((pidx + 0.5) / ' + N.toFixed(1) + ' * 2.0 - 1.0, 0.0, 0.0, 1.0); gl_PointSize = 1.0; }',
      fragmentShader: 'varying float vH; void main(){ float v = clamp((vH + 50.0) / 100.0, 0.0, 1.0); gl_FragColor = vec4(v, 0.0, 0.0, 1.0); }' });
    const sc = new THREE.Scene(), cam = new THREE.Camera(), pt = new THREE.Points(g, m); pt.frustumCulled = false; sc.add(pt);
    const rt = new THREE.WebGLRenderTarget(N, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
    const prev = renderer.getRenderTarget(), cc = new THREE.Color(), ca = renderer.getClearAlpha(); renderer.getClearColor(cc); renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam);
    const px = new Uint8Array(N * 4); renderer.readRenderTargetPixels(rt, 0, 0, N, 1, px); renderer.setRenderTarget(prev); renderer.setClearColor(cc, ca);
    rt.dispose(); g.dispose(); m.dispose();
    let bad = 0; const got = []; for (let k = 0; k < N; k++) { const h = px[k * 4] / 255 * 100 - 50; got.push(h.toFixed(1)); if (px[k * 4 + 3] < 128 || Math.abs(h - Math.max(-50, Math.min(50, exp[k]))) > 1.2) bad++; }
    RELEVO.test = { exp, got, bad };
    return bad === 0;
  } catch (e) { console.warn('relevo: proba GPU fallou', e); return false; }
}
function relevoCheck() {
  if (RELEVO.gpu !== undefined) return RELEVO.gpu;
  if (!RELEVO.w) relevoPrep(); const D = RELEVO_DATA, w = RELEVO.w;
  // textura RGBA (16 bits en R,G) para o sombreador
  const px = new Uint8Array(w.length * 4);
  for (let k = 0; k < w.length; k++) { const u = clamp(Math.round(w[k] * 100) + 32768, 0, 65535); px[k * 4] = u >> 8; px[k * 4 + 1] = u & 255; px[k * 4 + 3] = 255; }
  const tex = new THREE.DataTexture(px, D.nx, D.nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  RELEVO.U = { relTex: { value: tex }, relO: { value: new THREE.Vector2(D.x0, D.z0) }, relStep: { value: D.step }, relN: { value: new THREE.Vector2(D.nx, D.nz) } };
  // hai GPUs (sobre todo de móbil) que non len texturas no sombreador de vértices ou o fan con pouca precisión:
  // compróbase cunha proba diminuta; se falla, o xogo segue co terreo de sempre (sen relevo) en vez de verse negro
  let ok = relevoGPUtest(); try { if (localStorage.getItem('lemosRelevo') === 'off' || /relevo=off/.test(location.search)) ok = false; } catch (e) { }
  RELEVO.gpu = ok; if (!ok) { console.warn('relevo desactivado', JSON.stringify(RELEVO.test || {})); if (window.__diag && (!RELEVO.test || RELEVO.test.bad)) window.__diag('Aviso: esta GPU non le ben o relevo (' + (RELEVO.test ? RELEVO.test.got.join(' ') : 'sen texturas en vértices') + '); xógase co terreo sen relevo. Toca para pechar.'); }
  return ok;
}
function relevoInit() {
  if (typeof RELEVO_DATA === 'undefined' || RELEVO.on) return;
  if (!relevoCheck()) return;
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
  // mallas instanciadas estáticas (árbores, travesas, arbustos, postes...): por zonas, cada unha coa súa esfera, para que se descarten as que non se ven
  if (G.scene) { const ims = []; G.scene.traverse(o => { if (o.isInstancedMesh && o.parent === G.scene) ims.push(o); });
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), T = 320;
    for (const im of ims) {
      const geo = im.geometry; if (!geo.boundingSphere) geo.computeBoundingSphere(); const gr = geo.boundingSphere.radius + geo.boundingSphere.center.length();
      const tiles = new Map();
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); v.setFromMatrixPosition(m4); const k = Math.floor(v.x / T) + ',' + Math.floor(v.z / T); let l = tiles.get(k); if (!l) tiles.set(k, l = []); l.push(i); }
      for (const l of tiles.values()) {
        const g2 = new THREE.BufferGeometry(); for (const k in geo.attributes) g2.setAttribute(k, geo.attributes[k]); if (geo.index) g2.setIndex(geo.index); for (const gg of geo.groups) g2.addGroup(gg.start, gg.count, gg.materialIndex);
        const n = new THREE.InstancedMesh(g2, im.material, l.length); n.frustumCulled = true; n.castShadow = im.castShadow; n.receiveShadow = im.receiveShadow; n.renderOrder = im.renderOrder;
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9, sc = 1;
        l.forEach((i, j) => { im.getMatrixAt(i, m4); n.setMatrixAt(j, m4); v.setFromMatrixPosition(m4); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); sc = Math.max(sc, m4.getMaxScaleOnAxis());
          if (im.instanceColor) { const c = new THREE.Color().fromArray(im.instanceColor.array, i * 3); n.setColorAt(j, c); } });
        g2.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + gr * sc);
        n.instanceMatrix.needsUpdate = true; if (n.instanceColor) n.instanceColor.needsUpdate = true;
        G.scene.add(n);
        // nivel de detalle: copas de árbore simplificadas lonxe; pezas miúdas (travesas, postes, arbustos) só preto
        const C = g2.boundingSphere.center, R0 = g2.boundingSphere.radius;
        if (im.material === MAT.leaves || im.material === MAT.pine) {
          const lg = im.material === MAT.leaves ? new THREE.IcosahedronGeometry(2.9, 0).translate(0.3, 6.0, 0.15) : new THREE.ConeGeometry(2.6, 9.5, 6).translate(0, 6.6, 0);
          lg.boundingSphere = g2.boundingSphere.clone();
          const lo = new THREE.InstancedMesh(lg, im.material, l.length); lo.instanceMatrix.copy(n.instanceMatrix); if (n.instanceColor) lo.instanceColor = n.instanceColor; lo.castShadow = n.castShadow; lo.receiveShadow = n.receiveShadow; lo.visible = false; G.scene.add(lo);
          RELEVO.lods.push({ hi: n, lo, c: C, r: R0, d: 160 });
        } else if (gr < 2.2 && !n.castShadow) RELEVO.lods.push({ hi: n, lo: null, c: C, r: R0, d: 220 });
      }
      G.scene.remove(im);
    }
  }
  if (G.scene) G.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o === G.groundMesh || !o.geometry || o.geometry.userData.relTess) return;
    o.updateMatrix(); const g2 = o.geometry.clone(); g2.applyMatrix4(o.matrix);
    const ng = relevoTess(g2, 5);
    if (ng !== g2) { ng.applyMatrix4(new THREE.Matrix4().copy(o.matrix).invert()); ng.userData.relTess = true; o.geometry = ng; } else g2.dispose();
  });
}
/* xeometría chan e grande (prazas, parques, lousas): subdivídese para que siga o relevo en vez de cortalo en liña recta */
function relevoTess(g, maxLen = 6, scale = 1) {
  if (typeof RELEVO_DATA === 'undefined' || g.userData.noTess) return g;
  const P = g.attributes.position; if (!P || P.count < 3) return g;
  const a = P.array; let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < a.length; i += 3) { const x = a[i], y = a[i + 1], z = a[i + 2]; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  if ((y1 - y0) * scale > 2 || Math.max(x1 - x0, z1 - z0) * scale <= maxLen) return g;
  const idx = g.index ? g.index.array : null, nT = (idx ? idx.length : P.count) / 3;
  const atts = Object.keys(g.attributes).filter(k => ['position', 'normal', 'uv', 'color'].includes(k)).map(k => ({ k, A: g.attributes[k], s: g.attributes[k].itemSize, out: [] }));
  // bisección pola aresta máis longa: as tiras finas (carrís, bordos) só se cortan ao longo, as prazas en malla
  let any = false; const ns = atts.map(at => at.s);
  const vert = i => atts.map(at => { const A = at.A.array, s = at.s, o = []; for (let c = 0; c < s; c++) o.push(A[i * s + c]); return o; });
  const mid = (p, q) => p.map((arr, k) => arr.map((v, c) => (v + q[k][c]) / 2));
  const hl = (p, q) => Math.hypot(p[0][0] - q[0][0], p[0][2] - q[0][2]) * scale;
  const emit = v => atts.forEach((at, k) => { for (const x of v[k]) at.out.push(x); });
  for (let t = 0; t < nT; t++) {
    const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
    const stk = [[vert(i0), vert(i1), vert(i2)]];
    while (stk.length) {
    const V = stk.pop();
    const e = [hl(V[1], V[2]), hl(V[2], V[0]), hl(V[0], V[1])], L = Math.max(...e), sh = Math.min(...e);
    if (L <= maxLen) { emit(V[0]); emit(V[1]); emit(V[2]); continue; }
    any = true;
    const lerpV = (p, q, f) => p.map((arr, k) => arr.map((v, c) => v + (q[k][c] - v) * f));
    const kL = e.indexOf(L), ar = Math.abs((V[1][0][0] - V[0][0][0]) * (V[2][0][2] - V[0][0][2]) - (V[2][0][0] - V[0][0][0]) * (V[1][0][2] - V[0][0][2])) * scale * scale, alt = ar / L;
    if (sh > maxLen && alt <= maxLen) { // agulla obtusa: pártese polo pé da altura
      const O = V[kL], P0 = V[(kL + 1) % 3], Q0 = V[(kL + 2) % 3], dx = Q0[0][0] - P0[0][0], dz = Q0[0][2] - P0[0][2];
      const f = clamp(((O[0][0] - P0[0][0]) * dx + (O[0][2] - P0[0][2]) * dz) / (dx * dx + dz * dz || 1), 0.05, 0.95), M = lerpV(P0, Q0, f);
      stk.push([O, P0, M], [O, M, Q0]); continue;
    }
    if (sh <= maxLen) { // agulla: tira dende o lado curto ata o vértice oposto
      const k = e.indexOf(sh), A = V[k], P0 = V[(k + 1) % 3], Q0 = V[(k + 2) % 3], n = Math.min(60, Math.ceil(L / maxLen));
      for (let j = 0; j < n; j++) {
        const p0 = lerpV(P0, A, j / n), q0 = lerpV(Q0, A, j / n), p1 = lerpV(P0, A, (j + 1) / n), q1 = lerpV(Q0, A, (j + 1) / n);
        emit(p0); emit(q0); emit(p1);
        if (j < n - 1) { emit(q0); emit(q1); emit(p1); }
      }
    } else { // triángulo grande: malla regular
      const n = Math.min(24, Math.ceil(L / maxLen));
      for (let r = 0; r < n; r++) for (let q = 0; q < n - r; q++) {
        const P = (u, v) => V[0].map((arr, kk) => arr.map((x, c) => x * (1 - u - v) + V[1][kk][c] * u + V[2][kk][c] * v));
        emit(P(q / n, r / n)); emit(P((q + 1) / n, r / n)); emit(P(q / n, (r + 1) / n));
        if (q < n - r - 1) { emit(P((q + 1) / n, r / n)); emit(P((q + 1) / n, (r + 1) / n)); emit(P(q / n, (r + 1) / n)); }
      }
    }
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
uniform highp sampler2D relTex; uniform vec2 relO; uniform float relStep; uniform vec2 relN;
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
    // obxectos pequenos e lonxe da cámara non se debuxan (aforra moitas chamadas de debuxo)
    // nada máis aló da néboa (≈950 m): o que queda tan lonxe xa non se distingue
    if (RELEVO.cam) { const c = RELEVO.cam, dd = Math.hypot(sp.center.x - c.x, sp.center.z - c.z) - sp.radius; if (dd > 950) return false; }
    if (sp.radius < 14 && !o.isInstancedMesh && RELEVO.cam) { const c = RELEVO.cam, dx = sp.center.x - c.x, dz = sp.center.z - c.z, lim = 170 + sp.radius * 14; if (dx * dx + dz * dz > lim * lim) return false; }
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
  // sombras: se o equipo vai xusto (fotogramas de máis de 20 ms), o mapa de sombras recalcúlase un fotograma si e outro non
  if (typeof renderer !== 'undefined' && renderer.shadowMap.enabled) { const now = performance.now(), ft = now - (RELEVO.lastT || now); RELEVO.lastT = now; RELEVO.ft = lerp(RELEVO.ft || 16, ft, 0.1); RELEVO.fr = (RELEVO.fr || 0) + 1;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = RELEVO.ft < 20 || RELEVO.fr % 2 === 0; }
  const now = performance.now();
  if (now - _relLightT > 2000) { _relLightT = now; _relLights = []; scene.traverse(o => { if (o.isPointLight || o.isSpotLight || o.isDirectionalLight) _relLights.push(o); }); }
  for (const L of RELEVO.lods) { const d = Math.hypot(L.c.x - camera.position.x, L.c.z - camera.position.z) - L.r, near = d < L.d; L.hi.visible = near; if (L.lo) L.lo.visible = !near; }
  _relSaved.length = 0;
  const lift = (o, dy) => { _relSaved.push(o, o.position.y); o.position.y += dy; o.updateMatrixWorld(); };
  RELEVO.cam = camera.position;
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
