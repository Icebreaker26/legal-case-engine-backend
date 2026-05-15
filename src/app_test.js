import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { requestIdMiddleware } from './utils/logger.js';
import tutelaRoutes from './routes/tutelaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const createApp = () => {
  const app = express();
  app.use(helmet()); 
  app.use(requestIdMiddleware); // ID para rastreo
  app.use(express.json());
  app.use(cookieParser());
  
  app.use('/api/tutelas', tutelaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  
  return app;
};

export default createApp;
