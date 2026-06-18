exports.up = async (pgm) => {
  // Garantiza que las acciones necesarias existan en el catálogo
  pgm.sql(`
    INSERT INTO acciones (nombre) VALUES ('READ')   ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('WRITE')  ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('DELETE') ON CONFLICT (nombre) DO NOTHING;
  `);
};

exports.down = async (pgm) => {
  // No elimina las acciones: pueden ser usadas por otros módulos
};
