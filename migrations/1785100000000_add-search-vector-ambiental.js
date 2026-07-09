export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS search_vector tsvector;

    CREATE INDEX IF NOT EXISTS idx_expedientes_ambientales_search_vector
      ON expedientes_ambientales USING gin(search_vector);

    -- Poblar registros existentes
    UPDATE expedientes_ambientales
    SET search_vector = to_tsvector('spanish',
      COALESCE(titulo, '') || ' ' ||
      COALESCE(numero_expediente, '') || ' ' ||
      COALESCE(tipo_instrumento, '') || ' ' ||
      COALESCE(que_ordena, '') || ' ' ||
      COALESCE(LEFT(contenido_texto, 2000), '')
    );

    -- Trigger para mantener search_vector actualizado automáticamente
    CREATE OR REPLACE FUNCTION update_expediente_ambiental_search_vector()
    RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('spanish',
        COALESCE(NEW.titulo, '') || ' ' ||
        COALESCE(NEW.numero_expediente, '') || ' ' ||
        COALESCE(NEW.tipo_instrumento, '') || ' ' ||
        COALESCE(NEW.que_ordena, '') || ' ' ||
        COALESCE(LEFT(NEW.contenido_texto, 2000), '')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trig_expediente_ambiental_search ON expedientes_ambientales;
    CREATE TRIGGER trig_expediente_ambiental_search
      BEFORE INSERT OR UPDATE ON expedientes_ambientales
      FOR EACH ROW EXECUTE FUNCTION update_expediente_ambiental_search_vector();
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS trig_expediente_ambiental_search ON expedientes_ambientales;
    DROP FUNCTION IF EXISTS update_expediente_ambiental_search_vector();
    DROP INDEX IF EXISTS idx_expedientes_ambientales_search_vector;
    ALTER TABLE expedientes_ambientales DROP COLUMN IF EXISTS search_vector;
  `);
};
