import { z } from 'zod';

const MODULOS_VALIDOS = ['pagos', 'comunicaciones', 'conformidades', 'tutelas', 'ambiental', 'contratos'];

export const reportesFiltrosSchema = z.object({
  modulos: z.array(z.enum(MODULOS_VALIDOS)).min(1).optional(),
  entidad_id:      z.preprocess(v => v === null || v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  proyecto_id:     z.preprocess(v => v === null || v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  contrato_id:     z.preprocess(v => v === null || v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  grupo_id:        z.preprocess(v => v === null || v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  acreedor_id:     z.preprocess(v => v === null || v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  responsable_uuid: z.string().uuid().optional().nullable(),
  fecha_desde:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  fecha_hasta:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  estado:          z.string().optional().nullable(),
});
