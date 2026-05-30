# Módulo de Rendimiento (Tracking de Objetivos)

Este módulo permite a los líderes de equipo realizar un seguimiento preciso del cumplimiento de objetivos de sus ingenieros, basado en acciones registradas y metas cuantificables.

## 🎯 Características Principales

- **Seguimiento en tiempo real:** Registro atómico de acciones realizadas (`registro_acciones`) con soporte para ponderación (`peso`).
- **Gestión de Objetivos:** CRUD completo para definir metas (`objetivos`) con periodos de tiempo definidos.
- **Jerarquía de Equipos:** Gestión de `equipos` y asignación de `manager` para estructurar la visibilidad.
- **Cálculo de Cumplimiento:** Consultas agregadas en tiempo real que calculan el % de cumplimiento individual y por equipo.
- **Ciclo de Vida:** Funcionalidad para archivar objetivos terminados.

## ⚙️ Estructura del Módulo
```text
src/modules/rendimiento/
├── controllers/        # Lógica de cálculo y CRUD
├── routes/             # Endpoints (con JSDoc para Swagger)
├── schemas/            # Validación de datos con Zod
└── services/           # Lógica de negocio (opcional)
```

## 🔐 Seguridad y Permisos
Este módulo integra el sistema de permisos granulares:
- `WRITE` en `rendimiento`: Requerido para crear/actualizar objetivos y registrar acciones.
- `READ` en `rendimiento`: Requerido para ver estadísticas.
- `MANAGE_TEAMS` en `rendimiento`: Requerido para gestionar equipos y objetivos de otros usuarios.
- `READ_ALL` en `rendimiento`: Permite a un Manager ver las estadísticas de todo su equipo (en lugar de solo las propias).

## 📊 Endpoints Clave
- `POST /api/rendimiento/acciones`: Registrar acción (con peso).
- `GET /api/rendimiento/cumplimiento/individual/:usuario_id`: Obtener progreso personal.
- `GET /api/rendimiento/cumplimiento/equipo/:equipo_id`: Estadísticas consolidadas del equipo.
- `PATCH /api/rendimiento/objetivos/:id/archivar`: Ciclo de vida del objetivo.
