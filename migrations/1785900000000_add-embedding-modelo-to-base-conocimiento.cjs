// #101: marca con qué modelo se generó embedding_local/embedding_comprension
// en cada fila. Dos usos:
//   1. Reanudabilidad de scripts/reindexar_embeddings.js -- permite retomar
//      una corrida interrumpida sin reprocesar lo ya hecho.
//   2. Detección de mezcla de modelos (riesgo señalado en #101/#124/#127):
//      si un reindexado parcial deja embedding_local con un modelo y
//      embedding_comprension con otro, COALESCE(embedding_comprension,
//      embedding_local) los compara sin ningún error -- esta columna permite
//      auditarlo después.
//
// Nullable, sin default -- las filas existentes quedan NULL (no se sabe con
// qué modelo se generaron sus embeddings actuales; todo lo indexado hasta
// ahora fue con el MiniLM por defecto de aiService.js, documentado acá por
// si hace falta un backfill manual con ese valor).
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.addColumns('base_conocimiento_enel', {
    embedding_modelo: { type: 'text', default: null },
  });
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropColumns('base_conocimiento_enel', ['embedding_modelo']);
};
