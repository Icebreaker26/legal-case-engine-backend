#!/bin/bash

# 1. Obtener el token mediante un POST al login y extraerlo con curl.
# Utilizamos grep para aislar el header Set-Cookie.
# Usamos sed para limpiar la cadena y quedarnos solo con el valor del token.
RESPONSE=$(curl -s -i -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_USER_EMAIL\", \"password\": \"$TEST_USER_PASS\"}")

TOKEN=$(echo "$RESPONSE" | grep -i "Set-Cookie" | sed -n 's/.*token=\([^;]*\).*/\1/p')

if [ -z "$TOKEN" ]; then
    echo "❌ Error: No se pudo obtener el token de sesión."
    exit 1
fi

echo "✅ Token obtenido automáticamente."

# 2. Lanzar artillery pasando el token como variable de entorno
TEST_JWT_TOKEN=$TOKEN npx artillery run load-test.yml
