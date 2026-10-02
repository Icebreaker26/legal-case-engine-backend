// Mockea @xenova/transformers para verificar qué texto (con o sin prefijo)
// llega realmente al extractor — sin descargar ningún modelo real.
import { jest } from '@jest/globals';

const extractorMock = jest.fn().mockResolvedValue({ data: new Float32Array(384).fill(0.1) });

jest.unstable_mockModule('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(extractorMock),
}));

const { generarEmbeddingLocal } = await import('../../src/modules/tutelas/services/aiService.js');
const { env } = await import('../../src/config/env.js');

describe('aiService — prefijos query:/passage: para modelos e5 (#98)', () => {
  const modeloOriginal = env.EMBEDDING_MODEL;

  afterEach(() => {
    env.EMBEDDING_MODEL = modeloOriginal;
    extractorMock.mockClear();
  });

  test('MiniLM (sin prefijo configurado) no antepone nada al texto', async () => {
    env.EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
    await generarEmbeddingLocal('texto de prueba', { tipo: 'query' });
    expect(extractorMock.mock.calls[0][0]).toBe('texto de prueba');
  });

  test('Xenova/multilingual-e5-small antepone "query: " cuando tipo=query', async () => {
    env.EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
    await generarEmbeddingLocal('texto de prueba', { tipo: 'query' });
    expect(extractorMock.mock.calls[0][0]).toBe('query: texto de prueba');
  });

  test('Xenova/multilingual-e5-small antepone "passage: " cuando tipo=passage (default)', async () => {
    env.EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
    await generarEmbeddingLocal('texto de prueba');
    expect(extractorMock.mock.calls[0][0]).toBe('passage: texto de prueba');
  });
});
