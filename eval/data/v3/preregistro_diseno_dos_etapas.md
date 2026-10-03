# Pre-registro — diseño confirmatorio en dos etapas (`#121`)

**Fecha de registro:** 2026-10-03, antes de generar un solo documento o consulta del corpus v3. Escrito siguiendo la recomendación de una consulta a un agente de Opus 5.5 (ver cierre de sesión de `#121`), que encontró dos fallas reales en el plan original de sumar directamente 25 (v1-test) + 24 (v2-test re-etiquetado) + 44 (preguntas nuevas sobre los corpus v1/v2 ya existentes) hasta n=93:

1. **Circularidad a nivel de colección, no de consulta**: la configuración congelada (e5-small, ponderado, α=0.9) se eligió porque separaba bien los 90 documentos de v2 (y, en menor medida, los 40 de v1 — el barrido de `#115` corrió sobre v2-dev, pero v1 ya había decidido antes el modelo e5-small y la eliminación del prefiltro). Cualquier consulta nueva contra esos mismos documentos — sea de test o no — hereda esa ventaja de fábrica. Separar consultas en test/dev no alcanza si los documentos del test ya fueron los que decidieron la configuración ganadora.
2. **Optional stopping**: sumar datos *porque* el resultado anterior (p=0.063) casi cruzó el umbral de significancia es precisamente el patrón "casi dio, agrego más" que el propio proyecto se prometió no seguir (ver el cierre de `#115`, análisis de potencia). Hacerlo sin control infla el error tipo I.

## Diseño elegido: combinación de dos etapas independientes (Lehmacher-Wassmer / inverse-normal)

- **Etapa 1** (ya ocurrió, congelada, no se re-abre): test de v1 (`eval/data/qrels.trec`, `eval/data/split.json`), n₁=25, etiquetado ciego real (`#75`/`#113`). Resultado ya conocido: nDCG@10 e5-a0.9=0.723 vs. léxico-solo=0.656, **p₁ (Fisher, dos colas) = 0.0630** (erratum corregido de `#115`/PR #120).
- **Etapa 2** (nueva, este issue): corpus **v3 completamente nuevo** — documentos y consultas nunca vistos por ninguna configuración anterior, generados por sub-agentes (Haiku, sin contexto de esta investigación ni de ningún hallazgo previo) — **nunca reusa documentos de v1 ni v2**. n₂=**68**, **todas** las consultas van a test (no hay split dev para v3 — no hace falta, la configuración ya está congelada de antemano, v3 no se usa para tunear nada).
- **N = n₁ + n₂ = 93** (el tamaño que el análisis de potencia de `#115` calculó para 80% de potencia con una diferencia mínima de 0.05 nDCG@10).

### Fórmula de combinación (fijada antes de ver cualquier resultado de la etapa 2)

Pesos fijos, determinados solo por los tamaños de muestra (nunca por los resultados):

```
w1 = sqrt(n1 / N) = sqrt(25/93) = 0.5185
w2 = sqrt(n2 / N) = sqrt(68/93) = 0.8551
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
Z2 necesario = (1.96 − w1·Z1) / w2 = (1.96 − 0.5185·1.8592) / 0.8551 = 1.1648
→ equivalente a p2 (dos colas) ≤ 0.2441
```

Es decir, la etapa 2 no necesita "ganar" sola — solo necesita no contradecir fuertemente lo que ya apuntaba la etapa 1.

### Potencia condicional de la etapa 2 (dado que ya conocemos Z₁)

Con n₂=68 y asumiendo que el efecto real tiene el tamaño mínimo que el proyecto ya definió como relevante (dz=0.2947, diferencia=0.05/sd=0.1697): potencia condicional ≈ **90%**. Si el efecto real fuera igual al observado originalmente en el test de v1 (dz=0.3962): potencia condicional ≈ **98%**. n₂=68 deja margen razonable, no es un número ajustado al límite.

### Reglas duras de este pre-registro

1. **Esta es la última mirada.** No se agregan más etapas, ni se recalcula el n₂ después de ver cualquier resultado parcial de v3. Si la combinada no cruza 1.96, la pregunta se cierra definitivamente sin más inversión — igual que ya se decidió en el análisis de potencia de `#115`.
2. **v3 nunca reusa documentos ni consultas de v1 o v2** — generado por sub-agentes sin contexto de ningún hallazgo de esta investigación (mismo principio que la generación de v1/v2 en `#74`/`#115`), con instrucción explícita de no reusar redacciones ni escenarios de los corpus existentes.
3. **Configuración congelada, sin cambios**: híbrida = `multilingual-e5-small`, ponderado, α=0.9, `COALESCE(embedding_comprension, embedding_local)`, sin filtro de categoría, desempate determinista (`documento_id` como criterio secundario). Control = léxico-solo, mismo patrón de dedup/desempate determinista. Métrica primaria: nDCG@10. Test de significancia por etapa: Fisher's Randomization (`ranx`), igual que en todo el proyecto.
4. **Etiquetado de v3-test**: protocolo ciego idéntico a `#75`/`#113` — pooling de varios sistemas candidatos, dos sesiones de IA completamente aisladas (sin contexto de esta investigación, sin ver qué sistema recuperó cada documento), relevancia 0-3 con razón breve, Cohen's kappa entre ambas. Limitación ya declarada (no nueva): sigue siendo IA etiquetando, no un abogado — decisión explícita de Alejandro ya aplicada en `#75`.
5. **v2-test, si se etiqueta de verdad, queda fuera de esta prueba confirmatoria** — solo como análisis secundario de sensibilidad (objeción de Opus aceptada: comparte colección con v2-dev, que sí influyó en elegir la configuración congelada).
6. **Nunca se usa el p-valor de la etapa 2 en aislamiento como criterio de éxito** — solo el estadístico combinado `Z`.

## Especificación del corpus v3 (antes de generar nada)

- **Mismas 9 categorías** de producción (`eval/data/categorias.json`, sin cambios — son las categorías reales que usa `extraerDatosTutela`). Subtemas y base normativa: libres, inventados por los sub-agentes, pero **nunca reutilizando los subtemas ya documentados en `eval/data/v2/README.md`** (evitar cualquier solapamiento de contenido con v1/v2).
- **45 documentos nuevos** (5 por categoría), **68 consultas nuevas** (~7-8 por categoría).
- **Sin negativos difíciles deliberados** (eso era específico del objetivo de `#115` de encontrar un caso borde) — v3 busca una muestra confirmatoria limpia e independiente, no un caso adversarial.
- **Sin PII real, sin datos de Enel reales** — mismas reglas que v1/v2, verificación independiente obligatoria antes de usar nada (schema Zod, cobertura de IDs, ausencia de patrones de correo/teléfono/cédula).
- Generado en 3 lotes por sub-agentes Haiku en paralelo, cada uno sin contexto de esta conversación ni de ningún hallazgo de `#95`-`#120`, solo con la especificación de dominio y el contrato Zod exacto (mismo principio que `#74`/`#115`).

## Siguiente paso exacto

1. Generar los 3 lotes del corpus v3 (sub-agentes Haiku, en paralelo).
2. Verificación independiente (schema, cobertura de IDs, sin PII, qrels mecánicos sanos — solo como sanity check, nunca como relevancia final de test).
3. Indexar v3 en una base de evaluación propia (`rag_eval_v3`, nunca mezclada con v1/v2).
4. Correr léxico-solo + híbrida congelada (e5-small, α=0.9) sobre las 68 consultas, más sistemas de diversidad para el pool.
5. Poolear top-10 y etiquetar a ciegas con dos sesiones de IA aisladas (protocolo de `#75`).
6. Calcular Cohen's kappa, fusionar en `qrels_v3.trec`.
7. Correr la comparación confirmatoria (Fisher, nDCG@10) sobre las 68 consultas de v3 → Z₂.
8. Combinar con Z₁=1.8592 usando los pesos fijos de arriba → decisión final, última mirada.
