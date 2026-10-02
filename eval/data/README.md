# eval/data/ — corpus v1 (versionado a propósito)

Todo en esta carpeta, salvo lo listado abajo como excluido, se versiona en el repo público. Es seguro: es contenido 100% sintético generado por un sub-agente sin contexto de las debilidades conocidas del sistema RAG (ver el hilo de Opus en RAG-00 [#79](https://github.com/Icebreaker26/legal-case-engine-backend/issues/79) y el issue [#74](https://github.com/Icebreaker26/legal-case-engine-backend/issues/74)), calibrado por patrones estructurales/estilísticos de documentos reales que Alejandro compartió como archivos locales — **nunca copiando ningún dato identificable de ellos**. Verificado de forma independiente (no solo el autorreporte del sub-agente): sin correos, sin teléfonos, sin ninguno de los identificadores reales observados en los documentos de referencia.

## Archivos

- `corpus.jsonl` — 40 documentos (precedentes/"respuestas exitosas" sintéticas), contrato en `eval/schema.js` (`DocSchema`). **Sin cambios desde v1** — `#96` solo amplió las consultas, no el corpus.
- `queries.jsonl` — **120 consultas** (derechos de petición nuevos sintéticos), contrato `QuerySchema`. Las primeras 40 (`Q-*-001` a `Q-*-040`) son el corpus v1 original (`#74`). Las 80 restantes (`Q-*-041` a `Q-*-120`) se agregaron en `#96` (2026-10-02) — ver más abajo.
- `split.json` — split dev/test **congelado** (`#96`). Las 40 queries originales van siempre a dev (ya se usaron para explorar en `#95`/`#98`); de las 80 nuevas, 25 quedan congeladas como test (muestreo sistemático por "modo", no las últimas por orden de generación — ver el campo `_comentario` del archivo). **No se recalcula después de ver resultados de ningún experimento.**
- `qrels.trec` — relevancia graduada (0/1/2) para las 120 consultas, derivada mecánicamente de `spec` vía `eval/lib/qrels.js` (regenerar con `node eval/scripts/03_generar_qrels.js --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/qrels.trec` tras editar el corpus o las queries).
- `categorias.json` — taxonomía **inferida** de los patrones reales observados (SERVIDUMBRE_PASO_RED, SERVIDUMBRE_TRASLADO, INSTALACION_SIN_AUTORIZACION, DAÑOS_INFRAESTRUCTURA, ACCESO_PREDIO, FACTURACION, CORTE_SERVICIO, CALIDAD_SERVICIO, INFORMACION_GENERAL) — **no es el export real de `global_categorias` de producción**.
- `runs/` — resultados de experimentos corridos sobre el corpus v1 original (40 queries, antes de `#96`):
  - `E01-baseline-ponderado.trec` / `.meta.json` — recall@5=0.481, nDCG@5=0.526 (tag `rag-baseline-v1`)
  - `E02-baseline-rrf.trec` / `.meta.json` — recall@5=0.464, nDCG@5=0.514 (tag `rag-baseline-v1`)
  - `ablation-*.trec` — diagnósticos de `#95` y `#98` (ver esos issues y el [doc de seguimiento](https://claude.ai/code/artifact/a0d63867-88c7-4b4b-8ffa-d3df27ccba1c)).
  - Cada `.meta.json` trae `git_sha`, `embedding_model`, `corpus_sha256` y los scores reales por query — así el resultado es auditable y reproducible exactamente. **Ninguno de estos runs se recalculó sobre las 120 queries** — son el baseline histórico de 40, intacto.

## Ampliación del corpus de consultas (`#96`, 2026-10-02)

Las 80 consultas nuevas se generaron con el mismo método que v1 (`#74`): 100% sintéticas, por un sub-agente sin contexto de los hallazgos de `#95`/`#98` (qué modelo gana, qué tipo de consulta falla) — para no sesgar la generación hacia confirmar lo que ya se sabía. Mantienen la misma taxonomía de "modos" de v1, codificada en el `qid`:

- **PARA** (20) — parafraseo cercano de una petición real sobre esa categoría/subtema.
- **SEM** (20) — relevante solo por significado, evitando a propósito el vocabulario técnico/legal de la categoría (lenguaje cotidiano e indirecto).
- **LEX** (16) — reutiliza el vocabulario técnico/legal distintivo de la categoría (cita artículos, términos formales).
- **NOKW** (12) — quejas cortas y vagas, casi sin palabras de contenido distintivas.
- **DIS** (12) — distractoras deliberadas: usan el vocabulario superficial de una categoría/subtema pero su `spec` real apunta a otra, relacionada pero distinta.

**Limitación pendiente, sin resolver todavía**: la recomendación original (segunda opinión de Opus 5.5) pedía que *al menos parte* de las consultas nuevas las parafraseara una persona sin mirar los documentos del corpus, para romper la circularidad de que la consulta y su `spec` salen del mismo proceso (lo que favorece artificialmente al retrieval léxico). Las 80 consultas de esta ronda son **100% generadas por IA**, igual que v1 — esa tarea de parafraseo humano sigue pendiente y no se puede dar por hecha hasta que Alejandro (u otra persona con criterio jurídico) la haga.

Verificación hecha sobre las 80 antes de mergear: validadas contra el `QuerySchema` real (no la reimplementación del sub-agente) y confirmado que cada una tiene al menos un documento con relevancia grado 2 en el corpus real, vía `gradoRelevancia()` de `eval/lib/qrels.js`.

## Qué NO se versiona (ver `.gitignore`)

- `eval/.env.eval` — credenciales locales del contenedor `rag-eval-db`.
- Un futuro export **real** de `global_categorias` de producción debe guardarse como `eval/data/categorias.produccion.json` (o `*.real.json`) — esos patrones están en `.gitignore`. **Nunca sobrescribir `categorias.json`** (el placeholder sintético de v1) con datos reales.

## Reproducir desde cero

```bash
bash eval/scripts/00_db.sh "$(openssl rand -hex 16)"
cp eval/.env.eval.example eval/.env.eval   # completar con el password que imprime 00_db.sh
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/01_cargar_categorias.js eval/data/categorias.json
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js eval/data/corpus.jsonl
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js --exp E01-baseline-ponderado --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/runs
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js --exp E02-baseline-rrf       --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/runs
node eval/scripts/_sanity_metrics.mjs eval/data/runs/E01-baseline-ponderado.trec eval/data/qrels.trec
```

## Estado y siguiente paso (actualizado 2026-10-02)

Fase 4 (`#64`-`#67`) completa y mergeada — ninguno de los 4 fixes movió recall@5/nDCG@5 de forma apreciable sobre el corpus v1 original de 40 queries (son casos borde que ese corpus casi no contiene). `#95` y `#98` (diagnóstico + RAG-Q1, `multilingual-e5-small` supera la línea base) también completos y mergeados, exploratorios sobre las mismas 40 queries.

Con `#96` cerrado, sigue `#75` (etiquetado por pooling con criterio jurídico real, sobre **todas** las configuraciones candidatas incluyendo las de `#98`) → `#76` (métricas formales con `ranx`, significancia) → `#77` (confirmación: ¿`ponderado-raw + e5-small` le gana a la línea base de producción, con significancia, sobre el split de **test** congelado aquí?). Los números de `runs/` son el baseline histórico con el que comparar — ninguno de ellos usa todavía el split ni las 80 queries nuevas.
