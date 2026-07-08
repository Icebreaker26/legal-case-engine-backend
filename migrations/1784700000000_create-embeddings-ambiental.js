export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS embeddings_ambiental (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expediente_id UUID NOT NULL REFERENCES expedientes_ambientales(id) ON DELETE CASCADE,
      embedding     vector(384) NOT NULL,
      fuente        VARCHAR(20) NOT NULL CHECK (fuente IN ('contenido', 'analisis')),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (expediente_id)
    );
    CREATE INDEX ON embeddings_ambiental USING hnsw (embedding vector_cosine_ops);
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS embeddings_ambiental;`);
};
