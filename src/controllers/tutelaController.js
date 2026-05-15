import { extraerTextoPdf } from '../services/pdfService.js';
import { generarEmbeddingLocal } from '../services/aiService.js';
import { buscarContextoLegal } from '../services/vectorService.js';
import { generarDocumentoWord } from '../services/docxService.js';
import { dividirEnChunks } from '../services/chunkService.js';
import { extraerDatosTutela } from '../services/extractorService.js';
import { limpiarTexto } from '../services/cleanerService.js';
import { registrarLog } from '../services/auditService.js';
import pool from '../db/database.js';
import { ESTADOS, PRIORIDADES } from '../constants.js';
import { v4 as uuidv4 } from 'uuid';

const limpiarTextoParaPostgres = (texto) => {
  if (!texto) return '';
  return texto.replace(/\0/g, ''); 
};

export const listarBaseConocimiento = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (documento_id) categoria, titulo_referencia, documento_id, created_at 
      FROM base_conocimiento_enel 
      WHERE is_active = TRUE
      ORDER BY documento_id, created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar la base de conocimiento.' });
  }
};

export const listarCategorias = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre FROM categorias_juridicas WHERE activo = TRUE ORDER BY nombre ASC');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar categorías.' });
  }
};

export const eliminarBaseConocimiento = async (req, res) => {
  try {
    const { documento_id } = req.params;
    await pool.query('UPDATE base_conocimiento_enel SET is_active = FALSE WHERE documento_id = $1', [documento_id]);
    await registrarLog(req.user.id, 'ELIMINAR_MEMORIA', 'memoria', 0, req, { documento_id });
    res.status(200).json({ mensaje: 'Documento desactivado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el documento.' });
  }
};

export const listarPapelera = async (req, res) => {
  try {
    const tutelas = await pool.query('SELECT *, \'tutela\' as tipo FROM tutelas WHERE is_active = FALSE;');
    const memoria = await pool.query('SELECT *, \'memoria\' as tipo FROM base_conocimiento_enel WHERE is_active = FALSE;');
    
    res.status(200).json({
      tutelas: tutelas.rows,
      memoria: memoria.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar la papelera.' });
  }
};

export const restaurarRegistro = async (req, res) => {
  try {
    const { id, tipo } = req.body;
    let query = '';
    let params = [];

    if (tipo === 'tutela') {
      query = 'UPDATE tutelas SET is_active = TRUE WHERE id = $1';
      params = [id];
      await registrarLog(req.user.id, 'RESTAURAR_TUTELA', 'tutela', id, req, { id });
    } else if (tipo === 'memoria') {
      query = 'UPDATE base_conocimiento_enel SET is_active = TRUE WHERE documento_id = $1';
      params = [id];
      await registrarLog(req.user.id, 'RESTAURAR_MEMORIA', 'memoria', 0, req, { documento_id: id });
    } else {
      return res.status(400).json({ error: 'Tipo de registro no válido.' });
    }

    await pool.query(query, params);
    res.status(200).json({ mensaje: 'Registro restaurado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restaurar el registro.' });
  }
};
import Holidays from 'date-holidays';

const hd = new Holidays('CO');

const sumarDiasHabiles = (fecha, dias) => {
    let fechaResult = new Date(fecha);
    let contador = 0;
    while (contador < dias) {
        fechaResult.setDate(fechaResult.getDate() + 1);
        let diaSemana = fechaResult.getDay();
        // Saltar fines de semana y festivos de Colombia
        if (diaSemana !== 0 && diaSemana !== 6 && !hd.isHoliday(fechaResult)) {
            contador++;
        }
    }
    return fechaResult;
};

export const listarFestivos = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const holidays = hd.getHolidays(year);
    res.status(200).json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar festivos.' });
  }
};

export const obtenerEstadisticas = async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('month', fecha_recepcion) as mes,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Finalizada' THEN 1 ELSE 0 END) as resueltas
      FROM tutelas 
      WHERE is_active = TRUE
      GROUP BY mes 
      ORDER BY mes ASC LIMIT 6;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
};

export const actualizarDatosTutela = async (req, res) => {
  try {
    const { id } = req.params;
    const { radicado, accionante } = req.body;
    
    await pool.query('UPDATE tutelas SET radicado = $1, accionante = $2 WHERE id = $3', [radicado, accionante, id]);
    await registrarLog(req.user.id, 'ACTUALIZAR_DATOS_TUTELA', 'tutela', id, req, { radicado, accionante });
    
    res.status(200).json({ message: 'Datos actualizados correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar datos.' });
  }
};

export const procesarTutela = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Debes subir un archivo PDF.' });

    const { responsable_id, prioridad = PRIORIDADES.MEDIA, area_responsable, dias_termino = 2 } = req.body;
    const textoPdfRaw = await extraerTextoPdf(req.file.buffer);
    const textoPdfLimpio = await limpiarTexto(textoPdfRaw);
    const textoPdf = limpiarTextoParaPostgres(textoPdfLimpio);

    if (!textoPdf || textoPdf.trim().length === 0) return res.status(400).json({ error: 'El PDF no contiene texto legible.' });

    const fechaVencimiento = sumarDiasHabiles(new Date(), parseInt(dias_termino) || 2);

    const textoParaVector = textoPdf.substring(0, 1500); 
    const vectorLocal = await generarEmbeddingLocal(textoParaVector);
    const precedentesExitosos = await buscarContextoLegal(vectorLocal);

    const datosExtraidos = await extraerDatosTutela(textoPdf);

    const queryInsert = `
      INSERT INTO tutelas (radicado, accionante, juzgado, derecho_vulnerado, responsable_id, fecha_recepcion, fecha_vencimiento, prioridad, area_responsable, dias_termino, estado, contenido_original)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (radicado) DO UPDATE SET responsable_id = EXCLUDED.responsable_id, prioridad = EXCLUDED.prioridad, updated_at = NOW()
      RETURNING id;
    `;

    const values = [
      datosExtraidos.radicado !== 'POR DEFINIR' ? datosExtraidos.radicado : 'REF_' + Date.now(), 
      datosExtraidos.accionante, datosExtraidos.juzgado, datosExtraidos.derecho_vulnerado,
      responsable_id && responsable_id !== '' ? parseInt(responsable_id) : null,
      fechaVencimiento, prioridad, area_responsable || 'General', parseInt(dias_termino) || 2, ESTADOS.PENDIENTE, textoPdf
    ];
    
    const dbResult = await pool.query(queryInsert, values);
    await registrarLog(req.user.id, 'CREAR_TUTELA', 'tutela', dbResult.rows[0].id, req, { radicado: datosExtraidos.radicado });

    res.status(200).json({ mensaje: 'Tutela registrada', id_tutela: dbResult.rows[0].id, sugerencias: precedentesExitosos });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar tutela.' });
  }
};

export const actualizarGestionTutela = async (req, res) => {
  try {
    const { id } = req.params;
    const { responsable_id, estado, prioridad, resultado_fallo } = req.body;

    const { rows } = await pool.query('SELECT estado FROM tutelas WHERE id = $1', [id]);
    const estadoAnterior = rows[0]?.estado;

    const query = 'UPDATE tutelas SET responsable_id = COALESCE($1, responsable_id), estado = COALESCE($2, estado), prioridad = COALESCE($3, prioridad), resultado_fallo = COALESCE($4, resultado_fallo), updated_at = NOW() WHERE id = $5 RETURNING id;';
    const { rowCount } = await pool.query(query, [responsable_id, estado, prioridad, resultado_fallo, id]);

    if (rowCount === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const desc = (estado && estado !== estadoAnterior) ? `Cambio de estado: ${estadoAnterior} -> ${estado}` : 'Actualización de gestión';
    await registrarLog(req.user.id, desc, 'tutela', id, req, { estado, prioridad });
    res.status(200).json({ mensaje: 'Gestión actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar.' });
  }
};

export const listarTutelas = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT t.*, a.nombre as responsable_nombre FROM tutelas t LEFT JOIN abogados a ON t.responsable_id = a.id WHERE t.is_active = TRUE ORDER BY t.fecha_vencimiento ASC;');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista.' });
  }
};

export const eliminarTutela = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE tutelas SET is_active = FALSE WHERE id = $1', [id]);
    await registrarLog(req.user.id, 'ELIMINAR_TUTELA', 'tutela', id, req, { id });
    res.status(200).json({ mensaje: 'Tutela desactivada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar la tutela.' });
  }
};

export const obtenerSugerenciasTutela = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT contenido_original FROM tutelas WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });
    
    const textoOriginal = rows[0].contenido_original || '';
    const vectorLocal = await generarEmbeddingLocal(textoOriginal.substring(0, 1500));
    res.status(200).json(await buscarContextoLegal(vectorLocal, textoOriginal));
  } catch (error) {
    res.status(500).json({ error: 'Error al generar sugerencias.' });
  }
};

export const obtenerContenidoCompletoSugerencia = async (req, res) => {
  try {
    const { documento_id } = req.params;
    if (!documento_id || documento_id === 'null' || documento_id === 'undefined') {
        return res.status(400).json({ error: 'ID de documento no válido.' });
    }

    const query = `
      SELECT contenido_legal 
      FROM base_conocimiento_enel 
      WHERE documento_id = $1 
      ORDER BY id ASC;
    `;
    const { rows } = await pool.query(query, [documento_id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado o no tiene referencia completa.' });
    
    // Merge logic: Take the first chunk, then for each subsequent chunk, 
    // remove the overlap (the last 150 characters from the previous chunk).
    let textoCompleto = rows[0].contenido_legal;
    for (let i = 1; i < rows.length; i++) {
        const overlap = 150;
        const nuevoFragmento = rows[i].contenido_legal;
        // Solo agregar la parte del nuevo fragmento que no es el solapamiento inicial
        // Asumiendo que el solapamiento configurado en dividirEnChunks es de 150 caracteres
        textoCompleto += nuevoFragmento.substring(overlap);
    }

    res.status(200).json({ texto_completo: textoCompleto });
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar el documento completo.' });
  }
};

export const obtenerHistorialTutela = async (req, res) => {
  try {
    const { id } = req.params;
    // Regex simple para validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Formato de ID de tutela no válido.' });
    }

    const { rows } = await pool.query('SELECT * FROM historial_acciones WHERE tutela_id = $1 ORDER BY created_at DESC', [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al cargar la trazabilidad:', error);
    res.status(500).json({ error: 'Error al cargar la trazabilidad.' });
  }
};

export const agregarAccionHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, area_involucrada, responsable_nombre, fecha_seguimiento } = req.body;
    if (!accion) return res.status(400).json({ error: 'La acción es obligatoria.' });

    await pool.query('INSERT INTO historial_acciones (tutela_id, accion, area_involucrada, responsable_nombre, fecha_seguimiento) VALUES ($1, $2, $3, $4, $5)', 
      [id, accion, area_involucrada, responsable_nombre, fecha_seguimiento || null]);
    
    await registrarLog(req.user.id, 'REGISTRAR_ACCION', 'tutela', id, req, { accion });
    res.status(201).json({ message: 'Acción registrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la acción.' });
  }
};

export const descargarWord = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT contestacion_generada FROM tutelas WHERE id = $1', [req.params.id]);
    if (rows.length === 0 || !rows[0].contestacion_generada) return res.status(404).json({ error: 'Borrador no encontrado.' });
    
    const buffer = await generarDocumentoWord(rows[0].contestacion_generada);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar Word.' });
  }
};

export const entrenarContextoLocal = async (req, res) => {
  try {
    const { categoria, contenido_legal, titulo_referencia, es_exitosa = true } = req.body;
    const textoCompletoRaw = req.file ? await extraerTextoPdf(req.file.buffer) : contenido_legal;
    const textoCompleto = await limpiarTexto(textoCompletoRaw);
    const documentoId = uuidv4();
    
    const chunks = dividirEnChunks(textoCompleto, 1500, 300);
    for (let i = 0; i < chunks.length; i++) {
      const vector = await generarEmbeddingLocal(chunks[i]);
      await pool.query('INSERT INTO base_conocimiento_enel (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, documento_id) VALUES ($1, $2, $3, $4, $5, $6)', 
        [categoria, `${titulo_referencia} (Parte ${i + 1})`, chunks[i], JSON.stringify(vector), es_exitosa, documentoId]);
    }
    
    await registrarLog(req.user.id, 'ENTRENAR_MEMORIA', 'memoria', 0, req, { titulo_referencia });
    res.status(200).json({ mensaje: 'Conocimiento guardado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar.' });
  }
};
