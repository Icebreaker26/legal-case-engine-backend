export async function up(pgm) {
    await pgm.sql(`
        -- 1. Actualizar 'permisos'
        ALTER TABLE permisos ADD COLUMN usuario_uuid UUID REFERENCES global_usuarios(id);
        
        UPDATE permisos p
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE p.usuario_id = m.old_id;

        ALTER TABLE permisos DROP COLUMN usuario_id;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE permisos ADD COLUMN usuario_id INTEGER;
        ALTER TABLE permisos DROP COLUMN usuario_uuid;
    `);
}
