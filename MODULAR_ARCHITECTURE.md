# Arquitectura Modular del Backend

Este backend ha sido refactorizado desde una estructura monolítica a una arquitectura modular para mejorar la mantenibilidad y escalabilidad.

## Estructura de Módulos
Cada módulo se encuentra en `src/modules/<nombre_modulo>/` y debe seguir esta estructura:

- `controllers/`: Lógica de control.
- `routes/`: Definición de rutas, exportando un `Router` de Express.
- `services/`: (Opcional) Lógica de negocio específica del módulo.

## Carga Dinámica
El servidor (`src/index.js`) escanea automáticamente el directorio `src/modules` al iniciar. Para que un módulo sea cargado:
1. Debe existir en `src/modules/`.
2. Debe tener un archivo de rutas en `src/modules/<nombre>/routes/<nombre>Routes.js`.

El cargador registrará automáticamente las rutas bajo `/api/<nombre>`.
