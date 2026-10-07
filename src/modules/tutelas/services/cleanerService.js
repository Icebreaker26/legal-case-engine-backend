import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';

/**
 * Servicio de limpieza de texto.
 * Recupera patrones de ruido dinámicamente desde la base de datos.
 */
export const limpiarTexto = async (texto) => {
    if (!texto) return '';

    try {
        // #139: ORDER BY explícito -- sin esto, el orden de aplicación de los
        // patrones dependía del orden físico del heap (puede cambiar tras un
        // UPDATE o un VACUUM), y un patrón puede interferir con otro que
        // dependa del texto antes de que el anterior lo haya normalizado.
        const { rows } = await pool.query('SELECT patron FROM noise_patterns WHERE activo = TRUE ORDER BY id');
        let limpio = texto;

        rows.forEach(row => {
            const regex = new RegExp(row.patron, 'gi');
            limpio = limpio.replace(regex, '');
        });

        return limpio.replace(/\n\s*\n/g, '\n\n').trim();
    } catch (error) {
        // #139: winston en vez de console.error -- sin esto, un fallo de la
        // limpieza dinámica (regex inválido que pasó la validación de #139,
        // o un error de conexión) no quedaba visible en logs/error.log.
        logger.error('Error al cargar patrones de ruido en limpiarTexto', { error: error.message });
        return texto; // Retornar texto original si falla la limpieza dinámica
    }
};

/**
 * Postgres no acepta el byte nulo \0 en columnas de texto.
 */
export const limpiarTextoParaPostgres = (texto) => {
    if (!texto) return '';
    return texto.replace(/\0/g, '');
};
