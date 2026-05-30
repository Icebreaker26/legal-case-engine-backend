# Mejoras de Infraestructura del Backend

Este documento resume las mejoras técnicas implementadas para optimizar la experiencia de desarrollo (DX) y la robustez del sistema.

## 1. Documentación API (Swagger/OpenAPI)
Se ha integrado **Swagger UI** para la documentación automática de la API.
- **Acceso:** `http://localhost:4000/api-docs`
- **Funcionamiento:** Escanea automáticamente los archivos `*Routes.js` en `src/modules/*/routes/` buscando comentarios JSDoc.
- **Nota:** Para que una ruta aparezca, debe incluir el bloque `/** @swagger ... */` correspondiente antes de su definición.

## 2. Generador de Módulos (Scaffolding)
Para mantener la estructura modular uniforme, se ha añadido un script generador de módulos.
- **Comando:** `npm run generate:module <nombre_del_modulo>`
- **Acción:** Crea automáticamente el árbol de directorios (`controllers`, `routes`, `services`, `schemas`) y un archivo de rutas base.

## 3. Middleware de Error Global
Se ha centralizado la gestión de errores para mejorar la estabilidad del servidor.
- **Ubicación:** `src/middlewares/errorHandler.js`
- **Funcionamiento:** Captura errores no controlados, proporcionando una respuesta JSON estandarizada y evitando la filtración de detalles internos del servidor.
- **Integración:** Registrado globalmente en `src/index.js` como el último middleware.
