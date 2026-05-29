/**
 * Módulo de Tutelas
 * 
 * Define las rutas relacionadas con la gestión, trazabilidad y memoria legal de las tutelas.
 * Este router es cargado dinámicamente por el servidor en 'src/index.js'.
 */
import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../middlewares/authMiddleware.js';
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

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Gestión de Tutelas
router.get('/', listarTutelas); 
router.post('/procesar', upload.single('documento'), procesarTutela);
router.patch('/:id', actualizarGestionTutela); 
router.delete('/:id', eliminarTutela);
router.patch('/:id/datos', actualizarDatosTutela);
router.patch('/:id/responsables', gestionarResponsablesTutela);
router.get('/:id/descargar', descargarWord);
router.post('/:id/generar-borrador', generarBorradorContestacion);
router.post('/:id/refinar-borrador', refinarBorrador);
router.get('/:id/sugerencias', obtenerSugerenciasTutela); 
router.get('/documento-referencia/:documento_id', obtenerContenidoCompletoSugerencia);

// Requerimientos Internos
router.get('/:id/requerimientos', listarRequerimientosInternos);
router.post('/:id/requerimientos', crearRequerimientoInterno);
router.patch('/requerimientos/:reqId', actualizarEstadoRequerimiento);

// Trazabilidad (Log de Acciones)
router.get('/:id/historial', obtenerHistorialTutela);
router.post('/:id/historial', agregarAccionHistorial);

// Memoria Legal (Búsqueda Semántica)
router.post('/entrenar-local', upload.single('documento'), entrenarContextoLocal);
router.get('/memoria', listarBaseConocimiento);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/categorias', listarCategorias);
router.get('/festivos', listarFestivos);
router.get('/papelera', listarPapelera);
router.post('/restaurar', restaurarRegistro);
router.delete('/memoria/:documento_id', eliminarBaseConocimiento);

export default router;