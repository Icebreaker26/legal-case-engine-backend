# Métricas formales — subset `dev` (95 consultas)

Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. IC 95% por bootstrap (2000 resamples, semilla 42).

| Sistema | recall@5 | recall@10 | ndcg@10 | mrr@10 |
|---|---|---|---|---|
| minilm-filtro | 0.413 [0.342, 0.486] | 0.471 [0.396, 0.542] | 0.456 [0.384, 0.530] | 0.584 [0.499, 0.672] |
| minilm-sin-filtro | 0.389 [0.347, 0.432] | 0.551 [0.505, 0.597] | 0.515 [0.473, 0.557] | 0.748 [0.676, 0.814] |
| e5-filtro | 0.438 [0.368, 0.509] | 0.526 [0.452, 0.599] | 0.502 [0.430, 0.574] | 0.618 [0.530, 0.704] |
| e5-rrf | 0.437 [0.365, 0.509] | 0.523 [0.451, 0.596] | 0.477 [0.406, 0.553] | 0.562 [0.477, 0.650] |
| e5-sin-filtro | 0.456 [0.414, 0.498] | 0.621 [0.581, 0.660] | 0.584 [0.540, 0.626] | 0.808 [0.743, 0.868] |

## Significancia pareada (p ajustado por Holm, dentro de cada métrica)

**recall@5**

- minilm-filtro vs minilm-sin-filtro: p_crudo=0.4895, p_holm=1.0000 → no significativo
- minilm-filtro vs e5-filtro: p_crudo=0.0430, p_holm=0.3870 → no significativo
- minilm-filtro vs e5-rrf: p_crudo=0.1210, p_holm=0.9680 → no significativo
- minilm-filtro vs e5-sin-filtro: p_crudo=0.2655, p_holm=1.0000 → no significativo
- minilm-sin-filtro vs e5-filtro: p_crudo=0.1950, p_holm=1.0000 → no significativo
- minilm-sin-filtro vs e5-rrf: p_crudo=0.2240, p_holm=1.0000 → no significativo
- minilm-sin-filtro vs e5-sin-filtro: p_crudo=0.0005, p_holm=0.0050 → **significativo**
- e5-filtro vs e5-rrf: p_crudo=0.9290, p_holm=1.0000 → no significativo
- e5-filtro vs e5-sin-filtro: p_crudo=0.6460, p_holm=1.0000 → no significativo
- e5-rrf vs e5-sin-filtro: p_crudo=0.6310, p_holm=1.0000 → no significativo

**recall@10**

- minilm-filtro vs minilm-sin-filtro: p_crudo=0.0425, p_holm=0.1700 → no significativo
- minilm-filtro vs e5-filtro: p_crudo=0.0010, p_holm=0.0090 → **significativo**
- minilm-filtro vs e5-rrf: p_crudo=0.0045, p_holm=0.0315 → **significativo**
- minilm-filtro vs e5-sin-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- minilm-sin-filtro vs e5-filtro: p_crudo=0.5690, p_holm=1.0000 → no significativo
- minilm-sin-filtro vs e5-rrf: p_crudo=0.5205, p_holm=1.0000 → no significativo
- minilm-sin-filtro vs e5-sin-filtro: p_crudo=0.0010, p_holm=0.0090 → **significativo**
- e5-filtro vs e5-rrf: p_crudo=0.7720, p_holm=1.0000 → no significativo
- e5-filtro vs e5-sin-filtro: p_crudo=0.0160, p_holm=0.0800 → no significativo
- e5-rrf vs e5-sin-filtro: p_crudo=0.0100, p_holm=0.0600 → no significativo

**ndcg@10**

- minilm-filtro vs minilm-sin-filtro: p_crudo=0.1030, p_holm=0.3090 → no significativo
- minilm-filtro vs e5-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- minilm-filtro vs e5-rrf: p_crudo=0.0615, p_holm=0.2460 → no significativo
- minilm-filtro vs e5-sin-filtro: p_crudo=0.0015, p_holm=0.0120 → **significativo**
- minilm-sin-filtro vs e5-filtro: p_crudo=0.7280, p_holm=0.7280 → no significativo
- minilm-sin-filtro vs e5-rrf: p_crudo=0.3360, p_holm=0.6720 → no significativo
- minilm-sin-filtro vs e5-sin-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- e5-filtro vs e5-rrf: p_crudo=0.0390, p_holm=0.1980 → no significativo
- e5-filtro vs e5-sin-filtro: p_crudo=0.0330, p_holm=0.1980 → no significativo
- e5-rrf vs e5-sin-filtro: p_crudo=0.0020, p_holm=0.0140 → **significativo**

**mrr@10**

- minilm-filtro vs minilm-sin-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- minilm-filtro vs e5-filtro: p_crudo=0.0450, p_holm=0.0900 → no significativo
- minilm-filtro vs e5-rrf: p_crudo=0.2610, p_holm=0.2610 → no significativo
- minilm-filtro vs e5-sin-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- minilm-sin-filtro vs e5-filtro: p_crudo=0.0115, p_holm=0.0575 → no significativo
- minilm-sin-filtro vs e5-rrf: p_crudo=0.0005, p_holm=0.0030 → **significativo**
- minilm-sin-filtro vs e5-sin-filtro: p_crudo=0.0290, p_holm=0.0870 → no significativo
- e5-filtro vs e5-rrf: p_crudo=0.0155, p_holm=0.0620 → no significativo
- e5-filtro vs e5-sin-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
- e5-rrf vs e5-sin-filtro: p_crudo=0.0000, p_holm=0.0000 → **significativo**
