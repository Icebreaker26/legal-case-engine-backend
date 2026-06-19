import { z } from 'zod';

const permisoBase = z.object({
  usuario_uuid: z.string().uuid('UUID de usuario inválido.'),
  modulo:       z.string().min(1, 'El módulo es obligatorio.'),
  accion:       z.string().min(1, 'La acción es obligatoria.'),
});

export const asignarPermisoSchema    = permisoBase;
export const revocarPermisoSchema    = permisoBase;

export const asignarMasivoSchema = z.object({
  usuario_uuid: z.string().uuid('UUID de usuario inválido.'),
  permisos: z.array(z.object({
    modulo: z.string().min(1),
    accion: z.string().min(1),
  })).min(1, 'Se requiere al menos un permiso.'),
});
