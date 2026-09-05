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

app.listen(PUERTO, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PUERTO}`);
  await probarConexion();
});