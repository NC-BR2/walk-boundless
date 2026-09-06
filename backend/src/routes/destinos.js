import { Router } from 'express';
import { pool } from '../db/conexion.js';
import { lugaresInteresSalta } from '../data/lugaresInteres.js';
import { obtenerIconoCategoria } from '../utils/iconos.js';
import { consultarNominatim } from '../utils/nominatim.js';

const router = Router();

// GET /api/destinos?q=plaza
router.get('/', async (req, res) => {
  const texto = (req.query.q || '').trim();

  if (texto.length < 2) {
    return res.json([]);
  }

  const query = texto.toLowerCase();
  const queryUpper = query.toUpperCase();
  const destinos = [];

  // 1. Lugares predefinidos (fijos, definidos en data/lugaresInteres.js)
  const lugaresFiltrados = lugaresInteresSalta.filter((lugar) =>
    lugar.nombre.toLowerCase().includes(query)
  );
  lugaresFiltrados.forEach((lugar) => {
    destinos.push({
      tipo: 'lugar_predefinido',
      nombre: lugar.nombre,
      nombreCompleto: lugar.nombre,
      lat: lugar.lat,
      lng: lugar.lng,
      categoria: lugar.categoria,
      icono: lugar.icono,
    });
  });

  // 2. Nominatim (geocodificación externa, con límite de 1 pedido/segundo)
  try {
    const resultadosNominatim = await consultarNominatim(texto);
    resultadosNominatim.forEach((lugar) => {
      const lat = parseFloat(lugar.lat);
      const lng = parseFloat(lugar.lon);
      const dentroDeSalta =
        lat >= -24.85 && lat <= -24.70 && lng >= -65.45 && lng <= -65.35;

      if (dentroDeSalta) {
        const yaExiste = destinos.some(
          (d) =>
            d.lat !== undefined &&
            Math.abs(d.lat - lat) < 0.001 &&
            Math.abs(d.lng - lng) < 0.001
        );
        if (!yaExiste) {
          destinos.push({
            tipo: 'lugar_osm',
            nombre: lugar.display_name.split(',')[0],
            nombreCompleto: lugar.display_name,
            lat,
            lng,
            categoria: lugar.type || lugar.class || 'lugar',
            icono: obtenerIconoCategoria(lugar.type || lugar.class),
          });
        }
      }
    });
  } catch (error) {
    console.warn('⚠️ Nominatim no disponible:', error.message);
  }

  // 3. Calles que coincidan con el texto buscado
  try {
    const callesResultado = await pool.query(
      'SELECT id_calle, nombre FROM calles WHERE UPPER(nombre) LIKE $1 ORDER BY nombre',
      [`%${queryUpper}%`]
    );
    callesResultado.rows.forEach((calle) => {
      destinos.push({
        tipo: 'calle',
        id: calle.id_calle,
        nombre: calle.nombre,
        nombreCompleto: `Calle ${calle.nombre}`,
        icono: '🛣️',
      });
    });
  } catch (error) {
    console.error('Error buscando calles para destinos:', error.message);
  }

  // 4. Paradas cuya descripción coincida con el texto buscado
  try {
    const paradasResultado = await pool.query(
      'SELECT id_parada, descripcion_ubicacion FROM paradas WHERE UPPER(descripcion_ubicacion) LIKE $1',
      [`%${queryUpper}%`]
    );
    paradasResultado.rows.forEach((parada) => {
      destinos.push({
        tipo: 'parada',
        id: parada.id_parada,
        nombre: parada.descripcion_ubicacion.substring(0, 60),
        nombreCompleto: parada.descripcion_ubicacion,
        icono: '🚏',
      });
    });
  } catch (error) {
    console.error('Error buscando paradas para destinos:', error.message);
  }

  res.json(destinos);
});

export default router;