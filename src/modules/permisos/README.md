# Módulo de Permisos (permisos) 🔐🛡️

Este módulo se encarga del control de acceso basado en roles y la asignación granular de permisos a nivel de usuario en el sistema.

## 🎯 Características Principales

- **Gestión de Permisos Granulares:** Asignación de permisos individuales a usuarios para módulos específicos (ej: `READ`, `WRITE`, `DELETE` en tutelas, rendimiento, pagos, etc.).
- **Asignación Masiva:** Herramienta para asignar múltiples permisos a un usuario en una sola transacción (`/asignar-masivo`).
- **Revocación:** Eliminación de permisos específicos asignados a un usuario.
- **Auditoría de Acceso:** Facilita la consulta de la matriz de permisos de cualquier usuario activo en el sistema.

## ⚙️ Estructura del Módulo
```text
src/modules/permisos/
├── controllers/        # permisosController.js
└── routes/             # permisosRoutes.js
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Al tratarse de un módulo crítico de seguridad, la manipulación de permisos está protegida y suele requerir que el usuario solicitante cuente con rol administrador o permiso de escritura de administración (`admin:WRITE`).

## 📊 Endpoints Clave
- `GET /api/permisos/usuario/:usuario_uuid`: Listar todos los permisos activos asignados a un usuario específico.
- `POST /api/permisos/asignar`: Conceder un permiso granular.
- `POST /api/permisos/asignar-masivo`: Asignar un lote de permisos a un usuario.
- `DELETE /api/permisos/revocar`: Revocar un permiso previamente asignado.
