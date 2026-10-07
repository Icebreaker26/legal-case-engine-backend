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
  {
    documento_id: 'aaaaaaaa-0000-0000-0000-000000000004',
    titulo_referencia: 'VectorService Doc D (vector lejano, texto sin relación, sin feedback)',
    contenido_legal: 'Reglamento interno de bienestar laboral para contratistas externos.',
    embedding_local: vectorLejano,
    relevancia_score: 0,
  },
  {
    documento_id: 'aaaaaaaa-0000-0000-0000-000000000005',
    titulo_referencia: 'VectorService Doc E (desactivado — vector cercano, texto relevante, mejor relevancia que A)',
    contenido_legal: 'Corte del servicio eléctrico por mora en el pago de facturación mensual.',
    embedding_local: vectorCercano,
    relevancia_score: 10,
    is_active: false,
  },
];

describe('vectorService — buscarContextoLegal (integración real contra pgvector)', () => {
  beforeAll(async () => {
    for (const d of docs) {
      await pool.query(
        `INSERT INTO base_conocimiento_enel
           (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, relevancia_score)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7)`,
        [CATEGORIA_TEST, d.titulo_referencia, d.contenido_legal, JSON.stringify(d.embedding_local), d.is_active ?? true, d.documento_id, d.relevancia_score]
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

  describe('ROW_NUMBER() del chunk representante (#65)', () => {
    // Mismo documento_id, dos chunks: uno con ts_rank alto pero vector lejano
    // (score bajo, por el peso 0.55 del término vectorial), otro con ts_rank
    // cero pero vector cercano (score alto). El chunk representante debe ser
    // el de mayor score, no el de mayor ts_rank.
    const DOCUMENTO_ID_COMPARTIDO = 'bbbbbbbb-0000-0000-0000-000000000001';
    const CATEGORIA_ROWNUM = 'VECTORSVC_ROWNUM_TEST';

    const chunkTsRankAlto = {
      titulo_referencia: 'RowNumber Chunk ts_rank alto (vector lejano)',
      contenido_legal: 'Corte del servicio eléctrico por mora en el pago de facturación mensual.',
      embedding_local: vectorLejano,
    };
    const chunkScoreAlto = {
      titulo_referencia: 'RowNumber Chunk score alto (vector cercano, sin match léxico)',
      contenido_legal: 'Documento sin relación textual alguna con el término de búsqueda empleado.',
      embedding_local: vectorCercano,
    };

    beforeAll(async () => {
      for (const c of [chunkTsRankAlto, chunkScoreAlto]) {
        await pool.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, relevancia_score)
           VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, 0)`,
          [CATEGORIA_ROWNUM, c.titulo_referencia, c.contenido_legal, JSON.stringify(c.embedding_local), DOCUMENTO_ID_COMPARTIDO]
        );
      }
    });

    afterAll(async () => {
      await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_ROWNUM]);
    });

    test('elige el chunk de mayor score, no el de mayor ts_rank', async () => {
      // categoria con <3 resultados dispara el complemento global de
      // buscarPonderado (comportamiento esperado, no el bug bajo prueba) —
      // se filtra por documento_id para aislar el representante elegido.
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_ROWNUM);
      const representante = rows.filter(r => r.documento_id === DOCUMENTO_ID_COMPARTIDO);
      expect(representante).toHaveLength(1);
      expect(representante[0].titulo_referencia).toBe(chunkScoreAlto.titulo_referencia);
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

    test('la señal de relevancia (rel) excluye documentos sin feedback positivo (relevancia_score=0)', async () => {
      // Prueba quirúrgica de la señal "rel" en aislamiento, replicando su WHERE
      // exacto — en vez de verificar el resultado fusionado (donde las otras dos
      // señales, vectorial y léxica, pueden empatar entre sí y enmascarar el bug).
      //
      // Antes del fix: relevancia_score=0 es el default de TODO documento sin
      // feedback del abogado. Sin "AND relevancia_score > 0", los 3 documentos
      // de prueba con score=0 (B, C, D) empatan y Postgres los devuelve en un
      // orden arbitrario — cualquiera de ellos podía colarse en el ranking de
      // "rel" y recibir el mismo impulso RRF que un documento con feedback real.
      const { rows } = await pool.query(
        `SELECT documento_id FROM base_conocimiento_enel
         WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE
           AND relevancia_score > 0 AND categoria = $1
         ORDER BY relevancia_score DESC`,
        [CATEGORIA_TEST]
      );
      // Solo Doc A tiene relevancia_score=8 > 0 y is_active=TRUE; B, C y D tienen
      // score 0, y Doc E (relevancia_score=10) está desactivado (#64) — los 4 quedan fuera.
      expect(rows).toHaveLength(1);
      expect(rows[0].documento_id).toBe(docs[0].documento_id);
    });
  });

  describe('fusion: "alpha" (#127 — replica cos*alpha + ts_rank*(1-alpha), sin relevancia_score)', () => {
    test('alpha inválido (fuera de [0,1]) lanza error', async () => {
      await expect(
        buscarContextoLegal(vectorCercano, 'facturación', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 1.5 })
      ).rejects.toThrow(/alpha inválido/);
    });

    test('alpha no numérico lanza error', async () => {
      await expect(
        buscarContextoLegal(vectorCercano, 'facturación', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 'alta' })
      ).rejects.toThrow(/alpha inválido/);
    });

    test('sin pasar alpha, usa el default 0.9 y devuelve resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'alpha' });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty('score');
    });

    test('nunca repite documento_id (un chunk representante por documento)', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 0.9 });
      const ids = rows.map(r => r.documento_id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test('alpha=1 (puro vector): Doc C (vector cercano, sin match léxico) empata o le gana a Doc B (vector lejano, con match léxico)', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 1 });
      const porId = new Map(rows.map(r => [r.documento_id, Number(r.score)]));
      expect(porId.get(docs[2].documento_id)).toBeGreaterThan(porId.get(docs[1].documento_id));
    });

    test('alpha=0 (puro léxico): Doc B (vector lejano, con match léxico) le gana a Doc C (vector cercano, sin match léxico)', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 0 });
      const porId = new Map(rows.map(r => [r.documento_id, Number(r.score)]));
      expect(porId.get(docs[1].documento_id)).toBeGreaterThan(porId.get(docs[2].documento_id));
    });

    test('ignora relevancia_score — Doc A y Doc C (mismo vector cercano, A con texto relevante) no se reordenan por el feedback de Doc A', async () => {
      // Doc A: relevancia_score=8. Doc C: relevancia_score=0. Si la fórmula alpha
      // filtrara relevancia_score (no debería — ver el comentario en vectorService.js),
      // el score de A subiría por un motivo ajeno a coseno/ts_rank. Con texto que no
      // matchea a ninguno de los dos, el orden entre A y C debe depender solo del
      // término léxico (A tiene match, C no) — nunca de relevancia_score.
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 0.9 });
      const porId = new Map(rows.map(r => [r.documento_id, Number(r.score)]));
      // cos es igual (mismo vector cercano) para A y C → la diferencia de score debe
      // ser exactamente ts_rank*(1-0.9), no contaminada por relevancia_score.
      const diferencia = porId.get(docs[0].documento_id) - porId.get(docs[2].documento_id);
      expect(diferencia).toBeGreaterThan(0);
      expect(diferencia).toBeLessThan(0.1 + 1e-6); // cota: (1-alpha)*ts_rank_max, ts_rank<=1
    });
  });

  describe('is_active (borrado lógico — #64)', () => {
    // Doc E: vector cercano + mismo texto que A + mejor relevancia_score, pero
    // is_active=FALSE. Si el filtro faltara, Doc E desplazaría a A en ambas
    // estrategias (ponderado por score, RRF por las 3 señales).
    test('ponderado: un documento desactivado no aparece en los resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST);
      const ids = rows.map(r => r.documento_id);
      expect(ids).not.toContain(docs[4].documento_id);
    });

    test('rrf: un documento desactivado no aparece en los resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'rrf' });
      const ids = rows.map(r => r.documento_id);
      expect(ids).not.toContain(docs[4].documento_id);
    });

    test('ponderado: el documento activo con el mismo contenido sigue apareciendo', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST);
      const ids = rows.map(r => r.documento_id);
      expect(ids).toContain(docs[0].documento_id);
    });

    test('alpha: un documento desactivado no aparece en los resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_TEST, { fusion: 'alpha', alpha: 0.9 });
      const ids = rows.map(r => r.documento_id);
      expect(ids).not.toContain(docs[4].documento_id);
    });
  });

  describe('documento_id NULL (#67)', () => {
    // Dos filas con documento_id = NULL, vector cercano + texto relevante:
    // antes del fix, PARTITION BY documento_id (ponderado) y
    // DISTINCT ON (documento_id) (RRF) las agrupan entre sí como si fueran
    // "un documento", y esa fila-fantasma puede colarse en el ranking junto
    // a los documentos reales.
    const CATEGORIA_NULL = 'VECTORSVC_NULL_TEST';

    beforeAll(async () => {
      for (let i = 0; i < 2; i++) {
        await pool.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, relevancia_score)
           VALUES ($1, $2, $3, $4, TRUE, TRUE, NULL, 0)`,
          [CATEGORIA_NULL, `NULL Doc ${i}`, 'Corte del servicio eléctrico por mora en el pago de facturación mensual.', JSON.stringify(vectorCercano)]
        );
      }
    });

    afterAll(async () => {
      await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_NULL]);
    });

    test('ponderado: ninguna fila con documento_id NULL aparece en los resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_NULL);
      expect(rows.every(r => r.documento_id !== null)).toBe(true);
    });

    test('rrf: ninguna fila con documento_id NULL aparece en los resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_NULL, { fusion: 'rrf' });
      expect(rows.every(r => r.documento_id !== null)).toBe(true);
    });

    test('alpha: ninguna fila con documento_id NULL aparece en los resultados', async () => {
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_NULL, { fusion: 'alpha', alpha: 0.9 });
      expect(rows.every(r => r.documento_id !== null)).toBe(true);
    });

    test('ponderado: la búsqueda complementaria (idsEncontrados) no se rompe cuando el único resultado de la categoría es NULL', async () => {
      // categoria con <3 resultados dispara el complemento global — si
      // idsEncontrados llegara a traer un NULL, "<> ALL(ARRAY[NULL])"
      // evalúa a NULL por fila y el complemento devolvería 0 filas en
      // silencio. Con el fix, la categoría NULL simplemente no aporta
      // resultados propios y el complemento trae los documentos activos
      // reales de otras categorías.
      const rows = await buscarContextoLegal(vectorCercano, 'facturación mensual', 10, CATEGORIA_NULL);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every(r => r.documento_id !== null)).toBe(true);
    });
  });
});
