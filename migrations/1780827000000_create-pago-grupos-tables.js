export async function up(pgm) {
    await pgm.sql(`
        CREATE TABLE pago_grupos (
            pago_id INTEGER REFERENCES pagos(id) ON DELETE CASCADE,
            grupo_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE,
            PRIMARY KEY (pago_id, grupo_id)
        );
    `);
}

export async function down(pgm) {
    await pgm.sql(`DROP TABLE IF EXISTS pago_grupos;`);
}
