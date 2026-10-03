# Resultados de la evaluación empírica del RAG de tutelas — capítulo de tesis (`#78`)

> **Estado de este documento**: borrador auditable para el capítulo de resultados/discusión del trabajo de grado. Cita cada número por su commit de origen. Ningún resultado de aquí describe producción — todo se midió contra un corpus sintético, en un contenedor de evaluación aislado (`rag-eval-db`, local). Ver la sección "Sin afirmación de producción" al final.

## 0. Alcance de la evaluación

El sistema evaluado es el módulo `tutelas` de CORE (Enel Colombia): un pipeline de recuperación híbrida (vectorial + léxica + feedback) sobre una base de precedentes (`base_conocimiento_enel`), que alimenta un prompt estructurado para que un abogado redacte la contestación — nunca una generación automática end-to-end (ver sección 5).

La evaluación corrió en tres momentos con rigor creciente, y un cuarto momento no planeado que corrigió un error de los tres anteriores. Se presentan en ese orden, porque el orden importa para entender cuánto confiar en cada número.

---

## 1. Capa 1 — Correcciones de bugs (`#64`-`#67`): no son ganancia de benchmark

Cuatro bugs de `vectorService.js`/`chunkService.js` se corrigieron en la Fase 4, cada uno con su propio test de integración de regresión (ya existente en el PR correspondiente) como evidencia — **no una mejora de recall/nDCG**, porque el corpus sintético v1 (40 documentos) casi no contiene los casos borde que estos bugs afectan:

| Issue | Bug | Efecto medido en el arnés (corpus v1, 40 consultas) |
| --- | --- | --- |
| `#64` | `vectorService.js` no filtraba `is_active=FALSE` | Idéntico: 0.481/0.526 (ponderado), 0.464/0.514 (RRF) — el corpus no tiene documentos inactivos |
| `#65` | `ROW_NUMBER` eligiendo el chunk representante por `ts_rank` en vez de por el score híbrido completo | Idéntico en recall@5/nDCG@5 (0.481/0.526), pero el `.trec` cambió en los ranks 9-10 de 2 consultas — el fix sí mueve resultados reales, el corpus no tiene suficiente profundidad para que se note en el top-5 |
| `#66` | `chunkService.js` truncaba texto a 1500 caracteres y generaba chunks más grandes de lo prometido | Ponderado idéntico (0.481/0.526); RRF nDCG@5 0.514 → 0.515 (mejora marginal real, confirmada en el `.trec`, pero pequeña porque el corpus no tiene párrafos gigantes) |
| `#67` | Manejo de `documento_id IS NULL` en `PARTITION BY` y exclusión de IDs | Idéntico al estado post-`#66` — el corpus no tiene filas con `documento_id NULL` |

**Conclusión de esta capa**: se reportan como correcciones de corrección funcional (comportamiento correcto bajo casos borde reales de producción), nunca como mejora de calidad de retrieval. La ausencia de movimiento en el benchmark es evidencia de que el corpus sintético v1 no ejercita esos casos borde con suficiente frecuencia — una limitación del corpus, no una falta de efecto de los fixes en producción real.

---

## 2. Capa 2 — Exploratorio, generador de hipótesis (`#95`, `#98`; corpus v1, 40 consultas, qrels mecánicos)

Esta capa usó relevancia derivada mecánicamente de metadata (`categoria`/`subtema`/`base_normativa`), no juicio humano ni de IA sobre el contenido — sirve para generar hipótesis, no para afirmar nada.

**Hallazgos reportados, incluyendo los negativos** (compromiso explícito de la segunda opinión de Opus 5.5 en este issue: reportar lo que no confirma la hipótesis inicial, no solo lo que sí):

- **Negativo**: la normalización min-max de las señales de fusión (para corregir el desajuste de escala entre coseno de e5-small y `ts_rank`) **no mejoró** los resultados frente a usar los scores crudos con los mismos pesos fijos — contradice la hipótesis inicial de que el desajuste de escala era el problema (`#98`).
- **Inesperado**: la búsqueda léxica pura (`léxico-solo`) resultó sorprendentemente competitiva, superando en nDCG a la fusión completa con MiniLM (`#95`).
- **Positivo, con calificación**: `multilingual-e5-small` superó de forma consistente a `all-MiniLM-L6-v2` como modelo de embeddings, en ponderado y en RRF (`#98`).
- 62.3% de los chunks reales del corpus superan los 256 tokens de entrenamiento de SBERT de MiniLM — explica en parte por qué un modelo multilingüe más moderno (e5-small) rinde mejor, independientemente del idioma.

**Calificación obligatoria de esta capa**: toda conjetura sobre *por qué* pasa algo (p. ej. "la ganancia semántica probablemente está subestimada por la circularidad de los qrels mecánicos") se presenta como conjetura, nunca como hallazgo — no se midió.

---

## 3. Interludio — un hallazgo exploratorio que resultó ser un artefacto de medición (`#104`, `#106`)

Esta sección no estaba prevista en el alcance original de `#78`, pero es parte central de la historia metodológica del trabajo y se documenta con la misma honestidad que el resto.

Tras `#75` (pooling con qrels reales, ver sección 4), la conclusión de esa sesión fue que **la búsqueda léxica pura superaba con margen claro a cualquier fusión híbrida medida** (recall@5/nDCG@5 en test: léxico-solo 0.527/0.655 vs. e5-ponderado 0.456/0.561). Esa conclusión se investigó más a fondo (`#104`) y resultó estar **contaminada por dos bugs de medición**, no por un fenómeno real:

1. Los runs de `léxico-solo`/`vector-solo` no deduplicaban por documento (a diferencia de producción, que usa `ROW_NUMBER() PARTITION BY documento_id`) — inflaban su propio recall/nDCG contando el mismo documento repetido en el top-10.
2. Las filas de "fusión" de la comparación se habían corrido **con** un prefiltro de categoría (ver más abajo), mientras que léxico-solo/vector-solo se corrieron **sin** él — una comparación inválida, no una medición de "texto puro vs. fusión".

Al corregir ambos bugs y volver a medir, la fusión sin el prefiltro superaba a léxico-solo deduplicado en ambos splits (dev y test) y en ambas métricas. **El verdadero culpable no era el modelo de embeddings ni los pesos de fusión** (0.55 vector / 0.35 léxico / 0.10 feedback, nunca re-tuneados desde antes de introducir e5-small) — era que `buscarPonderado`/`buscarRRF` (`vectorService.js`) filtran de forma dura por la categoría que detecta `extraerDatosTutela` (keyword-matching sin scoring, primera coincidencia): si la categoría detectada tiene ≥3 documentos, el sistema **nunca ve nada fuera de esa categoría**, aunque el score híbrido de otro documento sea mejor.

Diagnóstico en dev (95 consultas), estratificado por cómo le fue al extractor de categoría en cada consulta:

| Grupo | Sin filtro | Filtro actual | Filtro-oráculo (categoría real) |
| --- | --- | --- | --- |
| Extractor devolvió `null` (43%) | 0.409/0.444 | idéntico (invariante verificado) | 0.922/0.899 |
| Extractor acertó (31%) | 0.478/0.555 | 0.857/0.892 | 0.857/0.892 |
| Extractor se equivocó (26%) | 0.488/0.558 | **0.000/0.000** | 0.909/0.897 |

El filtro-oráculo está inflado por construcción (los qrels mecánicos de dev exigen categoría igual como condición de relevancia, `eval/lib/qrels.js`) — no es una cota útil para decidir. Lo que sí importa: cuando el extractor se equivoca (1 de cada 4 consultas), el filtro lleva el recall a cero **siempre**. Se eliminó el prefiltro de la recuperación de producción (`#106`, PR #107) — `extraerDatosTutela`/`derecho_vulnerado` siguen existiendo para la etiqueta, analytics y la promoción al corpus, solo se desacoplaron de qué documentos se recuperan.

**Por qué esta sección importa para la tesis**: muestra el proceso real de la investigación — una conclusión exploratoria que parecía sólida (margen "claro" entre dos sistemas) resultó ser, en parte, un artefacto del arnés de medición. Se documenta en detalle (no se oculta) porque es evidencia de rigor metodológico, no una vergüenza a esconder: la corrección se encontró, se verificó de forma independiente dos veces, y se corrigió antes de construir ninguna afirmación confirmatoria sobre ella.

---

## 4. Capa 3 — La única afirmación citable (`#75`, `#76`, `#77`; split de test congelado, 25 consultas)

### 4.1 Etiquetado de relevancia (`#75`) — limitación declarada, no oculta

El split de test (25 de 120 consultas, congelado antes de ver resultados de ningún experimento — `eval/data/split.json`) tiene relevancia graduada (0-3) por **pooling** (top-10 de 6 sistemas candidatos, 408 pares consulta-documento) seguido de etiquetado.

**El etiquetado lo hizo IA, no una persona con criterio jurídico** — por instrucción explícita del autor, contradiciendo el diseño original de `#75` (que existía justamente para escapar de una verdad de referencia generada por IA). Mitigación aplicada: dos sesiones de IA completamente aisladas (sin memoria de la conversación, sin ver qué sistema recuperó cada documento) graduaron los 408 pares de forma ciega. Cohen's κ=0.895 entre ambas — pero esta cifra **vale menos que un κ humano**: dos instancias del mismo modelo, bajo el mismo rubro, convergen más entre sí que dos juristas independientes. Mide consistencia interna del modelo, no validez externa del etiquetado.

Esto es, en el fondo, relevancia derivada de un proceso automatizado — la circularidad que `#75` buscaba resolver **no está resuelta, cambió de forma** (de una regla mecánica basada en metadata a un juicio de IA sobre el contenido real). Es mejor que la regla mecánica (lee el contenido, detecta distractores) pero no equivale a criterio jurídico humano, y se reporta así en esta tesis: **como limitación conocida, no como validación independiente**.

Adicionalmente: de las 80 consultas nuevas que ampliaron el corpus a 120 (`#96`), la recomendación original (segunda opinión de Opus 5.5) pedía que al menos parte las parafraseara una persona sin mirar el corpus, para romper la circularidad de que consulta y relevancia salen del mismo proceso generativo. Esa tarea de parafraseo humano **no se hizo** — las 80 son 100% generadas por IA, igual que las 40 originales.

### 4.2 Pipeline de métricas formales (`#76`)

Se reemplazó el cálculo informal (`_sanity_metrics.mjs`, escrito solo para verificar que el arnés funcionaba de punta a punta) por `eval/scripts/04_evaluar.py`, usando [`ranx`](https://github.com/AmenRa/ranx) (Bassani, ECIR 2022, citable):

- Métricas: recall@5, recall@10, **nDCG@10 (primaria)**, MRR@10.
- Significancia: test de randomización de Fisher + **corrección de Holm-Bonferroni** (implementada a mano — `ranx` no la aplica nativamente).
- Intervalos de confianza por bootstrap (percentil 95%, 2000 resamples, por consulta).
- Validación cruzada obligatoria antes de confiar en resultados masivos: recall@5 recalculado a mano para consultas de muestra — 0 discrepancias en dev y en test.

### 4.3 Experimentos confirmatorios pre-registrados (`#77`)

**Pre-registro** (`eval/data/preregistro_77.md`, commit `5fcf772` en esta rama — `28ab3ed` en la rama original de `#77`), escrito y commiteado **antes** de ejecutar ningún cálculo sobre el split de test:

- **H1 (principal)**: `e5-small, ponderado, SIN el prefiltro de categoría` le gana a la línea base **real** de producción (`MiniLM, ponderado, CON el prefiltro`) — la afirmación central de la tesis.
- **H2 (secundaria)**: `e5-small, RRF, sin filtro` vs. `e5-small, ponderado, sin filtro` — qué fusión conviene, si H1 se confirma.
- **Control**: `léxico-solo` — sigue siendo competitivo tras corregir los bugs de `#104`.
- Pesos de fusión fijos (0.55/0.35/0.10, sin tuning sobre test). Métrica primaria única: nDCG@10. Holm sobre la familia completa de comparaciones.

**Resultado** (commit `ce4b464` en esta rama — `d827db8` en la rama original):

| Sistema | Recall@5 | Recall@10 | **nDCG@10** | MRR@10 |
| --- | --- | --- | --- | --- |
| MiniLM, filtro (producción real) | 0.418 [0.304, 0.534] | 0.473 [0.360, 0.590] | 0.507 [0.371, 0.641] | 0.684 [0.514, 0.844] |
| **e5-small, sin filtro (H1)** | 0.559 [0.465, 0.652] | 0.819 [0.730, 0.900] | **0.724** [0.644, 0.797] | 0.866 [0.749, 0.966] |
| e5-small, RRF, sin filtro (H2) | 0.541 [0.459, 0.633] | 0.789 [0.699, 0.868] | 0.689 [0.626, 0.751] | 0.893 [0.783, 0.980] |
| léxico-solo (control) | 0.525 [0.445, 0.609] | 0.762 [0.689, 0.828] | 0.687 [0.603, 0.766] | 0.889 [0.779, 0.980] |

- **H1 confirmada**: p_holm=0.0060 (nDCG@10), p_holm=0.0040 (recall@10) — significativo. No significativo en recall@5 (p_holm=0.456) ni MRR@10 (p_holm=0.159) con n=25.
- **H2 no confirmada**: p_holm=0.513 (nDCG@10) — sin evidencia para preferir RRF sobre ponderado.
- **Control, hallazgo honesto**: léxico-solo no difiere con significancia de e5-sin-filtro en nDCG@10 (p_holm=0.593) — **con 25 consultas no se puede afirmar que la fusión híbrida le gane a la búsqueda por texto puro**. Lo que sí es significativo: los tres candidatos sin prefiltro le ganan a la línea base con filtro.

**La afirmación real de esta tesis, con el respaldo estadístico que tiene y no más**: eliminar el prefiltro de categoría de la recuperación mejora el sistema de forma estadísticamente significativa (nDCG@10, recall@10) sobre lo que corre hoy en producción. La elección específica de modelo de embeddings y método de fusión, más allá de "alguna variante sin el prefiltro", **no está confirmada con la misma fuerza** — el control léxico-solo compite de cerca.

#### Erratum del control léxico-solo, corregido (`#113`)

La tabla de arriba es el resultado **tal como se pre-registró y se corrió originalmente** — se deja intacta por disciplina de auditoría. Pero el run `léxico-solo (control)` de esa tabla (`pool-lexico-solo.trec`) tenía un bug no detectado en ese momento: un documento repetido para la misma consulta queda, en `ranx` (`ranx/data_structures/run.py:285`), con el score de su **última** aparición en el archivo, no la mejor — corrompe su propio ranking en silencio. `#113` lo corrigió: se regeneró el control deduplicado (`00_ablation.js`, mismo patrón `ROW_NUMBER` que usa producción), se completó el etiquetado de los 17 pares (de 250, 6.8%) que el top-10 corregido traía y que nunca se habían pooleado en `#75` — extendiendo el mismo protocolo ciego (dos sesiones de IA aisladas, sin ver qué sistema recuperó cada documento; Cohen's κ=0.667 en este lote de 17, κ=0.852 combinado con los 81 pares originales de doble anotación) — y se repitió la medición con `qrels.trec` ya completo:

| Sistema | Recall@5 | Recall@10 | **nDCG@10** | MRR@10 |
| --- | --- | --- | --- | --- |
| MiniLM, filtro (producción real) | 0.410 [0.298, 0.529] | 0.465 [0.349, 0.581] | 0.498 [0.366, 0.632] | 0.684 [0.514, 0.844] |
| e5-small, sin filtro (H1) | 0.530 [0.444, 0.619] | 0.779 [0.688, 0.861] | 0.701 [0.620, 0.775] | 0.866 [0.749, 0.966] |
| e5-small, RRF, sin filtro (H2) | 0.510 [0.433, 0.593] | 0.758 [0.661, 0.841] | 0.673 [0.606, 0.738] | 0.893 [0.783, 0.980] |
| **léxico-solo, corregido y completo (control)** | 0.480 [0.386, 0.575] | 0.725 [0.627, 0.811] | **0.656** [0.552, 0.753] | 0.884 [0.767, 0.980] |

**El hallazgo central no cambia, y la evidencia detrás queda más fuerte, no más débil**: léxico-solo sigue sin diferir con significancia de e5-sin-filtro en nDCG@10 (p_holm=0.5535, antes 0.593 con el bug) — el empate técnico se sostiene con el control ya corregido y completamente etiquetado, no solo con la cota conservadora que dejó `#113` sin resolver. Detalle completo, con los 17 pares identificados y las dos anotaciones ciegas completas, en `eval/data/metricas_test_control_lexico_113.md`/`.json` y `eval/data/README.md`.

---

## 4.5 Capa 4 — Corpus v2 y barrido de pesos/modelo (`#115`, Fase D): por qué pierde la híbrida, y hasta dónde llega al corregirlo

Con el empate técnico de la sección 4 sin resolver, se investigó un "caso borde" reproducible donde la híbrida le gane claro al léxico — primero sobre el corpus v1 (`#114`, dos fases, agotó 3 hipótesis causales sin encontrar un mecanismo verificable), después sobre un **corpus v2 nuevo** (90 documentos, mismas 9 categorías/22 subtemas de v1, con negativos difíciles y variedad de estilo deliberados, estudio separado — números no comparables con `#77`/`#114`).

La línea base de v2 (MiniLM, pesos de producción) dio el resultado opuesto al buscado: léxico-solo le ganó a la híbrida con significancia (nDCG@10 p_holm=0.0015) — una brecha más clara que en v1. Un diagnóstico descartó que los negativos difíciles explicaran la pérdida (engañan más a léxico-solo, 5.2% de su top-10, que a la híbrida, 4.1% — justo como se diseñó). Segunda opinión de Opus: antes de poolear/etiquetar el test de v2 (caro) o cerrar la investigación, correr un barrido pre-registrado de peso vectorial (α: 0.0-1.0) × modelo (MiniLM / `multilingual-e5-small`) sobre dev, con una regla de parada escrita antes de correr nada (`eval/data/v2/preregistro_barrido_pesos.md`).

**Resultado del barrido, tal como se calculó originalmente** (ver erratum de código, corregido más abajo): con MiniLM, más peso vectorial siempre empeora el resultado. Con `e5-small`, la configuración `α=0.9` superó a léxico-solo por Δ=0.0746 en dev — por encima del umbral pre-registrado (0.02) — así que se congeló esa configuración puntual y se confirmó contra el **test de v1 ya etiquetado** (costo de etiquetado nuevo: cero): nDCG@10 0.706 [0.620, 0.784] vs. 0.656 [0.552, 0.753] de léxico-solo, mejor punto estimado pero **no significativo** (p_holm=0.1010, n=25).

#### Erratum (2026-10-03): corrección de código, post-auditoría adversarial

Después de mergear esta sección (PR #119), Alejandro pidió a un agente que intentara refutar activamente el análisis. La auditoría encontró dos problemas reales de código (detalle completo en el cierre de sesión de `#115`, PR #120), no solo de redacción:

1. `eval/scripts/v2_barrido_pesos.js` calculaba la señal vectorial con `embedding_local` solamente; producción (`vectorService.js:29`) usa `COALESCE(embedding_comprension, embedding_local)` — señal distinta a la de producción para 63/90 documentos de v2 y 25/40 de v1 (~70% de ambos corpus).
2. `eval/scripts/00_ablation.js` (usado para generar las referencias léxico-solo/vector-solo del barrido) tenía un bug de no determinismo ya corregido en producción desde `#95`: `ORDER BY score DESC` sin desempate secundario — no reproducible byte a byte entre corridas cuando hay documentos empatados en score (frecuente en léxico puro, donde no matchear ningún lexema da score=0).

Siguiendo el mismo precedente que `#113` (corregir el código y re-correr, no documentar la imprecisión como limitación y seguir), se corrigieron ambos scripts y se repitió el barrido completo sobre dev de v2 (61 consultas, libremente re-explorable) y la corrida confirmatoria sobre el test de v1 ya etiquetado (25 consultas, cero etiquetado nuevo):

| | Dev v2 — mejor config (e5-small, α=0.9) | Dev v2 — léxico-solo | Δ dev | Test v1 — e5-small, α=0.9 | Test v1 — léxico-solo | p_holm nDCG@10 (test v1) |
| --- | --- | --- | --- | --- | --- | --- |
| **Original (con el bug)** | 0.5653 | 0.4908 | 0.0746 | 0.706 [0.620, 0.784] | 0.656 [0.552, 0.753] | 0.1010 |
| **Corregido (erratum)** | **0.5724** | 0.4903 | **0.0821** | **0.723** [0.633, 0.803] | 0.656 [0.552, 0.753]¹ | **0.0630** |

¹ Léxico-solo no depende de la señal vectorial, así que el run de referencia (`#113`, ya deduplicado) no cambia con este erratum — se reutilizó sin recalcular.

**La conclusión cualitativa no cambia con el código corregido**: se verificó que `e5-small, α=0.9` sigue siendo el máximo de las 24 configuraciones del barrido (antes y después del fix), el barrido sigue disparando la regla de parada (Δ=0.0821 ≥ 0.02), y la corrida confirmatoria sobre el único test con relevancia real sigue sin alcanzar significancia con el test pre-registrado (Fisher + Holm, p=0.063 vs. umbral 0.05) — más cerca del umbral que antes (0.101), pero sin cruzarlo. **Los números originales (Δ=0.0746, nDCG@10=0.706, p_holm=0.101) quedan superados por los de esta tabla, no son una medición alternativa igualmente válida** — medían una señal vectorial distinta a la de producción y dependían de un orden no determinista en los empates.

**El límite real no era el corpus ni la imposibilidad de un caso borde — era el modelo de embeddings y los pesos de producción.** MiniLM (solo-inglés) sobre texto jurídico en español, con 55% de peso vectorial, resta en vez de sumar. Con el modelo multilingüe (e5-small) y un peso vectorial más alto (α=0.9, no 0.55), esta configuración puntual vuelve a tener el mejor punto estimado en dev y en el test de v1 — una propiedad de esa configuración específica, no una propiedad general de "la fusión híbrida" (un solo modelo por clase comparado, con factores confundidos entre datos de entrenamiento, prefijos `query:`/`passage:` de e5, y escala de los scores — ver limitación 9 abajo).

#### Análisis de potencia (erratum, números corregidos)

Recalculado con los per-query de la corrida confirmatoria corregida (t pareado, `scipy.stats.nct`, mismo método que la versión original): media de la diferencia pareada nDCG@10 = 0.0672 (antes 0.0507), sd=0.1697 (antes 0.1454), dz=0.3962 (antes 0.3487).

**Separación de los dos usos del umbral 0.02** (objeción aceptada de la revisión adversarial — el umbral que decide el barrido sobre dev y la "diferencia mínima clínicamente relevante" del cálculo de potencia son conceptualmente distintos y no deberían compartir el mismo número sin justificación aparte):

| Escenario | n necesario para potencia 80% (α=0.05, dos colas) |
| --- | --- |
| Efecto igual al observado (dz=0.396) | 52 (antes 67) |
| Efecto a la mitad del observado (dz=0.198) | 202 (antes 261) |
| **Diferencia mínima independiente de 0.05 nDCG@10** (no el 0.02 del barrido — ver nota abajo) | **93** (antes ~417, calculado incorrectamente con el 0.02 del barrido) |

El n=417 original mezclaba dos decisiones distintas bajo el mismo número 0.02: el umbral que decide si vale la pena confirmar un hallazgo del barrido (una elección operativa sobre datos de dev) no es automáticamente la diferencia mínima que esta tesis considera clínicamente/operativamente relevante para el sistema de recuperación. Usando en su lugar una diferencia mínima independiente de 0.05 nDCG@10 (más cercana a la magnitud observada en ambos splits), el n cae a 93 — sigue fuera de alcance para este trabajo de grado, pero un orden de magnitud más bajo que el 417 original.

**No se persigue esta pregunta con más datos** (ninguno de los tres escenarios es alcanzable en el tiempo de un trabajo de grado). Dos intervalos de confianza de la diferencia pareada, calculados sobre los mismos datos (objeción aceptada: reportar también el IC por t de Student, no solo el bootstrap, que es el más favorable de los dos):

- **IC95% bootstrap** (percentil, 2000 resamples): **[0.0047, 0.1336]** — excluye cero.
- **IC95% t de Student** (paramétrico, pareado): **[-0.0028, 0.1373]** — no excluye cero.

Los dos intervalos no coinciden en si excluyen cero — consistente con que el test de significancia pre-registrado (Fisher + Holm, no bootstrap ni t) es el que de hecho decide esta pregunta, y ese test da p=0.063, **no significativo**. No se declara "no-inferioridad" en el sentido formal del término (un margen de no-inferioridad debe fijarse *antes* de ver los datos, y este proyecto nunca pre-especificó uno) — se reporta la estimación del efecto con su incertidumbre, sin más.

**Sobre qué hacer con esta evidencia**: dado que la superioridad de la híbrida (e5-small, α=0.9) no está confirmada con significancia, y que léxico-solo es la alternativa más simple y barata (no requiere un modelo de embeddings adicional ni sus costos de cómputo), el argumento de parsimonia favorece *quedarse* con léxico-solo salvo razón adicional para adoptar la híbrida — no al revés. El punto estimado y el IC bootstrap (que excluye cero) son esa posible razón adicional, pero no alcanzan el umbral de significancia que este proyecto fijó de antemano para decidir.

**Chequeo adicional exploratorio, no una segunda confirmación** (objeción aceptada: dev/test de v2 comparten el mismo corpus de 90 documentos, y el diagnóstico de contaminación ya había mirado las 85 consultas completas antes — "dos diseños independientes" exageraba la independencia real): sobre v2-test (24 consultas, relevancia **mecánica**, no etiquetado ciego), la misma comparación dio p_holm=0.0005. Se reporta en el anexo de `eval/data/v2/README.md` como anexo exploratorio con instrumento de medición más débil (relevancia mecánica por categoría+subtema, no lectura del texto) — **la conclusión principal de esta sección se apoya únicamente en el test de v1 (n=25, etiquetado ciego real)**, no en este chequeo.

**Hipótesis, no hallazgo firme** (objeción aceptada: un solo modelo por clase comparado, con factores confundidos): el modelo de embeddings podría importar más que la elección de pesos de fusión en este dominio — con MiniLM (entrenado solo en inglés) sobre texto jurídico en español, más peso vectorial siempre empeoró el resultado en ambos corpus; con `multilingual-e5-small`, la fusión volvió a tener sentido. Esto es consistente con los datos disponibles, pero no se probó controlando otros factores (datos de entrenamiento de cada modelo, prefijos `query:`/`passage:` específicos de e5, escala relativa de los scores de cada modelo) — queda como hipótesis para trabajo futuro, no como conclusión de esta tesis.

Detalle completo, con la curva de 24 configuraciones corregida y el chequeo exploratorio de v2-test, en `eval/data/v2/README.md` y `eval/data/v2/preregistro_barrido_pesos.md`.

---

## 5. Nomenclatura: "RAG con generación mediada por humano"

Este sistema se documenta como **"RAG con generación mediada por humano"** (retrieve-then-read con generación externa validada), explícitamente **no** "RAG automatizado end-to-end". El backend nunca se conecta a una API de LLM (externa ni local) — genera un prompt estructurado a partir de los precedentes recuperados, el abogado lo copia a una herramienta corporativa aprobada, y pega el resultado de vuelta para revisión y envío.

Esta decisión de diseño es deliberada, no una limitación técnica a resolver después:

- **Cumplimiento**: las respuestas a tutelas y derechos de petición son actos jurídicos con consecuencias legales reales — un LLM externo generando contestaciones sin revisión humana sería un riesgo regulatorio y profesional inaceptable para una compañía del tamaño de Enel.
- **Control de costos**: no hay costo de inferencia de LLM por request en el backend — el costo de generación lo absorbe la herramienta corporativa que el abogado ya tiene licenciada.
- **No depender de una API externa de LLM**: el sistema de recuperación (lo que esta tesis evalúa) sigue funcionando aunque la herramienta de LLM corporativa cambie, se caiga, o se discontinúe — el acoplamiento es deliberadamente débil.

**Consecuencia directa para el alcance de esta evaluación**: todo lo medido en este capítulo es la calidad del *retrieval* (qué tan buenos son los precedentes que el sistema sugiere), nunca la calidad de la *generación final* (lo que el abogado obtiene de la herramienta corporativa externa tras pegar el prompt) — esa generación está, por diseño, fuera del control y de la medición de este sistema.

---

## 6. Limitaciones (declaradas, no escondidas)

1. **Corpus 100% sintético** (`#74`, `#96`) — amenaza directa a la validez externa. Los 40 documentos y las 120 consultas son generados por sub-agentes de IA, calibrados por patrones estructurales de documentos reales que el autor compartió como archivos locales (nunca copiando datos identificables, verificado de forma independiente). Que estos resultados generalicen a casos reales de Enel es una limitación declarada, no algo demostrado — ningún agente de esta investigación se conectó nunca a la base de datos de producción para verificarlo (regla dura del protocolo, `RAG-00`).
2. **Tamaño de muestra del split de test**: 25 consultas. Da poder estadístico real para la métrica primaria (nDCG@10, H1 confirmada), pero insuficiente para varias comparaciones secundarias (H2, control) y para recall@5/MRR@10 en general — reportado honestamente como "no significativo", no omitido.
3. **Etiquetado de relevancia del split de test hecho por IA** (`#75`), no por una persona con criterio jurídico, por decisión explícita del autor — ver sección 4.1.
4. **Parafraseo humano de las consultas nuevas, pendiente** (`#96`) — las 80 consultas que ampliaron el corpus de 40 a 120 son 100% generadas por IA; la mitigación de circularidad recomendada (que una persona parafraseara al menos parte sin ver el corpus) no se ejecutó.
5. **Solo se mide retrieval, no generación** — ver sección 5. La calidad final de la contestación que el abogado produce con ayuda de la herramienta corporativa de LLM está fuera del alcance de esta evaluación.
6. **Sesgo residual en el pool de `#75` por el bug de duplicados de `#104`, ya resuelto (`#113`)**: `#106` solo había revisado el top-5 (0.8% de pares sin juicio, considerado despreciable); el top-10 completo del run corregido tenía en realidad 17/250 pares (6.8%) sin etiquetar — `#113` completó ese etiquetado con el mismo protocolo ciego de `#75` y recalculó el control léxico-solo (ver sección 4.3) — el empate con la híbrida se sostiene con el número ya corregido y completo, no con una cota conservadora.
7. **El modelo de embeddings específico (e5-small) no está confirmado con la misma fuerza que "eliminar el prefiltro"** — ver sección 4.3, el control léxico-solo compite de cerca con la fusión completa en el split de test.
8. **El límite de potencia estadística de la limitación 2 se cuantificó explícitamente** (`#115`, sección 4.5, números corregidos por el erratum del 2026-10-03): el n necesario para detectar con 80% de potencia una diferencia mínima independientemente justificada de 0.05 nDCG@10 es 93 consultas — fuera de alcance para un trabajo de grado, aunque un orden de magnitud por debajo de la cifra original (417), que mezclaba sin justificación aparte el umbral de decisión del barrido con la diferencia mínima del cálculo de potencia (objeción O4b de la revisión adversarial, aceptada). Esta pregunta (¿la híbrida le gana al léxico?) no se persigue con más datos, y se reporta como estimación del efecto con intervalos de confianza (bootstrap y t de Student, que no coinciden en si excluyen cero) — no como no-inferioridad formal (nunca se pre-especificó un margen antes de ver los datos) ni como superioridad confirmada o descartada.
9. **Nunca se midió el acuerdo (Cohen's κ) entre la relevancia mecánica** (`gradoRelevancia`, `eval/lib/qrels.js` — deriva de categoría+subtema, no lee el texto) **y el etiquetado real por IA** (el protocolo ciego de `#75`/`#113`). Es un chequeo barato pendiente, no bloqueante: si la relevancia mecánica estuviera sistemáticamente sesgada hacia alguno de los sistemas comparados, los chequeos "gratuitos" que la usan (como el anexo exploratorio de v2-test en la sección 4.5) perderían validez — aunque la conclusión principal de esta tesis nunca dependió de ellos, solo del etiquetado ciego real en el test de v1.

## 7. Sin afirmación de producción

Nada de lo medido en este capítulo describe el sistema que usa Enel hoy. El código corregido (`#104`→`#106`) vive en la rama `rag/integracion`, no en `main` — Railway, donde corre la instancia real, solo despliega desde `main`. La promoción de `rag/integracion` a `main` es una decisión exclusiva del autor (como responsable técnico del sistema en producción), tomada por fuera de este protocolo de investigación, con backup previo y sin agentes de IA ejecutando el paso final. Esta tesis puede afirmar **"esto mejora el sistema medido en un entorno de evaluación aislado, con significancia estadística real sobre el split de test"** — no puede afirmar **"esto ya mejora el sistema que usa Enel"**.

---

## Anexos (auditabilidad para el jurado)

- **Configuraciones de experimentos**: `eval/experimentos.json` — cada experimento referenciado en este capítulo tiene su `id` ahí.
- **Commits exactos de cada hallazgo**:
  - `#95`/`#98` (exploratorio, corpus v1): ver PRs #97, #99.
  - `#75` (pooling + etiquetado): commits `d8d0ba8`, `890c730`.
  - `#104` (corrección de medición): commit `0a6a09e` (PR #105).
  - `#106` (eliminación del prefiltro): commit `edef4ca` (PR #107).
  - `#76` (pipeline `ranx`): commit `1a24ca8` (PR #109).
  - `#77` (pre-registro + confirmatorio): commits `28ab3ed`, `d827db8` (PR #110).
- **Proceso de etiquetado**: `eval/data/README.md` (sección "Pooling y etiquetado"), `eval/data/grados_anotador1.csv`, `eval/data/grados_anotador2.csv`, `eval/scripts/03b_pool_etiquetado.js`, `03c_cohen_kappa.js`, `03d_fusionar_qrels.js`.
- **Pre-registro de `#77`**: `eval/data/preregistro_77.md` — hipótesis, sha256 de cada archivo, fijados antes de tocar test.
- **Reproducir cualquier número de este capítulo**: cada archivo `.meta.json` en `eval/data/runs/` trae `git_sha`, `embedding_model` y `corpus_sha256` — auditable byte a byte.
