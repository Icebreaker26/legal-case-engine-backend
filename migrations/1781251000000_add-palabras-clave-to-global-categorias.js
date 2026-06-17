export async function up(pgm) {
    await pgm.sql(`
        ALTER TABLE global_categorias ADD COLUMN palabras_clave text[] DEFAULT '{}';
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE global_categorias DROP COLUMN IF EXISTS palabras_clave;
    `);
}
