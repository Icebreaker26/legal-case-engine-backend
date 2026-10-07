# Métricas formales — subset `dev` (61 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| hibrida-sin-filtro | 0.244 [0.204, 0.287] | 0.336 [0.283, 0.393] | 0.445 [0.377, 0.517] | 0.751 [0.666, 0.833] |
| lexico-solo | 0.260 [0.218, 0.303] | 0.383 [0.328, 0.442] | 0.490 [0.422, 0.560] | 0.787 [0.696, 0.870] |
| vector-solo | 0.135 [0.108, 0.163] | 0.223 [0.184, 0.265] | 0.270 [0.226, 0.322] | 0.565 [0.470, 0.667] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- hibrida-sin-filtro vs lexico-solo: p_crudo=0.0930, p_holm=0.0930 → no significativo
- hibrida-sin-filtro vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- lexico-solo vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**

**recall@10**

- hibrida-sin-filtro vs lexico-solo: p_crudo=0.0010, p_holm=0.0010 → **significativo**
- hibrida-sin-filtro vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- lexico-solo vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**

**ndcg@10**

- hibrida-sin-filtro vs lexico-solo: p_crudo=0.0005, p_holm=0.0005 → **significativo**
- hibrida-sin-filtro vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- lexico-solo vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**

**mrr@10**

- hibrida-sin-filtro vs lexico-solo: p_crudo=0.1930, p_holm=0.1930 → no significativo
- hibrida-sin-filtro vs vector-solo: p_crudo=0.0005, p_holm=0.0010 → **significativo**
- lexico-solo vs vector-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**
