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
    pgm.addColumns('entidades', {
        is_active: { type: 'boolean', default: true, notNull: true }
    });
    pgm.addColumns('grupos', {
        is_active: { type: 'boolean', default: true, notNull: true }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumns('entidades', ['is_active']);
    pgm.dropColumns('grupos', ['is_active']);
};
