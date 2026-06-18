# Módulo de Tutelas (tutelas) ⚖️🤖

El módulo de **Tutelas** es el núcleo principal del sistema. Administra el procesamiento, análisis inteligente (RAG/búsqueda semántica), generación de contestaciones y el ciclo de vida completo de las acciones de tutela presentadas contra la compañía.

## 🎯 Características Principales

- **Procesamiento Inteligente de Documentos:** Subida de PDFs de tutela (`/procesar`), extracción automatizada de hechos, pretensiones y metadatos clave.
- **RAG Local & Memoria Legal:** Almacenamiento vectorial mediante `pgvector` y entrenamiento local (`/entrenar-local`). Permite consultar sugerencias históricas (`/:id/sugerencias`) y la base de conocimiento para la toma de decisiones judiciales.
- **Generador de Contestaciones:** Genera borradores de contestación (`/generar-borrador`), descarga en formato Word (.docx), y permite el refinamiento dinámico interactivo con IA (`/refinar-borrador`).
- **Bloqueo Optimista de Borradores:** Previene que múltiples abogados modifiquen simultáneamente un borrador de contestación mediante endpoints de bloqueo (`/lock`, `/unlock`).
- **Requerimientos Internos:** Flujo para solicitar información a áreas internas del negocio (`/:id/requerimientos`) con estados de seguimiento.
- **Gestión de Argumentos:** Repositorio estructurado de argumentos legales por tutela.
- **Trazabilidad y Papelera:** Historial detallado de todas las acciones del caso y borrado lógico con opción de restauración (`/papelera`, `/restaurar`).

## ⚙️ Estructura del Módulo
```text
src/modules/tutelas/
├── controllers/        # tutelaController.js (Extracción, IA, Documentos, RAG)
└── routes/             # tutelaRoutes.js (Más de 35 endpoints expuestos)
```

## 🔐 Seguridad y Permisos
- Requiere autenticación JWT (`authenticateToken`).
- Permisos granulares:
  - `tutelas:READ`: Listar tutelas, ver estadísticas, historial, requerimientos, sugerencias y argumentos.
  - `tutelas:WRITE`: Procesar tutelas, entrenar contexto, crear requerimientos, bloquear borradores y generar/refinar contestaciones.
  - `tutelas:DELETE`: Eliminación lógica de tutelas y documentos de la base de conocimiento.

## 📊 Endpoints Clave
- `POST /api/tutelas/procesar`: Procesar un archivo PDF de tutela e iniciar extracción inteligente.
- `POST /api/tutelas/:id/generar-borrador`: Crear un borrador preliminar de contestación legal usando RAG local.
- `POST /api/tutelas/entrenar-local`: Alimentar la memoria institucional con documentos de referencia.
- `POST /api/tutelas/:id/lock`: Adquirir el bloqueo de edición del borrador de la tutela.
- `GET /api/tutelas/papelera`: Listar tutelas eliminadas lógicamente con posibilidad de restauración.
