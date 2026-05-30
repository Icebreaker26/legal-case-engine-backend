import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { requestIdMiddleware } from './utils/logger.js';
import tutelaRoutes from './modules/tutelas/routes/tutelaRoutes.js';
import authRoutes from './modules/auth/routes/authRoutes.js';
import adminRoutes from './modules/admin/routes/adminRoutes.js';
import rendimientoRoutes from './modules/rendimiento/routes/rendimientoRoutes.js';

const createApp = () => {
  const app = express();
  app.use(helmet()); 
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/tutelas', tutelaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/rendimiento', rendimientoRoutes);

  return app;
};

export default createApp;
