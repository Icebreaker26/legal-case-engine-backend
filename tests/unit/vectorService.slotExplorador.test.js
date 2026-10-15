import { aplicarSlotExplorador, EPSILON_EXPLORACION, Z_UCB } from '../../src/modules/tutelas/services/vectorService.js';

// ECCP fase (f, #186) — slot explorador (§3.3): función pura, sin DB, para
// poder fijar escenarios exactos de candidatos "casi equivalentes" sin
// depender del ruido del corpus compartido de los tests de integración.
//
// Forma mínima de un candidato para `aplicarSlotExplorador`: necesita
// documento_id, score_semantico (S_base) y ucb (media + z·√varianza);
// el resto de campos (score_final, etc.) son indiferentes para esta función.
const candidato = (documento_id, score_semantico, ucb) => ({ documento_id, score_semantico, score_final: score_semantico, ucb });

describe('vectorService — aplicarSlotExplorador (ECCP fase f, #186)', () => {
  test('con 4 candidatos o menos, no hay puesto 5 que explorar -- devuelve igual', () => {
    const candidatos = [candidato('a', 0.9, 0.5), candidato('b', 0.8, 0.5), candidato('c', 0.7, 0.5)];
    const resultado = aplicarSlotExplorador(candidatos, 10);
    expect(resultado).toEqual(candidatos);
  });

  test('si nadie entra en el margen ε del puesto 5 natural, no se explora (determinista)', () => {
    const candidatos = [
      candidato('p1', 0.95, 0.1), candidato('p2', 0.90, 0.1), candidato('p3', 0.85, 0.1), candidato('p4', 0.80, 0.1),
      candidato('natural', 0.50, 0.1), // puesto 5 natural
      candidato('lejano', 0.10, 0.99), // UCB alto, pero score_semantico muy lejos del natural -- no elegible
    ];
    const resultado = aplicarSlotExplorador(candidatos, 6);
    expect(resultado[4].documento_id).toBe('natural');
    expect(resultado[4].es_exploracion).toBeUndefined();
  });

  test('entre candidatos casi equivalentes en S_base, gana el de mayor UCB, aunque no sea el mejor en S_base', () => {
    const candidatos = [
      candidato('p1', 0.95, 0.1), candidato('p2', 0.90, 0.1), candidato('p3', 0.85, 0.1), candidato('p4', 0.80, 0.1),
      candidato('natural', 0.50, 0.1),                              // puesto 5 natural -- UCB baja (mucha evidencia)
      candidato('explorado', 0.50 - EPSILON_EXPLORACION / 2, 0.9),  // dentro del margen, UCB alta (poca evidencia)
      candidato('fuera-de-margen', 0.50 - EPSILON_EXPLORACION * 2, 0.95), // UCB más alta todavía, pero fuera del margen ε
    ];
    const resultado = aplicarSlotExplorador(candidatos, 6);
    expect(resultado[4].documento_id).toBe('explorado');
    expect(resultado[4].es_exploracion).toBe(true);
  });

  test('si el ganador por UCB coincide con el natural, es_exploracion es false (no hubo cambio real)', () => {
    const candidatos = [
      candidato('p1', 0.95, 0.1), candidato('p2', 0.90, 0.1), candidato('p3', 0.85, 0.1), candidato('p4', 0.80, 0.1),
      candidato('natural', 0.50, 0.9), // mayor UCB del grupo elegible -- se queda igual
      candidato('otro', 0.50 - EPSILON_EXPLORACION / 2, 0.2),
    ];
    const resultado = aplicarSlotExplorador(candidatos, 6);
    expect(resultado[4].documento_id).toBe('natural');
    expect(resultado[4].es_exploracion).toBe(false);
  });

  test('candidatos ya fijados en los puestos 1-4 nunca entran a competir por el slot (explotación pura)', () => {
    // 'p4' tiene UCB altísima, pero ya está en el puesto 4 por explotación --
    // el slot explorador solo compite entre el natural del puesto 5 en
    // adelante.
    const candidatos = [
      candidato('p1', 0.95, 0.1), candidato('p2', 0.90, 0.1), candidato('p3', 0.85, 0.1), candidato('p4', 0.80, 0.99),
      candidato('natural', 0.50, 0.1),
      candidato('explorado', 0.50 - EPSILON_EXPLORACION / 2, 0.5),
    ];
    const resultado = aplicarSlotExplorador(candidatos, 6);
    expect(resultado[3].documento_id).toBe('p4');
    expect(resultado[4].documento_id).toBe('explorado');
  });

  test('Z_UCB y EPSILON_EXPLORACION son valores positivos documentados (parámetros de partida, #186)', () => {
    expect(Z_UCB).toBeGreaterThan(0);
    expect(EPSILON_EXPLORACION).toBeGreaterThan(0);
  });
});
