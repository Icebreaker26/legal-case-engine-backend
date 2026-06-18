# Módulo de Conformidades (conformidades) 📋🤝

Este módulo gestiona la trazabilidad de conformidades operativas y contractuales del negocio, asociadas a proyectos, contratos y entidades externas.

## 🎯 Características Principales

- **Gestión de Conformidades:** Seguimiento de estados y actualización detallada de trazabilidad (`/:id/estado`).
- **Gestión de Catálogos Relacionados:** CRUDs completos para gestionar proyectos, contratos, estados de conformidad y entidades asociadas.
- **Trazabilidad Histórica:** Historial secuencial de cambios y comentarios sobre cada conformidad.
- **Asignación de Grupos:** Lógica para asignar y desasignar grupos de trabajo responsables de resolver las conformidades.

## ⚙️ Estructura del Módulo
```text
src/modules/conformidades/
├── controllers/        # Lógica de estados, proyectos y contratos
├── routes/             # Endpoints
└── schemas/            # Validación con Zod (conformidadSchema, conformidadTrazabilidadSchema)
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Permisos granulares:
  - `conformidades:READ`: Consultar conformidades, proyectos, contratos, estados e históricos.
  - `conformidades:WRITE`: Crear, modificar, recuperar y asignar grupos a las conformidades.

## 📊 Endpoints Clave
- `POST /api/conformidades`: Crear una nueva conformidad.
- `PATCH /api/conformidades/:id/estado`: Actualizar estado de una conformidad registrando trazabilidad.
- `GET /api/conformidades/:id/trazabilidad`: Obtener historial de auditoría de la conformidad.
- `GET /api/conformidades/proyectos`: Listar los proyectos activos.
- `GET /api/conformidades/contratos`: Listar los contratos registrados.
