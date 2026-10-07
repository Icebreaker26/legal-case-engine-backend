#!/bin/bash
# #101: wrapper explícito de 02_indexar.js para reindexar con un modelo de
# embeddings distinto al default. Reemplaza el patrón a mano
# `EMBEDDING_MODEL=... node ...` (usado sin registro en #98) por un argumento
# posicional obligatorio — reduce el riesgo de reindexar con el modelo
# equivocado por un export que quedó pegado en la sesión de shell.
#
# Uso: bash eval/scripts/02b_indexar_modelo.sh <modelo> [ruta-corpus.jsonl]
# Ejemplo: bash eval/scripts/02b_indexar_modelo.sh Xenova/multilingual-e5-small eval/data/v1/corpus.jsonl
set -euo pipefail
cd "$(dirname "$0")/../.."  # raíz de tutelas_backend

MODELO="${1:?Uso: 02b_indexar_modelo.sh <modelo> [ruta-corpus.jsonl]}"
CORPUS="${2:-eval/fixtures/mini/corpus.jsonl}"

node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js "$CORPUS" "--modelo=$MODELO"
