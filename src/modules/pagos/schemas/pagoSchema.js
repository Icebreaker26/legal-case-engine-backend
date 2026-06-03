import { z } from 'zod';

export const pagoSchema = z.object({
    concepto: z.string().min(1, "El concepto es obligatorio"),
    monto: z.preprocess((val) => Number(val), z.number().positive("El monto debe ser positivo")),
    nit: z.string().min(1, "El NIT es obligatorio"),
    solicitante_id: z.preprocess((val) => Number(val), z.number().int()),
    fecha_solicitud: z.string().min(1, "La fecha de solicitud es obligatoria"),
    soportes_link: z.string().optional().or(z.literal('')),
});

export const pagoTrazabilidadSchema = z.object({
    comentario: z.string().min(1, "El comentario es obligatorio"),
    estado_nuevo: z.string().optional(),
});
