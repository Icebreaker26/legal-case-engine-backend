# Pre-registro — banco de pruebas ambiental v1 (`#197`, épica `#199`)

**Fecha de registro:** 2026-11-11. Se escribió y se commiteó **antes de generar un solo expediente o consulta** de este banco. Cualquier cambio posterior va como enmienda fechada al final, indicando si ocurrió antes o después de ver algún resultado.

**Código evaluado (congelado):** rama `dev` en `f255db2` (después de `#192`-`#196` y `#198`). No se toca el código del motor durante esta evaluación.

## Pregunta

En la búsqueda de expedientes ambientales similares (`GET /expedientes/:id/similares`: un expediente completo contra los demás), ¿la configuración validada en la tesis da un ranking distinto del motor RRF que corre hoy?

- **Sistema A — α (nuevo, `#196`):** `buscarSimilaresAlpha` (`src/modules/ambiental/services/ambientalEmbeddingService.js`). Usa `0.9·coseno + 0.1·min(ts_rank, 1)` sobre `chunks_ambiental` (trozos de 1.500 caracteres con solape de 300, `passage: `), con el mejor trozo por expediente. El vector de la consulta es `query: ` del último resumen + `que_ordena`, o de los primeros 1.500 caracteres del contenido si no hay análisis. El texto léxico es el contenido completo.
- **Sistema B — RRF (actual):** `buscarSimilaresRRF` (mismo archivo). Un vector por expediente en `embeddings_ambiental` (primeros 1.500 caracteres, o resumen + `que_ordena` si hay análisis, `passage: `), con RRF k = 60 y 20 candidatos por rama. La rama léxica usa `search_vector` contra resumen + título + `que_ordena` (500 caracteres).
- **Mismo modelo en los dos:** `Xenova/multilingual-e5-small`. Así la comparación aísla el motor (fusión, trozos, consulta) y no el modelo. Lo que decide este banco es si, con e5 configurado, conviene α o RRF. El RRF con MiniLM no se evalúa.
- Los dos sistemas se llaman con las funciones reales de la app, sin reimplementarlas, con `limite = 10` (el máximo que permite el endpoint).

## Hipótesis y prueba confirmatoria (una sola)

- **H0:** la media de nDCG@10 por consulta es igual en A y en B. **H1:** es distinta (dos colas).
- **Métrica primaria:** nDCG@10 con los grados 0-3 del anotador 1 (ver "Juicios").
- **Prueba:** randomización de Fisher pareada por consulta (`ranx`, `eval/scripts/04_evaluar.py`), **10.000 permutaciones**, semilla 42, **α = 0.05**. Es una sola comparación confirmatoria, sin corrección por multiplicidad.
- **Regla de decisión:** p < 0.05 → hay diferencia; la dirección la da el signo de la media. Si no, no se puede afirmar diferencia.
- **Consecuencia (fijada de antemano):** el α no se cambia por este resultado, sea cual sea (`#197`: "sin cambiar el α si el resultado es peor: se reporta y se decide aparte"). Re-barrer α para ambiental está fuera de alcance.
- **Una sola mirada.** No se agregan consultas ni se repite la corrida después de ver el resultado.

## Análisis secundarios (descriptivos, no confirmatorios)

1. Recall@5, Recall@10 y MRR@10 de A y B, con IC 95 % por bootstrap (2.000 remuestreos por consulta, semilla 42), sin pruebas de significancia.
2. **Umbral de similitud** (insumo para el "mínimo 65 %" y los cortes de color del frontend, calibrados con MiniLM). Sobre los resultados de **A** (top-10 por consulta) y su `similitud` (coseno del mejor trozo), para cada umbral t ∈ {0.60, 0.65, …, 0.95}:
   - precisión: fracción de resultados con `similitud ≥ t` que tienen grado ≥ 2;
   - cobertura: fracción de los pares con grado ≥ 2 del top-10 de A que quedan con `similitud ≥ t`;
   - fracción de consultas que quedan sin ningún resultado.
   Se reporta la tabla. La decisión de aplicar un umbral, y cuál, se toma aparte.
3. Sanidad: cuántas consultas favorecen a A, cuántas a B y cuántas empatan.

Fuera de este banco: el prefijo simétrico (`passage: ` también en la consulta). Queda como pregunta abierta.

## Corpus (sintético)

- **45 expedientes de corpus + 30 expedientes de consulta**, en archivos separados (`corpus.jsonl`, `consultas.jsonl`) con el contrato de `eval/schemaAmbiental.js`. Las consultas nunca están en el corpus de búsqueda.
- **9 temas × 5 expedientes de corpus**, con 2-3 subtemas por tema. Las consultas se reparten 4 por tema en 3 temas y 3 por tema en los otros 6 (total 30). Los temas son `COMPENSACION_FORESTAL`, `LICENCIA_AMBIENTAL_LT`, `VERTIMIENTOS`, `OCUPACION_CAUCE`, `SANCIONATORIO`, `LEVANTAMIENTO_VEDA`, `RUIDO_SUBESTACION`, `RESIDUOS_PELIGROSOS` y `CONCESION_AGUAS`, típicos de una empresa de transmisión de energía frente a autoridades ambientales.
- Alrededor del 70 % de los expedientes con análisis (`resumen` + `nivel_riesgo`); el resto, sin análisis, para ejercitar las dos ramas de construcción de la consulta.
- **Generación:** 3 lotes, cada uno con 3 temas (15 de corpus y 10 de consulta), a cargo de subagentes Haiku **sin contexto** de esta investigación, del código ni de los sistemas comparados. Solo reciben la especificación de dominio y el contrato. Se les indica no usar datos reales: ni nombres de personas, ni empresas, ni números de expediente o de resolución reales. Los números siguen el formato `SINT-AMB-NNNN` y los lugares son genéricos.
- **Verificación independiente**, antes de indexar: contrato Zod; ids sin duplicar; cobertura exacta de temas y conteos; sin PII (patrones de correo, teléfono y cédula); y **duplicados por contenido**, la lección de v3.

### Regla de duplicados (fijada antes de generar)

Se calcula la similitud de Jaccard entre conjuntos de 5-gramas de palabras de `contenido_texto` para todos los pares, entre consultas y entre consulta y corpus.
- Si Jaccard ≥ 0.8 entre dos consultas, se descarta la de qid mayor.
- Si Jaccard ≥ 0.8 entre una consulta y un expediente de corpus, se descarta la consulta.
- Los duplicados dentro del corpus se reportan, pero no se descartan, porque son parte del escenario de búsqueda.

Los descartes ocurren **antes de calcular cualquier métrica** y se registran como enmienda. No se generan reemplazos.

## Juicios de relevancia (protocolo de `#75`/`#121`)

- **Pool:** la unión del top-10 de A y de B por consulta. Las columnas que dicen qué sistema recuperó cada par se ocultan durante el etiquetado, y los pares se ordenan por id de documento, no por ranking.
- **Escala 0-3:** "¿qué tan útil es el expediente candidato como precedente para atender el expediente consulta?"
  - 3 = misma obligación o situación, directamente aplicable;
  - 2 = mismo tema con diferencias relevantes, útil como referencia;
  - 1 = relación tangencial;
  - 0 = no relacionado.
  Cada juicio lleva una razón breve.
- **Anotador 1:** cubre el pool completo, repartido en sesiones de IA aisladas entre sí y sin contexto de esta investigación. **Anotador 2:** otra sesión aislada sobre el 20 % de las consultas, elegidas al azar con semilla 42.
- **Qrels:** el grado del anotador 1 es la verdad de referencia, igual que en v3 (`03d_fusionar_qrels.js`). El anotador 2 solo sirve para calcular la **κ de Cohen** (`03c_cohen_kappa.js`), que se reporta tal cual. Los pares que no están en el pool cuentan como no relevantes (0). En Recall y MRR, relevante = grado ≥ 1 (el criterio por defecto de `ranx`, el mismo de v3).
- **Limitación ya declarada:** etiqueta una IA, no un abogado ambiental, y el corpus es sintético.

## Potencia

Con n = 30 consultas pareadas, dos colas y α = 0.05, la potencia de 80 % alcanza para efectos estandarizados de dz ≈ 0.53 (90 % para dz ≈ 0.61). En el test de v1 (etapa 1 de `#121`), α frente a léxico-solo dio dz ≈ 0.40: un efecto de ese tamaño **podría no detectarse** con este n. Un resultado no significativo aquí no demuestra equivalencia.

## Aislamiento

La evaluación corre sobre la base `rag_eval_ambiental` del contenedor `rag-eval-db` (`127.0.0.1:5435`), protegida por `eval/guard.js`, nunca contra dev, test ni producción. Las migraciones se aplican sobre esa base y no se toca ninguna otra.

## Enmiendas

> **Nota 1 (2026-11-11, antes de calcular cualquier métrica y antes de recibir ningún juicio de relevancia).** Registro de ejecución; no cambia el diseño.
> - **Generación:** 3 subagentes Haiku sin contexto (un lote de 3 temas cada uno). La verificación independiente (`eval/scripts/ambiental_01_verificar.js` → `verificacion.json`) dio 0 errores, con 45 expedientes de corpus y 30 consultas. Tienen análisis 33 de 45 y 21 de 30. No hay PII. El Jaccard máximo de 5-gramas fue 0.125 entre consulta y corpus y 0.042 entre consultas, de modo que **ninguna consulta se descarta** y n = 30.
> - **Indexación:** la base `rag_eval_ambiental` se creó con `src/db/init_schema.sql` + las 119 migraciones de `dev` (`f255db2`). Quedaron 75 expedientes con vector único y trozos (292 trozos, todos e5). En las 30 consultas, la guarda de `#196` eligió `alpha` sin caer a RRF. Las dos corridas completas (`ambiental_02_correr.js --correr`) produjeron salidas idénticas, así que la corrida es determinista.
> - **Pool:** 437 pares, unión del top-10 de A y de B. La doble anotación cubre 6 consultas (20 %, elegidas con semilla 42): `QAMB-CFO-002`, `QAMB-RUI-002`, `QAMB-SAN-001`, `QAMB-SAN-003`, `QAMB-VED-002` y `QAMB-VER-003` (89 pares).
> - **Anotadores:** el pre-registro no fijaba el modelo. Se usan sesiones Sonnet aisladas: el anotador 1 en 3 sesiones de 10 consultas y el anotador 2 en 1 sesión. Cada una solo ve su paquete (`anotacion/*.md`), sin columnas de sistema y con los pares ordenados por id de documento.
