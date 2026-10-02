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
