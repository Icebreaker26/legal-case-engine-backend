import { z } from 'zod';

export const conformidadSchema = z.object({
    concepto: z.string().min(1, "El concepto es obligatorio"),
    entidad_id: z.preprocess((val) => Number(val), z.number().int("La entidad es obligatoria")),
    proyecto_id: z.preprocess((val) => Number(val), z.number().int("El proyecto es obligatorio")),
    contrato_id: z.preprocess((val) => Number(val), z.number().int("El contrato es obligatorio")),
    responsable_id: z.preprocess((val) => Number(val), z.number().int("El responsable es obligatorio")),
    solicitante_id: z.preprocess((val) => Number(val), z.number().int()),
    fecha_recepcion: z.string().min(1, "La fecha de recepción es obligatoria"),
    fecha_solicitud: z.string().min(1, "La fecha de solicitud es obligatoria"),
    ot: z.string().min(1, "La OT es obligatoria"),
    wbe: z.string().min(1, "El WBE es obligatorio"),
    valor: z.preprocess((val) => Number(val), z.number().positive("El valor debe ser positivo")),
    link_acta: z.string().optional().or(z.literal('')),
    soportes_link: z.string().optional().or(z.literal('')),
});

export const conformidadTrazabilidadSchema = z.object({
    comentario: z.string().min(1, "El comentario es obligatorio"),
    estado_nuevo: z.string().optional(),
    estado_anterior: z.string().optional(),
    
    // Nuevos campos para actualización
    hoja_contable_normal: z.string().optional().or(z.literal('')),
    hoja_contable_reembolsable: z.string().optional().or(z.literal('')),
    numero_conformidad: z.string().optional().or(z.literal('')),
});
