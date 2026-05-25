import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import pool from './db/database.js';

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
app.use('/api/tutelas', tutelaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// Ruta de monitoreo de salud (transparente y detallada)
app.get('/api/health', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    message: 'OK',
    db: 'DOWN'
  };

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