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

## Nota de transparencia (disciplina ya establecida en este proyecto)

El diagnóstico de contaminación por negativos difíciles de la sesión anterior (documentado en `eval/data/v2/README.md`) corrió sobre las 85 consultas completas de v2, no solo sobre las 61 de dev — es decir, tocó las 24 consultas del split de test de v2 de forma puramente diagnóstica (contar apariciones de negativos difíciles en el top-10), sin que ese número influyera en ninguna decisión de diseño de este barrido ni de la regla de parada de arriba. Se declara por la misma disciplina que ya se usa en `preregistro_77.md`.
