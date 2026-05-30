import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import pool from './db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json()); 
app.use(cookieParser());

// Documentación
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Cargador dinámico de módulos
// Escanea la carpeta 'modules' y registra automáticamente las rutas de cada módulo.
const modulesPath = path.join(__dirname, 'modules');
const modules = fs.readdirSync(modulesPath);

for (const moduleName of modules) {
    const routesDir = path.join(modulesPath, moduleName, 'routes');
    // Verifica si la carpeta 'routes' existe dentro del módulo
    if (fs.existsSync(routesDir)) {
        const routeFiles = fs.readdirSync(routesDir);
        // Busca cualquier archivo que termine en 'Routes.js' (ej: authRoutes.js, tutelaRoutes.js)
        const routeFile = routeFiles.find(file => file.endsWith('Routes.js'));
        
        if (routeFile) {
            // Importa dinámicamente y monta el router bajo /api/<moduleName>
            const route = await import(`./modules/${moduleName}/routes/${routeFile}`);
            app.use(`/api/${moduleName}`, route.default);
            console.log(`Módulo registrado: /api/${moduleName} usando ${routeFile}`);
        }
    }
}

// Ruta de monitoreo de salud
app.get('/api/health', async (req, res) => {
  const healthcheck = { uptime: process.uptime(), timestamp: Date.now(), message: 'OK', db: 'DOWN' };
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    healthcheck.db = 'UP';
    res.status(200).send(healthcheck);
  } catch (error) {
    console.error('Healthcheck failed:', error);
    healthcheck.message = 'DB_ERROR';
    res.status(503).send(healthcheck);
  }
});

import { errorHandler } from './middlewares/errorHandler.js';

// ... (después de la ruta healthcheck)

app.use(errorHandler);

// Iniciar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});