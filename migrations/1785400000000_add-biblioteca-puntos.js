export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS biblioteca_puntos (
      id              SERIAL PRIMARY KEY,
      expediente_id   UUID,
      titulo          TEXT,
      tipo_instrumento TEXT,
      nivel_riesgo    TEXT,
      cluster_index   INTEGER,
      x               FLOAT,
      y               FLOAT,
      computed_at     TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS biblioteca_puntos;`);
};
