export async function up(pgm) {
    const result = await pgm.db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notificaciones' AND column_name = 'usuario_id'");
    
    if (result.rowCount > 0) {
        await pgm.sql(`
            ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);
            UPDATE notificaciones n SET usuario_uuid = m.new_uuid FROM id_mapping m WHERE n.usuario_id = m.old_id;
            ALTER TABLE notificaciones DROP COLUMN usuario_id;
        `);
    } else {
        await pgm.sql(`ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);`);
    }
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE notificaciones ADD COLUMN usuario_id INTEGER;
        ALTER TABLE notificaciones DROP COLUMN usuario_uuid;
    `);
}
