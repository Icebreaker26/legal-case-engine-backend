export const up = (pgm) => {
  pgm.sql(`
    INSERT INTO modulos (nombre, descripcion)
    VALUES ('reportes', 'Reportes y consultas cross-módulo')
    ON CONFLICT (nombre) DO NOTHING;

    INSERT INTO acciones (nombre) VALUES ('READ') ON CONFLICT (nombre) DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM modulos WHERE nombre = 'reportes';
  `);
};
