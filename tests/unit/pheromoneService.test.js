import { calcularSenalFeromonaDesdeEventos, calcularPesoEvaporacion, PRIOR_A, PRIOR_B, PESO_GLOBAL, VIDA_MEDIA_DIAS } from '../../src/modules/tutelas/services/pheromoneService.js';

describe('pheromoneService — calcularPesoEvaporacion', () => {
  test('evento de hoy pesa 1 (sin evaporar)', () => {
    const ahora = new Date('2026-10-07T00:00:00Z');
    expect(calcularPesoEvaporacion(ahora, ahora)).toBeCloseTo(1);
  });

  test('a una vida media exacta (365 días), el peso cae a la mitad', () => {
    const ahora = new Date('2026-10-07T00:00:00Z');
    const haceUnaVidaMedia = new Date(ahora.getTime() - VIDA_MEDIA_DIAS * 24 * 60 * 60 * 1000);
    expect(calcularPesoEvaporacion(haceUnaVidaMedia, ahora)).toBeCloseTo(0.5, 5);
  });

  test('a dos vidas medias, el peso cae a un cuarto', () => {
    const ahora = new Date('2026-10-07T00:00:00Z');
    const haceDosVidasMedias = new Date(ahora.getTime() - 2 * VIDA_MEDIA_DIAS * 24 * 60 * 60 * 1000);
    expect(calcularPesoEvaporacion(haceDosVidasMedias, ahora)).toBeCloseTo(0.25, 5);
  });

  test('un evento futuro (reloj desincronizado) no da peso negativo ni > 1', () => {
    const ahora = new Date('2026-10-07T00:00:00Z');
    const futuro = new Date('2026-10-08T00:00:00Z');
    expect(calcularPesoEvaporacion(futuro, ahora)).toBeLessThanOrEqual(1);
    expect(calcularPesoEvaporacion(futuro, ahora)).toBeGreaterThanOrEqual(0);
  });
});

describe('pheromoneService — calcularSenalFeromonaDesdeEventos (degeneración segura)', () => {
  const ahora = new Date('2026-10-07T00:00:00Z');

  test('sin eventos, la señal es exactamente 0 (prior neutral Beta(2,2))', () => {
    expect(calcularSenalFeromonaDesdeEventos([], { categoria: 'Facturacion', ahora })).toBe(0);
  });

  test('sin eventos y sin categoría de contexto, también 0', () => {
    expect(calcularSenalFeromonaDesdeEventos([], { categoria: null, ahora })).toBe(0);
  });

  test('el prior neutral es Beta(2,2): media 0.5 → señal 0', () => {
    expect(PRIOR_A).toBe(2);
    expect(PRIOR_B).toBe(2);
  });

  test('votos útiles recientes en el mismo contexto suben la señal (positiva)', () => {
    const eventos = [
      { util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { util: true, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    const senal = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });
    expect(senal).toBeGreaterThan(0);
  });

  test('votos negativos recientes en el mismo contexto bajan la señal (negativa)', () => {
    const eventos = [
      { util: false, categoria_contexto: 'Facturacion', created_at: ahora },
      { util: false, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    const senal = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });
    expect(senal).toBeLessThan(0);
  });

  test('la señal está acotada en (-0.5, 0.5) sin importar cuántos votos haya', () => {
    const muchosUtiles = Array.from({ length: 1000 }, () => ({ util: true, categoria_contexto: 'Facturacion', created_at: ahora }));
    const senal = calcularSenalFeromonaDesdeEventos(muchosUtiles, { categoria: 'Facturacion', ahora });
    expect(senal).toBeLessThan(0.5);
    expect(senal).toBeGreaterThan(0);
  });

  test('un voto totalmente evaporado (muchas vidas medias atrás) no mueve la señal', () => {
    const haceMucho = new Date(ahora.getTime() - 20 * VIDA_MEDIA_DIAS * 24 * 60 * 60 * 1000);
    const eventos = [{ util: true, categoria_contexto: 'Facturacion', created_at: haceMucho }];
    expect(calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora })).toBeCloseTo(0, 5);
  });

  test('votos de otra categoría no cuentan para el contexto específico, solo mezclan como rastro global (peso 0.3)', () => {
    const eventos = [{ util: true, categoria_contexto: 'OtraCategoria', created_at: ahora }];
    const senalConContexto = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });
    const senalSinFiltroDeContexto = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'OtraCategoria', ahora });
    // Mismo voto, pero mezclado con peso 0.3 (contexto distinto) pesa menos
    // que si fuera un voto directo del contexto (peso 1).
    expect(senalConContexto).toBeGreaterThan(0);
    expect(senalConContexto).toBeLessThan(senalSinFiltroDeContexto);
  });

  test('PESO_GLOBAL es 0.3, documentado en el módulo', () => {
    expect(PESO_GLOBAL).toBe(0.3);
  });
});
