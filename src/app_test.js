import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { requestIdMiddleware } from './utils/logger.js';
import tutelaRoutes from './modules/tutelas/routes/tutelaRoutes.js';
import authRoutes from './modules/auth/routes/authRoutes.js';
import adminRoutes from './modules/admin/routes/adminRoutes.js';
import rendimientoRoutes from './modules/rendimiento/routes/rendimientoRoutes.js';
import contratoRoutes from './modules/contratos/routes/contratoRoutes.js';
import comunicacionesRoutes from './modules/comunicaciones/routes/comunicacionesRoutes.js';
import conformidadesRoutes from './modules/conformidades/routes/conformidadesRoutes.js';
import pagosRoutes from './modules/pagos/routes/pagosRoutes.js';
import notificacionesRoutes from './modules/notificaciones/routes/notificacionesRoutes.js';
import analyticsRoutes from './modules/analytics/routes/analyticsRoutes.js';
import permisosRoutes from './modules/permisos/routes/permisosRoutes.js';
import coreRoutes from './modules/core/routes/catalogoRoutes.js';

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
  app.use('/api/contratos', contratoRoutes);
  app.use('/api/comunicaciones', comunicacionesRoutes);
  app.use('/api/conformidades', conformidadesRoutes);
  app.use('/api/pagos', pagosRoutes);
  app.use('/api/notificaciones', notificacionesRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/permisos', permisosRoutes);
  app.use('/api/core', coreRoutes);

  return app;
};

export default createApp;
