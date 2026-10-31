'use strict';
/* ==========================================================
   LEMOS 27400 · xogo: xogador, cámara, HUD, misións, son
   ========================================================== */
const $ = id => document.getElementById(id);
const QUALITY = {
  high: { pr: 1.5, shadow: 2048, peds: 84, traffic: 24, parked: 40, lights: 6, rain: 3500 },
  med: { pr: 1.0, shadow: 1024, peds: 53, traffic: 16, parked: 26, lights: 3, rain: 2000 },
  low: { pr: 0.8, shadow: 0, peds: 29, traffic: 10, parked: 14, lights: 0, rain: 1000 },
};
let Q = 'high', QS = QUALITY.high;
let renderer, scene, camera, sky, skyScene, pmrem, envRT, sun, moon, hemi;
const world = { vehicles: [], crowd: null, train: null, skids: null, smoke: null };
G.player = { ped: null, car: null, money: 0, wanted: 0, wantedT: 0, bottles: 0 };
G.hour = 19.0; G.timeScale = 1 / 60; G.night = 0; G.rain = false; G.shake = 0; G.paused = true; G.started = false;
const SAVE_KEY = 'lemos27400_v1';
let save = { money: 0, done: {}, bottles: [], best: {} };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = Object.assign(save, s); } catch (e) { }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }

/* ---------- Arranque ---------- */
function detectQuality() {
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || (matchMedia('(pointer: coarse)').matches && innerWidth < 1100);
  return mobile ? 'med' : 'high';
}
function boot() {
  Q = $('optQuality').value = (() => { try { return localStorage.getItem('lemosQ') || detectQuality(); } catch (e) { return detectQuality(); } })();
  QS = QUALITY[Q];
  renderer = new THREE.WebGLRenderer({ antialias: Q !== 'low', powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, QS.pr));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = QS.shadow > 0; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = false;
  $('view').appendChild(renderer.domElement);
  MAXANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  scene = new THREE.Scene(); G.scene = scene;
  scene.fog = new THREE.FogExp2(0xa8b8c4, 0.0017);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.15, 3200);
  camera.position.set(60, 90, 160);
  addEventListener('resize', onResize);
  setLoad(0.05, 'Pintando texturas de granito e lousa…');
  setTimeout(() => {
    makeTextures(Q);
    setLoad(0.3, 'Trazando o río Cabe e as rúas…');
    setTimeout(() => {
      buildSkyAndLights();
      buildWorld(scene, Q);
      buildGraph();
      initPlaces();
      setLoad(0.75, 'Chamando aos veciños e ao tráfico…');
      setTimeout(() => {
        vehicleMats();
        spawnActors();
        buildMinimapBase();
        setupInput();
        setLoad(1, 'Listo');
        $('loading').hidden = true; $('menuMain').hidden = false;
        updateMenuStats();
        lastT = performance.now(); requestAnimationFrame(loop);
      }, 30);
    }, 30);
  }, 60);
}
function setLoad(f, msg) { $('loadBar').style.transform = `scaleX(${f})`; $('loadMsg').textContent = msg; }
function onResize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }

/* ---------- Ceo, sol, néboa ---------- */
const SKY_VS = `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`;
const SKY_FS = `
uniform vec3 sunDir; uniform float night; uniform float time; uniform float rain; varying vec3 vDir;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
void main(){
  vec3 d = normalize(vDir); float h = max(d.y, 0.); float sunH = sunDir.y;
  vec3 zen = mix(vec3(.13,.32,.66), vec3(.008,.012,.035), night);
  vec3 hor = mix(vec3(.62,.74,.86), vec3(.035,.05,.085), night);
  float sunset = smoothstep(.35, -.02, sunH) * (1. - smoothstep(-.02, -.22, sunH));
  vec3 hz = normalize(vec3(d.x, .0001, d.z)); vec3 sz = normalize(vec3(sunDir.x, .0001, sunDir.z));
  float toward = pow(max(dot(hz, sz), 0.), 3.);
  hor = mix(hor, vec3(1., .47, .22), sunset * (.3 + .6 * toward));
  zen = mix(zen, vec3(.28,.3,.5), sunset*.35);
  vec3 col = mix(hor, zen, pow(h, .5));
  col = mix(col, hor * .75, smoothstep(0., -.25, d.y));
  float sd = max(dot(d, normalize(sunDir)), 0.);
  col += vec3(1., .86, .62) * (pow(sd, 1400.) * 22. + pow(sd, 10.) * .22 * (1. - night)) * (1. - rain * .85);
  vec3 md = normalize(vec3(-.35, .55, -.6)); float mv = dot(d, md);
  col += vec3(.85, .9, 1.) * smoothstep(.9993, .9996, mv) * night + vec3(.15,.18,.28)*pow(max(mv,0.),60.)*night*.6;
  if (night > .05 && d.y > 0.) { vec2 sp = d.xz / (d.y + .25) * 170.; float hs = hash(floor(sp)); float s = step(.9965, hs);
    col += vec3(s) * night * smoothstep(0., .35, d.y) * (.55 + .45 * sin(time * 2. + hs * 50.)) * (1. - rain); }
  if (d.y > 0.) { vec2 uv = d.xz / (d.y + .07) * 1.4 + vec2(time * .006, time * .0025);
    float c = fbm(uv) * .7 + fbm(uv * 3.1) * .3; float cover = mix(.5, .26, rain); c = smoothstep(cover, cover + .3, c);
    vec3 cc = mix(vec3(1.), vec3(.52, .55, .6), rain); cc = mix(cc, vec3(1., .62, .42), sunset * .7); cc *= mix(1., .06, night);
    float lit = .75 + .25 * pow(sd, 4.); col = mix(col, cc * lit, c * smoothstep(0., .12, d.y) * .92); }
  col = mix(col, vec3(.48, .5, .54) * mix(1., .09, night), rain * .5);
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
function buildSkyAndLights() {
  const skyMat = new THREE.ShaderMaterial({ uniforms: { sunDir: { value: new THREE.Vector3(0, 1, 0) }, night: { value: 0 }, time: { value: 0 }, rain: { value: 0 } }, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false });
  sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
  skyScene = new THREE.Scene(); skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat));
  pmrem = new THREE.PMREMGenerator(renderer);
  sun = new THREE.DirectionalLight(0xfff1dc, 2.4); sun.castShadow = QS.shadow > 0;
  if (QS.shadow) { sun.shadow.mapSize.set(QS.shadow, QS.shadow); const c = sun.shadow.camera; c.left = c.bottom = -75; c.right = c.top = 75; c.near = 1; c.far = 420; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.035; }
  scene.add(sun, sun.target);
  moon = new THREE.DirectionalLight(0x8fa6d8, 0); moon.position.set(-140, 220, -240); scene.add(moon);
  hemi = new THREE.HemisphereLight(0xbcd2ec, 0x5b5040, 0.6); scene.add(hemi);
  G.pointLights = []; for (let i = 0; i < QS.lights; i++) { const l = new THREE.PointLight(0xffb866, 0, 26, 2); scene.add(l); G.pointLights.push(l); }
  G.headL = []; for (const s of [-1, 1]) { const sl = new THREE.SpotLight(0xf2f6ff, 0, 60, 0.5, 0.55, 1.4); scene.add(sl, sl.target); G.headL.push(sl); }
  // choiva
  const n = QS.rain, pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { const x = RR(-40, 40), y = RR(0, 30), z = RR(-40, 40); pos.set([x, y, z, x + 0.03, y - 0.7, z + 0.02], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  G.rainMesh = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xaab8c8, transparent: true, opacity: 0.35 })); G.rainMesh.frustumCulled = false; G.rainMesh.visible = false; scene.add(G.rainMesh);
}
const _sunDir = new THREE.Vector3(), _c1 = new THREE.Color(), _c2 = new THREE.Color();
let envTimer = 0, lastEnvHour = -99;
function updateSky(dt, focus) {
  G.hour = (G.hour + dt * G.timeScale) % 24; G.absHour = (G.absHour || G.hour) + dt * G.timeScale;
  const h = G.hour, ang = (h - 7.6) / 12 * Math.PI, el = Math.sin(ang) * 0.95, az = -(h - 13.6) / 12 * Math.PI;
  _sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az) * 0.8 + 0.25).normalize();
  const night = 1 - sstep(-0.14, 0.1, _sunDir.y); G.night = night;
  const u = sky.material.uniforms; u.sunDir.value.copy(_sunDir); u.night.value = night; u.time.value = G.t; u.rain.value = lerp(u.rain.value, G.rain ? 1 : 0, Math.min(1, dt * 0.5));
  const rain = u.rain.value;
  // luz solar
  const low = 1 - sstep(0.05, 0.4, _sunDir.y);
  sun.color.setRGB(1, lerp(0.95, 0.62, low), lerp(0.88, 0.42, low));
  sun.intensity = (1 - night) * lerp(1.75, 0.7, rain) * sstep(-0.05, 0.08, _sunDir.y);
  sun.position.set(focus.x + _sunDir.x * 160, focus.y + _sunDir.y * 160, focus.z + _sunDir.z * 160); sun.target.position.set(focus.x, focus.y, focus.z);
  moon.intensity = night * 0.62; moon.position.set(focus.x - 140, 220, focus.z - 240);
  hemi.intensity = lerp(0.42, 0.34, night) * lerp(1, 0.9, rain);
  hemi.color.setRGB(lerp(0.74, 0.46, night), lerp(0.82, 0.52, night), lerp(0.92, 0.72, night));
  hemi.groundColor.setRGB(lerp(0.38, 0.17, night), lerp(0.33, 0.17, night), lerp(0.27, 0.2, night));
  renderer.toneMappingExposure = lerp(0.92, 1.45, night);
  // néboa da cor do horizonte
  const sunset = sstep(0.35, -0.02, _sunDir.y) * (1 - sstep(-0.02, -0.22, _sunDir.y));
  _c1.setRGB(0.66, 0.75, 0.84).lerp(_c2.setRGB(0.1, 0.12, 0.18), night).lerp(_c2.setRGB(0.95, 0.6, 0.42), sunset * 0.45).lerp(_c2.setRGB(0.48, 0.5, 0.54).multiplyScalar(lerp(1, 0.12, night)), rain * 0.6);
  scene.fog.color.copy(_c1); scene.fog.density = lerp(0.0016, 0.0046, rain) + night * 0.0004;
  // materiais nocturnos
  for (const n of G.nightMats) n.mat.emissiveIntensity = n.base + night * n.k;
  // estrada mollada
  const wet = rain; MAT.road.roughness = lerp(0.9, 0.28, wet); MAT.road.color.setScalar(lerp(1, 0.62, wet)); MAT.cobble.roughness = lerp(0.75, 0.25, wet); MAT.sidewalk.roughness = lerp(0.85, 0.35, wet);
  // mapa de contorno (reflexos) cada certo tempo
  envTimer -= dt;
  if (envTimer <= 0 && Math.abs(h - lastEnvHour) > 0.08) {
    envTimer = 2.5; lastEnvHour = h;
    const nt = pmrem.fromScene(skyScene, 0.02); if (envRT) envRT.dispose(); envRT = nt; scene.environment = nt.texture;
  }
  sky.position.copy(camera.position);
  if (G.drawClock && Math.floor(G.t) % 2 === 0 && G._lastClockMin !== Math.floor(h * 60)) { G._lastClockMin = Math.floor(h * 60); G.drawClock(Math.floor(h), Math.floor((h % 1) * 60)); }
}

/* ---------- Actores iniciais ---------- */
const CAR_MIX = ['compacto', 'compacto', 'compacto', 'berlina', 'berlina', 'suv', 'suv', 'furgoneta', 'deportivo', 'taxi'];
function spawnVehicle(type, x, z, yaw, color) { const v = new Vehicle(type, color || pick(CAR_COLORS), scene); v.place(x, z, yaw); world.vehicles.push(v); return v; }
function pickNodeNear(x, z, r0, r1) {
  NODEGRID.query(x, z, r1, _pnq); const c = _pnq.filter(n => { const d = Math.hypot(n.x - x, n.z - z); return d > r0 && d < r1; });
  return c.length ? pick(c) : null;
}
const _pnq = [];
/* peóns que quedan lonxe reaparecen preto do xogador (o mapa real é grande) */
function recyclePeds() {
  const me = G.player.car || G.player.ped, C = world.crowd; let k = 0;
  for (const p of C.peds) {
    if (p.state !== 'walk' || p.npc || p === G.player.ped || k > 6) continue;
    if (Math.hypot(p.x - me.x, p.z - me.z) < 240) continue;
    const n = pickNodeNear(me.x, me.z, 70, 200); if (!n) break;
    const e = n.edges.find(e => e.road.urban && e.road.type !== 'track'); if (!e) continue;
    const dx = e.to.x - n.x, dz = e.to.z - n.z, L = Math.hypot(dx, dz) || 1, off = pedOffset(e.road), sd = R() < 0.5 ? -1 : 1;
    p.from = n; p.edge = e; p.side = sd; p.x = n.x - dz / L * off * sd; p.z = n.z + dx / L * off * sd; p.y = groundH(p.x, p.z); p.visible = true; k++;
  }
}
function spawnTraffic(farFrom) {
  for (let tries = 0; tries < 30; tries++) {
    const me = G.player.car || G.player.ped || { x: 0, z: 0 };
    const n = pickNodeNear(me.x, me.z, farFrom ? 90 : 0, 300), e = n && pick(n.edges); if (!e || e.road.type !== 'car' || e.blocked || e.len < 12 || e.wrong || e.road.cls === 'service') continue;
    const s = RR(2, e.len - 2), [x, z, L, ux, uz] = lanePoint(n, e.to, e.road, s);
    if (farFrom && Math.hypot(x - farFrom.x, z - farFrom.z) < 70) continue;
    if (world.vehicles.some(v => Math.hypot(v.x - x, v.z - z) < 12)) continue;
    const type = R() < 0.06 ? 'bus' : pick(CAR_MIX);
    if (type === 'bus' && e.road.spiral) continue;
    const v = spawnVehicle(type, x, z, Math.atan2(ux, uz));
    v.ai = { mode: 'traffic', cruise: RR(10, 13.5) * (type === 'bus' ? 0.8 : 1), stuck: 0, ignore: 0 }; aiSetEdge(v, n, e);
    const fwd = v.ai.cruise * 0.6; v.vx = ux * fwd; v.vz = uz * fwd;
    v.driverCol = { shirt: pick(SHIRT), skin: pick(SKIN), hair: pick(HAIR) };
    return v;
  }
  return null;
}
function spawnActors() {
  world.skids = new Skids(scene); world.smoke = new Smoke(scene);
  world.train = new Train(scene);
  // xogador
  const RESERVE = 195; // veciños extra para obreiros, ciclistas, manifestación e feira
  world.crowd = new Crowd(scene, QS.peds + 1 + RESERVE);
  const pp = world.crowd.add({ state: 'player', colors: { shirt: '#7a1f3d', pants: '#22324d', skin: '#e9bc98', hair: '#2a1d14', shoe: '#efefef', sleeve: false } });
  pp.x = G.startPos.x; pp.z = G.startPos.z; pp.yaw = G.startPos.yaw; pp.y = groundH(pp.x, pp.z); pp.scale = 1.02; G.player.ped = pp;
  // coche do xogador aparcado ao lado
  const start = (() => { const sp = G.startCar; return spawnVehicle('clasico', sp.x, sp.z, sp.yaw, '#6a1522'); })(); start.sleep = true;
  // aparcados
  const spots = G.parking.filter(sp => Math.hypot(sp.x - pp.x, sp.z - pp.z) < 300 && Math.hypot(sp.x - G.startCar.x, sp.z - G.startCar.z) > 6).sort(() => R() - 0.5).slice(0, QS.parked);
  for (const s of spots) { const v = spawnVehicle(pick(['compacto', 'compacto', 'berlina', 'suv', 'furgoneta', 'suv', 'compacto']), s.x, s.z, s.yaw); v.sleep = true; }
  for (const s of G.taxiStand) { const v = spawnVehicle('taxi', s.x, s.z, s.yaw); v.sleep = true; }
  // tráfico
  for (let i = 0; i < QS.traffic; i++) spawnTraffic(pp);
  // peóns
  const C = world.crowd, max = QS.peds;
  const seats = G.seats.slice().sort(() => R() - 0.5).slice(0, Math.min(G.seats.length, Math.round(max * 0.28)));
  for (const s of seats) { const p = C.add({ state: 'seat', seat: s, home: 'seat' }); if (!p) break; p.x = s.x; p.z = s.z; p.y = 0; }
  const areas = [['cardeal', 0.14], ['park', 0.16], ['castle', 0.08], ['plaza', 0.06], ['station', 0.06], ['paseo', 0.06]];
  for (const [a, f] of areas) for (let i = 0; i < Math.round(max * f); i++) { const p = C.add({ state: 'wander', area: a, home: 'wander', walkSpeed: RR(1.0, 1.45) }); if (!p) break; const [x, z] = randomAreaPoint(a); p.x = x; p.z = z; p.y = groundH(x, z); p.timer = RR(0, 6); }
  const nearNodes = NODES.filter(n => Math.hypot(n.x - pp.x, n.z - pp.z) < 260 && n.edges.some(e => e.road.urban && e.road.type !== 'track'));
  while (C.peds.length < max + 1 + RESERVE) {
    const n = pick(nearNodes.length ? nearNodes : NODES); const e = pick(n.edges); const t = R();
    const p = C.add({ state: 'walk', home: 'walk', walkSpeed: RR(1.1, 1.55) }); if (!p) break;
    p.from = n; p.edge = e; p.side = R() < 0.5 ? -1 : 1;
    const off = pedOffset(e.road);
    const dx = e.to.x - n.x, dz = e.to.z - n.z, L = Math.hypot(dx, dz) || 1;
    p.x = n.x + dx * t + (-dz / L) * off * p.side; p.z = n.z + dz * t + (dx / L) * off * p.side; p.y = groundH(p.x, p.z);
  }
  // marcadores de misión
  buildMissionMarkers();
  spawnStoryNPCs();
  spawnRiders();
  initFair();
  if (typeof buildMedieval === 'function') buildMedieval();
  initPellas();
  initMayor();
  initBand();
  initFluvial();
  initWorks();
  // botellas xa atopadas
  for (const b of G.bottles) if (save.bottles.includes(b.where)) { b.got = true; b.m.visible = b.halo.visible = false; }
  G.player.money = save.money || 0; G.player.bottles = save.bottles.length;
}

/* ==========================================================
   ENTRADA: teclado, rato, táctil, mando
   ========================================================== */
const keys = {}; const IN = { mx: 0, my: 0, run: false, hand: false, camX: 0, camY: 0 };
const touch = { active: false, jx: 0, jy: 0, id: null, camId: null, lx: 0, ly: 0 };
let camYaw = Math.PI, camPitch = 0.28, camIdle = 9, camMode = 0;
function setupInput() {
  addEventListener('keydown', e => {
    if (e.repeat) { keys[e.code] = true; return; }
    keys[e.code] = true;
    if (!G.started) return;
    if (G.cine && G.cine.intro && !G.paused && e.code === 'Escape') { skipIntro(); e.preventDefault(); return; }
    if (G.invOpen && (e.code === 'Escape' || e.code === 'KeyI')) { toggleInventory(false); e.preventDefault(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); e.preventDefault(); }
    if (G.paused) return;
    if (G.cine && G.cine.intro) { if (['Space', 'Enter', 'Escape', 'KeyE', 'KeyF'].includes(e.code)) skipIntro(); return; }
    if (G.cine && (G.cine.dinner || G.cine.phone) && !G.dialog) { if (['Space', 'Enter'].includes(e.code)) { G.cine.dinner ? skipCena() : endTrainPhone(); e.preventDefault(); } return; }
    if (G.cine && !G.cine.dinner) { if (['Space', 'Enter'].includes(e.code)) { skipTravel(); e.preventDefault(); } return; }
    if (!$('travel').hidden) { if (e.code === 'Escape') closeTravel(); return; }
    if (G.dialog) { if (['Space', 'KeyE', 'Enter', 'KeyF'].includes(e.code)) { dialogAdvance(); e.preventDefault(); } const m = /^Digit([1-9])$/.exec(e.code) || /^Numpad([1-9])$/.exec(e.code); if (m) choose(+m[1] - 1); return; }
    if (e.code === 'KeyF' || e.code === 'Enter') toggleCar();
    if (e.code === 'KeyC') cycleCam();
    if (e.code === 'KeyM') toggleMap();
    if (e.code === 'KeyY') quickTravel();
    if (e.code === 'KeyI' && !G.invOpen) toggleInventory(true);
    if (e.code === 'KeyH') { if (G.player.car) G.sfx.horn(G.player.car, 1); }
    if (e.code === 'KeyR') G.sfx.toggleRadio();
    if (e.code === 'KeyT') taxiShift();
    if (e.code === 'KeyV') $('hud').classList.toggle('photo');
    if (e.code === 'KeyE') interact();
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const cv = renderer.domElement;
  cv.addEventListener('click', () => { if (G.started && !G.paused && !isTouch && cv.requestPointerLock) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } } });
  let dragging = false, lx = 0, ly = 0;
  cv.addEventListener('mousedown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
  addEventListener('mouseup', () => dragging = false);
  addEventListener('mousemove', e => {
    if (!G.started || G.paused) return;
    let dx = 0, dy = 0;
    if (document.pointerLockElement === cv) { dx = e.movementX; dy = e.movementY; }
    else if (dragging) { dx = e.clientX - lx; dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; }
    if (dx || dy) { camYaw -= dx * 0.0032; camPitch = clamp(camPitch + dy * 0.0026, -0.25, 1.2); camIdle = 0; }
  });
  addEventListener('wheel', e => { camDist = clamp(camDist + Math.sign(e.deltaY) * 0.8, 3, 14); }, { passive: true });
  // táctil
  const joy = $('joy'), knob = $('joyKnob');
  const joyStart = (t) => { const r = joy.getBoundingClientRect(); touch.cx = r.left + r.width / 2; touch.cy = r.top + r.height / 2; touch.id = t.identifier; joyMove(t); };
  const joyMove = (t) => { const dx = t.clientX - touch.cx, dy = t.clientY - touch.cy, R0 = 52, l = Math.hypot(dx, dy), k = l > R0 ? R0 / l : 1; touch.jx = dx * k / R0; touch.jy = dy * k / R0; knob.style.transform = `translate(${dx * k}px,${dy * k}px)`; };
  joy.addEventListener('touchstart', e => { e.preventDefault(); joyStart(e.changedTouches[0]); }, { passive: false });
  addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === touch.id) joyMove(t);
      if (t.identifier === touch.camId) { camYaw -= (t.clientX - touch.lx) * 0.006; camPitch = clamp(camPitch + (t.clientY - touch.ly) * 0.004, -0.25, 1.2); touch.lx = t.clientX; touch.ly = t.clientY; camIdle = 0; }
    }
  }, { passive: true });
  const endT = e => { for (const t of e.changedTouches) { if (t.identifier === touch.id) { touch.id = null; touch.jx = touch.jy = 0; knob.style.transform = ''; } if (t.identifier === touch.camId) touch.camId = null; } };
  addEventListener('touchend', endT); addEventListener('touchcancel', endT);
  cv.addEventListener('touchstart', e => { for (const t of e.changedTouches) if (t.clientX > innerWidth * 0.4 && touch.camId === null) { touch.camId = t.identifier; touch.lx = t.clientX; touch.ly = t.clientY; } }, { passive: true });
  const hold = (id, on, off) => { const b = $(id); b.addEventListener('touchstart', e => { e.preventDefault(); b.classList.add('on'); on(); }, { passive: false }); b.addEventListener('touchend', e => { e.preventDefault(); b.classList.remove('on'); off && off(); }, { passive: false }); };
  hold('tbEnter', () => toggleCar()); hold('tbHand', () => { IN.tHand = true; }, () => { IN.tHand = false; });
  hold('tbGas', () => { IN.tGas = true; }, () => { IN.tGas = false; }); hold('tbBrake', () => { IN.tBrake = true; }, () => { IN.tBrake = false; });
  hold('tbHorn', () => { if (G.player.car) G.sfx.horn(G.player.car, 1); }); hold('tbCam', () => cycleCam()); hold('tbMap', () => toggleMap()); hold('tbPause', () => togglePause()); hold('tbAct', () => { if (G.player.car && G.player.car.type === 'taxi') taxiShift(); else interact(); });
  // botóns do menú
  $('btnPlay').onclick = startGame;
  initModes();
  $('skipIntro').onclick = e => { e.stopPropagation(); if (G.cine && G.cine.dinner) skipCena(); else if (G.cine && G.cine.phone) endTrainPhone(); else if (G.cine && !G.cine.intro) skipTravel(); else skipIntro(); };
  $('dialog').addEventListener('click', () => dialogAdvance()); $('btnResume').onclick = () => togglePause(false);
  $('optQuality').onchange = e => { try { localStorage.setItem('lemosQ', e.target.value); } catch (er) { } $('qNote').hidden = false; };
  $('optTime').onchange = e => { G.hour = +e.target.value; envTimer = 0; lastEnvHour = -99; };
  $('optRain').onchange = e => { G.rain = e.target.value === 'rain'; };
  $('btnMapClose').onclick = () => toggleMap(false);
  $('btnTravel').onclick = () => openTravel();
  $('hbMap').onclick = () => toggleMap(true);
  $('hbInv').onclick = e => { e.stopPropagation(); toggleInventory(); };
  $('hbTravel').onclick = () => quickTravel();
  $('btnTravelClose').onclick = () => closeTravel();
  document.querySelectorAll('[data-wp]').forEach(b => b.onclick = () => { const [x, z] = b.dataset.wp.split(',').map(Number); setWaypoint(x, z); toggleMap(false); });
  $('btnReset').onclick = () => { if (G.player.car) { const c = G.player.car; c.yaw = Math.round(c.yaw / (Math.PI / 2)) * Math.PI / 2; c.vx = c.vz = c.r = 0; c.health = Math.max(c.health, 40); const n = nearestNode(c.x, c.z, n => n.edges.some(e => e.road.type === 'car')); c.place(n.x + 3, n.z + 3, c.yaw); } togglePause(false); };
  addEventListener('gamepadconnected', () => toast('Mando conectado'));
}
const isTouch = matchMedia('(pointer: coarse)').matches;
let camDist = 5.2;
function readInput() {
  IN.mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  IN.my = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  IN.run = !!(keys.ShiftLeft || keys.ShiftRight); IN.hand = !!keys.Space; IN.jump = !!keys.Space;
  if (touch.id !== null || IN.tGas || IN.tBrake) {
    IN.mx = touch.jx; IN.my = -touch.jy;
    if (G.player.car) { IN.my = (IN.tGas ? 1 : 0) - (IN.tBrake ? 1 : 0); if (!IN.tGas && !IN.tBrake) IN.my = clamp(-touch.jy * 1.4, -1, 1); }
    IN.run = Math.hypot(touch.jx, touch.jy) > 0.92;
  }
  if (IN.tHand) { IN.hand = IN.jump = true; }
  if (G.dialog || G.cine || G.dishes) { IN.mx = IN.my = 0; IN.jump = IN.hand = IN.run = false; }
  if (G.story && G.story.cold) IN.run = false;
  // mando
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null;
  if (gp) {
    const ax = gp.axes, b = gp.buttons, dz = v => Math.abs(v) < 0.15 ? 0 : v;
    if (dz(ax[0])) IN.mx = ax[0];
    if (G.player.car) { const rt = b[7] ? b[7].value : 0, lt = b[6] ? b[6].value : 0; if (rt || lt) IN.my = rt - lt; else if (dz(ax[1])) IN.my = -ax[1]; }
    else if (dz(ax[1])) IN.my = -ax[1];
    if (b[2] && b[2].pressed) IN.hand = IN.jump = true;
    if (b[0] && b[0].pressed) IN.jump = true;
    if (b[10] && b[10].pressed) IN.run = true;
    if (dz(ax[2]) || dz(ax[3])) { camYaw -= dz(ax[2]) * 0.05; camPitch = clamp(camPitch + dz(ax[3]) * 0.03, -0.25, 1.2); camIdle = 0; }
    const press = (i, fn) => { const p = b[i] && b[i].pressed; if (p && !IN['gp' + i]) fn(); IN['gp' + i] = p; };
    press(3, toggleCar); press(9, () => togglePause()); press(5, cycleCam); press(8, () => toggleMap()); press(1, () => { if (G.player.car) G.sfx.horn(G.player.car, 1); });
  }
}

/* ==========================================================
   XOGADOR
   ========================================================== */
let jumpV = 0, airborne = false;
function updatePlayerFoot(dt) {
  const p = G.player.ped;
  const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw); // dirección cara a onde mira a cámara
  let mx = IN.mx, my = IN.my; const mag = Math.min(1, Math.hypot(mx, my));
  if (mag > 0.05) {
    const dx = fx * my - fz * -mx * -1, dz = fz * my + fx * -mx * -1;
    // dereita da cámara = (-fz, fx) cando se mira cara a f
    const rx = -fz, rz = fx;
    const wx = fx * my + rx * mx, wz = fz * my + rz * mx, l = Math.hypot(wx, wz) || 1;
    const want = Math.atan2(wx / l, wz / l);
    p.yaw += angDiff(p.yaw, want) * Math.min(1, dt * 12);
    const sp = (IN.run ? 5.6 : 1.9) * mag;
    p.speed = lerp(p.speed, sp, Math.min(1, dt * 8));
  } else p.speed = lerp(p.speed, 0, Math.min(1, dt * 10));
  p.x += Math.sin(p.yaw) * p.speed * dt; p.z += Math.cos(p.yaw) * p.speed * dt;
  p.walk = lerp(p.walk, p.speed > 0.2 ? 1 : 0, dt * 8); p.run = lerp(p.run, p.speed > 3 ? 1 : 0, dt * 6);
  p.phase += dt * p.speed * (p.speed > 3 ? 2.6 : 4.4);
  // colisións
  const o = p._o || (p._o = {}), q = p._q || (p._q = { x: 0, z: 0 }); q.x = p.x; q.z = p.z;
  if (collideCircle(q, 0.32, p.y + 0.4, o)) { p.x = q.x; p.z = q.z; }
  if (trainPush(q, 0.32)) { p.x = q.x; p.z = q.z; }
  for (const v of world.vehicles) { // non atravesar coches
    if (Math.abs(v.x - p.x) > 4 || Math.abs(v.z - p.z) > 4) continue;
    for (const c of v.worldCircles(_ca)) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), rr = v.rad + 0.3; if (d < rr && d > 1e-3) { p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; } }
  }
  // gravidade e salto
  const gy = groundH(p.x, p.z);
  if (!airborne && IN.jump && !IN._jumpHeld) { jumpV = 4.6; airborne = true; }
  IN._jumpHeld = IN.jump;
  if (airborne || p.y > gy + 0.3) { airborne = true; jumpV -= GRAV * dt; p.y += jumpV * dt; if (p.y <= gy) { p.y = gy; airborne = false; jumpV = 0; } }
  else p.y = lerp(p.y, gy, Math.min(1, dt * 18));
  // río: nadar ata a beira
  if (inRiver(p.x, p.z) && p.y < -0.7) { p.y = -1.05; p.walk = 1; p.phase += dt * 3; if (!G._swimMsg) { toast('A auga do Cabe está fría! Sae pola beira.'); G._swimMsg = 1; } } else G._swimMsg = 0;
}
function nearestCar(maxD) {
  const p = G.player.ped; let best = null, bd = maxD;
  for (const v of world.vehicles) { if (v === G.player.car) continue; const d = Math.hypot(v.x - p.x, v.z - p.z) - v.t.L * 0.35; if (d < bd) { bd = d; best = v; } }
  return best;
}
function toggleCar() {
  const pl = G.player;
  if (pl.car) {
    const c = pl.car; if (c.speed > 4) { toast('Para o coche antes de baixar'); return; }
    // baixar polo lado do condutor (esquerda)
    const lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw);
    let ex = c.x + lx * (c.t.W / 2 + 0.7), ez = c.z + lz * (c.t.W / 2 + 0.7);
    const q = { x: ex, z: ez }, o = {}; if (collideCircle(q, 0.4, c.y + 0.5, o)) { ex = c.x - lx * (c.t.W / 2 + 0.7); ez = c.z - lz * (c.t.W / 2 + 0.7); }
    pl.ped.x = ex; pl.ped.z = ez; pl.ped.y = groundH(ex, ez); pl.ped.yaw = c.yaw; pl.ped.visible = true; pl.ped.sit = 0; pl.ped.armUp = 0;
    c.driver = null; c.inp.throttle = 0; c.inp.brake = 0.3; c.inp.steer = 0; c.inp.hand = 1;
    if (c.type === 'taxi' && G.mission && G.mission.def.id === 'taxi') failMission('Deixaches o taxi');
    pl.car = null; camDist = 5.2; G.sfx.door(); $('vname').classList.remove('show');
    return;
  }
  const v = nearestCar(2.2); if (!v) return;
  if (v.t.livery === 'bus') { toast('O autobús só o conduce o chofer da liña'); return; }
  if (v.ai) {
    // o condutor sae e foxe
    const lx = Math.cos(v.yaw), lz = -Math.sin(v.yaw);
    const d = world.crowd.peds.find(p => p.state === 'hidden' && p.spare) || world.crowd.peds.find(p => p.state === 'walk' && Math.hypot(p.x - pl.ped.x, p.z - pl.ped.z) > 60);
    if (d) { d.x = v.x + lx * 1.4; d.z = v.z + lz * 1.4; d.y = groundH(d.x, d.z); d.visible = true; if (v.driverCol) { Object.assign(d.col, v.driverCol); world.crowd.paint(d); } startFlee(d, pl.ped.x, pl.ped.z, 6); d.prevState = 'walk'; }
    if (v.t.livery === 'police') addWanted(2, 'Roubaches un coche patrulla!'); else if (policeNear(60)) addWanted(1, 'A policía viuche roubar un coche');
    v.ai = null; v.sirenOn = false;
  }
  pl.car = v; v.driver = 'player'; v.sleep = false; pl.ped.visible = false; camDist = v.t.prof === 'bus' ? 13 : v.t.moto ? 5.4 : 7.2; camIdle = 9;
  G.sfx.door();
  $('vname').textContent = v.t.nameG; $('vname').classList.add('show'); setTimeout(() => $('vname').classList.remove('show'), 2500);
  if (v.type === 'taxi' && !G.mission) toast('Estás nun taxi: preme T (ou ★) para comezar a quenda');
}
function updatePlayerCar(dt) {
  const c = G.player.car, inp = c.inp;
  // a dirección vai entrando aos poucos (teclado = xiro suave e progresivo)
  const want = clamp(IN.mx, -1, 1), cur = c._st || 0, rate = (Math.sign(want) !== Math.sign(cur) && cur !== 0 ? 6 : 3.2) * dt;
  c._st = cur + clamp(want - cur, -rate, rate); inp.steer = c._st;
  const fs = c.fwdSpeed;
  if (IN.my > 0) { inp.throttle = IN.my; inp.brake = 0; }
  else if (IN.my < 0) { if (fs > 1) { inp.brake = -IN.my; inp.throttle = 0; } else { inp.throttle = IN.my; inp.brake = 0; } }
  else { inp.throttle = 0; inp.brake = 0; }
  inp.hand = IN.hand ? 1 : 0;
  // manter a persoa xunta ao coche (para o minimapa e lóxica)
  const p = G.player.ped; p.x = c.x; p.z = c.z; p.y = c.y;
  if (c.t.moto) { // o xogador vai montado e visible
    p.visible = true; p.yaw = c.yaw; p.x = c.x - Math.sin(c.yaw) * 0.3; p.z = c.z - Math.cos(c.yaw) * 0.3; p.y = c.y + 0.33; p.sit = 0.7; p.walk = 0; p.run = 0; p.armUp = 0.55; p.lie = 0;
  }
  if (c.inWater > 2.5) { toast('O coche afundiuse no Cabe!'); const pr = c; toggleCarForce(); pr.inWater = 0; const [bx, bz] = bankPoint(pr.x, pr.z, 8); pr.place(bx, bz, pr.yaw); pr.health = 30; }
}
function bankPoint(x, z, extra) { const rn = riverNear(x, z), dx = x - rn.px, dz = z - rn.pz, l = Math.hypot(dx, dz) || 1; return [rn.px + dx / l * (RIVER_HW + extra), rn.pz + dz / l * (RIVER_HW + extra)]; }
function toggleCarForce() { const c = G.player.car; if (!c) return; c.driver = null; G.player.car = null; const p = G.player.ped; p.visible = true; [p.x, p.z] = bankPoint(c.x, c.z, 3); p.y = groundH(p.x, p.z); }
function interact() {
  if (G.voley && G.voley.on) { voleyHit(); return; }
  if (G.story && storyInteractHook()) return;
  if (plazaHotelsInteract()) return;
  if (fineInteract()) return;
  if (carudeInteract()) return;
  if (storyInteract()) return;
  // comezar misión se estás nun marcador
  for (const m of G.missionMarkers) if (m.near && !G.mission) { startMission(m.def); return; }
}
function cycleCam() { camMode = (camMode + 1) % 3; toast(['Cámara: perseguidora', 'Cámara: lonxe', 'Cámara: capó'][camMode], 1.2); }

/* ---------- Busca e captura ---------- */
function policeNear(r) { return world.vehicles.some(v => v.t.livery === 'police' && Math.hypot(v.x - G.player.ped.x, v.z - G.player.ped.z) < r); }
function addWanted(n, why) {
  const pl = G.player, before = pl.wanted;
  pl.wanted = Math.min(3, pl.wanted + n); pl.wantedT = 0; pl.lostT = 0;
  if (pl.wanted > before) { toast(why || 'A policía búscache'); G.sfx.alert(); }
  renderStars();
}
function updateWanted(dt) {
  const pl = G.player;
  const cops = world.vehicles.filter(v => v.t.livery === 'police' && v.ai && v.ai.mode === 'chase');
  if (pl.wanted > 0) {
    const want = pl.wanted * 2;
    G._copSpawn = (G._copSpawn || 0) - dt;
    if (cops.length < want && G._copSpawn <= 0) {
      G._copSpawn = 3;
      const tgt = pl.ped; let n = null;
      for (let i = 0; i < 25; i++) { const c = pick(NODES); const d = Math.hypot(c.x - tgt.x, c.z - tgt.z); if (d > 90 && d < 200 && c.edges.some(e => e.road.type === 'car')) { n = c; break; } }
      if (n) { const e = n.edges.find(e => e.road.type === 'car'); const v = spawnVehicle('policia', n.x, n.z, Math.atan2(e.to.x - n.x, e.to.z - n.z)); v.ai = { mode: 'chase', stuck: 0 }; v.sirenOn = true; }
    }
    const tgt = pl.car || pl.ped;
    const near = cops.some(v => Math.hypot(v.x - tgt.x, v.z - tgt.z) < 85);
    pl.lostT = near ? 0 : (pl.lostT || 0) + dt;
    if (pl.lostT > 14) { pl.wanted--; pl.lostT = 0; renderStars(); toast(pl.wanted ? 'Estás a despistalos…' : 'Despistaches á policía'); if (!pl.wanted) cops.forEach(v => { v.ai = { mode: 'traffic', cruise: 11, stuck: 0, ignore: 0 }; v.sirenOn = false; const n = nearestNode(v.x, v.z, n => n.edges.some(e => e.road.type === 'car')); aiSetEdge(v, n, n.edges.find(e => e.road.type === 'car')); }); }
    $('stars').classList.toggle('blink', pl.lostT > 3);
    // detención
    const slow = pl.car ? pl.car.speed < 1.5 : pl.ped.speed < 2.5;
    const close = cops.some(v => Math.hypot(v.x - tgt.x, v.z - tgt.z) < (pl.car ? 6 : 5) && v.speed < 4);
    pl.bustT = close && slow ? (pl.bustT || 0) + dt : 0;
    if (pl.bustT > 2.2) busted();
  }
}
function renderStars() { const w = G.player.wanted; $('stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < w ? 'on' : ''}">★</span>`).join(''); $('stars').classList.toggle('active', w > 0); }
function busted() {
  const pl = G.player; pl.bustT = 0; pl.wanted = 0; renderStars();
  const fine = Math.min(pl.money, 150); pl.money -= fine; save.money = pl.money; persist();
  bigMsg('DETIDO', fine ? `Multa: −${fine} €` : 'Xa podes saír da comisaría');
  if (G.mission) failMission('Detido pola policía', true);
  if (pl.car) { pl.car.driver = null; pl.car = null; }
  world.vehicles.filter(v => v.t.livery === 'police').forEach(v => { v.ai = null; v.sirenOn = false; v.inp.throttle = 0; v.inp.brake = 1; });
  const p = pl.ped; p.visible = true; p.x = 35; p.z = 95; p.y = 0; p.yaw = Math.PI;
  G.sfx.fail();
}

/* ==========================================================
   CÁMARA
   ========================================================== */
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), _tv = new THREE.Vector3();
function updateCamera(dt) {
  if (G.cine) return cineCamera(dt);
  const pl = G.player; camIdle += dt;
  let tx, ty, tz, dist, height, fov = 62;
  if (pl.car) {
    const c = pl.car, sp = c.speed;
    if (camIdle > 1.6 && sp > 1) { const behind = c.yaw + Math.PI + (c.fwdSpeed < -1 ? Math.PI : 0); camYaw += angDiff(camYaw, behind) * Math.min(1, dt * 2.6); camPitch = lerp(camPitch, 0.22, dt * 1.5); }
    tx = c.x; ty = c.y + 1.4 + (c.t.prof === 'bus' ? 1.6 : 0); tz = c.z;
    dist = camMode === 1 ? camDist * 1.7 : camDist + sp * 0.04; fov = 62 + Math.min(16, sp * 0.33);
    if (camMode === 2) { // capó
      const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
      camera.position.set(c.x + fx * 0.6, c.y + c.t.sill + 1.05, c.z + fz * 0.6);
      camLook.set(c.x + fx * 30, c.y + 1.0, c.z + fz * 30); camera.lookAt(camLook); camera.fov = fov + 8; camera.updateProjectionMatrix();
      return;
    }
  } else {
    const p = pl.ped; tx = p.x; ty = p.y + 1.55; tz = p.z; dist = camMode === 1 ? camDist * 1.8 : camDist;
    if (camIdle > 3 && p.speed > 1.5) { camYaw += angDiff(camYaw, p.yaw + Math.PI) * Math.min(1, dt * 0.8); }
  }
  const cp = Math.cos(camPitch), px = tx + Math.sin(camYaw) * cp * dist, pz = tz + Math.cos(camYaw) * cp * dist;
  let py = ty + Math.sin(camPitch) * dist + 0.4;
  // colisión da cámara
  const t = segBlocked(tx, tz, ty, px, pz, py);
  let fxp = lerp(tx, px, t * 0.92), fzp = lerp(tz, pz, t * 0.92); py = lerp(ty, py, t * 0.92);
  py = Math.max(py, groundH(fxp, fzp) + 0.4);
  const k = pl.car ? 1 - Math.pow(0.0005, dt) : 1 - Math.pow(0.00002, dt);
  camPos.set(fxp, py, fzp);
  if (!camera._init) { camera.position.copy(camPos); camera._init = 1; }
  camera.position.lerp(camPos, k);
  camLook.set(tx, ty, tz);
  if (G.shake > 0.01) { camera.position.x += (R() - 0.5) * G.shake * 0.5; camera.position.y += (R() - 0.5) * G.shake * 0.4; G.shake *= Math.pow(0.02, dt); }
  camera.lookAt(camLook);
  camera.fov = lerp(camera.fov, fov, dt * 3); camera.updateProjectionMatrix();
}
/* cámara do menú: voo cinematográfico polos monumentos */
let TOUR = [];
function updateMenuCam(dt) {
  G._tourT = (G._tourT || 0) + dt;
  if (!TOUR.length) return;
  const seg = 9, i = Math.floor(G._tourT / seg) % TOUR.length, f = (G._tourT % seg) / seg, a = TOUR[i];
  const drift = (f - 0.5) * 18;
  const dx = a.l[0] - a.p[0], dz = a.l[2] - a.p[2], L = Math.hypot(dx, dz), sx = -dz / L, sz = dx / L;
  camera.position.set(a.p[0] + sx * drift, a.p[1] + f * 3, a.p[2] + sz * drift);
  camera.lookAt(a.l[0], a.l[1], a.l[2]); camera.fov = 55; camera.updateProjectionMatrix();
  $('tourName').textContent = a.n;
  $('tourName').style.opacity = f < 0.08 ? f / 0.08 : f > 0.9 ? (1 - f) / 0.1 : 1;
}

/* ==========================================================
   MISIÓNS
   ========================================================== */
let MISSIONS = [], DESTS = [];
G.missionMarkers = [];
function beamMesh(color, r = 1.6, h = 40) {
  const g = new THREE.Group();
  if (!G.beamTex) { const c = cnv(4, 128), x = c.getContext('2d'), gr = x.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 128); G.beamTex = toTex(c, false, false); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true), new THREE.MeshBasicMaterial({ color, map: G.beamTex, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  beam.position.y = h / 2; g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.12, 8, 32), new THREE.MeshBasicMaterial({ color, fog: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; g.add(ring);
  g.userData.ring = ring; return g;
}
function buildMissionMarkers() {
  for (const def of MISSIONS) {
    const m = beamMesh(0xf2a33a, 1.4, 30); m.position.set(def.at[0], groundH(def.at[0], def.at[1]), def.at[1]); scene.add(m);
    G.missionMarkers.push({ def, mesh: m, near: false });
  }
  G.cpMesh = beamMesh(0xff3d6e, 2.5, 60); G.cpMesh.visible = false; scene.add(G.cpMesh);
}
function startMission(def) {
  const pl = G.player;
  if (def.needCar && !pl.car) { toast('Necesitas un vehículo para esta misión'); return; }
  if (def.onFoot && pl.car) { toast('Esta misión faise a pé'); return; }
  if (def.needTaxi && !(pl.car && pl.car.type === 'taxi')) { toast('Colle un taxi da parada da estación e preme T'); return; }
  G.mission = { def, step: 0, timer: def.time, visited: new Set(), t0: G.t };
  showIntro(def);
  if (def.id === 'tren') { const tr = world.train; tr.state = 'arriving'; tr.dir = 1; tr.s = tr.stopS - 650; tr.v = 26; tr.holdTime = def.time + 6; G.sfx.trainHorn(tr); }
  if (def.id === 'taxi') { G.mission.fares = 0; nextFare(); }
  G.sfx.start();
  setWaypoint(null);
}
function showIntro(def) { $('mTitle').textContent = def.name; $('mIntro').textContent = def.intro; $('missionIntro').classList.add('show'); clearTimeout(G._introT); G._introT = setTimeout(() => $('missionIntro').classList.remove('show'), 6500); }
function taxiShift() { const pl = G.player; if (!pl.car || pl.car.type !== 'taxi') { toast('Tes que estar nun taxi'); return; } if (G.mission) return; startMission(MISSIONS.find(m => m.id === 'taxi')); }
function nextFare() {
  const M = G.mission; const pl = G.player.ped;
  const from = DESTS.filter(d => Math.hypot(d.x - pl.x, d.z - pl.z) > 80).sort(() => R() - 0.5)[0];
  const to = DESTS.filter(d => d !== from && Math.hypot(d.x - from.x, d.z - from.z) > 150).sort(() => R() - 0.5)[0];
  const p = world.crowd.peds.find(q => q.state === 'walk' && Math.hypot(q.x - pl.x, q.z - pl.z) > 90 && q !== G.player.ped);
  if (p) { p.state = 'idle'; p.x = from.x; p.z = from.z; p.y = groundH(p.x, p.z); p.visible = true; p.wave = true; }
  M.fare = { from, to, ped: p, phase: 'pickup' }; M.timer = Math.round(35 + Math.hypot(from.x - pl.x, from.z - pl.z) / 9); M.stepTotal = M.timer;
  toast(`Cliente agardando en: ${from.n}`);
}
function updateMission(dt) {
  const M = G.mission, pl = G.player, me = pl.car || pl.ped;
  // marcadores de inicio
  for (const m of G.missionMarkers) {
    const done = save.done[m.def.id];
    m.mesh.visible = !M; m.mesh.userData.ring.rotation.z += dt;
    m.near = !M && Math.hypot(me.x - m.def.at[0], me.z - m.def.at[1]) < 4.5;
    m.mesh.children[0].material.color.setHex(done ? 0x9bd28a : 0xf2a33a);
  }
  const nearM = G.missionMarkers.find(m => m.near);
  if (!M) {
    G.cpMesh.visible = false;
    if (nearM) setPrompt(`${isTouch ? '★' : 'E'} · ${nearM.def.name}${save.done[nearM.def.id] ? ' (repetir)' : ''}`);
    $('mission').hidden = true; return;
  }
  $('mission').hidden = false;
  if (M.def.time || M.def.id === 'taxi') { M.timer -= dt; if (M.timer <= 0) { failMission(M.def.id === 'tren' ? 'O tren marchou sen ela' : 'Acabouse o tempo'); return; } }
  let target = null, text = '';
  if (Array.isArray(M.def.steps)) {
    const s = M.def.steps[M.step]; target = s; text = s.t;
    if (M.def.needCar && !pl.car) text = 'Volve a un vehículo';
    else if (Math.hypot(me.x - s.x, me.z - s.z) < s.r) {
      M.step++; G.sfx.checkpoint();
      if (M.step >= M.def.steps.length) return winMission();
    }
  } else if (M.def.steps === 'bars') {
    const left = G.bars.filter(b => !M.visited.has(b.name));
    let best = null, bd = 1e9; for (const b of left) { const d = Math.hypot(b.door.x - me.x, b.door.z - me.z); if (d < bd) { bd = d; best = b; } }
    if (best && bd < 2.4) { M.visited.add(best.name); G.sfx.checkpoint(); toast(`${best.name}: «Boas! Unha cunca de Mencía!»`); }
    text = `Bares visitados: ${M.visited.size} / 5`;
    if (M.visited.size >= 5) return winMission();
    G._barMarkers = left; target = best ? { x: best.door.x, z: best.door.z, r: 2.4 } : null;
    if (pl.car) text = 'Baixa do coche: a ruta faise a pé';
  } else if (M.def.steps === 'taxi') {
    const F = M.fare; if (!F) return;
    if (!pl.car || pl.car.type !== 'taxi') { failMission('Deixaches o taxi'); return; }
    if (F.phase === 'pickup') {
      target = { x: F.from.x, z: F.from.z, r: 9 }; text = `Recolle ao cliente en ${F.from.n}`;
      if (Math.hypot(me.x - F.from.x, me.z - F.from.z) < 10 && pl.car.speed < 1.5) {
        F.phase = 'boarding'; if (F.ped) { F.ped.wave = false; F.ped.state = 'board'; F.ped.boardCar = pl.car; F.ped.onBoard = () => { F.phase = 'ride'; M.timer = Math.max(M.timer, Math.round(30 + Math.hypot(F.to.x - F.from.x, F.to.z - F.from.z) / 9)); M.stepTotal = M.timer; toast(`«Levas a ${F.to.n}, por favor»`); G.sfx.door(); }; } else F.phase = 'ride';
      }
    } else if (F.phase === 'boarding') { text = 'Agarda a que suba…'; target = null; if (F.ped && Math.hypot(F.ped.x - pl.car.x, F.ped.z - pl.car.z) > 16) { F.ped.visible = false; F.phase = 'ride'; } }
    else if (F.phase === 'ride') {
      target = { x: F.to.x, z: F.to.z, r: 9 }; text = `Destino: ${F.to.n}`;
      if (Math.hypot(me.x - F.to.x, me.z - F.to.z) < 10 && pl.car.speed < 2) {
        const tip = Math.round(Math.max(0, M.timer) * 1.5), pay = 60 + tip; addMoney(pay); toast(`Carreira cobrada: ${pay} € (propina ${tip} €)`); G.sfx.checkpoint();
        if (F.ped) { F.ped.visible = true; F.ped.state = 'walk'; F.ped.edge = null; F.ped.x = pl.car.x + Math.cos(pl.car.yaw) * 1.6; F.ped.z = pl.car.z - Math.sin(pl.car.yaw) * 1.6; }
        M.fares++; if (M.fares >= 3) return winMission(); nextFare();
      }
    }
  }
  $('mName').textContent = M.def.name; $('mText').textContent = text;
  $('mTimer').textContent = M.timer > 0 ? fmtTime(M.timer) : '';
  $('mTimer').classList.toggle('hot', M.timer < 15);
  if (target) { G.cpMesh.visible = true; G.cpMesh.position.set(target.x, groundH(target.x, target.z), target.z); G.cpMesh.scale.setScalar(target.r / 2.5); G.cpMesh.userData.ring.rotation.z += dt * 2; G.curTarget = target; } else { G.cpMesh.visible = false; G.curTarget = null; }
}
function winMission() {
  const M = G.mission, d = M.def; G.mission = null; G.cpMesh.visible = false; G.curTarget = null;
  const reward = d.reward; if (reward) addMoney(reward);
  const t = G.t - M.t0; const best = save.best[d.id]; if (d.id !== 'taxi' && (!best || t < best)) save.best[d.id] = t;
  save.done[d.id] = true; persist();
  bigMsg('MISIÓN SUPERADA', reward ? `${d.name} · +${reward} €` : d.name); G.sfx.win();
  if (d.id === 'tren') { world.train.timer = 3; }
  updateMenuStats();
}
function failMission(why, silent) { const M = G.mission; if (!M) return; G.mission = null; G.cpMesh.visible = false; G.curTarget = null; if (M.fare && M.fare.ped) { M.fare.ped.visible = true; M.fare.ped.state = 'walk'; M.fare.ped.wave = false; M.fare.ped.edge = null; } if (!silent) { bigMsg('MISIÓN FALLADA', why); G.sfx.fail(); } }
function addMoney(n) { G.player.money += n; save.money = G.player.money; persist(); const el = $('money'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); G.sfx.coin(); }
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

/* coleccionables */
function updateBottles(dt) {
  const me = G.player.car || G.player.ped;
  for (const b of G.bottles) {
    if (b.got) continue;
    b.m.rotation.y += dt * 1.6; b.m.position.y = b.y + Math.sin(G.t * 2 + b.x) * 0.1 + 0.15; b.halo.scale.setScalar(1 + Math.sin(G.t * 3) * 0.1);
    if (Math.hypot(me.x - b.x, me.z - b.z) < 1.6 && Math.abs((me.y || 0) - b.y) < 2.5) {
      b.got = true; b.m.visible = b.halo.visible = false; G.player.bottles++; save.bottles.push(b.where); persist();
      addMoney(50); toast(`Botella de Mencía ${G.player.bottles}/12 — ${b.where}`);
      if (G.player.bottles === 12) { addMoney(1000); bigMsg('COLECCIÓN COMPLETA', 'As 12 botellas da Ribeira Sacra · +1000 €'); G.sfx.win(); }
    }
  }
}

/* ==========================================================
   HUD, minimapa e mapa completo
   ========================================================== */
let mapBase, MAPS = 1.2; // px por metro
const MAPO = { x: MAP.minX - 20, z: MAP.minZ - 20, w: (MAP.maxX - MAP.minX) + 40, h: (MAP.maxZ - MAP.minZ) + 40 };
function buildMinimapBase() {
  const c = cnv(Math.ceil(MAPO.w * MAPS), Math.ceil(MAPO.h * MAPS)), x = c.getContext('2d');
  x.fillStyle = '#26301f'; x.fillRect(0, 0, c.width, c.height);
  drawMapLayers(x, (wx, wz) => [(wx - MAPO.x) * MAPS, (wz - MAPO.z) * MAPS], MAPS);
  mapBase = c;
}
/* capas vectoriais do mapa (minimapa e mapa grande con zoom) */
function drawMapLayers(x, P, SC, vis) {
  const inView = pts => { if (!vis) return true; for (let i = 0; i < pts.length; i += Math.max(1, pts.length >> 3)) { const [a, b] = pts[i]; if (a > vis.x0 && a < vis.x1 && b > vis.z0 && b < vis.z1) return true; } const [a, b] = pts[0], [c2, d] = pts[pts.length - 1]; return (Math.min(a, c2) < vis.x1 && Math.max(a, c2) > vis.x0 && Math.min(b, d) < vis.z1 && Math.max(b, d) > vis.z0); };
  const poly = (pts, fill) => { if (!inView(pts)) return; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(...P(a, b)) : x.moveTo(...P(a, b))); x.closePath(); x.fillStyle = fill; x.fill(); };
  const line = (pts, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(...P(a, b)) : x.moveTo(...P(a, b))); x.stroke(); };
  poly(URBAN, '#2c3328');
  // monte
  const [hx, hz] = P(HILL.x, HILL.z); const g = x.createRadialGradient(hx, hz, 10, hx, hz, HILL.r1 * SC); g.addColorStop(0, '#3a4a2c'); g.addColorStop(1, 'rgba(38,48,31,0)'); x.fillStyle = g; x.beginPath(); x.arc(hx, hz, HILL.r1 * SC, 0, 7); x.fill();
  // áreas de OSM
  for (const a of AREAS) {
    const col = { park: '#35552c', grass: '#33502b', wood: '#2e4a26', cemetery: '#3a4a35', pitch: '#3f7a34', stadium: '#3f7a34', play: '#4a6a38', parking: '#3b3e42', plaza: '#5d5648', platform: '#6b6658' }[a.t];
    if (col) poly(a.p, col);
  }
  // río
  for (let i = 0; i < RIVER.length - 1; i++) line([RIVER[i], RIVER[i + 1]], '#3d6f86', Math.max(2, (RIVER_W[i] + RIVER_W[i + 1] - 3) * SC));
  // edificios
  x.fillStyle = '#4a4d52';
  for (const b of G.buildingsList) if (b.poly) { if (!inView(b.poly)) continue; x.beginPath(); b.poly.forEach(([a, c2], i) => i ? x.lineTo(...P(a, c2)) : x.moveTo(...P(a, c2))); x.closePath(); x.fill(); }
  for (const z of G.monumentZones) poly(z, '#6e6352');
  for (const [z, c] of (G.mapExtra || [])) poly(z, c);
  // vías do tren
  for (const r of OSM.rails) line(r.p, '#6b5d4a', Math.max(1.5, 2.2 * SC));
  // rúas (primeiro as pequenas)
  const order = { track: 0, path: 1, service: 2, ped: 3, car: 4 };
  const sorted = ROADS.slice().sort((a, b) => (order[a.type] - order[b.type]) || (a.major - b.major));
  for (const r of sorted) {
    if (!inView(r.pts)) continue;
    if (r.type === 'track') line(r.pts, '#5b5440', 2 * SC);
    else if (r.type === 'path') line(r.pts, '#77705e', Math.max(1, 1.8 * SC));
    else if (r.type === 'ped') line(r.pts, '#b7a98c', r.w * SC);
    else line(r.pts, r.major ? '#e6dcc0' : '#cfd0cc', Math.max(2, (r.w + (r.sw ? 1.5 : 0)) * SC));
  }
  // castelo
  x.strokeStyle = '#a89a7a'; x.lineWidth = 3 * SC; x.beginPath(); x.arc(hx, hz, (HILL.r0 - 1.5) * SC, 0, 7); x.stroke();
}
const mini = { c: null, x: null };
function drawMinimap() {
  if (!mini.c) { mini.c = $('mini'); mini.x = mini.c.getContext('2d'); }
  const c = mini.c, x = mini.x, S = c.width, me = G.player.car || G.player.ped, zoom = G.player.car ? 1.1 + Math.min(0.9, G.player.car.speed / 30) : 1.0;
  const scale = MAPS / zoom * (S / 200);
  x.save(); x.clearRect(0, 0, S, S); x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, 7); x.clip();
  x.fillStyle = '#1f2719'; x.fillRect(0, 0, S, S);
  const rot = camYaw;
  x.translate(S / 2, S / 2); x.rotate(rot);
  const sc = scale / MAPS;
  x.drawImage(mapBase, -(me.x - MAPO.x) * MAPS * sc, -(me.z - MAPO.z) * MAPS * sc, mapBase.width * sc, mapBase.height * sc);
  const W = (wx, wz) => [(wx - me.x) * MAPS * sc, (wz - me.z) * MAPS * sc];
  // ruta GPS
  if (G.route && G.route.length > 1) { x.strokeStyle = '#c36bff'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath(); x.moveTo(0, 0); for (const n of G.route) x.lineTo(...W(n.x, n.z)); if (G.waypoint) x.lineTo(...W(G.waypoint.x, G.waypoint.z)); x.stroke(); }
  // vehículos policiais e tren
  for (const v of world.vehicles) if (v.t.livery === 'police' && v.ai && v.ai.mode === 'chase') { const [a, b] = W(v.x, v.z); x.fillStyle = Math.floor(G.t * 6) % 2 ? '#2b5cff' : '#ff2b3a'; x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); }
  if (G.trainBox) { const [a, b] = W(world.train.x, world.train.z); x.save(); x.translate(a, b); x.rotate(-world.train.yaw); x.fillStyle = '#e8e2d2'; x.fillRect(-3, -world.train.len / 2 * MAPS * sc, 6, world.train.len * MAPS * sc); x.restore(); }
  x.restore();
  // marcadores (con borde)
  const blip = (wx, wz, col, shape) => {
    let [a, b] = W(wx, wz); const ca = Math.cos(rot), sa = Math.sin(rot); let px = a * ca - b * sa, py = a * sa + b * ca; const R0 = S / 2 - 10, l = Math.hypot(px, py); if (l > R0) { px *= R0 / l; py *= R0 / l; }
    x.save(); x.translate(S / 2 + px, S / 2 + py); x.fillStyle = col; x.strokeStyle = '#111'; x.lineWidth = 2;
    if (shape === 'sq') { x.fillRect(-6, -6, 12, 12); x.strokeRect(-6, -6, 12, 12); } else { x.beginPath(); x.arc(0, 0, 6.5, 0, 7); x.fill(); x.stroke(); }
    x.restore();
  };
  if (!G.mission) for (const m of G.missionMarkers) blip(m.def.at[0], m.def.at[1], save.done[m.def.id] ? '#9bd28a' : '#f2a33a', 'sq');
  if (G.curTarget) blip(G.curTarget.x, G.curTarget.z, '#ff3d6e');
  if (G.mission && G.mission.def.steps === 'bars' && G._barMarkers) for (const b of G._barMarkers) blip(b.door.x, b.door.z, '#ffd75e');
  if (G.waypoint) blip(G.waypoint.x, G.waypoint.z, '#c36bff');
  if (G.works) blip(G.works.center.x, G.works.center.z, '#ff8a1a', 'sq');
  // xogador
  x.save(); x.translate(S / 2, S / 2); x.rotate(rot + (G.player.car ? G.player.car.yaw : G.player.ped.yaw) * -1 + Math.PI);
  x.fillStyle = '#fff'; x.strokeStyle = '#7a1f3d'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -9); x.lineTo(6.5, 7); x.lineTo(0, 3.5); x.lineTo(-6.5, 7); x.closePath(); x.fill(); x.stroke(); x.restore();
  // norte
  const r0 = S / 2 - 11;
  const npx = S / 2 + (0 * Math.cos(rot) - (-r0) * Math.sin(rot)), npy = S / 2 + (0 * Math.sin(rot) + (-r0) * Math.cos(rot));
  x.fillStyle = '#111'; x.beginPath(); x.arc(npx, npy, 8, 0, 7); x.fill(); x.fillStyle = '#f2ecdc'; x.font = '700 11px "Barlow Condensed", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N', npx, npy + 1);
}
function toggleMap(force) {
  const el = $('mapOverlay'), show = force !== undefined ? force : el.hidden;
  el.hidden = !show; G.mapOpen = show;
  if (show) { if (document.exitPointerLock) document.exitPointerLock(); mapViewInit(); drawFullMap(); }
}
/* ---------- mapa a pantalla completa con zoom e desprazamento ---------- */
const MV = { cx: 0, cz: 0, s: 1, min: 0.3, max: 14, drag: null, moved: false, pts: new Map(), raf: 0 };
function mapViewInit() {
  const c = $('fullmap'), r = c.getBoundingClientRect(), dpr = devicePixelRatio;
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  MV.min = Math.min(c.width / MAPO.w, c.height / MAPO.h);
  if (!MV.init) { MV.init = true; const me = G.player.car || G.player.ped; MV.cx = me.x; MV.cz = me.z; MV.s = Math.max(MV.min, 1.6 * dpr); }
  MV.s = clamp(MV.s, MV.min, MV.max * dpr);
  if (!MV.bound) { MV.bound = true; mapBindInput(c); addEventListener('resize', () => { if (G.mapOpen) { mapViewInit(); drawFullMap(); } }); }
}
const mapW2S = (wx, wz) => { const c = $('fullmap'); return [c.width / 2 + (wx - MV.cx) * MV.s, c.height / 2 + (wz - MV.cz) * MV.s]; };
const mapS2W = (sx, sy) => { const c = $('fullmap'); return [MV.cx + (sx - c.width / 2) / MV.s, MV.cz + (sy - c.height / 2) / MV.s]; };
function mapRedraw() { if (MV.raf) return; MV.raf = requestAnimationFrame(() => { MV.raf = 0; drawFullMap(); }); }
function mapZoomAt(sx, sy, k) {
  const [wx, wz] = mapS2W(sx, sy), dpr = devicePixelRatio;
  MV.s = clamp(MV.s * k, MV.min, MV.max * dpr);
  const c = $('fullmap'); MV.cx = wx - (sx - c.width / 2) / MV.s; MV.cz = wz - (sy - c.height / 2) / MV.s; mapRedraw();
}
function mapBindInput(c) {
  const dpr = () => devicePixelRatio, rel = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * dpr(), (e.clientY - r.top) * dpr()]; };
  c.addEventListener('wheel', e => { e.preventDefault(); const [sx, sy] = rel(e); mapZoomAt(sx, sy, Math.pow(1.0018, -e.deltaY)); }, { passive: false });
  c.addEventListener('dblclick', e => { const [sx, sy] = rel(e); mapZoomAt(sx, sy, 2); });
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); MV.pts.set(e.pointerId, rel(e)); MV.moved = false; MV.down = rel(e); if (MV.pts.size === 2) { const [p1, p2] = [...MV.pts.values()]; MV.pinch = { d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), s: MV.s }; } });
  c.addEventListener('pointermove', e => {
    if (!MV.pts.has(e.pointerId)) return; const prev = MV.pts.get(e.pointerId), cur = rel(e); MV.pts.set(e.pointerId, cur);
    if (MV.pts.size === 2 && MV.pinch) { const [p1, p2] = [...MV.pts.values()], d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2; const k = (MV.pinch.s * d / MV.pinch.d) / MV.s; mapZoomAt(mx, my, k); MV.moved = true; return; }
    const dx = cur[0] - prev[0], dy = cur[1] - prev[1];
    if (Math.hypot(cur[0] - MV.down[0], cur[1] - MV.down[1]) > 6 * dpr()) MV.moved = true;
    if (MV.moved) { MV.cx -= dx / MV.s; MV.cz -= dy / MV.s; mapRedraw(); }
  });
  const up = e => {
    const wasOne = MV.pts.size === 1; MV.pts.delete(e.pointerId); if (MV.pts.size < 2) MV.pinch = null;
    if (wasOne && !MV.moved && e.type === 'pointerup') { const [sx, sy] = rel(e); const [wx, wz] = mapS2W(sx, sy); setWaypoint(wx, wz); mapRedraw(); }
  };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  const btn = (id, fn) => { const b = $(id); if (b) b.onclick = e => { e.stopPropagation(); fn(); }; };
  btn('mapZin', () => mapZoomAt(c.width / 2, c.height / 2, 1.6));
  btn('mapZout', () => mapZoomAt(c.width / 2, c.height / 2, 1 / 1.6));
  btn('mapMe', () => { const me = G.player.car || G.player.ped; MV.cx = me.x; MV.cz = me.z; MV.s = Math.max(MV.s, 3 * dpr()); mapRedraw(); });
  btn('mapAll', () => { MV.cx = MAPO.x + MAPO.w / 2; MV.cz = MAPO.z + MAPO.h / 2; MV.s = MV.min; mapRedraw(); });
}
function drawFullMap() {
  const c = $('fullmap'), x = c.getContext('2d'), dpr = devicePixelRatio, s = MV.s;
  x.fillStyle = '#1a2116'; x.fillRect(0, 0, c.width, c.height);
  const [x0, z0] = mapS2W(0, 0), [x1, z1] = mapS2W(c.width, c.height);
  // base rápida cando o zoom é pequeno; vectorial cando te achegas
  if (s / dpr < 1.4) { const k = s / MAPS, [ox, oy] = mapW2S(MAPO.x, MAPO.z); x.imageSmoothingEnabled = true; x.drawImage(mapBase, ox, oy, mapBase.width * k, mapBase.height * k); }
  else { x.fillStyle = '#26301f'; const [ox, oy] = mapW2S(MAPO.x, MAPO.z); x.fillRect(ox, oy, MAPO.w * s, MAPO.h * s); drawMapLayers(x, mapW2S, s, { x0: x0 - 30, x1: x1 + 30, z0: z0 - 30, z1: z1 + 30 }); }
  // ruta GPS
  if (G.route && G.route.length > 1) { const me = G.player.car || G.player.ped; x.strokeStyle = '#c36bff'; x.lineWidth = Math.max(3 * dpr, 3 * s * 0.6); x.lineJoin = 'round'; x.beginPath(); x.moveTo(...mapW2S(me.x, me.z)); for (const n of G.route) x.lineTo(...mapW2S(n.x, n.z)); if (G.waypoint) x.lineTo(...mapW2S(G.waypoint.x, G.waypoint.z)); x.stroke(); }
  // nomes das rúas ao achegarse
  if (s / dpr >= 2.2) {
    const seen = new Set(), fs = Math.round(clamp(4.2 * s / dpr, 11, 17) * dpr);
    x.font = `600 ${fs}px "Barlow Condensed", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const r of ROADS) {
      if (!r.name || r.type === 'path' || r.type === 'track' || seen.has(r.name) || r.len * s < x.measureText(r.name).width * 1.1) continue;
      const m = roadPoint(r, r.len / 2), [sx, sy] = mapW2S(m.x, m.z); if (sx < 0 || sy < 0 || sx > c.width || sy > c.height) continue;
      seen.add(r.name);
      let ang = Math.atan2(m.uz, m.ux); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      x.save(); x.translate(sx, sy); x.rotate(ang); x.lineWidth = 3 * dpr; x.strokeStyle = 'rgba(20,24,20,.85)'; x.strokeText(r.name, 0, 0); x.fillStyle = '#f4efe2'; x.fillText(r.name, 0, 0); x.restore();
    }
  }
  // zonas e lugares
  x.font = `700 ${Math.round(clamp(15 * Math.sqrt(s / dpr), 13, 22) * dpr)}px "Barlow Condensed", sans-serif`; x.fillStyle = 'rgba(240,232,214,.92)'; x.textAlign = 'center';
  if (s / dpr < 2.2) for (const L of G.mapLabels || []) { const [a, b] = mapW2S(L[1], L[2]); x.lineWidth = 3 * dpr; x.strokeStyle = 'rgba(15,18,15,.7)'; x.strokeText(L[0], a, b); x.fillText(L[0], a, b); }
  else for (const z of G.namedZones || []) { if (!z.n || z.p.length < 3) continue; const [cx, cz] = polyCentroid(z.p), [a, b] = mapW2S(cx, cz); if (a < 0 || b < 0 || a > c.width || b > c.height) continue; x.font = `700 ${Math.round(13 * dpr)}px "Barlow Condensed", sans-serif`; x.lineWidth = 3 * dpr; x.strokeStyle = 'rgba(15,18,15,.8)'; x.strokeText(z.n.toUpperCase(), a, b); x.fillStyle = '#ffd98a'; x.fillText(z.n.toUpperCase(), a, b); }
  x.textAlign = 'left';
  for (const m of G.missionMarkers) { const [a, b] = mapW2S(m.def.at[0], m.def.at[1]); x.fillStyle = save.done[m.def.id] ? '#9bd28a' : '#f2a33a'; x.fillRect(a - 7 * dpr, b - 7 * dpr, 14 * dpr, 14 * dpr); x.fillStyle = '#f2ecdc'; x.font = `600 ${13 * dpr}px Barlow Condensed, sans-serif`; x.fillText(m.def.name, a + 11 * dpr, b + 4 * dpr); }
  if (G.waypoint) { const [a, b] = mapW2S(G.waypoint.x, G.waypoint.z); x.fillStyle = '#c36bff'; x.strokeStyle = '#111'; x.lineWidth = 2 * dpr; x.beginPath(); x.arc(a, b, 8 * dpr, 0, 7); x.fill(); x.stroke(); }
  if (G.works) { const [a, b] = mapW2S(G.works.center.x, G.works.center.z); x.fillStyle = '#ff8a1a'; x.fillRect(a - 8 * dpr, b - 8 * dpr, 16 * dpr, 16 * dpr); }
  const me = G.player.car || G.player.ped, [px, py] = mapW2S(me.x, me.z), yaw = G.player.car ? G.player.car.yaw : G.player.ped.yaw;
  x.save(); x.translate(px, py); x.rotate(Math.PI - yaw); x.scale(dpr * 1.3, dpr * 1.3); x.fillStyle = '#fff'; x.strokeStyle = '#7a1f3d'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -9); x.lineTo(6.5, 7); x.lineTo(0, 3.5); x.lineTo(-6.5, 7); x.closePath(); x.fill(); x.stroke(); x.restore();
  // escala
  const m100 = 100 * s; x.fillStyle = 'rgba(15,18,15,.8)'; x.fillRect(c.width - m100 - 30 * dpr, c.height - 34 * dpr, m100 + 20 * dpr, 24 * dpr); x.fillStyle = '#f2ecdc'; x.fillRect(c.width - m100 - 20 * dpr, c.height - 18 * dpr, m100, 3 * dpr); x.font = `600 ${12 * dpr}px Barlow Condensed, sans-serif`; x.textAlign = 'center'; x.fillText(Math.round(100 / 0.65) + ' m', c.width - m100 / 2 - 20 * dpr, c.height - 24 * dpr);
}
function setWaypoint(x, z) {
  if (x === null) { G.waypoint = null; G.route = null; return; }
  G.waypoint = { x, z }; G._routeT = 0; toast('Destino marcado no GPS');
}
function updateRoute(dt) {
  if (!G.waypoint) return;
  const me = G.player.car || G.player.ped;
  if (Math.hypot(me.x - G.waypoint.x, me.z - G.waypoint.z) < 12) { setWaypoint(null); toast('Chegaches ao destino'); return; }
  G._routeT -= dt; if (G._routeT > 0) return; G._routeT = 1.2;
  const f = n => n.edges.some(e => e.road.type === 'car');
  const a = nearestNode(me.x, me.z, f), b = nearestNode(G.waypoint.x, G.waypoint.z, f);
  G.route = pathTo(a, b) || null;
}
let toastT = 0;
function toast(t, dur = 3.2) { const el = $('toast'); el.textContent = t; el.classList.add('show'); toastT = dur; }
function bigMsg(a, b) { $('bigA').textContent = a; $('bigB').textContent = b || ''; const el = $('big'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
let promptSet = false; function setPrompt(t) { $('prompt').textContent = t; $('prompt').classList.add('show'); promptSet = true; }
let lastZone = '', zoneT = 0;
function updateHUD(dt) {
  const pl = G.player, me = pl.car || pl.ped;
  $('money').textContent = pl.money.toLocaleString('es-ES') + ' €';
  const hh = Math.floor(G.hour), mm = Math.floor((G.hour % 1) * 60); $('clock').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  if (pl.car) { $('speedo').hidden = false; $('spd').textContent = Math.round(pl.car.speed * 3.6); const hp = clamp(pl.car.health, 0, 100); $('dmg').style.transform = `scaleX(${hp / 100})`; $('dmg').classList.toggle('low', hp < 30); }
  else $('speedo').hidden = true;
  const z = zoneName(me.x, me.z); if (z !== lastZone) { lastZone = z; $('zone').textContent = z; $('zone').classList.add('show'); zoneT = 3.5; }
  zoneT -= dt; if (zoneT < 0) $('zone').classList.remove('show');
  toastT -= dt; if (toastT < 0) $('toast').classList.remove('show');
  // indicacións de interacción
  if (!promptSet) {
    if (!pl.car) { const v = nearestCar(2.2); if (v) setPrompt(`${isTouch ? '⇅' : 'F'} · ${v.ai ? 'Roubar' : 'Subir a'} ${v.t.nameG.toLowerCase()}`); else $('prompt').classList.remove('show'); }
    else $('prompt').classList.remove('show');
  }
  promptSet = false;
  $('touch').classList.toggle('incar', !!pl.car);
  if (G._lastInCar !== !!pl.car) { G._lastInCar = !!pl.car; $('tbHand').innerHTML = pl.car ? '<span><b>⊘</b>freo man</span>' : '<span><b>⤒</b>salto</span>'; }
}
function updateMenuStats() {
  const n = Object.keys(save.done).length;
  $('menuStats').textContent = `${n}/6 misións · ${save.bottles.length}/12 botellas · ${(save.money || 0).toLocaleString('es-ES')} €`;
}

/* ==========================================================
   SON (WebAudio sintetizado)
   ========================================================== */
G.sfx = (() => {
  let ac = null, master, engine = null, noiseBuf, amb = {}, radio = null, radioOn = false;
  const nothing = () => { };
  const api = { init, update, crash: nothing, thud: nothing, splash: nothing, horn: nothing, scream: nothing, trainHorn: nothing, door: nothing, checkpoint: nothing, coin: nothing, win: nothing, fail: nothing, start: nothing, alert: nothing, toggleRadio: nothing };
  function init() {
    if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.connect(master); api.out = comp;
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 3; }
    const loopNoise = (type, f, q, g) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gn = ac.createGain(); gn.gain.value = g; s.connect(fl); fl.connect(gn); gn.connect(comp); s.start(); return { s, fl, g: gn }; };
    // motor
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square';
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 3; const eg = ac.createGain(); eg.gain.value = 0;
    o1.connect(lp); o2.connect(lp); lp.connect(eg); eg.connect(comp); o1.start(); o2.start(); engine = { o1, o2, lp, g: eg };
    amb.city = loopNoise('lowpass', 260, 0.5, 0.05); amb.river = loopNoise('bandpass', 900, 0.6, 0); amb.crowd = loopNoise('bandpass', 700, 1.2, 0);
    amb.skid = loopNoise('bandpass', 1300, 6, 0); amb.wind = loopNoise('highpass', 900, 0.5, 0); amb.rain = loopNoise('highpass', 2500, 0.3, 0);
    const so = ac.createOscillator(); so.type = 'triangle'; const sg = ac.createGain(); sg.gain.value = 0; so.connect(sg); sg.connect(comp); so.start(); amb.siren = { o: so, g: sg };
    api.ac = ac; api.noiseBuf = noiseBuf;
    Object.assign(api, { chant, bell, crash, thud, splash, horn, scream, trainHorn, door, checkpoint, coin, win, fail, start: () => arp([392, 523, 659], 0.09, 'triangle', 0.12), alert: () => arp([880, 660, 880], 0.08, 'square', 0.06), toggleRadio });
  }
  const atten = o => { if (!o) return 1; const x = o.x !== undefined ? o.x : 0, z = o.z !== undefined ? o.z : 0; const d = Math.hypot(camera.position.x - x, camera.position.z - z); return clamp(1 - d / 120, 0, 1) ** 1.6; };
  function burst(dur, f, vol, type = 'lowpass') { const s = ac.createBufferSource(); s.buffer = noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = ac.createGain(); const t = ac.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(fl); fl.connect(g); g.connect(api.out); s.start(t, Math.random()); s.stop(t + dur); }
  function tone(f, dur, type, vol, f2, delay = 0) { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + delay; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(api.out); o.start(t); o.stop(t + dur + 0.05); }
  function arp(fs, step, type, vol) { fs.forEach((f, i) => tone(f, step * 2.2, type, vol, null, i * step)); }
  function crash(k, o) { const a = atten(o); if (a < 0.02) return; burst(0.35 + k * 0.4, 1800, 0.5 * k * a); burst(0.25, 120, 0.8 * k * a); }
  function thud(k, o) { const a = atten(o); if (a < 0.02) return; burst(0.2, 200, 0.6 * k * a); }
  function splash(o) { burst(1.2, 1400, 0.6 * atten(o), 'bandpass'); }
  function horn(o, v = 1) { const a = atten(o) * v; if (a < 0.02) return; tone(415, 0.45, 'square', 0.07 * a); tone(523, 0.45, 'square', 0.06 * a); }
  function scream(o) { const a = atten(o); if (a < 0.05) return; tone(500 + Math.random() * 200, 0.35, 'sine', 0.05 * a, 900); }
  function trainHorn(o) { const a = Math.max(0.15, atten({ x: o.x, z: o.z })); tone(311, 1.6, 'sawtooth', 0.05 * a); tone(392, 1.6, 'sawtooth', 0.045 * a); }
  function door() { burst(0.12, 600, 0.25); tone(140, 0.1, 'sine', 0.2); }
  function chant() { // «Non-á-pon-te!» coreado: catro golpes de voz
    [0, 0.32, 0.64, 0.96].forEach((d, i) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = [520, 640, 560, 720][i]; bp.Q.value = 2.5; const g = ac.createGain(), t = ac.currentTime + d; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26); s.connect(bp); bp.connect(g); g.connect(api.out); s.start(t, Math.random()); s.stop(t + 0.3); tone([196, 220, 196, 247][i], 0.24, 'sawtooth', 0.025, null, d); });
  }
  function bell(o) { const a = Math.max(0.15, atten(o)); tone(2350, 0.35, 'sine', 0.06 * a); tone(2350, 0.35, 'sine', 0.05 * a, null, 0.14); tone(3100, 0.2, 'sine', 0.025 * a); }
  function checkpoint() { arp([659, 880], 0.08, 'triangle', 0.15); }
  function coin() { arp([988, 1319], 0.06, 'square', 0.05); }
  function win() { arp([587, 740, 880, 1175, 880, 1175], 0.12, 'triangle', 0.14); }
  function fail() { arp([440, 415, 370, 294], 0.16, 'sawtooth', 0.07); }
  /* radio: muiñeira sintetizada en 6/8 */
  function toggleRadio() {
    radioOn = !radioOn; toast(radioOn ? 'Radio Lemos FM · música tradicional' : 'Radio apagada', 1.8);
    if (radioOn && !radio) {
      radio = { g: ac.createGain(), step: 0, next: ac.currentTime + 0.1 }; radio.g.gain.value = 0.0; radio.g.connect(api.out);
      const mel = [74, 76, 78, 79, 78, 76, 74, 76, 74, 71, 69, 71, 74, 76, 78, 81, 79, 78, 76, 78, 76, 74, 71, 74];
      const bass = [50, 50, 55, 55, 57, 57, 50, 50];
      radio.tick = () => {
        while (radio.next < ac.currentTime + 0.2) {
          const t = radio.next, i = radio.step, f = 440 * Math.pow(2, (mel[i % mel.length] - 69) / 12);
          const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
          o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
          o.connect(lp); lp.connect(g); g.connect(radio.g); o.start(t); o.stop(t + 0.2);
          if (i % 3 === 0) { const b = ac.createOscillator(), bg = ac.createGain(); b.type = 'triangle'; b.frequency.value = 440 * Math.pow(2, (bass[Math.floor(i / 3) % bass.length] - 69) / 12); bg.gain.setValueAtTime(0.09, t); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); b.connect(bg); bg.connect(radio.g); b.start(t); b.stop(t + 0.55); }
          if (i % 6 === 0) { const s = ac.createBufferSource(); s.buffer = noiseBuf; const bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 150; const sg = ac.createGain(); sg.gain.setValueAtTime(0.5, t); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.18); s.connect(bp); bp.connect(sg); sg.connect(radio.g); s.start(t); s.stop(t + 0.2); }
          // drone de gaita
          if (i % 24 === 0) { const dr = ac.createOscillator(), dg = ac.createGain(); dr.type = 'sawtooth'; dr.frequency.value = 73.4; const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 500; dg.gain.setValueAtTime(0.0001, t); dg.gain.linearRampToValueAtTime(0.03, t + 0.3); dg.gain.linearRampToValueAtTime(0.0001, t + 4.3); dr.connect(lp2); lp2.connect(dg); dg.connect(radio.g); dr.start(t); dr.stop(t + 4.4); }
          radio.next += 0.18; radio.step++;
        }
      };
    }
  }
  function update(dt) {
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    const pl = G.player, c = pl.car, now = ac.currentTime;
    master.gain.setTargetAtTime(G.paused ? 0.0 : 0.8, now, 0.1);
    if (c) {
      const sp = Math.abs(c.fwdSpeed), gears = [0, 9, 17, 26, 36, 48, 70]; let gi = 1; while (gi < gears.length - 1 && sp > gears[gi]) gi++;
      const lo = gears[gi - 1], hi = gears[gi], rpm = 850 + clamp((sp - lo) / (hi - lo), 0, 1) * 5200 * (gi === 1 ? 1 : 0.8) + (gi > 1 ? 1100 : 0) + Math.abs(c.inp.throttle) * 300;
      c.gear = gi; c.rpm = rpm;
      const f = rpm / 60 * (c.t.prof === 'bus' ? 1 : 2);
      engine.o1.frequency.setTargetAtTime(f, now, 0.04); engine.o2.frequency.setTargetAtTime(f * 0.5, now, 0.04);
      engine.lp.frequency.setTargetAtTime(300 + Math.abs(c.inp.throttle) * 1400 + rpm * 0.1, now, 0.05);
      engine.g.gain.setTargetAtTime(c.health > 0 ? 0.05 + Math.abs(c.inp.throttle) * 0.06 : 0, now, 0.06);
      amb.skid.g.gain.setTargetAtTime(c.skid ? 0.12 : 0, now, 0.05);
      amb.wind.g.gain.setTargetAtTime(clamp(sp / 40, 0, 1) * 0.06, now, 0.2);
      $('gear').textContent = c.fwdSpeed < -0.5 ? 'R' : gi;
    } else { engine.g.gain.setTargetAtTime(0, now, 0.1); amb.skid.g.gain.setTargetAtTime(0, now, 0.05); amb.wind.g.gain.setTargetAtTime(0, now, 0.2); }
    const me = c || pl.ped;
    const dr = riverDist(me.x, me.z); amb.river.g.gain.setTargetAtTime(clamp(1 - (dr - 10) / 40, 0, 1) * 0.06, now, 0.3);
    const inCardeal = me.x > -50 && me.x < -30 && me.z > 10 && me.z < 110;
    let dc = inCardeal ? 0 : Math.hypot(me.x - clamp(me.x, -45, -35), me.z - clamp(me.z, 14, 104));
    if (G.fair) dc = Math.min(dc, Math.max(0, Math.hypot(me.x + 60, me.z - 44) - 20) * 0.8);
    if (G.riotOn && G.motoSpot) dc = Math.min(dc, Math.max(0, Math.hypot(me.x - G.motoSpot.x, me.z - G.motoSpot.z) - 12) * 0.6);
    amb.crowd.g.gain.setTargetAtTime(clamp(1 - dc / 50, 0, 1) * (0.05 + G.night * 0.06) * (0.7 + 0.3 * Math.sin(G.t * 1.7) * Math.sin(G.t * 0.6)), now, 0.2);
    amb.rain.g.gain.setTargetAtTime(G.rain ? 0.05 : 0, now, 1);
    // sirena
    let sd = 1e9; for (const v of world.vehicles) if (v.sirenOn) sd = Math.min(sd, Math.hypot(v.x - me.x, v.z - me.z));
    const sv = clamp(1 - sd / 160, 0, 1); amb.siren.g.gain.setTargetAtTime(sv * 0.05, now, 0.1); amb.siren.o.frequency.setTargetAtTime(Math.sin(G.t * 2.6) > 0 ? 960 : 640, now, 0.08);
    if (radio) { radio.g.gain.setTargetAtTime(radioOn && c ? 0.5 : 0, now, 0.3); if (radioOn) radio.tick(); }
    // paxaros no parque de día
    if (!G.night && R() < dt * 0.6 && me.x > 40 && me.x < 200 && me.z > 0 && me.z < 110) { const f = RR(2400, 3600); tone(f, 0.08, 'sine', 0.02, f * 1.3); tone(f * 1.1, 0.07, 'sine', 0.015, f * 1.5, 0.1); }
  }
  return api;
})();

/* ==========================================================
   PAUSA / MENÚ
   ========================================================== */
function startGame() {
  G.sfx.init();
  if (!G.started) {
    G.started = true; G.paused = false; document.body.classList.add('playing'); $('menu').classList.add('ingame'); $('menu').hidden = true; $('hud').hidden = false; if (isTouch) $('touch').hidden = false;
    G.hour = +$('optTime').value; G.rain = $('optRain').value === 'rain';
    camYaw = G.startPos.yaw + Math.PI; camPitch = 0.22;
    renderStars();
    startArrivalIntro();
  } else togglePause(false);
}
function togglePause(force) {
  if (!G.started) return;
  G.paused = force !== undefined ? force : !G.paused;
  $('menu').hidden = !G.paused; $('btnPlay').hidden = true; $('btnStory').hidden = true; $('storyPwd').hidden = true; $('btnResume').hidden = false; $('btnReset').hidden = !G.player.car;
  if (G.paused && document.exitPointerLock) document.exitPointerLock();
  updateMenuStats();
}

/* ==========================================================
   BUCLE PRINCIPAL
   ========================================================== */
let lastT = 0, fpsAcc = 0, fpsN = 0, lightT = 0;
const _cc = [];
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (G.paused || G.mapOpen) dt = G.started ? 0 : dt;
  G.t += dt;
  if (!G.started) { G.t += 0; updateMenuCam(Math.min(0.05, (now - (loop._l || now)) / 1000) || 0.016); loop._l = now; simulate(0.016, true); updateSky(0.016, camera.position); renderer.render(scene, camera); return; }
  if (dt > 0) {
    readInput();
    simulate(dt, false);
    updateCamera(dt);
    const f = G.player.car || G.player.ped; updateSky(dt, { x: f.x, y: f.y || 0, z: f.z });
    updateMission(dt); updateStory(dt); updateBottles(dt); updateWanted(dt); updateRoute(dt); updateHUD(dt);
    drawMinimap();
  }
  G.sfx.update(dt);
  renderer.render(scene, camera);
  // resolución dinámica: baixa a densidade de píxeles se o equipo non chega a ~35 fps
  if (dt > 0 && !window.__test) { fpsAcc += dt; fpsN++; if (fpsAcc > 3) { const avg = fpsAcc / fpsN; const pr = renderer.getPixelRatio(); if (avg > 0.029 && pr > 0.6) { renderer.setPixelRatio(Math.max(0.6, pr - 0.15)); onResize(); } else if (avg < 0.017 && pr < Math.min(devicePixelRatio, QS.pr) - 0.01) { renderer.setPixelRatio(Math.min(Math.min(devicePixelRatio, QS.pr), pr + 0.1)); onResize(); } fpsAcc = 0; fpsN = 0; } }
}
function simulate(dt, menu) {
  const pl = G.player;
  // vehículos (subpasos)
  const steps = 2, h = dt / steps;
  if (!menu && pl.car) updatePlayerCar(dt);
  const me = menu ? camera.position : (pl.car || pl.ped);
  for (const v of world.vehicles) {
    const d = Math.hypot(v.x - me.x, v.z - me.z);
    v.root.visible = d < 260;
    if (v.ai) { if (d < 320) aiDrive(v, dt, world); else { v.inp.throttle = 0; } }
    if (d > 320 && v.ai && !v.driver) continue;
    for (let s = 0; s < steps; s++) v.update(h);
  }
  collideVehicles(world.vehicles.filter(v => !v.sleep || true).filter(v => Math.hypot(v.x - me.x, v.z - me.z) < 200));
  for (const v of world.vehicles) {
    if (!v.root.visible) continue; v.sync(dt);
    // fume e marcas
    if (v.skid && v.onGround && v.speed > 3) { const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), lx = Math.cos(v.yaw), lz = -Math.sin(v.yaw); for (const s of [-1, 1]) { const wx = v.x - fx * v.t.wb / 2 + lx * s * v.t.W * 0.42, wz = v.z - fz * v.t.wb / 2 + lz * s * v.t.W * 0.42; world.skids.mark(v.id * 2 + (s > 0 ? 1 : 0), wx, v.y, wz); if (R() < 0.35) world.smoke.emit(wx, v.y + 0.3, wz, RR(-0.5, 0.5), RR(0.4, 1), RR(-0.5, 0.5), 0.8, 1.4, 0xdedede, 0.35); } }
    if (v.health < 35 && R() < 0.25) world.smoke.emit(v.x + Math.sin(v.yaw) * v.t.L * 0.35, v.y + 1.1, v.z + Math.cos(v.yaw) * v.t.L * 0.35, RR(-0.3, 0.3), 1.6, RR(-0.3, 0.3), 1.0, 2, v.health < 10 ? 0x222222 : 0x777777, 0.55);
  }
  // atropelos (vehículo contra peón)
  const peds = world.crowd.peds;
  for (const v of world.vehicles) {
    const sp = v.speed; if (sp < 2) continue;
    for (const p of peds) {
      if (!p.visible || p.state === 'down' || p.state === 'hidden') continue;
      if (Math.abs(p.x - v.x) > 4 || Math.abs(p.z - v.z) > 4) continue;
      if (p === pl.ped && pl.car) continue;
      for (const c of v.worldCircles(_cc)) {
        if (Math.hypot(p.x - c.x, p.z - c.z) < v.rad + 0.3 && Math.abs(p.y - v.y) < 1.5) {
          if (p === pl.ped) { if (sp > 6) { G.shake = 0.6; p.x += v.vx * 0.15; p.z += v.vz * 0.15; toast('Ai! Coidado co tráfico'); } break; }
          if (knockDown(p, v.vx, v.vz)) { v.vx *= 0.92; v.vz *= 0.92; if (v === pl.car) { if (!G._hitCd || G.t - G._hitCd > 4) { addWanted(1, 'Atropelaches a alguén: a policía vai por ti'); G._hitCd = G.t; } } }
          break;
        }
      }
    }
  }
  // peóns
  for (const p of peds) { if (p === pl.ped) continue; pedThink(p, dt, world); }
  updateRiders(dt); updateWorks(dt); updateFair(dt); if (!menu) { updateVirginia(dt); updateCarude(dt); updateConcello(dt); updateMedieval(dt); updateAbeledos(dt); updateCows(dt); } updateBand(dt); updateBandMusic(dt); updateFluvial(dt);
  if (!menu && !pl.car && !G.cine) updatePlayerFoot(dt);
  if (!menu) updateCine(dt);
  if (!menu) updateSajoni(dt);
  G.poseDt = dt;
  for (const p of peds) world.crowd.pose(p);
  if (typeof updateHeroes === 'function') updateHeroes();
  if (typeof virginiaOverlays === 'function') virginiaOverlays();
  if (typeof carudeOverlays === 'function') carudeOverlays();
  if (typeof medTunics === 'function') medTunics();
  world.crowd.flush();
  world.smoke.update(dt);
  // tren
  world.train.update(dt);
  // xestión do tráfico: retirar coches lonxanos e repoñer
  if (!menu) {
    G._trafT = (G._trafT || 0) - dt;
    if (G._trafT <= 0) {
      G._trafT = 1;
      const me2 = pl.car || pl.ped;
      for (let i = world.vehicles.length - 1; i >= 0; i--) {
        const v = world.vehicles[i]; if (v === pl.car) continue;
        const d = Math.hypot(v.x - me2.x, v.z - me2.z);
        if ((v.ai && v.ai.mode === 'traffic' && (d > 300 || (v.ai.respawn && d > 60))) || (v.t.livery === 'police' && !v.ai && d > 200)) { v.remove(scene); world.vehicles.splice(i, 1); }
      }
      const nT = world.vehicles.filter(v => v.ai && v.ai.mode === 'traffic').length;
      if (nT < QS.traffic) spawnTraffic(me2);
      recyclePeds();
      // coches aparcados: os que quedan moi lonxe pasan a prazas libres preto do xogador
      let moved = 0;
      for (const v of world.vehicles) {
        if (moved > 2 || !v.sleep || v.ai || v === pl.car || v.type === 'taxi' || v.type === 'clasico' || v.type === 'moto' || v.parkedOwned) continue;
        if (Math.hypot(v.x - me2.x, v.z - me2.z) < 380) continue;
        const cand = G.parking.filter(sp => { const d = Math.hypot(sp.x - me2.x, sp.z - me2.z); return d > 110 && d < 300 && !world.vehicles.some(o => Math.hypot(o.x - sp.x, o.z - sp.z) < 5); });
        if (!cand.length) break; const sp = pick(cand); v.place(sp.x, sp.z, sp.yaw); v.sleep = true; moved++;
      }
    }
  }
  // luces dinámicas
  lightT -= dt;
  if (lightT <= 0 && G.pointLights.length) {
    lightT = 0.4;
    const f = menu ? camera.position : (pl.car || pl.ped), cand = G.lamps.concat(G.cardealLights || []);
    cand.sort((a, b) => ((a.x - f.x) ** 2 + (a.z - f.z) ** 2) - ((b.x - f.x) ** 2 + (b.z - f.z) ** 2));
    G.pointLights.forEach((l, i) => { const c = cand[i]; if (!c) return; l.position.set(c.x, c.y - 0.4, c.z); l.intensity = G.night * 1.6; l.distance = c.y < 7 ? 16 : 24; });
  }
  // faros do xogador
  const car = pl.car;
  G.headL.forEach((sl, i) => {
    if (!car || G.night < 0.3) { sl.intensity = 0; return; }
    const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw), lx = Math.cos(car.yaw), lz = -Math.sin(car.yaw), s = i ? 1 : -1;
    sl.position.set(car.x + fx * car.t.L / 2 + lx * s * 0.6, car.y + 0.8, car.z + fz * car.t.L / 2 + lz * s * 0.6);
    sl.target.position.set(car.x + fx * 25 + lx * s * 1.5, car.y - 0.5, car.z + fz * 25 + lz * s * 1.5); sl.intensity = 2.2 * G.night;
  });
  // auga e animacións
  if (MAT.water.normalMap) { MAT.water.normalMap.offset.x = G.t * 0.012; MAT.water.normalMap.offset.y = G.t * 0.004; }
  for (const a of G.anims) a(G.t);
  if (G.rainMesh) { G.rainMesh.visible = G.rain; if (G.rain) { G.rainMesh.position.set(camera.position.x, camera.position.y - 12 - ((G.t * 18) % 12), camera.position.z); } }
}

boot();
