export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS biblioteca_terminos_ignorados (
      word TEXT PRIMARY KEY,
      ignorado_por UUID REFERENCES global_usuarios(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS biblioteca_terminos_ignorados;`);
};
