export async function up(pgm) {
    await pgm.sql(`
        -- Agregar restricción UNIQUE para permitir ON CONFLICT
        ALTER TABLE permisos ADD CONSTRAINT unique_usuario_modulo_accion UNIQUE (usuario_uuid, modulo_id, accion_id);
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE permisos DROP CONSTRAINT IF EXISTS unique_usuario_modulo_accion;
    `);
}
