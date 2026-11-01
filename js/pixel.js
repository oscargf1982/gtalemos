'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Modo pixel art (opción do menú)
   O mundo debúxase a baixa resolución e amplíase sen suavizar,
   cunha paleta lixeiramente reducida e contorno escuro nos bordos.
   ========================================================== */
const PIX = { size: 0, rt: null, scene: null, cam: null, mat: null };
try { PIX.size = +(localStorage.getItem('lemosPix') || 0); } catch (e) { }
function pixSet(n) { PIX.size = +n || 0; try { localStorage.setItem('lemosPix', String(PIX.size)); } catch (e) { } }
function pixRender(scene, camera) {
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
