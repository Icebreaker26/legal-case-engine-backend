import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    crearComunicacion, 
    listarComunicaciones, 
    actualizarComunicacion, 
    eliminarComunicacion,
    archivarComunicacion,
    recuperarComunicacion,
    marcarComoRespondida,
    agregarComentario,
    listarComentarios,
    obtenerEstadisticas,
    listarEntidades,
    crearEntidad,
    actualizarEntidad,
    eliminarEntidad,
    recuperarEntidad,
    listarInactivosEntidades,
    listarGrupos,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo,
    recuperarGrupo,
    listarInactivosGrupos,
    asignarGrupoAComunicacion,
    eliminarGrupoDeComunicacion
} from '../controllers/comunicacionesController.js';
import { comunicacionSchema, comentarioSchema } from '../schemas/comunicacionSchema.js';

const router = Router();

router.use(authenticateToken);

router.post('/', checkPermission('comunicaciones', 'WRITE_COM'), validate(comunicacionSchema), crearComunicacion);
router.get('/stats', checkPermission('comunicaciones', 'READ_COM'), obtenerEstadisticas);
router.get('/', checkPermission('comunicaciones', 'READ_COM'), listarComunicaciones);
router.get('/entidades', checkPermission('comunicaciones', 'READ_COM'), listarEntidades);
router.get('/entidades/inactivas', checkPermission('comunicaciones', 'READ_COM'), listarInactivosEntidades);
router.post('/entidades', checkPermission('comunicaciones', 'MANAGE_COM'), crearEntidad);
router.patch('/entidades/:id', checkPermission('comunicaciones', 'MANAGE_COM'), actualizarEntidad);
router.patch('/entidades/:id/recuperar', checkPermission('comunicaciones', 'MANAGE_COM'), recuperarEntidad);
router.delete('/entidades/:id', checkPermission('comunicaciones', 'MANAGE_COM'), eliminarEntidad);

router.get('/grupos', checkPermission('comunicaciones', 'READ_COM'), listarGrupos);
router.get('/grupos/inactivos', checkPermission('comunicaciones', 'READ_COM'), listarInactivosGrupos);
router.post('/grupos', checkPermission('comunicaciones', 'MANAGE_COM'), crearGrupo);
router.patch('/grupos/:id', checkPermission('comunicaciones', 'MANAGE_COM'), actualizarGrupo);
router.patch('/grupos/:id/recuperar', checkPermission('comunicaciones', 'MANAGE_COM'), recuperarGrupo);
router.delete('/grupos/:id', checkPermission('comunicaciones', 'MANAGE_COM'), eliminarGrupo);
router.post('/:id/grupos', checkPermission('comunicaciones', 'WRITE_COM'), asignarGrupoAComunicacion);
router.delete('/:id/grupos/:grupo_id', checkPermission('comunicaciones', 'WRITE_COM'), eliminarGrupoDeComunicacion);
router.patch('/:id', checkPermission('comunicaciones', 'WRITE_COM'), actualizarComunicacion);
router.patch('/:id/archivar', checkPermission('comunicaciones', 'WRITE_COM'), archivarComunicacion);
router.patch('/:id/recuperar', checkPermission('comunicaciones', 'WRITE_COM'), recuperarComunicacion);
router.patch('/:id/respondida', checkPermission('comunicaciones', 'WRITE_COM'), marcarComoRespondida);
router.delete('/:id', checkPermission('comunicaciones', 'DELETE_COM'), eliminarComunicacion);

router.post('/:id/comentarios', checkPermission('comunicaciones', 'WRITE_COM'), validate(comentarioSchema), agregarComentario);
router.get('/:id/comentarios', checkPermission('comunicaciones', 'READ_COM'), listarComentarios);

export default router;
