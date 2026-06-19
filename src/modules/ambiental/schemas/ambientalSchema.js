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
  responsable_uuid: z.string().uuid().optional(),
  grupo_id:         z.preprocess(v => v !== undefined ? Number(v) : undefined, z.number().int().positive()).optional(),
  fecha_documento:  z.string().optional(),
  estado:           z.enum(['Pendiente', 'Analizado', 'Revisado', 'Archivado']).optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

const hallazgoSchema = z.object({
  numero:          z.number().int().positive(),
  tipo:            z.enum(['Incumplimiento', 'Riesgo', 'Observación', 'Buena práctica']),
  descripcion:     z.string().min(1),
  norma_infringida: z.string().optional(),
  recomendacion:   z.string().optional(),
  prioridad:       z.enum(['Alta', 'Media', 'Baja']),
});

const normaCitadaSchema = z.object({
  instrumento: z.string().min(1),
  articulo:    z.string().optional(),
  descripcion: z.string().optional(),
});

export const guardarAnalisisSchema = z.object({
  resultado_llm_json: z.string().min(1, 'La respuesta del LLM es obligatoria.'),
});

export const analisisLlmSchema = z.object({
  que_ordena:     z.string().min(1),
  admite_recurso: z.enum(['Sí', 'No', 'Depende']),
  plazo_respuesta: z.string().min(1),
  nivel_riesgo:   z.enum(['Bajo', 'Medio', 'Alto', 'Crítico']),
  resumen:        z.string().min(1),
  hallazgos:      z.array(hallazgoSchema).min(1),
  normas_citadas: z.array(normaCitadaSchema),
});
