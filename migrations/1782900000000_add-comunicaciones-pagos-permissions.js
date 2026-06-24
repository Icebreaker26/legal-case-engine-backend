export const up = (pgm) => {
  pgm.sql(`
    -- Módulo comunicaciones y sus acciones específicas
    INSERT INTO modulos (nombre) VALUES ('comunicaciones') ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('READ_COM')    ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('WRITE_COM')   ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('DELETE_COM')  ON CONFLICT (nombre) DO NOTHING;

    -- Módulo pagos y sus acciones específicas
    INSERT INTO modulos (nombre) VALUES ('pagos') ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('READ_PAGO')   ON CONFLICT (nombre) DO NOTHING;
    INSERT INTO acciones (nombre) VALUES ('WRITE_PAGO')  ON CONFLICT (nombre) DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM modulos WHERE nombre IN ('comunicaciones', 'pagos');
    DELETE FROM acciones WHERE nombre IN ('READ_COM', 'WRITE_COM', 'DELETE_COM', 'READ_PAGO', 'WRITE_PAGO');
  `);
};
