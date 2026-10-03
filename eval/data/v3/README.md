# eval/data/v3/ — corpus v3, etapa 2 del diseño confirmatorio de dos etapas (`#121`)

**Nunca mezclado con `eval/data/` (v1) ni `eval/data/v2/`** — generado desde cero, sin reusar documentos ni consultas de ningún corpus anterior. Ver `preregistro_diseno_dos_etapas.md` para el diseño estadístico completo (por qué hace falta un corpus nuevo, no solo preguntas nuevas sobre v1/v2).

## Archivos

- `corpus_v3.jsonl` — **45 documentos**, mismo `DocSchema` de `eval/schema.js`. Validado: 45/45.
- `queries_v3.jsonl` — **71 consultas**, mismo `QuerySchema`. Validado: 71/71.
- `split_v3.json` — **todas las 71 consultas van a test, dev vacío** — la configuración (e5-small, ponderado, α=0.9) ya está congelada de antemano; v3 nunca se usa para tunear nada.
- `qrels_v3.trec` — relevancia **mecánica** (355 pares, grado 2: 74, grado 1: 281), derivada de `eval/lib/qrels.js` sin modificar — **solo un sanity check de que el corpus no es degenerado, nunca la relevancia final de la prueba confirmatoria**. La relevancia real vendrá del etiquetado ciego (pendiente, ver "Siguiente paso" abajo).
- `preregistro_diseno_dos_etapas.md` — pre-registro completo del diseño de combinación de dos etapas (Lehmacher-Wassmer/inverse-normal), commiteado antes de generar nada de este corpus.
- `pool_etiquetado_v3.csv` — pool de 1214 pares (consulta, documento) de 4 sistemas candidatos, sobre las 71 consultas originales (antes de descartar duplicados).
- `grados_anotador1_v3.csv` / `grados_anotador2_v3.csv` — juicios de relevancia 0-3 con razón breve de los dos anotadores ciegos (1214 y 256 pares respectivamente), mismo formato que `eval/data/grados_anotador1.csv`/`grados_anotador2.csv` de v1 — quedan versionados como rastro de auditoría.
- `metricas_v3_confirmatoria.md`/`.json` — resultado de la comparación confirmatoria (Fisher, nDCG@10) sobre las 62 consultas válidas.
- `runs/` — corridas en formato TREC: `ablation-lexical-only.trec` (léxico-solo), `ablation-vector-only.trec` (vector-solo), `v3-hibrida-congelada-e5-a0.9.trec` (la configuración congelada), `v3-rrf-e5.trec` (diversidad para el pool).

## Composición (45 documentos, mismas 9 categorías de producción)

5 documentos por categoría, 2-5 subtemas inventados por categoría (sin reusar los subtemas ya documentados en `eval/data/README.md`/`eval/data/v2/README.md`). Sin negativos difíciles deliberados — a diferencia de v2, el objetivo de v3 no es encontrar un caso borde, es ser una muestra confirmatoria limpia e independiente.

| Categoría | Docs | Consultas |
| --- | --- | --- |
| SERVIDUMBRE_PASO_RED | 5 | 8 |
| SERVIDUMBRE_TRASLADO | 5 | 8 |
| INSTALACION_SIN_AUTORIZACION | 5 | 8 |
| DAÑOS_INFRAESTRUCTURA | 5 | 8 |
| ACCESO_PREDIO | 5 | 7 |
| FACTURACION | 5 | 8 |
| CORTE_SERVICIO | 5 | 8 |
| CALIDAD_SERVICIO | 5 | 8 |
| INFORMACION_GENERAL | 5 | 8 |
| **Total** | **45** | **71** |

73% de los documentos (33/45) tienen `comprension` poblado (el resto `null`), simulando la proporción real observada en v1/v2 (62-70%).

## Generación

3 lotes generados en paralelo por sub-agentes **Haiku**, cada uno sin contexto de esta conversación ni de ningún hallazgo de `#95`-`#121` — solo la especificación de dominio (tutelas/derechos de petición contra una empresa eléctrica colombiana) y el contrato Zod exacto:

- Lote 1: SERVIDUMBRE_PASO_RED + SERVIDUMBRE_TRASLADO + INSTALACION_SIN_AUTORIZACION (15 docs, 24 consultas)
- Lote 2: DAÑOS_INFRAESTRUCTURA + ACCESO_PREDIO + FACTURACION (15 docs, 23 consultas)
- Lote 3: CORTE_SERVICIO + CALIDAD_SERVICIO + INFORMACION_GENERAL (15 docs, 24 consultas)

Cada lote reportó validación Zod exitosa de forma independiente. Total 71, no 68 — ver la enmienda del pre-registro (n2 se ajustó a 71 antes de indexar o correr nada, no después de ver resultados).

## Verificación independiente (no autorreporte del generador)

1. **Schema** (`eval/schema.js`): 45/45 documentos y 71/71 consultas válidos.
2. **Sin IDs duplicados** (ni en documentos ni en qids).
3. **Cobertura exacta de las 9 categorías**, sin categorías inesperadas; `derecho_vulnerado` siempre igual a `spec.categoria`.
4. **Sin PII** (sin coincidencias de patrones de correo electrónico, teléfono celular o cédula explícita).
5. **Qrels mecánicos sanos**: las 71 consultas tienen al menos 1 documento relevante (grado ≥1) según la regla mecánica — 0 consultas sin relevante.
6. Inspección manual de muestra: contenido coherente con el dominio, sin artefactos evidentes de generación.

## Corrección: 9 consultas descartadas por duplicado exacto antes de evaluar

Durante el etiquetado ciego, varios de los agentes anotadores reportaron de forma independiente pares de consultas con texto idéntico. Auditoría completa: **9 de las 71 consultas eran copias exactas** de otra consulta del mismo lote de generación (bug de los sub-agentes Haiku, no detectado por la verificación inicial porque solo chequeaba duplicados de `qid`, no de contenido) — 8 grupos: `ISA-001/008`, `DIN-002/008`, `DIN-003/007`, `DIN-004/005`, `ACP-002/005`, `ACP-006/007`, `FAC-003/007/008`, `FAC-005/006`. Se descartaron del split de test (`split_v3.json`, campo `descartadas_por_duplicado`) **antes de calcular cualquier métrica de retrieval** — no se borraron de `corpus_v3.jsonl`/`queries_v3.jsonl` (siguen siendo datos válidos, solo no independientes). **n₂: 71 → 62.** Detalle completo y el recálculo de potencia en `preregistro_diseno_dos_etapas.md` (enmienda 2).

## Indexado, pooling y etiquetado ciego (2026-10-03)

Indexado en `rag_eval_v3` (base aislada, modelo `multilingual-e5-small` — el de la configuración congelada). Corridas: léxico-solo, híbrida congelada (e5-small, ponderado, α=0.9), vector-solo (e5-small), RRF (e5-small) — pool de **1214 pares** (consulta, documento) sobre las 71 consultas originales (antes de descartar duplicados).

Etiquetado ciego idéntico al protocolo de `#75`/`#113`: **6 sesiones de IA completamente aisladas** entre sí y sin contexto de esta investigación — 5 cubriendo el pool completo (1214 pares, "anotador 1"), 1 cubriendo el 20% de doble anotación (256 pares, "anotador 2", 15 consultas). Ninguna vio qué sistema recuperó cada documento (columnas `sistemas`/`n_sistemas_que_lo_recuperaron` ocultas durante el etiquetado, igual que en `#75`).

**Cohen's κ = 0.714** ("acuerdo sustancial") entre los dos anotadores — más bajo que el 0.895 de v1, lo cual es una señal más sana (dos instancias del mismo modelo acordando "demasiado" es indicio de convergencia artificial, no de validez externa — ver la discusión de este mismo punto en `eval/data/README.md`).

## Resultado confirmatorio (etapa 2 del diseño de `#121`)

| Sistema | Recall@5 | Recall@10 | **nDCG@10** | MRR@10 |
| --- | --- | --- | --- | --- |
| léxico-solo | 0.508 [0.464, 0.557] | 0.728 [0.688, 0.771] | 0.758 [0.725, 0.791] | 0.941 [0.895, 0.976] |
| **e5-small, ponderado, α=0.9** | 0.569 [0.523, 0.617] | 0.805 [0.764, 0.847] | **0.815** [0.785, 0.842] | 0.973 [0.938, 1.000] |

**nDCG@10 p_holm < 0.0005** (dos colas, sobre las 62 consultas válidas). Chequeo de sanidad: 44/62 consultas favorecen a la híbrida, 16 a léxico-solo, 2 empatan — no es un barrido unánime, consistente con un mecanismo real, no un artefacto.

**Combinado con la etapa 1** (test de v1, n=25, Z₁=1.8592) usando los pesos pre-registrados (w1=0.5361, w2=0.8442): **Z combinado > 3.94 ≥ 1.96 → significativo** (p combinado ≈ 0.00008). Detalle completo en `preregistro_diseno_dos_etapas.md`. Esta es la **última mirada** de este diseño — no se agregan más etapas. Resultado trasladado a `eval/RESULTADOS_TESIS.md` (sección 4.6), que reemplaza la conclusión "no se puede confirmar ni descartar" de la sección 4.5.
