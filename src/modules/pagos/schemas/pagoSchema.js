import { z } from 'zod';

export const pagoSchema = z.object({
    concepto: z.string().min(1, "El concepto es obligatorio"),
    monto: z.preprocess((val) => Number(val), z.number().positive("El monto debe ser positivo")),
    acreedor_id: z.preprocess((val) => Number(val), z.number().int()),
    fecha_solicitud: z.string().min(1, "La fecha de solicitud es obligatoria"),
    soportes_link: z.string().optional().or(z.literal('')),
    tipo_pago: z.enum(['ESTANDAR', 'PREDIAL']).default('ESTANDAR'),
    proyecto_id: z.preprocess((val) => Number(val), z.number().int()),
    wbe: z.string().optional().or(z.literal('')),
    metodo_pago: z.enum(['TRANSFERENCIA', 'CHEQUE']).default('TRANSFERENCIA'),
    codigo_sig: z.string().optional().or(z.literal('')),
});

export const pagoTrazabilidadSchema = z.object({
    comentario: z.string().min(1, "El comentario es obligatorio"),
    estado: z.string().min(1, "El estado es obligatorio"),
    pdp_sap_id: z.string().optional().or(z.literal('')),
    soportes_link: z.string().optional().or(z.literal('')),
    concepto: z.string().optional(),
    monto: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().positive().optional()),
    acreedor_id: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().int().optional()),
    tipo_pago: z.enum(['ESTANDAR', 'PREDIAL']).optional(),
    proyecto_id: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().int().optional()),
    wbe: z.string().optional().or(z.literal('')),
    metodo_pago: z.enum(['TRANSFERENCIA', 'CHEQUE']).optional(),
    codigo_sig: z.string().optional().or(z.literal('')),
});

export const grupoPagoSchema = z.object({
    grupo_id: z.preprocess((val) => Number(val), z.number().int().positive()),
});
