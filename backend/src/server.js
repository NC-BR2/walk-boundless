import express from 'express';
import cors from 'cors';
import { probarConexion } from './db/conexion.js';
import lineasRouter from './routes/lineas.js';
import callesRouter from './routes/calles.js';

const app = express();
const PUERTO = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'Backend de Walk Boundless funcionando' });
});
app.use('/api/lineas', lineasRouter);
app.use('/api/calles', callesRouter);
app.listen(PUERTO, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PUERTO}`);
  await probarConexion();
});