import { kmeans } from 'ml-kmeans';
import {
  calcularBiblioteca,
  siluetaMedia,
  elegirK,
  KMEANS_OPCIONES,
  KMEANS_SEED,
} from '../../src/modules/ambiental/services/ambientalBibliotecaService.js';

// #198: k-means de la biblioteca ambiental con semilla fija. Cálculo puro,
// sin base de datos.

// Generador determinista (mulberry32) para fabricar datos de prueba.
const generador = (semilla) => () => {
  semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 24 puntos en 16 dimensiones, alrededor de 4 centros con ruido.
const fabricarPuntos = () => {
  const azar = generador(7);
  const centros = Array.from({ length: 4 }, () => Array.from({ length: 16 }, () => azar() * 2 - 1));
  return Array.from({ length: 24 }, (_, i) => ({
    id: `exp-${String(i).padStart(2, '0')}`,
    titulo: `Expediente ${i}`,
    tipo_instrumento: i % 2 ? 'Resolución' : 'Auto',
    nivel_riesgo: ['Alto', 'Medio', 'Bajo'][i % 3],
    resumen: null,
    vector: centros[i % 4].map((c) => c + (azar() - 0.5) * 0.6),
  }));
};

const particion = (asignaciones, puntos) => {
  const grupos = new Map();
  asignaciones.forEach((g, i) => grupos.set(g, [...(grupos.get(g) ?? []), puntos[i].id]));
  return [...grupos.values()].map((ids) => ids.sort().join(',')).sort();
};

describe('Biblioteca ambiental — k-means con semilla (#198)', () => {
  test('la semilla es una constante fija y llega a las opciones de kmeans', () => {
    expect(Number.isInteger(KMEANS_SEED)).toBe(true);
    expect(KMEANS_OPCIONES).toEqual({ maxIterations: 150, tolerance: 1e-6, seed: KMEANS_SEED });
  });

  test('dos recálculos seguidos con los mismos datos producen la misma partición, centroides y proyección', () => {
    const puntos = fabricarPuntos();
    const a = calcularBiblioteca(puntos);
    const b = calcularBiblioteca(puntos);
    expect(a.asignaciones).toEqual(b.asignaciones);
    expect(particion(a.asignaciones, puntos)).toEqual(particion(b.asignaciones, puntos));
    expect(b.clusterRows).toEqual(a.clusterRows);
    expect(b.puntos2D).toEqual(a.puntos2D);
    expect(b.silueta).toBe(a.silueta);
  });

  test('con la misma semilla, kmeans es reproducible también entre 10 corridas', () => {
    const vectores = fabricarPuntos().map((p) => p.vector);
    const primera = kmeans(vectores, 5, KMEANS_OPCIONES).clusters;
    for (let i = 0; i < 10; i++) expect(kmeans(vectores, 5, KMEANS_OPCIONES).clusters).toEqual(primera);
  });

  test('la regla de k no cambia', () => {
    expect([3, 5, 6, 14, 15, 29, 30, 200].map(elegirK)).toEqual([2, 2, 3, 3, 5, 5, 7, 7]);
  });
});

describe('Biblioteca ambiental — silueta (#198)', () => {
  test('dos grupos bien separados dan una silueta cercana a 1', () => {
    const v = [[0, 0], [0, 0.1], [0.1, 0], [10, 10], [10, 10.1], [10.1, 10]];
    expect(siluetaMedia(v, [0, 0, 0, 1, 1, 1])).toBeGreaterThan(0.95);
  });

  test('una asignación que mezcla los grupos da una silueta negativa', () => {
    const v = [[0, 0], [0, 0.1], [0.1, 0], [10, 10], [10, 10.1], [10.1, 10]];
    expect(siluetaMedia(v, [0, 1, 0, 1, 0, 1])).toBeLessThan(0);
  });

  test('no está definida con un solo grupo o un grupo por punto', () => {
    expect(siluetaMedia([[0], [1], [2]], [0, 0, 0])).toBeNull();
    expect(siluetaMedia([[0], [1]], [0, 1])).toBeNull();
  });

  test('calcularBiblioteca la reporta para el k elegido', () => {
    const r = calcularBiblioteca(fabricarPuntos());
    expect(r.k).toBe(5);
    expect(r.silueta).toBeGreaterThan(-1);
    expect(r.silueta).toBeLessThanOrEqual(1);
  });
});
