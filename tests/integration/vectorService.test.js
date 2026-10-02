import pool from '../../src/db/database.js';
import { buscarContextoLegal } from '../../src/modules/tutelas/services/vectorService.js';

// Integración real contra pgvector — sin mocks de base de datos.
// Semilla propia (no reutiliza el seed global) para controlar vectores,
// texto y relevancia_score exactos que necesita cada aserción.

const CATEGORIA_TEST = 'VECTORSVC_TEST';

const vectorCercano = Array(384).fill(0.9);
const vectorLejano = Array(384).fill(-0.9);

const docs = [
  {
    documento_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    titulo_referencia: 'VectorService Doc A (vector cercano, texto relevante, buena relevancia)',
    contenido_legal: 'Corte del servicio eléctrico por mora en el pago de facturación mensual.',
    embedding_local: vectorCercano,
    relevancia_score: 8,
  },
  {
    documento_id: 'aaaaaaaa-0000-0000-0000-000000000002',
    titulo_referencia: 'VectorService Doc B (vector lejano, mismo texto relevante)',
    contenido_legal: 'Corte del servicio eléctrico por mora en el pago de facturación mensual.',
    embedding_local: vectorLejano,
    relevancia_score: 0,
  },
  {
    documento_id: 'aaaaaaaa-0000-0000-0000-000000000003',
    titulo_referencia: 'VectorService Doc C (vector cercano, texto sin relación)',
    contenido_legal: 'Servidumbre de paso para infraestructura de distribución en predio rural.',
    embedding_local: vectorCercano,
    relevancia_score: 0,
  },
];

describe('vectorService — buscarContextoLegal (integración real contra pgvector)', () => {
  beforeAll(async () => {
    for (const d of docs) {
      await pool.query(
        `INSERT INTO base_conocimiento_enel
           (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, relevancia_score)
         VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, $6)`,
        [CATEGORIA_TEST, d.titulo_referencia, d.contenido_legal, JSON.stringify(d.embedding_local), d.documento_id, d.relevancia_score]
      );
    }
  });

  afterAll(async () => {
    await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_TEST]);
    await pool.end();
  });

  describe('validación de entrada (compartida por ambas estrategias)', () => {
    test('vector vacío lanza error', async () => {
      await expect(buscarContextoLegal([], 'texto', 5)).rejects.toThrow('Vector inválido o vacío');
    });

    test('vector no-array lanza error', async () => {
      await expect(buscarContextoLegal('no-es-array', 'texto', 5)).rejects.toThrow('Vector inválido o vacío');
    });
  });

  describe('fusion: "ponderado" (default, sin cambio de comportamiento)', () => {
    test('sin pasar opciones, usa ponderado y devuelve resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación', 10, CATEGORIA_TEST);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty('score');
    });
  });

  describe('fusion: "rrf"', () => {
    test('devuelve resultados fusionando señal vectorial, léxica y relevancia', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'rrf' });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty('score');
      // Doc A: vector cercano + coincide con el texto + mejor relevancia_score → debe quedar primero
      expect(rows[0].documento_id).toBe(docs[0].documento_id);
    });

    test('nunca repite documento_id en el resultado (un chunk representante por documento)', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'rrf' });
      const ids = rows.map(r => r.documento_id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test('respeta el filtro de categoría', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación', 10, CATEGORIA_TEST, { fusion: 'rrf' });
      expect(rows.every(r => r.categoria === CATEGORIA_TEST)).toBe(true);
    });

    test('categoría sin coincidencias devuelve array vacío, no error', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación', 10, 'CATEGORIA_QUE_NO_EXISTE_XYZ', { fusion: 'rrf' });
      expect(rows).toEqual([]);
    });

    test('texto sin lexemas útiles (vacío) no falla — solo cae a señal vectorial y relevancia', async () => {
      const rows = await buscarContextoLegal(vectorCercano, '', 10, CATEGORIA_TEST, { fusion: 'rrf' });
      expect(Array.isArray(rows)).toBe(true);
    });
  });
});
