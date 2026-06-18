# Módulo de Gestión de Pagos (pagos) 💰💵

Este módulo gestiona la radicación, control de estados y trazabilidad de los pagos derivados de las acciones de tutela, incidentes de desacato u otras contingencias legales.

## 🎯 Características Principales

- **Registro de Pagos:** Creación de registros de pago asociados a expedientes legales con validación vía Zod.
- **Flujo de Aprobación/Estados:** Cambio dinámico del estado del pago (`/:id/estado`) registrando un log de trazabilidad detallado.
- **Asignación de Responsabilidad:** Asignación de grupos encargados de la tramitación de pagos.
- **KPIs y Métricas:** Estadísticas y consolidados del monto y estado de los pagos pendientes y ejecutados.

## ⚙️ Estructura del Módulo
```text
src/modules/pagos/
├── controllers/        # pagosController.js (cálculos de montos e históricos)
├── routes/             # pagosRoutes.js
└── schemas/            # pagoSchema.js (validaciones Zod)
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Permisos granulares:
  - `pagos:READ_PAGO`: Acceso a listados, estadísticas, estados y trazabilidad de pagos.
  - `pagos:WRITE_PAGO`: Registro de nuevos pagos, actualización de estados, recuperación de registros y asignación de grupos de pago.

## 📊 Endpoints Clave
- `POST /api/pagos`: Crear un nuevo registro de pago.
- `PATCH /api/pagos/:id/estado`: Actualizar el estado del pago (ej: Radicado, Aprobado, Pagado) con registro en la trazabilidad.
- `GET /api/pagos/stats`: Consultar acumulados financieros y métricas operativas de pagos.
- `GET /api/pagos/:id/trazabilidad`: Ver la línea de tiempo de cambios de estado del pago.
