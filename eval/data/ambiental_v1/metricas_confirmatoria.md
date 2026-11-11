# Métricas formales — subset `test` (30 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| A-alpha-e5 | 0.544 [0.489, 0.593] | 0.832 [0.783, 0.875] | 0.845 [0.810, 0.876] | 0.983 [0.950, 1.000] |
| B-rrf-e5 | 0.490 [0.419, 0.559] | 0.774 [0.705, 0.838] | 0.767 [0.690, 0.828] | 0.955 [0.881, 1.000] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- A-alpha-e5 vs B-rrf-e5: p_crudo=0.1672, p_holm=0.1672 → no significativo

**recall@10**

- A-alpha-e5 vs B-rrf-e5: p_crudo=0.2025, p_holm=0.2025 → no significativo

**ndcg@10**

- A-alpha-e5 vs B-rrf-e5: p_crudo=0.0419, p_holm=0.0419 → **significativo**

**mrr@10**

- A-alpha-e5 vs B-rrf-e5: p_crudo=0.7562, p_holm=0.7562 → no significativo
