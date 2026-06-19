import { z } from 'zod';

export const objetivoSchema = z.object({
    usuario_uuid: z.string().uuid("El usuario es obligatorio"),
    meta_acciones: z.preprocess((val) => Number(val), z.number().int().positive()),
    mes: z.preprocess((val) => Number(val), z.number().int().min(1).max(12)),
    anio: z.preprocess((val) => Number(val), z.number().int().min(2026)),
    titulo: z.string().min(1, "El título es obligatorio").max(100),
    descripcion: z.string().optional(),
});

export const accionSchema = z.object({
    objetivo_id: z.string().uuid("El objetivo es obligatorio"),
    comentario: z.string().min(1, "El comentario es obligatorio"),
    peso: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().int().positive().optional()),
});

export const asignarEquipoSchema = z.object({
    equipo_id: z.preprocess((val) => Number(val), z.number().int().positive()),
    usuario_uuid: z.string().uuid("El usuario es obligatorio"),
});

export const removerEquipoSchema = z.object({
    usuario_uuid: z.string().uuid("El usuario es obligatorio"),
});
