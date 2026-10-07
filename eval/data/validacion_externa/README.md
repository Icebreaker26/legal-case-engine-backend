# Kit de validación externa con tutelas reales (#125)

## Qué es esto y qué NO es

Este kit es solo plantillas, guías y comandos — **no contiene ningún dato real**, no se conecta a producción, y ningún agente lo ejecuta con datos reales. `#121` confirmó la superioridad de la híbrida con rigor estadístico, pero sobre un corpus 100% sintético, etiquetado por IA. Esta validación, si Alejandro decide hacerla, es la única forma de medir si ese resultado se sostiene con precedentes y casos reales de Enel, juzgados por un abogado real — fortalece la defensa de la tesis frente a su limitación más obvia, pero **no bloquea ningún resultado ya confirmado**.

**Antes de usar este kit**, confirmar que la política de Enel permite copiar tutelas anonimizadas a una base local de evaluación (`rag-eval-db`, aislada de producción — ver `eval/README.md`).

Quién hace cada parte:
- **Alejandro**: selecciona las 10-15 tutelas reales, las anonimiza (`GUIA_ANONIMIZACION.md`), decide qué corpus de precedentes usar, y hace el etiquetado de relevancia (`GUIA_ETIQUETADO.md`).
- **Un agente, si se le pide**: puede correr los comandos de este README una vez los archivos anonimizados existan localmente (indexar, correr los sistemas, generar el CSV de pooling) — nunca generar los datos ni hacer el etiquetado.

## Dos decisiones previas que Alejandro tiene que tomar

1. **¿Contra qué corpus de precedentes se buscan las tutelas reales?**
   - Opción A (más simple): contra el mismo corpus sintético v1/v2/v3 ya existente — mide si la híbrida generaliza a *consultas* reales, pero nunca va a encontrar un precedente real relevante (los documentos son sintéticos). Resultado limitado: solo sirve para comparar el *orden relativo* de léxico vs. híbrida sobre texto real, no la relevancia real.
   - Opción B (más representativa, más trabajo): un corpus nuevo de precedentes reales anonimizados, igual de pequeño, armado a mano. Necesario si se quiere medir relevancia real, no solo robustez del *ranking* a texto real.
   - Este kit soporta ambas — las plantillas son iguales, solo cambia qué `corpus.jsonl` se indexa.
2. **¿Una o dos personas etiquetan?** `#75`/`#113` usaron dos sesiones de IA aisladas para medir Cohen's κ (acuerdo entre anotadores). Con un solo abogado real disponible, κ no se puede medir entre dos personas — alternativa barata: el mismo abogado re-etiqueta una muestra pequeña (~20%) días después, sin ver sus respuestas anteriores, y se mide acuerdo intra-anotador. Opcional, no bloqueante.

## Paso a paso (comandos exactos)

Todo corre contra `rag-eval-db` (contenedor Docker aislado, puerto 5435 — nunca producción). Si no existe todavía, levantarlo primero (ver `eval/README.md`): `bash eval/scripts/00_db.sh "$(openssl rand -hex 16)" rag_eval_real`.

### 1. Preparar los archivos (Alejandro, con los datos anonimizados en mano)

- `corpus.jsonl`: documentos de precedentes, formato `eval/schema.js` → `DocSchema` — ver `corpus_template.jsonl` en esta carpeta.
- `queries.jsonl`: las 10-15 tutelas reales anonimizadas como consultas, formato `QuerySchema` — ver `queries_template.jsonl`.

  **Nota importante sobre el schema**: `DocSchema`/`QuerySchema` exigen un campo `spec` (`subtema`, `base_normativa`) que en el corpus sintético se usa para derivar relevancia mecánica automáticamente (`03_generar_qrels.js`). **Para datos reales, ese paso mecánico no aplica — se usa solo el etiquetado humano real.** `spec` sigue siendo obligatorio porque lo exige `cargarYValidar`, pero su contenido es un *placeholder* sin efecto en el resultado final (ver el campo `"__placeholder__"` en las plantillas). No pasarlo en limpio sin ese placeholder — el loader rechaza el archivo.

### 2. Indexar el corpus (agente, con los archivos ya anonimizados)

```bash
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js eval/data/validacion_externa/corpus.jsonl
```

(Ajustar `eval/.env.eval` para que `DATABASE_URL` apunte a la base aislada que se use, p.ej. `rag_eval_real` en el puerto 5435 — nunca producción. `eval/guard.js` rechaza el script si no detecta un host local.)

### 3. Correr los sistemas candidatos (agente)

Mínimo dos: léxico-solo (control) e híbrida congelada. Usar `04_correr.js` (pipeline real, no SQL suelto — ver `#127`):

```bash
node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/04_correr.js \
  --exp E08-e5-alpha0.9-reproduccion-v3 \
  --corpus eval/data/validacion_externa/corpus.jsonl \
  --queries eval/data/validacion_externa/queries.jsonl \
  --out eval/data/validacion_externa/runs
```

Repetir para léxico-solo: gracias a `#127`, ya no hace falta adaptar `00_ablation.js` — léxico-solo es simplemente `fusion:'alpha'` con `alpha:0` (coseno*0 + ts_rank*1). Agregar temporalmente a `eval/experimentos.json`:

```json
{ "id": "E09-lexico-solo-validacion-real", "fusion": "alpha", "alpha": 0, "estrategia": "completo", "comprensionQuery": false, "categoria": "ninguna", "limit": 10 }
```

y correr lo mismo con `--exp E09-lexico-solo-validacion-real`.

### 4. Pooling (agente)

**Importante**: pasar `--corpus`/`--queries`/`--split` explícitos — sin ellos, el script usa por default `eval/data/corpus.jsonl`/`queries.jsonl`/`split.json` (los del corpus v1 principal, no los de esta carpeta), y poolea 0 pares en silencio si los qids no coinciden (verificado en el dry-run de este kit).

```bash
node eval/scripts/03b_pool_etiquetado.js \
  --corpus eval/data/validacion_externa/corpus.jsonl \
  --queries eval/data/validacion_externa/queries.jsonl \
  --split eval/data/validacion_externa/split.json \
  --runs eval/data/validacion_externa/runs/E08-e5-alpha0.9-reproduccion-v3.trec,eval/data/validacion_externa/runs/<run-lexico>.trec \
  --out eval/data/validacion_externa/pool_etiquetado.csv
```

Esto genera el CSV que el abogado etiqueta — ver `GUIA_ETIQUETADO.md` antes de abrirlo.

### 5. Etiquetado (Alejandro o el abogado — nunca un agente)

Llenar `relevancia_anotador1_0a3` en `pool_etiquetado.csv` siguiendo `GUIA_ETIQUETADO.md`. Las columnas `sistemas`/`n_sistemas_que_lo_recuperaron` deben ocultarse durante el etiquetado (copiar el CSV sin esas columnas a quien etiqueta, o tapar la hoja si es Excel) — si quien etiqueta ve qué sistema recuperó cada documento, el etiquetado deja de ser ciego.

### 6. Fusionar qrels y evaluar (agente, una vez el CSV está completo)

A diferencia del corpus sintético, aquí no hay relevancia mecánica previa (no hay `spec` real que derive verdad de referencia) — crear `qrels.trec` **vacío** antes de fusionar (en bash: `: > eval/data/validacion_externa/qrels.trec`, o un archivo vacío en Windows). `03d_fusionar_qrels.js` lo llena por completo con el etiquetado real.

```bash
node eval/scripts/03d_fusionar_qrels.js \
  --pool eval/data/validacion_externa/pool_etiquetado.csv \
  --qrels eval/data/validacion_externa/qrels.trec \
  --split eval/data/validacion_externa/split.json

eval/.venv/Scripts/python.exe eval/scripts/04_evaluar.py \
  --qrels eval/data/validacion_externa/qrels.trec \
  --split eval/data/validacion_externa/split.json \
  --subset test --confirmo-uso-de-test \
  --runs hibrida=eval/data/validacion_externa/runs/E08-e5-alpha0.9-reproduccion-v3.trec \
         lexico=eval/data/validacion_externa/runs/<run-lexico>.trec \
  --out eval/data/validacion_externa
```

`split.json` con n tan pequeño (10-15) no necesita dev/test real — poner todas las qids en `"test"` y un `"dev": []` vacío, igual que hizo `split_v3.json` para la etapa 2 de `#121`.

## Verificación de este kit

Antes de entregarlo, se corrió toda la cadena de comandos de este README de punta a punta contra una base de prueba descartable (`rag_eval_kit_test`, nunca `rag-eval-db` ni producción), usando los archivos `*_template.*` de esta carpeta como datos dummy — indexado, dos corridas, pooling, etiquetado dummy, fusión de qrels y evaluación con `ranx` funcionaron sin errores. Esa prueba encontró y corrigió dos imprecisiones que tenía una versión anterior de esta guía: (a) `03b_pool_etiquetado.js` necesita `--corpus`/`--queries`/`--split` explícitos, sin ellos poolea 0 pares en silencio contra los archivos del corpus v1 principal; (b) `qrels.trec` debe crearse vacío antes de fusionar, no existe una relevancia mecánica de partida para datos reales.

## Qué hacer con el resultado

Con n=10-15 **no esperar significancia estadística** — es un tamaño de muestra para inspección cualitativa (¿la híbrida se ve claramente mejor, peor, o igual en casos reales?), no para otra prueba confirmatoria. Documentar el resultado como evidencia adicional/cualitativa en `eval/RESULTADOS_TESIS.md`, nunca como una réplica con el mismo peso estadístico que `#121`.
