export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS proyecto_id INTEGER REFERENCES global_proyectos(id) ON DELETE SET NULL
  `);
};

export const down = (pgm) => {
  pgm.dropColumn('expedientes_ambientales', 'proyecto_id');
};
