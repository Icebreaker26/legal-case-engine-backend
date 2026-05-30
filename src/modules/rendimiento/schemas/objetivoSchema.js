import { z } from 'zod';

export const objetivoSchema = z.object({
    usuario_id: z.number().int(),
    meta_acciones: z.number().int().positive(),
    mes: z.number().int().min(1).max(12),
    anio: z.number().int().min(2026),
    titulo: z.string().min(1, "El título es obligatorio").max(100),
    descripcion: z.string().optional(),
});
