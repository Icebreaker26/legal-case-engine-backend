exports.up = async (pgm) => {
  pgm.addColumn('minutas_estandar', {
    created_by: { type: 'uuid', references: 'global_usuarios(id)' }
  });
};

exports.down = async (pgm) => {
  pgm.dropColumn('minutas_estandar', 'created_by');
};
