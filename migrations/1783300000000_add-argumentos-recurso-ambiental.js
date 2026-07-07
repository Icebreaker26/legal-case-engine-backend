export const up = (pgm) => {
  pgm.addColumn('expedientes_ambientales', {
    argumentos_recurso: { type: 'text', notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('expedientes_ambientales', 'argumentos_recurso');
};
