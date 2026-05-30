import { z } from 'zod';

export const objetivoSchema = z.object({
    usuario_id: z.number().int(),
    meta_acciones: z.number().int().positive(),
    periodo_inicio: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida" }),
    periodo_fin: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida" }),
});
