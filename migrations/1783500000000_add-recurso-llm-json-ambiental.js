export const up = (pgm) => {
  pgm.sql(`ALTER TABLE expedientes_ambientales ADD COLUMN IF NOT EXISTS recurso_llm_json TEXT`);
};

export const down = (pgm) => {
  pgm.dropColumn('expedientes_ambientales', 'recurso_llm_json');
};
