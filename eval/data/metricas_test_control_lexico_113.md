# Métricas formales — subset `test` (25 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| minilm-filtro-produccion | 0.410 [0.298, 0.529] | 0.465 [0.349, 0.581] | 0.498 [0.366, 0.632] | 0.684 [0.514, 0.844] |
| e5-sin-filtro | 0.530 [0.444, 0.619] | 0.779 [0.688, 0.861] | 0.701 [0.620, 0.775] | 0.866 [0.749, 0.966] |
| e5-rrf-sin-filtro | 0.510 [0.433, 0.593] | 0.758 [0.661, 0.841] | 0.673 [0.606, 0.738] | 0.893 [0.783, 0.980] |
| lexico-solo-corregido | 0.480 [0.386, 0.575] | 0.725 [0.627, 0.811] | 0.656 [0.552, 0.753] | 0.884 [0.767, 0.980] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0820, p_holm=0.4920 → no significativo
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.1950, p_holm=0.9750 → no significativo
- minilm-filtro-produccion vs lexico-solo-corregido: p_crudo=0.2580, p_holm=0.9750 → no significativo
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.5690, p_holm=1.0000 → no significativo
- e5-sin-filtro vs lexico-solo-corregido: p_crudo=0.1995, p_holm=0.9750 → no significativo
- e5-rrf-sin-filtro vs lexico-solo-corregido: p_crudo=0.5315, p_holm=1.0000 → no significativo

**recall@10**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0010, p_holm=0.0060 → **significativo**
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.0010, p_holm=0.0060 → **significativo**
- minilm-filtro-produccion vs lexico-solo-corregido: p_crudo=0.0020, p_holm=0.0080 → **significativo**
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.3635, p_holm=0.8790 → no significativo
- e5-sin-filtro vs lexico-solo-corregido: p_crudo=0.2930, p_holm=0.8790 → no significativo
- e5-rrf-sin-filtro vs lexico-solo-corregido: p_crudo=0.4365, p_holm=0.8790 → no significativo

**ndcg@10**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0020, p_holm=0.0120 → **significativo**
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.0110, p_holm=0.0500 → **significativo**
- minilm-filtro-produccion vs lexico-solo-corregido: p_crudo=0.0100, p_holm=0.0500 → **significativo**
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.2450, p_holm=0.5535 → no significativo
- e5-sin-filtro vs lexico-solo-corregido: p_crudo=0.1845, p_holm=0.5535 → no significativo
- e5-rrf-sin-filtro vs lexico-solo-corregido: p_crudo=0.6445, p_holm=0.6445 → no significativo

**mrr@10**

- minilm-filtro-produccion vs e5-sin-filtro: p_crudo=0.0280, p_holm=0.1680 → no significativo
- minilm-filtro-produccion vs e5-rrf-sin-filtro: p_crudo=0.0365, p_holm=0.1680 → no significativo
- minilm-filtro-produccion vs lexico-solo-corregido: p_crudo=0.0295, p_holm=0.1680 → no significativo
- e5-sin-filtro vs e5-rrf-sin-filtro: p_crudo=0.6790, p_holm=1.0000 → no significativo
- e5-sin-filtro vs lexico-solo-corregido: p_crudo=1.0000, p_holm=1.0000 → no significativo
- e5-rrf-sin-filtro vs lexico-solo-corregido: p_crudo=0.8795, p_holm=1.0000 → no significativo
