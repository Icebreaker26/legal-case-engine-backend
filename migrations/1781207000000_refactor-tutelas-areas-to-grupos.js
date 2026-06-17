export async function up(pgm) {
    await pgm.sql(`
        -- 1. Añadir columna grupo_id (referencia a global_grupos)
        ALTER TABLE tutelas ADD COLUMN grupo_id INTEGER REFERENCES global_grupos(id);

        -- 2. Migrar datos existentes (opcional si hubiera datos de prueba con texto)
        -- UPDATE tutelas SET grupo_id = (SELECT id FROM global_grupos WHERE nombre = area_responsable) WHERE area_responsable IS NOT NULL;
        
        -- 3. Eliminar campo de texto antiguo
        ALTER TABLE tutelas DROP COLUMN area_responsable;
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE tutelas ADD COLUMN area_responsable VARCHAR(255);
        ALTER TABLE tutelas DROP COLUMN grupo_id;
    `);
}
