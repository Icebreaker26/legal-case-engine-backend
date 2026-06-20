export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS valor_pago   VARCHAR(200),
      ADD COLUMN IF NOT EXISTS plazo_pago   VARCHAR(200);
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      DROP COLUMN IF EXISTS valor_pago,
      DROP COLUMN IF EXISTS plazo_pago;
  `);
};
