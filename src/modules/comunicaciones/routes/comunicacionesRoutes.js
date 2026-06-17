import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { validate } from '../../../middlewares/validateMiddleware.js';
import { 
    crearComunicacion, 
    listarComunicaciones, 
    listarMisComunicaciones,
    actualizarComunicacion, 
    eliminarComunicacion,
    archivarComunicacion,
    recuperarComunicacion,
    marcarComoRespondida,
    agregarComentario,
    listarComentarios,
    obtenerEstadisticas,
    listarEntidades,
    listarGrupos,
    asignarGrupoAComunicacion,
    eliminarGrupoDeComunicacion
} from '../controllers/comunicacionesController.js';
import { comunicacionSchema, comentarioSchema } from '../schemas/comunicacionSchema.js';

const router = Router();

router.use(authenticateToken);

router.post('/', checkPermission('comunicaciones', 'WRITE_COM'), validate(comunicacionSchema), crearComunicacion);
router.get('/stats', checkPermission('comunicaciones', 'READ_COM'), obtenerEstadisticas);
router.get('/mis-comunicaciones', checkPermission('comunicaciones', 'READ_COM'), listarMisComunicaciones);
router.get('/', checkPermission('comunicaciones', 'READ_COM'), listarComunicaciones);

// Las rutas de Entidades y Grupos ahora deben apuntar a /api/core/
router.get('/entidades', checkPermission('comunicaciones', 'READ_COM'), listarEntidades);
router.get('/grupos', checkPermission('comunicaciones', 'READ_COM'), listarGrupos);

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
