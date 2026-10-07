// ECCP (#173) — flag de activación de fusion:'alpha_fb', por endpoint.
//
// Alejandro decidió (chat, 2026-10-07) que el flag arranque en `true` desde
// el día 0, no apagado: la guarda dura de `resolverFusionAlphaFb`
// (consultaService.js) ya protege contra usarlo con el modelo/datos
// equivocados, cayendo en silencio a 'ponderado' hasta que #100 (reindexado
// a multilingual-e5-small) esté completo. El flag en sí solo expresa la
// intención "úsalo cuando los datos ya lo permitan", nunca una orden
// incondicional de activación.
//
// ON CONFLICT DO NOTHING: si un admin ya editó esta key manualmente (vía
// PUT /api/tutelas/config), un redeploy nunca debe pisarle el valor.
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.sql(`
    INSERT INTO system_config (key, value, description)
    VALUES (
      'rag.alpha_fb.endpoints',
      '{"obtenerSugerenciasTutela": true}'::jsonb,
      'ECCP (#161/#173): por endpoint, si puede usar fusion:''alpha_fb'' (sujeto a la guarda dura de EMBEDDING_MODEL + datos reindexados). RAG_ALPHA_FB_KILL=true en el entorno tiene prioridad absoluta sobre este valor.'
    )
    ON CONFLICT (key) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.sql("DELETE FROM system_config WHERE key = 'rag.alpha_fb.endpoints';");
};
