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
import { ICONO_MIC } from './iconos.js';
import { asegurarDatosLocales } from './api.js';

// ============================================
// PANTALLA DE ENTRADA Y MENÚ PRINCIPAL
// ============================================
// Registrar el Service Worker (habilita el modo offline de la página
// en sí). Si el navegador no lo soporta, o falla el registro, la app
// sigue funcionando normal, solo que sin esta capa extra.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('No se pudo registrar el service worker:', error.message);
    });
  });
}

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

window.addEventListener('load', () => {
  setupBusquedaLineas();
  setupBusquedaCalles();
  setupBusquedaDestinos();
  setupHoverAnnouncements();
  setupHoverAnnouncements();
  document.querySelectorAll('.mic-btn').forEach((btn) => { btn.innerHTML = ICONO_MIC; });

  const soportaVoz = inicializarReconocimiento();
  if (!soportaVoz) {
    document.querySelectorAll('.mic-btn').forEach((btn) => (btn.style.display = 'none'));
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // El saludo se dice de inmediato, sin esperar ningún pedido de red.
  // PERO: muchos navegadores de celular bloquean el audio automático
  // hasta que la persona toque la pantalla al menos una vez. Por eso,
  // además del intento inmediato, dejamos un "plan B" que dice el
  // mismo saludo apenas ocurra el primer toque en cualquier parte de
  // la pantalla — salvo que ese primer toque sea justo el botón
  // "INGRESAR", que ya tiene su propio mensaje de bienvenida.
  let yaSaludo = false;
  function saludarBienvenida() {
    if (yaSaludo) return;
    yaSaludo = true;
    speak('Walk Boundless. App de transporte público accesible. Tocá ingresar para comenzar.', true);
  }

  setTimeout(saludarBienvenida, 500);

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target.closest('#btnEnter')) return;
      saludarBienvenida();
    },
    { once: true }
  );

  // La carga de calles pasa a ser "de fondo": no bloquea nada de lo anterior,
  // y si tarda (por ejemplo, porque el backend estaba dormido), el usuario
  // ya puede estar usando la app mientras tanto.
  asegurarDatosLocales().then((resultado) => {
    if (!resultado.exito && resultado.primeraVez) {
      speak('Necesitás conexión a internet la primera vez que usás la app.', true);
    }
  });

  buscarCalles('TODAS', '').then((calles) => mostrarCalles(calles, false));
});