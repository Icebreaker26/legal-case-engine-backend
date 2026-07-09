exports.up = (pgm) => {
  pgm.addColumn('tutelas', {
    analisis_comprension: { type: 'jsonb', default: null },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tutelas', 'analisis_comprension');
};
