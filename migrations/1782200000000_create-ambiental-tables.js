export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE expedientes_ambientales (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      numero_expediente VARCHAR(100),
      titulo            VARCHAR(255) NOT NULL,
      tipo_instrumento  VARCHAR(50) NOT NULL,
      entidad_id        INTEGER REFERENCES global_entidades(id),
      responsable_uuid  UUID REFERENCES global_usuarios(id),
      grupo_id          INTEGER REFERENCES global_grupos(id),
      contenido_texto   TEXT,
      prompt_generado   TEXT,
      que_ordena        TEXT,
      admite_recurso    VARCHAR(20),
      plazo_respuesta   VARCHAR(100),
      estado            VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
      fecha_documento   DATE,
      is_active         BOOLEAN NOT NULL DEFAULT true,
      creado_por        UUID NOT NULL REFERENCES global_usuarios(id),
      created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE analisis_ambiental (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expediente_id    UUID NOT NULL REFERENCES expedientes_ambientales(id) ON DELETE CASCADE,
      nivel_riesgo     VARCHAR(20) NOT NULL,
      resumen          TEXT NOT NULL,
      resultado_llm_raw TEXT,
      creado_por       UUID NOT NULL REFERENCES global_usuarios(id),
      created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE hallazgos_ambientales (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      analisis_id      UUID NOT NULL REFERENCES analisis_ambiental(id) ON DELETE CASCADE,
      numero_hallazgo  INTEGER NOT NULL,
      tipo             VARCHAR(50) NOT NULL,
      descripcion      TEXT NOT NULL,
      norma_infringida VARCHAR(255),
      recomendacion    TEXT,
      prioridad        VARCHAR(20) NOT NULL
    );

    CREATE TABLE normas_citadas_ambiental (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      analisis_id UUID NOT NULL REFERENCES analisis_ambiental(id) ON DELETE CASCADE,
      instrumento VARCHAR(50) NOT NULL,
      articulo    VARCHAR(100),
      descripcion TEXT
    );

    INSERT INTO modulos (nombre, descripcion)
    VALUES ('ambiental', 'Derecho Ambiental - Ley 99/93 y Decreto 1076/2015');
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM modulos WHERE nombre = 'ambiental';
    DROP TABLE IF EXISTS normas_citadas_ambiental CASCADE;
    DROP TABLE IF EXISTS hallazgos_ambientales CASCADE;
    DROP TABLE IF EXISTS analisis_ambiental CASCADE;
    DROP TABLE IF EXISTS expedientes_ambientales CASCADE;
  `);
};
