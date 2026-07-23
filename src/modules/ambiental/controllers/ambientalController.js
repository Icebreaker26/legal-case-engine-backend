import pool from '../../../db/database.js';
import { registrarLog } from '../../../services/auditService.js';
import { extractTextFromFile, generarPromptsAmbientales, generarPromptRespuesta, hashBuffer, hashTexto } from '../services/ambientalService.js';
import { guardarEmbedding, buscarSimilares } from '../services/ambientalEmbeddingService.js';
import * as bibliotecaService from '../services/ambientalBibliotecaService.js';
import { analisisLlmSchema } from '../schemas/ambientalSchema.js';
import logger from '../../../utils/logger.js';

// POST /expedientes/procesar — extrae texto de archivo O genera prompt de un fragmento de texto
export const procesarDocumento = async (req, res) => {
  try {
    const { entidad_id, fecha_documento, texto } = req.body;

    let contenido_texto;
    let file_hash_val;
    if (req.file) {
      contenido_texto = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      file_hash_val   = hashBuffer(req.file.buffer);
    } else if (texto) {
      contenido_texto = texto;
    } else {
      return res.status(400).json({ error: 'Se requiere un archivo o texto.' });
    }

    const contenido_hash_val = contenido_texto ? hashTexto(contenido_texto) : undefined;

    // Buscar duplicados por hash de archivo o de contenido
    let duplicado = null;
    if (file_hash_val || contenido_hash_val) {
      const conditions = [];
      const params     = [];
      if (file_hash_val)     { conditions.push(`file_hash = $${params.push(file_hash_val)}`);         }
      if (contenido_hash_val){ conditions.push(`contenido_hash = $${params.push(contenido_hash_val)}`); }
      const { rows: dups } = await pool.query(
        `SELECT id, titulo, tipo_instrumento, numero_expediente FROM expedientes_ambientales
         WHERE is_active = true AND (${conditions.join(' OR ')})
         LIMIT 1`,
        params
      );
      if (dups.length) duplicado = dups[0];
    }

    let entidadNombre;
    if (entidad_id) {
      const { rows } = await pool.query('SELECT nombre FROM global_entidades WHERE id = $1', [entidad_id]);
      entidadNombre = rows[0]?.nombre;
    }

    const prompts = generarPromptsAmbientales(contenido_texto, {
      entidadNombre,
      fechaBase: fecha_documento || null,
    });

    // Si es una sola parte, prompt_generado es el texto directo.
    // Si son varias partes, se serializa como JSON array para que el frontend lo detecte.
    const prompt_generado = prompts.length === 1
      ? prompts[0].prompt
      : JSON.stringify(prompts);

    res.json({
      contenido_texto:  req.file ? contenido_texto : undefined,
      prompt_generado,
      total_partes:     prompts.length,
      file_hash:        file_hash_val        || undefined,
      contenido_hash:   contenido_hash_val   || undefined,
      duplicado:        duplicado             || undefined,
    });
  } catch (error) {
    logger.error('procesarDocumento error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

// POST /expedientes
export const crearExpediente = async (req, res) => {
  const { titulo, tipo_instrumento, numero_expediente, entidad_id, responsable_uuid, grupo_id, fecha_documento, contenido_texto, prompt_generado, file_hash, contenido_hash } = req.body;
  const creado_por = req.user.id;
  try {
    const { rows } = await pool.query(
      `INSERT INTO expedientes_ambientales
        (titulo, tipo_instrumento, numero_expediente, entidad_id, responsable_uuid, grupo_id, fecha_documento, contenido_texto, prompt_generado, file_hash, contenido_hash, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [titulo, tipo_instrumento, numero_expediente || null, entidad_id || null, responsable_uuid || null, grupo_id || null, fecha_documento || null, contenido_texto || null, prompt_generado || null, file_hash || null, contenido_hash || null, creado_por]
    );
    await registrarLog(creado_por, 'CREAR_EXPEDIENTE_AMBIENTAL', 'ambiental', rows[0].id, req);
    if (contenido_texto) {
      setImmediate(() => guardarEmbedding(rows[0].id, contenido_texto, 'contenido'));
    }
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
              a.nivel_riesgo, a.id AS analisis_id, a.resumen AS resumen_analisis
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
  const permitidos = ['titulo', 'tipo_instrumento', 'numero_expediente', 'entidad_id', 'responsable_uuid', 'grupo_id', 'proyecto_id', 'fecha_documento', 'fecha_vencimiento', 'estado', 'contenido_texto', 'prompt_generado', 'argumentos_recurso', 'hallazgos_recurso_ids', 'recurso_llm_json', 'enlace_pdf'];
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

        // Actualizar campos del expediente con datos de esta sección (solo si mejoran lo existente)
        await client.query(
          `UPDATE expedientes_ambientales SET
             fecha_vencimiento = COALESCE(fecha_vencimiento, $1),
             plazo_respuesta   = COALESCE(NULLIF(plazo_respuesta,''), $2),
             que_ordena        = COALESCE(NULLIF(que_ordena,''), $3),
             admite_recurso    = CASE
               WHEN admite_recurso IS NULL OR admite_recurso = 'Depende'
                 THEN COALESCE($4, admite_recurso)
               ELSE admite_recurso
             END,
             updated_at = NOW()
           WHERE id = $5`,
          [
            fecha_vencimiento || null,
            plazo_respuesta   || null,
            que_ordena        || null,
            (admite_recurso && admite_recurso !== 'Depende') ? admite_recurso : null,
            id,
          ]
        );

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
    if (resumen) {
      const textoEmb = [resumen, que_ordena].filter(Boolean).join(' ');
      setImmediate(() => guardarEmbedding(id, textoEmb, 'analisis'));
    }
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

// DELETE /expedientes/:id/pagos/:pagoId — borrado lógico
export const desactivarPago = async (req, res) => {
  const { id, pagoId } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE pagos_ambientales SET is_active=false WHERE id=$1 AND expediente_id=$2 RETURNING *`,
      [pagoId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado.' });
    res.json({ ok: true });
  } catch (error) {
    logger.error('desactivarPago error', { error: error.message });
    res.status(500).json({ error: 'Error al desactivar el pago.' });
  }
};

// GET /expedientes/:id/pagos/inactivos — lista pagos desactivados
export const listarPagosInactivos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM pagos_ambientales WHERE expediente_id=$1 AND is_active=false ORDER BY created_at`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    logger.error('listarPagosInactivos error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener pagos inactivos.' });
  }
};

// PATCH /expedientes/:id/pagos/:pagoId/reactivar — restaura un pago
export const reactivarPago = async (req, res) => {
  const { id, pagoId } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE pagos_ambientales SET is_active=true WHERE id=$1 AND expediente_id=$2 RETURNING *`,
      [pagoId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('reactivarPago error', { error: error.message });
    res.status(500).json({ error: 'Error al reactivar el pago.' });
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
      pool.query('SELECT * FROM pagos_ambientales WHERE expediente_id=$1 AND is_active=true ORDER BY created_at', [req.params.id]),
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
      'SELECT * FROM pagos_ambientales WHERE expediente_id=$1 AND is_active=true ORDER BY created_at',
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

// ── Comunicaciones del expediente ─────────────────────────────────────────────

// GET /expedientes/:id/comunicaciones
export const listarComunicaciones = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.direccion, c.asunto, c.fecha, c.descripcion,
              c.texto_extraido, c.nombre_archivo, c.enlace,
              c.resultado_llm, c.prompt_generado, c.created_at,
              u.nombre AS creado_por_nombre
         FROM comunicaciones_expediente c
         LEFT JOIN global_usuarios u ON u.id = c.creado_por
        WHERE c.expediente_id = $1 AND c.is_active = true
        ORDER BY c.fecha ASC, c.created_at ASC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    logger.error('listarComunicaciones error', { error: error.message });
    res.status(500).json({ error: 'Error al listar comunicaciones.' });
  }
};

// POST /expedientes/:id/comunicaciones
export const crearComunicacion = async (req, res) => {
  const { id } = req.params;
  const { direccion, asunto, fecha, descripcion, enlace } = req.body;

  if (!['entrante', 'saliente'].includes(direccion))
    return res.status(400).json({ error: 'dirección debe ser entrante o saliente.' });
  if (!asunto?.trim()) return res.status(400).json({ error: 'El asunto es obligatorio.' });
  if (!fecha) return res.status(400).json({ error: 'La fecha es obligatoria.' });

  try {
    let texto_extraido = null;
    let nombre_archivo = null;

    if (req.file) {
      texto_extraido = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      nombre_archivo = req.file.originalname;
    }

    const enlaceVal = enlace?.trim() || null;

    const { rows } = await pool.query(
      `INSERT INTO comunicaciones_expediente
         (expediente_id, direccion, asunto, fecha, descripcion, texto_extraido, nombre_archivo, enlace, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, direccion, asunto, fecha, descripcion, texto_extraido, nombre_archivo, enlace, created_at`,
      [id, direccion, asunto.trim(), fecha, descripcion?.trim() || null,
       texto_extraido, nombre_archivo, enlaceVal, req.user.id]
    );

    await registrarLog(req.user.id, 'CREAR_COMUNICACION', 'ambiental', id, req, { asunto, direccion });
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('crearComunicacion error', { error: error.message });
    res.status(500).json({ error: 'Error al guardar la comunicación.' });
  }
};

// DELETE /expedientes/:id/comunicaciones/:cId
export const eliminarComunicacion = async (req, res) => {
  const { id, cId } = req.params;
  try {
    const { rowCount } = await pool.query(
      `UPDATE comunicaciones_expediente SET is_active = false
        WHERE id = $1 AND expediente_id = $2`,
      [cId, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Comunicación no encontrada.' });
    await registrarLog(req.user.id, 'ELIMINAR_COMUNICACION', 'ambiental', id, req, { cId });
    res.json({ mensaje: 'Comunicación eliminada.' });
  } catch (error) {
    logger.error('eliminarComunicacion error', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar la comunicación.' });
  }
};

// GET /expedientes/:id/comunicaciones/inactivas
export const listarComunicacionesInactivas = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.direccion, c.asunto, c.fecha, c.descripcion, c.nombre_archivo, c.created_at,
              u.nombre AS creado_por_nombre
         FROM comunicaciones_expediente c
         LEFT JOIN global_usuarios u ON u.id = c.creado_por
        WHERE c.expediente_id = $1 AND c.is_active = false
        ORDER BY c.fecha ASC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    logger.error('listarComunicacionesInactivas error', { error: error.message });
    res.status(500).json({ error: 'Error al listar comunicaciones eliminadas.' });
  }
};

// PATCH /expedientes/:id/comunicaciones/:cId/enlace
export const actualizarEnlaceComunicacion = async (req, res) => {
  const { id, cId } = req.params;
  const { enlace } = req.body;
  const enlaceVal = enlace?.trim() || null;
  try {
    const { rowCount } = await pool.query(
      `UPDATE comunicaciones_expediente SET enlace = $1
        WHERE id = $2 AND expediente_id = $3 AND is_active = true`,
      [enlaceVal, cId, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Comunicación no encontrada.' });
    res.json({ enlace: enlaceVal });
  } catch (error) {
    logger.error('actualizarEnlaceComunicacion error', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar el enlace.' });
  }
};

// PATCH /expedientes/:id/comunicaciones/:cId/reactivar
export const reactivarComunicacion = async (req, res) => {
  const { id, cId } = req.params;
  try {
    const { rowCount } = await pool.query(
      `UPDATE comunicaciones_expediente SET is_active = true
        WHERE id = $1 AND expediente_id = $2`,
      [cId, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Comunicación no encontrada.' });
    await registrarLog(req.user.id, 'REACTIVAR_COMUNICACION', 'ambiental', id, req, { cId });
    res.json({ mensaje: 'Comunicación restaurada.' });
  } catch (error) {
    logger.error('reactivarComunicacion error', { error: error.message });
    res.status(500).json({ error: 'Error al restaurar la comunicación.' });
  }
};

// POST /expedientes/:id/comunicaciones/:cId/prompt-analisis
export const generarPromptAnalisisComunicacion = async (req, res) => {
  const { id, cId } = req.params;
  try {
    const { rows: [com] } = await pool.query(
      `SELECT c.texto_extraido, c.asunto, c.direccion,
              e.titulo, e.que_ordena, ent.nombre AS entidad_nombre
         FROM comunicaciones_expediente c
         JOIN expedientes_ambientales e ON e.id = c.expediente_id
         LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
        WHERE c.id = $1 AND c.expediente_id = $2 AND c.is_active = true`,
      [cId, id]
    );
    if (!com) return res.status(404).json({ error: 'Comunicación no encontrada.' });
    if (!com.texto_extraido) return res.status(422).json({ error: 'Esta comunicación no tiene texto extraído para analizar.' });

    const prompt = generarPromptRespuesta(com.texto_extraido, {
      entidadNombre: com.entidad_nombre,
      tituloExpediente: com.titulo,
      queOrdena: com.que_ordena,
    });

    await pool.query(
      `UPDATE comunicaciones_expediente SET prompt_generado = $1 WHERE id = $2`,
      [prompt, cId]
    );

    res.json({ prompt });
  } catch (error) {
    logger.error('generarPromptAnalisisComunicacion error', { error: error.message });
    res.status(500).json({ error: 'Error al generar el prompt.' });
  }
};

// PATCH /expedientes/:id/comunicaciones/:cId/resultado-llm
export const guardarResultadoLlmComunicacion = async (req, res) => {
  const { id, cId } = req.params;
  const { resultado_llm } = req.body;
  if (!resultado_llm?.trim()) return res.status(400).json({ error: 'El resultado es obligatorio.' });
  try {
    const { rowCount } = await pool.query(
      `UPDATE comunicaciones_expediente SET resultado_llm = $1
        WHERE id = $2 AND expediente_id = $3 AND is_active = true`,
      [resultado_llm, cId, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Comunicación no encontrada.' });
    res.json({ ok: true });
  } catch (error) {
    logger.error('guardarResultadoLlmComunicacion error', { error: error.message });
    res.status(500).json({ error: 'Error al guardar el resultado.' });
  }
};

// POST /expedientes/:id/prompt-comparativo
export const generarPromptComparativo = async (req, res) => {
  const { id } = req.params;
  const { precedentes_ids = [] } = req.body;
  if (!precedentes_ids.length) return res.status(400).json({ error: 'Se requieren al menos un precedente.' });
  try {
    const { rows: [exp] } = await pool.query(
      `SELECT e.*, ent.nombre AS entidad_nombre FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       WHERE e.id = $1 AND e.is_active = true`,
      [id]
    );
    if (!exp) return res.status(404).json({ error: 'Expediente no encontrado.' });

    const { rows: [analisis] } = await pool.query(
      `SELECT nivel_riesgo, resumen FROM analisis_ambiental WHERE expediente_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );
    const { rows: hallazgos } = await pool.query(
      `SELECT h.tipo, h.descripcion, h.prioridad, h.norma_infringida
       FROM hallazgos_ambientales h
       JOIN analisis_ambiental a ON a.id = h.analisis_id
       WHERE a.expediente_id = $1 ORDER BY h.numero_hallazgo`,
      [id]
    );

    const { rows: precedentes } = await pool.query(
      `SELECT e.id, e.titulo, e.numero_expediente, e.tipo_instrumento, e.estado,
              ent.nombre AS entidad_nombre, a.nivel_riesgo, a.resumen,
              ROUND(CAST((1 - (ea.embedding <=> (SELECT embedding FROM embeddings_ambiental WHERE expediente_id = $2))) AS NUMERIC), 4) AS similitud
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
       LEFT JOIN embeddings_ambiental ea ON ea.expediente_id = e.id
       WHERE e.id = ANY($1::uuid[]) AND e.is_active = true`,
      [precedentes_ids, id]
    );

    const { buildPromptComparativo } = await import('../services/ambientalService.js');
    const prompt = buildPromptComparativo(exp, analisis, hallazgos, precedentes);
    res.json({ prompt });
  } catch (error) {
    logger.error('generarPromptComparativo error', { error: error.message });
    res.status(500).json({ error: 'Error al generar el prompt comparativo.' });
  }
};

// POST /expedientes/:id/generar-embedding
export const generarEmbeddingExpediente = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: [exp] } = await pool.query(
      `SELECT e.contenido_texto, a.resumen, a.nivel_riesgo, e.que_ordena, e.tipo_instrumento
       FROM expedientes_ambientales e
       LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
       WHERE e.id = $1 AND e.is_active = true
       ORDER BY a.created_at DESC LIMIT 1`,
      [id]
    );
    if (!exp) return res.status(404).json({ error: 'Expediente no encontrado.' });

    let texto, fuente;
    if (exp.resumen) {
      texto = [exp.resumen, exp.que_ordena].filter(Boolean).join(' ');
      fuente = 'analisis';
    } else if (exp.contenido_texto) {
      texto = exp.contenido_texto.slice(0, 1500);
      fuente = 'contenido';
    } else {
      return res.status(422).json({ error: 'El expediente no tiene texto ni análisis para generar el embedding.' });
    }

    await guardarEmbedding(id, texto, fuente);
    res.json({ ok: true, fuente });
  } catch (error) {
    logger.error('generarEmbeddingExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al generar el embedding.' });
  }
};

// GET /expedientes/:id/similares
export const obtenerSimilares = async (req, res) => {
  const { id } = req.params;
  const limite = Math.min(parseInt(req.query.limite) || 5, 10);
  try {
    const similares = await buscarSimilares(id, limite);
    if (similares === null) return res.status(404).json({ error: 'Este expediente aún no tiene embedding generado.' });
    res.json(similares);
  } catch (error) {
    logger.error('obtenerSimilares error', { error: error.message });
    res.status(500).json({ error: 'Error al buscar precedentes.' });
  }
};

// ── Biblioteca de Conocimiento ────────────────────────────────────────────────

export const obtenerBibliotecaEstadisticas = async (req, res, next) => {
  try {
    const data = await bibliotecaService.obtenerEstadisticas();
    res.json(data);
  } catch (err) { next(err); }
};

export const obtenerBibliotecaClusters = async (req, res, next) => {
  try {
    const data = await bibliotecaService.obtenerClusters();
    res.json(data);
  } catch (err) { next(err); }
};

export const recalcularBibliotecaClusters = async (req, res, next) => {
  try {
    const result = await bibliotecaService.recalcularClusters();
    res.json(result);
  } catch (err) { next(err); }
};

export const listarTerminosIgnorados = async (req, res, next) => {
  try {
    const data = await bibliotecaService.listarTerminosIgnorados();
    res.json(data);
  } catch (err) { next(err); }
};

export const ignorarTermino = async (req, res, next) => {
  try {
    const { word } = req.body;
    if (!word?.trim()) return res.status(400).json({ error: 'El campo word es obligatorio.' });
    await bibliotecaService.ignorarTermino(word, req.user.id);
    res.status(201).json({ word: word.toLowerCase().trim() });
  } catch (err) { next(err); }
};

export const restaurarTermino = async (req, res, next) => {
  try {
    await bibliotecaService.restaurarTermino(req.params.word);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

export const obtenerBibliotecaProyeccion = async (req, res, next) => {
  try {
    const data = await bibliotecaService.obtenerProyeccion();
    res.json(data);
  } catch (err) { next(err); }
};

export const obtenerNormasRecurrentes = async (req, res, next) => {
  try {
    const { tipo_instrumento } = req.query;
    const data = await bibliotecaService.obtenerNormasRecurrentes({ tipo_instrumento });
    res.json(data);
  } catch (err) { next(err); }
};
