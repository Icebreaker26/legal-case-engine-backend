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
  - `E03`-`E06-*.trec`/`.meta.json` — diagnóstico de `#106` (sin filtro / filtro actual / filtro-oráculo de categoría, e5-small y MiniLM) sobre las 120 queries. Experimentos correspondientes en `experimentos.json`.
- `metricas_dev.md`/`.json` — salida de `eval/scripts/04_evaluar.py` (`#76`): métricas formales + significancia (Holm) + IC bootstrap sobre el split dev. Reproducible con el comando documentado en la sección de `#76` más abajo.

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

### ⚠️ Corrección (`#104`, 2026-10-03): la tabla original de esta sección estaba mal — no es "léxico le gana a la fusión"

La primera versión de esta sección (ver historial de git) publicó una tabla comparando `léxico-solo`/`vector-solo` **sin** el prefiltro de categoría contra `ponderado`/`RRF` **con** el prefiltro de categoría — una comparación inválida, no un hallazgo sobre fusión vs. texto puro. Además, los runs de `léxico-solo`/`vector-solo` no deduplicaban por documento (`ROW_NUMBER` como sí hace producción), así que su propio recall/nDCG estaba inflado por documentos repetidos en el top-10. Detalle completo, con la evidencia que lo prueba (conteo de líneas por archivo, recálculo con y sin dedup), en `#104`.

Tabla corregida — recall@5/nDCG@5 con qrels reales (test) y mecánicos (dev), todo deduplicado por documento:

| Sistema | Prefiltro categoría | Dev (95) Recall@5/nDCG@5 | Test (25) Recall@5/nDCG@5 |
| --- | --- | --- | --- |
| MiniLM ponderado (producción actual) | sí (14/40 aciertos en dev) | 0.413 / 0.431 | 0.418 / 0.528 |
| e5-small ponderado | sí | 0.438 / 0.464 | 0.456 / 0.561 |
| e5-small RRF | sí | 0.437 / 0.440 | 0.453 / 0.544 |
| léxico-solo, deduplicado | no | 0.426 / 0.487 | 0.505 / 0.612 |
| vector-solo e5, deduplicado | no | 0.371 / 0.410 | 0.499 / 0.598 |
| **e5-small ponderado-normalizado, SIN prefiltro** | **no** | **0.456 / 0.509** | **0.559 / 0.641** |

(Los valores de léxico-solo/vector-solo difieren de la tabla original no solo por el dedup: el script que generó esos dos runs para el pool de 120 consultas nunca se commiteó, así que no es reproducible — los valores de esta tabla salen de `eval/scripts/00_ablation.js`, que ya está corregido con el mismo patrón de dedup que producción, corriendo con `--corpus eval/data/corpus.jsonl --queries eval/data/queries.jsonl`.)

**La fusión sin prefiltro de categoría le gana a léxico-solo deduplicado en ambos splits y en ambas métricas.** El hallazgo real no es "texto puro > fusión híbrida" — es que el prefiltro de categoría (`extractorService.js`, acierta 14/40 en dev, null en 19, se equivoca en 7) está perjudicando a la fusión de forma artificial, devolviendo solo 3-6 documentos de esa categoría cuando dispara mal. Ver `#104` para la propuesta de siguiente paso (replantear el prefiltro, no los pesos de fusión).

**Advertencia sobre el pool de `#75` — resuelta en `#106`**: `pool-lexico-solo.trec`/`pool-e5-vector-solo.trec` (los archivos originales, con el bug de duplicados) podían haber excluido del pool algún documento que el top-10 real (deduplicado) sí incluye. Chequeo hecho en `#106`: de los 125 pares en el top-5 de test para léxico-solo/vector-solo deduplicados, solo **1 (0.8%)** no estaba en el pool de 408 pares ya etiquetado — prácticamente 0. No hizo falta re-poolear ni re-etiquetar.

## Eliminación del prefiltro de categoría de la recuperación (`#106`, 2026-10-03)

El defecto real detrás de la brecha que corrigió `#104` no son los pesos de fusión — es que `buscarPonderado`/`buscarRRF` (`vectorService.js`) **filtran** por la categoría que detecta `extraerDatosTutela` (keyword-matching ingenuo, sin scoring): si la categoría tiene ≥3 documentos, el sistema nunca ve nada fuera de ella, aunque el score híbrido de otro documento sea mejor.

Diagnóstico en dev (95 consultas, e5-small ponderado), estratificado por cómo le fue al extractor en cada consulta:

| Grupo (n) | Sin filtro | Filtro actual | Filtro-oráculo (categoría real) |
| --- | --- | --- | --- |
| extractor devolvió `null` (41) | 0.409 / 0.444 | **idéntico** (invariante verificado ✓) | 0.922 / 0.899 |
| extractor acertó (29) | 0.478 / 0.555 | **0.857 / 0.892** | 0.857 / 0.892 |
| extractor se equivocó (25) | 0.488 / 0.558 | **0.000 / 0.000** | 0.909 / 0.897 |

Total dev: sin filtro 0.451/0.508 vs. filtro actual 0.438/0.464. Modo DIS (el más adversarial): 0.579/0.563 vs. 0.470/0.459.

**El filtro-oráculo está inflado por construcción, no es una cota útil para decidir**: `eval/lib/qrels.js` exige categoría igual como condición necesaria de relevancia (`if (query.spec.categoria !== doc.categoria) return 0`), así que filtrar por la categoría real nunca puede descartar un documento relevante bajo esta regla — es circular, confirma que la categoría es señal útil *si fuera perfecta*, no que valga la pena filtrar con un extractor que se equivoca 1 de cada 4 veces.

**Decisión**: se elimina el filtro de categoría de la recuperación de producción (4 llamadas a `recuperarPrecedentes` en `tutelaController.js`, antes pasaban `categoria: derecho_vulnerado`). `extraerDatosTutela`/`derecho_vulnerado` siguen existiendo sin cambios para la etiqueta, analytics y la promoción a `base_conocimiento_enel` — solo se desacopla de qué documentos se recuperan. `vectorService.js` y el arnés de eval mantienen el parámetro `categoria` intacto (lo sigue usando `04_correr.js` para experimentos futuros, incl. este mismo diagnóstico, reproducible con los experimentos `E03`-`E06` de `experimentos.json`).

**Chequeo de no-inversión (MiniLM, modelo actual de producción)**: sin filtro 0.389/0.439 vs. filtro actual 0.413/0.431 — mixto (recall favorece mantener el filtro, nDCG favorece quitarlo), más débil que con e5 pero no se invierte.

**Fuera de alcance de `#106`** (issues de seguimiento): arreglos del extractor en sí (el `SELECT` de categorías no tiene `ORDER BY`, el regex de keywords no escapa caracteres especiales, `\b` no es Unicode-aware), el lazo de retroalimentación etiqueta↔corpus, y el re-tuneo de los pesos de fusión 0.55/0.35/0.10.

## Pipeline de métricas formales con `ranx` (`#76`, 2026-10-03)

`eval/scripts/04_evaluar.py` (Python, entorno aislado en `eval/.venv/` — ver `eval/requirements.txt`, nunca mezclado con las dependencias de producción) reemplaza al script informal `_sanity_metrics.mjs` para resultados citables:

- **Métricas**: recall@5, recall@10, nDCG@10 (primaria), MRR@10.
- **Significancia**: test de randomización de Fisher (`ranx`), con **corrección de Holm-Bonferroni implementada a mano** — `ranx` no la aplica nativamente, solo da p-valores crudos por par.
- **Intervalos de confianza**: bootstrap por consulta (percentil 95%, 2000 resamples).
- **Validación cruzada obligatoria**: antes de confiar en los resultados, el script recalcula recall@5 "a mano" (sin `ranx`) para 3 consultas de muestra y aborta si no coincide exactamente. Confirmado: coincide dígito a dígito.
- **Guardrail de test**: corre sobre `--subset dev` por default; `--subset test` exige el flag explícito `--confirmo-uso-de-test`, para que tocar el split congelado sea una decisión deliberada, no un default accidental.

Reproducir la tabla de dev:
```bash
python -m venv eval/.venv
eval/.venv/Scripts/python.exe -m pip install -r eval/requirements.txt   # Windows; eval/.venv/bin/python en Unix
eval/.venv/Scripts/python.exe eval/scripts/04_evaluar.py --subset dev \
  --runs minilm-filtro=eval/data/runs/pool-minilm-ponderado.trec \
         minilm-sin-filtro=eval/data/runs/E06-minilm-ponderado-sin-filtro.trec \
         e5-filtro=eval/data/runs/pool-e5-ponderado.trec \
         e5-rrf=eval/data/runs/pool-e5-rrf.trec \
         e5-sin-filtro=eval/data/runs/pool-e5-ponderado-normalizado.trec
```

**⚠️ Corrección (`#113`, 2026-10-03): la afirmación "ranx es inmune al bug de duplicados" de esta sección era incompleta.** `ranx` no cuenta un documento repetido dos veces (correcto), pero en `ranx/data_structures/run.py:285` (`run[q_id][doc_id] = float(rel)`, ejecutado en orden de archivo) **se queda con el score de la última aparición del documento en el archivo, no la mejor** — corrompe el ranking efectivo de cualquier documento repetido. Verificado con `pool-lexico-solo.trec` (nunca corregido, por la razón documentada arriba): el control de la corrida confirmatoria de `#77` está midiéndose con este problema. Detalle completo, con el impacto cuantificado en dev y test, en `#113`.

**Resultado en dev (95 consultas), con significancia real** — ver `eval/data/metricas_dev.md`/`.json` para el detalle completo:

| Sistema | recall@5 | recall@10 | nDCG@10 | MRR@10 |
| --- | --- | --- | --- | --- |
| MiniLM, filtro (producción actual) | 0.413 [0.342, 0.486] | 0.471 [0.396, 0.542] | 0.456 [0.384, 0.530] | 0.584 [0.499, 0.672] |
| MiniLM, sin filtro | 0.389 [0.347, 0.432] | 0.551 [0.505, 0.597] | 0.515 [0.473, 0.557] | 0.748 [0.676, 0.814] |
| e5-small, filtro | 0.438 [0.368, 0.509] | 0.526 [0.452, 0.599] | 0.502 [0.430, 0.574] | 0.618 [0.530, 0.704] |
| e5-small, RRF, filtro | 0.437 [0.365, 0.509] | 0.523 [0.451, 0.596] | 0.477 [0.406, 0.553] | 0.562 [0.477, 0.650] |
| **e5-small, ponderado, SIN filtro** | **0.456** [0.414, 0.498] | **0.621** [0.581, 0.660] | **0.584** [0.540, 0.626] | **0.808** [0.743, 0.868] |

`e5-sin-filtro` le gana a la línea base de producción (MiniLM con filtro) de forma estadísticamente significativa (Holm) en recall@10, nDCG@10 y MRR@10 — no en recall@5 (p_holm=1.000, no significativo con este tamaño de muestra). Confirma con rigor lo que `#104`/`#106` ya habían encontrado por diagnóstico.

## Experimentos confirmatorios pre-registrados (`#77`, 2026-10-03)

Pre-registro completo (hipótesis, configuraciones exactas, sha256 de cada archivo, antes de correr nada) en `eval/data/preregistro_77.md`, commiteado en un commit propio antes de tocar el split de test. Resultado en `eval/data/metricas_test_confirmatorio.md`/`.json` (25 consultas de test, qrels reales de `#75`).

| Sistema | Recall@5 | Recall@10 | **nDCG@10 (primaria)** | MRR@10 |
| --- | --- | --- | --- | --- |
| MiniLM, ponderado, CON filtro (producción real) | 0.418 | 0.473 | 0.507 | 0.684 |
| **e5-small, ponderado, SIN filtro (H1)** | 0.559 | 0.819 | **0.724** | 0.866 |
| e5-small, RRF, SIN filtro (H2) | 0.541 | 0.789 | 0.689 | 0.893 |
| léxico-solo (control) | 0.525 | 0.762 | 0.687 | 0.889 |

- **H1 CONFIRMADA**: `e5-small ponderado sin filtro` le gana a la línea base real de producción con significancia (Holm) en nDCG@10 (p=0.0060), recall@10 (p=0.0040) — no en recall@5 ni MRR@10 con este tamaño de muestra (25 consultas). La afirmación central de la tesis ("la configuración propuesta mejora lo que hay hoy en producción") queda confirmada en la métrica primaria.
- **H2 NO CONFIRMADA**: RRF vs. ponderado (ambos e5-small sin filtro) no difieren con significancia en ninguna métrica (nDCG@10 p_holm=0.513) — no hay evidencia para preferir RRF sobre ponderado; se recomienda quedarse con ponderado (más simple, punto estimado más alto).
- **Control, hallazgo honesto**: léxico-solo **no difiere con significancia** de `e5-small sin filtro` en nDCG@10 (p_holm=0.593) — con 25 consultas, no se puede afirmar que la fusión híbrida le gane a la búsqueda léxica pura. Lo que sí es significativo: **los tres candidatos sin el prefiltro (e5-ponderado, e5-RRF, léxico-solo) le ganan a la línea base de producción** — el prefiltro de categoría, no la elección de fusión, es la mejora confirmada con más fuerza.

## Fase A — dónde diverge realmente la híbrida de la búsqueda léxica (`#114`, 2026-10-03)

El empate técnico de `#77` (sujeto a la fe de erratas de `#113`) motivó buscar el "caso borde" real entre fusión híbrida y léxico-solo. En vez de confiar en la etiqueta de "modo" que puso el generador de consultas (PARA/SEM/LEX/NOKW/DIS), se midieron dos variables continuas por consulta sobre dev (95 consultas, sin generar nada nuevo):

- **Solapamiento léxico real**: cuánto del vocabulario de la consulta (ponderado por IDF sobre el corpus real, mismo stemmer `to_tsvector('spanish')` que producción) aparece en el texto de sus documentos relevantes. No es lo mismo que la etiqueta "SEM" — hay consultas SEM con solapamiento alto y PARA con solapamiento bajo.
- **Desacuerdo vector/léxico**: cuánto se superponen (Jaccard) el top-10 de vector-solo (e5-small) y el de léxico-solo, por consulta.

`eval/scripts/05_solapamiento_lexico.js` calcula la primera; combinado con los runs deduplicados para la segunda (`eval/data/fase_a_analisis_completo.json`, 95 filas, no versionado por tamaño — regenerable).

**Resultado — las dos variables predicen el margen real de la híbrida mejor que el modo del generador:**

| Variable | Correlación con (nDCG@10 híbrida − nDCG@10 léxico) |
| --- | --- |
| Solapamiento léxico real | **−0.232** (a menor solapamiento, mayor ventaja de la híbrida) |
| Desacuerdo vector/léxico | **+0.252** (a mayor desacuerdo, mayor ventaja de la híbrida) |
| Longitud de la consulta | −0.322 (consultas más largas favorecen al léxico — confunde con el modo) |

Estratificado por cuartil de solapamiento léxico real: Q1 (más bajo, 0.02-0.17) → diff = **+0.063**; Q2-Q4 → +0.017 a +0.023 (la ventaja se concentra casi toda en el cuartil de menor solapamiento). Estratificado por desacuerdo vector/léxico: Q4 (más alto, 0.75-0.89) → diff = **+0.085**; Q1-Q3 → +0.003 a +0.016.

**La "esquina" (solapamiento bajo ∩ desacuerdo alto, 28 de 95 consultas de dev) da diff promedio +0.067**, con casos individuales de hasta +0.46 (`Q-NOKW-108`, `Q-NOKW-107`) — mayormente en modo NOKW y SEM, pero no todas las consultas de esos modos caen en la esquina (de ahí que el promedio por modo se vea diluido).

**vector-solo (e5, sin nada de léxico) pierde contra léxico-solo en absolutamente todos los cuartiles** (diff entre −0.009 y −0.056) — refuerza la reformulación aceptada: la ventaja de la híbrida viene de **complementariedad** (la fusión aprovecha desacuerdo entre señales), nunca de que el vector por sí solo sea mejor.

**Decisión empírica sobre qué "híbrida" perseguir** (reemplaza la pregunta abierta de `#114`): la fórmula de producción (`E03`, scores crudos, sin normalizar) tiene correlaciones más fuertes y limpias que la normalizada (−0.232/+0.252 vs. −0.113/+0.192) y es más estable frente a léxico (sd=0.092 vs. 0.133, de `#76`) — **se recomienda `E03` como la variante a optimizar**, no la normalizada que se usó en `#77`.

**Siguiente paso**: Fase B (`#114`) — en vez de depender de la variación natural entre consultas (todavía ruidosa incluso en la esquina), diseñar un piloto de perturbación pareada usando estos dos criterios medibles (no la etiqueta de modo) para elegir qué consultas de dev perturbar.

## Fase B — piloto de perturbación pareada: resultado nulo (`#114`, 2026-10-03)

Siguiendo la Fase A, se diseñó un piloto para medir si la ventaja de la híbrida (`E03`) se sostiene cuando se le quita deliberadamente el solapamiento léxico a una consulta, manteniendo el mismo `spec` (misma necesidad de información, mismos qrels mecánicos heredados sin re-etiquetar).

**Método**: se tomaron las 23 consultas de dev con mayor solapamiento léxico real (≥0.42, de la Fase A) y se reescribió cada una (Versión B) evitando el vocabulario compartido con sus documentos relevantes, verificado computacionalmente con el mismo script de la Fase A — no a ojo. Reducción promedio del solapamiento: de 0.533 (A) a 0.274 (B), 49% (`eval/data/fase_b_verificacion.json`, 23 pares; algunos pares solo bajaron 12-24% porque el vocabulario compartido restante eran palabras funcionales del español — "nadie", "tiempo", "hacer" — con IDF inflado artificialmente por el tamaño pequeño del corpus, 40 documentos; **limitación metodológica a corregir en la Fase C** con una medida de solapamiento restringida a palabras de contenido).

Se corrieron ambas versiones (A y B) contra léxico-solo (dedup) y la híbrida `E03` (ponderado, scores crudos, sin filtro — la ganadora de la Fase A), y se midió la **interacción**: [nDCG(A) − nDCG(B)]_léxico − [nDCG(A) − nDCG(B)]_híbrida. Positivo significa que la híbrida aguanta mejor que el léxico cuando se le quita el vocabulario.

**Resultado (`eval/data/fase_b_resultado.json`, n=23): la interacción es prácticamente nula.**

| | media | sd | 
| --- | --- | --- |
| Caída léxico (A→B) | +0.188 | 0.240 |
| Caída híbrida (A→B) | +0.178 | 0.253 |
| **Interacción** | **+0.009** | 0.110 |

t-test de la interacción contra 0: t=0.412, p=0.684 — no significativo. `dz`=0.086 — un efecto de ese tamaño necesitaría **~1062 consultas** para detectarse con potencia 80%, inviable.

**Esto contradice, a nivel de intervención causal, el hallazgo correlacional de la Fase A** (donde las consultas de bajo solapamiento *natural* sí mostraban ventaja para la híbrida). Léxico y la híbrida caen prácticamente lo mismo cuando se les quita el vocabulario compartido — la híbrida no actúa como una "red de seguridad semántica" cuando el léxico pierde su señal, al menos no de la forma en que se perturbó acá. Hay variación enorme por consulta individual (interacción entre −0.27 y +0.16) — algunas perturbaciones ayudan a la híbrida, otras la perjudican más que al léxico.

**Interpretación, sin forzar una conclusión que los datos no dan**: o (a) el efecto correlacional de la Fase A viene de un factor confundido con el solapamiento léxico natural (no de una relación causal simple "bajale el léxico y gana el vector"), o (b) la perturbación de este piloto, al reescribir tanto, diluyó también la fidelidad semántica que el vector necesita (no solo quitó vocabulario superficial), o (c) el modelo de embeddings (e5-small) no es tan robusto a paráfrasis fuerte en este dominio como se asumía. Las tres son candidatas razonables — no hay evidencia todavía para elegir entre ellas.

**No se avanza a la Fase C con este diseño.** Antes de generar un split de test nuevo, hay que resolver por qué el piloto no replica el hallazgo correlacional — es un paso de diagnóstico adicional, no un fallo del plan original.

## Estado y siguiente paso (actualizado 2026-10-03)

Fase 4 (`#64`-`#67`), `#95`, `#98`, `#96`, `#75`, `#104`, `#106`, `#76`, `#77`, Fase A y Fase B de `#114` completos. Cadena de hallazgos de la sesión: el prefiltro de categoría —no los pesos de fusión ni el modelo de embeddings— era la causa real de la brecha medida en `#75`; confirmado con significancia estadística real en test; el control léxico de esa confirmación tiene un problema de medición pendiente (`#113`); la correlación de la Fase A (la ventaja de la híbrida se concentra en consultas de bajo solapamiento léxico y alto desacuerdo vector/léxico) **no se replicó como efecto causal** en el piloto de perturbación pareada de la Fase B (interacción nula, p=0.684) — sigue sin resolverse si hay un caso borde real y exploitable, o si el hallazgo correlacional viene de un confusor. Sigue `#78` — documentar las 3 capas de evidencia para la tesis (diagnóstico en dev → confirmación en test → limitaciones: etiquetado por IA de `#75`, tamaño de muestra de 25 consultas en test, vistazos a test declarados en `preregistro_77.md`). Decisión pendiente, solo de Alejandro: promover `rag/integracion` → `main` (prefiltro ya eliminado ahí). Sobre el modelo de embeddings: en dev, e5-small-sin-filtro superó con significancia a MiniLM-sin-filtro (`#76`, p_holm=0.0000 en nDCG@10) — swap de modelo con soporte propio, no solo "efecto del filtro"; MiniLM-sin-filtro no se incluyó en la corrida confirmatoria de `#77` (no estaba en H1/H2/control), así que ese swap específico queda respaldado por dev, no confirmado en test todavía.
