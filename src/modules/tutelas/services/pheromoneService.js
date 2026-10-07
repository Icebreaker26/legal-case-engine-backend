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

// Peso del rastro global (todas las categorías del documento) cuando se
// mezcla con el rastro específico del contexto -- diseño §3.3 "mezcla con
// el rastro global del documento (peso ~0.3)". Es una mezcla fija, no
// condicional al volumen de rastros en el contexto: como shrinkage hacia el
// global es asintóticamente despreciable a medida que el contexto acumula
// evidencia propia, y evita una regla de umbral adicional sin respaldo
// empírico (el parámetro mismo "empieza como valor razonado", §3.6 punto 4).
export const PESO_GLOBAL = 0.3;

// Evaporación gradual por edad: decaimiento exponencial con vida media h.
// ρ_diario = 1 − 2^(−1/h) (diseño §3.3) -- expresado aquí directo como
// peso = 0.5^(edad/h), equivalente y numéricamente más estable.
export const calcularPesoEvaporacion = (fechaEvento, ahora = new Date()) => {
  const diasTranscurridos = Math.max(0, (ahora - new Date(fechaEvento)) / (1000 * 60 * 60 * 24));
  return Math.pow(0.5, diasTranscurridos / VIDA_MEDIA_DIAS);
};

/**
 * Lectura Beta-Bernoulli de una lista de eventos de feedback ya evaporados
 * por edad. Cada evento sin evaporar pesa como un voto completo; un evento
 * evaporado a la mitad pesa como medio voto (en 'a' si útil, en 'b' si no).
 *
 * Función pura -- no toca la base de datos, solo agrega. `eventos` es
 * [{ util, categoria_contexto, created_at }, ...] para UN documento.
 */
export const calcularSenalFeromonaDesdeEventos = (eventos, { categoria = null, ahora = new Date() } = {}) => {
  let aContexto = 0;
  let bContexto = 0;
  let aGlobal = 0;
  let bGlobal = 0;

  for (const ev of eventos) {
    const peso = calcularPesoEvaporacion(ev.created_at, ahora);
    if (peso <= 0) continue;

    if (ev.util) aGlobal += peso; else bGlobal += peso;

    if (categoria && ev.categoria_contexto === categoria) {
      if (ev.util) aContexto += peso; else bContexto += peso;
    }
  }

  // Si no hay categoría de contexto, el "contexto" es el global completo --
  // no tiene sentido mezclar el global consigo mismo con un peso parcial.
  const a = categoria ? PRIOR_A + aContexto + PESO_GLOBAL * aGlobal : PRIOR_A + aGlobal;
  const b = categoria ? PRIOR_B + bContexto + PESO_GLOBAL * bGlobal : PRIOR_B + bGlobal;

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
    'SELECT util, categoria_contexto, created_at FROM feedback_precedentes WHERE documento_id = $1',
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
    'SELECT documento_id, util, categoria_contexto, created_at FROM feedback_precedentes WHERE documento_id = ANY($1::uuid[])',
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
