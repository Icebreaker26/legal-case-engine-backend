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
  pgm.addColumn('notificaciones', {
    modulo: { type: 'varchar(50)', notNull: false, default: "'tutelas'" },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('notificaciones', 'modulo');
};
