# Pre-registro — barrido de pesos sobre el split dev de corpus v2 (`#115`, Fase D)

**Fecha de registro:** 2026-10-03, antes de ejecutar ningún cálculo del barrido. Segunda opinión de Opus (ver comentario de cierre de sesión de `#115`) recomendó esta sesión acotada antes de decidir entre poolear/etiquetar el test de v2 (caro, opción 1) o cerrar la investigación del caso borde (opción 4).

## Contexto y por qué este barrido

La línea base de v2 (MiniLM, pesos de producción 0.55 vector / 0.35 léxico / 0.10 feedback-siempre-cero) dio el resultado opuesto al que motivó la Fase D: léxico-solo le gana a la híbrida con significancia en el split dev (nDCG@10 p_holm=0.0015). El diagnóstico (contaminación por negativos difíciles) descartó que el mecanismo diseñado explique la pérdida — la causa más probable es que el componente vectorial (MiniLM, modelo **solo-inglés** corriendo sobre texto jurídico en español) tiene poca resolución para separar los 90 documentos de v2, igual que ya se midió (`#76`) que `multilingual-e5-small` supera a MiniLM con significancia (p_holm=0.0000) en el dev de v1.

**Pregunta de este barrido**: ¿existe algún peso vectorial α (no necesariamente 0.55) o algún modelo (MiniLM o e5-small) con el que la fusión supere a léxico-solo en el split dev de v2? Si no existe ninguno, no tiene sentido invertir en poolear/etiquetar el test de v2 buscando ese caso.

## Métrica, splits y modelos

- **Métrica única de decisión: nDCG@10** sobre el split **dev** de v2 (61 consultas, relevancia mecánica — nunca se toca el split de test de v2 en este barrido).
- **Fórmula**: `score = cos(α) + ts_rank_capado·(1-α)`, dejando fuera el término de feedback (siempre 0 en el corpus sintético, no afecta el orden). Dedup por documento (`ROW_NUMBER`, mismo patrón que `00_ablation.js`/producción) recalculado para cada α, porque el mejor chunk de un documento puede cambiar según el peso.
- **α ∈ {0.0, 0.1, 0.2, ..., 1.0}** (11 puntos), sobre dos modelos: MiniLM (`Xenova/all-MiniLM-L6-v2`, ya indexado en `rag_eval_v2`) y e5-small (`Xenova/multilingual-e5-small`, a indexar en una base lógica nueva `rag_eval_v2_e5`, nunca mezclada con las otras dos) → 22 puntos.
- **+ RRF** (`buscarRRF` de producción, sin modificar) para cada modelo → 2 puntos más. Total: **24 configuraciones**.
- Referencias ya calculadas (línea base de esta sesión, no se recalculan): léxico-solo MiniLM nDCG@10=0.491, híbrida-producción (α=0.55, MiniLM) nDCG@10=0.445, vector-solo MiniLM nDCG@10=0.270.

## Regla de parada (fijada antes de ver el resultado del barrido)

Sea `mejor` = max(nDCG@10) entre las 24 configuraciones del barrido.

- **Si `mejor` − 0.491 (léxico-solo MiniLM) < 0.02**: se cierra la búsqueda del caso borde para esta Fase D (opción 4 de la discusión con Opus). No se poolea ni se etiqueta nada del split de test de v2. Se documenta como resultado negativo: "con los pesos de producción y con un barrido exhaustivo de pesos alternativos y dos modelos de embeddings, la fusión híbrida no logra superar a la búsqueda léxica pura en el corpus v2".
- **Si `mejor` − 0.491 ≥ 0.02**: se congela **una sola configuración** (la de mejor nDCG@10 en dev) y se confirma contra el split de **test de v1** (25 consultas, **ya etiquetado con relevancia real** desde `#75`/`#113` — costo de etiquetado nuevo: cero). Esto se declara como un nuevo vistazo a ese test (adicional a los ya declarados en `preregistro_77.md`), con corrección de Holm sobre la comparación `configuración-ganadora vs. léxico-solo` sobre ese split. No se corrige nada más que esa única comparación pre-especificada aquí.
- En ningún escenario de este barrido se poolea ni se etiqueta el split de test de **v2** — eso queda fuera de alcance de esta sesión bajo cualquier resultado.

## Resultado (2026-10-03, corrido tal como se pre-registró arriba)

**Curva completa** (27 configuraciones: 11 α × 2 modelos + RRF × 2 modelos + 3 referencias, nDCG@10 sobre dev de v2, 61 consultas) en `eval/data/v2/metricas_v2_barrido.md`/`.json`. Resumen:

- Con **MiniLM**, la curva es monótonamente decreciente en α: más peso vectorial, peor nDCG@10 (de 0.490 en α=0.0 a 0.270 en α=1.0) — el vector de MiniLM resta, no suma, en este corpus. RRF con MiniLM también pierde (0.395).
- Con **multilingual-e5-small**, la curva es creciente hasta α=0.9: **mejor = e5-small, α=0.9, nDCG@10=0.5653** [0.505, 0.626] — por encima de lexico-solo (0.4908) por **Δ=0.0746**, muy por encima del umbral de 0.02 fijado en la regla de parada. RRF con e5-small también le gana a léxico-solo (0.5546).
- `mejor − lexico-solo = 0.0746 ≥ 0.02` → **se activa la rama de confirmación**: se congeló la configuración `e5-small, ponderado, α=0.9` (score = coseno·0.9 + ts_rank_capado·0.1, sin filtro de categoría, sin término de feedback) y se corrió sobre el split de **test de v1** (25 consultas, relevancia real de `#75`/`#113`, cero etiquetado nuevo).

**Para la corrida confirmatoria**, se reindexó temporalmente `rag_eval_minilm` (la base de v1) con `multilingual-e5-small` (normal durante la investigación, regla 9 de RAG-00) y se restauró a MiniLM inmediatamente después, verificado (`eval_indexado` → `Xenova/all-MiniLM-L6-v2`).

| Sistema | Recall@5 | Recall@10 | **nDCG@10** | MRR@10 |
| --- | --- | --- | --- | --- |
| léxico-solo (control, corregido de `#113`) | 0.480 [0.386, 0.575] | 0.725 [0.627, 0.811] | 0.656 [0.552, 0.753] | 0.884 [0.767, 0.980] |
| **e5-small, ponderado, α=0.9, sin filtro** | 0.519 [0.434, 0.607] | 0.787 [0.695, 0.870] | **0.706** [0.620, 0.784] | 0.894 [0.783, 0.980] |

**No significativo**: nDCG@10 p_crudo=p_holm=0.1010 (una sola comparación pre-especificada, Holm no tiene nada que corregir con m=1). El punto estimado mejora sobre el número ya conocido de `e5-sin-filtro` con los pesos de producción (0.724 en `#77`, pesos normalizados distintos — no son el mismo experimento, no comparables directamente) y sobre léxico-solo (0.656), pero **con 25 consultas la diferencia no cruza el umbral de significancia** — mismo patrón de potencia estadística insuficiente que ya limitaba a `#77`.

**Conclusión de este ciclo**: el barrido confirma precisamente el diagnóstico de Opus — el límite no era el corpus (los negativos difíciles funcionan como se diseñaron) ni la imposibilidad de un caso borde, sino **el modelo de embeddings y los pesos de producción**: con MiniLM y α=0.55, la híbrida pierde cada vez más claro a medida que el corpus crece (v1 empate → v2 pérdida significativa); con e5-small y un peso vectorial más alto (α=0.9, no 0.55), la híbrida vuelve a tener el punto estimado más alto, pero la confirmación con datos reales (no mecánicos) sobre el único split de test etiquetado que existe **no alcanza significancia estadística** — ni para afirmar que la híbrida gana, ni para descartarlo con la muestra disponible.

## Nota de transparencia (disciplina ya establecida en este proyecto)

El diagnóstico de contaminación por negativos difíciles de la sesión anterior (documentado en `eval/data/v2/README.md`) corrió sobre las 85 consultas completas de v2, no solo sobre las 61 de dev — es decir, tocó las 24 consultas del split de test de v2 de forma puramente diagnóstica (contar apariciones de negativos difíciles en el top-10), sin que ese número influyera en ninguna decisión de diseño de este barrido ni de la regla de parada de arriba. Se declara por la misma disciplina que ya se usa en `preregistro_77.md`.
