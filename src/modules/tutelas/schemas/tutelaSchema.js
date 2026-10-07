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
  radicado:          z.string().min(1).optional(),
  accionante:        z.string().min(1).optional(),
  sharepoint_link:   z.string().url().optional().or(z.literal('')),
  resultado_fallo:   z.string().optional(),
  responsable_uuid:  z.string().uuid().optional(),
  prioridad:         z.enum(['Alta', 'Media', 'Baja']).optional(),
  grupo_id:          z.preprocess(v => v != null ? Number(v) : undefined, z.number().int().positive().optional()),
  dias_termino:      z.preprocess(v => v != null ? Number(v) : undefined, z.number().int().min(1).optional()),
  derecho_vulnerado: z.string().optional(),
  // #108: el abogado debe confirmar o corregir la categoría explícitamente
  // antes de que la promoción automática a memoria legal la use como
  // `categoria` del documento — si no viene en true, la promoción se
  // posterga (no se descarta la respuesta Favorable, solo se difiere el
  // ingreso al corpus hasta que alguien confirme la categoría).
  categoria_confirmada: z.boolean().optional(),
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
  // Opcional: el frontend todavía no lo envía (#165) -- sin él, el voto se
  // registra en feedback_precedentes sin deduplicar por caso.
  tutela_id: z.string().uuid().nullable().optional(),
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

// #108: mismo gate de categoria_confirmada que actualizarDatosSchema.
export const promoverArgumentoSchema = z.object({
  categoria_confirmada: z.boolean().optional(),
});

// ── Responsables (asignación de usuarios) ────────────────────────────────────

export const asignarUsuariosSchema = z.object({
  usuarios_uuids: z.array(z.string().uuid()).min(1, 'Se requiere al menos un usuario.'),
});

// ── Admin tutelas ─────────────────────────────────────────────────────────────

// Patrones que coinciden con "todo el texto" y borrarían contenido legítimo
// sin lanzar ningún error — ver #139.
const PATRONES_CATASTROFICOS = [/^\.\*$/, /^\.\+$/, /^\[\s*\\?s\\S\]\*$/i, /^\[\s*\\?s\\S\]\+$/i, /^\[\^\]\*$/, /^\[\^\]\+$/];

const esPatronValido = (patron) => {
  try {
    // eslint-disable-next-line no-new
    new RegExp(patron, 'gi');
  } catch {
    return false;
  }
  return !PATRONES_CATASTROFICOS.some(p => p.test(patron.trim()));
};

export const crearNoiseSchema = z.object({
  patron:      z.string().min(1, 'El patrón es obligatorio.')
    .refine(esPatronValido, { message: 'El patrón no es un regex válido, o coincide con todo el texto (ej. ".*") y borraría el documento completo.' }),
  descripcion: z.string().optional(),
});

export const actualizarNoiseSchema = z.object({
  patron:      z.string().min(1).optional()
    .refine(p => p === undefined || esPatronValido(p), { message: 'El patrón no es un regex válido, o coincide con todo el texto (ej. ".*") y borraría el documento completo.' }),
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

// #146/#47 (frontend): indicador de cuánto tuvo que limpiar el frontend el
// JSON pegado por el abogado antes de mandarlo -- sin esto,
// TELEMETRIA_FALLO_FORMATO solo mide la tasa de fallo QUE SOBREVIVE a esa
// limpieza, no la adherencia real del LLM externo al formato pedido.
export const limpiezaJsonSchema = z.object({
  tenia_fences:          z.boolean(),
  texto_fuera_de_llaves: z.boolean(),
  chars_descartados:     z.number().int().min(0),
}).optional();

export const guardarRespuestaPeticionSchema = z.object({
  resultado_llm_json: z.string().min(1, 'El JSON del LLM es obligatorio.'),
  modo:               z.enum(['reemplazar', 'acumular']).default('acumular'),
  parte_index:        z.number().int().min(0).optional(),
  limpieza:           limpiezaJsonSchema,
});
