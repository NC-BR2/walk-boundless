import { Router } from 'express';
import { pool } from '../db/conexion.js';

const router = Router();

// GET /api/paradas/:id
router.get('/:id', async (req, res) => {
  const idParada = parseInt(req.params.id);

  if (isNaN(idParada)) {
    return res.status(400).json({ error: 'El id de parada debe ser un número' });
  }

  try {
    const paradaResultado = await pool.query(
      `SELECT descripcion_ubicacion, referencia_accesibilidad, latitud, longitud
       FROM paradas WHERE id_parada = $1`,
      [idParada]
    );

    if (paradaResultado.rows.length === 0) {
      return res.status(404).json({ error: 'Parada no encontrada' });
    }

    const lineasResultado = await pool.query(
      `SELECT l.id_linea, l.nombre
       FROM lineas l
       INNER JOIN parada_linea pl ON l.id_linea = pl.id_linea
       WHERE pl.id_parada = $1
       ORDER BY l.nombre`,
      [idParada]
    );

    res.json({
      ...paradaResultado.rows[0],
      lineas: lineasResultado.rows,
    });
  } catch (error) {
    console.error('Error en GET /api/paradas/:id:', error.message);
    res.status(500).json({ error: 'Error al buscar la parada' });
  }
});

// GET /api/paradas/cercanas?lat=..&lng=..&radio=1000
router.get('/cercanas/buscar', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radio = parseFloat(req.query.radio) || 1000;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Se necesitan los parámetros lat y lng' });
  }

  try {
    // Fórmula de Haversine directamente en SQL: calcula la distancia
    // en metros entre la ubicación del usuario y cada parada
    const resultado = await pool.query(
      `SELECT id_parada, descripcion_ubicacion, latitud, longitud,
        (6371000 * acos(
          cos(radians($1)) * cos(radians(latitud)) *
          cos(radians(longitud) - radians($2)) +
          sin(radians($1)) * sin(radians(latitud))
        )) AS distancia
       FROM paradas
       ORDER BY distancia ASC`,
      [lat, lng]
    );

    const cercanas = resultado.rows.filter((p) => p.distancia <= radio);
    res.json(cercanas);
  } catch (error) {
    console.error('Error en GET /api/paradas/cercanas/buscar:', error.message);
    res.status(500).json({ error: 'Error al buscar paradas cercanas' });
  }
});

export default router;