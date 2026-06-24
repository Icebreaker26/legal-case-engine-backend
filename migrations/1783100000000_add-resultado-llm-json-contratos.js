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
    ALTER TABLE registros_auditoria
    ADD COLUMN IF NOT EXISTS resultado_llm_json JSONB;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE registros_auditoria
    DROP COLUMN IF EXISTS resultado_llm_json;
  `);
};
