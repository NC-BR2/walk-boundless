// ============================================
// SERVICE WORKER
// ============================================
// Se instala una vez en el navegador y sigue "vivo" aunque la pestaña
// esté cerrada. Es lo que permite que la app abra sin conexión: cada
// archivo que se carga con éxito (HTML, CSS, JS) se guarda en un
// caché propio del navegador; si más adelante un pedido falla por
// falta de conexión, se responde con esa copia guardada en su lugar.

const CACHE_NAME = 'walkboundless-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  // Borra cachés de versiones anteriores, si las hubiera (por ejemplo,
  // si en el futuro cambiamos CACHE_NAME a "walkboundless-v2").
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((nombre) => nombre !== CACHE_NAME).map((nombre) => caches.delete(nombre)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;

  // Solo nos ocupamos de pedidos GET del propio sitio (HTML, CSS, JS,
  // íconos). Los pedidos a la API, a Nominatim o a los tiles del mapa
  // pasan de largo sin cachear — esos ya tienen su propio respaldo
  // (IndexedDB) o directamente necesitan ser siempre datos frescos.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    caches.match(request).then((respuestaGuardada) => {
      const pedidoDeRed = fetch(request)
        .then((respuestaDeRed) => {
          if (respuestaDeRed && respuestaDeRed.ok) {
            const copia = respuestaDeRed.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
          }
          return respuestaDeRed;
        })
        .catch(async () => {
          // La red falló. En orden de preferencia:
          // 1) la copia guardada de este mismo archivo, si existe;
          // 2) si es una carga de página, la página de inicio guardada;
          // 3) una respuesta "sin conexión" válida, para que el navegador
          //    nunca reciba un valor vacío (eso era lo que causaba el error).
          if (respuestaGuardada) return respuestaGuardada;
          if (request.mode === 'navigate') {
            const inicio = await caches.match('/');
            if (inicio) return inicio;
          }
          return new Response('Sin conexión', { status: 503, statusText: 'Sin conexión' });
        });

      // Si ya había una copia guardada, la devolvemos al instante
      // (más rápido) y de paso actualizamos el caché de fondo. Si es
      // la primera vez que se pide este archivo, esperamos a la red.
      return respuestaGuardada || pedidoDeRed;
    })
  );
});