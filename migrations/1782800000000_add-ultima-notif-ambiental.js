export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS ultima_notif_vencimiento DATE;
    ALTER TABLE pagos_ambientales
      ADD COLUMN IF NOT EXISTS ultima_notif_vencimiento DATE;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales DROP COLUMN IF EXISTS ultima_notif_vencimiento;
    ALTER TABLE pagos_ambientales       DROP COLUMN IF EXISTS ultima_notif_vencimiento;
  `);
};
