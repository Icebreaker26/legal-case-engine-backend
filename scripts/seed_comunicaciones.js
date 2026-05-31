import pool from '../src/db/database.js';

async function seedComunicaciones() {
    try {
        await pool.query('DELETE FROM comunicacion_trazabilidad');
        await pool.query('DELETE FROM comunicaciones');
        
        const com1 = await pool.query(`
            INSERT INTO comunicaciones (entidad, tipo, asunto, fecha_recepcion, fecha_limite, responsable_id, estado, descripcion, link) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`, 
            ['CAR', 'recibida', 'Requerimiento de información ambiental', '2026-06-01 09:00:00', '2026-06-15 17:00:00', 1, 'pendiente', 'Necesitamos los documentos de vertimientos.', 'https://car.gov.co/doc1']
        );
        
        const com2 = await pool.query(`
            INSERT INTO comunicaciones (entidad, tipo, asunto, fecha_recepcion, fecha_limite, responsable_id, estado, descripcion, link) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`, 
            ['IDU', 'recibida', 'Notificación de obra', '2026-06-02 10:00:00', '2026-06-20 17:00:00', 34, 'en_proceso', 'Notificación sobre intervención en vía pública.', 'https://idu.gov.co/doc2']
        );
        
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [com1.rows[0].id, 1, 'Comunicación recibida y asignada al área ambiental.']);
        await pool.query('INSERT INTO comunicacion_trazabilidad (comunicacion_id, usuario_id, comentario) VALUES ($1, $2, $3)', [com2.rows[0].id, 34, 'Revisando documentos adjuntos.']);
        
        console.log('Datos de prueba de comunicaciones insertados exitosamente con metadatos.');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
seedComunicaciones();
