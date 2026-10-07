import pool from '../../../db/database.js';

// ECCP fase (d) — ver #161, docs/ANALISIS_ESTIGMERGIA_ECCP.md sección 3.3.
//
// Prior Beta-Bernoulli neutral: con cero rastros, media = PRIOR_A/(PRIOR_A+PRIOR_B) = 0.5
// y señal_feromona = 0 -- degeneración segura (el re-ranking de la fase (e)
// no mueve nada sin datos).
export const PRIOR_A = 2;
export const PRIOR_B = 2;

// Vida media de la evaporación gradual por edad (días) -- diseño §3.3.
export const VIDA_MEDIA_DIAS = 365;

// Peso del rastro global (OTRAS categorías del documento, nunca la del
// contexto que se está leyendo -- ver nota de "doble conteo" abajo) cuando
// se mezcla con el rastro específico del contexto -- diseño §3.3 "mezcla
// con el rastro global del documento (peso ~0.3)". Es una mezcla fija, no
// condicional al volumen de rastros en el contexto: como shrinkage hacia el
// global es asintóticamente despreciable a medida que el contexto acumula
// evidencia propia, y evita una regla de umbral adicional sin respaldo
// empírico (el parámetro mismo "empieza como valor razonado", §3.6 punto 4).
export const PESO_GLOBAL = 0.3;

// Tope de aporte por agente y documento (diseño §3.3 "Depósito"): un solo
// abogado votando el mismo documento en muchos casos distintos no debe
// poder saturar la señal él solo -- el rastro debe medir cuántos AGENTES
// DISTINTOS encontraron útil el precedente, no cuánto lo usa uno solo. Se
// aplica por separado a los pesos "útil" y "no útil" de cada usuario (un
// mismo abogado puede legítimamente cambiar de opinión entre casos).
export const TOPE_AGENTE = 3;

// Evaporación gradual por edad: decaimiento exponencial con vida media h.
// ρ_diario = 1 − 2^(−1/h) (diseño §3.3) -- expresado aquí directo como
// peso = 0.5^(edad/h), equivalente y numéricamente más estable.
export const calcularPesoEvaporacion = (fechaEvento, ahora = new Date()) => {
  const diasTranscurridos = Math.max(0, (ahora - new Date(fechaEvento)) / (1000 * 60 * 60 * 24));
  return Math.pow(0.5, diasTranscurridos / VIDA_MEDIA_DIAS);
};

// Suma los pesos evaporados por usuario (separados en útil/no útil),
// acotando la contribución de cada usuario a TOPE_AGENTE antes de sumar --
// así N votos del mismo agente nunca pesan más que 3 agentes distintos
// votando una vez cada uno.
const sumarConTopePorAgente = (pesosPorUsuario, campo) => {
  let total = 0;
  for (const pesos of pesosPorUsuario.values()) {
    total += Math.min(pesos[campo], TOPE_AGENTE);
  }
  return total;
};

/**
 * Lectura Beta-Bernoulli de una lista de eventos de feedback ya evaporados
 * por edad. Cada evento sin evaporar pesa como un voto completo; un evento
 * evaporado a la mitad pesa como medio voto (en 'a' si útil, en 'b' si no),
 * acotado por TOPE_AGENTE antes de sumarse a la cuenta de su agente.
 *
 * Función pura -- no toca la base de datos, solo agrega. `eventos` es
 * [{ usuario_uuid, util, categoria_contexto, created_at }, ...] para UN
 * documento.
 *
 * `contexto` y `global` son conjuntos MUTUAMENTE EXCLUYENTES de eventos (el
 * contexto nunca se cuenta dos veces): "global" es el rastro del documento
 * en OTRAS categorías, no "todas las categorías incluida c" -- si se
 * contaran ambos, un voto en el propio contexto pesaría 1 + PESO_GLOBAL en
 * vez de 1.
 */
export const calcularSenalFeromonaDesdeEventos = (eventos, { categoria = null, ahora = new Date() } = {}) => {
  const pesosContextoPorUsuario = new Map();
  const pesosGlobalPorUsuario = new Map();

  for (const ev of eventos) {
    const peso = calcularPesoEvaporacion(ev.created_at, ahora);
    if (peso <= 0) continue;

    const esDelContexto = categoria && ev.categoria_contexto === categoria;
    const mapaDestino = esDelContexto ? pesosContextoPorUsuario : pesosGlobalPorUsuario;

    const acumulado = mapaDestino.get(ev.usuario_uuid) ?? { util: 0, noUtil: 0 };
    if (ev.util) acumulado.util += peso; else acumulado.noUtil += peso;
    mapaDestino.set(ev.usuario_uuid, acumulado);
  }

  const aContexto = sumarConTopePorAgente(pesosContextoPorUsuario, 'util');
  const bContexto = sumarConTopePorAgente(pesosContextoPorUsuario, 'noUtil');
  const aGlobal = sumarConTopePorAgente(pesosGlobalPorUsuario, 'util');
  const bGlobal = sumarConTopePorAgente(pesosGlobalPorUsuario, 'noUtil');

  // Si no hay categoría de contexto, el "contexto" es el global completo --
  // no tiene sentido mezclar el global consigo mismo con un peso parcial.
  const a = categoria ? PRIOR_A + aContexto + PESO_GLOBAL * aGlobal : PRIOR_A + aGlobal;
  const b = categoria ? PRIOR_B + bContexto + PESO_GLOBAL * bGlobal : PRIOR_B + bGlobal;

  // Nota de diseño (auditoría de Opus, PR #172): el documento de diseño dice
  // "Media = a/(a+b) es la señal (0 sin rastros)" -- con el prior neutral
  // Beta(2,2), la media SIN rastros es 0.5, no 0. La lectura correcta y
  // consistente con "degeneración segura" es media − 0.5 (ver docs/
  // ANALISIS_ESTIGMERGIA_ECCP.md sección 3.9, corrección documentada ahí).
  const media = a / (a + b);
  return media - 0.5; // 0 sin rastros (prior neutral) -- rango (-0.5, 0.5)
};

/**
 * Trae los eventos de `feedback_precedentes` de un documento y calcula su
 * señal de feromona para el contexto (categoría) dado. Un fallo aquí nunca
 * debe romper la búsqueda -- quien llama decide el fallback (señal 0,
 * equivalente a "sin rastros").
 */
export const obtenerSenalFeromona = async (documentoId, categoria = null, ahora = new Date()) => {
  const { rows } = await pool.query(
    'SELECT usuario_uuid, util, categoria_contexto, created_at FROM feedback_precedentes WHERE documento_id = $1',
    [documentoId]
  );
  return calcularSenalFeromonaDesdeEventos(rows, { categoria, ahora });
};

/**
 * Versión en lote -- una sola consulta para varios documentos, evita N+1
 * cuando se re-rankean los top-K candidatos (#161 fase e).
 */
export const obtenerSenalesFeromona = async (documentoIds, categoria = null, ahora = new Date()) => {
  if (!documentoIds.length) return {};

  const { rows } = await pool.query(
    'SELECT documento_id, usuario_uuid, util, categoria_contexto, created_at FROM feedback_precedentes WHERE documento_id = ANY($1::uuid[])',
    [documentoIds]
  );

  const eventosPorDoc = new Map(documentoIds.map(id => [id, []]));
  for (const ev of rows) {
    eventosPorDoc.get(ev.documento_id)?.push(ev);
  }

  const senales = {};
  for (const [documentoId, eventos] of eventosPorDoc) {
    senales[documentoId] = calcularSenalFeromonaDesdeEventos(eventos, { categoria, ahora });
  }
  return senales;
};
