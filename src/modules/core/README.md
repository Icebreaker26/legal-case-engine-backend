# Módulo Core / Catálogos Genéricos (core) 🗃️🛠️

Este módulo provee controladores y rutas genéricas para la gestión de catálogos y tablas maestras del sistema (como tipos de derechos, instancias judiciales, entidades o grupos).

## 🎯 Características Principales

- **Controlador Genérico:** Permite realizar operaciones CRUD básicas (listar, crear, actualizar, eliminar, recuperar) de forma genérica parametrizando el tipo de catálogo (`/:tipo`).
- **Borrado Lógico:** Soporte para listar elementos inactivos y recuperarlos.
- **Seguridad Centralizada:** Asegura que solo personal autorizado pueda modificar catálogos globales del sistema.

## ⚙️ Estructura del Módulo
```text
src/modules/core/
├── controllers/        # catalogoController.js (manejo de base de datos dinámico)
└── routes/             # catalogoRoutes.js (rutas dinámicas basadas en /:tipo)
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Permisos granulares:
  - `admin:READ`: Consultar elementos del catálogo.
  - `admin:WRITE`: Crear, actualizar y recuperar elementos.
  - `admin:DELETE`: Eliminar (borrado lógico o físico según la entidad).

## 📊 Endpoints Clave
- `GET /api/core/:tipo`: Listar elementos activos de un catálogo (ej: `/api/core/entidades`, `/api/core/grupos`).
- `POST /api/core/:tipo`: Crear un nuevo registro en el catálogo especificado.
- `PATCH /api/core/:tipo/:id`: Modificar un registro por ID.
- `PATCH /api/core/:tipo/:id/recuperar`: Restaurar un registro previamente inactivado.
