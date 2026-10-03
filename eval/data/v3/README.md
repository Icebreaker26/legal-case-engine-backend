# eval/data/v3/ — corpus v3, etapa 2 del diseño confirmatorio de dos etapas (`#121`)

**Nunca mezclado con `eval/data/` (v1) ni `eval/data/v2/`** — generado desde cero, sin reusar documentos ni consultas de ningún corpus anterior. Ver `preregistro_diseno_dos_etapas.md` para el diseño estadístico completo (por qué hace falta un corpus nuevo, no solo preguntas nuevas sobre v1/v2).

## Archivos

- `corpus_v3.jsonl` — **45 documentos**, mismo `DocSchema` de `eval/schema.js`. Validado: 45/45.
- `queries_v3.jsonl` — **71 consultas**, mismo `QuerySchema`. Validado: 71/71.
- `split_v3.json` — **todas las 71 consultas van a test, dev vacío** — la configuración (e5-small, ponderado, α=0.9) ya está congelada de antemano; v3 nunca se usa para tunear nada.
- `qrels_v3.trec` — relevancia **mecánica** (355 pares, grado 2: 74, grado 1: 281), derivada de `eval/lib/qrels.js` sin modificar — **solo un sanity check de que el corpus no es degenerado, nunca la relevancia final de la prueba confirmatoria**. La relevancia real vendrá del etiquetado ciego (pendiente, ver "Siguiente paso" abajo).
- `preregistro_diseno_dos_etapas.md` — pre-registro completo del diseño de combinación de dos etapas (Lehmacher-Wassmer/inverse-normal), commiteado antes de generar nada de este corpus.

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

## Siguiente paso (pendiente, este mismo issue)

1. Indexar en una base de evaluación propia `rag_eval_v3` (nunca mezclada con `rag_eval_minilm`/`rag_eval_v2`).
2. Correr léxico-solo + la híbrida congelada (e5-small, ponderado, α=0.9, `COALESCE`, desempate determinista) + 1-2 sistemas de diversidad, sobre las 71 consultas.
3. Poolear el top-10 de cada sistema (protocolo de `#75`/`#113`) y etiquetar a ciegas con dos sesiones de IA completamente aisladas (sin ver qué sistema recuperó cada documento), calcular Cohen's kappa.
4. Fusionar en `qrels_v3.trec` (reemplazando la porción mecánica por la relevancia real).
5. Correr la comparación confirmatoria (Fisher, nDCG@10) → Z2.
6. Combinar con Z1=1.8592 (test de v1, ya conocido) usando los pesos pre-registrados (w1=0.5103, w2=0.8600) → decisión final, última mirada.
