const TAMANO_LOTE = 3;

// Única fuente de verdad para segmentación + método: cada rama declara su
// propio `metodo` en el mismo return, en vez de inferirlo después por la
// forma del resultado (acoplamiento implícito y frágil al formato de las
// etiquetas -- señalado en la revisión de #146). `extraerSolicitudes` y
// `detectarMetodoSegmentacion` son wrappers delgados sobre esto para no
// romper a los callers existentes.
const extraerSolicitudesConMetodo = (texto) => {
  if (!texto?.trim()) return { solicitudes: [], metodo: 'vacio' };

  // Patrón 1: "1.- texto", "1. texto", "1) texto"
  const regexNumerico = /(?:^|\n)\s*(\d{1,2})[.\-\)]\s*-?\s*([\s\S]+?)(?=\n\s*\d{1,2}[.\-\)]|\s*$)/g;
  const matchesNumericos = [...texto.matchAll(regexNumerico)];
  if (matchesNumericos.length >= 2) {
    return {
      metodo: 'numerico',
      solicitudes: matchesNumericos.map((m, i) => ({
        numero: i + 1,
        etiqueta: `${i + 1}.`,
        texto: m[2].replace(/\n{3,}/g, '\n\n').trim(),
      })),
    };
  }

  // Patrón 2: "Primero:", "Segundo:", etc.
  const ordinales = ['primero','segundo','tercero','cuarto','quinto','sexto','séptimo','octavo','noveno','décimo'];
  const regexOrdinal = new RegExp(
    `(?:^|\\n)\\s*(${ordinales.join('|')})[:\\s.]+([\\s\\S]+?)(?=\\n\\s*(?:${ordinales.join('|')})[:\\s.]|\\s*$)`,
    'gi'
  );
  const matchesOrdinales = [...texto.matchAll(regexOrdinal)];
  if (matchesOrdinales.length >= 2) {
    return {
      metodo: 'ordinal',
      solicitudes: matchesOrdinales.map((m, i) => ({
        numero: i + 1,
        etiqueta: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() + ':',
        texto: m[2].replace(/\n{3,}/g, '\n\n').trim(),
      })),
    };
  }

  // Fallback: no se detectaron solicitudes estructuradas — devuelve el texto completo como una sola solicitud
  return { metodo: 'fallback', solicitudes: [{ numero: 1, etiqueta: '1.', texto: texto.trim() }] };
};

export const extraerSolicitudes = (texto) => extraerSolicitudesConMetodo(texto).solicitudes;

// #146: expone el método ya calculado por extraerSolicitudesConMetodo, sin
// re-derivarlo del resultado. Requiere volver a correr la segmentación
// (los regex son baratos y esto solo se llama una vez por generación de
// prompts, nunca en un loop caliente).
export const detectarMetodoSegmentacion = (texto) => extraerSolicitudesConMetodo(texto).metodo;

const LIMITE_COPILOT = 128000;

// Wrapper size probe: build empty-solicitudes prompts to measure fixed overhead.
// Mide tanto loteIndex 0 (lleva la sección de estrategia, #138) como un lote
// intermedio, y usa el peor caso — el budget tiene que caber en ambos.
const medirWrapper = (opts) => {
  const base = { lote: [], totalLotes: 99, ...opts };
  const sizeLote0 = construirPromptLote({ ...base, loteIndex: 0 }).length;
  const sizeLoteN = construirPromptLote({ ...base, loteIndex: 1 }).length;
  return Math.max(sizeLote0, sizeLoteN);
};

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

// Único lugar donde vive este número -- #146 lo usa para marcar
// `comprension_truncada` en la telemetría sin duplicar el literal.
export const LIMITE_EXTRACTO_COMPRENSION = 3000;

export const buildPromptComprension = (textoCrudo) => {
  const extracto = textoCrudo.substring(0, LIMITE_EXTRACTO_COMPRENSION);
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

// ECCP (#142, #167): el score mostrado al abogado es siempre el semántico
// puro (S_base) -- nunca el score re-rankeado con feromona. `score_semantico`
// es el campo que va a poblar el modo de fusión `alpha_fb` (#161 fase e,
// feromona); los modos de fusión actuales no la tienen y siguen exponiendo
// solo `score` (que hoy es S_base puro, sin feromona posible). Esta función
// nunca debe leer `score_final` ni ningún otro campo que incluya feromona.
export const buildFichaPrecedente = (sug, idx) => {
  const scoreBase = sug.score_semantico ?? sug.score;
  const score = scoreBase ? `${Math.round(scoreBase * 100)}% relevancia` : '';
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

  // #158 (C.4.c): cuando hay comprensión previa, su numeración (1..m) cubre
  // TODAS las peticiones del documento completo, no solo las de este lote
  // -- aclarar explícitamente cuáles etiquetas reales responde este prompt
  // para no confundir ambas numeraciones.
  const etiquetasLote = lote.map(s => s.etiqueta).join(', ');
  const encabezadoLote = esMultiple
    ? `NOTA: Esta es la parte ${loteIndex + 1} de ${totalLotes} en que se dividió la petición por su extensión. Responde ÚNICAMENTE las solicitudes etiquetadas: ${etiquetasLote}. Si el análisis previo de la petición lista más peticiones que estas, ignóralas aquí -- se responden en otra parte. El resto serán enviadas por separado.\n\n`
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

  // ── Sección 2: estrategia ──
  // #156 (C.2.3): antes solo iba en el lote 0 "para no repetir" -- los
  // lotes siguientes de la misma petición se quedaban sin las líneas de
  // defensa ni la alerta de precedentes desfavorables, pudiendo divergir la
  // argumentación entre partes. El costo de incluirla en todos es pequeño
  // frente al tamaño del wrapper (ver docs/ANALISIS_GENERADOR_PROMPTS.md,
  // sección B) -- medirWrapper ya mide el peor caso, así que el presupuesto
  // de agruparEnLotes sigue siendo correcto.
  const seccionEstrategia = buildSeccionEstrategia(sugerencias, comprension?.urgencia_declarada);

  // ── Sección 3: biblioteca jurídica interna ──
  const seccionBiblioteca = legalNotes?.length
    ? `ARGUMENTOS JURÍDICOS BASE — Biblioteca Enel:\n${legalNotes.map(n => `  - ${n.titulo}: ${n.contenido}`).join('\n')}`
    : null;

  // ── Sección 4: precedentes RAG enriquecidos ──
  const seccionRAG = sugerencias?.length
    ? `PRECEDENTES INTERNOS — Base de conocimiento RAG (${sugerencias.length} caso${sugerencias.length > 1 ? 's' : ''} similar${sugerencias.length > 1 ? 'es' : ''}):\n${sugerencias.map((s, i) => buildFichaPrecedente(s, i)).join('\n\n')}`
    : null;

  // #153 (C.1, lost-in-the-middle): los argumentos del abogado ya NO van
  // aquí -- se arman aparte y se insertan justo antes de las solicitudes
  // (ver más abajo), la posición más fuerte del prompt, acorde a su
  // prioridad declarada.
  const insumos = [seccionComprension, seccionEstrategia, seccionBiblioteca, seccionRAG]
    .filter(Boolean).join('\n\n');

  // ── Argumentos del abogado (máxima prioridad) ──
  const seccionArgumentos = argumentos?.length
    ? `ARGUMENTOS ESPECÍFICOS DEL ABOGADO RESPONSABLE — PRIORIDAD MÁXIMA (incorpora literalmente si es pertinente):\n${argumentos.map(a => `  - ${a.titulo}: ${a.contenido}`).join('\n')}\n`
    : '';

  const datosReferencia = [
    `Radicado interno: ${tutela.radicado}`,
    `Peticionario: ${tutela.accionante}`,
    `Materia: ${tutela.derecho_vulnerado}`,
  ].join('\n');

  // #157 (C.4.a): la regla original ("si la infraestructura tiene más de 10
  // años, aplica prescripción") no decía de dónde sale esa antigüedad -- el
  // LLM casi nunca la conoce a partir del texto de la petición, así que la
  // regla invitaba a inventarla. Ahora se condiciona explícitamente a que
  // el texto o los datos de referencia contengan una fecha/antigüedad
  // verificable.
  const reglaPrescripcion = 'Prescripción extintiva (Art. 2536 Código Civil): aplica ÚNICAMENTE si el texto de la petición o los datos de referencia indican explícitamente la antigüedad o la fecha de instalación de la infraestructura. Si esa información no está presente, NO apliques prescripción -- responde "aplica": false con "fundamento": "sin información de antigüedad disponible".';

  // #155 (C.2.2): `prescripcion` es una decisión GLOBAL de la petición, no
  // algo que deba variar por lote -- antes se pedía en cada lote y se
  // fusionaba en silencio ("si alguno dice que aplica, gana"), lo que podía
  // generar conflictos reales entre lotes (medidos en TELEMETRIA_CONFLICTO_
  // PRESCRIPCION, #146). Ahora solo se pide en el lote 0, igual que
  // encabezado/introduccion.
  const pidePrescripcionAqui = loteIndex === 0;

  // #154 (C.2.1): el ejemplo de "numero" siempre mostraba 1 fijo, anclando
  // al LLM a numerar cada lote desde 1 aunque sus solicitudes reales sean
  // p. ej. la 4, 5 y 6 del documento -- usa el primer número real del lote.
  const numeroEjemplo = lote[0]?.numero ?? 1;

  return `Actúas como abogado especialista en servicios públicos domiciliarios y derecho civil colombiano, del equipo de Defensa Jurídica de Enel Colombia S.A. E.S.P. Tu tarea es redactar la respuesta corporativa formal a un derecho de petición recibido por la empresa.

Bases jurídicas aplicables (usa las que correspondan según el caso): Ley 126/1938, Ley 56/1981, Ley 142/1994 Art.56, Ley 143/1994 Art.5, Código Civil Arts. 881, 882, 939. ${reglaPrescripcion} Ingreso al predio: Art. 33 Ley 56/1981 y Art. 77 Ley 1801/2016. Derecho de petición: Art. 14 Ley 1437/2011.

${insumos ? `══ INSUMOS JURÍDICOS INTERNOS ══\n${insumos}\n══════════════════════════════\n` : ''}
${seccionArgumentos}Datos de referencia:
${datosReferencia}
${esMultiple ? `\nNota: Esta es la parte ${loteIndex + 1} de ${totalLotes}. Responde únicamente las solicitudes incluidas aquí.` : ''}

Genera la respuesta respondiendo ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código.${pidePrescripcionAqui ? '' : ' La decisión sobre prescripción ya se tomó en la parte 1 de esta petición -- no la repitas, responde "prescripcion": null.'} Estructura exacta:

{
  "encabezado": ${loteIndex === 0 ? '{ "ciudad_fecha": "...", "para": "...", "radicado_peticion": "...", "asunto": "..." }' : 'null'},
  "introduccion": ${loteIndex === 0 ? '"Párrafo de introducción institucional"' : 'null'},
  "respuestas": [
    { "numero": ${numeroEjemplo}, "solicitud": "Texto de la solicitud", "respuesta": "Contestación jurídica desarrollada", "normas_citadas": ["Art. X Ley Y"] }
  ],
  "prescripcion": ${pidePrescripcionAqui ? '{ "aplica": true, "fundamento": "Análisis si aplica, null si no", "norma": "Art. 2536 CC u otra, null si no" }' : 'null'},
  "cierre": ${loteIndex === totalLotes - 1 ? '"Párrafo de cierre con firma Enel Colombia"' : 'null'}
}

Solicitudes a responder:
${encabezadoLote}${solicitudesTexto}`;
};
