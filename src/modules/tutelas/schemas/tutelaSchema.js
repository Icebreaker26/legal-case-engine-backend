import { z } from 'zod';
// ── Validación en routes ───────────────────────────────────────────────────────
// guardarRespuestaPeticionSchema se importa también en routes para validate()

// ── Tutela principal ──────────────────────────────────────────────────────────

export const actualizarGestionSchema = z.object({
  radicado:          z.string().min(1).optional(),
  accionante:        z.string().min(1).optional(),
  sharepoint_link:   z.string().url().optional().or(z.literal('')),
  derecho_vulnerado: z.string().optional(),
  resultado_fallo:   z.string().optional(),
  grupo_id:          z.preprocess(v => v != null ? Number(v) : undefined, z.number().int().positive().optional()),
  responsable_uuid:  z.string().uuid().optional(),
});

export const actualizarDatosSchema = z.object({
  responsable_uuid:  z.string().uuid().optional(),
  prioridad:         z.enum(['Alta', 'Media', 'Baja']).optional(),
  grupo_id:          z.preprocess(v => v != null ? Number(v) : undefined, z.number().int().positive().optional()),
  dias_termino:      z.preprocess(v => v != null ? Number(v) : undefined, z.number().int().min(1).optional()),
  derecho_vulnerado: z.string().optional(),
});

export const gestionarResponsablesSchema = z.object({
  responsable_uuid: z.string().uuid().optional(),
  estado:           z.string().optional(),
  prioridad:        z.enum(['Alta', 'Media', 'Baja']).optional(),
  resultado_fallo:  z.string().optional(),
});

export const restaurarSchema = z.object({
  id:   z.number().int().positive({ message: 'ID requerido.' }),
  tipo: z.string().min(1, 'El tipo es obligatorio.'),
});

// ── Historial ─────────────────────────────────────────────────────────────────

export const agregarHistorialSchema = z.object({
  accion:              z.string().min(1, 'La acción es obligatoria.'),
  area_involucrada:    z.string().optional(),
  responsable_uuid:    z.string().uuid().optional(),
  fecha_seguimiento:   z.string().optional(),
});

// ── Borrador ──────────────────────────────────────────────────────────────────

export const guardarBorradorSchema = z.object({
  borrador: z.string().min(1, 'El borrador no puede estar vacío.'),
});

export const actualizarBorradorSchema = z.object({
  contestacion_generada: z.string().min(1, 'El contenido del borrador es obligatorio.'),
});

// ── Memoria / RAG ─────────────────────────────────────────────────────────────

export const feedbackMemoriaSchema = z.object({
  util: z.boolean({ required_error: 'El campo útil es obligatorio.' }),
});

export const entrenarLocalSchema = z.object({
  categoria:        z.string().min(1, 'La categoría es obligatoria.'),
  contenido_legal:  z.string().optional(),
  titulo_referencia: z.string().optional(),
  es_exitosa:       z.boolean().optional(),
});

// ── Requerimientos internos ───────────────────────────────────────────────────

export const crearRequerimientoSchema = z.object({
  grupo_id:    z.preprocess(v => Number(v), z.number().int().positive('El grupo es obligatorio.')),
  descripcion: z.string().min(1, 'La descripción es obligatoria.'),
  prioridad:   z.enum(['Alta', 'Media', 'Baja']).optional(),
  fecha_limite: z.string().optional(),
});

export const actualizarRequerimientoSchema = z.object({
  estado:         z.string().optional(),
  respuesta_texto: z.string().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

export const responderRequerimientoSchema = z.object({
  respuesta_texto: z.string().min(1, 'La respuesta no puede estar vacía.'),
});

// ── Argumentos ────────────────────────────────────────────────────────────────

export const crearArgumentoSchema = z.object({
  titulo:    z.string().min(1, 'El título es obligatorio.'),
  contenido: z.string().min(1, 'El contenido es obligatorio.'),
});

export const actualizarArgumentoSchema = z.object({
  titulo:    z.string().min(1).optional(),
  contenido: z.string().min(1).optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

// ── Responsables (asignación de usuarios) ────────────────────────────────────

export const asignarUsuariosSchema = z.object({
  usuarios_uuids: z.array(z.string().uuid()).min(1, 'Se requiere al menos un usuario.'),
});

// ── Admin tutelas ─────────────────────────────────────────────────────────────

export const crearNoiseSchema = z.object({
  patron:      z.string().min(1, 'El patrón es obligatorio.'),
  descripcion: z.string().optional(),
});

export const actualizarNoiseSchema = z.object({
  patron:      z.string().min(1).optional(),
  descripcion: z.string().optional(),
  activo:      z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' });

export const actualizarROISchema = z.object({
  tiempo_ahorrado_minutos: z.preprocess(v => Number(v), z.number().int().positive('Debe ser un número positivo.')),
  costo_hora_juridico:     z.preprocess(v => Number(v), z.number().positive('Debe ser un número positivo.')),
});

export const actualizarConfigSchema = z.object({
  key:   z.string().min(1, 'La clave es obligatoria.'),
  value: z.any(),
});

// ── Respuestas de petición (JSON del LLM) ─────────────────────────────────────

export const respuestaItemLlmSchema = z.object({
  numero:         z.number().int().positive(),
  solicitud:      z.string().min(1),
  respuesta:      z.string().min(1),
  normas_citadas: z.array(z.string()).default([]),
});

export const prescripcionLlmSchema = z.object({
  aplica:      z.boolean(),
  fundamento:  z.string().nullable().optional(),
  norma:       z.string().nullable().optional(),
});

export const respuestaLlmSchema = z.object({
  encabezado: z.object({
    ciudad_fecha:      z.string(),
    para:              z.string(),
    radicado_peticion: z.string(),
    asunto:            z.string(),
  }).optional(),
  introduccion: z.string().optional(),
  respuestas:   z.array(respuestaItemLlmSchema).min(1, 'Se requiere al menos una respuesta.'),
  prescripcion: prescripcionLlmSchema.nullable().optional(),
  cierre:       z.string().optional(),
});

export const guardarRespuestaPeticionSchema = z.object({
  resultado_llm_json: z.string().min(1, 'El JSON del LLM es obligatorio.'),
  modo:               z.enum(['reemplazar', 'acumular']).default('acumular'),
  parte_index:        z.number().int().min(0).optional(),
});
