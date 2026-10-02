import pool from '../../../db/database.js';

/**
 * Servicio de limpieza de texto.
 * Recupera patrones de ruido dinámicamente desde la base de datos.
 */
export const limpiarTexto = async (texto) => {
    if (!texto) return '';

    try {
        const { rows } = await pool.query('SELECT patron FROM noise_patterns WHERE activo = TRUE');
        let limpio = texto;

        rows.forEach(row => {
            const regex = new RegExp(row.patron, 'gi');
            limpio = limpio.replace(regex, '');
        });

        return limpio.replace(/\n\s*\n/g, '\n\n').trim();
    } catch (error) {
        console.error('Error al cargar patrones de ruido:', error);
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
