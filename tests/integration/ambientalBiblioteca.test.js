import { jest } from '@jest/globals';
import crypto from 'node:crypto';
import { enAislamiento as aislar } from '../helpers/aislamientoAmbiental.js';

// #198 (épica #199): biblioteca ambiental sobre chunks_ambiental, con la
// meta del cálculo (modelo, fuente, silueta) y needs_recalculate cuando
// cambian el modelo o la fuente de los vectores.
//
// aiService se mockea (onnxruntime no corre en el VM de Jest) con un
// embedding de bolsa de palabras. La biblioteca es estado global
// (biblioteca_clusters/_puntos/_meta) y la guarda mira toda la tabla de
// expedientes: todo lo que escribe o depende de eso corre en una transacción
// donde solo los expedientes de este archivo siguen activos, y se deshace.
const embeddingBolsa = (texto) => {
  const v = new Array(384).fill(0);
  for (const palabra of texto.toLowerCase().match(/\p{L}{4,}/gu) ?? []) {
    v[crypto.createHash('md5').update(palabra).digest().readUInt16BE(0) % 384] += 1;
  }
  const norma = Math.hypot(...v) || 1;
  return v.map((x) => x / norma);
};
jest.unstable_mockModule('../../src/modules/tutelas/services/aiService.js', () => ({
  generarEmbeddingLocal: jest.fn(async (texto) => embeddingBolsa(texto)),
  generarEmbedding: jest.fn(async (texto) => embeddingBolsa(texto)),
}));

const { default: pool } = await import('../../src/db/database.js');
const { env } = await import('../../src/config/env.js');
const { default: bcrypt } = await import('bcrypt');
const { reindexarTrozosExpediente, MODELO_ALPHA_AMBIENTAL } = await import('../../src/modules/ambiental/services/ambientalEmbeddingService.js');
const {
  obtenerClusters,
  recalcularClusters,
  fuenteVectoresActual,
  leerVectoresBiblioteca,
  FUENTE_TROZOS,
  FUENTE_LEGADA,
} = await import('../../src/modules/ambiental/services/ambientalBibliotecaService.js');

jest.setTimeout(60000);

const TEXTOS = [
  'Compensación forestal por aprovechamiento de especies arbóreas en la servidumbre de la línea de transmisión.',
  'Inventario forestal y compensación por pérdida de biodiversidad en la servidumbre de la línea.',
  'Aprovechamiento forestal único, especies arbóreas y plan de compensación de la línea de transmisión.',
  'Permiso de vertimientos de aguas residuales domésticas de la subestación y monitoreo del efluente.',
  'Caracterización fisicoquímica del efluente y sistema de tratamiento de aguas residuales de la subestación.',
  'Monitoreo trimestral de la fuente receptora del vertimiento de aguas residuales de la subestación.',
];

describe('Biblioteca ambiental — vectores de chunks_ambiental y meta del cálculo (#198)', () => {
  const testEmail = 'ambiental-biblioteca-test@icebreaker.com';
  const modeloOriginal = env.EMBEDDING_MODEL;
  let testUserUuid;
  const ids = [];

  // Ver tests/helpers/aislamientoAmbiental.js.
  const enAislamiento = (fn) => aislar(pool, ids, fn);

  const particionGuardada = async (db) => {
    const { rows } = await db.query('SELECT expediente_ids FROM biblioteca_clusters');
    return rows.map((r) => [...r.expediente_ids].sort().join(',')).sort();
  };

  beforeAll(async () => {
    env.EMBEDDING_MODEL = MODELO_ALPHA_AMBIENTAL;
    const hash = await bcrypt.hash('testpass123', 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Ambiental Biblioteca Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;
    for (const [i, texto] of TEXTOS.entries()) {
      const exp = await pool.query(
        `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, contenido_texto, creado_por)
         VALUES ($1, 'Resolución', $2, $3) RETURNING id`,
        [`Biblioteca #198 — ${i}`, texto, testUserUuid]
      );
      ids.push(exp.rows[0].id);
      await reindexarTrozosExpediente(exp.rows[0].id);
    }
  });

  afterAll(async () => {
    env.EMBEDDING_MODEL = modeloOriginal;
    await pool.query('DELETE FROM chunks_ambiental WHERE expediente_id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM expedientes_ambientales WHERE id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  test('con la guarda en regla, la fuente es chunks_ambiental con e5; si no, embeddings_ambiental', async () => {
    expect(await enAislamiento((db) => fuenteVectoresActual(db))).toEqual({ fuente: FUENTE_TROZOS, modelo: MODELO_ALPHA_AMBIENTAL });
    env.EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
    try {
      expect(await enAislamiento((db) => fuenteVectoresActual(db))).toEqual({ fuente: FUENTE_LEGADA, modelo: 'Xenova/all-MiniLM-L6-v2' });
    } finally {
      env.EMBEDDING_MODEL = MODELO_ALPHA_AMBIENTAL;
    }
  });

  test('un vector por expediente: promedio normalizado de sus trozos activos', async () => {
    const puntos = await enAislamiento((db) => leerVectoresBiblioteca(FUENTE_TROZOS, db));
    expect(puntos.map((p) => p.id).sort()).toEqual([...ids].sort());
    for (const p of puntos) {
      expect(p.vector).toHaveLength(384);
      expect(Math.hypot(...p.vector)).toBeCloseTo(1, 6);
    }
    // Con un solo trozo por expediente, el promedio es el vector del trozo.
    const esperado = embeddingBolsa(TEXTOS[0]);
    const primero = puntos.find((p) => p.id === ids[0]);
    primero.vector.forEach((v, i) => expect(v).toBeCloseTo(esperado[i], 5));
  });

  test('dos recálculos seguidos con los mismos datos guardan la misma partición', async () => {
    const [p1, p2] = await enAislamiento(async (db) => {
      await recalcularClusters(db);
      const a = await particionGuardada(db);
      await recalcularClusters(db);
      return [a, await particionGuardada(db)];
    });
    expect(p1.length).toBeGreaterThan(1);
    expect(p2).toEqual(p1);
  });

  test('la meta registra modelo, fuente y silueta, y needs_recalculate queda en false', async () => {
    const [meta, estado] = await enAislamiento(async (db) => {
      await recalcularClusters(db);
      const { rows } = await db.query('SELECT * FROM biblioteca_meta WHERE id = 1');
      return [rows[0], await obtenerClusters(db)];
    });
    expect(meta.modelo_at_compute).toBe(MODELO_ALPHA_AMBIENTAL);
    expect(meta.fuente_at_compute).toBe(FUENTE_TROZOS);
    expect(meta.embeddings_count_at_compute).toBe(ids.length);
    expect(Number(meta.silueta)).toBeGreaterThanOrEqual(-1);
    expect(Number(meta.silueta)).toBeLessThanOrEqual(1);
    expect(estado.embeddings_actuales).toBe(ids.length);
    expect(estado.needs_recalculate).toBe(false);
  });

  test('cambiar el modelo marca needs_recalculate aunque los conteos no cambien', async () => {
    const estado = await enAislamiento(async (db) => {
      await recalcularClusters(db);
      await db.query("UPDATE biblioteca_meta SET modelo_at_compute = 'Xenova/all-MiniLM-L6-v2' WHERE id = 1");
      return obtenerClusters(db);
    });
    expect(estado.needs_recalculate).toBe(true);
  });

  test('si la fuente actual cambia (la guarda cae a embeddings_ambiental), needs_recalculate es true', async () => {
    const estado = await enAislamiento(async (db) => {
      await recalcularClusters(db);
      await db.query('UPDATE chunks_ambiental SET is_active = FALSE WHERE expediente_id = $1', [ids[0]]);
      return obtenerClusters(db);
    });
    expect(estado.needs_recalculate).toBe(true);
  });

  test('un cálculo anterior a #198 (sin modelo registrado) se marca para recalcular', async () => {
    const estado = await enAislamiento(async (db) => {
      await recalcularClusters(db);
      await db.query('UPDATE biblioteca_meta SET modelo_at_compute = NULL, fuente_at_compute = NULL WHERE id = 1');
      return obtenerClusters(db);
    });
    expect(estado.needs_recalculate).toBe(true);
  });
});
