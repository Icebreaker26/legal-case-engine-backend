export async function up(pgm) {
    // Verificar si la columna existe antes de migrar
    const result = await pgm.db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'pagos' AND column_name = 'solicitante_id'");
    
    if (result.rowCount > 0) {
        await pgm.sql(`
            ALTER TABLE pagos ADD COLUMN IF NOT EXISTS solicitante_uuid UUID REFERENCES global_usuarios(id);
            UPDATE pagos p SET solicitante_uuid = m.new_uuid FROM id_mapping m WHERE p.solicitante_id = m.old_id;
            ALTER TABLE pagos DROP COLUMN solicitante_id;
        `);
    } else {
        // Si no existe, solo aseguramos que la columna uuid exista
        await pgm.sql(`ALTER TABLE pagos ADD COLUMN IF NOT EXISTS solicitante_uuid UUID REFERENCES global_usuarios(id);`);
    }
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE pagos ADD COLUMN solicitante_id INTEGER;
        ALTER TABLE pagos DROP COLUMN solicitante_uuid;
    `);
}
