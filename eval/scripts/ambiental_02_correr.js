// node --env-file=eval/.env.eval.ambiental --import ./eval/guard.js eval/scripts/ambiental_02_correr.js --cargar
// node --env-file=eval/.env.eval.ambiental --import ./eval/guard.js eval/scripts/ambiental_02_correr.js --correr
//
// #197 — banco de pruebas ambiental. Solo corre contra rag_eval_ambiental
// (eval/guard.js aborta con cualquier otra base). Usa las funciones reales
// de la app, sin reimplementarlas (pre-registro, "Sistemas"):
//   A = buscarSimilaresAlpha (motor α, #196) sobre chunks_ambiental
//   B = buscarSimilaresRRF   (motor anterior) sobre embeddings_ambiental
// ambos con EMBEDDING_MODEL = Xenova/multilingual-e5-small y limite = 10.
//
// --cargar  borra los expedientes sintéticos (SINT-AMB-*) de la base de
//           evaluación, inserta corpus + consultas (y su análisis si lo
//           tienen) e indexa cada expediente como lo haría la app: trozos
//           (reindexarTrozosExpediente) y vector único (guardarEmbedding con
//           el texto de generarEmbeddingExpediente).
// --correr  para cada consulta del split de test, deja activa solo esa
//           consulta además del corpus, verifica que la guarda de #196 elija
//           'alpha', corre A y B y escribe runs TREC + detalle con la
//           similitud. Corre todo dos veces y exige salidas idénticas
//           (determinismo).
import fs from 'node:fs/promises';
import path from 'node:path';

const MODELO = 'Xenova/multilingual-e5-small';
if (process.env.EMBEDDING_MODEL !== MODELO) {
  console.error(`[ambiental] EMBEDDING_MODEL debe ser ${MODELO} (está "${process.env.EMBEDDING_MODEL}")`);
  process.exit(1);
}

const argv = new Set(process.argv.slice(2));
const valor = (nombre, defecto) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : defecto;
};
const dir = valor('dir', 'eval/data/ambiental_v1');
const LIMITE = 10;

const { default: pool } = await import('../../src/db/database.js');
const svc = await import('../../src/modules/ambiental/services/ambientalEmbeddingService.js');

const leerJsonl = async (ruta) => (await fs.readFile(ruta, 'utf8')).split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const EMAIL_EVAL = 'banco-ambiental-eval@icebreaker.com';

const cargar = async () => {
  const corpus = await leerJsonl(path.join(dir, 'corpus.jsonl'));
  const consultas = await leerJsonl(path.join(dir, 'consultas.jsonl'));

  await pool.query(`DELETE FROM chunks_ambiental WHERE expediente_id IN (SELECT id FROM expedientes_ambientales WHERE numero_expediente LIKE 'SINT-AMB-%')`);
  await pool.query(`DELETE FROM embeddings_ambiental WHERE expediente_id IN (SELECT id FROM expedientes_ambientales WHERE numero_expediente LIKE 'SINT-AMB-%')`);
  await pool.query(`DELETE FROM analisis_ambiental WHERE expediente_id IN (SELECT id FROM expedientes_ambientales WHERE numero_expediente LIKE 'SINT-AMB-%')`);
  await pool.query(`DELETE FROM expedientes_ambientales WHERE numero_expediente LIKE 'SINT-AMB-%'`);

  const { rows: [usuario] } = await pool.query(
    `INSERT INTO global_usuarios (nombre, email, password_hash, rol, is_approved)
     VALUES ('Banco ambiental (eval)', $1, 'x', 'juridico', true)
     ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
    [EMAIL_EVAL]
  );

  const todos = [...corpus.map((e) => ({ ...e, clave: e.id })), ...consultas.map((e) => ({ ...e, clave: e.qid }))];
  let i = 0;
  for (const e of todos) {
    const { rows: [exp] } = await pool.query(
      `INSERT INTO expedientes_ambientales (titulo, tipo_instrumento, numero_expediente, contenido_texto, que_ordena, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [e.titulo, e.tipo_instrumento, e.numero_expediente, e.contenido_texto, e.que_ordena, usuario.id]
    );
    if (e.resumen !== null) {
      await pool.query(
        `INSERT INTO analisis_ambiental (expediente_id, resumen, nivel_riesgo, creado_por) VALUES ($1, $2, $3, $4)`,
        [exp.id, e.resumen, e.nivel_riesgo, usuario.id]
      );
    }
    // Como generarEmbeddingExpediente (ambientalController.js): el análisis si
    // existe, si no los primeros 1.500 caracteres del contenido.
    const [texto, fuente] = e.resumen !== null
      ? [[e.resumen, e.que_ordena].filter(Boolean).join(' '), 'analisis']
      : [e.contenido_texto.slice(0, 1500), 'contenido'];
    await svc.guardarEmbedding(exp.id, texto, fuente);
    await svc.reindexarTrozosExpediente(exp.id);
    if (++i % 10 === 0) console.log(`[cargar] ${i}/${todos.length} expedientes indexados`);
  }

  const { rows: [conteo] } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM expedientes_ambientales WHERE numero_expediente LIKE 'SINT-AMB-%')::int AS expedientes,
      (SELECT COUNT(*) FROM embeddings_ambiental ea JOIN expedientes_ambientales e ON e.id = ea.expediente_id WHERE e.numero_expediente LIKE 'SINT-AMB-%')::int AS vectores_unicos,
      (SELECT COUNT(DISTINCT c.expediente_id) FROM chunks_ambiental c JOIN expedientes_ambientales e ON e.id = c.expediente_id WHERE c.is_active AND e.numero_expediente LIKE 'SINT-AMB-%')::int AS con_trozos,
      (SELECT COUNT(*) FROM chunks_ambiental WHERE is_active)::int AS trozos,
      (SELECT COUNT(*) FROM chunks_ambiental WHERE is_active AND embedding_modelo IS DISTINCT FROM $1)::int AS trozos_otro_modelo`, [MODELO]);
  console.log('[cargar] listo', conteo);
  if (conteo.expedientes !== todos.length || conteo.vectores_unicos !== todos.length || conteo.con_trozos !== todos.length || conteo.trozos_otro_modelo !== 0) {
    throw new Error('[cargar] la indexación no quedó completa (ver conteo)');
  }
};

const correrUnaVez = async (qidsTest, porNumero, consultas) => {
  const qidPorNumero = new Map(consultas.map((c) => [c.numero_expediente, c.qid]));
  const numerosConsulta = consultas.map((c) => c.numero_expediente);
  const trec = { A: [], B: [] };
  const detalle = [];

  // Solo el corpus activo; cada consulta se activa en su turno.
  await pool.query('UPDATE expedientes_ambientales SET is_active = FALSE WHERE numero_expediente = ANY($1)', [numerosConsulta]);
  try {
    for (const qid of qidsTest) {
      const consulta = consultas.find((c) => c.qid === qid);
      const idConsulta = porNumero.get(consulta.numero_expediente);
      await pool.query('UPDATE expedientes_ambientales SET is_active = TRUE WHERE id = $1', [idConsulta]);
      try {
        const motor = await svc.resolverMotorSimilares(pool);
        if (motor !== 'alpha') throw new Error(`[correr] la guarda de #196 eligió "${motor}" para ${qid}: el banco no está en regla`);
        const a = await svc.buscarSimilaresAlpha(idConsulta, LIMITE, pool);
        const b = await svc.buscarSimilaresRRF(idConsulta, LIMITE, pool);
        const docId = new Map();
        const { rows: mapa } = await pool.query(`SELECT id, numero_expediente FROM expedientes_ambientales WHERE id = ANY($1::uuid[])`, [[...a, ...b].map((r) => r.id)]);
        for (const m of mapa) docId.set(m.id, m.numero_expediente);
        const aIds = (rs) => rs.map((r) => {
          const numero = docId.get(r.id);
          if (qidPorNumero.has(numero)) throw new Error(`[correr] ${qid}: apareció otra consulta (${qidPorNumero.get(numero)}) entre los resultados`);
          return porNumero.idCorpus.get(numero);
        });
        const idsA = aIds(a);
        const idsB = aIds(b);
        // Puntaje = posición invertida: ranx reordena por puntaje, y el orden
        // que cuenta es el que devolvió cada sistema.
        idsA.forEach((d, i) => trec.A.push(`${qid} Q0 ${d} ${i + 1} ${LIMITE - i} A-alpha-e5`));
        idsB.forEach((d, i) => trec.B.push(`${qid} Q0 ${d} ${i + 1} ${LIMITE - i} B-rrf-e5`));
        detalle.push({
          qid,
          A: a.map((r, i) => ({ doc_id: idsA[i], rank: i + 1, similitud: Number(r.similitud) })),
          B: b.map((r, i) => ({ doc_id: idsB[i], rank: i + 1, similitud: Number(r.similitud), rrf_score: Number(r.rrf_score) })),
        });
      } finally {
        await pool.query('UPDATE expedientes_ambientales SET is_active = FALSE WHERE id = $1', [idConsulta]);
      }
    }
  } finally {
    await pool.query('UPDATE expedientes_ambientales SET is_active = TRUE WHERE numero_expediente = ANY($1)', [numerosConsulta]);
  }
  return { A: trec.A.join('\n') + '\n', B: trec.B.join('\n') + '\n', detalle: JSON.stringify(detalle, null, 2) + '\n' };
};

const correr = async () => {
  const corpus = await leerJsonl(path.join(dir, 'corpus.jsonl'));
  const consultas = await leerJsonl(path.join(dir, 'consultas.jsonl'));
  const split = JSON.parse(await fs.readFile(path.join(dir, 'split.json'), 'utf8'));
  const { rows } = await pool.query(`SELECT id, numero_expediente FROM expedientes_ambientales WHERE numero_expediente LIKE 'SINT-AMB-%'`);
  const porNumero = new Map(rows.map((r) => [r.numero_expediente, r.id]));
  porNumero.idCorpus = new Map(corpus.map((e) => [e.numero_expediente, e.id]));

  const primera = await correrUnaVez(split.test, porNumero, consultas);
  const segunda = await correrUnaVez(split.test, porNumero, consultas);
  for (const k of ['A', 'B', 'detalle']) {
    if (primera[k] !== segunda[k]) throw new Error(`[correr] la salida "${k}" no es idéntica entre dos corridas: no es determinista`);
  }

  const dirRuns = path.join(dir, 'runs');
  await fs.mkdir(dirRuns, { recursive: true });
  await fs.writeFile(path.join(dirRuns, 'A-alpha-e5.trec'), primera.A);
  await fs.writeFile(path.join(dirRuns, 'B-rrf-e5.trec'), primera.B);
  await fs.writeFile(path.join(dirRuns, 'detalle_similitud.json'), primera.detalle);
  console.log(`[correr] ${split.test.length} consultas × 2 sistemas, determinista (dos corridas idénticas) → ${dirRuns}`);
};

try {
  if (argv.has('--cargar')) await cargar();
  if (argv.has('--correr')) await correr();
  if (!argv.has('--cargar') && !argv.has('--correr')) console.error('[ambiental] usar --cargar y/o --correr');
} finally {
  await pool.end();
}
