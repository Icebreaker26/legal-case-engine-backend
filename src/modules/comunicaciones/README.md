# Módulo de Comunicaciones (comunicaciones) ✉️💬

Este módulo permite gestionar las comunicaciones de entrada y salida relacionadas con requerimientos o trámites institucionales del negocio.

## 🎯 Características Principales

- **Gestión de Comunicaciones:** Creación, edición, borrado lógico (archivar/recuperar) y marcado de estado (respondida).
- **Asignación de Grupos:** Asignar y desasignar grupos de trabajo específicos a las comunicaciones.
- **Comentarios:** Agregar anotaciones y consultar hilos de comentarios para la colaboración en equipo.
- **Estadísticas:** Estadísticas operativas consolidadas sobre el estado de las comunicaciones.

## ⚙️ Estructura del Módulo
```text
src/modules/comunicaciones/
├── controllers/        # Controladores locales
├── routes/             # Enrutamiento de peticiones
└── schemas/            # Validación con Zod (comunicacionSchema, comentarioSchema)
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Permisos granulares:
  - `comunicaciones:READ_COM`: Consultar comunicaciones, estadísticas y comentarios.
  - `comunicaciones:WRITE_COM`: Crear, modificar, archivar y agregar comentarios.
  - `comunicaciones:DELETE_COM`: Eliminar de forma permanente.

## 📊 Endpoints Clave
- `POST /api/comunicaciones`: Crear una comunicación.
- `GET /api/comunicaciones/stats`: Obtener métricas generales.
- `PATCH /api/comunicaciones/:id/archivar`: Archivar comunicación.
- `POST /api/comunicaciones/:id/comentarios`: Añadir un comentario a la comunicación.
- `POST /api/comunicaciones/:id/grupos`: Asignar grupo de trabajo.
