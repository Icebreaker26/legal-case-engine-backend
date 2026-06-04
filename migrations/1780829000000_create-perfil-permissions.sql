-- Registrar el módulo 'perfil'
INSERT INTO modulos (nombre) 
VALUES ('perfil') 
ON CONFLICT (nombre) DO NOTHING;

-- Registrar la acción 'READ' para el módulo 'perfil'
INSERT INTO acciones (nombre) VALUES 
('READ')
ON CONFLICT (nombre) DO NOTHING;

-- Asignar este permiso al usuario admin (id=1)
INSERT INTO permisos (usuario_id, modulo_id, accion_id)
SELECT 1, m.id, a.id
FROM modulos m, acciones a
WHERE m.nombre = 'perfil'
AND a.nombre = 'READ'
ON CONFLICT (usuario_id, modulo_id, accion_id) DO NOTHING;
