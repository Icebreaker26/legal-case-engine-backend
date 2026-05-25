import dotenv from 'dotenv';
import { pipeline } from '@xenova/transformers';
import OpenAI from 'openai';
import pool from '../db/database.js';

dotenv.config();

let openaiInstance;
const getOpenAI = () => {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY no configurado. Las funciones de IA externa fallarán.');
      return null;
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
};

// ... (después en las funciones, usas getOpenAI())

// Inicializador perezoso (solo carga el modelo la primera vez que se usa)
let extractorLocal;

/**
 * Verifica si una funcionalidad de IA está habilitada en la base de datos
 */
const isFeatureEnabled = async (key) => {
  try {
    const { rows } = await pool.query('SELECT value FROM system_config WHERE key = $1', [key]);
    return rows.length > 0 && rows[0].value === true;
  } catch (error) {
    console.error(`Error verificando flag ${key}:`, error);
    return false;
  }
};

/**
 * Genera el vector matemático localmente (384 dimensiones)
 * Usando el modelo Xenova/all-MiniLM-L6-v2. 
 * Garantiza privacidad total al no enviar datos a la nube.
 */
export const generarEmbeddingLocal = async (texto) => {
  try {
    if (!extractorLocal) {
      // Descarga (la primera vez) y carga en RAM el modelo ligero
      extractorLocal = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    
    const output = await extractorLocal(texto, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
    
  } catch (error) {
    console.error('Error generando vector local:', error);
    throw new Error('Falló el motor de IA local.');
  }
};

/**
 * Función de conveniencia que ahora apunta por defecto al motor local.
 */
export const generarEmbedding = async (texto) => {
  return await generarEmbeddingLocal(texto);
};

/**
 * Anonimiza datos personales básicos antes de enviar a servicios externos (IA).
 */
const anonimizarDatos = (texto) => {
    if (!texto) return '';
    return texto
        .replace(/\d{6,11}/g, '[CEDULA_REDACTADA]')
        .replace(/(Calle|Carrera|Avenida|Cll|Cra|Av|Vereda)\s+\d+[a-zA-Z0-9#\-\s]+/gi, '[DIRECCION_REDACTADA]')
        .replace(/(Sr\.|Sra\.|Señor|Señora)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, '[NOMBRE_REDACTADO]');
};

export const redactarContestacion = async (textoTutela, casosPrevios) => {
    const enabled = await isFeatureEnabled('ai_draft_enabled');
    const openai = getOpenAI();
    
    if (!enabled || !openai) {
      return {
        borrador_completo: "La generación de borradores por IA externa está desactivada o no configurada.",
        status: "disabled"
      };
    }

    try {
      const prompt = `
                INSTRUCCIÓN: Analiza los hechos anonimizados y redacta una contestación técnica.
                
                TEXTO DE LA TUTELA (ANONIMIZADO):
                ${anonimizarDatos(textoTutela.substring(0, 4500))}

                PRECEDENTES:
                ${casosPrevios.map(c => `- ${c.titulo_referencia}: ${anonimizarDatos(c.contenido_legal.substring(0, 300))}`).join('\n')}

                ESTRUCTURA: Identificación, Análisis de Hechos técnicos, Principios de Enel (Retiro, Indemnización, Mantenimiento), Peticiones.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Abogado experto. Técnico, preciso. Trabajas con datos anonimizados." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      });

      return {
        borrador_completo: response.choices[0].message.content,
        status: "success"
      };
    } catch (error) {
      console.error('Error en redactarContestacion:', error);
      throw new Error('Error al conectar con el motor IA.');
    }
};

export const refinarContestacion = async (borradorActual, instrucciones) => {
    const enabled = await isFeatureEnabled('ai_draft_enabled');
    const openai = getOpenAI();
    if (!enabled || !openai) throw new Error('Función desactivada o IA no configurada.');

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un revisor jurídico. Ajusta el borrador según las instrucciones." },
          { role: "user", content: `BORRADOR (ANONIMIZADO):\n${anonimizarDatos(borradorActual)}\n\nINSTRUCCIONES:\n${instrucciones}` }
        ]
      });
      return response.choices[0].message.content;
    } catch (error) {
      throw new Error('Error al refinar el borrador.');
    }
};
