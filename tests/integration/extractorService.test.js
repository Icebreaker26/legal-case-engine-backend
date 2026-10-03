import pool from '../../src/db/database.js';
import { extraerDatosTutela } from '../../src/modules/tutelas/services/extractorService.js';

// Regresión de los 3 fixes de #108 sobre extraerDatosTutela: boundary
// Unicode-aware (antes \b ASCII), regex escapado (antes crasheaba en
// silencio con keywords que tienen caracteres especiales), y
// determinismo del "primera categoría que matchea" (antes sin ORDER BY).
describe('extractorService — extraerDatosTutela (#108)', () => {
  const PREFIJO = 'TEST_EXTRACTOR_108_';

  afterEach(async () => {
    await pool.query('DELETE FROM global_categorias WHERE nombre LIKE $1', [`${PREFIJO}%`]);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('detecta una keyword que termina en vocal acentuada seguida de puntuación (boundary Unicode-aware)', async () => {
    await pool.query(
      'INSERT INTO global_categorias (nombre, palabras_clave, is_active) VALUES ($1, $2, true)',
      [`${PREFIJO}CORTE`, ['suspendió']]
    );
    const resultado = await extraerDatosTutela('El servicio fue suspendió, sin previo aviso.');
    expect(resultado.derecho_vulnerado).toBe(`${PREFIJO}CORTE`);
  });

  test('no lanza excepción con una keyword que tiene caracteres especiales de regex', async () => {
    await pool.query(
      'INSERT INTO global_categorias (nombre, palabras_clave, is_active) VALUES ($1, $2, true)',
      [`${PREFIJO}PARENTESIS`, ['corte (servicio)']]
    );
    const resultado = await extraerDatosTutela('Hubo un corte (servicio) de luz ayer.');
    expect(resultado.derecho_vulnerado).toBe(`${PREFIJO}PARENTESIS`);
  });

  test('no matchea por substring dentro de otra palabra', async () => {
    await pool.query(
      'INSERT INTO global_categorias (nombre, palabras_clave, is_active) VALUES ($1, $2, true)',
      [`${PREFIJO}CORTE2`, ['corte']]
    );
    const resultado = await extraerDatosTutela('Quedé muy agradecido por la cortesía del funcionario.');
    expect(resultado.derecho_vulnerado).not.toBe(`${PREFIJO}CORTE2`);
  });

  test('es determinista cuando dos categorías comparten keyword (ORDER BY id)', async () => {
    const { rows } = await pool.query(
      'INSERT INTO global_categorias (nombre, palabras_clave, is_active) VALUES ($1, $2, true) RETURNING id',
      [`${PREFIJO}A`, ['reclamotest']]
    );
    await pool.query(
      'INSERT INTO global_categorias (nombre, palabras_clave, is_active) VALUES ($1, $2, true)',
      [`${PREFIJO}B`, ['reclamotest']]
    );
    const texto = 'Presento reclamotest por el servicio.';
    const r1 = await extraerDatosTutela(texto);
    const r2 = await extraerDatosTutela(texto);
    expect(r1.derecho_vulnerado).toBe(r2.derecho_vulnerado);
    expect(r1.derecho_vulnerado).toBe(`${PREFIJO}A`);
  });
});
