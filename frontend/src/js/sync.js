// ============================================
// SINCRONIZACIÓN Y BASE DE DATOS LOCAL (IndexedDB)
// ============================================
// Este archivo es la pieza central del modo offline: mantiene una
// copia completa de calles, líneas, paradas y relaciones guardada
// directamente en el navegador, usando IndexedDB (una base de datos
// integrada en el propio navegador, pensada justo para este tipo de
// uso — mucho más apropiada que localStorage para este volumen de
// datos).

const NOMBRE_DB = 'walkboundless';
const VERSION_DB = 1;
const TABLAS = ['calles', 'lineas', 'paradas', 'relaciones', 'lugares'];

let dbPromise = null;

// Abre (o crea, la primera vez) la base de datos local. Devuelve
// siempre la misma promesa ya resuelta en llamadas posteriores, para
// no reabrir la conexión cada vez que se necesita.
function abrirDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB);

    solicitud.onupgradeneeded = (evento) => {
      const db = evento.target.result;
      TABLAS.forEach((tabla) => {
        if (!db.objectStoreNames.contains(tabla)) {
          // Cada "tabla" es un almacén de objetos separado. "id" es el
          // nombre genérico de la clave primaria en cada una (más
          // abajo, al guardar, se normaliza cada registro para que
          // siempre tenga ese campo).
          db.createObjectStore(tabla, { keyPath: 'id' });
        }
      });
      // Un almacén extra, chico, solo para metadatos (como la fecha de
      // la última sincronización exitosa).
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'clave' });
      }
    };

    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });

  return dbPromise;
}

// Guarda una lista completa de registros dentro de un almacén,
// reemplazando todo lo que hubiera antes (se usa durante la sincronización).
async function reemplazarTabla(nombreTabla, registros) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(nombreTabla, 'readwrite');
    const almacen = tx.objectStore(nombreTabla);
    almacen.clear();
    registros.forEach((registro) => almacen.put(registro));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Lee todos los registros guardados de un almacén.
export async function obtenerTabla(nombreTabla) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(nombreTabla, 'readonly');
    const solicitud = tx.objectStore(nombreTabla).getAll();
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function guardarMeta(clave, valor) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ clave, valor });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenerMeta(clave) {
  const db = await abrirDB();
  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readonly');
    const solicitud = tx.objectStore('meta').get(clave);
    solicitud.onsuccess = () => resolve(solicitud.result ? solicitud.result.valor : null);
    solicitud.onerror = () => resolve(null);
  });
}

// ¿Ya hay datos guardados localmente? (útil para saber si la primera
// sincronización ya se hizo alguna vez en este dispositivo)
export async function hayDatosLocales() {
  const calles = await obtenerTabla('calles');
  return calles.length > 0;
}

// Descarga todo desde /api/sync y reemplaza la copia local completa.
// Se llama al arrancar la app (si hay conexión) y también se puede
// disparar manualmente más adelante (por ejemplo, con un botón
// "Actualizar datos" en Configuración).
export async function sincronizar(apiUrl) {
  const respuesta = await fetch(`${apiUrl}/sync`);
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
  const datos = await respuesta.json();

  // Los datos que vienen de la API usan sus propios nombres de columna
  // (id_calle, id_linea, id_parada); acá los normalizamos para que
  // todos tengan un campo "id" genérico, que es lo que IndexedDB
  // necesita como clave primaria.
  const calles = datos.calles.map((c) => ({ id: c.id_calle, id_calle: c.id_calle, nombre: c.nombre }));
  const lineas = datos.lineas.map((l) => ({ id: l.id_linea, id_linea: l.id_linea, nombre: l.nombre }));
  const paradas = datos.paradas.map((p) => ({ id: p.id_parada, ...p }));
  const relaciones = datos.relaciones.map((r, indice) => ({ id: indice, ...r }));
  const lugares = datos.lugares.map((l, indice) => ({ id: indice, ...l }));

  await reemplazarTabla('calles', calles);
  await reemplazarTabla('lineas', lineas);
  await reemplazarTabla('paradas', paradas);
  await reemplazarTabla('relaciones', relaciones);
  await reemplazarTabla('lugares', lugares);
  await guardarMeta('ultimaSincronizacion', datos.version);

  return {
    calles: calles.length,
    lineas: lineas.length,
    paradas: paradas.length,
    relaciones: relaciones.length,
    lugares: lugares.length,
  };
}
