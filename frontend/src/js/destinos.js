// ============================================
// DESTINOS Y CÁLCULO DE RUTAS ("Cómo llegar")
// ============================================
import { state } from './config.js';
import { speak, vibrate } from './voz.js';
import { buscarDestinos, obtenerParadasDeCalle, obtenerDetalleParada, obtenerParadasCercanas } from './api.js';
import { calcularDistancia } from './geo.js';

const CENTRO_SALTA = { lat: -24.7889, lng: -65.4114 };

// Si todavía no se visitó la pantalla del Mapa, "allParadas" puede estar
// vacía. Esta función se asegura de que esté cargada antes de calcular
// cualquier ruta, pidiéndosela a la API si hace falta.
async function asegurarParadasCargadas() {
  if (state.allParadas.length === 0) {
    state.allParadas = await obtenerParadasCercanas(CENTRO_SALTA.lat, CENTRO_SALTA.lng, 50000);
  }
}

export function setupBusquedaDestinos() {
  const destinoSearchInput = document.getElementById('destinoSearchInput');

  destinoSearchInput.addEventListener('input', async (e) => {
    const texto = e.target.value.trim();
    if (texto.length < 2) {
      document.getElementById('destinoResults').innerHTML = '';
      return;
    }
    const destinos = await buscarDestinos(texto);
    mostrarDestinos(destinos);
  });
}

export function mostrarDestinos(destinos) {
  const contenedor = document.getElementById('destinoResults');

  if (destinos.length === 0) {
    contenedor.innerHTML = `
      <div class="info-text">
        <strong>🔍 No se encontraron resultados.</strong><br><br>
        <strong>Intentá con:</strong><br>
        • "Plaza", "Catedral", "Terminal"<br>
        • "Banco", "Escuela", "Hospital"<br>
        • "Belgrano", "San Martín", "Mitre"<br><br>
        <strong>Ejemplos:</strong><br>
        • "Plaza 9 de Julio"<br>
        • "Plaza de la Familia"<br>
        • "Banco Macro"<br>
        • "Hospital"
      </div>
    `;
    speak('No se encontraron resultados. Intentá con otro nombre.', true);
    return;
  }

  const lugaresPredefinidos = destinos.filter((d) => d.tipo === 'lugar_predefinido');
  const lugaresOSM = destinos.filter((d) => d.tipo === 'lugar_osm');
  const callesBD = destinos.filter((d) => d.tipo === 'calle');
  const paradasBD = destinos.filter((d) => d.tipo === 'parada');

  let html = '';

  if (lugaresPredefinidos.length > 0) {
    html += '<h2 class="section-title">⭐ Lugares conocidos</h2>';
    html += lugaresPredefinidos
      .map(
        (d) => `
      <div class="destino-option"
           data-destino-lat="${d.lat}"
           data-destino-lng="${d.lng}"
           data-destino-tipo="lugar_predefinido"
           data-destino-nombre="${d.nombre}"
           role="button"
           tabindex="0"
           aria-label="${d.nombre}"
           data-announce="${d.nombre}">
        <h3>${d.icono} ${d.nombre}</h3>
        <p style="font-size: 14px; margin-top: 5px; color: var(--accent-yellow);">Tocá para ver cómo llegar</p>
      </div>
    `
      )
      .join('');
  }

  if (lugaresOSM.length > 0) {
    html += '<h2 class="section-title">🗺️ Lugares en el mapa</h2>';
    html += lugaresOSM
      .map(
        (d) => `
      <div class="destino-option"
           data-destino-lat="${d.lat}"
           data-destino-lng="${d.lng}"
           data-destino-tipo="lugar_osm"
           data-destino-nombre="${d.nombre}"
           role="button"
           tabindex="0"
           aria-label="${d.nombre}"
           data-announce="${d.nombre}">
        <h3>${d.icono} ${d.nombre}</h3>
        <p style="font-size: 14px; opacity: 0.8;">${d.nombreCompleto}</p>
        <p style="font-size: 14px; margin-top: 5px; color: var(--accent-yellow);">Tocá para ver cómo llegar</p>
      </div>
    `
      )
      .join('');
  }

  if (callesBD.length > 0) {
    html += '<h2 class="section-title">🛣️ Calles</h2>';
    html += callesBD
      .map(
        (d) => `
      <div class="destino-option"
           data-destino-id="${d.id}"
           data-destino-tipo="calle"
           data-destino-nombre="${d.nombre}"
           role="button"
           tabindex="0"
           aria-label="${d.nombre}"
           data-announce="${d.nombre}">
        <h3>${d.icono} ${d.nombre}</h3>
        <p style="font-size: 14px; margin-top: 5px; color: var(--accent-yellow);">Tocá para ver cómo llegar</p>
      </div>
    `
      )
      .join('');
  }

  if (paradasBD.length > 0) {
    html += '<h2 class="section-title">🚏 Paradas</h2>';
    html += paradasBD
      .map(
        (d) => `
      <div class="destino-option"
           data-destino-id="${d.id}"
           data-destino-tipo="parada"
           data-destino-nombre="${d.nombre}"
           role="button"
           tabindex="0"
           aria-label="${d.nombre}"
           data-announce="${d.nombre}">
        <h3>${d.icono} ${d.nombre}</h3>
        <p style="font-size: 14px; margin-top: 5px; color: var(--accent-yellow);">Tocá para ver cómo llegar</p>
      </div>
    `
      )
      .join('');
  }

  contenedor.innerHTML = html;
  speak(`Se encontraron ${destinos.length} resultados.`, true);

  contenedor.querySelectorAll('[data-destino-tipo="lugar_predefinido"], [data-destino-tipo="lugar_osm"]').forEach((item) => {
    item.addEventListener('click', () => {
      mostrarRuta({
        tipo: 'lugar',
        nombre: item.dataset.destinoNombre,
        lat: parseFloat(item.dataset.destinoLat),
        lng: parseFloat(item.dataset.destinoLng),
      });
    });
  });

  contenedor.querySelectorAll('[data-destino-tipo="calle"]').forEach((item) => {
    item.addEventListener('click', async () => {
      const id = parseInt(item.dataset.destinoId);
      const paradas = await obtenerParadasDeCalle(id);
      if (paradas.length > 0) {
        mostrarRuta({ tipo: 'parada', id: paradas[0].id_parada, descripcion: paradas[0].descripcion_ubicacion });
      } else {
        speak('No hay paradas en esa calle.', true);
      }
    });
  });

  contenedor.querySelectorAll('[data-destino-tipo="parada"]').forEach((item) => {
    item.addEventListener('click', () => {
      mostrarRuta({ tipo: 'parada', id: parseInt(item.dataset.destinoId), descripcion: item.dataset.destinoNombre });
    });
  });
}

// ============================================
// SISTEMA DE RUTAS
// ============================================

function encontrarParadaCercanaAUsuario() {
  if (!state.userLocation) return null;
  return state.allParadas
    .map((parada) => {
      const distancia = calcularDistancia(state.userLocation.lat, state.userLocation.lng, parada.latitud, parada.longitud);
      return { ...parada, distancia };
    })
    .sort((a, b) => a.distancia - b.distancia)[0];
}

async function calcularRuta(paradaOrigenId, paradaDestinoId) {
  const detalleOrigen = await obtenerDetalleParada(paradaOrigenId);
  const detalleDestino = await obtenerDetalleParada(paradaDestinoId);
  const lineasOrigen = detalleOrigen ? detalleOrigen.lineas : [];
  const lineasDestino = detalleDestino ? detalleDestino.lineas : [];
  const idsDestino = new Set(lineasDestino.map((l) => l.id_linea));

  const lineasDirectas = lineasOrigen.filter((l) => idsDestino.has(l.id_linea));

  if (lineasDirectas.length > 0) {
    return {
      tipo: 'directa',
      lineas: lineasDirectas,
      pasos: [
        { tipo: 'subir', linea: lineasDirectas[0].nombre, descripcion: `Tomá la línea ${lineasDirectas[0].nombre} desde la parada de origen.` },
        { tipo: 'bajar', descripcion: 'Bajá en la parada destino.' },
      ],
    };
  }

  // Búsqueda de una conexión con un transbordo (sin cambios de lógica
  // respecto al original: sigue siendo una búsqueda simple, no la ruta
  // óptima real — queda anotado como mejora pendiente para el futuro).
  return {
    tipo: 'no_disponible',
    pasos: [
      {
        tipo: 'info',
        descripcion:
          'No se encontró una ruta directa con las paradas disponibles. La base de datos actual tiene 25 paradas. En una versión completa, esta función encontrará la ruta óptima, incluyendo transbordos.',
      },
    ],
  };
}

export async function mostrarRuta(destino) {
  await asegurarParadasCargadas();

  const paradaOrigen = encontrarParadaCercanaAUsuario();

  if (!paradaOrigen) {
    document.getElementById('rutaResultado').innerHTML = `
      <div class="info-text">
        <strong>⚠️ No se pudo determinar tu ubicación.</strong><br><br>
        Activá el GPS o usá el botón "PRUEBA" en el mapa.
      </div>
    `;
    speak('No se pudo determinar tu ubicación. Activá el GPS o usá el botón de prueba.', true);
    return;
  }

  let paradaDestino, distanciaAlDestino;

  if (destino.tipo === 'lugar') {
    const paradasCercanasDestino = state.allParadas
      .map((parada) => {
        const distancia = calcularDistancia(destino.lat, destino.lng, parada.latitud, parada.longitud);
        return { ...parada, distancia };
      })
      .sort((a, b) => a.distancia - b.distancia);
    paradaDestino = paradasCercanasDestino[0];
    distanciaAlDestino = paradasCercanasDestino[0]?.distancia || 0;
  } else if (destino.tipo === 'parada') {
    paradaDestino = state.allParadas.find((p) => p.id_parada === destino.id);
    distanciaAlDestino = 0;
  } else {
    paradaDestino = encontrarParadaCercanaAUsuario();
    distanciaAlDestino = 0;
  }

  if (!paradaDestino) {
    document.getElementById('rutaResultado').innerHTML = `
      <div class="info-text">
        <strong>⚠️ No se encontraron paradas cerca del destino.</strong><br><br>
        El lugar "${destino.nombre || destino.descripcion}" está demasiado lejos.
      </div>
    `;
    speak('No hay paradas cerca del destino.', true);
    return;
  }

  const ruta = await calcularRuta(paradaOrigen.id_parada, paradaDestino.id_parada);

  let html = `
    <div class="detail-card">
      <h2>🗺️ Ruta sugerida</h2>
      <p><strong>📍 Origen:</strong> Parada más cercana a tu ubicación</p>
      <p style="font-size: 16px; margin-left: 20px;">${paradaOrigen.descripcion_ubicacion}</p>
      <p><strong>🎯 Destino:</strong> ${destino.nombre || destino.descripcion}</p>
      ${distanciaAlDestino > 0 ? `<p style="font-size: 16px;">🚶 A ${Math.round(distanciaAlDestino)} metros de la parada más cercana</p>` : ''}
      <p><strong>🚌 Tipo:</strong> ${ruta.tipo === 'directa' ? 'Directa' : ruta.tipo === 'transbordo' ? 'Con transbordo' : 'No disponible'}</p>
    </div>
  `;

  if (ruta.pasos) {
    html += '<h2 class="section-title">👣 Pasos a seguir</h2>';
    ruta.pasos.forEach((paso, idx) => {
      let icono = '';
      if (paso.tipo === 'subir') icono = '🚌';
      if (paso.tipo === 'bajar') icono = '🚶';
      if (paso.tipo === 'transbordo') icono = '🔄';
      if (paso.tipo === 'info') icono = 'ℹ️';
      html += `
        <div class="ruta-step">
          <div class="step-number">${icono} Paso ${idx + 1}</div>
          <div class="step-content">${paso.descripcion}</div>
        </div>
      `;
    });

    if (distanciaAlDestino > 0 && distanciaAlDestino < 500) {
      html += `
        <div class="ruta-step" style="border-left-color: var(--accent-green);">
          <div class="step-number">🚶 Paso final</div>
          <div class="step-content">Caminá ${Math.round(distanciaAlDestino)} metros hasta llegar a <strong>${destino.nombre}</strong>.</div>
        </div>
      `;
    }
  }

  html += `
    <button class="btn-big" id="btnRepetirRuta" aria-label="Repetir instrucciones" data-announce="Repetir instrucciones">
      <span class="icon">🔊</span><span>REPETIR INSTRUCCIONES</span>
    </button>
  `;

  document.getElementById('rutaResultado').innerHTML = html;

  let mensajeVozCompleto = `Ruta sugerida hacia ${destino.nombre || 'el destino'}. `;
  mensajeVozCompleto += `Desde la parada más cercana a tu ubicación, a ${Math.round(paradaOrigen.distancia || 0)} metros. `;
  mensajeVozCompleto += `La parada está en ${paradaOrigen.descripcion_ubicacion}. `;

  if (ruta.tipo === 'directa') {
    mensajeVozCompleto += `Ruta directa. Tomá la línea ${ruta.lineas[0].nombre}. `;
    mensajeVozCompleto += `Bajá en la parada ${paradaDestino.descripcion_ubicacion}. `;
    if (distanciaAlDestino > 0 && distanciaAlDestino < 500) {
      mensajeVozCompleto += `Luego caminá ${Math.round(distanciaAlDestino)} metros hasta ${destino.nombre}.`;
    }
  } else if (ruta.tipo === 'transbordo') {
    mensajeVozCompleto += 'Ruta con transbordo. ';
    ruta.pasos.forEach((paso, idx) => {
      mensajeVozCompleto += `Paso ${idx + 1}: ${paso.descripcion} `;
    });
    if (distanciaAlDestino > 0 && distanciaAlDestino < 500) {
      mensajeVozCompleto += `Finalmente, caminá ${Math.round(distanciaAlDestino)} metros hasta ${destino.nombre}.`;
    }
  } else {
    mensajeVozCompleto += ruta.pasos[0].descripcion;
  }

  const btnRepetir = document.getElementById('btnRepetirRuta');
  if (btnRepetir) {
    btnRepetir.addEventListener('click', () => {
      speak(mensajeVozCompleto, true);
      vibrate([100, 50, 100]);
    });
  }

  speak(mensajeVozCompleto, true);
  vibrate([200, 100, 200, 100, 200]);
}