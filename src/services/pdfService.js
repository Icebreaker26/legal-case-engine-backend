import pdfParse from 'pdf-extraction';

export const extraerTextoPdf = async (buffer) => {
  try {
    // Usamos la función directamente
    const data = await pdfParse(buffer);
    
    // Preservamos estructura de párrafos:
    // 1. Normalizar saltos de línea
    // 2. Limpiar espacios redundantes dentro de cada línea
    // 3. Colapsar más de 2 líneas en blanco seguidas a exactamente 2
    const textoLimpio = data.text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(l => l.replace(/[ \t]+/g, ' ').trimEnd())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    
    return textoLimpio;
  } catch (error) {
    console.error('Error al leer el PDF:', error);
    throw new Error('No se pudo extraer el texto del PDF');
  }
};