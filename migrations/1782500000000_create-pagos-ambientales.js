export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE pagos_ambientales (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expediente_id UUID NOT NULL REFERENCES expedientes_ambientales(id) ON DELETE CASCADE,
      descripcion   VARCHAR(300),
      valor         VARCHAR(200) NOT NULL,
      plazo         VARCHAR(200),
      estado        VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE expedientes_ambientales
      DROP COLUMN IF EXISTS valor_pago,
      DROP COLUMN IF EXISTS plazo_pago;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS pagos_ambientales;

    ALTER TABLE expedientes_ambientales
      ADD COLUMN IF NOT EXISTS valor_pago  VARCHAR(200),
      ADD COLUMN IF NOT EXISTS plazo_pago  VARCHAR(200);
  `);
};
