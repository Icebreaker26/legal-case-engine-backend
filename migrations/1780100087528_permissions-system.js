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
    // 1. Tabla de módulos
    pgm.createTable('modulos', {
        id: 'id',
        nombre: { type: 'varchar(50)', notNull: true, unique: true },
        descripcion: { type: 'text' }
    });

    // 2. Tabla de acciones
    pgm.createTable('acciones', {
        id: 'id',
        nombre: { type: 'varchar(20)', notNull: true, unique: true } // READ, WRITE, DELETE, etc.
    });

    // 3. Tabla de permisos (relación usuario-modulo-accion)
    pgm.createTable('permisos', {
        id: 'id',
        usuario_id: { type: 'integer', notNull: true, references: 'abogados(id)', onDelete: 'CASCADE' },
        modulo_id: { type: 'integer', notNull: true, references: 'modulos(id)', onDelete: 'CASCADE' },
        accion_id: { type: 'integer', notNull: true, references: 'acciones(id)', onDelete: 'CASCADE' }
    });

    // Datos iniciales
    pgm.sql("INSERT INTO modulos (nombre) VALUES ('tutelas'), ('admin'), ('auth')");
    pgm.sql("INSERT INTO acciones (nombre) VALUES ('READ'), ('WRITE'), ('DELETE')");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('permisos');
    pgm.dropTable('acciones');
    pgm.dropTable('modulos');
};
