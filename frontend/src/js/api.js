// ============================================
// API — reemplaza por completo a sql.js
// ============================================
// Antes, cada función acá abajo hacía una consulta SQL directa
// contra una base de datos cargada en el propio navegador (db.exec(...)).
// Ahora, cada una hace un pedido (fetch) al backend, que es quien
// realmente le habla a la base de datos en Neon.

const API_URL = 'http://localhost:3000/api';

// Función auxiliar interna: hace el fetch, controla errores de red
// y devuelve siempre JSON (o null si algo salió mal).
async function pedirJSON(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      console.error(`Error ${respuesta.status} al pedir ${url}`);
      return null;
    }
    return await respuesta.json();
  } catch (error) {
    console.error('Error de red al conectar con el backend:', error.message);
    return null;
  }
}

// --- LÍNEAS ---

export async function buscarLineas(filtro, texto) {
  const params = new URLSearchParams({ filtro, texto });
  const resultado = await pedirJSON(`${API_URL}/lineas?${params}`);
  return resultado || [];
}

export async function obtenerParadasDeLinea(idLinea) {
  const resultado = await pedirJSON(`${API_URL}/lineas/${idLinea}/paradas`);
  return resultado || [];
}

// --- CALLES ---

export async function buscarCalles(filtro, texto) {
  const params = new URLSearchParams();
  if (filtro) params.set('filtro', filtro);
  if (texto) params.set('texto', texto);
  const resultado = await pedirJSON(`${API_URL}/calles?${params}`);
  return resultado || [];
}

export async function obtenerParadasDeCalle(idCalle) {
  const resultado = await pedirJSON(`${API_URL}/calles/${idCalle}/paradas`);
  return resultado || [];
}

// --- PARADAS ---

export async function obtenerDetalleParada(idParada) {
  return await pedirJSON(`${API_URL}/paradas/${idParada}`);
}

export async function obtenerParadasCercanas(lat, lng, radio = 1000) {
  const params = new URLSearchParams({ lat, lng, radio });
  const resultado = await pedirJSON(`${API_URL}/paradas/cercanas/buscar?${params}`);
  return resultado || [];
}

// --- DESTINOS ---

export async function buscarDestinos(texto) {
  const params = new URLSearchParams({ q: texto });
  const resultado = await pedirJSON(`${API_URL}/destinos?${params}`);
  return resultado || [];
}