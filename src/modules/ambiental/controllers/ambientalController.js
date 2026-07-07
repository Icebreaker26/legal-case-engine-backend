import pool from '../../../db/database.js';
import { registrarLog } from '../../../services/auditService.js';
import { extractTextFromFile, generarPromptAmbiental, generarPromptRespuesta } from '../services/ambientalService.js';
import { analisisLlmSchema } from '../schemas/ambientalSchema.js';
import logger from '../../../utils/logger.js';

// POST /expedientes/procesar — extrae texto de archivo O genera prompt de un fragmento de texto
export const procesarDocumento = async (req, res) => {
  try {
    const { entidad_id, fecha_documento, texto } = req.body;

    let contenido_texto;
    if (req.file) {
      contenido_texto = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    } else if (texto) {
      contenido_texto = texto;
    } else {
      return res.status(400).json({ error: 'Se requiere un archivo o texto.' });
    }

    let entidadNombre;
    if (entidad_id) {
      const { rows } = await pool.query('SELECT nombre FROM global_entidades WHERE id = $1', [entidad_id]);
      entidadNombre = rows[0]?.nombre;
    }

    const prompt_generado = generarPromptAmbiental(contenido_texto, {
      entidadNombre,
      fechaBase: fecha_documento || null,
    });

    res.json({
      contenido_texto: req.file ? contenido_texto : undefined,
      prompt_generado,
      meta: {
        caracteres_seccion: contenido_texto.length,
        caracteres_totales: req.file ? contenido_texto.length : undefined,
      },
    });
  } catch (error) {
    logger.error('procesarDocumento error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

// POST /expedientes
export const crearExpediente = async (req, res) => {
  const { titulo, tipo_instrumento, numero_expediente, entidad_id, responsable_uuid, grupo_id, fecha_documento, contenido_texto, prompt_generado } = req.body;
  const creado_por = req.user.id;
  try {
    const { rows } = await pool.query(
      `INSERT INTO expedientes_ambientales
        (titulo, tipo_instrumento, numero_expediente, entidad_id, responsable_uuid, grupo_id, fecha_documento, contenido_texto, prompt_generado, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [titulo, tipo_instrumento, numero_expediente || null, entidad_id || null, responsable_uuid || null, grupo_id || null, fecha_documento || null, contenido_texto || null, prompt_generado || null, creado_por]
    );
    await registrarLog(creado_por, 'CREAR_EXPEDIENTE_AMBIENTAL', 'ambiental', rows[0].id, req);
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('crearExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al crear el expediente.' });
  }
};

// GET /expedientes
export const listarExpedientes = async (req, res) => {
  const { entidad_id, tipo_instrumento, nivel_riesgo, estado } = req.query;
  try {
    const conditions = ['e.is_active = true'];
    const params = [];
    let idx = 1;

    if (entidad_id)       { conditions.push(`e.entidad_id = $${idx++}`);       params.push(entidad_id); }
    if (tipo_instrumento) { conditions.push(`e.tipo_instrumento = $${idx++}`); params.push(tipo_instrumento); }
    if (estado)           { conditions.push(`e.estado = $${idx++}`);           params.push(estado); }
    if (nivel_riesgo)     { conditions.push(`a.nivel_riesgo = $${idx++}`);     params.push(nivel_riesgo); }

    const where = conditions.join(' AND ');
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (e.id) e.*, ent.nombre AS entidad_nombre, g.nombre AS grupo_nombre,
              p.nombre AS proyecto_nombre, u.nombre AS responsable_nombre,
              a.nivel_riesgo, a.id AS analisis_id
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN global_grupos g ON g.id = e.grupo_id
       LEFT JOIN global_proyectos p ON p.id = e.proyecto_id
       LEFT JOIN global_usuarios u ON u.id = e.responsable_uuid
       LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
       WHERE ${where}
       ORDER BY e.id, a.created_at DESC NULLS LAST, e.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    logger.error('listarExpedientes error', { error: error.message });
    res.status(500).json({ error: 'Error al listar expedientes.' });
  }
};

// GET /expedientes/:id
export const obtenerExpediente = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, ent.nombre AS entidad_nombre, g.nombre AS grupo_nombre,
              p.nombre AS proyecto_nombre, u.nombre AS responsable_nombre
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN global_grupos g ON g.id = e.grupo_id
       LEFT JOIN global_proyectos p ON p.id = e.proyecto_id
       LEFT JOIN global_usuarios u ON u.id = e.responsable_uuid
       WHERE e.id = $1 AND e.is_active = true`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('obtenerExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener el expediente.' });
  }
};

// PATCH /expedientes/:id
export const actualizarExpediente = async (req, res) => {
  const campos = [];
  const valores = [];
  let idx = 1;
  const permitidos = ['titulo', 'tipo_instrumento', 'numero_expediente', 'entidad_id', 'responsable_uuid', 'grupo_id', 'proyecto_id', 'fecha_documento', 'fecha_vencimiento', 'estado', 'contenido_texto', 'prompt_generado', 'argumentos_recurso', 'hallazgos_recurso_ids', 'recurso_llm_json', 'respuesta_entidad_texto', 'fecha_respuesta', 'respuesta_llm_json'];
  for (const campo of permitidos) {
    if (req.body[campo] !== undefined) {
      campos.push(`${campo}=$${idx++}`);
      valores.push(req.body[campo]);
    }
  }
  if (!campos.length) return res.status(400).json({ error: 'Se requiere al menos un campo.' });
  valores.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE expedientes_ambientales SET ${campos.join(', ')}, updated_at=NOW() WHERE id=$${idx} AND is_active=true RETURNING *`,
      valores
    );
    if (!rows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('actualizarExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar el expediente.' });
  }
};

// DELETE /expedientes/:id (lógico)
export const eliminarExpediente = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE expedientes_ambientales SET is_active=false, updated_at=NOW() WHERE id=$1 AND is_active=true RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    await registrarLog(req.user.id, 'ELIMINAR_EXPEDIENTE_AMBIENTAL', 'ambiental', req.params.id, req);
    res.json({ message: 'Expediente eliminado.' });
  } catch (error) {
    logger.error('eliminarExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar el expediente.' });
  }
};

// POST /expedientes/:id/analisis — recibe JSON del LLM, parsea y guarda relacional
export const guardarAnalisis = async (req, res) => {
  const { id } = req.params;
  const { resultado_llm_json, modo = 'reemplazar', seccion_index } = req.body;

  let parsed;
  try {
    parsed = JSON.parse(resultado_llm_json);
  } catch {
    return res.status(400).json({ error: 'La respuesta del LLM no es un JSON válido.' });
  }

  const validation = analisisLlmSchema.safeParse(parsed);
  if (!validation.success) {
    return res.status(400).json({ error: 'Estructura del JSON inválida.', details: validation.error.issues });
  }

  const { que_ordena, admite_recurso, plazo_respuesta, fecha_vencimiento, pagos = [], nivel_riesgo, resumen, hallazgos, normas_citadas } = validation.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let analisisId;

    if (modo === 'acumular') {
      // Buscar análisis existente
      const { rows: existentes } = await client.query(
        `SELECT id FROM analisis_ambiental WHERE expediente_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [id]
      );

      if (existentes.length > 0) {
        // Acumular sobre el análisis existente
        analisisId = existentes[0].id;

        // Calcular el próximo numero_hallazgo
        const { rows: [{ max_num }] } = await client.query(
          `SELECT COALESCE(MAX(numero_hallazgo), 0) AS max_num FROM hallazgos_ambientales WHERE analisis_id = $1`,
          [analisisId]
        );
        let offset = Number(max_num);

        for (const h of hallazgos) {
          await client.query(
            `INSERT INTO hallazgos_ambientales (analisis_id, numero_hallazgo, tipo, descripcion, norma_infringida, recomendacion, prioridad)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [analisisId, offset + h.numero, h.tipo, h.descripcion, h.norma_infringida || null, h.recomendacion || null, h.prioridad]
          );
        }

        for (const n of normas_citadas) {
          // Solo insertar normas que no existan ya (mismo instrumento + artículo)
          await client.query(
            `INSERT INTO normas_citadas_ambiental (analisis_id, instrumento, articulo, descripcion)
             SELECT $1::uuid, $2::text, $3::text, $4::text
             WHERE NOT EXISTS (
               SELECT 1 FROM normas_citadas_ambiental
               WHERE analisis_id=$1::uuid AND instrumento=$2::text AND COALESCE(articulo,'')=COALESCE($3::text,'')
             )`,
            [analisisId, n.instrumento, n.articulo || null, n.descripcion || null]
          );
        }

        // Actualizar resumen acumulando (append)
        await client.query(
          `UPDATE analisis_ambiental SET resumen = resumen || E'\n\n' || $1 WHERE id = $2`,
          [`[Sección adicional] ${resumen}`, analisisId]
        );

        // Agregar pagos nuevos (sin duplicar por valor)
        for (const p of pagos) {
          await client.query(
            `INSERT INTO pagos_ambientales (expediente_id, descripcion, valor, plazo, fecha_vencimiento, estado, nota)
             SELECT $1,$2,$3::text,$4,$5,$6,$7
             WHERE NOT EXISTS (
               SELECT 1 FROM pagos_ambientales WHERE expediente_id=$1 AND valor=$3::text
             )`,
            [id, p.descripcion || null, p.valor, p.plazo || null, p.fecha_vencimiento || null, p.estado || 'Pendiente', p.nota || null]
          );
        }

        // Registrar sección analizada en el expediente
        if (seccion_index !== undefined) {
          await client.query(
            `UPDATE expedientes_ambientales
             SET secciones_analizadas = array_append(
               array_remove(secciones_analizadas, $1::integer), $1::integer
             ), updated_at = NOW()
             WHERE id = $2`,
            [seccion_index, id]
          );
        }

      } else {
        // No hay análisis previo — comportamiento igual a reemplazar
        analisisId = null;
      }
    }

    if (modo === 'reemplazar' || !analisisId) {
      // Crear nuevo análisis (reemplaza el anterior vía CASCADE al borrar hallazgos)
      await client.query(`DELETE FROM analisis_ambiental WHERE expediente_id = $1`, [id]);

      const { rows: [analisis] } = await client.query(
        `INSERT INTO analisis_ambiental (expediente_id, nivel_riesgo, resumen, resultado_llm_raw, creado_por)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [id, nivel_riesgo, resumen, resultado_llm_json, req.user.id]
      );
      analisisId = analisis.id;

      for (const h of hallazgos) {
        await client.query(
          `INSERT INTO hallazgos_ambientales (analisis_id, numero_hallazgo, tipo, descripcion, norma_infringida, recomendacion, prioridad)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [analisisId, h.numero, h.tipo, h.descripcion, h.norma_infringida || null, h.recomendacion || null, h.prioridad]
        );
      }

      for (const n of normas_citadas) {
        await client.query(
          `INSERT INTO normas_citadas_ambiental (analisis_id, instrumento, articulo, descripcion)
           VALUES ($1,$2,$3,$4)`,
          [analisisId, n.instrumento, n.articulo || null, n.descripcion || null]
        );
      }

      // Borrar pagos anteriores e insertar los nuevos
      await client.query(`DELETE FROM pagos_ambientales WHERE expediente_id = $1`, [id]);
      for (const p of pagos) {
        await client.query(
          `INSERT INTO pagos_ambientales (expediente_id, descripcion, valor, plazo, fecha_vencimiento, estado, nota) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [id, p.descripcion || null, p.valor, p.plazo || null, p.fecha_vencimiento || null, p.estado || 'Pendiente', p.nota || null]
        );
      }

      const secIdx = seccion_index !== undefined && seccion_index !== null ? parseInt(seccion_index, 10) : NaN;
      const seccionesIniciales = Number.isInteger(secIdx) ? `ARRAY[${secIdx}]` : `'{}'`;
      await client.query(
        `UPDATE expedientes_ambientales
         SET estado='Analizado', que_ordena=$1, admite_recurso=$2, plazo_respuesta=$3,
             fecha_vencimiento=$5,
             secciones_analizadas = ${seccionesIniciales},
             updated_at=NOW()
         WHERE id=$4`,
        [que_ordena, admite_recurso, plazo_respuesta, id, fecha_vencimiento || null]
      );
    }

    await client.query('COMMIT');
    await registrarLog(req.user.id, `${modo === 'acumular' ? 'ACUMULAR' : 'GUARDAR'}_ANALISIS_AMBIENTAL`, 'ambiental', id, req);
    res.status(201).json({ analisis_id: analisisId, modo, message: modo === 'acumular' ? 'Hallazgos acumulados correctamente.' : 'Análisis guardado correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('guardarAnalisis error', { error: error.message, detail: error.detail, hint: error.hint, stack: error.stack });
    res.status(500).json({ error: 'Error al guardar el análisis.', detail: error.message });
  } finally {
    client.release();
  }
};

// PATCH /expedientes/:id/pagos/:pagoId — cambia el estado de un pago (Pendiente ↔ Pagado)
export const actualizarEstadoPago = async (req, res) => {
  const { id, pagoId } = req.params;
  const { estado } = req.body;
  if (!['Pendiente', 'Pagado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Usa Pendiente o Pagado.' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE pagos_ambientales SET estado=$1 WHERE id=$2 AND expediente_id=$3 RETURNING *`,
      [estado, pagoId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('actualizarEstadoPago error', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar el estado del pago.' });
  }
};

// PATCH /expedientes/:id/analisis/resumen — reemplaza el resumen con uno consolidado
export const consolidarResumen = async (req, res) => {
  const { id } = req.params;
  const { resumen } = req.body;
  if (!resumen || !resumen.trim()) return res.status(400).json({ error: 'El resumen consolidado es obligatorio.' });
  try {
    const { rows } = await pool.query(
      `UPDATE analisis_ambiental SET resumen = $1 WHERE expediente_id = $2 RETURNING id`,
      [resumen.trim(), id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Análisis no encontrado.' });
    res.json({ message: 'Resumen consolidado guardado.' });
  } catch (error) {
    logger.error('consolidarResumen error', { error: error.message });
    res.status(500).json({ error: 'Error al consolidar el resumen.' });
  }
};

// GET /expedientes/:id/analisis
export const obtenerAnalisis = async (req, res) => {
  try {
    const { rows: [analisis] } = await pool.query(
      `SELECT * FROM analisis_ambiental WHERE expediente_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (!analisis) return res.status(404).json({ error: 'Análisis no encontrado.' });

    const [{ rows: hallazgos }, { rows: normas }, { rows: pagos }] = await Promise.all([
      pool.query('SELECT * FROM hallazgos_ambientales WHERE analisis_id=$1 ORDER BY numero_hallazgo', [analisis.id]),
      pool.query('SELECT * FROM normas_citadas_ambiental WHERE analisis_id=$1', [analisis.id]),
      pool.query('SELECT * FROM pagos_ambientales WHERE expediente_id=$1 ORDER BY created_at', [req.params.id]),
    ]);

    res.json({ ...analisis, hallazgos, normas_citadas: normas, pagos });
  } catch (error) {
    logger.error('obtenerAnalisis error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener el análisis.' });
  }
};

// GET /expedientes/:id/informe — datos para que el frontend genere el PDF
export const obtenerDatosInforme = async (req, res) => {
  try {
    const { rows: [expediente] } = await pool.query(
      `SELECT e.*, ent.nombre AS entidad_nombre, g.nombre AS grupo_nombre
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN global_grupos g ON g.id = e.grupo_id
       WHERE e.id = $1 AND e.is_active = true`,
      [req.params.id]
    );
    if (!expediente) return res.status(404).json({ error: 'Expediente no encontrado.' });

    const { rows: [analisis] } = await pool.query(
      `SELECT * FROM analisis_ambiental WHERE expediente_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );

    let hallazgos = [], normas_citadas = [], pagos = [];
    if (analisis) {
      [{ rows: hallazgos }, { rows: normas_citadas }] = await Promise.all([
        pool.query('SELECT * FROM hallazgos_ambientales WHERE analisis_id=$1 ORDER BY numero_hallazgo', [analisis.id]),
        pool.query('SELECT * FROM normas_citadas_ambiental WHERE analisis_id=$1', [analisis.id]),
      ]);
    }
    ({ rows: pagos } = await pool.query(
      'SELECT * FROM pagos_ambientales WHERE expediente_id=$1 ORDER BY created_at',
      [req.params.id]
    ));

    res.json({ expediente, analisis: analisis || null, hallazgos, normas_citadas, pagos });
  } catch (error) {
    logger.error('obtenerDatosInforme error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener datos del informe.' });
  }
};

// GET /calendario — expedientes y pagos con fecha_vencimiento para el calendario
export const obtenerCalendario = async (req, res) => {
  try {
    const { rows: expedientes } = await pool.query(
      `SELECT DISTINCT ON (e.id) e.id, e.titulo, e.tipo_instrumento, e.numero_expediente,
              e.fecha_vencimiento, e.fecha_documento, e.estado, ent.nombre AS entidad_nombre,
              a.nivel_riesgo
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
       WHERE e.is_active = true
         AND (e.fecha_vencimiento IS NOT NULL OR e.fecha_documento IS NOT NULL)
         AND e.estado != 'Archivado'
       ORDER BY e.id, a.created_at DESC NULLS LAST`
    );

    const { rows: pagos } = await pool.query(
      `SELECT p.id, p.expediente_id, p.descripcion, p.valor, p.fecha_vencimiento, p.estado,
              e.titulo AS expediente_titulo, e.numero_expediente
       FROM pagos_ambientales p
       JOIN expedientes_ambientales e ON e.id = p.expediente_id
       WHERE e.is_active = true AND p.fecha_vencimiento IS NOT NULL AND p.estado = 'Pendiente'
       ORDER BY p.fecha_vencimiento`
    );

    res.json({ expedientes, pagos });
  } catch (error) {
    logger.error('obtenerCalendario error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener el calendario.' });
  }
};

// GET /dashboard
export const obtenerDashboard = async (req, res) => {
  try {
    const [
      { rows: [totales] },
      { rows: porRiesgo },
      { rows: porEstado },
      { rows: porTipo },
      { rows: vencimientosProximos },
      { rows: pagosResumen },
      { rows: porEntidad },
    ] = await Promise.all([

      // Totales generales
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE is_active)                          AS total,
          COUNT(*) FILTER (WHERE is_active AND estado = 'Pendiente') AS pendientes,
          COUNT(*) FILTER (WHERE is_active AND estado = 'Analizado') AS analizados,
          COUNT(*) FILTER (WHERE is_active AND estado = 'Revisado')  AS revisados,
          COUNT(*) FILTER (WHERE is_active AND fecha_vencimiento < CURRENT_DATE AND estado NOT IN ('Archivado')) AS vencidos
        FROM expedientes_ambientales
      `),

      // Distribución por nivel de riesgo
      pool.query(`
        SELECT a.nivel_riesgo, COUNT(*) AS cantidad
        FROM analisis_ambiental a
        JOIN expedientes_ambientales e ON e.id = a.expediente_id
        WHERE e.is_active = true
        GROUP BY a.nivel_riesgo
        ORDER BY CASE a.nivel_riesgo WHEN 'Crítico' THEN 1 WHEN 'Alto' THEN 2 WHEN 'Medio' THEN 3 ELSE 4 END
      `),

      // Distribución por estado
      pool.query(`
        SELECT estado, COUNT(*) AS cantidad
        FROM expedientes_ambientales
        WHERE is_active = true
        GROUP BY estado
        ORDER BY cantidad DESC
      `),

      // Distribución por tipo de instrumento
      pool.query(`
        SELECT tipo_instrumento, COUNT(*) AS cantidad
        FROM expedientes_ambientales
        WHERE is_active = true
        GROUP BY tipo_instrumento
        ORDER BY cantidad DESC
        LIMIT 6
      `),

      // Próximos a vencer (≤15 días)
      pool.query(`
        SELECT DISTINCT ON (e.id)
          e.id, e.titulo, e.numero_expediente, e.tipo_instrumento, e.fecha_vencimiento,
          ent.nombre AS entidad_nombre, a.nivel_riesgo,
          CEIL(EXTRACT(EPOCH FROM (e.fecha_vencimiento::timestamptz - NOW())) / 86400) AS dias_restantes
        FROM expedientes_ambientales e
        LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
        LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
        WHERE e.is_active = true
          AND e.estado NOT IN ('Archivado')
          AND e.fecha_vencimiento IS NOT NULL
          AND e.fecha_vencimiento >= CURRENT_DATE
          AND e.fecha_vencimiento <= CURRENT_DATE + INTERVAL '15 days'
        ORDER BY e.id, a.created_at DESC NULLS LAST, e.fecha_vencimiento
      `),

      // Resumen de pagos
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE p.estado = 'Pendiente')                                 AS pagos_pendientes,
          COUNT(*) FILTER (WHERE p.estado = 'Pagado')                                    AS pagos_realizados,
          COUNT(*) FILTER (WHERE p.estado = 'Pendiente' AND p.fecha_vencimiento < CURRENT_DATE) AS pagos_vencidos
        FROM pagos_ambientales p
        JOIN expedientes_ambientales e ON e.id = p.expediente_id
        WHERE e.is_active = true
      `),

      // Top entidades por expedientes
      pool.query(`
        SELECT ent.nombre, COUNT(*) AS cantidad
        FROM expedientes_ambientales e
        JOIN global_entidades ent ON ent.id = e.entidad_id
        WHERE e.is_active = true
        GROUP BY ent.nombre
        ORDER BY cantidad DESC
        LIMIT 5
      `),
    ]);

    res.json({
      totales,
      porRiesgo,
      porEstado,
      porTipo,
      vencimientosProximos,
      pagosResumen: pagosResumen[0],
      porEntidad,
    });
  } catch (error) {
    logger.error('obtenerDashboard error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener el dashboard.' });
  }
};

// POST /expedientes/:id/respuesta — extrae texto del archivo de respuesta y genera prompt LLM
export const procesarRespuestaEntidad = async (req, res) => {
  const { id } = req.params;
  const { fecha_respuesta, texto } = req.body;

  try {
    const { rows: expRows } = await pool.query(
      `SELECT e.titulo, e.que_ordena, ent.nombre AS entidad_nombre
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       WHERE e.id = $1 AND e.is_active = true
       LIMIT 1`,
      [id]
    );
    if (!expRows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    const exp = expRows[0];

    let respuesta_entidad_texto;
    if (req.file) {
      respuesta_entidad_texto = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    } else if (texto) {
      respuesta_entidad_texto = texto;
    } else {
      return res.status(400).json({ error: 'Se requiere un archivo o texto.' });
    }

    await pool.query(
      `UPDATE expedientes_ambientales SET respuesta_entidad_texto=$1, fecha_respuesta=$2, updated_at=NOW() WHERE id=$3`,
      [respuesta_entidad_texto, fecha_respuesta || null, id]
    );

    const prompt = generarPromptRespuesta(respuesta_entidad_texto, {
      entidadNombre: exp.entidad_nombre,
      tituloExpediente: exp.titulo,
      queOrdena: exp.que_ordena,
    });

    await registrarLog(req.user.id, 'REGISTRAR_RESPUESTA_AMBIENTAL', 'ambiental', id, req);

    res.json({
      respuesta_entidad_texto,
      prompt_respuesta: prompt,
      meta: { caracteres: respuesta_entidad_texto.length },
    });
  } catch (error) {
    logger.error('procesarRespuestaEntidad error', { error: error.message });
    res.status(500).json({ error: 'Error al procesar la respuesta.' });
  }
};
