// ============================================
// MAPA (Leaflet)
// ============================================
import { state } from './config.js';
import { speak, vibrate } from './voz.js';
import { obtenerDetalleParada, obtenerParadasCercanas } from './api.js';
import { mostrarMiUbicacion } from './geo.js';

const CENTRO_SALTA = { lat: -24.7889, lng: -65.4114 };

export async function inicializarMapa() {
  if (state.map) {
    state.map.invalidateSize();
    return;
  }

  state.map = L.map('map', { center: [CENTRO_SALTA.lat, CENTRO_SALTA.lng], zoom: 14, zoomControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(state.map);

  // Traemos "todas" las paradas pidiéndole a la API un radio muy grande
  // (50 km) desde el centro de Salta, reutilizando el endpoint de
  // paradas cercanas en vez de crear uno nuevo solo para esto.
  const paradas = await obtenerParadasCercanas(CENTRO_SALTA.lat, CENTRO_SALTA.lng, 50000);
  state.allParadas = paradas;

  const paradasValidas = paradas.filter(
    (p) => p.latitud && p.longitud && !isNaN(p.latitud) && !isNaN(p.longitud)
  );

  if (paradasValidas.length === 0) {
    speak('No hay paradas válidas.', true);
    return;
  }

  // Pedimos las líneas de cada parada en paralelo, para no tardar
  // una eternidad haciendo 25 pedidos uno detrás del otro.
  const paradasConLineas = await Promise.all(
    paradasValidas.map(async (parada) => {
      const detalle = await obtenerDetalleParada(parada.id_parada);
      const lineasNombres = detalle && detalle.lineas ? detalle.lineas.map((l) => l.nombre).join(', ') : '';
      return { parada, lineasNombres };
    })
  );

  paradasConLineas.forEach(({ parada, lineasNombres }) => {
    const iconoParada = L.divIcon({
      className: 'marcador-parada',
      html: '<div style="background: #FFD700; border: 3px solid #FFFFFF; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); font-weight: bold; color: #000;">🚏</div>',
      iconSize: [35, 35],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([parada.latitud, parada.longitud], { icon: iconoParada }).addTo(state.map);

    marker.bindPopup(`
      <div style="font-size: 14px; color: #000; padding: 10px;">
        <strong>📍 Parada</strong><br>
        <p style="margin: 8px 0;">${parada.descripcion_ubicacion}</p>
        <strong>🚌 Líneas:</strong> ${lineasNombres || 'Sin líneas'}
      </div>
    `);

    marker.on('click', () => {
      speak(`Parada: ${parada.descripcion_ubicacion}. Líneas: ${lineasNombres || 'Sin líneas'}`, true);
      vibrate([100, 50, 100]);
    });

    state.markers.push({ marker, parada });
  });

  const grupo = L.featureGroup(state.markers.map((m) => m.marker));
  state.map.fitBounds(grupo.getBounds(), { padding: [50, 50] });

  speak(`Mapa cargado con ${paradasValidas.length} paradas.`, true);
}

export async function mostrarParadasCercanas() {
  if (!state.userLocation) {
    speak('Primero activá tu ubicación. Tocá el botón Ubicación.', true);
    mostrarMiUbicacion();
    return;
  }

  speak('Calculando paradas cercanas...', true);

  const paradasCercanas = await obtenerParadasCercanas(state.userLocation.lat, state.userLocation.lng, 1000);

  if (!paradasCercanas || paradasCercanas.length === 0) {
    speak('No hay paradas en un radio de 1 kilómetro.', true);
    document.getElementById('mapStatus').textContent = '⚠️ Sin paradas cercanas';
    return;
  }

  const masCercana = paradasCercanas[0];
  const detalle = await obtenerDetalleParada(masCercana.id_parada);
  const lineasNombres = detalle && detalle.lineas ? detalle.lineas.map((l) => l.nombre).join(', ') : '';

  let mensajeVoz = `Se encontraron ${paradasCercanas.length} paradas cercanas. `;
  mensajeVoz += `La más próxima está a ${Math.round(masCercana.distancia)} metros. `;
  mensajeVoz += `Se encuentra ${masCercana.descripcion_ubicacion}. `;
  mensajeVoz += lineasNombres
    ? `Las líneas que pasan son: ${lineasNombres}.`
    : 'No hay líneas registradas para esta parada.';

  speak(mensajeVoz, true);
  document.getElementById('mapStatus').textContent = `📍 ${paradasCercanas.length} paradas (1km)`;

  state.map.setView([masCercana.latitud, masCercana.longitud], 16);

  const iconoCercana = L.divIcon({
    className: 'marcador-cercana',
    html: '<div style="background: #0066FF; border: 4px solid #FFFFFF; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">🎯</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const markerCercano = L.marker([masCercana.latitud, masCercana.longitud], { icon: iconoCercana })
    .addTo(state.map)
    .bindPopup(`
      <div style="font-size: 14px; color: #000; padding: 10px; max-width: 250px;">
        <strong style="font-size: 16px; color: #0066FF;">🎯 Parada más cercana</strong><br>
        <hr style="margin: 8px 0;">
        <strong>📏 Distancia:</strong> ${Math.round(masCercana.distancia)} metros<br>
        <strong>📍 Ubicación:</strong><br>
        <p style="margin: 5px 0; font-style: italic;">${masCercana.descripcion_ubicacion}</p>
        <strong>🚌 Líneas que pasan:</strong><br>
        <p style="margin: 5px 0; font-weight: bold; color: #0066FF;">${lineasNombres || 'Sin líneas registradas'}</p>
      </div>
    `)
    .openPopup();

  markerCercano.on('click', () => {
    speak(mensajeVoz, true);
    vibrate([100, 50, 100]);
  });
  vibrate([200, 100, 200, 100, 200]);
}