export const up = (pgm) => {
  pgm.sql(`ALTER TABLE expedientes_ambientales ADD COLUMN IF NOT EXISTS hallazgos_recurso_ids uuid[] NOT NULL DEFAULT '{}'`);
};

export const down = (pgm) => {
  pgm.dropColumn('expedientes_ambientales', 'hallazgos_recurso_ids');
};
