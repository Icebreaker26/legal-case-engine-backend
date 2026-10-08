import { calcularHter, itemsATexto } from '../../src/modules/tutelas/services/hterService.js';

describe('hterService — calcularHter (#162)', () => {
  test('texto idéntico -> HTER 0', () => {
    const medicion = calcularHter('hola mundo esto es una prueba', 'hola mundo esto es una prueba');
    expect(medicion.hter).toBe(0);
    expect(medicion.distancia).toBe(0);
  });

  test('una palabra sustituida -> distancia 1, HTER = 1/n_referencia', () => {
    const medicion = calcularHter('hola mundo cruel', 'hola mundo feliz');
    expect(medicion.distancia).toBe(1);
    expect(medicion.palabras_referencia).toBe(3);
    expect(medicion.hter).toBeCloseTo(1 / 3);
  });

  test('hipótesis vacía contra referencia no vacía -> toda la referencia son inserciones', () => {
    const medicion = calcularHter('', 'uno dos tres');
    expect(medicion.distancia).toBe(3);
    expect(medicion.hter).toBe(1);
  });

  test('referencia vacía -> null (nada contra qué medir)', () => {
    expect(calcularHter('cualquier cosa', '')).toBeNull();
    expect(calcularHter('cualquier cosa', null)).toBeNull();
  });

  test('normaliza por la longitud de la REFERENCIA, no de la hipótesis (asimetría de TER)', () => {
    // Hipótesis mucho más larga que la referencia: cada palabra extra de la
    // hipótesis es una edición (borrado), pero se divide por las palabras
    // de la referencia (3), no por las de la hipótesis (6).
    const medicion = calcularHter('uno dos tres cuatro cinco seis', 'uno dos tres');
    expect(medicion.palabras_referencia).toBe(3);
    expect(medicion.distancia).toBe(3);
    expect(medicion.hter).toBe(1);
  });

  test('textos por encima del tope de palabras -> null en vez de colgar el proceso', () => {
    const textoEnorme = Array.from({ length: 5001 }, (_, i) => `palabra${i}`).join(' ');
    expect(calcularHter(textoEnorme, 'referencia corta')).toBeNull();
    expect(calcularHter('hipotesis corta', textoEnorme)).toBeNull();
  });
});

describe('hterService — itemsATexto (#162)', () => {
  test('ordena por número aunque lleguen desordenados, e incluye normas citadas', () => {
    const items = [
      { numero: 2, solicitud: 'Segunda solicitud', respuesta: 'Segunda respuesta', normas_citadas: [] },
      { numero: 1, solicitud: 'Primera solicitud', respuesta: 'Primera respuesta', normas_citadas: ['Ley 142/1994'] },
    ];
    const texto = itemsATexto(items);
    const posPrimera = texto.indexOf('Primera solicitud');
    const posSegunda = texto.indexOf('Segunda solicitud');
    expect(posPrimera).toBeGreaterThanOrEqual(0);
    expect(posSegunda).toBeGreaterThan(posPrimera);
    expect(texto).toContain('Normas citadas: Ley 142/1994');
  });

  test('ítem sin normas citadas no agrega la línea "Normas citadas"', () => {
    const texto = itemsATexto([{ numero: 1, solicitud: 'S', respuesta: 'R', normas_citadas: [] }]);
    expect(texto).not.toContain('Normas citadas');
  });
});
