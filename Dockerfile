# Etapa 1: Construcción
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
# Evitamos que playwright instale navegadores en la etapa de build
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci
COPY . .

# Etapa 2: Ejecución
FROM node:22-slim
WORKDIR /app
# Instalamos wait-for-it para asegurar el arranque ordenado del ecosistema
RUN apt-get update && apt-get install -y wait-for-it && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
# Evitamos navegadores en producción también
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --only=production
COPY --from=builder /app/src ./src
COPY --from=builder /app/logs ./logs

EXPOSE 4000
# Usamos wait-for-it para esperar a la base de datos antes de iniciar
CMD ["wait-for-it", "db:5432", "--", "node", "src/index.js"]
