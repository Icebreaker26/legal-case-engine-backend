# Análisis conceptual: mejoras al generador de prompts (derechos de petición)

> **Estado: documento de referencia conceptual, no implementado.**
> Continuación de [`docs/ANALISIS_ESTIGMERGIA_ECCP.md`](./ANALISIS_ESTIGMERGIA_ECCP.md) dentro del mismo repaso teórico del módulo de derechos de petición. Cubre el generador de prompts (`src/modules/tutelas/services/peticionService.js`): segmentación de la petición, empaquetado en lotes, construcción del prompt, y un diseño conceptual de modo "investigación" con LLM, estructuralmente separado de producción.
>
> No implica cambios de comportamiento en el sistema. Los hallazgos de bugs concretos y el trabajo de instrumentación requerido quedaron como issues aparte: #138 (auditoría general), #142/#143 (dependencias con ECCP), #145 (bug de duplicación de ítems), #146 (instrumentación).
>
> Referencias bibliográficas citadas de memoria — **verificar antes de citar en la tesis**.

---

## 0. Alcance y corrección sobre el contexto previo

El generador de prompts tiene tres sub-problemas distintos, cada uno con su propio tratamiento:

- **A. Segmentación** (`extraerSolicitudes`): partir el texto de la petición en solicitudes individuales.
- **B. Empaquetado** (`agruparEnLotes`): agrupar esas solicitudes en lotes que quepan en el límite de la herramienta corporativa.
- **C. Construcción del prompt** (`construirPromptLote`, `buildFichaPrecedente`, `buildSeccionEstrategia`): ensamblar el texto final que el abogado copia.

Corrección importante encontrada en el análisis: **no hay corte de precedentes por presupuesto de caracteres**. Todas las `sugerencias` devueltas por el RAG entran en todos los lotes del prompt — el único límite real es `limit=5` en `recuperarPrecedentes`, antes de llegar al generador de prompts.

---

## A. Segmentación (`extraerSolicitudes`)

### Marco académico

Dos familias en la literatura:
- **Segmentación temática no supervisada**: TextTiling (Hearst, 1997), C99 (Choi, 2000), modelos probabilísticos (Utiyama & Isahara, 2001). Métricas estándar: Pk (Beeferman, Berger & Lafferty, 1999) y WindowDiff (Pevzner & Hearst, 2002).
- **Etiquetado de secuencias supervisado**: CRF de cadena lineal (Lafferty, McCallum & Pereira, 2001).

**Estas técnicas no son el problema correcto aquí.** Sirven cuando las fronteras entre segmentos son implícitas. En un derecho de petición, las solicitudes casi siempre están enumeradas de forma explícita por convención forense — para fronteras explícitas, las reglas (regex) son el método adecuado. Un CRF necesitaría cientos de documentos etiquetados para superar a las reglas en este caso.

### Debilidades de diseño actuales (no son los bugs de #138)

1. **No ancla la búsqueda a una sección.** Un derecho de petición típico tiene HECHOS numerados y después PETICIONES numeradas. `regexNumerico` recorre todo el texto, así que los hechos numerados pueden capturarse como solicitudes.
   - *Mejora*: buscar primero un encabezado de sección (`PETICION(ES)`, `SOLICITUD(ES)`, `PRETENSIONES`, `SOLICITO`) y enumerar solo desde ahí; si no hay encabezado, mantener el comportamiento actual.
2. **Existe una segunda segmentación independiente que no se usa para verificar.** `buildPromptComprension` ya le pide al LLM externo la lista `peticiones` — hay dos estimadores del mismo número de solicitudes que nunca se cruzan.
   - *Mejora*: si el conteo por regex difiere del conteo de la comprensión, mostrar una alerta al abogado para que revise la segmentación.
   - *Advertencia*: `buildPromptComprension` solo ve los primeros 3000 caracteres — en documentos largos donde las peticiones van al final, la comprensión tampoco las ve. Hay que ampliar el extracto (inicio + final) para que el cruce sea útil.

### Evaluación propuesta

Set de prueba de 30-50 peticiones anonimizadas (nunca en el repo, que es público), midiendo acierto exacto en número de solicitudes y F1 de fronteras.

### Veredicto A

**Mantener las reglas.** Las dos heurísticas cuestan poco y atacan los errores probables. ML no se justifica sin un corpus etiquetado — ver §D.3 para la condición bajo la cual valdría la pena reconsiderarlo.

---

## B. Empaquetado (`agruparEnLotes`): el modelo matemático

### Formalización

Entradas: solicitudes $s_1, \dots, s_n$ en el orden del documento, con tamaños $w_i$; capacidad $B = L - W - 200$ donde $L=128000$ y $W$ es el tamaño del wrapper fijo del prompt.

**Problema (P1), partición contigua de mínimo número de bloques**: encontrar cortes $0 = b_0 < b_1 < \dots < b_k = n$ que minimicen $k$, sujeto a que la suma de tamaños de cada bloque no exceda $B$.

**No es bin packing 1D clásico** (NP-difícil, Garey & Johnson, 1979), porque ahí cualquier ítem puede ir a cualquier bin. Aquí la restricción de **contigüidad** (las solicitudes no se pueden reordenar — el orden del documento importa jurídicamente) reduce el espacio de soluciones y el problema se vuelve **polinomial**: es la variante de minimizar bloques de *linear partition* (Skiena, *The Algorithm Design Manual*, 2.ª ed., 2008).

### Next-fit es óptimo para (P1)

Argumento "greedy stays ahead": sea $g_j$ el último ítem del bloque $j$ del algoritmo voraz (next-fit) y $o_j$ el de cualquier solución factible. Por inducción, $g_j \geq o_j$ para todo $j$ — el voraz siempre "llega más lejos o igual" en cada bloque. Por lo tanto $k_{\text{greedy}} \leq k_{\text{OPT}}$.

**La razón de aproximación de next-fit aquí es exactamente 1 (óptimo), en tiempo $O(n)$.** La cota clásica de Johnson (next-fit ≤ 2·OPT; Johnson, 1973; Johnson, Demers, Ullman, Garey & Graham, 1974) **no aplica**, porque esa cota compara contra un óptimo que puede reordenar libremente, y ese óptimo no es admisible bajo la restricción de contigüidad del dominio.

First-Fit-Decreasing (cota 11/9·OPT + 6/9, Dósa, 2007) exige ordenar por tamaño, lo que viola el orden del documento — su cota es irrelevante aquí. First-Fit sin contigüidad (Dósa & Sgall, 2013) rompería la coherencia argumental entre solicitudes vecinas.

**Conclusión citable para la tesis:**
> "Bajo la restricción de contigüidad impuesta por el orden jurídico del documento, el problema de empaquetado es polinomial y el algoritmo next-fit implementado es óptimo en número de lotes. Las heurísticas clásicas de bin packing solo mejorarían relajando una restricción que el dominio no permite relajar."

### Lo que sí vale la pena: redefinir la capacidad por calidad, no solo por límite de herramienta

$B$ hoy se fija solo por el límite de caracteres de la herramienta corporativa. La literatura sobre contexto efectivo de LLMs (RULER, Hsieh et al., 2024; *Lost in the Middle*, Liu et al., 2024) muestra que el contexto *efectivo* suele ser menor que el nominal, y es razonable (hipótesis, no resultado verificado) que la calidad por respuesta baje si se piden demasiadas solicitudes en una sola salida.

Propuesta: capacidad con dos restricciones — presupuesto de caracteres **y** un tope $q_{max}$ de solicitudes por lote (p. ej. 6). El argumento de optimalidad del greedy **se mantiene** para cualquier restricción "hereditaria" sobre intervalos (si un intervalo es factible, todo sub-intervalo también lo es). Nota irónica para la tesis: el `TAMANO_LOTE = 3` legado ya era, sin saberlo, una restricción de este tipo.

### Balanceo (opcional, de bajo valor)

Con $k^*$ ya fijo, minimizar la carga máxima por lote es un DP clásico de *linear partition* en $O(k \cdot n^2)$, trivial para $n \leq 30$. Pero si $W$ (el wrapper fijo: fichas de precedentes, biblioteca, argumentos repetidos en cada lote) domina la longitud, balancear las solicitudes cambia poco el tamaño total de cada prompt. Probablemente no vale la pena implementarlo.

### ¿Importa en la práctica?

Casi seguro $k=1$ en la mayoría de las peticiones (se necesitarían ~40 páginas solo de peticiones para que $k>1$). Verificar con percentiles de `length(contenido_original)` en producción — si el p99 cabe en $B$, todo este análisis es teórico y el valor real está en la sección C.

### Veredicto B

**No tocar el algoritmo.** Es un buen párrafo de tesis precisamente porque demuestra optimalidad formal, no al revés. Considerar agregar $q_{max}$.

### Posibles bugs relacionados (confirmar si #138 los cubre)
- `medirWrapper` mide con `loteIndex: 1`, excluyendo la estrategia y campos exclusivos del lote 0 — subestima $W$ para ese lote.
- El caller no pasa `comprension` a `agruparEnLotes`, aunque sí la pasa a `construirPromptLote` — otra fuente de subestimación de $W$.

---

## C. Construcción del prompt (`construirPromptLote`)

### Orden actual
Rol/tarea → bases jurídicas → comprensión → estrategia (solo lote 0) → biblioteca → precedentes → argumentos del abogado ("prioridad máxima") → datos de referencia → nota → esquema JSON → **solicitudes al final**.

### C.1 — *Lost in the middle* (Liu et al., 2024, TACL)

Lo que ya está bien: la tarea va al inicio y las solicitudes (lo que hay que responder) al final — es la disposición favorecida tanto por el efecto de recencia como por las guías de proveedores para contexto largo.

Lo vulnerable: **los precedentes y los argumentos del abogado quedan en la zona media**, pese a que los argumentos están marcados como "prioridad máxima" en el texto. Mejora sin costo: moverlos inmediatamente antes de las solicitudes.

Honestidad sobre la magnitud: el efecto de Liu et al. se midió con 10-30 documentos y contextos de miles de tokens; aquí hay ~5 fichas cortas, prompt típico de pocos miles de tokens — **el efecto esperado es pequeño**. El reordenamiento es gratis, pero no se puede afirmar que mejore nada sin medirlo (ver §D.1 y #146).

### C.2 — Consistencia entre lotes (cuando $k>1$)

Literatura aplicable: resumen jerárquico/map-reduce (Wu et al., 2021) con errores de coherencia documentados al fusionar salidas por partes (BooookScore, Chang et al., 2024); paso de estado secuencial entre fragmentos, superior a map-reduce independiente (*Chain of Agents*, Zhang et al., 2024).

Aquí cada lote es una llamada independiente y el abogado es el único canal entre lotes. Riesgos concretos encontrados:

1. **Anclaje de numeración**: el ejemplo JSON del prompt siempre muestra `"numero": 1`, así que cada lote probablemente numera desde 1 aunque sus solicitudes sean la 4, 5 y 6 del documento real. Al fusionar, los números chocan — y por el bug de #145 (`respuesta_peticion_items` sin restricción única), esto puede **duplicar ítems en silencio** en vez de solo pisarlos.
2. **Decisiones globales repartidas**: `prescripcion` se pide en cada lote y se fusiona con "si algún lote dice que aplica, gana" de forma implícita, sin detectar ni registrar contradicciones.
3. **La estrategia solo va en el lote 0** — los lotes siguientes no reciben las líneas de defensa ni la alerta de precedentes desfavorables, lo que puede hacer divergir la argumentación entre partes de la misma petición.
4. Alternativa más robusta pero de mayor costo: generar el prompt del lote $j+1$ solo cuando el abogado pega la respuesta del lote $j$, pasando las decisiones globales ya tomadas (estilo *Chain of Agents*) — cambia el flujo de trabajo actual (los prompts dejan de estar todos disponibles de una vez), solo se justifica si $k>1$ resulta frecuente en la práctica.

### C.3 — Selección y compresión de precedentes

Formulación de selección con restricción de longitud (MMR, Carbonell & Goldstein, 1998; maximización submodular con mochila, Nemhauser, Wolsey & Fisher, 1978; Lin & Bilmes, 2011):

$$\max_{S \subseteq C} \sum_{i \in S} \text{rel}_i - \lambda \sum_{i,j \in S} \text{sim}(i,j) \quad \text{sujeto a} \quad \sum_{i \in S} \text{len}_i \leq B_{ctx}$$

**Con solo 5 candidatos y espacio de sobra, la solución óptima es incluirlos todos — hoy esto es sobreingeniería.** Se vuelve relevante solo si se aumenta el `limit` de recuperación (p. ej. a 15-20). Una regla barata y sí defendible: garantizar que al menos un precedente desfavorable entre los candidatos se incluya siempre, porque la evidencia contraria es la más informativa para preparar la defensa.

Compresión de contexto (LLMLingua, Jiang et al., 2023; RECOMP, Xu, Shi & Choi, 2024) — **descartada**: requiere un LLM, prohibido por la regla de seguridad del backend. Nota: `comprension_doc` ya es, en efecto, una compresión abstractiva hecha fuera de línea con el humano como intermediario.

### C.4 — Problemas de contenido (no son de orden)

- **Regla de prescripción** ("si la infraestructura tiene más de 10 años, aplica prescripción"): el modelo casi nunca conoce la antigüedad real, así que la regla invita a inventar la respuesta. Mejora: condicionar explícitamente a que el texto o los datos de referencia contengan la fecha; si no, `aplica: false` con fundamento "sin información de antigüedad".
- La lista fija de normas ancla al modelo a citarlas aunque no apliquen — validar `normas_citadas` contra un catálogo (ver #146).
- Doble numeración entre la comprensión (que lista todas las peticiones del documento) y las etiquetas del lote — indicar explícitamente qué rango de solicitudes responde cada lote.

### Veredicto C

Implementar las mejoras de C.2 (puntos 1-3), C.4 y la reubicación de argumentos de C.1 — son de bajo costo y alto valor esperado. C.3 es sobreingeniería mientras el `limit` de recuperación siga en 5. La instrumentación de C.5 (ver abajo y #146) es **requisito previo** para afirmar cualquier mejora con datos, no una opción.

### C.5 — ¿Se puede optimizar sin LLM en el backend y sin datos?

**Límite duro real**: la optimización automática de prompts en ciclo con un LLM (APE, Zhou et al., 2023; OPRO, Yang et al., 2024; DSPy, Khattab et al., 2024) está prohibida por la regla de seguridad del backend, y además el modelo externo (Copilot corporativo) es una caja negra que puede cambiar sin aviso.

**No es un límite estructural para todo**: hay señales deterministas medibles sin LLM, calculables en el backend a partir de lo que el abogado pega de vuelta — tasa de fallo de formato/Zod, cobertura de solicitudes respondidas, validez de citas, conflictos entre lotes, y HTER (distancia de edición normalizada entre la respuesta pegada y el documento final — Snover et al., 2006, estándar en traducción automática para medir el esfuerzo de post-edición humana). Ver issue #146.

---

## D. Modo "investigación" con LLM, estructuralmente separado de producción

### D.0 — Dónde está la frontera

**No se implementa como feature flag dentro de `src/`.** Una variable de entorno que active un modo LLM en `src/` es un riesgo de seguridad disfrazado de feature flag: basta una variable mal puesta en el entorno de despliegue para activarla, y el código que llama al LLM quedaría dentro de la imagen de producción.

La separación correcta es **estructural**: no existe un "modo LLM" del backend. Existe *otro programa*, que vive en `eval/` — el mismo patrón que ya usa el arnés de evaluación del RAG.

**Frase citable:**
> "El LLM participa en tiempo de diseño (fuera de línea, en un arnés aislado) y nunca en tiempo de ejecución. Lo que llega a producción es un artefacto estático y determinista — una plantilla de prompt congelada, o los pesos de un modelo de segmentación — versionado y revisado por PR." (Misma distinción que DSPy hace entre "compilar" y "ejecutar" un programa.)

El repo ya tiene gran parte de esta frontera: el `Dockerfile` copia solo `src/`, `migrations/` y `entrypoint.sh` (`eval/` nunca entra a la imagen, si el despliegue real usa ese Dockerfile y no Nixpacks — **pendiente de verificar**); `eval/guard.js` aborta si `DATABASE_URL` no apunta a la base de evaluación local; `.gitignore` ya excluye datos reales y resultados de `eval/`.

### Invariantes — lo que nunca debe ejecutarse en `tutelas_backend`, bajo ninguna configuración

1. Ningún archivo de `src/` importa un SDK de LLM ni hace HTTP a un endpoint de LLM (externo o local).
2. La dependencia es en un solo sentido: `eval/` importa de `src/` (como ya hace el RAG); `src/` nunca importa de `eval/`.
3. Ningún SDK de LLM en `dependencies` del `package.json` raíz — si hace falta uno, va en las dependencias propias de `eval/`.
4. El interruptor **no** va en `src/config/env.js` — vive solo en `eval/.env.eval.llm` (ya cubierto por `.gitignore`), leído únicamente por el script de `eval/` que llama al LLM.
5. Ningún endpoint HTTP, cron ni `npm run dev/start` ejecuta código de `eval/` — todo se corre a mano.
6. Datos reales de Enel nunca entran al ciclo con un LLM externo — ese ciclo usa solo el corpus sintético.
7. Ningún artefacto (plantilla ganadora, pesos de modelo) se carga de forma dinámica — entran a `src/` como texto/JSON estático, por PR hacia `rag/integracion`.

Un job de CI puede verificar los puntos 1-3 automáticamente, con la advertencia honesta de que **CI detecta pero no bloquea** (Railway redespliega aunque el CI falle, según `tutelas_backend/CLAUDE.md`) — la prevención real es la protección de rama y la revisión humana del PR.

### D.1 — Optimización automática de prompts (APE/OPRO/DSPy)

Único cambio necesario en `src/`: la plantilla se convierte en un objeto de configuración versionado y congelado (`PLANTILLA_VIGENTE`, con `id` y hash) — producción siempre usa esa constante; las variantes solo se definen en `eval/`.

Estructura propuesta en `eval/` (mismo patrón que el RAG): generación de prompts por variante (sin LLM) → el único script que llama al LLM, protegido por el guard ampliado → evaluación con las métricas deterministas de C.5 (sin LLM) → opcionalmente, un script que propone nuevas redacciones al estilo OPRO (con LLM).

**Orden de ataque recomendado**: empezar por un **diseño factorial fraccional** ($2^{k-p}$, Montgomery, 2017) sobre ~6 perillas discretas de la plantilla (posición de argumentos, formato de ficha, redacción de prescripción, etc.) — más interpretable y defendible ante el jurado que dejar que el LLM reescriba libremente, y el LLM solo cumple el rol de "ejecutor" (el mismo que Copilot cumple en producción). APE/OPRO sobre redacciones específicas, solo después, si el factorial muestra que esas perillas importan. **DSPy es sobreingeniería aquí**: su valor está en optimizar programas de varias etapas, y hay un solo prompt — exigiría además un puente Python-JS innecesario.

**Datos**: el corpus sintético actual de retrieval no sirve (sus *qrels* son para recuperación, no para calidad de respuesta) — hace falta un corpus sintético nuevo de peticiones con solicitudes enumeradas y casos de varios lotes, que también sirve de set de prueba para la segmentación (§D.3).

**Riesgo de Goodhart**: optimizar solo por métricas deterministas premia respuestas superficiales que cubren todo y citan solo normas del catálogo. Esas métricas son necesarias pero no suficientes — la selección final requiere un **juicio humano ciego en pares** sobre ~20 peticiones de test. Un LLM como juez es una alternativa barata pero con sesgos documentados de posición, longitud y autopreferencia (Zheng et al., 2023) — declarar como limitación, no usar como juez único.

**Amenaza principal — transferencia entre ejecutores**: un prompt optimizado contra un modelo puede no transferir a otro; hay sensibilidad documentada a cambios superficiales del prompt (Sclar et al., 2024). Mitigación obligatoria: validar los 2-3 candidatos finales a mano en la herramienta corporativa real antes de congelar. La afirmación de tesis debe limitarse a "mejor en el ejecutor X, confirmado en Copilot en la fecha F" — nunca "prompt óptimo" sin calificar.

**Congelado a producción**: el ganador se exporta como objeto estático a `src/modules/tutelas/prompts/`, con un test de snapshot que falle si la plantilla cambia sin pasar por PR explícito; `version_plantilla` se registra en cada prompt generado en producción para que la HTER real (de #146) valide después, con datos reales, lo que se optimizó fuera de línea.

### D.2 — Compresión de contexto (LLMLingua/RECOMP)

**Sobreingeniería incluso en modo investigación**, por tres razones independientes: (1) no hay presión de presupuesto — $k=1$ casi siempre y los prompts ocupan una fracción pequeña del límite de 128000 caracteres; (2) ya existe compresión abstractiva vía `comprension_doc`; (3) riesgo específico de dominio legal — estas técnicas podan tokens de baja perplejidad, y en texto jurídico eso puede eliminar negaciones, números de artículo o fechas que cambian el sentido.

El experimento que sí vale la pena, y que no necesita ninguna técnica de compresión porque el código ya tiene las dos representaciones: comparar la ficha abstractiva (`comprension_doc`) contra el fragmento crudo como una perilla más del diseño factorial de D.1.

### D.3 — Segmentación con CRF/ML, condicionada a datos

Antes de etiquetar nada: instrumentar (barato, determinista, ver #146) la tasa real de fallback del regex actual. Regla de decisión pre-registrada: si la tasa de fallback es menor a ~5% y la discrepancia regex/comprensión es baja, **no se hace CRF** — se reporta en la tesis como decisión fundamentada en datos, no como trabajo pendiente.

Si se justifica: CRF de cadena lineal a nivel de línea, entrenado una vez en `eval/` sobre 100-200 peticiones reales etiquetadas (8-15 horas de anotación; el corpus sintético no sirve para esta tarea porque la dificultad real es la variabilidad de formato que un generador sintético no reproduce fielmente). El artefacto en producción es estático: pesos exportados a JSON + un decodificador Viterbi de ~50 líneas en JS, sin dependencia de ML en tiempo de ejecución. **Alternativa de menor riesgo, probablemente suficiente**: usar el CRF solo como herramienta de análisis para revisar qué rasgos pesan más y traducirlos a mejores reglas regex — así ningún modelo entra a producción y la tesis gana una justificación empírica de las reglas existentes.

### D.4 — Resumen de veredictos del modo investigación

| Técnica | Evaluable honestamente | Veredicto |
|---|---|---|
| Factorial de perillas de plantilla | Sí, con corpus sintético nuevo + juicio humano final | **Recomendado** — contribución más defendible |
| APE/OPRO sobre redacciones | Sí, después del factorial | Condicional a que el factorial muestre que esas perillas importan |
| DSPy | Posible pero costoso | Sobreingeniería — un solo prompt no lo justifica |
| Ficha vs. fragmento crudo | Sí, casi gratis | **Recomendado** como perilla del factorial |
| LLMLingua/RECOMP | Posible | Sobreingeniería — sin presión de presupuesto, riesgo legal |
| Tasa de fallback de segmentación | Sí, en producción, determinista | **Prerrequisito** antes de decidir sobre CRF (#146) |
| CRF de segmentación | Solo con datos reales etiquetados | Condicionado a la tasa de fallback; resultado probable: mejores reglas, no un modelo |
| HTER | Solo en producción, con instrumentación | Validación final de cualquier cosa optimizada fuera de línea |

---

## Procedencia académica completa

Todas de memoria — **verificar en fuente primaria antes de citar en la tesis**.

| Autor(es) | Año | Campo | Uso aquí |
|---|---|---|---|
| Hearst | 1997 | Lingüística computacional | TextTiling, segmentación de texto |
| Choi | 2000 | NLP (NAACL) | C99, segmentación |
| Utiyama & Isahara | 2001 | NLP (ACL) | Segmentación por programación dinámica |
| Lafferty, McCallum & Pereira | 2001 | Aprendizaje automático (ICML) | CRF para etiquetado de secuencias |
| Beeferman, Berger & Lafferty | 1999 | Aprendizaje automático | Métrica Pk |
| Pevzner & Hearst | 2002 | Lingüística computacional | Métrica WindowDiff |
| Johnson | 1973 | Algoritmos de aproximación | Cotas de NF/FF en bin packing clásico (no aplican bajo contigüidad) |
| Johnson, Demers, Ullman, Garey & Graham | 1974 | Algoritmos de aproximación (SIAM J. Comput.) | NF ≤ 2·OPT, FF ≈ 1.7·OPT |
| Garey & Johnson | 1979 | Complejidad computacional | Bin packing 1D es NP-difícil |
| Dósa | 2007 | Algoritmos de aproximación | Cota ajustada de FFD |
| Dósa & Sgall | 2013 | Algoritmos de aproximación (STACS) | Cota ajustada de FF |
| Skiena | 2008 (2.ª ed.) | Diseño de algoritmos | Linear partition por programación dinámica |
| Liu et al. | 2024 | NLP/LLMs (TACL) | Lost in the middle |
| Hsieh et al. | 2024 | NLP/LLMs (COLM) | RULER, contexto efectivo menor que el nominal |
| Zhao et al. | 2021 | NLP/LLMs (ICML) | Sesgos de ejemplo y recencia en contexto |
| Wu et al. | 2021 | NLP/LLMs | Resumen recursivo por partes |
| Chang et al. | 2024 | NLP/LLMs (ICLR) | BooookScore, coherencia al fusionar por partes |
| Zhang et al. | 2024 | NLP/LLMs (NeurIPS) | Chain of Agents, estado secuencial entre fragmentos |
| Carbonell & Goldstein | 1998 | Recuperación de información (SIGIR) | MMR, relevancia contra redundancia |
| Nemhauser, Wolsey & Fisher | 1978 | Optimización combinatoria | Greedy (1-1/e) para funciones submodulares |
| Lin & Bilmes | 2011 | NLP (ACL) | Selección submodular con presupuesto |
| Jiang et al. | 2023 | NLP/LLMs (EMNLP) | LLMLingua (descartado por regla de seguridad) |
| Xu, Shi & Choi | 2024 | NLP/LLMs (ICLR) | RECOMP (descartado por regla de seguridad) |
| Snover et al. | 2006 | Traducción automática (AMTA) | TER/HTER, esfuerzo de post-edición |
| Zhou et al. | 2023 | NLP/LLMs (ICLR) | APE, optimización automática de prompts |
| Yang et al. | 2024 | NLP/LLMs (ICLR) | OPRO |
| Khattab et al. | 2024 | NLP/LLMs (ICLR) | DSPy |
| Zheng et al. | 2023 | NLP/LLMs (NeurIPS) | Sesgos del LLM como juez |
| Sclar et al. | 2024 | NLP/LLMs (ICLR) | Sensibilidad del prompt a cambios superficiales |
| Montgomery | 2017 (9.ª ed.) | Diseño de experimentos | Diseños factoriales fraccionales |
| Okazaki / sklearn-crfsuite | 2007 | Software de NLP | Implementación de CRF de cadena lineal |
| Viterbi | 1967 | Teoría de la información | Decodificación del CRF como artefacto estático en producción |

---

## Archivos de referencia en el código

- `src/modules/tutelas/services/peticionService.js` (líneas 3-34 segmentación, 39-74 empaquetado, 103-128 fichas de precedentes, 131-163 estrategia, 167+ construcción del prompt)
- `src/modules/tutelas/controllers/tutelaController.js` (líneas 990-1067 fusión de respuestas por lote, 1113-1126 llamada al generador)
- `migrations/1783000000000_create-respuestas-peticion.js` (sin restricción única en `respuesta_peticion_items` — ver #145)
- `Dockerfile` (frontera física entre `src/` y `eval/` para el modo investigación)
- `eval/guard.js` (base del guard a ampliar para el modo investigación con LLM)
- `.gitignore` (líneas 32-51: exclusión de datos reales y resultados de `eval/`)

## Siguiente paso sugerido

1. Resolver #146 (instrumentación) antes de cualquier trabajo de optimización — sin ella no se puede medir si una mejora funciona.
2. Resolver #145 (bug de duplicación) de forma independiente — es corrección de datos, no depende de ninguna decisión de diseño.
3. Implementar las mejoras de bajo costo de la sección C (reposicionar argumentos, fusión de prescripción, estrategia en todos los lotes) una vez exista instrumentación para confirmar su efecto.
4. Si se decide avanzar con el modo investigación (sección D), empezar por el diseño factorial de D.1 — es la pieza con mejor relación rigor/costo para la tesis.
