import { construirConsulta } from '../../src/modules/tutelas/services/consultaService.js';

describe('consultaService', () => {
  const textoLargo = 'A'.repeat(2000);

  describe('estrategia "actual" (default)', () => {
    test('sin comprensión: textoVector es el texto truncado a 1500, textoLexico es el texto completo', () => {
      const { textoVector, textoLexico } = construirConsulta({ contenido_original: textoLargo });
      expect(textoVector).toBe(textoLargo.substring(0, 1500));
      expect(textoVector).toHaveLength(1500);
      expect(textoLexico).toBe(textoLargo);
    });

    test('con comprensión: textoVector se construye desde tema_central + peticiones', () => {
      const tutela = {
        contenido_original: textoLargo,
        analisis_comprension: {
          tema_central: 'Reclamo por facturación',
          peticiones: ['Explicar cobro', 'Anular recargo'],
        },
      };
      const { textoVector, textoLexico } = construirConsulta(tutela);
      expect(textoVector).toBe('Reclamo por facturación. Explicar cobro. Anular recargo');
      expect(textoLexico).toBe(textoLargo);
    });

    test('contenido_original ausente no lanza error', () => {
      const { textoVector, textoLexico } = construirConsulta({});
      expect(textoVector).toBe('');
      expect(textoLexico).toBe('');
    });
  });

  describe('estrategia "completo"', () => {
    test('usa el texto completo tanto para vector como para léxico', () => {
      const { textoVector, textoLexico } = construirConsulta(
        { contenido_original: textoLargo },
        { estrategia: 'completo' }
      );
      expect(textoVector).toBe(textoLargo);
      expect(textoLexico).toBe(textoLargo);
    });
  });

  describe('estrategia "comprension"', () => {
    test('se comporta igual que "actual" cuando hay analisis_comprension', () => {
      const tutela = {
        contenido_original: textoLargo,
        analisis_comprension: { tema_central: 'Tema', peticiones: ['Uno'] },
      };
      const actual = construirConsulta(tutela, { estrategia: 'actual' });
      const comprension = construirConsulta(tutela, { estrategia: 'comprension' });
      expect(comprension).toEqual(actual);
    });
  });

  describe('estrategia desconocida', () => {
    test('lanza error en vez de usar un fallback silencioso', () => {
      expect(() => construirConsulta({ contenido_original: 'x' }, { estrategia: 'secciones' }))
        .toThrow(/no soportada/);
    });
  });
});
