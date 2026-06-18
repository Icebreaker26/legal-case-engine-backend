import { z } from 'zod';

export const minutaSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  tipo_contrato: z.string(),
  contenido_texto: z.string()
});

export const auditoriaSchema = z.object({
  minuta_estandar_id: z.string().uuid(),
  tercero_id: z.number().int(),
  nombre_tercero: z.string().optional() // Para mapeo si es necesario
});
