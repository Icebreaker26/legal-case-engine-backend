#!/bin/bash
# Levanta el contenedor Postgres+pgvector aislado para el arnés de evaluación.
# Correr UNA vez (o después de un `docker rm -f rag-eval-db -v`). Nunca reutiliza
# el contenedor legal-case-engine-db (dev/tests) — ver eval/README.md para el porqué.
#
# Uso: bash eval/scripts/00_db.sh <password> [nombre-base]
# Ejemplo: bash eval/scripts/00_db.sh "$(openssl rand -hex 16)" rag_eval_minilm
set -euo pipefail
cd "$(dirname "$0")/../.."  # raíz de tutelas_backend

PW="${1:?Uso: 00_db.sh <password> [nombre-base]}"
DB="${2:-rag_eval_minilm}"

if ! docker ps -a --format '{{.Names}}' | grep -qx rag-eval-db; then
  echo "[00_db] Creando contenedor rag-eval-db en 127.0.0.1:5435..."
  # Misma imagen que usa CI (quality-assurance.yml) y el contenedor de dev local
  # (ankane/pgvector = Postgres 15.4 + pgvector 0.5.1) — paridad con los tests.
  # Si Alejandro confirma otra versión en Railway (SELECT version(); SELECT
  # extversion FROM pg_extension WHERE extname='vector';), cambiar la imagen aquí.
  docker run -d --name rag-eval-db -p 127.0.0.1:5435:5432 \
    -e POSTGRES_USER=icebreaker -e POSTGRES_PASSWORD="$PW" -e POSTGRES_DB=postgres \
    -v rag-eval-data:/var/lib/postgresql/data \
    ankane/pgvector
else
  echo "[00_db] El contenedor rag-eval-db ya existe — no se recrea."
fi

echo "[00_db] Esperando a que Postgres acepte conexiones..."
for i in $(seq 1 30); do
  docker exec rag-eval-db pg_isready -U icebreaker >/dev/null 2>&1 && break
  sleep 2
done

if ! docker exec rag-eval-db psql -U icebreaker -d postgres -lqt | cut -d'|' -f1 | grep -qw "$DB"; then
  echo "[00_db] Creando base $DB..."
  docker exec rag-eval-db createdb -U icebreaker "$DB"
  docker exec -i rag-eval-db env PGCLIENTENCODING=UTF8 psql -U icebreaker -d "$DB" < src/db/init_schema.sql
  DATABASE_URL="postgresql://icebreaker:$PW@127.0.0.1:5435/$DB" npx node-pg-migrate up
else
  echo "[00_db] La base $DB ya existe — no se recrea (si se quiere limpiar: docker exec rag-eval-db dropdb -U icebreaker $DB y correr de nuevo)."
fi

echo "[00_db] Listo. Completa eval/.env.eval (copiar de eval/.env.eval.example) con:"
echo "  DATABASE_URL=postgresql://icebreaker:$PW@127.0.0.1:5435/$DB"
