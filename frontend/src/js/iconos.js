// ============================================
// ÍCONOS EN SVG
// ============================================
// Reemplazan a los emojis que algunos dispositivos no renderizan bien
// (aparecen como un cuadrado vacío). Un SVG se dibuja igual en
// cualquier navegador/sistema operativo, porque no depende de que el
// dispositivo tenga instalada una fuente con ese glifo en particular.
// "currentColor" hace que el ícono tome automáticamente el color de
// texto del botón donde se use, sin tener que fijar un color a mano.

export const ICONO_MIC = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.15em"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;

export const ICONO_ALTAVOZ = `<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.15em"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

export const ICONO_ESTRELLA_VACIA = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" style="vertical-align:-0.15em"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/></svg>`;

export const ICONO_ESTRELLA_LLENA = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style="vertical-align:-0.15em"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/></svg>`;
