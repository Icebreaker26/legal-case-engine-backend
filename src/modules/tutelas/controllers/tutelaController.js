import { extraerTextoPdf } from '../../../services/pdfService.js';
import { generarEmbeddingLocal } from '../../../services/aiService.js';
import { buscarContextoLegal } from '../../../services/vectorService.js';
import { generarDocumentoWord } from '../../../services/docxService.js';
import { dividirEnChunks } from '../../../services/chunkService.js';
import { extraerDatosTutela } from '../../../services/extractorService.js';
import { limpiarTexto } from '../../../services/cleanerService.js';
import { registrarLog } from '../../../services/auditService.js';
import pool from '../../../db/database.js';
import { ESTADOS, PRIORIDADES } from '../../../constants.js';
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
    const { radicado, accionante, sharepoint_link, derecho_vulnerado, grupo_id, responsable_uuid } = req.body;
    
    // Convertir cadena vacía a NULL para grupo_id (entero)
    const sanitizedGrupoId = (grupo_id === '' || grupo_id === undefined) ? null : parseInt(grupo_id);
    const sanitizedResponsableUuid = (responsable_uuid === '' || responsable_uuid === undefined) ? null : responsable_uuid;

    await pool.query(
      'UPDATE tutelas SET radicado = $1, accionante = $2, sharepoint_link = COALESCE($3, sharepoint_link), derecho_vulnerado = COALESCE($4, derecho_vulnerado), grupo_id = $5, responsable_uuid = $6 WHERE id = $7', 
      [radicado, accionante, sharepoint_link, derecho_vulnerado, sanitizedGrupoId, sanitizedResponsableUuid, id]
    );
    await registrarLog(req.user.id, 'ACTUALIZAR_DATOS_TUTELA', 'tutela', id, req, { radicado, accionante, sharepoint_link, derecho_vulnerado, grupo_id: sanitizedGrupoId, responsable_uuid: sanitizedResponsableUuid });
    
    res.status(200).json({ message: 'Datos actualizados correctamente.' });
  } catch (error) {
    console.error('Error al actualizar datos:', error);
    res.status(500).json({ error: 'Error al actualizar datos.' });
  }
};

export const procesarTutela = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Debes subir un archivo PDF.' });

    const { responsable_uuid, prioridad = PRIORIDADES.MEDIA, grupo_id, dias_termino = 2 } = req.body;
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
      INSERT INTO tutelas (radicado, accionante, juzgado, derecho_vulnerado, responsable_uuid, fecha_recepcion, fecha_vencimiento, prioridad, grupo_id, dias_termino, estado, contenido_original)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (radicado) DO UPDATE SET responsable_uuid = EXCLUDED.responsable_uuid, prioridad = EXCLUDED.prioridad, updated_at = NOW()
      RETURNING id;
    `;

    const values = [
      datosExtraidos.radicado !== 'POR DEFINIR' ? datosExtraidos.radicado : 'REF_' + Date.now(), 
      datosExtraidos.accionante, datosExtraidos.juzgado, datosExtraidos.derecho_vulnerado,
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
    console.log('DEBUG: Datos recibidos para actualizar tutela', id, req.body);
    
    const { responsable_uuid, estado, prioridad, resultado_fallo } = req.body;

    const { rows } = await pool.query('SELECT estado FROM tutelas WHERE id = $1', [id]);
    const estadoAnterior = rows[0]?.estado;

    const query = 'UPDATE tutelas SET responsable_uuid = COALESCE($1, responsable_uuid), estado = COALESCE($2, estado), prioridad = COALESCE($3, prioridad), resultado_fallo = COALESCE($4, resultado_fallo), updated_at = NOW() WHERE id = $5 RETURNING id;';
    
    console.log('DEBUG: Ejecutando query SQL:', query, 'con valores:', [responsable_uuid || null, estado, prioridad || null, resultado_fallo || null, id]);
    
    const { rowCount } = await pool.query(query, [responsable_uuid || null, estado, prioridad || null, resultado_fallo || null, id]);

    if (rowCount === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const desc = (estado && estado !== estadoAnterior) ? `Cambio de estado: ${estadoAnterior} -> ${estado}` : 'Actualización de gestión';
    const usuarioId = req.user ? req.user.id : null;
    
    // Ejecución segura de registrarLog
    await registrarLog(usuarioId, desc, 'tutela', id, req, { estado, prioridad }).catch(err => 
        console.error('ERROR en registrarLog (no bloqueante):', err)
    );
    
    console.log('DEBUG: Finalizando actualizarGestionTutela exitosamente');
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
             COALESCE(array_agg(gu.nombre) FILTER (WHERE gu.nombre IS NOT NULL), '{}') as responsables_nombres,
             COALESCE(array_agg(gu.id) FILTER (WHERE gu.id IS NOT NULL), '{}') as responsables_ids,
             g.nombre as grupo_nombre
      FROM tutelas t
      LEFT JOIN tutela_responsables tr ON t.id = tr.tutela_id
      LEFT JOIN global_usuarios gu ON tr.usuario_uuid = gu.id
      LEFT JOIN global_grupos g ON t.grupo_id = g.id
      WHERE t.is_active = TRUE
      GROUP BY t.id, g.nombre
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
    const { rows } = await pool.query('SELECT contenido_original FROM tutelas WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });
    
    const textoOriginal = rows[0].contenido_original || '';
    const vectorLocal = await generarEmbeddingLocal(textoOriginal.substring(0, 1500));
    res.status(200).json(await buscarContextoLegal(vectorLocal, textoOriginal));
  } catch (error) {
    res.status(500).json({ error: 'Error al generar sugerencias.' });
  }
};

export const generarBorradorContestacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT contenido_original, contestacion_generada FROM tutelas WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });

    const { contenido_original, contestacion_generada } = rows[0];

    // Si ya existe un borrador, lo devolvemos para no gastar API de OpenAI
    if (contestacion_generada) {
      return res.status(200).json({ 
        borrador_completo: contestacion_generada, 
        status: 'cached' 
      });
    }

    const textoOriginal = contenido_original || '';
    
    // 1. Obtener contexto legal (sugerencias)
    const vectorLocal = await generarEmbeddingLocal(textoOriginal.substring(0, 1500));
    const sugerencias = await buscarContextoLegal(vectorLocal, textoOriginal);

    // 2. Llamar al servicio de IA
    const { redactarContestacion } = await import('../services/aiService.js');
    const resultado = await redactarContestacion(textoOriginal, sugerencias);

    if (resultado.status === 'disabled') {
      return res.status(403).json({ error: resultado.borrador_completo });
    }

    // 3. Persistir el borrador generado
    await pool.query('UPDATE tutelas SET contestacion_generada = $1 WHERE id = $2', [resultado.borrador_completo, id]);

    await registrarLog(req.user.id, 'GENERAR_BORRADOR_IA', 'tutela', id, req);
    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error generando borrador:', error);
    res.status(500).json({ error: 'Error al generar borrador por IA.' });
  }
};

export const refinarBorrador = async (req, res) => {
  try {
    const { id } = req.params;
    const { instrucciones, borradorManual } = req.body;

    // Si el usuario solo quiere guardar su edición manual sin IA
    if (borradorManual && !instrucciones) {
      await pool.query('UPDATE tutelas SET contestacion_generada = $1 WHERE id = $2', [borradorManual, id]);
      return res.json({ message: 'Borrador guardado correctamente.', status: 'saved' });
    }

    // Si el usuario quiere refinamiento por IA
    const { rows } = await pool.query('SELECT contestacion_generada FROM tutelas WHERE id = $1', [id]);
    const borradorActual = borradorManual || rows[0]?.contestacion_generada;

    const { refinarContestacion } = await import('../services/aiService.js');
    const nuevoBorrador = await refinarContestacion(borradorActual, instrucciones);

    await pool.query('UPDATE tutelas SET contestacion_generada = $1 WHERE id = $2', [nuevoBorrador, id]);
    await registrarLog(req.user.id, 'REFINAR_BORRADOR_IA', 'tutela', id, req, { instrucciones });

    res.json({ borrador_completo: nuevoBorrador, status: 'refined' });

  } catch (error) {
    console.error('Error refinando borrador:', error);
    res.status(500).json({ error: 'Error al refinar el borrador.' });
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
    console.log('DEBUG: Solicitando historial para ID:', id);

    // Eliminamos la validación de regex estricta temporalmente para ver si el ID recibido es válido
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(id)) {
    //     return res.status(400).json({ error: 'Formato de ID de tutela no válido.' });
    // }

    const { rows } = await pool.query('SELECT * FROM historial_acciones WHERE tutela_id = $1 ORDER BY created_at DESC', [id]);
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
    console.log('DEBUG: Datos recibidos para agregar acción:', { id, accion, area_involucrada, responsable_uuid, fecha_seguimiento });
    
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

export const crearRequerimientoInterno = async (req, res) => {
  try {
    const { id } = req.params;
    const { grupo_id, descripcion } = req.body;
    console.log('DEBUG: Datos para crear requerimiento:', { id, grupo_id, descripcion });

    const { rows: tRows } = await pool.query('SELECT radicado, accionante FROM tutelas WHERE id = $1', [id]);
    if (tRows.length === 0) return res.status(404).json({ error: 'Tutela no encontrada.' });
    
    const { radicado, accionante } = tRows[0];
    const { rows: gRows } = await pool.query('SELECT nombre FROM global_grupos WHERE id = $1', [grupo_id]);
    const nombreGrupo = gRows.length > 0 ? gRows[0].nombre : 'Desconocido';

    const oficioGenerado = `
OFICIO DE REQUERIMIENTO INTERNO
FECHA: ${new Date().toLocaleDateString()}
PARA: Responsable Grupo ${nombreGrupo}
DE: Departamento Jurídico - Enel Grids

ASUNTO: Solicitud Urgente de Información - Tutela ${radicado}

Por medio de la presente, se requiere de su grupo la siguiente información técnica/documental necesaria para la defensa judicial de la compañía en el proceso de tutela instaurado por ${accionante}:

REQUERIMIENTO:
${descripcion}

Agradecemos enviar la respuesta a más tardar en las próximas 24 horas para cumplir con los términos judiciales.

Atentamente,
${req.user ? req.user.nombre : 'Sistema'}
Departamento Jurídico
    `.trim();

    console.log('DEBUG: Insertando requerimiento...');
    // Corrección: Usar grupo_id ahora que es FK
    const { rows } = await pool.query(
      'INSERT INTO requerimientos_internos (tutela_id, grupo_id, descripcion, oficio_generado) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, grupo_id, descripcion, oficioGenerado]
    );

    console.log('DEBUG: Requerimiento insertado:', rows[0].id);
    const usuarioId = req.user ? req.user.id : null;
    await registrarLog(usuarioId, 'CREAR_REQUERIMIENTO', 'tutela', id, req, { grupo_id }).catch(err => 
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

        await pool.query(
            'UPDATE requerimientos_internos SET estado = $1, fecha_respuesta = $2, respuesta_texto = COALESCE(respuesta_texto, \'\') || $3 WHERE id = $4',
            [estado, estado === 'Respondido' ? new Date() : null, respuesta_texto ? nuevaRespuestaFormateada : '', reqId]
        );

        if (estado === 'Respondido' && respuesta_texto) {
            await registrarLog(req.user.id, 'RECIBIR_RESPUESTA_REQUERIMIENTO', 'tutela', tutela_id, req, { nombreGrupo, respuesta_texto });
            
            // También asegurar registro explícito en historial_acciones
            await pool.query(
                'INSERT INTO historial_acciones (tutela_id, accion, responsable_nombre) VALUES ($1, $2, $3)',
                [tutela_id, `Respuesta recibida de ${nombreGrupo}: ${respuesta_texto.substring(0, 200)}`, req.user.nombre]
            );
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
