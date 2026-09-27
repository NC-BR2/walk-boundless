// ============================================
// API — con respaldo offline
// ============================================
// Estrategia: "la red primero, lo local como respaldo". Cada función
// intenta pedirle los datos al backend, igual que siempre (con toda
// la búsqueda inteligente que ya tiene del lado del servidor). Si eso
// falla —sin señal, o el backend no responde—, recién ahí se busca en
// la copia guardada en el dispositivo (ver sync.js).

import { obtenerTabla, hayDatosLocales, sincronizar } from './sync.js';
import { calcularDistancia } from './geo.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function pedirJSON(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      console.error(`Error ${respuesta.status} al pedir ${url}`);
      return null;
    }
    return await respuesta.json();
  } catch (error) {
    console.warn('Sin conexión, usando datos guardados en el dispositivo:', error.message);
    return null;
  }
}

// --- SINCRONIZACIÓN ---

// Se llama al arrancar la app. Intenta descargar la última versión de
// los datos; si no hay conexión, sigue funcionando con lo que ya
// estaba guardado de una vez anterior (si existe).
export async function asegurarDatosLocales() {
  const yaHabiaDatos = await hayDatosLocales();
  try {
    await sincronizar(API_URL);
    return { exito: true, primeraVez: !yaHabiaDatos };
  } catch (error) {
    if (!yaHabiaDatos) {
      // Primera vez en este dispositivo Y sin conexión: no hay nada
      // guardado todavía para poder mostrar.
      return { exito: false, primeraVez: true };
    }
    console.warn('No se pudo actualizar los datos; se sigue usando la copia guardada.');
    return { exito: false, primeraVez: false };
  }
}

// --- LÍNEAS ---

export async function buscarLineas(filtro, texto) {
  const params = new URLSearchParams({ filtro, texto });
  const resultado = await pedirJSON(`${API_URL}/lineas?${params}`);
  if (resultado) return resultado;
  return buscarLineasLocal(filtro, texto);
}

async function buscarLineasLocal(filtro, texto) {
  const lineas = await obtenerTabla('lineas');
  const t = (texto || '').trim().toUpperCase();
  let resultado = lineas;
  if (t.length > 0) {
    resultado =
      filtro === 'ramal'
        ? lineas.filter((l) => {
            const m = l.nombre.toUpperCase().match(/^(\d+)([A-Z]+)/);
            return m ? m[2].startsWith(t) : false;
          })
        : lineas.filter((l) => l.nombre.toUpperCase().startsWith(t));
  }
  return resultado
    .map((l) => ({ id_linea: l.id_linea, nombre: l.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function obtenerParadasDeLinea(idLinea) {
  const resultado = await pedirJSON(`${API_URL}/lineas/${idLinea}/paradas`);
  if (resultado) return resultado;

  const [relaciones, paradas] = await Promise.all([obtenerTabla('relaciones'), obtenerTabla('paradas')]);
  const idsParadas = relaciones.filter((r) => r.id_linea === idLinea).map((r) => r.id_parada);
  return paradas
    .filter((p) => idsParadas.includes(p.id_parada))
    .map((p) => ({ id_parada: p.id_parada, descripcion_ubicacion: p.descripcion_ubicacion }));
}

// --- CALLES ---

export async function buscarCalles(filtro, texto) {
  const params = new URLSearchParams();
  if (filtro) params.set('filtro', filtro);
  if (texto) params.set('texto', texto);
  const resultado = await pedirJSON(`${API_URL}/calles?${params}`);
  if (resultado) return resultado;
  return buscarCallesLocal(filtro, texto);
}

async function buscarCallesLocal(filtro, texto) {
  const calles = await obtenerTabla('calles');
  const t = (texto || '').trim().toUpperCase();
  let resultado = calles;
  if (filtro && filtro !== 'TODAS') {
    const filtroUpper = filtro.toUpperCase();
    resultado = calles.filter((c) => c.nombre.toUpperCase().startsWith(filtroUpper));
  } else if (t.length > 0) {
    resultado = calles.filter((c) => c.nombre.toUpperCase().includes(t));
  }
  return resultado
    .map((c) => ({ id_calle: c.id_calle, nombre: c.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function obtenerParadasDeCalle(idCalle) {
  const resultado = await pedirJSON(`${API_URL}/calles/${idCalle}/paradas`);
  if (resultado) return resultado;

  const paradas = await obtenerTabla('paradas');
  return paradas
    .filter((p) => p.id_calle_principal === idCalle)
    .map((p) => ({ id_parada: p.id_parada, descripcion_ubicacion: p.descripcion_ubicacion }));
}

// --- PARADAS ---

export async function obtenerDetalleParada(idParada) {
  const resultado = await pedirJSON(`${API_URL}/paradas/${idParada}`);
  if (resultado) return resultado;

  const [paradas, relaciones, lineas] = await Promise.all([
    obtenerTabla('paradas'),
    obtenerTabla('relaciones'),
    obtenerTabla('lineas'),
  ]);
  const parada = paradas.find((p) => p.id_parada === idParada);
  if (!parada) return null;

  const idsLineas = relaciones.filter((r) => r.id_parada === idParada).map((r) => r.id_linea);
  const lineasDeParada = lineas
    .filter((l) => idsLineas.includes(l.id_linea))
    .map((l) => ({ id_linea: l.id_linea, nombre: l.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return {
    descripcion_ubicacion: parada.descripcion_ubicacion,
    referencia_accesibilidad: parada.referencia_accesibilidad,
    latitud: parada.latitud,
    longitud: parada.longitud,
    lineas: lineasDeParada,
  };
}

export async function obtenerParadasCercanas(lat, lng, radio = 1000) {
  const params = new URLSearchParams({ lat, lng, radio });
  const resultado = await pedirJSON(`${API_URL}/paradas/cercanas/buscar?${params}`);
  if (resultado) return resultado;

  const paradas = await obtenerTabla('paradas');
  return paradas
    .map((p) => ({ ...p, distancia: calcularDistancia(lat, lng, p.latitud, p.longitud) }))
    .filter((p) => p.distancia <= radio)
    .sort((a, b) => a.distancia - b.distancia);
}

// --- DESTINOS ---

export async function buscarDestinos(texto) {
  const params = new URLSearchParams({ q: texto });
  const resultado = await pedirJSON(`${API_URL}/destinos?${params}`);
  if (resultado) return resultado;
  return buscarDestinosLocal(texto);
}

async function buscarDestinosLocal(texto) {
  const t = texto.trim().toLowerCase();
  const [calles, paradas, lugares] = await Promise.all([
    obtenerTabla('calles'),
    obtenerTabla('paradas'),
    obtenerTabla('lugares'),
  ]);

  const destinos = [];

  lugares
    .filter((l) => l.nombre.toLowerCase().includes(t))
    .forEach((l) =>
      destinos.push({
        tipo: 'lugar_predefinido',
        nombre: l.nombre,
        nombreCompleto: l.nombre,
        lat: l.lat,
        lng: l.lng,
        categoria: l.categoria,
        icono: l.icono,
      })
    );

  calles
    .filter((c) => c.nombre.toLowerCase().includes(t))
    .forEach((c) =>
      destinos.push({
        tipo: 'calle',
        id: c.id_calle,
        nombre: c.nombre,
        nombreCompleto: `Calle ${c.nombre}`,
        icono: '🛣️',
      })
    );

  paradas
    .filter((p) => p.descripcion_ubicacion.toLowerCase().includes(t))
    .forEach((p) =>
      destinos.push({
        tipo: 'parada',
        id: p.id_parada,
        nombre: p.descripcion_ubicacion.substring(0, 60),
        nombreCompleto: p.descripcion_ubicacion,
        icono: '🚏',
      })
    );

  // Sin conexión no se puede consultar Nominatim, así que esta versión
  // local no incluye lugares fuera de los 35 predefinidos.
  return destinos;
}
