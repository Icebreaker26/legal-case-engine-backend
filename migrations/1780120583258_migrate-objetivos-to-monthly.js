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
    // Limpiamos los datos actuales de objetivos porque la estructura cambia radicalmente
    pgm.sql('DELETE FROM objetivos');
    
    pgm.dropColumns('objetivos', ['periodo_inicio', 'periodo_fin']);
    pgm.addColumns('objetivos', {
        mes: { type: 'integer', notNull: true },
        anio: { type: 'integer', notNull: true }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumns('objetivos', ['mes', 'anio']);
    pgm.addColumns('objetivos', {
        periodo_inicio: { type: 'date' },
        periodo_fin: { type: 'date' }
    });
};
