export const up = (pgm) => {
  pgm.alterColumn('normas_citadas_ambiental', 'instrumento', { type: 'TEXT' });
  pgm.alterColumn('normas_citadas_ambiental', 'articulo',    { type: 'TEXT' });
};

export const down = (pgm) => {
  pgm.alterColumn('normas_citadas_ambiental', 'instrumento', { type: 'VARCHAR(50)', notNull: true });
  pgm.alterColumn('normas_citadas_ambiental', 'articulo',    { type: 'VARCHAR(100)' });
};
