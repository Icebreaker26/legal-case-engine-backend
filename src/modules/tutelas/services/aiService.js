import { pipeline } from '@xenova/transformers';
import { env } from '../../../config/env.js';

// Algunos modelos (familia e5) requieren un prefijo distinto según si el texto
// es una consulta de búsqueda o un documento que se va a indexar.
//
// 'intfloat/multilingual-e5-small' es el id original del modelo, pero
// @xenova/transformers no puede cargarlo (no tiene conversión ONNX en ese
// repo) — solo funciona el espejo 'Xenova/multilingual-e5-small' (#98). Se
// mantienen ambas claves por si alguna vez se configura con el id original.
const PREFIJOS = {
  'intfloat/multilingual-e5-small': { query: 'query: ', passage: 'passage: ' },
  'Xenova/multilingual-e5-small': { query: 'query: ', passage: 'passage: ' },
};

// Caché de extractores por modelo — permite tener varios modelos cargados a
// la vez en el mismo proceso (p.ej. el arnés de evaluación comparando modelos).
const extractoresPorModelo = new Map();

const obtenerExtractor = async (modelo) => {
  if (!extractoresPorModelo.has(modelo)) {
    console.log(`Cargando modelo de embeddings ${modelo}...`);
    extractoresPorModelo.set(modelo, await pipeline('feature-extraction', modelo));
    console.log('Modelo cargado.');
  }
  return extractoresPorModelo.get(modelo);
};

export const generarEmbeddingLocal = async (texto, { tipo = 'passage' } = {}) => {
  try {
    const modelo = env.EMBEDDING_MODEL ?? 'Xenova/all-MiniLM-L6-v2';
    const prefijo = PREFIJOS[modelo]?.[tipo] ?? '';
    const extractor = await obtenerExtractor(modelo);
    const output = await extractor(`${prefijo}${texto}`, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generando vector local:', error);
    throw new Error('Falló el motor de embeddings local.');
  }
};

export const generarEmbedding = async (texto, opts) => {
  return await generarEmbeddingLocal(texto, opts);
};
