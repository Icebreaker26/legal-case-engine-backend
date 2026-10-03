import { jest } from '@jest/globals';
import pool from '../../src/db/database.js';

// aiService mockeado (igual que memoria.test.js): el modelo ONNX real de
// @xenova/transformers no corre bajo el entorno de VM modules de Jest
// ("A float32 tensor's data must be type of function Float32Array()" — los
// realms de Jest rompen los chequeos de tipo internos de onnxruntime). La
// integración real contra pgvector se prueba igual, solo el embedding es
// falso — consistente con cómo vectorService.test.js evita esto pasando un
// vector precalculado en vez de llamar a generarEmbeddingLocal.
jest.unstable_mockModule('../../src/modules/tutelas/services/aiService.js', () => ({
  generarEmbeddingLocal: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
  generarEmbedding: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
}));

const { indexarDocumento } = await import('../../src/modules/tutelas/services/memoriaService.js');

// Integración real contra pgvector — solo el modelo de embeddings está
// mockeado (ver arriba).

const CATEGORIA_TEST = 'MEMORIASVC_TEST';

describe('memoriaService — indexarDocumento (integración real, #72 Fase 1)', () => {
  const documentoIds = [];

  afterAll(async () => {
    if (documentoIds.length) {
      await pool.query('DELETE FROM documentos_fuente WHERE documento_id = ANY($1::uuid[])', [documentoIds]);
    }
    await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_TEST]);
    await pool.end();
  });

  test('persiste el texto fuente íntegro en documentos_fuente (transacción propia)', async () => {
    const texto = 'Corte del servicio eléctrico por mora en el pago de facturación mensual.';
    const { documentoId } = await indexarDocumento({
      texto,
      categoria: CATEGORIA_TEST,
      titulo: 'Doc transacción propia',
    });
    documentoIds.push(documentoId);

    const { rows } = await pool.query('SELECT texto_fuente FROM documentos_fuente WHERE documento_id = $1', [documentoId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].texto_fuente).toBe(texto);
  });

  test('persiste el texto fuente cuando se pasa un client externo (misma transacción que el caller)', async () => {
    const texto = 'Servidumbre de paso para infraestructura de distribución en predio rural.';
    const client = await pool.connect();
    let documentoId;
    try {
      await client.query('BEGIN');
      ({ documentoId } = await indexarDocumento({
        texto,
        categoria: CATEGORIA_TEST,
        titulo: 'Doc client externo',
        client,
      }));
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    documentoIds.push(documentoId);

    const { rows } = await pool.query('SELECT texto_fuente FROM documentos_fuente WHERE documento_id = $1', [documentoId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].texto_fuente).toBe(texto);
  });

  test('un documento con varios chunks guarda UNA sola fila en documentos_fuente, no una por chunk', async () => {
    // Párrafo repetido hasta superar el tamaño de chunk (1500) por un buen
    // margen, para forzar dividirEnChunks a partirlo en más de un chunk.
    const parrafo = 'Corte del servicio eléctrico por mora en el pago de facturación mensual. '.repeat(40);
    const texto = `${parrafo}\n\n${parrafo}\n\n${parrafo}`;

    const { documentoId, chunks } = await indexarDocumento({
      texto,
      categoria: CATEGORIA_TEST,
      titulo: 'Doc multi-chunk',
    });
    documentoIds.push(documentoId);
    expect(chunks).toBeGreaterThan(1);

    const { rows: fuente } = await pool.query('SELECT texto_fuente FROM documentos_fuente WHERE documento_id = $1', [documentoId]);
    expect(fuente).toHaveLength(1);
    expect(fuente[0].texto_fuente).toBe(texto);

    const { rows: baseRows } = await pool.query('SELECT id FROM base_conocimiento_enel WHERE documento_id = $1', [documentoId]);
    expect(baseRows.length).toBe(chunks);
  });
});
