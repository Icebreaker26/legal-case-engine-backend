import { extraerTextoPdf } from '../../../services/pdfService.js';
import mammoth from 'mammoth';

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

export const generarPromptAmbiental = (textoInstrumento) => {
  const fragmento = textoInstrumento.substring(0, 6000);

  return `Actúa como un experto en derecho ambiental colombiano con amplio conocimiento de la Ley 99 de 1993 (Ley General Ambiental) y el Decreto 1076 de 2015 (Decreto Único Reglamentario del Sector Ambiente).

Analiza el siguiente instrumento ambiental (expediente, auto o resolución) y genera un informe estructurado respondiendo ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código. El JSON debe seguir exactamente esta estructura:

{
  "que_ordena": "Descripción clara y concisa de lo que el auto, resolución o expediente manda, exige o dispone",
  "admite_recurso": "Sí|No|Depende",
  "plazo_respuesta": "Plazo exacto para responder o cumplir (ej: '10 días hábiles desde la notificación')",
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

INSTRUMENTO AMBIENTAL A ANALIZAR:
${fragmento}`;
};
