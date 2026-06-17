export async function up(pgm) {
    await pgm.sql(`
        -- 1. Refactor 'comunicaciones'
        ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS responsable_uuid UUID REFERENCES global_usuarios(id);
        
        UPDATE comunicaciones c
        SET responsable_uuid = m.new_uuid
        FROM id_mapping m
        WHERE c.responsable_id = m.old_id;

        ALTER TABLE comunicaciones DROP COLUMN IF EXISTS responsable_id;

        -- 2. Refactor 'comunicacion_trazabilidad'
        ALTER TABLE comunicacion_trazabilidad ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);
        
        UPDATE comunicacion_trazabilidad ct
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE ct.usuario_id = m.old_id;

        ALTER TABLE comunicacion_trazabilidad DROP COLUMN IF EXISTS usuario_id;
    `);
}

export async function down(pgm) {
    // Rollback logic
}
