export const up = (pgm) => {
  pgm.addColumn('comunicaciones_expediente', {
    enlace: { type: 'TEXT', notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('comunicaciones_expediente', 'enlace');
};
