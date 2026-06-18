exports.up = async (pgm) => {
  // 1. Añadir la columna grupo_id
  pgm.addColumn('requerimientos_internos', {
    grupo_id: { type: 'integer', references: 'global_grupos(id)', onDelete: 'CASCADE' }
  });

  // 2. Migrar datos existentes (mapear nombre a ID)
  // Nota: Esto asume que los nombres en area_destino coinciden con global_grupos.nombre
  pgm.sql(`
    UPDATE requerimientos_internos 
    SET grupo_id = (SELECT id FROM global_grupos WHERE global_grupos.nombre = requerimientos_internos.area_destino)
    WHERE area_destino IS NOT NULL;
  `);

  // 3. (Opcional) Hacer grupo_id NOT NULL después de la migración si es necesario
  // pgm.alterColumn('requerimientos_internos', 'grupo_id', { notNull: true });

  // 4. Eliminar columna antigua (o renombrar si prefieres mantener el dato)
  pgm.dropColumn('requerimientos_internos', 'area_destino');
};

exports.down = async (pgm) => {
  pgm.addColumn('requerimientos_internos', {
    area_destino: { type: 'varchar(100)' }
  });
  
  pgm.sql(`
    UPDATE requerimientos_internos 
    SET area_destino = (SELECT nombre FROM global_grupos WHERE global_grupos.id = requerimientos_internos.grupo_id)
    WHERE grupo_id IS NOT NULL;
  `);

  pgm.dropColumn('requerimientos_internos', 'grupo_id');
};
