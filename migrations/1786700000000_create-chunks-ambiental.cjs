// #194 (épica #199) — esquema de trozos de expedientes ambientales, con el
// modelo de embeddings registrado por fila.
//
// `embeddings_ambiental` (1784700000000) guarda UN vector por expediente
// (UNIQUE(expediente_id)), sin registrar el modelo y con el texto truncado a
// 1.500 caracteres: el resto del expediente no se busca. Esta tabla es el
// equivalente de `base_conocimiento_enel` para ambiental: varios trozos por
// expediente, cada uno con su vector, su tsvector y el modelo que lo generó,
// para que la búsqueda α (src/services/motorBusqueda.js) y su guarda de modelo
// (`IS DISTINCT FROM`) puedan usarse igual que en tutelas (#196).
//
// Solo aditiva: `embeddings_ambiental` no se toca y sigue siendo la que lee
// `buscarSimilares` hasta el corte de #196. La llenan la indexación y el
// script de reindexación de #195. entrypoint.sh aplica esta migración sola al
// desplegar main; sobre una tabla nueva y vacía no bloquea nada.
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS chunks_ambiental (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expediente_id    UUID NOT NULL REFERENCES expedientes_ambientales(id) ON DELETE CASCADE,
      chunk_index      INTEGER NOT NULL CHECK (chunk_index >= 0),
      contenido        TEXT NOT NULL,
      embedding        vector(384) NOT NULL,
      contenido_tsv    tsvector GENERATED ALWAYS AS (to_tsvector('spanish', contenido)) STORED,
      embedding_modelo TEXT NOT NULL,
      fuente           VARCHAR(20) NOT NULL CHECK (fuente IN ('contenido', 'analisis')),
      is_active        BOOLEAN NOT NULL DEFAULT TRUE,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_ambiental_embedding_hnsw
      ON chunks_ambiental
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);

    CREATE INDEX IF NOT EXISTS idx_chunks_ambiental_tsv
      ON chunks_ambiental
      USING gin (contenido_tsv);

    CREATE INDEX IF NOT EXISTS idx_chunks_ambiental_expediente
      ON chunks_ambiental (expediente_id);

    -- Un mismo trozo (expediente, fuente, posición) solo puede estar activo
    -- una vez; las filas desactivadas por borrado lógico no cuentan.
    CREATE UNIQUE INDEX IF NOT EXISTS uq_chunks_ambiental_activo
      ON chunks_ambiental (expediente_id, fuente, chunk_index)
      WHERE is_active = TRUE;
  `);
};

// Elimina solo lo creado arriba (los índices caen con la tabla).
exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS chunks_ambiental;');
};
