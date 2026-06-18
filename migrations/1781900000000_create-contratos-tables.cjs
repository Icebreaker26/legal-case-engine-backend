exports.up = async (pgm) => {
  // Crear extensión uuid-ossp si no existe
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Tabla: minutas_estandar
  pgm.createTable('minutas_estandar', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    titulo: { type: 'varchar(255)', notNull: true },
    descripcion: { type: 'text' },
    tipo_contrato: { type: 'varchar(100)' },
    contenido_texto: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
  pgm.createIndex('minutas_estandar', 'tipo_contrato');

  // Tabla: registros_auditoria
  pgm.createTable('registros_auditoria', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    minuta_estandar_id: { type: 'uuid', notNull: true, references: 'minutas_estandar(id)', onDelete: 'CASCADE' },
    tercero_id: { type: 'integer', notNull: true, references: 'global_entidades(id)', onDelete: 'CASCADE' },
    prompt_generado: { type: 'text' },
    resultado_llm_texto: { type: 'text' },
    estado_seguimiento: { type: 'varchar(50)', default: 'Pendiente' },
    fecha_seguimiento: { type: 'date' },
    creado_por: { type: 'uuid', notNull: true, references: 'global_usuarios(id)' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
};

exports.down = async (pgm) => {
  pgm.dropTable('registros_auditoria');
  pgm.dropTable('minutas_estandar');
};
