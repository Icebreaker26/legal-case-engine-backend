export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE pagos_ambientales ADD COLUMN IF NOT EXISTS nota TEXT;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE pagos_ambientales DROP COLUMN IF EXISTS nota;
  `);
};
