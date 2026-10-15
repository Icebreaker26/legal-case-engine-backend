// ECCP fase (f, #186) — columna aditiva a impresiones_precedentes
// (#165/#166/#174) para poder medir el slot explorador (§3.3): si la
// impresión en ese puesto fue decidida por UCB (true) o quedó igual que la
// explotación pura (false/NULL en impresiones anteriores a este cambio).
exports.up = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");

  pgm.addColumns('impresiones_precedentes', {
    es_exploracion: { type: 'boolean', notNull: false, default: false },
  });
};

exports.down = (pgm) => {
  pgm.sql("SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
  pgm.dropColumns('impresiones_precedentes', ['es_exploracion']);
};
