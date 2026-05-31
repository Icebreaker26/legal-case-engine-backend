#!/bin/sh

# Esperar a que la base de datos esté lista (opcional pero recomendado)
# Si se usa en docker-compose, se puede usar wait-for-it
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
  echo "Esperando a que la DB en $DB_HOST:$DB_PORT esté lista..."
  /usr/bin/wait-for-it "$DB_HOST:$DB_PORT" -t 60
fi

echo "Ejecutando migraciones de base de datos..."
npm run migrate:up

echo "Iniciando servidor de ICEBREAKER..."
exec node src/index.js
