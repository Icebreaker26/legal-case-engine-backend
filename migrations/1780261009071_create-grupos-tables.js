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
    pgm.createTable('grupos', {
        id: { type: 'serial', primaryKey: true },
        nombre: { type: 'varchar(100)', notNull: true, unique: true }
    });

    pgm.createTable('comunicacion_grupos', {
        comunicacion_id: { type: 'integer', notNull: true, references: '"comunicaciones"(id)', onDelete: 'cascade' },
        grupo_id: { type: 'integer', notNull: true, references: '"grupos"(id)', onDelete: 'cascade' }
    });
    pgm.addConstraint('comunicacion_grupos', 'pk_comunicacion_grupos', {
        primaryKey: ['comunicacion_id', 'grupo_id']
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('comunicacion_grupos');
    pgm.dropTable('grupos');
};
