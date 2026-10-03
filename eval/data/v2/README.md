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

## Fuera de alcance de esta sesión (próximos pasos)

Indexar en una base de evaluación (posiblemente una tabla/BD separada de `rag_eval_minilm`, o un flag de "versión de corpus" — a decidir), correr línea base (equivalente a E01/E02 de v1) para confirmar que el corpus v2 no es degenerado, poolear y etiquetar el split de test con el protocolo ciego de `#75` (dos sesiones de IA aisladas, igual que se hizo para completar `#113`), pre-registrar y correr la comparación confirmatoria (E03 sin filtro vs. léxico-solo — la variante que decidió la Fase A de `#114`), y documentar el resultado en una sección propia de `eval/RESULTADOS_TESIS.md`, marcada explícitamente como estudio separado de `#77`/`#114`.
