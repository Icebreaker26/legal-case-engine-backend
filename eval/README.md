# Arnés de evaluación RAG (#73)

Scripts standalone (sin Express, sin auth) que importan directamente los
servicios reales de `src/modules/tutelas/services/` — `memoriaService`,
`consultaService`, `vectorService`, `aiService` — para medir el retrieval
exactamente como corre en producción, sin reimplementar nada. Ver el
protocolo completo y el porqué de cada decisión en
[RAG-00 (#79)](https://github.com/Icebreaker26/legal-case-engine-backend/issues/79).

## Aislamiento — léelo antes de correr nada

Este arnés usa un contenedor Postgres **separado** (`rag-eval-db`,
`127.0.0.1:5435`), nunca el de dev (`legal-case-engine-db`, puerto 5433):
ese contenedor lo gestiona `docker-compose.yml` con `restart: always`, y un
`docker compose down -v` para reiniciar los tests borraría también los
índices de línea base. `eval/guard.js` se precarga con `--import` en todo
script y aborta el proceso si `DATABASE_URL` no apunta exactamente a
`127.0.0.1:5435/rag_eval_*` — es la única barrera real contra correr esto
por accidente contra dev, test o producción.

## Setup (una vez)

```bash
bash eval/scripts/00_db.sh "$(openssl rand -hex 16)"   # o cualquier password local
cp eval/.env.eval.example eval/.env.eval
# completar DATABASE_URL con el password que imprimió 00_db.sh
```

## Flujo

```bash
# 1. Cargar categorías (fixture sintético para el mini-corpus; el corpus v1
#    real necesita el export de categorías reales que haga Alejandro desde
#    producción — solo nombres y palabras_clave, no son datos personales)
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/01_cargar_categorias.js

# 2. Indexar el corpus (TRUNCATE + reindexado completo, determinista)
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js

# 3. Correr un experimento pre-registrado (eval/experimentos.json)
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js --exp E01-baseline-ponderado

# (opcional, solo para verificar de punta a punta durante desarrollo —
#  el cálculo formal con ranx es el alcance de #76)
node eval/scripts/_sanity_metrics.mjs eval/results/runs/E01-baseline-ponderado.trec eval/fixtures/mini/qrels.trec
```

## Mini-corpus (`eval/fixtures/mini/`) — se versiona para siempre

8 documentos + 4 consultas sintéticas, con casos borde **deliberados**:
- `DOC-CORTE-002` tiene un párrafo de 1509 caracteres sin punto final (ejercita el bug de `chunkService.js`, #66 — no corregido todavía, es intencional).
- `DOC-FAC-002` / `DOC-CORTE-002` no tienen `comprension` (fuerza el fallback a `substring(0,1500)` en `consultaService.construirConsulta`).
- `Q-FAC-SEM` es relevante solo semánticamente (sin palabras compartidas con los documentos).
- `Q-FAC-LEX` es relevante solo léxicamente (repite literalmente los términos clave).
- `DOC-FAC-003` es un distractor: misma categoría, subtema distinto (grado 1 en los qrels, no 2).
- `Q-CAT-VACIA` no debería extraer ninguna categoría del fixture (prueba el camino sin filtro).

Los qrels (`qrels.trec`) **no los escribe un humano a mano ni los infiere un LLM**: se derivan mecánicamente de la especificación latente de cada documento/consulta (`spec: {categoria, subtema, base_normativa}`) vía `eval/lib/qrels.js` — así la verdad de referencia no depende de ningún sistema de retrieval. Para regenerar tras editar el corpus:

```bash
node eval/fixtures/mini/_generar_corpus.mjs   # o _generar_queries.mjs
node eval/fixtures/mini/_generar_qrels.mjs
```

**Criterio de aceptación del arnés: determinismo.** Correr `04_correr.js` dos veces, y también reindexar desde cero y volver a correr, debe dar archivos `.trec` byte-idénticos. Verificado manualmente en #73 — no está (todavía) automatizado en `npm test` porque requeriría agregar el contenedor `rag-eval-db` al pipeline de CI, fuera del alcance de este issue.

## Corpus real (v1, #74)

Sigue el mismo contrato (`eval/schema.js`) pero con:
- Categorías reales exportadas por Alejandro desde producción (`eval/data/categorias.json`, gitignored — nunca el fixture sintético de `fixtures/mini/`).
- 30-50 documentos / consultas generados por un **sub-agente sin contexto de las debilidades conocidas del sistema** (ver #74 y la recomendación de Opus en el hilo de #79), para no sesgar el diseño del corpus hacia lo que ya se sabe que falla o funciona.
- `eval/data/` está en `.gitignore` — el corpus real nunca se versiona en este repo público.

## Qué falta (fuera del alcance de #73)

- `03_pool_etiquetado.js` — pooling del top-K de todas las configuraciones para etiquetado (#75).
- `05_evaluar.py` con `ranx` (métricas formales + significancia estadística, #76).
- Ejecutar las configuraciones de `experimentos.json` contra el corpus v1 y taguear `rag-baseline-v1` (#77).
