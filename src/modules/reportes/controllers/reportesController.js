import logger from '../../../utils/logger.js';
import { consultarTodo } from '../services/reportesService.js';

export const consultar = async (req, res) => {
  try {
    const filtros = req.body;
    const resultado = await consultarTodo(filtros);
    res.json(resultado);
  } catch (error) {
    logger.error('reportes.consultar error', { error: error.message });
    res.status(500).json({ error: 'Error al consultar reportes.' });
  }
};
