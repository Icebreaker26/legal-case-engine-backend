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

## Pooling y etiquetado (`#75`, 2026-10-02)

`eval/scripts/03b_pool_etiquetado.js` arma el pool uniendo el top-10 de **6 sistemas candidatos** para las 25 consultas del split de **test** congelado (nunca dev — ya se exploró):

1. `ponderado-raw + multilingual-e5-small` — candidato principal (H1 de `#77`)
2. `RRF + multilingual-e5-small` — alternativa de fusión (H2 de `#77`)
3. `ponderado + MiniLM` — línea base de producción (referencia de H1)
4. léxico-solo — control (ya le ganó en nDCG a la fusión completa en `#95`)
5. `vector-solo + e5-small` — diversidad (`#98`)
6. `ponderado-normalizado + e5-small` — diversidad (`#98`)

Lista de sistemas congelada antes de anotar. Pool: 408 pares (consulta, documento) sobre 25 consultas.

### El etiquetado lo hizo IA, no una persona — por instrucción explícita de Alejandro

El issue original (y el propio script) estaban diseñados para que el etiquetado (escala 0-3) lo hiciera una persona con criterio jurídico — es la razón de ser de `#75`: dejar de depender de una verdad de referencia mecánica/generada por IA. Se le planteó este punto a Alejandro explícitamente en la sesión, y pidió que se hiciera con IA de todas formas ("realiza tu mismo el etiquetado, no lo voy a hacer personalmente").

Mitigación aplicada, dado que se hizo con IA: dos sesiones de IA completamente aisladas (sin memoria de esta conversación, por lo tanto sin saber qué sistema "debía" ganar) graduaron los pares sin ver qué sistema recuperó cada documento (columnas `sistemas`/`n_sistemas_que_lo_recuperaron` ocultas durante el etiquetado) — ver `eval/data/grados_anotador1.csv` (los 408 pares) y `grados_anotador2.csv` (81 pares, doble anotación), cada fila con una razón breve para poder auditar. Ambos archivos quedan versionados como rastro de auditoría.

**Cohen's kappa = 0.895** ("acuerdo casi perfecto") entre los dos anotadores — pero esta cifra vale mucho menos que un kappa alto entre dos personas: dos instancias del mismo modelo, con el mismo rubro, tienden a converger más que dos juristas independientes. Alto acuerdo acá mide consistencia interna del modelo bajo este rubro, no validez externa del etiquetado.

**Esto sigue siendo, en el fondo, relevancia derivada de un proceso automatizado — la circularidad que `#75` buscaba resolver no está resuelta, solo cambió de forma** (de una regla mecánica basada en `categoria`/`subtema` a un juicio de IA sobre el texto). Es mejor que la regla mecánica original — lee el contenido real en vez de solo comparar etiquetas, y detectó varios distractores correctamente (ver `razon_breve` en los CSV) — pero no equivale a criterio jurídico humano real, y así debe reportarse en la tesis: como una limitación conocida, no como un hallazgo validado de forma independiente.

`qrels.trec` ya tiene las filas del split de test reemplazadas por estos grados reales (131 pares con relevancia ≥1 de 408 pooleados) vía `eval/scripts/03d_fusionar_qrels.js` — las de dev siguen con la relevancia mecánica original (alcanza para tuning/screening).

### Resultado con los qrels reales — cambia el panorama

Recall@5 / nDCG@5 sobre las 25 consultas de test, ahora con relevancia etiquetada (no mecánica):

| Sistema | Recall@5 | nDCG@5 |
| --- | --- | --- |
| MiniLM ponderado | 0.418 | 0.528 |
| e5-small ponderado | 0.456 | 0.561 |
| e5-small RRF | 0.453 | 0.544 |
| **léxico-solo** | **0.527** | **0.655** |

`e5-small` sigue ganándole a MiniLM (consistente con `#98`), pero léxico-solo le gana a los dos por un margen considerable — más marcado que en `#95` (donde ya había superado en nDCG a la fusión completa, pero por menos). Con una relevancia que lee el contenido real en vez de comparar etiquetas, la búsqueda por palabras clave se ve todavía más fuerte de lo que parecía. Señal importante para `#77`: el objetivo no debería ser "reemplazar léxico por semántico", sino entender por qué léxico solo sigue ganando y si la fusión está diluyendo una señal léxica que, sola, ya es mejor que cualquier combinación medida hasta ahora.

## Estado y siguiente paso (actualizado 2026-10-02)

Fase 4 (`#64`-`#67`), `#95`, `#98`, `#96` y `#75` completos y mergeados (o en PR). Sigue `#76` (métricas formales con `ranx`, significancia — con qrels ahora reales para el split de test) → `#77` (confirmación, con la pregunta re-abierta de si léxico-solo debería ser parte seria de la comparación, no solo un control).
