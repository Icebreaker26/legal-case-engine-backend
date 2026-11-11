import pool from '../db/database.js';

// ── Motor de búsqueda α (configuración validada en el trabajo de grado) ──────
//
// Fusión de 2 términos confirmada con significancia en #121 y reproducida a
// través del pipeline real en #127:
//
//   score = α · (1 − distancia_coseno) + (1 − α) · min(ts_rank(tsv, plainto_tsquery('spanish', q)), 1)
//
// con e5-small y α = 0.9, sin prefiltro de categoría (#106). Este módulo no
// sabe nada de tutelas ni de ambiental: recibe una "fuente" que describe la
// tabla de trozos (columna del vector, tsvector, columna de documento, filtros
// fijos y columnas a devolver) y genera el SQL. Así los dos módulos usan la
// misma fórmula sin duplicarla (épica #199, issue #192).
//
// Contrato de parámetros del SQL generado:
//   $1 vector de la consulta (JSON de un arreglo de floats, casteado a ::vector)
//   $2 texto de la consulta (para la rama léxica)
//   $3 límite de documentos
//   $4 filtro de categoría (texto con comodines, o NULL para no filtrar) —
//      solo filtra si la fuente declara `columnaCategoria`; si no, se declara
//      como un no-op tipado (`$4::text IS NULL`), porque PostgreSQL rechaza un
//      parámetro que la consulta no usa y el contrato manda siempre $1..$5 (#196)
//   $5 α (float entre 0 y 1)
//   $6 documento a excluir — solo con `{ excluirDocumento: true }` (búsqueda
//      documento contra documento, p. ej. similares de ambiental, #196)
//
// Orden por score crudo (no redondeado) con desempate por documento ASC: es el
// orden del barrido de #115/#121; redondear antes de ordenar puede cambiar el
// ranking cuando los scores quedan muy juntos (típico con α alto). El ROUND
// solo se aplica a la columna `score` que se expone.

/**
 * @typedef {Object} FuenteBusqueda
 * @property {string}   tabla              Tabla de trozos (un vector por fila).
 * @property {string}   expresionVector    Expresión SQL del vector de cada fila (p. ej. una columna o un COALESCE).
 * @property {string}   columnaTsv         Columna tsvector de la fila.
 * @property {string}   columnaDocumento   Columna que agrupa trozos del mismo documento (se devuelve el mejor trozo).
 * @property {string[]} columnasScored     Columnas de la fila que pasan al CTE (en orden).
 * @property {string[]} columnasSalida     Columnas finales, en orden; `score` y `score_crudo` se nombran explícitamente.
 * @property {string[]} filtros            Condiciones fijas del WHERE (se unen con AND).
 * @property {string}  [columnaCategoria]  Si existe, el SQL acepta $4 como filtro ILIKE opcional sobre esta columna.
 * @property {string}   columnaModelo      Columna que registra el modelo de embeddings de la fila.
 * @property {string}   columnaActivo      Columna de borrado lógico.
 */

const exprScore = (fuente) => `
          (1 - (${fuente.expresionVector} <=> $1::vector)) * $5::float8 +
          LEAST(ts_rank(${fuente.columnaTsv}, plainto_tsquery('spanish', $2)), 1.0) * (1 - $5::float8)
  `;

/** SQL de la fusión α para una fuente. Ver el contrato de parámetros arriba. */
export const construirConsultaAlpha = (fuente, { excluirDocumento = false } = {}) => {
  const scoreExpr = exprScore(fuente);
  const filtros = [...fuente.filtros];
  if (fuente.columnaCategoria) filtros.push(`($4::text IS NULL OR ${fuente.columnaCategoria} ILIKE $4)`);
  else filtros.push('$4::text IS NULL');
  if (excluirDocumento) filtros.push(`${fuente.columnaDocumento} <> $6`);

  return `
    WITH scored AS (
      SELECT
        ${fuente.columnasScored.join(',\n        ')},
        ${scoreExpr} AS score_crudo,
        ROW_NUMBER() OVER (
          PARTITION BY ${fuente.columnaDocumento}
          ORDER BY ${scoreExpr} DESC, ${fuente.columnaDocumento} ASC
        ) AS rn
      FROM ${fuente.tabla}
      WHERE ${filtros.join('\n        AND ')}
    )
    SELECT ${fuente.columnasSalida.join(',\n           ')}
    FROM scored
    WHERE rn = 1
    ORDER BY score_crudo DESC, ${fuente.columnaDocumento} ASC
    LIMIT $3;
  `;
};

const validarAlpha = (alpha) => {
  if (typeof alpha !== 'number' || Number.isNaN(alpha) || alpha < 0 || alpha > 1) {
    throw new Error(`alpha inválido: ${alpha} (debe ser un número entre 0 y 1)`);
  }
};

/**
 * Ejecuta la fusión α sobre una fuente y devuelve el mejor trozo por documento.
 * `categoria` solo aplica si la fuente declara `columnaCategoria` (se envuelve con comodines).
 * `excluirDocumento` (opcional) deja fuera ese documento ($6).
 */
export const buscarConAlpha = async (fuente, { vector, texto = '', limit, alpha, categoria = null, excluirDocumento = null, db = pool }) => {
  validarAlpha(alpha);
  const categoriaParam = fuente.columnaCategoria && categoria?.trim() ? `%${categoria}%` : null;
  const params = [JSON.stringify(vector), texto, limit, categoriaParam, alpha];
  const excluir = excluirDocumento != null;
  if (excluir) params.push(excluirDocumento);
  const { rows } = await db.query(construirConsultaAlpha(fuente, { excluirDocumento: excluir }), params);
  return rows;
};

/**
 * Guarda de modelo: true si ninguna fila activa de la fuente quedó indexada con
 * un modelo distinto a `modelo`. `IS DISTINCT FROM` también atrapa filas con el
 * modelo en NULL (nunca reindexadas). Comparar vectores de espacios distintos no
 * falla: solo da resultados sin sentido, por eso se comprueba antes de usar α.
 */
export const construirConsultaModelo = (fuente) => `SELECT NOT EXISTS (
       SELECT 1 FROM ${fuente.tabla}
       WHERE ${fuente.columnaActivo} = TRUE AND ${fuente.columnaModelo} IS DISTINCT FROM $1
     ) AS sincronizado`;

export const fuenteIndexadaConModelo = async (fuente, modelo, db = pool) => {
  const { rows } = await db.query(construirConsultaModelo(fuente), [modelo]);
  return rows[0].sincronizado;
};

// ── Fuentes ──────────────────────────────────────────────────────────────────

/** Precedentes de tutelas (base_conocimiento_enel). */
export const FUENTE_TUTELAS = Object.freeze({
  tabla: 'base_conocimiento_enel',
  expresionVector: 'COALESCE(embedding_comprension, embedding_local)',
  columnaTsv: 'contenido_tsv',
  columnaDocumento: 'documento_id',
  columnasScored: [
    'categoria, titulo_referencia, contenido_legal, documento_id',
    'relevancia_score, comprension_doc, vigencia_factor',
    '(comprension_doc IS NOT NULL) AS tiene_comprension',
  ],
  columnasSalida: [
    'categoria, titulo_referencia, contenido_legal, documento_id',
    'relevancia_score, ROUND(CAST(score_crudo AS NUMERIC), 6) AS score',
    'score_crudo, tiene_comprension, comprension_doc, vigencia_factor',
  ],
  filtros: ['embedding_local IS NOT NULL', 'es_exitosa = TRUE', 'is_active = TRUE', 'documento_id IS NOT NULL'],
  columnaCategoria: 'categoria',
  columnaModelo: 'embedding_modelo',
  columnaActivo: 'is_active',
});

/**
 * Trozos de expedientes ambientales (chunks_ambiental, #194/#195). Solo
 * trozos activos de expedientes activos; sin filtro de categoría. Devuelve el
 * mejor trozo por expediente con su coseno (`similitud`, 0–1), que es lo que
 * muestra la UI.
 */
export const FUENTE_AMBIENTAL = Object.freeze({
  tabla: 'chunks_ambiental',
  expresionVector: 'embedding',
  columnaTsv: 'contenido_tsv',
  columnaDocumento: 'expediente_id',
  columnasScored: [
    'expediente_id, chunk_index, fuente',
    '(1 - (embedding <=> $1::vector)) AS similitud_coseno',
  ],
  columnasSalida: [
    'expediente_id, chunk_index, fuente',
    'ROUND(CAST(similitud_coseno AS NUMERIC), 4) AS similitud',
    'ROUND(CAST(score_crudo AS NUMERIC), 6) AS score, score_crudo',
  ],
  filtros: [
    'is_active = TRUE',
    'expediente_id IN (SELECT id FROM expedientes_ambientales WHERE is_active = TRUE)',
  ],
  columnaModelo: 'embedding_modelo',
  columnaActivo: 'is_active',
});
