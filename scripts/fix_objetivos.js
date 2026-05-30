import pool from '../src/db/database.js';

async function runFix() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('Archivando objetivos activos...');
        const res = await client.query(
            'UPDATE objetivos SET estado = $1 WHERE estado = $2', 
            ['archived', 'active']
        );
        console.log(`Filas afectadas: ${res.rowCount}`);
        
        await client.query('COMMIT');
        console.log('Transacción completada.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error en transacción:', e);
    } finally {
        client.release();
        process.exit();
    }
}

runFix();
