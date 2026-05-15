/**
 * Divide un texto en pedazos manteniendo la estructura lógica de párrafos.
 * Prioriza los saltos de línea doble para no romper argumentos legales.
 */
export const dividirEnChunks = (texto, size = 1500, overlap = 300) => {
  if (!texto) return [];

  // Dividir por párrafos (dos o más saltos de línea)
  const parrafos = texto.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const parrafo of parrafos) {
    // Si el párrafo solo es muy grande, lo cortamos por sentencias o caracteres
    if (parrafo.length > size) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      // Sub-división forzosa de párrafos gigantes
      for (let i = 0; i < parrafo.length; i += size) {
        chunks.push(parrafo.substring(i, i + size));
      }
    } 
    // Si el párrafo cabe en el chunk actual
    else if ((currentChunk.length + parrafo.length) <= size) {
      currentChunk += (currentChunk ? '\n\n' : '') + parrafo;
    } 
    // Si no cabe, guardamos el actual y empezamos uno nuevo
    else {
      chunks.push(currentChunk);
      currentChunk = parrafo;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  // Aplicar el solapamiento (overlap) para contexto entre chunks
  // NOTA: Para el almacenamiento actual, los chunks originales ya tienen contexto.
  // Si queremos solapamiento explícito, deberíamos re-procesar aquí.
  return chunks;
};
