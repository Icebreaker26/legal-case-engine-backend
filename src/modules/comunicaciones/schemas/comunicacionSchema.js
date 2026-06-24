import { z } from 'zod';

export const comunicacionSchema = z.object({
    entidad_id: z.preprocess((val) => Number(val), z.number().int()),
    tipo: z.enum(['recibida', 'enviada']),
    asunto: z.string().min(1, "El asunto es obligatorio"),
    fecha_recepcion: z.string().min(1, "La fecha de recepción es obligatoria"),
    fecha_limite: z.string().optional().or(z.literal('')),
    responsable_uuid: z.string().uuid().nullable().optional().or(z.literal('')),
    descripcion: z.string().optional(),
    link: z.string().optional().or(z.literal('')),
});

export const actualizarComunicacionSchema = z.object({
    estado: z.enum(['pendiente', 'en_proceso', 'respondida']).optional(),
    responsable_uuid: z.string().uuid().nullable().optional().or(z.literal('')),
    asunto: z.string().min(1).optional(),
    descripcion: z.string().optional(),
    link: z.string().optional().or(z.literal('')),
}).strict();

export const grupoSchema = z.object({
    grupo_id: z.preprocess((val) => Number(val), z.number().int().positive()),
});

export const comentarioSchema = z.object({
    comentario: z.string().min(1, "El comentario es obligatorio"),
});
