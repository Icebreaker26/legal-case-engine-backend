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

Si el contenedor `rag-eval-db` ya no existe en esta máquina (sesión nueva,
máquina nueva), recrearlo con `bash eval/scripts/00_db.sh <password>` —
es idempotente, no borra nada si ya existe.

## Setup (una vez por máquina)

```bash
bash eval/scripts/00_db.sh "$(openssl rand -hex 16)"   # o cualquier password local
cp eval/.env.eval.example eval/.env.eval
# completar DATABASE_URL con el password que imprimió 00_db.sh
```

## Corpus v1 (`eval/data/`) — el corpus real, ya versionado en el repo

40 documentos + 40 consultas, 100% sintéticos (generados por un sub-agente
sin contexto de los bugs conocidos del sistema — ver #74 y el hilo de
Opus en #79), calibrados por patrones estructurales de documentos reales
compartidos por Alejandro **sin copiar ningún dato identificable**
(verificado de forma independiente, no solo el autorreporte del agente).
Detalle completo, incluyendo cómo reproducir los resultados desde cero,
en [`eval/data/README.md`](data/README.md).

**Línea base ya corrida** (tag `rag-baseline-v1`, antes de corregir los
bugs `#64`-`#67`):

| Experimento | Recall@5 | nDCG@5 |
|---|---|---|
| E01 — ponderado | 0.481 | 0.526 |
| E02 — RRF | 0.464 | 0.514 |

```bash
# Flujo completo sobre el corpus v1 (asume eval/.env.eval ya configurado)
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/01_cargar_categorias.js eval/data/categorias.json
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js eval/data/corpus.jsonl
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js --exp E01-baseline-ponderado --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/runs
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js --exp E02-baseline-rrf       --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/runs
node eval/scripts/_sanity_metrics.mjs eval/data/runs/E01-baseline-ponderado.trec eval/data/qrels.trec
```

Para regenerar `eval/data/qrels.trec` después de editar el corpus:
```bash
node eval/scripts/03_generar_qrels.js --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/qrels.trec
```

`eval/data/categorias.json` es una taxonomía **inferida** de los patrones
observados (no el export real de `global_categorias` de producción). Si
Alejandro exporta el real, guardarlo como `eval/data/categorias.produccion.json`
(patrón en `.gitignore`) — **nunca sobrescribir** `categorias.json`.

## Reindexar con otro modelo de embeddings (#101)

Para probar un modelo distinto al `EMBEDDING_MODEL` por defecto (p.ej.
`multilingual-e5-small` en vez de `MiniLM`), usar el wrapper explícito en vez
de exportar `EMBEDDING_MODEL` a mano en el shell (riesgo de que quede pegado
en la sesión y contamine una corrida posterior sin que nadie lo note):

```bash
bash eval/scripts/02b_indexar_modelo.sh Xenova/multilingual-e5-small eval/data/v1/corpus.jsonl
```

`02_indexar.js` también acepta `--modelo=<id>` directamente. Cada corrida
registra en `eval_indexado` el modelo, `corpus_sha256`, `git_sha`, **y ahora
`modelo_onnx_sha256`** — el hash de los pesos `.onnx` cacheados localmente por
`@xenova/transformers`, no solo el nombre del modelo (que no cambia si Xenova
actualiza el repo de HuggingFace). Para auditar qué pesos exactos generaron un
`.trec` dado: `SELECT * FROM eval_indexado ORDER BY id DESC LIMIT 1`.

**Versión fijada y verificada en esta sesión** (2026-10-07, host de
desarrollo): `Xenova/multilingual-e5-small`, archivo `onnx/model_quantized.onnx`,
`sha256=f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193`. Si
una corrida futura reporta un hash distinto para el mismo id de modelo, Xenova
actualizó el repo — no asumir que el resultado es reproducible contra
corridas previas sin volver a etiquetar.

## Mini-corpus (`eval/fixtures/mini/`) — prueba de regresión del arnés, no de la tesis

8 documentos + 4 consultas sintéticas minúsculas, con casos borde
**deliberados**, pensadas para probar que el arnés en sí funciona de
punta a punta rápido (no para medir calidad del RAG — para eso está el
corpus v1 de arriba):
- `DOC-CORTE-002` tiene un párrafo de 1509 caracteres sin punto final (ejercita el bug de `chunkService.js`, #66 — no corregido todavía, es intencional).
- `DOC-FAC-002` / `DOC-CORTE-002` no tienen `comprension` (fuerza el fallback a `substring(0,1500)` en `consultaService.construirConsulta`).
- `Q-FAC-SEM` es relevante solo semánticamente (sin palabras compartidas con los documentos).
- `Q-FAC-LEX` es relevante solo léxicamente (repite literalmente los términos clave).
- `DOC-FAC-003` es un distractor: misma categoría, subtema distinto (grado 1 en los qrels, no 2).
- `Q-CAT-VACIA` no debería extraer ninguna categoría del fixture (prueba el camino sin filtro).

Regenerar tras editarlo:
```bash
node eval/fixtures/mini/_generar_corpus.mjs   # o _generar_queries.mjs
node eval/scripts/03_generar_qrels.js --corpus eval/fixtures/mini/corpus.jsonl --queries eval/fixtures/mini/queries.jsonl --out eval/fixtures/mini/qrels.trec
```

Los scripts `01`/`02`/`04` sin argumentos de ruta usan el mini-corpus por
defecto (`eval/fixtures/mini/...`) — pásales `--corpus`/`--queries`/`--out`
(y a `01` la ruta de categorías como argumento posicional) para apuntar al
corpus v1 en su lugar, como en los comandos de arriba.

**Criterio de aceptación del arnés: determinismo.** Correr `04_correr.js`
dos veces, y también reindexar desde cero y volver a correr, debe dar
archivos `.trec` byte-idénticos — verificado manualmente en #73 **y**
otra vez sobre el corpus v1 real. No está automatizado en `npm test`
porque requeriría agregar el contenedor `rag-eval-db` al pipeline de CI,
fuera del alcance de estos issues.

## Qué falta (issues separados, Fase 4 en adelante — ver RAG-00 #79)

- `#64`-`#67` — corregir los bugs de retrieval; después de cada uno, repetir el flujo de "Corpus v1" de arriba y comparar contra `rag-baseline-v1`.
- `03_pool_etiquetado.js` — pooling del top-K de todas las configuraciones para etiquetado por un humano con criterio jurídico (#75) — distinto del `03_generar_qrels.js` de arriba, que deriva la verdad de referencia mecánicamente, no por pooling.
- `05_evaluar.py` con `ranx` (métricas formales + significancia estadística, #76).
- Comparar todas las configuraciones de `experimentos.json` sobre el corpus v1 con los resultados ya corregidos (#77).
