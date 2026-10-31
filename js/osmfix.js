'use strict';
/* GTA LEMOS 27400 · retoques ao plano OSM antes de construír as rúas:
   a Rúa de Rosalía de Castro sae da Praza da Estación cara ao norte, ao
   carón das vías (no recorte orixinal só quedaba un anaco de 7 m) */
(function () {
  const r = OSM.roads.find(q => q.n === 'Rúa de Rosalía de Castro');
  if (r) r.p = [[732, -624], [735, -631], [745, -660], [753, -688], [759, -714]];
})();
