import dotenv from 'dotenv';
import { pipeline } from '@xenova/transformers';
import OpenAI from 'openai';
import pool from '../db/database.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    
    if (!enabled) {
      return {
        borrador_completo: "La generación de borradores por IA externa está desactivada por el administrador. Por favor, revise los casos previos sugeridos localmente.",
        status: "disabled"
      };
    }

    try {
      const prompt = `
                INSTRUCCIÓN DE ALTA PRIORIDAD:
                No generes una respuesta genérica o burocrática. Debes realizar un análisis MINUCIOSO de los hechos específicos (fechas, direcciones, incidentes técnicos) narrados por el accionante en el texto de la tutela adjunto. 
                Si el accionante menciona un hecho puntual, tu respuesta debe ser un argumento concreto que enlace ese hecho con la normativa de Enel.

                ESTRUCTURA DEL BORRADOR:

                1. Identificación del accionante y radicado: (Extraer con precisión).

                2. Pronunciamiento sobre los hechos: Para cada hecho relevante del accionante, responde con un argumento técnico-jurídico específico. Evita decir "conforme a la ley"; en su lugar di "respecto al hecho X mencionado, Enel Grids aclara Y debido a Z".

                3. Fundamentos legales basados en estos CASOS PREVIOS EXITOSOS:
                ${casosPrevios.map(c => `- ${c.titulo_referencia}: ${c.contenido_legal.substring(0, 300)}...`).join('\n')}

                4. Integración de Principios de Obligatoriedad (Aplica estos datos a los hechos del caso):
                
                - Sobre el retiro de red: La negativa se fundamenta en la servidumbre legal de conducción de energía consolidada por más de 17 años de ejercicio continuo y público, prevaleciendo el servicio público esencial.
                
                - Sobre indemnizaciones: Argumentar la prescripción extintiva de la acción ordinaria conforme a la normativa civil (plazo superior a 10 años).
                
                - Sobre mantenimiento y acceso: Reiterar el deber legal de la empresa de realizar labores de mantenimiento y la obligación del propietario de permitir el ingreso del personal, so pena de incurrir en obstrucción al servicio público.

                TEXTO DE LA TUTELA PARA ANALIZAR:
                ${textoTutela.substring(0, 4500)}

                REGLA FINAL: Tu objetivo es dar una SOLUCIÓN CONCRETA al caso, no una respuesta de plantilla.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "Eres un abogado senior de Enel Colombia, experto en litigio constitucional. Tu estilo es técnico, persuasivo y basado estrictamente en el análisis de los hechos del expediente. Evitas el lenguaje genérico." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      });

      return {
        borrador_completo: response.choices[0].message.content,
        status: "success"
      };
    } catch (error) {
      console.error('Error en redactarContestacion (OpenAI):', error);
      throw new Error('Error al conectar con el motor de redacción IA.');
    }
};

export const refinarContestacion = async (borradorActual, instrucciones) => {
    const enabled = await isFeatureEnabled('ai_draft_enabled');
    if (!enabled) throw new Error('Función desactivada.');

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un revisor jurídico. Ajusta el borrador según las instrucciones." },
          { role: "user", content: `BORRADOR:\n${borradorActual}\n\nINSTRUCCIONES:\n${instrucciones}` }
        ]
      });
      return response.choices[0].message.content;
    } catch (error) {
      throw new Error('Error al refinar el borrador.');
    }
};
