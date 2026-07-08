export const up = (pgm) => {
  pgm.alterColumn('hallazgos_ambientales', 'tipo',            { type: 'TEXT' });
  pgm.alterColumn('hallazgos_ambientales', 'norma_infringida', { type: 'TEXT' });
};

export const down = (pgm) => {
  pgm.alterColumn('hallazgos_ambientales', 'tipo',            { type: 'VARCHAR(50)', notNull: true });
  pgm.alterColumn('hallazgos_ambientales', 'norma_infringida', { type: 'VARCHAR(255)' });
};
