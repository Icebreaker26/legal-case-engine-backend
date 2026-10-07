// node --env-file=eval/.env.eval --import ./eval/guard.js eval/scripts/01_cargar_categorias.js [ruta-categorias.json]
//
// global_categorias no tiene seed en migrations/ (solo existe con datos
// reales en producción). Este script carga un fixture — el mini usa
// categorías sintéticas (eval/fixtures/mini/categorias.json); el corpus v1
// (#74) debe usar el export real que haga Alejandro desde producción
// (solo nombres y palabras_clave — configuración, no datos personales).
import fs from 'node:fs/promises';
import pool from '../../src/db/database.js';

const ruta = process.argv[2] ?? 'eval/fixtures/mini/categorias.json';
const categorias = JSON.parse(await fs.readFile(ruta, 'utf-8'));

await pool.query('TRUNCATE global_categorias RESTART IDENTITY');
for (const c of categorias) {
  await pool.query(
    'INSERT INTO global_categorias (nombre, is_active, palabras_clave) VALUES ($1, TRUE, $2)',
    [c.nombre, c.palabras_clave ?? []]
  );
}

console.log(`[categorias] ${categorias.length} categorías cargadas desde ${ruta}`);
await pool.end();
