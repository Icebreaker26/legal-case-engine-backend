export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

    ALTER TABLE pagos_ambientales
      ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales DROP COLUMN IF EXISTS fecha_vencimiento;
    ALTER TABLE pagos_ambientales       DROP COLUMN IF EXISTS fecha_vencimiento;
  `);
};
