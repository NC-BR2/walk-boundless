// ============================================
// VOZ: síntesis (hablar) y reconocimiento (escuchar)
// ============================================
import { config, state } from './config.js';

const synth = window.speechSynthesis;
let hoverTimeout = null;

export function speak(text, priority = false) {
  if (!config.voiceEnabled) return;

  // Si está escuchando, NO hablar para evitar feedback
  if (state.isListening) {
    console.log('⚠️ TTS bloqueado: micrófono activo');
    return;
  }

  synth.cancel();
  if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-AR';
  utterance.rate = config.voiceRate;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = synth.getVoices();
  const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
  if (spanishVoice) utterance.voice = spanishVoice;

  const indicator = document.getElementById('voiceIndicator');
  indicator.classList.add('active');
  utterance.onend = () => { indicator.classList.remove('active'); };
  utterance.onerror = () => { indicator.classList.remove('active'); };

  if (priority) { synth.speak(utterance); }
  else { setTimeout(() => { synth.speak(utterance); }, 50); }
}

export function speakHover(text) {
  if (!config.voiceEnabled || state.isListening) return;
  synth.cancel();
  if (hoverTimeout) clearTimeout(hoverTimeout);

  hoverTimeout = setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = config.voiceRate;

    const voices = synth.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    const indicator = document.getElementById('voiceIndicator');
    indicator.classList.add('active');
    utterance.onend = () => indicator.classList.remove('active');
    utterance.onerror = () => indicator.classList.remove('active');

    synth.speak(utterance);
  }, 30);
}

export function vibrate(pattern = [100, 50, 100]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

export function playAlert() {
  if (state.isListening) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    oscillator.start();
    setTimeout(() => { oscillator.frequency.value = 1000; }, 150);
    setTimeout(() => { oscillator.stop(); audioCtx.close(); }, 300);
  } catch (e) {
    console.warn('No se pudo reproducir el sonido de alerta:', e.message);
  }
  vibrate([200, 100, 200]);
}

// ============================================
// RECONOCIMIENTO DE VOZ
// ============================================
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let currentMicBtn = null;
let currentInput = null;
let currentCallback = null;

export function inicializarReconocimiento() {
  if (!SpeechRecognitionAPI) {
    console.warn('⚠️ Reconocimiento de voz no soportado');
    return false;
  }

  recognition = new SpeechRecognitionAPI();
  recognition.lang = 'es-AR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    state.isListening = true;
    if (currentMicBtn) {
      currentMicBtn.classList.add('listening');
      currentMicBtn.innerHTML = '🔴';
    }
    const indicator = document.getElementById('voiceIndicator');
    indicator.classList.add('active');
    indicator.innerHTML = '🎤';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('🎤 Reconocido:', transcript);

    if (currentInput) {
      currentInput.value = transcript;
      currentInput.dispatchEvent(new Event('input'));
    }

    if (currentCallback) {
      setTimeout(() => currentCallback(transcript), 300);
    }
  };

  recognition.onerror = (event) => {
    console.error('❌ Error:', event.error);
  };

  recognition.onend = () => {
    state.isListening = false;
    if (currentMicBtn) {
      currentMicBtn.classList.remove('listening');
      currentMicBtn.innerHTML = '🎤';
    }
    const indicator = document.getElementById('voiceIndicator');
    indicator.classList.remove('active');
    indicator.innerHTML = '🔊';

    setTimeout(() => {
      if (currentInput && currentInput.value) {
        speak('Escuché: ' + currentInput.value, true);
      } else {
        speak('No pude entender. Intentá de nuevo.', true);
      }
    }, 500);
  };

  return true;
}

export function iniciarReconocimiento(inputElement, callback, micBtn = null) {
  if (!recognition) {
    speak('El reconocimiento de voz no está disponible. Usá Chrome.', true);
    return;
  }

  if (
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    speak('El micrófono requiere HTTPS.', true);
    return;
  }

  synth.cancel();
  setTimeout(() => {
    currentInput = inputElement;
    currentCallback = callback || null;
    currentMicBtn = micBtn;

    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
      setTimeout(() => recognition.start(), 100);
    }
  }, 300);
}

// ============================================
// ANUNCIOS AL PASAR EL FOCO (hover / focus)
// ============================================
export function setupHoverAnnouncements() {
  document.querySelectorAll('[data-announce]').forEach((element) => {
    element.addEventListener('mouseenter', (e) => {
      const text = e.target.getAttribute('data-announce');
      if (text) speakHover(text);
    });
    element.addEventListener('focus', (e) => {
      const text = e.target.getAttribute('data-announce');
      if (text) speakHover(text);
    });
  });

  document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('mouseenter', () => speakHover(item.querySelector('.label').textContent));
    item.addEventListener('focus', () => speakHover(item.querySelector('.label').textContent));
  });

  document.addEventListener('mouseenter', (e) => {
    const resultItem = e.target.closest('.result-item');
    if (resultItem) { const h3 = resultItem.querySelector('h3'); if (h3) speakHover(h3.textContent); }
    const stopItem = e.target.closest('.stop-item');
    if (stopItem) speakHover(stopItem.textContent.trim());
    const lineaItem = e.target.closest('.linea-item');
    if (lineaItem) { const span = lineaItem.querySelector('span:last-child'); if (span) speakHover('Línea ' + span.textContent); }
    const letterBtn = e.target.closest('.letter-btn');
    if (letterBtn) { const letra = letterBtn.dataset.letra; speakHover(letra === 'TODAS' ? 'Mostrar todas' : 'Filtrar por ' + letra); }
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) speakHover(filterBtn.textContent.trim());
    const micBtn = e.target.closest('.mic-btn');
    if (micBtn) speakHover('Tocá para hablar');
    const destinoOpt = e.target.closest('.destino-option');
    if (destinoOpt) { const h3 = destinoOpt.querySelector('h3'); if (h3) speakHover(h3.textContent); }
  }, true);

  document.addEventListener('focus', (e) => {
    const resultItem = e.target.closest('.result-item');
    if (resultItem) { const h3 = resultItem.querySelector('h3'); if (h3) speakHover(h3.textContent); }
    const stopItem = e.target.closest('.stop-item');
    if (stopItem) speakHover(stopItem.textContent.trim());
    const lineaItem = e.target.closest('.linea-item');
    if (lineaItem) { const span = lineaItem.querySelector('span:last-child'); if (span) speakHover('Línea ' + span.textContent); }
    const destinoOpt = e.target.closest('.destino-option');
    if (destinoOpt) { const h3 = destinoOpt.querySelector('h3'); if (h3) speakHover(h3.textContent); }
  }, true);
}