exports.up = async (pgm) => {
  pgm.addColumn('base_conocimiento_enel', {
    relevancia_score: { type: 'integer', default: 0, notNull: true },
  });
  pgm.createIndex('base_conocimiento_enel', 'relevancia_score');
};

exports.down = async (pgm) => {
  pgm.dropColumn('base_conocimiento_enel', 'relevancia_score');
};
