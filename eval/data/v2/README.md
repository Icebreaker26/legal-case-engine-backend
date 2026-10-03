# eval/data/v2/ — corpus v2 (Fase D, `#115`)

**Estudio separado de `eval/data/` (corpus v1)** — números no comparables entre sí. `#114` (Fases A y B) agotó 4 hipótesis buscando un "caso borde" reproducible donde la fusión híbrida le gane claro a la búsqueda léxica sobre el corpus v1 (40 documentos, 9 categorías), sin éxito. El propio `#115` diagnostica por qué: con 40 documentos el top-10 ya cubre el 25% del corpus (~4.7 relevantes por consulta en promedio) y recall@10 anda en 0.76-0.82 — nDCG@10 tiene poco margen para separar sistemas sin importar cuántas consultas nuevas se generen *sobre el mismo corpus*. La Fase D construye un corpus nuevo, deliberadamente más difícil de separar léxicamente, para intentar encontrar ese caso borde.

Decisiones de alcance tomadas con Alejandro antes de generar nada: tamaño notablemente mayor que v1 (~80-100 docs, no ~40-50), reusar las 9 categorías/22 subtemas ya existentes de `categorias.json` (no una taxonomía nueva), y limitar esta sesión a **diseñar + generar + verificar el corpus y congelar su split dev/test** — indexar, poolear, etiquetar (protocolo ciego de `#75`) y correr la comparación confirmatoria quedan para sesiones futuras.

## Archivos

- `corpus_v2.jsonl` — **90 documentos**, mismo `DocSchema` de `eval/schema.js` (sin cambios al schema). Validado: 0 errores.
- `queries_v2.jsonl` — **85 consultas**, mismo `QuerySchema`. Validado: 0 errores.
- `categorias_v2.json` — copia exacta de `eval/data/categorias.json` (misma taxonomía de las 9 categorías y sus `palabras_clave`).
- `split_v2.json` — split dev/test congelado (24 test / 61 dev), muestreo sistemático por categoría (stride uniforme, no al azar) — ver el campo `_comentario` del archivo.
- `qrels_v2.trec` — relevancia mecánica (grados 0/1/2) derivada de `eval/lib/qrels.js` (`gradoRelevancia`/`construirQrelsTrec`, sin modificar). Las 85 consultas tienen al menos 1 documento relevante.

## Composición del corpus (90 documentos)

Mismas 9 categorías y 22 subtemas de v1 (ver `categorias_v2.json`), pero con documentos **enteramente nuevos** (no reutiliza texto de v1):

1. **45 documentos núcleo** (2 por subtema, 3 en tres subtemas elegidos para no caer exactamente en el redondeo 2×21) — casos concretos distintos dentro de cada subtema.
2. **21 documentos de variedad de estilo** (1 por subtema) — mismo subtema que los núcleo, registro distinto (`informal_coloquial` o `formal_sin_citas`). Lista completa:

   | ID | Categoría / subtema | Registro |
   |---|---|---|
   | DOC-V2-SPR-004 | SERVIDUMBRE_PASO_RED / red_antigua_prescripcion | formal_sin_citas |
   | DOC-V2-SPR-007 | SERVIDUMBRE_PASO_RED / linea_alta_tension_rural | informal_coloquial |
   | DOC-V2-SPR-010 | SERVIDUMBRE_PASO_RED / subestacion_urbana | formal_sin_citas |
   | DOC-V2-STR-003 | SERVIDUMBRE_TRASLADO / traslado_transformador_predio | informal_coloquial |
   | DOC-V2-STR-006 | SERVIDUMBRE_TRASLADO / reubicacion_poste_via | formal_sin_citas |
   | DOC-V2-STR-009 | SERVIDUMBRE_TRASLADO / costo_reubicacion | informal_coloquial |
   | DOC-V2-ISA-003 | INSTALACION_SIN_AUTORIZACION / red_sin_consentimiento | formal_sin_citas |
   | DOC-V2-ISA-006 | INSTALACION_SIN_AUTORIZACION / mantenimiento_sin_aviso_previo | informal_coloquial |
   | DOC-V2-DIN-003 | DAÑOS_INFRAESTRUCTURA / caida_linea_energizada | formal_sin_citas |
   | DOC-V2-DIN-006 | DAÑOS_INFRAESTRUCTURA / electrocucion_animal | informal_coloquial |
   | DOC-V2-DIN-010 | DAÑOS_INFRAESTRUCTURA / dano_cultivo_poste | informal_coloquial |
   | DOC-V2-ACP-004 | ACCESO_PREDIO / ingreso_tecnico_sin_aviso | informal_coloquial |
   | DOC-V2-ACP-007 | ACCESO_PREDIO / ingreso_emergencia_mantenimiento | formal_sin_citas |
   | DOC-V2-FAC-003 | FACTURACION / cobro_retroactivo_periodos_vencidos | informal_coloquial |
   | DOC-V2-FAC-006 | FACTURACION / desviacion_significativa_consumo | formal_sin_citas |
   | DOC-V2-COR-003 | CORTE_SERVICIO / corte_sin_aviso_previo | informal_coloquial |
   | DOC-V2-COR-006 | CORTE_SERVICIO / suspension_por_mora | formal_sin_citas |
   | DOC-V2-CAL-003 | CALIDAD_SERVICIO / intermitencia_zona_rural | informal_coloquial |
   | DOC-V2-CAL-006 | CALIDAD_SERVICIO / fallas_transformador_sobrecarga | formal_sin_citas |
   | DOC-V2-INF-003 | INFORMACION_GENERAL / copia_contrato_servidumbre | informal_coloquial |
   | DOC-V2-INF-006 | INFORMACION_GENERAL / certificacion_red_mapas | formal_sin_citas |

3. **16 negativos difíciles** — documentos escritos con el vocabulario superficial típico de una categoría (sus `palabras_clave` de `categorias.json`) pero cuyo `categoria`/`subtema`/`base_normativa` real (el que determina relevancia, verificado contra el manifiesto de generación: 0 discrepancias) es de una categoría distinta y confusable. Repartidos en 8 pares intra-cluster:

   | ID | Real (determina relevancia) | Disfrazado de |
   |---|---|---|
   | DOC-V2-NEG-STR-010 | SERVIDUMBRE_TRASLADO / reubicacion_poste_via | SERVIDUMBRE_PASO_RED |
   | DOC-V2-NEG-SPR-011 | SERVIDUMBRE_PASO_RED / linea_alta_tension_rural | SERVIDUMBRE_TRASLADO |
   | DOC-V2-NEG-ISA-007 | INSTALACION_SIN_AUTORIZACION / red_sin_consentimiento | ACCESO_PREDIO |
   | DOC-V2-NEG-ACP-008 | ACCESO_PREDIO / ingreso_emergencia_mantenimiento | INSTALACION_SIN_AUTORIZACION |
   | DOC-V2-NEG-DIN-011 | DAÑOS_INFRAESTRUCTURA / dano_cultivo_poste | SERVIDUMBRE_TRASLADO |
   | DOC-V2-NEG-STR-011 | SERVIDUMBRE_TRASLADO / traslado_transformador_predio | DAÑOS_INFRAESTRUCTURA |
   | DOC-V2-NEG-DIN-012 | DAÑOS_INFRAESTRUCTURA / caida_linea_energizada | ACCESO_PREDIO |
   | DOC-V2-NEG-ACP-009 | ACCESO_PREDIO / ingreso_tecnico_sin_aviso | DAÑOS_INFRAESTRUCTURA |
   | DOC-V2-NEG-FAC-007 | FACTURACION / desviacion_significativa_consumo | CORTE_SERVICIO |
   | DOC-V2-NEG-COR-007 | CORTE_SERVICIO / suspension_por_mora | FACTURACION |
   | DOC-V2-NEG-COR-008 | CORTE_SERVICIO / corte_sin_aviso_previo | CALIDAD_SERVICIO |
   | DOC-V2-NEG-CAL-007 | CALIDAD_SERVICIO / fallas_transformador_sobrecarga | CORTE_SERVICIO |
   | DOC-V2-NEG-FAC-008 | FACTURACION / cobro_retroactivo_periodos_vencidos | INFORMACION_GENERAL |
   | DOC-V2-NEG-INF-007 | INFORMACION_GENERAL / copia_contrato_servidumbre | FACTURACION |
   | DOC-V2-NEG-CAL-008 | CALIDAD_SERVICIO / intermitencia_zona_rural | INFORMACION_GENERAL |
   | DOC-V2-NEG-INF-008 | INFORMACION_GENERAL / certificacion_red_mapas | CALIDAD_SERVICIO |

4. **4 pares casi-duplicados (8 documentos)** — mismo `categoria`/`subtema`/`base_normativa` exacto dentro de cada par (mismo caso legal), redactados con vocabulario deliberadamente distinto (variante `A_formal_tecnico` con citas normativas, variante `B_coloquial_disjunto` sin ellas). **Ilustrativos para la tesis, no base estadística** (así lo pide el propio issue `#115`) — prueba de existencia de que la fusión híbrida puede recuperar donde el léxico puro no puede, no un dato con el que calcular significancia.

   | Par | Categoría / subtema | IDs |
   |---|---|---|
   | DUP-01 | SERVIDUMBRE_PASO_RED / red_antigua_prescripcion | DOC-V2-DUP-01A, DOC-V2-DUP-01B |
   | DUP-02 | DAÑOS_INFRAESTRUCTURA / electrocucion_animal | DOC-V2-DUP-02A, DOC-V2-DUP-02B |
   | DUP-03 | FACTURACION / desviacion_significativa_consumo | DOC-V2-DUP-03A, DOC-V2-DUP-03B |
   | DUP-04 | CORTE_SERVICIO / suspension_por_mora | DOC-V2-DUP-04A, DOC-V2-DUP-04B |

   **Verificado, no asumido** (`eval/scripts/v2_verificar_casi_duplicados.js`, mismo stemmer `to_tsvector('spanish')` que producción): Jaccard de solapamiento léxico entre A y B de cada par — DUP-01: 0.099, DUP-02: 0.075, DUP-03: 0.054, DUP-04: 0.075. Las palabras compartidas son casi todas nombres de municipio (ignorados a propósito en el diseño) y palabras funcionales/de dominio difíciles de evitar del todo en español natural (p.ej. "cable"/"daño" en el par de electrocución de animal) — **reducción sustancial del solapamiento, no un cero absoluto**. Reportado así, no como un cero idealizado.

Total: 45 + 21 + 16 + 8 = **90 documentos**.

## Composición de las consultas (85)

~4 consultas por subtema (21 subtemas × 4, más una extra en `red_antigua_prescripcion`), mismo formato que v1. No se usó la taxonomía de "modos" (PARA/SEM/LEX/NOKW/DIS) de v1 — lo que importa en la Fase D es la separabilidad del corpus, no la forma de las consultas.

## Generación

Sin documentos reales locales disponibles en esta sesión para calibrar estilo (los que usó `#74` para v1 fueron compartidos efímeramente en esa conversación y no persisten en el repo) — se calibró contra los 40 documentos ya verificados de `eval/data/corpus.jsonl` (ya 100% sintéticos, ya verificados sin PII), más dos ejemplos de registro (formal con citas, informal/caso corto) y un ejemplo de consulta vaga.

Generación repartida en 4 sub-agentes en paralelo (`Agent`, sin contexto de esta conversación, sin saber nada de los bugs/hallazgos de `#95`-`#114` — solo la especificación de dominio, el contrato Zod exacto y, para los negativos difíciles, qué categoría debían "aparentar" textualmente vs. su `spec` real):

- Lote 1: SERVIDUMBRE_PASO_RED + SERVIDUMBRE_TRASLADO (22 docs, 25 queries)
- Lote 2: INSTALACION_SIN_AUTORIZACION + DAÑOS_INFRAESTRUCTURA + ACCESO_PREDIO (28 docs, 28 queries)
- Lote 3: FACTURACION + CORTE_SERVICIO + CALIDAD_SERVICIO (24 docs, 24 queries)
- Lote 4: INFORMACION_GENERAL + los 4 pares casi-duplicados (16 docs, 8 queries)

## Verificación independiente (no autorreporte del generador)

1. **Schema** (`eval/schema.js`, sin reimplementar): `corpus_v2.jsonl` → 90/90 válidos. `queries_v2.jsonl` → 85/85 válidas.
2. **Cobertura exacta de IDs contra el manifiesto de generación**: 0 documentos faltantes, 0 sobrantes, 0 IDs duplicados, 0 discrepancias de `categoria`/`subtema` (verificado que los negativos difíciles llevan su categoría REAL, no el disfraz, en el campo que determina relevancia).
3. **Sin PII real**: 0 coincidencias de patrones de correo electrónico o de secuencias numéricas tipo teléfono/cédula (excluidos los radicados ficticios `DP-2024/2025-XXXXXX`). 0 nombres de persona coincidentes con los usados en `eval/data/corpus.jsonl` (v1).
4. **Qrels mecánicos sanos** (`eval/lib/qrels.js`, sin modificar): las 85 consultas tienen al menos 1 documento relevante (grado ≥1) — 885 pares relevantes en total.
5. **Pares casi-duplicados**: ver sección 4 arriba — Jaccard real medido con el stemmer de producción, no asumido.

## Indexado y línea base (2026-10-03) — resultado inesperado, reportado tal como salió

Indexado en `rag_eval_v2` (base lógica propia dentro del contenedor `rag-eval-db`, nunca mezclada con `rag_eval_minilm` de v1 — `eval/.env.eval.v2`, gitignored). Modelo MiniLM (el mismo del indexado por defecto), 90/90 documentos, confirmado vía `eval_indexado`.

Línea base corrida con el pipeline real (`04_correr.js`/`00_ablation.js`, sin modificar) sobre el split **dev** (61 consultas, qrels mecánicos — nunca el de test) para confirmar que el corpus no es degenerado:

| Sistema | recall@5 | recall@10 | nDCG@10 | MRR@10 |
| --- | --- | --- | --- | --- |
| híbrida (E06, ponderado, sin filtro) | 0.244 [0.204, 0.287] | 0.336 [0.283, 0.393] | 0.445 [0.377, 0.517] | 0.751 [0.666, 0.833] |
| **léxico-solo** | **0.260** [0.218, 0.303] | **0.384** [0.329, 0.443] | **0.491** [0.422, 0.560] | **0.787** [0.696, 0.870] |
| vector-solo | 0.135 [0.108, 0.163] | 0.223 [0.184, 0.265] | 0.270 [0.226, 0.322] | 0.565 [0.470, 0.667] |

**El corpus no es degenerado** (todos los sistemas recuperan bien por encima del azar, magnitudes comparables a la línea base de v1 antes de `#106`). Pero el resultado es el **opuesto** del que motivó la Fase D: léxico-solo le gana a la híbrida con significancia (Holm) en recall@10 (p=0.0005) y nDCG@10 (p=0.0015) — una brecha más clara que la de v1, no el caso borde favorable a la híbrida que se buscaba.

**Diagnóstico rápido, antes de invertir en pooling/etiquetado**: ¿son los negativos difíciles los que explican la pérdida de la híbrida? Se midió cuántas apariciones en el top-10 de cada sistema son un negativo_dificil disfrazado de la categoría real de la consulta (contaminación directa por el mecanismo que se diseñó):

- léxico-solo: 44/850 apariciones (5.2%) — es, como se esperaba por diseño, el **más engañado** por el disfraz léxico.
- híbrida: 35/850 apariciones (4.1%) — menos engañada que léxico-solo, consistente con que el vector no se deja llevar por el vocabulario superficial.

**Los negativos difíciles no explican la pérdida de la híbrida — de hecho la engañan menos que a léxico-solo.** La causa más probable, dado que `vector-solo` solo llega a 0.270 de nDCG@10 (muy por debajo de ambos), es que el componente vectorial (55% del peso de la fusión) tiene **menos resolución para separar 90 documentos de 9 categorías con más variedad de estilo y subtemas** que para los 40 de v1 — el mismo mecanismo que el diagnóstico de la Fase B de `#114` ya había señalado como explicación más probable del límite real ("cuánta resolución tiene el espacio vectorial para separar documentos parecidos, no la robustez a la reescritura"), ahora reproducido en un corpus deliberadamente más grande y variado, no en una perturbación de consultas.

**No se avanzó a poolear/etiquetar el split de test con este resultado mecánico en contra de la hipótesis de la Fase D** — ver la discusión con Alejandro en el cierre de sesión del issue.

## Barrido de pesos y modelos (2026-10-03) — por qué perdía la híbrida, y hasta dónde llega al corregirlo

Segunda opinión de Opus: antes de poolear/etiquetar (caro) o cerrar la investigación, correr un barrido barato de peso vectorial (α de 0.0 a 1.0) × modelo (MiniLM / `multilingual-e5-small`) sobre el split dev, con una regla de parada **pre-registrada antes de correr nada** (`eval/data/v2/preregistro_barrido_pesos.md`).

**Resultado**: con MiniLM, más peso vectorial siempre empeora (de 0.490 a 0.270 de nDCG@10) — el vector de MiniLM resta en este corpus. Con `e5-small`, la curva es creciente hasta **α=0.9 (nDCG@10=0.5653, Δ=+0.0746 sobre léxico-solo)** — supera el umbral de la regla de parada (0.02), así que se congeló esa configuración y se confirmó sobre el **test de v1 ya etiquetado** (cero costo de etiquetado nuevo, reindexando temporalmente `rag_eval_minilm` con e5-small y restaurándolo a MiniLM al terminar, regla 9 de RAG-00). Resultado confirmatorio: nDCG@10 0.706 (e5-a0.9) vs. 0.656 (léxico-solo) — **mejor punto estimado, pero no significativo** (p_holm=0.101, n=25).

**Conclusión**: el límite real no era el corpus ni la imposibilidad de un caso borde — era el modelo de embeddings (MiniLM, solo-inglés, sobre texto jurídico en español) y los pesos de producción (0.55, no el óptimo para e5-small en este corpus). Corregido eso, la híbrida vuelve a tener el mejor punto estimado, pero la muestra de test disponible (25 consultas) sigue sin ser suficiente para confirmarlo con rigor estadístico. Detalle completo, con la curva de 27 configuraciones, en `eval/data/v2/preregistro_barrido_pesos.md` y `eval/data/v2/metricas_v2_barrido.md`.

No se poolea ni se etiqueta el split de test de v2 bajo ningún escenario de este barrido (regla fijada de antemano).

## Análisis de potencia y cierre (2026-10-03, tercera opinión de Opus)

¿Alcanzaría con más consultas de test? El n necesario para 80% de potencia es 67 si el efecto real es igual al observado en v1-test (dz=0.349), 261 si es la mitad (plausible — en dev el efecto fue 0.0746, en test independiente se encogió a 0.0507), y **417 para la diferencia mínima que este mismo documento definió como relevante antes de ver resultados (0.02)** — un orden de magnitud fuera de alcance. Se cierra la pregunta sin perseguir más datos, reencuadrada como **no-inferioridad + estimación**: el IC95% bootstrap de la diferencia ([-0.0020, 0.1087]) tiene el límite inferior casi en cero. Chequeo adicional gratuito (sin etiquetar nada, relevancia mecánica ya calculada) sobre v2-test: significativo (p_holm=0.0005), declarado como segunda réplica parcial con el límite epistemológico ya conocido de la relevancia mecánica, no como confirmación. Detalle completo del cálculo de potencia y la decisión de cierre en `eval/data/v2/preregistro_barrido_pesos.md` (sección "Addendum").

## Erratum (2026-10-03): corrección de código, post-auditoría adversarial

Tras mergear el barrido y el análisis de potencia de arriba a `rag/integracion` (PR #119), una auditoría adversarial encontró dos bugs de código reales (no solo de redacción): `v2_barrido_pesos.js` usaba solo `embedding_local` en vez de `COALESCE(embedding_comprension, embedding_local)` como producción (señal distinta para ~70% de los documentos de v1/v2), y `00_ablation.js` tenía un bug de no determinismo heredado desde `#95` (sin desempate secundario en el `ORDER BY`). Siguiendo el precedente de `#113`, se corrigió el código y se repitió todo el barrido + la confirmatoria sobre test de v1.

**La conclusión cualitativa no cambia, los números sí (quedan superados, no solo anotados con una limitación al lado)**:

| | Original (con el bug) | Corregido |
| --- | --- | --- |
| Mejor config en dev v2 | e5-small, α=0.9: nDCG@10=0.5653 | e5-small, α=0.9: nDCG@10=**0.5724** (misma configuración ganadora, verificado) |
| Δ sobre léxico-solo (dev) | 0.0746 | **0.0821** |
| Confirmatoria test v1 | 0.706 vs. 0.656, p_holm=0.1010 | **0.723** vs. 0.656, p_holm=**0.0630** (más cerca del umbral, sigue sin significancia) |
| n necesario (diferencia mínima independiente, no el 0.02 del barrido reusado) | ~417 (mal calculado — reusaba el umbral del barrido como si fuera la diferencia mínima relevante) | **93** (diferencia mínima de 0.05, justificada aparte) |

Detalle completo del erratum (incluyendo los dos intervalos de confianza — bootstrap y t de Student, que no coinciden en si excluyen cero — y las correcciones de redacción O1/O2/O3/O4b/O6 de la revisión adversarial) en `eval/data/v2/preregistro_barrido_pesos.md`.

Por la misma corrección del desempate determinista, también se refrescó `metricas_v2_dev.md`/`.json` (la línea base de la sección "Indexado y línea base" arriba) — cambio cosmético (~0.001 en nDCG@10, lexico-solo 0.491→0.490), no cambia ninguna conclusión de esa sección ni su significancia.

**Anexo exploratorio, no una segunda confirmación** (corrección O2, aceptada): el chequeo gratuito sobre v2-test mencionado en la sección anterior usa relevancia **mecánica** (categoría+subtema, no lectura del texto) sobre el mismo corpus de 90 documentos del split dev — no es un diseño independiente. La conclusión de esta investigación se apoya únicamente en el test de v1 (n=25, etiquetado ciego real).

**Hipótesis, no hallazgo firme** (corrección O6, aceptada): "el modelo de embeddings importa más que los pesos de fusión" es consistente con los datos (MiniLM resta, e5-small permite que la fusión tenga sentido, en ambos corpus), pero es una comparación de un solo modelo por clase con factores confundidos (datos de entrenamiento, prefijos `query:`/`passage:` de e5, escala de los scores) — no se aisló ninguno de esos factores.

**Pendiente, no bloqueante**: nunca se midió el acuerdo (Cohen's κ) entre la relevancia mecánica (`gradoRelevancia`, `eval/lib/qrels.js`) y el etiquetado real por IA del protocolo ciego de `#75`/`#113` — si estuviera sesgada hacia algún sistema, el anexo exploratorio de v2-test (no la conclusión principal, que depende solo del test de v1) perdería validez.

## Fuera de alcance de esta sesión (próximos pasos)

Indexar en una base de evaluación (posiblemente una tabla/BD separada de `rag_eval_minilm`, o un flag de "versión de corpus" — a decidir), correr línea base (equivalente a E01/E02 de v1) para confirmar que el corpus v2 no es degenerado, poolear y etiquetar el split de test con el protocolo ciego de `#75` (dos sesiones de IA aisladas, igual que se hizo para completar `#113`), pre-registrar y correr la comparación confirmatoria (E03 sin filtro vs. léxico-solo — la variante que decidió la Fase A de `#114`), y documentar el resultado en una sección propia de `eval/RESULTADOS_TESIS.md`, marcada explícitamente como estudio separado de `#77`/`#114`.
