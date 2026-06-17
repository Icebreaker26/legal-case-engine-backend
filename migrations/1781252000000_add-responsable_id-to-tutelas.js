export async function up(pgm) {
    await pgm.sql(`
        ALTER TABLE tutelas ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES global_usuarios(id);
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE tutelas DROP COLUMN IF EXISTS responsable_id;
    `);
}
