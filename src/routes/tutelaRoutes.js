import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middlewares/authMiddleware.js';
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
    actualizarDatosTutela
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
router.get('/:id/descargar', descargarWord);
router.get('/:id/sugerencias', obtenerSugerenciasTutela); 
router.get('/documento-referencia/:documento_id', obtenerContenidoCompletoSugerencia);

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