export const up = (pgm) => {
  pgm.alterColumn('pagos_ambientales', 'valor',       { type: 'TEXT' });
  pgm.alterColumn('pagos_ambientales', 'plazo',       { type: 'TEXT' });
  pgm.alterColumn('pagos_ambientales', 'descripcion', { type: 'TEXT' });
};

export const down = (pgm) => {
  pgm.alterColumn('pagos_ambientales', 'valor',       { type: 'VARCHAR(200)', notNull: true });
  pgm.alterColumn('pagos_ambientales', 'plazo',       { type: 'VARCHAR(200)' });
  pgm.alterColumn('pagos_ambientales', 'descripcion', { type: 'VARCHAR(300)' });
};
