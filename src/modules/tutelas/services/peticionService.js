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

const LIMITE_COPILOT = 128000;

// Wrapper size probe: build a prompt with empty solicitudes to measure fixed overhead
const medirWrapper = (opts) =>
  construirPromptLote({ lote: [], loteIndex: 1, totalLotes: 99, ...opts }).length;

// Groups solicitudes greedily so each resulting prompt stays under LIMITE_COPILOT.
// Falls back to one solicitud per lote if a single item already exceeds the limit.
export const agruparEnLotes = (solicitudes, opts = null) => {
  if (!opts) {
    // No context provided — legacy fixed-size grouping (tests / callers without context)
    const lotes = [];
    for (let i = 0; i < solicitudes.length; i += TAMANO_LOTE) {
      lotes.push(solicitudes.slice(i, i + TAMANO_LOTE));
    }
    return lotes;
  }

  const wrapperSize = medirWrapper(opts);
  const budget = LIMITE_COPILOT - wrapperSize - 200; // 200-char safety margin

  const lotes = [];
  let loteActual = [];
  let tamanoActual = 0;

  for (const s of solicitudes) {
    const textoSolicitud = `${s.etiqueta} ${s.texto}\n\n`.length;
    if (loteActual.length > 0 && tamanoActual + textoSolicitud > budget) {
      lotes.push(loteActual);
      loteActual = [s];
      tamanoActual = textoSolicitud;
    } else {
      loteActual.push(s);
      tamanoActual += textoSolicitud;
    }
  }
  if (loteActual.length > 0) lotes.push(loteActual);
  return lotes;
};

export const buildPromptComprension = (textoCrudo) => {
  const extracto = textoCrudo.substring(0, 3000);
  return `Eres un abogado experto en derecho colombiano de servicios públicos.
Lee el siguiente texto de un derecho de petición o tutela dirigido a Enel Colombia.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código.

Estructura exacta:
{
  "tema_central": "Descripción concisa en 1-2 frases de qué trata la petición",
  "derechos_invocados": ["Lista de derechos o garantías que menciona el peticionario"],
  "peticiones": ["Lista de cada solicitud concreta que hace el peticionario"],
  "urgencia_declarada": "alta | media | baja",
  "extracto_clave": "Fragmento literal más importante del documento (máx 200 chars)"
}

Texto del documento:
${extracto}`;
};

// ── Helpers internos ────────────────────────────────────────────────────────

const TONO_POR_URGENCIA = {
  alta:  'URGENCIA ALTA declarada por el peticionario — sé conciso y directo, prioriza claridad sobre extensión. No omitas ningún punto pero evita digresiones.',
  media: 'Urgencia media — tono institucional estándar, respuesta completa y bien fundamentada.',
  baja:  'Urgencia baja — puedes incluir análisis normativo extenso y contextualización detallada.',
};

const buildFichaPrecedente = (sug, idx) => {
  const score = sug.score ? `${Math.round(sug.score * 100)}% relevancia` : '';
  const comp  = sug.comprension_doc;

  if (comp) {
    const resultado = comp.resultado
      ? { favorable: '✓ Favorable', desfavorable: '✗ Desfavorable', referencia: '→ Referencia' }[comp.resultado] ?? comp.resultado
      : '';
    const derechos = comp.derechos_involucrados?.length
      ? `Derechos/figuras: ${comp.derechos_involucrados.join(', ')}`
      : '';
    return [
      `PRECEDENTE ${idx + 1} — ${resultado} ${score ? `| ${score}` : ''}`,
      `  Título: ${sug.titulo_referencia}`,
      comp.tipo_caso   ? `  Tipo de caso: ${comp.tipo_caso}`   : null,
      comp.que_resuelve ? `  Resolvió: ${comp.que_resuelve}`  : null,
      derechos         ? `  ${derechos}`                        : null,
    ].filter(Boolean).join('\n');
  }

  // Fallback — sin comprension_doc: mostrar fragmento textual
  return [
    `PRECEDENTE ${idx + 1} — ${score}`,
    `  Título: ${sug.titulo_referencia} (${sug.categoria})`,
    `  Fragmento: ${sug.contenido_legal}`,
  ].join('\n');
};

const buildSeccionEstrategia = (sugerencias, urgencia) => {
  if (!sugerencias?.length) return null;

  const conComp = sugerencias.filter(s => s.comprension_doc);
  if (!conComp.length) return null;

  const favorables    = conComp.filter(s => s.comprension_doc.resultado === 'favorable');
  const desfavorables = conComp.filter(s => s.comprension_doc.resultado === 'desfavorable');

  // Agrupa defensas por tipo de caso
  const defensas = {};
  for (const s of favorables) {
    const tipo = s.comprension_doc.tipo_caso || 'General';
    defensas[tipo] = (defensas[tipo] || 0) + 1;
  }

  const lineas = Object.entries(defensas)
    .map(([tipo, n]) => `  - ${tipo}: ${n} precedente${n > 1 ? 's' : ''} favorable${n > 1 ? 's' : ''}`)
    .join('\n');

  const alertaDesfavorable = desfavorables.length
    ? `⚠ ALERTA: ${desfavorables.length} precedente(s) con resultado desfavorable en casos similares — refuerza la argumentación en esos puntos.`
    : '';

  const instruccionTono = TONO_POR_URGENCIA[urgencia] || TONO_POR_URGENCIA.media;

  return [
    'ESTRATEGIA SUGERIDA (derivada del análisis de precedentes internos):',
    lineas || '  - Sin líneas de defensa consolidadas — construye desde bases jurídicas generales.',
    alertaDesfavorable,
    `TONO: ${instruccionTono}`,
  ].filter(Boolean).join('\n');
};

// ── Constructor principal ────────────────────────────────────────────────────

export const construirPromptLote = ({ lote, loteIndex, totalLotes, tutela, legalNotes, sugerencias, argumentos, comprension }) => {
  const esMultiple = totalLotes > 1;

  const encabezadoLote = esMultiple
    ? `NOTA: Esta es la parte ${loteIndex + 1} de ${totalLotes} en que se dividió la petición por su extensión. Responde ÚNICAMENTE las solicitudes incluidas en este prompt. El resto serán enviadas por separado.\n\n`
    : '';

  const solicitudesTexto = lote
    .map(s => `${s.etiqueta} ${s.texto}`)
    .join('\n\n');

  // ── Sección 1: análisis estructurado de la petición ──
  const seccionComprension = comprension?.tema_central
    ? [
        'ANÁLISIS DE LA PETICIÓN (identificado previamente):',
        `  Tema central: ${comprension.tema_central}`,
        comprension.derechos_invocados?.length
          ? `  Derechos invocados: ${comprension.derechos_invocados.join(', ')}`
          : null,
        comprension.peticiones?.length
          ? `  Solicitudes identificadas:\n${comprension.peticiones.map((p, i) => `    ${i + 1}. ${p}`).join('\n')}`
          : null,
        comprension.extracto_clave
          ? `  Extracto clave: "${comprension.extracto_clave}"`
          : null,
      ].filter(Boolean).join('\n')
    : null;

  // ── Sección 2: estrategia (solo en lote 0 para no repetir) ──
  const seccionEstrategia = loteIndex === 0
    ? buildSeccionEstrategia(sugerencias, comprension?.urgencia_declarada)
    : null;

  // ── Sección 3: biblioteca jurídica interna ──
  const seccionBiblioteca = legalNotes?.length
    ? `ARGUMENTOS JURÍDICOS BASE — Biblioteca Enel:\n${legalNotes.map(n => `  - ${n.titulo}: ${n.contenido}`).join('\n')}`
    : null;

  // ── Sección 4: precedentes RAG enriquecidos ──
  const seccionRAG = sugerencias?.length
    ? `PRECEDENTES INTERNOS — Base de conocimiento RAG (${sugerencias.length} caso${sugerencias.length > 1 ? 's' : ''} similar${sugerencias.length > 1 ? 'es' : ''}):\n${sugerencias.map((s, i) => buildFichaPrecedente(s, i)).join('\n\n')}`
    : null;

  // ── Sección 5: argumentos del abogado (máxima prioridad) ──
  const seccionArgumentos = argumentos?.length
    ? `ARGUMENTOS ESPECÍFICOS DEL ABOGADO RESPONSABLE — PRIORIDAD MÁXIMA (incorpora literalmente si es pertinente):\n${argumentos.map(a => `  - ${a.titulo}: ${a.contenido}`).join('\n')}`
    : null;

  const insumos = [seccionComprension, seccionEstrategia, seccionBiblioteca, seccionRAG, seccionArgumentos]
    .filter(Boolean).join('\n\n');

  const datosReferencia = [
    `Radicado interno: ${tutela.radicado}`,
    `Peticionario: ${tutela.accionante}`,
    `Materia: ${tutela.derecho_vulnerado}`,
  ].join('\n');

  return `Actúas como abogado especialista en servicios públicos domiciliarios y derecho civil colombiano, del equipo de Defensa Jurídica de Enel Colombia S.A. E.S.P. Tu tarea es redactar la respuesta corporativa formal a un derecho de petición recibido por la empresa.

Bases jurídicas aplicables (usa las que correspondan según el caso): Ley 126/1938, Ley 56/1981, Ley 142/1994 Art.56, Ley 143/1994 Art.5, Código Civil Arts. 881, 882, 939. Si la infraestructura tiene más de 10 años, aplica prescripción extintiva Art. 2536 Código Civil. Ingreso al predio: Art. 33 Ley 56/1981 y Art. 77 Ley 1801/2016. Derecho de petición: Art. 14 Ley 1437/2011.

${insumos ? `══ INSUMOS JURÍDICOS INTERNOS ══\n${insumos}\n══════════════════════════════\n` : ''}
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
