// Correr siempre desde la raíz de tutelas_backend: node eval/fixtures/mini/_generar_qrels.mjs
import fs from 'node:fs';
import { DocSchema, QuerySchema, cargarYValidar } from '../../schema.js';
import { construirQrelsTrec } from '../../lib/qrels.js';

const corpus = await cargarYValidar('eval/fixtures/mini/corpus.jsonl', DocSchema);
const queries = await cargarYValidar('eval/fixtures/mini/queries.jsonl', QuerySchema);
const trec = construirQrelsTrec(queries, corpus);
fs.writeFileSync('eval/fixtures/mini/qrels.trec', trec);
console.log(trec);
console.error(`qrels: ${trec.trim().split('\n').length} líneas`);
