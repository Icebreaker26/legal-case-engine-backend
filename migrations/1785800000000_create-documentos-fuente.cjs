// #72 (Fase 1): persistir el texto fuente íntegro de cada documento indexado
// en base_conocimiento_enel, una sola vez por documento_id (no por chunk) --
// tabla nueva en vez de columna nueva en base_conocimiento_enel (tabla
// caliente del RAG) para no tocar su esquema ni su patrón de acceso.
//
// Fase 0 (comentario en #72, 2026-10-03) encontró que el texto fuente ya
// sobrevive independiente de los chunks para 2 de los 3 caminos de indexación
// (tutelas.contestacion_generada, tutela_argumentos.contenido) -- el gap real
// está solo en entrenarContextoLocal (/entrenar-local, subida manual vía
// multer.memoryStorage()). Esta migración no distingue el origen: guarda el
// texto para los 3 caminos por igual, para no depender de un JOIN a tablas
// que pueden cambiar (p.ej. contestacion_generada editado después).
//
// Documentos ya indexados ANTES de esta migración no tienen fila aquí -- no
// es recuperable para los indexados vía entrenarContextoLocal (ver Fase 0);
// para los otros 2 caminos, el texto sigue existiendo en su tabla de origen
// si hace falta un backfill manual más adelante (fuera de alcance de esta
// migración).
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.createTable('documentos_fuente', {
    documento_id: { type: 'uuid', notNull: true, primaryKey: true },
    texto_fuente: { type: 'text', notNull: true },
    created_at:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropTable('documentos_fuente');
};
