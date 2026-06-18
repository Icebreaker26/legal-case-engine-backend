exports.up = async (pgm) => {
  pgm.addColumn('registros_auditoria', {
    contenido_tercero_texto: { type: 'text' }
  });
};

exports.down = async (pgm) => {
  pgm.dropColumn('registros_auditoria', 'contenido_tercero_texto');
};
