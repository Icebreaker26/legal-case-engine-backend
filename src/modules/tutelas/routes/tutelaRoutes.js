/**
 * Módulo de Tutelas
 * 
 * Define las rutas relacionadas con la gestión, trazabilidad y memoria legal de las tutelas.
 * Este router es cargado dinámicamente por el servidor en 'src/index.js'.
 */
import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
import { checkPermission } from '../../../middlewares/permissionMiddleware.js';
import { 
    procesarTutela, 
    descargarWord, 
    entrenarContextoLocal, 
    actualizarGestionTutela, 
    listarTutelas,
    obtenerSugerenciasTutela,
    obtenerHistorialTutela,
    agregarAccionHistorial,
    obtenerContenidoCompletoSugerencia,
    listarBaseConocimiento,
    eliminarBaseConocimiento,
    eliminarTutela,
    listarPapelera,
    restaurarRegistro,
    listarCategorias,
    listarFestivos,
    obtenerEstadisticas,
    actualizarDatosTutela,
    gestionarResponsablesTutela,
    generarBorradorContestacion,
    refinarBorrador,
    crearRequerimientoInterno,
    listarRequerimientosInternos,
    actualizarEstadoRequerimiento
} from '../controllers/tutelaController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Aplicar autenticación base
router.use(authenticateToken);

// Gestión de Tutelas
router.get('/', checkPermission('tutelas', 'READ'), listarTutelas); 
router.post('/procesar', checkPermission('tutelas', 'WRITE'), upload.single('documento'), procesarTutela);
router.patch('/:id', checkPermission('tutelas', 'WRITE'), actualizarGestionTutela); 
router.delete('/:id', checkPermission('tutelas', 'DELETE'), eliminarTutela);
router.patch('/:id/datos', checkPermission('tutelas', 'WRITE'), actualizarDatosTutela);
router.patch('/:id/responsables', checkPermission('tutelas', 'WRITE'), gestionarResponsablesTutela);
router.get('/:id/descargar', checkPermission('tutelas', 'READ'), descargarWord);
router.post('/:id/generar-borrador', checkPermission('tutelas', 'WRITE'), generarBorradorContestacion);
router.post('/:id/refinar-borrador', checkPermission('tutelas', 'WRITE'), refinarBorrador);
router.get('/:id/sugerencias', checkPermission('tutelas', 'READ'), obtenerSugerenciasTutela); 
router.get('/documento-referencia/:documento_id', checkPermission('tutelas', 'READ'), obtenerContenidoCompletoSugerencia);

// Requerimientos Internos
router.get('/:id/requerimientos', checkPermission('tutelas', 'READ'), listarRequerimientosInternos);
router.post('/:id/requerimientos', checkPermission('tutelas', 'WRITE'), crearRequerimientoInterno);
router.patch('/requerimientos/:reqId', checkPermission('tutelas', 'WRITE'), actualizarEstadoRequerimiento);

// Trazabilidad (Log de Acciones)
router.get('/:id/historial', checkPermission('tutelas', 'READ'), obtenerHistorialTutela);
router.post('/:id/historial', checkPermission('tutelas', 'WRITE'), agregarAccionHistorial);

// Memoria Legal (Búsqueda Semántica)
router.post('/entrenar-local', checkPermission('tutelas', 'WRITE'), upload.single('documento'), entrenarContextoLocal);
router.get('/memoria', checkPermission('tutelas', 'READ'), listarBaseConocimiento);
router.get('/estadisticas', checkPermission('tutelas', 'READ'), obtenerEstadisticas);
router.get('/categorias', checkPermission('tutelas', 'READ'), listarCategorias);
router.get('/festivos', checkPermission('tutelas', 'READ'), listarFestivos);
router.get('/papelera', checkPermission('tutelas', 'READ'), listarPapelera);
router.post('/restaurar', checkPermission('tutelas', 'WRITE'), restaurarRegistro);
router.delete('/memoria/:documento_id', checkPermission('tutelas', 'DELETE'), eliminarBaseConocimiento);

export default router;