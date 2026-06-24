import { z } from 'zod';

export const crearAreaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
});

export const actualizarAreaSchema = z.object({
  nombre: z.string().min(1).optional(),
  activo: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'Se requiere al menos un campo.' });

export const actualizarUsuarioSchema = z.object({
  activo: z.boolean().optional(),
  is_approved: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'Se requiere al menos un campo.' });

export const cambiarRolSchema = z.object({
  rol: z.enum(['admin', 'abogado', 'viewer'], { required_error: 'El rol es obligatorio.' }),
});

export const resetearPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres.').optional(),
});
