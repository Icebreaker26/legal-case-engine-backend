import { extraerTextoPdf } from '../../../services/pdfService.js';
import { generarEmbeddingLocal } from '../services/aiService.js';
import { generarDocumentoWord } from '../services/docxService.js';
import { indexarDocumento } from '../services/memoriaService.js';
import { recuperarPrecedentes, registrarImpresiones, resolverFusionAlphaFb } from '../services/consultaService.js';
import { extraerDatosTutela } from '../services/extractorService.js';
import { limpiarTexto, limpiarTextoParaPostgres } from '../services/cleanerService.js';
import { registrarLog } from '../../../services/auditService.js';
import logger from '../../../utils/logger.js';
import { crearNotificacion } from '../../notificaciones/services/notificationService.js';
import pool from '../../../db/database.js';
import { ESTADOS, PRIORIDADES } from '../constants.js';
import { extraerSolicitudes, agruparEnLotes, construirPromptLote, buildPromptComprension, detectarMetodoSegmentacion, LIMITE_EXTRACTO_COMPRENSION } from '../services/peticionService.js';
import { respuestaLlmSchema } from '../schemas/tutelaSchema.js';
import { calcularHter, itemsATexto } from '../services/hterService.js';

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

// #124 — visibilidad de cuántos documentos de la memoria legal usan el
// fallback embedding_local↔embedding_local en vez de comprensión semántica
// (comprension_doc IS NOT NULL implica embedding_comprension IS NOT NULL —
// memoriaService.indexarDocumento y guardarComprensionDoc siempre generan el
// embedding junto con la comprensión, nunca uno sin el otro).
export const obtenerCoberturaComprension = async (req, res) => {
  try {
    const query = `
      WITH docs AS (
        SELECT DISTINCT ON (documento_id)
               documento_id, categoria, titulo_referencia, created_at,
               (comprension_doc IS NOT NULL) AS tiene_comprension
        FROM base_conocimiento_enel
        WHERE is_active = TRUE AND documento_id IS NOT NULL
        ORDER BY documento_id, created_at DESC
      )
      SELECT
        (SELECT COUNT(*) FROM docs) AS total,
        (SELECT COUNT(*) FROM docs WHERE tiene_comprension) AS con_comprension,
        (SELECT COUNT(*) FROM docs WHERE NOT tiene_comprension) AS sin_comprension,
        (
          SELECT COALESCE(json_agg(c), '[]')
          FROM (
            SELECT categoria,
                   COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE tiene_comprension) AS con_comprension,
                   COUNT(*) FILTER (WHERE NOT tiene_comprension) AS sin_comprension
            FROM docs
            GROUP BY categoria
            ORDER BY categoria
          ) c
        ) AS por_categoria,
        (
          SELECT COALESCE(json_agg(d), '[]')
          FROM (
            SELECT documento_id, categoria, titulo_referencia, created_at
            FROM docs
            WHERE NOT tiene_comprension
            ORDER BY created_at ASC
            LIMIT 10
          ) d
        ) AS mas_antiguos_sin_comprension;
    `;
    const { rows: [resumen] } = await pool.query(query);
    res.status(200).json(resumen);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la cobertura de comprensión.' });
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
import { sumarDiasHabiles, getFestivos } from '../../../utils/diasHabiles.js';

export const listarFestivos = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const holidays = getFestivos(year);
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
    const { radicado, accionante, sharepoint_link, derecho_vulnerado, resultado_fallo, grupo_id, responsable_uuid, categoria_confirmada } = req.body;

    const sanitizedGrupoId = (grupo_id === '' || grupo_id === undefined) ? null : parseInt(grupo_id);
    const sanitizedResponsableUuid = (responsable_uuid === '' || responsable_uuid === undefined) ? null : responsable_uuid;
    const sanitizedResultado = (resultado_fallo === '' || resultado_fallo === undefined) ? null : resultado_fallo;

    await pool.query(
      `UPDATE tutelas
       SET radicado = COALESCE($1, radicado),
           accionante = COALESCE($2, accionante),
           sharepoint_link = COALESCE($3, sharepoint_link),
           derecho_vulnerado = COALESCE($4, derecho_vulnerado),
           resultado_fallo = COALESCE($5, resultado_fallo),
           grupo_id = COALESCE($6, grupo_id), responsable_uuid = COALESCE($7, responsable_uuid)
       WHERE id = $8`,
      [radicado, accionante, sharepoint_link, derecho_vulnerado, sanitizedResultado, sanitizedGrupoId, sanitizedResponsableUuid, id]
    );
    await registrarLog(req.user.id, 'ACTUALIZAR_DATOS_TUTELA', 'tutela', id, req, { radicado, accionante, derecho_vulnerado, resultado_fallo: sanitizedResultado, grupo_id: sanitizedGrupoId, responsable_uuid: sanitizedResponsableUuid });

    // Promoción automática a memoria legal cuando el fallo es Favorable.
    // #108: requiere categoria_confirmada=true — sin eso, se difiere la
    // promoción (no se descarta la respuesta Favorable, solo no entra
    // todavía al corpus) para que una categoría nunca corregida por un
    // abogado no siga ensuciando la taxonomía de base_conocimiento_enel.
    let promocionPendienteConfirmacion = false;
    if (sanitizedResultado === 'Favorable' && categoria_confirmada !== true) {
      const { rows: pendienteRows } = await pool.query(
        `SELECT 1 FROM tutelas WHERE id = $1 AND contestacion_generada IS NOT NULL AND respuesta_promovida = FALSE`,
        [id]
      );
      promocionPendienteConfirmacion = pendienteRows.length > 0;
    }

    if (sanitizedResultado === 'Favorable' && categoria_confirmada === true) {
      const { rows: tutelaRows } = await pool.query(
        `SELECT contestacion_generada, derecho_vulnerado, radicado, respuesta_promovida, analisis_comprension FROM tutelas WHERE id = $1`,
        [id]
      );
      const tutela = tutelaRows[0];
      if (tutela && tutela.contestacion_generada && !tutela.respuesta_promovida) {
        try {
          // Construir comprension_doc heredada de la tutela si existe
          const ac = tutela.analisis_comprension;
          const comprensionDoc = ac?.tema_central ? {
            que_resuelve:        ac.tema_central,
            tipo_caso:           tutela.derecho_vulnerado || 'General',
            resultado:           'favorable',
            derechos_involucrados: ac.derechos_invocados || [],
          } : null;

          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            await indexarDocumento({
              texto: tutela.contestacion_generada,
              categoria: tutela.derecho_vulnerado || 'General',
              titulo: `Respuesta exitosa — ${tutela.radicado}`,
              esExitosa: true,
              comprensionDoc,
              client,
            });
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

    if (promocionPendienteConfirmacion) {
      return res.status(200).json({
        message: 'Datos actualizados correctamente.',
        promocion_pendiente: true,
        promocion_pendiente_motivo: 'Confirmá o corregí la categoría (derecho_vulnerado) y reenviá con categoria_confirmada=true para promover esta respuesta a la memoria legal.',
      });
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

    const datosExtraidos = await extraerDatosTutela(textoPdf);
    // Sin filtro de categoría (#106): el prefiltro por categoría extraída
    // descartaba por completo los candidatos correctos cada vez que
    // extraerDatosTutela se equivocaba de categoría (recall@5=0 en ese caso,
    // medido en #104/#106) — peor que no filtrar en absoluto.
    const precedentesExitosos = await recuperarPrecedentes({
      tutela: { contenido_original: textoPdf },
    });

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

    await registrarImpresiones({
      usuario_uuid: req.user.id,
      tutela_id: dbResult.rows[0].id,
      categoria_contexto: derechoManual || datosExtraidos.derecho_vulnerado,
      resultados: precedentesExitosos,
    });

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
    // Sin filtro de categoría (#106); fusion la resuelve la guarda dura de
    // #173 -- 'alpha_fb' solo si el flag, el modelo y los datos ya calzan,
    // si no cae sola a 'ponderado'.
    const fusion = await resolverFusionAlphaFb('obtenerSugerenciasTutela');
    const sugerencias = await recuperarPrecedentes({
      tutela: { contenido_original },
      fusion,
      contexto: derecho_vulnerado,
    });

    await registrarImpresiones({
      usuario_uuid: req.user.id,
      tutela_id: req.params.id,
      categoria_contexto: derecho_vulnerado,
      resultados: sugerencias,
      fusion,
    });

    res.status(200).json(sugerencias);
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
    // Sin filtro de categoría (#106)
    const sugerencias = await recuperarPrecedentes({
      tutela: { contenido_original: rows[0].contenido_original },
    });

    await registrarImpresiones({
      usuario_uuid: req.user.id,
      tutela_id: id,
      categoria_contexto: rows[0].derecho_vulnerado,
      resultados: sugerencias,
    });

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
    const { util, tutela_id = null } = req.body; // true = útil, false = no útil

    if (typeof util !== 'boolean') {
      return res.status(400).json({ error: 'El campo "util" debe ser true o false.' });
    }

    const delta = util ? 1 : -1;

    // Actualiza todos los chunks del documento a la vez
    const { rowCount, rows: chunksActualizados } = await pool.query(
      `UPDATE base_conocimiento_enel
       SET relevancia_score = relevancia_score + $1
       WHERE documento_id = $2
       RETURNING categoria`,
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

    // Doble escritura (#165, fase c): además de relevancia_score (mecanismo
    // actual, que ECCP reemplazará), registra el evento en feedback_precedentes
    // -- es el dato que la fase de feromona (#161 fase d) va a leer. Un rastro
    // por agente/documento/caso: re-votar reemplaza, no suma (diseño §3.3).
    await pool.query(
      `INSERT INTO feedback_precedentes (usuario_uuid, documento_id, tutela_id, categoria_contexto, util)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_uuid, documento_id, tutela_id) WHERE tutela_id IS NOT NULL
       DO UPDATE SET util = EXCLUDED.util, categoria_contexto = EXCLUDED.categoria_contexto, created_at = now()`,
      [req.user.id, documento_id, tutela_id, chunksActualizados[0]?.categoria ?? null, util]
    );

    await registrarLog(req.user.id, util ? 'FEEDBACK_UTIL' : 'FEEDBACK_NO_UTIL', 'memoria', documento_id, req);
    res.json({ mensaje: 'Feedback registrado.', delta });

  } catch (error) {
    console.error('Error registrando feedback:', error);
    res.status(500).json({ error: 'Error al registrar feedback.' });
  }
};

// ECCP fase (g): solo admin puede marcar un precedente como jurídicamente
// superado (`checkPermission('admin', 'WRITE')` en la ruta -- ver
// docs/ANALISIS_ESTIGMERGIA_ECCP.md sección 3.7 decisión 3). Afecta a todos
// los chunks del documento, igual que el voto de feedback.
export const actualizarVigenciaMemoria = async (req, res) => {
  try {
    const { documento_id } = req.params;
    const { vigencia_factor, motivo } = req.body;

    const { rowCount } = await pool.query(
      `UPDATE base_conocimiento_enel
       SET vigencia_factor = $1,
           vigencia_actualizada_por = $2,
           vigencia_actualizada_en = now(),
           vigencia_motivo = $3
       WHERE documento_id = $4`,
      [vigencia_factor, req.user.id, motivo ?? null, documento_id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Documento no encontrado.' });

    await registrarLog(req.user.id, 'ACTUALIZAR_VIGENCIA_MEMORIA', 'memoria', documento_id, req, { vigencia_factor, motivo });
    res.json({ mensaje: 'Vigencia actualizada.', vigencia_factor });

  } catch (error) {
    console.error('Error actualizando vigencia:', error);
    res.status(500).json({ error: 'Error al actualizar la vigencia.' });
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
    // #140: antes no quedaba rastro diagnosticable de por qué falló -- si
    // un texto patológico (muy largo, con muchos párrafos) rompe
    // Packer.toBuffer, ahora el detalle queda en logs/error.log.
    logger.error('Error al generar Word en descargarWord', { error: error.message, tutelaId: req.params.id });
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
    const { documentoId, chunks } = await indexarDocumento({
      texto: textoCompleto,
      categoria,
      titulo: titulo_referencia,
      esExitosa: es_exitosa,
    });

    await registrarLog(req.user.id, 'ENTRENAR_MEMORIA', 'memoria', documentoId, req, { titulo_referencia, chunks });
    res.status(200).json({ mensaje: 'Conocimiento guardado', documento_id: documentoId, chunks });

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

        // #162 -- HTER, después de responder (no debe retrasar ni poder
        // romper el guardado del borrador si algo sale mal acá). Solo tiene
        // sentido si existen ítems del flujo estructurado contra los que
        // comparar -- si el abogado escribió desde cero, no hay hipótesis.
        try {
            const { rows: itemsRows } = await pool.query(
                `SELECT rpi.numero, rpi.solicitud, rpi.respuesta, rpi.normas_citadas
                 FROM respuesta_peticion_items rpi
                 JOIN respuestas_peticion rp ON rp.id = rpi.respuesta_id
                 WHERE rp.tutela_id = $1`,
                [id]
            );
            if (itemsRows.length > 0) {
                const hipotesis = itemsATexto(itemsRows);
                const medicion = calcularHter(hipotesis, contestacion_generada);
                if (medicion) {
                    await registrarLog(userId, 'TELEMETRIA_HTER', 'tutela', id, req, {
                        v: 1,
                        ...medicion,
                        n_items: itemsRows.length,
                    });
                }
            }
        } catch (errorHter) {
            logger.error('Error calculando HTER para telemetría (#162)', { tutelaId: id, error: errorHter.message });
        }
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

    // #108: mismo gate que actualizarDatosTutela — sin confirmar la
    // categoría, no se promueve (evita seguir ensuciando la taxonomía de
    // base_conocimiento_enel con categorías nunca revisadas por un abogado).
    if (req.body.categoria_confirmada !== true) {
      return res.status(400).json({
        error: 'Confirmá o corregí la categoría (derecho_vulnerado) de la tutela y reenviá con categoria_confirmada=true antes de promover este argumento.',
      });
    }

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

    // Comprension_doc: usa contexto de la tutela si disponible, complementa con el argumento
    const ac = analisis_comprension;
    const comprensionDoc = ac?.tema_central ? {
      que_resuelve:         `${titulo}: ${ac.tema_central}`,
      tipo_caso:            derecho_vulnerado || 'General',
      resultado:            'favorable',
      derechos_involucrados: ac.derechos_invocados || [],
    } : null;

    const client = await pool.connect();
    let documentoId, chunks;
    try {
      await client.query('BEGIN');
      ({ documentoId, chunks } = await indexarDocumento({
        texto: contenido,
        categoria: derecho_vulnerado || 'General',
        titulo: `${titulo} — Arg. promovido de tutela ${radicado}`,
        esExitosa: true,
        comprensionDoc,
        client,
      }));
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
    res.status(200).json({ mensaje: 'Argumento promovido a la memoria legal.', documento_id: documentoId, chunks });

  } catch (error) {
    console.error('Error promoviendo argumento:', error);
    res.status(500).json({ error: 'Error al promover el argumento.' });
  }
};

// Versión del esquema de `detalles` en los eventos TELEMETRIA_* (#146) --
// sin esto, un cambio futuro en la forma del JSON deja al análisis
// adivinando qué formato tiene cada fila vieja.
const TELEMETRIA_SCHEMA_VERSION = 1;

// Identifica la versión de la plantilla de prompt vigente (construirPromptLote
// + buildFichaPrecedente + buildSeccionEstrategia). Sin esto, cuando se
// comparen variantes de plantilla (docs/ANALISIS_GENERADOR_PROMPTS.md,
// sección D.1), ningún dato de telemetría registrado antes de agregar este
// campo se podrá atribuir a una plantilla -- se sube a mano en cada cambio
// de plantilla que se quiera distinguir en el análisis.
const PLANTILLA_VERSION = 'v1';

export const guardarRespuestaPeticion = async (req, res) => {
  const { id } = req.params;
  const { resultado_llm_json, modo = 'acumular', parte_index, limpieza } = req.body;

  // #47 (frontend): si el frontend ya manda el indicador de limpieza, se usa
  // tal cual. Si no (frontend sin actualizar), se asume que sí hubo
  // limpieza -- es el comportamiento conservador: toda lectura histórica de
  // esta métrica debe seguir declarando la limitación hasta que el
  // despliegue del frontend con el indicador esté completo.
  const limpiezaRegistrada = limpieza ?? { tenia_fences: null, texto_fuera_de_llaves: null, chars_descartados: null };

  let parsed;
  try {
    parsed = JSON.parse(resultado_llm_json);
  } catch {
    // Telemetría #146 -- tasa de fallo de formato (C.5 de
    // docs/ANALISIS_GENERADOR_PROMPTS.md). El frontend limpia el texto
    // (quita fences de markdown, recorta a lo que hay entre la primera y la
    // última llave) antes de mandarlo aquí -- esto mide la tasa de fallo
    // QUE SOBREVIVE a esa limpieza, no la adherencia real del LLM al
    // formato pedido. `limpieza` (#47) permite reconstruir cuánta limpieza
    // hizo falta en este caso puntual.
    await registrarLog(req.user.id, 'TELEMETRIA_FALLO_FORMATO', 'tutela', id, req, {
      v: TELEMETRIA_SCHEMA_VERSION,
      tipo: 'json_invalido',
      medido_tras_limpieza_frontend: true,
      limpieza: limpiezaRegistrada,
    });
    return res.status(400).json({ error: 'La respuesta del LLM no es un JSON válido.' });
  }

  const validation = respuestaLlmSchema.safeParse(parsed);
  if (!validation.success) {
    await registrarLog(req.user.id, 'TELEMETRIA_FALLO_FORMATO', 'tutela', id, req, {
      v: TELEMETRIA_SCHEMA_VERSION,
      tipo: 'zod_invalido',
      medido_tras_limpieza_frontend: true,
      limpieza: limpiezaRegistrada,
      // `code` en vez de `message`: el mensaje es texto libre que puede
      // incluir el valor recibido (contenido de la respuesta del LLM) y no
      // sirve para agregar.
      issues: validation.error.issues.map(i => ({ path: i.path.join('.'), code: i.code })),
    });
    return res.status(400).json({ error: 'Estructura del JSON inválida.', details: validation.error.issues });
  }

  const { encabezado, introduccion, respuestas, prescripcion, cierre } = validation.data;
  const client = await pool.connect();
  // Telemetría #146 -- se calcula DENTRO de la transacción pero se registra
  // DESPUÉS del COMMIT. `registrarLog` usa `pool.query` (otra conexión, no
  // la del `client` de esta transacción): registrar el evento antes de
  // confirmar dejaba "eventos fantasma" si el resto de la transacción
  // fallaba y hacía ROLLBACK después.
  let conflictoPrescripcion = null;
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      'SELECT id, prescripcion, partes_procesadas FROM respuestas_peticion WHERE tutela_id = $1', [id]
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

      // Telemetría #146 -- conflicto entre lotes sobre una decisión global
      // (C.2 de docs/ANALISIS_GENERADOR_PROMPTS.md): cada lote pide
      // `prescripcion` por separado y hoy se fusiona en silencio con
      // "si algún lote dice que aplica, gana". Solo se registra, no cambia
      // la fusión existente. Se distingue de un re-pegado del MISMO lote
      // (p. ej. el abogado corrige y vuelve a pegar la parte 2): eso no es
      // un conflicto entre lotes distintos, es una corrección.
      const prescripcionPrevia = existing[0].prescripcion;
      const partesPrevias = existing[0].partes_procesadas || [];
      const esRepegado = parte_index !== undefined && parte_index !== null && partesPrevias.includes(parte_index);
      if (prescripcionPrevia && prescripcion && prescripcionPrevia.aplica !== prescripcion.aplica) {
        conflictoPrescripcion = {
          v: TELEMETRIA_SCHEMA_VERSION,
          parte_index: parte_index ?? null,
          aplica_previo: prescripcionPrevia.aplica,
          aplica_nuevo: prescripcion.aplica,
          es_repegado: esRepegado,
        };
      }

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
      // Upsert real por (respuesta_id, numero) -- ver #145. Antes era
      // `ON CONFLICT DO NOTHING` sin restricción única detrás, así que no
      // comparaba contra nada y repegar un lote duplicaba los ítems en
      // silencio. Si el abogado vuelve a pegar la respuesta de un lote
      // (p. ej. tras corregir algo), el ítem se reemplaza, no se duplica.
      await client.query(
        `INSERT INTO respuesta_peticion_items (respuesta_id, numero, solicitud, respuesta, normas_citadas, parte)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (respuesta_id, numero) DO UPDATE SET
           solicitud      = EXCLUDED.solicitud,
           respuesta      = EXCLUDED.respuesta,
           normas_citadas = EXCLUDED.normas_citadas,
           parte          = EXCLUDED.parte`,
        [respuestaId, r.numero, r.solicitud, r.respuesta,
         r.normas_citadas?.length ? r.normas_citadas : [], parte_index ?? null]
      );
    }

    await client.query('COMMIT');
    await registrarLog(req.user.id, 'GUARDAR_RESPUESTA_PETICION', 'tutela', id, req, { parte_index, modo });

    if (conflictoPrescripcion) {
      await registrarLog(req.user.id, 'TELEMETRIA_CONFLICTO_PRESCRIPCION', 'tutela', id, req, conflictoPrescripcion);
    }

    // Telemetría #146 -- cobertura y citas (C.5 de
    // docs/ANALISIS_GENERADOR_PROMPTS.md). Se registran los `numero`
    // guardados (para cruzar luego contra TELEMETRIA_SEGMENTACION y
    // detectar huecos) y las normas citadas por ítem -- no existe todavía
    // un catálogo de normas contra el cual validarlas (ver limitación
    // declarada en el documento), así que por ahora solo se guardan para
    // análisis posterior, sin bloquear ni corregir nada. Por ítem y no
    // aplanadas: aplanadas se pierde qué respuesta concreta no citó nada.
    await registrarLog(req.user.id, 'TELEMETRIA_COBERTURA', 'tutela', id, req, {
      v: TELEMETRIA_SCHEMA_VERSION,
      parte_index: parte_index ?? null,
      items: respuestas.map(r => ({ numero: r.numero, normas_citadas: r.normas_citadas || [] })),
      // #47: también se registra en el caso exitoso -- permite comparar la
      // cantidad de limpieza en guardados que sí pasaron contra los que
      // fallaron (TELEMETRIA_FALLO_FORMATO), no solo ver estos últimos
      // aislados.
      limpieza: limpiezaRegistrada,
    });

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
    const sugerencias = await recuperarPrecedentes({ tutela }); // sin filtro de categoría (#106)

    await registrarImpresiones({
      usuario_uuid: req.user.id,
      tutela_id: id,
      categoria_contexto: tutela.derecho_vulnerado,
      resultados: sugerencias,
    });

    const contenidoOriginal = tutela.contenido_original || '';
    const solicitudes = extraerSolicitudes(contenidoOriginal);
    const lotes = agruparEnLotes(solicitudes, { tutela, legalNotes, sugerencias, argumentos, comprension });

    const prompts = lotes.map((lote, i) => ({
      parte: i + 1,
      total: lotes.length,
      solicitudes: lote.map(s => s.etiqueta),
      prompt: construirPromptLote({ lote, loteIndex: i, totalLotes: lotes.length, tutela, legalNotes, sugerencias, argumentos, comprension }),
    }));

    // Telemetría #146 -- solo medición, no cambia el resultado. Base para
    // decidir si se justifica un segmentador más robusto que el regex
    // (docs/ANALISIS_GENERADOR_PROMPTS.md, sección D.3: regla pre-registrada,
    // si el fallback es <5% no se justifica CRF). Se calcula aquí, justo
    // antes de responder, para no dejar un evento de una generación que
    // terminó fallando si `construirPromptLote` lanza una excepción arriba.
    //
    // Limitaciones declaradas (no resueltas por este evento, solo
    // documentadas para que el análisis no las ignore):
    // - `metodo: 'numerico'` es un ÉXITO DE FORMA, no de contenido: una
    //   petición con HECHOS numerados capturados como solicitudes (falta
    //   el anclaje de sección de la sección A.1 del documento) también
    //   cuenta aquí como "numerico". El fallback mide una cota inferior
    //   del fallo real de segmentación, no el fallo real.
    // - `comprension_truncada` importa para leer `discrepancia`: si el
    //   análisis de comprensión se hizo sobre un extracto truncado, una
    //   discrepancia de conteo puede venir del truncamiento, no del regex.
    // - Cada regeneración de prompts (el abogado puede pedirla de nuevo)
    //   escribe OTRO evento idéntico -- las tasas de este indicador se
    //   deben calcular por tutela distinta, no por evento.
    const generacionId = crypto.randomUUID();
    const nPeticionesComprension = comprension?.peticiones?.length ?? null;
    await registrarLog(req.user.id, 'TELEMETRIA_SEGMENTACION', 'tutela', id, req, {
      v: TELEMETRIA_SCHEMA_VERSION,
      generacion_id: generacionId,
      version_plantilla: PLANTILLA_VERSION,
      metodo: detectarMetodoSegmentacion(contenidoOriginal),
      n_solicitudes_regex: solicitudes.length,
      n_peticiones_comprension: nPeticionesComprension,
      discrepancia: nPeticionesComprension !== null && nPeticionesComprension !== solicitudes.length,
      longitud_texto: contenidoOriginal.length,
      comprension_truncada: contenidoOriginal.length > LIMITE_EXTRACTO_COMPRENSION,
      total_partes: lotes.length,
      lotes: lotes.map(lote => lote.map(s => s.numero)),
    });

    res.json({ prompts, total_solicitudes: solicitudes.length, total_partes: lotes.length, generacion_id: generacionId });
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
