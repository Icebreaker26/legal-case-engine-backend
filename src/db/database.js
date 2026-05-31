import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verificamos que la conexión funcione solo si NO estamos en entorno de pruebas
// Esto evita el error "Cannot log after tests are done" en Jest
if (process.env.NODE_ENV !== 'test') {
  pool.connect((err, client, release) => {
    if (err) {
      return console.error('Error adquiriendo el cliente de la base de datos', err.stack);
    }
    console.log('Conectado exitosamente a PostgreSQL ✅');
    release();
  });
}

export default pool;