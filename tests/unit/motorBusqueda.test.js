import { construirConsultaAlpha, construirConsultaModelo, FUENTE_TUTELAS, FUENTE_AMBIENTAL } from '../../src/services/motorBusqueda.js';

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

  // #196: antes no declaraba $4, pero buscarConAlpha siempre manda $1..$5 y
  // PostgreSQL rechaza un parámetro que la consulta no usa. Ahora lo declara
  // como un no-op tipado, sin filtrar por categoría.
  test('sin columnaCategoria, $4 es un no-op tipado y no filtra por categoría', () => {
    const { columnaCategoria, ...sinCategoria } = FUENTE_TUTELAS;
    const sql = construirConsultaAlpha(sinCategoria);
    expect(sql).toContain('$4::text IS NULL');
    expect(sql).not.toContain('ILIKE');
    expect(sql).toContain('$5::float8');
  });

  test('excluirDocumento agrega el filtro $6 sobre la columna de documento (y por defecto no)', () => {
    expect(construirConsultaAlpha(FUENTE_TUTELAS)).not.toContain('$6');
    expect(construirConsultaAlpha(FUENTE_TUTELAS, { excluirDocumento: true })).toContain('documento_id <> $6');
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

describe('motorBusqueda — fuente de ambiental (#196)', () => {
  test('misma fórmula α sobre chunks_ambiental, mejor trozo por expediente, excluyendo el consultado', () => {
    const sql = construirConsultaAlpha(FUENTE_AMBIENTAL, { excluirDocumento: true });
    expect(sql).toContain('FROM chunks_ambiental');
    expect(sql).toContain('(1 - (embedding <=> $1::vector)) * $5::float8');
    expect(sql).toContain("LEAST(ts_rank(contenido_tsv, plainto_tsquery('spanish', $2)), 1.0) * (1 - $5::float8)");
    expect(sql).toContain('PARTITION BY expediente_id');
    expect(sql).toContain('expediente_id <> $6');
    expect(sql).toContain('$4::text IS NULL');
    expect(sql).toContain('SELECT id FROM expedientes_ambientales WHERE is_active = TRUE');
  });

  test('la guarda de modelo mira los trozos activos de chunks_ambiental', () => {
    expect(construirConsultaModelo(FUENTE_AMBIENTAL)).toContain('FROM chunks_ambiental');
    expect(construirConsultaModelo(FUENTE_AMBIENTAL)).toContain('is_active = TRUE AND embedding_modelo IS DISTINCT FROM $1');
  });
});
