'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Avelino en pixel art (sprites achegados polo autor)
   Opción do menú «Avelino»: pixel art (sprite que sempre mira á cámara)
   ou o modelo 3D de sempre. O atlas img/avelino-sprite.png ten 8×5 celas:
   0-2 quieto (fronte, costas, perfil), 3-6 falar, 7 sentado,
   8-11 camiñar de perfil, 12-13 camiñar de fronte, 14-15 de costas,
   16-19 correr de costas, 20-23 de fronte, 24-27 cara á dereita, 28-31 cara á esquerda,
   32-34 saltar, 35 durmindo.
   ========================================================== */
const AVS = { on: true, mesh: null, shadow: null, fr: -1, flip: false };
try { AVS.on = (localStorage.getItem('lemosAvelino') || 'pixel') === 'pixel'; } catch (e) { }
function aveSet(v) { AVS.on = v === 'pixel'; try { localStorage.setItem('lemosAvelino', v); } catch (e) { } }
function aveActive() { return AVS.on && G.started && G.player && !G.player.car && G.player.ped; }
function aveFrame(f, flip) {
  if (AVS.fr === f && AVS.flip === flip) return; AVS.fr = f; AVS.flip = flip;
  const t = AVS.mesh.material.map, c = f % 8, r = Math.floor(f / 8);
  t.repeat.set(flip ? -1 / 8 : 1 / 8, 1 / 5); t.offset.set(flip ? (c + 1) / 8 : c / 8, 1 - (r + 1) / 5);
}
function updateAveSprite() {
  if (!AVS.mesh) {
    const tex = new THREE.TextureLoader().load('img/avelino-sprite.png'); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.encoding = THREE.sRGBEncoding;
    const h = 1.9, w = h * 176 / 190, g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - 0.04, 0);
    AVS.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide })); AVS.mesh.renderOrder = 2; G.scene.add(AVS.mesh);
    const sg = new THREE.CircleGeometry(0.42, 16); sg.rotateX(-Math.PI / 2);
    AVS.shadow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })); AVS.shadow.scale.set(1, 1, 0.6); G.scene.add(AVS.shadow);
    aveFrame(0, false);
  }
  const act = aveActive(); AVS.mesh.visible = AVS.shadow.visible = !!act; if (!act) return;
  const p = G.player.ped, gy = groundH(p.x, p.z), cam = camera.position;
  AVS.mesh.position.set(p.x, p.y, p.z); AVS.shadow.position.set(p.x, gy + 0.03, p.z);
  const yawC = Math.atan2(cam.x - p.x, cam.z - p.z); AVS.mesh.rotation.y = yawC;
  AVS.mesh.material.color.setScalar(1 - 0.45 * (G.night || 0));
  const rel = Math.atan2(Math.sin(p.yaw - yawC), Math.cos(p.yaw - yawC)), view = Math.abs(rel) < 0.7 ? 'front' : Math.abs(rel) > 2.45 ? 'back' : rel > 0 ? 'right' : 'left';
  const ph = (p.phase || 0) / (Math.PI * 2), q4 = Math.floor(((ph % 1) + 1) % 1 * 4), q2 = Math.floor(((ph % 1) + 1) % 1 * 2);
  let f = 0, flip = false;
  if ((p.lie || 0) > 0.5) f = 35;
  else if ((p.sit || 0) > 0.4) f = 7;
  else if (p.y > gy + 0.25) { const vy = p.y - (AVS.lastY ?? p.y); f = vy > 0.01 ? 33 : vy < -0.01 ? 32 : 34; flip = view === 'left'; }
  else if ((p.run || 0) > 0.5 && (p.speed || 0) > 0.5) f = (view === 'front' ? 20 : view === 'back' ? 16 : view === 'right' ? 24 : 28) + q4;
  else if ((p.walk || 0) > 0.35 && (p.speed || 0) > 0.15) { if (view === 'front') f = 12 + q2; else if (view === 'back') f = 14 + q2; else { f = 8 + q4; flip = view === 'left'; } }
  else if (G.dialog && $('dlgName').textContent === 'Ti') f = 3 + Math.floor(G.t / 0.6) % 4;
  else { f = view === 'front' ? 0 : view === 'back' ? 1 : 2; flip = view === 'left'; }
  AVS.lastY = p.y;
  aveFrame(f, flip);
}

/* cara de Avelino nos diálogos segundo o que di (ou L.mood se a liña o indica) */
function aveMoodFor(t) {
  const x = t.toLowerCase();
  if (/grazas|perfecto|xenial|boa idea|de acordo|vale|claro/.test(x)) return 'sonriente';
  if (/ha(ha)+|jaja|xaxa/.test(x)) return 'rie';
  if (/nooo|ai,|ai!|socorro|axuda/.test(x)) return 'asustado';
  if (/merda|carallo|déixame|basta|pero que/.test(x)) return 'enojado';
  if (/sinto|perdón|desculpa|lamento/.test(x)) return 'avergonzado';
  if (/estou canso|sono|durmir/.test(x)) return 'cansado';
  if (/\?\s*$/.test(t) && /que |como |onde |por que|quen /.test(x)) return 'confundido';
  if (/\?/.test(t)) return 'pensativo';
  if (/!/.test(t)) return 'sorprendido';
  return 'sonriente';
}
