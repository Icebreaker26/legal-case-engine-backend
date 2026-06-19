import { pipeline } from '@xenova/transformers';

// Inicializador perezoso — carga el modelo en RAM solo la primera vez
let extractorLocal;

export const generarEmbeddingLocal = async (texto) => {
  try {
    if (!extractorLocal) {
      console.log('Cargando modelo de embeddings Xenova/all-MiniLM-L6-v2...');
      extractorLocal = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Modelo cargado.');
    }
    const output = await extractorLocal(texto, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generando vector local:', error);
    throw new Error('Falló el motor de embeddings local.');
  }
};

export const generarEmbedding = async (texto) => {
  return await generarEmbeddingLocal(texto);
};
