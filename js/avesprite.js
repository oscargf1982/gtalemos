'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Avelino en pixel art (sprites achegados polo autor)
   Opción do menú «Avelino»: pixel art (sprite que sempre mira á cámara)
   ou o modelo 3D de sempre. Atlas img/avelino-sprite.png: 8×7 celas de 191×196 px;
   AVL di que celas forman cada animación (catro direccións: fronte, costas, dereita, esquerda).
   ========================================================== */
const AVL = {"idleF":[0,1,2,3,4],"walkF":[5,6,7,8],"runR":[9,10,11,12],"idleR":[13,14],"walkR":[15,16,17,18,19,20,21],"idleL":[22],"walkL":[23,24,25,26,27,28,29,30],"jump":[31,32,33,34],"idleB":[35,36,37,38,39],"walkB":[40,41,42,43],"talk":[44,45,46,47],"sit":[48],"sleep":[49]};
const AVC = { cw: 191, ch: 196, cols: 8, rows: 7, idleH: 190 };
const AVS = { on: true, mesh: null, shadow: null, fr: -1, flip: false };
try { AVS.on = (localStorage.getItem('lemosAvelino') || 'pixel') === 'pixel'; } catch (e) { }
function aveSet(v) { AVS.on = v === 'pixel'; try { localStorage.setItem('lemosAvelino', v); } catch (e) { } }
function aveActive() { return AVS.on && G.started && G.player && !G.player.car && G.player.ped; }
function aveFrame(f, flip) {
  if (AVS.fr === f && AVS.flip === flip) return; AVS.fr = f; AVS.flip = flip;
  const t = AVS.mesh.material.map, c = f % AVC.cols, r = Math.floor(f / AVC.cols);
  t.repeat.set(flip ? -1 / AVC.cols : 1 / AVC.cols, 1 / AVC.rows); t.offset.set(flip ? (c + 1) / AVC.cols : c / AVC.cols, 1 - (r + 1) / AVC.rows);
}
const aveCyc = (L, u) => L[Math.floor(((u % 1) + 1) % 1 * L.length) % L.length];
function updateAveSprite() {
  if (!AVS.mesh) {
    const tex = new THREE.TextureLoader().load('img/avelino-sprite.png'); tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.encoding = THREE.sRGBEncoding;
    const h = 1.8 * AVC.ch / AVC.idleH, w = h * AVC.cw / AVC.ch, g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - 0.03, 0);
    AVS.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })); AVS.mesh.renderOrder = 2; G.scene.add(AVS.mesh);
    const sg = new THREE.CircleGeometry(0.42, 16); sg.rotateX(-Math.PI / 2);
    AVS.shadow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })); AVS.shadow.scale.set(1, 1, 0.6); G.scene.add(AVS.shadow);
    aveFrame(0, false);
  }
  const act = aveActive(); AVS.mesh.visible = AVS.shadow.visible = !!act; if (!act) return;
  const p = G.player.ped, gy = groundH(p.x, p.z), cam = camera.position;
  AVS.mesh.position.set(p.x, p.y, p.z); AVS.shadow.position.set(p.x, gy + 0.03, p.z);
  const yawC = Math.atan2(cam.x - p.x, cam.z - p.z); AVS.mesh.rotation.y = yawC;
  AVS.mesh.material.color.setScalar(1 - 0.45 * (G.night || 0));
  const rel = Math.atan2(Math.sin(p.yaw - yawC), Math.cos(p.yaw - yawC)), view = Math.abs(rel) < 0.7 ? 'F' : Math.abs(rel) > 2.45 ? 'B' : rel > 0 ? 'R' : 'L';
  const ph = (p.phase || 0) / (Math.PI * 2), T = G.t || 0;
  let f = 0, flip = false;
  if ((p.lie || 0) > 0.5) f = AVL.sleep[0];
  else if ((p.sit || 0) > 0.4) f = AVL.sit[0];
  else if (p.y > gy + 0.25) { const vy = p.y - (AVS.lastY ?? p.y), J = AVL.jump; f = vy > 0.01 ? J[1] : vy < -0.01 ? J[3] : J[2]; flip = view === 'L'; }
  else if ((p.run || 0) > 0.5 && (p.speed || 0) > 0.5) { if (view === 'F') f = aveCyc(AVL.walkF, ph); else if (view === 'B') f = aveCyc(AVL.walkB, ph); else { f = aveCyc(AVL.runR, ph); flip = view === 'L'; } }
  else if ((p.walk || 0) > 0.35 && (p.speed || 0) > 0.15) f = aveCyc(view === 'F' ? AVL.walkF : view === 'B' ? AVL.walkB : view === 'R' ? AVL.walkR : AVL.walkL, ph);
  else if (G.dialog && $('dlgName').textContent === 'Ti') f = aveCyc(AVL.talk, T / 2.4);
  else f = view === 'F' ? aveCyc(AVL.idleF, T / 3) : view === 'B' ? aveCyc(AVL.idleB, T / 3) : view === 'R' ? aveCyc(AVL.idleR, T / 2.4) : AVL.idleL[0];
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
