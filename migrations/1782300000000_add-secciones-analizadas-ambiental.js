export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS secciones_analizadas integer[] DEFAULT '{}';
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      DROP COLUMN IF EXISTS secciones_analizadas;
  `);
};
