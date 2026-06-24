exports.up = async (pgm) => {
  // Requiere pgvector >= 0.5.0 (disponible en todas las versiones recientes)
  // HNSW es más rápido que el índice IVFFlat para colecciones pequeñas/medianas
  // m=16: nodos por capa (mayor = más preciso, más RAM); ef_construction=64: balance construcción/calidad
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_base_conocimiento_embedding_hnsw
      ON base_conocimiento_enel
      USING hnsw (embedding_local vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  `);

  // GIN sobre tsvector precalculado elimina la llamada a to_tsvector() en cada búsqueda
  pgm.sql(`
    ALTER TABLE base_conocimiento_enel
      ADD COLUMN IF NOT EXISTS contenido_tsv tsvector
      GENERATED ALWAYS AS (to_tsvector('spanish', contenido_legal)) STORED;

    CREATE INDEX IF NOT EXISTS idx_base_conocimiento_tsv
      ON base_conocimiento_enel
      USING gin (contenido_tsv);
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_base_conocimiento_embedding_hnsw;
    DROP INDEX IF EXISTS idx_base_conocimiento_tsv;
    ALTER TABLE base_conocimiento_enel DROP COLUMN IF EXISTS contenido_tsv;
  `);
};
