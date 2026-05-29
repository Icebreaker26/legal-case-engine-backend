import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import pool from './db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Cargador dinámico de módulos
const modulesPath = path.join(__dirname, 'modules');
const modules = fs.readdirSync(modulesPath);

for (const moduleName of modules) {
    const routePath = path.join(modulesPath, moduleName, 'routes', `${moduleName}Routes.js`);
    if (fs.existsSync(routePath)) {
        const route = await import(`./modules/${moduleName}/routes/${moduleName}Routes.js`);
        app.use(`/api/${moduleName}`, route.default);
        console.log(`Módulo registrado: /api/${moduleName}`);
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

// Iniciar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});