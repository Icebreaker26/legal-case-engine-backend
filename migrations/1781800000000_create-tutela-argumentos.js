export async function up(pgm) {
    pgm.createTable('tutela_argumentos', {
        id: { type: 'serial', primaryKey: true },
        tutela_id: { type: 'uuid', references: 'tutelas(id)', onDelete: 'cascade', notNull: true },
        titulo: { type: 'varchar(100)', notNull: true },
        contenido: { type: 'text', notNull: true },
        creado_por: { type: 'uuid', references: 'global_usuarios(id)', notNull: true },
        created_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') }
    });
}

export async function down(pgm) {
    pgm.dropTable('tutela_argumentos');
}