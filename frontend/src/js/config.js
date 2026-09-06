// ============================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ============================================
// Todo lo que antes eran variables sueltas (config, favoritos, map, etc.)
// ahora vive dentro de un único objeto "state", exportado desde acá.
// Cualquier otro archivo que necesite leer o modificar estos valores
// los importa desde este módulo, en vez de depender de variables globales.

export const config = {
  voiceEnabled: true,
  voiceRate: 1.0,
  currentFilter: 'numero',
  currentLetter: null,
};

export const state = {
  favoritos: JSON.parse(localStorage.getItem('wb_favoritos') || '[]'),
  map: null,
  markers: [],
  userMarker: null,
  userLocation: null,
  allParadas: [],
  isListening: false,
};

export function guardarFavoritos() {
  localStorage.setItem('wb_favoritos', JSON.stringify(state.favoritos));
}