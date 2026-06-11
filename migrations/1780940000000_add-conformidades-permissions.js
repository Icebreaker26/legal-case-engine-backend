export async function up(pgm) {
    // Registrar nuevo módulo y acciones si es necesario
    await pgm.sql(`
        INSERT INTO modulos (nombre) VALUES ('conformidades') 
        ON CONFLICT (nombre) DO NOTHING;
    `);

    // Asumiendo que READ y WRITE ya existen en la tabla 'acciones'
    // Se podrían asignar permisos base a administradores si fuera necesario, 
    // pero usualmente esto se hace vía interfaz o script de seed.
}

export async function down(pgm) {
    await pgm.sql(`
        DELETE FROM modulos WHERE nombre = 'conformidades';
    `);
}
