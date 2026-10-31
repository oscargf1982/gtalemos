'use strict';
/* GTA LEMOS 27400 · retoques ao plano OSM antes de construír as rúas:
   a Rúa de Rosalía de Castro sae da Praza da Estación cara ao norte, ao
   carón das vías (no recorte orixinal só quedaba un anaco de 7 m) */
(function () {
  const r = OSM.roads.find(q => q.n === 'Rúa de Rosalía de Castro');
  if (r) r.p = [[732, -624], [735, -631], [745, -660], [753, -688], [759, -714]];
})();
/* Edificios: substitúense os de OSM sen nome pola volumetría elaborada con
   datos do Catastro (planta real e número de plantas). Mantéñense os edificios
   singulares con nome de OSM (igrexas, Concello, castelo...). */
(function () {
  if (typeof CATASTRO === 'undefined') return;
  const named = OSM.bldgs.filter(b => b.n);
  const pip = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const USE = ['', '', 'industrial', 'industrial', 'commercial'];
  const out = named.slice();
  // mostras do eixo das rúas: un edificio que as tape (soportais, desaxustes) non se constrúe
  const RG = new Map(), key = (x, z) => Math.floor(x / 20) + ',' + Math.floor(z / 20);
  for (const r of OSM.roads) { if (r.k !== 'car' && r.k !== 'ped') continue; const p = r.p; for (let i = 1; i < p.length; i++) { const [ax, az] = p[i - 1], [bx, bz] = p[i], L = Math.hypot(bx - ax, bz - az); for (let s = 0; s <= L; s += 1.5) { const x = ax + (bx - ax) * s / L, z = az + (bz - az) * s / L, k = key(x, z); if (!RG.has(k)) RG.set(k, []); RG.get(k).push(x, z); } } }
  const crossesRoad = P => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let gx = Math.floor(x0 / 20); gx <= Math.floor(x1 / 20); gx++) for (let gz = Math.floor(z0 / 20); gz <= Math.floor(z1 / 20); gz++) { const c = RG.get(gx + ',' + gz); if (!c) continue; for (let i = 0; i < c.length; i += 2) { const x = c[i], z = c[i + 1]; if (x > x0 && x < x1 && z > z0 && z < z1 && pip(x, z, P)) return true; } }
    return false; };
  for (const r of CATASTRO) {
    const [f, u, dec] = r, P = []; for (let i = 3; i < r.length; i += 2) P.push([r[i], r[i + 1]]);
    let cx = 0, cz = 0; for (const [x, z] of P) { cx += x; cz += z; } cx /= P.length; cz /= P.length;
    if (named.some(b => pip(cx, cz, b.p)) || crossesRoad(P)) continue;
    out.push({ p: P, lv: Math.min(f, 14), b: USE[u] || (f >= 4 ? 'apartments' : 'house'), y: dec * 10, cat: 1 });
  }
  OSM.bldgs = out; OSM.catastro = true;
})();
