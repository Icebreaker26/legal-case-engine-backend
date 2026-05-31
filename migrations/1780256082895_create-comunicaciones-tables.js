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
    pgm.createTable('comunicaciones', {
        id: { type: 'serial', primaryKey: true },
        entidad: { type: 'varchar(255)', notNull: true },
        tipo: { type: 'varchar(50)', notNull: true },
        asunto: { type: 'varchar(255)', notNull: true },
        fecha_recepcion: { type: 'timestamp', notNull: true },
        fecha_limite: { type: 'timestamp' },
        responsable_id: { type: 'integer', references: '"abogados"(id)' },
        estado: { type: 'varchar(50)', notNull: true },
        created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
    });

    pgm.createTable('comunicacion_trazabilidad', {
        id: { type: 'serial', primaryKey: true },
        comunicacion_id: { type: 'integer', notNull: true, references: '"comunicaciones"(id)', onDelete: 'cascade' },
        usuario_id: { type: 'integer', notNull: true, references: '"abogados"(id)' },
        comentario: { type: 'text', notNull: true },
        fecha: { type: 'timestamp', default: pgm.func('current_timestamp') }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('comunicacion_trazabilidad');
    pgm.dropTable('comunicaciones');
};
