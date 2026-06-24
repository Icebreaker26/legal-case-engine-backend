import pdfParse from 'pdf-extraction';

// Renderer personalizado: mide brechas horizontales entre ítems de texto
// para insertar espacios donde el PDF los omite.
const pageRender = (pageData) =>
  pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
    .then((content) => {
      let text = '';
      let lastY = null;
      let lastX = null;
      let lastWidth = 0;
      let lastFontSize = 12;

      for (const item of content.items) {
        // transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
        const x     = item.transform[4];
        const y     = item.transform[5];
        const fontSize = Math.abs(item.transform[3]) || lastFontSize;

        if (lastY !== null && Math.abs(y - lastY) > fontSize * 0.5) {
          // Salto de línea
          text += '\n';
        } else if (lastX !== null) {
          // Misma línea: insertar espacio si la brecha es mayor a ~15% del tamaño de fuente
          const gap = x - (lastX + lastWidth);
          if (gap > fontSize * 0.15) {
            text += ' ';
          }
        }

        text      += item.str;
        lastY      = y;
        lastX      = x;
        lastWidth  = item.width || 0;
        lastFontSize = fontSize;
      }

      return text;
    });

export const extraerTextoPdf = async (buffer) => {
  try {
    const data = await pdfParse(buffer, { pagerender: pageRender });

    const textoLimpio = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[^\S\n]{2,}/g, ' ')          // espacios múltiples → uno
      .replace(/([^.\n:;?!\-])\n([a-záéíóúüñ\d("])/g, '$1 $2')  // unir líneas partidas
      .replace(/([.!?])\n([A-ZÁÉÍÓÚÜÑ\d"])/g, '$1\n\n$2')        // separar párrafos
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return textoLimpio;
  } catch (error) {
    console.error('Error al leer el PDF:', error);
    throw new Error('No se pudo extraer el texto del PDF');
  }
};