export async function up(pgm) {
    await pgm.sql(`
        -- 1. Agregar columna UUID
        ALTER TABLE tutela_responsables ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);
        
        -- 2. Migrar datos antiguos (Mapeo)
        UPDATE tutela_responsables tr
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE tr.abogado_id = m.old_id;

        -- 3. Eliminar columna antigua
        ALTER TABLE tutela_responsables DROP COLUMN IF EXISTS abogado_id;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE tutela_responsables ADD COLUMN abogado_id INTEGER;
        ALTER TABLE tutela_responsables DROP COLUMN usuario_uuid;
    `);
}
