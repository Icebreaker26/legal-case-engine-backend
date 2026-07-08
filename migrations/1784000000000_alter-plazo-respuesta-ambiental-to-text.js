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
  pgm.sql(`ALTER TABLE expedientes_ambientales ALTER COLUMN plazo_respuesta TYPE TEXT`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE expedientes_ambientales ALTER COLUMN plazo_respuesta TYPE VARCHAR(100)`);
};
