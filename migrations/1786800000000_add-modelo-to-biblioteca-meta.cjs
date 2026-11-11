// #198 (épica #199) — la meta del último cálculo de la biblioteca ambiental
// registra con qué vectores se calculó, para que `needs_recalculate` avise
// cuando cambian el modelo de embeddings o la fuente de los vectores (antes
// solo miraba conteos: reindexar con otro modelo y el mismo número de filas
// dejaba los grupos viejos sin aviso), y la silueta media del k elegido.
//
// Solo aditiva (columnas nulas en una tabla de una fila); el down elimina
// solo estas columnas.
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.sql(`
    ALTER TABLE biblioteca_meta
      ADD COLUMN IF NOT EXISTS modelo_at_compute TEXT,
      ADD COLUMN IF NOT EXISTS fuente_at_compute TEXT,
      ADD COLUMN IF NOT EXISTS silueta NUMERIC;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE biblioteca_meta
      DROP COLUMN IF EXISTS modelo_at_compute,
      DROP COLUMN IF EXISTS fuente_at_compute,
      DROP COLUMN IF EXISTS silueta;
  `);
};
