import { z } from 'zod';

export const crearCatalogoSchema = z.object({
  nombre:  z.string().min(1, 'El nombre es obligatorio.').optional(),
  numero:  z.string().min(1, 'El número es obligatorio.').optional(),
  nit:     z.string().optional(),
  banco:   z.string().optional(),
  cuenta:  z.string().optional(),
}).refine(data => data.nombre || data.numero, {
  message: 'Se requiere nombre o número.',
});

export const actualizarCatalogoSchema = z.object({
  nombre:    z.string().min(1).optional(),
  numero:    z.string().min(1).optional(),
  is_active: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'Se requiere al menos un campo.' });
