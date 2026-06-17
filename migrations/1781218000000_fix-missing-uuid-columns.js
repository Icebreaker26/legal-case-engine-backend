export async function up(pgm) {
    await pgm.sql(`
        -- 1. Migrar datos faltantes en 'objetivos'
        UPDATE objetivos o
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE o.usuario_id = m.old_id
        AND o.usuario_uuid IS NULL;

        -- Nota: La tabla 'permisos' ya tiene la columna usuario_uuid y no tiene usuario_id, 
        -- por lo tanto el UPDATE y el DROP ya no son necesarios aquí.
    `);
}

export async function down(pgm) {
    // Rollback logic
}
