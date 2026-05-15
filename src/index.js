import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import pool from './db/database.js';

const app = express();
const PORT = env.PORT;

// ... el resto del código
import tutelaRoutes from './routes/tutelaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Middlewares
app.use(cors({
    origin: env.FRONTEND_URL, 
    credentials: true
}));
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
app.listen(4000, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto 4000`);
});