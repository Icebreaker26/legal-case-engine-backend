# Módulo de Administración (admin) ⚙️👑

Este módulo gestiona la configuración global del sistema, catálogos auxiliares, el control de usuarios, la visualización del ROI y la auditoría de accesos.

## 🎯 Características Principales

- **Gestión de Usuarios:** Listado de usuarios, actualización de perfiles, asignación de roles (`/rol`) y reinicio de contraseñas (`/reset-password`).
- **Métricas Operativas:** Consulta de la carga de trabajo (`/carga-trabajo`), latencia operativa y configuración del ROI.
- **Configuración y Catálogos:** Gestión de áreas del negocio, categorías de tutelas y patrones de ruido (filtros de texto innecesario).
- **Auditoría:** Consulta de logs de auditoría general e individuales (`/logs`).

## ⚙️ Estructura del Módulo
```text
src/modules/admin/
└── routes/             # Enrutamiento de peticiones
```
*Nota: Este módulo utiliza controladores compartidos ubicados en `src/controllers/adminController.js` y `src/controllers/auditController.js`.*

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Permisos granulares:
  - `tutelas:READ` / `tutelas:WRITE`: Gestión de áreas, categorías y noise.
  - `admin:READ` / `admin:WRITE`: Modificación de configuración, ROI, usuarios, logs y asignación de roles.

## 📊 Endpoints Clave
- `GET /api/admin/usuarios`: Obtener lista de usuarios.
- `POST /api/admin/usuarios/:id/reset-password`: Forzar cambio de clave.
- `GET /api/admin/logs`: Consultar logs de auditoría del sistema.
- `GET /api/admin/roi`: Obtener configuración del retorno de inversión.
- `GET /api/admin/areas`: Listar las áreas registradas.
