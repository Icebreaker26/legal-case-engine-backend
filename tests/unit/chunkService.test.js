import { dividirEnChunks } from '../../src/services/chunkService.js';

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
});
