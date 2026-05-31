import pool from '../src/db/database.js';

async function grantPermissions() {
    try {
        const modRes = await pool.query("SELECT id FROM modulos WHERE nombre = 'comunicaciones'");
        if (modRes.rows.length === 0) {
            await pool.query("INSERT INTO modulos (nombre) VALUES ('comunicaciones')");
            const newMod = await pool.query("SELECT id FROM modulos WHERE nombre = 'comunicaciones'");
            var modId = newMod.rows[0].id;
        } else {
            var modId = modRes.rows[0].id;
        }

        const acciones = ['READ_COM', 'WRITE_COM', 'DELETE_COM'];
        for (const nombreAccion of acciones) {
            let accRes = await pool.query("SELECT id FROM acciones WHERE nombre = $1", [nombreAccion]);
            if (accRes.rows.length === 0) {
                await pool.query("INSERT INTO acciones (nombre) VALUES ($1)", [nombreAccion]);
                accRes = await pool.query("SELECT id FROM acciones WHERE nombre = $1", [nombreAccion]);
            }
            let accId = accRes.rows[0].id;
            await pool.query("INSERT INTO permisos (usuario_id, modulo_id, accion_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [1, modId, accId]);
        }
        console.log('Permisos concedidos.');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
grantPermissions();
