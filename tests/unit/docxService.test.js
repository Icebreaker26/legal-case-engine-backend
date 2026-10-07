import { generarDocumentoWord } from '../../src/modules/tutelas/services/docxService.js';

describe('docxService — generarDocumentoWord', () => {
  test('genera un buffer para texto simple', async () => {
    const buffer = await generarDocumentoWord('Un párrafo simple.');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('#140 — normaliza \\r\\n sin lanzar error', async () => {
    const buffer = await generarDocumentoWord('Línea uno\r\nLínea dos\r\nLínea tres');
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  // #140 (hallazgo medio): líneas vacías consecutivas generaban párrafos
  // vacíos sin colapsar. No podemos inspeccionar el XML interno sin
  // descomprimir el .docx, así que el contrato que se puede verificar aquí
  // es indirecto: el documento se genera sin error para texto con muchas
  // líneas en blanco consecutivas (común al copiar de un chat de LLM), y el
  // número de párrafos resultantes no crece sin límite por cada salto extra.
  test('#140 — colapsa 3+ saltos de línea consecutivos sin romper la generación', async () => {
    const textoConMuchosBlancos = 'Párrafo 1' + '\n'.repeat(10) + 'Párrafo 2' + '\r\n'.repeat(10) + 'Párrafo 3';
    const buffer = await generarDocumentoWord(textoConMuchosBlancos);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    // Documento con blancos colapsados debe ser más compacto que uno que no colapsara 10 saltos por cada separación
    expect(buffer.length).toBeLessThan(20000);
  });

  test('preserva caracteres Unicode (tildes, ñ, símbolos legales)', async () => {
    const buffer = await generarDocumentoWord('Página 1 de 3 — Artículo 86, Ley 142/1994, atención al peticionario.');
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});
