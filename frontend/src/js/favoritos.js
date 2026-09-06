// ============================================
// FAVORITOS
// ============================================
import { state } from './config.js';
import { speak } from './voz.js';
import { buscarLineas } from './api.js';
import { mostrarDetalleLinea } from './ui.js';

export async function mostrarFavoritos() {
  const list = document.getElementById('favoritosList');

  if (state.favoritos.length === 0) {
    list.innerHTML = '<div class="info-text">No tenés líneas favoritas. Agregá desde LÍNEAS.</div>';
    speak('No tenés favoritos', true);
    return;
  }

  // Todavía no tenemos un endpoint para pedir "una sola línea por id",
  // así que traemos todas y filtramos acá las que están en favoritos.
  const todasLasLineas = await buscarLineas('numero', '');
  const lineasFav = state.favoritos
    .map((id) => todasLasLineas.find((l) => l.id_linea === id))
    .filter(Boolean);

  list.innerHTML = lineasFav
    .map(
      (l) => `
    <div class="result-item" data-linea-id="${l.id_linea}" role="button" tabindex="0" aria-label="Favorita ${l.nombre}" data-announce="Favorita ${l.nombre}">
      <div class="badge">⭐</div>
      <div class="info"><h3>${l.nombre}</h3><p>Tocá para ver paradas</p></div>
    </div>
  `
    )
    .join('');

  speak(`Tenés ${lineasFav.length} favoritos`, true);

  list.querySelectorAll('.result-item').forEach((item) => {
    item.addEventListener('click', () =>
      mostrarDetalleLinea(parseInt(item.dataset.lineaId), item.querySelector('h3').textContent)
    );
  });
}