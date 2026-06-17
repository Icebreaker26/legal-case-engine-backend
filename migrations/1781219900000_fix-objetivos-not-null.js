export async function up(pgm) {
    await pgm.sql(`
        -- 1. Eliminar NOT NULL de columnas obsoletas en objetivos
        ALTER TABLE objetivos ALTER COLUMN usuario_id DROP NOT NULL;
        
        -- 2. Eliminar NOT NULL de columnas obsoletas en permisos (si existe)
        -- ALTER TABLE permisos ALTER COLUMN usuario_id DROP NOT NULL;
    `);
}

export async function down(pgm) {
    // Rollback logic
}
