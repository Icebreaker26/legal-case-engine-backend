/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    // 1. Insertar usuarios
    pgm.sql(`
        INSERT INTO abogados (nombre, email, rol, equipo_id) VALUES
        ('Ingeniero Beta', 'ingeniero.beta@enel.com', 'juridico', (SELECT id FROM equipos WHERE nombre = 'Equipo Alfa')),
        ('Ingeniero Gamma', 'ingeniero.gamma@enel.com', 'juridico', (SELECT id FROM equipos WHERE nombre = 'Equipo Alfa'));
    `);

    // 2. Insertar objetivos para estos usuarios
    pgm.sql(`
        INSERT INTO objetivos (usuario_id, meta_acciones, periodo_inicio, periodo_fin)
        SELECT id, 15, '2026-06-01', '2026-06-30' 
        FROM abogados 
        WHERE email IN ('ingeniero.beta@enel.com', 'ingeniero.gamma@enel.com');
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
        DELETE FROM objetivos WHERE usuario_id IN (SELECT id FROM abogados WHERE email IN ('ingeniero.beta@enel.com', 'ingeniero.gamma@enel.com'));
        DELETE FROM abogados WHERE email IN ('ingeniero.beta@enel.com', 'ingeniero.gamma@enel.com');
    `);
};
