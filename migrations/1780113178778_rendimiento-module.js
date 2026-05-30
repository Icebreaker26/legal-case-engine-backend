/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    // 1. Gestión de Equipos
    pgm.createTable('equipos', {
        id: 'id',
        nombre: { type: 'varchar(100)', notNull: true },
        manager_id: { type: 'integer', references: 'abogados(id)' }
    });

    // 2. Relacionar abogados con equipos
    pgm.addColumns('abogados', {
        equipo_id: { type: 'integer', references: 'equipos(id)' }
    });

    // 3. Definición de Objetivos
    pgm.createTable('objetivos', {
        id: 'id',
        usuario_id: { type: 'integer', notNull: true, references: 'abogados(id)', onDelete: 'CASCADE' },
        meta_acciones: { type: 'integer', notNull: true },
        periodo_inicio: { type: 'date', notNull: true },
        periodo_fin: { type: 'date', notNull: true }
    });

    // 4. Registro de acciones (Tiempo real)
    pgm.createTable('registro_acciones', {
        id: 'id',
        usuario_id: { type: 'integer', notNull: true, references: 'abogados(id)', onDelete: 'CASCADE' },
        objetivo_id: { type: 'integer', references: 'objetivos(id)', onDelete: 'CASCADE' },
        fecha_registro: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
        comentario: { type: 'text' }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('registro_acciones');
    pgm.dropTable('objetivos');
    pgm.dropColumns('abogados', ['equipo_id']);
    pgm.dropTable('equipos');
};
