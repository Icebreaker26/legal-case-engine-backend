export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS biblioteca_clusters (
      id SERIAL PRIMARY KEY,
      cluster_index INTEGER NOT NULL,
      expediente_id UUID,
      titulo TEXT,
      resumen TEXT,
      tipo_instrumento TEXT,
      nivel_riesgo TEXT,
      miembros_count INTEGER DEFAULT 0,
      tipo_distribucion JSONB DEFAULT '{}',
      riesgo_distribucion JSONB DEFAULT '{}',
      expediente_ids TEXT[] DEFAULT '{}',
      computed_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS biblioteca_meta (
      id INTEGER PRIMARY KEY DEFAULT 1,
      last_computed_at TIMESTAMPTZ,
      embeddings_count_at_compute INTEGER DEFAULT 0
    );

    INSERT INTO biblioteca_meta (id) VALUES (1) ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS biblioteca_clusters;
    DROP TABLE IF EXISTS biblioteca_meta;
  `);
};
