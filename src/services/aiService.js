import dotenv from 'dotenv';
import { pipeline } from '@xenova/transformers';

dotenv.config();

// Inicializador perezoso (solo carga el modelo la primera vez que se usa)
let extractorLocal;

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

// --- Nota: Se desactivan funciones que dependen de OpenAI para cumplir políticas de privacidad ---

export const redactarContestacion = async (textoTutela, casosPrevios) => {
    // Esta función queda depreciada por políticas de privacidad.
    // En su lugar, el frontend mostrará los 'casosPrevios' sugeridos.
    return {
        borrador_completo: "Sugerencias generadas localmente. Por favor, revise los casos previos sugeridos.",
        radicado: "EXTRAYENDO...",
        accionante: "EXTRAYENDO...",
        juzgado: "EXTRAYENDO..."
    };
};

export const refinarContestacion = async () => {
    throw new Error('El refinamiento por IA externa está desactivado por políticas de privacidad.');
};
