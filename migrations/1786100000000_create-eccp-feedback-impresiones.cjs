// ECCP fases (b)+(c) — ver #165, #161, docs/ANALISIS_ESTIGMERGIA_ECCP.md.
//
// Dos tablas nuevas, puramente aditivas:
//
// - feedback_precedentes: evento de voto útil/no útil por usuario/documento/
//   tutela/contexto/posición/fecha. Convive con `relevancia_score` (doble
//   escritura en el controller) — no lo reemplaza todavía.
// - impresiones_precedentes: qué se mostró, en qué posición, y la posición
//   contrafactual sin feromona (hoy siempre igual a la mostrada, porque
//   todavía no existe ninguna feromona que reordene nada).
//
// `documento_id` en ambas tablas apunta a `base_conocimiento_enel.documento_id`,
// que no es PK ni tiene constraint UNIQUE (es la clave de agrupación de los
// chunks de un mismo documento) -- no se puede declarar como FK real.
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.createTable('feedback_precedentes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    usuario_uuid: { type: 'uuid', notNull: true, references: 'global_usuarios(id)', onDelete: 'CASCADE' },
    documento_id: { type: 'uuid', notNull: true },
    tutela_id: { type: 'uuid', references: 'tutelas(id)', onDelete: 'SET NULL' },
    categoria_contexto: { type: 'varchar(100)' },
    posicion_mostrada: { type: 'integer' },
    util: { type: 'boolean', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Un rastro por agente/documento/caso (re-votar reemplaza, no suma --
  // diseño §3.3). `tutela_id` puede ser NULL (feedback sin tutela asociada),
  // así que el índice único solo cubre el caso NOT NULL; el caso NULL no se
  // deduplica a nivel de base de datos en este lote (sin casos de uso hoy).
  pgm.createIndex('feedback_precedentes', ['usuario_uuid', 'documento_id', 'tutela_id'], {
    name: 'uq_feedback_precedentes_usuario_doc_tutela',
    unique: true,
    where: 'tutela_id IS NOT NULL',
  });
  pgm.createIndex('feedback_precedentes', 'documento_id');
  pgm.createIndex('feedback_precedentes', 'categoria_contexto');

  pgm.createTable('impresiones_precedentes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    usuario_uuid: { type: 'uuid', references: 'global_usuarios(id)', onDelete: 'SET NULL' },
    tutela_id: { type: 'uuid', references: 'tutelas(id)', onDelete: 'SET NULL' },
    documento_id: { type: 'uuid', notNull: true },
    categoria_contexto: { type: 'varchar(100)' },
    posicion_mostrada: { type: 'integer', notNull: true },
    // Hoy siempre igual a posicion_mostrada -- no existe feromona todavía
    // que pueda mover un documento de su posición por S_base puro (#161 fase d/e).
    posicion_contrafactual: { type: 'integer', notNull: true },
    score_base: { type: 'numeric' },
    es_exploracion: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('impresiones_precedentes', 'documento_id');
  pgm.createIndex('impresiones_precedentes', 'tutela_id');
  pgm.createIndex('impresiones_precedentes', 'created_at');
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropTable('impresiones_precedentes');
  pgm.dropTable('feedback_precedentes');
};
