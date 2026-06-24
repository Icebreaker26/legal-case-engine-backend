import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export const generarDocumentoWord = async (textoBorrador) => {
  // 1. Separar el texto largo de la IA en líneas individuales
  const lineas = textoBorrador.split('\n');

  // 2. Convertir cada línea en un Párrafo de Word
  const parrafosWord = lineas.map(linea => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED, // Justificado legal
      children: [
        new TextRun({
          text: linea,
          font: "Times New Roman",
          size: 24, // En la librería docx, el tamaño es en "medios puntos" (24 = 12pt)
        }),
      ],
      spacing: {
        after: 200, // Espacio ligero entre párrafos
      }
    });
  });

  // 3. Crear el documento con márgenes legales (1701 twips ≈ 3 cm)
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1701,
            right: 1701,
            bottom: 1701,
            left: 1701,
          },
        },
      },
      children: parrafosWord, // Insertamos todos los párrafos que creamos
    }],
  });

  // 4. Empaquetar el documento en un Buffer (memoria) para enviarlo por internet
  const buffer = await Packer.toBuffer(doc);
  return buffer;
};