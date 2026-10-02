# eval/data/ — corpus v1 (versionado a propósito)

Todo en esta carpeta, salvo lo listado abajo como excluido, se versiona en el repo público. Es seguro: es contenido 100% sintético generado por un sub-agente sin contexto de las debilidades conocidas del sistema RAG (ver el hilo de Opus en RAG-00 [#79](https://github.com/Icebreaker26/legal-case-engine-backend/issues/79) y el issue [#74](https://github.com/Icebreaker26/legal-case-engine-backend/issues/74)), calibrado por patrones estructurales/estilísticos de documentos reales que Alejandro compartió como archivos locales — **nunca copiando ningún dato identificable de ellos**. Verificado de forma independiente (no solo el autorreporte del sub-agente): sin correos, sin teléfonos, sin ninguno de los identificadores reales observados en los documentos de referencia.

## Archivos

- `corpus.jsonl` — 40 documentos (precedentes/"respuestas exitosas" sintéticas), contrato en `eval/schema.js` (`DocSchema`).
- `queries.jsonl` — 40 consultas (derechos de petición nuevos sintéticos), contrato `QuerySchema`.
- `qrels.trec` — relevancia graduada (0/1/2), derivada mecánicamente de `spec` vía `eval/lib/qrels.js` (regenerar con `node eval/scripts/03_generar_qrels.js --corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl --out eval/data/qrels.trec` tras editar el corpus).
- `categorias.json` — taxonomía **inferida** de los patrones reales observados (SERVIDUMBRE_PASO_RED, SERVIDUMBRE_TRASLADO, INSTALACION_SIN_AUTORIZACION, DAÑOS_INFRAESTRUCTURA, ACCESO_PREDIO, FACTURACION, CORTE_SERVICIO, CALIDAD_SERVICIO, INFORMACION_GENERAL) — **no es el export real de `global_categorias` de producción**.
- `runs/` — resultados de los experimentos de línea base (`rag-baseline-v1`, tag en git):
  - `E01-baseline-ponderado.trec` / `.meta.json` — recall@5=0.481, nDCG@5=0.526
  - `E02-baseline-rrf.trec` / `.meta.json` — recall@5=0.464, nDCG@5=0.514
  - Cada `.meta.json` trae `git_sha`, `embedding_model`, `corpus_sha256` y los scores reales por query — así el resultado es auditable y reproducible exactamente.

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

## Siguiente paso (Fase 4, issues `#64`-`#67`)

Corregir los bugs de retrieval uno por uno, y después de cada uno repetir el paso `04_correr.js` de arriba (mismo corpus, mismo `rag-eval-db`) para medir el delta real contra `rag-baseline-v1`. El cálculo formal con `ranx` y significancia estadística es el alcance de `#76`; los números de aquí son el baseline con el que comparar, no el resultado final de la tesis.
