export const errorHandler = (err, req, res, next) => {
  console.error('Error no capturado:', err);
  
  // Si es un error de validación de Zod, podrías manejarlo aquí específicamente
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Error de validación', details: err.errors });
  }

  res.status(500).json({ error: 'Error interno del servidor.' });
};
