import { jest } from '@jest/globals';
import crypto from 'node:crypto';

// #196 (épica #199): buscarSimilares sobre el motor α (chunks_ambiental) con
// guarda de modelo y datos, kill switch y caída al RRF anterior.
//
// onnxruntime no corre dentro del VM de Jest, así que aiService se mockea con
// un embedding de bolsa de palabras (hash de cada palabra a una de 384
// dimensiones, normalizado): textos del mismo tema comparten palabras y quedan
// más cerca en coseno. El orden que se verifica sale de la fórmula α real en
// SQL, no de vectores idénticos.
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
const { generarEmbeddingLocal } = await import('../../src/modules/tutelas/services/aiService.js');
const {
  reindexarTrozosExpediente,
  resolverMotorSimilares,
  buscarSimilares,
  buscarSimilaresAlpha,
  MODELO_ALPHA_AMBIENTAL,
} = await import('../../src/modules/ambiental/services/ambientalEmbeddingService.js');

jest.setTimeout(60000);

const SERVIDUMBRE = 'La autoridad ambiental impone compensación forestal por la servidumbre de la línea de transmisión, '
  + 'con aprovechamiento forestal, inventario de especies arbóreas y plan de compensación por pérdida de biodiversidad.';
const VERTIMIENTOS = 'Permiso de vertimientos de aguas residuales domésticas de la subestación: caudal autorizado, '
  + 'caracterización fisicoquímica del efluente, sistema de tratamiento y monitoreo trimestral de la fuente receptora.';

describe('Ambiental — similares con el motor α (#196)', () => {
  const testEmail = 'ambiental-similares-test@icebreaker.com';
  const modeloOriginal = env.EMBEDDING_MODEL;
  const killOriginal = env.AMBIENTAL_ALPHA_KILL;
  let testUserUuid;
  const ids = {};

  const crearExpediente = async (titulo, contenido) => {
    const { rows } = await pool.query(
      `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, contenido_texto, creado_por)
       VALUES ($1, 'Resolución', $2, $3) RETURNING id`,
      [titulo, contenido, testUserUuid]
    );
    return rows[0].id;
  };

  // Corre `fn` con un cliente en una transacción donde solo los expedientes de
  // este archivo siguen activos, y la deshace al final: así la guarda (que mira
  // TODA la tabla) no depende de lo que otras suites escriban en paralelo.
  const enAislamiento = async (fn, mantenerActivos = Object.values(ids)) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE expedientes_ambientales SET is_active = FALSE WHERE is_active = TRUE AND id <> ALL($1::uuid[])',
        [mantenerActivos]
      );
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  };

  beforeAll(async () => {
    env.EMBEDDING_MODEL = MODELO_ALPHA_AMBIENTAL;
    env.AMBIENTAL_ALPHA_KILL = false;
    const hash = await bcrypt.hash('testpass123', 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Ambiental Similares Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    ids.consulta = await crearExpediente('Compensación forestal — consulta', SERVIDUMBRE);
    ids.mismoTema1 = await crearExpediente('Compensación forestal — par 1',
      'Resolución de compensación forestal: inventario de especies arbóreas en la servidumbre de la línea de transmisión y aprovechamiento forestal único.');
    ids.mismoTema2 = await crearExpediente('Compensación forestal — par 2',
      'Plan de compensación por pérdida de biodiversidad y aprovechamiento forestal en la servidumbre de la línea; seguimiento de especies arbóreas.');
    ids.otroTema = await crearExpediente('Vertimientos — subestación', VERTIMIENTOS);
    for (const id of Object.values(ids)) await reindexarTrozosExpediente(id);
  });

  afterAll(async () => {
    env.EMBEDDING_MODEL = modeloOriginal;
    env.AMBIENTAL_ALPHA_KILL = killOriginal;
    const todos = [...Object.values(ids)];
    await pool.query('DELETE FROM chunks_ambiental WHERE expediente_id = ANY($1::uuid[])', [todos]);
    await pool.query('DELETE FROM expedientes_ambientales WHERE id = ANY($1::uuid[])', [todos]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  describe('Motor α', () => {
    test('dos expedientes del mismo tema quedan por encima de uno de otro tema, sin el consultado', async () => {
      const res = await enAislamiento((db) => buscarSimilaresAlpha(ids.consulta, 5, db));
      const orden = res.map((r) => r.id);
      expect(orden).not.toContain(ids.consulta);
      expect(orden).toHaveLength(3);
      expect(orden.slice(0, 2).sort()).toEqual([ids.mismoTema1, ids.mismoTema2].sort());
      expect(orden[2]).toBe(ids.otroTema);
      expect(Number(res[0].similitud)).toBeGreaterThan(Number(res[2].similitud));
    });

    test('la consulta se embebe como query (estrategia validada de tutelas)', async () => {
      generarEmbeddingLocal.mockClear();
      await enAislamiento((db) => buscarSimilaresAlpha(ids.consulta, 5, db));
      expect(generarEmbeddingLocal).toHaveBeenCalledWith(SERVIDUMBRE, { tipo: 'query' });
    });

    test('contrato del frontend: mismos campos, similitud en 0–1, sin rrf_score', async () => {
      const res = await enAislamiento((db) => buscarSimilaresAlpha(ids.consulta, 5, db));
      for (const r of res) {
        expect(Object.keys(r)).toEqual(['id', 'titulo', 'numero_expediente', 'tipo_instrumento', 'estado', 'entidad_nombre', 'nivel_riesgo', 'resumen', 'similitud']);
        expect(Number(r.similitud)).toBeGreaterThanOrEqual(0);
        expect(Number(r.similitud)).toBeLessThanOrEqual(1);
      }
    });

    test('respeta el límite', async () => {
      const res = await enAislamiento((db) => buscarSimilaresAlpha(ids.consulta, 1, db));
      expect(res).toHaveLength(1);
    });

    test('expediente sin trozos activos → null (404), igual que sin embedding', async () => {
      const res = await enAislamiento(async (db) => {
        await db.query('UPDATE chunks_ambiental SET is_active = FALSE WHERE expediente_id = $1', [ids.otroTema]);
        return buscarSimilaresAlpha(ids.otroTema, 5, db);
      });
      expect(res).toBeNull();
    });

    test('un expediente inactivo no aparece entre los similares', async () => {
      const res = await enAislamiento(
        (db) => buscarSimilaresAlpha(ids.consulta, 5, db),
        [ids.consulta, ids.mismoTema1, ids.otroTema]
      );
      expect(res.map((r) => r.id)).not.toContain(ids.mismoTema2);
    });
  });

  describe('Guarda y caída a RRF', () => {
    test('con modelo e5 y todo indexado, buscarSimilares usa α', async () => {
      const [motor, res] = await enAislamiento(async (db) => [await resolverMotorSimilares(db), await buscarSimilares(ids.consulta, 5, db)]);
      expect(motor).toBe('alpha');
      expect(res[0]).not.toHaveProperty('rrf_score');
    });

    test('EMBEDDING_MODEL distinto de e5 → rrf', async () => {
      env.EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
      try {
        expect(await enAislamiento((db) => resolverMotorSimilares(db))).toBe('rrf');
      } finally {
        env.EMBEDDING_MODEL = MODELO_ALPHA_AMBIENTAL;
      }
    });

    test('AMBIENTAL_ALPHA_KILL → rrf aunque todo esté en regla', async () => {
      env.AMBIENTAL_ALPHA_KILL = true;
      try {
        expect(await enAislamiento((db) => resolverMotorSimilares(db))).toBe('rrf');
      } finally {
        env.AMBIENTAL_ALPHA_KILL = false;
      }
    });

    test('un trozo activo con otro modelo → rrf', async () => {
      const motor = await enAislamiento(async (db) => {
        await db.query(
          "UPDATE chunks_ambiental SET embedding_modelo = 'Xenova/all-MiniLM-L6-v2' WHERE expediente_id = $1",
          [ids.mismoTema1]
        );
        return resolverMotorSimilares(db);
      });
      expect(motor).toBe('rrf');
    });

    test('un expediente activo con texto y sin reindexar → rrf', async () => {
      const motor = await enAislamiento(async (db) => {
        const { rows } = await db.query(
          `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, contenido_texto, creado_por)
           VALUES ('Sin reindexar #196', 'Resolución', 'Texto todavía sin trozos.', $1) RETURNING id`,
          [testUserUuid]
        );
        expect(rows[0].id).toBeDefined();
        return resolverMotorSimilares(db);
      });
      expect(motor).toBe('rrf');
    });

    test('con la guarda caída, buscarSimilares devuelve el RRF anterior (404 si no hay embeddings_ambiental)', async () => {
      env.AMBIENTAL_ALPHA_KILL = true;
      try {
        // Los expedientes de este archivo no tienen fila en embeddings_ambiental.
        expect(await enAislamiento((db) => buscarSimilares(ids.consulta, 5, db))).toBeNull();
      } finally {
        env.AMBIENTAL_ALPHA_KILL = false;
      }
    });
  });
});
