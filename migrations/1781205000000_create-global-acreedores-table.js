export async function up(pgm) {
    await pgm.sql(`
        CREATE TABLE global_acreedores (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            nit VARCHAR(50) UNIQUE NOT NULL,
            banco VARCHAR(100),
            cuenta VARCHAR(100),
            is_active BOOLEAN DEFAULT true
        );
    `);
}

export async function down(pgm) {
    await pgm.sql(`DROP TABLE IF EXISTS global_acreedores;`);
}
