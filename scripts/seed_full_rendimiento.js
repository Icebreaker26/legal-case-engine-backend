import pool from '../src/db/database.js';

async function seed() {
    try {
        await pool.query('DELETE FROM registro_acciones');
        await pool.query('DELETE FROM objetivos');
        
        // Asumiendo que abogados 2 y 3 existen (como se vio en el log anterior)
        const obj1 = await pool.query('INSERT INTO objetivos (usuario_id, meta_acciones, mes, anio, titulo, descripcion, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [2, 20, 6, 2026, 'Objetivo Ingeniero Beta', 'Hacer 20 acciones', 'active']);
        const obj2 = await pool.query('INSERT INTO objetivos (usuario_id, meta_acciones, mes, anio, titulo, descripcion, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [3, 15, 6, 2026, 'Objetivo Ingeniero Gamma', 'Generar reporte', 'active']);
        
        await pool.query('INSERT INTO registro_acciones (usuario_id, objetivo_id, comentario, peso, fecha_registro) VALUES ($1, $2, $3, $4, $5)', [2, obj1.rows[0].id, 'Accion Beta 1', 5, '2026-06-05']);
        await pool.query('INSERT INTO registro_acciones (usuario_id, objetivo_id, comentario, peso, fecha_registro) VALUES ($1, $2, $3, $4, $5)', [3, obj2.rows[0].id, 'Accion Gamma 1', 3, '2026-06-10']);
        console.log('Datos insertados exitosamente');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
seed();
