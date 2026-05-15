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
export const registrarLog = async (usuario_id, accion, entidad_afectada, entidad_id, req, detalles = {}) => {
  try {
    console.log(`[AUDIT] Registrando log: ${accion} por usuario ${usuario_id}`);
    const ip = req.ip || req.connection.remoteAddress;
    const query = `
      INSERT INTO logs_sistema (usuario_id, accion, entidad_afectada, entidad_id, ip_origen, detalles)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(query, [usuario_id, accion, entidad_afectada, entidad_id, ip, JSON.stringify(detalles)]);
    console.log(`[AUDIT] Log registrado exitosamente.`);
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};
