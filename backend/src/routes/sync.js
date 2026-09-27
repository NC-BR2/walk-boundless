import { Router } from 'express';
import { pool } from '../db/conexion.js';

const router = Router();

// GET /api/sync — devuelve una copia completa de los datos, pensada
// para que el dispositivo del usuario la guarde localmente y pueda
// seguir funcionando sin conexión.
router.get('/', async (req, res) => {
  try {
    const [calles, lineas, paradas, relaciones] = await Promise.all([
      pool.query('SELECT id_calle, nombre FROM calles ORDER BY id_calle'),
      pool.query('SELECT id_linea, nombre FROM lineas ORDER BY id_linea'),
      pool.query(
        `SELECT id_parada, id_calle_principal, id_calle_interseccion,
                latitud, longitud, descripcion_ubicacion, referencia_accesibilidad
         FROM paradas ORDER BY id_parada`
      ),
      pool.query('SELECT id_parada, id_linea FROM parada_linea ORDER BY id_parada, id_linea'),
    ]);

    res.json({
      version: Date.now(), // marca de tiempo: sirve para que el dispositivo
                            // sepa cuándo fue la última vez que se generó
                            // esta copia, útil más adelante para decidir
                            // si vale la pena volver a descargar todo.
      calles: calles.rows,
      lineas: lineas.rows,
      paradas: paradas.rows,
      relaciones: relaciones.rows,
    });
  } catch (error) {
    console.error('Error en GET /api/sync:', error.message);
    res.status(500).json({ error: 'Error al generar la sincronización' });
  }
});

export default router;