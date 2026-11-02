'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Fachadas singulares pintadas a man (lenzo)
   Cada entrada sitúase nun portal do Catastro (ou nun punto) e
   substitúe a fachada que dá á rúa dese edificio. Os debuxos son
   recreacións propias a partir de fotos de referencia do autor.
   ========================================================== */
const FACHADAS = [];
(function () {
  const ad = (rua, n) => { if (typeof ENDEREZOS === 'undefined') return null; for (const [x, z, nn, si, e] of ENDEREZOS.a) if (nn === n && ENDEREZOS.r[si] === rua) return [x / 10, z / 10]; return null; };
  const DC = 'Rúa do Doutor Casares';
  const add = (id, at, draw, o = {}) => { if (at) FACHADAS.push(Object.assign({ id, at, draw }, o)); };
  // ---- utilidades de debuxo en metros (orixe abaixo á esquerda, y cara arriba) ----
  // P = { x: ctx, L, H, rect(x,y,w,h,c), line(...), win(...), door(...), rail(...), txt(...), blocks(...) }
  add('casares211', ad(DC, '211'), P => { // casa vermella de dúas plantas con tres arcos
    const { L, H } = P, g = H * 0.45, f1 = H * 0.8, red = '#a3262a', cr = '#eadcc0';
    P.rect(0, 0, L, H, red);
    P.rect(0, 0, 0.35, H, cr); P.rect(L - 0.35, 0, 0.35, H, cr);
    P.rect(0, g - 0.18, L, 0.22, cr); P.rect(0, f1 - 0.1, L, 0.25, cr); P.rect(0, H - 0.18, L, 0.18, cr);
    for (const k of [0.25, 0.5, 0.75]) { const cx = L * k; P.rect(cx - 0.3, f1 + 0.25, 0.6, H - f1 - 0.45, red); P.rect(cx - 0.32, f1 + 0.4, 0.04, 0.2, cr); // rombos do peitoril
      P.x.save(); P.x.strokeStyle = cr; P.x.lineWidth = 0.08; P.x.beginPath(); const yy = (f1 + H) / 2; P.x.moveTo(cx - 0.45, yy); P.x.lineTo(cx, yy + 0.18); P.x.lineTo(cx + 0.45, yy); P.x.lineTo(cx, yy - 0.18); P.x.closePath(); P.x.stroke(); P.x.restore(); }
    for (const [k, w] of [[0.2, 1.0], [0.5, 1.7], [0.8, 1.0]]) { const cx = L * k, h = g - 0.6; P.rect(cx - w / 2 - 0.25, 0, w + 0.5, h + 0.3, cr); P.door(cx - w / 2, 0.15, w, h - 0.15, '#5b3d27', { arch: true, transom: '#2a2a2a' }); }
    for (const k of [0.25, 0.5, 0.75]) P.win(L * k - 0.5, g + 0.35, 1.0, f1 - g - 0.7, { frame: cr, glass: '#3a4752', blind: '#e8e4dc' });
    P.rail(L * 0.12, L * 0.88, g + 0.1, 0.9, '#1d1d1d', cr);
    P.rect(0, 0, L, 0.15, '#7d7a72');
  });
  add('padel', (() => { const a = ad(DC, '211'), b = ad(DC, '213'); if (!a || !b) return null; const dx = a[0] - b[0], dz = a[1] - b[1], l = Math.hypot(dx, dz); return [a[0] + dx / l * 9, a[1] + dz / l * 9]; })(), P => {
    const { L, H } = P, g = Math.min(3.4, H * 0.5);
    P.rect(0, 0, L, H, '#e6e8ea'); for (let x = 0; x < L; x += 0.25) P.rect(x, g, 0.05, H - g, 'rgba(0,0,0,.08)');
    P.blocks(0, 0, L, g, '#9a9a96', 0.4, 0.2);
    P.rect(L * 0.08, 0.1, L * 0.3, g - 0.4, '#d8dad6'); P.rect(L * 0.08, 0.1, 0.04, g - 0.4, '#aaa');
    P.win(L * 0.62, g - 1.6, 0.9, 1.0, { frame: '#d8d8d4', glass: '#2f3a42' });
    P.txt(L * 0.5, g + (H - g) * 0.55, Math.min(1.1, (H - g) * 0.45), 'PÁDEL', '#1f5f9f');
  });
  add('casares176', ad(DC, '176'), P => { // casa vella amarela, tres portas e tres balcóns
    const { L, H } = P, g = H * 0.48, y = '#d8c79a', cr = '#c9bd98';
    P.rect(0, 0, L, H, y); P.rect(0, H - 0.5, L, 0.5, '#bdb18c'); P.rect(0, g - 0.1, L, 0.15, cr); P.rect(0, 0, L, 0.6, '#b9ad8a');
    for (const k of [1 / 6, 0.5, 5 / 6]) { const cx = L * k;
      P.rect(cx - 0.65, 0.1, 1.3, g - 0.6, '#d9d2bc'); P.door(cx - 0.5, 0.15, 1.0, g - 0.9, '#cfd4d0', { transom: '#444', panels: true });
      P.win(cx - 0.5, g + 0.3, 1.0, H - g - 1.3, { frame: '#d9d2bc', glass: '#9fb2bd', shutters: '#c8cfcc' });
      P.rail(cx - 0.75, cx + 0.75, g + 0.25, 0.85, '#2b2b2b', '#bdb19a'); }
  });
  const pois = (t) => (typeof OSM !== 'undefined' ? OSM.pois.find(p => p.n === t) : null);
  add('peluqueria', (pois('A. Internacional') || {}).p, P => { // catro plantas crema con marcos granate
    const { L, H } = P, g = 3.4, cr = '#ead9b8', mr = '#8a2a20', nf = Math.max(1, Math.round((H - g) / 2.9)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, cr); P.rect(0, 0, L, 0.6, '#9a2b22');
    for (let i = 0; i < nf; i++) for (const k of [0.3, 0.72]) P.win(L * k - 0.65, g + i * fh + 0.6, 1.3, fh - 1.0, { frame: mr, glass: '#55646f', blind: '#eeeeea', fw: 0.14 });
    P.rect(L * 0.08, 0.6, L * 0.5, g - 1.1, '#e3c21c'); P.rect(L * 0.1, 0.65, L * 0.46, g - 1.25, '#5b6a73'); for (const k of [0.25, 0.4]) P.rect(L * k, 0.65, 0.06, g - 1.25, '#e3c21c');
    P.awning(L * 0.06, L * 0.6, g - 0.5, '#efe7d2', '#7a7a70', 'A. INTERNACIONAL');
    P.door(L * 0.68, 0.6, 0.9, 2.3, '#f2f2ee', { glass: true });
  }, { r: 14 });
  add('zapataria', (pois('Calza2 Kómodos') || {}).p, P => {
    const { L, H } = P, g = 3.4, cr = '#e8cfa4', fr = '#b8642e', nf = Math.max(1, Math.round((H - g) / 2.9)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, cr); P.rect(0, 0, L, 0.5, '#b8642e'); P.rect(0, H - 0.4, L, 0.4, '#c98a52');
    for (let i = 0; i < nf; i++) for (const k of [0.22, 0.5, 0.78]) P.win(L * k - 0.45, g + i * fh + 0.6, 0.9, fh - 1.0, { frame: fr, glass: '#55646f', blind: '#f0ece2', fw: 0.12 });
    P.rect(L * 0.1, 0.5, L * 0.55, g - 1.0, '#cfcfc8'); P.rect(L * 0.13, 0.55, L * 0.49, g - 1.2, '#3f4a50');
    P.awning(L * 0.08, L * 0.67, g - 0.45, '#1f6b3a', '#0f3d20', 'CALZA2 KÓMODOS', '#f4f0e0');
    P.door(L * 0.75, 0.5, 0.9, 2.3, '#c9c3b5', { glass: true });
  }, { r: 14 });
  add('casares245', ad(DC, '245'), P => { // casa verde oliva con galería en bow-window
    const { L, H } = P, ol = '#9c9a4e', cr = '#e3dfc0', g = H * 0.33, f1 = H * 0.66;
    P.rect(0, 0, L, H, ol); P.rect(0, 0, L, 0.5, '#7f7c3c');
    for (const y of [g, f1]) P.rect(0, y - 0.12, L, 0.2, cr); P.rect(0, H - 0.3, L, 0.3, cr);
    const bx0 = L * 0.05, bx1 = L * 0.4; // galería
    for (const [y0, y1] of [[g, f1], [f1, H - 0.3]]) { P.rect(bx0, y0 + 0.2, bx1 - bx0, y1 - y0 - 0.3, '#aeb06a'); for (let i = 0; i < 3; i++) { const w = (bx1 - bx0) / 3; P.win(bx0 + i * w + 0.12, y0 + 0.45, w - 0.24, y1 - y0 - 0.9, { frame: cr, glass: '#7f9fb0', fw: 0.1 }); } }
    for (const k of [0.55, 0.78, 0.93]) { P.win(L * k - 0.45, g + 0.4, 0.9, f1 - g - 0.8, { frame: cr, glass: '#7f9fb0', blind: '#e9e9e2' }); P.win(L * k - 0.42, f1 + 0.4, 0.84, H - f1 - 1.0, { frame: cr, glass: '#7f9fb0' }); }
    P.rail(L * 0.48, L * 0.98, f1 + 0.05, 0.9, '#2a2a2a', cr);
    for (const [k, w, garage] of [[0.1, 0.8, 0], [0.25, 1.8, 1], [0.42, 0.9, 0], [0.6, 0.9, 0], [0.75, 1.0, 0], [0.9, 1.0, 0]]) P.door(L * k - w / 2, 0.5, w, g - 1.0, '#9fb0b8', { transom: '#556', panels: !garage, glass: !garage });
  });
  add('casares188', ad(DC, '188'), P => { // concesionario: escaparates e persiana
    const { L, H } = P, g = Math.min(3.6, H * 0.55);
    P.rect(0, 0, L, H, '#b5aa98'); P.rect(0, g, L, H - g, '#a69b88');
    P.rect(0, g - 0.75, L, 0.7, '#22357a'); P.txt(L * 0.5, g - 0.4, 0.38, 'ESPECIALIDAD EN DEPORTIVOS, TODOTERRENOS Y FURGONETAS', '#f0f0f0', L * 0.95);
    P.rect(L * 0.05, 0.2, L * 0.35, g - 1.1, '#34414a'); P.rect(L * 0.5, 0.1, L * 0.42, g - 1.0, '#8d8f8e'); for (let y = 0.3; y < g - 1; y += 0.12) P.rect(L * 0.5, y, L * 0.42, 0.03, 'rgba(0,0,0,.2)');
    for (const k of [0.3, 0.7]) P.win(L * k - 0.45, g + 0.5, 0.9, H - g - 1.0, { frame: '#9a8f7c', glass: '#3d4850' });
  });
  add('casares190', ad(DC, '190'), P => { const { L, H } = P, g = H * 0.5;
    P.rect(0, 0, L, H, '#e8e4dc'); P.rect(0, 0, L, 0.9, '#9aa1a6');
    for (const k of [0.3, 0.7]) P.win(L * k - 0.5, g + 0.4, 1.0, H - g - 1.0, { frame: '#d8d4cc', glass: '#7d93a0', shutters: '#8fa3b4' });
    P.win(L * 0.3 - 0.55, 0.9, 1.1, g - 1.4, { frame: '#d8d4cc', glass: '#8fa3b4', shutters: '#8fa3b4' }); P.door(L * 0.7 - 0.5, 0.05, 1.0, g - 0.6, '#8fa3b4', { panels: true });
  });
  add('casares192', ad(DC, '192'), P => { const { L, H } = P;
    P.rect(0, 0, L, H, '#ddd6c8'); P.rect(0, 0, L, 0.9, '#8a4e32'); for (let i = 0; i < 40; i++) P.rect(Math.random() * L, Math.random() * H, 0.3, 0.2, 'rgba(160,120,90,.25)');
    P.win(L * 0.3 - 0.45, 1.0, 0.9, 1.3, { frame: '#d8d0c0', glass: '#5a3a24', shutters: '#6b4428' }); P.door(L * 0.68 - 0.45, 0.05, 0.9, Math.min(2.3, H - 0.4), '#6b4428', { panels: true });
  });
  add('casares194', ad(DC, '194'), P => { const { L, H } = P;
    P.rect(0, 0, L, H, '#b0302c'); P.rect(0, 0, L, 0.6, '#7d7b77');
    P.rect(L * 0.2 - 0.55, 0.05, 1.1, Math.min(2.4, H - 0.3), '#e6c34a'); P.door(L * 0.2 - 0.45, 0.05, 0.9, Math.min(2.3, H - 0.4), '#f2f2ee', { grille: true });
    P.rect(L * 0.62 - 0.7, 0.85, 1.4, 1.4, '#e6c34a'); P.win(L * 0.62 - 0.6, 0.95, 1.2, 1.2, { frame: '#f4f4f0', glass: '#4b5a64', blind: '#eeeeea' });
  });
  add('casares196', ad(DC, '196'), P => { const { L, H } = P, g = Math.min(2.8, H * 0.6);
    P.rect(0, 0, L, H, '#e6e2da'); P.rect(0, 0, L, 0.6, '#c9a6a0');
    for (const k of [0.25, 0.5, 0.75]) P.win(L * k - 0.4, g + 0.2, 0.8, Math.max(0.6, H - g - 0.5), { frame: '#d8d4cc', glass: '#7d93a0', shutters: '#8fa3b4' });
    P.win(L * 0.3 - 0.5, 0.8, 1.0, 1.4, { frame: '#d8d4cc', glass: '#30353a', grille: true }); P.door(L * 0.72 - 0.75, 0.05, 1.5, g - 0.3, '#7a4a2a', { panels: true });
  });
  add('coruna32', ad('Rúa da Coruña', '32'), P => { // gris escuro con miradoiros curvos brancos; taller de motos no baixo
    const { L, H } = P, g = 3.5, nf = Math.max(1, Math.round((H - g) / 2.9)), fh = (H - g) / nf, dk = '#3f4348';
    P.rect(0, 0, L, H, dk); P.rect(0, 0, L, g, '#e9e9e4'); P.rect(0, g - 0.15, L, 0.2, '#f4f4f0');
    for (let i = 0; i < nf; i++) { const y = g + i * fh;
      P.rect(0, y, L, 0.28, '#f1f1ec');
      for (const [a, b] of [[0.02, 0.48], [0.52, 0.98]]) { P.rect(L * a, y + 0.28, L * (b - a), 0.35, '#55595e'); for (let k = 0; k < 4; k++) { const w = L * (b - a) / 4; P.win(L * a + k * w + 0.12, y + 0.75, w - 0.24, fh - 1.15, { frame: '#f4f4f0', glass: '#6c7a84', blind: '#f0f0ea', fw: 0.08 }); } }
    }
    P.rect(L * 0.02, g - 1.05, L * 0.3, 0.75, '#f6f6f2'); P.txt(L * 0.17, g - 0.67, 0.42, 'MOTO-MECÁNICA CÉSAR', '#d0251f', L * 0.29);
    P.rect(L * 0.02, 0.1, L * 0.16, g - 1.3, '#3a68b8'); P.rect(L * 0.03, 0.15, L * 0.14, g - 1.4, '#2d3640');
    P.door(L * 0.2, 0.05, 1.0, g - 1.25, '#3a68b8', { grille: true });
    P.door(L * 0.42, 0.05, 0.95, g - 0.9, '#7a2430', { glass: true, panels: true });
    P.rect(L * 0.55, 0.3, L * 0.16, g - 1.2, '#2e3236'); P.rect(L * 0.75, 0.05, L * 0.22, g - 0.8, '#b8bcbf'); for (let y = 0.2; y < g - 0.8; y += 0.15) P.rect(L * 0.75, y, L * 0.22, 0.03, 'rgba(0,0,0,.18)');
  });
  add('clinicaNos', [719, -614], P => { // esquina Coruña / Calvo Sotelo / Concepción Arenal: verde auga, balcóns de ferro, zócalo de granito
    const { L, H } = P, g = Math.min(3.6, H * 0.32), nf = Math.max(1, Math.round((H - g) / 3.0)), fh = (H - g) / nf, vg = '#cfe3d2', cr = '#e9efe6';
    P.rect(0, 0, L, H, vg); P.blocks(0, 0, L, 1.0, '#a89a82', 0.9, 0.5); P.rect(0, g - 0.15, L, 0.22, cr); P.rect(0, H - 0.45, L, 0.45, cr);
    const n = Math.max(2, Math.round(L / 3.4)), sp = L / n;
    for (let i = 0; i < nf; i++) for (let k = 0; k < n; k++) { const cx = (k + 0.5) * sp, y = g + i * fh;
      P.win(cx - 0.55, y + 0.35, 1.1, fh - 0.9, { frame: cr, glass: '#55646f', blind: '#f0f0ea' });
      if ((k + i) % 2 === 0 || i === 0) P.rail(cx - 0.85, cx + 0.85, y + 0.2, 0.85, '#1c1c1c', '#dfe6dc'); }
    for (let k = 0; k < n; k++) { const cx = (k + 0.5) * sp; if (k % 3 === 1) P.door(cx - 0.6, 0.05, 1.2, g - 0.8, '#1d2226', { glass: true }); else P.win(cx - 0.6, 1.05, 1.2, g - 1.9, { frame: '#2a2f33', glass: '#3b4750', fw: 0.08 }); }
    for (let k = 0; k < n; k += 2) { const cx = (k + 0.5) * sp; P.rect(cx - 0.9, g - 0.75, 1.8, 0.5, '#f4f4f0'); P.txt(cx, g - 0.5, 0.32, 'NÓS CLÍNICA', '#1d3e7a', 1.7); }
  }, { multi: true, r: 14, force: true });
  add('coruna62', ad('Rúa da Coruña', '62'), P => { // azulexo branco con panos de ladrillo; restaurante Currelos no baixo
    const { L, H } = P, g = 3.4, nf = Math.max(1, Math.round((H - g) / 2.8)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, '#ecebe6'); for (let y = 0; y < H; y += 0.2) P.rect(0, y, L, 0.015, 'rgba(0,0,0,.05)'); for (let xx = 0; xx < L; xx += 0.2) P.rect(xx, g, 0.015, H - g, 'rgba(0,0,0,.05)');
    for (const k of [0.3, 0.78]) { P.rect(L * k - 1.1, g, 2.2, H - g, '#b0654a'); for (let i = 0; i < nf; i++) P.win(L * k - 0.9, g + i * fh + fh * 0.42, 1.8, fh * 0.5, { frame: '#f4f4f0', glass: '#5d6c76', fw: 0.08 }); }
    P.rect(L * 0.3, g + 0.5, L * 0.5, 0.45, '#f4f4f0'); P.txt(L * 0.55, g + 0.72, 0.32, 'RESTAURANTE · CAFÉ BAR · RESTAURANTE', '#b0221c', L * 0.48);
    P.blocks(0, 0, L, g, '#9c958a', 0.8, 0.4);
    P.rect(0, 0.3, L * 0.68, g - 1.3, '#3b454d'); for (const k of [0.15, 0.35, 0.5]) P.rect(L * k, 0.3, 0.06, g - 1.3, '#c8c8c2');
    P.awning(0, L * 0.7, g - 0.25, '#1d1f22', '#0d0d0d', 'Restaurante CURRELOS Café', '#f2f2ee');
    P.door(L * 0.78, 0.05, 1.1, g - 1.0, '#d8d8d2', { grille: true }); P.txt(L * 0.78 + 0.55, g - 0.75, 0.22, '62', '#222');
  });
  const poiAt = n => { const q = pois(n); return q ? q.p : null; };
  add('banco61', poiAt('Abanca'), P => { // oficina bancaria: cantería, rótulo branco e azul, baixo de pedra con arcos
    const { L, H } = P, g = 4.2, nf = Math.max(1, Math.round((H - g) / 3.0)), fh = (H - g) / nf;
    P.blocks(0, 0, L, H, '#bdb5a3', 1.0, 0.45);
    for (let i = 0; i < nf; i++) for (const k of [0.25, 0.75]) { const y = g + i * fh; P.win(L * k - 0.7, y + 0.4, 1.4, fh - 0.9, { frame: '#d8d2c2', glass: '#6a7884' }); P.rect(L * k - 1.1, y + 0.2, 2.2, 0.75, '#ece8de'); for (let b = L * k - 1.0; b < L * k + 1.0; b += 0.22) P.rect(b, y + 0.25, 0.1, 0.65, '#f4f2ea'); }
    P.rect(0, g - 1.05, L, 0.9, '#f4f5f7'); P.rect(0, g - 1.05, L, 0.06, '#c9ccd2'); P.txt(L * 0.42, g - 0.6, 0.6, '//ABANCA', '#4766b8', L * 0.5);
    const n = 4, sp = L / n;
    for (let k = 0; k < n; k++) { const cx = (k + 0.5) * sp; P.rect(cx - 0.75, 0.6, 1.5, g - 1.85, '#a49c8a');
      if (k === 0) P.door(cx - 0.6, 0.05, 1.2, g - 1.95, '#26282a', { grille: true });
      else if (k === n - 1) P.door(cx - 0.65, 0.05, 1.3, g - 1.95, '#6b4a2e', { glass: true });
      else { P.win(cx - 0.6, 0.75, 1.2, g - 2.1, { frame: '#3b6fd0', glass: '#2f3d48', fw: 0.06 }); P.rect(cx - 0.35, 1.0, 0.7, 1.2, '#f2f2f2'); P.txt(cx, 1.3, 0.26, '500€', '#c0392b'); } }
  }, { r: 16, force: true });
  add('coruna57', poiAt('El Santo'), P => { // casa gris con balcóns de ferro; portalón tallado e estudio de tatuaxe verde
    const { L, H } = P, g = Math.min(3.6, H * 0.45);
    P.rect(0, 0, L, H, '#d6d6d2'); P.rect(0, H - 0.4, L, 0.4, '#b9b9b4');
    for (const k of [0.15, 0.42, 0.68, 0.88]) { P.win(L * k - 0.5, g + 0.5, 1.0, H - g - 1.2, { frame: '#c9c9c4', glass: '#6f7a80' }); }
    P.rail(L * 0.07, L * 0.25, g + 0.3, 0.9, '#2a2a2a', '#9a9a92'); P.rail(L * 0.6, L * 0.76, g + 0.3, 0.9, '#2a2a2a', '#9a9a92');
    P.win(L * 0.04, 0.9, L * 0.15, g - 1.6, { frame: '#e4e4e0', glass: '#8fa0a6' });
    P.door(L * 0.24, 0.05, 1.3, g - 0.4, '#7a5232', { panels: true }); P.txt(L * 0.24 + 0.65, g - 0.15, 0.22, '57', '#222');
    P.rect(L * 0.42, 0, L * 0.58, g, '#1f6b4a'); P.rect(L * 0.42, g - 0.25, L * 0.58, 0.25, '#2a2a2a');
    P.win(L * 0.47, 0.8, L * 0.14, g - 1.9, { frame: '#e8e8e2', glass: '#3a3530' }); P.txt(L * 0.54, 2.0, 0.3, 'TATTOO', '#e8c070');
    P.door(L * 0.67, 0.05, 0.95, g - 0.8, '#f4f4f0', { glass: true });
    P.win(L * 0.82, 0.8, L * 0.13, g - 1.9, { frame: '#e8e8e2', glass: '#3a3530' });
    P.rect(L * 0.62, g - 0.75, L * 0.13, 0.55, '#7a1d1d'); P.txt(L * 0.685, g - 0.47, 0.32, 'TATTOO', '#f2e6c8');
    for (const k of [0.54, 0.885]) P.awning(L * k - L * 0.08, L * k + L * 0.08, g - 0.35, '#b98a8a', '#7b5050', '');
  }, { r: 14 });
  add('coruna59', poiAt('El cortijo') || ad('Rúa da Coruña', '59'), P => { // crema con galería de marcos laranxa; antigo bar pechado
    const { L, H } = P, g = Math.min(3.4, H * 0.4), nf = Math.max(1, Math.round((H - g) / 2.9)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, '#ecd8a8'); P.rect(0, 0, L, 0.7, '#9a5a34');
    for (let i = 0; i < nf; i++) { const y = g + i * fh; P.rect(L * 0.08, y + 0.1, L * 0.84, 0.2, '#e7dcc4'); const n = 6; for (let k = 0; k < n; k++) { const w = L * 0.84 / n; P.win(L * 0.08 + k * w + 0.1, y + 0.45, w - 0.2, fh - 0.8, { frame: '#c8692e', glass: '#a8b4ba', blind: '#f1ece2', fw: 0.08 }); } }
    P.rect(L * 0.08, 0.7, L * 0.55, g - 1.2, '#59646a'); P.rect(L * 0.08, 0.7, L * 0.55, 0.08, '#c8692e'); for (const k of [0.27, 0.45]) P.rect(L * k, 0.7, 0.05, g - 1.2, '#cfc6b0');
    P.door(L * 0.72, 0.05, 1.0, g - 0.6, '#d8d2c2', { glass: true }); P.rect(L * 0.08, g - 0.45, L * 0.55, 0.3, '#d9c99a'); P.txt(L * 0.355, g - 0.3, 0.2, 'BAR', '#8a7a5a');
  }, { r: 14 });
  // Duquesa de Alba 13: nave branca con zócalo vermello, portalón granate e xanelos altos (aquí dá cabezazos o Melenas)
  add('duquesa13', ad('Rúa da Duquesa de Alba', '13'), P => {
    const { L, H } = P, base = Math.min(1.1, H * 0.2);
    P.rect(0, 0, L, H, '#ecebe6'); for (let i = 0; i < 40; i++) P.rect(Math.random() * L, base + Math.random() * (H - base), 0.4, 0.25, 'rgba(120,110,100,.12)');
    P.rect(0, 0, L, base, '#b52a24'); P.rect(0, H - 0.35, L, 0.35, '#d8d6cf');
    const gx = L * 0.5, gw = Math.min(L * 0.36, 4.4), gh = Math.min(H - 1.6, 4.3);
    P.rect(gx, 0, gw, gh, '#8a2c3c'); for (let k = 1; k < 4; k++) P.rect(gx + gw * k / 4, 0, 0.04, gh, 'rgba(0,0,0,.18)'); P.rect(gx, gh - 0.05, gw, 0.08, '#6a1f2c');
    P.rect(gx + gw * 0.15, gh * 0.55, 0.3, 0.3, '#f2f2ee'); P.rect(gx + gw * 0.7, gh * 0.55, 0.3, 0.3, '#f2f2ee');
    for (let k = 0; k < 6; k++) P.win(L * 0.04 + k * L * 0.07, H - 1.5, 0.45, 0.32, { frame: '#d8d8d2', glass: '#3a4048', fw: 0.04 });
    for (let k = 0; k < 4; k++) P.win(gx + gw + 0.5 + k * ((L - gx - gw - 0.8) / 4), H - 1.5, 0.4, 0.3, { frame: '#d8d8d2', glass: '#3a4048', fw: 0.04 });
    P.rect(L * 0.17, base + 0.4, 1.1, 0.9, '#f4f4f0'); P.rect(L * 0.17 + 0.1, base + 1.1, 0.3, 0.15, '#6a3a8a');
    P.rect(L * 0.32, base + 0.6, 0.45, 0.5, '#d8d8d4'); P.rect(gx + gw + 0.4, base + 0.3, 1.6, 0.9, '#c0392b');
  }, { r: 6 });
  // Duquesa de Alba 11: casa amarela con galerías brancas e baixo de granito
  add('duquesa11', ad('Rúa da Duquesa de Alba', '11'), P => {
    const { L, H } = P, g = Math.min(3.2, H * 0.3), nf = Math.max(1, Math.round((H - g) / 2.8)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, '#e7cf8a'); P.blocks(0, 0, L, g, '#a9a294', 0.9, 0.45);
    for (let i = 0; i < nf; i++) { const y = g + i * fh; P.rect(L * 0.05, y + 0.25, L * 0.9, fh - 0.4, '#f1efe8'); for (let k = 0; k < 4; k++) { const w = L * 0.9 / 4; P.win(L * 0.05 + k * w + 0.1, y + 0.4, w - 0.2, fh - 0.75, { frame: '#f6f6f2', glass: '#6f8290', blind: '#efece4', fw: 0.07 }); } }
    P.door(L * 0.12, 0.05, 1.6, g - 0.5, '#5a5a56', { panels: true }); P.door(L * 0.62, 0.05, 1.0, g - 0.5, '#3a3a3a', { grille: true });
  }, { r: 6 });
  // Farmacia da Rúa do Cardeal, 23: cantería de granito, balcóns de forxa, escaparates de madeira, toldo raiado vermello e branco e cruz verde
  add('farmaciaCardeal', ad('Rúa do Cardeal Rodrigo de Castro', '23') || [-93.9, 377.3], P => {
    const { L, H } = P, g = Math.min(4.2, H * 0.36);
    P.blocks(0, 0, L, H, '#c8bfa9', 1.1, 0.55);
    const nf = Math.max(1, Math.round((H - g) / 3.2)), fh = (H - g) / nf, nw = Math.max(2, Math.round(L / 3.3));
    for (let i = 0; i < nf; i++) for (let k = 0; k < nw; k++) { const cx = (k + 0.5) * L / nw, y = g + i * fh + 0.5;
      P.win(cx - 0.55, y, 1.1, fh - 1.0, { frame: '#8a3a22', glass: '#3e4a52', fw: 0.12 }); P.rect(cx - 0.9, y - 0.25, 1.8, 0.25, '#b9b09a');
      P.x.save(); P.x.strokeStyle = '#2a2a2a'; P.x.lineWidth = 0.035; P.x.strokeRect(cx - 0.85, y, 1.7, 0.95); for (let q = 0; q < 4; q++) { P.x.beginPath(); P.x.arc(cx - 0.55 + q * 0.37, y + 0.48, 0.15, 0, 7); P.x.stroke(); } P.x.restore(); }
    // o toldo raiado e a cruz verde van en 3D (melenas.js); aquí só a súa sombra na pedra
    P.rect(L * 0.05, g - 0.7, L * 0.85, 0.5, 'rgba(40,30,20,0.35)');
    // escaparates e porta de madeira
    P.rect(L * 0.06, 0.05, L * 0.18, g - 1.5, '#8a4a22'); P.rect(L * 0.08, 0.3, L * 0.14, g - 2.0, '#5a6a72'); for (let q = 0; q < 4; q++) P.rect(L * 0.09, 0.6 + q * 0.45, L * 0.12, 0.08, '#c9a874');
    P.rect(L * 0.27, 0.6, 0.6, 0.8, '#d8d8d2'); P.txt(L * 0.27 + 0.3, 1.25, 0.11, 'FARMACIA', '#2a2a2a');
    P.rect(L * 0.38, 0.05, L * 0.16, g - 1.5, '#8a4a22'); P.rect(L * 0.4, 0.3, L * 0.12, g - 2.0, '#c0392b'); P.txt(L * 0.46, g - 2.2, 0.14, 'MegaRed', '#f4f4f0');
    P.door(L * 0.68, 0.1, L * 0.18, g - 1.4, '#7a3a1c', { panels: true, transom: '#30383e' });
  }, { r: 8 });
  add('coruna12', ad('Rúa da Coruña', '12'), P => { // casa amarela con xanelas azuis e floreiras
    const { L, H } = P, g = H * 0.48, cr = '#f2efe6';
    P.rect(0, 0, L, H, '#e9c34e'); P.rect(0, H - 0.35, L, 0.35, cr); P.rect(0, g - 0.1, L, 0.15, cr); P.rect(0, 0, 0.3, H, cr); P.rect(L - 0.3, 0, 0.3, H, cr);
    for (const k of [0.25, 0.5, 0.75]) { P.win(L * k - 0.45, g + 0.35, 0.9, H - g - 1.0, { frame: cr, glass: '#4f9bd8', fw: 0.18 }); P.rail(L * k - 0.6, L * k + 0.6, g + 0.2, 0.55, '#2a2a2a', cr); for (let f = -0.45; f < 0.5; f += 0.2) P.rect(L * k + f, g + 0.25, 0.14, 0.22, f > 0 ? '#c0392b' : '#4c8a3a'); }
    for (const k of [0.25, 0.45]) P.win(L * k - 0.4, 0.9, 0.8, g - 1.5, { frame: cr, glass: '#4f9bd8', fw: 0.16 });
    P.door(L * 0.72 - 0.5, 0.05, 1.0, g - 0.7, '#4a2a22', { panels: true });
    P.rect(0, 0, L, 0.6, '#d9b244');
  });
  add('coruna8', ad('Rúa da Coruña', '8'), P => { // galerías corridas en dúas plantas; perrucaría Julio no baixo
    const { L, H } = P, g = Math.min(3.4, H * 0.36), nf = Math.max(1, Math.round((H - g) / 2.9)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, '#d8c79a'); P.rect(0, 0, L, g, '#cfc3a6');
    for (let i = 0; i < nf; i++) { const y = g + i * fh; P.rect(0, y, L, 0.35, '#bfb08a'); const n = 7; for (let k = 0; k < n; k++) { const w = L * 0.9 / n; P.win(L * 0.05 + k * w + 0.08, y + 0.55, w - 0.16, fh - 0.95, { frame: '#e8e2d2', glass: '#b9c1c4', blind: '#ece9e0', fw: 0.08 }); } }
    P.door(L * 0.06, 0.05, L * 0.28, g - 0.8, '#9a6a3c', { panels: true }); P.rect(L * 0.06, g - 0.95, L * 0.28, 0.25, '#3b3a34');
    P.door(L * 0.5 - 0.45, 0.05, 0.9, g - 0.9, '#d8d8d2', { grille: true }); P.awning(L * 0.5 - 0.7, L * 0.5 + 0.7, g - 0.45, '#efe7d2', '#5a5244', 'PELUQUERÍA Julio', '#3a3020');
    P.door(L * 0.8 - 0.5, 0.05, 1.0, g - 0.6, '#b4834a', { panels: true, transom: '#3a3a3a' });
  }, { r: 12, inside: true });
  add('zapardiel9', ad('Rúa de Juan Ramón Jiménez', '9'), P => { // ladrillo de plaqueta vermella, terrazas con varandas brancas, baixo de granito con portas de ferro
    const { L, H } = P, g = Math.min(4.0, H * 0.25), nf = Math.max(1, Math.round((H - g) / 2.8)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, '#a0483a'); for (let y = g; y < H; y += 0.12) P.rect(0, y, L, 0.012, 'rgba(255,255,255,.12)'); for (let y = g, k = 0; y < H; y += 0.12, k++) for (let xx = (k % 2) * 0.12; xx < L; xx += 0.24) P.rect(xx, y, 0.012, 0.12, 'rgba(255,255,255,.1)');
    P.blocks(0, 0, L, g, '#bdb4a3', 1.2, 0.6); P.rect(0, g - 0.12, L, 0.16, '#d8d2c4');
    const cols = [[0.02, 0.3, 'balc'], [0.36, 0.43, 'win'], [0.45, 0.63, 'balc'], [0.68, 0.76, 'win'], [0.8, 0.98, 'balc']];
    for (let i = 0; i < nf; i++) { const y = g + i * fh;
      for (const [a, b, k] of cols) { const x0 = L * a, w = L * (b - a);
        if (k === 'balc') { P.rect(x0, y + 0.1, w, fh - 0.2, '#c9773e'); P.win(x0 + w * 0.2, y + 0.35, w * 0.6, fh - 0.8, { frame: '#e8e4dc', glass: '#556570', blind: '#ece9e0' }); P.rect(x0 - 0.1, y, w + 0.2, 0.14, '#e4e0d6'); P.rail(x0, x0 + w, y + 0.12, 0.95, '#f2f0ea'); }
        else P.win(x0, y + 0.7, w, fh * 0.45, { frame: '#e4e0d6', glass: '#556570', blind: '#ece9e0' }); } }
    P.txt(L * 0.7, H - 0.6, 0.45, '1981', 'rgba(255,255,255,.35)');
    // baixo: portal de ferro verde, porta de madeira co 9, gran porta enreixada de rombos, entrada da dereita
    const diamonds = (x0, w, h) => { P.rect(x0, 0.05, w, h, '#f2f0ea'); const n = Math.max(2, Math.round(w / 0.6)), cw = w / n, rows = Math.max(2, Math.round(h / 0.65)), ch = h / rows;
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { const cx = x0 + (i + 0.5) * cw, cy = 0.05 + (j + 0.5) * ch; P.rect(cx - cw / 2 + 0.04, cy - ch / 2 + 0.04, cw - 0.08, ch - 0.08, '#23292c'); P.x.save(); P.x.strokeStyle = '#e8e4dc'; P.x.lineWidth = 0.035; P.x.beginPath(); P.x.moveTo(cx, cy - ch * 0.4); P.x.lineTo(cx + cw * 0.4, cy); P.x.lineTo(cx, cy + ch * 0.4); P.x.lineTo(cx - cw * 0.4, cy); P.x.closePath(); P.x.stroke(); P.x.restore(); } };
    P.rect(L * 0.0, 0.05, L * 0.2, g - 1.0, '#1f3a2c'); for (let k = 0; k < 6; k++) P.rect(L * 0.0 + k * L * 0.034, 0.05, 0.03, g - 1.0, '#2f5a42');
    P.rect(L * 0.27 - 0.1, 0, 1.6, g - 0.75, '#9a9384'); P.door(L * 0.27, 0.05, 1.4, g - 0.9, '#5a3a22', { glass: true, panels: true }); P.txt(L * 0.27 + 0.7, g - 0.6, 0.22, '9', '#222');
    diamonds(L * 0.45, L * 0.18, g - 0.75);
    P.rect(L * 0.83, 0.05, L * 0.13, g - 0.9, '#4a3a2c'); P.win(L * 0.84, 0.9, L * 0.11, g - 2.0, { frame: '#9a9384', glass: '#2d3640', fw: 0.06 });
  });
  // medianeira sur: mural de Lois Pereiro (Letras Galegas 2011), adaptación pixel art achegada polo autor
  add('pereiroMural', ad('Rúa de Juan Ramón Jiménez', '9'), null, { side: 'S', img: 'img/mural-lois.png' });
  add('estacionBus', [362, -256], P => { // estación de autobuses: banda de chapa co rótulo en letras azuis e fronte de vidro
    const { L, H } = P, g = Math.min(3.4, H * 0.6);
    P.rect(0, 0, L, H, '#cfc8b6'); for (let xx = 0; xx < L; xx += 0.3) P.rect(xx, g, 0.05, H - g, 'rgba(0,0,0,.12)');
    P.rect(0, g - 0.2, L, 0.25, '#8f8a7c');
    P.txt(L * 0.5, g + (H - g) * 0.5, Math.min(1.0, (H - g) * 0.55), 'ESTACIÓN DE AUTOBUSES', '#3b5ea8', L * 0.9);
    P.rect(0, 0, L, g - 0.2, '#3a3d40'); const n = Math.max(3, Math.round(L / 2.2)); for (let k = 0; k < n; k++) { P.win(k * L / n + 0.15, 0.4, L / n - 0.3, g - 1.0, { frame: '#9a9a96', glass: '#4d5d68', fw: 0.06 }); }
    P.door(L * 0.5 - 1.0, 0.02, 2.0, g - 0.8, '#5a6a74', { glass: true }); P.rect(L * 0.08, g - 0.75, 1.2, 0.5, '#f2f2f0'); P.txt(L * 0.08 + 0.6, g - 0.5, 0.25, 'XUNTA', '#3b5ea8');
  }, { r: 14 });
  add('iesRioCabe', [385, -188], P => { // IES Río Cabe: piares de ladrillo e paneis amarelos, caixa de escaleira con pavés
    const { L, H } = P, nf = Math.max(2, Math.round(H / 3.1)), fh = H / nf;
    P.rect(0, 0, L, H, '#e3dccb'); const bay = 3.4, n = Math.max(3, Math.floor(L / bay)), bw = L / n, mid = Math.floor(n / 2);
    for (let k = 0; k < n; k++) { const x0 = k * bw;
      P.rect(x0, 0, 0.55, H, '#8e4a36'); for (let y = 0; y < H; y += 0.15) P.rect(x0, y, 0.55, 0.015, 'rgba(255,255,255,.18)');
      if (k === mid) { P.rect(x0 + 0.8, 0.8, bw - 1.3, H - 1.2, '#b9b39f'); for (let y = 0.9; y < H - 0.4; y += 0.25) for (let xx = x0 + 0.85; xx < x0 + bw - 0.5; xx += 0.25) P.rect(xx, y, 0.2, 0.2, '#d8d6c8'); continue; }
      for (let i = 0; i < nf; i++) { const y = i * fh; P.rect(x0 + 0.55, y + 0.1, bw - 0.55, fh * 0.42, '#e3b632'); P.win(x0 + 0.75, y + fh * 0.55, bw - 0.95, fh * 0.36, { frame: '#d8d8d2', glass: '#7d8b93', blind: '#e8e8e2', fw: 0.06 }); } }
    P.rect(mid * bw - 1.2, fh * 0.75, bw + 2.4, 0.5, '#f2f0ea'); P.txt(mid * bw + bw / 2, fh * 0.75 + 0.25, 0.24, 'INSTITUTO DE EDUCACIÓN SECUNDARIA · RÍO CABE', '#2d3b5a', bw + 2.2);
    P.door(mid * bw + 0.6, 0.02, bw - 1.2, fh * 0.6, '#4a5a64', { glass: true });
  }, { inside: true, r: 20 });
  add('sanpedro45', ad('Rúa de San Pedro', '45'), P => { // granito claro en bandas, panos de cores entre as xanelas, correduría no baixo
    const { L, H } = P, g = 3.6, nf = Math.max(1, Math.round((H - g) / 2.9)), fh = (H - g) / nf, C = ['#e8b23a', '#d64a3a', '#3a5fc8', '#eceae4'];
    P.rect(0, 0, L, H, '#cfc8b8'); for (let y = 0; y < H; y += 0.5) P.rect(0, y, L, 0.02, 'rgba(0,0,0,.06)');
    for (let i = 0; i < nf; i++) { const y = g + i * fh; let xx = 0.3, k = i;
      while (xx < L - 1) { const w = 1.6 + ((k * 7) % 3) * 0.5; P.rect(xx, y + fh * 0.32, 0.9, fh * 0.5, C[k % 4]); P.win(xx + 1.0, y + fh * 0.32, Math.min(w, L - xx - 1.2), fh * 0.5, { frame: '#2f3338', glass: '#3d4850', blind: '#5a5f64', fw: 0.06 }); xx += w + 1.3; k++; } }
    P.rect(0, 0, L, g, '#9a948a'); P.rect(L * 0.08, 0.05, 1.6, g - 0.6, '#e8b23a'); P.door(L * 0.08 + 0.3, 0.05, 1.0, g - 0.9, '#2a2d30', { glass: true }); P.txt(L * 0.08 + 0.8, g - 0.4, 0.25, '45', '#222');
    P.rect(L * 0.35, 0.05, L * 0.4, g - 0.6, '#2b3036'); P.win(L * 0.37, 0.3, L * 0.36, g - 1.2, { frame: '#2b3036', glass: '#50606a', fw: 0.05 });
    P.rect(L * 0.35, g - 0.95, L * 0.4, 0.55, '#1d2a22'); P.txt(L * 0.55, g - 0.67, 0.34, 'CORREDURÍA DE SEGUROS', '#9fd36a', L * 0.38);
  });
  add('neka', ad('Rúa de San Pedro', '73'), P => { // ximnasio Neka: azul e amarelo, mirador no primeiro, rótulo de taekwondo
    const { L, H } = P, g = 3.4, bl = '#3a64b0', am = '#e8c23a';
    P.rect(0, 0, L, H, bl); P.rect(0, 0, 0.2, H, am); P.rect(L - 0.2, 0, 0.2, H, am); P.rect(0, g - 0.1, L, 0.25, am); P.rect(0, H - 0.3, L, 0.3, am);
    P.rect(L * 0.3, g + 0.4, L * 0.4, Math.min(2.4, H - g - 0.8), am); P.win(L * 0.31, g + 0.5, L * 0.38, Math.min(2.2, H - g - 1.0), { frame: am, glass: '#6f8494', blind: '#e8e8e2', fw: 0.08 }); P.txt(L * 0.5, g + 0.9, 0.28, 'BOXEO', '#f4f4f0');
    for (const k of [0.13, 0.87]) P.win(L * k - 0.5, g + 0.6, 1.0, Math.min(1.6, H - g - 1.2), { frame: am, glass: '#6f8494', fw: 0.12 });
    P.txt(L * 0.5, g - 0.45, 0.55, 'NEKA', '#e6e9ee', L * 0.5);
    P.rect(L * 0.3, 0.3, L * 0.38, g - 1.1, '#1d2125'); P.txt(L * 0.49, g - 1.1, 0.28, 'TAEKWONDO', '#f2f2f0'); P.txt(L * 0.49, 1.7, 0.45, 'Spa', '#f2f2f0'); P.txt(L * 0.49, 1.0, 0.16, 'SAUNA · FITNESS · MUSCULACIÓN · BOXEO', '#d8d8d2', L * 0.36);
    P.rect(L * 0.17, 0.4, L * 0.1, g - 0.9, '#f4f4f0'); P.txt(L * 0.22, g - 1.2, 0.18, 'TAEKWONDO', '#b2201f'); P.txt(L * 0.22, 1.0, 0.13, 'CAMPEÓNS', '#1d3e7a');
    P.door(L * 0.05, 0.05, 1.1, g - 0.9, '#8a8f94', { grille: true }); P.door(L * 0.76, 0.05, 1.0, g - 0.9, '#c9ccd0', { grille: true }); P.txt(L * 0.76 + 0.5, g - 0.75, 0.2, '73', '#222');
  });
  add('ford', ad('Rúa de Leopoldo Calvo Sotelo', '66'), P => { // bloque branco con terrazas vermellas; concesionario no baixo de pedra
    const { L, H } = P, g = 3.8, nf = Math.max(1, Math.round((H - g) / 2.8)), fh = (H - g) / nf;
    P.rect(0, 0, L, H, '#ecebe6'); P.rect(L * 0.15, g, L * 0.7, H - g, '#9a2a22');
    for (let i = 0; i < nf; i++) { const y = g + i * fh; P.rect(L * 0.13, y, L * 0.74, 0.18, '#ecebe6'); P.rail(L * 0.15, L * 0.85, y + 0.18, 0.85, '#1d1d1f');
      for (let k = 0; k < 6; k++) P.win(L * 0.18 + k * L * 0.11, y + 0.5, L * 0.07, fh - 0.9, { frame: '#f2f0ea', glass: '#55646f', blind: '#ece9e0' });
      for (const xx of [0.03, 0.9]) P.win(L * xx, y + 0.6, L * 0.06, fh * 0.45, { frame: '#9a2a22', glass: '#55646f', fw: 0.1 }); }
    P.blocks(0, 0, L, g, '#a39684', 0.5, 0.35);
    for (let k = 0; k < 4; k++) { const x0 = L * (0.08 + k * 0.22); P.win(x0, 0.2, L * 0.16, g - 1.3, { frame: '#d8d4c8', glass: '#4b5a64', fw: 0.08 }); P.rect(x0 + L * 0.03, 0.6, L * 0.1, 0.6, '#f4f4f0'); }
    for (const [k, t] of [[0.2, 'SEAT'], [0.45, 'Ford'], [0.65, 'Ford'], [0.88, 'AUTOS LEMOS']]) { P.rect(L * k - 0.9, g - 0.85, 1.8, 0.55, t === 'Ford' ? '#1f3f8f' : '#f2f2f0'); P.txt(L * k, g - 0.57, 0.3, t, t === 'Ford' ? '#f2f2f0' : '#222', 1.7); }
  }, { r: 12 });
  add('igrexaEstacion', [484, -461], P => { // igrexa do Sagrado Corazón: cantería, nicho coa imaxe e porta enreixada
    const { L, H } = P, st = '#cbbf9f';
    P.blocks(0, 0, L, H, st, 1.2, 0.6);
    const c0 = L * 0.28, c1 = L * 0.72;
    P.rect(c0, 0, c1 - c0, H, '#d2c7a8'); P.blocks(c0, 0, c1 - c0, H, '#d4c9aa', 1.0, 0.5);
    P.rect(c0 + 0.4, H * 0.55, c1 - c0 - 0.8, H * 0.33, '#b6aa8a');
    P.rect((c0 + c1) / 2 - 0.5, H * 0.55, 1.0, H * 0.06, '#9d927a');
    P.x.save(); P.x.fillStyle = '#e4dcc6'; P.x.beginPath(); const sx = (c0 + c1) / 2, sy = H * 0.61; P.x.ellipse(sx, sy + 1.7, 0.28, 0.32, 0, 0, 7); P.x.fill(); P.x.fillRect(sx - 0.4, sy, 0.8, 1.45); P.x.restore();
    P.rect(c0 + 0.5, H * 0.3, c1 - c0 - 1, 0.35, '#b9ad8e'); // marquesiña
    P.door(sx - 1.3, 0.35, 2.6, H * 0.3 - 0.4, '#2c3236', { grille: true });
    P.rect(c0 - 0.3, 0, c1 - c0 + 0.6, 0.35, '#9f9680'); P.rect(c0 - 0.6, 0, c1 - c0 + 1.2, 0.18, '#8f8670');
    P.rect(sx - 0.06, H - 0.9, 0.12, 0.9, '#6f6a60'); P.rect(sx - 0.3, H - 0.6, 0.6, 0.1, '#6f6a60');
  }, { r: 16, inside: true });
})();
/* pinta unha fachada: devolve a textura para un pano de L × H metros */
function fachadaTex(F, L, H) {
  const S = Math.min(48, 1400 / Math.max(L, H)), W = Math.max(8, Math.round(L * S)), Hp = Math.max(8, Math.round(H * S));
  const c = cnv(W, Hp), x = c.getContext('2d');
  x.setTransform(S, 0, 0, -S, 0, Hp); // metros, y cara arriba
  const P = { x, L, H,
    rect(a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); },
    blocks(a, b, w, h, col, bw, bh) { x.fillStyle = col; x.fillRect(a, b, w, h); x.fillStyle = 'rgba(0,0,0,.09)'; let r = 0; for (let yy = b; yy < b + h; yy += bh, r++) { x.fillRect(a, yy, w, 0.03); for (let xx = a + (r % 2) * bw / 2; xx < a + w; xx += bw) x.fillRect(xx, yy, 0.03, bh); } },
    win(a, b, w, h, o = {}) { const fw = o.fw || 0.12; x.fillStyle = o.frame || '#ddd'; x.fillRect(a - fw, b - fw, w + 2 * fw, h + 2 * fw); x.fillStyle = o.glass || '#3a4652'; x.fillRect(a, b, w, h);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(a + w * 0.08, b + h * 0.55, w * 0.25, h * 0.35);
      x.fillStyle = o.frame || '#ddd'; x.fillRect(a + w / 2 - 0.03, b, 0.06, h);
      if (o.blind) { x.fillStyle = o.blind; x.fillRect(a, b + h * 0.62, w, h * 0.38); }
      if (o.shutters) { x.fillStyle = o.shutters; x.fillRect(a - fw - w * 0.42, b, w * 0.42, h); x.fillRect(a + w + fw, b, w * 0.42, h); }
      if (o.grille) { x.fillStyle = '#222'; for (let k = a + 0.1; k < a + w; k += 0.14) x.fillRect(k, b, 0.03, h); } },
    door(a, b, w, h, col, o = {}) { x.fillStyle = col; x.fillRect(a, b, w, h);
      if (o.arch) { x.beginPath(); x.arc(a + w / 2, b + h, w / 2, 0, Math.PI); x.fill(); if (o.transom) { x.fillStyle = o.transom; x.beginPath(); x.arc(a + w / 2, b + h, w / 2 - 0.1, 0, Math.PI); x.fill(); } }
      else if (o.transom) { x.fillStyle = o.transom; x.fillRect(a + 0.08, b + h - 0.45, w - 0.16, 0.37); }
      x.fillStyle = 'rgba(0,0,0,.25)'; if (o.panels) for (const [px, py] of [[0.15, 0.15], [0.55, 0.15], [0.15, 0.55], [0.55, 0.55]]) x.fillRect(a + w * px, b + h * py * 0.8, w * 0.3, h * 0.3);
      x.fillRect(a + w / 2 - 0.02, b, 0.04, h * (o.arch ? 1 : 0.85));
      if (o.glass) { x.fillStyle = 'rgba(70,90,105,.85)'; x.fillRect(a + w * 0.18, b + h * 0.45, w * 0.64, h * 0.35); }
      if (o.grille) { x.fillStyle = 'rgba(20,20,20,.75)'; for (let k = a + 0.08; k < a + w; k += 0.12) x.fillRect(k, b, 0.025, h); } },
    rail(a0, a1, y, h, col, slab) { if (slab) { x.fillStyle = slab; x.fillRect(a0 - 0.1, y - 0.18, a1 - a0 + 0.2, 0.18); } x.fillStyle = col; x.fillRect(a0, y + h - 0.06, a1 - a0, 0.06); for (let k = a0; k <= a1; k += 0.12) x.fillRect(k, y, 0.025, h); x.fillRect(a0, y + 0.1, a1 - a0, 0.03); },
    awning(a0, a1, y, col, edge, text, tc) { x.fillStyle = col; x.fillRect(a0, y - 0.55, a1 - a0, 0.7); x.fillStyle = edge; x.fillRect(a0, y - 0.6, a1 - a0, 0.08); if (text) P.txt((a0 + a1) / 2, y - 0.2, 0.36, text, tc || '#333', (a1 - a0) * 0.95); },
    txt(cx, cy, size, t, col, maxW) { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `bold ${Math.round(size * S)}px Arial`; x.fillText(t, cx * S, Hp - cy * S, maxW ? maxW * S : undefined); x.restore(); },
  };
  F.draw(P);
  const t = toTex(c, false); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

/* ---------- cola de xubilados á porta do banco (Rúa da Coruña, 61) ---------- */
const BANKQ = { on: false, list: [] };
function updateBankQueue(dt) {
  const E = G.fachadaEdge && G.fachadaEdge.banco61; if (!E || typeof world === 'undefined' || !world.crowd) return;
  const me = G.player.car || G.player.ped, d = Math.hypot(me.x - E.mx, me.z - E.mz);
  if (!BANKQ.on && d < 140) {
    BANKQ.on = true;
    const N = 9, caneM = std({ color: 0x3a2a1c, roughness: 0.6 }), alu = std({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.8 });
    for (let i = 0; i < N; i++) {
      const p = freePed(); if (!p) break;
      Object.assign(p, { state: 'npc', home: 'npc', npc: 'bancoQ', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0, lie: 0, armUp: 0, edge: null });
      const fem = R() < 0.55; p.female = fem;
      Object.assign(p.col, { hair: pick(['#cfcfcf', '#e6e6e6', '#9a9a9a', '#b8b8b8']), shirt: pick(fem ? ['#3a2a40', '#5a4a52', '#2a3040', '#6a5a4a', '#222'] : ['#3a3a3a', '#4a4030', '#2a3040', '#5a5a5a']), pants: pick(['#2a2a2a', '#3a3428', '#222a34']), shoe: '#1a1a1a', sleeve: true });
      world.crowd.paint(p); p.scale = RR(0.9, 0.97);
      // posto na cola: dende a porta, ao longo da fachada
      const s = E.door - i * 0.95, x = E.ax + E.ux * s + E.ox * 1.0, z = E.az + E.uz * s + E.oz * 1.0;
      p.x = x; p.z = z; p.y = groundH(x, z); p.yaw = Math.atan2(E.ux, E.uz);
      const walker = R() < 0.4, g = new THREE.Group();
      if (walker) { for (const sx of [-0.25, 0.25]) for (const sz of [0.25, 0.6]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 5), alu); l.position.set(sx, 0.42, sz); g.add(l); } const t = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.03), alu); t.position.set(0, 0.84, 0.25); g.add(t); for (const sx of [-0.25, 0.25]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.4), alu); h.position.set(sx, 0.84, 0.42); g.add(h); } }
      else { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.88, 5), caneM); c.position.set(0.28, 0.44, 0.18); c.rotation.x = -0.12; g.add(c); const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 4, 8, Math.PI), caneM); h.position.set(0.28, 0.89, 0.23); h.rotation.y = Math.PI / 2; g.add(h); }
      g.traverse(o => { o.castShadow = true; }); G.scene.add(g);
      BANKQ.list.push({ p, g, ph: R() * 6 });
    }
  }
  for (const q of BANKQ.list) { const p = q.p; if (p.state !== 'npc') { q.g.visible = false; continue; } q.ph += dt; p.yaw += Math.sin(q.ph * 0.4) * 0.002; q.g.position.set(p.x, p.y, p.z); q.g.rotation.y = p.yaw; q.g.scale.setScalar(p.scale || 1); }
}

/* ---------- neno en bici disfrazado de superheroe (orixinal: "Super Lemos") diante de Doutor Casares 211 ---------- */
const BIKEKID = { on: false };
function updateBikeKid(dt) {
  const E = G.fachadaEdge && G.fachadaEdge.casares211; if (!E || typeof world === 'undefined' || !world.crowd) return;
  const me = G.player.car || G.player.ped, cx = E.mx + E.ox * 4.2, cz = E.mz + E.oz * 4.2;
  if (!BIKEKID.on) {
    if (Math.hypot(me.x - cx, me.z - cz) > 150) return;
    const p = freePed(); if (!p) return; BIKEKID.on = true;
    Object.assign(p, { state: 'npc', home: 'npc', npc: 'bikekid', manual: true, immune: true, visible: true, walk: 0, run: 0, sit: 0.72, lie: 0, armUp: 0.45, edge: null, female: false, scale: 0.58 });
    // traxe de heroe inventado: verde e amarelo, máscara verde (sen deseño de ningún personaxe coñecido)
    Object.assign(p.col, { shirt: '#1f9a50', pants: '#1f9a50', shoe: '#f2c21b', hair: '#1f9a50', skin: '#1f9a50', sleeve: false }); world.crowd.paint(p);
    const bike = makeBike(); bike.scale.setScalar(0.62); G.scene.add(bike);
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), std({ color: 0xf2c21b, roughness: 0.8, side: THREE.DoubleSide })); cape.castShadow = true; G.scene.add(cape);
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.07, 5), std({ color: 0xf2c21b, roughness: 0.5, side: THREE.DoubleSide })); G.scene.add(star);
    Object.assign(BIKEKID, { p, bike, cape, star, a: 0, sp: 1.0 });
  }
  const K = BIKEKID, p = K.p; if (p.state !== 'npc') { K.bike.visible = K.cape.visible = K.star.visible = false; return; }
  K.a += dt * K.sp * (1 + 0.15 * Math.sin(G.t * 0.7)); const R0 = 2.6;
  const x = cx + Math.cos(K.a) * R0, z = cz + Math.sin(K.a) * R0, tx = -Math.sin(K.a), tz = Math.cos(K.a), yaw = Math.atan2(tx, tz), y = groundH(x, z);
  K.bike.position.set(x, y, z); K.bike.rotation.set(0, yaw, -0.12);
  for (const w of K.bike.userData.wheels || []) w.rotation.x += dt * K.sp * R0 / 0.22;
  p.x = x - tx * 0.1; p.z = z - tz * 0.1; p.y = y + 0.18; p.yaw = yaw; p.sit = 0.72; p.walk = 1; p.phase = (p.phase || 0) + dt * 6; p.armUp = 0.45; p.look = 0; p.nod = 0;
  // capa ao vento e estrela no peito
  K.cape.position.set(p.x - tx * 0.18, p.y + 0.62, p.z - tz * 0.18); K.cape.rotation.set(0.5 + Math.sin(G.t * 9) * 0.12, yaw, 0, 'YXZ');
  K.star.position.set(p.x + tx * 0.09, p.y + 0.72, p.z + tz * 0.09); K.star.rotation.set(0, yaw, 0);
  // de cando en vez, berra algo ao pasar o xogador
  K.t = (K.t || 0) - dt;
  if (!G.player.car && K.t < 0 && Math.hypot(me.x - x, me.z - z) < 6) { K.t = 14; toast(pick(['Neno: «Son SUPER LEMOS! Dou mil voltas sen caer!»', 'Neno: «Míraaa! Sen mans!» (case cae)', 'Neno: «Miña nai aluga o cuarto de arriba. 80 euros e almorzo!»', 'Neno: «Ti es dos malos ou dos bos?»']), 3.5); }
}

/* veciño libre para un papel (paseantes de calquera tipo, lonxe da cámara se pode ser) */
function freePed() {
  const me = G.player.ped, C = world.crowd.peds.filter(q => !q.npc && q !== me && q.state !== 'player' && q.state !== 'seat' && q.state !== 'npc');
  C.sort((a, b) => Math.hypot(b.x - me.x, b.z - me.z) - Math.hypot(a.x - me.x, a.z - me.z));
  return C[0] || null;
}
