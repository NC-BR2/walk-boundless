// ============================================
// GEOLOCALIZACIÓN
// ============================================
import { state } from './config.js';
import { speak, vibrate } from './voz.js';

// Distancia en metros entre dos puntos de lat/lng (fórmula de Haversine).
// Se usa del lado del cliente para cálculos rápidos que no requieren
// consultar al backend (por ejemplo, mostrar distancias ya conocidas).
export function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function mostrarMiUbicacion() {
  if (!navigator.geolocation) {
    speak('Tu navegador no soporta geolocalización.', true);
    document.getElementById('mapStatus').textContent = '❌ No soportada';
    return;
  }

  if (
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    speak('La geolocalización requiere HTTPS. Usá el botón PRUEBA.', true);
    document.getElementById('mapStatus').textContent = '⚠️ Requiere HTTPS';
    return;
  }

  speak('Buscando tu ubicación...', true);
  document.getElementById('mapStatus').textContent = '📍 Buscando...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      speak(`Ubicación encontrada. Precisión: ${Math.round(state.userLocation.accuracy)} metros.`, true);
      document.getElementById('mapStatus').textContent = '✅ Ubicación encontrada';
      centrarEnUsuario();
      vibrate([200, 100, 200]);
    },
    (error) => {
      let msg = 'No se pudo obtener tu ubicación. ';
      if (error.code === error.PERMISSION_DENIED) msg += 'Permiso denegado.';
      else if (error.code === error.POSITION_UNAVAILABLE) msg += 'GPS no disponible.';
      else if (error.code === error.TIMEOUT) msg += 'Tiempo agotado.';
      speak(msg, true);
      document.getElementById('mapStatus').textContent = '❌ Error';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

export function centrarEnUsuario() {
  if (!state.userLocation || !state.map) return;
  if (state.userMarker) state.map.removeLayer(state.userMarker);

  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: '<div style="background: #0066FF; border: 4px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  state.userMarker = L.marker([state.userLocation.lat, state.userLocation.lng], { icon: userIcon }).addTo(state.map);
  state.userMarker
    .bindPopup(`<strong>📍 Tu ubicación</strong><br>Precisión: ${state.userLocation.accuracy ? Math.round(state.userLocation.accuracy) : '?'} metros`)
    .openPopup();
  state.map.setView([state.userLocation.lat, state.userLocation.lng], 16);

  if (state.userLocation.accuracy) {
    L.circle([state.userLocation.lat, state.userLocation.lng], {
      radius: state.userLocation.accuracy,
      color: '#0066FF',
      fillColor: '#0066FF',
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(state.map);
  }
}

export function usarUbicacionPrueba() {
  speak('Usando ubicación de prueba: Centro de Salta', true);
  state.userLocation = { lat: -24.7889, lng: -65.4114, accuracy: 10 };
  document.getElementById('mapStatus').textContent = '🧪 Ubicación de prueba';
  centrarEnUsuario();
}