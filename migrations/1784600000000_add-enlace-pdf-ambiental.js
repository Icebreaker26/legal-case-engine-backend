export const up = (pgm) => {
  pgm.addColumn('expedientes_ambientales', {
    enlace_pdf: { type: 'TEXT', notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('expedientes_ambientales', 'enlace_pdf');
};
