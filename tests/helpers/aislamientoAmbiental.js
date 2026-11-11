// Aislamiento para pruebas de ambiental que dependen de TODA la tabla de
// expedientes (la guarda de similares, #196, y la biblioteca, #198): corre
// `fn` con un cliente en una transacción donde solo `idsActivos` siguen
// activos, y la deshace al final.
//
// REPEATABLE READ: la instantánea se fija en la primera sentencia, así que un
// expediente que otra suite cree en paralelo después del UPDATE no aparece a
// mitad de la prueba (en READ COMMITTED sí aparecía y hacía caer la guarda).
// Si otra suite modifica a la vez una fila que el UPDATE quiere tocar,
// PostgreSQL aborta con un conflicto de serialización (40001): se reintenta.
export const enAislamiento = async (pool, idsActivos, fn, { intentos = 5 } = {}) => {
  for (let intento = 1; ; intento++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
      await client.query(
        'UPDATE expedientes_ambientales SET is_active = FALSE WHERE is_active = TRUE AND id <> ALL($1::uuid[])',
        [idsActivos]
      );
      return await fn(client);
    } catch (err) {
      if (err.code !== '40001' || intento >= intentos) throw err;
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
  }
};
