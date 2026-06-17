export async function up(pgm) {
    await pgm.sql(`
        ALTER TABLE pagos ADD COLUMN acreedor_id INTEGER REFERENCES global_acreedores(id);
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE pagos DROP COLUMN acreedor_id;
    `);
}
