export async function up(pgm) {
    await pgm.sql(`
        CREATE TABLE pagos (
            id SERIAL PRIMARY KEY,
            pdp_sap_id VARCHAR(255),
            nit VARCHAR(50),
            concepto TEXT,
            monto DECIMAL(15, 2),
            solicitante_id INTEGER REFERENCES abogados(id),
            estado VARCHAR(50),
            fecha_solicitud DATE,
            fecha_envio_liberacion DATE,
            fecha_liberacion DATE,
            fecha_memo_generado DATE,
            fecha_memo_firmado DATE,
            pdp_creada BOOLEAN DEFAULT false,
            soportes_link TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE pago_trazabilidad (
            id SERIAL PRIMARY KEY,
            pago_id INTEGER REFERENCES pagos(id),
            usuario_id INTEGER REFERENCES abogados(id),
            estado_anterior VARCHAR(50),
            estado_nuevo VARCHAR(50),
            comentario TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        DROP TABLE IF EXISTS pago_trazabilidad;
        DROP TABLE IF EXISTS pagos;
    `);
}
