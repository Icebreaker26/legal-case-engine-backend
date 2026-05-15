import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verificamos que la conexión funcione
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo el cliente de la base de datos', err.stack);
  }
  console.log('Conectado exitosamente a PostgreSQL ✅');
  release();
});

export default pool;