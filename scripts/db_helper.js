import pool from '../src/db/database.js';

/**
 * Script auxiliar para ejecutar consultas contra la base de datos de forma segura.
 * 
 * Uso:
 * node scripts/db_helper.js "SELECT * FROM tabla WHERE campo = $1" '["valor"]'
 */

const [query, paramsJson] = process.argv.slice(2);

if (!query) {
    console.error('Uso: node scripts/db_helper.js "QUERY" \'[PARAMETROS_JSON]\'');
    process.exit(1);
}

const params = paramsJson ? JSON.parse(paramsJson) : [];

try {
    const res = await pool.query(query, params);
    if (res.rows.length > 0) {
        console.table(res.rows);
    } else {
        console.log('Consulta ejecutada. Filas afectadas:', res.rowCount);
    }
} catch (e) {
    console.error('Error ejecutando la consulta:', e);
} finally {
    process.exit();
}
