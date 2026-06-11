import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    crearConformidad, 
    listarConformidades, 
    listarMisConformidades,
    actualizarEstadoConformidad, 
    obtenerTrazabilidad,
    obtenerEstadisticas,
    listarEstados, 
    listarGrupos,
    listarEntidades,
    listarInactivosEntidades,
    crearEntidad,
    actualizarEntidad,
    eliminarEntidad,
    recuperarEntidad,
    listarProyectos,
    crearProyecto,
    actualizarProyecto,
    eliminarProyecto,
    listarContratos,
    crearContrato,
    actualizarContrato,
    eliminarContrato,
    crearEstado,
    actualizarEstado,
    eliminarEstado,
    recuperarEstado,
    asignarGrupoAConformidad,
    eliminarGrupoDeConformidad
    } from '../controllers/conformidadesController.js';
    import { conformidadSchema, conformidadTrazabilidadSchema } from '../schemas/conformidadSchema.js';

    const router = Router();

    router.use(authenticateToken);

    router.post('/', checkPermission('conformidades', 'WRITE'), validate(conformidadSchema), crearConformidad);
    router.get('/stats', checkPermission('conformidades', 'READ'), obtenerEstadisticas);
    router.get('/mis-conformidades', checkPermission('conformidades', 'READ'), listarMisConformidades);
    router.get('/estados', checkPermission('conformidades', 'READ'), listarEstados);
    router.post('/estados', checkPermission('conformidades', 'WRITE'), crearEstado);
    router.patch('/estados/:id', checkPermission('conformidades', 'WRITE'), actualizarEstado);
    router.patch('/estados/:id/recuperar', checkPermission('conformidades', 'WRITE'), recuperarEstado);
    router.delete('/estados/:id', checkPermission('conformidades', 'WRITE'), eliminarEstado);
    router.get('/grupos', checkPermission('conformidades', 'READ'), listarGrupos);
    router.get('/entidades', checkPermission('conformidades', 'READ'), listarEntidades);
    router.get('/entidades/inactivas', checkPermission('conformidades', 'READ'), listarInactivosEntidades);
    router.post('/entidades', checkPermission('conformidades', 'WRITE'), crearEntidad);
    router.patch('/entidades/:id', checkPermission('conformidades', 'WRITE'), actualizarEntidad);
    router.patch('/entidades/:id/recuperar', checkPermission('conformidades', 'WRITE'), recuperarEntidad);
    router.delete('/entidades/:id', checkPermission('conformidades', 'WRITE'), eliminarEntidad);
    router.get('/proyectos', checkPermission('conformidades', 'READ'), listarProyectos);
    router.post('/proyectos', checkPermission('conformidades', 'WRITE'), crearProyecto);
    router.patch('/proyectos/:id', checkPermission('conformidades', 'WRITE'), actualizarProyecto);
    router.delete('/proyectos/:id', checkPermission('conformidades', 'WRITE'), eliminarProyecto);
    router.get('/contratos', checkPermission('conformidades', 'READ'), listarContratos);
    router.post('/contratos', checkPermission('conformidades', 'WRITE'), crearContrato);
    router.patch('/contratos/:id', checkPermission('conformidades', 'WRITE'), actualizarContrato);
    router.delete('/contratos/:id', checkPermission('conformidades', 'WRITE'), eliminarContrato);
    router.post('/:id/grupos', checkPermission('conformidades', 'WRITE'), asignarGrupoAConformidad);
    router.delete('/:id/grupos/:grupo_id', checkPermission('conformidades', 'WRITE'), eliminarGrupoDeConformidad);
    router.get('/', checkPermission('conformidades', 'READ'), listarConformidades);
    router.patch('/:id/estado', checkPermission('conformidades', 'WRITE'), validate(conformidadTrazabilidadSchema), actualizarEstadoConformidad);
    router.get('/:id/trazabilidad', checkPermission('conformidades', 'READ'), obtenerTrazabilidad);

export default router;
