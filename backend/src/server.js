import express from 'express';
import cors from 'cors';
import { probarConexion } from './db/conexion.js';
import lineasRouter from './routes/lineas.js';
import callesRouter from './routes/calles.js';
import paradasRouter from './routes/paradas.js';
import destinosRouter from './routes/destinos.js';

const app = express();
const PUERTO = 3000;

const origenesPermitidos = [
  'https://walk-boundless.netlify.app',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Si no hay "origin" (por ejemplo, un pedido hecho con Thunder Client
    // o curl, en vez de desde un navegador), lo dejamos pasar igual.
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
}));
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