import { construirConsultaAlpha, construirConsultaModelo, FUENTE_TUTELAS } from '../../src/services/motorBusqueda.js';

// #192 — el motor α se extrajo de vectorService.js a src/services/motorBusqueda.js.
// Para tutelas debe generar exactamente el mismo SQL que antes: si el texto es
// idéntico, el ranking es idéntico por construcción. Las dos funciones de abajo
// son copia literal del código anterior (origin/dev, vectorService.js:209-241 y
// :315-321), no una transcripción.

// ── Copia literal del código anterior ────────────────────────────────────────
const buildAlphaScoringCTE = () => {
  const scoreExpr = `
          (1 - (COALESCE(embedding_comprension, embedding_local) <=> $1::vector)) * $5::float8 +
          LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * (1 - $5::float8)
  `;

  return `
    WITH scored AS (
      SELECT
        categoria, titulo_referencia, contenido_legal, documento_id,
        relevancia_score, comprension_doc, vigencia_factor,
        (comprension_doc IS NOT NULL) AS tiene_comprension,
        ${scoreExpr} AS score_crudo,
        ROW_NUMBER() OVER (
          PARTITION BY documento_id
          ORDER BY ${scoreExpr} DESC, documento_id ASC
        ) AS rn
      FROM base_conocimiento_enel
      WHERE embedding_local IS NOT NULL
        AND es_exitosa = TRUE
        AND is_active = TRUE
        AND documento_id IS NOT NULL
        AND ($4::text IS NULL OR categoria ILIKE $4)
    )
    SELECT categoria, titulo_referencia, contenido_legal, documento_id,
           relevancia_score, ROUND(CAST(score_crudo AS NUMERIC), 6) AS score,
           score_crudo, tiene_comprension, comprension_doc, vigencia_factor
    FROM scored
    WHERE rn = 1
    ORDER BY score_crudo DESC, documento_id ASC
    LIMIT $3;
  `;
};

const legacyModeloSQL = `SELECT NOT EXISTS (
       SELECT 1 FROM base_conocimiento_enel
       WHERE is_active = TRUE AND embedding_modelo IS DISTINCT FROM $1
     ) AS sincronizado`;
// ─────────────────────────────────────────────────────────────────────────────

describe('motorBusqueda — fuente de tutelas (#192)', () => {
  test('genera exactamente el mismo SQL α que buildAlphaScoringCTE', () => {
    expect(construirConsultaAlpha(FUENTE_TUTELAS)).toBe(buildAlphaScoringCTE());
  });

  test('genera exactamente la misma consulta de la guarda de modelo', () => {
    expect(construirConsultaModelo(FUENTE_TUTELAS)).toBe(legacyModeloSQL);
  });

  test('sin columnaCategoria no declara el filtro $4', () => {
    const { columnaCategoria, ...sinCategoria } = FUENTE_TUTELAS;
    const sql = construirConsultaAlpha(sinCategoria);
    expect(sql).not.toContain('$4');
    expect(sql).toContain('$5::float8');
  });

  test('usa la tabla, el vector y el tsvector de la fuente', () => {
    const otra = { ...FUENTE_TUTELAS, tabla: 'chunks_x', expresionVector: 'embedding', columnaTsv: 'tsv_x', columnaDocumento: 'doc_id', columnaCategoria: undefined };
    const sql = construirConsultaAlpha(otra);
    expect(sql).toContain('FROM chunks_x');
    expect(sql).toContain('(1 - (embedding <=> $1::vector))');
    expect(sql).toContain("ts_rank(tsv_x, plainto_tsquery('spanish', $2))");
    expect(sql).toContain('PARTITION BY doc_id');
    expect(sql).toContain('ORDER BY score_crudo DESC, doc_id ASC');
  });
});
