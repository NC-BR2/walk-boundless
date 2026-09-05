import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function probarConexion() {
  try {
    const resultado = await pool.query('SELECT NOW()');
    console.log('✅ Conectado a Neon. Hora del servidor:', resultado.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    return false;
  }
}