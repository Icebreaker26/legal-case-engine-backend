export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS file_hash      VARCHAR(64),
      ADD COLUMN IF NOT EXISTS contenido_hash VARCHAR(64);

    CREATE INDEX IF NOT EXISTS idx_exp_ambiental_file_hash
      ON expedientes_ambientales(file_hash)
      WHERE is_active = true AND file_hash IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_exp_ambiental_contenido_hash
      ON expedientes_ambientales(contenido_hash)
      WHERE is_active = true AND contenido_hash IS NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_exp_ambiental_file_hash;
    DROP INDEX IF EXISTS idx_exp_ambiental_contenido_hash;
    ALTER TABLE expedientes_ambientales
      DROP COLUMN IF EXISTS file_hash,
      DROP COLUMN IF EXISTS contenido_hash;
  `);
};
