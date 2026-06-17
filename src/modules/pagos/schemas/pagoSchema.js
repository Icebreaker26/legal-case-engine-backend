import { z } from 'zod';

export const pagoSchema = z.object({
    concepto: z.string().min(1, "El concepto es obligatorio"),
    monto: z.preprocess((val) => Number(val), z.number().positive("El monto debe ser positivo")),
    acreedor_id: z.preprocess((val) => Number(val), z.number().int()),
    solicitante_uuid: z.string().uuid("UUID de solicitante inválido").optional(),
    fecha_solicitud: z.string().min(1, "La fecha de solicitud es obligatoria"),
    soportes_link: z.string().optional().or(z.literal('')),
    
    // Nuevos campos
    tipo_pago: z.enum(['ESTANDAR', 'PREDIAL']).default('ESTANDAR'),
    proyecto_id: z.preprocess((val) => Number(val), z.number().int()),
    wbe: z.string().optional().or(z.literal('')),
    metodo_pago: z.enum(['TRANSFERENCIA', 'CHEQUE']).default('TRANSFERENCIA'),
    codigo_sig: z.string().optional().or(z.literal('')),
    
    // Campos antiguos (para compatibilidad o si se siguen enviando)
    nit: z.string().optional(),
    solicitante_id: z.number().optional()
});

export const pagoTrazabilidadSchema = z.object({
    comentario: z.string().min(1, "El comentario es obligatorio"),
    estado: z.string().optional(),
    
    // Permitir edición de campos básicos en el mismo patch si es necesario
    concepto: z.string().optional(),
    monto: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
    acreedor_id: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().optional()),
    tipo_pago: z.enum(['ESTANDAR', 'PREDIAL']).optional(),
    proyecto_id: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().optional()),
    wbe: z.string().optional(),
    metodo_pago: z.enum(['TRANSFERENCIA', 'CHEQUE']).optional(),
    codigo_sig: z.string().optional(),
    soportes_link: z.string().optional(),
    pdp_sap_id: z.string().optional()
});
