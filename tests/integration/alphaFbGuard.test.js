import pool from '../../src/db/database.js';
import { env } from '../../src/config/env.js';
import { baseIndexadaConModelo, MODELO_ALPHA_FB } from '../../src/modules/tutelas/services/vectorService.js';
import { estaAlphaFbActivoParaEndpoint, invalidarCacheFlagsAlphaFb } from '../../src/modules/tutelas/services/featureFlagService.js';
import { resolverFusionAlphaFb } from '../../src/modules/tutelas/services/consultaService.js';

// #173 — guarda dura de activación de fusion:'alpha_fb'. Integración real
// contra Postgres (flag en system_config) -- sin mocks de base de datos.
//
// baseIndexadaConModelo comprueba TODA la tabla base_conocimiento_enel (a
// propósito -- no hay forma correcta de preguntar "¿está todo sincronizado?"
// filtrando por categoría), y Jest corre los archivos de esta suite en
// paralelo contra la MISMA base real, donde otras suites insertan/actualizan
// filas activas constantemente. Dos consecuencias para cómo se prueba esto:
//
// 1. El caso "no sincronizado" SÍ se prueba contra la base real: insertar
//    una sola fila activa con un modelo distinto garantiza `false` sin
//    importar qué más esté pasando en paralelo (basta una fila que no
//    coincida, nunca depende del resto de la tabla).
// 2. El caso "todo sincronizado" NO se puede forzar de forma determinista
//    contra la tabla real sin mutar filas de otras suites (se probó con un
//    `UPDATE ... WHERE is_active = TRUE` + transacción aislada, y en la
//    corrida completa de la suite eso chocó con escrituras concurrentes de
//    otros archivos -- "could not serialize access due to concurrent
//    update"). `baseIndexadaConModelo`/`resolverFusionAlphaFb` aceptan un
//    `db` inyectable justo para esto: se prueba con un `db` de prueba que
//    responde `sincronizado: true`, aislando la rama del resto de la tabla.
//
// Las filas que SÍ se insertan contra la base real son is_active=TRUE y
// visibles para cualquier búsqueda sin filtro de categoría de OTRAS suites
// corriendo en paralelo (p.ej. vectorService.test.js compara dos búsquedas
// seguidas y espera el mismo conjunto de candidatos entre ambas) -- por eso
// usan un vector/texto deliberadamente "lejanos" (no 0.9/-0.9, ya usados por
// otras suites como vectorCercano/vectorLejano) y sin términos léxicos
// comunes, para minimizar la chance de entrar al top-K de alguien más
// mientras existen.
const VECTOR_IRRELEVANTE = Array(384).fill(-0.99);
const TEXTO_IRRELEVANTE = 'gzqxw9271 texto de relleno exclusivo de alphaFbGuard test.js';

describe('ECCP #173 — guarda dura de alpha_fb', () => {
  describe('baseIndexadaConModelo', () => {
    test('cuando la consulta reporta sincronizado=true, devuelve true (db de prueba, ver nota arriba)', async () => {
      const dbDePrueba = { query: async () => ({ rows: [{ sincronizado: true }] }) };
      await expect(baseIndexadaConModelo(MODELO_ALPHA_FB, dbDePrueba)).resolves.toBe(true);
    });

    describe('contra la base real (caso negativo -- robusto sin importar qué otra suite esté corriendo)', () => {
      const CATEGORIA_TEST = 'ALPHA_FB_GUARD_TEST';
      const docDesincronizado = 'fb000000-0000-0000-0000-000000000001';

      afterEach(async () => {
        await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', [docDesincronizado]);
      });

      test('una fila activa con un modelo que ninguna otra suite usa -> no sincronizado', async () => {
        await pool.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, embedding_modelo)
           VALUES ($1, 'Doc desincronizado', $2, $3, TRUE, TRUE, $4, 'modelo-de-prueba-alpha-fb-guard-test')`,
          [CATEGORIA_TEST, TEXTO_IRRELEVANTE, JSON.stringify(VECTOR_IRRELEVANTE), docDesincronizado]
        );
        await expect(baseIndexadaConModelo(MODELO_ALPHA_FB)).resolves.toBe(false);
      });

      test('una fila activa con embedding_modelo NULL -> no sincronizado', async () => {
        await pool.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, embedding_modelo)
           VALUES ($1, 'Doc sin modelo', $2, $3, TRUE, TRUE, $4, NULL)`,
          [CATEGORIA_TEST, TEXTO_IRRELEVANTE, JSON.stringify(VECTOR_IRRELEVANTE), docDesincronizado]
        );
        await expect(baseIndexadaConModelo(MODELO_ALPHA_FB)).resolves.toBe(false);
      });
    });
  });

  describe('featureFlagService — estaAlphaFbActivoParaEndpoint', () => {
    beforeEach(() => invalidarCacheFlagsAlphaFb());

    // La migración #173 siembra 'rag.alpha_fb.endpoints' = {"obtenerSugerenciasTutela": true}
    // (decisión de Alejandro: activo desde el día 0, no apagado por defecto).
    // Lee una sola key por nombre -- ninguna otra suite la toca, no hay carrera.
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
    const dbSincronizadaDePrueba = { query: async () => ({ rows: [{ sincronizado: true }] }) };

    afterEach(() => {
      env.EMBEDDING_MODEL = modeloOriginal;
      env.RAG_ALPHA_FB_KILL = killOriginal;
      invalidarCacheFlagsAlphaFb();
    });

    afterAll(async () => {
      await pool.end();
    });

    // Las 3 condiciones a la vez solo se pueden simular de forma determinista
    // con el `db` de prueba (ver nota del archivo) -- contra la base real no
    // hay forma de garantizar "0 filas desincronizadas" sin pisar datos de
    // otras suites corriendo en paralelo.
    test('con las 3 condiciones satisfechas, resuelve a "alpha_fb"', async () => {
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela', dbSincronizadaDePrueba)).resolves.toBe('alpha_fb');
    });

    // Las 3 siguientes cortan ANTES de llegar a baseIndexadaConModelo (fallan
    // en el kill switch, el flag, o EMBEDDING_MODEL) -- nunca tocan la base,
    // así que son robustas contra la base real sin ningún aislamiento especial.
    test('RAG_ALPHA_FB_KILL=true tiene prioridad absoluta, aunque todo lo demás esté bien', async () => {
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = true;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('ponderado');
    });

    test('flag apagado para el endpoint -> "ponderado" aunque el modelo ya calce', async () => {
      env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('endpointSinFlag')).resolves.toBe('ponderado');
    });

    test('EMBEDDING_MODEL distinto al calibrado -> "ponderado" (caso real hoy: todavía MiniLM)', async () => {
      env.EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
      env.RAG_ALPHA_FB_KILL = false;

      await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('ponderado');
    });

    // Esta sí llega a baseIndexadaConModelo contra la base real -- robusta
    // igual que el caso negativo de arriba: una sola fila activa con un
    // modelo distinto basta para "no sincronizado", sin importar el resto.
    describe('datos todavía no reindexados (contra la base real)', () => {
      const docPendiente = 'fb000000-0000-0000-0000-000000000002';

      afterEach(async () => {
        await pool.query('DELETE FROM base_conocimiento_enel WHERE documento_id = $1', [docPendiente]);
      });

      test('una fila activa sin reindexar -> "ponderado"', async () => {
        await pool.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, is_active, documento_id, embedding_modelo)
           VALUES ($1, 'Doc pendiente de reindexar', $2, $3, TRUE, TRUE, $4, 'modelo-de-prueba-alpha-fb-resolver-test')`,
          [CATEGORIA_TEST, TEXTO_IRRELEVANTE, JSON.stringify(VECTOR_IRRELEVANTE), docPendiente]
        );
        env.EMBEDDING_MODEL = MODELO_ALPHA_FB;
        env.RAG_ALPHA_FB_KILL = false;

        await expect(resolverFusionAlphaFb('obtenerSugerenciasTutela')).resolves.toBe('ponderado');
      });
    });
  });
});
