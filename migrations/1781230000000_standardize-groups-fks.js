export async function up(pgm) {
    // 1. Estandarizar 'comunicacion_grupos'
    await pgm.sql(`DELETE FROM comunicacion_grupos WHERE grupo_id NOT IN (SELECT id FROM global_grupos);`);
    await pgm.sql(`ALTER TABLE comunicacion_grupos DROP CONSTRAINT IF EXISTS comunicacion_grupos_grupo_id_fkey;`);
    await pgm.sql(`ALTER TABLE comunicacion_grupos ADD CONSTRAINT comunicacion_grupos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES global_grupos(id) ON DELETE CASCADE;`);

    // 2. Estandarizar 'conformidad_grupos'
    await pgm.sql(`DELETE FROM conformidad_grupos WHERE grupo_id NOT IN (SELECT id FROM global_grupos);`);
    await pgm.sql(`ALTER TABLE conformidad_grupos DROP CONSTRAINT IF EXISTS conformidad_grupos_grupo_id_fkey;`);
    await pgm.sql(`ALTER TABLE conformidad_grupos ADD CONSTRAINT conformidad_grupos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES global_grupos(id) ON DELETE CASCADE;`);

    // 3. Estandarizar 'pago_grupos'
    await pgm.sql(`DELETE FROM pago_grupos WHERE grupo_id NOT IN (SELECT id FROM global_grupos);`);
    await pgm.sql(`ALTER TABLE pago_grupos DROP CONSTRAINT IF EXISTS pago_grupos_grupo_id_fkey;`);
    await pgm.sql(`ALTER TABLE pago_grupos ADD CONSTRAINT pago_grupos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES global_grupos(id) ON DELETE CASCADE;`);

    // 4. Estandarizar 'tutela_grupos'
    await pgm.sql(`
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutela_grupos') THEN
                DELETE FROM tutela_grupos WHERE grupo_id NOT IN (SELECT id FROM global_grupos);
                ALTER TABLE tutela_grupos DROP CONSTRAINT IF EXISTS tutela_grupos_grupo_id_fkey;
                ALTER TABLE tutela_grupos ADD CONSTRAINT tutela_grupos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES global_grupos(id) ON DELETE CASCADE;
            END IF;
        END $$;
    `);
}

export async function down(pgm) {
    // El rollback no es seguro ya que las tablas originales a las que apuntaban estas FKs 
    // han sido eliminadas previamente.
}
