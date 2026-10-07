import pool from '../../src/db/database.js';
import { env } from '../../src/config/env.js';
import { baseIndexadaConModelo, MODELO_ALPHA_FB } from '../../src/modules/tutelas/services/vectorService.js';
import { estaAlphaFbActivoParaEndpoint, invalidarCacheFlagsAlphaFb } from '../../src/modules/tutelas/services/featureFlagService.js';
import { resolverFusionAlphaFb } from '../../src/modules/tutelas/services/consultaService.js';

// #173 — guarda dura de activación de fusion:'alpha_fb'. Integración real
// contra Postgres (flag en system_config, sincronía de embedding_modelo en
// base_conocimiento_enel) — sin mocks de base de datos.

describe('ECCP #173 — guarda dura de alpha_fb', () => {
  describe('baseIndexadaConModelo', () => {
    const CATEGORIA_TEST = 'ALPHA_FB_GUARD_TEST';
    const docDesincronizado = 'fb000000-0000-0000-0000-000000000001';
    let snapshot;

    // La función revisa TODA la tabla (a propósito -- no hay forma correcta
    // de preguntar "¿está todo sincronizado?" filtrando por categoría). Para
    // probar ambas ramas sin dejar la base de pruebas en un estado distinto
    // al que tenía, se toma una foto de embedding_modelo de cada fila activa,
    // se homogeniza a MODELO_ALPHA_FB, se prueba, y se restaura exactamente
    // al final -- nunca se deja un valor nuevo puesto por este test.
    beforeAll(async () => {
      const { rows } = await pool.query('SELECT documento_id, embedding_modelo FROM base_conocimiento_enel WHERE is_active = TRUE');
      snapshot = rows;
      await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE is_active = TRUE', [MODELO_ALPHA_FB]);
    });

    afterAll(async () => {
      for (const fila of snapshot) {
        await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE documento_id = $2', [fila.embedding_modelo, fila.documento_id]);
      }
      await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_TEST]);
    });

    test('todas las filas activas con el modelo objetivo -> sincronizado', async () => {
      await expect(baseIndexadaConModelo(MODELO_ALPHA_FB)).resolves.toBe(true);
    });

    test('una sola fila activa con un modelo distinto -> no sincronizado', async () => {
      await pool.query(
        `INSERT INTO base_conocimiento_enel
           (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, embedding_modelo)
         VALUES ($1, 'Doc desincronizado', 'contenido', $2, TRUE, TRUE, $3, 'Xenova/all-MiniLM-L6-v2')`,
        [CATEGORIA_TEST, JSON.stringify(Array(384).fill(0.1)), docDesincronizado]
      );

      await expect(baseIndexadaConModelo(MODELO_ALPHA_FB)).resolves.toBe(false);

      await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', [docDesincronizado]);
    });

    test('una fila activa con embedding_modelo NULL cuenta como no sincronizada', async () => {
      await pool.query(
        `INSERT INTO base_conocimiento_enel
           (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, embedding_modelo)
         VALUES ($1, 'Doc sin modelo', 'contenido', $2, TRUE, TRUE, $3, NULL)`,
        [CATEGORIA_TEST, JSON.stringify(Array(384).fill(0.1)), docDesincronizado]
      );

      await expect(baseIndexadaConModelo(MODELO_ALPHA_FB)).resolves.toBe(false);

      await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', [docDesincronizado]);
    });
  });

  describe('featureFlagService — estaAlphaFbActivoParaEndpoint', () => {
    beforeEach(() => invalidarCacheFlagsAlphaFb());

    // La migración #173 siembra 'rag.alpha_fb.endpoints' = {"obtenerSugerenciasTutela": true}
    // (decisión de Alejandro: activo desde el día 0, no apagado por defecto).
    test('lee el flag sembrado por la migración -- activo para obtenerSugerenciasTutela', async () => {
      await expect(estaAlphaFbActivoParaEndpoint('obtenerSugerenciasTutela')).resolves.toBe(true);
    });

    test('endpoint no listado en el flag -> false (nunca undefined ni truthy por accidente)', async () => {
      await expect(estaAlphaFbActivoParaEndpoint('endpointQueNoExiste')).resolves.toBe(false);
    });

    test('respeta un valor editado manualmente (panel de admin) hasta que se invalide la caché', async () => {
      await pool.query(
        "UPDATE system_config SET value = '{\"obtenerSugerenciasTutela\": false}'::jsonb WHERE key = 'rag.alpha_fb.endpoints'"
      );
      invalidarCacheFlagsAlphaFb();

      await expect(estaAlphaFbActivoParaEndpoint('obtenerSugerenciasTutela')).resolves.toBe(false);

      // Restaurar el valor sembrado por la migración para no afectar otros tests.
      await pool.query(
        "UPDATE system_config SET value = '{\"obtenerSugerenciasTutela\": true}'::jsonb WHERE key = 'rag.alpha_fb.endpoints'"
      );
      invalidarCacheFlagsAlphaFb();
    });
  });

  describe('resolverFusionAlphaFb — combina las 3 condiciones', () => {
    const CATEGORIA_TEST = 'ALPHA_FB_RESOLVER_TEST';
    const modeloOriginal = env.EMBEDDING_MODEL;
    const killOriginal = env.RAG_ALPHA_FB_KILL;
    let snapshot;

    beforeAll(async () => {
      const { rows } = await pool.query('SELECT documento_id, embedding_modelo FROM base_conocimiento_enel WHERE is_active = TRUE');
      snapshot = rows;
    });

    afterEach(async () => {
      env.EMBEDDING_MODEL = modeloOriginal;
      env.RAG_ALPHA_FB_KILL = killOriginal;
      invalidarCacheFlagsAlphaFb();
    });

    afterAll(async () => {
      for (const fila of snapshot) {
        await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE documento_id = $2', [fila.embedding_modelo, fila.documento_id]);
      }
      await pool.query('DELETE FROM base_conocimiento_enel WHERE categoria = $1', [CATEGORIA_TEST]);
      await pool.end();
    });

    test('con las 3 condiciones satisfechas, resuelve a "alpha_fb"', async () => {
      await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE is_active = TRUE', [MODELO_ALPHA_FB]);
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('alpha_fb');
    });

    test('RAG_ALPHA_FB_KILL=true tiene prioridad absoluta, aunque todo lo demás esté bien', async () => {
      await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE is_active = TRUE', [MODELO_ALPHA_FB]);
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = true;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('ponderado');
    });

    test('flag apagado para el endpoint -> "ponderado" aunque el modelo y los datos ya calcen', async () => {
      await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE is_active = TRUE', [MODELO_ALPHA_FB]);
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('endpointSinFlag')).resolves.toBe('ponderado');
    });

    test('EMBEDDING_MODEL distinto al calibrado -> "ponderado" (caso real hoy: todavía MiniLM)', async () => {
      await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE is_active = TRUE', [MODELO_ALPHA_FB]);
      env.EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('ponderado');
    });

    test('datos todavía no reindexados (fila activa con otro modelo) -> "ponderado"', async () => {
      await pool.query('UPDATE base_conocimiento_enel SET embedding_modelo = $1 WHERE is_active = TRUE', [MODELO_ALPHA_FB]);
      await pool.query(
        `INSERT INTO base_conocimiento_enel
           (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, embedding_modelo)
         VALUES ($1, 'Doc pendiente de reindexar', 'contenido', $2, TRUE, TRUE, $3, 'Xenova/all-MiniLM-L6-v2')`,
        [CATEGORIA_TEST, JSON.stringify(Array(384).fill(0.1)), 'fb000000-0000-0000-0000-000000000002']
      );
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('ponderado');

      await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', ['fb000000-0000-0000-0000-000000000002']);
    });
  });
});
