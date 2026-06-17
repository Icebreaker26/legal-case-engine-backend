export async function up(pgm) {
    await pgm.sql(`
        -- 1. Refactor 'conformidades'
        ALTER TABLE conformidades ADD COLUMN IF NOT EXISTS solicitante_uuid UUID REFERENCES global_usuarios(id);
        ALTER TABLE conformidades ADD COLUMN IF NOT EXISTS responsable_uuid UUID REFERENCES global_usuarios(id);
        
        -- Mapeo si aún existen columnas _id (esto es un poco riesgoso si ya borramos los datos, pero intentemos)
        UPDATE conformidades c SET solicitante_uuid = m.new_uuid FROM id_mapping m WHERE c.solicitante_id = m.old_id AND c.solicitante_uuid IS NULL;
        UPDATE conformidades c SET responsable_uuid = m.new_uuid FROM id_mapping m WHERE c.responsable_id = m.old_id AND c.responsable_uuid IS NULL;

        ALTER TABLE conformidades DROP COLUMN IF EXISTS solicitante_id;
        ALTER TABLE conformidades DROP COLUMN IF EXISTS responsable_id;

        -- 2. Refactor 'conformidad_trazabilidad'
        ALTER TABLE conformidad_trazabilidad ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);
        
        UPDATE conformidad_trazabilidad ct
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE ct.usuario_id = m.old_id AND ct.usuario_uuid IS NULL;

        ALTER TABLE conformidad_trazabilidad DROP COLUMN IF EXISTS usuario_id;
    `);
}

export async function down(pgm) {
    // Rollback logic
}
