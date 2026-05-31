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
    pgm.sql(`
        INSERT INTO equipos (nombre) VALUES ('Equipo Alfa');
        UPDATE abogados SET equipo_id = (SELECT id FROM equipos WHERE nombre = 'Equipo Alfa') WHERE email = 'alejandro.marin@enel.com';
        INSERT INTO objetivos (usuario_id, meta_acciones, periodo_inicio, periodo_fin) 
        SELECT id, 20, '2026-06-01', '2026-06-30' FROM abogados WHERE email = 'alejandro.marin@enel.com';
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
        DELETE FROM objetivos WHERE usuario_id = (SELECT id FROM abogados WHERE email = 'alejandro.marin@enel.com');
        UPDATE abogados SET equipo_id = NULL WHERE email = 'alejandro.marin@enel.com';
        DELETE FROM equipos WHERE nombre = 'Equipo Alfa';
    `);
};
