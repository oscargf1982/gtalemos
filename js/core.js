'use strict';
/* ==========================================================
   LEMOS 27400 · núcleo: utilidades, mapa, terreo, colisións
   ========================================================== */
const G = { t: 0 };
/* xestión de cor: os hex e as cores CSS son sRGB → pasalos a lineal (como fai three.js moderno) */
(() => { const C = THREE.Color.prototype, sh = C.setHex, ss = C.setStyle;
  C.setHex = function (h) { sh.call(this, h); return this.convertSRGBToLinear(); };
  C.setStyle = function (st) { ss.call(this, st); if (!/^#|^rgb|^hsl/i.test(st)) return this; return this.convertSRGBToLinear(); };
  C.getStyleSRGB = function () { return this.clone().convertLinearToSRGB().getStyle(); };
})();

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let _rng = mulberry32(27400);
const R = () => _rng();
const RR = (a, b) => a + (b - a) * R();
const RI = (a, b) => Math.floor(RR(a, b + 1));
const pick = a => a[Math.floor(R() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

/* ---------- Xeografía: datos reais de OpenStreetMap (js/osmdata.js) ----------
   Metros reais. x = leste, z = sur (norte = -z). Orixe: 42.5245 N, 7.5130 O.
   © colaboradores de OpenStreetMap (ODbL). */
const MAP = { minX: OSM.crop[0], minZ: OSM.crop[1], maxX: OSM.crop[2], maxZ: OSM.crop[3] };
const HILL = { x: 185, z: 68, top: 30, r0: 55, r1: 150 };
const RIVER_HW = 12; // ancho nominal; riverDist devolve a distancia normalizada ao ancho real de cada tramo
const RIVER = OSM.river.map(p => [p[0], p[1]]);
const RIVER_W = OSM.river.map(p => p[2]);
function riverRaw(x, z) { // distancia á beira (negativa dentro)
  let bd = 1e12, bh = RIVER_HW;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b = RIVER[i + 1];
    if ((x < a[0] - 80 && x < b[0] - 80) || (x > a[0] + 80 && x > b[0] + 80) || (z < a[1] - 80 && z < b[1] - 80) || (z > a[1] + 80 && z > b[1] + 80)) continue;
    const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
    let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = a[0] + dx * t - x, pz = a[1] + dz * t - z, d = px * px + pz * pz;
    if (d < bd) { bd = d; bh = lerp(RIVER_W[i], RIVER_W[i + 1], t); }
  }
  return Math.sqrt(bd) - bh;
}
function riverDistRaw(x, z) { return riverRaw(x, z) + RIVER_HW; }
const ZONES = {};               // polígonos con nome (parques, monumentos...) enchidos ao construír o mundo
const AREAS = OSM.areas;
/* polígonos */
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function polyBox(P) { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { x0, z0, x1, z1 }; }
function polyCentroid(P) { let a = 0, cx = 0, cz = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const f = P[j][0] * P[i][1] - P[i][0] * P[j][1]; a += f; cx += (P[j][0] + P[i][0]) * f; cz += (P[j][1] + P[i][1]) * f; } a *= 0.5; return a ? [cx / (6 * a), cz / (6 * a)] : P[0]; }
function polyArea(P) { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return Math.abs(a / 2); }
/* rectángulo de área mínima: { cx, cz, w (ao longo de ang), d, ang } con ang = atan2(uz, ux) */
function minRect(P) {
  let best = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang), s = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const q of P) { const u = q[0] * c + q[1] * s, v = -q[0] * s + q[1] * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0) * (v1 - v0);
    if (!best || A < best.A) { const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2; best = { A, ang, w: u1 - u0, d: v1 - v0, cx: uc * c - vc * s, cz: uc * s + vc * c }; }
  }
  return best;
}
/* marcos de referencia: un monumento deseñado en coordenadas locais colócase no plano real */
function makeFrame(ox, oz, rot) { const c = Math.cos(rot), s = Math.sin(rot); return { ox, oz, rot, pt: (x, z) => [ox + x * c + z * s, oz - x * s + z * c], yaw: a => a + rot, inv: (x, z) => { const dx = x - ox, dz = z - oz; return [dx * c - dz * s, dx * s + dz * c]; } }; }
function frameAt(lx, lz, wx, wz, rot) { const c = Math.cos(rot), s = Math.sin(rot); return makeFrame(wx - (lx * c + lz * s), wz - (-lx * s + lz * c), rot); }

/* ---------- Rúas (OpenStreetMap) ---------- */
const SIDEWALK = 2.4;
const PED_OVERRIDE = { 'A Ponte Vella': 'ped' };
const ROADS = OSM.roads.map((o, i) => {
  let type = o.k === 'track' ? 'track' : o.k;
  if (PED_OVERRIDE[o.n]) type = PED_OVERRIDE[o.n];
  const pts = o.p, w = type === 'ped' && o.n === 'A Ponte Vella' ? 7.5 : o.w;
  let len = 0; const cum = [0]; for (let k = 1; k < pts.length; k++) { len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); cum.push(len); }
  return { id: i, name: o.n, cls: o.c, type, w, hw: w / 2, sw: type === 'car' ? o.sw : 0, pts, cum, len, br: !!o.br, ow: o.ow || 0, steps: !!o.st, major: ['trunk', 'primary', 'secondary', 'tertiary'].includes(o.c) };
});
/* punto e tanxente a unha distancia s ao longo dunha rúa */
function roadPoint(r, s) {
  const P = r.pts, C = r.cum; s = clamp(s, 0, r.len);
  let k = 1; while (k < P.length - 1 && C[k] < s) k++;
  const a = P[k - 1], b = P[k], L = (C[k] - C[k - 1]) || 1, t = (s - C[k - 1]) / L, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ux, uz };
}
/* polilínea desprazada lateralmente (+ = esquerda: nx = -uz, nz = ux) */
function offsetLine(P, off) {
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], c = P[i];
    let ux = 0, uz = 0;
    if (i > 0) { const dx = c[0] - P[i - 1][0], dz = c[1] - P[i - 1][1], L = Math.hypot(dx, dz) || 1; ux += dx / L; uz += dz / L; }
    if (i < P.length - 1) { const dx = P[i + 1][0] - c[0], dz = P[i + 1][1] - c[1], L = Math.hypot(dx, dz) || 1; ux += dx / L; uz += dz / L; }
    const L = Math.hypot(ux, uz) || 1; ux /= L; uz /= L;
    // miter limitado
    let k = 1; if (i > 0 && i < P.length - 1) { const dx = c[0] - P[i - 1][0], dz = c[1] - P[i - 1][1], L1 = Math.hypot(dx, dz) || 1; const cosh = (dx / L1) * ux + (dz / L1) * uz; k = 1 / Math.max(0.5, cosh); }
    out.push([c[0] - uz * off * k, c[1] + ux * off * k]);
  }
  return out;
}
/* recorta unha polilínea polos dous extremos */
function trimLine(P, t0, t1) {
  let L = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(L); }
  if (t0 + t1 >= L - 0.3) return null;
  const at = s => { let k = 1; while (k < P.length - 1 && cum[k] < s) k++; const a = P[k - 1], b = P[k], f = (s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  const out = [at(t0)]; for (let i = 0; i < P.length; i++) if (cum[i] > t0 && cum[i] < L - t1) out.push(P[i]); out.push(at(L - t1)); return out;
}
/* extremos: grao de cada unión e ancho máximo das outras rúas */
const JUNC = new Map(); // clave "x,z" -> [{ r, end }]
const jkey = (x, z) => Math.round(x * 2) + ',' + Math.round(z * 2);
for (const r of ROADS) for (const end of [0, 1]) { const p = end ? r.pts[r.pts.length - 1] : r.pts[0], k = jkey(p[0], p[1]); let a = JUNC.get(k); if (!a) JUNC.set(k, a = []); a.push({ r, end }); }
function juncAt(r, end) { const p = end ? r.pts[r.pts.length - 1] : r.pts[0]; return JUNC.get(jkey(p[0], p[1])) || []; }
/* recorte das beirarrúas/pasos nun extremo: medio ancho máximo das outras rúas con coches */
function endTrim(r, end) { let m = 0; for (const o of juncAt(r, end)) if (o.r !== r && (o.r.type === 'car' || o.r.type === 'ped')) m = Math.max(m, o.r.hw + o.r.sw); return m; }

/* zona urbana (onde hai edificios ao longo das rúas) — contorno debuxado sobre o plano */
const URBAN = [[-1090, 1330], [-1000, 1060], [-760, 1010], [-600, 880], [-560, 640], [-600, 420], [-470, 260], [-360, -20], [-170, -230], [60, -380], [330, -600], [560, -760], [930, -760], [930, -280], [760, 60], [600, 330], [500, 600], [300, 760], [0, 840], [-280, 990], [-560, 1180], [-760, 1360]];
function isUrban(x, z) { return inPoly(x, z, URBAN); }
for (const r of ROADS) { const m = roadPoint(r, r.len / 2); r.urban = isUrban(m.x, m.z); if (!r.urban) r.sw = 0; }

/* Pontes: rúas marcadas como ponte en OSM que cruzan o Cabe */
const BRIDGES = [];
(function () {
  for (const r of ROADS) {
    if (!r.br) continue;
    let md = 1e9; for (let s = 0; s <= r.len; s += 1) { const p = roadPoint(r, s), d = riverRaw(p.x, p.z); if (d < md) md = d; }
    if (md > 2) continue; // pontes sobre regatos ou estradas: chan normal
    const a = r.pts[0], b = r.pts[r.pts.length - 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    const type = r.name === 'A Ponte Vella' ? 'vella' : (r.type === 'car' ? 'road' : 'wood');
    const hw = type === 'vella' ? 5.0 : type === 'road' ? r.hw + r.sw + 0.4 : Math.max(1.6, r.hw + 0.3);
    const b2 = { r, type, x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, ux: dx / L, uz: dz / L, half: L / 2 + 0.5, hw, rot: Math.atan2(dx / L, dz / L) };
    if (r.name === 'Ponte do Parque dos Condes') b2.park = true;
    r.bridge = b2; BRIDGES.push(b2);
  }
})();
/* ---------- Marco local: constrúe un monumento nas súas coordenadas de deseño
   e colócao xirado/desprazado no mundo (xeometría, colisións, beirarrúas, luces) ---------- */
G._frame = null;
function fpt(x, z) { const f = G._frame; if (!f) return [x, z]; const c = Math.cos(f.rot), s = Math.sin(f.rot); return [f.ox + x * c + z * s, f.oz - x * s + z * c]; }
function frameRect(x0, z0, x1, z1) { const a = fpt(x0, z0), b = fpt(x1, z1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; }
function frameAxis() { const f = G._frame; if (!f) return true; const q = f.rot / (Math.PI / 2); return Math.abs(q - Math.round(q)) < 1e-6; }
function pushLamp(o) { const [x, z] = fpt(o.x, o.z); G.lamps.push({ x, y: o.y, z }); }
function inFrame(B, scene, ox, oz, rot, fn) {
  const LB = {}; for (const k in B) LB[k] = { list: [], add(g) { this.list.push(g); return g; } };
  const grp = new THREE.Group(); grp.position.set(ox, 0, oz); grp.rotation.y = rot; scene.add(grp);
  const prev = G._frame; G._frame = { ox, oz, rot };
  try { fn(LB, grp); } finally { G._frame = prev; }
  const M = new THREE.Matrix4().makeRotationY(rot).setPosition(ox, 0, oz);
  for (const k in LB) for (const g of LB[k].list) { g.applyMatrix4(M); B[k].add(g); }
  return grp;
}

/* ---------- Terreo ---------- */
function noise2(x, z) { return Math.sin(x * 0.021 + Math.sin(z * 0.013) * 2) * Math.cos(z * 0.017 + Math.sin(x * 0.011)) ; }
function hillRaw(x, z) {
  const d = Math.hypot(x - HILL.x, z - HILL.z);
  if (d <= HILL.r0) return HILL.top;
  if (d >= HILL.r1) return 0;
  const t = (d - HILL.r0) / (HILL.r1 - HILL.r0);
  return HILL.top * (1 - t * t * (3 - 2 * t));
}
function hillH(x, z) { return hillRaw(x, z); }
const TRAIN_PATH = OSM.train;
function trainDist(x, z) { let bd = 1e12; for (let i = 0; i < TRAIN_PATH.length - 1; i++) { const a = TRAIN_PATH[i], b = TRAIN_PATH[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = a[0] + dx * t - x, pz = a[1] + dz * t - z; bd = Math.min(bd, px * px + pz * pz); } return Math.sqrt(bd); }
function outerH(x, z) {
  // fóra da cidade o terreo sobe cara ás montañas da Ribeira Sacra (agás o corredor do tren)
  const dx = Math.max(MAP.minX - x, 0, x - MAP.maxX), dz = Math.max(MAP.minZ - z, 0, z - MAP.maxZ);
  const d = Math.hypot(dx, dz);
  if (d <= 0) return 0;
  const h = Math.pow(d, 1.25) * 0.12 + Math.max(0, noise2(x, z)) * Math.min(d, 60) * 0.25;
  return h * sstep(10, 40, trainDist(x, z));
}
function terrainH(x, z) {
  let h = Math.max(hillH(x, z), outerH(x, z));
  const dz = riverDist(x, z);
  if (dz < RIVER_HW + 0.5) h = -3.2 * (1 - sstep(RIVER_HW - 6, RIVER_HW + 0.5, dz)) + h * sstep(RIVER_HW - 6, RIVER_HW + 0.5, dz);
  return h;
}
/* pontes en calquera ángulo: coordenadas locais (ao longo, a través) */
function bridgeLocal(b, x, z) { const dx = x - b.x, dz = z - b.z; return [dx * b.ux + dz * b.uz, -dx * b.uz + dz * b.ux]; }
function bridgeAt(x, z) {
  for (const b of BRIDGES) {
    if (Math.abs(x - b.x) > b.half + b.hw || Math.abs(z - b.z) > b.half + b.hw) continue;
    const [along, across] = bridgeLocal(b, x, z);
    if (Math.abs(across) < b.hw && Math.abs(along) < b.half) return b;
  }
  return null;
}
function bridgeDeck(b, x, z) {
  const u = bridgeLocal(b, x, z)[0] / (b.half - 0.5);
  const base = Math.max(0, lerp(b.y0 || 0, b.y1 || 0, clamp(u * 0.5 + 0.5, 0, 1)));
  if (b.type === 'vella') return base + 0.05 + 1.5 * Math.max(0, 1 - u * u);
  if (b.type === 'wood') return base + 0.12 + 0.9 * Math.max(0, 1 - u * u);
  return base + 0.06;
}
/* altura do chan para físicas (inclúe pontes e beirarrúas) */
function groundH(x, z) {
  const b = bridgeAt(x, z);
  if (b) return bridgeDeck(b, x, z);
  return terrainH(x, z) + (onSidewalk(x, z) || 0);
}
function inRiver(x, z) { return riverDist(x, z) < RIVER_HW - 2 && !bridgeAt(x, z); }

/* ---------- Rúas e beirarrúas: consultas espaciais ---------- */
const SW_RECTS = []; // rects de beirarrúa extra (monumentos)
const SEGS = [];
let ROADGRID = null;
function initRoadGrid() {
  ROADGRID = new Grid(32);
  for (const r of ROADS) for (let i = 0; i < r.pts.length - 1; i++) {
    const a = r.pts[i], b = r.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;
    const sg = { r, ax: a[0], az: a[1], bx: b[0], bz: b[1], ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L, L, s0: r.cum[i] };
    SEGS.push(sg); const m = r.hw + r.sw + 6;
    ROADGRID.insert(sg, Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m, Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m);
  }
}
/* rúa máis próxima: { r, d (distancia ao eixe), s (lonxitude), side (+1 esquerda / -1 dereita), ux, uz } */
const _rn2 = { r: null, d: 1e9, s: 0, side: 1, ux: 1, uz: 0, px: 0, pz: 0 };
function nearRoad(x, z, filter) {
  _rn2.r = null; _rn2.d = 1e9;
  const c = ROADGRID && ROADGRID.get(x, z); if (!c) return _rn2;
  for (const sg of c) {
    if (filter && !filter(sg.r)) continue;
    let t = (x - sg.ax) * sg.ux + (z - sg.az) * sg.uz; t = t < 0 ? 0 : t > sg.L ? sg.L : t;
    const px = sg.ax + sg.ux * t, pz = sg.az + sg.uz * t, d = Math.hypot(x - px, z - pz);
    if (d < _rn2.d) { _rn2.r = sg.r; _rn2.d = d; _rn2.s = sg.s0 + t; _rn2.ux = sg.ux; _rn2.uz = sg.uz; _rn2.px = px; _rn2.pz = pz; _rn2.side = ((x - px) * -sg.uz + (z - pz) * sg.ux) >= 0 ? 1 : -1; }
  }
  return _rn2;
}
/* ¿está o punto sobre a calzada dalgunha rúa (con marxe)? devolve a rúa */
function inRoad(x, z, pad = 0, withPaths = false) {
  const c = ROADGRID && ROADGRID.get(x, z); if (!c) return null;
  for (const sg of c) {
    const r = sg.r; if (!withPaths && (r.type === 'path' || r.type === 'track')) continue;
    let t = (x - sg.ax) * sg.ux + (z - sg.az) * sg.uz; t = t < 0 ? 0 : t > sg.L ? sg.L : t;
    const dx = x - sg.ax - sg.ux * t, dz = z - sg.az - sg.uz * t, lim = r.hw + pad;
    if (dx * dx + dz * dz < lim * lim) return r;
  }
  return null;
}
/* calzada + beirarrúa */
function inStreet(x, z, pad = 0) {
  const c = ROADGRID && ROADGRID.get(x, z); if (!c) return null;
  for (const sg of c) {
    const r = sg.r; if (r.type === 'path' || r.type === 'track') continue;
    let t = (x - sg.ax) * sg.ux + (z - sg.az) * sg.uz; t = t < 0 ? 0 : t > sg.L ? sg.L : t;
    const dx = x - sg.ax - sg.ux * t, dz = z - sg.az - sg.uz * t, lim = r.hw + r.sw + pad;
    if (dx * dx + dz * dz < lim * lim) return r;
  }
  return null;
}
function onSidewalk(x, z) {
  if (G.swGrid) { const c = G.swGrid.get(x, z); if (c) for (const s of c) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) { if (s.obb) { const dx = x - s.x, dz = z - s.z; if (Math.abs(dx * s.c - dz * s.s) > s.hx || Math.abs(dx * s.s + dz * s.c) > s.hz) continue; } return s.h || 0.15; } }
  const c = ROADGRID && ROADGRID.get(x, z); if (!c) return 0;
  let on = false;
  for (const sg of c) {
    const r = sg.r; if (r.type === 'path' || r.type === 'track') continue;
    let t = (x - sg.ax) * sg.ux + (z - sg.az) * sg.uz; const tt = t < 0 ? 0 : t > sg.L ? sg.L : t;
    const d = Math.hypot(x - sg.ax - sg.ux * tt, z - sg.az - sg.uz * tt);
    if (d < r.hw) return 0;                         // calzada doutra rúa
    if (r.sw > 0 && d < r.hw + r.sw && t > -0.5 && t < sg.L + 0.5 && !r.bridge) on = true;
  }
  return on ? 0.15 : 0;
}

/* ---------- Grade espacial ---------- */
class Grid {
  constructor(cell = 24) { this.c = cell; this.m = new Map(); }
  key(i, j) { return i * 10007 + j; }
  insert(o, x0, z0, x1, z1) {
    const c = this.c;
    for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++)
      for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) {
        const k = this.key(i, j); let a = this.m.get(k); if (!a) this.m.set(k, a = []); a.push(o);
      }
  }
  get(x, z) { return this.m.get(this.key(Math.floor(x / this.c), Math.floor(z / this.c))); }
  query(x, z, r, out) {
    const c = this.c; out.length = 0; const seen = G._seen || (G._seen = new Set()); seen.clear();
    for (let i = Math.floor((x - r) / c); i <= Math.floor((x + r) / c); i++)
      for (let j = Math.floor((z - r) / c); j <= Math.floor((z + r) / c); j++) {
        const a = this.m.get(this.key(i, j)); if (!a) continue;
        for (const o of a) if (!seen.has(o)) { seen.add(o); out.push(o); }
      }
    return out;
  }
}
const RSEG = new Grid(40);
for (let i = 0; i < RIVER.length - 1; i++) { const a = RIVER[i], b = RIVER[i + 1]; RSEG.insert(i, Math.min(a[0], b[0]) - 48, Math.min(a[1], b[1]) - 48, Math.max(a[0], b[0]) + 48, Math.max(a[1], b[1]) + 48); }
initRoadGrid();
const _rn = { d: 999, px: 0, pz: 0, tx: 1, tz: 0, hw: RIVER_HW };
function riverNear(x, z) {
  const c = RSEG.get(x, z); let bd = 1e12, bi = -1, bt = 0;
  if (c) for (const i of c) { const a = RIVER[i], b = RIVER[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = a[0] + dx * t, pz = a[1] + dz * t, d = (x - px) * (x - px) + (z - pz) * (z - pz); if (d < bd) { bd = d; bi = i; bt = t; } }
  if (bi < 0) { _rn.d = 999; return _rn; }
  const a = RIVER[bi], b = RIVER[bi + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  const hw = lerp(RIVER_W[bi], RIVER_W[bi + 1], bt);
  _rn.d = Math.sqrt(bd) - hw + RIVER_HW; _rn.hw = hw; _rn.px = a[0] + dx * bt; _rn.pz = a[1] + dz * bt; _rn.tx = dx / L; _rn.tz = dz / L; return _rn;
}
function riverDist(x, z) { return riverNear(x, z).d; }
G.colGrid = new Grid(24);
G.swGrid = new Grid(24);
const COLLIDERS = [];
function addBoxCol(x0, z0, x1, z1, h = 30, tag, base = -5) {
  if (G._frame) { if (!frameAxis()) { const [cx, cz] = fpt((x0 + x1) / 2, (z0 + z1) / 2); return addOBB(cx, cz, Math.abs(x1 - x0) / 2, Math.abs(z1 - z0) / 2, G._frame.rot, h, tag, base); } [x0, z0, x1, z1] = frameRect(x0, z0, x1, z1); }
  const o = { k: 'b', x0, z0, x1, z1, h, tag, base }; COLLIDERS.push(o); G.colGrid.insert(o, x0, z0, x1, z1); return o; }
/* caixa orientada: local (lx, lz) -> mundo (x + lx·c + lz·s, z − lx·s + lz·c) */
function addOBB(x, z, hx, hz, rot, h = 30, tag, base = -5) {
  const c = Math.cos(rot), s = Math.sin(rot), ex = Math.abs(hx * c) + Math.abs(hz * s), ez = Math.abs(hx * s) + Math.abs(hz * c);
  const o = { k: 'o', x, z, hx, hz, c, s, rot, h, tag, base, x0: x - ex, x1: x + ex, z0: z - ez, z1: z + ez };
  COLLIDERS.push(o); G.colGrid.insert(o, o.x0, o.z0, o.x1, o.z1); return o;
}
function obbLocal(o, x, z) { const dx = x - o.x, dz = z - o.z; return [dx * o.c - dz * o.s, dx * o.s + dz * o.c]; }
function addCircCol(x, z, r, h = 30, tag, base = -5) { [x, z] = fpt(x, z); return addCircCol0(x, z, r, h, tag, base); }
function addCircCol0(x, z, r, h = 30, tag, base = -5) { const o = { k: 'c', x, z, r, h, tag, base }; COLLIDERS.push(o); G.colGrid.insert(o, x - r, z - r, x + r, z + r); return o; }
function addSWRect(x0, z0, x1, z1, h = 0.15) {
  let o;
  if (G._frame && !frameAxis()) {
    const [cx, cz] = fpt((x0 + x1) / 2, (z0 + z1) / 2), rot = G._frame.rot, c = Math.cos(rot), sn = Math.sin(rot), hx = Math.abs(x1 - x0) / 2, hz = Math.abs(z1 - z0) / 2;
    const ex = Math.abs(hx * c) + Math.abs(hz * sn), ez = Math.abs(hx * sn) + Math.abs(hz * c);
    o = { obb: true, x: cx, z: cz, hx, hz, c, s: sn, h, x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez };
  } else { if (G._frame) [x0, z0, x1, z1] = frameRect(x0, z0, x1, z1); o = { x0, z0, x1, z1, h }; }
  SW_RECTS.push(o); G.swGrid.insert(o, o.x0, o.z0, o.x1, o.z1); return o;
}
function addSidewalk(x0, z0, x1, z1) { return addSWRect(x0, z0, x1, z1, 0.15); }

/* Resolve círculo vs colisores: devolve normal acumulada ou null */
const _q = [];
function collideCircle(p, r, yLevel, out) {
  G.colGrid.query(p.x, p.z, r + 2, _q);
  let hit = false; out.x = 0; out.z = 0; out.pen = 0;
  for (const o of _q) {
    if (o.off) continue;
    if (o.h !== undefined && yLevel > o.base + o.h) continue;
    if (o.k === 'b') {
      const cx = clamp(p.x, o.x0, o.x1), cz = clamp(p.z, o.z0, o.z1);
      let dx = p.x - cx, dz = p.z - cz; let d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        let d = Math.sqrt(d2), nx, nz, pen;
        if (d < 1e-4) { // dentro: sae polo lado máis próximo
          const l = p.x - o.x0, rr = o.x1 - p.x, t = p.z - o.z0, b = o.z1 - p.z, m = Math.min(l, rr, t, b);
          if (m === l) { nx = -1; nz = 0; pen = l + r; } else if (m === rr) { nx = 1; nz = 0; pen = rr + r; } else if (m === t) { nx = 0; nz = -1; pen = t + r; } else { nx = 0; nz = 1; pen = b + r; }
        } else { nx = dx / d; nz = dz / d; pen = r - d; }
        p.x += nx * pen; p.z += nz * pen; out.x += nx; out.z += nz; out.pen = Math.max(out.pen, pen); hit = true;
      }
    } else if (o.k === 'o') {
      const [lx, lz] = obbLocal(o, p.x, p.z), cx = clamp(lx, -o.hx, o.hx), cz = clamp(lz, -o.hz, o.hz);
      let dx = lx - cx, dz = lz - cz; const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        let d = Math.sqrt(d2), nx, nz, pen;
        if (d < 1e-4) { const l = lx + o.hx, rr = o.hx - lx, t = lz + o.hz, b = o.hz - lz, m = Math.min(l, rr, t, b);
          if (m === l) { nx = -1; nz = 0; pen = l + r; } else if (m === rr) { nx = 1; nz = 0; pen = rr + r; } else if (m === t) { nx = 0; nz = -1; pen = t + r; } else { nx = 0; nz = 1; pen = b + r; } }
        else { nx = dx / d; nz = dz / d; pen = r - d; }
        const wx = nx * o.c + nz * o.s, wz = -nx * o.s + nz * o.c;
        p.x += wx * pen; p.z += wz * pen; out.x += wx; out.z += wz; out.pen = Math.max(out.pen, pen); hit = true;
      }
    } else {
      const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), rr = r + o.r;
      if (d < rr && d > 1e-4) { const nx = dx / d, nz = dz / d, pen = rr - d; p.x += nx * pen; p.z += nz * pen; out.x += nx; out.z += nz; out.pen = Math.max(out.pen, pen); hit = true; }
    }
  }
  if (hit) { const l = Math.hypot(out.x, out.z) || 1; out.x /= l; out.z /= l; }
  return hit;
}
/* ¿bloquea un colisor o segmento A→B? (para a cámara) */
function segBlocked(ax, az, ay, bx, bz, by) {
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = lerp(ay, by, t);
    const c = G.colGrid.get(x, z); if (!c) continue;
    for (const o of c) {
      if (o.off || y > (o.base || 0) + o.h) continue;
      if (o.k === 'b') { if (x > o.x0 - .3 && x < o.x1 + .3 && z > o.z0 - .3 && z < o.z1 + .3) return t; }
      else if (o.k === 'o') { const [lx, lz] = obbLocal(o, x, z); if (Math.abs(lx) < o.hx + .3 && Math.abs(lz) < o.hz + .3) return t; }
      else if (Math.hypot(x - o.x, z - o.z) < o.r + .3) return t;
    }
  }
  return 1;
}

/* ---------- Xeometría: utilidades ---------- */
function mergeGeos(list) {
  let vC = 0, iC = 0, hasCol = false;
  for (const g of list) { vC += g.attributes.position.count; iC += g.index ? g.index.count : g.attributes.position.count; if (g.attributes.color) hasCol = true; }
  const pos = new Float32Array(vC * 3), nor = new Float32Array(vC * 3), uv = new Float32Array(vC * 2), col = hasCol ? new Float32Array(vC * 3) : null;
  const idx = vC > 65535 ? new Uint32Array(iC) : new Uint16Array(iC);
  let vo = 0, io = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    if (col) { if (g.attributes.color) col.set(g.attributes.color.array, vo * 3); else col.fill(1, vo * 3, (vo + n) * 3); }
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io++] = a[i] + vo; }
    else for (let i = 0; i < n; i++) idx[io++] = vo + i;
    vo += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e = new THREE.Euler(), _v3 = new THREE.Vector3(), _s3 = new THREE.Vector3();
function xform(g, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(rx, ry, rz); _q4.setFromEuler(_e); _m4.compose(_v3.set(x, y, z), _q4, _s3.set(sx, sy, sz)); g.applyMatrix4(_m4); return g;
}
function boxGeo(sx, sy, sz, tile) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (tile) {
    const uv = g.attributes.uv, dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile[0], uv.getY(i) * dims[f][1] / tile[1]); }
  }
  return g;
}
function colorize(g, c) {
  const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
/* tellado a catro augas */
function hipRoof(w, d, h, tile = 4, over = 0.45) {
  w += over * 2; d += over * 2;
  const swap = d > w; if (swap) { const t = w; w = d; d = t; }
  const hw = w / 2, hd = d / 2, rl = Math.max(0, hw - hd * 0.9);
  const P = [], U = [];
  const slope = Math.hypot(hd, h);
  const quad = (a, b, c, e) => { P.push(...a, ...b, ...c, ...a, ...c, ...e); };
  // fronte (+z)
  quad([-hw, 0, hd], [hw, 0, hd], [rl, h, 0], [-rl, h, 0]);
  U.push(0, 0, w / tile, 0, (hw + rl) / tile, slope / tile, 0, 0, (hw + rl) / tile, slope / tile, (hw - rl) / tile, slope / tile);
  quad([hw, 0, -hd], [-hw, 0, -hd], [-rl, h, 0], [rl, h, 0]);
  U.push(0, 0, w / tile, 0, (hw + rl) / tile, slope / tile, 0, 0, (hw + rl) / tile, slope / tile, (hw - rl) / tile, slope / tile);
  const sl2 = Math.hypot(hw - rl, h);
  P.push(hw, 0, hd, hw, 0, -hd, rl, h, 0); U.push(0, 0, d / tile, 0, d / 2 / tile, sl2 / tile);
  P.push(-hw, 0, -hd, -hw, 0, hd, -rl, h, 0); U.push(0, 0, d / tile, 0, d / 2 / tile, sl2 / tile);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.computeVertexNormals();
  if (swap) g.rotateY(Math.PI / 2);
  return g;
}

/* Lotes de xeometría por material → unha malla por material */
class Batch {
  constructor(mat, opts = {}) { this.mat = mat; this.list = []; this.cast = opts.cast !== false; this.recv = opts.recv !== false; }
  add(g) { this.list.push(g); return g; }
  build(scene) {
    if (!this.list.length) return null;
    // en bloques de ~60k vértices para non pasar de índices razoables
    const meshes = []; let cur = [], cnt = 0;
    const flush = () => { if (!cur.length) return; const m = new THREE.Mesh(mergeGeos(cur), this.mat); m.castShadow = this.cast; m.receiveShadow = this.recv; scene.add(m); meshes.push(m); cur = []; cnt = 0; };
    for (const g of this.list) { cur.push(g); cnt += g.attributes.position.count; if (cnt > 60000) flush(); }
    flush(); this.list = []; return meshes;
  }
}

/* ---------- Grafo viario (IA de tráfico e peóns) ---------- */
const NODES = []; const nodeMap = new Map();
function getNode(x, z) {
  const k = Math.round(x * 2) + ',' + Math.round(z * 2);
  let n = nodeMap.get(k); if (!n) { n = { id: NODES.length, x, z, edges: [] }; NODES.push(n); nodeMap.set(k, n); }
  return n;
}
function link(a, b, road) {
  if (a === b) return;
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const e1 = { to: b, road, len }, e2 = { to: a, road, len };
  e1.rev = e2; e2.rev = e1;
  if (road.ow === 1) e2.wrong = true; else if (road.ow === -1) e1.wrong = true;
  a.edges.push(e1); b.edges.push(e2);
}
let NODEGRID = null;
function buildGraph() {
  for (const r of ROADS) {
    if (r.type === 'track') continue;
    let prev = getNode(r.pts[0][0], r.pts[0][1]);
    // nodos intermedios cada ≤ 30 m (a IA vai en liña recta entre nodos)
    for (let i = 1; i < r.pts.length; i++) {
      const a = r.pts[i - 1], b = r.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 30));
      for (let k = 1; k <= n; k++) { const nd = getNode(lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)); link(prev, nd, r); prev = nd; }
    }
  }
  NODEGRID = new Grid(40);
  for (const n of NODES) NODEGRID.insert(n, n.x, n.z, n.x, n.z);
  const gate = G.castleGate || HILL;
  G.castleTopNode = nearestNode(gate.x, gate.z, n => n.edges.some(e => e.road.type === 'car'));
}
const _nq = [];
function nearestNode(x, z, filter) {
  let best = null, bd = 1e18;
  for (let rad = 40; rad <= 2600 && !best; rad *= 2) {
    if (!NODEGRID) break;
    NODEGRID.query(x, z, rad, _nq);
    for (const n of _nq) { if (filter && !filter(n)) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = n; } }
  }
  if (!best) for (const n of NODES) { if (filter && !filter(n)) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = n; } }
  return best;
}
/* camiño máis curto (Dijkstra con montículo binario) */
function pathTo(a, b, carOnly = true) {
  if (!a || !b) return null;
  const dist = new Map([[a, 0]]), prev = new Map(), heap = [[0, a]], done = new Set();
  const push = it => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [d0, n] = pop(); if (done.has(n)) continue; done.add(n); if (n === b) break;
    for (const e of n.edges) {
      if (carOnly && (e.road.type !== 'car' || e.blocked)) continue;
      const nd = d0 + e.len;
      if (nd < (dist.has(e.to) ? dist.get(e.to) : 1e12)) { dist.set(e.to, nd); prev.set(e.to, n); push([nd, e.to]); }
    }
  }
  if (!prev.has(b) && a !== b) return null;
  const p = [b]; let c = b; while (c !== a) { c = prev.get(c); p.unshift(c); }
  return p;
}

/* ---------- Zonas con nome ---------- */
function zoneName(x, z) {
  const dh = Math.hypot(x - HILL.x, z - HILL.z);
  if (dh < HILL.r0 + 4) return 'Castelo de San Vicente';
  for (const Zn of G.namedZones || []) if (inPoly(x, z, Zn.p)) return Zn.n;
  const b = bridgeAt(x, z); if (b) return b.r.name || 'Ponte sobre o Cabe';
  const nr = nearRoad(x, z, r => !!r.name && r.type !== 'track');
  if (nr.r && nr.d < nr.r.hw + nr.r.sw + 6) return nr.r.name;
  if (riverDistRaw(x, z) < RIVER_HW + 10) return 'Beira do río Cabe';
  if (dh < HILL.r1) return 'Monte de San Vicente';
  for (const a of AREAS) if (a.n && (a.t === 'park' || a.t === 'plaza' || a.t === 'grass' || a.t === 'stadium' || a.t === 'pitch')) { const bb = a.bb || (a.bb = polyBox(a.p)); if (x > bb.x0 && x < bb.x1 && z > bb.z0 && z < bb.z1 && inPoly(x, z, a.p)) return a.n; }
  if (nr.r && nr.d < 60) return nr.r.name;
  return isUrban(x, z) ? 'Monforte de Lemos' : 'Val de Lemos';
}

/* ---------- Texturas procedurais ---------- */
const TEX = {};
let MAXANISO = 4;
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, rep = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = MAXANISO; return t;
}
function noiseFill(ctx, w, h, base, amp, scale = 1, alpha = 1) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * amp; d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n, 0, 255); }
  ctx.putImageData(img, 0, 0);
}
function blotches(ctx, w, h, n, rMin, rMax, color, aMin = 0.03, aMax = 0.1) {
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h, r = RR(rMin, rMax);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    ctx.globalAlpha = RR(aMin, aMax); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // repetir nos bordos para que teselé
    for (const [ox, oy] of [[w, 0], [-w, 0], [0, h], [0, -h]]) { ctx.save(); ctx.translate(ox, oy); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
  }
  ctx.globalAlpha = 1;
}
/* mapa de normais a partir dun canvas de alturas */
function normalFrom(hc, strength = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = cnv(w, h), octx = out.getContext('2d'), img = octx.createImageData(w, h), d = img.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  return toTex(out, true, false);
}

function makeTextures(quality) {
  const S = quality === 'low' ? 256 : 512;
  // --- asfalto con liñas ---
  {
    const c = cnv(S, S), x = c.getContext('2d');
    x.fillStyle = '#4a4c50'; x.fillRect(0, 0, S, S); noiseFill(x, S, S, 0, 38);
    blotches(x, S, S, 30, 10, 60, '#2c2d30', 0.08, 0.2); blotches(x, S, S, 14, 10, 40, '#6a6a68', 0.05, 0.1);
    const hc = cnv(S, S), hx = hc.getContext('2d'); hx.drawImage(c, 0, 0);
    TEX.asphaltN = normalFrom(hc, 1.6);
    TEX.asphaltPlain = toTex(c);
    const c2 = cnv(S, S), x2 = c2.getContext('2d'); x2.drawImage(c, 0, 0);
    x2.fillStyle = 'rgba(235,235,225,.92)';
    x2.fillRect(S * 0.495, 0, S * 0.012, S * 0.55);               // liña central descontinua
    x2.fillRect(S * 0.06, 0, S * 0.012, S); x2.fillRect(S * 0.928, 0, S * 0.012, S); // bordos
    noiseFill(x2, S, S, 0, 10);
    TEX.road = toTex(c2);
  }
  // --- beirarrúa: lousas de granito ---
  {
    const c = cnv(S, S), x = c.getContext('2d');
    x.fillStyle = '#a9a59c'; x.fillRect(0, 0, S, S);
    const n = 4, s = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = RI(126, 156); x.fillStyle = `rgb(${v},${v - 3},${v - 9})`; x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
    noiseFill(x, S, S, 0, 30);
    const hc = cnv(S, S), hx = hc.getContext('2d'); hx.fillStyle = '#fff'; hx.fillRect(0, 0, S, S); hx.fillStyle = '#000';
    for (let i = 0; i <= n; i++) { hx.fillRect(i * s - 2, 0, 4, S); hx.fillRect(0, i * s - 2, S, 4); }
    TEX.sidewalk = toTex(c); TEX.sidewalkN = normalFrom(hc, 3);
  }
  // --- empedrado do Cardeal (granito) ---
  {
    const c = cnv(S, S), x = c.getContext('2d'), hc = cnv(S, S), hx = hc.getContext('2d');
    x.fillStyle = '#6e6a62'; x.fillRect(0, 0, S, S); hx.fillStyle = '#000'; hx.fillRect(0, 0, S, S);
    const rows = 10, rh = S / rows;
    for (let r = 0; r < rows; r++) {
      let px = -RR(0, 30);
      while (px < S) {
        const w = RR(rh * 1.2, rh * 2.2), v = RI(120, 170);
        x.fillStyle = `rgb(${v + 6},${v},${v - 8})`; x.beginPath(); x.roundRect ? x.roundRect(px + 2, r * rh + 2, w - 4, rh - 4, 5) : x.rect(px + 2, r * rh + 2, w - 4, rh - 4); x.fill();
        const g = hx.createRadialGradient(px + w / 2, r * rh + rh / 2, 2, px + w / 2, r * rh + rh / 2, w / 1.6); g.addColorStop(0, '#fff'); g.addColorStop(1, '#333');
        hx.fillStyle = g; hx.fillRect(px + 2, r * rh + 2, w - 4, rh - 4);
        px += w;
      }
    }
    noiseFill(x, S, S, 0, 26);
    TEX.cobble = toTex(c); TEX.cobbleN = normalFrom(hc, 4);
  }
  // --- herba ---
  {
    const c = cnv(S, S), x = c.getContext('2d');
    x.fillStyle = '#4f6b2e'; x.fillRect(0, 0, S, S);
    blotches(x, S, S, 50, 20, 90, '#6b8a3a', 0.1, 0.25); blotches(x, S, S, 40, 15, 70, '#3a5222', 0.1, 0.25); blotches(x, S, S, 10, 10, 40, '#7d7448', 0.05, 0.15);
    for (let i = 0; i < S * 30; i++) { const v = RI(-30, 30); x.fillStyle = `rgba(${90 + v},${120 + v},${50 + v / 2},.5)`; x.fillRect(R() * S, R() * S, 1, RR(2, 5)); }
    TEX.grass = toTex(c);
    const hc = cnv(S, S), hx = hc.getContext('2d'); hx.drawImage(c, 0, 0); TEX.grassN = normalFrom(hc, 1.2);
  }
  // --- grava dos camiños do parque ---
  {
    const c = cnv(S, S), x = c.getContext('2d');
    x.fillStyle = '#b8a67f'; x.fillRect(0, 0, S, S); noiseFill(x, S, S, 0, 55);
    blotches(x, S, S, 20, 10, 50, '#8f7d5a', 0.08, 0.18);
    TEX.gravel = toTex(c);
  }
  // --- pedra de cantería (castelo, ponte) ---
  {
    const c = cnv(S, S), x = c.getContext('2d'), hc = cnv(S, S), hx = hc.getContext('2d');
    x.fillStyle = '#5b5852'; x.fillRect(0, 0, S, S); hx.fillStyle = '#000'; hx.fillRect(0, 0, S, S);
    const rows = 8, rh = S / rows;
    for (let r = 0; r < rows; r++) {
      let px = (r % 2) * -rh * 0.7;
      while (px < S) {
        const w = RR(rh * 1.1, rh * 2.4), v = RI(118, 168), tint = RI(-8, 10);
        x.fillStyle = `rgb(${v + tint},${v},${v - 10 - tint})`; x.fillRect(px + 2, r * rh + 2, w - 4, rh - 4);
        hx.fillStyle = `rgb(${RI(150, 255)},0,0)`; hx.fillRect(px + 2, r * rh + 2, w - 4, rh - 4);
        px += w;
      }
    }
    noiseFill(x, S, S, 0, 34); blotches(x, S, S, 26, 10, 60, '#2f3a22', 0.06, 0.16); // musgo
    blotches(x, S, S, 18, 10, 50, '#d8d0bc', 0.05, 0.12);
    TEX.stone = toTex(c); TEX.stoneN = normalFrom(hc, 3);
  }
  // --- tella (vermella) e lousa ---
  {
    const c = cnv(S / 2, S / 2), x = c.getContext('2d'), s = S / 2, rows = 12, rh = s / rows;
    x.fillStyle = '#7a3a26'; x.fillRect(0, 0, s, s);
    for (let r = 0; r < rows; r++) for (let i = 0; i < 10; i++) {
      const v = RI(-20, 20), w = s / 10;
      const g = x.createLinearGradient(i * w, 0, i * w + w, 0); g.addColorStop(0, `rgb(${120 + v},${52 + v / 2},${34})`); g.addColorStop(.5, `rgb(${160 + v},${74 + v / 2},${46})`); g.addColorStop(1, `rgb(${110 + v},${46 + v / 2},${30})`);
      x.fillStyle = g; x.fillRect(i * w + (r % 2) * w / 2, r * rh, w - 1, rh - 2);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(i * w + (r % 2) * w / 2, r * rh + rh - 3, w, 2);
    }
    blotches(x, s, s, 20, 5, 30, '#3d3a2a', 0.1, 0.3);
    TEX.tile = toTex(c);
    const hc = cnv(s, s), hx = hc.getContext('2d'); hx.drawImage(c, 0, 0); TEX.tileN = normalFrom(hc, 2.5);
    const c2 = cnv(S / 2, S / 2), x2 = c2.getContext('2d');
    x2.fillStyle = '#2b2f35'; x2.fillRect(0, 0, s, s);
    for (let r = 0; r < 14; r++) for (let i = 0; i < 8; i++) { const v = RI(36, 62); x2.fillStyle = `rgb(${v},${v + 3},${v + 8})`; x2.fillRect(i * s / 8 + (r % 2) * s / 16, r * s / 14, s / 8 - 1, s / 14 - 1); }
    noiseFill(x2, s, s, 0, 14);
    TEX.slate = toTex(c2);
  }
  // --- auga: mapa de normais animado ---
  {
    const s = 256, hc = cnv(s, s), hx = hc.getContext('2d');
    hx.fillStyle = '#808080'; hx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { const xx = R() * s, yy = R() * s, r = RR(6, 26); const g = hx.createRadialGradient(xx, yy, 0, xx, yy, r); const c = R() < .5 ? '255,255,255' : '0,0,0'; g.addColorStop(0, `rgba(${c},.18)`); g.addColorStop(1, `rgba(${c},0)`); hx.fillStyle = g; for (const [ox, oy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) hx.fillRect(xx - r + ox, yy - r + oy, r * 2, r * 2); }
    TEX.waterN = normalFrom(hc, 6);
  }
  // --- fachadas ---
  TEX.facades = [
    makeFacade('blanco'), makeFacade('crema'), makeFacade('ocre'), makeFacade('pedra'), makeFacade('galeria'), makeFacade('moderno'), makeFacade('azul'),
  ];
  TEX.shops = makeShops(false); TEX.bars = makeShops(true);
  TEX.estacion = makeStationFacade();
  TEX.colegio = makeFacade('colexio');
}

/* Fachada: módulo de 4 vans × 4 andares (12.8 m × 12.4 m) */
const FAC_TILE = [12.8, 12.4];
function makeFacade(style) {
  const S = 512, c = cnv(S, S), x = c.getContext('2d'), e = cnv(S, S), ex = e.getContext('2d'), hc = cnv(S, S), hx = hc.getContext('2d');
  const walls = { blanco: '#e9e6de', crema: '#e3d3b0', ocre: '#cf9f5c', pedra: '#8d877b', galeria: '#efeeea', moderno: '#b9b2a6', azul: '#b9c8cc', colexio: '#9c9584' };
  x.fillStyle = walls[style]; x.fillRect(0, 0, S, S); hx.fillStyle = '#808080'; hx.fillRect(0, 0, S, S);
  ex.fillStyle = '#000'; ex.fillRect(0, 0, S, S);
  if (style === 'pedra' || style === 'colexio') {
    const rows = 26, rh = S / rows;
    for (let r = 0; r < rows; r++) { let px = -(r % 2) * 20; while (px < S) { const w = RR(rh * 1.3, rh * 2.6), v = RI(-22, 18); x.fillStyle = `rgb(${141 + v},${135 + v},${123 + v - 4})`; x.fillRect(px + 1, r * rh + 1, w - 2, rh - 2); hx.fillStyle = `rgb(${RI(150, 230)},0,0)`; hx.fillRect(px + 1, r * rh + 1, w - 2, rh - 2); px += w; } }
  } else if (style === 'moderno') {
    for (let r = 0; r < 40; r++) for (let i = 0; i < 24; i++) { const v = RI(-14, 14); x.fillStyle = `rgb(${158 + v},${96 + v},${74 + v})`; x.fillRect(i * 22 + (r % 2) * 11, r * 13, 21, 12); }
  }
  noiseFill(x, S, S, 0, style === 'pedra' ? 18 : 12);
  // manchas de humidade galega
  blotches(x, S, S, 14, 20, 80, '#4b4a40', 0.03, 0.08);
  const cw = S / 4, ch = S / 4;
  for (let fy = 0; fy < 4; fy++) {
    // cornixa de granito entre andares
    if (style !== 'moderno') { x.fillStyle = 'rgba(150,145,135,.9)'; x.fillRect(0, fy * ch + ch - 6, S, 6); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, fy * ch + ch, S, 3); hx.fillStyle = '#fff'; hx.fillRect(0, fy * ch + ch - 6, S, 6); }
    for (let fx = 0; fx < 4; fx++) {
      const X = fx * cw, Y = fy * ch, lit = R() < 0.42, warm = R();
      if (style === 'galeria') {
        // galería acristalada branca (típica de Monforte)
        const gx = X + 6, gy = Y + 14, gw = cw - 12, gh = ch - 26;
        x.fillStyle = '#fbfbf8'; x.fillRect(gx - 4, gy - 4, gw + 8, gh + 10);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
          const pw = (gw - 10) / 4, ph = (gh - 8) / 3, px = gx + 2 + i * (pw + 2), py = gy + 2 + j * (ph + 2);
          const g = x.createLinearGradient(px, py, px + pw, py + ph); g.addColorStop(0, '#5d7383'); g.addColorStop(.45, '#a9bcc7'); g.addColorStop(1, '#33424d');
          x.fillStyle = g; x.fillRect(px, py, pw, ph);
          if (lit) { ex.fillStyle = `rgba(255,${190 + warm * 40},${110 + warm * 50},${0.6 + R() * .4})`; ex.fillRect(px, py, pw, ph); }
        }
        hx.fillStyle = '#fff'; hx.fillRect(gx - 4, gy - 4, gw + 8, 6); hx.fillRect(gx - 4, gy + gh, gw + 8, 6);
        continue;
      }
      const ww = style === 'moderno' ? cw - 18 : 52, wh = style === 'moderno' ? 58 : 80;
      const wx = X + (cw - ww) / 2, wy = Y + (style === 'moderno' ? 30 : 22);
      // marco de cantería
      if (style !== 'moderno') { x.fillStyle = style === 'pedra' || style === 'colexio' ? '#a59d8c' : '#9f998d'; x.fillRect(wx - 8, wy - 8, ww + 16, wh + 16); hx.fillStyle = '#fff'; hx.fillRect(wx - 8, wy - 8, ww + 16, wh + 16); }
      // vidro
      const g = x.createLinearGradient(wx, wy, wx + ww * .8, wy + wh); g.addColorStop(0, '#41505b'); g.addColorStop(.5, '#8ea2ae'); g.addColorStop(1, '#25303a');
      x.fillStyle = g; x.fillRect(wx, wy, ww, wh); hx.fillStyle = '#202020'; hx.fillRect(wx, wy, ww, wh);
      // cortinas
      if (R() < .5) { x.fillStyle = pick(['rgba(240,232,214,.75)', 'rgba(200,180,150,.7)', 'rgba(230,230,230,.7)']); x.fillRect(wx, wy, ww * RR(.2, .45), wh); }
      // carpintería
      const fc = style === 'ocre' || style === 'pedra' || style === 'colexio' ? '#5c3a22' : (style === 'moderno' ? '#3a3a3a' : '#f4f4f0');
      x.fillStyle = fc; x.fillRect(wx, wy, ww, 4); x.fillRect(wx, wy + wh - 4, ww, 4); x.fillRect(wx, wy, 4, wh); x.fillRect(wx + ww - 4, wy, 4, wh); x.fillRect(wx + ww / 2 - 2, wy, 4, wh); x.fillRect(wx, wy + wh * .35, ww, 3);
      // contraventás ou persiana
      if (style !== 'moderno' && R() < .35) { x.fillStyle = pick(['#3c5e48', '#5d3a2a', '#e9e7e1', '#3b4a63']); const sh = RR(.2, .7) * wh; x.fillRect(wx, wy, ww, sh); for (let k = 0; k < sh; k += 4) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(wx, wy + k, ww, 1); } }
      // balcón de ferro
      if (fy > 0 && (style === 'blanco' || style === 'crema' || style === 'azul' || style === 'ocre') && R() < .45) {
        x.fillStyle = '#9b958b'; x.fillRect(wx - 12, wy + wh + 2, ww + 24, 6);
        x.fillStyle = '#1f1f1f'; x.fillRect(wx - 12, wy + wh - 24, ww + 24, 3); for (let k = 0; k < ww + 24; k += 5) x.fillRect(wx - 12 + k, wy + wh - 24, 1.5, 26);
        hx.fillStyle = '#fff'; hx.fillRect(wx - 12, wy + wh + 2, ww + 24, 6);
      }
      if (lit) { const a = 0.55 + R() * .45; ex.fillStyle = warm < .75 ? `rgba(255,${200 + warm * 30},${120 + warm * 60},${a})` : `rgba(170,200,255,${a})`; ex.fillRect(wx + 4, wy + 4, ww - 8, wh - 8); }
    }
  }
  const t = toTex(c), em = toTex(e);
  return { map: t, emissive: em, normal: normalFrom(hc, 2), style };
}
/* Baixos comerciais: 2 locais por módulo de 10 m × 3.6 m */
const SHOP_TILE = [10, 3.6];
function makeShops(bars) {
  const W = 512, H = 192, c = cnv(W, H), x = c.getContext('2d'), e = cnv(W, H), ex = e.getContext('2d');
  x.fillStyle = bars ? '#8a8072' : '#9a958b'; x.fillRect(0, 0, W, H); noiseFill(x, W, H, 0, 18);
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  const cols = ['#7a1f3d', '#24425e', '#2f5a3a', '#8a5a1c', '#3a3a3a', '#6b2c1c', '#1e5f66'];
  for (let i = 0; i < 2; i++) {
    const X = i * W / 2 + 14, w = W / 2 - 28;
    // granito arredor
    x.fillStyle = '#b3ab9b'; x.fillRect(X - 8, 20, w + 16, H - 20);
    const closed = !bars && R() < .1;
    if (closed) {
      x.fillStyle = '#8c8f93'; x.fillRect(X, 34, w, H - 34); for (let k = 34; k < H; k += 6) { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(X, k, w, 2); }
      // pintada
      x.fillStyle = 'rgba(40,40,40,.5)'; x.font = 'bold 22px sans-serif'; x.fillText(pick(['SE ALUGA', 'SE VENDE', '']), X + 40, 110);
    } else {
      const g = x.createLinearGradient(X, 40, X + w, H); g.addColorStop(0, bars ? '#3a2a1e' : '#27323a'); g.addColorStop(.5, bars ? '#6b4a2c' : '#5f7381'); g.addColorStop(1, '#1d2328');
      x.fillStyle = g; x.fillRect(X, 40, w, H - 40);
      // interior
      if (bars) { x.fillStyle = 'rgba(255,190,110,.35)'; x.fillRect(X, 40, w, H - 40); x.fillStyle = '#2a1d14'; x.fillRect(X + 10, 120, w - 20, 26); for (let k = 0; k < 6; k++) { x.fillStyle = pick(['#7a1f3d', '#355f2e', '#c7a14a']); x.fillRect(X + 20 + k * 30, 70, 8, 22); } }
      x.fillStyle = '#2b2b2b'; x.fillRect(X, 40, w, 5); x.fillRect(X + w * .62, 40, 5, H - 40); // porta
      ex.fillStyle = bars ? 'rgba(255,170,90,.95)' : `rgba(255,${220 + RI(0, 30)},${180 + RI(0, 60)},${R() < .6 ? .8 : .15})`; ex.fillRect(X + 2, 46, w - 4, H - 48);
    }
    // letreiro
    x.fillStyle = pick(cols); x.fillRect(X - 8, 4, w + 16, 24);
  }
  return { map: toTex(c), emissive: toTex(e) };
}
function makeStationFacade() {
  /* segundo Street View: muro encalado branco, recercados e pilastras de granito, carpintaría azul */
  const W = 512, H = 256, c = cnv(W, H), x = c.getContext('2d'), e = cnv(W, H), ex = e.getContext('2d');
  x.fillStyle = '#eceae3'; x.fillRect(0, 0, W, H); noiseFill(x, W, H, 0, 8); ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  blotches(x, W, H, 8, 20, 70, '#8a8a80', .02, .05);
  const GR = '#b4a582', BL = '#2c5c9e';
  for (let f = 0; f < 2; f++) for (let i = 0; i < 4; i++) {
    const w = 52, h = f ? 78 : 72, X = i * 128 + 38, Y = f ? 148 : 32;
    // recercado de granito con arco rebaixado
    x.fillStyle = GR; x.beginPath(); x.moveTo(X - 8, Y + h + 6); x.lineTo(X - 8, Y + 12); x.quadraticCurveTo(X + w / 2, Y - 14, X + w + 8, Y + 12); x.lineTo(X + w + 8, Y + h + 6); x.fill();
    if (!f) { x.fillStyle = '#9d8f6e'; x.fillRect(X - 12, Y + h + 2, w + 24, 7); } // peitoril
    // carpintaría azul e vidro
    x.fillStyle = BL; x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X, Y + 14); x.quadraticCurveTo(X + w / 2, Y - 4, X + w, Y + 14); x.lineTo(X + w, Y + h); x.fill();
    const g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, '#22303c'); g.addColorStop(.5, '#6f8796'); g.addColorStop(1, '#1d262e');
    x.fillStyle = g; x.fillRect(X + 5, Y + 16, w / 2 - 7, h - 20); x.fillRect(X + w / 2 + 2, Y + 16, w / 2 - 7, h - 20);
    x.fillStyle = BL; x.fillRect(X + 5, Y + 16 + (h - 20) * 0.45, w - 10, 3);
    if (f && i % 2 === 1) { x.fillStyle = BL; x.fillRect(X + 4, Y + 16, w - 8, h - 20); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(X + w / 2 - 1, Y + 16, 2, h - 20); } // portas
    if (R() < .65) { ex.fillStyle = 'rgba(255,220,160,.8)'; ex.fillRect(X + 5, Y + 16, w - 10, h - 20); }
  }
  // imposta entre andares, cornixa, zócalo e pilastras de granito
  x.fillStyle = GR; x.fillRect(0, 124, W, 9); x.fillRect(0, 0, W, 9); x.fillStyle = '#a39470'; x.fillRect(0, H - 12, W, 12);
  x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, 133, W, 3);
  for (let i = 0; i <= 4; i++) { x.fillStyle = GR; x.fillRect(i * 128 - 7, 0, 14, H); }
  return { map: toTex(c), emissive: toTex(e) };
}
/* Texto nun canvas (letreiros) */
function textTex(text, opts = {}) {
  const w = opts.w || 512, h = opts.h || 128, c = cnv(w, h), x = c.getContext('2d');
  x.fillStyle = opts.bg || '#111'; x.fillRect(0, 0, w, h);
  if (opts.border) { x.strokeStyle = opts.border; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); }
  x.fillStyle = opts.fg || '#fff'; x.font = `${opts.weight || 700} ${opts.size || 64}px ${opts.font || '"Big Shoulders Display", "Arial Narrow", sans-serif'}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opts.glow) { x.shadowColor = opts.fg; x.shadowBlur = 18; }
  x.fillText(text, w / 2, h / 2 + (opts.dy || 0));
  if (opts.sub) { x.font = `500 ${Math.round((opts.size || 64) * .38)}px Barlow, sans-serif`; x.fillText(opts.sub, w / 2, h * .82); }
  return toTex(c, false);
}
