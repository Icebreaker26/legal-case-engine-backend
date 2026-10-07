import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // #141: fija el timezone como parámetro de arranque de la conexión
  // (parte del handshake de Postgres) en vez de una query separada después
  // de conectar -- el `pool.on('connect', ...)` anterior no esperaba a que
  // el `SET timezone` terminara antes de entregar la conexión, así que la
  // primera query sobre una conexión recién creada podía correr con el
  // timezone por defecto del servidor (probablemente UTC) en vez de Bogotá.
  options: '-c TimeZone=America/Bogota',
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