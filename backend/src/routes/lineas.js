import { Router } from 'express';
import { pool } from '../db/conexion.js';

const router = Router();

// GET /api/lineas?filtro=numero&texto=4a
router.get('/', async (req, res) => {
  const filtro = req.query.filtro || 'numero';
  const texto = (req.query.texto || '').trim();

  try {
    if (texto.length === 0) {
      const resultado = await pool.query(
        'SELECT id_linea, nombre FROM lineas ORDER BY nombre'
      );
      return res.json(resultado.rows);
    }

    if (filtro === 'numero') {
      const resultado = await pool.query(
        'SELECT id_linea, nombre FROM lineas WHERE UPPER(nombre) LIKE $1 ORDER BY nombre',
        [`${texto.toUpperCase()}%`]
      );
      return res.json(resultado.rows);
    }

    // filtro === 'ramal': buscar por la parte con letras (ej: "SAUCE" en "4A SAUCE")
    const resultado = await pool.query(
      'SELECT id_linea, nombre FROM lineas ORDER BY nombre'
    );
    const textoUpper = texto.toUpperCase();
    const filtradas = resultado.rows.filter((linea) => {
      const coincide = linea.nombre.toUpperCase().match(/^(\d+)([A-Z]+)/);
      return coincide ? coincide[2].startsWith(textoUpper) : false;
    });
    res.json(filtradas);
  } catch (error) {
    console.error('Error en GET /api/lineas:', error.message);
    res.status(500).json({ error: 'Error al buscar líneas' });
  }
});

// GET /api/lineas/:id/paradas
router.get('/:id/paradas', async (req, res) => {
  const idLinea = parseInt(req.params.id);

  if (isNaN(idLinea)) {
    return res.status(400).json({ error: 'El id de línea debe ser un número' });
  }

  try {
    const resultado = await pool.query(
      `SELECT p.id_parada, p.descripcion_ubicacion
       FROM paradas p
       INNER JOIN parada_linea pl ON p.id_parada = pl.id_parada
       WHERE pl.id_linea = $1`,
      [idLinea]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error en GET /api/lineas/:id/paradas:', error.message);
    res.status(500).json({ error: 'Error al buscar paradas de la línea' });
  }
});

export default router;