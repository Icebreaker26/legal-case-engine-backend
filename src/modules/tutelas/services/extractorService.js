import pool from '../../../db/database.js';

/**
 * Servicio de extracción inteligente de datos legales.
 * Ahora recupera las categorías dinámicamente desde la base de datos.
 */
export const extraerDatosTutela = async (texto) => {
    const data = {
        radicado: 'POR DEFINIR',
        accionante: 'PENDIENTE IDENTIFICAR',
        juzgado: 'PENDIENTE IDENTIFICAR',
        derecho_vulnerado: null
    };

    if (!texto) return data;

    // 1. Extraer Radicado
    // Primero busca con contexto explícito ("Radicado No.", "Rad.", etc.)
    const regexRadicadoConContexto = /(?:radicado|radicación|rad\.?)\s*(?:no\.?|nro\.?|número\.?)?\s*[:\-]?\s*([\d\s\-\.]{8,25})/i;
    const matchConContexto = texto.match(regexRadicadoConContexto);

    if (matchConContexto) {
        data.radicado = matchConContexto[1].replace(/[\s\-\.]/g, '').trim();
    } else {
        // Fallback: busca secuencias numéricas típicas de radicados (11-23 dígitos)
        // Se excluyen números menores a 11 dígitos para evitar confusión con cédulas cortas o teléfonos
        const regexRadicadoFallback = /\b(\d{11,23})\b/;
        const matchFallback = texto.match(regexRadicadoFallback);
        if (matchFallback) data.radicado = matchFallback[1];
    }

    // 2. Extraer Juzgado
    // Captura desde "Juzgado" hasta el nombre del municipio, tolerando OCR con mayúsculas mixtas
    const regexJuzgado = /juzgado\s+[\d\w°\.]+\s+(?:municipal|circuito|promiscuo|administrativo|penal|civil|familia|laboral|ejecuci[oó]n)[^,.\n]{0,60}/i;
    const matchJuzgado = texto.match(regexJuzgado);
    if (matchJuzgado) {
        data.juzgado = matchJuzgado[0].replace(/\s+/g, ' ').trim().toUpperCase();
    }

    // 3. Extraer Accionante
    // Estrategia 1: busca etiqueta explícita seguida del nombre
    const regexAccionanteEtiqueta = /(?:accionante|demandante|tutelante|parte\s+actora)\s*[:\-]?\s*([A-Za-záéíóúüñÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s\-'\.]{4,80})(?=\s*[,.\n]|\s+(?:cc|c\.c\.|identificad|mayor|con\s+c))/i;
    const matchEtiqueta = texto.match(regexAccionanteEtiqueta);

    if (matchEtiqueta?.[1]) {
        const nombreLimpio = matchEtiqueta[1].replace(/\s+/g, ' ').trim();
        if (nombreLimpio.length > 4) data.accionante = nombreLimpio.toUpperCase();
    } else {
        // Estrategia 2: "YO, NOMBRE APELLIDO, identificado..."
        const regexYo = /\byo[,\s]+([A-Za-záéíóúüñÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s\-'\.]{4,80?})(?=[,\s]+(?:identificad|mayor|cc|c\.c\.))/i;
        const matchYo = texto.match(regexYo);
        if (matchYo?.[1]) {
            data.accionante = matchYo[1].replace(/\s+/g, ' ').trim().toUpperCase();
        }
    }

    // 4. Identificar Derecho Vulnerado (dinámico desde DB)
    try {
        const { rows } = await pool.query('SELECT nombre, palabras_clave FROM global_categorias WHERE is_active = TRUE');
        const textoLower = texto.toLowerCase();

        for (const cat of rows) {
            // Soporta palabras_clave como array de BD o como string JSON
            const keywords = Array.isArray(cat.palabras_clave)
                ? cat.palabras_clave
                : JSON.parse(cat.palabras_clave || '[]');

            // Coincidencia por palabra completa para evitar falsos positivos por substring
            const encontrado = keywords.some(kw =>
                new RegExp(`\\b${kw.toLowerCase()}\\b`).test(textoLower)
            );
            if (encontrado) {
                data.derecho_vulnerado = cat.nombre;
                break;
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías dinámicas:', error);
    }

    return data;
};
