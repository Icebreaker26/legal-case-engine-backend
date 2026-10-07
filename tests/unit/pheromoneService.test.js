import { calcularSenalFeromonaDesdeEventos, calcularPesoEvaporacion, PRIOR_A, PRIOR_B, PESO_GLOBAL, VIDA_MEDIA_DIAS, TOPE_AGENTE } from '../../src/modules/tutelas/services/pheromoneService.js';

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

  test('votos útiles recientes en el mismo contexto, de agentes distintos, suben la señal (positiva)', () => {
    const eventos = [
      { usuario_uuid: 'u1', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'u2', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    const senal = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });
    expect(senal).toBeGreaterThan(0);
  });

  test('votos negativos recientes en el mismo contexto, de agentes distintos, bajan la señal (negativa)', () => {
    const eventos = [
      { usuario_uuid: 'u1', util: false, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'u2', util: false, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    const senal = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });
    expect(senal).toBeLessThan(0);
  });

  test('la señal está acotada en (-0.5, 0.5) sin importar cuántos votos haya (muchos agentes distintos)', () => {
    const muchosUtiles = Array.from({ length: 1000 }, (_, i) => ({ usuario_uuid: `u${i}`, util: true, categoria_contexto: 'Facturacion', created_at: ahora }));
    const senal = calcularSenalFeromonaDesdeEventos(muchosUtiles, { categoria: 'Facturacion', ahora });
    expect(senal).toBeLessThan(0.5);
    expect(senal).toBeGreaterThan(0);
  });

  test('un voto totalmente evaporado (muchas vidas medias atrás) no mueve la señal', () => {
    const haceMucho = new Date(ahora.getTime() - 20 * VIDA_MEDIA_DIAS * 24 * 60 * 60 * 1000);
    const eventos = [{ usuario_uuid: 'u1', util: true, categoria_contexto: 'Facturacion', created_at: haceMucho }];
    expect(calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora })).toBeCloseTo(0, 5);
  });

  test('votos de otra categoría no cuentan para el contexto específico, solo mezclan como rastro global (peso 0.3)', () => {
    const eventos = [{ usuario_uuid: 'u1', util: true, categoria_contexto: 'OtraCategoria', created_at: ahora }];
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

// Auditoría de Opus (PR #172): el diseño pide un tope de aporte por agente y
// documento (§3.3 "Depósito") para que el rastro mida cuántos AGENTES
// DISTINTOS encontraron útil el precedente, no cuánto lo usa uno solo.
describe('pheromoneService — TOPE_AGENTE (tope de aporte por agente, diseño §3.3 "Depósito")', () => {
  const ahora = new Date('2026-10-07T00:00:00Z');

  test('TOPE_AGENTE es 3, como sugiere el diseño ("ej. 3 rastros efectivos")', () => {
    expect(TOPE_AGENTE).toBe(3);
  });

  test('un solo agente votando muchas veces no pesa más que TOPE_AGENTE votos', () => {
    const unAgenteVotandoMucho = Array.from({ length: 50 }, () => ({ usuario_uuid: 'mismo-agente', util: true, categoria_contexto: 'Facturacion', created_at: ahora }));
    const tresAgentesVotandoUnaVez = [
      { usuario_uuid: 'a1', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'a2', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'a3', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    const senalUnAgente = calcularSenalFeromonaDesdeEventos(unAgenteVotandoMucho, { categoria: 'Facturacion', ahora });
    const senalTresAgentes = calcularSenalFeromonaDesdeEventos(tresAgentesVotandoUnaVez, { categoria: 'Facturacion', ahora });
    // 50 votos de un solo agente deben pesar EXACTAMENTE igual que 3 agentes
    // distintos votando una vez (el tope los deja indistinguibles) -- sin el
    // tope, 50 votos saturarían la señal mucho más que 3.
    expect(senalUnAgente).toBeCloseTo(senalTresAgentes, 10);
  });

  test('un cuarto agente distinto SÍ mueve la señal más allá del tope de uno solo', () => {
    const unAgente = [{ usuario_uuid: 'a1', util: true, categoria_contexto: 'Facturacion', created_at: ahora }];
    const cuatroAgentes = [
      { usuario_uuid: 'a1', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'a2', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'a3', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'a4', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    const senalUnAgenteRepitiendo = calcularSenalFeromonaDesdeEventos(
      Array.from({ length: 10 }, () => unAgente[0]),
      { categoria: 'Facturacion', ahora }
    );
    const senalCuatroAgentes = calcularSenalFeromonaDesdeEventos(cuatroAgentes, { categoria: 'Facturacion', ahora });
    expect(senalCuatroAgentes).toBeGreaterThan(senalUnAgenteRepitiendo);
  });

  test('el tope se aplica por separado a útil y no útil del mismo agente (puede cambiar de opinión entre casos)', () => {
    const eventos = [
      { usuario_uuid: 'a1', util: true, categoria_contexto: 'Facturacion', created_at: ahora },
      { usuario_uuid: 'a1', util: false, categoria_contexto: 'Facturacion', created_at: ahora },
    ];
    // Ambos votos del mismo agente cuentan (1 útil + 1 no útil, cada uno
    // dentro de su propio tope de 3) -- no se cancelan ni se descartan.
    const senal = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });
    expect(senal).toBeCloseTo(0, 10); // un útil y un no útil se cancelan en a/b
  });
});

// Auditoría de Opus (PR #172): el rastro global debe ser el de OTRAS
// categorías, nunca incluir de nuevo los eventos ya contados en el contexto
// -- si se contaran ambos, un voto del propio contexto pesaría 1+0.3 en vez
// de 1.
describe('pheromoneService — contexto y global son mutuamente excluyentes (sin doble conteo)', () => {
  const ahora = new Date('2026-10-07T00:00:00Z');

  test('un voto del propio contexto pesa exactamente 1, no 1 + PESO_GLOBAL', () => {
    const eventos = [{ usuario_uuid: 'u1', util: true, categoria_contexto: 'Facturacion', created_at: ahora }];
    const senalConUnVoto = calcularSenalFeromonaDesdeEventos(eventos, { categoria: 'Facturacion', ahora });

    // a = PRIOR_A + 1 = 3, b = PRIOR_B = 2 → media = 3/5 = 0.6 → señal = 0.1
    const aEsperado = PRIOR_A + 1;
    const bEsperado = PRIOR_B;
    const senalEsperada = aEsperado / (aEsperado + bEsperado) - 0.5;
    expect(senalConUnVoto).toBeCloseTo(senalEsperada, 10);
  });
});
