# Módulo Ambiental

Gestión del ciclo de vida de expedientes de derecho ambiental en Enel Colombia. Cubre desde la ingesta de resoluciones, autos y requerimientos hasta el análisis LLM multi-parte, seguimiento de pagos, comunicaciones con la entidad y búsqueda semántica de precedentes.

---

## Tablas

| Tabla | Propósito |
|---|---|
| `expedientes_ambientales` | Registro principal del instrumento ambiental |
| `analisis_ambiental` | Cabecera del análisis LLM (nivel de riesgo, resumen, que_ordena…) |
| `hallazgos_ambientales` | Uno por hallazgo identificado por el LLM |
| `normas_citadas_ambiental` | Normas legales identificadas por el LLM |
| `pagos_ambientales` | Obligaciones de pago extraídas del instrumento |
| `comunicaciones_expediente` | Timeline de intercambios entrantes/salientes con la entidad |
| `embeddings_ambiental` | Vectores pgvector 384 dims para búsqueda semántica de precedentes |

### Campos clave de `expedientes_ambientales`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | `uuid_generate_v4()` |
| `titulo` | TEXT | Nombre del instrumento |
| `tipo_instrumento` | TEXT | resolución, auto, requerimiento, expediente, otros… |
| `numero_expediente` | TEXT | Nullable |
| `entidad_id` | INTEGER FK | → `global_entidades` |
| `grupo_id` | INTEGER FK | → `global_grupos` |
| `responsable_uuid` | UUID FK | → `global_usuarios` |
| `estado` | VARCHAR | `Pendiente | Analizado | Revisado | Archivado | Cerrado` |
| `contenido_texto` | TEXT | Texto extraído del archivo |
| `prompt_generado` | TEXT | String plano (1 parte) o `JSON.stringify([{num,total,prompt}])` (N partes) |
| `que_ordena` | TEXT | Extraído del LLM |
| `admite_recurso` | VARCHAR | `Sí | No | Depende` |
| `plazo_respuesta` | TEXT | Extraído del LLM |
| `fecha_documento` | DATE | Fecha del instrumento |
| `fecha_vencimiento` | DATE | Calculada por LLM o editada manualmente |
| `secciones_analizadas` | integer[] | Índices 1-based de secciones ya guardadas |
| `argumentos_recurso` | TEXT | Argumentos del abogado para el recurso |
| `hallazgos_recurso_ids` | uuid[] | Hallazgos seleccionados para el recurso |
| `enlace_pdf` | TEXT | URL al documento original |
| `ultima_notif_vencimiento` | DATE | Evita renotificar el mismo día |
| `is_active` | BOOLEAN | Borrado lógico |

### Campos de `comunicaciones_expediente`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `expediente_id` | UUID FK | |
| `direccion` | VARCHAR(10) | `entrante | saliente` |
| `asunto` | TEXT | |
| `fecha` | DATE | |
| `descripcion` | TEXT | Nota breve opcional |
| `texto_extraido` | TEXT | Extraído de PDF/DOCX adjunto |
| `nombre_archivo` | VARCHAR(255) | Nombre del archivo original |
| `enlace` | TEXT | URL al documento original |
| `resultado_llm` | TEXT | JSON del análisis LLM de la comunicación |
| `prompt_generado` | TEXT | Prompt guardado para reutilizar |
| `is_active` | BOOLEAN | Borrado lógico |

### Tabla `embeddings_ambiental`

| Campo | Tipo | Notas |
|---|---|---|
| `expediente_id` | UUID PK/FK | |
| `embedding` | vector(384) | Modelo `Xenova/all-MiniLM-L6-v2` local |
| `fuente` | VARCHAR(20) | `contenido` o `analisis` |
| `updated_at` | TIMESTAMPTZ | |

Índice HNSW con `vector_cosine_ops`. Umbral de similitud: **0.65**.

---

## Endpoints

### Expedientes

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `/expedientes/procesar` | WRITE | Extrae texto del archivo; genera prompts multi-parte |
| `POST` | `/expedientes` | WRITE | Crea expediente |
| `GET` | `/expedientes` | READ | Lista con filtros (`estado`, `tipo_instrumento`, `entidad_id`, `grupo_id`) |
| `GET` | `/expedientes/:id` | READ | Detalle completo |
| `PATCH` | `/expedientes/:id` | WRITE | Actualiza metadatos (estado, enlace_pdf, argumentos_recurso…) |
| `DELETE` | `/expedientes/:id` | DELETE | Borrado lógico |

### Análisis

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `POST` | `/expedientes/:id/analisis` | WRITE | Guarda JSON del LLM — modos `reemplazar` o `acumular` |
| `PATCH` | `/expedientes/:id/analisis/resumen` | WRITE | Reemplaza resumen consolidado |
| `GET` | `/expedientes/:id/analisis` | READ | Devuelve análisis + hallazgos + normas + pagos |
| `GET` | `/expedientes/:id/informe` | READ | Datos completos para exportar PDF del informe |

### Pagos

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `PATCH` | `/expedientes/:id/pagos/:pagoId` | WRITE | Cambia estado `Pendiente ↔ Pagado` |
| `DELETE` | `/expedientes/:id/pagos/:pagoId` | DELETE | Borrado lógico |
| `GET` | `/expedientes/:id/pagos/inactivos` | READ | Lista pagos desactivados |
| `PATCH` | `/expedientes/:id/pagos/:pagoId/reactivar` | WRITE | Reactiva pago |

### Comunicaciones

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `GET` | `/expedientes/:id/comunicaciones` | READ | Timeline ordenado por fecha ASC |
| `POST` | `/expedientes/:id/comunicaciones` | WRITE | Crea — multipart, acepta PDF/DOCX/TXT opcional + campo `enlace` |
| `DELETE` | `/expedientes/:id/comunicaciones/:cId` | DELETE | Borrado lógico |
| `PATCH` | `/expedientes/:id/comunicaciones/:cId/reactivar` | WRITE | Restaura |
| `GET` | `/expedientes/:id/comunicaciones/inactivas` | READ | Lista eliminadas |
| `PATCH` | `/expedientes/:id/comunicaciones/:cId/enlace` | WRITE | Actualiza enlace al documento original |
| `POST` | `/expedientes/:id/comunicaciones/:cId/prompt-analisis` | WRITE | Genera prompt LLM desde `texto_extraido`; guarda en `prompt_generado`. Retorna `{ prompt }`. 422 si no hay texto. |
| `PATCH` | `/expedientes/:id/comunicaciones/:cId/resultado-llm` | WRITE | Guarda JSON del LLM en `resultado_llm` |

### Precedentes automáticos (pgvector)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `GET` | `/expedientes/:id/similares` | READ | Busca hasta 10 expedientes con similitud ≥ 0.65. 404 si no hay embedding. |
| `POST` | `/expedientes/:id/generar-embedding` | WRITE | Genera embedding para expedientes sin índice (usa `resumen` si existe, `contenido_texto[:1500]` si no). 422 sin texto. |
| `POST` | `/expedientes/:id/prompt-comparativo` | WRITE | Genera prompt comparativo usando `precedentes_ids[]` seleccionados. 400 si array vacío. |

### Vistas globales

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `GET` | `/calendario` | READ | Expedientes y pagos con fechas de vencimiento |
| `GET` | `/dashboard` | READ | KPIs, distribuciones por tipo/estado/riesgo, top entidades, próximos vencimientos |

### Biblioteca de Conocimiento

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `GET` | `/biblioteca/estadisticas` | READ | KPIs globales, distribución por tipo de instrumento, top entidades, top términos (`ts_stat`) excluyendo términos ignorados |
| `GET` | `/biblioteca/clusters` | READ | Clusters semánticos cacheados + `needs_recalculate` + `embeddings_actuales` |
| `POST` | `/biblioteca/recalcular` | WRITE | Corre k-means + PCA; guarda en `biblioteca_clusters` y `biblioteca_puntos`. 422 si hay < 3 embeddings. |
| `GET` | `/biblioteca/proyeccion` | READ | Coordenadas PCA 2D de todos los expedientes vectorizados |
| `GET` | `/biblioteca/terminos-ignorados` | READ | Lista de términos excluidos de la nube de palabras |
| `POST` | `/biblioteca/terminos-ignorados` | WRITE | Body `{ word }`. Agrega término a la lista de ignorados. |
| `DELETE` | `/biblioteca/terminos-ignorados/:word` | WRITE | Restaura un término ignorado. 404 si no existe. |

---

## Flujo LLM — análisis del instrumento

El backend genera un prompt estructurado que el usuario copia a la herramienta corporativa LLM y pega el resultado de vuelta. **El backend nunca se conecta a APIs de LLM.**

### Documentos largos (multi-parte)

`ambientalService.js`:
- `LIMITE_COPILOT = 128_000` chars disponibles por chunk
- `dividirTexto(texto, maxChars)` — divide respetando párrafos (`\n\n`)
- `buildPrompt(chunk, opts)` — incluye instrucción de fragmento cuando hay más de una parte
- `generarPromptsAmbientales(texto, opts)` → `[{ num, total, prompt }]`

El frontend detecta si `prompt_generado` es JSON array y muestra pills numeradas.

### Guardar análisis — modo `acumular`

`POST /expedientes/:id/analisis` con `modo: 'acumular'` y `seccion_index`:
- Acumula hallazgos (offset `max_num`), normas (sin duplicar), pagos (sin duplicar por valor)
- **Smart merge** del expediente: actualiza `fecha_vencimiento` solo si era NULL, `admite_recurso` solo si era NULL o 'Depende' y la nueva sección trae 'Sí'/'No'
- Registra `seccion_index` en `secciones_analizadas[]` (idempotente)

### Schema Zod `guardarAnalisisSchema`

- `resultado_llm_json` (string JSON)
- `modo`: `reemplazar | acumular` (default `reemplazar`)
- `seccion_index`: integer positivo, opcional
- `admite_recurso`: normaliza `Si → Sí`, `Critico → Crítico`

---

## Flujo LLM — análisis de comunicación individual

Para comunicaciones con `texto_extraido`:

1. `POST /comunicaciones/:cId/prompt-analisis` → genera prompt con `generarPromptRespuesta()` y lo guarda en `prompt_generado`
2. Usuario copia prompt a herramienta corporativa y pega el JSON resultante
3. `PATCH /comunicaciones/:cId/resultado-llm` → guarda JSON en `resultado_llm`

El JSON esperado tiene la misma estructura que el análisis de respuesta:

```json
{
  "valoracion": "Favorable|Desfavorable|Parcial",
  "cumplimiento": "Total|Parcial|Incumplimiento",
  "resumen": "...",
  "procede_recurso": "Sí|No|Evaluar",
  "tipo_recurso": "Reposición|Apelación|...|No aplica",
  "fundamentos_recurso": "...",
  "plazo_recurso": "...",
  "recomendaciones": ["..."],
  "observaciones": "..."
}
```

---

## Precedentes automáticos

Los embeddings se generan automáticamente con `setImmediate()` (no bloqueante) al:
- Crear un expediente con `contenido_texto` → `fuente: 'contenido'`
- Guardar análisis → `fuente: 'analisis'` (texto = resumen + que_ordena)

Para expedientes sin embedding: `POST /expedientes/:id/generar-embedding`.

El servicio `ambientalEmbeddingService.js` usa `Xenova/all-MiniLM-L6-v2` (modelo local 384 dims). La búsqueda retorna `null` (→ 404) si el expediente actual no tiene embedding, o array vacío si no hay similares con similitud ≥ 0.65.

---

## Migraciones

Todas en `tutelas_backend/migrations/`, prefijo timestamp:

| Timestamp | Cambio |
|---|---|
| `1782200000000` | Tablas base: expedientes, analisis, hallazgos, normas |
| `1782300000000` | `secciones_analizadas integer[]` |
| `1782500000000` | Tabla `pagos_ambientales` |
| `1782600000000` | `nota TEXT` en pagos |
| `1782700000000` | `fecha_vencimiento DATE` en expedientes y pagos |
| `1782800000000` | `ultima_notif_vencimiento DATE` |
| `1783300000000` | `argumentos_recurso TEXT` |
| `1783400000000` | `hallazgos_recurso_ids uuid[]` |
| `1783900000000` | `is_active BOOLEAN` en pagos |
| `1784000000000` | `plazo_respuesta VARCHAR → TEXT` |
| `1784100000000` | `respuesta_recurso_texto TEXT` (columna huérfana — UI removido) |
| `1784200000000` | Tabla `comunicaciones_expediente` |
| `1784700000000` | Tabla `embeddings_ambiental` + índice HNSW |
| `1784800000000` | `resultado_llm`, `prompt_generado` en `comunicaciones_expediente` |
| `1784900000000` | Migra datos de `respuesta_entidad_texto` → `comunicaciones_expediente`; dropea columnas obsoletas |
| `1785000000000` | `enlace TEXT` en `comunicaciones_expediente` |
| `1785100000000` | `search_vector tsvector` en `expedientes_ambientales` + índice GIN + trigger auto-update |
| `1785200000000` | Tablas `biblioteca_clusters` y `biblioteca_meta` |
| `1785300000000` | Tabla `biblioteca_terminos_ignorados` |
| `1785400000000` | Tabla `biblioteca_puntos` (coordenadas PCA 2D) |

---

## Tests

`tests/integration/ambiental.test.js` — **63 tests** (todos en verde)

| Suite | Tests |
|---|---|
| Autenticación | 2 |
| GET /expedientes | 3 |
| POST /expedientes — validación Zod | 3 |
| GET /expedientes/:id | 2 |
| PATCH /expedientes/:id | 3 |
| POST /expedientes/procesar | 2 |
| POST /analisis — guardar LLM | 6 |
| GET /analisis | 4 |
| GET /informe | 1 |
| PATCH — recurso y fecha_documento | 5 |
| PATCH — estado Cerrado | 3 |
| PATCH — enlace_pdf | 3 |
| POST — tipo 'otros' | 1 |
| Comunicaciones CRUD + restore | 7 |
| Comunicaciones — enlace | 3 |
| Análisis LLM de comunicación | 5 |
| Precedentes — embeddings | 4 |
| DELETE /expedientes | 2 |

---

## Búsqueda híbrida (vector + full-text)

`ambientalEmbeddingService.js` — `buscarSimilares(expedienteId, limite)`:

- **Hybrid search con Reciprocal Rank Fusion (RRF)**: combina ranking vectorial (`pgvector cosine`) y full-text (`tsvector / plainto_tsquery('spanish')`).
- Fórmula: `1/(60 + rank_vector) + 1/(60 + rank_fulltext)` con `k = 60`, `CANDIDATOS = 20`.
- La columna `search_vector` se mantiene actualizada por un trigger `BEFORE INSERT OR UPDATE`.
- **Fallback**: si el expediente no tiene texto útil para full-text, cae a búsqueda vectorial pura.
- Retorna: `id, titulo, numero_expediente, tipo_instrumento, estado, entidad_nombre, nivel_riesgo, resumen, similitud, rrf_score`.

---

## Biblioteca de Conocimiento

`ambientalBibliotecaService.js` — pipeline que corre al presionar "Actualizar conocimiento":

### Estadísticas (`obtenerEstadisticas`)
- Distribución por `tipo_instrumento`: total, riesgo A/M/B, días promedio, casos cerrados.
- Top 8 entidades con desglose de riesgo.
- Top 24 términos de `ts_stat` (excluye stopwords hardcodeados + lista `biblioteca_terminos_ignorados`).
- KPIs: total expedientes, con análisis, con embedding.

### Clustering semántico (`recalcularClusters`)
1. Carga todos los embeddings activos de `embeddings_ambiental`.
2. K-means con `ml-kmeans` — K auto-seleccionado: `n<6→2`, `n<15→3`, `n<30→5`, else `7`.
3. Por cada cluster: **medoid** (expediente más cercano al centroide), distribución de tipos y riesgos.
4. PCA 2D con `ml-pca` sobre los mismos vectores — coordenadas normalizadas a `[0,1]`.
5. Guarda en `biblioteca_clusters` (clusters) y `biblioteca_puntos` (scatter plot).

### `needs_recalculate = true` cuando:
- No hay clusters aún.
- `biblioteca_puntos` está vacío pero hay clusters (post-deploy con nueva migración).
- Hay ≥ 10 embeddings nuevos desde el último cómputo.

### Términos ignorados
- `biblioteca_terminos_ignorados` — PRIMARY KEY `word`.
- Al ignorar un término desde la UI, desaparece de la nube sin necesidad de recalcular.
- Restaurable vía `DELETE /biblioteca/terminos-ignorados/:word`.

---

## Tests

`tests/integration/ambiental.test.js` — **74 tests** (todos en verde, 2026-07-09)

| Suite | Tests |
|---|---|
| Autenticación | 2 |
| GET /expedientes | 3 |
| POST /expedientes — validación Zod | 3 |
| GET /expedientes/:id | 2 |
| PATCH /expedientes/:id | 3 |
| POST /expedientes/procesar | 2 |
| POST /analisis — guardar LLM | 6 |
| GET /analisis | 4 |
| GET /informe | 1 |
| PATCH — recurso y fecha_documento | 5 |
| PATCH — estado Cerrado | 3 |
| PATCH — enlace_pdf | 3 |
| POST — tipo 'otros' | 1 |
| Comunicaciones CRUD + restore | 7 |
| Comunicaciones — enlace | 3 |
| Análisis LLM de comunicación | 5 |
| Precedentes — embeddings | 8 |
| Biblioteca de Conocimiento | 8 |
| DELETE /expedientes | 2 |

---

## Trampas conocidas

- `listarExpedientes` usa `DISTINCT ON (e.id)` — sin esto el JOIN con `analisis_ambiental` duplica filas.
- `guardarAnalisis` modo acumular: casteos explícitos `$2::text`, `$1::uuid` en deduplicación de normas citadas.
- `analisis_ambiental` **no tiene** columna `updated_at`.
- `prompt_generado` puede ser string plano (1 parte) o `JSON.stringify([{num,total,prompt}])` — siempre parsear.
- `@xenova/transformers` carga el modelo en el primer uso (~2-3 s). Los embeddings se generan con `setImmediate()` para no bloquear la respuesta HTTP.
- `generarPromptAnalisisComunicacion` retorna **422** (no 400) cuando la comunicación no tiene `texto_extraido`.
- En Railway: `.npmrc` requiere `sharp_ignore_global_libvips=true` para evitar timeout en la descarga de libvips (dependencia transitiva de `@xenova/transformers`).
- `recalcularClusters` lanza error con `{ status: 422 }` cuando hay < 3 embeddings. El `errorHandler` lee `err.status` para propagar el código correcto (fix aplicado: `const status = err.status || err.statusCode || 500`).
- Tras un deploy que agrega `biblioteca_puntos`, `needs_recalculate` fuerza el botón "Actualizar" hasta que el usuario recalcule una vez (detecta `COUNT(biblioteca_puntos) === 0 && clusters > 0`).
- El embedding de pgvector se recupera como string `[v1,v2,...]` — es JSON válido, usar `JSON.parse(r.embedding)` para convertir a array antes de pasar a `ml-kmeans`/`ml-pca`.
