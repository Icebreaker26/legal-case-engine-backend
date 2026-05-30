import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Tutelas (Modular)',
      version: '1.0.0',
      description: 'Documentación de la API para el sistema de tutelas modularizado.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo',
      },
    ],
  },
  // Escanea todos los archivos de rutas de los módulos
  apis: ['./src/modules/*/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiOptions = {
    explorer: true,
};
