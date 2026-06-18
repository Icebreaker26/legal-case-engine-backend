# Directorio de Módulos del Backend 📁⚖️

Este documento provee un mapa completo de los módulos que componen la API REST del backend de **Tutelas**, detallando su propósito general y sus dependencias.

---

## 🧩 Carga Dinámica de Módulos
El backend implementa un cargador dinámico en `src/index.js`. Cualquier carpeta en `src/modules` que exponga un router en `routes/<nombre>Routes.js` es cargada y registrada bajo el prefijo de ruta `/api/<nombre>`.

---

## 📂 Directorio de Módulos

| Módulo | Ruta Base | Propósito Principal | Documentación Detallada |
| :--- | :--- | :--- | :--- |
| **admin** | `/api/admin` | Configuración global, catálogo de áreas/categorías, ROI, auditoría y administración de usuarios. | [Ver README](../src/modules/admin/README.md) |
| **auth** | `/api/auth` | Login, registro, logout y cambio de contraseñas con tokens JWT. | [Ver README](../src/modules/auth/README.md) |
| **comunicaciones** | `/api/comunicaciones` | Gestión de comunicaciones recibidas, comentarios, asignación de grupos y trazabilidad. | [Ver README](../src/modules/comunicaciones/README.md) |
| **conformidades** | `/api/conformidades` | Seguimiento de conformidades, proyectos, contratos, estados e integraciones. | [Ver README](../src/modules/conformidades/README.md) |
| **core** | `/api/core` | Catálogos y maestros del sistema reutilizados por múltiples módulos. | [Ver README](../src/modules/core/README.md) |
| **notificaciones** | `/api/notificaciones` | Alertas del sistema y notificaciones push/lectura para el usuario. | [Ver README](../src/modules/notificaciones/README.md) |
| **pagos** | `/api/pagos` | Gestión e histórico de trazabilidad de pagos relacionados a procesos legales. | [Ver README](../src/modules/pagos/README.md) |
| **permisos** | `/api/permisos` | Control de acceso basado en permisos granulares por usuario y módulo. | [Ver README](../src/modules/permisos/README.md) |
| **rendimiento** | `/api/rendimiento` | Seguimiento de objetivos individuales y grupales para abogados (KPIs). | [Ver README](../src/modules/rendimiento/README.md) |
| **tutelas** | `/api/tutelas` | Gestión del ciclo de vida de tutelas, borradores, RAG local y contestaciones. | [Ver README](../src/modules/tutelas/README.md) |

---

## 🔒 Permisos y Seguridad
La mayoría de los módulos utilizan middlewares compartidos para verificar sesión (`authenticateToken`) y permisos granulares (`checkPermission('<modulo>', '<accion>')`). Consulta la documentación específica de cada módulo para conocer las acciones disponibles.
