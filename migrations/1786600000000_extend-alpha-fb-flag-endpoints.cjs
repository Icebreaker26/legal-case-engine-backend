// #100 fase 3 (flip de código) — extiende el flag `rag.alpha_fb.endpoints`
// (#173, 1786300000000_seed-alpha-fb-flag.cjs) a los 3 endpoints de
// recuperación de precedentes que hasta ahora llamaban a `recuperarPrecedentes`
// sin pasar `fusion` (default 'ponderado' sin cambios): `procesarTutela`,
// `generarBorradorContestacion`, `generarPromptsPeticion`. Solo
// `obtenerSugerenciasTutela` pasaba por la guarda dura de `resolverFusionAlphaFb`.
//
// La guarda dura (consultaService.js) sigue protegiendo contra activar
// 'alpha_fb' con el modelo/datos equivocados -- este flag en true solo
// expresa intención, no activación incondicional (misma nota que la
// migración original de #173). Mezcla con `||` para no pisar el valor de un
// admin que ya haya editado la key manualmente (`existing wins` para keys
// repetidas, mismo patrón documentado ahí).
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.sql(`
    UPDATE system_config
    SET value = '{"procesarTutela": true, "generarBorradorContestacion": true, "generarPromptsPeticion": true}'::jsonb || value
    WHERE key = 'rag.alpha_fb.endpoints';
  `);
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.sql(`
    UPDATE system_config
    SET value = value - 'procesarTutela' - 'generarBorradorContestacion' - 'generarPromptsPeticion'
    WHERE key = 'rag.alpha_fb.endpoints';
  `);
};
