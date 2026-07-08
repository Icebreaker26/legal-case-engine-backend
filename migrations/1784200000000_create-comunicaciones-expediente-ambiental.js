export const up = (pgm) => {
  pgm.createTable('comunicaciones_expediente', {
    id:              { type: 'UUID', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    expediente_id:   { type: 'UUID', notNull: true, references: '"expedientes_ambientales"', onDelete: 'CASCADE' },
    direccion:       { type: 'VARCHAR(10)', notNull: true }, // 'entrante' | 'saliente'
    asunto:          { type: 'TEXT', notNull: true },
    fecha:           { type: 'DATE', notNull: true },
    descripcion:     { type: 'TEXT' },
    texto_extraido:  { type: 'TEXT' },
    nombre_archivo:  { type: 'VARCHAR(255)' },
    creado_por:      { type: 'UUID', references: '"global_usuarios"', onDelete: 'SET NULL' },
    is_active:       { type: 'BOOLEAN', notNull: true, default: true },
    created_at:      { type: 'TIMESTAMPTZ', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.addConstraint('comunicaciones_expediente', 'comunicaciones_expediente_direccion_check',
    `CHECK (direccion IN ('entrante', 'saliente'))`);
  pgm.createIndex('comunicaciones_expediente', ['expediente_id', 'fecha']);
};

export const down = (pgm) => {
  pgm.dropTable('comunicaciones_expediente');
};
