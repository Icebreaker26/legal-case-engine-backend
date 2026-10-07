import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export const generarDocumentoWord = async (textoBorrador) => {
  // 1. Separar el texto largo de la IA en líneas individuales
  // Normaliza \r\n/\r → \n antes de dividir: el texto pegado desde Windows
  // (muy probable, herramienta corporativa) deja un \r residual que docx no
  // interpreta como salto de línea — ver #140. También colapsa 3+ saltos de
  // línea consecutivos a 2 (máximo una línea en blanco entre párrafos) --
  // sin esto, texto pegado con separaciones dobles/triples (común al copiar
  // de un chat de LLM) generaba párrafos vacíos sin colapsar en el Word.
  const lineas = textoBorrador.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').split('\n');

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