# Guía para crear nuevos módulos

## Estructura obligatoria

```
src/modules/<nombre>/
  controllers/
    <nombre>Controller.js
  routes/
    <nombre>Routes.js        ← nombre exacto requerido por el loader dinámico
  schemas/
    <nombre>Schema.js
  services/                  ← solo si el módulo tiene lógica de negocio propia
    <nombre>Service.js
```

> El loader en `src/index.js` escanea `src/modules/*/routes/*Routes.js` automáticamente.
> Si el archivo de rutas no sigue la convención `<nombre>Routes.js`, el módulo NO se registra.

Crear la estructura base:
```bash
npm run generate:module <nombre>
```

---

## Infraestructura disponible — qué puedes importar

Estos son los recursos compartidos. **No copies ni dupliques, impórtalos directamente.**

### Base de datos
```js
import pool from '../../../db/database.js';
```

### Middlewares
```js
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission }   from '../../../middlewares/permissionMiddleware.js';
import { validate }          from '../../../middlewares/validateMiddleware.js';
import { errorHandler }      from '../../../middlewares/errorHandler.js';
```

### Servicios compartidos (usan tutelas y contratos — son de todos)
```js
import { extraerTextoPdf } from '../../../services/pdfService.js';
import { registrarLog }    from '../../../services/auditService.js';
```

### Logger
```js
import logger from '../../../utils/logger.js';
```

### Notificaciones (servicio transversal)
```js
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';
// crearNotificacion(usuario_uuid, mensaje, tipo, referencia_uuid, modulo)
```

### Catálogos globales (core)
Los catálogos maestros (grupos, entidades, proyectos, contratos, etc.) están en `/api/core/:tipo`.
No los consultes directo a BD desde tu módulo — usa el endpoint.

### Usuarios activos
```
GET /api/core/usuarios-activos
```

---

## Cómo funciona el loader dinámico

`src/index.js` registra los módulos automáticamente — **no hay que tocar `index.js` al crear un módulo nuevo.**

El algoritmo:
1. Lee todas las carpetas dentro de `src/modules/`
2. Por cada carpeta busca `routes/<algo>Routes.js`
3. Lo importa y lo monta en `/api/<nombreCarpeta>`

```
src/modules/pagos/routes/pagosRoutes.js  →  /api/pagos      ✅
src/modules/pagos/routes/routes.js       →  no se registra  ❌
src/modules/pagos/routes/pagos-routes.js →  no se registra  ❌
```

La URL la determina el **nombre de la carpeta del módulo**, no el archivo:
```
src/modules/gestion-documental/  →  /api/gestion-documental
src/modules/miModulo/            →  /api/miModulo
```

---

## Cómo funciona el logger (Winston)

### Niveles disponibles
```js
import logger from '../../../utils/logger.js';

logger.info('Operación completada');
logger.warn('Recurso próximo a expirar');
logger.error('Fallo en BD', { message: error.message, requestId: req.requestId });
```

### Dónde escribe
| Destino | Qué contiene |
|---|---|
| Consola | Todo (info + warn + error) |
| `logs/error.log` | Solo errores |
| `logs/combined.log` | Todo |

### Request ID — trazabilidad
Cada petición HTTP tiene un UUID único en `req.requestId` (asignado por `requestIdMiddleware`).
Inclúyelo siempre en los logs de error para poder rastrear una petición completa:

```js
logger.error('Error en miController:', {
  message: error.message,
  requestId: req.requestId   // ← traza la petición de punta a punta
});
```

### Redacción automática
Los campos `password`, `password_hash` y `token` se reemplazan por `***REDACTED***` automáticamente. Nunca se exponen en logs.

### Uso correcto en un controller
```js
import logger from '../../../utils/logger.js';

export const crear = async (req, res) => {
  try {
    // lógica...
  } catch (error) {
    logger.error('Error en crear:', { message: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Error interno.' });
  }
};
```

---

## Template mínimo de Routes

```js
import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission }   from '../../../middlewares/permissionMiddleware.js';
import { validate }          from '../../../middlewares/validateMiddleware.js';
import { miSchema }          from '../schemas/<nombre>Schema.js';
import { listar, crear }     from '../controllers/<nombre>Controller.js';

const router = Router();
router.use(authenticateToken);

router.get('/',    checkPermission('<nombre>', 'READ'),  listar);
router.post('/',   checkPermission('<nombre>', 'WRITE'), validate(miSchema), crear);

export default router;
```

---

## Validaciones con Zod

### Cómo funciona
El middleware `validate(schema)` intercepta el `req.body` antes de llegar al controller.
Si no pasa la validación, responde `400` con el detalle de errores — el controller nunca se ejecuta.

```js
// En la ruta:
router.post('/', checkPermission('modulo', 'WRITE'), validate(miSchema), crear);
//                                                    ↑ va entre el permiso y el controller
```

### Crear un schema
```js
// src/modules/<nombre>/schemas/<nombre>Schema.js
import { z } from 'zod';

export const miSchema = z.object({
  // String obligatorio con longitud mínima
  nombre: z.string().min(1, 'El nombre es obligatorio'),

  // String opcional
  descripcion: z.string().optional(),

  // Email
  email: z.string().email('Formato de email inválido'),

  // UUID
  usuario_uuid: z.string().uuid('UUID inválido'),

  // Número — preprocess convierte strings a número (útil con FormData)
  monto: z.preprocess((val) => Number(val), z.number().positive('Debe ser positivo')),

  // Enum
  estado: z.enum(['Pendiente', 'En Proceso', 'Respondida']),

  // Enum con default
  prioridad: z.enum(['Alta', 'Media', 'Baja']).default('Media'),

  // Fecha como string
  fecha: z.string().min(1, 'La fecha es obligatoria'),

  // Campo que acepta string vacío o es opcional
  link: z.string().optional().or(z.literal('')),

  // Booleano
  activo: z.boolean().optional(),
});
```

### Schema parcial para PATCH (todos los campos opcionales)
```js
export const miSchemaPatch = miSchema.partial();
// o solo algunos campos opcionales:
export const miSchemaPatch = miSchema.pick({ nombre: true, estado: true }).partial();
```

### Múltiples schemas en un archivo
```js
export const crearSchema  = z.object({ ... });
export const editarSchema = z.object({ ... });
// En la ruta:
router.post('/',    validate(crearSchema),  crear);
router.patch('/:id', validate(editarSchema), actualizar);
```

### Respuesta de error automática
Cuando falla la validación el cliente recibe:
```json
{
  "error": [
    { "code": "too_small", "path": ["nombre"], "message": "El nombre es obligatorio" },
    { "code": "invalid_type", "path": ["monto"], "message": "Expected number, received string" }
  ]
}
```

---

## Template mínimo de Controller

```js
import pool from '../../../db/database.js';
import { registrarLog } from '../../../services/auditService.js';

export const listar = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM <tabla> WHERE is_active = TRUE`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar.' });
  }
};

export const crear = async (req, res) => {
  try {
    const { campo } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO <tabla> (campo) VALUES ($1) RETURNING *`,
      [campo]
    );
    await registrarLog(req.user.id, 'CREAR_<NOMBRE>', '<tabla>', rows[0].id, req, {});
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear.' });
  }
};
```

---

## Permisos

### 1. Registrar el módulo en la tabla `modulos` (migración)
```sql
INSERT INTO modulos (nombre) VALUES ('<nombre>');
```

### 2. Usar `checkPermission` en todas las rutas
```js
checkPermission('<nombre>', 'READ')    // lectura
checkPermission('<nombre>', 'WRITE')   // creación y edición
checkPermission('<nombre>', 'DELETE')  // eliminación
```

### 3. Los permisos los asigna el admin desde la UI
`POST /api/permisos/asignar-masivo` — no hay permisos automáticos al crear el módulo.

---

## Reglas de diseño

| Regla | Detalle |
|---|---|
| PKs | UUID con `uuid_generate_v4()` — nunca integer |
| Borrado | Lógico con `is_active = false` — nunca `DELETE` físico |
| Migraciones | En `migrations/` con prefijo timestamp |
| Variables de entorno | Nuevas variables → actualizar schema Zod en `src/config/env.js` |
| LLM | El backend NO se conecta a APIs de LLM — ver `memory/project_seguridad.md` |
| Logs | Usar `winston` vía `logger` — no `console.log` en producción |
| Errores | El `errorHandler` central los captura — no abusar de try/catch inline |

---

## Lo que NO debes hacer

- ❌ Importar desde otro módulo (`../../otroModulo/`) — los módulos son independientes
- ❌ Duplicar `pdfService`, `auditService` o `notificationService` — impórtalos
- ❌ Poner controllers o schemas fuera de la carpeta del módulo
- ❌ Usar `DELETE` físico en tablas de negocio
- ❌ Conectarte a una API de LLM directamente
- ❌ Usar `console.log` — usa `logger`

---

## Checklist al crear un módulo

- [ ] `npm run generate:module <nombre>` ejecutado
- [ ] Controller creado con manejo de errores
- [ ] Schema Zod creado y aplicado con `validate()`
- [ ] Rutas registradas con `checkPermission`
- [ ] Migración creada con la tabla y `INSERT INTO modulos`
- [ ] Permisos asignados desde la UI de admin
- [ ] Módulo registrado en `App.jsx` con `<ProtectedRoute>`
- [ ] Tests de integración en `tests/integration/<nombre>.test.js`
