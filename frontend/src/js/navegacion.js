// ============================================
// NAVEGACIÓN ENTRE PANTALLAS
// ============================================
import { speak, vibrate } from './voz.js';
import { inicializarMapa } from './mapa.js';
import { mostrarFavoritos } from './favoritos.js';

const TITULOS = {
  menu: 'Menú principal',
  lineas: 'Buscar líneas',
  lineaDetalle: 'Detalle de línea',
  paradas: 'Buscar paradas',
  paradasCalle: 'Paradas en calle',
  paradaDetalle: 'Detalle de parada',
  rutas: 'Cómo llegar',
  mapa: 'Mapa de paradas',
  favoritos: 'Favoritos',
  ayuda: 'Ayuda',
  config: 'Configuración',
};

export function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');

  speak(TITULOS[screenId] || screenId, true);
  vibrate([50]);

  if (screenId === 'mapa') setTimeout(() => { inicializarMapa(); }, 300);
  if (screenId === 'favoritos') mostrarFavoritos();
  if (screenId === 'rutas') {
    document.getElementById('destinoResults').innerHTML = '';
    document.getElementById('rutaResultado').innerHTML = '';
    document.getElementById('destinoSearchInput').value = '';
  }
}