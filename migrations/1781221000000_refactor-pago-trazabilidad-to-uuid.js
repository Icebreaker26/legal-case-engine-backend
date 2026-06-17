export async function up(pgm) {
    await pgm.sql(`
        -- 1. Actualizar 'pago_trazabilidad'
        ALTER TABLE pago_trazabilidad ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id);
        
        UPDATE pago_trazabilidad pt
        SET usuario_uuid = m.new_uuid
        FROM id_mapping m
        WHERE pt.usuario_id = m.old_id;

        ALTER TABLE pago_trazabilidad DROP COLUMN IF EXISTS usuario_id;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE pago_trazabilidad ADD COLUMN usuario_id INTEGER;
        ALTER TABLE pago_trazabilidad DROP COLUMN usuario_uuid;
    `);
}
