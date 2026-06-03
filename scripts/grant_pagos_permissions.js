import pool from '../src/db/database.js';

async function grantPermissions() {
    try {
        const modRes = await pool.query("SELECT id FROM modulos WHERE nombre = 'pagos'");
        let modId;
        if (modRes.rows.length === 0) {
            const newMod = await pool.query("INSERT INTO modulos (nombre) VALUES ('pagos') RETURNING id");
            modId = newMod.rows[0].id;
        } else {
            modId = modRes.rows[0].id;
        }

        const acciones = ['READ_PAGO', 'WRITE_PAGO', 'DELETE_PAGO'];
        for (const nombreAccion of acciones) {
            let accRes = await pool.query("SELECT id FROM acciones WHERE nombre = $1", [nombreAccion]);
            let accId;
            if (accRes.rows.length === 0) {
                const newAcc = await pool.query("INSERT INTO acciones (nombre) VALUES ($1) RETURNING id", [nombreAccion]);
                accId = newAcc.rows[0].id;
            } else {
                accId = accRes.rows[0].id;
            }
            
            // Asignar permisos al usuario administrador (id=1)
            await pool.query("INSERT INTO permisos (usuario_id, modulo_id, accion_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [1, modId, accId]);
        }
        console.log('Permisos para el módulo "pagos" concedidos al usuario administrador.');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
grantPermissions();
