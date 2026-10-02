import { generarEmbeddingLocal } from './aiService.js';
import { buscarContextoLegal } from './vectorService.js';

/**
 * Construye el texto de consulta (vectorial y léxico) usado para buscar
 * precedentes en base_conocimiento_enel. Punto único — antes esta lógica
 * estaba repetida (e inconsistente) en 4 endpoints de tutelaController.js.
 *
 * `tutela` es un objeto plano con, al menos, `contenido_original` y
 * opcionalmente `analisis_comprension` — no necesita ser una fila real de
 * la tabla `tutelas` (p.ej. procesarTutela lo llama antes de insertar).
 */
export const construirConsulta = (tutela, { estrategia = 'actual' } = {}) => {
  const textoCompleto = tutela.contenido_original || '';
  const comprension = tutela.analisis_comprension || null;

  if (estrategia === 'completo') {
    return { textoVector: textoCompleto, textoLexico: textoCompleto };
  }

  if (estrategia === 'actual' || estrategia === 'comprension') {
    const textoVector = comprension?.tema_central
      ? `${comprension.tema_central}. ${(comprension.peticiones || []).join('. ')}`
      : textoCompleto.substring(0, 1500);
    return { textoVector, textoLexico: textoCompleto };
  }

  throw new Error(`Estrategia de consulta no soportada: "${estrategia}"`);
};

/**
 * Punto único de entrada para recuperar precedentes — construye la consulta,
 * genera su embedding y busca en base_conocimiento_enel. Antes esta
 * orquestación de 3 pasos estaba repetida en los 4 mismos endpoints que
 * construirConsulta(); centralizarla evita que el arnés de evaluación tenga
 * que reimplementarla (y así medir algo distinto de lo que corre en producción).
 */
export const recuperarPrecedentes = async ({
  tutela,
  categoria = null,
  limit = 5,
  estrategia = 'actual',
  fusion = 'ponderado',
}) => {
  const { textoVector, textoLexico } = construirConsulta(tutela, { estrategia });
  const vector = await generarEmbeddingLocal(textoVector, { tipo: 'query' });
  return buscarContextoLegal(vector, textoLexico, limit, categoria, { fusion });
};
