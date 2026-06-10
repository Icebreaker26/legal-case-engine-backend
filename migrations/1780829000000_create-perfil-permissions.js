export async function up(pgm) {
    await pgm.sql(`
        INSERT INTO modulos (nombre) VALUES ('perfil') ON CONFLICT (nombre) DO NOTHING;
        INSERT INTO acciones (nombre) VALUES ('READ') ON CONFLICT (nombre) DO NOTHING;
    `);
    
    await pgm.sql(`
        INSERT INTO permisos (usuario_id, modulo_id, accion_id)
        SELECT 1, m.id, a.id
        FROM modulos m, acciones a
        WHERE m.nombre = 'perfil' AND a.nombre = 'READ'
        ON CONFLICT (usuario_id, modulo_id, accion_id) DO NOTHING;
    `);
}

export async function down(pgm) {
    await pgm.sql(`DELETE FROM permisos WHERE modulo_id = (SELECT id FROM modulos WHERE nombre = 'perfil');`);
    await pgm.sql(`DELETE FROM acciones WHERE nombre = 'READ' AND EXISTS (SELECT 1 FROM modulos WHERE nombre = 'perfil');`);
    await pgm.sql(`DELETE FROM modulos WHERE nombre = 'perfil';`);
}
