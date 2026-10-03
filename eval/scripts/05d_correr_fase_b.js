// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/05d_correr_fase_b.js
//
// Corre las 23 consultas B (fase_b_pares_piloto.json) contra léxico-solo
// (dedup) y la híbrida E03 (ponderado, scores crudos, sin filtro — la
// configuración elegida en la Fase A). Requiere que rag-eval-db esté
// indexado con el modelo correcto en cada paso (ver eval/data/README.md,
// sección #114 Fase B, para el procedimiento de reindexado temporal).
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';
import { generarEmbeddingLocal } from '../../src/modules/tutelas/services/aiService.js';
import { recuperarPrecedentes } from '../../src/modules/tutelas/services/consultaService.js';
import { env } from '../../src/config/env.js';
import { DocSchema, cargarYValidar } from '../schema.js';
import { uuidDeDoc } from '../config.js';

const modo = process.argv[2]; // "lexico" | "hibrida"
if (!['lexico', 'hibrida'].includes(modo)) {
  console.error('Uso: node 05d_correr_fase_b.js <lexico|hibrida>');
  process.exit(1);
}

const corpus = await cargarYValidar('eval/data/corpus.jsonl', DocSchema);
const docIdDe = new Map(corpus.map(d => [uuidDeDoc(d.id), d.id]));
const pares = JSON.parse(await fs.readFile('eval/data/fase_b_pares_piloto.json', 'utf-8'));

const LEXICAL_ONLY_DEDUP = `
  WITH scored AS (
    SELECT documento_id,
      ts_rank(contenido_tsv, plainto_tsquery('spanish', $1)) AS score,
      ROW_NUMBER() OVER (PARTITION BY documento_id ORDER BY ts_rank(contenido_tsv, plainto_tsquery('spanish', $1)) DESC) AS rn
    FROM base_conocimiento_enel
    WHERE embedding_local IS NOT NULL AND es_exitosa = TRUE AND is_active = TRUE AND documento_id IS NOT NULL
  )
  SELECT documento_id, score FROM scored WHERE rn = 1 ORDER BY score DESC LIMIT 10;
`;

const lineasTrec = [];

if (modo === 'lexico') {
  for (const par of pares) {
    const texto = await limpiarTexto(par.texto_b);
    const { rows } = await pool.query(LEXICAL_ONLY_DEDUP, [texto]);
    rows.forEach((r, i) => lineasTrec.push(`${par.qid}-B Q0 ${docIdDe.get(r.documento_id) ?? r.documento_id} ${i + 1} ${10 - i} fase-b-lexico`));
  }
} else {
  console.log(`[fase-b] modelo indexado actual: ${env.EMBEDDING_MODEL}`);
  for (const par of pares) {
    const texto = await limpiarTexto(par.texto_b);
    const hits = await recuperarPrecedentes({ tutela: { contenido_original: texto }, limit: 10, fusion: 'ponderado' });
    hits.forEach((h, i) => lineasTrec.push(`${par.qid}-B Q0 ${docIdDe.get(h.documento_id) ?? h.documento_id} ${i + 1} ${10 - i} fase-b-hibrida`));
  }
}

const ruta = `eval/data/fase_b_${modo}.trec`;
await fs.writeFile(ruta, lineasTrec.join('\n') + '\n');
console.log(`[fase-b] ${modo}: ${lineasTrec.length} líneas → ${ruta}`);

await pool.end();
