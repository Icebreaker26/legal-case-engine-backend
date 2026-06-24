```
╔══════════════════════════════════════════════════════════════════╗
║              CORE OPERATING SYSTEM — BACKEND ENGINE             ║
║                     ICEBREAKER // BUILD 2026                    ║
╚══════════════════════════════════════════════════════════════════╝
```

[![Quality Assurance](https://github.com/Icebreaker26/legal-case-engine-backend/actions/workflows/quality-assurance.yml/badge.svg?branch=main)](https://github.com/Icebreaker26/legal-case-engine-backend/actions/workflows/quality-assurance.yml)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express-ESM-000000?style=flat-square&logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-slate?style=flat-square)

---

## `> DESCRIPCIÓN`

API REST del **Core Operating System** — plataforma transversal de gestión operativa desarrollada para Enel Colombia. Centraliza procesos legales, ambientales, contractuales y administrativos bajo una sola arquitectura modular, con trazabilidad completa y permisos granulares por usuario.

> Desarrollado por **Alejandro M. Torres** — Ingeniero de Sistemas y Telecomunicaciones  
> Universidad Católica de Pereira · Internship Permitting & Detailed Design HV · Enel Colombia 2026-1

---

## `> STACK TECNOLÓGICO`

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20.x (ESM `import/export`) |
| Framework | Express.js |
| Base de datos | PostgreSQL 15 + `pgvector` |
| Autenticación | JWT en cookies HttpOnly |
| Validación | Zod (schemas por módulo) |
| Migraciones | `node-pg-migrate` |
| Logging | Winston |
| Tests | Jest + Supertest (integración) |

---

## `> MÓDULOS OPERATIVOS`

```
/api/tutelas          ⚖️  Derechos de petición — RAG con pgvector, borradores Word
/api/contratos        📄  Auditoría contractual — diff de minutas, análisis LLM
/api/comunicaciones   ✉️  Correspondencia externa — entrada/salida, trazabilidad
/api/conformidades    📋  Trazabilidad operativa — historial de estados
/api/pagos            💰  Pagos judiciales — flujo de aprobación, KPIs financieros
/api/rendimiento      📊  Objetivos por equipo — cumplimiento y dashboards
/api/ambiental        🌿  Derecho ambiental — Ley 99/93, alertas, calendario
/api/reportes         📈  Reportería cross-módulo — queries paralelas, exportación
/api/core             🗃️  Catálogos genéricos — entidades, grupos, contratos
/api/auth             🔑  Autenticación — login, registro, JWT
/api/admin            ⚙️  Usuarios, roles, auditoría
/api/permisos         🔐  Control de acceso granular por módulo y acción
/api/notificaciones   🔔  Bandeja de alertas del sistema
```

---

## `> ARQUITECTURA`

```
tutelas_backend/
├── src/
│   ├── modules/          ← Un directorio por módulo
│   │   └── <nombre>/
│   │       ├── controllers/
│   │       ├── routes/<nombre>Routes.js   ← Loader dinámico
│   │       ├── schemas/                   ← Validación Zod
│   │       └── services/
│   ├── middlewares/
│   │   ├── auth.js               ← Verificación JWT
│   │   ├── checkPermission.js    ← ACL granular
│   │   └── errorHandler.js       ← Manejo centralizado
│   ├── services/
│   │   ├── notificationService.js  ← Compartido entre módulos
│   │   └── pdfService.js           ← Extracción PDF/DOCX
│   └── config/env.js               ← Schema Zod de variables de entorno
├── migrations/           ← node-pg-migrate (.cjs / .js)
└── tests/
    └── integration/      ← Jest + Supertest por módulo
```

**Loader dinámico:** `src/index.js` escanea `src/modules/*/routes/*Routes.js` y monta cada módulo en `/api/<nombre>` automáticamente.

---

## `> SEGURIDAD`

- Todos los endpoints requieren JWT válido en cookie HttpOnly
- Permisos granulares: `checkPermission('<modulo>', 'READ|WRITE|DELETE')`
- PKs en UUID (`uuid_generate_v4()`), borrado lógico con `is_active = false`
- **Restricción LLM:** el backend no se conecta a APIs de IA — genera prompts estructurados para uso humano

---

## `> TESTS`

```bash
npm test                        # Suite completa (119+ tests de integración)
npm test -- --testPathPatterns=<modulo>   # Módulo específico
```

Cada módulo tiene su propio archivo en `tests/integration/` cubriendo: auth, validación Zod, operaciones CRUD y casos de borde.

---

## `> COMANDOS`

```bash
npm run dev              # Servidor de desarrollo (puerto 4000)
npm run migrate:up       # Ejecutar migraciones pendientes
npm run migrate:down     # Revertir última migración
npm run migrate:create -- nombre   # Crear migración
npm run generate:module nombre     # Scaffolding de nuevo módulo
```

---

## `> VARIABLES DE ENTORNO`

Definidas y validadas con Zod en `src/config/env.js`. Copiar `.env.example` y completar:

```
DATABASE_URL=
JWT_SECRET=
PORT=4000
NODE_ENV=development
```

---

```
// SECURE_ENTERPRISE_ENVIRONMENT // ENEL COLOMBIA // 2026
```
