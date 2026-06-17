export async function up(pgm) {
    // 1. Crear tabla de mapping
    await pgm.sql(`
        CREATE TABLE id_mapping (
            old_id INTEGER PRIMARY KEY,
            new_uuid UUID
        );
        
        -- 2. Migrar datos de abogados a global_usuarios y registrar mapping usando CTE
        WITH inserted AS (
            INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_active)
            SELECT nombre, email, password_hash, rol, activo FROM abogados
            RETURNING id, email
        )
        INSERT INTO id_mapping (old_id, new_uuid)
        SELECT a.id, i.id
        FROM abogados a
        JOIN inserted i ON a.email = i.email;
    `);
}

export async function down(pgm) {
    await pgm.sql(`DROP TABLE IF EXISTS id_mapping;`);
}
