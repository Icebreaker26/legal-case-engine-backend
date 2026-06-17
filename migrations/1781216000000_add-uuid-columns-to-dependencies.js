export async function up(pgm) {
    // Definimos las tablas y columnas que referencian a 'abogados'
    const dependencies = [
        { table: 'tutelas', column: 'responsable_id' },
        { table: 'pago_trazabilidad', column: 'usuario_id' },
        { table: 'objetivos', column: 'usuario_id' },
        { table: 'tutela_responsables', column: 'abogado_id' }
    ];

    for (const dep of dependencies) {
        // 1. Agregar columna temporal UUID
        await pgm.addColumn(dep.table, {
            [`${dep.column.replace('_id', '')}_uuid`]: { type: 'uuid', references: 'global_usuarios(id)' }
        });

        // 2. Mapear datos
        await pgm.sql(`
            UPDATE ${dep.table} t
            SET ${dep.column.replace('_id', '')}_uuid = m.new_uuid
            FROM id_mapping m
            WHERE t.${dep.column} = m.old_id;
        `);
    }

    // Refactor especial para historial_acciones
    await pgm.sql(`
        -- Agregar columna UUID
        ALTER TABLE historial_acciones ADD COLUMN responsable_uuid UUID REFERENCES global_usuarios(id);
        
        -- Migrar: Buscamos el UUID basado en el nombre (asumiendo que nombre es único o suficiente para mapear)
        UPDATE historial_acciones h
        SET responsable_uuid = gu.id
        FROM global_usuarios gu
        WHERE h.responsable_nombre = gu.nombre;

        -- Eliminar columna vieja
        ALTER TABLE historial_acciones DROP COLUMN responsable_nombre;
    `);
}

export async function down(pgm) {
    // Rollback logic
}
