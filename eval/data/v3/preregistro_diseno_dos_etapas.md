# Pre-registro — diseño confirmatorio en dos etapas (`#121`)

**Fecha de registro:** 2026-10-03, antes de generar un solo documento o consulta del corpus v3. Escrito siguiendo la recomendación de una consulta a un agente de Opus 5.5 (ver cierre de sesión de `#121`), que encontró dos fallas reales en el plan original de sumar directamente 25 (v1-test) + 24 (v2-test re-etiquetado) + 44 (preguntas nuevas sobre los corpus v1/v2 ya existentes) hasta n=93:

> **Enmienda 1 (2026-10-03, mismo día, antes de indexar o correr nada sobre v3)**: los 3 lotes de generación (sub-agentes Haiku, sin contexto, cada uno con instrucción de generar 7-8 consultas por categoría) redondearon al alza y entregaron **71 consultas**, no 68 — n2=71, N=96. Se actualiza el pre-registro con este número ANTES de indexar, correr o etiquetar nada de v3 (ningún resultado existía todavía cuando se hizo este cambio — no es optional stopping, es ajustar el tamaño de muestra pre-registrado al dato real disponible, antes de ver cualquier resultado). Se usan las 71 consultas completas, no se descarta ninguna para forzar el número original.
>
> **Enmienda 2 (2026-10-03, mismo día, durante el etiquetado ciego, ANTES de calcular ninguna métrica de retrieval sobre v3)**: durante el etiquetado ciego, varios de los 6 agentes anotadores reportaron de forma independiente pares de consultas con texto idéntico. Auditoría completa: **9 de las 71 consultas eran copias exactas de texto de otra consulta del mismo lote** (bug de generación de los sub-agentes Haiku, no detectado en la verificación inicial porque esa verificación chequeó duplicados de `qid`, no de contenido) — 8 grupos: `ISA-001/008`, `DIN-002/008`, `DIN-003/007`, `DIN-004/005`, `ACP-002/005`, `ACP-006/007`, `FAC-003/007/008`, `FAC-005/006`. Dos consultas con el mismo texto exacto no son dos observaciones independientes — violarían el supuesto del test de Fisher. Se descartan las 9 copias "extra" de `split_v3.json` (se conserva solo la primera, por orden alfabético de qid, de cada grupo) — **n2 pasa de 71 a 62, N=87**. Esto ocurre ANTES de correr `04_evaluar.py` o calcular cualquier nDCG@10 sobre v3 — ningún resultado del test confirmatorio existía todavía, así que no es optional stopping: es una corrección de calidad de datos (mismo principio que `#104`/`#113`/`#115`: arreglar el defecto, no solo documentarlo). Las 9 consultas descartadas NO se borran de `corpus_v3.jsonl`/`queries_v3.jsonl` (siguen siendo datos válidos, solo no independientes) — se excluyen únicamente del split de test usado para la comparación confirmatoria. Pérdida de potencia condicional mínima (ver tabla de potencia abajo, recalculada): de 90%/99% a 88%/98% según el escenario — se decide no invertir en generar 9 consultas de reemplazo. Los cálculos de abajo ya reflejan n2=62.

1. **Circularidad a nivel de colección, no de consulta**: la configuración congelada (e5-small, ponderado, α=0.9) se eligió porque separaba bien los 90 documentos de v2 (y, en menor medida, los 40 de v1 — el barrido de `#115` corrió sobre v2-dev, pero v1 ya había decidido antes el modelo e5-small y la eliminación del prefiltro). Cualquier consulta nueva contra esos mismos documentos — sea de test o no — hereda esa ventaja de fábrica. Separar consultas en test/dev no alcanza si los documentos del test ya fueron los que decidieron la configuración ganadora.
2. **Optional stopping**: sumar datos *porque* el resultado anterior (p=0.063) casi cruzó el umbral de significancia es precisamente el patrón "casi dio, agrego más" que el propio proyecto se prometió no seguir (ver el cierre de `#115`, análisis de potencia). Hacerlo sin control infla el error tipo I.

## Diseño elegido: combinación de dos etapas independientes (Lehmacher-Wassmer / inverse-normal)

- **Etapa 1** (ya ocurrió, congelada, no se re-abre): test de v1 (`eval/data/qrels.trec`, `eval/data/split.json`), n₁=25, etiquetado ciego real (`#75`/`#113`). Resultado ya conocido: nDCG@10 e5-a0.9=0.723 vs. léxico-solo=0.656, **p₁ (Fisher, dos colas) = 0.0630** (erratum corregido de `#115`/PR #120).
- **Etapa 2** (nueva, este issue): corpus **v3 completamente nuevo** — documentos y consultas nunca vistos por ninguna configuración anterior, generados por sub-agentes (Haiku, sin contexto de esta investigación ni de ningún hallazgo previo) — **nunca reusa documentos de v1 ni v2**. n₂=**62** (ver enmiendas 1 y 2 arriba: 68 generadas→71 reales→62 tras descartar 9 copias exactas), **todas** las consultas van a test (no hay split dev para v3 — no hace falta, la configuración ya está congelada de antemano, v3 no se usa para tunear nada).
- **N = n₁ + n₂ = 87**.

### Fórmula de combinación (fijada antes de ver cualquier resultado de la etapa 2)

Pesos fijos, determinados solo por los tamaños de muestra (nunca por los resultados):

```
w1 = sqrt(n1 / N) = sqrt(25/87) = 0.5361
w2 = sqrt(n2 / N) = sqrt(62/87) = 0.8442
(verificación: w1² + w2² = 1.0000)
```

Cada etapa aporta un z-score de una cola, en la dirección "la híbrida le gana a léxico-solo" (si el efecto fuera en contra, el z-score sería negativo):

```
Z_i = Φ⁻¹(1 − p_i_dos_colas / 2) · signo(diferencia observada en esa etapa)
```

Para la etapa 1 (ya conocida): p₁=0.0630, diferencia favorece a la híbrida → **Z₁ = Φ⁻¹(1 − 0.0315) = 1.8592**.

**Estadístico combinado**: `Z = w1·Z1 + w2·Z2`. Bajo la hipótesis nula (sin diferencia real), `Z ~ N(0,1)`.

**Regla de decisión (dos colas, α=0.05)**: si `|Z| ≥ 1.96` → significativo. Si no, no significativo.

Como Z₁=1.8592 ya es conocido y fijo, el umbral que debe cruzar por sí sola la etapa 2 es mucho más bajo que si tuviera que demostrar significancia por su cuenta:

```
Z2 necesario = (1.96 − w1·Z1) / w2 = (1.96 − 0.5361·1.8592) / 0.8442 = 1.1411
→ equivalente a p2 (dos colas) ≤ 0.2538
```

Es decir, la etapa 2 no necesita "ganar" sola — solo necesita no contradecir fuertemente lo que ya apuntaba la etapa 1.

### Potencia condicional de la etapa 2 (dado que ya conocemos Z₁)

Con n₂=62 y asumiendo que el efecto real tiene el tamaño mínimo que el proyecto ya definió como relevante (dz=0.2947, diferencia=0.05/sd=0.1697): potencia condicional ≈ **88%**. Si el efecto real fuera igual al observado originalmente en el test de v1 (dz=0.3962): potencia condicional ≈ **98%**. Ambos siguen por encima del 80% objetivo — margen suficiente pese a la pérdida de 9 consultas duplicadas.

### Reglas duras de este pre-registro

1. **Esta es la última mirada.** No se agregan más etapas, ni se recalcula el n₂ después de ver cualquier resultado parcial de v3. Si la combinada no cruza 1.96, la pregunta se cierra definitivamente sin más inversión — igual que ya se decidió en el análisis de potencia de `#115`.
2. **v3 nunca reusa documentos ni consultas de v1 o v2** — generado por sub-agentes sin contexto de ningún hallazgo de esta investigación (mismo principio que la generación de v1/v2 en `#74`/`#115`), con instrucción explícita de no reusar redacciones ni escenarios de los corpus existentes.
3. **Configuración congelada, sin cambios**: híbrida = `multilingual-e5-small`, ponderado, α=0.9, `COALESCE(embedding_comprension, embedding_local)`, sin filtro de categoría, desempate determinista (`documento_id` como criterio secundario). Control = léxico-solo, mismo patrón de dedup/desempate determinista. Métrica primaria: nDCG@10. Test de significancia por etapa: Fisher's Randomization (`ranx`), igual que en todo el proyecto.
4. **Etiquetado de v3-test**: protocolo ciego idéntico a `#75`/`#113` — pooling de varios sistemas candidatos, dos sesiones de IA completamente aisladas (sin contexto de esta investigación, sin ver qué sistema recuperó cada documento), relevancia 0-3 con razón breve, Cohen's kappa entre ambas. Limitación ya declarada (no nueva): sigue siendo IA etiquetando, no un abogado — decisión explícita de Alejandro ya aplicada en `#75`.
5. **v2-test, si se etiqueta de verdad, queda fuera de esta prueba confirmatoria** — solo como análisis secundario de sensibilidad (objeción de Opus aceptada: comparte colección con v2-dev, que sí influyó en elegir la configuración congelada).
6. **Nunca se usa el p-valor de la etapa 2 en aislamiento como criterio de éxito** — solo el estadístico combinado `Z`.

## Especificación del corpus v3 (antes de generar nada)

- **Mismas 9 categorías** de producción (`eval/data/categorias.json`, sin cambios — son las categorías reales que usa `extraerDatosTutela`). Subtemas y base normativa: libres, inventados por los sub-agentes, pero **nunca reutilizando los subtemas ya documentados en `eval/data/v2/README.md`** (evitar cualquier solapamiento de contenido con v1/v2).
- **45 documentos nuevos** (5 por categoría), **71 consultas nuevas** (7-8 por categoría, ver enmienda de n2 arriba).
- **Sin negativos difíciles deliberados** (eso era específico del objetivo de `#115` de encontrar un caso borde) — v3 busca una muestra confirmatoria limpia e independiente, no un caso adversarial.
- **Sin PII real, sin datos de Enel reales** — mismas reglas que v1/v2, verificación independiente obligatoria antes de usar nada (schema Zod, cobertura de IDs, ausencia de patrones de correo/teléfono/cédula).
- Generado en 3 lotes por sub-agentes Haiku en paralelo, cada uno sin contexto de esta conversación ni de ningún hallazgo de `#95`-`#120`, solo con la especificación de dominio y el contrato Zod exacto (mismo principio que `#74`/`#115`).

## Resultado de la etapa 2 (2026-10-03) — y decisión final

Ejecutado tal como se pre-registró arriba: corpus v3 generado (3 lotes Haiku), verificado, indexado en `rag_eval_v3` (e5-small), corridas de léxico-solo + híbrida congelada + vector-solo + RRF (diversidad), pool de 1214 pares sobre las 71 consultas, 9 descartadas por duplicado exacto (enmienda 2, n2=62), etiquetado ciego por 6 sesiones de IA completamente aisladas (5 cubriendo el pool completo como "anotador 1", 1 cubriendo el 20% de doble anotación como "anotador 2" — **Cohen's κ=0.714, "acuerdo sustancial"**, más bajo que el 0.895 de v1, consistente con una medición menos artificialmente convergente).

**Resultado confirmatorio sobre las 62 consultas de v3 (`eval/data/v3/metricas_v3_confirmatoria.md`)**:

| Sistema | Recall@5 | Recall@10 | **nDCG@10** | MRR@10 |
| --- | --- | --- | --- | --- |
| léxico-solo | 0.508 [0.464, 0.557] | 0.728 [0.688, 0.771] | 0.758 [0.725, 0.791] | 0.941 [0.895, 0.976] |
| **e5-small, ponderado, α=0.9** | 0.569 [0.523, 0.617] | 0.805 [0.764, 0.847] | **0.815** [0.785, 0.842] | 0.973 [0.938, 1.000] |

**nDCG@10 p_crudo = p_holm = 0 — significativo**, incluso con corrección de Holm. Con 2000 permutaciones, un p=0 crudo significa "más extremo que las 2000 permutaciones", así que se reporta de forma conservadora como **p₂ < 1/2001 ≈ 0.0005** (dos colas), no como "p=0" literal.

**Chequeo de sanidad antes de aceptar el resultado** (una significancia tan fuerte con n=62 merece verificación, no aceptación automática): inspección de las diferencias por consulta — 44/62 consultas favorecen a la híbrida, 16 favorecen a léxico-solo, 2 empatan (no es un barrido unánime ni sospechoso). Media de la diferencia pareada = 0.0573 (similar en magnitud a la de v1-test, 0.0672), pero con **desviación estándar notablemente más baja** (0.1068 vs. 0.1697 en v1) — eso, no un efecto más grande, es lo que explica la significancia tan fuerte con relativamente pocas consultas (dz=0.5367 en v3 vs. dz=0.3962 en v1). Los casos donde pierde la híbrida (p.ej. `Q-V3-SPR-003`, −0.201) y donde gana por mucho (p.ej. `Q-V3-DIN-003`, +0.394) son coherentes con un mecanismo real de complementariedad, no con un artefacto de generación.

### Combinación final (última mirada)

```
Z1 = 1.8592 (de p1=0.0630, test de v1, n=25)
Z2 > 3.4809 (cota conservadora desde p2 < 0.0005, test de v3, n=62)
w1 = 0.5361, w2 = 0.8442

Z combinado = w1·Z1 + w2·Z2 > 0.5361·1.8592 + 0.8442·3.4809 = 3.9351
umbral (dos colas, α=0.05) = 1.96

|Z combinado| = 3.9351 ≥ 1.96 → SIGNIFICATIVO
p combinado (cota conservadora) ≈ 0.000083
```

**Decisión final, con rigor estadístico completo**: la hipótesis de superioridad de la híbrida congelada (e5-small, ponderado, α=0.9, sin filtro de categoría) sobre léxico-solo en nDCG@10 **se confirma** con el diseño de combinación de dos etapas pre-registrado — ni un solo vistazo nuevo después de este, por diseño (regla dura #1 de este pre-registro). Esto **reemplaza**, no complementa, la conclusión "no se puede confirmar ni descartar" de `#115` — ver la actualización correspondiente en `eval/RESULTADOS_TESIS.md` (sección 4.6).

**Qué NO dice este resultado**: sigue siendo una conclusión sobre un corpus 100% sintético, con relevancia etiquetada por IA (no por un abogado), y sigue sin decir nada sobre si conviene promover `e5-small`/`α=0.9` a producción (decisión de ingeniería aparte, exclusiva de Alejandro). Lo que sí cambia es que la pregunta de investigación original de la tesis ("¿la fusión híbrida le gana a la búsqueda léxica pura?") pasa de "sin resolver por falta de potencia" a **"sí, con significancia estadística, en esta configuración puntual"**.
