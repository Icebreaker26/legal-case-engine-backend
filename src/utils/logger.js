import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const sensitiveFields = ['password', 'password_hash', 'token'];

const redactFormat = winston.format((info) => {
  sensitiveFields.forEach((field) => {
    if (info[field]) info[field] = '***REDACTED***';
    // Si el log es un objeto anidado, buscamos en las propiedades
    if (info.message && typeof info.message === 'object' && info.message[field]) {
        info.message[field] = '***REDACTED***';
    }
  });
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Middleware para asignar un Request ID a cada petición
export const requestIdMiddleware = (req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

export default logger;
