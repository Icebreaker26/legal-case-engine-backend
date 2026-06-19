exports.up = async (pgm) => {
  pgm.addColumns('tutela_argumentos', {
    promovido_a_memoria:  { type: 'boolean', default: false, notNull: true },
    documento_id_memoria: { type: 'uuid' },
  });
};

exports.down = async (pgm) => {
  pgm.dropColumns('tutela_argumentos', ['promovido_a_memoria', 'documento_id_memoria']);
};
