import pool from '../src/db/database.js';

async function seed() {
    try {
        await pool.query('INSERT INTO registro_acciones (usuario_id, objetivo_id, comentario, peso, fecha_registro) VALUES ($1, $2, $3, $4, $5)', [2, 1, 'Accion 1', 5, '2026-06-05']);
        await pool.query('INSERT INTO registro_acciones (usuario_id, objetivo_id, comentario, peso, fecha_registro) VALUES ($1, $2, $3, $4, $5)', [3, 2, 'Accion 2', 3, '2026-06-10']);
        console.log('Datos insertados');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
seed();
