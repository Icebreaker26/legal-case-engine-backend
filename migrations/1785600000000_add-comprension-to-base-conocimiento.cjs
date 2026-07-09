exports.up = (pgm) => {
  pgm.addColumns('base_conocimiento_enel', {
    comprension_doc:      { type: 'jsonb',      default: null },
    embedding_comprension: { type: 'vector(384)', default: null },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('base_conocimiento_enel', ['comprension_doc', 'embedding_comprension']);
};
