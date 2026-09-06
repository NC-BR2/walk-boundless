// ============================================
// UI: pantallas de Líneas, Calles y Paradas
// ============================================
import { config, state, guardarFavoritos } from './config.js';
import { speak, vibrate, playAlert } from './voz.js';
import {
  buscarLineas,
  obtenerParadasDeLinea,
  buscarCalles,
  obtenerParadasDeCalle,
  obtenerDetalleParada,
} from './api.js';
import { showScreen } from './navegacion.js';

// ============================================
// LÍNEAS
// ============================================

export async function mostrarLineas(lineas) {
  const lineResults = document.getElementById('lineResults');

  if (lineas.length === 0) {
    lineResults.innerHTML = '<div class="info-text">No se encontraron líneas</div>';
    speak('No se encontraron líneas', true);
    return;
  }

  lineResults.innerHTML = lineas
    .map(
      (l) => `
    <div class="result-item" data-linea-id="${l.id_linea}" role="button" tabindex="0" aria-label="Línea ${l.nombre}" data-announce="Línea ${l.nombre}">
      <div class="badge">🚌</div>
      <div class="info"><h3>${l.nombre}</h3><p>Tocá para ver paradas</p></div>
    </div>
  `
    )
    .join('');

  speak(`Se encontraron ${lineas.length} líneas`, true);

  lineResults.querySelectorAll('.result-item').forEach((item) => {
    item.addEventListener('click', () => mostrarDetalleLinea(parseInt(item.dataset.lineaId), item.querySelector('h3').textContent));
  });
}

export async function mostrarDetalleLinea(idLinea, nombreLinea) {
  const paradas = await obtenerParadasDeLinea(idLinea);

  document.getElementById('lineaDetalleTitle').textContent = nombreLinea;

  const btnFav = document.getElementById('btnFavLinea');
  if (state.favoritos.includes(idLinea)) {
    btnFav.classList.add('active');
    btnFav.innerHTML = '★';
    btnFav.setAttribute('aria-label', 'Quitar de favoritos');
  } else {
    btnFav.classList.remove('active');
    btnFav.innerHTML = '☆';
    btnFav.setAttribute('aria-label', 'Agregar a favoritos');
  }

  btnFav.onclick = () => {
    if (state.favoritos.includes(idLinea)) {
      state.favoritos = state.favoritos.filter((f) => f !== idLinea);
      btnFav.classList.remove('active');
      btnFav.innerHTML = '☆';
      speak('Línea quitada de favoritos', true);
    } else {
      state.favoritos.push(idLinea);
      btnFav.classList.add('active');
      btnFav.innerHTML = '★';
      speak('Línea agregada a favoritos', true);
      playAlert();
    }
    guardarFavoritos();
    vibrate([100, 50, 100]);
  };

  const lista = document.getElementById('lineaParadasList');
  if (paradas.length === 0) {
    lista.innerHTML = '<div class="info-text">No hay paradas para esta línea</div>';
    speak('No hay paradas para esta línea', true);
  } else {
    lista.innerHTML = paradas
      .map(
        (p) => `
      <div class="stop-item" role="button" tabindex="0" aria-label="${p.descripcion_ubicacion}" data-announce="${p.descripcion_ubicacion}">
        📍 ${p.descripcion_ubicacion}
      </div>
    `
      )
      .join('');

    speak(`Línea ${nombreLinea}. Tiene ${paradas.length} paradas.`, true);

    lista.querySelectorAll('.stop-item').forEach((item, idx) => {
      item.addEventListener('click', () => {
        speak(paradas[idx].descripcion_ubicacion, true);
        vibrate([100, 50, 100]);
      });
    });
  }

  playAlert();
  showScreen('lineaDetalle');
}

export function setupBusquedaLineas() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      config.currentFilter = btn.dataset.filter;
      speak(`Filtro por ${config.currentFilter === 'numero' ? 'número' : 'ramal'} activado`, true);
      vibrate([50]);
      const texto = document.getElementById('lineSearchInput').value;
      if (texto.trim().length > 0) {
        mostrarLineas(await buscarLineas(config.currentFilter, texto));
      }
    });
  });

  document.getElementById('lineSearchInput').addEventListener('input', async (e) => {
    mostrarLineas(await buscarLineas(config.currentFilter, e.target.value.trim()));
  });
}

// ============================================
// CALLES
// ============================================

export function setupBusquedaCalles() {
  const alphabetFilter = document.getElementById('alphabetFilter');
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  alphabetFilter.innerHTML =
    '<button class="letter-btn active" data-letra="TODAS" data-announce="Mostrar todas">TODAS</button>' +
    letras.map((l) => `<button class="letter-btn" data-letra="${l}" data-announce="Filtrar por ${l}">${l}</button>`).join('');

  alphabetFilter.addEventListener('click', async (e) => {
    if (e.target.classList.contains('letter-btn')) {
      document.querySelectorAll('.letter-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      config.currentLetter = e.target.dataset.letra;
      speak(`Filtro por ${config.currentLetter === 'TODAS' ? 'todas' : config.currentLetter}`, true);
      vibrate([50]);
      mostrarCalles(await buscarCalles(config.currentLetter, ''));
    }
  });

  document.getElementById('calleSearchInput').addEventListener('input', async (e) => {
    mostrarCalles(await buscarCalles(config.currentLetter, e.target.value.trim()));
  });
}

export async function mostrarCalles(calles) {
  const calleResults = document.getElementById('calleResults');

  if (calles.length === 0) {
    calleResults.innerHTML = '<div class="info-text">No se encontraron calles</div>';
    speak('No se encontraron calles', true);
    return;
  }

  calleResults.innerHTML = calles
    .map(
      (c) => `
    <div class="result-item" data-calle-id="${c.id_calle}" data-calle-nombre="${c.nombre}" role="button" tabindex="0" aria-label="Calle ${c.nombre}" data-announce="Calle ${c.nombre}">
      <div class="badge">🛣️</div>
      <div class="info"><h3>${c.nombre}</h3><p>Tocá para ver paradas</p></div>
    </div>
  `
    )
    .join('');

  speak(`Se encontraron ${calles.length} calles`, true);

  calleResults.querySelectorAll('.result-item').forEach((item) => {
    item.addEventListener('click', () => {
      mostrarParadasDeCalle(parseInt(item.dataset.calleId), item.dataset.calleNombre);
    });
  });
}

export async function mostrarParadasDeCalle(idCalle, nombreCalle) {
  const paradas = await obtenerParadasDeCalle(idCalle);
  document.getElementById('calleTitle').textContent = nombreCalle;

  const lista = document.getElementById('paradasCalleList');
  if (paradas.length === 0) {
    lista.innerHTML = '<div class="info-text">No hay paradas en esta calle</div>';
    speak('No hay paradas en esta calle', true);
  } else {
    lista.innerHTML = paradas
      .map(
        (p) => `
      <div class="stop-item" data-parada-id="${p.id_parada}" role="button" tabindex="0" aria-label="${p.descripcion_ubicacion}" data-announce="${p.descripcion_ubicacion}">
        📍 ${p.descripcion_ubicacion}
      </div>
    `
      )
      .join('');
    speak(`Hay ${paradas.length} paradas en ${nombreCalle}.`, true);
    lista.querySelectorAll('.stop-item').forEach((item) => {
      item.addEventListener('click', () => mostrarDetalleParada(parseInt(item.dataset.paradaId)));
    });
  }

  playAlert();
  showScreen('paradasCalle');
}

// ============================================
// DETALLE DE PARADA
// ============================================

export async function mostrarDetalleParada(idParada) {
  const detalle = await obtenerDetalleParada(idParada);
  if (!detalle) return;

  const { descripcion_ubicacion: descripcion, referencia_accesibilidad: accesibilidad, lineas } = detalle;

  const lineasHtml = lineas
    .map(
      (l) => `
    <div class="linea-item" role="button" tabindex="0" aria-label="Línea ${l.nombre}" data-announce="Línea ${l.nombre}">
      <span class="icon">🚌</span><span>${l.nombre}</span>
    </div>
  `
    )
    .join('');

  document.getElementById('paradaDetalleContent').innerHTML = `
    <div class="detail-card"><h2>📍 Ubicación</h2><p>${descripcion}</p></div>
    <div class="detail-card"><h2>♿ Accesibilidad</h2><p>${accesibilidad || 'Información no disponible'}</p></div>
    <div class="detail-card"><h2>🚌 Líneas que pasan</h2>${lineas.length > 0 ? lineasHtml : '<p>No hay líneas registradas</p>'}</div>
  `;

  document.querySelectorAll('.linea-item').forEach((item) => {
    item.addEventListener('click', () => {
      speak(`Línea ${item.querySelector('span:last-child').textContent}`, true);
      vibrate([100, 50, 100]);
    });
  });

  let textoVoz = `Parada: ${descripcion}. `;
  if (accesibilidad) textoVoz += `Accesibilidad: ${accesibilidad}. `;
  if (lineas.length > 0) textoVoz += `Líneas: ${lineas.map((l) => l.nombre).join(', ')}`;

  speak(textoVoz, true);
  playAlert();
  vibrate([200, 100, 200]);
  showScreen('paradaDetalle');
}