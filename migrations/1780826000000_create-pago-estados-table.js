export async function up(pgm) {
    await pgm.sql(`
        CREATE TABLE pago_estados (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL UNIQUE,
            orden INTEGER,
            is_active BOOLEAN DEFAULT true
        );

        INSERT INTO pago_estados (nombre, orden) VALUES
        ('solicitado', 1),
        ('subido_sap_espera_liberacion', 2),
        ('liberado', 3),
        ('espera_firmas', 4),
        ('firmado', 5),
        ('radicado', 6),
        ('rechazado', 7),
        ('completado', 8),
        ('pagado', 9);
    `);
}

export async function down(pgm) {
    await pgm.sql(`DROP TABLE IF EXISTS pago_estados;`);
}
