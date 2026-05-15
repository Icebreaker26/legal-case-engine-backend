export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
      // Zod genera result.error.issues, que es el array de errores detallados
      return res.status(400).json({ error: result.error.issues });
  }
  next();
};
