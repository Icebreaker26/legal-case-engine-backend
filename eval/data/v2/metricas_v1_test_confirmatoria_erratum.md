# Métricas formales — subset `test` (25 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| e5-a0.9 | 0.562 [0.474, 0.657] | 0.771 [0.693, 0.845] | 0.723 [0.633, 0.803] | 0.909 [0.803, 1.000] |
| lexico-solo | 0.480 [0.386, 0.575] | 0.725 [0.627, 0.811] | 0.656 [0.552, 0.753] | 0.884 [0.767, 0.980] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- e5-a0.9 vs lexico-solo: p_crudo=0.1150, p_holm=0.1150 → no significativo

**recall@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.2265, p_holm=0.2265 → no significativo

**ndcg@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.0630, p_holm=0.0630 → no significativo

**mrr@10**

- e5-a0.9 vs lexico-solo: p_crudo=0.6200, p_holm=0.6200 → no significativo
