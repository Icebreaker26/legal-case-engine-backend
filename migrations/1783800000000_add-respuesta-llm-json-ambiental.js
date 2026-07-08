export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS respuesta_llm_json TEXT;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      DROP COLUMN IF EXISTS respuesta_llm_json;
  `);
};
