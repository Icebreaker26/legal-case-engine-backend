# legal-case-engine - Backend Documentation ⚖️🤖

Este proyecto es el motor de procesamiento y gestión de casos legales para ENEL, diseñado con un enfoque prioritario en la **privacidad de los datos** y la **automatización administrativa**.

## 🚀 Arquitectura Técnica
El backend está construido sobre **Node.js + Express** y utiliza una base de datos **PostgreSQL** con la extensión `pgvector`.

### 🧠 Inteligencia Artificial Local (Privacidad Total)
A diferencia de otros sistemas, legal-case-engine procesa la información sensible **100% localmente**:
- **Motor:** `@xenova/transformers`.
- **Modelo:** `all-MiniLM-L6-v2` (384 dimensiones).
- **Función:** Genera embeddings vectoriales del contenido de los casos para realizar búsquedas semánticas (RAG) contra la base de conocimiento histórica de la empresa sin enviar datos a la nube.

## 📁 Estructura del Proyecto
- `src/index.js`: Punto de entrada y configuración del servidor (Puerto 4000).
- `src/controllers/`: Lógica de los endpoints.
- `src/services/`:
    - `aiService.js`: Manejo del motor local de transformers.
    - `pdfService.js`: Extracción de texto desde buffers de PDF.
    - `extractorService.js`: Lógica para identificar metadatos (Radicado, Accionante, etc.).
    - `vectorService.js`: Consultas de similitud vectorial en PostgreSQL.
    - `docxService.js`: Generación de documentos Word.
- `src/db/`: Configuraciones de conexión y esquemas de base de datos.
- `src/middlewares/`: Capa de seguridad y validación (Zod, Helmet, Auth).

## 📊 Modelo de Datos (PostgreSQL)
### Tablas Principales:
1.  **`tutelas`**: Almacena el expediente digital, radicado, accionante, juzgado, estado, prioridad y el contenido base.
2.  **`historial_acciones`**: Registro de trazabilidad y auditoría.
3.  **`base_conocimiento_enel`**: Repositorio de fragmentos legales con vectores asociados para RAG.
4.  **`abogados`**: Catálogo de responsables y gestión de roles (RBAC).

## 🛣️ API Endpoints (`/api/`)
- `/api/tutelas`: Gestión de casos (CRUD, procesamiento, búsqueda semántica).
- `/api/auth`: Gestión de identidad y sesiones (JWT + Cookies).
- `/api/admin`: Rutas administrativas protegidas (Logs, gestión de usuarios).

## 🛠️ Configuración de Entorno (.env)
```env
PORT=4000
DATABASE_URL=postgresql://[usuario]:[pass]@localhost:[puerto]/[db]
JWT_SECRET=[secreto_de_al_menos_16_caracteres]
NODE_ENV=development
```
> **Nota:** La configuración es validada al arranque mediante Zod (Fail-Fast).

## 📝 Estado del Sistema
- **Sistema RBAC:** Jerarquía de permisos completa (`super_admin`, `admin`, `juridico`, `auditor`).
- **Seguridad:** Implementación de `Helmet`, `HttpOnly Cookies`, y validaciones `Zod` de frontera.
- **Observabilidad:** Logging estructurado con `Winston` y trazabilidad mediante `X-Request-Id`.
- **Portabilidad:** Despliegue optimizado mediante `Docker` (Multi-stage build).

---
*Este documento sirve como índice de contexto para el desarrollo continuo del motor legal.*
