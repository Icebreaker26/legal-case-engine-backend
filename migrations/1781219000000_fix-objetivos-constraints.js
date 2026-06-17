export async function up(pgm) {
    await pgm.sql(`
        -- 1. Asegurar que usuario_uuid permita NOT NULL (ya que la columna vieja lo tenía)
        ALTER TABLE objetivos ALTER COLUMN usuario_uuid SET NOT NULL;

        -- 2. Eliminar la restricción NOT NULL de usuario_id para permitir el registro hasta que eliminemos la columna
        ALTER TABLE objetivos ALTER COLUMN usuario_id DROP NOT NULL;
    `);
}

export async function down(pgm) {
    // Rollback logic
}
