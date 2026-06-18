import mammoth from 'mammoth';
import { extraerTextoPdf } from '../../../services/pdfService.js';
import * as Diff from 'diff';

/**
 * Normaliza un texto contractual para mejorar la precisión del diff.
 *
 * PDFs extraídos con pdf-parse pierden los párrafos (todo llega separado
 * por \n simple). Esta función reconstruye los separadores de párrafo
 * usando dos heurísticas combinadas:
 *
 * 1. CABECERAS DE CLÁUSULA: líneas que empiezan con palabras jurídicas
 *    típicas (CLÁUSULA, ARTÍCULO, PARÁGRAFO, etc.) siempre abren párrafo.
 *
 * 2. FIN DE ORACIÓN + INICIO DE MAYÚSCULA: si una línea termina en
 *    punto/punto y coma y la siguiente empieza con mayúscula o número,
 *    se interpreta como cambio de párrafo.
 */
const CABECERAS_JURIDICAS = /^(CLÁUSULA|CLAUSULA|ARTÍCULO|ARTICULO|PARÁGRAFO|PARAGRAFO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION|TÍTULO|TITULO|NUMERAL|ANEXO|CONSIDERANDO|OBJETO|DEFINICION|DEFINICIÓN)\b/i;

const normalizar = (texto) => {
    const lineas = texto
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(l => l.replace(/[ \t]+/g, ' ').trimEnd());

    const resultado = [];

    for (let i = 0; i < lineas.length; i++) {
        const actual = lineas[i];
        const siguiente = lineas[i + 1] ?? '';

        resultado.push(actual);

        // Si ya hay línea en blanco, no duplicar
        if (actual === '') continue;

        const siguienteTiene = siguiente.trim();
        if (!siguienteTiene) continue;

        if (CABECERAS_JURIDICAS.test(siguienteTiene)) {
            resultado.push(''); // fuerza separador de párrafo antes de nueva cláusula
        }
    }

    return resultado.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * Divide un texto en párrafos (bloques separados por línea en blanco).
 */
const enParrafos = (texto) =>
    texto.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

/**
 * Versión canónica de un párrafo para comparación:
 * - Colapsa todo espacio en blanco interno a un espacio simple
 * - Minúsculas
 * - Elimina signos de puntuación irrelevantes al final
 * Esto permite que "CLÁUSULA  SÉPTIMA:" y "CLÁUSULA SÉPTIMA:" sean iguales.
 */
const canonico = (parrafo) =>
    parrafo
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .normalize('NFC');          // unifica variantes de caracteres acentuados

/**
 * Diff a nivel de párrafo con comparador tolerante a diferencias de
 * espaciado, mayúsculas y variantes unicode — problemas típicos al
 * comparar texto de BD con texto extraído de PDF.
 */
export const computeDiff = (original, incoming) => {
    const a = enParrafos(normalizar(original));
    const b = enParrafos(normalizar(incoming));

    return Diff.diffArrays(a, b, {
        comparator: (pa, pb) => canonico(pa) === canonico(pb),
    }).map(part => ({
        value: part.value.join('\n\n'),
        added: part.added,
        removed: part.removed,
        count: part.count,
    }));
};

export const extractTextFromFile = async (buffer, mimetype) => {
    if (mimetype === 'application/pdf') {
        return await extraerTextoPdf(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else if (mimetype === 'text/plain') {
        return buffer.toString('utf8');
    }
    throw new Error(`Formato no soportado: ${mimetype}`);
};

/**
 * Elimina saltos de línea internos de un párrafo (artefactos de PDF/DOCX
 * con márgenes justificados) y colapsa espacios múltiples.
 */
const limpiarParrafo = (texto) =>
    texto.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

/**
 * Agrupa el array de diff en eventos semánticos:
 *   - MODIFICACIÓN : removed inmediatamente seguido de added → mismo bloque cambiado
 *   - ELIMINACIÓN  : removed sin added siguiente
 *   - ADICIÓN      : added sin removed previo
 * Esto evita el "entrelazado" de bloques que confunde al LLM.
 */
const agruparCambios = (partes) => {
    const cambios = [];
    let i = 0;
    while (i < partes.length) {
        const p = partes[i];
        if (p.removed) {
            const siguiente = partes[i + 1];
            if (siguiente?.added) {
                cambios.push({ tipo: 'MODIFICACIÓN', original: limpiarParrafo(p.value), modificado: limpiarParrafo(siguiente.value) });
                i += 2;
            } else {
                cambios.push({ tipo: 'ELIMINACIÓN', original: limpiarParrafo(p.value), modificado: null });
                i++;
            }
        } else if (p.added) {
            cambios.push({ tipo: 'ADICIÓN', original: null, modificado: limpiarParrafo(p.value) });
            i++;
        } else {
            i++;
        }
    }
    return cambios;
};

export const generateDiffPrompt = (original, incoming) => {
    const cambios = agruparCambios(computeDiff(original, incoming));

    if (cambios.length === 0) {
        return 'No se detectaron diferencias entre los documentos comparados.';
    }

    const SEP = '─'.repeat(70);

    const extracto = cambios.map((c, idx) => {
        const encabezado = `[CAMBIO ${idx + 1} DE ${cambios.length} — ${c.tipo}]`;
        if (c.tipo === 'MODIFICACIÓN') {
            return `${encabezado}\n  TEXTO EN MINUTA ESTÁNDAR:\n  "${c.original}"\n\n  TEXTO EN CONTRATO DEL TERCERO:\n  "${c.modificado}"`;
        }
        if (c.tipo === 'ELIMINACIÓN') {
            return `${encabezado}\n  CLÁUSULA PRESENTE EN MINUTA ESTÁNDAR QUE EL TERCERO ELIMINÓ:\n  "${c.original}"`;
        }
        return `${encabezado}\n  CLÁUSULA AGREGADA POR EL TERCERO (no existe en la minuta estándar):\n  "${c.modificado}"`;
    }).join(`\n\n${SEP}\n\n`);

    return `Actúa como un experto asesor legal corporativo, especialista en derecho contractual y auditoría de riesgos.

Tu tarea es analizar las alteraciones que un tercero realizó sobre nuestra Minuta Estándar de contrato.
A continuación se listan ÚNICAMENTE los bloques que difieren entre ambos documentos, presentados como pares [ESTÁNDAR vs. TERCERO] para facilitar la comparación.

${'='.repeat(70)}
DIFERENCIAS DETECTADAS (${cambios.length} cambio${cambios.length !== 1 ? 's' : ''})
${'='.repeat(70)}

${extracto}

${'='.repeat(70)}

Con base exclusivamente en los cambios anteriores, genera un informe de auditoría contractual con la siguiente estructura:

1. TABLA DE ANÁLISIS (una fila por cada cambio numerado arriba):
   | # | Cláusula / Sección | Tipo de Cambio | Impacto y Riesgo Legal | Recomendación |
   Las columnas "Tipo de Cambio" deben usar: [Modificación], [Adición] o [Eliminación].
   Las columnas "Recomendación" deben usar: [Aceptar], [Rechazar] o [Negociar].

2. NIVEL DE RIESGO GENERAL: Bajo / Medio / Alto, con una justificación ejecutiva de máximo dos oraciones.
`;
};
