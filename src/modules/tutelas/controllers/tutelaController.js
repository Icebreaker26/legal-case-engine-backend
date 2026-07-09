import { extraerTextoPdf } from '../../../services/pdfService.js';
import { generarEmbeddingLocal } from '../services/aiService.js';
import { buscarContextoLegal } from '../services/vectorService.js';
import { generarDocumentoWord } from '../services/docxService.js';
import { dividirEnChunks } from '../services/chunkService.js';
import { extraerDatosTutela } from '../services/extractorService.js';
import { limpiarTexto } from '../services/cleanerService.js';
import { registrarLog } from '../../../services/auditService.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';
import pool from '../../../db/database.js';
import { ESTADOS, PRIORIDADES } from '../constants.js';
import { extraerSolicitudes, agruparEnLotes, construirPromptLote, buildPromptComprension } from '../services/peticionService.js';
import { respuestaLlmSchema } from '../schemas/tutelaSchema.js';
import { v4 as uuidv4 } from 'uuid';

const limpiarTextoParaPostgres = (texto) => {
  if (!texto) return '';
  return texto.replace(/\0/g, ''); 
};

export const listarBaseConocimiento = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (documento_id)
             categoria, titulo_referencia, documento_id, created_at, es_exitosa,
             comprension_doc,
             (comprension_doc IS NOT NULL) AS tiene_comprension
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
    const { rows } = await pool.query('SELECT id, nombre FROM global_categorias WHERE is_active = TRUE ORDER BY nombre ASC');
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
    const { radicado, accionante, sharepoint_link, derecho_vulnerado, resultado_fallo, grupo_id, responsable_uuid } = req.body;

    const sanitizedGrupoId = (grupo_id === '' || grupo_id === undefined) ? null : parseInt(grupo_id);
    const sanitizedResponsableUuid = (responsable_uuid === '' || responsable_uuid === undefined) ? null : responsable_uuid;
    const sanitizedResultado = (resultado_fallo === '' || resultado_fallo === undefined) ? null : resultado_fallo;

    await pool.query(
      `UPDATE tutelas
       SET radicado = $1, accionante = $2,
           sharepoint_link = COALESCE($3, sharepoint_link),
           derecho_vulnerado = $4,
           resultado_fallo = $5,
           grupo_id = $6, responsable_uuid = $7
       WHERE id = $8`,
      [radicado, accionante, sharepoint_link, derecho_vulnerado || null, sanitizedResultado, sanitizedGrupoId, sanitizedResponsableUuid, id]
    );
    await registrarLog(req.user.id, 'ACTUALIZAR_DATOS_TUTELA', 'tutela', id, req, { radicado, accionante, derecho_vulnerado, resultado_fallo: sanitizedResultado, grupo_id: sanitizedGrupoId, responsable_uuid: sanitizedResponsableUuid });

    // Promoción automática a memoria legal cuando el fallo es Favorable
    if (sanitizedResultado === 'Favorable') {
      const { rows: tutelaRows } = await pool.query(
        `SELECT contestacion_generada, derecho_vulnerado, radicado, respuesta_promovida, analisis_comprension FROM tutelas WHERE id = $1`,
        [id]
      );
      const tutela = tutelaRows[0];
      if (tutela && tutela.contestacion_generada && !tutela.respuesta_promovida) {
        try {
          const documentoId = uuidv4();
          const chunks  = dividirEnChunks(tutela.contestacion_generada, 1500, 300);
          const vectores = await Promise.all(chunks.map(c => generarEmbeddingLocal(c)));

          // Construir comprension_doc heredada de la tutela si existe
          const ac = tutela.analisis_comprension;
          const comprensionDoc = ac?.tema_central ? {
            que_resuelve:        ac.tema_central,
            tipo_caso:           tutela.derecho_vulnerado || 'General',
            resultado:           'favorable',
            derechos_involucrados: ac.derechos_invocados || [],
          } : null;
          const textoComprension = comprensionDoc
            ? `${comprensionDoc.que_resuelve}. ${(comprensionDoc.derechos_involucrados).join('. ')}`
            : null;
          const vectorComprension = textoComprension
            ? await generarEmbeddingLocal(textoComprension)
            : null;

          const client  = await pool.connect();
          try {
            await client.query('BEGIN');
            for (let i = 0; i < chunks.length; i++) {
              await client.query(
                `INSERT INTO base_conocimiento_enel
                   (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, documento_id,
                    comprension_doc, embedding_comprension)
                 VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7)`,
                [
                  tutela.derecho_vulnerado || 'General',
                  `Respuesta exitosa — ${tutela.radicado} (${i + 1}/${chunks.length})`,
                  chunks[i],
                  JSON.stringify(vectores[i]),
                  documentoId,
                  comprensionDoc ? JSON.stringify(comprensionDoc) : null,
                  vectorComprension  ? JSON.stringify(vectorComprension) : null,
                ]
              );
            }
            await client.query(
              `UPDATE tutelas SET respuesta_promovida = TRUE WHERE id = $1`, [id]
            );
            await client.query('COMMIT');
            await registrarLog(req.user.id, 'PROMOVER_RESPUESTA_EXITOSA', 'tutela', id, req, { radicado: tutela.radicado });
          } catch (innerErr) {
            await client.query('ROLLBACK');
            console.error('Error al promover respuesta exitosa:', innerErr);
          } finally {
            client.release();
          }
        } catch (embedErr) {
          console.error('Error al generar embedding para promoción:', embedErr);
        }
      }
    }

    res.status(200).json({ message: 'Datos actualizados correctamente.' });
  } catch (error) {
    console.error('Error al actualizar datos:', error);
    res.status(500).json({ error: 'Error al actualizar datos.' });
  }
};

export const procesarTutela = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Debes subir un archivo PDF.' });

    const { responsable_uuid, prioridad = PRIORIDADES.MEDIA, grupo_id, dias_termino = 2, derecho_vulnerado: derechoManual } = req.body;
    const textoPdfRaw = await extraerTextoPdf(req.file.buffer);
    const textoPdfLimpio = await limpiarTexto(textoPdfRaw);
    const textoPdf = limpiarTextoParaPostgres(textoPdfLimpio);

    if (!textoPdf || textoPdf.trim().length === 0) return res.status(400).json({ error: 'El PDF no contiene texto legible.' });

    const fechaVencimiento = sumarDiasHabiles(new Date(), parseInt(dias_termino) || 2);

    const textoParaVector = textoPdf.substring(0, 1500);
    const datosExtraidos = await extraerDatosTutela(textoPdf);
    const vectorLocal = await generarEmbeddingLocal(textoParaVector);
    const precedentesExitosos = await buscarContextoLegal(vectorLocal, textoParaVector, 5, datosExtraidos.derecho_vulnerado);

    const queryInsert = `
      INSERT INTO tutelas (radicado, accionante, juzgado, derecho_vulnerado, responsable_uuid, fecha_recepcion, fecha_vencimiento, prioridad, grupo_id, dias_termino, estado, contenido_original)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (radicado) DO UPDATE SET responsable_uuid = EXCLUDED.responsable_uuid, prioridad = EXCLUDED.prioridad, updated_at = NOW()
      RETURNING id;
    `;

    const values = [
      datosExtraidos.radicado !== 'POR DEFINIR' ? datosExtraidos.radicado : 'REF_' + Date.now(), 
      datosExtraidos.accionante, datosExtraidos.juzgado, derechoManual || datosExtraidos.derecho_vulnerado,
      responsable_uuid && responsable_uuid !== '' ? responsable_uuid : null,
      fechaVencimiento, prioridad, grupo_id && grupo_id !== '' ? parseInt(grupo_id) : null, parseInt(dias_termino) || 2, ESTADOS.PENDIENTE, textoPdf
    ];
    
    const dbResult = await pool.query(queryInsert, values);
    await registrarLog(req.user.id, 'CREAR_TUTELA', 'tutela', dbResult.rows[0].id, req, { radicado: datosExtraidos.radicado });

    res.status(200).json({ mensaje: 'Tutela registrada', id_tutela: dbResult.rows[0].id, sugerencias: precedentesExitosos });
  } catch (error) {
    console.error('Error detallado al procesar tutela:', error);
    res.status(500).json({ error: 'Error al procesar tutela.', details: error.message });
  }
};

export const actualizarGestionTutela = async (req, res) => {
  try {
    const { id } = req.params;
    const { responsable_uuid, estado, prioridad, resultado_fallo } = req.body;

    const { rows } = await pool.query('SELECT estado FROM tutelas WHERE id = $1', [id]);
    const estadoAnterior = rows[0]?.estado;

    const query = 'UPDATE tutelas SET responsable_uuid = COALESCE($1, responsable_uuid), estado = COALESCE($2, estado), prioridad = COALESCE($3, prioridad), resultado_fallo = COALESCE($4, resultado_fallo), updated_at = NOW() WHERE id = $5 RETURNING id;';
    
    const { rowCount } = await pool.query(query, [responsable_uuid || null, estado, prioridad || null, resultado_fallo || null, id]);

    if (rowCount === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const desc = (estado && estado !== estadoAnterior) ? `Cambio de estado: ${estadoAnterior} -> ${estado}` : 'Actualización de gestión';
    const usuarioId = req.user ? req.user.id : null;

    // Ejecución segura de registrarLog
    await registrarLog(usuarioId, desc, 'tutela', id, req, { estado, prioridad }).catch(err =>
        console.error('ERROR en registrarLog (no bloqueante):', err)
    );

    // Registrar cambio de estado en trazabilidad visible
    if (estado && estado !== estadoAnterior) {
      await pool.query(
        `INSERT INTO historial_acciones (tutela_id, accion, responsable_uuid) VALUES ($1, $2, $3)`,
        [id, `Estado cambiado de "${estadoAnterior}" a "${estado}"`, usuarioId]
      ).catch(err => console.error('Error al registrar historial de estado:', err));
    }
    
    return res.status(200).json({ mensaje: 'Gestión actualizada correctamente.' });
  } catch (error) {
    console.error('ERROR CRÍTICO en actualizarGestionTutela:', error);
    // Verificar si ya se envió respuesta
    if (!res.headersSent) {
        res.status(500).json({ error: 'Error al actualizar.', details: error.message });
    }
  }
};

export const listarTutelas = async (req, res) => {
  try {
    const query = `
      SELECT t.*,
             t.responsable_uuid,
             COALESCE(
               NULLIF(array_agg(gu.nombre) FILTER (WHERE gu.nombre IS NOT NULL), '{}'),
               CASE WHEN ur.nombre IS NOT NULL THEN ARRAY[ur.nombre] ELSE '{}' END
             ) as responsables_nombres,
             COALESCE(array_agg(gu.id) FILTER (WHERE gu.id IS NOT NULL), '{}') as responsables_ids,
             g.nombre as grupo_nombre
      FROM tutelas t
      LEFT JOIN tutela_responsables tr ON t.id = tr.tutela_id
      LEFT JOIN global_usuarios gu ON tr.usuario_uuid = gu.id
      LEFT JOIN global_usuarios ur ON ur.id = t.responsable_uuid
      LEFT JOIN global_grupos g ON t.grupo_id = g.id
      WHERE t.is_active = TRUE
      GROUP BY t.id, g.nombre, ur.nombre
      ORDER BY t.fecha_vencimiento ASC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al listar tutelas:', error);
    res.status(500).json({ error: 'Error al obtener la lista.' });
  }
};

export const listarMisTutelas = async (req, res) => {
  try {
    const query = `
      SELECT t.*,
             t.responsable_uuid,
             COALESCE(array_agg(gu.nombre) FILTER (WHERE gu.nombre IS NOT NULL), '{}') as responsables_nombres,
             COALESCE(array_agg(gu.id) FILTER (WHERE gu.id IS NOT NULL), '{}') as responsables_ids,
             g.nombre as grupo_nombre
      FROM tutelas t
      JOIN tutela_responsables tr ON t.id = tr.tutela_id
      LEFT JOIN global_usuarios gu ON tr.usuario_uuid = gu.id
      LEFT JOIN global_grupos g ON t.grupo_id = g.id
      WHERE t.is_active = TRUE AND tr.usuario_uuid = $1
      GROUP BY t.id, g.nombre
      ORDER BY t.fecha_vencimiento ASC;
    `;
    const { rows } = await pool.query(query, [req.user.id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al listar mis tutelas:', error);
    res.status(500).json({ error: 'Error al obtener tus tutelas.' });
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
    const { rows } = await pool.query('SELECT contenido_original, derecho_vulnerado FROM tutelas WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const { contenido_original, derecho_vulnerado } = rows[0];
    const textoOriginal = contenido_original || '';
    const vectorLocal = await generarEmbeddingLocal(textoOriginal.substring(0, 1500));
    res.status(200).json(await buscarContextoLegal(vectorLocal, textoOriginal, 5, derecho_vulnerado));
  } catch (error) {
    res.status(500).json({ error: 'Error al generar sugerencias.' });
  }
};

export const generarBorradorContestacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT contenido_original, contestacion_generada, derecho_vulnerado FROM tutelas WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    // Si ya existe un borrador guardado, lo devuelve directamente
    if (rows[0].contestacion_generada) {
      return res.status(200).json({
        borrador_completo: rows[0].contestacion_generada,
        status: 'cached'
      });
    }

    // Sin IA externa: devuelve sugerencias del RAG local para que el abogado redacte manualmente
    const textoOriginal = rows[0].contenido_original || '';
    const vectorLocal = await generarEmbeddingLocal(textoOriginal.substring(0, 1500));
    const sugerencias = await buscarContextoLegal(vectorLocal, textoOriginal, 5, rows[0].derecho_vulnerado);

    res.status(200).json({ sugerencias, status: 'suggestions_only' });

  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({ error: 'Error al obtener sugerencias para el borrador.' });
  }
};

export const guardarBorrador = async (req, res) => {
  try {
    const { id } = req.params;
    const { borrador } = req.body;

    if (!borrador?.trim()) return res.status(400).json({ error: 'El borrador no puede estar vacío.' });

    await pool.query('UPDATE tutelas SET contestacion_generada = $1 WHERE id = $2', [borrador, id]);
    await registrarLog(req.user.id, 'GUARDAR_BORRADOR', 'tutela', id, req);

    res.json({ message: 'Borrador guardado correctamente.', status: 'saved' });

  } catch (error) {
    console.error('Error guardando borrador:', error);
    res.status(500).json({ error: 'Error al guardar el borrador.' });
  }
};

export const registrarFeedbackMemoria = async (req, res) => {
  try {
    const { documento_id } = req.params;
    const { util } = req.body; // true = útil, false = no útil

    if (typeof util !== 'boolean') {
      return res.status(400).json({ error: 'El campo "util" debe ser true o false.' });
    }

    const delta = util ? 1 : -1;

    // Actualiza todos los chunks del documento a la vez
    const { rowCount } = await pool.query(
      `UPDATE base_conocimiento_enel
       SET relevancia_score = relevancia_score + $1
       WHERE documento_id = $2`,
      [delta, documento_id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Documento no encontrado.' });

    // Si el score acumulado cae por debajo de -5, se marca como no exitoso
    // para que deje de aparecer en búsquedas futuras
    await pool.query(
      `UPDATE base_conocimiento_enel
       SET es_exitosa = false
       WHERE documento_id = $1
         AND relevancia_score <= -5`,
      [documento_id]
    );

    await registrarLog(req.user.id, util ? 'FEEDBACK_UTIL' : 'FEEDBACK_NO_UTIL', 'memoria', documento_id, req);
    res.json({ mensaje: 'Feedback registrado.', delta });

  } catch (error) {
    console.error('Error registrando feedback:', error);
    res.status(500).json({ error: 'Error al registrar feedback.' });
  }
};

export const obtenerContenidoCompletoSugerencia = async (req, res) => {
  try {
    const { documento_id } = req.params;
    const { chunk_match } = req.query; // contenido del chunk que hizo match, para resaltarlo

    if (!documento_id || documento_id === 'null' || documento_id === 'undefined') {
      return res.status(400).json({ error: 'ID de documento no válido.' });
    }

    const { rows } = await pool.query(
      `SELECT id, titulo_referencia, categoria, contenido_legal, relevancia_score
       FROM base_conocimiento_enel
       WHERE documento_id = $1
       ORDER BY id ASC`,
      [documento_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado.' });

    // Identificar el índice del chunk que hizo match
    const idxMatch = chunk_match
      ? rows.findIndex(r => r.contenido_legal.trim().startsWith(chunk_match.trim().substring(0, 80)))
      : -1;

    // Devolver chunks individuales con flag de cuál fue el match
    const chunks = rows.map((r, i) => ({
      contenido: r.contenido_legal,
      es_match:  i === idxMatch,
    }));

    res.status(200).json({
      titulo:           rows[0].titulo_referencia.replace(/ \(\d+\/\d+\)$/, ''),
      categoria:        rows[0].categoria,
      relevancia_score: rows[0].relevancia_score,
      chunks,
      total_chunks:     rows.length,
    });
  } catch (error) {
    console.error('Error recuperando documento:', error);
    res.status(500).json({ error: 'Error al recuperar el documento completo.' });
  }
};

export const obtenerHistorialTutela = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT ha.*, u.nombre AS responsable_nombre
       FROM historial_acciones ha
       LEFT JOIN global_usuarios u ON u.id = ha.responsable_uuid
       WHERE ha.tutela_id = $1
       ORDER BY ha.created_at DESC`,
      [id]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al cargar la trazabilidad para el ID:', id, 'Error:', error);
    res.status(500).json({ error: 'Error al cargar la trazabilidad.' });
  }
};

export const agregarAccionHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, area_involucrada, responsable_uuid, fecha_seguimiento } = req.body;
    if (!accion) return res.status(400).json({ error: 'La acción es obligatoria.' });

    // Corrección: Insertar responsable_uuid en lugar de responsable_nombre
    await pool.query('INSERT INTO historial_acciones (tutela_id, accion, area_involucrada, responsable_uuid, fecha_seguimiento) VALUES ($1, $2, $3, $4, $5)', 
      [id, accion, area_involucrada, responsable_uuid || null, fecha_seguimiento || null]);
    
    await registrarLog(req.user.id, 'REGISTRAR_ACCION', 'tutela', id, req, { accion });
    res.status(201).json({ message: 'Acción registrada' });
  } catch (error) {
    console.error('ERROR CRÍTICO al registrar acción en historial:', error);
    res.status(500).json({ error: 'Error al registrar la acción.', details: error.message });
  }
};

export const gestionarResponsablesTutela = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarios_uuids } = req.body; 

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM tutela_responsables WHERE tutela_id = $1', [id]);
      if (usuarios_uuids && usuarios_uuids.length > 0) {
        const query = 'INSERT INTO tutela_responsables (tutela_id, usuario_uuid) VALUES ' + 
                      usuarios_uuids.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(query, [id, ...usuarios_uuids]);
      }
      await client.query('COMMIT');
      await registrarLog(req.user.id, 'GESTIONAR_RESPONSABLES', 'tutela', id, req, { usuarios_uuids });
      res.json({ message: 'Responsables actualizados correctamente.' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al gestionar responsables.' });
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

    if (!titulo_referencia?.trim()) return res.status(400).json({ error: 'titulo_referencia es requerido.' });
    if (!categoria?.trim())         return res.status(400).json({ error: 'categoria es requerida.' });

    const textoCompletoRaw = req.file ? await extraerTextoPdf(req.file.buffer) : contenido_legal;
    if (!textoCompletoRaw?.trim())  return res.status(400).json({ error: 'No se recibió contenido para entrenar.' });

    const textoCompleto = await limpiarTexto(textoCompletoRaw);
    const documentoId   = uuidv4();
    const chunks        = dividirEnChunks(textoCompleto, 1500, 300);

    // Generar todos los embeddings en paralelo (el modelo Xenova es local, sin rate limit)
    const vectores = await Promise.all(chunks.map(chunk => generarEmbeddingLocal(chunk)));

    // Bulk insert — una sola transacción para todos los chunks
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < chunks.length; i++) {
        await client.query(
          `INSERT INTO base_conocimiento_enel
            (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, documento_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [categoria, `${titulo_referencia} (${i + 1}/${chunks.length})`, chunks[i], JSON.stringify(vectores[i]), es_exitosa, documentoId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await registrarLog(req.user.id, 'ENTRENAR_MEMORIA', 'memoria', documentoId, req, { titulo_referencia, chunks: chunks.length });
    res.status(200).json({ mensaje: 'Conocimiento guardado', documento_id: documentoId, chunks: chunks.length });

  } catch (error) {
    console.error('Error en entrenarContextoLocal:', error);
    res.status(500).json({ error: 'Error al procesar el documento de entrenamiento.' });
  }
};

export const crearRequerimientoInterno = async (req, res) => {
  try {
    const { id } = req.params;
    const { grupo_id, descripcion, prioridad = 'Media', fecha_limite } = req.body;

    const { rows: tRows } = await pool.query('SELECT radicado, accionante, fecha_vencimiento FROM tutelas WHERE id = $1', [id]);
    if (tRows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const { radicado, accionante, fecha_vencimiento } = tRows[0];
    const { rows: gRows } = await pool.query('SELECT nombre FROM global_grupos WHERE id = $1', [grupo_id]);
    const nombreGrupo = gRows.length > 0 ? gRows[0].nombre : 'Desconocido';

    const vencimientoStr = fecha_vencimiento
      ? new Date(fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'No definida';
    const limiteSolicitudStr = fecha_limite
      ? new Date(fecha_limite).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'A la brevedad posible';
    const urgencia = prioridad === 'Alta' ? 'URGENTE — ' : '';

    const oficioGenerado = `
OFICIO DE REQUERIMIENTO INTERNO
${urgencia}FECHA: ${new Date().toLocaleDateString('es-CO')}
PARA: Responsable Grupo ${nombreGrupo}
DE: Departamento Jurídico
PRIORIDAD: ${prioridad.toUpperCase()}

ASUNTO: Solicitud de Información — Tutela Radicado ${radicado}

Por medio de la presente, se requiere de su grupo la siguiente información técnica o documental, necesaria para la defensa judicial de la compañía en el proceso de tutela instaurado por ${accionante}.

VENCIMIENTO JUDICIAL DEL CASO: ${vencimientoStr}
RESPUESTA REQUERIDA ANTES DE: ${limiteSolicitudStr}

REQUERIMIENTO:
${descripcion}

Agradecemos dar trámite prioritario a esta solicitud dado el término judicial vigente.

Atentamente,
${req.user ? (req.user.nombre || req.user.email) : 'Sistema'}
Departamento Jurídico
    `.trim();

    const { rows } = await pool.query(
      `INSERT INTO requerimientos_internos (tutela_id, grupo_id, descripcion, oficio_generado, prioridad, fecha_limite)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, grupo_id, descripcion, oficioGenerado, prioridad, fecha_limite || null]
    );

    await registrarLog(req.user?.id, 'CREAR_REQUERIMIENTO', 'tutela', id, req, { grupo_id, prioridad }).catch(err =>
      console.error('ERROR en registrarLog (no bloqueante):', err)
    );
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error('ERROR CRÍTICO creando requerimiento:', error);
    res.status(500).json({ error: 'Error al crear requerimiento interno.', details: error.message });
  }
};

export const listarRequerimientosInternos = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT r.*, g.nombre as area_nombre 
       FROM requerimientos_internos r 
       LEFT JOIN global_grupos g ON r.grupo_id = g.id
       WHERE r.tutela_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar requerimientos.' });
  }
};

export const actualizarEstadoRequerimiento = async (req, res) => {
    try {
        const { reqId } = req.params;
        const { estado, respuesta_texto } = req.body;
        
        const { rows: rRows } = await pool.query('SELECT tutela_id, grupo_id FROM requerimientos_internos WHERE id = $1', [reqId]);
        if (rRows.length === 0) return res.status(404).json({ error: 'Requerimiento no encontrado.' });
        
        const { tutela_id, grupo_id } = rRows[0];
        const { rows: gRows } = await pool.query('SELECT nombre FROM global_grupos WHERE id = $1', [grupo_id]);
        const nombreGrupo = gRows.length > 0 ? gRows[0].nombre : 'Desconocido';

        const nuevaRespuestaFormateada = `\n[${new Date().toLocaleString()}]: ${respuesta_texto}`;

        const ESTADOS_VALIDOS = ['Pendiente', 'En Gestión', 'Respondido', 'Vencido'];
        if (!ESTADOS_VALIDOS.includes(estado)) return res.status(400).json({ error: 'Estado no válido.' });

        await pool.query(
            'UPDATE requerimientos_internos SET estado = $1, fecha_respuesta = $2, respuesta_texto = COALESCE(respuesta_texto, \'\') || $3 WHERE id = $4',
            [estado, estado === 'Respondido' ? new Date() : null, respuesta_texto ? nuevaRespuestaFormateada : '', reqId]
        );

        if (estado === 'Respondido' && respuesta_texto) {
            await registrarLog(req.user.id, 'RECIBIR_RESPUESTA_REQUERIMIENTO', 'tutela', tutela_id, req, { nombreGrupo, respuesta_texto });

            await pool.query(
                'INSERT INTO historial_acciones (tutela_id, accion, responsable_uuid) VALUES ($1, $2, $3)',
                [tutela_id, `Respuesta recibida de ${nombreGrupo}: ${respuesta_texto.substring(0, 200)}`, req.user?.id || null]
            );

            // Notificar al responsable de la tutela
            const { rows: tResp } = await pool.query(
                `SELECT t.radicado, t.responsable_uuid
                 FROM tutelas t
                 WHERE t.id = $1`,
                [tutela_id]
            );
            if (tResp.length > 0 && tResp[0].responsable_uuid) {
                await crearNotificacion(
                    tResp[0].responsable_uuid,
                    `El área ${nombreGrupo} respondió el requerimiento de la tutela ${tResp[0].radicado}`,
                    'requerimiento_respondido',
                    tutela_id
                );
            }
        }

        res.json({ message: 'Estado y respuesta actualizados.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado.' });
    }
};

export const actualizarBorrador = async (req, res) => {
    try {
        const { id } = req.params;
        const { contestacion_generada } = req.body;
        const userId = req.user.id;

        // Verificar bloqueo antes de actualizar
        const { rows } = await pool.query(
            'UPDATE tutelas SET contestacion_generada = $1, updated_at = NOW() WHERE id = $2 AND lock_owner_id = $3 RETURNING *',
            [contestacion_generada, id, userId]
        );

        if (rows.length === 0) return res.status(403).json({ error: 'No tienes el borrador bloqueado para edición.' });

        await registrarLog(userId, 'ACTUALIZAR_BORRADOR', 'tutela', id, req, {});
        res.json({ message: 'Borrador actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar borrador:', error);
        res.status(500).json({ error: 'Error al actualizar borrador.' });
    }
};

export const obtenerEstadoBloqueo = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            'SELECT lock_owner_id, lock_expires_at, gu.nombre as lock_owner_nombre FROM tutelas t LEFT JOIN global_usuarios gu ON t.lock_owner_id = gu.id WHERE t.id = $1',
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estado de bloqueo.' });
    }
};

export const bloquearBorrador = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const { rows } = await pool.query(
            'UPDATE tutelas SET lock_owner_id = $1, lock_expires_at = NOW() + INTERVAL \'10 minutes\' WHERE id = $2 AND (lock_owner_id IS NULL OR lock_expires_at < NOW()) RETURNING *',
            [userId, id]
        );
        
        if (rows.length === 0) return res.status(409).json({ error: 'El borrador ya está bloqueado por otro usuario.' });
        res.json({ message: 'Borrador bloqueado exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al bloquear borrador.' });
    }
};

export const desbloquearBorrador = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        await pool.query(
            'UPDATE tutelas SET lock_owner_id = NULL, lock_expires_at = NULL WHERE id = $1 AND lock_owner_id = $2',
            [id, userId]
        );
        res.json({ message: 'Borrador desbloqueado.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al desbloquear borrador.' });
    }
};

export const listarArgumentos = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            `SELECT ta.*, gu.nombre as creado_por_nombre 
             FROM tutela_argumentos ta 
             LEFT JOIN global_usuarios gu ON ta.creado_por = gu.id 
             WHERE ta.tutela_id = $1 ORDER BY ta.created_at DESC`,
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar argumentos.' });
    }
};

export const crearArgumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, contenido } = req.body;
        const userId = req.user.id;

        const { rows } = await pool.query(
            'INSERT INTO tutela_argumentos (tutela_id, titulo, contenido, creado_por) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, titulo, contenido, userId]
        );

        await registrarLog(userId, 'CREAR_ARGUMENTO', 'tutela', id, req, { titulo });
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear argumento.' });
    }
};

export const actualizarArgumento = async (req, res) => {
    try {
        const { id, argId } = req.params;
        const { titulo, contenido } = req.body;
        const userId = req.user.id;

        const { rows } = await pool.query(
            'UPDATE tutela_argumentos SET titulo = $1, contenido = $2 WHERE id = $3 AND tutela_id = $4 AND creado_por = $5 RETURNING *',
            [titulo, contenido, argId, id, userId]
        );

        if (rows.length === 0) return res.status(403).json({ error: 'No tienes permiso para actualizar este argumento.' });

        await registrarLog(userId, 'ACTUALIZAR_ARGUMENTO', 'tutela', id, req, { argId, titulo });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al actualizar argumento:', error);
        res.status(500).json({ error: 'Error al actualizar argumento.' });
    }
};

export const promoverArgumento = async (req, res) => {
  try {
    const { id, argId } = req.params;

    // Traer el argumento y el derecho vulnerado de la tutela en una sola query
    const { rows } = await pool.query(
      `SELECT ta.titulo, ta.contenido, ta.promovido_a_memoria,
              t.derecho_vulnerado, t.radicado, t.analisis_comprension
       FROM tutela_argumentos ta
       JOIN tutelas t ON t.id = ta.tutela_id
       WHERE ta.id = $1 AND ta.tutela_id = $2`,
      [argId, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Argumento no encontrado.' });

    const { titulo, contenido, promovido_a_memoria, derecho_vulnerado, radicado, analisis_comprension } = rows[0];

    if (promovido_a_memoria) {
      return res.status(409).json({ error: 'Este argumento ya fue promovido a la memoria legal.' });
    }

    // Vectorizar y registrar en base_conocimiento_enel
    const documentoId = uuidv4();
    const chunks      = dividirEnChunks(contenido, 1500, 300);
    const vectores    = await Promise.all(chunks.map(c => generarEmbeddingLocal(c)));

    // Comprension_doc: usa contexto de la tutela si disponible, complementa con el argumento
    const ac = analisis_comprension;
    const comprensionDoc = ac?.tema_central ? {
      que_resuelve:         `${titulo}: ${ac.tema_central}`,
      tipo_caso:            derecho_vulnerado || 'General',
      resultado:            'favorable',
      derechos_involucrados: ac.derechos_invocados || [],
    } : null;
    const textoComprension = comprensionDoc
      ? `${comprensionDoc.que_resuelve}. ${(comprensionDoc.derechos_involucrados).join('. ')}`
      : null;
    const vectorComprension = textoComprension
      ? await generarEmbeddingLocal(textoComprension)
      : null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < chunks.length; i++) {
        await client.query(
          `INSERT INTO base_conocimiento_enel
             (categoria, titulo_referencia, contenido_legal, embedding_local, es_exitosa, documento_id,
              comprension_doc, embedding_comprension)
           VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7)`,
          [
            derecho_vulnerado || 'General',
            `${titulo} — Arg. promovido de tutela ${radicado} (${i + 1}/${chunks.length})`,
            chunks[i],
            JSON.stringify(vectores[i]),
            documentoId,
            comprensionDoc ? JSON.stringify(comprensionDoc) : null,
            vectorComprension  ? JSON.stringify(vectorComprension) : null,
          ]
        );
      }
      // Marcar el argumento como promovido para evitar duplicados
      await client.query(
        `UPDATE tutela_argumentos SET promovido_a_memoria = TRUE, documento_id_memoria = $1 WHERE id = $2`,
        [documentoId, argId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await registrarLog(req.user.id, 'PROMOVER_ARGUMENTO', 'tutela', id, req, { argId, titulo, documentoId });
    res.status(200).json({ mensaje: 'Argumento promovido a la memoria legal.', documento_id: documentoId, chunks: chunks.length });

  } catch (error) {
    console.error('Error promoviendo argumento:', error);
    res.status(500).json({ error: 'Error al promover el argumento.' });
  }
};

export const guardarRespuestaPeticion = async (req, res) => {
  const { id } = req.params;
  const { resultado_llm_json, modo = 'acumular', parte_index } = req.body;

  let parsed;
  try {
    parsed = JSON.parse(resultado_llm_json);
  } catch {
    return res.status(400).json({ error: 'La respuesta del LLM no es un JSON válido.' });
  }

  const validation = respuestaLlmSchema.safeParse(parsed);
  if (!validation.success) {
    return res.status(400).json({ error: 'Estructura del JSON inválida.', details: validation.error.issues });
  }

  const { encabezado, introduccion, respuestas, prescripcion, cierre } = validation.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      'SELECT id FROM respuestas_peticion WHERE tutela_id = $1', [id]
    );

    let respuestaId;

    if (modo === 'reemplazar' || existing.length === 0) {
      if (existing.length > 0) {
        await client.query('DELETE FROM respuestas_peticion WHERE tutela_id = $1', [id]);
      }
      const { rows } = await client.query(
        `INSERT INTO respuestas_peticion (tutela_id, encabezado, introduccion, cierre, prescripcion, partes_procesadas)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [id, encabezado ? JSON.stringify(encabezado) : null, introduccion || null, cierre || null,
         prescripcion ? JSON.stringify(prescripcion) : null,
         parte_index !== undefined ? [parte_index] : []]
      );
      respuestaId = rows[0].id;
    } else {
      respuestaId = existing[0].id;
      await client.query(
        `UPDATE respuestas_peticion SET
           encabezado   = COALESCE($1, encabezado),
           introduccion = COALESCE($2, introduccion),
           cierre       = COALESCE($3, cierre),
           prescripcion = COALESCE($4, prescripcion),
           partes_procesadas = array_append(array_remove(partes_procesadas, $5::integer), $5::integer),
           updated_at   = NOW()
         WHERE id = $6`,
        [encabezado ? JSON.stringify(encabezado) : null,
         introduccion || null, cierre || null,
         prescripcion?.aplica ? JSON.stringify(prescripcion) : null,
         parte_index ?? null, respuestaId]
      );
    }

    for (const r of respuestas) {
      await client.query(
        `INSERT INTO respuesta_peticion_items (respuesta_id, numero, solicitud, respuesta, normas_citadas, parte)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [respuestaId, r.numero, r.solicitud, r.respuesta,
         r.normas_citadas?.length ? r.normas_citadas : [], parte_index ?? null]
      );
    }

    await client.query('COMMIT');
    await registrarLog(req.user.id, 'GUARDAR_RESPUESTA_PETICION', 'tutela', id, req, { parte_index, modo });
    res.json({ message: 'Respuesta guardada correctamente.', respuesta_id: respuestaId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error guardando respuesta petición:', err);
    res.status(500).json({ error: 'Error al guardar la respuesta.', details: err.message });
  } finally {
    client.release();
  }
};

export const obtenerRespuestaPeticion = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: [respuesta] } = await pool.query(
      'SELECT * FROM respuestas_peticion WHERE tutela_id = $1', [id]
    );
    if (!respuesta) return res.json(null);

    const { rows: items } = await pool.query(
      'SELECT * FROM respuesta_peticion_items WHERE respuesta_id = $1 ORDER BY numero ASC', [respuesta.id]
    );
    res.json({ ...respuesta, items });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la respuesta.' });
  }
};

export const limpiarRespuestaPeticion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM respuestas_peticion WHERE tutela_id = $1', [id]);
    res.json({ message: 'Respuesta eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la respuesta.' });
  }
};

export const generarPromptsPeticion = async (req, res) => {
  try {
    const { id } = req.params;

    const [tutelaRes, configRes, argumentosRes] = await Promise.all([
      pool.query('SELECT radicado, accionante, derecho_vulnerado, contenido_original, analisis_comprension FROM tutelas WHERE id = $1', [id]),
      pool.query('SELECT key, value FROM system_config'),
      pool.query('SELECT titulo, contenido FROM tutela_argumentos WHERE tutela_id = $1 ORDER BY created_at ASC', [id]),
    ]);

    if (tutelaRes.rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const tutela = tutelaRes.rows[0];
    const config = configRes.rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
    const legalNotes = config.legal_notes || [];
    const argumentos = argumentosRes.rows;

    const comprension = tutela.analisis_comprension || null;
    const textoParaVector = comprension?.tema_central
      ? `${comprension.tema_central}. ${(comprension.peticiones || []).join('. ')}`
      : (tutela.contenido_original || '').substring(0, 1500);

    const vectorLocal = await generarEmbeddingLocal(textoParaVector);
    const sugerencias = await buscarContextoLegal(vectorLocal, tutela.contenido_original || '', 5, tutela.derecho_vulnerado);

    const solicitudes = extraerSolicitudes(tutela.contenido_original || '');
    const lotes = agruparEnLotes(solicitudes, { tutela, legalNotes, sugerencias, argumentos });

    const prompts = lotes.map((lote, i) => ({
      parte: i + 1,
      total: lotes.length,
      solicitudes: lote.map(s => s.etiqueta),
      prompt: construirPromptLote({ lote, loteIndex: i, totalLotes: lotes.length, tutela, legalNotes, sugerencias, argumentos, comprension }),
    }));

    res.json({ prompts, total_solicitudes: solicitudes.length, total_partes: lotes.length });
  } catch (error) {
    console.error('Error generando prompts de petición:', error);
    res.status(500).json({ error: 'Error al generar los prompts.', details: error.message });
  }
};

export const eliminarArgumento = async (req, res) => {
    try {
        const { id, argId } = req.params;
        const userId = req.user.id;

        const { rowCount } = await pool.query(
            'DELETE FROM tutela_argumentos WHERE id = $1 AND tutela_id = $2 AND creado_por = $3',
            [argId, id, userId]
        );

        if (rowCount === 0) return res.status(403).json({ error: 'No tienes permiso para eliminar este argumento.' });

        await registrarLog(userId, 'ELIMINAR_ARGUMENTO', 'tutela', id, req, { argId });
        res.json({ message: 'Argumento eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar argumento:', error);
        res.status(500).json({ error: 'Error al eliminar argumento.' });
    }
};

// ── Comprensión de documentos en base_conocimiento_enel ───────────────────────

const buildPromptComprensionDoc = (contenidoLegal) => {
  const extracto = contenidoLegal.substring(0, 3000);
  return `Eres un abogado experto en derecho colombiano de servicios públicos.
Lee el siguiente fragmento de un documento legal que forma parte de la base de conocimiento de Enel Colombia.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código.

Estructura exacta:
{
  "que_resuelve": "Descripción concisa de qué tipo de caso o situación cubre este documento",
  "tipo_caso": "Categoría principal del caso (ej: Corte del servicio, Facturación, Servidumbre, etc.)",
  "resultado": "favorable | desfavorable | referencia",
  "derechos_involucrados": ["Lista de derechos o figuras jurídicas mencionadas"]
}

Documento:
${extracto}`;
};

export const generarPromptComprensionDoc = async (req, res, next) => {
  try {
    const { documento_id } = req.params;
    const { rows } = await pool.query(
      `SELECT contenido_legal FROM base_conocimiento_enel
       WHERE documento_id = $1 AND is_active = TRUE
       ORDER BY id ASC`,
      [documento_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Documento no encontrado.' });

    const textoCompleto = rows.map(r => r.contenido_legal).join('\n\n');
    const prompt = buildPromptComprensionDoc(textoCompleto);
    res.json({ prompt });
  } catch (err) {
    next(err);
  }
};

export const guardarComprensionDoc = async (req, res, next) => {
  try {
    const { documento_id } = req.params;
    const { json_comprension } = req.body;

    let parsed;
    try {
      let raw = typeof json_comprension === 'string' ? json_comprension : JSON.stringify(json_comprension);
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const start = raw.indexOf('{');
      const end   = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
      parsed = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: 'JSON de comprensión inválido — no se pudo parsear.' });
    }

    if (!parsed.que_resuelve || !parsed.tipo_caso) {
      return res.status(400).json({ error: 'JSON inválido — falta que_resuelve o tipo_caso.' });
    }

    // Generar embedding semántico a partir de la comprensión
    const textoComprension = `${parsed.que_resuelve}. ${(parsed.derechos_involucrados || []).join('. ')}`;
    const vectorComprension = await generarEmbeddingLocal(textoComprension);

    // Actualizar todos los chunks del documento con la misma comprension
    await pool.query(
      `UPDATE base_conocimiento_enel
       SET comprension_doc = $1, embedding_comprension = $2
       WHERE documento_id = $3`,
      [JSON.stringify(parsed), JSON.stringify(vectorComprension), documento_id]
    );

    res.json({ ok: true, comprension: parsed });
  } catch (err) {
    next(err);
  }
};

export const generarPromptComprension = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT contenido_original FROM tutelas WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const prompt = buildPromptComprension(rows[0].contenido_original || '');
    res.json({ prompt });
  } catch (err) {
    next(err);
  }
};

export const guardarComprension = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { json_comprension } = req.body;

    let parsed;
    try {
      let raw = typeof json_comprension === 'string' ? json_comprension : JSON.stringify(json_comprension);
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const start = raw.indexOf('{');
      const end   = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
      parsed = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: 'JSON de comprensión inválido — no se pudo parsear.' });
    }

    if (!parsed.tema_central || !Array.isArray(parsed.peticiones)) {
      return res.status(400).json({ error: 'JSON de comprensión inválido — falta tema_central o peticiones.' });
    }

    await pool.query(
      'UPDATE tutelas SET analisis_comprension = $1 WHERE id = $2',
      [JSON.stringify(parsed), id]
    );

    res.json({ ok: true, comprension: parsed });
  } catch (err) {
    next(err);
  }
};
