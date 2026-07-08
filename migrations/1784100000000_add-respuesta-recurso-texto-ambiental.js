export const up = (pgm) => {
  pgm.addColumn('expedientes_ambientales', {
    respuesta_recurso_texto: { type: 'TEXT', notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('expedientes_ambientales', 'respuesta_recurso_texto');
};
