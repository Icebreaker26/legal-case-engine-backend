// #162 — HTER (Human-targeted Translation Edit Rate, Snover et al. 2006):
// distancia de edición normalizada entre lo que el abogado pegó del flujo
// estructurado (hipótesis) y el documento final que terminó guardando
// (referencia) -- la señal de C.5 (docs/ANALISIS_GENERADOR_PROMPTS.md) que
// mide calidad real percibida, no solo corrección de formato.

// Levenshtein a nivel de PALABRA (no de carácter) -- es la variante estándar
// de TER/HTER en traducción automática, porque mide "cuántas ediciones de
// edición humana" en vez de errores de tipeo.
const tokenizarPalabras = (texto) => (texto ?? '').trim().split(/\s+/).filter(Boolean);

// Documentos institucionales de derecho de petición rara vez superan unos
// pocos miles de palabras -- este tope evita que un DP O(n*m) se vuelva
// patológico si algún día entra un texto fuera de lo normal (p.ej. un
// borrador pegado por error con contenido duplicado muchas veces).
const TOPE_PALABRAS = 5000;

const distanciaLevenshteinPalabras = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
};

// TER = ediciones / palabras de la REFERENCIA (no de la hipótesis) -- es la
// normalización estándar de Snover et al., no un promedio simétrico.
// Retorna null si no hay nada contra qué medir, o si algún texto excede el
// tope (en vez de lanzar o colgar el request).
export const calcularHter = (hipotesis, referencia) => {
  const palabrasHip = tokenizarPalabras(hipotesis);
  const palabrasRef = tokenizarPalabras(referencia);

  if (palabrasRef.length === 0) return null;
  if (palabrasHip.length > TOPE_PALABRAS || palabrasRef.length > TOPE_PALABRAS) return null;

  const distancia = distanciaLevenshteinPalabras(palabrasHip, palabrasRef);
  return {
    hter: distancia / palabrasRef.length,
    distancia,
    palabras_hipotesis: palabrasHip.length,
    palabras_referencia: palabrasRef.length,
  };
};

// Reconstruye el texto de "lo que el flujo estructurado produjo" a partir
// de respuesta_peticion_items -- aproximación best-effort de
// `respuestaATexto(items)` del frontend (legal-case-engine-frontend#48),
// NO un port verificado carácter a carácter (ese código vive en el otro
// repo). Si el formato real del frontend difiere en puntuación/espaciado,
// el HTER medido tendrá un sesgo constante -- sigue siendo válido para
// comparar tendencias en el tiempo (misma función, mismos datos), que es
// el uso previsto (C.5: validar mejoras de prompt con datos reales), pero
// no debe citarse como una medición absoluta sin volver a verificar contra
// el frontend real.
export const itemsATexto = (items) => [...items]
  .sort((a, b) => a.numero - b.numero)
  .map((item) => {
    const normas = item.normas_citadas?.length
      ? `\nNormas citadas: ${item.normas_citadas.join(', ')}`
      : '';
    return `${item.numero}. ${item.solicitud}\n\n${item.respuesta}${normas}`;
  })
  .join('\n\n');
