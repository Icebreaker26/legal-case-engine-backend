export async function up(pgm) {
    await pgm.sql(`
        -- 1. Arreglar 'conformidades': Re-apuntar FKs a tablas globales
        -- Primero eliminamos las restricciones viejas (o huérfanas tras el DROP TABLE CASCADE)
        ALTER TABLE conformidades DROP CONSTRAINT IF EXISTS conformidades_entidad_id_fkey;
        ALTER TABLE conformidades DROP CONSTRAINT IF EXISTS conformidades_proyecto_id_fkey;
        ALTER TABLE conformidades DROP CONSTRAINT IF EXISTS conformidades_contrato_id_fkey;

        -- Añadimos las nuevas restricciones apuntando a global_*
        ALTER TABLE conformidades 
            ADD CONSTRAINT conformidades_entidad_id_fkey FOREIGN KEY (entidad_id) REFERENCES global_entidades(id) ON DELETE SET NULL,
            ADD CONSTRAINT conformidades_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES global_proyectos(id) ON DELETE SET NULL,
            ADD CONSTRAINT conformidades_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES global_contratos(id) ON DELETE SET NULL;

        -- 2. Arreglar 'conformidad_grupos'
        ALTER TABLE conformidad_grupos DROP CONSTRAINT IF EXISTS conformidad_grupos_grupo_id_fkey;
        ALTER TABLE conformidad_grupos 
            ADD CONSTRAINT conformidad_grupos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES global_grupos(id) ON DELETE CASCADE;

        -- 3. Arreglar 'comunicaciones'
        ALTER TABLE comunicaciones DROP CONSTRAINT IF EXISTS comunicaciones_entidad_id_fkey;
        ALTER TABLE comunicaciones 
            ADD CONSTRAINT comunicaciones_entidad_id_fkey FOREIGN KEY (entidad_id) REFERENCES global_entidades(id) ON DELETE SET NULL;
    `);
}

export async function down(pgm) {
    // No se implementa revertir a tablas obsoletas ya eliminadas
}
