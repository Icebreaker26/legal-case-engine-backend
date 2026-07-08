import { extraerTextoPdf } from '../../../services/pdfService.js';
import mammoth from 'mammoth';

// Limpia y estructura el texto extraído de un PDF
const limpiarTextoPdf = (texto) => {
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Colapsar espacios múltiples dentro de una línea
    .replace(/[^\S\n]{2,}/g, ' ')
    // Unir líneas partidas en mitad de una oración (no terminan en . : ; ? !)
    .replace(/([^.\n:;?!\-])\n([a-záéíóúüñ\d("])/g, '$1 $2')
    // Separar párrafos: línea que termina en punto seguida de otra que empieza con mayúscula
    .replace(/([.!?])\n([A-ZÁÉÍÓÚÜÑ\d"])/g, '$1\n\n$2')
    // Eliminar líneas en blanco excesivas
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Extrae texto limpio de HTML de mammoth (conserva estructura de párrafos)
const htmlATexto = (html) => {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const extractTextFromFile = async (buffer, mimetype) => {
  if (mimetype === 'application/pdf') {
    const raw = await extraerTextoPdf(buffer);
    return limpiarTextoPdf(raw);
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.convertToHtml({ buffer });
    return htmlATexto(result.value);
  } else if (mimetype === 'text/plain') {
    return buffer.toString('utf8');
  }
  throw new Error(`Formato no soportado: ${mimetype}`);
};

export const generarPromptRespuesta = (textoRespuesta, { entidadNombre, tituloExpediente, queOrdena } = {}) => {
  const contexto = [
    tituloExpediente ? `- Expediente: ${tituloExpediente}` : null,
    entidadNombre    ? `- Entidad que responde: ${entidadNombre}` : null,
    queOrdena        ? `- Lo que ordenaba el instrumento original: ${queOrdena}` : null,
  ].filter(Boolean).join('\n');

  return `Actúa como un experto en derecho ambiental colombiano. Se te entrega la respuesta que una empresa emitió ante una autoridad ambiental o un instrumento ambiental (auto, resolución, expediente).

CONTEXTO:
${contexto}

Analiza la siguiente respuesta y determina:
1. Si la respuesta es FAVORABLE, DESFAVORABLE o PARCIAL para la empresa.
2. Si la empresa cumplió todos los requerimientos del instrumento original.
3. Si procede interponer un Recurso de Reposición y/o Apelación, con fundamentos legales concretos.
4. Recomendaciones de acciones inmediatas.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código:

{
  "valoracion": "Favorable|Desfavorable|Parcial",
  "cumplimiento": "Total|Parcial|Incumplimiento",
  "resumen": "Resumen de 2-3 oraciones de la respuesta de la entidad",
  "procede_recurso": "Sí|No|Evaluar",
  "tipo_recurso": "Reposición|Apelación|Reposición y Apelación|No aplica",
  "fundamentos_recurso": "Fundamentos legales para el recurso (arts. concretos de la Ley 99/93, Dec. 1076/2015, CPA). Vacío si no procede.",
  "plazo_recurso": "Plazo legal para interponer el recurso según normativa colombiana. Vacío si no procede.",
  "recomendaciones": [
    "Acción concreta 1",
    "Acción concreta 2"
  ],
  "observaciones": "Cualquier aspecto relevante no cubierto arriba"
}

RESPUESTA DE LA ENTIDAD A ANALIZAR:
${textoRespuesta}`;
};

const LIMITE_COPILOT = 128000;

// Divide texto en chunks respetando párrafos, cada uno <= maxChars
const dividirTexto = (texto, maxChars) => {
  if (texto.length <= maxChars) return [texto];
  const chunks = [];
  let inicio = 0;
  while (inicio < texto.length) {
    let fin = inicio + maxChars;
    if (fin < texto.length) {
      const corte = texto.lastIndexOf('\n\n', fin);
      if (corte > inicio) fin = corte;
    }
    chunks.push(texto.slice(inicio, fin).trim());
    inicio = fin;
  }
  return chunks;
};

const buildPrompt = (textoSeccion, { entidadNombre, hoy, seccionNum = 1, totalSecciones = 1 }) => {
  const contexto = [
    entidadNombre ? `- Entidad destinataria: ${entidadNombre}` : null,
    `- Fecha de referencia para calcular plazos: ${hoy}`,
    totalSecciones > 1 ? `- Este documento fue dividido en ${totalSecciones} partes por su extensión. Estás analizando la parte ${seccionNum} de ${totalSecciones}.` : null,
  ].filter(Boolean).join('\n');

  const instruccionSecciones = totalSecciones > 1
    ? `\nIMPORTANTE: Analiza SOLO el fragmento proporcionado. Devuelve el JSON completo con lo que encuentres en esta parte. Si un campo no aparece en este fragmento, usa null o array vacío según corresponda. El usuario acumulará los resultados de cada parte.\n`
    : '';

  return `Actúa como un experto en derecho ambiental colombiano con amplio conocimiento de la Ley 99 de 1993 (Ley General Ambiental) y el Decreto 1076 de 2015 (Decreto Único Reglamentario del Sector Ambiente).

CONTEXTO DEL EXPEDIENTE:
${contexto}
${instruccionSecciones}
Analiza el siguiente instrumento ambiental (expediente, auto o resolución) y genera un informe estructurado respondiendo ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. El JSON debe seguir exactamente esta estructura:

{
  "que_ordena": "Descripción clara y concisa de lo que el auto, resolución o expediente manda, exige o dispone${entidadNombre ? `, dirigido a ${entidadNombre}` : ''}",
  "admite_recurso": "Sí|No|Depende",
  "plazo_respuesta": "Plazo exacto indicando días hábiles Y la fecha calendario estimada de vencimiento (ej: '10 días hábiles desde la notificación — vence aproximadamente el 15 de julio de 2026'). Calcula la fecha a partir de ${hoy} excluyendo sábados, domingos y festivos colombianos.",
  "fecha_vencimiento": "Fecha ISO 8601 (YYYY-MM-DD) correspondiente a la fecha de vencimiento estimada del plazo de respuesta calculada arriba. Ej: '2026-07-15'. Si no es posible determinarla, usa null.",
  "pagos": [
    {
      "descripcion": "Descripción breve de la obligación de pago (multa, compensación, tasa, etc.)",
      "valor": "Valor exigible en pesos colombianos. Si aparecen dos cifras para el mismo concepto (liquidación original y ajuste posterior), usa el valor más reciente o definitivo.",
      "plazo": "Plazo de pago con días hábiles Y fecha estimada de vencimiento. Calcula desde ${hoy}.",
      "fecha_vencimiento": "Fecha ISO 8601 (YYYY-MM-DD) del vencimiento del pago calculada igual que el plazo de respuesta. Si no aplica, usa null.",
      "estado": "Pendiente|Pagado — indica Pagado solo si el documento certifica expresamente que fue cancelado.",
      "nota": "Usa este campo SOLO si hay algo relevante que aclarar sobre el pago: variaciones de cifra por ajuste de tarifas, relación entre dos valores del mismo concepto, descuentos, recargos, o cualquier condición especial. Omite si no aplica."
    }
  ],
  "nivel_riesgo": "Bajo|Medio|Alto|Crítico",
  "resumen": "Resumen ejecutivo del instrumento en 2-3 oraciones",
  "hallazgos": [
    {
      "numero": 1,
      "tipo": "Incumplimiento|Riesgo|Observación|Buena práctica",
      "descripcion": "Descripción detallada del hallazgo",
      "norma_infringida": "Artículo y norma aplicable (ej: Art. 49 Ley 99/93 o Art. 2.2.2.3.1.1 Decreto 1076/2015)",
      "recomendacion": "Acción correctiva o respuesta sugerida",
      "prioridad": "Alta|Media|Baja"
    }
  ],
  "normas_citadas": [
    {
      "instrumento": "Ley 99/93|Decreto 1076/2015|Otro",
      "articulo": "Art. X o sección específica",
      "descripcion": "Tema o materia que regula ese artículo"
    }
  ]
}

Reglas estrictas para el array "pagos":
- Incluye SOLO obligaciones de pago con un valor monetario concreto expresado en el documento (cifra en pesos, SMMLV, UVT u otra unidad cuantificable).
- Si el documento menciona una posible sanción, multa o pago pero NO especifica el monto, NO lo incluyas en el array.
- Si el instrumento NO impone ninguna obligación de pago, o los valores no están determinados, devuelve "pagos": [].

INSTRUMENTO AMBIENTAL A ANALIZAR:
${textoSeccion}`;
};

// Genera uno o varios prompts completos y autónomos según el tamaño del texto
export const generarPromptsAmbientales = (texto, { entidadNombre, fechaBase } = {}) => {
  const hoy = fechaBase
    ? new Date(fechaBase).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  // Medir wrapper con el texto de secciones incluido (peor caso: multi-parte)
  const wrapperSize = buildPrompt('', { entidadNombre, hoy, seccionNum: 1, totalSecciones: 2 }).length;
  const disponible = LIMITE_COPILOT - wrapperSize - 100;

  const chunks = dividirTexto(texto, disponible);
  return chunks.map((chunk, i) => ({
    num: i + 1,
    total: chunks.length,
    prompt: buildPrompt(chunk, { entidadNombre, hoy, seccionNum: i + 1, totalSecciones: chunks.length }),
  }));
};

export const generarPromptAmbiental = (texto, { entidadNombre, fechaBase } = {}) => {
  const hoy = fechaBase
    ? new Date(fechaBase).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  const contexto = [
    entidadNombre ? `- Entidad destinataria: ${entidadNombre}` : null,
    `- Fecha de referencia para calcular plazos: ${hoy}`,
  ].filter(Boolean).join('\n');

  return `Actúa como un experto en derecho ambiental colombiano con amplio conocimiento de la Ley 99 de 1993 (Ley General Ambiental) y el Decreto 1076 de 2015 (Decreto Único Reglamentario del Sector Ambiente).

CONTEXTO DEL EXPEDIENTE:
${contexto}

Analiza el siguiente instrumento ambiental (expediente, auto o resolución) y genera un informe estructurado respondiendo ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. El JSON debe seguir exactamente esta estructura:

{
  "que_ordena": "Descripción clara y concisa de lo que el auto, resolución o expediente manda, exige o dispone${entidadNombre ? `, dirigido a ${entidadNombre}` : ''}",
  "admite_recurso": "Sí|No|Depende — Regla: autos de trámite, requerimientos y medidas preventivas → 'Sí' (Recurso de Reposición, art. 76 Ley 99/93 y art. 76 CPACA). Resoluciones sancionatorias → 'Sí' (Reposición y Apelación). Actos de mero trámite interno → 'No'. Usa 'Depende' SOLO si este fragmento no permite identificar el tipo de acto.",
  "plazo_respuesta": "Plazo exacto indicando días hábiles Y la fecha calendario estimada de vencimiento (ej: '10 días hábiles desde la notificación — vence aproximadamente el 15 de julio de 2026'). Calcula la fecha a partir de ${hoy} excluyendo sábados, domingos y festivos colombianos.",
  "fecha_vencimiento": "Fecha ISO 8601 (YYYY-MM-DD) correspondiente a la fecha de vencimiento estimada del plazo de respuesta calculada arriba. Ej: '2026-07-15'. Si no es posible determinarla, usa null.",
  "pagos": [
    {
      "descripcion": "Descripción breve de la obligación de pago (multa, compensación, tasa, etc.)",
      "valor": "Valor exigible en pesos colombianos. Si aparecen dos cifras para el mismo concepto (liquidación original y ajuste posterior), usa el valor más reciente o definitivo.",
      "plazo": "Plazo de pago con días hábiles Y fecha estimada de vencimiento. Calcula desde ${hoy}.",
      "fecha_vencimiento": "Fecha ISO 8601 (YYYY-MM-DD) del vencimiento del pago calculada igual que el plazo de respuesta. Si no aplica, usa null.",
      "estado": "Pendiente|Pagado — indica Pagado solo si el documento certifica expresamente que fue cancelado.",
      "nota": "Usa este campo SOLO si hay algo relevante que aclarar sobre el pago: variaciones de cifra por ajuste de tarifas, relación entre dos valores del mismo concepto, descuentos, recargos, o cualquier condición especial. Omite si no aplica."
    }
  ],
  "nivel_riesgo": "Bajo|Medio|Alto|Crítico",
  "resumen": "Resumen ejecutivo del instrumento en 2-3 oraciones",
  "hallazgos": [
    {
      "numero": 1,
      "tipo": "Incumplimiento|Riesgo|Observación|Buena práctica",
      "descripcion": "Descripción detallada del hallazgo",
      "norma_infringida": "Artículo y norma aplicable (ej: Art. 49 Ley 99/93 o Art. 2.2.2.3.1.1 Decreto 1076/2015)",
      "recomendacion": "Acción correctiva o respuesta sugerida",
      "prioridad": "Alta|Media|Baja"
    }
  ],
  "normas_citadas": [
    {
      "instrumento": "Ley 99/93|Decreto 1076/2015|Otro",
      "articulo": "Art. X o sección específica",
      "descripcion": "Tema o materia que regula ese artículo"
    }
  ]
}

Reglas estrictas para el array "pagos":
- Incluye SOLO obligaciones de pago con un valor monetario concreto expresado en el documento (cifra en pesos, SMMLV, UVT u otra unidad cuantificable).
- Si el documento menciona una posible sanción, multa o pago pero NO especifica el monto, NO lo incluyas en el array.
- Si el instrumento NO impone ninguna obligación de pago, o los valores no están determinados, devuelve "pagos": [].

INSTRUMENTO AMBIENTAL A ANALIZAR:
${texto}`;
};
