# Módulo de Autenticación (auth) 🔑🔒

Este módulo gestiona la sesión de los usuarios, incluyendo registro, autenticación de credenciales, control de cookies HttpOnly y cambios de contraseña.

## 🎯 Características Principales

- **Registro de Cuentas:** Registro controlado con validación declarativa vía Zod (`registerSchema`).
- **Autenticación (JWT):** Generación de tokens JWT seguros para verificar la identidad del usuario en cada petición.
- **Seguridad en Cierre de Sesión:** Mecanismo de logout que limpia los tokens del lado del cliente.
- **Cambio de Contraseña:** Flujo seguro para la actualización de contraseñas de usuarios autenticados.

## ⚙️ Estructura del Módulo
```text
src/modules/auth/
└── routes/             # Endpoints expuestos con documentación Swagger
```
*Nota: Este módulo interactúa con `src/controllers/authController.js` y el middleware de autenticación global.*

## 📊 Endpoints Clave
- `POST /api/auth/login`: Iniciar sesión y obtener token JWT.
- `POST /api/auth/register`: Registrar un nuevo usuario (las cuentas nuevas requieren posterior aprobación de un administrador).
- `POST /api/auth/logout`: Cerrar la sesión activa del usuario.
- `PATCH /api/auth/change-password`: Actualizar la contraseña del usuario logueado.
