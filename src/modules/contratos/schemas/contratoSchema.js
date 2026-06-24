import { z } from 'zod';

// ── Minutas estándar ──────────────────────────────────────────────────────────

export const crearMinutaSchema = z.object({
  titulo:          z.string().min(1, 'El título es obligatorio.'),
  tipo_contrato:   z.string().min(1, 'El tipo de contrato es obligatorio.'),
  contenido_texto: z.string().min(1, 'El contenido es obligatorio.'),
  descripcion:     z.string().optional(),
});

export const actualizarMinutaSchema = z.object({
  titulo:          z.string().min(1).optional(),
  tipo_contrato:   z.string().min(1).optional(),
  contenido_texto: z.string().min(1).optional(),
  descripcion:     z.string().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

// ── Auditorías ────────────────────────────────────────────────────────────────

export const crearAuditoriaSchema = z.object({
  minuta_estandar_id:      z.string().uuid('La minuta es obligatoria y debe ser un UUID válido.'),
  tercero_id:              z.preprocess(v => Number(v), z.number().int().positive('El tercero es obligatorio.')),
  prompt_generado:         z.string().optional(),
  contenido_tercero_texto: z.string().optional(),
});

export const actualizarAuditoriaSchema = z.object({
  resultado_llm_texto: z.string().optional(),
  resultado_llm_json:  z.record(z.unknown()).optional(),
  estado_seguimiento:  z.string().optional(),
  fecha_seguimiento:   z.string().optional(),
  prompt_generado:     z.string().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

export const regenerarPromptSchema = z.object({
  minuta_estandar_id: z.string().uuid('minuta_estandar_id debe ser un UUID válido.'),
});
