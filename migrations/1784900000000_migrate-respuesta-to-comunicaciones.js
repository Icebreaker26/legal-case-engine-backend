export const up = (pgm) => {
  // Migrar respuesta_entidad_texto existente a comunicaciones_expediente
  pgm.sql(`
    INSERT INTO comunicaciones_expediente
      (expediente_id, direccion, asunto, fecha, texto_extraido, resultado_llm, creado_por)
    SELECT
      id,
      'entrante',
      'Respuesta de la entidad',
      COALESCE(fecha_respuesta, NOW()::date),
      respuesta_entidad_texto,
      respuesta_llm_json,
      creado_por
    FROM expedientes_ambientales
    WHERE respuesta_entidad_texto IS NOT NULL
      AND is_active = true;
  `);

  // Eliminar columnas obsoletas
  pgm.dropColumn('expedientes_ambientales', 'respuesta_entidad_texto');
  pgm.dropColumn('expedientes_ambientales', 'fecha_respuesta');
  pgm.dropColumn('expedientes_ambientales', 'respuesta_llm_json');
};

export const down = (pgm) => {
  pgm.addColumn('expedientes_ambientales', {
    respuesta_entidad_texto: { type: 'TEXT', notNull: false },
    fecha_respuesta:         { type: 'DATE', notNull: false },
    respuesta_llm_json:      { type: 'TEXT', notNull: false },
  });
};
