import pool from '../src/db/database.js';

try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'objetivos'");
    console.table(res.rows);
} catch (e) {
    console.error(e);
} finally {
    process.exit();
}
