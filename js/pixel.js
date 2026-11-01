'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Modo pixel art (opción do menú)
   O mundo debúxase a baixa resolución e amplíase sen suavizar,
   cunha paleta lixeiramente reducida e contorno escuro nos bordos.
   ========================================================== */
const PIX = { size: 0, rt: null, scene: null, cam: null, mat: null };
try { PIX.size = +(localStorage.getItem('lemosPix') || 0); } catch (e) { }
function pixSet(n) { PIX.size = +n || 0; try { localStorage.setItem('lemosPix', String(PIX.size)); } catch (e) { } if (typeof pixTextures === 'function' && (PIX.size > 0) !== PIXT.on) pixTextures(PIX.size > 0); }
function pixRender(scene, camera) {
  if (PIX.size && !PIXT.on && typeof G !== 'undefined' && G.started) pixTextures(true);
  if (!PIX.size) { renderer.render(scene, camera); return; }
  const v = renderer.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(64, Math.ceil(v.x / PIX.size)), h = Math.max(48, Math.ceil(v.y / PIX.size));
  if (!PIX.rt) {
    PIX.rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
    PIX.rt.texture.encoding = THREE.sRGBEncoding;
    PIX.mat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: PIX.rt.texture }, res: { value: new THREE.Vector2(w, h) }, levels: { value: 22 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D tex; uniform vec2 res; uniform float levels; varying vec2 vUv;
        float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
        void main(){
          vec2 px = (floor(vUv * res) + 0.5) / res, d = 1.0 / res;
          vec3 c = texture2D(tex, px).rgb;
          // contorno: diferenza de luz cos veciños (dereita, abaixo)
          float e = max(abs(lum(c) - lum(texture2D(tex, px + vec2(d.x, 0.)).rgb)), abs(lum(c) - lum(texture2D(tex, px + vec2(0., d.y)).rgb)));
          c *= 1.0 - smoothstep(0.10, 0.30, e) * 0.35;
          // paleta reducida con tramado ordenado 2x2
          vec2 q = mod(floor(vUv * res), 2.0); float th = (q.x * 2.0 + q.y * 3.0 - (q.x * q.y) * 4.0) / 4.0 - 0.375;
          c = floor(c * levels + 0.5 + th * 0.6) / levels;
          gl_FragColor = vec4(c, 1.0);
        }`, depthTest: false, depthWrite: false });
    PIX.scene = new THREE.Scene(); const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), PIX.mat); q.frustumCulled = false; PIX.scene.add(q);
    PIX.cam = new THREE.Camera();
  }
  if (PIX.rt.width !== w || PIX.rt.height !== h) { PIX.rt.setSize(w, h); PIX.mat.uniforms.res.value.set(w, h); }
  renderer.setRenderTarget(PIX.rt); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(PIX.scene, PIX.cam);
}

/* ---------- texturas pixeladas (só en modo pixel art; as orixinais gárdanse para volver ao normal) ---------- */
const PIXT = { on: false, timer: null, mats: new Set(), cache: new WeakMap() };
function pixTex(tex) {
  if (!tex || tex.isRenderTargetTexture || tex.isDataTexture || !tex.image) return null;
  if (PIXT.cache.has(tex)) return PIXT.cache.get(tex);
  const im = tex.image, w = im.width || im.naturalWidth, h = im.height || im.naturalHeight;
  if (!w || !h || (im.complete === false)) return null;
  const f = Math.max(1, Math.min(4, Math.floor(Math.min(w, h) / 24))), W = Math.max(8, Math.round(w / f)), H = Math.max(8, Math.round(h / f));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.imageSmoothingEnabled = true; try { x.drawImage(im, 0, 0, W, H); } catch (e) { return null; }
  // cores planas: paleta de 6 niveis por canle e algo máis de saturación
  try { const d = x.getImageData(0, 0, W, H), a = d.data, L = 7;
    const q = v => Math.round(Math.min(255, Math.max(0, v)) / 255 * L) * 255 / L;
    for (let i = 0; i < a.length; i += 4) { let r = a[i], g = a[i + 1], b = a[i + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), m = (r + g + b) / 3;
      if (mx - mn < 22 || (mx - mn) / (mx + 1) < 0.28) { const v = q(m); a[i] = a[i + 1] = a[i + 2] = v; } // grises: só luz, sen manchas de cor
      else { r = m + (r - m) * 1.15; g = m + (g - m) * 1.15; b = m + (b - m) * 1.15; a[i] = q(r); a[i + 1] = q(g); a[i + 2] = q(b); }
      a[i + 3] = a[i + 3] < 128 ? 0 : 255; }
    x.putImageData(d, 0, 0); } catch (e) { /* imaxe doutro dominio: só se reduce */ }
  const t = new THREE.CanvasTexture(c);
  for (const k of ['wrapS', 'wrapT', 'encoding', 'flipY', 'rotation']) t[k] = tex[k];
  t.repeat.copy(tex.repeat); t.offset.copy(tex.offset); t.center.copy(tex.center);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.anisotropy = 1;
  PIXT.cache.set(tex, t); return t;
}
function pixMaterial(m, on) {
  if (!m || m.isShaderMaterial) return;
  const U = m.userData;
  if (on) {
    if (U.pixOn) return;
    let ok = true;
    for (const k of ['map', 'emissiveMap']) if (m[k] && !U['pixOrig_' + k]) { const t = pixTex(m[k]); if (t) { U['pixOrig_' + k] = m[k]; m[k] = t; } else if (!m[k].isDataTexture && !m[k].isRenderTargetTexture) ok = false; }
    if (m.normalMap && !U.pixOrig_normalMap) { U.pixOrig_normalMap = m.normalMap; m.normalMap = null; }
    U.pixOn = ok; m.needsUpdate = true; PIXT.mats.add(m);
  } else if (U.pixOn || U.pixOrig_map || U.pixOrig_emissiveMap || U.pixOrig_normalMap) {
    for (const k of ['map', 'emissiveMap', 'normalMap']) if (U['pixOrig_' + k]) { m[k] = U['pixOrig_' + k]; delete U['pixOrig_' + k]; }
    U.pixOn = false; m.needsUpdate = true;
  }
}
// as texturas animadas (o reloxo da estación, carteis que se repintan) quedan coma estaban
function pixPass(on) {
  if (typeof G === 'undefined' || !G.scene) return;
  G.scene.traverse(o => { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) pixMaterial(m, on); });
  if (!on) for (const m of PIXT.mats) pixMaterial(m, false);
}
function pixTextures(on) {
  PIXT.on = on; clearInterval(PIXT.timer);
  pixPass(on);
  if (on) PIXT.timer = setInterval(() => pixPass(true), 2500); // obxectos e imaxes que chegan despois
}
