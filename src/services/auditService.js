import pool from '../db/database.js';

/**
 * Registra una acción en la tabla de auditoría
 * @param {number} usuario_id 
 * @param {string} accion 
 * @param {string} entidad_afectada 
 * @param {number} entidad_id 
 * @param {object} req Objeto de petición para obtener IP
 * @param {object} detalles Datos adicionales de la acción
 */
export const registrarLog = async (usuario_uuid, accion, entidad_afectada, entidad_id, req, detalles = {}) => {
  try {
    const ip = req.ip || (req.connection ? req.connection.remoteAddress : '0.0.0.0');
    
    // Forzar entidad_id a string para compatibilidad con la columna 'text' de logs_sistema
    const query = `
      INSERT INTO logs_sistema (usuario_uuid, accion, entidad_afectada, entidad_id, ip_origen, detalles)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(query, [usuario_uuid, accion, entidad_afectada, String(entidad_id), ip, JSON.stringify(detalles)]);
  } catch (error) {
    // Capturamos el error aquí para que NO interrumpa el flujo de la petición principal
    console.error('ERROR CRÍTICO al registrar auditoría (el flujo continúa):', error);
  }
};
