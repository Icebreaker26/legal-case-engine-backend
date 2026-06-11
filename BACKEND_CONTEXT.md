# BACKEND_CONTEXT.md

Este archivo proporciona una visión general de la arquitectura del backend para facilitar la comprensión de agentes de IA.

## Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Base de Datos:** PostgreSQL
- **Documentación:** Swagger (disponible en /api-docs)

## Estructura Modular
El backend utiliza un cargador dinámico en `src/index.js` que escanea la carpeta `src/modules`.

Cada módulo en `src/modules/<nombre_modulo>/` se estructura así:
```
src/modules/<nombre_modulo>/
├── controllers/    # Controladores (manejan request/response)
├── routes/         # Rutas (definen los endpoints, deben terminar en 'Routes.js')
└── services/       # Lógica de negocio (opcional)
```

## Herramientas de Utilidad (Scripts)
El proyecto incluye scripts en la carpeta `scripts/` para automatizar tareas comunes:

- **Crear nuevos módulos:**
  Usa el script generador para crear la estructura base:
  `node scripts/generate-module.js <nombre_modulo>`
  Esto creará la estructura en `src/modules/<nombre_modulo>` incluyendo el archivo de rutas.

- **Interacción con DB:**
  Usa el helper para ejecutar consultas rápidas:
  `node scripts/db_helper.js "SELECT * FROM tabla WHERE campo = $1" '["valor"]'`

## Proceso: Crear un Nuevo Módulo
Para añadir un nuevo módulo al sistema, **preferiblemente usa el script**:
1. Ejecuta: `node scripts/generate-module.js <nombre_nuevo_modulo>`
2. Implementa tu lógica en `controllers/` y `services/`.
3. Define tus endpoints en `routes/<nombre_nuevo_modulo>Routes.js`.
4. Al reiniciar el servidor, `src/index.js` detectará automáticamente el nuevo módulo.

---
*Nota: Revisa `MODULAR_ARCHITECTURE.md` para detalles adicionales.*
