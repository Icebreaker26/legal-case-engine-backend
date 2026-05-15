import pdfParse from 'pdf-extraction';

export const extraerTextoPdf = async (buffer) => {
  try {
    // Usamos la función directamente
    const data = await pdfParse(buffer);
    
    // Limpiamos el texto
    const textoLimpio = data.text.replace(/\s+/g, ' ').trim();
    
    return textoLimpio;
  } catch (error) {
    console.error('Error al leer el PDF:', error);
    throw new Error('No se pudo extraer el texto del PDF');
  }
};