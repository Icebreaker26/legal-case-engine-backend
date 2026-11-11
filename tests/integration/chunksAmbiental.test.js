import pool from '../../src/db/database.js';
import bcrypt from 'bcrypt';

// #194 (épica #199): esquema de `chunks_ambiental` (migración 1786700000000).
// Solo esquema: la indexación que la llena es #195 y la búsqueda, #196.

const MODELO = 'Xenova/multilingual-e5-small';
const vector = (v) => `[${Array(384).fill(v).join(',')}]`;

describe('chunks_ambiental — esquema (#194)', () => {
  const testEmail = 'chunks-ambiental-test@icebreaker.com';
  let testUserUuid;
  let expedienteId;

  const insertarTrozo = (overrides = {}) => {
    const t = {
      expediente_id: expedienteId,
      chunk_index: 0,
      contenido: 'La autoridad ambiental ordena presentar el plan de manejo de la servidumbre.',
      embedding: vector(0.01),
      embedding_modelo: MODELO,
      fuente: 'contenido',
      ...overrides,
    };
    return pool.query(
      `INSERT INTO chunks_ambiental (expediente_id, chunk_index, contenido, embedding, embedding_modelo, fuente)
       VALUES ($1, $2, $3, $4::vector, $5, $6) RETURNING *`,
      [t.expediente_id, t.chunk_index, t.contenido, t.embedding, t.embedding_modelo, t.fuente]
    );
  };

  beforeAll(async () => {
    const hash = await bcrypt.hash('testpass123', 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Chunks Ambiental Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    const exp = await pool.query(
      `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, creado_por)
       VALUES ('Expediente de prueba #194', 'Resolución', $1) RETURNING id`,
      [testUserUuid]
    );
    expedienteId = exp.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM chunks_ambiental WHERE expediente_id = $1', [expedienteId]);
    await pool.query('DELETE FROM expedientes_ambientales WHERE id = $1', [expedienteId]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  describe('Estructura', () => {
    test('crea los índices HNSW (coseno), GIN, por expediente y el único parcial', async () => {
      const { rows } = await pool.query(
        `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'chunks_ambiental'`
      );
      const def = Object.fromEntries(rows.map((r) => [r.indexname, r.indexdef]));
      expect(def.idx_chunks_ambiental_embedding_hnsw).toMatch(/USING hnsw \(embedding vector_cosine_ops\)/);
      expect(def.idx_chunks_ambiental_tsv).toMatch(/USING gin \(contenido_tsv\)/);
      expect(def.idx_chunks_ambiental_expediente).toMatch(/\(expediente_id\)/);
      expect(def.uq_chunks_ambiental_activo).toMatch(/UNIQUE INDEX .*WHERE \(is_active = true\)/);
    });

    test('no toca embeddings_ambiental (migración aditiva)', async () => {
      const { rows } = await pool.query(`SELECT to_regclass('embeddings_ambiental') AS t`);
      expect(rows[0].t).toBe('embeddings_ambiental');
    });
  });

  describe('Escritura y lectura', () => {
    test('inserta trozos y los lee en orden, con modelo y tsvector generado', async () => {
      await insertarTrozo({ chunk_index: 0 });
      await insertarTrozo({ chunk_index: 1, contenido: 'Segundo trozo: licencia de energía para la línea.' });

      const { rows } = await pool.query(
        `SELECT chunk_index, embedding_modelo, is_active, vector_dims(embedding) AS dims,
                contenido_tsv @@ plainto_tsquery('spanish', 'servidumbre') AS coincide
         FROM chunks_ambiental WHERE expediente_id = $1 ORDER BY chunk_index`,
        [expedienteId]
      );
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ chunk_index: 0, embedding_modelo: MODELO, is_active: true, dims: 384, coincide: true });
      expect(rows[1]).toMatchObject({ chunk_index: 1, coincide: false });
    });

    test('la guarda de modelo (IS DISTINCT FROM) ve todo el expediente indexado con e5', async () => {
      const { rows } = await pool.query(
        `SELECT NOT EXISTS (
           SELECT 1 FROM chunks_ambiental
           WHERE expediente_id = $1 AND is_active = TRUE AND embedding_modelo IS DISTINCT FROM $2
         ) AS sincronizado`,
        [expedienteId, MODELO]
      );
      expect(rows[0].sincronizado).toBe(true);
    });
  });

  describe('Restricciones', () => {
    test('rechaza un trozo sin modelo registrado', async () => {
      await expect(insertarTrozo({ chunk_index: 9, embedding_modelo: null })).rejects.toThrow(/null value/);
    });

    test('rechaza una fuente desconocida', async () => {
      await expect(insertarTrozo({ chunk_index: 9, fuente: 'otra' })).rejects.toThrow(/check constraint/);
    });

    test('rechaza un vector de otra dimensión', async () => {
      await expect(insertarTrozo({ chunk_index: 9, embedding: '[0.1,0.2,0.3]' })).rejects.toThrow(/dimensions/);
    });

    test('no admite el mismo trozo activo dos veces', async () => {
      await expect(insertarTrozo({ chunk_index: 0 })).rejects.toThrow(/uq_chunks_ambiental_activo/);
    });

    test('tras el borrado lógico, el trozo puede volver a indexarse', async () => {
      await pool.query(
        'UPDATE chunks_ambiental SET is_active = FALSE, updated_at = NOW() WHERE expediente_id = $1 AND chunk_index = 0',
        [expedienteId]
      );
      const { rows } = await insertarTrozo({ chunk_index: 0 });
      expect(rows[0].is_active).toBe(true);
    });
  });
});
