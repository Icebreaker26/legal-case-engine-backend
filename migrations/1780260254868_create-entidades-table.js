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
    pgm.createTable('entidades', {
        id: { type: 'serial', primaryKey: true },
        nombre: { type: 'varchar(255)', notNull: true, unique: true }
    });

    // Añadimos la columna entidad_id a comunicaciones y borramos la vieja columna entidad
    pgm.addColumns('comunicaciones', {
        entidad_id: { type: 'integer', references: '"entidades"(id)' }
    });
    
    // Migramos datos existentes (opcional: crear entidades para lo que ya existe)
    pgm.sql('INSERT INTO entidades (nombre) SELECT DISTINCT entidad FROM comunicaciones WHERE entidad IS NOT NULL');
    pgm.sql('UPDATE comunicaciones SET entidad_id = (SELECT id FROM entidades WHERE entidades.nombre = comunicaciones.entidad)');
    
    pgm.dropColumns('comunicaciones', ['entidad']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.addColumns('comunicaciones', { entidad: { type: 'varchar(255)' } });
    pgm.sql('UPDATE comunicaciones SET entidad = (SELECT nombre FROM entidades WHERE entidades.id = comunicaciones.entidad_id)');
    pgm.dropColumns('comunicaciones', ['entidad_id']);
    pgm.dropTable('entidades');
};
