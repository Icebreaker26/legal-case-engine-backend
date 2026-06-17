export async function up(pgm) {
    await pgm.sql(`
        -- 1. Refactor 'registro_acciones'
        ALTER TABLE registro_acciones ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);
        
        UPDATE registro_acciones ra
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE ra.usuario_id = m.old_id
        AND ra.usuario_uuid IS NULL;

        ALTER TABLE registro_acciones DROP COLUMN IF EXISTS usuario_id;

        -- 2. Refactor 'logs_sistema' (ya tiene usuario_uuid, no hacemos nada)
    `);
}

export async function down(pgm) {
    // Rollback logic
}
