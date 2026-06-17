export async function up(pgm) {
    await pgm.sql(`
        -- 1. Agregar las columnas faltantes
        ALTER TABLE global_usuarios 
            ADD COLUMN is_admin BOOLEAN DEFAULT false,
            ADD COLUMN is_approved BOOLEAN DEFAULT false,
            ADD COLUMN equipo_id INTEGER,
            ADD COLUMN must_change_password BOOLEAN DEFAULT false,
            ADD COLUMN especialidad VARCHAR(255);

        -- 2. Migrar los datos desde la tabla original 'abogados' usando el mapping creado anteriormente
        UPDATE global_usuarios gu
        SET 
            is_admin = a.is_admin,
            is_approved = a.is_approved,
            equipo_id = a.equipo_id,
            must_change_password = a.must_change_password,
            especialidad = a.especialidad
        FROM id_mapping m
        JOIN abogados a ON m.old_id = a.id
        WHERE gu.id = m.new_uuid;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE global_usuarios 
            DROP COLUMN is_admin,
            DROP COLUMN is_approved,
            DROP COLUMN equipo_id,
            DROP COLUMN must_change_password,
            DROP COLUMN especialidad;
    `);
}
