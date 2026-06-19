exports.up = async (pgm) => {
  pgm.sql(`
    ALTER TABLE notificaciones
      ADD COLUMN IF NOT EXISTS usuario_uuid UUID REFERENCES global_usuarios(id) ON DELETE CASCADE;

    ALTER TABLE notificaciones
      ADD COLUMN IF NOT EXISTS referencia_uuid UUID;

    CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_uuid ON notificaciones(usuario_uuid);
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_notificaciones_usuario_uuid;
    ALTER TABLE notificaciones DROP COLUMN IF EXISTS usuario_uuid;
    ALTER TABLE notificaciones DROP COLUMN IF EXISTS referencia_uuid;
  `);
};
