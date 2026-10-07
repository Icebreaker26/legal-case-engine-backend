// ECCP fase (g) — ver #161, docs/ANALISIS_ESTIGMERGIA_ECCP.md sección 3.7
// decisión 3: solo admin puede marcar un precedente como jurídicamente
// superado. `vigencia_factor` reemplaza el estado absorbente actual
// (relevancia_score <= -5 -> es_exitosa=false, sin control de quién lo
// dispara) -- multiplica el score completo del documento en el re-ranking
// acotado (#161 fase e), así que anula la señal colectiva de la feromona
// aunque el documento tenga muchos votos positivos (diseño §3.5).
//
// Puramente aditivo: default 1 (vigente) no cambia nada de lo que corre hoy.
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.addColumns('base_conocimiento_enel', {
    vigencia_factor: { type: 'numeric', notNull: true, default: 1 },
    vigencia_actualizada_por: { type: 'uuid', references: 'global_usuarios(id)', onDelete: 'SET NULL' },
    vigencia_actualizada_en: { type: 'timestamptz' },
    vigencia_motivo: { type: 'text' },
  });

  pgm.addConstraint('base_conocimiento_enel', 'chk_vigencia_factor_rango', {
    check: 'vigencia_factor >= 0 AND vigencia_factor <= 1',
  });
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropConstraint('base_conocimiento_enel', 'chk_vigencia_factor_rango');
  pgm.dropColumns('base_conocimiento_enel', [
    'vigencia_factor',
    'vigencia_actualizada_por',
    'vigencia_actualizada_en',
    'vigencia_motivo',
  ]);
};
