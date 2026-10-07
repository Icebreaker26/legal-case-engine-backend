// Se precarga con --import en TODOS los scripts del arnés, antes que
// cualquier otro módulo (incluido src/db/database.js). Si DATABASE_URL no
// apunta inequívocamente a una base de evaluación local, aborta el proceso
// antes de que se pueda ejecutar una sola query.
//
// Uso: node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/02_indexar.js

const HOSTS_PERMITIDOS = ['127.0.0.1', 'localhost'];
const PUERTO_PERMITIDO = '5435'; // puerto del contenedor rag-eval-db, nunca el de dev (5433) ni test (CI)
const PATRON_DB = /^\/rag_eval_[a-z0-9_]+$/;

const url = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? '');
  } catch {
    return null;
  }
})();

const motivo = !url ? 'DATABASE_URL ausente o inválida'
  : !HOSTS_PERMITIDOS.includes(url.hostname) ? `host "${url.hostname}" no es local`
  : url.port !== PUERTO_PERMITIDO ? `puerto "${url.port}" no es el del contenedor de evaluación (${PUERTO_PERMITIDO})`
  : !PATRON_DB.test(url.pathname) ? `nombre de base "${url.pathname}" no sigue el patrón rag_eval_*`
  : null;

if (motivo) {
  console.error(`[guard] DATABASE_URL no es una base de evaluación válida: ${motivo}.`);
  console.error('[guard] Este script solo puede correr contra el contenedor rag-eval-db (127.0.0.1:5435), nunca contra dev/test/producción.');
  process.exit(1);
}

console.log(`[guard] OK — corriendo contra ${url.hostname}:${url.port}${url.pathname}`);
