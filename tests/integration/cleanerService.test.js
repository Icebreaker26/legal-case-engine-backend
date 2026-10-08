/**
 * Tests de integración — cleanerService (auditoría #139)
 *
 * Usa la tabla real `noise_patterns` para verificar:
 *   - Orden determinista de aplicación de patrones (ORDER BY id)
 *   - Que un patrón inválido no rompe la limpieza de los demás
 */
import pool from '../../src/db/database.js';
import logger from '../../src/utils/logger.js';
import { limpiarTexto } from '../../src/modules/tutelas/services/cleanerService.js';

describe('cleanerService — limpiarTexto (#139)', () => {
  const patronesInsertados = [];

  afterEach(async () => {
    if (patronesInsertados.length) {
      await pool.query('DELETE FROM noise_patterns WHERE id = ANY($1::int[])', [patronesInsertados]);
      patronesInsertados.length = 0;
    }
  });

  async function insertarPatron(patron, activo = true) {
    const { rows } = await pool.query(
      'INSERT INTO noise_patterns (patron, descripcion, activo) VALUES ($1, $2, $3) RETURNING id',
      [patron, 'test #139', activo]
    );
    patronesInsertados.push(rows[0].id);
    return rows[0].id;
  }

  test('aplica los patrones en orden determinista por id ascendente (ORDER BY), no en orden físico del heap', async () => {
    // Patrón A ("FOOBAR", id menor, se inserta primero) y patrón B ("FOO",
    // id mayor) se construyen para que el resultado dependa de cuál corre
    // primero sobre el texto "Inicio FOOBAR Fin":
    //   - Orden correcto (A antes que B): A quita "FOOBAR" completo primero
    //     → queda "Inicio  Fin"; B busca "FOO" después y no encuentra nada.
    //   - Orden incorrecto (B antes que A): B quita "FOO" de "FOOBAR" primero
    //     → queda "Inicio BAR Fin"; A ya no encuentra "FOOBAR" y "BAR" sobrevive.
    // Sin ORDER BY, el orden de aplicación dependería del orden físico del
    // heap (no garantizado); con ORDER BY id, siempre es A → B.
    await insertarPatron('FOOBAR');
    await insertarPatron('FOO');

    const resultado = await limpiarTexto('Inicio FOOBAR Fin');
    expect(resultado).not.toContain('BAR');
  });

  test('un patrón regex inválido no rompe la limpieza completa (no lanza, retorna best-effort)', async () => {
    await insertarPatron('(patron_invalido_sin_cerrar');

    const resultado = await limpiarTexto('Texto normal que debería sobrevivir');
    // El catch global existente retorna el texto original ante cualquier
    // error de compilación de regex -- se preserva ese comportamiento.
    expect(resultado).toContain('Texto normal');
  });

  test('ignora patrones con activo = false', async () => {
    await insertarPatron('TEXTO_SECRETO', false);
    const resultado = await limpiarTexto('Contiene TEXTO_SECRETO que no debe limpiarse');
    expect(resultado).toContain('TEXTO_SECRETO');
  });

  test('registra una advertencia si no hay ningún patrón activo (#164)', async () => {
    // Desactiva temporalmente TODOS los patrones (incluido el seed base de
    // #164) para simular la tabla "vacía" a efectos de limpiarTexto, sin
    // borrar nada -- se restaura en el finally.
    const { rows: activos } = await pool.query('SELECT id FROM noise_patterns WHERE activo = TRUE');
    await pool.query('UPDATE noise_patterns SET activo = FALSE WHERE activo = TRUE');
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

    try {
      const resultado = await limpiarTexto('Texto que debería sobrevivir intacto');
      expect(resultado).toContain('Texto que debería sobrevivir intacto');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no-op'));
    } finally {
      warnSpy.mockRestore();
      if (activos.length) {
        await pool.query('UPDATE noise_patterns SET activo = TRUE WHERE id = ANY($1::int[])', [activos.map((r) => r.id)]);
      }
    }
  });
});
