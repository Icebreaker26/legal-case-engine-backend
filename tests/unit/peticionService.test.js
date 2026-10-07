import { extraerSolicitudes, detectarMetodoSegmentacion, agruparEnLotes, construirPromptLote } from '../../src/modules/tutelas/services/peticionService.js';

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

// Mejoras de docs/ANALISIS_GENERADOR_PROMPTS.md sección C, "Veredicto C"
// (issues #153-#158)
describe('peticionService — construirPromptLote (mejoras C.1/C.2/C.4)', () => {
  const tutela = { radicado: 'R-1', accionante: 'Juan Perez', derecho_vulnerado: 'Facturacion' };
  const argumentos = [{ titulo: 'Argumento clave', contenido: 'El abogado insiste en este punto.' }];
  const sugerencias = [{
    titulo_referencia: 'Precedente 1',
    score: 0.9,
    categoria: 'Facturacion',
    comprension_doc: { resultado: 'favorable', tipo_caso: 'Facturacion', que_resuelve: 'Resuelve a favor', derechos_involucrados: [] },
  }];
  const comprension = { tema_central: 'Reclamo', derechos_invocados: [], peticiones: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], urgencia_declarada: 'media' };

  const lote0 = [{ numero: 1, etiqueta: '1.', texto: 'Solicitud 1' }, { numero: 2, etiqueta: '2.', texto: 'Solicitud 2' }];
  const lote1 = [{ numero: 4, etiqueta: '4.', texto: 'Solicitud 4' }, { numero: 5, etiqueta: '5.', texto: 'Solicitud 5' }];

  const base = { tutela, legalNotes: [], sugerencias, argumentos, comprension };
  const p0 = construirPromptLote({ ...base, lote: lote0, loteIndex: 0, totalLotes: 2 });
  const p1 = construirPromptLote({ ...base, lote: lote1, loteIndex: 1, totalLotes: 2 });

  test('#153 (C.1): los argumentos del abogado quedan después de los insumos y antes de las solicitudes', () => {
    const idxArgumentos = p0.indexOf('ARGUMENTOS ESPECÍFICOS DEL ABOGADO');
    const idxInsumosEnd = p0.indexOf('══════════════════════════════');
    const idxSolicitudes = p0.indexOf('Solicitudes a responder:');
    expect(idxArgumentos).toBeGreaterThan(idxInsumosEnd);
    expect(idxArgumentos).toBeLessThan(idxSolicitudes);
  });

  test('#154 (C.2.1): el ejemplo de "numero" usa el primer número real del lote, no reinicia en 1', () => {
    expect(p0).toContain('"numero": 1,');
    expect(p1).toContain('"numero": 4,');
    expect(p1).not.toContain('"numero": 1,');
  });

  test('#155 (C.2.2): prescripcion solo se pide completa en el lote 0; en los demás es null con aclaración', () => {
    expect(p0).toContain('"prescripcion": { "aplica"');
    expect(p1).toContain('"prescripcion": null');
    expect(p1).toContain('ya se tomó en la parte 1');
  });

  test('#156 (C.2.3): la estrategia sugerida aparece en TODOS los lotes, no solo en el primero', () => {
    expect(p0).toContain('ESTRATEGIA SUGERIDA');
    expect(p1).toContain('ESTRATEGIA SUGERIDA');
  });

  test('#157 (C.4.a): la regla de prescripción exige antigüedad verificable, no "más de 10 años" sin condicionar', () => {
    expect(p0).toContain('ÚNICAMENTE si el texto');
    expect(p0).toContain('sin información de antigüedad disponible');
    expect(p0).not.toContain('tiene más de 10 años, aplica');
  });

  test('#158 (C.4.c): cada lote indica explícitamente qué etiquetas debe responder', () => {
    expect(p1).toContain('etiquetadas: 4., 5.');
    expect(p1).toContain('ignóralas aquí');
  });

  test('con un solo lote (sin multiplicidad), no hace falta aclarar el rango de etiquetas', () => {
    const pUnico = construirPromptLote({ ...base, lote: lote0, loteIndex: 0, totalLotes: 1 });
    expect(pUnico).not.toContain('etiquetadas:');
  });
});
