import express from 'express';
import cors from 'cors';
import { probarConexion } from './db/conexion.js';

const app = express();
const PUERTO = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'Backend de Walk Boundless funcionando' });
});
app.get('/api/diagnostico', async (req, res) => {
  const { pool } = await import('./db/conexion.js');
  const tablas = ['calles', 'lineas', 'paradas', 'parada_linea'];
  const conteos = {};
  for (const tabla of tablas) {
    const resultado = await pool.query(`SELECT COUNT(*) FROM ${tabla}`);
    conteos[tabla] = parseInt(resultado.rows[0].count);
  }
  res.json(conteos);
});
app.listen(PUERTO, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PUERTO}`);
  await probarConexion();
});