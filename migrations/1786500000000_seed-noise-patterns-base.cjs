// #164 — cleanerService: patrones base de limpieza en noise_patterns.
//
// Hoy la tabla nace vacía (src/db/init_schema.sql, sin seed versionado) --
// si queda vacía (nunca sembrada, o un admin borra todo), limpiarTexto()
// se vuelve un no-op silencioso. Esta migración siembra un set MÍNIMO y
// genérico de ruido de OCR/PDF, elegido para ser inequívoco (no hay texto
// jurídico legítimo razonable que coincida) -- no es el resultado de
// revisar PDFs reales de Enel, que requiere a Alejandro (#164 lo marca
// explícitamente como pendiente de su revisión). Un admin puede desactivar
// cualquiera de estos (activo=false) o agregar los específicos de Enel
// desde el panel sin tocar código.
//
// noise_patterns es una tabla chica (decenas de filas, no caliente) --
// CREATE UNIQUE INDEX normal alcanza, no hace falta CONCURRENTLY.
//
// ON CONFLICT (patron) DO NOTHING -- requiere el índice único que esta
// misma migración agrega; así un redeploy nunca duplica filas ni pisa un
// patrón que un admin ya desactivó o editó a mano.
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.sql('CREATE UNIQUE INDEX IF NOT EXISTS noise_patterns_patron_key ON noise_patterns (patron);');

  // Doble backslash: esto es un template literal de JS, no una string
  // string SQL directa -- '\\s' en el código produce el string JS de 2
  // caracteres \s (backslash+s), que es lo que necesita node-pg (parámetro
  // de texto plano, sin más capas de escape) para que quede guardado en
  // `patron` como \s, y luego cleanerService.js lo use tal cual en
  // `new RegExp(patron, 'gi')`. Un solo backslash (p.ej. '\s') se comería
  // la barra en el propio parseo del template literal de JS.
  pgm.sql(`
    INSERT INTO noise_patterns (patron, descripcion, activo) VALUES
      ('P[áa]gina\\s+\\d+\\s+de\\s+\\d+', '#164 (seed base): pie de página "Página X de Y"', true),
      ('_{10,}', '#164 (seed base): línea de firma en blanco (10+ guiones bajos seguidos)', true),
      ('\\.{10,}', '#164 (seed base): leader de tabla de contenido (10+ puntos seguidos)', true),
      ('\\f', '#164 (seed base): carácter de salto de página (form feed) residual de OCR', true)
    ON CONFLICT (patron) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.sql(`
    DELETE FROM noise_patterns WHERE descripcion LIKE '#164 (seed base):%';
  `);
  pgm.sql('DROP INDEX IF EXISTS noise_patterns_patron_key;');
};

exports.shorthands = undefined;
