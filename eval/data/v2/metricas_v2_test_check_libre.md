# Métricas formales — subset `test` (24 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| e5-a0.9 | 0.358 [0.307, 0.407] | 0.532 [0.453, 0.602] | 0.707 [0.647, 0.760] | 1.000 [1.000, 1.000] |
| lexico-solo | 0.319 [0.267, 0.371] | 0.481 [0.402, 0.554] | 0.647 [0.579, 0.713] | 1.000 [1.000, 1.000] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- e5-a0.9 vs lexico-solo: p_crudo=0.0040, p_holm=0.0040 → **significativo**

**recall@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.0245, p_holm=0.0245 → **significativo**

**ndcg@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.0005, p_holm=0.0005 → **significativo**

**mrr@10**

- e5-a0.9 vs lexico-solo: p_crudo=1.0000, p_holm=1.0000 → no significativo
