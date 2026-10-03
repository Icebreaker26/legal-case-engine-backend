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

## Addendum — análisis de potencia y cierre (2026-10-03, tercera opinión de Opus)

Alejandro preguntó si se podía conseguir una muestra con potencia suficiente. Cálculo de potencia (t pareado, `scipy.stats.nct`, no reemplaza el test oficial del proyecto que es Fisher vía `ranx` — este cálculo es solo para planificar tamaño de muestra) sobre la diferencia pareada de nDCG@10 en el test de v1 (media=0.0507, sd=0.1454, dz=0.3487):

| Escenario | n necesario para potencia 80% (α=0.05, dos colas) |
| --- | --- |
| Efecto igual al observado (dz=0.349) | 67 |
| Efecto a la mitad del observado (dz=0.174 — plausible, ver abajo) | 261 |
| **Diferencia mínima pre-registrada en este documento (0.02 → dz=0.138)** | **417** |

**El n que exige la diferencia mínima que el propio proyecto definió como relevante (0.02, fijada arriba antes de ver ningún resultado) es ~417 — un orden de magnitud por fuera de lo alcanzable en un trabajo de grado.** Los n de 67 o 261 solo "alcanzan" bajo el supuesto de que el efecto real es igual (o la mitad) del observado en una muestra de 25 — y hay evidencia directa de que ese efecto está inflado: en dev (donde se elige el mejor de 22 configuraciones) la diferencia fue 0.0746; en el test independiente, se encogió a 0.0507. Es la regresión a la media esperable después de seleccionar al ganador, sin razón para asumir que ya terminó de encogerse.

**Tercera recomendación de Opus**: no perseguir p<0.05 agregando más datos (combinar con el test de v2 sin etiquetar, o generar consultas nuevas) — serían rondas sucesivas de "casi dio, agrego un poco más", y el n real necesario (417) hace que cualquier adición parcial (n=49 o n=67) solo tenga sentido bajo el supuesto más optimista. En cambio: reencuadrar como **no-inferioridad + estimación**, no "superioridad no demostrada" — el IC95% bootstrap de la diferencia ([-0.0020, 0.1087]) tiene el límite inferior prácticamente en cero, así que la híbrida congelada no es peor que la léxica en ninguna magnitud con sentido práctico, y el punto estimado la favorece.

**Chequeo adicional, gratuito, sugerido por Opus y corrido una sola vez**: la configuración se eligió mirando v2-dev — el chequeo natural de esa selección es v2-test (24 consultas), que **ya tiene relevancia mecánica calculada** (no requiere etiquetar nada nuevo). Resultado: nDCG@10 e5-a0.9=0.707 vs. lexico-solo=0.647, **p_holm=0.0005 (significativo)** — ver `eval/data/v2/metricas_v2_test_check_libre.md`. **Se declara explícitamente, por adelantado, que este resultado —cualquiera que fuera— no dispara ningún etiquetado adicional de v2-test**: la relevancia es mecánica (categoría+subtema+norma, no lee el texto), tiene el mismo límite epistemológico que ya se discutió para toda la relevancia mecánica de este proyecto, y no sustituye al único test con relevancia real (v1, no significativo). Se reporta como una segunda réplica parcial, con instrumento distinto (mecánico vs. etiquetado ciego), no como una confirmación adicional.

**Conclusión final de este ciclo (Fase D, cerrado)**: con dos diseños experimentales independientes (v1 y v2) y dos instrumentos de medición distintos (etiquetado ciego real y relevancia mecánica), el punto estimado favorece consistentemente a la híbrida bien configurada (e5-small, α=0.9) sobre léxico-solo. La única medición con relevancia real (test de v1, n=25) no alcanza significancia, y el n que exigiría la diferencia mínima que el proyecto mismo definió como relevante (417) está fuera de alcance. **No se persigue más esta pregunta con más datos.** Hallazgo sustantivo que sí queda firme, sin depender de ningún test de significancia: **el modelo de embeddings importa más que la elección de fusión** — con MiniLM (solo-inglés) más peso vectorial siempre empeora; con e5-small (multilingüe) la fusión vuelve a tener sentido. Si la fusión híbrida ayuda o no depende de si el modelo de embeddings maneja bien el español, no solo de los pesos.

## Erratum (2026-10-03): corrección de código, post-auditoría adversarial

Después de mergear el resultado de arriba a `rag/integracion` (PR #119), Alejandro le pidió a un agente de Opus 5.5 que intentara refutar activamente el análisis. La auditoría (ronda 2, con acceso de lectura al repo real) encontró dos problemas reales de código, no solo de redacción (detalle completo en el cierre de sesión de `#115`, PR #120):

1. **`eval/scripts/v2_barrido_pesos.js` usaba solo `embedding_local`** para la señal vectorial (`CANDIDATOS_SQL`), pero producción (`vectorService.js:29`, `buildScoringCTE`) usa `COALESCE(embedding_comprension, embedding_local)`. Verificado contra el repo: 63/90 documentos de v2 y 25/40 de v1 tienen `embedding_comprension` poblado — el barrido midió una señal vectorial distinta a la de producción para ~70% de los documentos. La comparación relativa entre las 24 configuraciones del barrido seguía siendo válida (todas usaban la misma señal, consistente entre sí), pero llamarla "la fórmula de producción con otro peso" era impreciso.
2. **`eval/scripts/00_ablation.js` tenía el mismo bug de no determinismo** que ya se había corregido en producción desde `#95`: `ORDER BY score DESC` sin desempate secundario. Verificado: `ablation-lexical-only.trec` y `v2-barrido-minilm-a0.0.trec` (deberían ser idénticos, ambos 100% léxico) diferían en 6 consultas de v2-dev — magnitud ~0.001 en nDCG@10, no cambiaba ninguna decisión ya tomada, pero es un bug real de reproducibilidad.

Siguiendo el mismo precedente que `#113` (arreglar el código y re-correr, no documentar la imprecisión como limitación), se corrigieron ambos scripts (commits `8cb67d7` y el de `v2_barrido_pesos.js` en PR #120) y se repitió **todo** el barrido sobre dev de v2 (61 consultas) y la corrida confirmatoria sobre el test de v1 ya etiquetado (25 consultas, cero etiquetado nuevo).

### Resultado corregido

| | Dev v2 — mejor config | Dev v2 — léxico-solo | Δ dev | Test v1 — mejor config | Test v1 — léxico-solo | p_holm nDCG@10 (test v1) |
| --- | --- | --- | --- | --- | --- | --- |
| **Original (con el bug)** | e5-small α=0.9: 0.5653 | 0.4908 | 0.0746 | 0.706 [0.620, 0.784] | 0.656 [0.552, 0.753] | 0.1010 |
| **Corregido** | e5-small α=0.9: **0.5724** | 0.4903 | **0.0821** | **0.723** [0.633, 0.803] | 0.656 [0.552, 0.753] (sin cambios) | **0.0630** |

**Se verificó explícitamente que `e5-small, α=0.9` sigue siendo el máximo de las 24 configuraciones con el código corregido** — no cambió la configuración ganadora, cambiaron los números. Curva completa corregida en `eval/data/v2/metricas_v2_barrido.md`/`.json` (sobrescritos con la corrida corregida; los archivos `.trec` en `eval/data/v2/runs/` también se regeneraron).

**La regla de parada sigue disparando** (Δ=0.0821 ≥ 0.02) y **la corrida confirmatoria sobre el test de v1 sigue sin alcanzar significancia** con el test pre-registrado (Fisher + Holm, p=0.063 contra el umbral 0.05) — más cerca del umbral que antes (0.101), pero no lo cruza. La conclusión cualitativa del ciclo no cambia; los números sí, y los originales quedan superados, no simplemente anotados con una limitación al lado.

### Análisis de potencia, corregido

Recalculado con los per-query de la corrida confirmatoria corregida: media de la diferencia pareada nDCG@10 = 0.0672 (antes 0.0507), sd=0.1697 (antes 0.1454), dz=0.3962 (antes 0.3487).

**Corrección de la objeción O4b (revisión adversarial, aceptada sin matices)**: el umbral 0.02 de la regla de parada de este documento (una decisión operativa sobre dev) se había reusado sin nueva justificación como "diferencia mínima clínicamente relevante" del cálculo de potencia, dando n=417. Son dos decisiones distintas que no deberían compartir el mismo número. Separados:

| Escenario | n necesario para potencia 80% (α=0.05, dos colas) |
| --- | --- |
| Efecto igual al observado (dz=0.396) | 52 (antes 67) |
| Efecto a la mitad del observado (dz=0.198) | 202 (antes 261) |
| **Diferencia mínima independiente de 0.05 nDCG@10** (no el 0.02 del barrido) | **93** (antes ~417, mal calculado) |

Intervalos de confianza de la diferencia pareada (objeción O3 aceptada: reportar también el IC por t de Student, no solo el bootstrap — son los dos, y no coinciden en si excluyen cero):

- IC95% bootstrap (percentil, 2000 resamples, semilla 42): **[0.0047, 0.1336]** — excluye cero.
- IC95% t de Student (paramétrico, pareado): **[-0.0028, 0.1373]** — no excluye cero.

No se declara "no-inferioridad" en el sentido formal (exige un margen pre-especificado *antes* de ver los datos, nunca fijado en este proyecto) — se reporta la estimación del efecto con su incertidumbre. Dado que la superioridad no está confirmada con significancia y léxico-solo es la alternativa más simple y barata, el argumento de parsimonia favorece *quedarse* con léxico-solo salvo razón adicional para adoptar la híbrida (objeción O3 aceptada: la lógica de no-inferioridad original estaba invertida).

**No se persigue esta pregunta con más datos** — ninguno de los tres escenarios (52, 202, 93) es alcanzable en el tiempo de un trabajo de grado.

### Correcciones de redacción aplicadas (ronda 1 de la revisión adversarial, O1/O2/O6)

- **O1**: en todo este documento y en `README.md`/`RESULTADOS_TESIS.md`, "la híbrida bien configurada" se acota a la configuración puntual `e5-small, ponderado, α=0.9` — no es una propiedad general de "la híbrida".
- **O2**: el chequeo gratuito sobre v2-test (sección "Addendum" arriba) se reclasifica como **anexo exploratorio**, no una segunda confirmación independiente — dev/test de v2 comparten el mismo corpus de 90 documentos, y el diagnóstico de contaminación de negativos difíciles ya había mirado las 85 consultas completas antes de este barrido. La conclusión de esta investigación se apoya únicamente en el test de v1 (n=25, etiquetado ciego real).
- **O6**: "el modelo de embeddings importa más que los pesos de fusión" baja de hallazgo firme a **hipótesis** — es una comparación de un solo modelo por clase (MiniLM vs. e5-small), con factores confundidos (datos de entrenamiento de cada modelo, prefijos `query:`/`passage:` específicos de e5, escala relativa de los scores) que este barrido no aisló.

## Nota de transparencia (disciplina ya establecida en este proyecto)

El diagnóstico de contaminación por negativos difíciles de la sesión anterior (documentado en `eval/data/v2/README.md`) corrió sobre las 85 consultas completas de v2, no solo sobre las 61 de dev — es decir, tocó las 24 consultas del split de test de v2 de forma puramente diagnóstica (contar apariciones de negativos difíciles en el top-10), sin que ese número influyera en ninguna decisión de diseño de este barrido ni de la regla de parada de arriba. Se declara por la misma disciplina que ya se usa en `preregistro_77.md`.
