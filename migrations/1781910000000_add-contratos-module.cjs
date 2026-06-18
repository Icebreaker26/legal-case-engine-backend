exports.up = async (pgm) => {
  pgm.sql("INSERT INTO modulos (nombre) VALUES ('contratos');");
};

exports.down = async (pgm) => {
  pgm.sql("DELETE FROM modulos WHERE nombre = 'contratos';");
};
