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
    pgm.addColumns('objetivos', {
        estado: { type: 'varchar(20)', default: 'active', notNull: true }
    });
    pgm.addColumns('registro_acciones', {
        peso: { type: 'integer', default: 1, notNull: true }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumns('registro_acciones', ['peso']);
    pgm.dropColumns('objetivos', ['estado']);
};
