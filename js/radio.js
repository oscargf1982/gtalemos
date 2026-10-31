'use strict';
/* ==========================================================
   GTA LEMOS 27400 · Radio en liña de verdade (tecla R / botón RADIO)
   R vai cambiando: Radio Galega Música → Verbena FM → Orquesta FM →
   Radio Galega → Radio Lemos FM (sintetizada) → apagada.
   Os enderezos dos directos búscanse en Radio Browser (directorio
   aberto de emisoras) e, se algún falla, próbase o seguinte.
   ========================================================== */
const ONLINE_RADIOS = [
  { n: 'Radio Galega Música', q: ['Radio Galega Música', 'Radio Galega Musica', 'RGM'], urls: ['https://wecast-b01-04.flumotion.com/radiogalega-musica/live.mp3'] },
  { n: 'Verbena FM', q: ['Verbena FM'], urls: [] },
  { n: 'Orquesta FM', q: ['Orquesta FM'], urls: [] },
  { n: 'Radio Galega', q: ['Radio Galega'], urls: ['https://crtvg-radiogalega.stream.flumotion.com/radiogalega/live.mp3'] },
];
const RADIO_API = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info', 'https://fi1.api.radio-browser.info'];
const RADIO = { idx: -1, audio: null, tries: [], synth: false, token: 0 };
async function radioResolve(st) {
  if (st.resolved) return st.resolved;
  const found = [];
  for (const host of RADIO_API) {
    try {
      for (const name of st.q) {
        const r = await fetch(`${host}/json/stations/search?name=${encodeURIComponent(name)}&countrycode=ES&hidebroken=true&order=votes&reverse=true&limit=6`, { cache: 'no-store' });
        if (!r.ok) continue;
        const list = await r.json();
        for (const s of list) { const u = s.url_resolved || s.url; if (u && !found.includes(u)) found.push(u); }
        if (found.length) break;
      }
      if (found.length) break;
    } catch (e) { /* proba o seguinte servidor */ }
  }
  // primeiro os https (unha páxina https non pode reproducir audio http)
  const urls = [...st.urls, ...found.filter(u => u.startsWith('https')), ...found.filter(u => !u.startsWith('https')).map(u => u.replace(/^http:/, 'https:'))];
  return st.resolved = [...new Set(urls)];
}
function radioStop() { RADIO.token++; if (RADIO.audio) { RADIO.audio.pause(); RADIO.audio.removeAttribute('src'); RADIO.audio.load(); } }
function radioPlayUrl(url, tok, onFail) {
  if (!RADIO.audio) { RADIO.audio = new Audio(); RADIO.audio.preload = 'none'; }
  const a = RADIO.audio; a.onerror = null; a.onplaying = null;
  a.src = url; a.volume = 0;
  a.onplaying = () => { if (tok !== RADIO.token) return; const st = ONLINE_RADIOS[RADIO.idx]; toast(`📻 ${st.n} · en directo`, 2.5); RADIO.ok = true; };
  a.onerror = () => { if (tok === RADIO.token) onFail(); };
  const p = a.play(); if (p && p.catch) p.catch(() => { if (tok === RADIO.token) onFail(); });
}
async function radioTune(i) {
  radioStop(); RADIO.ok = false;
  const st = ONLINE_RADIOS[i], tok = RADIO.token;
  toast(`📻 Sintonizando ${st.n}...`, 2);
  const urls = st.resolved || st.urls.slice();
  let k = 0;
  const next = async () => {
    if (tok !== RADIO.token) return;
    if (k === st.urls.length && !st.resolved) { const all = await radioResolve(st); if (tok !== RADIO.token) return; urls.length = 0; urls.push(...all); }
    if (k >= urls.length) { toast(`📻 ${st.n} non está dispoñible agora mesmo. Proba coa seguinte (R)`, 3.5); return; }
    radioPlayUrl(urls[k++], tok, next);
  };
  next();
}
function radioCycle() {
  if (G.sfx && G.sfx.init) G.sfx.init();
  // ciclo: emisoras en liña → radio sintetizada → apagada
  if (RADIO.synth) { RADIO.synth = false; G.sfx.toggleRadio(); RADIO.idx = -1; return; }
  RADIO.idx++;
  if (RADIO.idx >= ONLINE_RADIOS.length) { radioStop(); RADIO.synth = true; G.sfx.toggleRadio(); return; }
  radioTune(RADIO.idx);
}
// volume: máis alto dentro do coche, máis baixo a pé, mudo en pausa ou cinemáticas
setInterval(() => {
  const a = RADIO.audio; if (!a || RADIO.idx < 0 || RADIO.synth) return;
  const target = (typeof G === 'undefined' || G.paused || document.hidden) ? 0 : (G.player && G.player.car ? 0.85 : 0.35) * (G.cine ? 0.4 : 1);
  a.volume = clamp(a.volume + Math.sign(target - a.volume) * Math.min(0.08, Math.abs(target - a.volume)), 0, 1);
}, 100);
