import { z } from 'zod';

// Contrato de un documento del corpus (precedente sintético que se indexa
// en base_conocimiento_enel). `spec` es la especificación latente que
// determina la verdad de referencia (qrels) — nunca se pasa al indexador
// real, solo se usa para derivar relevancia de forma objetiva en
// construirQrels() (ver eval/lib/qrels.js).
export const DocSchema = z.object({
  id: z.string().regex(/^DOC-[A-Z0-9-]+$/, 'id debe tener el formato DOC-<...>'),
  categoria: z.string().min(1),
  titulo: z.string().min(1),
  texto: z.string().min(1),
  esExitosa: z.boolean().default(true),
  comprension: z.object({
    que_resuelve: z.string(),
    tipo_caso: z.string(),
    resultado: z.enum(['favorable', 'desfavorable', 'referencia']),
    derechos_involucrados: z.array(z.string()).default([]),
  }).nullable().default(null),
  spec: z.object({
    subtema: z.string().min(1),
    base_normativa: z.array(z.string()).min(1),
  }),
});

// Contrato de una consulta de evaluación (derecho de petición/tutela sintético).
export const QuerySchema = z.object({
  qid: z.string().regex(/^Q-[A-Z0-9-]+$/, 'qid debe tener el formato Q-<...>'),
  texto: z.string().min(1),
  derecho_vulnerado: z.string().min(1), // para la variante categoria:'etiquetada'
  comprension: z.object({
    tema_central: z.string(),
    peticiones: z.array(z.string()).default([]),
  }).nullable().default(null), // para la variante comprensionQuery:true
  spec: z.object({
    categoria: z.string().min(1),
    subtema: z.string().min(1),
    base_normativa: z.array(z.string()).min(1),
  }),
});

// Una configuración experimental pre-registrada (eval/experimentos.json).
export const ExperimentoSchema = z.object({
  id: z.string().min(1),
  fusion: z.enum(['ponderado', 'rrf', 'alpha']).default('ponderado'),
  // Solo se usa si fusion:'alpha' (#127) — replica coseno*alpha + ts_rank*(1-alpha)
  // de eval/scripts/v2_barrido_pesos.js a través del pipeline real.
  alpha: z.number().min(0).max(1).optional(),
  estrategia: z.enum(['actual', 'completo', 'comprension']).default('actual'),
  comprensionQuery: z.boolean().default(false), // si true, pasa q.comprension a la tutela
  categoria: z.enum(['extraida', 'etiquetada', 'ninguna']).default('extraida'),
  limit: z.number().int().positive().default(10),
}).refine(
  (exp) => exp.fusion !== 'alpha' || typeof exp.alpha === 'number',
  { message: "fusion:'alpha' requiere 'alpha' (0-1) explícito en el experimento" }
);

export const cargarYValidar = async (rutaJsonl, schema) => {
  const fs = await import('node:fs/promises');
  const texto = await fs.readFile(rutaJsonl, 'utf-8');
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  return lineas.map((linea, i) => {
    const resultado = schema.safeParse(JSON.parse(linea));
    if (!resultado.success) {
      throw new Error(`${rutaJsonl}:${i + 1} — inválido:\n${resultado.error.format ? JSON.stringify(resultado.error.format(), null, 2) : resultado.error}`);
    }
    return resultado.data;
  });
};
