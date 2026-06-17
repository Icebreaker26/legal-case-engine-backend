export async function up(pgm) {
    await pgm.sql(`
        -- Eliminar tablas obsoletas ahora que la migración a global_* es completa
        DROP TABLE IF EXISTS abogados CASCADE;
        DROP TABLE IF EXISTS areas CASCADE;
        DROP TABLE IF EXISTS entidades CASCADE;
        DROP TABLE IF EXISTS grupos CASCADE;
        -- 'categorias_juridicas' parece también haber sido reemplazada por 'global_categorias'
        DROP TABLE IF EXISTS categorias_juridicas CASCADE;
        -- 'proyectos' y 'contratos' fueron reemplazados por 'global_proyectos' y 'global_contratos'
        DROP TABLE IF EXISTS proyectos CASCADE;
        DROP TABLE IF EXISTS contratos CASCADE;
    `);
}

export async function down(pgm) {
    // Rollback is complex here, but usually not needed for cleanup migrations.
}
