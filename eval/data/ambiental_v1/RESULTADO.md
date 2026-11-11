# Resultado — banco de pruebas ambiental v1 (`#197`, épica `#199`)

Comparación pre-registrada (`preregistro.md`, commit `42f0fbc`, anterior a generar cualquier dato) entre:
- **A**: `buscarSimilaresAlpha`, el motor α validado (`#196`);
- **B**: `buscarSimilaresRRF`, el motor que corre hoy.

Los dos usan e5-small y la búsqueda es de expediente contra expediente. Código congelado en `dev` `f255db2`.

## Datos

- **Corpus:** 45 expedientes y 30 consultas sintéticos, 9 temas, generados por 3 subagentes Haiku sin contexto. La verificación independiente (`verificacion.json`) dio 0 errores, sin PII y con Jaccard máximo de 0.125, así que **ninguna consulta se descartó: n = 30**.
- **Corridas:** con las funciones reales de la app sobre `rag_eval_ambiental`. La guarda de `#196` eligió `alpha` en las 30 consultas, y dos corridas completas dieron salidas idénticas.
- **Pool ciego:** 437 pares (unión del top-10 de A y de B). Grados del anotador 1, de 0 a 3: 210 / 148 / 46 / 33.
- **Acuerdo entre anotadores:** κ de Cohen = **0.809** sobre 89 pares doblemente anotados (6 consultas). Anotador 1: 3 sesiones Sonnet aisladas; anotador 2: 1 sesión Sonnet aislada. Ninguna vio qué sistema recuperó cada par.

## Resultado confirmatorio (métrica primaria)

| Sistema | **nDCG@10** [IC 95 %] |
| --- | --- |
| A — α (0.9·coseno + 0.1·ts_rank, trozos) | **0.845** [0.810, 0.876] |
| B — RRF actual (un vector por expediente) | 0.767 [0.690, 0.828] |

Randomización de Fisher pareada, 10.000 permutaciones, semilla 42, dos colas: **p = 0.0419 < 0.05**. Bajo la regla pre-registrada, **α supera a RRF en nDCG@10** en este banco. La diferencia media es +0.078, con dz = 0.37.

**Lectura honesta:** el resultado queda cerca del umbral. Por consulta hay un empate exacto: **15 favorecen a A y 15 a B**. La media la deciden unas pocas consultas donde RRF falla mucho (`QAMB-RES-003`: 0.96 frente a 0.19; `QAMB-SAN-003`: 0.82 frente a 0.20). Las que más favorecen a B pierden poco (la peor: −0.20). α evita los fallos grandes, pero no gana de forma pareja.

## Descriptivos (pre-registrados, sin valor confirmatorio)

| Sistema | Recall@5 | Recall@10 | MRR@10 |
| --- | --- | --- | --- |
| A — α | 0.544 [0.489, 0.593] | 0.832 [0.783, 0.875] | 0.983 [0.950, 1.000] |
| B — RRF | 0.490 [0.419, 0.559] | 0.774 [0.705, 0.838] | 0.955 [0.881, 1.000] |

`04_evaluar.py` también calcula p para estas métricas (0.17, 0.20 y 0.76). El pre-registro las declara descriptivas, así que esos p no se interpretan. Detalle en `metricas_confirmatoria.md`/`.json` y `sanidad_por_consulta.json`.

## Umbral de similitud (secundario pre-registrado, descriptivo)

`umbral_similitud.json`. Sobre el top-10 de A, los 300 resultados:
- **la similitud de e5 queda comprimida entre 0.862 y 0.944** (mediana 0.890);
- la media por grado apenas cambia: 0 → 0.885, 1 → 0.889, 2 → 0.899, 3 → 0.909.

| Umbral | Resultados | Precisión (grado ≥ 2) | Cobertura (grado ≥ 2) | Consultas sin resultados |
| --- | --- | --- | --- | --- |
| 0.60 a 0.85 | 300 | 0.250 | 1.000 | 0 % |
| 0.90 | 82 | 0.488 | 0.533 | 26.7 % |
| 0.95 | 0 | — | 0 | 100 % |

Consecuencias, para decidir aparte:
- el "mínimo 65 %" del frontend **no filtraría nada** con e5;
- todos los resultados mostrarían entre 86 % y 94 %, y con los cortes de color 85/70 todos quedarían en el color más alto;
- el coseno absoluto de e5 casi no separa grados, de modo que un umbral fijo útil no sale de estos datos (0.90 duplica la precisión, pero deja sin resultados a una de cada cuatro consultas).

Recalibrar el frontend (`DetalleExpediente.jsx:3184`, `:3225`) requiere una decisión de producto sobre qué mostrar. Opciones: la posición, un puntaje reescalado al rango observado, o nada.

## Análisis exploratorio (NO pre-registrado)

Separando las consultas según tengan análisis o no:

| Consultas | n | A | B |
| --- | --- | --- | --- |
| con análisis (resumen) | 21 | 0.835 | 0.825 |
| sin análisis | 9 | 0.868 | **0.631** |

La ventaja de α se concentra en los expedientes sin análisis. En ese caso RRF solo ve los primeros 1.500 caracteres en el vector y el título + `que_ordena` en la rama léxica, mientras que α usa los trozos del documento completo. Es una hipótesis generada después de ver los datos; confirmarla necesitaría otro banco.

## Limitaciones

- Datos sintéticos, con relevancia juzgada por IA y no por un abogado ambiental.
- n = 30: un efecto de dz ≈ 0.4 tenía potencia por debajo de 80 % (`preregistro.md`). Que haya salido significativo con dz = 0.37 no quiere decir que el efecto sea grande.
- Los dos sistemas usan e5; no se evaluó el RRF con MiniLM (el modelo que tendría producción si `EMBEDDING_MODEL` no está fijado).
- Una sola mirada: no se agregan consultas ni se repite la prueba.

## Decisión

Ninguna se toma aquí. Por pre-registro, el α no se cambia por este resultado. El resultado **no contradice** usar α en ambiental (`#196`), y pone en duda el umbral y los porcentajes que muestra hoy el frontend.

## Reproducir

```bash
node eval/scripts/ambiental_01_verificar.js
node --env-file=eval/.env.eval.ambiental --import ./eval/guard.js eval/scripts/ambiental_02_correr.js --cargar --correr
node eval/scripts/ambiental_03_pool.js
# (anotación: anotacion/*.md → anotacion/*_resultado.csv)
node eval/scripts/ambiental_04_qrels.js
node eval/scripts/03c_cohen_kappa.js eval/data/ambiental_v1/pool_etiquetado.csv
eval/.venv/Scripts/python.exe eval/scripts/04_evaluar.py --qrels eval/data/ambiental_v1/qrels.trec --split eval/data/ambiental_v1/split.json --subset test --confirmo-uso-de-test --runs A-alpha-e5=eval/data/ambiental_v1/runs/A-alpha-e5.trec B-rrf-e5=eval/data/ambiental_v1/runs/B-rrf-e5.trec --n-permutations 10000 --seed 42 --bootstrap 2000 --out eval/data/ambiental_v1 --out-prefix metricas_confirmatoria
node eval/scripts/ambiental_05_umbral.js
```

`eval/.env.eval.ambiental` (en `.gitignore`) es una copia de `eval/.env.eval.v3` que apunta a `rag_eval_ambiental` y lleva `EMBEDDING_MODEL=Xenova/multilingual-e5-small`. La base se crea con `src/db/init_schema.sql` + `node-pg-migrate up`.
