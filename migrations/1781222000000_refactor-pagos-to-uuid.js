export async function up(pgm) {
    await pgm.sql(`
        -- 1. Agregar columna UUID
        ALTER TABLE pagos ADD COLUMN IF NOT EXISTS solicitante_uuid UUID REFERENCES global_usuarios(id);
        
        -- 2. Migrar datos antiguos (Mapeo)
        UPDATE pagos p
        SET solicitante_uuid = m.new_uuid
        FROM id_mapping m
        WHERE p.solicitante_id = m.old_id;

        -- 3. Eliminar columna antigua
        ALTER TABLE pagos DROP COLUMN IF EXISTS solicitante_id;
    `);
}

export async function down(pgm) {
    // Rollback logic
}
