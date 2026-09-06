import { Router } from 'express';
import { pool } from '../db/conexion.js';

const router = Router();

// GET /api/calles?filtro=A&texto=
// GET /api/calles?texto=belgrano
router.get('/', async (req, res) => {
  const filtro = req.query.filtro;
  const texto = (req.query.texto || '').trim();

  try {
    if (filtro && filtro !== 'TODAS') {
      const resultado = await pool.query(
        'SELECT id_calle, nombre FROM calles WHERE UPPER(nombre) LIKE $1 ORDER BY nombre',
        [`${filtro.toUpperCase()}%`]
      );
      return res.json(resultado.rows);
    }

    if (texto.length === 0) {
      const resultado = await pool.query(
        'SELECT id_calle, nombre FROM calles ORDER BY nombre'
      );
      return res.json(resultado.rows);
    }

    const resultado = await pool.query(
      'SELECT id_calle, nombre FROM calles WHERE UPPER(nombre) LIKE $1 ORDER BY nombre',
      [`%${texto.toUpperCase()}%`]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error en GET /api/calles:', error.message);
    res.status(500).json({ error: 'Error al buscar calles' });
  }
});

// GET /api/calles/:id/paradas
router.get('/:id/paradas', async (req, res) => {
  const idCalle = parseInt(req.params.id);

  if (isNaN(idCalle)) {
    return res.status(400).json({ error: 'El id de calle debe ser un número' });
  }

  try {
    const resultado = await pool.query(
      'SELECT id_parada, descripcion_ubicacion FROM paradas WHERE id_calle_principal = $1',
      [idCalle]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error en GET /api/calles/:id/paradas:', error.message);
    res.status(500).json({ error: 'Error al buscar paradas de la calle' });
  }
});

export default router;