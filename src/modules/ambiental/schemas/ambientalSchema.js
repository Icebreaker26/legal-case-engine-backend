import { z } from 'zod';

export const crearExpedienteSchema = z.object({
  titulo:           z.string().min(1, 'El título es obligatorio.'),
  tipo_instrumento: z.string().min(1, 'El tipo de instrumento es obligatorio.'),
  numero_expediente: z.string().optional(),
  entidad_id:       z.preprocess(v => v !== undefined ? Number(v) : undefined, z.number().int().positive()).optional(),
  responsable_uuid: z.string().uuid().optional(),
  grupo_id:         z.preprocess(v => v !== undefined ? Number(v) : undefined, z.number().int().positive()).optional(),
  fecha_documento:  z.string().optional(),
  contenido_texto:  z.string().optional(),
  prompt_generado:  z.string().optional(),
});

export const actualizarExpedienteSchema = z.object({
  titulo:           z.string().min(1).optional(),
  tipo_instrumento: z.string().min(1).optional(),
  numero_expediente: z.string().optional(),
  entidad_id:       z.preprocess(v => v !== undefined ? Number(v) : undefined, z.number().int().positive()).optional(),
  responsable_uuid: z.string().uuid().optional().nullable(),
  grupo_id:         z.preprocess(v => v !== undefined ? Number(v) : undefined, z.number().int().positive()).optional(),
  proyecto_id:      z.preprocess(v => (v !== undefined && v !== null) ? Number(v) : v, z.number().int().positive().nullable()).optional(),
  fecha_documento:    z.string().optional(),
  fecha_vencimiento:  z.string().optional().nullable(),
  estado:             z.enum(['Pendiente', 'Analizado', 'Revisado', 'Archivado', 'Cerrado']).optional(),
  contenido_texto:       z.string().optional(),
  prompt_generado:       z.string().optional(),
  argumentos_recurso:    z.string().optional().nullable(),
  hallazgos_recurso_ids: z.array(z.string().uuid()).optional(),
  recurso_llm_json:         z.string().optional().nullable(),
  respuesta_entidad_texto:  z.string().optional().nullable(),
  fecha_respuesta:          z.string().optional().nullable(),
  respuesta_llm_json:       z.string().optional().nullable(),
  enlace_pdf:               z.string().url('URL inválida').optional().nullable().or(z.literal('')),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

const normalizar = (v) => typeof v === 'string' ? v.normalize('NFC').trim() : v;

const hallazgoSchema = z.object({
  numero:           z.number().int().positive(),
  tipo:             z.preprocess(normalizar, z.enum(['Incumplimiento', 'Riesgo', 'Observación', 'Buena práctica'])),
  descripcion:      z.string().min(1),
  norma_infringida: z.string().optional().nullable(),
  recomendacion:    z.string().optional().nullable(),
  prioridad:        z.preprocess(normalizar, z.enum(['Alta', 'Media', 'Baja'])),
});

const normaCitadaSchema = z.object({
  instrumento: z.string().min(1),
  articulo:    z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
});

export const guardarAnalisisSchema = z.object({
  resultado_llm_json: z.string().min(1, 'La respuesta del LLM es obligatoria.'),
  modo: z.enum(['reemplazar', 'acumular']).default('reemplazar'),
  seccion_index: z.preprocess(v => v !== undefined ? Number(v) : undefined, z.number().int().positive()).optional(),
});

const pagoSchema = z.object({
  descripcion:       z.string().optional().nullable(),
  valor:             z.string().min(1),
  plazo:             z.string().optional().nullable(),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  estado:            z.preprocess(normalizar, z.enum(['Pendiente', 'Pagado'])).default('Pendiente'),
  nota:              z.string().optional().nullable(),
});

export const analisisLlmSchema = z.object({
  que_ordena:        z.string().min(1).nullable(),
  admite_recurso:    z.preprocess(normalizar, z.enum(['Sí', 'Si', 'No', 'Depende'])).transform(v => v === 'Si' ? 'Sí' : v),
  plazo_respuesta:   z.string().optional().nullable(),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  pagos:             z.array(pagoSchema).optional().default([]),
  nivel_riesgo:      z.preprocess(normalizar, z.enum(['Bajo', 'Medio', 'Alto', 'Crítico', 'Critico'])).transform(v => v === 'Critico' ? 'Crítico' : v),
  resumen:           z.string().min(1).nullable(),
  hallazgos:         z.array(hallazgoSchema).default([]),
  normas_citadas:    z.array(normaCitadaSchema).default([]),
});
