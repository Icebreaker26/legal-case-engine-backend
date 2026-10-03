# Pre-registro — `#77`, experimentos confirmatorios en el split de test

**Fecha de registro:** 2026-10-03, antes de ejecutar ningún cálculo de métricas sobre el split de test.
**Commit en el que se registra:** ver el commit que introduce este archivo (`git log -- eval/data/preregistro_77.md`) — se pre-registra en un commit propio, antes del commit que agrega los resultados.

## Contexto y por qué el alcance original de `#77` cambió

El alcance original de `#77` (y su último re-scope, comentario "Re-scope tras el resultado de `#98`") pre-registraba H1 como `ponderado-raw + e5-small` (con el prefiltro de categoría, vigente en ese momento) contra la línea base de producción `ponderado + MiniLM` (también con filtro). Desde entonces, `#104` encontró que la comparación "léxico vs. fusión" de `#75` estaba confundida por ese mismo prefiltro, y `#106` concluyó y corrigió (en `rag/integracion`, no en `main`) que el prefiltro debía eliminarse de la recuperación — es la causa real de la brecha, no el modelo de embeddings.

Por lo tanto, la pregunta real que `#77` tiene que confirmar ya no es solo "¿e5-small gana?" sino **"¿la configuración completa que se propone promover a producción (e5-small, ponderado, SIN el prefiltro de categoría) le gana a lo que está realmente en producción hoy (MiniLM, ponderado, CON el prefiltro)?"** — manteniendo la regla ya fijada de no tunear los pesos de fusión (0.55/0.35/0.10 sin cambios) y de pre-registrar antes de tocar test.

## Hipótesis (pre-registradas, en este orden de prioridad)

- **H1 (principal):** `e5-small, ponderado, SIN prefiltro de categoría` le gana a la línea base real de producción (`MiniLM, ponderado, CON prefiltro de categoría`) — la afirmación central de la tesis ("mejor que lo que hay hoy en producción").
- **H2 (secundaria):** `e5-small, RRF, SIN prefiltro` vs. `e5-small, ponderado, SIN prefiltro` — qué método de fusión conviene más, condicionado a que H1 se confirme.
- **Control:** `léxico-solo` (sin fusión) — ya le había ganado en nDCG a la fusión completa en `#95` y en `#104`/`#106` (con los bugs de medición ya corregidos); el control confirma si sigue siendo competitivo frente a la configuración candidata.

## Métrica primaria y reglas (sin cambios respecto al re-scope anterior)

- **Métrica primaria única: nDCG@10.** Recall@5, Recall@10 y MRR@10 se reportan pero no son la base de la decisión de H1/H2.
- **Pesos de fusión fijos**: 0.55 (vector) / 0.35 (léxico) / 0.10 (feedback) — sin tuning sobre test, consistente con que `#106` dejó el re-tuneo de pesos explícitamente fuera de alcance.
- **Corrección de Holm-Bonferroni** sobre esta familia de comparaciones (H1, H2, control vs. cada uno) — implementada en `eval/scripts/04_evaluar.py` (`#76`).
- **Una sola corrida sobre test.** Los archivos de run ya existen (generados antes de este pre-registro, para los diagnósticos de `#104`/`#106`/`#76` sobre el split de dev — nunca se decidió nada mirando sus valores en test salvo las excepciones ya documentadas como hallazgo post-hoc más abajo).

## Configuraciones exactas (archivo → sha256, fijado en este commit)

| Rol | Sistema | Archivo | sha256 |
| --- | --- | --- | --- |
| Baseline (H1) | MiniLM, ponderado, CON filtro (producción real) | `eval/data/runs/pool-minilm-ponderado.trec` | `2b1f1d6fb32c1b5f4ae3ec7b466661fe91326c75660d34094075dc875538329c` |
| H1 (candidato) | e5-small, ponderado, SIN filtro | `eval/data/runs/pool-e5-ponderado-normalizado.trec` | `05f0d468be965dc901a5a688edbec3ea7c565c2487fcc58564cef6c5ecb7452d` |
| H2 (alternativa) | e5-small, RRF, SIN filtro | `eval/data/runs/E07-e5-rrf-sin-filtro.trec` | `1642fdb6ec6f74e9b28db58800156af8803067af3a1f0880e40ae5b4386f0f3e` |
| Control | léxico-solo | `eval/data/runs/pool-lexico-solo.trec` | `d52da245b157d6ecafe1672e3f3f5bc82bb359315e05cd6227dc10342160700f` |
| Qrels | test (etiquetado real de `#75`) | `eval/data/qrels.trec` | `2a0e1c4d8ba5597e6950ad86d036b55cb09605cd708d9f34df650d5644c078a1` |

`E07-e5-rrf-sin-filtro.trec` se generó específicamente para este pre-registro (no existía — H2 necesitaba la variante RRF sin filtro, antes solo había RRF con filtro). Reproducible con el experimento `E07-e5-rrf-sin-filtro` de `eval/experimentos.json`.

## Comando exacto a ejecutar (después de este commit, en un commit separado)

```bash
eval/.venv/Scripts/python.exe eval/scripts/04_evaluar.py --subset test --confirmo-uso-de-test \
  --runs minilm-filtro-produccion=eval/data/runs/pool-minilm-ponderado.trec \
         e5-sin-filtro=eval/data/runs/pool-e5-ponderado-normalizado.trec \
         e5-rrf-sin-filtro=eval/data/runs/E07-e5-rrf-sin-filtro.trec \
         lexico-solo=eval/data/runs/pool-lexico-solo.trec \
  --out-prefix metricas_test_confirmatorio
```

## Declaración de hallazgos post-hoc previos sobre el split de test (transparencia, no afectan este pre-registro)

Ningún número de este pre-registro se decidió mirando resultados previos en test. Pero, por disciplina de transparencia (protocolo de `#79`), estos vistazos a test ya ocurrieron antes de este pre-registro y se declaran explícitamente:

1. `#75`: pooling + etiquetado de 408 pares sobre las 25 consultas de test — es la fuente de los qrels reales, no una decisión de qué sistema promover.
2. `#104`: cálculo de recall@5/nDCG@5 deduplicado y por filtro/sin-filtro sobre test, para auditar la tabla publicada originalmente — encontró el bug de medición, no influyó en la elección de qué comparar acá.
3. `#106`: desglose por modo de consulta (incl. DIS) con/sin prefiltro sobre test, para entender la magnitud del efecto ya encontrado en dev.
4. `#76`: verificación puntual (descartada, no commiteada) de que `ranx` es inmune al bug de duplicados, corrida sobre `pool-lexico-solo.trec` en test.

Ninguno de estos cuatro vistazos determinó qué configuraciones entran en H1/H2/control de este pre-registro — esas se derivan directamente de la cadena de decisiones de `#98` → `#104` → `#106`, documentada y fechada antes de este archivo. Se declaran igual porque la circularidad perfecta (cero vistazos a test antes de la confirmación) ya no es alcanzable en este proyecto, y pretender lo contrario sería peor que declarar la limitación.
