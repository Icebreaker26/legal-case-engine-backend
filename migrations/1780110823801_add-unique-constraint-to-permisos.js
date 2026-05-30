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
    // 1. Eliminar duplicados manteniendo solo uno por cada combinación
    pgm.sql(`
        DELETE FROM permisos a
        USING permisos b
        WHERE a.id > b.id
        AND a.usuario_id = b.usuario_id
        AND a.modulo_id = b.modulo_id
        AND a.accion_id = b.accion_id;
    `);

    // 2. Añadir restricción única
    pgm.addConstraint('permisos', 'unique_user_module_action', {
        unique: ['usuario_id', 'modulo_id', 'accion_id']
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropConstraint('permisos', 'unique_user_module_action');
};
