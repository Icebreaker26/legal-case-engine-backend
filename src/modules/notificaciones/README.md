# Módulo de Notificaciones (notificaciones) 🔔💬

Este módulo gestiona el envío, listado y estado de las alertas y notificaciones dirigidas a los usuarios del sistema.

## 🎯 Características Principales

- **Bandeja de Notificaciones:** Obtener y listar todas las notificaciones pendientes y pasadas del usuario autenticado.
- **Lectura Dinámica:** Cambiar el estado de notificaciones individuales a "leída" (`/:id/leida`).
- **Servicio Compartido:** Expone `notificationService.js` para que otros módulos del backend (como tutelas o rendimiento) generen notificaciones en base a eventos de negocio.

## ⚙️ Estructura del Módulo
```text
src/modules/notificaciones/
├── controllers/        # notificacionesController.js
├── routes/             # notificacionesRoutes.js
└── services/           # notificationService.js (generador reutilizable)
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`). El usuario solo puede consultar y marcar como leídas sus propias notificaciones.

## 📊 Endpoints Clave
- `GET /api/notificaciones`: Listar notificaciones del usuario logueado.
- `PATCH /api/notificaciones/:id/leida`: Marcar una notificación específica como leída.
