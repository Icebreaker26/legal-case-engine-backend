# Estándares de Desarrollo del Backend

Este documento define el estándar para la creación de nuevos módulos en el sistema. Seguir estas convenciones es obligatorio para mantener la consistencia y escalabilidad de la arquitectura.

## 1. Estructura de Directorios
Todo nuevo módulo debe crearse bajo `src/modules/<nombre_del_modulo>/` con la siguiente estructura obligatoria:

```text
src/modules/nombre_del_modulo/
├── controllers/    # Lógica de controlador (procesa req/res)
├── routes/         # Definición de endpoints
├── services/       # Lógica de negocio (opcional)
└── schemas/        # Validaciones con Zod (opcional)
```

## 2. Convenciones de Nombramiento
*   **Archivo de Rutas:** Debe nombrarse `nombreRoutes.js` (ej: `usuariosRoutes.js` para el módulo `usuarios`).
*   **Exportación:** El archivo de rutas debe exportar un router de Express por defecto: `export default router;`.

## 3. Registro Automático
El sistema utiliza un cargador dinámico en `src/index.js`. Para que un módulo sea registrado:
1.  Debe existir un directorio en `src/modules/`.
2.  Debe contener un archivo dentro de `routes/` que termine en `Routes.js`.
3.  El módulo será montado automáticamente bajo `/api/<nombre_del_modulo>`.

## 4. Autorización y Seguridad
*   Todos los módulos deben usar `authenticateToken` en sus rutas.
*   Para la validación de acceso, usar el middleware `checkPermission(modulo, accion)`.
*   Las acciones deben ser consistentemente `READ`, `WRITE` o `DELETE`.

---
*Para crear un nuevo módulo, utiliza el comando:*
`mkdir -p src/modules/<nombre>/{controllers,routes,services,schemas}`
