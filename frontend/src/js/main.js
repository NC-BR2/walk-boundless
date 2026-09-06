// ============================================
// PUNTO DE ENTRADA DE LA APLICACIÓN
// ============================================
// Este archivo conecta todos los módulos entre sí: importa las
// funciones que necesita, engancha los botones de la interfaz,
// y arranca la app cuando la página termina de cargar.

import { config, state } from './config.js';
import {
  speak,
  vibrate,
  playAlert,
  inicializarReconocimiento,
  iniciarReconocimiento,
  setupHoverAnnouncements,
} from './voz.js';
import { mostrarMiUbicacion, usarUbicacionPrueba } from './geo.js';
import { mostrarParadasCercanas } from './mapa.js';
import { showScreen } from './navegacion.js';
import { buscarLineas, buscarCalles, buscarDestinos } from './api.js';
import { mostrarLineas, mostrarCalles, setupBusquedaLineas, setupBusquedaCalles } from './ui.js';
import { mostrarDestinos, setupBusquedaDestinos } from './destinos.js';

// ============================================
// PANTALLA DE ENTRADA Y MENÚ PRINCIPAL
// ============================================

document.getElementById('btnEnter').addEventListener('click', () => {
  playAlert();
  speak('Bienvenido a Walk Boundless. Transporte público accesible.', true);
  vibrate([100, 50, 100, 50, 100]);
  showScreen('menu');
});

document.querySelectorAll('.menu-item').forEach((item) => {
  item.addEventListener('click', () => {
    playAlert();
    showScreen(item.dataset.target);
  });
});

// ============================================
// BOTONES "VOLVER"
// ============================================

document.getElementById('backFromLineas').addEventListener('click', () => showScreen('menu'));
document.getElementById('backFromLineaDetalle').addEventListener('click', () => showScreen('lineas'));
document.getElementById('backFromParadas').addEventListener('click', () => showScreen('menu'));
document.getElementById('backFromParadasCalle').addEventListener('click', () => showScreen('paradas'));
document.getElementById('backFromParadaDetalle').addEventListener('click', () => showScreen('paradasCalle'));
document.getElementById('backFromRutas').addEventListener('click', () => showScreen('menu'));
document.getElementById('backFromMapa').addEventListener('click', () => showScreen('menu'));
document.getElementById('backFromFavoritos').addEventListener('click', () => showScreen('menu'));
document.getElementById('backFromAyuda').addEventListener('click', () => showScreen('menu'));
document.getElementById('backFromConfig').addEventListener('click', () => showScreen('menu'));

// ============================================
// CONFIGURACIÓN DE VOZ
// ============================================

document.getElementById('btnConfig').addEventListener('click', () => showScreen('config'));

document.getElementById('btnSlowVoice').addEventListener('click', () => {
  config.voiceRate = 0.7;
  speak('Voz lenta', true);
  playAlert();
});
document.getElementById('btnNormalVoice').addEventListener('click', () => {
  config.voiceRate = 1.0;
  speak('Voz normal', true);
  playAlert();
});
document.getElementById('btnFastVoice').addEventListener('click', () => {
  config.voiceRate = 1.4;
  speak('Voz rápida', true);
  playAlert();
});
document.getElementById('btnSaveConfig').addEventListener('click', () => showScreen('menu'));

// ============================================
// AYUDA
// ============================================

document.getElementById('btnVoiceTest').addEventListener('click', () => {
  speak('Hola. Soy Walk Boundless. Puedo ayudarte a encontrar líneas y paradas. Usá los botones de micrófono para buscar por voz.', true);
  vibrate([100, 50, 100, 50, 100]);
});

document.getElementById('btnReadHelp').addEventListener('click', () => {
  speak('Walk Boundless. En LÍNEAS buscá por número o ramal. En PARADAS buscá por calle. En CÓMO LLEGAR decí a dónde querés ir. Usá los micrófonos para buscar por voz. En el MAPA usá Ubicación y Cercanas.', true);
  vibrate([200, 100, 200]);
});

// ============================================
// MAPA
// ============================================

document.getElementById('btnMiUbicacion').addEventListener('click', mostrarMiUbicacion);
document.getElementById('btnCercanas').addEventListener('click', mostrarParadasCercanas);
document.getElementById('btnUbicacionPrueba').addEventListener('click', usarUbicacionPrueba);
document.getElementById('btnZoomIn').addEventListener('click', () => {
  if (state.map) {
    state.map.zoomIn();
    speak('Acercando', true);
  }
});

// ============================================
// MICRÓFONOS
// ============================================

const lineSearchInput = document.getElementById('lineSearchInput');
const calleSearchInput = document.getElementById('calleSearchInput');
const destinoSearchInput = document.getElementById('destinoSearchInput');

document.getElementById('micLineas').addEventListener('click', () => {
  iniciarReconocimiento(
    lineSearchInput,
    (transcript) => {
      setTimeout(async () => {
        mostrarLineas(await buscarLineas(config.currentFilter, transcript));
      }, 500);
    },
    document.getElementById('micLineas')
  );
});

document.getElementById('micParadas').addEventListener('click', () => {
  iniciarReconocimiento(
    calleSearchInput,
    (transcript) => {
      setTimeout(async () => {
        mostrarCalles(await buscarCalles(config.currentLetter, transcript));
      }, 500);
    },
    document.getElementById('micParadas')
  );
});

document.getElementById('micDestino').addEventListener('click', () => {
  iniciarReconocimiento(
    destinoSearchInput,
    (transcript) => {
      setTimeout(async () => {
        const destinos = await buscarDestinos(transcript);
        mostrarDestinos(destinos);
      }, 500);
    },
    document.getElementById('micDestino')
  );
});

// ============================================
// EVITAR EL "DOBLE TOQUE = ZOOM" EN MÓVILES
// ============================================

let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  false
);

// ============================================
// INICIALIZACIÓN
// ============================================

window.addEventListener('load', async () => {
  setupBusquedaLineas();
  setupBusquedaCalles();
  setupBusquedaDestinos();

  const soportaVoz = inicializarReconocimiento();
  if (!soportaVoz) {
    document.querySelectorAll('.mic-btn').forEach((btn) => (btn.style.display = 'none'));
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  mostrarCalles(await buscarCalles('TODAS', ''));
  setupHoverAnnouncements();

  setTimeout(() => {
    speak('Walk Boundless. App de transporte público accesible con 25 paradas. Tocá ingresar para comenzar.', true);
  }, 500);
});