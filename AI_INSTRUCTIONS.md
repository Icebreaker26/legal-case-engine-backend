# AI Development Instructions & Repository Context ⚖️🤖

Welcome, AI Agent! This file contains critical architectural rules, standards, and guidelines for working on the **Legal Case Engine Backend**. Please read this file carefully before making changes.

---

## 🏛️ 1. Technical Stack & Key Architecture

*   **Runtime:** Node.js (ESM / EcmaScript Modules). Always use `import` / `export`, do not use CommonJS (`require`).
*   **Framework:** Express.
*   **Database:** PostgreSQL (using `pg` driver and `pgvector` for RAG/semantic searches).
*   **Schema & Input Validation:** **Zod** (`zod`). All input requests (body, query, params) must be validated before processing.
*   **Security:** `Helmet` is active. API key validations and authentication are handled via JWT.
*   **Logging:** Structured logging using `Winston` (JSON format). Do not use `console.log` for production code. Use the custom logger.

---

## 🧩 2. Modular Architecture (Crucial Rule)

The project uses a **dynamic module loading** system. Instead of registering routes manually in `src/index.js`, modules are loaded dynamically.

### Structure of `src/modules/`
Each module must reside in `src/modules/<module_name>/` and typically contains:
*   `controllers/`: Request handlers and business logic.
*   `routes/`: Route definitions exporting an Express `Router` default or named export.
*   `schemas/`: Zod schemas for input validation.
*   `services/`: (Optional) External services, databases, or logic.

### Dynamic Loading Convention:
For a module to be registered:
1.  It must be located under `src/modules/<module_name>`.
2.  It **must** have a router file named exactly `src/modules/<module_name>/routes/<module_name>Routes.js`.
3.  The loader in `src/index.js` automatically scans and registers this module's router under the prefix `/api/<module_name>`.

*Example:* `src/modules/auth/routes/authRoutes.js` is mapped to `/api/auth`.

---

## 🔒 3. Security & Validation Best Practices

1.  **Fail-Fast Config:** Environment variables are validated on startup using a Zod schema in `src/config/env.js`. If you add a new env variable, you must update the Zod schema there.
2.  **Input Sanitation:** Never trust user input. Always apply a Zod schema in middleware before the controller receives it.
3.  **Logical Deletes:** For entities like teams (`equipos`) and cases (`tutelas`), prefer logical deletion (e.g., updating an `is_active` flag to `false` or updating status to `eliminada`/`papelera`) over physical `DELETE` queries to preserve traceability and audit trails.

---

## 🛡️ 4. Common Pitfalls & Route Ordering

*   **Express Route Collisions:** When defining routes with dynamic parameters (e.g., `/:id`), place more specific static routes first.
    *   *Bad:* `/api/rendimiento/:id` before `/api/rendimiento/remover-usuario` (Express will match `remover-usuario` as the `:id` parameter).
    *   *Good:* Place `/api/rendimiento/remover-usuario` above `/api/rendimiento/:id`.
*   **Database Connections:** Always close clients or release pool connections in `finally` blocks to avoid connection leaks, especially when writing custom scripts or database migrations.
