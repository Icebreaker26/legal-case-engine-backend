// #145: respuesta_peticion_items no tenía restricción única, así que el
// `ON CONFLICT DO NOTHING` del insert de fusión (tutelaController.js) no
// comparaba contra nada y nunca hacía nada -- repegar la respuesta de un
// lote duplicaba sus ítems en silencio.
//
// Antes de agregar la restricción, se deduplican las filas existentes que
// ya hayan quedado duplicadas por el bug, conservando la más reciente por
// (respuesta_id, numero).
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.sql(`
    DELETE FROM respuesta_peticion_items
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY respuesta_id, numero
                 ORDER BY created_at DESC, id DESC
               ) AS rn
        FROM respuesta_peticion_items
      ) dedup
      WHERE dedup.rn > 1
    );
  `);

  pgm.addConstraint('respuesta_peticion_items', 'uq_respuesta_peticion_items_respuesta_numero', {
    unique: ['respuesta_id', 'numero'],
  });
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropConstraint('respuesta_peticion_items', 'uq_respuesta_peticion_items_respuesta_numero');
};
