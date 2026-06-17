export async function up(pgm) {
    await pgm.sql(`
        -- 1. Agregar la nueva columna UUID
        ALTER TABLE logs_sistema ADD COLUMN usuario_uuid UUID REFERENCES global_usuarios(id);
        
        -- 2. Migrar los datos de la columna antigua (si se mapean por id_mapping)
        -- Asumiendo que teníamos una columna 'usuario_id' SERIAL
        -- (Si existía la tabla y la columna, esto debe funcionar)
        UPDATE logs_sistema l
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE l.usuario_id = m.old_id;

        -- 3. Eliminar la columna antigua
        ALTER TABLE logs_sistema DROP COLUMN usuario_id;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE logs_sistema ADD COLUMN usuario_id INTEGER;
        ALTER TABLE logs_sistema DROP COLUMN usuario_uuid;
    `);
}
