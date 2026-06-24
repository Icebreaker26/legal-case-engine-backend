const TAMANO_LOTE = 3;

export const extraerSolicitudes = (texto) => {
  if (!texto?.trim()) return [];

  // Patrón 1: "1.- texto", "1. texto", "1) texto"
  const regexNumerico = /(?:^|\n)\s*(\d{1,2})[.\-\)]\s*-?\s*([\s\S]+?)(?=\n\s*\d{1,2}[.\-\)]|\s*$)/g;
  const matchesNumericos = [...texto.matchAll(regexNumerico)];
  if (matchesNumericos.length >= 2) {
    return matchesNumericos.map((m, i) => ({
      numero: i + 1,
      etiqueta: `${i + 1}.`,
      texto: m[2].replace(/\n{3,}/g, '\n\n').trim(),
    }));
  }

  // Patrón 2: "Primero:", "Segundo:", etc.
  const ordinales = ['primero','segundo','tercero','cuarto','quinto','sexto','séptimo','octavo','noveno','décimo'];
  const regexOrdinal = new RegExp(
    `(?:^|\\n)\\s*(${ordinales.join('|')})[:\\s.]+([\\s\\S]+?)(?=\\n\\s*(?:${ordinales.join('|')})[:\\s.]|\\s*$)`,
    'gi'
  );
  const matchesOrdinales = [...texto.matchAll(regexOrdinal)];
  if (matchesOrdinales.length >= 2) {
    return matchesOrdinales.map((m, i) => ({
      numero: i + 1,
      etiqueta: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() + ':',
      texto: m[2].replace(/\n{3,}/g, '\n\n').trim(),
    }));
  }

  // Fallback: no se detectaron solicitudes estructuradas — devuelve el texto completo como una sola solicitud
  return [{ numero: 1, etiqueta: '1.', texto: texto.trim() }];
};

export const agruparEnLotes = (solicitudes) => {
  const lotes = [];
  for (let i = 0; i < solicitudes.length; i += TAMANO_LOTE) {
    lotes.push(solicitudes.slice(i, i + TAMANO_LOTE));
  }
  return lotes;
};

export const construirPromptLote = ({ lote, loteIndex, totalLotes, tutela, legalNotes, sugerencias, argumentos }) => {
  const esMultiple = totalLotes > 1;

  const encabezadoLote = esMultiple
    ? `NOTA: Esta es la parte ${loteIndex + 1} de ${totalLotes} en que se dividió la petición por su extensión. Responde ÚNICAMENTE las solicitudes incluidas en este prompt. El resto serán enviadas por separado.\n\n`
    : '';

  const solicitudesTexto = lote
    .map(s => `${s.etiqueta} ${s.texto}`)
    .join('\n\n');

  const seccionBiblioteca = legalNotes?.length
    ? `ARGUMENTOS JURÍDICOS BASE — Biblioteca Enel (complementan la defensa):\n${legalNotes.map(n => `- ${n.titulo}: ${n.contenido}`).join('\n')}`
    : null;

  const seccionRAG = sugerencias?.length
    ? `PRECEDENTES INTERNOS RELEVANTES — Base de conocimiento RAG:\n${sugerencias.map(s => `- ${s.titulo_referencia} (${s.categoria}): ${s.contenido_legal}`).join('\n')}`
    : null;

  const seccionArgumentos = argumentos?.length
    ? `ARGUMENTOS ESPECÍFICOS DEL ABOGADO RESPONSABLE — PRIORIDAD MÁXIMA:\n${argumentos.map(a => `- ${a.titulo}: ${a.contenido}`).join('\n')}`
    : null;

  const insumos = [seccionBiblioteca, seccionRAG, seccionArgumentos].filter(Boolean).join('\n\n');

  const datosReferencia = [
    `Radicado interno: ${tutela.radicado}`,
    `Peticionario: ${tutela.accionante}`,
    `Materia: ${tutela.derecho_vulnerado}`,
  ].join('\n');

  return `Actúa como abogado especialista en servicios públicos domiciliarios y derecho civil colombiano, del equipo de Defensa Jurídica de Enel Colombia S.A. E.S.P. Tu tarea es redactar la respuesta corporativa formal a un derecho de petición recibido por la empresa. Tono institucional, respetuoso y firme.

Bases jurídicas aplicables (usa las que correspondan): Ley 126/1938, Ley 56/1981, Ley 142/1994 Art.56, Ley 143/1994 Art.5, Código Civil Arts. 881, 882, 939. Si la infraestructura tiene más de 10 años, aplica prescripción extintiva Art. 2536 Código Civil. Ingreso al predio: Art. 33 Ley 56/1981 y Art. 77 Ley 1801/2016. Derecho de petición: Art. 14 Ley 1437/2011.

${insumos ? `Insumos jurídicos internos:\n${insumos}\n` : ''}
Datos de referencia:
${datosReferencia}
${esMultiple ? `\nNota: Esta es la parte ${loteIndex + 1} de ${totalLotes}. Responde únicamente las solicitudes incluidas aquí.` : ''}

Genera la respuesta respondiendo ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. Estructura exacta:

{
  "encabezado": ${loteIndex === 0 ? '{ "ciudad_fecha": "...", "para": "...", "radicado_peticion": "...", "asunto": "..." }' : 'null'},
  "introduccion": ${loteIndex === 0 ? '"Párrafo de introducción institucional"' : 'null'},
  "respuestas": [
    { "numero": 1, "solicitud": "Texto de la solicitud", "respuesta": "Contestación jurídica desarrollada", "normas_citadas": ["Art. X Ley Y"] }
  ],
  "prescripcion": { "aplica": true, "fundamento": "Análisis si aplica, null si no", "norma": "Art. 2536 CC u otra, null si no" },
  "cierre": ${loteIndex === totalLotes - 1 ? '"Párrafo de cierre con firma Enel Colombia"' : 'null'}
}

Solicitudes a responder:
${encabezadoLote}${solicitudesTexto}`;
};
