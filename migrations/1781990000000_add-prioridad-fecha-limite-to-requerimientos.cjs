exports.up = async (pgm) => {
  pgm.sql(`
    ALTER TABLE requerimientos_internos
      ADD COLUMN IF NOT EXISTS fecha_limite date;

    ALTER TABLE requerimientos_internos
      ADD COLUMN IF NOT EXISTS prioridad varchar(10) DEFAULT 'Media' NOT NULL;

    UPDATE requerimientos_internos SET prioridad = 'Media' WHERE prioridad NOT IN ('Alta', 'Media', 'Baja');

    ALTER TABLE requerimientos_internos
      ADD CONSTRAINT requerimientos_internos_prioridad_check
      CHECK (prioridad IN ('Alta', 'Media', 'Baja'));

    DO $$
    BEGIN
      ALTER TABLE requerimientos_internos
        DROP CONSTRAINT IF EXISTS requerimientos_internos_estado_check;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;

    ALTER TABLE requerimientos_internos
      ADD CONSTRAINT requerimientos_internos_estado_check
      CHECK (estado IN ('Pendiente', 'En Gestión', 'Respondido', 'Vencido'));
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    ALTER TABLE requerimientos_internos DROP CONSTRAINT IF EXISTS requerimientos_internos_estado_check;
    ALTER TABLE requerimientos_internos DROP CONSTRAINT IF EXISTS requerimientos_internos_prioridad_check;
  `);
  pgm.dropColumns('requerimientos_internos', ['prioridad', 'fecha_limite']);
};
