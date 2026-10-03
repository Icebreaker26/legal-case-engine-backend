# Verificación de #127 — ¿el código de producción reproduce el resultado oficial de #121?

`#123` encontró que `v3-hibrida-congelada-e5-a0.9.trec` (el run oficial de la confirmatoria de `#121`) se generó con SQL directo en `eval/scripts/v2_barrido_pesos.js`, nunca a través de `vectorService.js`/`recuperarPrecedentes` (el pipeline real). `#127` implementó `fusion:'alpha'` en `vectorService.js` replicando esa misma fórmula (coseno*α + ts_rank*(1-α), sin `relevancia_score`) y generó `E08-e5-alpha0.9-reproduccion-v3.trec` corriendo `eval/scripts/04_correr.js` (que sí usa `recuperarPrecedentes`) contra el mismo corpus/queries de v3 (`estrategia:'completo'`, para igualar que el barrido usa el mismo texto en la señal vectorial y léxica).

**Resultado: idéntico.** Mismas métricas exactas (nDCG@10=0.815, recall@10=0.805, mismos IC95%), p=1.0000 en las 4 métricas (Fisher/Holm) — y, verificado aparte con `diff` sobre el orden (consulta, rango, documento) de ambos `.trec`: **0 diferencias en las 710 líneas**, el ranking es idéntico posición por posición, no solo las métricas agregadas. El código de producción, con el modo `fusion:'alpha'` nuevo, reproduce exactamente el resultado que `#121` reportó como confirmación estadística de la tesis.

---

# Métricas formales — subset `test` (62 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| e5-a0.9-oficial | 0.569 [0.523, 0.617] | 0.805 [0.764, 0.847] | 0.815 [0.785, 0.842] | 0.973 [0.938, 1.000] |
| e5-a0.9-reproduccion | 0.569 [0.523, 0.617] | 0.805 [0.764, 0.847] | 0.815 [0.785, 0.842] | 0.973 [0.938, 1.000] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- e5-a0.9-oficial vs e5-a0.9-reproduccion: p_crudo=1.0000, p_holm=1.0000 → no significativo

**recall@10**

- e5-a0.9-oficial vs e5-a0.9-reproduccion: p_crudo=1.0000, p_holm=1.0000 → no significativo

**ndcg@10**

- e5-a0.9-oficial vs e5-a0.9-reproduccion: p_crudo=1.0000, p_holm=1.0000 → no significativo

**mrr@10**

- e5-a0.9-oficial vs e5-a0.9-reproduccion: p_crudo=1.0000, p_holm=1.0000 → no significativo
