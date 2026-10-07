import pool from '../../../db/database.js';

// ECCP (#173) — lectura con caché corta del flag de activación de
// fusion:'alpha_fb' por endpoint, almacenado en system_config (key
// 'rag.alpha_fb.endpoints', jsonb). TTL de 30s: cambiar el flag desde el
// panel de admin no requiere redeploy ni migración, y el costo de una
// consulta extra cada 30s es despreciable frente a generar un embedding.
const TTL_MS = 30_000;
let cache = { valor: null, expira: 0 };

const leerFlagsAlphaFb = async (ahora = Date.now()) => {
  if (cache.valor && ahora < cache.expira) return cache.valor;

  const { rows } = await pool.query(
    "SELECT value FROM system_config WHERE key = 'rag.alpha_fb.endpoints'"
  );
  const valor = rows[0]?.value ?? {};
  cache = { valor, expira: ahora + TTL_MS };
  return valor;
};

// Solo para tests -- evita que el TTL de un test contamine el siguiente.
export const invalidarCacheFlagsAlphaFb = () => {
  cache = { valor: null, expira: 0 };
};

export const estaAlphaFbActivoParaEndpoint = async (endpoint) => {
  const flags = await leerFlagsAlphaFb();
  return flags?.[endpoint] === true;
};
