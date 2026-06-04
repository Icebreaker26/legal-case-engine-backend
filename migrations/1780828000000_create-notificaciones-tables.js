export async function up(pgm) {
    await pgm.sql(`
        CREATE TABLE notificaciones (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER REFERENCES abogados(id) ON DELETE CASCADE,
            mensaje TEXT NOT NULL,
            tipo VARCHAR(50),
            referencia_id INTEGER,
            leida BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
    `);
}

export async function down(pgm) {
    await pgm.sql(`DROP TABLE IF EXISTS notificaciones;`);
}
