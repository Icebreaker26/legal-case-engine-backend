import pool from '../src/db/database.js';

async function grantManageCom() {
    try {
        const modRes = await pool.query("SELECT id FROM modulos WHERE nombre = 'comunicaciones'");
        const modId = modRes.rows[0].id;
        
        let accRes = await pool.query("SELECT id FROM acciones WHERE nombre = 'MANAGE_COM'");
        if (accRes.rows.length === 0) {
            await pool.query("INSERT INTO acciones (nombre) VALUES ('MANAGE_COM')");
            accRes = await pool.query("SELECT id FROM acciones WHERE nombre = 'MANAGE_COM'");
        }
        const accId = accRes.rows[0].id;
        
        await pool.query("INSERT INTO permisos (usuario_id, modulo_id, accion_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [1, modId, accId]);
        console.log('Permiso MANAGE_COM concedido al usuario 1.');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
grantManageCom();
