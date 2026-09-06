import express from 'express';
import cors from 'cors';
import { probarConexion } from './db/conexion.js';
import lineasRouter from './routes/lineas.js';
import callesRouter from './routes/calles.js';
import paradasRouter from './routes/paradas.js';
import destinosRouter from './routes/destinos.js';

const app = express();
const PUERTO = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'Backend de Walk Boundless funcionando' });
});
app.use('/api/lineas', lineasRouter);
app.use('/api/calles', callesRouter);
app.use('/api/paradas', paradasRouter);
app.use('/api/destinos', destinosRouter);
app.listen(PUERTO, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PUERTO}`);
  await probarConexion();
});