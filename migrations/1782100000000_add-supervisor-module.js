export const shorthands = undefined;

// Crea el módulo 'supervisor' para gestión de catálogos operativos.
// Nivel intermedio entre usuario normal y admin: puede gestionar entidades,
// grupos, áreas, categorías, etc. pero NO usuarios ni permisos.
export const up = (pgm) => {
  pgm.sql(`INSERT INTO modulos (nombre) VALUES ('supervisor') ON CONFLICT (nombre) DO NOTHING;`);
};

export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM permisos WHERE modulo_id = (SELECT id FROM modulos WHERE nombre = 'supervisor');
    DELETE FROM modulos WHERE nombre = 'supervisor';
  `);
};
