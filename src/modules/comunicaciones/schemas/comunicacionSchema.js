import { z } from 'zod';

export const comunicacionSchema = z.object({
    entidad_id: z.preprocess((val) => Number(val), z.number().int()),
    tipo: z.enum(['recibida', 'enviada']),
    asunto: z.string().min(1, "El asunto es obligatorio"),
    fecha_recepcion: z.string().min(1, "La fecha de recepción es obligatoria"),
    fecha_limite: z.string().optional().or(z.literal('')),
    responsable_id: z.preprocess((val) => val ? Number(val) : null, z.number().int().nullable().optional()),
    descripcion: z.string().optional(),
    link: z.string().optional().or(z.literal('')),
});

export const comentarioSchema = z.object({
    comentario: z.string().min(1, "El comentario es obligatorio"),
});
