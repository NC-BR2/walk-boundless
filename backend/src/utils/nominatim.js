const ESPERA_MINIMA_MS = 1000;
let ultimaConsulta = 0;

// Este archivo es el único lugar de todo el backend que le habla a Nominatim.
// Al forzar una espera mínima entre pedidos acá, cualquier cantidad de
// usuarios de la app comparten el mismo límite de 1 pedido por segundo,
// respetando la política de uso de Nominatim aunque haya varias personas
// usando la app al mismo tiempo.
export async function consultarNominatim(texto) {
  const ahora = Date.now();
  const tiempoDesdeUltima = ahora - ultimaConsulta;

  if (tiempoDesdeUltima < ESPERA_MINIMA_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, ESPERA_MINIMA_MS - tiempoDesdeUltima)
    );
  }
  ultimaConsulta = Date.now();

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(texto)}&` +
    `format=json&` +
    `addressdetails=1&` +
    `limit=5&` +
    `accept-language=es`;

  const respuesta = await fetch(url, {
    headers: { 'User-Agent': 'WalkBoundlessApp/1.0' },
  });

  if (!respuesta.ok) {
    return [];
  }

  return respuesta.json();
}