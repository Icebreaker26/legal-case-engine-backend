export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE respuestas_peticion (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tutela_id       UUID NOT NULL REFERENCES tutelas(id) ON DELETE CASCADE,
      encabezado      JSONB,
      introduccion    TEXT,
      cierre          TEXT,
      prescripcion    JSONB,
      partes_procesadas INTEGER[] DEFAULT '{}',
      created_at      TIMESTAMP DEFAULT NOW(),
      updated_at      TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE respuesta_peticion_items (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      respuesta_id    UUID NOT NULL REFERENCES respuestas_peticion(id) ON DELETE CASCADE,
      numero          INTEGER NOT NULL,
      solicitud       TEXT NOT NULL,
      respuesta       TEXT NOT NULL,
      normas_citadas  TEXT[] DEFAULT '{}',
      parte           INTEGER,
      created_at      TIMESTAMP DEFAULT NOW()
    );

    CREATE UNIQUE INDEX idx_respuestas_peticion_tutela ON respuestas_peticion(tutela_id);
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS respuesta_peticion_items;
    DROP TABLE IF EXISTS respuestas_peticion;
  `);
};
