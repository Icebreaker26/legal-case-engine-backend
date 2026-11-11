import { jest } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

// #195 (épica #199): indexación de expedientes ambientales en trozos con e5,
// sobre chunks_ambiental (#194), y dry-run de scripts/reindexar_ambiental.js.
// Se llama al servicio directamente (no a la API) para no depender de los
// setImmediate del controlador.
//
// onnxruntime no corre dentro del VM de Jest (Float32Array de otro realm), así
// que aiService se mockea como en memoria.test.js, pero con un vector
// determinista que depende del texto Y del tipo: así se verifica que cada
// trozo se indexa con { tipo: 'passage' } y que se guarda su propio vector.
const vectorFalso = (texto, tipo) => {
  const semilla = crypto.createHash('sha256').update(`${tipo}:${texto}`).digest();
  return Array.from({ length: 384 }, (_, i) => (semilla[i % 32] - 128) / 1024);
};
jest.unstable_mockModule('../../src/modules/tutelas/services/aiService.js', () => ({
  generarEmbeddingLocal: jest.fn(async (texto, { tipo = 'passage' } = {}) => vectorFalso(texto, tipo)),
  generarEmbedding: jest.fn(async (texto, { tipo = 'passage' } = {}) => vectorFalso(texto, tipo)),
}));

const { default: pool } = await import('../../src/db/database.js');
const { env } = await import('../../src/config/env.js');
const { default: bcrypt } = await import('bcrypt');
const { generarEmbeddingLocal } = await import('../../src/modules/tutelas/services/aiService.js');
const {
  reindexarTrozosExpediente,
  leerTextosExpediente,
  TROZO_SOLAPE,
  TROZO_TAMANO,
} = await import('../../src/modules/ambiental/services/ambientalEmbeddingService.js');

const E5 = 'Xenova/multilingual-e5-small';
jest.setTimeout(60000);

// ~5.000 caracteres en 13 párrafos de ~380.
const PARRAFO = (i) =>
  `Párrafo ${i}. La autoridad ambiental competente ordena al titular del proyecto de transmisión ` +
  `presentar el plan de manejo ambiental ajustado, con las medidas de compensación forestal, el ` +
  `programa de seguimiento a fuentes hídricas y el cronograma de obras de la servidumbre, dentro ` +
  `del plazo otorgado en la resolución y conforme a la Ley 99 de 1993 y al Decreto 1076 de 2015.`;
const TEXTO_LARGO = Array.from({ length: 13 }, (_, i) => PARRAFO(i + 1)).join('\n\n');

describe('Ambiental — indexación en trozos (#195)', () => {
  const testEmail = 'ambiental-indexacion-test@icebreaker.com';
  const modeloOriginal = env.EMBEDDING_MODEL;
  let testUserUuid;
  let expedienteId;
  let expedienteSinTextoId;

  const trozosActivos = async (id = expedienteId) => (await pool.query(
    `SELECT id, fuente, chunk_index, contenido, embedding::text AS embedding, embedding_modelo
     FROM chunks_ambiental WHERE expediente_id = $1 AND is_active = TRUE
     ORDER BY fuente, chunk_index`,
    [id]
  )).rows;

  beforeAll(async () => {
    env.EMBEDDING_MODEL = E5;
    const hash = await bcrypt.hash('testpass123', 10);
    const { rows } = await pool.query(
      `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
       VALUES ($1, $2, $3, 'juridico', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Ambiental Indexacion Test', testEmail, hash]
    );
    testUserUuid = rows[0].id;

    const exp = await pool.query(
      `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, contenido_texto, que_ordena, creado_por)
       VALUES ('Expediente de prueba #195', 'Resolución', $1, 'Presentar el PMA ajustado.', $2) RETURNING id`,
      [TEXTO_LARGO, testUserUuid]
    );
    expedienteId = exp.rows[0].id;

    const vacio = await pool.query(
      `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, creado_por)
       VALUES ('Expediente sin texto #195', 'Resolución', $1) RETURNING id`,
      [testUserUuid]
    );
    expedienteSinTextoId = vacio.rows[0].id;
  });

  afterAll(async () => {
    env.EMBEDDING_MODEL = modeloOriginal;
    const ids = [expedienteId, expedienteSinTextoId];
    await pool.query('DELETE FROM chunks_ambiental WHERE expediente_id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM analisis_ambiental WHERE expediente_id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM expedientes_ambientales WHERE id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM global_usuarios WHERE id = $1', [testUserUuid]);
    await pool.end();
  });

  describe('Indexación', () => {
    test('un expediente de ~5.000 caracteres produce ≥ 4 trozos con solape y embedding_modelo = e5', async () => {
      expect(TEXTO_LARGO.length).toBeGreaterThan(4800);
      const r = await reindexarTrozosExpediente(expedienteId);
      expect(r).toEqual({ contenido: expect.any(Number), analisis: 0 });
      expect(r.contenido).toBeGreaterThanOrEqual(4);

      const trozos = await trozosActivos();
      expect(trozos.map((t) => t.chunk_index)).toEqual([...Array(r.contenido).keys()]);
      for (const t of trozos) {
        expect(t.fuente).toBe('contenido');
        expect(t.embedding_modelo).toBe(E5);
        expect(t.contenido.length).toBeLessThanOrEqual(TROZO_TAMANO);
      }
      // Solape real: cada trozo empieza con los últimos 300 caracteres del anterior.
      for (let i = 1; i < trozos.length; i++) {
        expect(trozos[i].contenido.startsWith(trozos[i - 1].contenido.slice(-TROZO_SOLAPE))).toBe(true);
      }
    });

    test('cada trozo se embebe como passage (prefijo e5) y guarda su propio vector', async () => {
      const trozos = await trozosActivos();
      for (const t of trozos) {
        expect(generarEmbeddingLocal).toHaveBeenCalledWith(t.contenido, { tipo: 'passage' });
        const esperado = vectorFalso(t.contenido, 'passage');
        const guardado = JSON.parse(t.embedding);
        expect(guardado).toHaveLength(384);
        guardado.forEach((v, i) => expect(v).toBeCloseTo(esperado[i], 5));
      }
      expect(generarEmbeddingLocal).not.toHaveBeenCalledWith(expect.anything(), { tipo: 'query' });
    });

    test('reindexar sin cambios es idempotente: mismas filas, mismo número de trozos', async () => {
      const antes = await trozosActivos();
      await reindexarTrozosExpediente(expedienteId);
      const despues = await trozosActivos();
      expect(despues.map((t) => t.id)).toEqual(antes.map((t) => t.id));
    });

    test('con un análisis, indexa también la fuente "analisis" (último resumen + que_ordena)', async () => {
      await pool.query(
        `INSERT INTO analisis_ambiental (expediente_id, resumen, nivel_riesgo, creado_por) VALUES ($1, $2, 'Medio', $3)`,
        [expedienteId, 'Resumen: se ordena el ajuste del PMA de la línea.', testUserUuid]
      );
      const textos = await leerTextosExpediente(expedienteId);
      expect(textos.analisis).toBe('Resumen: se ordena el ajuste del PMA de la línea. Presentar el PMA ajustado.');

      const r = await reindexarTrozosExpediente(expedienteId);
      expect(r.analisis).toBe(1);
      const analisis = (await trozosActivos()).filter((t) => t.fuente === 'analisis');
      expect(analisis).toHaveLength(1);
      expect(analisis[0].embedding_modelo).toBe(E5);
    });

    test('si el contenido se acorta, los trozos sobrantes se desactivan (borrado lógico) y no se crean filas de más', async () => {
      const totalAntes = Number((await pool.query('SELECT COUNT(*) FROM chunks_ambiental WHERE expediente_id = $1', [expedienteId])).rows[0].count);
      await pool.query('UPDATE expedientes_ambientales SET contenido_texto = $1 WHERE id = $2', [PARRAFO(1), expedienteId]);

      const r = await reindexarTrozosExpediente(expedienteId);
      expect(r.contenido).toBe(1);

      const { rows } = await pool.query(
        `SELECT is_active, COUNT(*)::int AS n FROM chunks_ambiental
         WHERE expediente_id = $1 AND fuente = 'contenido' GROUP BY is_active`,
        [expedienteId]
      );
      const porEstado = Object.fromEntries(rows.map((x) => [x.is_active, x.n]));
      expect(porEstado.true).toBe(1);
      expect(porEstado.false).toBeGreaterThanOrEqual(3);
      const totalDespues = Number((await pool.query('SELECT COUNT(*) FROM chunks_ambiental WHERE expediente_id = $1', [expedienteId])).rows[0].count);
      expect(totalDespues).toBe(totalAntes);

      // Al volver a alargarlo, se reactivan las mismas filas.
      await pool.query('UPDATE expedientes_ambientales SET contenido_texto = $1 WHERE id = $2', [TEXTO_LARGO, expedienteId]);
      await reindexarTrozosExpediente(expedienteId);
      const totalFinal = Number((await pool.query('SELECT COUNT(*) FROM chunks_ambiental WHERE expediente_id = $1', [expedienteId])).rows[0].count);
      expect(totalFinal).toBe(totalAntes);
    });

    test('un expediente sin texto ni análisis no genera trozos', async () => {
      expect(await reindexarTrozosExpediente(expedienteSinTextoId)).toEqual({ contenido: 0, analisis: 0 });
      expect(await trozosActivos(expedienteSinTextoId)).toHaveLength(0);
    });

    test('un expediente inactivo no se toca', async () => {
      await pool.query('UPDATE expedientes_ambientales SET is_active = FALSE WHERE id = $1', [expedienteSinTextoId]);
      expect(await reindexarTrozosExpediente(expedienteSinTextoId)).toBeNull();
      await pool.query('UPDATE expedientes_ambientales SET is_active = TRUE WHERE id = $1', [expedienteSinTextoId]);
    });
  });

  describe('scripts/reindexar_ambiental.js --dry-run', () => {
    const correr = (...args) => execFileSync(
      process.execPath,
      ['scripts/reindexar_ambiental.js', '--dry-run', ...args],
      { encoding: 'utf8', env: { ...process.env, NODE_ENV: 'test' } }
    );

    test('reporta el expediente como pendiente frente a otro modelo, sin escribir nada', async () => {
      const antes = await trozosActivos();
      const salida = correr('--modelo', 'Xenova/all-MiniLM-L6-v2', '--expediente', expedienteId);
      expect(salida).toMatch(/revisados: 1/);
      expect(salida).toMatch(/pendientes frente a "Xenova\/all-MiniLM-L6-v2": 1/);
      expect(salida).toMatch(/contenido: \d+\/\d+ trozos con otro modelo/);
      expect(salida).toMatch(/--dry-run \(no escribe nada\)/);
      const despues = await trozosActivos();
      expect(despues).toEqual(antes);
    });

    test('no reporta pendientes cuando todo está indexado con el modelo objetivo', () => {
      const salida = correr('--modelo', E5, '--expediente', expedienteId);
      expect(salida).toMatch(/pendientes frente a "Xenova\/multilingual-e5-small": 0/);
    });

    test('reporta los expedientes sin texto', () => {
      const salida = correr('--modelo', E5, '--expediente', expedienteSinTextoId);
      expect(salida).toMatch(/sin texto ni análisis \(no se pueden indexar\): 1/);
    });
  });
});
