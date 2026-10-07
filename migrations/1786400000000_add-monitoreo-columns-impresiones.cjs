// ECCP (#174) — columnas aditivas a impresiones_precedentes (#165/#166) para
// poder decidir con datos si conviene encender el flag de #173, o
// diagnosticar una reversión si ya está encendido.
//
// `delta_feromona` es el aporte crudo γ·señal_feromona (pre-vigencia_factor)
// -- solo para análisis, nunca se expone al abogado, igual que `score_final`
// (#142/#167: buildFichaPrecedente no debe poder leer el componente de
// feromona).
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.addColumns('impresiones_precedentes', {
    fusion_modo: { type: 'varchar(20)' },
    embedding_model: { type: 'varchar(100)' },
    gamma: { type: 'numeric' },
    config_version: { type: 'varchar(50)' },
    delta_feromona: { type: 'numeric' },
  });

  pgm.createIndex('impresiones_precedentes', 'fusion_modo');
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropColumns('impresiones_precedentes', ['fusion_modo', 'embedding_model', 'gamma', 'config_version', 'delta_feromona']);
};
