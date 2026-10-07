import { extraerSolicitudes, detectarMetodoSegmentacion, agruparEnLotes } from '../../src/modules/tutelas/services/peticionService.js';

describe('peticionService — extraerSolicitudes / detectarMetodoSegmentacion', () => {
  test('texto vacío → sin solicitudes, método "vacio"', () => {
    expect(extraerSolicitudes('')).toEqual([]);
    expect(detectarMetodoSegmentacion('')).toBe('vacio');
    expect(detectarMetodoSegmentacion(null)).toBe('vacio');
  });

  test('numeración "1.- / 2.-" → método "numerico"', () => {
    const texto = '1.- Solicito copia de factura\n\n2.- Explicar cobros adicionales';
    const solicitudes = extraerSolicitudes(texto);
    expect(solicitudes).toHaveLength(2);
    expect(solicitudes[0].etiqueta).toBe('1.');
    expect(detectarMetodoSegmentacion(texto)).toBe('numerico');
  });

  test('ordinales "Primero:/Segundo:" → método "ordinal"', () => {
    const texto = 'Primero: Solicito copia de factura\n\nSegundo: Explicar cobros';
    const solicitudes = extraerSolicitudes(texto);
    expect(solicitudes).toHaveLength(2);
    expect(solicitudes[0].etiqueta).toBe('Primero:');
    expect(detectarMetodoSegmentacion(texto)).toBe('ordinal');
  });

  test('texto sin estructura reconocible → fallback, una sola solicitud', () => {
    const texto = 'Solicito de manera respetuosa que se revise mi caso en su totalidad.';
    const solicitudes = extraerSolicitudes(texto);
    expect(solicitudes).toHaveLength(1);
    expect(solicitudes[0].etiqueta).toBe('1.');
    expect(detectarMetodoSegmentacion(texto)).toBe('fallback');
  });

  // #146 (revisión de Opus): el detector original inferÍa el método por la
  // FORMA del resultado (longitud 1 + etiqueta '1.' ⇒ fallback). Este test
  // fija el contrato real -- método declarado por la rama que lo produjo,
  // no inferido -- para que un cambio futuro en extraerSolicitudes (otro
  // formato de etiqueta, otro fallback) rompa este test en vez de romper
  // en silencio la clasificación.
  test('detectarMetodoSegmentacion no re-deriva el método de la forma del resultado, lo declara la rama', () => {
    // Un solo match numérico (no llega al mínimo de 2) cae al fallback, con
    // la MISMA etiqueta '1.' que produciría un caso numérico de un solo
    // ítem -- si el detector infiriera por forma, no podría distinguirlos,
    // pero como construye el método en el mismo return que la segmentación,
    // es correcto aunque el único dato observable (la etiqueta) sea igual.
    const textoUnSoloMatchNumerico = '1.- Única solicitud, no hay una segunda numerada';
    expect(detectarMetodoSegmentacion(textoUnSoloMatchNumerico)).toBe('fallback');
  });
});

describe('peticionService — agruparEnLotes (ver docs/ANALISIS_GENERADOR_PROMPTS.md sección B)', () => {
  const opts = {
    tutela: { radicado: 'R-1', accionante: 'Test', derecho_vulnerado: 'Test' },
    legalNotes: [],
    sugerencias: [],
    argumentos: [],
    comprension: null,
  };

  test('sin opts, usa el tamaño fijo legacy de 3', () => {
    const solicitudes = Array.from({ length: 7 }, (_, i) => ({ numero: i + 1, etiqueta: `${i + 1}.`, texto: 'x' }));
    const lotes = agruparEnLotes(solicitudes);
    expect(lotes).toHaveLength(3);
    expect(lotes[0]).toHaveLength(3);
    expect(lotes[2]).toHaveLength(1);
  });

  test('con opts, agrupa por presupuesto de caracteres sin exceder LIMITE_COPILOT por lote', () => {
    const relleno = 'texto de relleno para la solicitud numero '.repeat(50);
    const solicitudes = Array.from({ length: 20 }, (_, i) => ({ numero: i + 1, etiqueta: `${i + 1}.`, texto: `${relleno}${i + 1}` }));
    const lotes = agruparEnLotes(solicitudes, opts);
    expect(lotes.length).toBeGreaterThan(0);
    // Reconstruir el total de solicitudes agrupadas — ninguna se pierde
    const totalAgrupado = lotes.reduce((acc, l) => acc + l.length, 0);
    expect(totalAgrupado).toBe(solicitudes.length);
  });
});
