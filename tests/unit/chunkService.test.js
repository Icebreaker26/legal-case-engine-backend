import { dividirEnChunks } from '../../src/modules/tutelas/services/chunkService.js';

describe('chunkService', () => {
  test('debería dividir un texto pequeño en un solo chunk', () => {
    const texto = 'Este es un párrafo pequeño de prueba.';
    const result = dividirEnChunks(texto, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(texto);
  });

  test('debería dividir dos párrafos en chunks separados si exceden el tamaño', () => {
    const p1 = 'Párrafo uno muy largo...';
    const p2 = 'Párrafo dos también largo...';
    const texto = `${p1}\n\n${p2}`;
    // Tamaño pequeño para forzar división
    const result = dividirEnChunks(texto, 15);
    expect(result.length).toBeGreaterThan(1);
  });

  test('debería manejar texto vacío', () => {
    expect(dividirEnChunks('')).toEqual([]);
    expect(dividirEnChunks(null)).toEqual([]);
  });

  describe('párrafo gigante sin punto final en el último fragmento (#66)', () => {
    test('no pierde el remanente sin puntuación al cortar por oraciones', () => {
      const oracionA = 'Primera oracion con punto final. '; // 34 caracteres, termina en "."
      // Remanente final SIN punto/!/? — antes de #66, match() lo descartaba
      // por completo (nunca entraba al loop de oraciones ni al push final).
      const remanente = 'PRETENSION FINAL SIN PUNTO'; // 27 caracteres
      const parrafo = oracionA + remanente; // 61 > size: fuerza el corte por oración
      const size = 40;

      const result = dividirEnChunks(parrafo, size);
      const textoCompleto = result.join('\n\n');
      expect(textoCompleto).toContain(remanente);
    });
  });

  describe('overlap no debe empujar un chunk sobre el límite declarado (#66)', () => {
    test('ningún chunk supera `size`, incluso con overlap grande', () => {
      const size = 100;
      const overlap = Math.floor(size * 0.2); // 20
      // Varios párrafos de ~90 caracteres: cada uno es una "unidad" cercana
      // al límite, así que tail (hasta 20 chars) + unidad (hasta 100) puede
      // superar size si no se revalida tras concatenar.
      const parrafo = 'x'.repeat(90);
      const texto = Array(6).fill(parrafo).join('\n\n');

      const result = dividirEnChunks(texto, size, overlap);
      for (const chunk of result) {
        expect(chunk.length).toBeLessThanOrEqual(size);
      }
    });
  });
});
