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
import { requestIdMiddleware } from './utils/logger.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(requestIdMiddleware);
app.use(express.json({ limit: 52428800 }));        // 50 MB en bytes
app.use(express.urlencoded({ extended: true, limit: 52428800 }));
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
            logger.info(`Módulo registrado: /api/${moduleName} usando ${routeFile}`);
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
    logger.error('Healthcheck failed', { error: error.message });
    healthcheck.message = 'DB_ERROR';
    res.status(503).send(healthcheck);
  }
});

import { errorHandler } from './middlewares/errorHandler.js';
import { iniciarCronAlertas } from './modules/tutelas/services/alertasVencimientoService.js';
import { iniciarCronAlertasAmbiental } from './modules/ambiental/services/alertasAmbientalService.js';

// ... (después de la ruta healthcheck)

app.use(errorHandler);

// Iniciar el servidor
const PORT = env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
  iniciarCronAlertas();
  iniciarCronAlertasAmbiental();
});