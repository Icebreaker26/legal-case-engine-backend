import { z } from 'zod';

export const equipoSchema = z.object({
    nombre: z.string().min(1, "El nombre del equipo es obligatorio"),
    manager_id: z.number().int().optional(),
});
