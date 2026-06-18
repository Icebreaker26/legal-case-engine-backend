exports.up = async (pgm) => {
  pgm.addColumn('minutas_estandar', {
    is_active: { type: 'boolean', default: true, notNull: true }
  });
};

exports.down = async (pgm) => {
  pgm.dropColumn('minutas_estandar', 'is_active');
};
