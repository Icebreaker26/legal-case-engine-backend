# Métricas formales — subset `test` (25 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| e5-a0.9 | 0.519 [0.434, 0.607] | 0.787 [0.695, 0.870] | 0.706 [0.620, 0.784] | 0.894 [0.783, 0.980] |
| lexico-solo | 0.480 [0.386, 0.575] | 0.725 [0.627, 0.811] | 0.656 [0.552, 0.753] | 0.884 [0.767, 0.980] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- e5-a0.9 vs lexico-solo: p_crudo=0.2445, p_holm=0.2445 → no significativo

**recall@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.2175, p_holm=0.2175 → no significativo

**ndcg@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.1010, p_holm=0.1010 → no significativo

**mrr@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.2565, p_holm=0.2565 → no significativo
