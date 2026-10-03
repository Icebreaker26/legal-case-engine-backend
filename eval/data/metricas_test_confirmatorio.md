# Métricas formales — subset `test` (25 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| minilm-filtro-produccion | 0.418 [0.304, 0.534] | 0.473 [0.360, 0.590] | 0.507 [0.371, 0.641] | 0.684 [0.514, 0.844] |
| e5-sin-filtro | 0.559 [0.465, 0.652] | 0.819 [0.730, 0.900] | 0.724 [0.644, 0.797] | 0.866 [0.749, 0.966] |
| e5-rrf-sin-filtro | 0.541 [0.459, 0.633] | 0.789 [0.699, 0.868] | 0.689 [0.626, 0.751] | 0.893 [0.783, 0.980] |
| lexico-solo | 0.525 [0.445, 0.609] | 0.762 [0.689, 0.828] | 0.687 [0.603, 0.766] | 0.889 [0.779, 0.980] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0760, p_holm=0.4560 → no significativo
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.1525, p_holm=0.6100 → no significativo
- minilm-filtro-produccion vs lexico-solo: p_crudo=0.0930, p_holm=0.4650 → no significativo
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.6310, p_holm=1.0000 → no significativo
- e5-sin-filtro vs lexico-solo: p_crudo=0.5185, p_holm=1.0000 → no significativo
- e5-rrf-sin-filtro vs lexico-solo: p_crudo=0.7450, p_holm=1.0000 → no significativo

**recall@10**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0010, p_holm=0.0040 → **significativo**
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.0005, p_holm=0.0025 → **significativo**
- minilm-filtro-produccion vs lexico-solo: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.2415, p_holm=0.7245 → no significativo
- e5-sin-filtro vs lexico-solo: p_crudo=0.3235, p_holm=0.7245 → no significativo
- e5-rrf-sin-filtro vs lexico-solo: p_crudo=0.5990, p_holm=0.7245 → no significativo

**ndcg@10**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0010, p_holm=0.0060 → **significativo**
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.0075, p_holm=0.0300 → **significativo**
- minilm-filtro-produccion vs lexico-solo: p_crudo=0.0025, p_holm=0.0125 → **significativo**
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.1710, p_holm=0.5130 → no significativo
- e5-sin-filtro vs lexico-solo: p_crudo=0.2965, p_holm=0.5930 → no significativo
- e5-rrf-sin-filtro vs lexico-solo: p_crudo=0.9325, p_holm=0.9325 → no significativo

**mrr@10**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0285, p_holm=0.1590 → no significativo
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.0430, p_holm=0.1720 → no significativo
- minilm-filtro-produccion vs lexico-solo: p_crudo=0.0265, p_holm=0.1590 → no significativo
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.6760, p_holm=1.0000 → no significativo
- e5-sin-filtro vs lexico-solo: p_crudo=0.8885, p_holm=1.0000 → no significativo
- e5-rrf-sin-filtro vs lexico-solo: p_crudo=0.9085, p_holm=1.0000 → no significativo
