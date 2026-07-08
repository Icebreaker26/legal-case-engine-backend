export const up = (pgm) => {
  pgm.addColumn('comunicaciones_expediente', {
    resultado_llm:     { type: 'TEXT', notNull: false },
    prompt_generado:   { type: 'TEXT', notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('comunicaciones_expediente', 'resultado_llm');
  pgm.dropColumn('comunicaciones_expediente', 'prompt_generado');
};
