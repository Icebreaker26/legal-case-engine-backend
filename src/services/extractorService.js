import pool from '../db/database.js';

/**
 * Servicio de extracción inteligente de datos legales.
 * Ahora recupera las categorías dinámicamente desde la base de datos.
 */
export const extraerDatosTutela = async (texto) => {
    const data = {
        radicado: 'POR DEFINIR',
        accionante: 'PENDIENTE IDENTIFICAR',
        juzgado: 'PENDIENTE IDENTIFICAR',
        derecho_vulnerado: 'Servidumbre'
    };

    if (!texto) return data;

    // 1. Extraer Radicado
    const regexRadicado = /(\d{23})|(\d{4}-\d{5})|(\d{4}\s\d{5})/;
    const matchRadicado = texto.match(regexRadicado);
    if (matchRadicado) data.radicado = matchRadicado[0].replace(/\s/g, '');

    // 2. Extraer Juzgado
    const regexJuzgado = /JUZGADO\s+[\d\w\s]+(?:MUNICIPAL|CIRCUITO|PROMISCUO|ADMINISTRATIVO|PENAL|CIVIL|FAMILIA|LABORAL)\s+(?:DE|DEL)\s+[\w\s]+/i;
    const matchJuzgado = texto.match(regexJuzgado);
    if (matchJuzgado) {
        data.juzgado = matchJuzgado[0].trim().toUpperCase();
    }

    // 3. Extraer Accionante
    const regexAccionante = /(?:ACCIONANTE|IDENTIFICADA|IDENTIFICADO|IDENTIFICADA CON CC|IDENTIFICADO CON CC|YO,)\s+([A-Z\s]{5,40})(?=\s|,|\.|\n)/i;
    const matchAccionante = texto.match(regexAccionante);
    if (matchAccionante && matchAccionante[1]) {
        const nombreLimpio = matchAccionante[1].replace(/(?:CON|CC|IDENTIFICAD[OA]|DNI|NIT)\b/gi, '').trim();
        if (nombreLimpio.length > 5) {
            data.accionante = nombreLimpio.toUpperCase();
        }
    }

    // 4. Identificar Derecho Vulnerado (Dinámico desde DB)
    try {
        const { rows } = await pool.query('SELECT nombre, palabras_clave FROM categorias_juridicas WHERE activo = TRUE');
        const textoLower = texto.toLowerCase();

        for (const cat of rows) {
            if (cat.palabras_clave.some(kw => textoLower.includes(kw.toLowerCase()))) {
                data.derecho_vulnerado = cat.nombre;
                break;
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías dinámicas:', error);
    }

    return data;
};
