export async function up(pgm) {
    // 1. Añadir columna temporal para el nuevo UUID en objetivos
    await pgm.sql('ALTER TABLE objetivos ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid()');
    
    // 2. Actualizar las referencias en registro_acciones (si existieran datos)
    // Como las tablas están vacías, podemos hacer esto de forma directa sin preocuparnos por datos existentes.
    await pgm.sql('ALTER TABLE registro_acciones ADD COLUMN objetivo_uuid UUID');

    // 3. Eliminar columnas antiguas y renombrar las nuevas
    await pgm.sql('ALTER TABLE registro_acciones DROP COLUMN objetivo_id');
    await pgm.sql('ALTER TABLE objetivos DROP COLUMN id');
    
    await pgm.sql('ALTER TABLE objetivos RENAME COLUMN id_uuid TO id');
    await pgm.sql('ALTER TABLE objetivos ADD PRIMARY KEY (id)');
    
    await pgm.sql('ALTER TABLE registro_acciones RENAME COLUMN objetivo_uuid TO objetivo_id');
    await pgm.sql('ALTER TABLE registro_acciones ADD CONSTRAINT fk_objetivo FOREIGN KEY (objetivo_id) REFERENCES objetivos(id)');
}

export async function down(pgm) {
    // Revertir a INTEGER si fuera necesario (no recomendado)
}
