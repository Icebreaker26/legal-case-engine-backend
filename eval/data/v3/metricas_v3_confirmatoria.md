# Métricas formales — subset `test` (62 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| e5-a0.9 | 0.569 [0.523, 0.617] | 0.805 [0.764, 0.847] | 0.815 [0.785, 0.842] | 0.973 [0.938, 1.000] |
| lexico-solo | 0.508 [0.464, 0.557] | 0.728 [0.688, 0.771] | 0.758 [0.725, 0.791] | 0.941 [0.895, 0.976] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- e5-a0.9 vs lexico-solo: p_crudo=0.0025, p_holm=0.0025 → **significativo**

**recall@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.0010, p_holm=0.0010 → **significativo**

**ndcg@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**

**mrr@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.1415, p_holm=0.1415 → no significativo
