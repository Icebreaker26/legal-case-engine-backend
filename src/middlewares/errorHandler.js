export const errorHandler = (err, req, res, next) => {
  console.error('Error no capturado:', err);

  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Error de validación', details: err.errors });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Error interno del servidor.';
  res.status(status).json({ error: message });
};
