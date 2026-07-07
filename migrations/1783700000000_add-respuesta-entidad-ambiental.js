export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS respuesta_entidad_texto TEXT,
      ADD COLUMN IF NOT EXISTS fecha_respuesta DATE;
  `);

  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      DROP CONSTRAINT IF EXISTS expedientes_ambientales_estado_check;
    ALTER TABLE expedientes_ambientales
      ADD CONSTRAINT expedientes_ambientales_estado_check
      CHECK (estado IN ('Pendiente', 'Analizado', 'Revisado', 'Archivado', 'Cerrado'));
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      DROP COLUMN IF EXISTS respuesta_entidad_texto,
      DROP COLUMN IF EXISTS fecha_respuesta;
  `);

  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      DROP CONSTRAINT IF EXISTS expedientes_ambientales_estado_check;
    ALTER TABLE expedientes_ambientales
      ADD CONSTRAINT expedientes_ambientales_estado_check
      CHECK (estado IN ('Pendiente', 'Analizado', 'Revisado', 'Archivado'));
  `);
};
