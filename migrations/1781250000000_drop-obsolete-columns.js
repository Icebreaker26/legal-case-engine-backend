export async function up(pgm) {
    await pgm.sql(`
        -- 1. Eliminar responsable_id en tutelas
        ALTER TABLE tutelas DROP COLUMN IF EXISTS responsable_id;

        -- 2. Eliminar abogado_uiid en tutela_responsables
        ALTER TABLE tutela_responsables DROP COLUMN IF EXISTS abogado_uiid;

        -- 3. Eliminar usuario_id en objetivos
        ALTER TABLE objetivos DROP COLUMN IF EXISTS usuario_id;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        -- Restaurar las columnas (esto asume el tipo de dato original, puede necesitar ajuste)
        ALTER TABLE tutelas ADD COLUMN IF NOT EXISTS responsable_id INTEGER;
        ALTER TABLE tutela_responsables ADD COLUMN IF NOT EXISTS abogado_uiid UUID;
        ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS usuario_id INTEGER;
    `);
}
